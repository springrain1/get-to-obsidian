"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpOpt = exports.flomoDate = void 0;
function flomoDate(daysAgo = 0) {
    const date = new Date();
    const last = new Date(date.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const dd = String(last.getDate()).padStart(2, '0');
    const mm = String(last.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = last.getFullYear().toString();
    return [yyyy, mm, dd];
}
exports.flomoDate = flomoDate;
function createExpOpt(contentEl, label) {
    const expOptionBlock = contentEl.createEl("div", { cls: "expOptionBlock" });
    const expOptionLabel = expOptionBlock.createEl("label");
    const optBox = expOptionLabel.createEl("input", { type: "checkbox", cls: "ckbox" });
    expOptionLabel.createEl("small", { text: label });
    return optBox;
}
exports.createExpOpt = createExpOpt;
