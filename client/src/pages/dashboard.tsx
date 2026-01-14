import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  Plus,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Exam, Subject, Question } from "@shared/schema";

interface DashboardStats {
  examCount: number;
  subjectCount: number;
  questionCount: number;
  recentExams: Exam[];
  recentQuestions: Question[];
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your exam question management system
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild>
            <Link href="/questions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Exams
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-exam-count">
              {stats?.examCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              National examinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subjects
            </CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-subject-count">
              {stats?.subjectCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-question-count">
              {stats?.questionCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              With answers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Recent Exams</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/exams">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentExams && stats.recentExams.length > 0 ? (
              <div className="space-y-3">
                {stats.recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{exam.name}</p>
                        <p className="text-xs text-muted-foreground">{exam.code}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/exams/${exam.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No exams yet"
                description="Create your first exam to get started"
                actionLabel="Add Exam"
                actionHref="/exams/new"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <QuickActionCard
                icon={GraduationCap}
                title="Add New Exam"
                description="Create a new national exam"
                href="/exams/new"
              />
              <QuickActionCard
                icon={BookOpen}
                title="Add New Subject"
                description="Add a subject to an existing exam"
                href="/subjects/new"
              />
              <QuickActionCard
                icon={HelpCircle}
                title="Add New Question"
                description="Create a new question with answers"
                href="/questions/new"
              />
              <QuickActionCard
                icon={TrendingUp}
                title="Bulk Upload"
                description="Import questions from spreadsheet"
                href="/upload"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  href 
}: { 
  icon: typeof GraduationCap; 
  title: string; 
  description: string; 
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover-elevate cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
      </div>
    </Link>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref 
}: { 
  icon: typeof GraduationCap; 
  title: string; 
  description: string; 
  actionLabel: string; 
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Button size="sm" asChild>
        <Link href={actionHref}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Link>
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
