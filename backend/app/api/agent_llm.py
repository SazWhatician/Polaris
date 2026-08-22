from __future__ import annotations

import json
import logging
import re
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user_id
from app.services.llm.router import create_default_llm_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent-llm", tags=["Agent LLM Proxy"])


class AgentTodoItem(BaseModel):
    title: str
    priority: str = Field(default="medium", description="high, medium, or low")
    category: str = Field(default="Revision", description="Syllabus, Revision, RAG Research, Exam Prep, Assignment, or General")
    dueDate: Optional[str] = Field(default="Today")


class AgentExistingTodo(BaseModel):
    id: str
    title: str
    completed: bool = False
    priority: Optional[str] = "medium"
    category: Optional[str] = "General"
    dueDate: Optional[str] = None


class AgentDOMStep(BaseModel):
    actionType: str = Field(description="navigate, click, input, wait, scroll, or custom")
    description: str = Field(description="Human readable step description")
    targetRoute: Optional[str] = None
    domSelector: Optional[str] = None
    inputValue: Optional[str] = None
    targetIndex: Optional[int] = None
    cursorTargetLabel: Optional[str] = None


class AgentLLMRequest(BaseModel):
    prompt: str = Field(description="The natural language prompt from the user")
    current_page: Optional[str] = Field(default="/dashboard", description="The current active page route")
    dom_targets: Optional[List[str]] = Field(default_factory=list, description="List of [data-agent-target] attributes currently mounted on page")
    dom_summary: Optional[str] = Field(default="", description="Indexed summary of visible interactive DOM elements on active page")
    existing_todos: Optional[List[AgentExistingTodo]] = Field(default_factory=list, description="Current student todos mounted in drawer")
    temperature: float = Field(default=0.1, ge=0.0, le=1.0)


class AgentLLMResponse(BaseModel):
    thought: Optional[str] = Field(default=None, description="Chain-of-thought cognitive reasoning of the agent")
    text: str
    intent: str = Field(default="general_qa", description="todo_action, todo_create, rag_chat, dom_actuate, navigate, global_action, general_qa")
    recommended_route: str = "/chat"
    action_title: str = "Execute Autonomous Plan"
    todos: List[AgentTodoItem] = Field(default_factory=list)
    todos_to_add: List[AgentTodoItem] = Field(default_factory=list)
    todos_to_delete: List[str] = Field(default_factory=list)
    todos_to_complete: List[str] = Field(default_factory=list)
    clear_completed_todos: bool = Field(default=False)
    steps: List[AgentDOMStep] = Field(default_factory=list)
    provider: str = "multi-router"


def extract_json_object(raw_text: str) -> dict[str, Any]:
    """Robustly extracts the first JSON object from an LLM response string."""
    cleaned = raw_text.strip()
    if "<think>" in cleaned:
        if "</think>" in cleaned:
            cleaned = cleaned.split("</think>", 1)[1].strip()
        else:
            parts = cleaned.split("<think>")
            cleaned = parts[-1].strip()

    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()

    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        candidate = cleaned[start_idx : end_idx + 1]
        try:
            return json.loads(candidate)
        except Exception:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(cleaned[start_idx:])
            if isinstance(obj, dict):
                return obj
    return json.loads(cleaned)


def build_fallback_plan(
    query: str,
    current_page: str,
    existing_todos: Optional[List[AgentExistingTodo]] = None,
) -> AgentLLMResponse:
    """Intelligent zero-hardcode fallback when remote LLM provider is temporarily unreachable."""
    q = query.lower().strip()
    steps: List[AgentDOMStep] = []
    intent = "dom_actuate"
    recommended_route = "/chat"
    action_title = "Execute Autonomous Plan"
    text = f"PolarAssist will execute: {query}"
    thought = f"Interpreting intent for '{query}' on active page '{current_page}'."
    todos_to_add: List[AgentTodoItem] = []
    todos_to_delete: List[str] = []
    todos_to_complete: List[str] = []
    clear_completed = False

    is_delete = any(k in q for k in ["delete", "remove", "clear", "trash", "erase", "drop"])
    is_complete = any(k in q for k in ["complete", "check off", "finish", "done", "mark done"])
    is_add_task = any(k in q for k in ["add task", "new task", "create task", "add todo", "new todo", "create todo", "schedule task"]) or (
        ("task" in q or "todo" in q) and any(k in q for k in ["add", "create", "new", "schedule"])
    )

    if is_delete:
        intent = "todo_action"
        if "completed" in q:
            clear_completed = True
            action_title = "Clear Completed Tasks"
            text = "Cleared all completed tasks from your Academic Tasks drawer."
            thought = "User requested clearing completed tasks from drawer."
        elif "all" in q or "everything" in q:
            todos_to_delete = ["all"]
            action_title = "Clear All Tasks"
            text = "Cleared all tasks from your Academic Tasks drawer."
            thought = "User requested wiping all tasks."
        else:
            # Extract target name
            target = query
            for word in ["delete", "remove", "clear", "trash", "erase", "task", "the", "todo", "item", "please", "my", "a"]:
                target = re.sub(rf"\b{word}\b", "", target, flags=re.IGNORECASE)
            target = target.strip()
            todos_to_delete = [target if target else "last"]
            action_title = f"Delete Task: {target.title() if target else 'Recent'}"
            text = f"Removed task from your Academic Tasks drawer."
            thought = f"Targeting task '{target or 'last'}' for deletion."

        steps.append(AgentDOMStep(
            actionType="click",
            domSelector="[data-agent-target='tasks-btn']",
            description="Open Tasks Drawer to show updated tasks",
            cursorTargetLabel="Open Tasks"
        ))

    elif is_complete:
        intent = "todo_action"
        target = query
        for word in ["complete", "check", "off", "finish", "done", "mark", "task", "the", "todo", "item", "please", "my", "a"]:
            target = re.sub(rf"\b{word}\b", "", target, flags=re.IGNORECASE)
        target = target.strip()
        todos_to_complete = [target if target else "last"]
        action_title = "Completed Task"
        text = "Marked task completed in your Academic Tasks drawer."
        thought = f"Marking task '{target or 'last'}' as completed."
        steps.append(AgentDOMStep(
            actionType="click",
            domSelector="[data-agent-target='tasks-btn']",
            description="Open Tasks Drawer to view completed status",
            cursorTargetLabel="Open Tasks"
        ))

    elif is_add_task:
        intent = "todo_action"
        task_title = query
        for word in ["open", "tasks", "task", "and", "add", "a", "revision", "for", "to-do", "todo", "create", "new", "schedule", "my", "please"]:
            task_title = re.sub(rf"\b{word}\b", "", task_title, flags=re.IGNORECASE)
        clean_title = task_title.strip().title() or "Academic Revision Goal"
        todos_to_add.append(AgentTodoItem(title=clean_title, priority="high", category="Revision", dueDate="Today"))
        steps.append(AgentDOMStep(
            actionType="click",
            domSelector="[data-agent-target='tasks-btn']",
            description="Open Tasks Drawer to view created task",
            cursorTargetLabel="Open Tasks"
        ))
        action_title = f"Created Task: {clean_title}"
        text = f"Added '{clean_title}' to your tasks drawer."
        thought = f"Created new high-priority academic task '{clean_title}'."

    elif "menu" in q and ("chat" in q or "rag" in q):
        if "syllabus" in q:
            steps.append(AgentDOMStep(actionType="navigate", targetRoute="/syllabus", description="Navigate to Syllabus Intelligence", cursorTargetLabel="Syllabus"))
        steps.append(AgentDOMStep(actionType="click", domSelector="[data-agent-target='nav-menu-btn']", description="Open Navigation Sidebar", cursorTargetLabel="Open Menu"))
        steps.append(AgentDOMStep(actionType="click", domSelector="[data-agent-target='nav-item-chat']", targetRoute="/chat", description="Click Grounded RAG Chat link in drawer", cursorTargetLabel="RAG Chat"))
        recommended_route = "/chat"
        action_title = "Open Menu & Launch RAG Chat"
        text = "Navigated, opened sidebar menu with virtual cursor, and launched Grounded RAG Chat."
        thought = "Executing compound navigation to menu and Grounded RAG Chat."

    elif any(k in q for k in ["syllabus", "course", "curriculum"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/syllabus", description="Navigate to Syllabus Intelligence", cursorTargetLabel="Syllabus"))
        recommended_route = "/syllabus"
    elif any(k in q for k in ["gap", "youtube", "video", "weakness"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/gaps", description="Navigate to Gap Analysis & YouTube", cursorTargetLabel="Gaps"))
        recommended_route = "/gaps"
    elif any(k in q for k in ["twin", "simulation", "readiness"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/twin", description="Navigate to Academic Digital Twin", cursorTargetLabel="Twin"))
        recommended_route = "/twin"
    elif any(k in q for k in ["plan", "timetable", "revision"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/plan", description="Navigate to Revision Plan", cursorTargetLabel="Plan"))
        recommended_route = "/plan"
    elif any(k in q for k in ["graph", "concept", "knowledge graph"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/graph", description="Navigate to Knowledge Graph", cursorTargetLabel="Graph"))
        recommended_route = "/graph"
    elif any(k in q for k in ["career", "pathfinder", "jobs"]):
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/pathfinder", description="Navigate to Career Pathfinder", cursorTargetLabel="Pathfinder"))
        recommended_route = "/pathfinder"
    else:
        steps.append(AgentDOMStep(actionType="navigate", targetRoute="/chat", description="Navigate to Grounded RAG Chat", cursorTargetLabel="RAG Chat"))
        recommended_route = "/chat"

    return AgentLLMResponse(
        thought=thought,
        text=text,
        intent=intent,
        recommended_route=recommended_route,
        action_title=action_title,
        todos=todos_to_add,
        todos_to_add=todos_to_add,
        todos_to_delete=todos_to_delete,
        todos_to_complete=todos_to_complete,
        clear_completed_todos=clear_completed,
        steps=steps,
        provider="heuristic-fallback",
    )


@router.post("/plan", response_model=AgentLLMResponse)
async def proxy_llm_plan(
    req: AgentLLMRequest,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    """Dynamic Cognitive LLM planner for PolarAssist PageAgent.
    Uses multi-provider LLM routing (Groq / Gemini) to dynamically understand user intent,
    observe live page DOM context, mutate to-do state, and synthesize multi-step virtual cursor DOM actions.
    """
    user_query = req.prompt.strip()
    current_page = req.current_page or "/dashboard"
    dom_summary_str = req.dom_summary.strip() if req.dom_summary else "No indexed elements available."

    existing_todos_formatted = []
    if req.existing_todos:
        for t in req.existing_todos:
            status_tag = "DONE" if t.completed else "PENDING"
            existing_todos_formatted.append(
                f"- [ID: {t.id}] [{status_tag}] \"{t.title}\" (Priority: {t.priority or 'medium'}, Category: {t.category or 'General'}, Due: {t.dueDate or 'None'})"
            )
    existing_todos_str = "\n".join(existing_todos_formatted) if existing_todos_formatted else "None (drawer is empty)"

    schema_example = {
        "thought": "Multi-sentence chain-of-thought reasoning. Phase 1 (Perception): what I observe. Phase 2 (Intent): what the user actually wants. Phase 3 (Plan): what state changes and DOM actions to perform. Phase 4 (Verification): sanity-check my plan against the environment.",
        "text": "Concise, helpful response message for the student confirming what was done",
        "intent": "todo_action | dom_actuate | navigate | rag_chat | general_qa | global_action",
        "recommended_route": "/chat | /syllabus | /gaps | /plan | /twin | /pathfinder | /graph | /dashboard",
        "action_title": "Short human title for the action taken",
        "todos_to_add": [
            {
                "title": "Specific actionable study task",
                "priority": "high | medium | low",
                "category": "Syllabus | Revision | RAG Research | Exam Prep | Assignment | General",
                "dueDate": "Today | Tomorrow | This Week"
            }
        ],
        "todos_to_delete": ["exact task title or 'last' or 'all'"],
        "todos_to_complete": ["exact task title or 'last' or 'all'"],
        "clear_completed_todos": False,
        "steps": [
            {
                "actionType": "navigate | click | input | wait | scroll",
                "description": "Human-readable action description",
                "targetRoute": "/route (if navigating)",
                "domSelector": "[data-agent-target='...'] or CSS selector",
                "inputValue": "text to type (if input action)",
                "cursorTargetLabel": "short badge for the virtual cursor"
            }
        ]
    }

    # Count environment signals for the LLM
    todo_count = len(req.existing_todos or [])
    pending_count = sum(1 for t in (req.existing_todos or []) if not t.completed)
    done_count = todo_count - pending_count

    system_prompt = f"""You are PolarAssist — an autonomous cognitive DOM Operating System Agent embedded inside Polaris, a university-grade AI learning platform. You have a physical virtual cursor that glides across the screen, clicks buttons, types into inputs, opens drawers, and navigates between pages. Students watch you work in real time.

═══════════════════════════════════════════
 LIVE ENVIRONMENT SNAPSHOT
═══════════════════════════════════════════
Active page route: "{current_page}"
Student task drawer: {todo_count} tasks ({pending_count} pending, {done_count} completed)
{existing_todos_str}

Mounted interactive DOM elements:
{dom_summary_str}

System agent-target selectors (always available):
  nav-menu-btn          → hamburger menu toggle (top-left)
  tasks-btn             → academic tasks drawer (top-right)
  copilot-header-btn    → copilot HUD toggle (top-right)
  nav-item-dashboard    → /dashboard   (Course Ingestion)
  nav-item-syllabus     → /syllabus    (Syllabus Intelligence)
  nav-item-chat         → /chat        (Grounded RAG Chat)
  nav-item-gaps         → /gaps        (Knowledge Gap Analysis + YouTube)
  nav-item-graph        → /graph       (Course Knowledge Graph)
  nav-item-twin         → /twin        (Academic Digital Twin)
  nav-item-pathfinder   → /pathfinder  (Career Pathfinder)
  nav-item-plan         → /plan        (Revision Timetable)
  nav-item-resources    → /resources   (Video Resources)
  chat-input            → RAG chat text input (on /chat page)
  chat-send-btn         → RAG chat send button (on /chat page)

═══════════════════════════════════════════
 STUDENT COMMAND
═══════════════════════════════════════════
"{user_query}"

═══════════════════════════════════════════
 COGNITIVE REASONING PROTOCOL
═══════════════════════════════════════════
You MUST think through FOUR phases before acting. Write your full reasoning into the "thought" field.

### Phase 1 — PERCEPTION (observe the environment)
- What page is the student currently on?
- What interactive elements are visible right now?
- What tasks already exist in their drawer? Are any completed?
- Is there anything relevant in the DOM state that affects the plan?

### Phase 2 — INTENT CLASSIFICATION (understand what the student really wants)
- Parse the natural language. Look past the surface words.
- "delete task" does NOT mean "create a task called delete". It means REMOVE a task.
- "mark quantum done" means COMPLETE the task containing "quantum", not add a new one.
- "ask about neural networks" means navigate to /chat, type the question, and send it.
- Distinguish clearly between: ADD vs DELETE vs COMPLETE vs NAVIGATE vs COMPOUND.
- If ambiguous, choose the most likely interpretation and explain why in your reasoning.

### Phase 3 — PLAN FORMULATION (decide state mutations + DOM actions)
State mutations (task drawer):
- To ADD a task: put the task object in `todos_to_add`. Leave `todos_to_delete` and `todos_to_complete` as empty arrays `[]`.
- To DELETE a task: identify the EXACT title from the current task list. Put it in `todos_to_delete`. Leave `todos_to_add` as `[]`. If no specific task name given, use `"last"`. If they want all removed, use `"all"`.
- To COMPLETE a task: identify the EXACT title. Put it in `todos_to_complete`. Leave `todos_to_add` as `[]`.
- NEVER put items in both `todos_to_add` and `todos_to_delete` simultaneously.
- To clear completed tasks: set `clear_completed_todos` to true.

DOM action steps (virtual cursor sequence):
- IN-PAGE ACTION AWARENESS:
  * If the active route is ALREADY "/chat" and the student asks a question or wants to query the chat: DO NOT navigate or open the sidebar menu! Directly input into `[data-agent-target='chat-input']` and click `[data-agent-target='chat-send-btn']`.
  * If the active route is NOT "/chat" and the student asks a question: first navigate to /chat, then type into `[data-agent-target='chat-input']`, then click `[data-agent-target='chat-send-btn']`.
- For navigation: use actionType "navigate" with targetRoute.
- For clicking UI elements: use actionType "click" with domSelector using the [data-agent-target='...'] format.
- For typing: use actionType "input" with domSelector and inputValue.
- For drawer interactions: if you open the sidebar nav, the drawer links (nav-item-*) appear AFTER clicking nav-menu-btn. Sequence matters.
- For task state changes: always include a step to click [data-agent-target='tasks-btn'] so the student sees the drawer open and reflect the change.
- When the student wants to navigate using the sidebar: first click nav-menu-btn, THEN click the specific nav-item-* link.

### Phase 4 — SELF-VERIFICATION (sanity check before responding)
- Does my plan match the student's actual intent?
- Am I accidentally adding a task when they asked to delete?
- Am I accidentally deleting when they asked to add?
- Are my DOM selectors valid and present in the environment?
- Is my step order correct? (e.g., open menu BEFORE clicking a menu item)
- If a task name I'm targeting doesn't exist, note that in my response.

═══════════════════════════════════════════
 OUTPUT
═══════════════════════════════════════════
Return ONLY a single valid raw JSON object (no markdown fences, no commentary) matching:
{json.dumps(schema_example, indent=2)}

The "thought" field is your full chain-of-thought reasoning across all 4 phases. Be specific — reference actual task titles, page routes, and DOM selectors by name. The student sees this reasoning live in the Copilot Scratchpad, so write it as clear internal monologue, not generic filler."""


    try:
        llm_router = create_default_llm_router(task="chat")
        raw_completion = await llm_router.complete(
            prompt=system_prompt,
            temperature=req.temperature,
            max_tokens=4096,
        )

        parsed_data = extract_json_object(raw_completion)

        todos_to_add_raw = parsed_data.get("todos_to_add", [])
        if not todos_to_add_raw and "todos" in parsed_data:
            todos_to_add_raw = parsed_data.get("todos", [])

        todos_to_delete = parsed_data.get("todos_to_delete", [])
        todos_to_complete = parsed_data.get("todos_to_complete", [])
        is_delete_action = bool(todos_to_delete) or any(k in user_query.lower() for k in ["delete", "remove", "trash", "erase", "clear"])
        is_complete_action = bool(todos_to_complete) or any(k in user_query.lower() for k in ["complete", "check off", "finish", "done"])

        if is_delete_action or is_complete_action:
            todos_to_add_raw = []

        todos_to_add = [
            AgentTodoItem(
                title=item.get("title", "Study Task") if isinstance(item, dict) else str(item),
                priority=item.get("priority", "medium") if isinstance(item, dict) else "medium",
                category=item.get("category", "Revision") if isinstance(item, dict) else "Revision",
                dueDate=item.get("dueDate", "Today") if isinstance(item, dict) else "Today",
            )
            for item in todos_to_add_raw
            if item
        ]

        steps_raw = parsed_data.get("steps", [])
        steps = [
            AgentDOMStep(
                actionType=s.get("actionType", "click"),
                description=s.get("description", "Execute DOM action"),
                targetRoute=s.get("targetRoute"),
                domSelector=s.get("domSelector"),
                inputValue=s.get("inputValue"),
                targetIndex=s.get("targetIndex"),
                cursorTargetLabel=s.get("cursorTargetLabel")
            )
            for s in steps_raw
            if s
        ]

        return AgentLLMResponse(
            thought=parsed_data.get("thought"),
            text=parsed_data.get("text", "Autonomous DOM plan synthesized."),
            intent=parsed_data.get("intent", "todo_action" if (todos_to_delete or todos_to_add or todos_to_complete) else "dom_actuate"),
            recommended_route=parsed_data.get("recommended_route", "/chat"),
            action_title=parsed_data.get("action_title", "Execute Autonomous Action"),
            todos=todos_to_add,
            todos_to_add=todos_to_add,
            todos_to_delete=todos_to_delete,
            todos_to_complete=todos_to_complete,
            clear_completed_todos=bool(parsed_data.get("clear_completed_todos", False)),
            steps=steps,
            provider="multi-router",
        )
    except Exception as e:
        logger.error("Dynamic Agent LLM proxy error for user %s: %s", user_id, e)
        return build_fallback_plan(user_query, current_page, req.existing_todos)
