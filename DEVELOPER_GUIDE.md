# Excel Import Feature - Developer Guide

## Architecture Overview

```
Frontend (React)
├── Pages
│   └── questions/index.tsx (updated with Import button)
├── Components
│   └── ExcelUploader.tsx (new)
└── Libraries
    └── excel-template.ts (new)
         ↓
         ↓ (HTTP Request)
         ↓
Backend (Express)
├── Routes
│   └── routes.ts (added /api/questions/upload-excel)
├── Storage Layer
│   └── storage.ts (uses bulkCreateQuestions method)
└── Database
    └── PostgreSQL (inserts questions and answers)
```

## Component Structure

### ExcelUploader Component
**Location**: `client/src/components/ExcelUploader.tsx`

**Props**:
```typescript
interface ExcelUploaderProps {
  subjectId: number;          // Subject to import questions into
  onSuccess?: () => void;     // Callback after successful upload
  onClose?: () => void;       // Callback to close the dialog
}
```

**Main Features**:
- Drag and drop support
- File validation (xlsx, xls)
- Progress tracking
- Error reporting
- Template download

**Dependencies**:
- `@tanstack/react-query` for mutations
- `xlsx` for parsing (on backend)
- UI components from `@/components/ui/`

### Backend Endpoint
**Location**: `server/routes.ts`

**Endpoint**: `POST /api/questions/upload-excel`

**Request Body**:
```typescript
{
  subjectId: number;          // Subject ID
  fileBuffer: string;         // Base64 encoded Excel file
  fileName: string;           // Original filename
}
```

**Response**:
```typescript
{
  success: boolean;
  questionsUploaded: number;
  errors: string[];           // Validation error messages
}
```

**Process Flow**:
1. Receive base64-encoded file
2. Decode and parse with XLSX library
3. Extract first worksheet
4. Iterate through rows:
   - Validate 5 columns present
   - Validate non-empty question and options
   - Collect valid rows
5. Insert into database using `bulkCreateQuestions`
6. Return upload report

## Data Flow

### File Upload Process
```
1. User selects file in frontend
   └─> FileReader reads file as ArrayBuffer
       └─> Convert to base64
           └─> Send to server
```

### Backend Processing
```
1. Receive base64 in request
   └─> Convert from base64 to Buffer
       └─> Parse with XLSX.read()
           └─> Extract worksheet data
               └─> Validate each row
                   └─> Create questions with answers
                       └─> Return statistics
```

### Frontend Response Handling
```
1. Receive response from server
   └─> Check success flag
       ├─> Show success toast
       ├─> Invalidate React Query cache
       ├─> Close dialog
       └─> Refresh questions list
```

## File Format Details

### Excel Structure
```
Row 1: [Question] [Option A] [Option B] [Option C] [Option D]
Row 2: [Question] [Option A] [Option B] [Option C] [Option D]
...
```

### Example Data
```
What is 2+2?|3|4|5|6
What is the capital of France?|London|Paris|Berlin|Madrid
```

### Validation Rules
```javascript
// Each row must have:
- Exactly 5 columns (or more, extras ignored)
- Non-empty question text (column 1)
- Non-empty answer options (columns 2-5)

// Invalid examples:
"Question|A|B|C|"        // Missing option D
"|A|B|C|D"               // Empty question
"Question|A|B|C|D|E"     // Extra columns (ignored, row valid)
```

## Integration Points

### Questions Page Integration
**File**: `client/src/pages/questions/index.tsx`

**Changes Made**:
1. Added state for Excel uploader visibility
2. Added state for selected subject
3. Added "Import Excel" button next to "Add Question"
4. Added dialog containing ExcelUploader component
5. Dialog shows subject selector before uploader

**Event Flow**:
```typescript
User clicks "Import Excel"
  → setShowExcelUploader(true)
  → Dialog opens with subject selector
  → User selects subject
  → setSelectedSubjectForUpload(id)
  → ExcelUploader renders with subjectId
  → User uploads file
  → onSuccess callback
  → Invalidate queries (refresh data)
  → Close dialog
```

## Database Operations

### Existing Method Used
**Method**: `storage.bulkCreateQuestions()`

**Signature**:
```typescript
async bulkCreateQuestions(
  subjectId: number,
  questionsData: {
    question: {
      questionText: string;
      imageUrl?: string | null;
      year?: number | null;
      difficulty?: string | null;
      topic?: string | null;
    };
    answers: {
      answerText: string;
      isCorrect: boolean;
      explanation?: string | null;
    }[];
  }[]
): Promise<number>
```

**What It Does**:
- Iterates through questions array
- Creates each question in DB
- Creates 4 answers per question
- Returns count of successfully created questions

## Error Scenarios & Handling

### Frontend Errors
```
1. Invalid file type
   → Toast: "Please select an Excel file"

2. Network error during upload
   → Toast: "Failed to upload Excel file"
   → Display error details

3. Server validation errors
   → Display as warnings
   → Show individual row errors
   → Still count successful uploads
```

### Backend Errors
```
1. Missing subjectId or fileBuffer
   → 400: "Missing subjectId or file"

2. Excel parsing error
   → 400: "No worksheet found in the Excel file"
   → 400: "Excel file is empty"

3. Database error
   → 500: "Failed to process Excel file"
   → Logs error to console
```

## Testing Guidelines

### Unit Testing (Frontend)
```typescript
// Test ExcelUploader component
- File selection via input
- File selection via drag-drop
- File validation (type check)
- Upload mutation call
- Success/error handling
- Template download
```

### Integration Testing (Backend)
```typescript
// Test /api/questions/upload-excel endpoint
- Valid Excel file upload
- Missing required fields
- Invalid worksheet format
- Empty file
- Malformed Excel
- Database transaction handling
```

### E2E Testing
```
1. Navigate to Questions page
2. Click "Import Excel"
3. Select subject
4. Upload valid Excel file
5. Verify questions appear in list
6. Verify answers are created
7. Try invalid Excel
8. Verify error handling
```

## Performance Considerations

### Frontend
- **File Reading**: Uses FileReader API asynchronously
- **Base64 Conversion**: Only in memory, no storage
- **Query Invalidation**: Only invalidates necessary queries

### Backend
- **Excel Parsing**: Done once per request
- **Database Operations**: Batch insert for answers, individual for questions
  - Could be optimized with transaction
  - Currently has try-catch per question
- **Validation**: Per-row validation, fail-safe

### Optimization Opportunities
```
1. Use transaction for all questions (rollback if any fail)
2. Batch insert answers in single statement
3. Add request size limits
4. Add file size validation before processing
5. Implement progress webhooks for large files
```

## Security Considerations

### Current Implementation
- ✅ Authenticated endpoint (requires login)
- ✅ Input validation (schema validation)
- ✅ SQL injection safe (using ORM)

### Potential Improvements
```
1. File size limits (prevent DOS)
2. Rate limiting on upload endpoint
3. Virus/malware scanning
4. File type verification (check file content, not just extension)
5. Audit logging for uploads
```

## Dependencies

### Frontend
```json
{
  "xlsx": "^0.18.0"  // Excel file parsing (NOTE: Used on backend)
}
```

Note: The `xlsx` library is npm-installed but actually used on the Node.js backend only, not in the browser bundle.

### Backend
```json
{
  "xlsx": "^0.18.0"  // Used by routes.ts
}
```

## Debugging Tips

### Enable Verbose Logging
Edit `server/routes.ts`:
```typescript
console.log("Processing Excel file:", fileName);
console.log("Row count:", rows.length);
console.log("Questions to upload:", questionsData.length);
```

### Test with Sample Data
Use the template download or these samples:
```
Q1|A|B|C|D
Q2|A|B|C|D
Q3|A|B|C|D
```

### Check Database
```sql
SELECT COUNT(*) as question_count FROM questions 
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT COUNT(*) as answer_count FROM answers 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Future Enhancement Hooks

### For Correct Answer Support
```typescript
// Excel could have column 6 with: A, B, C, or D
const correctAnswer = String(row[5] || "").trim();
// Map letter to option index
```

### For Metadata Support
```typescript
// Columns 6-8 could be: difficulty, year, topic
const difficulty = String(row[5] || "").trim();
const year = parseInt(row[6] || "0");
const topic = String(row[7] || "").trim();
```

### For Image Support
```typescript
// Column 6+ could contain image URLs
const imageUrl = String(row[5] || "").trim() || null;
```

## Related Files

- `client/src/pages/questions/index.tsx` - Main questions management page
- `client/src/pages/questions/form.tsx` - Individual question form
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Data models and validation
- `EXCEL_IMPORT_GUIDE.md` - User documentation
- `IMPLEMENTATION_SUMMARY.md` - Feature summary
