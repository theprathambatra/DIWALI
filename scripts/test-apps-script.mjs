import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const rows = [["Submitted at (IST)", "Name", "Email / Instagram", "Alcohol (Yes/No)", "Submission ID"]];
const sheet = {
  getLastRow: () => rows.length,
  getRange: (row, col, count) => ({ getValues: () => rows.slice(row - 1, row - 1 + count).map(item => [item[col - 1]]) }),
  appendRow: row => rows.push(row),
};
const context = {
  console,
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
  HtmlService: { XFrameOptionsMode: { ALLOWALL: "ALLOWALL" }, createHtmlOutputFromFile: name => ({ name, setXFrameOptionsMode() { return this; }, setTitle() { return this; } }) },
};
vm.createContext(context);
vm.runInContext(await fs.readFile(new URL("../integrations/google-apps-script/Code.gs", import.meta.url), "utf8"), context);
assert.equal(context.doGet().name, "Index");
const payload = { full_name: "Test Guest", contact: "@guest", alcohol: "No", submission_id: "8eeb9c5d-7f78-4d2c-82a0-0f99722a7a41" };
const submit = value => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(value) } }).text);
assert.equal(submit(payload).ok, true);
assert.equal(rows.length, 2);
assert.equal(rows[1][1], "Test Guest");
assert.equal(rows[1][3], "No");
assert.equal(submit(payload).duplicate, true);
assert.equal(rows.length, 2);
assert.equal(submit({ ...payload, submission_id: "not-an-id" }).ok, false);
assert.equal(rows.length, 2);
const second = { ...payload, full_name: "Another Guest", alcohol: "Yes", submission_id: "e2ed767b-3c32-4d6b-99d4-040f2e49e6f5" };
assert.equal(context.submitRsvp(second).ok, true);
assert.equal(rows.length, 3);
assert.equal(rows[2][3], "Yes");
assert.equal(context.submitRsvp(second).duplicate, true);
assert.equal(rows.length, 3);
console.log("Apps Script append, duplicate, and validation checks passed");
