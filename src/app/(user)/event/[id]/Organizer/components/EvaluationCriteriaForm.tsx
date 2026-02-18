"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle, BookOpen, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  createEvaluationCriteria,
  getEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriteria,
} from "@/utils/apievaluation";
import { useLanguage } from "@/contexts/LanguageContext";
import DeleteConfirmDialog from "../../draft/DeleteConfirmDialog";

type CriteriaFormData = {
  id?: string;
  name: string;
  maxScore: number;
  weightPercentage: number;
  description?: string;
  sortOrder?: number;
};

type Props = {
  eventId: string;
  initialCriteria: CriteriaFormData[];
  onUpdate: (criteria: CriteriaFormData[]) => void;
};

export default function EvaluationCriteriaForm({ eventId, initialCriteria, onUpdate }: Props) {
  const [criteria, setCriteria] = useState<CriteriaFormData[]>(initialCriteria);
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const response = (error as { response?: unknown }).response;
      if (typeof response === "object" && response !== null) {
        const data = (response as { data?: unknown }).data;
        if (typeof data === "object" && data !== null) {
          const msg = (data as { message?: unknown }).message;
          if (typeof msg === "string" && msg.trim()) return msg;
        }
      }

      const msg = (error as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    return fallback;
  };
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    setCriteria(initialCriteria);
    setEditing(new Set());
  }, [initialCriteria]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weightPercentage, 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01; // Allow for floating point precision
  const remainingWeight = 100 - totalWeight;

  const handleAutoBalance = async () => {
    if (criteria.length === 0) return;

    const sorted = criteria.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (sorted.some((c) => !c.id)) return;

    const n = sorted.length;
    const base = Math.floor(10000 / n) / 100;
    let remainder = Number((100 - base * n).toFixed(2));

    const nextSorted = sorted.map((c) => {
      let nextWeight = base;
      if (remainder > 0) {
        nextWeight = Number((nextWeight + 0.01).toFixed(2));
        remainder = Number((remainder - 0.01).toFixed(2));
      }
      return { ...c, weightPercentage: nextWeight };
    });

    const nextCriteria = criteria.map((c) => nextSorted.find((s) => s.id === c.id) ?? c);

    for (const item of nextCriteria) {
      if (!item.id) return;
      const isNew = item.id.startsWith("new-");
      if (isNew) {
        if (!item.name.trim()) {
          toast.error("Criteria name is required");
          return;
        }
        if (!Number.isFinite(item.maxScore) || item.maxScore <= 0) {
          toast.error("Max score must be greater than 0");
          return;
        }
      }
    }

    try {
      setLoading(true);
      setCriteria(nextCriteria);

      let updatedCriteria = nextCriteria;

      for (const item of nextSorted) {
        if (!item.id) continue;

        if (item.id.startsWith("new-")) {
          const res = await createEvaluationCriteria(eventId, {
            name: item.name,
            description: item.description || undefined,
            maxScore: item.maxScore,
            weightPercentage: item.weightPercentage,
            sortOrder: item.sortOrder,
          });

          updatedCriteria = updatedCriteria.map((c) =>
            c.id === item.id
              ? { ...c, id: res.criteria.id, weightPercentage: item.weightPercentage }
              : c,
          );
        } else {
          await updateEvaluationCriteria(eventId, item.id, {
            weightPercentage: item.weightPercentage,
            sortOrder: item.sortOrder,
          });
          updatedCriteria = updatedCriteria.map((c) =>
            c.id === item.id ? { ...c, weightPercentage: item.weightPercentage } : c,
          );
        }
      }

      setCriteria(updatedCriteria);
      onUpdate(updatedCriteria);
      setEditing(new Set());
      toast.success("Equalized weights and saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save criteria"));
      console.error(error);
      try {
        const res = await getEvaluationCriteria(eventId);
        const fresh = res.criteria || [];
        setCriteria(fresh);
        onUpdate(fresh);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriteria = () => {
    const newCriteria: CriteriaFormData = {
      id: `new-${Date.now()}`,
      name: "",
      maxScore: 100,
      weightPercentage: 0,
      // description and sortOrder are optional
    };
    setCriteria([...criteria, newCriteria]);
    setEditing(new Set([...editing, newCriteria.id!]));
  };

  const handleUpdateField = (
    id: string,
    field: keyof CriteriaFormData,
    value: CriteriaFormData[keyof CriteriaFormData],
  ) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSave = async (id: string) => {
    try {
      setLoading(true);
      const item = criteria.find((c) => c.id === id);
      if (!item) return;

      if (!item.name.trim()) {
        toast.error("Criteria name is required");
        return;
      }

      if (!Number.isFinite(item.maxScore) || item.maxScore <= 0) {
        toast.error("Max score must be greater than 0");
        return;
      }

      if (
        !Number.isFinite(item.weightPercentage) ||
        item.weightPercentage < 0 ||
        item.weightPercentage > 100
      ) {
        toast.error("Weight percentage must be between 0 and 100");
        return;
      }

      // Clean undefined fields from payload
      const cleanPayload = (obj: Record<string, any>) => {
        const result: Record<string, any> = {};
        Object.entries(obj).forEach(([k, v]) => {
          if (v !== undefined) result[k] = v;
        });
        return result;
      };

      if (id.startsWith("new-")) {
        // Create new criteria
        const res = await createEvaluationCriteria(eventId, {
          name: item.name,
          maxScore: item.maxScore,
          weightPercentage: item.weightPercentage,
          ...(item.description ? { description: item.description } : {}),
          ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
        });

        const nextCriteria = criteria.map((c) => (c.id === id ? { ...c, id: res.criteria.id } : c));
        setCriteria(nextCriteria);
        onUpdate(nextCriteria);
        toast.success("Criteria created");
      } else {
        // Update existing criteria
        await updateEvaluationCriteria(
          eventId,
          id,
          cleanPayload({
            name: item.name,
            maxScore: item.maxScore,
            weightPercentage: item.weightPercentage,
            ...(item.description ? { description: item.description } : {}),
            ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
          }),
        );
        onUpdate(criteria);
        toast.success("Criteria updated");
      }

      setEditing(new Set([...editing].filter((e) => e !== id)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save criteria"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      if (!id.startsWith("new-")) {
        await deleteEvaluationCriteria(eventId, id);
      }
      const nextCriteria = criteria.filter((c) => c.id !== id);
      setCriteria(nextCriteria);
      setEditing(new Set([...editing].filter((e) => e !== id)));
      onUpdate(nextCriteria);
      toast.success("Criteria deleted");
    } catch (error) {
      toast.error("Failed to delete criteria");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await handleDelete(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };
  const { t } = useLanguage();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("gradingSection.criteria")}</CardTitle>
          <Button onClick={handleAddCriteria} size="sm" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            {t("gradingSection.addCriteria")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight Summary */}
        {criteria.length > 0 && (
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
        <div className="space-y-3">
          {criteria.length === 0 ? (
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
              {criteria.map((item) => {
                const isEditing = editing.has(item.id!);

                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        {/* Evaluation Name Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">
                            {t("gradingSection.criteriaName")}
                          </label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateField(item.id!, "name", e.target.value)}
                            placeholder={t("gradingSection.placeholderCriteriaName")}
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        {/* Description Field */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold">
                              {t("gradingSection.criteriaDescription")}
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {(item.description || "").length}/120
                            </span>
                          </div>
                          <Textarea
                            value={item.description ?? ""}
                            onChange={(e) =>
                              handleUpdateField(item.id!, "description", e.target.value)
                            }
                            placeholder={t("gradingSection.placeholderCriteriaDescription")}
                            className="mt-1 min-h-20"
                            disabled={loading}
                          />
                        </div>
                        {/* Max Score Field */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">
                              {t("gradingSection.maxScore")}
                            </label>
                            <Input
                              type="number"
                              value={item.maxScore}
                              onChange={(e) =>
                                handleUpdateField(
                                  item.id!,
                                  "maxScore",
                                  Number.isFinite(parseFloat(e.target.value))
                                    ? parseFloat(e.target.value)
                                    : 0,
                                )
                              }
                              placeholder={t("gradingSection.placeholderMaxScore")}
                              className="mt-1"
                              disabled={loading}
                            />
                          </div>

                          {/* Weight Field */}
                          <div>
                            <label className="text-sm font-semibold">
                              {t("gradingSection.weight")} %
                            </label>
                            <Input
                              type="number"
                              value={item.weightPercentage}
                              onChange={(e) =>
                                handleUpdateField(
                                  item.id!,
                                  "weightPercentage",
                                  Number.isFinite(parseFloat(e.target.value))
                                    ? parseFloat(e.target.value)
                                    : 0,
                                )
                              }
                              placeholder="0-100"
                              className="mt-1"
                              disabled={loading}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSave(item.id!)} disabled={loading} size="sm">
                            {t("gradingSection.save")}
                          </Button>
                          <Button
                            onClick={() =>
                              setEditing(new Set([...editing].filter((e) => e !== item.id)))
                            }
                            variant="outline"
                            disabled={loading}
                            size="sm"
                          >
                            {t("gradingSection.cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              {t("gradingSection.weight")}: {item.weightPercentage}%
                            </Badge>
                            <Badge variant="outline" className="bg-green-500 text-white">
                              {t("gradingSection.maxScore")}: {item.maxScore}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(new Set([...editing, item.id!]))}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDeleteTargetId(item.id!);
                              setDeleteDialogOpen(true);
                            }}
                            variant="destructive"
                            size="sm"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
