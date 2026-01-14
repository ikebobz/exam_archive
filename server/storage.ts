import { 
  exams, subjects, questions, answers,
  type Exam, type InsertExam,
  type Subject, type InsertSubject,
  type Question, type InsertQuestion,
  type Answer, type InsertAnswer
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Exams
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<void>;

  // Subjects
  getSubjects(): Promise<(Subject & { exam: Exam })[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectsByExam(examId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<void>;

  // Questions
  getQuestions(): Promise<(Question & { subject: Subject & { exam: Exam }; answers: Answer[] })[]>;
  getQuestion(id: number): Promise<(Question & { answers: Answer[] }) | undefined>;
  getQuestionsBySubject(subjectId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion, answerData: { answerText: string; isCorrect: boolean; explanation?: string | null }[]): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>, answerUpdates?: { answerText: string; isCorrect: boolean; explanation?: string | null }[]): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<void>;
  bulkCreateQuestions(subjectId: number, questionsData: { question: { questionText: string; year?: number | null; difficulty?: string | null; topic?: string | null }; answers: { answerText: string; isCorrect: boolean; explanation?: string | null }[] }[]): Promise<number>;

  // Answers
  getAnswersByQuestion(questionId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined>;
  deleteAnswer(id: number): Promise<void>;

  // Stats
  getDashboardStats(): Promise<{
    examCount: number;
    subjectCount: number;
    questionCount: number;
    recentExams: Exam[];
    recentQuestions: Question[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Exams
  async getExams(): Promise<Exam[]> {
    return db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [created] = await db.insert(exams).values({
      name: exam.name,
      code: exam.code,
      description: exam.description,
    }).returning();
    return created;
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (exam.name !== undefined) updateData.name = exam.name;
    if (exam.code !== undefined) updateData.code = exam.code;
    if (exam.description !== undefined) updateData.description = exam.description;
    
    const [updated] = await db
      .update(exams)
      .set(updateData)
      .where(eq(exams.id, id))
      .returning();
    return updated;
  }

  async deleteExam(id: number): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  // Subjects
  async getSubjects(): Promise<(Subject & { exam: Exam })[]> {
    const result = await db
      .select()
      .from(subjects)
      .leftJoin(exams, eq(subjects.examId, exams.id))
      .orderBy(desc(subjects.createdAt));
    
    return result.map(row => ({
      ...row.subjects,
      exam: row.exams!
    }));
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectsByExam(examId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.examId, examId));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [created] = await db.insert(subjects).values({
      examId: subject.examId,
      name: subject.name,
      code: subject.code,
      description: subject.description,
    }).returning();
    return created;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (subject.examId !== undefined) updateData.examId = subject.examId;
    if (subject.name !== undefined) updateData.name = subject.name;
    if (subject.code !== undefined) updateData.code = subject.code;
    if (subject.description !== undefined) updateData.description = subject.description;
    
    const [updated] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Questions
  async getQuestions(): Promise<(Question & { subject: Subject & { exam: Exam }; answers: Answer[] })[]> {
    const questionsResult = await db
      .select()
      .from(questions)
      .leftJoin(subjects, eq(questions.subjectId, subjects.id))
      .leftJoin(exams, eq(subjects.examId, exams.id))
      .orderBy(desc(questions.createdAt));

    const questionsWithAnswers = await Promise.all(
      questionsResult.map(async (row) => {
        const questionAnswers = await db
          .select()
          .from(answers)
          .where(eq(answers.questionId, row.questions.id));
        
        return {
          ...row.questions,
          subject: {
            ...row.subjects!,
            exam: row.exams!
          },
          answers: questionAnswers
        };
      })
    );

    return questionsWithAnswers;
  }

  async getQuestion(id: number): Promise<(Question & { answers: Answer[] }) | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    if (!question) return undefined;

    const questionAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, id));

    return {
      ...question,
      answers: questionAnswers
    };
  }

  async getQuestionsBySubject(subjectId: number): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.subjectId, subjectId));
  }

  async createQuestion(
    question: InsertQuestion, 
    answerData: { answerText: string; isCorrect: boolean; explanation?: string | null }[]
  ): Promise<Question> {
    const [created] = await db.insert(questions).values({
      subjectId: question.subjectId,
      questionText: question.questionText,
      imageUrl: question.imageUrl ?? null,
      year: question.year ?? null,
      difficulty: question.difficulty ?? null,
      topic: question.topic ?? null,
    }).returning();
    
    if (answerData.length > 0) {
      await db.insert(answers).values(
        answerData.map(a => ({
          questionId: created.id,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          explanation: a.explanation ?? null,
        }))
      );
    }
    
    return created;
  }

  async updateQuestion(
    id: number, 
    question: Partial<InsertQuestion>, 
    answerUpdates?: { answerText: string; isCorrect: boolean; explanation?: string | null }[]
  ): Promise<Question | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (question.subjectId !== undefined) updateData.subjectId = question.subjectId;
    if (question.questionText !== undefined) updateData.questionText = question.questionText;
    if (question.imageUrl !== undefined) updateData.imageUrl = question.imageUrl;
    if (question.year !== undefined) updateData.year = question.year;
    if (question.difficulty !== undefined) updateData.difficulty = question.difficulty;
    if (question.topic !== undefined) updateData.topic = question.topic;
    
    const [updated] = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, id))
      .returning();

    if (!updated) return undefined;

    if (answerUpdates) {
      await db.delete(answers).where(eq(answers.questionId, id));
      if (answerUpdates.length > 0) {
        await db.insert(answers).values(
          answerUpdates.map(a => ({
            questionId: id,
            answerText: a.answerText,
            isCorrect: a.isCorrect,
            explanation: a.explanation ?? null,
          }))
        );
      }
    }
    
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async bulkCreateQuestions(
    subjectId: number, 
    questionsData: { question: { questionText: string; imageUrl?: string | null; year?: number | null; difficulty?: string | null; topic?: string | null }; answers: { answerText: string; isCorrect: boolean; explanation?: string | null }[] }[]
  ): Promise<number> {
    let count = 0;
    
    for (const data of questionsData) {
      try {
        const [created] = await db
          .insert(questions)
          .values({
            subjectId,
            questionText: data.question.questionText,
            imageUrl: data.question.imageUrl ?? null,
            year: data.question.year ?? null,
            difficulty: data.question.difficulty ?? null,
            topic: data.question.topic ?? null,
          })
          .returning();
        
        if (data.answers.length > 0) {
          await db.insert(answers).values(
            data.answers.map(a => ({
              questionId: created.id,
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              explanation: a.explanation ?? null,
            }))
          );
        }
        count++;
      } catch (error) {
        console.error("Error creating question:", error);
      }
    }
    
    return count;
  }

  // Answers
  async getAnswersByQuestion(questionId: number): Promise<Answer[]> {
    return db.select().from(answers).where(eq(answers.questionId, questionId));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [created] = await db.insert(answers).values({
      questionId: answer.questionId,
      answerText: answer.answerText,
      isCorrect: answer.isCorrect,
      explanation: answer.explanation ?? null,
    }).returning();
    return created;
  }

  async updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (answer.questionId !== undefined) updateData.questionId = answer.questionId;
    if (answer.answerText !== undefined) updateData.answerText = answer.answerText;
    if (answer.isCorrect !== undefined) updateData.isCorrect = answer.isCorrect;
    if (answer.explanation !== undefined) updateData.explanation = answer.explanation;
    
    const [updated] = await db
      .update(answers)
      .set(updateData)
      .where(eq(answers.id, id))
      .returning();
    return updated;
  }

  async deleteAnswer(id: number): Promise<void> {
    await db.delete(answers).where(eq(answers.id, id));
  }

  // Stats
  async getDashboardStats(): Promise<{
    examCount: number;
    subjectCount: number;
    questionCount: number;
    recentExams: Exam[];
    recentQuestions: Question[];
  }> {
    const allExams = await db.select().from(exams);
    const allSubjects = await db.select().from(subjects);
    const allQuestions = await db.select().from(questions);
    const recentExams = await db.select().from(exams).orderBy(desc(exams.createdAt)).limit(5);
    const recentQuestions = await db.select().from(questions).orderBy(desc(questions.createdAt)).limit(5);

    return {
      examCount: allExams.length,
      subjectCount: allSubjects.length,
      questionCount: allQuestions.length,
      recentExams,
      recentQuestions
    };
  }
}

export const storage = new DatabaseStorage();
