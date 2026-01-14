# Design Guidelines: Exam Question Management CMS

## Design Approach
**System-Based Approach** - Drawing from Linear, Notion, and Material Design for clean, data-dense interfaces optimized for productivity and content management.

**Core Principles:**
- Clarity and efficiency over visual flair
- Consistent, predictable patterns for CRUD operations
- Information density without overwhelming users
- Clean, professional aesthetic for educational context

## Typography System

**Font Family:** Inter (Google Fonts) for exceptional readability in data-heavy interfaces

**Hierarchy:**
- Page Titles: text-2xl font-semibold (24px)
- Section Headers: text-lg font-semibold (18px)
- Card/Panel Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Labels/Meta: text-xs font-medium uppercase tracking-wide (12px)
- Table Data: text-sm (14px)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card margins: gap-4 to gap-6

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-4
- Two-column forms: grid-cols-1 md:grid-cols-2 gap-6
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

## Component Library

**Navigation:**
- Persistent sidebar (w-64) with hierarchical menu structure
- Top bar with user profile, notifications, search
- Breadcrumb navigation for deep hierarchies (Exams > Subjects > Questions)

**Forms:**
- Grouped form sections with clear labels
- Inline validation with helpful error messages
- Required field indicators (*)
- File upload with drag-and-drop zones for spreadsheet imports
- Multi-step wizard for complex question creation
- Dropdown selects for Exam/Subject selection with search capability

**Data Display:**
- Clean tables with sortable columns, row hover states
- Pagination controls (showing "1-20 of 150 items")
- Search and filter panels above tables
- Quick action buttons per row (Edit, Delete, Duplicate)
- Empty states with helpful CTAs ("No questions yet. Upload your first question")

**Cards:**
- Dashboard stat cards with icons and numbers
- Question preview cards showing: subject, exam type, difficulty, preview text
- Consistent rounded corners (rounded-lg) and subtle borders

**Modals:**
- Confirmation dialogs for destructive actions
- Full-screen overlays for bulk upload/edit operations
- Side panels for quick-view question details

**Buttons:**
- Primary actions: Solid with clear hierarchy
- Secondary actions: Outlined style
- Destructive actions: Distinct treatment in confirmation contexts
- Icon buttons for compact actions (edit, delete, more options)

## Page Structures

**Login Page:**
- Centered card (max-w-md) with logo, form fields, forgot password link
- Clean, minimal background

**Dashboard:**
- Grid of stat cards (Total Exams, Questions, Recent Activity)
- Quick actions section
- Recent uploads table

**Management Pages (Exams/Subjects/Questions):**
- Page header with title and primary action ("Add New Question")
- Filter/search bar
- Data table with actions column
- Bulk action toolbar when items selected

**Question Editor:**
- Two-column layout: form fields (left), preview (right) on desktop
- Rich text editor for question content
- Multiple choice answer inputs with correct answer selector
- Tags/metadata fields (difficulty, topic, year)
- Save/Cancel action bar

**Bulk Upload:**
- File drop zone prominent at top
- Template download link
- Preview table of parsed data before confirm
- Error validation with line-by-line feedback

## Images

No large hero images needed. Minimal imagery:
- Logo in navigation (university/institution branding)
- User avatars in profile area (circular, 32px-40px)
- Empty state illustrations (optional, subtle)
- Icons throughout for visual hierarchy (Heroicons library)

## Interactions

**Minimal Animations:**
- Smooth transitions on hover states (transition-colors)
- Modal fade-in/out
- Toast notifications slide-in from top-right

**Feedback:**
- Loading states for data fetching
- Success/error toast messages
- Inline form validation

## Accessibility
- High contrast text
- Keyboard navigation support throughout
- Focus visible states on all interactive elements
- Screen reader labels for icon-only buttons
- Proper form labels and ARIA attributes