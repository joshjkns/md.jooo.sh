import assert from "node:assert/strict";
import test from "node:test";
import { insertMarkdown } from "./markdown.ts";

test("insertMarkdown wraps selected text", () => {
  assert.deepEqual(insertMarkdown("make this bold", 5, 9, "**", "**"), {
    content: "make **this** bold",
    selectionStart: 7,
    selectionEnd: 11,
  });
});

test("insertMarkdown inserts and selects a placeholder", () => {
  assert.deepEqual(insertMarkdown("", 0, 0, "`", "`", "code"), {
    content: "`code`",
    selectionStart: 1,
    selectionEnd: 5,
  });
});
