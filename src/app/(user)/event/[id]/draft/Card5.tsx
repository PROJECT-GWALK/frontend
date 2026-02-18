"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BookOpen, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { autoResizeTextarea } from "@/utils/function";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

export type GradingCriteria = {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  weightPercentage: number;
  sortOrder?: number;
};

type Props = {
  gradingEnabled: boolean;
  setGradingEnabled: (v: boolean) => void;
  gradingCriteria: GradingCriteria[];
  setGradingCriteria: (v: GradingCriteria[]) => void;
  gradingErrors?: Record<string, string>;
};

export default function Card5(props: Props) {
  const { gradingEnabled, setGradingEnabled, gradingCriteria, setGradingCriteria, gradingErrors } =
    props;

  const { t } = useLanguage();

  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const totalWeight = gradingCriteria.reduce((sum, c) => sum + c.weightPercentage, 0);

  const handleAddCriteria = () => {
    const newCriteria: GradingCriteria = {
      id: `new-${Date.now()}`,
      name: "",
      maxScore: 100,
      weightPercentage: 0,
      // description and sortOrder are optional
    };
    setGradingCriteria([...gradingCriteria, newCriteria]);
    setEditing(new Set([...editing, newCriteria.id]));
  };

  const handleEditCriteria = (criteria: GradingCriteria) => {
    setEditing(new Set([...editing, criteria.id]));
  };

  const handleUpdateField = (
    id: string,
    field: keyof GradingCriteria,
    value: GradingCriteria[keyof GradingCriteria],
  ) => {
    setGradingCriteria(gradingCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSaveCriteria = (id: string) => {
    const item = gradingCriteria.find((c) => c.id === id);
    if (!item) return;

    // Validate name
    if (!item.name || !item.name.trim()) {
      toast.error(t("gradingSection.criteriaNameRequired") || "Criteria name is required");
      return;
    }

    if (item.name.trim().length < 2) {
      toast.error(
        t("gradingSection.criteriaNameTooShort") || "Criteria name must be at least 2 characters",
      );
      return;
    }

    if (item.name.trim().length > 100) {
      toast.error(
        t("gradingSection.criteriaNameTooLong") || "Criteria name must be at most 100 characters",
      );
      return;
    }

    // Validate max score
    if (!Number.isFinite(item.maxScore) || item.maxScore <= 0) {
      toast.error(t("gradingSection.maxScoreMustBePositive") || "Max score must be greater than 0");
      return;
    }

    // Validate weight percentage
    if (
      !Number.isFinite(item.weightPercentage) ||
      item.weightPercentage <= 0 ||
      item.weightPercentage > 100
    ) {
      toast.error(
        t("gradingSection.weightPercentageMustBeBetween") ||
          "Weight percentage must be greater than 0 and not more than 100",
      );
      return;
    }

    // Validate description length
    if (item.description && item.description.length > 120) {
      toast.error(
        t("gradingSection.descriptionTooLong") || "Description must be at most 120 characters",
      );
      return;
    }

    // Trim string fields
    const updatedItem = {
      ...item,
      name: item.name.trim(),
      description: item.description ? item.description.trim() : undefined,
    };

    setGradingCriteria(gradingCriteria.map((c) => (c.id === id ? updatedItem : c)));

    if (id.startsWith("new-")) {
      toast.success(t("gradingSection.criteriaAdded") || "Criteria added successfully");
    } else {
      toast.success(t("gradingSection.criteriaUpdated") || "Criteria updated successfully");
    }

    const nextCriteria = gradingCriteria.map((c) => (c.id === id ? updatedItem : c));
    const newTotalWeight = nextCriteria.reduce((sum, c) => sum + c.weightPercentage, 0);
    if (newTotalWeight !== 100) {
      toast.warning(
        t("gradingSection.weightTotalMustBe100") ||
          "Warning: Total weight of all criteria is not 100%",
      );
    }

    setEditing(new Set([...editing].filter((e) => e !== id)));
  };

  const handleCancelEdit = (id: string) => {
    setEditing(new Set([...editing].filter((e) => e !== id)));
  };

  const handleDeleteCriteria = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    setGradingCriteria(gradingCriteria.filter((c) => c.id !== deleteTargetId));
    toast.success(t("gradingSection.criteriaDeleted") || "Criteria deleted successfully");
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <Card id="card5" className="lg:col-span-2 scroll-mt-6 border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>{t("gradingSection.title") || "Grading Configuration"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable Grading */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3 pt-1">
            <Checkbox
              id="gradingEnabled"
              checked={gradingEnabled}
              onCheckedChange={(checked) => {
                setGradingEnabled(!!checked);
              }}
              className="mt-1"
            />
            <Label htmlFor="gradingEnabled" className="cursor-pointer font-normal leading-relaxed">
              {t("gradingSection.enableGrading") || "Enable Grading Feature"}
            </Label>
          </div>
        </div>

        {gradingEnabled && (
          <>
            <Separator />

            {/* Grading Criteria Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-semibold text-lg">
                    {t("gradingSection.criteria") || "Grading Criteria"}
                  </span>
                </div>
                <Button onClick={handleAddCriteria} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("gradingSection.addCriteria") || "Add Criteria"}
                </Button>
              </div>

              {/* Weight Summary */}
              {gradingCriteria.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {t("gradingSection.totalWeight") || "Total Weight"}
                    </span>
                    <span
                      className={`font-bold ${
                        totalWeight === 100
                          ? "text-green-600 dark:text-green-400"
                          : totalWeight > 100
                            ? "text-red-600 dark:text-red-400"
                            : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {totalWeight}%
                    </span>
                  </div>
                  {totalWeight !== 100 && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {t("gradingSection.weightWarning") ||
                        "Total weight should equal 100% for balanced grading"}
                    </p>
                  )}
                </div>
              )}

              {/* Criteria List */}
              {gradingCriteria.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("gradingSection.noCriteria") || "No criteria added yet"}</p>
                  <p className="text-sm">
                    {t("gradingSection.clickToAddCriteria") ||
                      "Click the button above to add grading criteria"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gradingCriteria.map((criteria, index) => {
                    const isEditing = editing.has(criteria.id);

                    return (
                      <div
                        key={criteria.id}
                        className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                      >
                        {isEditing ? (
                          // Edit Mode
                          <div className="space-y-3">
                            {/* Evaluation Name Field */}
                            <div className="space-y-2">
                              <label className="text-sm font-semibold">
                                {t("gradingSection.criteriaName") || "Criteria Name"}
                              </label>
                              <Input
                                id={`name-${criteria.id}`}
                                placeholder={
                                  t("gradingSection.placeholderCriteriaName") ||
                                  "e.g., Presentation, Innovation, Technical"
                                }
                                value={criteria.name}
                                onChange={(e) =>
                                  handleUpdateField(criteria.id, "name", e.target.value)
                                }
                              />
                            </div>
                            {/* Description Field */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold">
                                  {t("gradingSection.criteriaDescription") || "Description"}
                                </label>
                                <span className="text-xs text-muted-foreground">
                                  {(criteria.description || "").length}/120
                                </span>
                              </div>
                              <Textarea
                                id={`desc-${criteria.id}`}
                                ref={(el) => autoResizeTextarea(el)}
                                placeholder={
                                  t("gradingSection.placeholderCriteriaDescription") ||
                                  "Describe what this criteria evaluates..."
                                }
                                maxLength={120}
                                value={criteria.description || ""}
                                onChange={(e) => {
                                  autoResizeTextarea(e.target);
                                  handleUpdateField(criteria.id, "description", e.target.value);
                                }}
                                className="resize-none overflow-hidden"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Max Score Field */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                  {t("gradingSection.maxScore") || "Max Score"}
                                </label>
                                <Input
                                  id={`maxScore-${criteria.id}`}
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="100"
                                  value={criteria.maxScore === 0 ? "" : criteria.maxScore}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                      handleUpdateField(criteria.id, "maxScore", 0);
                                    } else {
                                      handleUpdateField(criteria.id, "maxScore", Number(val));
                                    }
                                  }}
                                />
                              </div>
                              {/* Weight Field */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                  {t("gradingSection.weight")} %
                                </label>
                                <Input
                                  id={`weight-${criteria.id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  placeholder="25"
                                  value={
                                    criteria.weightPercentage === 0 ? "" : criteria.weightPercentage
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                      handleUpdateField(criteria.id, "weightPercentage", 0);
                                    } else {
                                      handleUpdateField(
                                        criteria.id,
                                        "weightPercentage",
                                        Number(val),
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveCriteria(criteria.id)}>
                                {t("gradingSection.save") || "Save"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelEdit(criteria.id)}
                              >
                                {t("gradingSection.cancel") || "Cancel"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{criteria.name}</h4>
                                <Badge variant="secondary" className="bg-blue-500 text-white">
                                  {t("gradingSection.weight") || "Weight"}:{" "}
                                  {criteria.weightPercentage}%
                                </Badge>
                                <Badge variant="outline" className="bg-green-500 text-white">
                                  {t("gradingSection.maxScore") || "Max Score"}: {criteria.maxScore}
                                </Badge>
                              </div>
                              {criteria.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {criteria.description}
                                </p>
                              )}
                              <div className="flex gap-2 flex-wrap"></div>
                            </div>
                            <div className="flex gap-2 ml-4 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditCriteria(criteria)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCriteria(criteria.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DeleteConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setDeleteTargetId(null);
              }}
              onConfirm={handleConfirmDelete}
              title={t("gradingSection.deleteConfirmTitle") || "Delete grading criteria"}
              description={
                t("gradingSection.deleteConfirm") ||
                "Are you sure you want to delete this grading criteria?"
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
