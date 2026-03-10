const ExcelJS = require('exceljs');
async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  const row = ws.addRow([1, 2, 3]);
  try {
     console.log("Calling getCell(undefined)");
     row.getCell(undefined);
  } catch(e) {
     console.log("Caught:", e.message);
  }
}
test().catch(console.error);
