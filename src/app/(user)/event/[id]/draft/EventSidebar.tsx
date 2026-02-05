import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, LucideIcon, Save } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  isSaving?: boolean;
};

export function EventSidebar({
  sections,
  activeSection,
  onSectionChange,
  eventId,
  onSaveDraft,
  completionPercent,
  isSaving,
}: EventSidebarProps) {
  const { t } = useLanguage();
  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside
      className="hidden lg:fixed lg:left-0 lg:top-40 lg:flex flex-col w-72 bg-background border-r border-border/60 z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
      style={{ height: "calc(100vh - 160px)" }}
    >
      <div className="px-6 py-6 border-b border-border/60 shrink-0">
        <h2 className="font-semibold text-lg text-foreground tracking-tight">
          {t("sidebar.editEvent")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("sidebar.completeDetails")}</p>
        {typeof completionPercent === "number" && (
          <div className="mt-6 flex items-center gap-4 bg-card rounded-xl p-3 border-none shadow-md">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="text-muted/50"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="text-primary transition-all duration-500 ease-out"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="176"
                  strokeDashoffset={Math.max(0, 176 - (176 * (completionPercent || 0)) / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">{Math.round(completionPercent)}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{t("sidebar.completion")}</div>
              <div className="text-xs text-muted-foreground">{t("sidebar.progressSoFar")}</div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border/60 shrink-0 bg-muted/10">
        <Button
          variant="default"
          className="w-full h-11 rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
          onClick={() => onSaveDraft?.()}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("sidebar.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("sidebar.saveDraft")}
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
