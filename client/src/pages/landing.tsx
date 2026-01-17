import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  FileSpreadsheet, 
  Upload, 
  Search, 
  Shield, 
  BarChart3 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: GraduationCap,
    title: "Multi-Exam Support",
    description: "Manage questions and answers for multiple national exams in one centralized platform.",
  },
  {
    icon: Upload,
    title: "Bulk Upload",
    description: "Import questions from spreadsheets to quickly populate your question bank.",
  },
  {
    icon: Search,
    title: "Smart Organization",
    description: "Organize questions by subject, topic, year, and difficulty level for easy retrieval.",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "Role-based authentication ensures only authorized users can manage content.",
  },
  {
    icon: BarChart3,
    title: "Analytics Ready",
    description: "Track question coverage across subjects and identify content gaps.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export Options",
    description: "Export questions in various formats for offline use or integration.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">ExamPro CMS</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild data-testid="button-login">
                <a href="/login">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="text-foreground">National Exam</span>
                    <br />
                    <span className="text-primary">Question Management</span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl">
                    A comprehensive Content Management System designed for educators to organize, 
                    upload, and manage past questions and answers for national examinations.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild data-testid="button-get-started">
                    <a href="/login">Get Started</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#features">Learn More</a>
                  </Button>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Free to use</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
                <Card className="relative overflow-hidden">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">National Examination Council</p>
                          <p className="text-sm text-muted-foreground">3 Exams, 24 Subjects</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary/10 text-center">
                          <p className="text-2xl font-bold text-primary">1,250+</p>
                          <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/50 text-center">
                          <p className="text-2xl font-bold">24</p>
                          <p className="text-xs text-muted-foreground">Subjects</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted text-center">
                          <p className="text-2xl font-bold">10</p>
                          <p className="text-xs text-muted-foreground">Years</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built for educators who need a reliable system to manage examination content 
                efficiently and securely.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="group hover-elevate">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join educators who trust ExamPro CMS to manage their examination content.
            </p>
            <Button size="lg" asChild>
              <a href="/login">Start Managing Questions</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ExamPro CMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ExamPro CMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
