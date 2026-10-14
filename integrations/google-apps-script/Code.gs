// Deploy as a Web app that executes as the sheet owner and allows anyone to access.
// The invitation embeds the hosted form, so guests do not need Google accounts.
const SPREADSHEET_ID = "17eTG3PZ0L_HZR9MJJTKnV9LYUyKryPpMPZxCWLNfZHY";
const SHEET_NAME = "RSVPs";

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle("Diwali Night Guest List");
}

function doPost(e) {
  try {
    return json_(saveRsvp_(JSON.parse(e.postData.contents || "{}")));
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "Could not save RSVP" });
  }
}

function submitRsvp(input) {
  return saveRsvp_(input);
}

function saveRsvp_(input) {
  let lock;
  let locked = false;
  try {
    const name = String(input.full_name || "").trim();
    const contact = String(input.contact || "").trim();
    const alcohol = String(input.alcohol || "");
    const id = String(input.submission_id || "");

    if (!name || name.length > 80 || !contact || contact.length > 120 ||
        !["Yes", "No"].includes(alcohol) || !/^[0-9a-f-]{36}$/i.test(id) || input.website) {
      return { ok: false, error: "Invalid RSVP" };
    }

    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    locked = true;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("RSVP sheet not found");

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
      if (ids.some(row => row[0] === id)) return { ok: true, duplicate: true };
    }

    sheet.appendRow([new Date(), safeCell_(name), safeCell_(contact), alcohol, id]);
    SpreadsheetApp.flush();
    return { ok: true, duplicate: false };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Could not save RSVP" };
  } finally {
    if (locked) lock.releaseLock();
  }
}

function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
