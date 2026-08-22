import pytest
from app.api.agent_llm import build_fallback_plan, AgentLLMRequest, extract_json_object

def test_extract_json_object_with_markdown():
    raw_markdown = """```json
    {
      "text": "Navigating to syllabus and opening chat.",
      "intent": "dom_actuate",
      "steps": [
        {"actionType": "navigate", "targetRoute": "/syllabus", "description": "Go to syllabus"},
        {"actionType": "click", "domSelector": "[data-agent-target='nav-menu-btn']", "description": "Open menu"},
        {"actionType": "click", "domSelector": "[data-agent-target='nav-item-chat']", "targetRoute": "/chat", "description": "Open chat"}
      ]
    }
    ```"""
    data = extract_json_object(raw_markdown)
    assert data["intent"] == "dom_actuate"
    assert len(data["steps"]) == 3
    assert data["steps"][0]["targetRoute"] == "/syllabus"

def test_extract_json_object_with_thinking_tags():
    raw_with_think = "<think>Analyzing user request...</think>{\"text\":\"Plan ready\",\"intent\":\"global_action\",\"steps\":[]}"
    data = extract_json_object(raw_with_think)
    assert data["text"] == "Plan ready"
    assert data["intent"] == "global_action"

def test_build_fallback_plan_compound_navigation():
    plan = build_fallback_plan("navigate to syllabus and open menu and open rag chat", "/dashboard")
    assert plan.intent == "dom_actuate"
    assert len(plan.steps) >= 3
    assert plan.steps[0].targetRoute == "/syllabus"
    assert plan.steps[1].domSelector == "[data-agent-target='nav-menu-btn']"
    assert plan.steps[2].domSelector == "[data-agent-target='nav-item-chat']"

def test_build_fallback_plan_add_tasks():
    plan = build_fallback_plan("open tasks and add a revision task for Neural Networks", "/dashboard")
    assert plan.intent == "todo_action"
    assert len(plan.todos_to_add) > 0
    assert "Neural Networks" in plan.todos_to_add[0].title
    assert len(plan.todos_to_delete) == 0

def test_build_fallback_plan_delete_task():
    plan = build_fallback_plan("delete task", "/dashboard")
    assert plan.intent == "todo_action"
    assert len(plan.todos_to_add) == 0
    assert len(plan.todos_to_delete) == 1
    assert plan.todos_to_delete[0] == "last"

def test_build_fallback_plan_delete_named_task():
    plan = build_fallback_plan("delete task Quantum Mechanics", "/dashboard")
    assert plan.intent == "todo_action"
    assert len(plan.todos_to_add) == 0
    assert len(plan.todos_to_delete) == 1
    assert "Quantum" in plan.todos_to_delete[0]
