/**
 * DOM Tree Crawler and Interactive Element Indexer
 * Adapted from @page-agent/page-controller & PolarAssist
 *
 * Scans the active browser DOM to extract visible, interactive elements
 * (buttons, inputs, links, selects, textareas, role="button", and data-agent-target elements).
 */

export interface InteractiveElementNode {
  index: number;
  tagName: string;
  role: string;
  text: string;
  placeholder?: string;
  ariaLabel?: string;
  selector: string;
  dataAgentTarget?: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  element: HTMLElement;
}

/**
 * Checks if an element is visible and interactive on screen
 */
function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;

  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    style.pointerEvents === "none"
  ) {
    return false;
  }

  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) {
    return false;
  }

  return true;
}

/**
 * Generates a resilient CSS selector for an element
 */
function generateSelector(el: HTMLElement): string {
  const agentTarget = el.getAttribute("data-agent-target");
  if (agentTarget) {
    return `[data-agent-target="${agentTarget}"]`;
  }

  if (el.id && !el.id.match(/^[0-9]/) && !el.id.includes(":")) {
    return `#${el.id}`;
  }

  const testId = el.getAttribute("data-testid") || el.getAttribute("data-test");
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  const name = el.getAttribute("name");
  if (name && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) {
    return `${el.tagName.toLowerCase()}[name="${name}"]`;
  }

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) {
    return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel.replace(/"/g, '\\"')}"]`;
  }

  const placeholder = el.getAttribute("placeholder");
  if (placeholder) {
    return `${el.tagName.toLowerCase()}[placeholder="${placeholder.replace(/"/g, '\\"')}"]`;
  }

  // Tag + class fallback
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList)
    .filter((c) => !c.includes(":") && !c.includes("[") && !c.startsWith("polaris-agent-"))
    .slice(0, 2);

  if (classes.length > 0) {
    return `${tag}.${classes.join(".")}`;
  }

  return tag;
}

/**
 * Extracts visible label/text representation of an element
 */
function getElementText(el: HTMLElement): string {
  const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("title");
  if (ariaLabel) return ariaLabel.trim();

  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return `[Placeholder: ${placeholder.trim()}]`;

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.value) return `[Value: ${el.value.trim()}]`;
  }

  const text = el.innerText || el.textContent || "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 80 ? cleaned.substring(0, 77) + "..." : cleaned;
}

/**
 * Scans the current page document and returns all visible interactive elements with indexed references.
 */
export function scanPageInteractiveElements(): InteractiveElementNode[] {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return [];
  }

  const interactiveQuery = [
    "button",
    "a[href]",
    "input:not([type='hidden'])",
    "textarea",
    "select",
    "[role='button']",
    "[role='link']",
    "[role='tab']",
    "[role='checkbox']",
    "[role='menuitem']",
    "[data-agent-target]",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  const rawElements = Array.from(document.querySelectorAll<HTMLElement>(interactiveQuery));
  const seenElements = new Set<HTMLElement>();
  const nodes: InteractiveElementNode[] = [];

  let indexCounter = 0;

  for (const el of rawElements) {
    // Ignore internal agent elements to prevent self-targeting loops
    if (el.closest("[data-agent-ui='true']") || el.getAttribute("data-agent-internal") === "true") {
      continue;
    }

    if (seenElements.has(el) || !isElementVisible(el)) {
      continue;
    }
    seenElements.add(el);

    const rect = el.getBoundingClientRect();
    const tagName = el.tagName.toLowerCase();
    const role = el.getAttribute("role") || el.getAttribute("type") || tagName;
    const text = getElementText(el);
    const selector = generateSelector(el);
    const dataAgentTarget = el.getAttribute("data-agent-target") || undefined;
    const placeholder = el.getAttribute("placeholder") || undefined;
    const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("title") || undefined;

    nodes.push({
      index: indexCounter++,
      tagName,
      role,
      text,
      placeholder,
      ariaLabel,
      selector,
      dataAgentTarget,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      element: el,
    });
  }

  return nodes;
}

/**
 * Formats indexed interactive elements into a concise schema for LLM reasoning
 */
export function formatDomForLLM(nodes: InteractiveElementNode[]): string {
  if (!nodes.length) return "No interactive elements detected on current screen.";

  return nodes
    .map((n) => {
      const parts = [`[${n.index}] <${n.tagName}>`];
      if (n.dataAgentTarget) parts.push(`target="${n.dataAgentTarget}"`);
      if (n.role && n.role !== n.tagName) parts.push(`role="${n.role}"`);
      if (n.text) parts.push(`text="${n.text}"`);
      if (n.placeholder) parts.push(`placeholder="${n.placeholder}"`);
      parts.push(`selector="${n.selector}"`);
      return parts.join(" ");
    })
    .join("\n");
}
