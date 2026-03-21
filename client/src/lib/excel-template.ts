import * as XLSX from "xlsx";

export function downloadExcelTemplate(): void {
  // Create sample data
  const sampleData = [
    ["What is the capital of France?", "Paris", "London", "Berlin", "Madrid"],
    ["Which planet is known as the Red Planet?", "Mars", "Venus", "Jupiter", "Saturn"],
    ["What is the largest ocean on Earth?", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
  ];

  // Create a new workbook
  const ws = XLSX.utils.aoa_to_sheet(sampleData);

  // Set column widths
  ws["!cols"] = [
    { wch: 50 }, // Question column
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
  ];

  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  // Generate file
  XLSX.writeFile(wb, "questions_template.xlsx");
}
