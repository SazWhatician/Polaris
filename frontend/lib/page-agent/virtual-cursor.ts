/**
 * VirtualCursor - Autonomous AI Screen Cursor Simulator
 * Inspired by @page-agent/page-controller & PolarAssist SimulatorMask
 *
 * Provides realistic physics-interpolated on-screen cursor movements,
 * glowing target highlights, click ripple waves, and synthetic DOM actuation.
 */

import "./cursor.css";

export interface CursorMoveOptions {
  label?: string;
  durationMs?: number;
  highlight?: boolean;
}

export class VirtualCursor {
  private layer: HTMLDivElement | null = null;
  private auraEl: HTMLDivElement | null = null;
  private cursorEl: HTMLDivElement | null = null;
  private badgeEl: HTMLDivElement | null = null;
  private highlightBox: HTMLDivElement | null = null;

  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private isAnimating = false;
  private isVisible = false;
  private animFrameId: number | null = null;
  private resolveMovePromise: (() => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initDom();
    }
  }

  private initDom(): void {
    if (typeof document === "undefined" || this.layer) return;

    // Check if layer already exists in DOM
    const existing = document.getElementById("polaris-virtual-cursor-layer");
    if (existing) {
      existing.remove();
    }

    // 1. Layer container
    this.layer = document.createElement("div");
    this.layer.id = "polaris-virtual-cursor-layer";
    this.layer.className = "polaris-virtual-cursor-layer";
    this.layer.style.display = "none";
    this.layer.setAttribute("data-agent-internal", "true");

    // 0. Screen edge rainbow aura (zero blur, active glow)
    this.auraEl = document.createElement("div");
    this.auraEl.className = "polaris-rainbow-aura-active";
    this.auraEl.setAttribute("data-agent-internal", "true");
    this.layer.appendChild(this.auraEl);

    // 2. Target element highlight box
    this.highlightBox = document.createElement("div");
    this.highlightBox.className = "polaris-target-highlight-box";
    this.highlightBox.style.display = "none";
    this.highlightBox.setAttribute("data-agent-internal", "true");
    this.layer.appendChild(this.highlightBox);

    // 3. Animated Cursor
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "polaris-ai-cursor";
    this.cursorEl.setAttribute("data-agent-internal", "true");

    // Trail glow
    const trail = document.createElement("div");
    trail.className = "polaris-cursor-trail";
    this.cursorEl.appendChild(trail);

    // Click ripple
    const ripple = document.createElement("div");
    ripple.className = "polaris-cursor-ripple";
    this.cursorEl.appendChild(ripple);

    // SVG Cursor Pointer
    const iconContainer = document.createElement("div");
    iconContainer.className = "polaris-cursor-icon";
    iconContainer.innerHTML = `
      <svg class="polaris-cursor-svg" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="polarisCursorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="50%" stop-color="#818cf8" />
            <stop offset="100%" stop-color="#c084fc" />
          </linearGradient>
          <filter id="cursorShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <path d="M4 2L22 13.5L13.5 15.5L9.5 24.5L4 2Z" 
              fill="url(#polarisCursorGrad)" 
              stroke="#ffffff" 
              stroke-width="1.75" 
              stroke-linejoin="round"
              filter="url(#cursorShadow)" />
      </svg>
    `;
    this.cursorEl.appendChild(iconContainer);

    // Status badge next to pointer
    this.badgeEl = document.createElement("div");
    this.badgeEl.className = "polaris-cursor-badge";
    this.badgeEl.setAttribute("data-agent-internal", "true");
    this.cursorEl.appendChild(this.badgeEl);

    this.layer.appendChild(this.cursorEl);
    document.body.appendChild(this.layer);

    // Center cursor initially
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.updateCursorPosition(this.currentX, this.currentY);
  }

  private updateCursorPosition(x: number, y: number): void {
    if (this.cursorEl) {
      this.cursorEl.style.left = `${x}px`;
      this.cursorEl.style.top = `${y}px`;
    }
  }

  private startAnimationLoop(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const animate = () => {
      if (!this.isVisible) {
        this.isAnimating = false;
        return;
      }

      // Smooth physics lerp interpolation (e.g. factor 0.22)
      const dx = this.targetX - this.currentX;
      const dy = this.targetY - this.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.5) {
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        this.updateCursorPosition(this.currentX, this.currentY);

        if (this.resolveMovePromise) {
          const resolve = this.resolveMovePromise;
          this.resolveMovePromise = null;
          resolve();
        }
      } else {
        const ease = 0.24;
        this.currentX += dx * ease;
        this.currentY += dy * ease;
        this.updateCursorPosition(this.currentX, this.currentY);
      }

      this.animFrameId = requestAnimationFrame(animate);
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  /**
   * Shows the cursor overlay.
   */
  public show(): void {
    if (typeof window === "undefined") return;
    this.initDom();
    if (this.layer) {
      this.layer.style.display = "block";
      this.isVisible = true;
      this.startAnimationLoop();
    }
  }

  /**
   * Hides the cursor overlay and clears highlights.
   */
  public hide(): void {
    this.isVisible = false;
    if (this.layer) {
      this.layer.style.display = "none";
    }
    if (this.highlightBox) {
      this.highlightBox.style.display = "none";
    }
    if (this.badgeEl) {
      this.badgeEl.classList.remove("visible");
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Sets the text displayed on the cursor's floating badge.
   */
  public setBadge(text: string | null): void {
    if (!this.badgeEl) return;
    if (text) {
      this.badgeEl.textContent = text;
      this.badgeEl.classList.add("visible");
    } else {
      this.badgeEl.classList.remove("visible");
    }
  }

  /**
   * Smoothly glides the cursor to screen coordinates (x, y).
   */
  public async moveTo(x: number, y: number, options?: CursorMoveOptions): Promise<void> {
    this.show();
    if (options?.label) {
      this.setBadge(options.label);
    }

    this.targetX = Math.max(10, Math.min(window.innerWidth - 10, x));
    this.targetY = Math.max(10, Math.min(window.innerHeight - 10, y));

    return new Promise<void>((resolve) => {
      this.resolveMovePromise = resolve;
      // Safety timeout in case animation lags
      setTimeout(() => {
        if (this.resolveMovePromise === resolve) {
          this.currentX = this.targetX;
          this.currentY = this.targetY;
          this.updateCursorPosition(this.currentX, this.currentY);
          this.resolveMovePromise = null;
          resolve();
        }
      }, options?.durationMs || 1000);
    });
  }

  /**
   * Smoothly scrolls and glides the cursor directly to the center of an HTMLElement.
   */
  public async moveToElement(
    element: HTMLElement,
    options?: CursorMoveOptions
  ): Promise<{ x: number; y: number }> {
    this.show();

    // 1. Scroll element into view smoothly if needed
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    // Wait for scroll to settle
    await new Promise((r) => setTimeout(r, 200));

    // 2. Calculate coordinates
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    // 3. Position the glowing target highlight box
    if (options?.highlight !== false && this.highlightBox) {
      this.highlightBox.style.display = "block";
      this.highlightBox.style.left = `${rect.left - 4}px`;
      this.highlightBox.style.top = `${rect.top - 4}px`;
      this.highlightBox.style.width = `${rect.width + 8}px`;
      this.highlightBox.style.height = `${rect.height + 8}px`;
    }

    // 4. Move cursor
    const label =
      options?.label ||
      element.getAttribute("data-agent-target") ||
      element.getAttribute("aria-label") ||
      element.innerText?.slice(0, 24) ||
      element.tagName.toLowerCase();

    await this.moveTo(targetX, targetY, { ...options, label });

    return { x: targetX, y: targetY };
  }

  /**
   * Triggers realistic click animations and dispatches full W3C pointer events.
   */
  public async click(element?: HTMLElement): Promise<void> {
    if (!this.cursorEl) return;

    // Trigger click scale and ripple animation
    this.cursorEl.classList.remove("clicking");
    // Force reflow
    void this.cursorEl.offsetHeight;
    this.cursorEl.classList.add("clicking");

    if (element) {
      element.classList.add("polaris-agent-target-pulse");
      setTimeout(() => element.classList.remove("polaris-agent-target-pulse"), 800);

      const rect = element.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      const pointerOpts: PointerEventInit = {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        pointerType: "mouse",
        button: 0,
      };

      const mouseOpts: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        button: 0,
      };

      // 1. Pointer over / enter
      element.dispatchEvent(new PointerEvent("pointerover", pointerOpts));
      element.dispatchEvent(new PointerEvent("pointerenter", { ...pointerOpts, bubbles: false }));
      element.dispatchEvent(new MouseEvent("mouseover", mouseOpts));
      element.dispatchEvent(new MouseEvent("mouseenter", { ...mouseOpts, bubbles: false }));

      // 2. Pointer down / mouse down
      element.dispatchEvent(new PointerEvent("pointerdown", pointerOpts));
      element.dispatchEvent(new MouseEvent("mousedown", mouseOpts));

      // 3. Focus
      element.focus({ preventScroll: true });

      // 4. Pointer up / mouse up / click
      element.dispatchEvent(new PointerEvent("pointerup", pointerOpts));
      element.dispatchEvent(new MouseEvent("mouseup", mouseOpts));
      element.click();
    }

    await new Promise((r) => setTimeout(r, 450));
    this.cursorEl.classList.remove("clicking");
  }

  /**
   * Simulates realistic typing character by character into an input or textarea.
   */
  public async typeText(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    speedMs = 35
  ): Promise<void> {
    if (!this.cursorEl) return;

    this.cursorEl.classList.add("typing");
    element.focus();

    // Prototype setter helper to work with React 19 synthetic events
    const proto =
      element instanceof HTMLInputElement
        ? window.HTMLInputElement.prototype
        : window.HTMLTextAreaElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    let currentVal = "";
    for (let i = 0; i < text.length; i++) {
      currentVal += text[i];
      if (valueSetter) {
        valueSetter.call(element, currentVal);
      } else {
        element.value = currentVal;
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, speedMs));
    }

    element.dispatchEvent(new Event("change", { bubbles: true }));
    this.cursorEl.classList.remove("typing");
    await new Promise((r) => setTimeout(r, 200));
  }

  /**
   * Clears the current target highlight box.
   */
  public clearHighlight(): void {
    if (this.highlightBox) {
      this.highlightBox.style.display = "none";
    }
  }
}

// Global singleton instance
export const virtualCursor = new VirtualCursor();
