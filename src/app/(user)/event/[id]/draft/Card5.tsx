"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, BookOpen, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { autoResizeTextarea } from "@/utils/function";

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

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    maxScore: string;
    weightPercentage: string;
  }>({
    name: "",
    description: "",
    maxScore: "100",
    weightPercentage: "0",
  });

  const totalWeight = gradingCriteria.reduce((sum, c) => sum + c.weightPercentage, 0);

  const handleAddCriteria = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      maxScore: "100",
      weightPercentage: "0",
    });
    setFormOpen(true);
  };

  const handleEditCriteria = (criteria: GradingCriteria) => {
    setEditingId(criteria.id);
    setFormData({
      name: criteria.name,
      description: criteria.description || "",
      maxScore: criteria.maxScore.toString(),
      weightPercentage: criteria.weightPercentage.toString(),
    });
    setFormOpen(true);
  };

  const handleSaveCriteria = () => {
    // Validate name
    if (!formData.name || !formData.name.trim()) {
      toast.error(t("gradingSection.criteriaNameRequired") || "Criteria name is required");
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error(
        t("gradingSection.criteriaNameTooShort") || "Criteria name must be at least 2 characters",
      );
      return;
    }

    if (formData.name.trim().length > 100) {
      toast.error(
        t("gradingSection.criteriaNameTooLong") || "Criteria name must be at most 100 characters",
      );
      return;
    }

    // Validate max score
    const maxScore = Number(formData.maxScore);
    if (!formData.maxScore || isNaN(maxScore)) {
      toast.error(t("gradingSection.maxScoreRequired") || "Max score is required");
      return;
    }

    if (maxScore <= 0) {
      toast.error(t("gradingSection.maxScoreMustBePositive") || "Max score must be greater than 0");
      return;
    }

    // Validate weight percentage
    const weight = Number(formData.weightPercentage);
    if (!formData.weightPercentage || isNaN(weight)) {
      toast.error(t("gradingSection.weightRequired") || "Weight percentage is required");
      return;
    }

    if (weight < 0 || weight > 100) {
      toast.error(
        t("gradingSection.weightPercentageMustBeBetween") ||
          "Weight percentage must be between 0 and 100",
      );
      return;
    }

    // Validate description length
    if (formData.description && formData.description.length > 120) {
      toast.error(
        t("gradingSection.descriptionTooLong") || "Description must be at most 120 characters",
      );
      return;
    }

    if (editingId) {
      setGradingCriteria(
        gradingCriteria.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name.trim(),
                description: formData.description.trim(),
                maxScore,
                weightPercentage: weight,
              }
            : c,
        ),
      );
      toast.success(t("gradingSection.criteriaUpdated") || "Criteria updated successfully");
    } else {
      const newCriteria: GradingCriteria = {
        id: `new-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        maxScore,
        weightPercentage: weight,
        sortOrder: gradingCriteria.length,
      };
      setGradingCriteria([...gradingCriteria, newCriteria]);
      toast.success(t("gradingSection.criteriaAdded") || "Criteria added successfully");
    }

    setFormOpen(false);
    setFormData({
      name: "",
      description: "",
      maxScore: "100",
      weightPercentage: "0",
    });
  };

  const handleDeleteCriteria = (id: string) => {
    if (
      confirm(t("gradingSection.deleteConfirm") || "Are you sure you want to delete this criteria?")
    ) {
      setGradingCriteria(gradingCriteria.filter((c) => c.id !== id));
      toast.success(t("gradingSection.criteriaDeleted") || "Criteria deleted successfully");
    }
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      maxScore: "100",
      weightPercentage: "0",
    });
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
                <Button onClick={handleAddCriteria} size="sm" variant="outline" disabled={formOpen}>
                  <Plus className="h-4 w-4 mr-1" />
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

              {/* Add/Edit Form */}
              {formOpen && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="criteriaName">
                      {t("gradingSection.criteriaName") || "Criteria Name"}
                    </Label>
                    <Input
                      id="criteriaName"
                      placeholder={
                        t("gradingSection.placeholderCriteriaName") ||
                        "e.g., Presentation, Innovation, Technical"
                      }
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="criteriaDescription">
                        {t("gradingSection.criteriaDescription") || "Description"}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {(formData.description || "").length}/120
                      </span>
                    </div>
                    <Textarea
                      id="criteriaDescription"
                      ref={(el) => autoResizeTextarea(el)}
                      placeholder={
                        t("gradingSection.placeholderCriteriaDescription") ||
                        "Describe what this criteria evaluates..."
                      }
                      maxLength={120}
                      value={formData.description}
                      onChange={(e) => {
                        autoResizeTextarea(e.target);
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        });
                      }}
                      className="resize-none overflow-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">
                        {t("gradingSection.maxScore") || "Max Score"}
                      </Label>
                      <Input
                        id="maxScore"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="100"
                        value={formData.maxScore}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData({
                            ...formData,
                            maxScore: v,
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weightPercentage">
                        {t("gradingSection.weight") || "Weight %"}
                      </Label>
                      <Input
                        id="weightPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="25"
                        value={formData.weightPercentage}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData({
                            ...formData,
                            weightPercentage: v,
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      {t("gradingSection.cancel") || "Cancel"}
                    </Button>
                    <Button size="sm" onClick={handleSaveCriteria}>
                      {t("gradingSection.save") || "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Criteria List */}
              {gradingCriteria.length === 0 && !formOpen ? (
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
                  {gradingCriteria.map((criteria, index) => (
                    <div key={criteria.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <h3 className="text-base font-semibold truncate">{criteria.name}</h3>
                          </div>
                          {criteria.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {criteria.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCriteria(criteria)}
                            title={t("common.edit") || "Edit"}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCriteria(criteria.id)}
                            title={t("common.delete") || "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {t("gradingSection.maxScore") || "Max Score"}
                          </span>
                          <p className="font-semibold text-sm">{criteria.maxScore}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {t("gradingSection.weight") || "Weight"}
                          </span>
                          <p className="font-semibold text-sm">{criteria.weightPercentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
