# Excel Questions Import Guide

## Overview
The Exam Archive application now supports bulk importing questions from Excel files. This feature allows you to quickly add multiple questions to a subject by uploading a structured Excel spreadsheet.

## How to Use

### Step 1: Select Your Subject
1. Navigate to the **Questions** page
2. Click the **"Import Excel"** button in the top right
3. A dialog will appear asking you to select a subject
4. Choose the subject you want to import questions into from the dropdown

### Step 2: Prepare Your Excel File

Your Excel file should have exactly **5 columns**:

| Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
|----------|----------|----------|----------|----------|
| Question | Option A | Option B | Option C | Option D |

#### Example:
| Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
|----------|----------|----------|----------|----------|
| What is the capital of France? | Paris | London | Berlin | Madrid |
| Which planet is known as the Red Planet? | Mars | Venus | Jupiter | Saturn |
| What is the largest ocean on Earth? | Pacific Ocean | Atlantic Ocean | Indian Ocean | Arctic Ocean |

### Step 3: Download the Template (Optional)
You can download a pre-formatted Excel template by:
1. Clicking the **"Import Excel"** button
2. Selecting your subject
3. Clicking the **"Download Template"** button in the instructions section

### Step 4: Upload Your File
1. **Drag and drop** your Excel file into the upload area, or
2. Click **"Browse Files"** to select a file from your computer
3. Once selected, click **"Upload Questions"**

## File Format Requirements

### Column Structure
- **Column 1**: The question text (required, cannot be empty)
- **Column 2**: First answer option (required, cannot be empty)
- **Column 3**: Second answer option (required, cannot be empty)
- **Column 4**: Third answer option (required, cannot be empty)
- **Column 5**: Fourth answer option (required, cannot be empty)

### Supported File Types
- `.xlsx` (Excel Open XML format)
- `.xls` (Excel 97-2003 format)

### Important Notes
- All 5 columns must be present in every row
- Question text and all options must have content (no blank cells)
- Extra columns beyond the 5 required are ignored
- Extra rows are processed (no row limit)

## Upload Process

### What Happens During Upload
1. The file is sent to the server for processing
2. Each row is validated to ensure it has all required data
3. Valid questions are created in the database with 4 answer options each
4. A report is displayed showing:
   - Number of questions successfully uploaded
   - Any rows that had errors (with specific error messages)

### Error Handling
If some rows have errors:
- Valid rows will still be uploaded
- Invalid rows will be listed with specific error messages
- You can fix the errors and re-upload

Common errors include:
- "Must have 5 columns (question and 4 options)" - Missing data in columns
- "Question text is required" - First column is empty
- "All four options are required" - One or more answer options are empty

## Examples

### Example 1: Basic Questions
```
Question,Option A,Option B,Option C,Option D
What is 2+2?,3,4,5,6
What is the largest planet?,Mercury,Venus,Jupiter,Saturn
What is H2O?,Helium,Hydrogen,Water,Oxygen
```

### Example 2: Science Questions
```
What process do plants use to make food?,Photosynthesis,Respiration,Fermentation,Oxidation
Which is a renewable resource?,Coal,Natural Gas,Solar Energy,Oil
What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Lysosome
```

## Tips for Best Results

1. **Keep questions concise** - Long questions may be harder to review
2. **Make options clear and distinct** - Avoid similar answers
3. **Use consistent formatting** - No extra spaces or special characters in critical places
4. **Test with a small batch first** - Upload 5-10 questions to verify the format works
5. **Review after import** - Check the Questions page to verify all questions were imported correctly
6. **Set correct answers later** - You can edit each question to mark which option is correct

## Editing After Import

After uploading questions:
1. Go to the **Questions** page
2. Find the imported questions
3. Click the **Edit** button (pencil icon) on any question
4. Modify the question text, add explanations, or mark the correct answer
5. Click **Save**

## Troubleshooting

### "Excel file is empty"
- Your file has no data rows. Add at least one row with question and options.

### "No valid questions found in the file"
- All rows in the file had errors. Check the error messages for details.

### Questions uploaded but appear with missing options
- Make sure all 5 columns have content for each row.
- Re-upload with corrected data.

### Can't see import button
- Make sure you're on the Questions page and not another section.

## Limitations

Currently, the Excel import:
- ✅ Adds 4 answer options to each question
- ✅ Creates all questions with no correct answer marked (you must edit to set this)
- ✅ Ignores columns beyond the first 5
- ❌ Does not support marking correct answers directly from Excel
- ❌ Does not support images in Excel (but you can add them when editing)
- ❌ Does not support explanations (but you can add them when editing)

## Support

If you encounter any issues:
1. Check the error messages displayed after upload
2. Verify your Excel file matches the required format
3. Try with a smaller test file first
4. Refer to the examples provided above
