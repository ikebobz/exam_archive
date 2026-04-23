import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertExamSchema, insertSubjectSchema, insertQuestionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint for Docker/load balancer
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Setup authentication (BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Exams CRUD
  app.get("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const validated = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(validated);
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.patch("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertExamSchema.partial().parse(req.body);
      const exam = await storage.updateExam(id, validated);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating exam:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });

  app.delete("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExam(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Subjects CRUD
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const validated = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validated);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertSubjectSchema.partial().parse(req.body);
      const subject = await storage.updateSubject(id, validated);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating subject:", error);
      res.status(500).json({ message: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Questions CRUD
  app.get("/api/questions", isAuthenticated, async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  const createQuestionSchema = insertQuestionSchema.extend({
    answers: z.array(z.object({
      answerText: z.string().min(1),
      isCorrect: z.boolean().default(false),
      explanation: z.string().optional(),
    })).min(1, "At least one answer is required"),
  });

  app.post("/api/questions", isAuthenticated, async (req, res) => {
    try {
      const validated = createQuestionSchema.parse(req.body);
      const { answers: answerData, ...questionData } = validated;
      const question = await storage.createQuestion(questionData, answerData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.patch("/api/questions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = createQuestionSchema.partial().parse(req.body);
      const { answers: answerData, ...questionData } = validated;
      const question = await storage.updateQuestion(id, questionData, answerData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuestion(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Bulk upload
  const bulkUploadSchema = z.object({
    subjectId: z.number(),
    questions: z.array(z.object({
      questionText: z.string().min(1),
      imageUrl: z.string().optional(),
      year: z.number().optional(),
      difficulty: z.string().optional(),
      topic: z.string().optional(),
      answers: z.array(z.object({
        answerText: z.string().min(1),
        isCorrect: z.boolean().default(false),
        explanation: z.string().optional(),
      })),
    })),
  });

  app.post("/api/questions/bulk", isAuthenticated, async (req, res) => {
    try {
      const validated = bulkUploadSchema.parse(req.body);
      const questionsData = validated.questions.map(q => ({
        question: {
          questionText: q.questionText,
          imageUrl: q.imageUrl || null,
          year: q.year || null,
          difficulty: q.difficulty || null,
          topic: q.topic || null,
        },
        answers: q.answers,
      }));
      
      const count = await storage.bulkCreateQuestions(validated.subjectId, questionsData);
      
      res.json({
        success: true,
        questionsUploaded: count,
        errors: [],
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error bulk uploading questions:", error);
      res.status(500).json({ message: "Failed to bulk upload questions" });
    }
  });

  // Excel file upload endpoint
  app.post("/api/questions/upload-excel", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, fileBuffer, fileName } = req.body;

      if (!subjectId || !fileBuffer) {
        return res.status(400).json({ message: "Missing subjectId or file" });
      }

      // Convert base64 string to buffer
      const buffer = Buffer.from(fileBuffer, "base64");

      const xlsxModule = await import("xlsx");
      const XLSX: any = (xlsxModule as any).read ? xlsxModule : (xlsxModule as any).default;

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

  const jsonQuestionSchema = z.object({
    topic: z.string().trim().optional(),
    question_text: z.string().trim().min(1, "question_text is required"),
    options: z.array(z.string().trim().min(1)).length(4, "options must contain exactly 4 items"),
    correct_option: z.string().trim().regex(/^[A-Da-d]$/, "correct_option must be one of A, B, C, D"),
    explanation: z.string().trim().optional(),
    year: z.number().int().optional(),
    difficulty: z.string().trim().optional(),
    image_url: z.string().trim().optional(),
  });

  app.post("/api/questions/upload-json", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, fileContent } = req.body as {
        subjectId?: number | string;
        fileContent?: string;
      };

      const parsedSubjectId = Number(subjectId);
      if (!parsedSubjectId || Number.isNaN(parsedSubjectId)) {
        return res.status(400).json({ message: "A valid subjectId is required" });
      }

      if (!fileContent || typeof fileContent !== "string") {
        return res.status(400).json({ message: "JSON file content is required" });
      }

      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(fileContent);
      } catch {
        return res.status(400).json({ message: "Invalid JSON file" });
      }

      const payloadArray: unknown[] =
        Array.isArray(parsedPayload)
          ? parsedPayload
          : parsedPayload &&
              typeof parsedPayload === "object" &&
              "questions" in parsedPayload &&
              Array.isArray((parsedPayload as { questions?: unknown[] }).questions)
            ? (parsedPayload as { questions: unknown[] }).questions
            : [parsedPayload];

      const errors: string[] = [];
      const questionsData: {
        question: {
          questionText: string;
          imageUrl?: string | null;
          year?: number | null;
          difficulty?: string | null;
          topic?: string | null;
        };
        answers: { answerText: string; isCorrect: boolean; explanation?: string | null }[];
      }[] = [];

      payloadArray.forEach((rawItem, index) => {
        const rowNumber = index + 1;
        const validated = jsonQuestionSchema.safeParse(rawItem);

        if (!validated.success) {
          errors.push(`Item ${rowNumber}: ${validated.error.issues.map((i) => i.message).join(", ")}`);
          return;
        }

        const item = validated.data;
        const correctLetter = item.correct_option.toUpperCase();
        const correctIndex = ["A", "B", "C", "D"].indexOf(correctLetter);

        const normalizedOptions = item.options.map((option) => option.replace(/^[A-Da-d]\.\s*/, "").trim());
        if (normalizedOptions.some((option) => option.length === 0)) {
          errors.push(`Item ${rowNumber}: options contain empty value(s)`);
          return;
        }

        questionsData.push({
          question: {
            questionText: item.question_text,
            imageUrl: item.image_url ?? null,
            year: item.year ?? null,
            difficulty: item.difficulty ?? null,
            topic: item.topic ?? null,
          },
          answers: normalizedOptions.map((option, optionIndex) => ({
            answerText: option,
            isCorrect: optionIndex === correctIndex,
            explanation: optionIndex === correctIndex ? item.explanation ?? null : null,
          })),
        });
      });

      if (questionsData.length === 0) {
        return res.status(400).json({
          success: false,
          questionsUploaded: 0,
          errors: errors.length > 0 ? errors : ["No valid questions found in JSON file"],
        });
      }

      const count = await storage.bulkCreateQuestions(parsedSubjectId, questionsData);

      res.json({
        success: true,
        questionsUploaded: count,
        errors,
      });
    } catch (error) {
      console.error("Error uploading JSON file:", error);
      res.status(500).json({ message: "Failed to process JSON file" });
    }
  });

  return httpServer;
}
