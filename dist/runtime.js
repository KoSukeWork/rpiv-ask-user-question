var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// state/row-intent.ts
function sentinelsToAppend(question) {
  const out = [];
  for (const k of SENTINEL_KINDS) {
    const meta = ROW_INTENT_META[k];
    if (!meta.livesInMainList) continue;
    if (question.multiSelect === true) {
      if (meta.autoAppendOnMultiSelect) out.push(k);
    } else {
      if (meta.autoAppendOnSingleSelect) out.push(k);
    }
  }
  return out;
}
var SENTINEL_KINDS, ROW_INTENT_META, LABELS_BY_KIND, RESERVED_LABEL_SET;
var init_row_intent = __esm({
  "state/row-intent.ts"() {
    SENTINEL_KINDS = ["other", "next"];
    ROW_INTENT_META = {
      option: {
        label: "",
        reserved: false,
        livesInMainList: true,
        numbered: true,
        activatesInputMode: false,
        blocksMultiToggle: false,
        autoSubmitsInMulti: false,
        autoAppendOnSingleSelect: false,
        autoAppendOnMultiSelect: false
      },
      other: {
        label: "Type something.",
        reserved: true,
        livesInMainList: true,
        numbered: true,
        activatesInputMode: true,
        blocksMultiToggle: false,
        autoSubmitsInMulti: false,
        autoAppendOnSingleSelect: true,
        autoAppendOnMultiSelect: true
      },
      next: {
        label: "Next",
        reserved: true,
        livesInMainList: true,
        numbered: false,
        activatesInputMode: false,
        blocksMultiToggle: true,
        autoSubmitsInMulti: true,
        autoAppendOnSingleSelect: false,
        autoAppendOnMultiSelect: true
      }
    };
    LABELS_BY_KIND = {
      other: ROW_INTENT_META.other.label,
      next: ROW_INTENT_META.next.label
    };
    RESERVED_LABEL_SET = /* @__PURE__ */ new Set([
      "Other",
      ...SENTINEL_KINDS.filter((k) => ROW_INTENT_META[k].reserved).map((k) => ROW_INTENT_META[k].label)
    ]);
  }
});

// state/i18n-bridge.ts
function displayLabel(kind) {
  return t(`sentinel.${kind}`, ROW_INTENT_META[kind].label);
}
var I18N_NAMESPACE, scopeImpl, t;
var init_i18n_bridge = __esm({
  async "state/i18n-bridge.ts"() {
    init_row_intent();
    I18N_NAMESPACE = "@juicesharp/rpiv-ask-user-question";
    try {
      const sdk = await import("@juicesharp/rpiv-i18n");
      scopeImpl = sdk.scope(I18N_NAMESPACE);
    } catch {
      scopeImpl = (_key, fallback) => fallback;
    }
    t = scopeImpl;
  }
});

// tool/format-answer.ts
function formatAnswerScalar(a, _variant) {
  switch (a.kind) {
    case "multi":
      return a.selected && a.selected.length > 0 ? a.selected.join(", ") : NO_INPUT_PLACEHOLDER;
    case "custom":
      return a.answer && a.answer.length > 0 ? a.answer : NO_INPUT_PLACEHOLDER;
    case "option":
      return a.answer ?? NO_INPUT_PLACEHOLDER;
  }
}
var NO_INPUT_PLACEHOLDER;
var init_format_answer = __esm({
  "tool/format-answer.ts"() {
    NO_INPUT_PLACEHOLDER = "(no input)";
  }
});

// view/tab-content-strategy.ts
import { Container, Spacer, Text, truncateToWidth } from "@earendil-works/pi-tui";
function buildHintText(question, isMulti, state) {
  const parts = [t("hint.enter", HINT_PART_ENTER), t("hint.navigate", HINT_PART_NAV)];
  if (question?.multiSelect === true) parts.push(t("hint.toggle", HINT_PART_TOGGLE));
  if (question && !state.notesVisible && !state.inputMode) parts.push(t("hint.notes", HINT_PART_NOTES));
  if (isMulti) parts.push(t("hint.tab", HINT_PART_TAB));
  parts.push(t("hint.cancel", HINT_PART_CANCEL));
  parts.push(t("hint.collapse", HINT_PART_COLLAPSE));
  if (state.notesVisible || state.inputMode) parts.push(t("hint.newline", HINT_PART_NEW_LINE));
  if (state.inputMode) parts.push(t("hint.clear", HINT_PART_CLEAR));
  return parts.join(" \xB7 ");
}
var NOTES_HEADER, OneLineClippedText, QuestionTabStrategy, SubmitTabStrategy;
var init_tab_content_strategy = __esm({
  async "view/tab-content-strategy.ts"() {
    await init_i18n_bridge();
    init_format_answer();
    await init_dialog_builder();
    NOTES_HEADER = "Notes:";
    OneLineClippedText = class {
      constructor(text, paddingLeft = 0) {
        this.text = text;
        this.paddingLeft = paddingLeft;
      }
      text;
      paddingLeft;
      render(width) {
        const pad = " ".repeat(this.paddingLeft);
        const avail = Math.max(0, width - this.paddingLeft);
        return [pad + truncateToWidth(this.text, avail, "\u2026", false)];
      }
      invalidate() {
      }
      handleInput(_data) {
      }
    };
    QuestionTabStrategy = class {
      constructor(config) {
        this.config = config;
      }
      config;
      /** Spacer(1) + OneLineClippedText(hint, 1) = 2 rendered rows. */
      footerRowCount = 2;
      headingRows(state) {
        const out = [];
        const question = this.config.questions[state.currentTab];
        if (!this.config.isMulti && question?.header && question.header.length > 0) {
          out.push(new Text(this.config.theme.bg("selectedBg", ` ${question.header} `), 1, 0));
          out.push(new Spacer(1));
        }
        if (question) {
          out.push(new Text(this.config.theme.bold(question.question), 1, 0));
          out.push(new Spacer(1));
        }
        return out;
      }
      bodyComponent(state) {
        const question = this.config.questions[state.currentTab];
        const mso = this.config.tabsByIndex[state.currentTab]?.multiSelect;
        if (question?.multiSelect === true && mso) return mso;
        return this.config.getPreviewPane();
      }
      bodyHeight(width, _state) {
        return this.config.getCurrentBodyHeight(width);
      }
      midRows(state) {
        if (!state.notesVisible) return [];
        return [
          new Text(this.config.theme.fg("muted", t("notes.header", NOTES_HEADER)), 1, 0),
          this.config.notesInput,
          new Spacer(1)
        ];
      }
      footerRows(state) {
        const question = this.config.questions[state.currentTab];
        return [
          new Spacer(1),
          new OneLineClippedText(this.config.theme.fg("dim", buildHintText(question, this.config.isMulti, state)), 1)
        ];
      }
      focusedItemRowRange(width, state) {
        const question = this.config.questions[state.currentTab];
        const mso = this.config.tabsByIndex[state.currentTab]?.multiSelect;
        if (question?.multiSelect === true && mso) return mso.focusedItemRowRange(width);
        return this.config.getPreviewPane().focusedItemRowRange(width);
      }
    };
    SubmitTabStrategy = class {
      constructor(config) {
        this.config = config;
      }
      config;
      /** Spacer(1) + Text(prompt, 1) + Spacer(1) + submitPicker(2) = 5 rendered rows. Fallback path lands at 5 via 2 trailing Spacer(1)s. */
      footerRowCount = 5;
      headingRows(_state) {
        return [
          new Text(this.config.theme.bold(this.config.theme.fg("accent", t("review.heading", REVIEW_HEADING))), 1, 0),
          new Spacer(1)
        ];
      }
      bodyComponent(state) {
        const c = new Container();
        for (let i = 0; i < this.config.questions.length; i++) {
          const q = this.config.questions[i];
          const a = state.answers.get(i);
          if (!a) continue;
          const label = q.header && q.header.length > 0 ? q.header : `Q${i + 1}`;
          const answerText = formatAnswerScalar(a, "summary");
          c.addChild(new Text(this.config.theme.fg("muted", ` \u25CF ${label}`), 1, 0));
          c.addChild(
            new Text(`   ${this.config.theme.fg("muted", "\u2192")} ${this.config.theme.fg("text", answerText)}`, 1, 0)
          );
          if (a.notes && a.notes.length > 0) {
            c.addChild(new Text(this.config.theme.fg("dim", `     notes: ${a.notes}`), 1, 0));
          }
        }
        return c;
      }
      bodyHeight(width, state) {
        return this.bodyComponent(state).render(width).length;
      }
      midRows(_state) {
        return [];
      }
      footerRows(state) {
        const missing = [];
        for (let i = 0; i < this.config.questions.length; i++) {
          const q = this.config.questions[i];
          if (!state.answers.has(i)) {
            missing.push(q.header && q.header.length > 0 ? q.header : `Q${i + 1}`);
          }
        }
        const promptText = missing.length === 0 ? this.config.theme.fg("muted", t("review.ready", READY_PROMPT)) : this.config.theme.fg(
          "warning",
          `${t("review.incomplete", INCOMPLETE_WARNING_PREFIX)} ${missing.join(", ")}`
        );
        const out = [new Spacer(1), new Text(promptText, 1, 0), new Spacer(1)];
        if (this.config.submitPicker) {
          out.push(this.config.submitPicker);
        } else {
          out.push(new Spacer(1));
          out.push(new Spacer(1));
        }
        return out;
      }
      focusedItemRowRange(_width, _state) {
        return void 0;
      }
    };
  }
});

// view/dialog-builder.ts
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container as Container2, Spacer as Spacer2 } from "@earendil-works/pi-tui";
var HINT_PART_ENTER, HINT_PART_NAV, HINT_PART_NEW_LINE, HINT_PART_CLEAR, HINT_PART_TOGGLE, HINT_PART_NOTES, HINT_PART_TAB, HINT_PART_CANCEL, HINT_PART_COLLAPSE, HINT_PART_EXPAND, HINT_SINGLE, HINT_MULTI, COLLAPSED_HINT, REVIEW_HEADING, READY_PROMPT, INCOMPLETE_WARNING_PREFIX, OVERFLOW_UP, OVERFLOW_DOWN, OVERFLOW_BOTH, DialogView;
var init_dialog_builder = __esm({
  async "view/dialog-builder.ts"() {
    await init_tab_content_strategy();
    HINT_PART_ENTER = "Enter to select";
    HINT_PART_NAV = "\u2191/\u2193 to navigate";
    HINT_PART_NEW_LINE = "Shift+Enter for newline";
    HINT_PART_CLEAR = "Ctrl+U to clear";
    HINT_PART_TOGGLE = "Space to toggle";
    HINT_PART_NOTES = "n to add notes";
    HINT_PART_TAB = "Tab to switch questions";
    HINT_PART_CANCEL = "Esc to cancel";
    HINT_PART_COLLAPSE = "Ctrl+] to collapse";
    HINT_PART_EXPAND = "Ctrl+] to expand";
    HINT_SINGLE = [HINT_PART_ENTER, HINT_PART_NAV, HINT_PART_NOTES, HINT_PART_CANCEL].join(" \xB7 ");
    HINT_MULTI = [HINT_PART_ENTER, HINT_PART_NAV, HINT_PART_NOTES, HINT_PART_TAB, HINT_PART_CANCEL].join(
      " \xB7 "
    );
    COLLAPSED_HINT = [HINT_PART_EXPAND, HINT_PART_CANCEL].join(" \xB7 ");
    REVIEW_HEADING = "Review your answers";
    READY_PROMPT = "Ready to submit your answers?";
    INCOMPLETE_WARNING_PREFIX = "\u26A0 Answer remaining questions before submitting:";
    OVERFLOW_UP = "\u2191";
    OVERFLOW_DOWN = "\u2193";
    OVERFLOW_BOTH = "\u2195";
    DialogView = class {
      liveProps;
      config;
      questionStrategy;
      submitStrategy;
      maxFooterRowCount;
      constructor(config, initialProps) {
        this.config = config;
        this.liveProps = initialProps;
        this.questionStrategy = new QuestionTabStrategy({
          theme: config.theme,
          questions: config.questions,
          getPreviewPane: () => this.liveProps.activePreviewPane,
          tabsByIndex: config.tabsByIndex,
          notesInput: config.notesInput,
          isMulti: config.isMulti,
          getCurrentBodyHeight: config.getCurrentBodyHeight
        });
        this.submitStrategy = config.isMulti ? new SubmitTabStrategy({
          theme: config.theme,
          questions: config.questions,
          submitPicker: config.submitPicker
        }) : void 0;
        this.maxFooterRowCount = Math.max(this.questionStrategy.footerRowCount, this.submitStrategy?.footerRowCount ?? 0);
      }
      setProps(props) {
        this.liveProps = props;
      }
      handleInput(_data) {
      }
      // Invalidation is driven by `QuestionnairePropsAdapter.invalidate()`, which
      // owns the full set of renderables (binding registries + extras like
      // `notesInput`). DialogView has no cached layout of its own.
      invalidate() {
      }
      render(width) {
        const state = this.liveProps.state;
        const onSubmit = this.config.isMulti && state.currentTab === this.config.questions.length;
        const strategy = onSubmit && this.submitStrategy ? this.submitStrategy : this.questionStrategy;
        const headingRowCache = strategy.headingRows(state);
        const headingCount = headingRowCache.length;
        const natural = this.buildContainerFromStrategy(strategy, headingRowCache).render(width);
        const topFixed = 1 + (this.config.isMulti && this.config.tabBar ? 2 : 0) + 1;
        const bottomFixed = 1 + strategy.footerRowCount;
        const middleRows = natural.length - topFixed - bottomFixed;
        const spacerRows = Math.max(
          0,
          this.config.getBodyHeight(width) + this.maxFooterRowCount - strategy.bodyHeight(width, state) - strategy.footerRowCount
        );
        const termRows = this.config.getTerminalRows();
        if (natural.length + spacerRows <= termRows) {
          return spacerRows > 0 ? [...natural, ...Array(spacerRows).fill("")] : natural;
        }
        const availableMiddle = Math.max(0, termRows - topFixed - bottomFixed);
        if (availableMiddle === 0) {
          const chromeOnly = [...natural.slice(0, topFixed), ...natural.slice(natural.length - bottomFixed)];
          return chromeOnly.length > termRows ? chromeOnly.slice(0, termRows) : chromeOnly;
        }
        const bodyRange = strategy.focusedItemRowRange(width, state);
        let scrollStart;
        if (bodyRange) {
          const focusedRowInMiddle = headingCount + bodyRange[0];
          const focusedHeight = bodyRange[1] - bodyRange[0];
          const idealStart = focusedRowInMiddle - Math.floor(Math.max(0, availableMiddle - focusedHeight) / 2);
          scrollStart = Math.max(0, Math.min(idealStart, middleRows - availableMiddle));
        } else {
          scrollStart = 0;
        }
        const scrollableMiddle = natural.slice(topFixed + scrollStart, topFixed + scrollStart + availableMiddle);
        const hasUp = scrollStart > 0;
        const hasDown = scrollStart + availableMiddle < middleRows;
        if (hasUp && hasDown && scrollableMiddle.length === 1) {
          scrollableMiddle[0] = this.config.theme.fg("dim", OVERFLOW_BOTH);
        } else {
          if (hasUp && scrollableMiddle.length > 0) {
            scrollableMiddle[0] = this.config.theme.fg("dim", OVERFLOW_UP);
          }
          if (hasDown && scrollableMiddle.length > 0) {
            scrollableMiddle[scrollableMiddle.length - 1] = this.config.theme.fg("dim", OVERFLOW_DOWN);
          }
        }
        const result = [
          ...natural.slice(0, topFixed),
          ...scrollableMiddle,
          ...natural.slice(natural.length - bottomFixed)
        ];
        return result.length > termRows ? result.slice(0, termRows) : result;
      }
      buildContainerFromStrategy(strategy, headingRowCache) {
        const { theme, isMulti, tabBar } = this.config;
        const state = this.liveProps.state;
        const container = new Container2();
        const border = () => new DynamicBorder((s) => theme.fg("accent", s));
        container.addChild(border());
        if (isMulti && tabBar) container.addChild(tabBar);
        container.addChild(new Spacer2(1));
        for (const c of headingRowCache) container.addChild(c);
        container.addChild(strategy.bodyComponent(state));
        container.addChild(new Spacer2(1));
        for (const c of strategy.midRows(state)) container.addChild(c);
        container.addChild(border());
        for (const c of strategy.footerRows(state)) container.addChild(c);
        return container;
      }
    };
  }
});

// view/component-binding.ts
function globalBinding(spec) {
  return {
    apply: (state, ctx) => spec.component.setProps(spec.select(state, ctx)),
    invalidate: () => spec.component.invalidate()
  };
}
function perTabBinding(spec) {
  return {
    apply: (state, ctx) => {
      if (spec.predicate && !spec.predicate(state, ctx)) return;
      spec.resolve(ctx.tab)?.setProps(spec.select(state, ctx));
    }
  };
}
var init_component_binding = __esm({
  "view/component-binding.ts"() {
  }
});

// view/components/inline-input.ts
import { CURSOR_MARKER, wrapTextWithAnsi } from "@earendil-works/pi-tui";
function resolveCursorOffset(buffer, requested) {
  if (requested !== void 0 && requested >= 0 && requested <= buffer.length) return requested;
  return buffer.length;
}
function buildCursorRaw(buffer, offset) {
  const before = buffer.slice(0, offset);
  const [firstGrapheme] = graphemeSegmenter.segment(buffer.slice(offset));
  const rawAt = firstGrapheme ? firstGrapheme.segment : "";
  const cursorAtLineEnd = rawAt === "\n";
  const atCursor = rawAt === "" || rawAt === " " || cursorAtLineEnd ? "\xA0" : rawAt;
  const after = buffer.slice(offset + (cursorAtLineEnd ? 0 : rawAt.length));
  return `${before}${CURSOR_MARKER}\x1B[7m${atCursor}\x1B[27m${after}`;
}
function renderInlineInputRow(opts) {
  const { buffer, cursorOffset, rowPrefix, continuationPrefix, contentWidth, selectedText } = opts;
  const raw = buildCursorRaw(buffer, resolveCursorOffset(buffer, cursorOffset));
  return wrapTextWithAnsi(raw, contentWidth).map((segment, index) => {
    const prefix = index === 0 ? rowPrefix : continuationPrefix;
    return selectedText(`${prefix}${segment}`);
  });
}
var graphemeSegmenter;
var init_inline_input = __esm({
  "view/components/inline-input.ts"() {
    graphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
  }
});

// view/components/multi-select-view.ts
import { truncateToWidth as truncateToWidth2, visibleWidth, wrapTextWithAnsi as wrapTextWithAnsi2 } from "@earendil-works/pi-tui";
var ACTIVE_POINTER, INACTIVE_POINTER, CHECKED, UNCHECKED, NUMBER_SEPARATOR, BOX_LABEL_GAP, CONTINUATION_INDENT, MULTI_SUBMIT_LABEL, MultiSelectView;
var init_multi_select_view = __esm({
  async "view/components/multi-select-view.ts"() {
    await init_i18n_bridge();
    init_inline_input();
    ACTIVE_POINTER = "\u276F ";
    INACTIVE_POINTER = "  ";
    CHECKED = "[\u2714]";
    UNCHECKED = "[ ]";
    NUMBER_SEPARATOR = ". ";
    BOX_LABEL_GAP = " ";
    CONTINUATION_INDENT = "  ";
    MULTI_SUBMIT_LABEL = "Submit";
    MultiSelectView = class {
      constructor(theme, question) {
        this.theme = theme;
        this.question = question;
        this.props = {
          rows: [],
          other: { active: false, inputMode: false, inputBuffer: "", inputCursorOffset: void 0 },
          nextActive: false,
          nextLabel: displayLabel("next")
        };
      }
      theme;
      question;
      props;
      cachedLayout;
      setProps(props) {
        this.props = props;
        this.cachedLayout = void 0;
      }
      handleInput(_data) {
      }
      invalidate() {
        this.cachedLayout = void 0;
      }
      render(width) {
        return this.layout(width).lines;
      }
      focusedItemRowRange(width) {
        return this.layout(width).focusedRange;
      }
      naturalHeight(width) {
        return this.layout(width).lines.length;
      }
      layout(width) {
        if (this.cachedLayout?.width === width) return this.cachedLayout.value;
        const lines = [];
        let focusedRange = [0, 0];
        const contentWidth = Math.max(1, width - this.prefixVisibleWidth());
        const numberWidth = String(Math.max(1, this.question.options.length + 1)).length;
        for (let i = 0; i < this.question.options.length; i++) {
          const opt = this.question.options[i];
          const row = this.props.rows[i];
          if (!opt || !row) continue;
          const start = lines.length;
          const pointer = row.active ? this.theme.fg("accent", ACTIVE_POINTER) : INACTIVE_POINTER;
          const box = row.checked ? this.theme.fg("accent", CHECKED) : this.theme.fg("muted", UNCHECKED);
          const label = truncateToWidth2(opt.label, contentWidth, "\u2026");
          const styledLabel = row.active ? this.theme.fg("accent", this.theme.bold(label)) : label;
          const number = String(i + 1).padStart(numberWidth, " ");
          lines.push(
            truncateToWidth2(`${pointer}${number}${NUMBER_SEPARATOR}${box}${BOX_LABEL_GAP}${styledLabel}`, width, "")
          );
          if (opt.description) {
            for (const segment of wrapTextWithAnsi2(opt.description, contentWidth)) {
              lines.push(CONTINUATION_INDENT + this.theme.fg("muted", segment));
            }
          }
          if (row.active) focusedRange = [start, lines.length];
        }
        const otherStart = lines.length;
        lines.push(...this.renderOtherRow(contentWidth, numberWidth));
        if (this.props.other.active) focusedRange = [otherStart, lines.length];
        const nextStart = lines.length;
        const nextPointer = this.props.nextActive ? this.theme.fg("accent", ACTIVE_POINTER) : INACTIVE_POINTER;
        const nextLabel = this.props.nextActive ? this.theme.fg("accent", this.theme.bold(this.props.nextLabel)) : this.props.nextLabel;
        lines.push(truncateToWidth2(`${nextPointer}${nextLabel}`, width, ""));
        if (this.props.nextActive) focusedRange = [nextStart, lines.length];
        const value = { lines, focusedRange };
        this.cachedLayout = { width, value };
        return value;
      }
      renderOtherRow(contentWidth, numberWidth) {
        const other = this.props.other;
        const pointer = other.active ? this.theme.fg("accent", ACTIVE_POINTER) : INACTIVE_POINTER;
        const box = this.theme.fg("muted", UNCHECKED);
        const number = String(this.question.options.length + 1).padStart(numberWidth, " ");
        const rowPrefix = `${pointer}${number}${NUMBER_SEPARATOR}${box}${BOX_LABEL_GAP}`;
        const continuationPrefix = " ".repeat(visibleWidth(rowPrefix));
        const selectedText = (text) => this.theme.fg("accent", this.theme.bold(text));
        if (other.active && other.inputMode) {
          return renderInlineInputRow({
            buffer: other.inputBuffer,
            cursorOffset: other.inputCursorOffset,
            rowPrefix,
            continuationPrefix,
            contentWidth,
            selectedText
          });
        }
        return wrapTextWithAnsi2(other.inputBuffer || displayLabel("other"), contentWidth).map((segment, index) => {
          const line = `${index === 0 ? rowPrefix : continuationPrefix}${segment}`;
          return other.active ? selectedText(line) : line;
        });
      }
      prefixVisibleWidth() {
        const numberWidth = String(Math.max(1, this.question.options.length + 1)).length;
        return visibleWidth(INACTIVE_POINTER) + numberWidth + visibleWidth(`${NUMBER_SEPARATOR}${UNCHECKED}${BOX_LABEL_GAP}`);
      }
    };
  }
});

// view/components/wrapping-select.ts
import { visibleWidth as visibleWidth2, wrapTextWithAnsi as wrapTextWithAnsi3 } from "@earendil-works/pi-tui";
var WrappingSelect;
var init_wrapping_select = __esm({
  "view/components/wrapping-select.ts"() {
    init_inline_input();
    WrappingSelect = class _WrappingSelect {
      static ACTIVE_POINTER = "\u276F ";
      static INACTIVE_POINTER = "  ";
      static NUMBER_SEPARATOR = ". ";
      static CONFIRMED_MARK = " \u2714";
      static MIN_CONTENT_WIDTH = 1;
      items;
      maxVisible;
      theme;
      numberStartOffset;
      totalItemsForNumbering;
      selectedIndex = 0;
      focused = true;
      inputBuffer = "";
      inputCursorOffset = void 0;
      /**
       * Index of the row that was previously confirmed for this list (e.g. the user's prior
       * answer when re-entering a multi-question tab). Renders `<label> ✔` in the active-row
       * styling but WITHOUT the `❯` pointer — pointer is reserved for the live cursor. When
       * `selectedIndex === confirmedIndex && focused`, the active rendering wins (no double-mark).
       */
      confirmedIndex = void 0;
      /**
       * When set together with `confirmedIndex`, replaces the row's static label at render time.
       * Used for the `kind: "other"` sentinel — its label is "Type something." but if the user's
       * prior answer was custom text, we render that text instead (e.g. `4. Hello ✔`).
       */
      confirmedLabelOverride = void 0;
      constructor(items, maxVisible, theme, options = {}) {
        this.items = items;
        this.maxVisible = Math.max(1, maxVisible);
        this.theme = theme;
        this.numberStartOffset = options.numberStartOffset ?? 0;
        this.totalItemsForNumbering = options.totalItemsForNumbering ?? items.length;
      }
      /**
       * Update the numbering offset + total padding width without rebuilding the component.
       * Lets the host realign the number column when the underlying item set changes.
       */
      setNumbering(numberStartOffset, totalItemsForNumbering) {
        this.numberStartOffset = numberStartOffset;
        this.totalItemsForNumbering = Math.max(1, totalItemsForNumbering);
      }
      setSelectedIndex(index) {
        this.selectedIndex = Math.max(0, Math.min(index, this.items.length - 1));
      }
      setFocused(focused) {
        this.focused = focused;
      }
      /**
       * Mark a previously-confirmed row. Pass `undefined` to clear. `labelOverride` replaces
       * the row's static `item.label` at render time — used for the `kind: "other"` sentinel so
       * the row reads `Hello ✔` instead of `Type something. ✔` when the prior answer was custom
       * text.
       */
      setConfirmedIndex(index, labelOverride) {
        if (index === void 0) {
          this.confirmedIndex = void 0;
          this.confirmedLabelOverride = void 0;
          return;
        }
        this.confirmedIndex = Math.max(0, Math.min(index, this.items.length - 1));
        this.confirmedLabelOverride = labelOverride;
      }
      setInputBuffer(text) {
        this.inputBuffer = text;
      }
      /** Set the cursor offset for the inline input row. `undefined` → end-of-buffer fallback. */
      setInputCursorOffset(offset) {
        this.inputCursorOffset = offset;
      }
      /** Intentionally empty — input is routed at the container level. */
      handleInput(_data) {
      }
      invalidate() {
      }
      render(width) {
        if (this.items.length === 0) return [];
        const { startIndex, endIndex } = this.computeVisibleWindow();
        const numberWidth = String(Math.max(1, this.totalItemsForNumbering)).length;
        const lines = [];
        for (let i = startIndex; i < endIndex; i++) {
          const item = this.items[i];
          if (!item) continue;
          const isActive = i === this.selectedIndex && this.focused;
          lines.push(...this.renderItem(item, i, isActive, width, numberWidth));
        }
        if (this.hasItemsOutsideWindow(startIndex, endIndex)) {
          lines.push(this.theme.scrollInfo(`  (${this.selectedIndex + 1}/${this.items.length})`));
        }
        return lines;
      }
      /**
       * Returns the [startRow, endRow) range of the focused (selected) item within
       * the output of `render(width)`. Computed by iterating the visible window and
       * summing per-item row counts — O(maxVisible) per call.
       */
      focusedItemRowRange(width) {
        if (this.items.length === 0) return [0, 0];
        const { startIndex, endIndex } = this.computeVisibleWindow();
        const numberWidth = String(Math.max(1, this.totalItemsForNumbering)).length;
        let row = 0;
        for (let i = startIndex; i < endIndex; i++) {
          const item = this.items[i];
          if (!item) continue;
          const isActive = i === this.selectedIndex && this.focused;
          const itemRowCount = this.computeItemRowCount(item, i, isActive, width, numberWidth);
          if (i === this.selectedIndex) {
            return [row, row + itemRowCount];
          }
          row += itemRowCount;
        }
        return [0, 1];
      }
      /**
       * Per-item row count. Delegates to `renderItem().length` so `renderItem` remains
       * the single source of truth for per-item row math — eliminates the prior shadow-copy
       * that risked silent miscounts when new `kind` values branch in `renderItem` but not here.
       */
      computeItemRowCount(item, index, isActive, width, numberWidth) {
        return this.renderItem(item, index, isActive, width, numberWidth).length;
      }
      computeVisibleWindow() {
        const half = Math.floor(this.maxVisible / 2);
        const startIndex = Math.max(0, Math.min(this.selectedIndex - half, this.items.length - this.maxVisible));
        const endIndex = Math.min(startIndex + this.maxVisible, this.items.length);
        return { startIndex, endIndex };
      }
      hasItemsOutsideWindow(startIndex, endIndex) {
        return startIndex > 0 || endIndex < this.items.length;
      }
      renderItem(item, index, isActive, width, numberWidth) {
        const rowPrefix = this.buildRowPrefix(index, isActive, numberWidth);
        const continuationPrefix = " ".repeat(visibleWidth2(rowPrefix));
        const contentWidth = Math.max(_WrappingSelect.MIN_CONTENT_WIDTH, width - visibleWidth2(rowPrefix));
        if (this.shouldRenderAsInlineInput(item, isActive)) {
          return this.renderInlineInputRow(rowPrefix, continuationPrefix, contentWidth);
        }
        const customDraft = item.kind === "other" ? this.inputBuffer : void 0;
        const customDraftDiffersFromConfirmed = item.kind === "other" && customDraft !== "" && index === this.confirmedIndex && customDraft !== (this.confirmedLabelOverride ?? "");
        const isConfirmed = index === this.confirmedIndex && !customDraftDiffersFromConfirmed;
        const baseLabel = customDraft ? customDraft : item.label;
        const label = isConfirmed ? `${this.confirmedLabelOverride ?? baseLabel}${_WrappingSelect.CONFIRMED_MARK}` : baseLabel;
        const applySelectedStyle = isActive || isConfirmed;
        return [
          ...this.renderLabelBlock(label, rowPrefix, continuationPrefix, contentWidth, applySelectedStyle),
          ...this.renderDescriptionBlock(item.description, continuationPrefix, contentWidth)
        ];
      }
      buildRowPrefix(index, isActive, numberWidth) {
        const pointer = isActive ? _WrappingSelect.ACTIVE_POINTER : _WrappingSelect.INACTIVE_POINTER;
        const displayNumber = this.numberStartOffset + index + 1;
        const paddedNumber = String(displayNumber).padStart(numberWidth, " ");
        return `${pointer}${paddedNumber}${_WrappingSelect.NUMBER_SEPARATOR}`;
      }
      shouldRenderAsInlineInput(item, isActive) {
        return item.kind === "other" && isActive;
      }
      /** Render the inline editor across logical and visually wrapped lines. */
      renderInlineInputRow(rowPrefix, continuationPrefix, contentWidth) {
        return renderInlineInputRow({
          buffer: this.inputBuffer,
          cursorOffset: this.inputCursorOffset,
          rowPrefix,
          continuationPrefix,
          contentWidth,
          selectedText: this.theme.selectedText
        });
      }
      renderLabelBlock(label, rowPrefix, continuationPrefix, contentWidth, applySelectedStyle) {
        const wrapped = wrapTextWithAnsi3(label, contentWidth);
        return wrapped.map((segment, index) => {
          const prefix = index === 0 ? rowPrefix : continuationPrefix;
          const line = `${prefix}${segment}`;
          return applySelectedStyle ? this.theme.selectedText(line) : line;
        });
      }
      renderDescriptionBlock(description, continuationPrefix, contentWidth) {
        if (!description) return [];
        const wrapped = wrapTextWithAnsi3(description, contentWidth);
        return wrapped.map((segment) => `${continuationPrefix}${this.theme.description(segment)}`);
      }
    };
  }
});

// view/components/option-list-view.ts
var MAX_VISIBLE_OPTIONS, OptionListView;
var init_option_list_view = __esm({
  "view/components/option-list-view.ts"() {
    init_wrapping_select();
    MAX_VISIBLE_OPTIONS = 10;
    OptionListView = class {
      select;
      constructor(config) {
        this.select = new WrappingSelect(config.items, Math.min(config.items.length, MAX_VISIBLE_OPTIONS), config.theme, {
          numberStartOffset: 0,
          totalItemsForNumbering: config.items.length
        });
      }
      setProps(props) {
        this.select.setSelectedIndex(props.selectedIndex);
        this.select.setFocused(props.focused);
        this.select.setConfirmedIndex(props.confirmed?.index, props.confirmed?.labelOverride);
        this.select.setInputBuffer(props.inputBuffer);
        this.select.setInputCursorOffset(props.inputCursorOffset);
      }
      handleInput(_data) {
      }
      invalidate() {
        this.select.invalidate();
      }
      render(width) {
        return this.select.render(width);
      }
      focusedItemRowRange(width) {
        return this.select.focusedItemRowRange(width);
      }
    };
  }
});

// view/components/preview/preview-box-renderer.ts
import { truncateToWidth as truncateToWidth3, visibleWidth as visibleWidth3 } from "@earendil-works/pi-tui";
function stripFenceMarkers(lines) {
  return lines.filter((line) => {
    const clean = line.replace(ANSI_SGR_RE, "").replace(ANSI_OSC8_RE, "");
    return !FENCE_MARKER_RE.test(clean);
  });
}
function renderBorderedBox(lines, width, colorFn, hidden = 0) {
  const dashSpan = Math.max(1, width - BORDER_HORIZONTAL_OVERHEAD);
  const contentInner = Math.max(1, dashSpan - 2 * BORDER_INNER_PADDING_HORIZONTAL);
  const pad = " ".repeat(BORDER_INNER_PADDING_HORIZONTAL);
  const top = colorFn(`\u250C${"\u2500".repeat(dashSpan)}\u2510`);
  const out = [top];
  for (const line of lines) {
    const padded = truncateToWidth3(line, contentInner, "", true);
    out.push(`${colorFn("\u2502")}${pad}${padded}${pad}${colorFn("\u2502")}`);
  }
  if (hidden > 0) {
    const indicator = ` \u2702 \u2500\u2500 ${hidden} lines hidden \u2500\u2500 `;
    const space = dashSpan - indicator.length;
    const leftFill = "\u2500".repeat(Math.max(0, Math.floor(space / 2)));
    const rightFill = "\u2500".repeat(Math.max(0, dashSpan - leftFill.length - indicator.length));
    out.push(colorFn(`\u2514${leftFill}${indicator}${rightFill}\u2518`));
  } else {
    out.push(colorFn(`\u2514${"\u2500".repeat(dashSpan)}\u2518`));
  }
  return out;
}
function computeBoxDimensions(contentLines, maxInnerWidth) {
  let widest = Math.min(BOX_MIN_CONTENT_WIDTH, maxInnerWidth);
  for (const line of contentLines) {
    const w = visibleWidth3(line.replace(/\s+$/, ""));
    if (w > widest) widest = w;
  }
  const innerWidth = Math.min(widest, maxInnerWidth);
  const boxWidth = innerWidth + BORDER_HORIZONTAL_OVERHEAD + 2 * BORDER_INNER_PADDING_HORIZONTAL;
  return { innerWidth, boxWidth };
}
var ANSI_SGR_RE, ANSI_OSC8_RE, FENCE_MARKER_RE, BORDER_VERTICAL_OVERHEAD, BORDER_HORIZONTAL_OVERHEAD, BORDER_INNER_PADDING_HORIZONTAL, BOX_MIN_CONTENT_WIDTH;
var init_preview_box_renderer = __esm({
  "view/components/preview/preview-box-renderer.ts"() {
    ANSI_SGR_RE = /\x1b\[[0-9;]*m/g;
    ANSI_OSC8_RE = /\x1b\]8;[^\x07\x1b]*(?:\x07|\x1b\\)/g;
    FENCE_MARKER_RE = /^`{3}/;
    BORDER_VERTICAL_OVERHEAD = 2;
    BORDER_HORIZONTAL_OVERHEAD = 2;
    BORDER_INNER_PADDING_HORIZONTAL = 1;
    BOX_MIN_CONTENT_WIDTH = 40;
  }
});

// view/components/preview/markdown-content-cache.ts
import { Markdown, visibleWidth as visibleWidth4 } from "@earendil-works/pi-tui";
var MAX_PREVIEW_HEIGHT_SIDE_BY_SIDE, MAX_PREVIEW_HEIGHT_STACKED, NO_PREVIEW_TEXT, NOTES_AFFORDANCE_OVERHEAD, MarkdownContentCache;
var init_markdown_content_cache = __esm({
  async "view/components/preview/markdown-content-cache.ts"() {
    await init_i18n_bridge();
    init_preview_box_renderer();
    MAX_PREVIEW_HEIGHT_SIDE_BY_SIDE = 20;
    MAX_PREVIEW_HEIGHT_STACKED = 15;
    NO_PREVIEW_TEXT = "No preview available";
    NOTES_AFFORDANCE_OVERHEAD = 2;
    MarkdownContentCache = class {
      previewTexts;
      markdownCache;
      cachedWidth;
      theme;
      markdownTheme;
      constructor(question, theme, markdownTheme) {
        this.theme = theme;
        this.markdownTheme = markdownTheme;
        this.previewTexts = /* @__PURE__ */ new Map();
        for (let i = 0; i < question.options.length; i++) {
          const raw = question.options[i]?.preview;
          if (raw && raw.length > 0) this.previewTexts.set(i, raw);
        }
        this.markdownCache = /* @__PURE__ */ new Map();
      }
      hasAnyPreview() {
        return this.previewTexts.size > 0;
      }
      has(optionIndex) {
        return this.previewTexts.has(optionIndex);
      }
      /**
       * Compute the body lines for a given option at a given inner width. Width changes
       * invalidate the per-Markdown render cache.
       */
      bodyFor(optionIndex, innerWidth) {
        if (this.cachedWidth !== innerWidth) {
          for (const md2 of this.markdownCache.values()) md2.invalidate();
          this.cachedWidth = innerWidth;
        }
        const text = this.previewTexts.get(optionIndex);
        if (!text) {
          const placeholder = this.theme.fg("dim", t("preview.no_preview", NO_PREVIEW_TEXT));
          const pad = Math.max(0, innerWidth - visibleWidth4(placeholder));
          return [placeholder + " ".repeat(pad)];
        }
        let md = this.markdownCache.get(optionIndex);
        if (!md) {
          md = new Markdown(text, 0, 0, this.markdownTheme);
          this.markdownCache.set(optionIndex, md);
        }
        return stripFenceMarkers(md.render(innerWidth));
      }
      invalidate() {
        for (const md of this.markdownCache.values()) md.invalidate();
        this.cachedWidth = void 0;
      }
    };
  }
});

// view/components/preview/preview-block-renderer.ts
var NOTES_AFFORDANCE_TEXT, PreviewBlockRenderer;
var init_preview_block_renderer = __esm({
  async "view/components/preview/preview-block-renderer.ts"() {
    await init_i18n_bridge();
    await init_markdown_content_cache();
    init_preview_box_renderer();
    NOTES_AFFORDANCE_TEXT = "Notes: press n to add notes";
    PreviewBlockRenderer = class {
      theme;
      cache;
      constructor(config) {
        this.theme = config.theme;
        this.cache = new MarkdownContentCache(config.question, config.theme, config.markdownTheme);
      }
      hasAnyPreview() {
        return this.cache.hasAnyPreview();
      }
      has(optionIndex) {
        return this.cache.has(optionIndex);
      }
      invalidate() {
        this.cache.invalidate();
      }
      /**
       * Height contribution of the preview block: `BORDER_VERTICAL_OVERHEAD + contentRows +
       * NOTES_AFFORDANCE_OVERHEAD`. Always returns the same value as `renderBlock(...).length`
       * — the affordance overhead is constant, not gated by `focused`/`notesVisible`.
       */
      blockHeight(width, optionIndex, mode) {
        const cap = mode === "side-by-side" ? MAX_PREVIEW_HEIGHT_SIDE_BY_SIDE : MAX_PREVIEW_HEIGHT_STACKED;
        const contentBudget = Math.max(1, cap - BORDER_VERTICAL_OVERHEAD - NOTES_AFFORDANCE_OVERHEAD);
        const innerWidth = Math.max(1, width - BORDER_HORIZONTAL_OVERHEAD - 2 * BORDER_INNER_PADDING_HORIZONTAL);
        const rawRows = this.cache.bodyFor(optionIndex, innerWidth).length;
        const contentRows = Math.min(rawRows, contentBudget);
        return BORDER_VERTICAL_OVERHEAD + contentRows + NOTES_AFFORDANCE_OVERHEAD;
      }
      /**
       * Render the full preview block at `width`: bordered box + blank separator + affordance row.
       * `focused` and `notesVisible` together gate the affordance text (visible only when the
       * focused option carries a preview AND notes mode is inactive). The affordance row is ALWAYS
       * emitted (as an empty string when gated) so the row count is invariant.
       */
      renderBlock(width, optionIndex, mode, focused, notesVisible) {
        const cap = mode === "side-by-side" ? MAX_PREVIEW_HEIGHT_SIDE_BY_SIDE : MAX_PREVIEW_HEIGHT_STACKED;
        const contentBudget = Math.max(1, cap - BORDER_VERTICAL_OVERHEAD - NOTES_AFFORDANCE_OVERHEAD);
        const maxInnerWidth = Math.max(1, width - BORDER_HORIZONTAL_OVERHEAD - 2 * BORDER_INNER_PADDING_HORIZONTAL);
        const raw = this.cache.bodyFor(optionIndex, maxInnerWidth);
        const truncated = raw.length > contentBudget;
        const hidden = truncated ? raw.length - contentBudget : 0;
        const contentLines = truncated ? raw.slice(0, contentBudget) : raw;
        const { boxWidth } = computeBoxDimensions(contentLines, maxInnerWidth);
        const colorFn = (s) => this.theme.fg("accent", s);
        const boxedLines = renderBorderedBox(contentLines, boxWidth, colorFn, hidden);
        const showAffordance = focused && !notesVisible && this.cache.has(optionIndex);
        const affordance = showAffordance ? this.theme.fg("muted", t("preview.notes_affordance", NOTES_AFFORDANCE_TEXT)) : "";
        return [...boxedLines, "", affordance];
      }
    };
  }
});

// view/components/preview/preview-layout-decider.ts
import { visibleWidth as visibleWidth5 } from "@earendil-works/pi-tui";
function decideLayout(terminalWidth, paneWidth) {
  return terminalWidth >= PREVIEW_MIN_WIDTH && paneWidth >= PREVIEW_MIN_WIDTH ? "side-by-side" : "stacked";
}
function adaptiveLeftWidth(items, totalForNumbering, paneWidth) {
  const prefixW = String(Math.max(1, totalForNumbering)).length + 4;
  const confirmedOverhead = CONFIRMED_OVERHEAD;
  let maxLabel = 0;
  for (const item of items) {
    const w = visibleWidth5(item.label);
    if (w > maxLabel) maxLabel = w;
  }
  const desired = maxLabel + prefixW + confirmedOverhead;
  const ratioCapped = Math.min(desired, Math.floor(paneWidth * MAX_LEFT_RATIO));
  const available = paneWidth - PREVIEW_COLUMN_GAP - MIN_PREVIEW_WIDTH;
  return Math.max(MIN_LEFT, Math.min(ratioCapped, Math.max(1, available)));
}
function crossTabMaxLeftWidth(tabs, itemsByTab, paneWidth) {
  let max = MIN_LEFT;
  for (let i = 0; i < tabs.length; i++) {
    const items = itemsByTab[i] ?? [];
    const totalForNumbering = items.length;
    const tabWidth = adaptiveLeftWidth(items, totalForNumbering, paneWidth);
    if (tabWidth > max) max = tabWidth;
  }
  return max;
}
function previewSourceWidth(question) {
  let max = 0;
  for (const option of question.options) {
    const text = option.preview;
    if (!text) continue;
    for (const line of text.split("\n")) {
      const w = visibleWidth5(line);
      if (w > max) max = w;
    }
  }
  return max;
}
function crossTabPreviewBudget(questions, paneWidth) {
  let max = MIN_PREVIEW_WIDTH;
  for (const question of questions) {
    const rawWidth = previewSourceWidth(question);
    const capped = Math.min(rawWidth, paneWidth - PREVIEW_COLUMN_GAP - MIN_LEFT);
    const budget = capped + BORDER_HORIZONTAL_OVERHEAD + 2 * BORDER_INNER_PADDING_HORIZONTAL + PREVIEW_PADDING_LEFT;
    if (budget > max) max = budget;
  }
  return max;
}
function crossTabLeftWidthWithDonation(tabs, itemsByTab, questions, paneWidth) {
  const labelDriven = crossTabMaxLeftWidth(tabs, itemsByTab, paneWidth);
  const previewBudget = crossTabPreviewBudget(questions, paneWidth);
  const slackDonation = paneWidth - PREVIEW_COLUMN_GAP - previewBudget;
  const previewSafetyCeiling = paneWidth - PREVIEW_COLUMN_GAP - MIN_PREVIEW_WIDTH;
  const ratioCeiling = Math.floor(paneWidth * MAX_LEFT_RATIO);
  const ceiling = Math.min(previewSafetyCeiling, ratioCeiling);
  return Math.min(Math.max(labelDriven, slackDonation), Math.max(1, ceiling));
}
function columnWidths(paneWidth, adaptiveLeft) {
  const gap = PREVIEW_COLUMN_GAP;
  const leftWidth = Math.min(adaptiveLeft, Math.max(1, paneWidth - gap - 1));
  const rightWidth = Math.max(1, paneWidth - leftWidth - gap);
  return { leftWidth, rightWidth, gap };
}
function bodyWidths(paneWidth, mode, adaptiveLeft) {
  if (mode === "stacked") return { optionsWidth: paneWidth, previewWidth: paneWidth };
  const { leftWidth, rightWidth } = columnWidths(paneWidth, adaptiveLeft);
  return { optionsWidth: leftWidth, previewWidth: Math.max(1, rightWidth - PREVIEW_PADDING_LEFT) };
}
var PREVIEW_MIN_WIDTH, PREVIEW_COLUMN_GAP, PREVIEW_PADDING_LEFT, STACKED_GAP_ROWS, MIN_LEFT, MAX_LEFT_RATIO, MIN_PREVIEW_WIDTH, CONFIRMED_OVERHEAD;
var init_preview_layout_decider = __esm({
  "view/components/preview/preview-layout-decider.ts"() {
    init_preview_box_renderer();
    PREVIEW_MIN_WIDTH = 100;
    PREVIEW_COLUMN_GAP = 2;
    PREVIEW_PADDING_LEFT = 1;
    STACKED_GAP_ROWS = 1;
    MIN_LEFT = 30;
    MAX_LEFT_RATIO = 0.5;
    MIN_PREVIEW_WIDTH = 45;
    CONFIRMED_OVERHEAD = 2;
  }
});

// view/components/preview/preview-pane.ts
import { truncateToWidth as truncateToWidth4, visibleWidth as visibleWidth6 } from "@earendil-works/pi-tui";
var PreviewPane;
var init_preview_pane = __esm({
  async "view/components/preview/preview-pane.ts"() {
    init_preview_layout_decider();
    await init_markdown_content_cache();
    await init_preview_block_renderer();
    init_preview_box_renderer();
    init_preview_layout_decider();
    PreviewPane = class {
      question;
      getTerminalWidth;
      optionListView;
      previewBlock;
      props;
      /**
       * Cross-tab max left-width getter. Set exactly once by `buildQuestionnaire.injectGlobalLeftWidth`
       * before any render. Initialized to a throwing sentinel so missing injection is a hard fail
       * rather than a silent fallback to a magic constant — render is illegal until injected.
       */
      globalLeftWidth = () => {
        throw new Error("PreviewPane.setGlobalLeftWidth must be called before render()");
      };
      constructor(config) {
        this.question = config.question;
        this.getTerminalWidth = config.getTerminalWidth;
        this.optionListView = config.optionListView;
        this.previewBlock = config.previewBlock;
        this.props = { notesVisible: false, selectedIndex: 0, focused: false, inputMode: false };
      }
      setGlobalLeftWidth(getter) {
        this.globalLeftWidth = getter;
      }
      getAdaptiveLeft(paneWidth) {
        return this.globalLeftWidth(paneWidth);
      }
      setProps(props) {
        this.props = props;
      }
      handleInput(_data) {
      }
      invalidate() {
        this.previewBlock.invalidate();
        this.optionListView.invalidate();
      }
      render(width) {
        if (this.question.multiSelect === true) return this.optionListView.render(width);
        if (!this.previewBlock.hasAnyPreview()) return this.optionListView.render(width);
        if (this.props.inputMode) return this.optionListView.render(width);
        const mode = decideLayout(this.getTerminalWidth(), width);
        if (mode === "side-by-side") return this.renderSideBySide(width, mode);
        return [
          ...this.optionListView.render(width),
          ...Array(STACKED_GAP_ROWS).fill(""),
          ...this.previewBlock.renderBlock(
            width,
            this.props.selectedIndex,
            mode,
            this.props.focused,
            this.props.notesVisible
          )
        ];
      }
      focusedItemRowRange(width) {
        if (this.question.multiSelect === true) return this.optionListView.focusedItemRowRange(width);
        if (!this.previewBlock.hasAnyPreview()) return this.optionListView.focusedItemRowRange(width);
        if (this.props.inputMode) return this.optionListView.focusedItemRowRange(width);
        const mode = decideLayout(this.getTerminalWidth(), width);
        if (mode === "stacked") return this.optionListView.focusedItemRowRange(width);
        const adaptiveLeft = this.getAdaptiveLeft(width);
        const { leftWidth } = columnWidths(width, adaptiveLeft);
        return this.optionListView.focusedItemRowRange(leftWidth);
      }
      naturalHeight(width) {
        if (this.question.multiSelect === true) return this.optionListView.render(width).length;
        if (!this.previewBlock.hasAnyPreview()) return this.optionListView.render(width).length;
        if (this.props.inputMode) return this.optionListView.render(width).length;
        const mode = decideLayout(this.getTerminalWidth(), width);
        const adaptiveLeft = this.getAdaptiveLeft(width);
        const { optionsWidth, previewWidth } = bodyWidths(width, mode, adaptiveLeft);
        const optionsHeight = this.optionListView.render(optionsWidth).length;
        const previewBlockHeight = this.previewBlock.blockHeight(previewWidth, this.props.selectedIndex, mode);
        if (mode === "side-by-side") return Math.max(optionsHeight, previewBlockHeight);
        return optionsHeight + STACKED_GAP_ROWS + previewBlockHeight;
      }
      maxNaturalHeight(width) {
        if (this.question.multiSelect === true) return this.optionListView.render(width).length;
        if (!this.previewBlock.hasAnyPreview()) return this.optionListView.render(width).length;
        if (this.props.inputMode) return this.optionListView.render(width).length;
        const mode = decideLayout(this.getTerminalWidth(), width);
        const adaptiveLeft = this.getAdaptiveLeft(width);
        const { optionsWidth, previewWidth } = bodyWidths(width, mode, adaptiveLeft);
        const optionsHeight = this.optionListView.render(optionsWidth).length;
        let maxPreviewBlock = 0;
        for (let i = 0; i < this.question.options.length; i++) {
          const h = this.previewBlock.blockHeight(previewWidth, i, mode);
          if (h > maxPreviewBlock) maxPreviewBlock = h;
        }
        if (mode === "side-by-side") return Math.max(optionsHeight, maxPreviewBlock);
        return optionsHeight + STACKED_GAP_ROWS + maxPreviewBlock;
      }
      renderSideBySide(width, mode) {
        const adaptiveLeft = this.getAdaptiveLeft(width);
        const { leftWidth, rightWidth, gap } = columnWidths(width, adaptiveLeft);
        const leftLines = this.optionListView.render(leftWidth);
        const rightLines = this.renderPaddedPreviewLines(rightWidth, mode);
        const rows = Math.max(leftLines.length, rightLines.length);
        const gapStr = " ".repeat(gap);
        const out = [];
        for (let i = 0; i < rows; i++) {
          const leftRaw = leftLines[i] ?? "";
          const rightRaw = rightLines[i] ?? "";
          const leftClamped = truncateToWidth4(leftRaw, leftWidth, "");
          const leftPad = " ".repeat(Math.max(0, leftWidth - visibleWidth6(leftClamped)));
          const joined = `${leftClamped}${leftPad}${gapStr}${rightRaw}`;
          out.push(truncateToWidth4(joined, width, ""));
        }
        return out;
      }
      renderPaddedPreviewLines(colWidth, mode) {
        const inner = Math.max(1, colWidth - PREVIEW_PADDING_LEFT);
        const contentLines = this.previewBlock.renderBlock(
          inner,
          this.props.selectedIndex,
          mode,
          this.props.focused,
          this.props.notesVisible
        );
        const boxWidth = Math.max(1, visibleWidth6(contentLines[0] ?? ""));
        const boxAlignedPad = Math.max(PREVIEW_PADDING_LEFT, colWidth - boxWidth);
        return contentLines.map((line) => {
          if (line === "") return "";
          const pad = Math.max(PREVIEW_PADDING_LEFT, Math.min(boxAlignedPad, colWidth - visibleWidth6(line)));
          return `${" ".repeat(pad)}${truncateToWidth4(line, colWidth - pad, "")}`;
        });
      }
    };
  }
});

// view/components/submit-picker.ts
import { truncateToWidth as truncateToWidth5 } from "@earendil-works/pi-tui";
var ACTIVE_POINTER2, INACTIVE_POINTER2, NUMBER_SEPARATOR2, SUBMIT_LABEL, CANCEL_LABEL, SubmitPicker;
var init_submit_picker = __esm({
  async "view/components/submit-picker.ts"() {
    await init_i18n_bridge();
    ACTIVE_POINTER2 = "\u276F ";
    INACTIVE_POINTER2 = "  ";
    NUMBER_SEPARATOR2 = ". ";
    SUBMIT_LABEL = "Submit answers";
    CANCEL_LABEL = "Cancel";
    SubmitPicker = class {
      constructor(theme) {
        this.theme = theme;
        this.props = { rows: [{ active: false }, { active: false }] };
      }
      theme;
      props;
      setProps(props) {
        this.props = props;
      }
      handleInput(_data) {
      }
      invalidate() {
      }
      naturalHeight(_width) {
        return 2;
      }
      render(width) {
        const lines = [];
        for (let i = 0; i < 2; i++) {
          const text = i === 0 ? t("submit.label", SUBMIT_LABEL) : t("submit.cancel", CANCEL_LABEL);
          const active = this.props.rows[i]?.active ?? false;
          const pointer = active ? ACTIVE_POINTER2 : INACTIVE_POINTER2;
          const number = `${i + 1}${NUMBER_SEPARATOR2}`;
          const label = active ? this.theme.fg("accent", this.theme.bold(text)) : this.theme.fg("text", text);
          lines.push(truncateToWidth5(`${pointer}${number}${label}`, width, ""));
        }
        return lines;
      }
    };
  }
});

// view/components/tab-bar.ts
import { truncateToWidth as truncateToWidth6 } from "@earendil-works/pi-tui";
var TabBar;
var init_tab_bar = __esm({
  "view/components/tab-bar.ts"() {
    TabBar = class {
      constructor(theme) {
        this.theme = theme;
        this.props = { tabs: [], submit: { active: false, allAnswered: false } };
      }
      theme;
      props;
      setProps(props) {
        this.props = props;
      }
      handleInput(_data) {
      }
      invalidate() {
      }
      render(width) {
        const pieces = [" \u2190 "];
        for (const tab of this.props.tabs) {
          const box = tab.answered ? "\u25A0" : "\u25A1";
          const rawSeg = ` ${box} ${tab.label} `;
          const styled = tab.active ? this.theme.bg("selectedBg", this.theme.fg("text", rawSeg)) : this.theme.fg(tab.answered ? "success" : "muted", rawSeg);
          pieces.push(styled);
          pieces.push(" ");
        }
        const submitText = " \u2713 Submit ";
        const submitStyled = this.props.submit.active ? this.theme.bg("selectedBg", this.theme.fg("text", submitText)) : this.theme.fg(this.props.submit.allAnswered ? "success" : "dim", submitText);
        pieces.push(submitStyled);
        pieces.push(" \u2192");
        const tabLine = truncateToWidth6(pieces.join(""), width, "");
        return [tabLine, ""];
      }
    };
  }
});

// state/selectors/derivations.ts
function selectConfirmedIndicator(questions, currentTab, answers, items) {
  const q = questions[currentTab];
  if (!q || q.multiSelect === true) return void 0;
  const prior = answers.get(currentTab);
  if (!prior) return void 0;
  if (prior.kind === "custom") {
    const otherIndex = items.findIndex((it) => it.kind === "other");
    if (otherIndex < 0) return void 0;
    return { index: otherIndex, labelOverride: prior.answer ?? "" };
  }
  if (prior.kind !== "option" || typeof prior.answer !== "string") return void 0;
  const index = items.findIndex((it) => it.kind === "option" && it.label === prior.answer);
  if (index < 0) return void 0;
  return { index };
}
function selectActivePreviewPaneIndex(currentTab, totalQuestions) {
  if (totalQuestions <= 0) return 0;
  return Math.min(currentTab, totalQuestions - 1);
}
var init_derivations = __esm({
  "state/selectors/derivations.ts"() {
  }
});

// state/selectors/focus.ts
function selectActiveView(state, totalQuestions) {
  if (state.notesVisible) return "notes";
  if (state.currentTab === totalQuestions) return "submit";
  return "options";
}
var init_focus = __esm({
  "state/selectors/focus.ts"() {
  }
});

// view/props-adapter.ts
function getInputCursorOffset(input) {
  const lines = input.getLines();
  const cursor = input.getCursor();
  let offset = cursor.col;
  for (let i = 0; i < cursor.line; i++) offset += (lines[i]?.length ?? 0) + 1;
  return offset;
}
var QuestionnairePropsAdapter;
var init_props_adapter = __esm({
  "view/props-adapter.ts"() {
    init_derivations();
    init_focus();
    QuestionnairePropsAdapter = class {
      tui;
      questions;
      itemsByTab;
      tabsByIndex;
      inlineInput;
      globalBindings;
      perTabBindings;
      extraInvalidatables;
      constructor(config) {
        this.tui = config.tui;
        this.questions = config.questions;
        this.itemsByTab = config.itemsByTab;
        this.tabsByIndex = config.tabsByIndex;
        this.inlineInput = config.inlineInput;
        this.globalBindings = config.globalBindings;
        this.perTabBindings = config.perTabBindings;
        this.extraInvalidatables = config.extraInvalidatables ?? [];
      }
      apply(state) {
        const totalQuestions = this.questions.length;
        const activeView = selectActiveView(state, totalQuestions);
        const paneIndex = selectActivePreviewPaneIndex(state.currentTab, totalQuestions);
        const activePreviewPane = this.tabsByIndex[paneIndex]?.preview ?? this.tabsByIndex[0].preview;
        const ctx = {
          questions: this.questions,
          itemsByTab: this.itemsByTab,
          totalQuestions,
          activeView,
          inputBuffer: this.inlineInput.getText(),
          inputCursorOffset: getInputCursorOffset(this.inlineInput),
          activePreviewPane
        };
        for (const binding of this.globalBindings) {
          binding.apply(state, ctx);
        }
        for (let i = 0; i < this.tabsByIndex.length; i++) {
          const tab = this.tabsByIndex[i];
          const tabCtx = { ...ctx, tab, i };
          for (const binding of this.perTabBindings) {
            binding.apply(state, tabCtx);
          }
        }
        this.tui.requestRender();
      }
      /**
       * Invalidates every owned renderable. Called by the session in place of
       * the old `dialog.invalidate()` forwarding chain — DialogView no longer
       * reaches into siblings (tabBar, notesInput, activePreviewPane).
       * Iterates the same registries used by `apply()` plus
       * `extraInvalidatables` for components outside the binding system.
       */
      invalidate() {
        for (const b of this.globalBindings) b.invalidate();
        for (const tab of this.tabsByIndex) {
          tab.optionList.invalidate();
          tab.preview.invalidate();
          tab.multiSelect?.invalidate();
        }
        for (const x of this.extraInvalidatables) x.invalidate();
      }
    };
  }
});

// state/selectors/projections.ts
var selectMultiSelectProps, selectOptionListProps, selectSubmitPickerProps, selectPreviewPaneProps, selectTabBarProps, selectDialogProps;
var init_projections = __esm({
  async "state/selectors/projections.ts"() {
    await init_multi_select_view();
    await init_i18n_bridge();
    init_derivations();
    selectMultiSelectProps = (state, ctx) => {
      const question = ctx.questions[ctx.i];
      if (!question) {
        return {
          rows: [],
          other: {
            active: false,
            inputMode: false,
            inputBuffer: ctx.inputBuffer,
            inputCursorOffset: ctx.inputCursorOffset
          },
          nextActive: false,
          nextLabel: displayLabel("next")
        };
      }
      const focused = ctx.activeView === "options";
      const rows = [];
      for (let i = 0; i < question.options.length; i++) {
        rows.push({
          checked: state.multiSelectChecked.has(i),
          active: focused && i === state.optionIndex
        });
      }
      const otherActive = focused && state.optionIndex === question.options.length;
      const nextActive = focused && state.optionIndex === question.options.length + 1;
      const isLastQuestion = ctx.i === ctx.questions.length - 1;
      const nextLabel = isLastQuestion ? MULTI_SUBMIT_LABEL : displayLabel("next");
      return {
        rows,
        other: {
          active: otherActive,
          inputMode: state.inputMode,
          inputBuffer: ctx.inputBuffer,
          inputCursorOffset: ctx.inputCursorOffset
        },
        nextActive,
        nextLabel
      };
    };
    selectOptionListProps = (state, ctx) => {
      const items = ctx.itemsByTab[ctx.i] ?? [];
      const focused = ctx.activeView === "options";
      const confirmed = selectConfirmedIndicator(ctx.questions, state.currentTab, state.answers, items);
      return {
        selectedIndex: state.optionIndex,
        focused,
        inputBuffer: ctx.inputBuffer,
        inputCursorOffset: ctx.inputCursorOffset,
        ...confirmed ? { confirmed } : {}
      };
    };
    selectSubmitPickerProps = (state, ctx) => {
      const focused = ctx.activeView === "submit";
      return {
        rows: [
          { active: focused && state.submitChoiceIndex === 0 },
          { active: focused && state.submitChoiceIndex === 1 }
        ]
      };
    };
    selectPreviewPaneProps = (state, ctx) => ({
      notesVisible: state.notesVisible,
      selectedIndex: state.optionIndex,
      focused: ctx.activeView === "options",
      inputMode: state.inputMode
    });
    selectTabBarProps = (state, ctx) => {
      const tabs = ctx.questions.map((q, i) => ({
        label: q.header && q.header.length > 0 ? q.header : `Q${i + 1}`,
        answered: state.answers.has(i),
        active: i === state.currentTab
      }));
      return {
        tabs,
        submit: {
          active: state.currentTab === ctx.questions.length,
          allAnswered: state.answers.size === ctx.questions.length && ctx.questions.length > 0
        }
      };
    };
    selectDialogProps = (state, ctx) => ({
      state,
      activePreviewPane: ctx.activePreviewPane
    });
  }
});

// state/build-questionnaire.ts
import { getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Editor } from "@earendil-works/pi-tui";
function previewBodyHeights(pane) {
  return (width) => {
    const current = pane.naturalHeight(width);
    return { current, max: Math.max(current, pane.maxNaturalHeight(width)) };
  };
}
function editorTheme(theme) {
  return {
    borderColor: (text) => theme.fg("borderMuted", text),
    selectList: {
      selectedPrefix: (text) => theme.bg("selectedBg", theme.fg("accent", text)),
      selectedText: (text) => theme.bg("selectedBg", theme.bold(text)),
      description: (text) => theme.fg("muted", text),
      scrollInfo: (text) => theme.fg("dim", text),
      noMatch: (text) => theme.fg("warning", text)
    }
  };
}
function multiSelectBodyHeights(view) {
  return (width) => {
    const h = view.naturalHeight(width);
    return { current: h, max: h };
  };
}
function buildQuestionnaire(config) {
  return new QuestionnaireBuilder(config).build();
}
var isActiveTab, QuestionnaireBuilder;
var init_build_questionnaire = __esm({
  async "state/build-questionnaire.ts"() {
    init_component_binding();
    await init_multi_select_view();
    init_option_list_view();
    await init_preview_block_renderer();
    init_preview_layout_decider();
    await init_preview_pane();
    await init_submit_picker();
    init_tab_bar();
    await init_dialog_builder();
    init_props_adapter();
    init_derivations();
    await init_projections();
    isActiveTab = (s, ctx) => ctx.i === selectActivePreviewPaneIndex(s.currentTab, ctx.totalQuestions);
    QuestionnaireBuilder = class {
      tui;
      theme;
      questions;
      itemsByTab;
      isMulti;
      initialState;
      getCurrentTab;
      selectTheme;
      markdownTheme = getMarkdownTheme();
      notesInput;
      inlineInput;
      getTerminalWidth = () => this.tui.terminal.columns;
      getTerminalRows = () => this.tui.terminal.rows;
      constructor(config) {
        this.tui = config.tui;
        this.theme = config.theme;
        this.questions = config.questions;
        this.itemsByTab = config.itemsByTab;
        this.isMulti = config.isMulti;
        this.initialState = config.initialState;
        this.getCurrentTab = config.getCurrentTab;
        this.selectTheme = this.makeSelectTheme();
        const textEditorTheme = editorTheme(this.theme);
        this.notesInput = new Editor(this.tui, textEditorTheme);
        this.inlineInput = new Editor(this.tui, textEditorTheme);
        this.notesInput.disableSubmit = true;
        this.inlineInput.disableSubmit = true;
      }
      build() {
        const tabs = this.buildTabComponents();
        this.injectGlobalLeftWidth(tabs);
        const submitPicker = this.buildSubmitPicker();
        const tabBar = this.buildTabBar();
        const heights = this.buildHeightComputers(tabs);
        const dialog = this.buildDialog(tabs, submitPicker, tabBar, heights);
        const globalBindings = this.buildGlobalBindings(dialog, submitPicker, tabBar);
        const perTabBindings = this.buildPerTabBindings();
        const adapter = this.buildAdapter(tabs, globalBindings, perTabBindings);
        return this.handle(adapter, dialog);
      }
      makeSelectTheme() {
        const t2 = this.theme;
        return {
          selectedText: (s) => t2.fg("accent", t2.bold(s)),
          description: (s) => t2.fg("muted", s),
          scrollInfo: (s) => t2.fg("dim", s)
        };
      }
      buildTabComponents() {
        return this.questions.map((q, i) => this.buildTabFor(q, i));
      }
      buildTabFor(question, index) {
        const optionList = new OptionListView({
          items: this.itemsByTab[index] ?? [],
          theme: this.selectTheme
        });
        const previewBlock = new PreviewBlockRenderer({
          question,
          theme: this.theme,
          markdownTheme: this.markdownTheme
        });
        const preview = new PreviewPane({
          question,
          getTerminalWidth: this.getTerminalWidth,
          optionListView: optionList,
          previewBlock
        });
        const multiSelect = question.multiSelect ? new MultiSelectView(this.theme, question) : void 0;
        const bodyHeights = this.buildBodyHeights(question, preview, multiSelect);
        return { optionList, preview, multiSelect, bodyHeights };
      }
      buildBodyHeights(question, preview, multiSelect) {
        return question.multiSelect ? multiSelectBodyHeights(multiSelect) : previewBodyHeights(preview);
      }
      /**
       * Compute cross-tab max adaptive left width and inject into each PreviewPane.
       * Mirrors buildHeightComputers pattern — iterates all tabs, takes max.
       * Called after buildTabComponents, before buildDialog (so setGlobalLeftWidth
       * is set before any rendering occurs).
       */
      injectGlobalLeftWidth(tabs) {
        const questions = this.questions;
        const itemsByTab = this.itemsByTab;
        const tabsDescriptor = questions.map((q) => ({ multiSelect: q.multiSelect }));
        const globalLeftWidth = (paneWidth) => crossTabLeftWidthWithDonation(tabsDescriptor, itemsByTab, questions, paneWidth);
        for (const tab of tabs) {
          tab.preview.setGlobalLeftWidth(globalLeftWidth);
        }
      }
      buildSubmitPicker() {
        return this.isMulti ? new SubmitPicker(this.theme) : void 0;
      }
      buildTabBar() {
        return this.isMulti ? new TabBar(this.theme) : void 0;
      }
      buildHeightComputers(tabs) {
        const global = (width) => {
          let max = 0;
          for (const tab of tabs) {
            const h = tab.bodyHeights(width).max;
            if (h > max) max = h;
          }
          return Math.max(1, max);
        };
        const current = (width) => {
          const idx = Math.min(this.getCurrentTab(), tabs.length - 1);
          return Math.max(0, tabs[idx]?.bodyHeights(width).current ?? 0);
        };
        return { global, current };
      }
      pickInitialActivePreview(tabs) {
        const idx = selectActivePreviewPaneIndex(this.initialState.currentTab, this.questions.length);
        return tabs[idx]?.preview ?? tabs[0].preview;
      }
      buildDialog(tabs, submitPicker, tabBar, heights) {
        return new DialogView(
          {
            theme: this.theme,
            questions: this.questions,
            tabBar,
            notesInput: this.notesInput,
            isMulti: this.isMulti,
            tabsByIndex: tabs,
            submitPicker,
            getBodyHeight: heights.global,
            getCurrentBodyHeight: heights.current,
            getTerminalRows: this.getTerminalRows
          },
          { state: this.initialState, activePreviewPane: this.pickInitialActivePreview(tabs) }
        );
      }
      buildGlobalBindings(dialog, submitPicker, tabBar) {
        return [
          globalBinding({ component: dialog, select: selectDialogProps }),
          ...submitPicker ? [globalBinding({ component: submitPicker, select: selectSubmitPickerProps })] : [],
          ...tabBar ? [globalBinding({ component: tabBar, select: selectTabBarProps })] : []
        ];
      }
      buildPerTabBindings() {
        return [
          perTabBinding({
            resolve: (tab) => tab.optionList,
            predicate: isActiveTab,
            select: selectOptionListProps
          }),
          perTabBinding({
            resolve: (tab) => tab.preview,
            predicate: isActiveTab,
            select: selectPreviewPaneProps
          }),
          perTabBinding({
            resolve: (tab) => tab.multiSelect,
            select: selectMultiSelectProps
          })
        ];
      }
      buildAdapter(tabs, globalBindings, perTabBindings) {
        return new QuestionnairePropsAdapter({
          tui: this.tui,
          questions: this.questions,
          itemsByTab: this.itemsByTab,
          tabsByIndex: tabs,
          inlineInput: this.inlineInput,
          globalBindings,
          perTabBindings,
          extraInvalidatables: [this.notesInput]
        });
      }
      handle(adapter, dialog) {
        return {
          adapter,
          notesInput: this.notesInput,
          inlineInput: this.inlineInput,
          render: (w) => dialog.render(w),
          invalidate: () => adapter.invalidate()
        };
      }
    };
  }
});

// state/key-router.ts
import { Key, matchesKey } from "@earendil-works/pi-tui";
function isConfirm(kb, data) {
  return kb.matches(data, KEYBIND_CONFIRM) || kb.matches(data, KEYBIND_SUBMIT);
}
function wrapTab(index, total) {
  if (total <= 0) return 0;
  return (index % total + total) % total;
}
function totalTabs(runtime) {
  return runtime.isMulti ? runtime.questions.length + 1 : 1;
}
function computeAutoAdvanceTab(state, runtime) {
  if (!runtime.isMulti) return void 0;
  if (state.currentTab < runtime.questions.length - 1) return state.currentTab + 1;
  return runtime.questions.length;
}
function buildSingleSelectAnswer(state, runtime) {
  const q = runtime.questions[state.currentTab];
  if (!q) return null;
  const item = runtime.currentItem;
  if (state.inputMode) {
    const label = runtime.inputBuffer;
    return {
      questionIndex: state.currentTab,
      question: q.question,
      kind: "custom",
      answer: label.length > 0 ? label : null
    };
  }
  if (!item) return null;
  if (item.kind === "other") {
    return null;
  }
  if (item.kind === "next") {
    return null;
  }
  return {
    questionIndex: state.currentTab,
    question: q.question,
    kind: "option",
    answer: item.label
  };
}
function buildMultiSelected(state, runtime) {
  const q = runtime.questions[state.currentTab];
  if (!q) return [];
  const out = [];
  for (let i = 0; i < q.options.length; i++) {
    if (state.multiSelectChecked.has(i)) {
      const label = q.options[i]?.label;
      if (typeof label === "string") out.push(label);
    }
  }
  return out;
}
function tabSwitchAction(data, state, runtime) {
  if (!runtime.isMulti) return null;
  const total = totalTabs(runtime);
  if (matchesKey(data, Key.tab) || matchesKey(data, Key.right)) {
    return { kind: "tab_switch", nextTab: wrapTab(state.currentTab + 1, total) };
  }
  if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.left)) {
    return { kind: "tab_switch", nextTab: wrapTab(state.currentTab - 1, total) };
  }
  return null;
}
function nextNavOnDown(state, runtime) {
  return {
    kind: "nav",
    nextIndex: wrapTab(state.optionIndex + 1, Math.max(1, runtime.items.length)),
    inputValue: runtime.inputBuffer
  };
}
function prevNavOnUp(state, runtime) {
  return {
    kind: "nav",
    nextIndex: wrapTab(state.optionIndex - 1, Math.max(1, runtime.items.length)),
    inputValue: runtime.inputBuffer
  };
}
function routeKey(data, state, runtime) {
  const kb = runtime.keybindings;
  if (typeof runtime.collapseKey === "string" && runtime.collapseKey !== "off" && matchesKey(data, runtime.collapseKey)) {
    return { kind: "toggle_collapsed" };
  }
  if (state.collapsed) {
    if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "cancel" };
    return { kind: "ignore" };
  }
  if (state.notesVisible) {
    if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "notes_exit" };
    if (kb.matches(data, KEYBIND_NEW_LINE)) return { kind: "notes_forward", data };
    if (isConfirm(kb, data)) return { kind: "notes_exit" };
    return { kind: "notes_forward", data };
  }
  if (state.inputMode) {
    if (kb.matches(data, KEYBIND_NEW_LINE)) return { kind: "ignore" };
    if (isConfirm(kb, data)) {
      const answer = buildSingleSelectAnswer(state, runtime);
      if (!answer) return { kind: "ignore" };
      return { kind: "confirm", answer, autoAdvanceTab: computeAutoAdvanceTab(state, runtime) };
    }
    if (kb.matches(data, KEYBIND_CLEAR)) return { kind: "input_clear" };
    if (kb.matches(data, KEYBIND_EXTERNAL_EDITOR)) return { kind: "input_edit", value: runtime.inputBuffer };
    if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "cancel" };
    if (kb.matches(data, KEYBIND_EDITOR_UP) && runtime.canMoveInputUp) return { kind: "ignore" };
    if (kb.matches(data, KEYBIND_EDITOR_DOWN) && runtime.canMoveInputDown) {
      return { kind: "ignore" };
    }
    if (kb.matches(data, KEYBIND_UP)) return prevNavOnUp(state, runtime);
    if (kb.matches(data, KEYBIND_DOWN)) return nextNavOnDown(state, runtime);
    return { kind: "ignore" };
  }
  if (runtime.isMulti && state.currentTab === runtime.questions.length) {
    if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "cancel" };
    const tab2 = tabSwitchAction(data, state, runtime);
    if (tab2) return tab2;
    if (kb.matches(data, KEYBIND_UP) || kb.matches(data, KEYBIND_DOWN)) {
      const delta = kb.matches(data, KEYBIND_DOWN) ? 1 : -1;
      const next = wrapTab(state.submitChoiceIndex + delta, 2);
      return { kind: "submit_nav", nextIndex: next === 1 ? 1 : 0 };
    }
    if (isConfirm(kb, data)) {
      return state.submitChoiceIndex === 1 ? { kind: "cancel" } : { kind: "submit" };
    }
    return { kind: "ignore" };
  }
  const tab = tabSwitchAction(data, state, runtime);
  if (tab) return tab;
  const q = runtime.questions[state.currentTab];
  if (!q) return { kind: "ignore" };
  if (data === NOTES_ACTIVATE_KEY) {
    return { kind: "notes_enter" };
  }
  if (kb.matches(data, KEYBIND_UP)) {
    return prevNavOnUp(state, runtime);
  }
  if (kb.matches(data, KEYBIND_DOWN)) {
    return nextNavOnDown(state, runtime);
  }
  if (q.multiSelect) {
    const focusedKind = runtime.currentItem?.kind;
    const focusedMeta = focusedKind ? ROW_INTENT_META[focusedKind] : void 0;
    if (data === SPACE_KEY) {
      if (focusedMeta?.blocksMultiToggle) return { kind: "ignore" };
      if (focusedMeta?.activatesInputMode) return { kind: "ignore" };
      return { kind: "toggle", index: state.optionIndex };
    }
    if (isConfirm(kb, data)) {
      if (focusedMeta?.activatesInputMode) return { kind: "ignore" };
      if (!focusedMeta?.autoSubmitsInMulti) return { kind: "toggle", index: state.optionIndex };
      return {
        kind: "multi_confirm",
        selected: buildMultiSelected(state, runtime),
        autoAdvanceTab: computeAutoAdvanceTab(state, runtime)
      };
    }
    if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "cancel" };
    return { kind: "ignore" };
  }
  if (isConfirm(kb, data)) {
    const answer = buildSingleSelectAnswer(state, runtime);
    if (!answer) return { kind: "ignore" };
    return { kind: "confirm", answer, autoAdvanceTab: computeAutoAdvanceTab(state, runtime) };
  }
  if (kb.matches(data, KEYBIND_CANCEL)) return { kind: "cancel" };
  return { kind: "ignore" };
}
var KEYBIND_UP, KEYBIND_DOWN, KEYBIND_CONFIRM, KEYBIND_SUBMIT, KEYBIND_CANCEL, KEYBIND_NEW_LINE, KEYBIND_EDITOR_UP, KEYBIND_EDITOR_DOWN, KEYBIND_CLEAR, KEYBIND_EXTERNAL_EDITOR, NOTES_ACTIVATE_KEY, SPACE_KEY;
var init_key_router = __esm({
  "state/key-router.ts"() {
    init_row_intent();
    KEYBIND_UP = "tui.select.up";
    KEYBIND_DOWN = "tui.select.down";
    KEYBIND_CONFIRM = "tui.select.confirm";
    KEYBIND_SUBMIT = "tui.input.submit";
    KEYBIND_CANCEL = "tui.select.cancel";
    KEYBIND_NEW_LINE = "tui.input.newLine";
    KEYBIND_EDITOR_UP = "tui.editor.cursorUp";
    KEYBIND_EDITOR_DOWN = "tui.editor.cursorDown";
    KEYBIND_CLEAR = "tui.editor.deleteToLineStart";
    KEYBIND_EXTERNAL_EDITOR = "app.editor.external";
    NOTES_ACTIVATE_KEY = "n";
    SPACE_KEY = " ";
  }
});

// state/state-reducer.ts
function orderedAnswers(state, questions) {
  const out = [];
  for (let i = 0; i < questions.length; i++) {
    const a = state.answers.get(i);
    if (a) out.push(a);
  }
  return out;
}
function syncMultiSelectFromAnswers(answers, questions, tab) {
  const q = questions[tab];
  if (!q?.multiSelect) return /* @__PURE__ */ new Set();
  const saved = answers.get(tab);
  const labels = saved?.selected ?? [];
  const indices = /* @__PURE__ */ new Set();
  for (let i = 0; i < q.options.length; i++) {
    if (labels.includes(q.options[i].label)) indices.add(i);
  }
  return indices;
}
function persistMultiSelectAnswer(state, ctx) {
  const q = ctx.questions[state.currentTab];
  if (!q?.multiSelect) return state.answers;
  const selected = [];
  for (let i = 0; i < q.options.length; i++) {
    if (state.multiSelectChecked.has(i)) selected.push(q.options[i].label);
  }
  const out = new Map(state.answers);
  if (selected.length === 0) {
    out.delete(state.currentTab);
    return out;
  }
  const pendingNotes = state.notesByTab.get(state.currentTab);
  out.set(state.currentTab, {
    questionIndex: state.currentTab,
    question: q.question,
    kind: "multi",
    answer: null,
    selected,
    ...pendingNotes && pendingNotes.length > 0 ? { notes: pendingNotes } : {}
  });
  return out;
}
function notesValueFor(state, tab) {
  return state.notesByTab.get(tab) ?? state.answers.get(tab)?.notes ?? "";
}
function customDraftValueFor(state, tab) {
  const draft = state.customDraftsByTab.get(tab);
  if (draft !== void 0) return draft;
  const answer = state.answers.get(tab);
  return answer?.kind === "custom" && typeof answer.answer === "string" ? answer.answer : "";
}
function setCustomDraft(state, tab, value) {
  const drafts = new Map(state.customDraftsByTab);
  drafts.set(tab, value);
  return drafts;
}
function withoutCustomDraft(state, tab) {
  if (!state.customDraftsByTab.has(tab)) return state.customDraftsByTab;
  const drafts = new Map(state.customDraftsByTab);
  drafts.delete(tab);
  return drafts;
}
function switchTabResult(state, nextTab, ctx) {
  const notesValue = notesValueFor(state, nextTab);
  const transitioned = {
    ...state,
    currentTab: nextTab,
    optionIndex: 0,
    inputMode: false,
    notesVisible: false,
    submitChoiceIndex: 0,
    multiSelectChecked: syncMultiSelectFromAnswers(state.answers, ctx.questions, nextTab),
    notesDraft: notesValue
  };
  return {
    state: transitioned,
    effects: [
      { kind: "set_notes_focused", focused: false },
      { kind: "set_notes_value", value: notesValue },
      { kind: "set_input_buffer", value: customDraftValueFor(state, nextTab) }
    ]
  };
}
function doneFor(state, ctx, cancelled) {
  const result = { answers: orderedAnswers(state, ctx.questions), cancelled };
  return { state, effects: [{ kind: "done", result }] };
}
function reduce(state, action, ctx) {
  const handler = HANDLERS[action.kind];
  return handler(state, action, ctx);
}
var navHandler, inputClearHandler, inputEditHandler, inputReplaceHandler, tabSwitchHandler, confirmHandler, toggleHandler, multiConfirmHandler, notesEnterHandler, notesExitHandler, cancelHandler, submitHandler, submitNavHandler, notesForwardHandler, toggleCollapsedHandler, ignoreHandler, HANDLERS;
var init_state_reducer = __esm({
  "state/state-reducer.ts"() {
    init_row_intent();
    navHandler = (state, action, ctx) => {
      const items = ctx.itemsByTab[state.currentTab] ?? [];
      const item = items[action.nextIndex];
      const inputMode = item ? ROW_INTENT_META[item.kind].activatesInputMode : false;
      const customDraftsByTab = state.inputMode ? setCustomDraft(state, state.currentTab, action.inputValue) : state.customDraftsByTab;
      const next = { ...state, optionIndex: action.nextIndex, inputMode, customDraftsByTab };
      if (!inputMode) return { state: next, effects: [] };
      return {
        state: next,
        effects: [{ kind: "set_input_buffer", value: customDraftValueFor(next, state.currentTab) }]
      };
    };
    inputClearHandler = (state, _action, _ctx) => ({
      state: { ...state, customDraftsByTab: setCustomDraft(state, state.currentTab, "") },
      effects: [{ kind: "clear_input_buffer" }]
    });
    inputEditHandler = (state, action, _ctx) => ({
      state,
      effects: [{ kind: "open_input_editor", value: action.value }]
    });
    inputReplaceHandler = (state, action, _ctx) => ({
      state: { ...state, customDraftsByTab: setCustomDraft(state, state.currentTab, action.value) },
      effects: [{ kind: "set_input_buffer", value: action.value }]
    });
    tabSwitchHandler = (state, action, ctx) => switchTabResult(state, action.nextTab, ctx);
    confirmHandler = (state, action, ctx) => {
      let answer = action.answer;
      if (answer.kind === "option" && answer.answer) {
        const q = ctx.questions[answer.questionIndex];
        const matched = q?.options.find((o) => o.label === answer.answer);
        if (matched?.preview && matched.preview.length > 0) {
          answer = { ...answer, preview: matched.preview };
        }
      }
      const pendingNotes = state.notesByTab.get(answer.questionIndex);
      if (pendingNotes && pendingNotes.length > 0) {
        answer = { ...answer, notes: pendingNotes };
      }
      const answers = new Map(state.answers);
      answers.set(answer.questionIndex, answer);
      const isCustomMulti = answer.kind === "custom" && ctx.questions[answer.questionIndex]?.multiSelect === true;
      const customDraftsByTab = answer.kind === "custom" ? withoutCustomDraft(state, answer.questionIndex) : state.customDraftsByTab;
      const next = {
        ...state,
        answers,
        customDraftsByTab,
        ...isCustomMulti ? { multiSelectChecked: /* @__PURE__ */ new Set() } : {}
      };
      if (action.autoAdvanceTab !== void 0) return switchTabResult(next, action.autoAdvanceTab, ctx);
      return doneFor(next, ctx, false);
    };
    toggleHandler = (state, action, ctx) => {
      const checked = new Set(state.multiSelectChecked);
      if (checked.has(action.index)) checked.delete(action.index);
      else checked.add(action.index);
      const intermediate = { ...state, multiSelectChecked: checked };
      const answers = persistMultiSelectAnswer(intermediate, ctx);
      return { state: { ...intermediate, answers }, effects: [] };
    };
    multiConfirmHandler = (state, action, ctx) => {
      const q = ctx.questions[state.currentTab];
      if (!q) return { state, effects: [] };
      const pendingNotes = state.notesByTab.get(state.currentTab);
      const answers = new Map(state.answers);
      answers.set(state.currentTab, {
        questionIndex: state.currentTab,
        question: q.question,
        kind: "multi",
        answer: null,
        selected: action.selected,
        ...pendingNotes && pendingNotes.length > 0 ? { notes: pendingNotes } : {}
      });
      const synced = {
        ...state,
        answers,
        multiSelectChecked: syncMultiSelectFromAnswers(answers, ctx.questions, state.currentTab)
      };
      if (action.autoAdvanceTab !== void 0) return switchTabResult(synced, action.autoAdvanceTab, ctx);
      return doneFor(synced, ctx, false);
    };
    notesEnterHandler = (state, _action, _ctx) => {
      const value = notesValueFor(state, state.currentTab);
      return {
        state: { ...state, notesVisible: true, notesDraft: value },
        effects: [
          { kind: "set_notes_value", value },
          { kind: "set_notes_focused", focused: true }
        ]
      };
    };
    notesExitHandler = (state, _action, _ctx) => {
      const trimmed = state.notesDraft.trim();
      const notes = new Map(state.notesByTab);
      const answers = new Map(state.answers);
      if (trimmed.length === 0) {
        notes.delete(state.currentTab);
        const prev = answers.get(state.currentTab);
        if (prev?.notes) {
          const stripped = { ...prev };
          delete stripped.notes;
          answers.set(state.currentTab, stripped);
        }
      } else {
        notes.set(state.currentTab, trimmed);
        const prev = answers.get(state.currentTab);
        if (prev) answers.set(state.currentTab, { ...prev, notes: trimmed });
      }
      return {
        state: { ...state, notesByTab: notes, answers, notesVisible: false },
        effects: [{ kind: "set_notes_focused", focused: false }]
      };
    };
    cancelHandler = (s, _a, c) => doneFor(s, c, true);
    submitHandler = (s, _a, c) => doneFor(s, c, false);
    submitNavHandler = (s, a, _c) => ({
      state: { ...s, submitChoiceIndex: a.nextIndex },
      effects: []
    });
    notesForwardHandler = (s, a, _c) => ({
      state: s,
      effects: [{ kind: "forward_notes_keystroke", data: a.data }]
    });
    toggleCollapsedHandler = (s, _a, _c) => ({
      state: { ...s, collapsed: !s.collapsed },
      effects: [{ kind: "set_overlay_hidden", hidden: !s.collapsed }]
    });
    ignoreHandler = (s, _a, _c) => ({ state: s, effects: [] });
    HANDLERS = {
      nav: navHandler,
      input_clear: inputClearHandler,
      input_edit: inputEditHandler,
      input_replace: inputReplaceHandler,
      tab_switch: tabSwitchHandler,
      confirm: confirmHandler,
      toggle: toggleHandler,
      multi_confirm: multiConfirmHandler,
      cancel: cancelHandler,
      notes_enter: notesEnterHandler,
      notes_exit: notesExitHandler,
      notes_forward: notesForwardHandler,
      submit: submitHandler,
      submit_nav: submitNavHandler,
      toggle_collapsed: toggleCollapsedHandler,
      ignore: ignoreHandler
    };
  }
});

// state/questionnaire-session.ts
var questionnaire_session_exports = {};
__export(questionnaire_session_exports, {
  QuestionnaireSession: () => QuestionnaireSession
});
function initialState() {
  return {
    currentTab: 0,
    optionIndex: 0,
    inputMode: false,
    notesVisible: false,
    answers: /* @__PURE__ */ new Map(),
    multiSelectChecked: /* @__PURE__ */ new Set(),
    customDraftsByTab: /* @__PURE__ */ new Map(),
    notesByTab: /* @__PURE__ */ new Map(),
    submitChoiceIndex: 0,
    notesDraft: "",
    collapsed: false
  };
}
var QuestionnaireSession;
var init_questionnaire_session = __esm({
  async "state/questionnaire-session.ts"() {
    await init_dialog_builder();
    await init_build_questionnaire();
    await init_i18n_bridge();
    init_key_router();
    init_state_reducer();
    QuestionnaireSession = class {
      state = initialState();
      questions;
      isMulti;
      itemsByTab;
      notesInput;
      inlineInput;
      viewAdapter;
      keybindings;
      editInput;
      collapseKey;
      inputEditorOpen = false;
      /**
       * Overlay handle captured by `ctx.ui.custom`'s `onHandle` callback. Lets the session
       * call `setHidden(true/false)` so pi-tui's overlay stack reflects the collapsed state
       * and overlay-aware consumers (e.g. `pi-station`) can resume normal behaviour.
       */
      overlayHandle;
      tui;
      done;
      component;
      constructor(config) {
        this.tui = config.tui;
        this.done = config.done;
        this.questions = config.params.questions;
        this.isMulti = this.questions.length > 1;
        this.itemsByTab = config.itemsByTab;
        this.keybindings = config.keybindings;
        this.editInput = config.editInput;
        this.collapseKey = config.collapseKey;
        const built = buildQuestionnaire({
          tui: this.tui,
          theme: config.theme,
          questions: this.questions,
          itemsByTab: this.itemsByTab,
          isMulti: this.isMulti,
          initialState: this.state,
          getCurrentTab: () => this.state.currentTab
        });
        this.notesInput = built.notesInput;
        this.inlineInput = built.inlineInput;
        this.viewAdapter = built.adapter;
        const theme = config.theme;
        const collapsedRender = (_width) => [
          theme.fg("dim", ` ${t("hint.expand_line", COLLAPSED_HINT)} `)
        ];
        this.component = {
          render: (width) => this.state.collapsed ? collapsedRender(width) : built.render(width),
          invalidate: built.invalidate,
          handleInput: (data) => this.dispatch(data)
        };
        this.viewAdapter.apply(this.state);
      }
      dispatch(data) {
        if (this.inputEditorOpen) return;
        const action = routeKey(data, this.state, this.runtime());
        if (action.kind === "ignore") {
          this.handleIgnoreInline(data);
          return;
        }
        this.commit(action);
      }
      commit(action) {
        const result = reduce(this.state, action, this.applyContext());
        this.state = result.state;
        for (const effect of result.effects) this.runEffect(effect);
        this.state = this.mirrorNotesDraft(this.state);
        this.viewAdapter.apply(this.state);
      }
      mirrorNotesDraft(s) {
        const draft = this.notesInput.getExpandedText?.() ?? this.notesInput.getText();
        return s.notesDraft === draft ? s : { ...s, notesDraft: draft };
      }
      runEffect(effect) {
        switch (effect.kind) {
          case "set_input_buffer":
            this.inlineInput.setText(effect.value);
            return;
          case "clear_input_buffer":
            this.inlineInput.setText("");
            return;
          case "open_input_editor":
            if (this.inputEditorOpen) return;
            this.inputEditorOpen = true;
            void this.editInput(effect.value).then(
              (value) => {
                this.inputEditorOpen = false;
                if (value !== void 0) this.commit({ kind: "input_replace", value });
              },
              () => {
                this.inputEditorOpen = false;
              }
            );
            return;
          case "set_notes_value":
            this.notesInput.setText(effect.value);
            return;
          case "set_notes_focused":
            this.notesInput.focused = effect.focused;
            return;
          case "forward_notes_keystroke":
            this.notesInput.handleInput(effect.data);
            return;
          case "set_overlay_hidden":
            this.overlayHandle?.setHidden(effect.hidden);
            return;
          case "done":
            this.done(effect.result);
            return;
        }
      }
      /**
       * Per-keystroke `ignore` fast path: delegates text editing to Pi's headless
       * multiline `Editor`, including paste, undo, cursor movement, and configured
       * `tui.input.newLine` handling. `viewAdapter.apply` then projects its public
       * text/cursor state without a reducer round-trip.
       */
      handleIgnoreInline(data) {
        if (!this.state.inputMode) return;
        this.inlineInput.handleInput(data);
        this.viewAdapter.apply(this.state);
      }
      runtime() {
        const cursor = this.inlineInput.getCursor();
        const lastLine = this.inlineInput.getLines().length - 1;
        return {
          keybindings: this.keybindings,
          inputBuffer: this.inlineInput.getExpandedText?.() ?? this.inlineInput.getText(),
          canMoveInputUp: cursor.line > 0,
          canMoveInputDown: cursor.line < lastLine,
          questions: this.questions,
          isMulti: this.isMulti,
          currentItem: this.currentItem(),
          items: this.itemsByTab[this.state.currentTab] ?? [],
          collapseKey: this.collapseKey
        };
      }
      applyContext() {
        return {
          questions: this.questions,
          itemsByTab: this.itemsByTab
        };
      }
      currentItem() {
        const arr = this.itemsByTab[this.state.currentTab] ?? [];
        return this.state.optionIndex < arr.length ? arr[this.state.optionIndex] : void 0;
      }
      /**
       * Setter for the overlay handle, called by `ctx.ui.custom`'s `onHandle` callback once
       * the TUI has created the overlay. Until this is called, `set_overlay_hidden` effects
       * are no-ops — the session still tracks `state.collapsed` for the view layer.
       */
      setOverlayHandle(handle) {
        this.overlayHandle = handle;
      }
      /**
       * Public toggle used by the raw terminal input listener registered in `execute()`.
       * pi-tui does not route input to a hidden overlay's `component.handleInput`, so the
       * raw listener (which fires for terminal data regardless of overlay visibility)
       * reaches the session through this method instead of the dispatch path. Routed
       * through `commit` so the transition stays in the reducer and the overlay hide
       * happens via the `set_overlay_hidden` effect like every other side effect.
       */
      toggleCollapsedExternal() {
        if (!this.inputEditorOpen) this.commit({ kind: "toggle_collapsed" });
      }
    };
  }
});

// state/external-editor.ts
var external_editor_exports = {};
__export(external_editor_exports, {
  editWithExternalEditor: () => editWithExternalEditor
});
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
function runEditor(command, file) {
  const [editor, ...args] = command.split(" ");
  if (!editor) return Promise.reject(new Error("External editor command is empty"));
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [...args, file], {
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? "unknown"}`;
      reject(new Error(`External editor exited with ${reason}`));
    });
  });
}
async function editWithExternalEditor(tui, command, value) {
  const tempDir = mkdtempSync(join(tmpdir(), "rpiv-ask-user-question-"));
  const tempFile = join(tempDir, "answer.md");
  let tuiStopped = false;
  try {
    writeFileSync(tempFile, value, "utf8");
    tui.stop();
    tuiStopped = true;
    process.stdout.write(`Launching external editor: ${command}
Pi will resume when the editor exits.
`);
    await runEditor(command, tempFile);
    return readFileSync(tempFile, "utf8").replace(/\r?\n$/, "");
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
    }
    if (tuiStopped) {
      tui.start();
      tui.requestRender(true);
    }
  }
}
var init_external_editor = __esm({
  "state/external-editor.ts"() {
  }
});

// ask-user-question.ts
import { isKeyRelease, isKeyRepeat, matchesKey as matchesKey2 } from "@earendil-works/pi-tui";

// config.ts
import { loadJsonConfigWithLegacyFallback, validateGuidanceFields } from "@juicesharp/rpiv-config";
var DEFAULT_COLLAPSE_KEY = "ctrl+]";
var COLLAPSE_KEY_OFF = "off";
var SPECIAL_KEYS = /* @__PURE__ */ new Set([
  "escape",
  "esc",
  "enter",
  "return",
  "tab",
  "space",
  "backspace",
  "delete",
  "insert",
  "clear",
  "home",
  "end",
  "pageup",
  "pagedown",
  "up",
  "down",
  "left",
  "right",
  ...Array.from({ length: 12 }, (_, i) => `f${i + 1}`)
]);
var MODIFIERS = /* @__PURE__ */ new Set(["ctrl", "shift", "alt", "super"]);
function isValidCollapseKeySpec(spec) {
  if (!spec) return false;
  if (spec.startsWith("+") || spec.endsWith("+") || spec.includes("++")) return false;
  const parts = spec.split("+");
  const base = parts[parts.length - 1] ?? "";
  const modifiers = parts.slice(0, -1);
  if (modifiers.length !== new Set(modifiers).size) return false;
  if (!modifiers.every((m) => MODIFIERS.has(m))) return false;
  return base.length === 1 ? /[a-z0-9_\-!@#$%^&*()|~`'":;,./<>?[\]{}=\\]/.test(base) : SPECIAL_KEYS.has(base);
}
function resolveCollapseKey(config) {
  const raw = config.collapseKey?.trim().toLowerCase();
  if (raw === void 0 || raw === "") return DEFAULT_COLLAPSE_KEY;
  if (raw === COLLAPSE_KEY_OFF) return COLLAPSE_KEY_OFF;
  return isValidCollapseKeySpec(raw) ? raw : DEFAULT_COLLAPSE_KEY;
}
function loadConfig() {
  return loadJsonConfigWithLegacyFallback("rpiv-ask-user-question");
}

// events.ts
var ASK_USER_PROMPT_EVENT = "rpiv:ask-user:prompt";
var ASK_USER_BLOCKED_EVENT = "rpiv:ask-user:blocked";

// rpc-fallback.ts
await init_i18n_bridge();
var MULTI_SELECT_INSTRUCTIONS = 'Enter the numbers of all that apply, comma-separated (e.g. "1,3"), or type a custom answer as plain text.';
var CUSTOM_ANSWER_TITLE = "Type your answer:";
var MULTI_SELECT_PLACEHOLDER = "1,3";
var MAX_PREVIEW_CHARS = 600;
function hasDialogUI(ui) {
  const u = ui;
  return typeof u?.select === "function" && typeof u?.input === "function";
}
function formatOptionLine(option, index) {
  return `${index + 1}. ${option.label} \u2014 ${option.description}`;
}
function parseIndex(token, count) {
  const i = Number.parseInt(token, 10) - 1;
  return i >= 0 && i < count ? i : null;
}
function buildPreviewBlock(question) {
  const blocks = question.options.flatMap(
    (o, i) => o.preview && o.preview.length > 0 ? [`--- ${i + 1}. ${o.label} preview ---
${o.preview.slice(0, MAX_PREVIEW_CHARS)}`] : []
  );
  return blocks.length > 0 ? `

${blocks.join("\n\n")}` : "";
}
async function runRpcQuestionnaire(ui, params) {
  const answers = [];
  for (let qi = 0; qi < params.questions.length; qi++) {
    const q = params.questions[qi];
    const header = q.header ? `[${q.header}] ` : "";
    const answer = q.multiSelect ? await askMultiSelect(ui, q, qi, header) : await askSingleSelect(ui, q, qi, header);
    if (answer === void 0) return { answers, cancelled: true };
    answers.push(answer);
  }
  return { answers, cancelled: false };
}
async function askSingleSelect(ui, q, questionIndex, header) {
  const options = q.options.map(formatOptionLine);
  options.push(`${q.options.length + 1}. ${displayLabel("other")}`);
  const chosen = await ui.select(`${header}${q.question}${buildPreviewBlock(q)}`, options);
  if (chosen == null) return void 0;
  const idx = parseIndex(chosen, options.length);
  if (idx == null) return void 0;
  if (idx < q.options.length) {
    const o = q.options[idx];
    return {
      questionIndex,
      question: q.question,
      kind: "option",
      answer: o.label,
      preview: o.preview && o.preview.length > 0 ? o.preview : void 0
    };
  }
  const typed = await ui.input(`${header}${q.question}

${t("rpc.custom_answer_title", CUSTOM_ANSWER_TITLE)}`, "");
  if (typed == null) return void 0;
  return { questionIndex, question: q.question, kind: "custom", answer: typed };
}
async function askMultiSelect(ui, q, questionIndex, header) {
  const list = q.options.map(formatOptionLine).join("\n");
  const value = await ui.input(
    `${header}${q.question}

${list}

${t("rpc.multi_instructions", MULTI_SELECT_INSTRUCTIONS)}`,
    MULTI_SELECT_PLACEHOLDER
  );
  if (value == null) return void 0;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { questionIndex, question: q.question, kind: "multi", answer: null, selected: [] };
  }
  const tokens = trimmed.split(/[,\s]+/).filter((tok) => tok.length > 0);
  const indices = tokens.map((tok) => /^\d+\.?$/.test(tok) ? parseIndex(tok, q.options.length) : null);
  if (indices.every((i) => i != null)) {
    const selected = [];
    for (const i of indices) {
      const label = q.options[i].label;
      if (!selected.includes(label)) selected.push(label);
    }
    return { questionIndex, question: q.question, kind: "multi", answer: null, selected };
  }
  return { questionIndex, question: q.question, kind: "custom", answer: trimmed };
}

// ask-user-question.ts
await init_i18n_bridge();
init_row_intent();

// tool/response-envelope.ts
init_format_answer();
var DECLINE_MESSAGE = "User declined to answer questions";
var ENVELOPE_PREFIX = "User has answered your questions:";
var ENVELOPE_SUFFIX = "You can now continue with the user's answers in mind.";
function buildQuestionnaireResponse(result, params) {
  if (!result || result.cancelled) {
    return buildToolResult(DECLINE_MESSAGE, {
      answers: result?.answers ?? [],
      cancelled: true
    });
  }
  const segments = [];
  for (let i = 0; i < params.questions.length; i++) {
    const a = result.answers.find((x) => x.questionIndex === i);
    if (a) segments.push(buildAnswerSegment(a));
  }
  if (segments.length === 0) {
    return buildToolResult(DECLINE_MESSAGE, { answers: result.answers, cancelled: true });
  }
  return buildToolResult(`${ENVELOPE_PREFIX} ${segments.join(" ")} ${ENVELOPE_SUFFIX}`, result);
}
function buildAnswerSegment(a) {
  const parts = [`"${a.question}"="${formatAnswerScalar(a, "envelope")}"`];
  if (a.preview && a.preview.length > 0) parts.push(`selected preview: ${a.preview}`);
  if (a.notes && a.notes.length > 0) parts.push(`user notes: ${a.notes}`);
  return `${parts.join(". ")}.`;
}
function buildToolResult(text, details) {
  return {
    content: [{ type: "text", text }],
    details
  };
}

// tool/types.ts
init_row_intent();
import { Type } from "typebox";
var MAX_QUESTIONS = 4;
var MIN_OPTIONS = 2;
var MAX_OPTIONS = 4;
var MAX_HEADER_LENGTH = 16;
var MAX_LABEL_LENGTH = 60;
var RESERVED_LABELS = ["Other", ROW_INTENT_META.other.label, ROW_INTENT_META.next.label];
var OptionSchema = Type.Object({
  label: Type.String({
    maxLength: MAX_LABEL_LENGTH,
    description: `MAX ${MAX_LABEL_LENGTH} CHARACTERS \u2014 hard limit, requests over the limit are rejected. The display text for this option that the user will see and select. Should be concise (1-5 words) and clearly describe the choice.`
  }),
  description: Type.String({
    description: "Explanation of what this option means or what will happen if chosen. Useful for providing context about trade-offs or implications."
  }),
  preview: Type.Optional(
    Type.String({
      description: "Optional preview content rendered when this option is focused. Use for mockups, code snippets, or visual comparisons that help users compare options. See the tool description for the expected content format."
    })
  )
});
var QuestionSchema = Type.Object({
  question: Type.String({
    description: 'The complete question to ask the user. Should be clear, specific, and end with a question mark. Example: "Which library should we use for date formatting?" If multiSelect is true, phrase it accordingly, e.g. "Which features do you want to enable?"'
  }),
  header: Type.String({
    maxLength: MAX_HEADER_LENGTH,
    description: `MAX ${MAX_HEADER_LENGTH} CHARACTERS \u2014 hard limit, requests over the limit are rejected. Very short chip/tag shown next to the question. Examples: "Auth method", "Library", "Approach".`
  }),
  options: Type.Array(OptionSchema, {
    minItems: MIN_OPTIONS,
    maxItems: MAX_OPTIONS,
    description: "The available choices for this question. Must have 2-4 options. Each option should be a distinct, mutually exclusive choice (unless multiSelect is enabled). The 'Type something.' row is appended automatically \u2014 do NOT author it."
  }),
  multiSelect: Type.Optional(
    Type.Boolean({
      default: false,
      description: "Set to true to allow the user to select multiple options instead of just one. Use when choices are not mutually exclusive."
    })
  )
});
var QuestionsSchema = Type.Array(QuestionSchema, {
  minItems: 1,
  maxItems: MAX_QUESTIONS,
  description: "Questions to ask the user (1-4 questions)"
});
var QuestionParamsSchema = Type.Object({
  questions: QuestionsSchema
});

// tool/validate-questionnaire.ts
var ERROR_NO_QUESTIONS = "Error: At least one question is required";
var ERROR_TOO_MANY_QUESTIONS = `Error: At most ${MAX_QUESTIONS} questions are allowed per invocation`;
var ERROR_DUPLICATE_QUESTION = "Error: Question text must be unique within an invocation";
var ERROR_TOO_FEW_OPTIONS = `Error: Each question requires at least ${MIN_OPTIONS} options`;
var ERROR_RESERVED_LABEL = `Error: Option label is reserved (${RESERVED_LABELS.join(", ")})`;
var ERROR_DUPLICATE_OPTION_LABEL = "Error: Option labels must be unique within a question";
var RESERVED_LABEL_SET2 = new Set(RESERVED_LABELS);
function validateQuestionnaire(typed) {
  if (typed.questions.length === 0) {
    return { ok: false, error: "no_questions", message: ERROR_NO_QUESTIONS };
  }
  if (typed.questions.length > MAX_QUESTIONS) {
    return { ok: false, error: "too_many_questions", message: ERROR_TOO_MANY_QUESTIONS };
  }
  const seenQuestions = /* @__PURE__ */ new Set();
  for (const q of typed.questions) {
    if (seenQuestions.has(q.question)) {
      return { ok: false, error: "duplicate_question", message: ERROR_DUPLICATE_QUESTION };
    }
    seenQuestions.add(q.question);
  }
  for (const q of typed.questions) {
    if (q.options.length < MIN_OPTIONS) {
      return { ok: false, error: "empty_options", message: ERROR_TOO_FEW_OPTIONS };
    }
    const seenLabels = /* @__PURE__ */ new Set();
    for (const o of q.options) {
      if (RESERVED_LABEL_SET2.has(o.label)) {
        return { ok: false, error: "reserved_label", message: ERROR_RESERVED_LABEL };
      }
      if (seenLabels.has(o.label)) {
        return {
          ok: false,
          error: "duplicate_option_label",
          message: ERROR_DUPLICATE_OPTION_LABEL
        };
      }
      seenLabels.add(o.label);
    }
  }
  return { ok: true };
}

// ask-user-question.ts
function emitAskUserPromptEvent(pi, params) {
  const payload = {
    questions: params.questions.map((q) => ({
      question: q.question,
      header: q.header,
      multiSelect: q.multiSelect ?? false,
      options: q.options.map((o) => ({
        label: o.label,
        description: o.description,
        hasPreview: typeof o.preview === "string" && o.preview.length > 0
      }))
    }))
  };
  pi.events.emit(ASK_USER_PROMPT_EVENT, payload);
}
function emitAskUserBlockedEvent(pi, active) {
  const payload = { active };
  pi.events.emit(ASK_USER_BLOCKED_EVENT, payload);
}
var ASK_USER_QUESTION_TOOL_NAME = "ask_user_question";
var ERROR_NO_UI = "Error: UI not available (running in non-interactive mode)";
var ERROR_NO_CUSTOM_UI = "Error: this client cannot render the questionnaire (custom UI is unavailable, e.g. RPC/ACP hosts such as Zed or Paseo). The user never saw the questions \u2014 do NOT treat this as a decline. Ask the questions as plain chat text instead, without using this tool.";
var ERROR_SESSION_LOAD_FAILED = "Error: the questionnaire UI failed to load \u2014 the host's installed dependencies were likely replaced or removed on disk while Pi was running (e.g. a package-manager install touched the store). The user never saw the questions \u2014 do NOT treat this as a decline. Ask the questions as plain chat text instead, and tell the user that restoring this tool requires repairing the install if needed and restarting Pi.";
var ERROR_STALE_MODULE_CACHE = "Error: the questionnaire UI cannot load \u2014 the host's module cache went stale after an earlier failed load (typically dependencies replaced on disk mid-session). This is unrecoverable within the current Pi process. The user never saw the questions \u2014 do NOT treat this as a decline. Ask the questions as plain chat text instead, and tell the user to restart Pi to restore this tool.";
var BEL = "\x07";
function emitTerminalAttention() {
  try {
    if (process.stdout.isTTY) process.stdout.write(BEL);
  } catch {
  }
}
var PREWARM_DELAY_MS = 2e3;
async function loadQuestionnaireSession() {
  let mod;
  try {
    mod = await init_questionnaire_session().then(() => questionnaire_session_exports);
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "session_load_failed", message: `${ERROR_SESSION_LOAD_FAILED} (cause: ${cause})` };
  }
  if (typeof mod.QuestionnaireSession !== "function") {
    const keys = JSON.stringify(Object.keys(mod));
    return {
      ok: false,
      error: "stale_module_cache",
      message: `${ERROR_STALE_MODULE_CACHE} (resolved namespace keys: ${keys})`
    };
  }
  return { ok: true, module: mod };
}
function buildItemsForQuestion(question) {
  const items = question.options.map((o) => ({
    kind: "option",
    label: o.label,
    description: o.description
  }));
  for (const kind of sentinelsToAppend(question)) {
    items.push({ kind, label: displayLabel(kind) });
  }
  return items;
}
var DEFAULT_PROMPT_SNIPPET = `Ask the user up to ${MAX_QUESTIONS} structured questions (${MIN_OPTIONS}-${MAX_OPTIONS} options each) when requirements are ambiguous`;
var DEFAULT_PROMPT_GUIDELINES = [
  `Use ask_user_question whenever the user's request is underspecified and you cannot proceed without concrete decisions \u2014 you can ask up to ${MAX_QUESTIONS} questions per invocation.`,
  `Each question MUST have ${MIN_OPTIONS}-${MAX_OPTIONS} options. Every option requires a concise label (1-5 words) and a description explaining what the choice means or its trade-offs. The user can additionally type a custom answer via the automatically appended "Type something." row on every question, or press Esc to abandon the questionnaire. Do NOT author "Other" or "Type something." labels yourself \u2014 reserved labels are rejected at runtime.`,
  `Set multiSelect: true when multiple answers are valid. Provide an options[].preview markdown string when an option benefits from richer side-by-side context (mockups, code snippets, diagrams, configs) \u2014 single-select only. The "Type something." row is appended to every question; in preview mode it expands to the full pane width while typing so the custom answer is not cramped into the narrow options column. If you recommend a specific option, make that the first option and append "(Recommended)" to its label.`,
  "Do not stack multiple ask_user_question calls back-to-back \u2014 group all clarifying questions into one invocation."
];
var DEFAULT_TOOL_DESCRIPTION = `Ask the user one or more structured questions during execution. Use when you need to:
1. Gather user preferences or requirements
2. Clarify ambiguous instructions
3. Get decisions on implementation choices as you work
4. Offer choices to the user about what direction to take

Usage notes:
- Users can type a custom answer via the automatically appended "Type something." row on every question or press Esc to abandon the questionnaire. Do NOT author "Other" or "Type something." labels yourself \u2014 reserved labels are rejected at runtime.
- Use multiSelect: true when multiple answers are valid. The "Type something." row is available on every question, including when options carry a \`preview\`; in preview mode it expands to the full pane width while typing so the custom answer is not cramped into the narrow options column.
- If you recommend a specific option, make that the first option in the list and add "(Recommended)" at the end of the label.

Preview feature:
Use the optional \`preview\` field on options when presenting concrete artifacts that users need to visually compare:
- ASCII mockups of UI layouts or components
- Code snippets showing different implementations
- Diagram variations
- Configuration examples

Preview content is rendered as markdown in a monospace box. Multi-line text with newlines is supported. When any option has a preview, the UI switches to a side-by-side layout with a vertical option list on the left and preview on the right. Do not use previews for simple preference questions where labels and descriptions suffice. Note: previews are only supported for single-select questions (not multiSelect).`;
function registerAskUserQuestionTool(pi) {
  const guidance = validateGuidanceFields(loadConfig().guidance);
  pi.registerTool({
    name: ASK_USER_QUESTION_TOOL_NAME,
    label: "Ask User Question",
    description: guidance.description ?? DEFAULT_TOOL_DESCRIPTION,
    promptSnippet: guidance.promptSnippet ?? DEFAULT_PROMPT_SNIPPET,
    promptGuidelines: guidance.promptGuidelines ?? DEFAULT_PROMPT_GUIDELINES,
    parameters: QuestionParamsSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const typed = params;
      if (!ctx.hasUI) return buildToolResult(ERROR_NO_UI, { answers: [], cancelled: true, error: "no_ui" });
      const validation = validateQuestionnaire(typed);
      if (!validation.ok) {
        return buildToolResult(validation.message, {
          answers: [],
          cancelled: true,
          error: validation.error
        });
      }
      emitAskUserPromptEvent(pi, typed);
      if (ctx.mode === "rpc" && hasDialogUI(ctx.ui)) {
        emitAskUserBlockedEvent(pi, true);
        try {
          emitTerminalAttention();
          return buildQuestionnaireResponse(await runRpcQuestionnaire(ctx.ui, typed), typed);
        } finally {
          emitAskUserBlockedEvent(pi, false);
        }
      }
      const itemsByTab = typed.questions.map((q) => buildItemsForQuestion(q));
      const sessionLoad = await loadQuestionnaireSession();
      if (!sessionLoad.ok) {
        return buildToolResult(sessionLoad.message, { answers: [], cancelled: true, error: sessionLoad.error });
      }
      const { QuestionnaireSession: QuestionnaireSession2 } = sessionLoad.module;
      const collapseKey = resolveCollapseKey(loadConfig());
      const sessionRef = { current: null };
      const overlayHandleRef = {
        current: void 0
      };
      let hasAnnouncedHide = false;
      let removeOverlayInputListener;
      if (collapseKey !== "off" && typeof ctx.ui.onTerminalInput === "function") {
        removeOverlayInputListener = ctx.ui.onTerminalInput((data) => {
          const handle = overlayHandleRef.current;
          if (!handle) return void 0;
          if (!handle.isHidden() && !handle.isFocused()) return void 0;
          if (!matchesKey2(data, collapseKey)) return void 0;
          if (isKeyRelease(data) || isKeyRepeat(data)) return { consume: true };
          sessionRef.current?.toggleCollapsedExternal();
          if (handle.isHidden() && !hasAnnouncedHide) {
            hasAnnouncedHide = true;
            ctx.ui.notify?.(`ask_user_question hidden \u2014 press ${collapseKey} to reopen`, "info");
          }
          return { consume: true };
        });
      }
      emitAskUserBlockedEvent(pi, true);
      try {
        emitTerminalAttention();
        const result = await ctx.ui.custom(
          (tui, theme, keybindings, done) => {
            const session = new QuestionnaireSession2({
              tui,
              theme,
              params: typed,
              itemsByTab,
              done,
              keybindings,
              editInput: async (value) => {
                try {
                  const [{ SettingsManager }, { editWithExternalEditor: editWithExternalEditor2 }] = await Promise.all([
                    import("@earendil-works/pi-coding-agent"),
                    Promise.resolve().then(() => (init_external_editor(), external_editor_exports))
                  ]);
                  const editorCommand = SettingsManager.create(ctx.cwd, void 0, {
                    projectTrusted: ctx.isProjectTrusted()
                  }).getExternalEditorCommand();
                  if (!editorCommand) throw new Error("No external editor command is configured");
                  return await editWithExternalEditor2(tui, editorCommand, value);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  ctx.ui.notify(`${t("editor.failed", "External editor failed")}: ${message}`, "error");
                  return void 0;
                }
              },
              collapseKey
            });
            sessionRef.current = session;
            return session.component;
          },
          {
            overlay: true,
            overlayOptions: {
              anchor: "bottom-center",
              width: "100%",
              maxHeight: "100%",
              margin: { left: 0, right: 0, bottom: 0 }
            },
            onHandle: (handle) => {
              overlayHandleRef.current = handle;
              sessionRef.current?.setOverlayHandle(handle);
            }
          }
        );
        if (result === void 0) {
          if (hasDialogUI(ctx.ui)) {
            return buildQuestionnaireResponse(await runRpcQuestionnaire(ctx.ui, typed), typed);
          }
          return buildToolResult(ERROR_NO_CUSTOM_UI, { answers: [], cancelled: true, error: "no_custom_ui" });
        }
        return buildQuestionnaireResponse(result, typed);
      } finally {
        removeOverlayInputListener?.();
        emitAskUserBlockedEvent(pi, false);
      }
    }
  });
  const timer = setTimeout(() => void loadQuestionnaireSession().catch(() => void 0), PREWARM_DELAY_MS);
  timer.unref?.();
}

// reconcile.ts
function reconcileAskUserQuestionTool(pi, ctx) {
  const active = pi.getActiveTools();
  const hasTool = active.includes(ASK_USER_QUESTION_TOOL_NAME);
  if (!ctx.hasUI && hasTool) {
    pi.setActiveTools(active.filter((n) => n !== ASK_USER_QUESTION_TOOL_NAME));
  } else if (ctx.hasUI && !hasTool) {
    pi.setActiveTools([...active, ASK_USER_QUESTION_TOOL_NAME]);
  }
}
function registerAskUserQuestionReconciler(pi) {
  pi.on("before_agent_start", (_event, ctx) => reconcileAskUserQuestionTool(pi, ctx));
}

// index.ts
await init_i18n_bridge();
try {
  const sdk = await import("@juicesharp/rpiv-i18n/loader");
  sdk.registerLocalesFromDir(I18N_NAMESPACE, import.meta.url, { label: "rpiv-ask-user-question" });
} catch {
}
function index_default(pi) {
  registerAskUserQuestionTool(pi);
  registerAskUserQuestionReconciler(pi);
}
export {
  ASK_USER_BLOCKED_EVENT,
  ASK_USER_PROMPT_EVENT,
  index_default as default
};
