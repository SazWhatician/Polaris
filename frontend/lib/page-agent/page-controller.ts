/**
 * PageController - Autonomous In-Page DOM Actuator & Orchestrator
 * Adapted from @page-agent/page-controller & PolarAssist
 *
 * Coordinates live DOM crawling, LLM planning context, on-screen Virtual Cursor
 * simulation, synthetic event dispatching, and cross-route navigation.
 */

import {
  type InteractiveElementNode,
  scanPageInteractiveElements,
  formatDomForLLM,
} from "./dom-tree";
import { virtualCursor } from "./virtual-cursor";
import { openTodoDrawer, openSideDrawer, openCopilotModal } from "@/lib/todo-store";

export interface ActionResult {
  success: boolean;
  message: string;
  targetElement?: HTMLElement;
}

export interface DOMActionStep {
  description: string;
  targetRoute?: string;
  domSelector?: string;
  targetIndex?: number;
  actionType: "navigate" | "click" | "input" | "scroll" | "wait" | "custom";
  inputValue?: string;
  cursorTargetLabel?: string;
}

export class PageController {
  private lastElements: InteractiveElementNode[] = [];

  /**
   * Scans and returns the current interactive elements on the active page.
   */
  public scan(): InteractiveElementNode[] {
    this.lastElements = scanPageInteractiveElements();
    return this.lastElements;
  }

  /**
   * Returns formatted DOM summary string for LLM planning context.
   */
  public getDomPromptContext(): string {
    const elements = this.scan();
    return formatDomForLLM(elements);
  }

  /**
   * Resolves an HTMLElement by index number, CSS selector, data-agent-target, or direct reference.
   */
  public resolveElement(target: number | string | HTMLElement): HTMLElement | null {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }

    if (target instanceof HTMLElement) {
      return target;
    }

    if (typeof target === "number") {
      const elements = this.lastElements.length > 0 ? this.lastElements : this.scan();
      const match = elements.find((e) => e.index === target);
      return match?.element || null;
    }

    if (typeof target === "string") {
      const clean = target.trim();

      // 1. Direct data-agent-target check
      const cleanTargetName = clean.replace(/^\[data-agent-target=['"]?/, "").replace(/['"]?\]$/, "");
      const byTarget =
        document.querySelector<HTMLElement>(`[data-agent-target="${cleanTargetName}"]`) ||
        document.querySelector<HTMLElement>(`[data-agent-target="${clean}"]`);
      if (byTarget) return byTarget;

      // 2. Direct CSS selector check
      try {
        const bySelector = document.querySelector<HTMLElement>(clean);
        if (bySelector) return bySelector;
      } catch {
        // Invalid selector syntax, fall through to heuristics
      }

      // 3. Check by ID
      const byId = document.getElementById(clean);
      if (byId) return byId;

      // 4. Fuzzy text/label search across interactive elements
      const elements = this.scan();
      const targetLower = clean.toLowerCase();

      // Exact match first
      const exactMatch = elements.find(
        (e) =>
          e.dataAgentTarget?.toLowerCase() === targetLower ||
          e.text.toLowerCase() === targetLower ||
          e.ariaLabel?.toLowerCase() === targetLower
      );
      if (exactMatch) return exactMatch.element;

      // Partial inclusion match
      const partialMatch = elements.find(
        (e) =>
          (e.dataAgentTarget && e.dataAgentTarget.toLowerCase().includes(targetLower)) ||
          e.text.toLowerCase().includes(targetLower) ||
          (e.ariaLabel && e.ariaLabel.toLowerCase().includes(targetLower)) ||
          (e.placeholder && e.placeholder.toLowerCase().includes(targetLower))
      );
      if (partialMatch) return partialMatch.element;
    }

    return null;
  }

  /**
   * Resiliently polls for an element to appear in DOM within timeout period (useful for animated drawers/modals).
   */
  public async waitForElement(
    target: number | string | HTMLElement,
    timeoutMs = 1200
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const el = this.resolveElement(target);
      if (el && el.isConnected) {
        return el;
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    return this.resolveElement(target);
  }

  /**
   * Moves virtual cursor on screen, highlights element, and executes click.
   */
  public async clickElementWithCursor(
    target: number | string | HTMLElement,
    options?: { label?: string; speedMultiplier?: number }
  ): Promise<ActionResult> {
    const element = await this.waitForElement(target, 1200);
    if (!element) {
      return {
        success: false,
        message: `Target element not found in DOM: "${target}"`,
      };
    }

    // 1. Move virtual cursor on screen to element
    const desc =
      options?.label ||
      element.getAttribute("data-agent-target") ||
      element.innerText?.slice(0, 24) ||
      element.tagName.toLowerCase();

    await virtualCursor.moveToElement(element, { label: `Click: ${desc}` });

    // 2. Perform realistic click animation & dispatch events
    await virtualCursor.click(element);
    virtualCursor.clearHighlight();

    return {
      success: true,
      message: `Clicked <${element.tagName.toLowerCase()}> "${desc}"`,
      targetElement: element,
    };
  }

  /**
   * Moves virtual cursor to input element, focuses, and simulates typing text.
   */
  public async inputTextWithCursor(
    target: number | string | HTMLElement,
    text: string,
    options?: { label?: string; speedMultiplier?: number }
  ): Promise<ActionResult> {
    const element = await this.waitForElement(target, 1200);
    if (!element) {
      return {
        success: false,
        message: `Input target element not found: "${target}"`,
      };
    }

    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return {
        success: false,
        message: `Target is <${element.tagName.toLowerCase()}>, not an input/textarea.`,
      };
    }

    // 1. Move cursor to input box
    await virtualCursor.moveToElement(element, { label: `Type into input` });

    // 2. Type text with simulated keystrokes
    const charSpeed = options?.speedMultiplier ? Math.max(10, 35 / options.speedMultiplier) : 35;
    await virtualCursor.typeText(element, text, charSpeed);
    virtualCursor.clearHighlight();

    return {
      success: true,
      message: `Typed "${text}" into input`,
      targetElement: element,
    };
  }

  /**
   * Scrolls page smoothly with cursor indication.
   */
  public async scrollPage(direction: "up" | "down", pixels = 400): Promise<ActionResult> {
    if (typeof window === "undefined") {
      return { success: false, message: "Window unavailable" };
    }

    const y = direction === "down" ? pixels : -pixels;
    virtualCursor.setBadge(`Scrolling ${direction}...`);
    window.scrollBy({ top: y, behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 450));
    virtualCursor.setBadge(null);

    return {
      success: true,
      message: `Scrolled page ${direction} by ${pixels}px`,
    };
  }

  /**
   * Dispatches global UI actions (Navigation Drawer, Tasks Drawer, Copilot) with visual cursor click.
   */
  public async dispatchGlobalActionWithCursor(actionName: string): Promise<ActionResult> {
    const act = actionName.toLowerCase().replace(/[^a-z_]/g, "");

    switch (act) {
      case "open_todo":
      case "open_tasks":
      case "open_task":
      case "show_tasks": {
        const tasksBtn = document.querySelector<HTMLElement>('[data-agent-target="tasks-btn"]');
        if (tasksBtn) {
          await this.clickElementWithCursor(tasksBtn, { label: "Open Tasks Drawer" });
        } else {
          openTodoDrawer();
        }
        return { success: true, message: "Opened Academic Tasks Drawer" };
      }

      case "open_menu":
      case "open_nav":
      case "open_sidebar":
      case "show_menu": {
        const menuBtn = document.querySelector<HTMLElement>('[data-agent-target="nav-menu-btn"]');
        if (menuBtn) {
          await this.clickElementWithCursor(menuBtn, { label: "Open Navigation Menu" });
        } else {
          openSideDrawer();
        }
        return { success: true, message: "Opened Navigation Sidebar" };
      }

      case "open_copilot": {
        openCopilotModal();
        return { success: true, message: "Opened Copilot HUD" };
      }

      default:
        return { success: false, message: `Unknown global action: ${actionName}` };
    }
  }

  /**
   * Hides the virtual cursor and clears active DOM highlights.
   */
  public dismissCursor(): void {
    virtualCursor.hide();
  }
}

export const pageController = new PageController();
