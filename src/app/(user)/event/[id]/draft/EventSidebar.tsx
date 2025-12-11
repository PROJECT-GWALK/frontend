import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon, Save } from "lucide-react";

type Section = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type EventSidebarProps = {
  sections: Section[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  eventId?: string;
  onSaveDraft?: () => void;
  completionPercent?: number;
};

export function EventSidebar({
  sections,
  activeSection,
  onSectionChange,
  eventId,
  onSaveDraft,
  completionPercent,
}: EventSidebarProps) {
  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="hidden lg:fixed lg:left-8 lg:top-0 lg:flex flex-col w-64 h-screen bg-card border-r border-border z-30 pt-24">
      <div className="p-6 border-b border-border flex-shrink-0">
        <h2 className="font-semibold text-foreground">Edit Event / แก้ไขอีเวนต์</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below / กรอกรายละเอียดด้านล่าง
        </p>
        {typeof completionPercent === "number" && (
          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="text-muted-foreground/20"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="176"
                  strokeDashoffset={Math.max(0, 176 - (176 * (completionPercent || 0)) / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{Math.round(completionPercent)}%</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Progress</div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.id}>
                <button
                  onClick={() => handleSectionClick(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border flex-shrink-0">
        <Button
          variant="secondary"
          className="w-full h-10 rounded-lg shadow-xs hover:shadow-md transition"
          onClick={() => onSaveDraft?.()}
        >
          <Save className="mr-2 h-4 w-4" /> Save as Draft
        </Button>
      </div>
    </aside>
  );
}
