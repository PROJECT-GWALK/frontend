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
};

export function EventSidebar({
  sections,
  activeSection,
  onSectionChange,
  eventId,
  onSaveDraft,
}: EventSidebarProps) {
  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-foreground">Edit Event / แก้ไขอีเวนต์</h2>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below / กรอกรายละเอียดด้านล่าง</p>
      </div>

      <nav className="flex-1 p-4">
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

      <div className="p-4 border-t border-border">
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
