const ExcelJS = require('exceljs');
async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow([1, 2, 3]);
  const imageId = wb.addImage({
    base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    extension: 'png',
  });
  ws.addImage(imageId, {
    tl: { col: 0, row: 5 }, // row 5 is currently empty/not created!
    ext: { width: 50, height: 50 },
  });
  await wb.xlsx.writeFile('test.xlsx');
  
  const wb2 = new ExcelJS.Workbook();
  try {
    await wb2.xlsx.readFile('test.xlsx');
    console.log("Read successfully");
  } catch(e) {
    console.log("Error during readFile:", e.message);
  }
  const ws2 = wb2.worksheets[0];
  console.log("Images length:", ws2.getImages().length);
  for (const img of ws2.getImages()) {
    try {
        console.log("tl:", img.range.tl.nativeRow, img.range.tl.row);
    } catch (e) {
        console.log("Error getting tl:", e.message);
    }
  }
}
test().catch(console.error);
