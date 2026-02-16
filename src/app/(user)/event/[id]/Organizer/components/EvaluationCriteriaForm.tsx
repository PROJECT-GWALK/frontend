"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createEvaluationCriteria,
  getEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriteria,
} from "@/utils/apievaluation";
import { useLanguage } from "@/contexts/LanguageContext";

type CriteriaFormData = {
  id?: string;
  name: string;
  description: string;
  maxScore: number;
  weightPercentage: number;
  sortOrder: number;
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
      description: "",
      maxScore: 100,
      weightPercentage: 0,
      sortOrder: criteria.length,
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

      if (id.startsWith("new-")) {
        // Create new criteria
        const res = await createEvaluationCriteria(eventId, {
          name: item.name,
          description: item.description || undefined,
          maxScore: item.maxScore,
          weightPercentage: item.weightPercentage,
          sortOrder: item.sortOrder,
        });

        const nextCriteria = criteria.map((c) => (c.id === id ? { ...c, id: res.criteria.id } : c));
        setCriteria(nextCriteria);
        onUpdate(nextCriteria);
        toast.success("Criteria created");
      } else {
        // Update existing criteria
        await updateEvaluationCriteria(eventId, id, {
          name: item.name,
          description: item.description,
          maxScore: item.maxScore,
          weightPercentage: item.weightPercentage,
          sortOrder: item.sortOrder,
        });
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
    if (!confirm("Are you sure you want to delete this criteria?")) return;

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
      <CardContent className="space-y-4">
        {/* {criteria.length > 0 && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">Weight Summary</div>
                <div className="text-xs text-muted-foreground">
                  {remainingWeight >= 0
                    ? `Remaining: ${remainingWeight.toFixed(2)}%`
                    : `Over: ${Math.abs(remainingWeight).toFixed(2)}%`}
                </div>
              </div>
              <Button onClick={handleAutoBalance} size="sm" variant="outline" disabled={loading}>
                Equalize &amp; save
              </Button>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className={`h-full rounded ${
                    isValidWeight
                      ? "bg-green-600"
                      : totalWeight > 100
                        ? "bg-red-600"
                        : "bg-orange-600"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, totalWeight))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Total</span>
                <span
                  className={`font-bold ${isValidWeight ? "text-green-600" : "text-orange-600"}`}
                >
                  {totalWeight.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )} */}

        {/* Weight Warning */}
        {criteria.length > 0 && !isValidWeight && (
          <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {t("gradingSection.totalWeight")}: {totalWeight.toFixed(2)}%
              </p>
              <p className="text-sm">{t("gradingSection.weightWarning")}</p>
            </div>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-3">
          {criteria.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t("gradingSection.noCriteria")}
            </p>
          ) : (
            criteria.map((item) => {
              const isEditing = editing.has(item.id!);

              return (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
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
                        <div>
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
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          {t("gradingSection.criteriaDescription")}
                        </label>
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
                          onClick={() => setEditing(new Set([...editing, item.id!]))}
                          variant="outline"
                          size="sm"
                          disabled={loading}
                        >
                          {t("gradingSection.edit")}
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id!)}
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
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
