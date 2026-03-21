# Excel Import Feature - Code Changes Reference

## Summary of Changes

This document outlines all code changes made to implement the Excel import feature.

## 1. Backend Changes

### File: `server/routes.ts`

#### Addition 1: Import xlsx library
```typescript
import * as XLSX from "xlsx";
```

#### Addition 2: Excel upload endpoint
Added after the `/api/questions/bulk` endpoint (around line 299):

```typescript
// Excel file upload endpoint
app.post("/api/questions/upload-excel", isAuthenticated, async (req, res) => {
  try {
    const { subjectId, fileBuffer, fileName } = req.body;

    if (!subjectId || !fileBuffer) {
      return res.status(400).json({ message: "Missing subjectId or file" });
    }

    // Convert base64 string to buffer
    const buffer = Buffer.from(fileBuffer, "base64");

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!worksheet) {
      return res.status(400).json({ message: "No worksheet found in the Excel file" });
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];
    
    if (rows.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const questionsData = [];
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Validate row has at least 5 columns
      if (!row || row.length < 5) {
        errors.push(`Row ${rowNumber}: Must have 5 columns (question and 4 options)`);
        continue;
      }

      const questionText = String(row[0] || "").trim();
      const option1 = String(row[1] || "").trim();
      const option2 = String(row[2] || "").trim();
      const option3 = String(row[3] || "").trim();
      const option4 = String(row[4] || "").trim();

      // Validate question is not empty
      if (!questionText) {
        errors.push(`Row ${rowNumber}: Question text is required`);
        continue;
      }

      // Validate all options are not empty
      if (!option1 || !option2 || !option3 || !option4) {
        errors.push(`Row ${rowNumber}: All four options are required`);
        continue;
      }

      questionsData.push({
        question: {
          questionText,
          imageUrl: null,
          year: null,
          difficulty: null,
          topic: null,
        },
        answers: [
          { answerText: option1, isCorrect: false, explanation: null },
          { answerText: option2, isCorrect: false, explanation: null },
          { answerText: option3, isCorrect: false, explanation: null },
          { answerText: option4, isCorrect: false, explanation: null },
        ],
      });
    }

    if (questionsData.length === 0) {
      return res.status(400).json({
        success: false,
        questionsUploaded: 0,
        errors: errors.length > 0 ? errors : ["No valid questions found in the file"],
      });
    }

    // Upload questions
    const count = await storage.bulkCreateQuestions(parseInt(subjectId), questionsData);

    res.json({
      success: true,
      questionsUploaded: count,
      errors: errors.length > 0 ? errors : [],
    });
  } catch (error) {
    console.error("Error uploading Excel file:", error);
    res.status(500).json({ message: "Failed to process Excel file" });
  }
});
```

## 2. Frontend Changes

### File: `client/src/components/ExcelUploader.tsx` (NEW FILE)

Complete new component file created with:
- Drag and drop file upload
- File browser selection
- File validation (xlsx, xls formats)
- Upload progress tracking
- Error and success messaging
- Template download button

See the full file content in the project for complete implementation.

### File: `client/src/lib/excel-template.ts` (NEW FILE)

```typescript
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
```

### File: `client/src/pages/questions/index.tsx`

#### Addition 1: Import statements
Added at the top:
```typescript
import { Upload } from "lucide-react";  // Added to existing imports
import ExcelUploader from "@/components/ExcelUploader";  // NEW import
```

#### Addition 2: New state variables
```typescript
const [showExcelUploader, setShowExcelUploader] = useState(false);
const [selectedSubjectForUpload, setSelectedSubjectForUpload] = useState<number | null>(null);
```

#### Addition 3: Updated header section
Changed the header buttons from:
```typescript
<Button asChild data-testid="button-add-question">
  <Link href="/questions/new">
    <Plus className="h-4 w-4 mr-2" />
    Add Question
  </Link>
</Button>
```

To:
```typescript
<div className="flex gap-2">
  <Button 
    variant="outline"
    onClick={() => setShowExcelUploader(true)}
    data-testid="button-import-excel"
  >
    <Upload className="h-4 w-4 mr-2" />
    Import Excel
  </Button>
  <Button asChild data-testid="button-add-question">
    <Link href="/questions/new">
      <Plus className="h-4 w-4 mr-2" />
      Add Question
    </Link>
  </Button>
</div>
```

#### Addition 4: Excel Upload Dialog
Added before the closing `</div>` tag of the main component:

```typescript
{/* Excel Upload Dialog */}
<Dialog open={showExcelUploader} onOpenChange={setShowExcelUploader}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Import Questions from Excel</DialogTitle>
    </DialogHeader>
    
    {!selectedSubjectForUpload ? (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          First, select which subject you want to import questions into:
        </p>
        <div className="space-y-2">
          {subjects && subjects.length > 0 ? (
            <Select 
              value={selectedSubjectForUpload?.toString() || ""} 
              onValueChange={(value) => setSelectedSubjectForUpload(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name} ({subject.exam?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subjects available. Please create a subject first.
            </p>
          )}
        </div>
      </div>
    ) : (
      <ExcelUploader
        subjectId={selectedSubjectForUpload}
        onSuccess={() => {
          setShowExcelUploader(false);
          setSelectedSubjectForUpload(null);
        }}
        onClose={() => {
          setShowExcelUploader(false);
          setSelectedSubjectForUpload(null);
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

## 3. Dependencies

### Added to `package.json`
```json
"dependencies": {
  "xlsx": "^0.18.0"
}
```

**Installation command**:
```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

## 4. Documentation Files Created

1. **EXCEL_IMPORT_GUIDE.md** - User documentation and guide
2. **IMPLEMENTATION_SUMMARY.md** - Feature overview and architecture
3. **DEVELOPER_GUIDE.md** - Technical developer documentation
4. **CODE_CHANGES_REFERENCE.md** - This file

## 5. File Structure After Changes

```
Exam-Archive/
├── client/
│   └── src/
│       ├── components/
│       │   └── ExcelUploader.tsx (NEW)
│       ├── lib/
│       │   └── excel-template.ts (NEW)
│       └── pages/
│           └── questions/
│               └── index.tsx (MODIFIED)
├── server/
│   └── routes.ts (MODIFIED)
├── EXCEL_IMPORT_GUIDE.md (NEW)
├── IMPLEMENTATION_SUMMARY.md (NEW)
├── DEVELOPER_GUIDE.md (NEW)
└── CODE_CHANGES_REFERENCE.md (NEW)
```

## 6. No Breaking Changes

All changes are additive:
- ✅ Existing endpoints unchanged
- ✅ Existing database schema unchanged
- ✅ Existing UI functionality preserved
- ✅ Backward compatible with existing code

## 7. Testing Checklist

- [ ] Component renders without errors
- [ ] File upload accepts .xlsx files
- [ ] File upload accepts .xls files
- [ ] File upload rejects non-Excel files
- [ ] Drag and drop works correctly
- [ ] Questions are created in database
- [ ] Answers are associated with questions
- [ ] Validation errors are displayed
- [ ] Success messages show correct count
- [ ] Data refreshes after upload
- [ ] Template download works
- [ ] Dialog closes after successful upload

## 8. Rollback Instructions

If needed to rollback changes:

1. Restore original `server/routes.ts`:
   - Remove the Excel upload endpoint
   - Remove `import * as XLSX from "xlsx"`

2. Restore original `client/src/pages/questions/index.tsx`:
   - Remove `showExcelUploader` and `selectedSubjectForUpload` state
   - Remove "Import Excel" button
   - Remove Excel upload dialog
   - Remove ExcelUploader import

3. Delete new files:
   - `client/src/components/ExcelUploader.tsx`
   - `client/src/lib/excel-template.ts`

4. Delete documentation files:
   - `EXCEL_IMPORT_GUIDE.md`
   - `IMPLEMENTATION_SUMMARY.md`
   - `DEVELOPER_GUIDE.md`

5. Remove dependency (optional):
   ```bash
   npm uninstall xlsx @types/xlsx
   ```
