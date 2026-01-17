import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ExamsPage from "@/pages/exams/index";
import ExamFormPage from "@/pages/exams/form";
import SubjectsPage from "@/pages/subjects/index";
import SubjectFormPage from "@/pages/subjects/form";
import QuestionsPage from "@/pages/questions/index";
import QuestionFormPage from "@/pages/questions/form";
import BulkUploadPage from "@/pages/upload";
import { Loader2 } from "lucide-react";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/exams" component={ExamsPage} />
      <Route path="/exams/new" component={ExamFormPage} />
      <Route path="/exams/:id/edit" component={ExamFormPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/subjects/new" component={SubjectFormPage} />
      <Route path="/subjects/:id/edit" component={SubjectFormPage} />
      <Route path="/questions" component={QuestionsPage} />
      <Route path="/questions/new" component={QuestionFormPage} />
      <Route path="/questions/:id/edit" component={QuestionFormPage} />
      <Route path="/upload" component={BulkUploadPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
