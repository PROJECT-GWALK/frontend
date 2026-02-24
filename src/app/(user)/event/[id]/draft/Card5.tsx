"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, BookOpen, Edit2, AlertCircle, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  onEditingChange?: (isEditing: boolean) => void;
};

export default function Card5(props: Props) {
  const {
    gradingEnabled,
    setGradingEnabled,
    gradingCriteria,
    setGradingCriteria,
    onEditingChange,
  } = props;

  const { t } = useLanguage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [localCriteria, setLocalCriteria] =
    useState<GradingCriteria[]>(gradingCriteria);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalCriteria(gradingCriteria);
    }
    onEditingChange?.(isEditing);
  }, [gradingCriteria, isEditing, onEditingChange]);

  const totalWeight = localCriteria.reduce(
    (sum, c) => sum + c.weightPercentage,
    0,
  );

  const handleAutoBalance = () => {
    if (localCriteria.length === 0) return;

    const sorted = localCriteria
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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

    const nextCriteria = localCriteria.map(
      (c) => nextSorted.find((s) => s.id === c.id) ?? c,
    );
    setLocalCriteria(nextCriteria);
    toast.info("Weights auto-balanced. Click Save to apply.");
  };

  const handleAddCriteria = () => {
    const newCriteria: GradingCriteria = {
      id: `new-${Date.now()}`,
      name: "",
      maxScore: 100,
      weightPercentage: 0,
      // description and sortOrder are optional
    };
    setLocalCriteria([...localCriteria, newCriteria]);
    if (!isEditing) setIsEditing(true);
  };

  const handleUpdateField = (
    id: string,
    field: keyof GradingCriteria,
    value: GradingCriteria[keyof GradingCriteria],
  ) => {
    setLocalCriteria(
      localCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleDeleteCriteria = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    setLocalCriteria(localCriteria.filter((c) => c.id !== deleteTargetId));
    toast.success(
      t("gradingSection.criteriaDeleted") || "Criteria deleted successfully",
    );
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = () => {
    // Validation
    for (const item of localCriteria) {
      if (!item.name.trim()) {
        toast.error(
          t("gradingSection.criteriaNameRequired") ||
            "Criteria name is required",
        );
        return;
      }
      if (!Number.isFinite(item.maxScore) || item.maxScore <= 0) {
        toast.error(
          t("gradingSection.maxScoreMustBePositive") ||
            "Max score must be greater than 0",
        );
        return;
      }
      if (item.weightPercentage < 0 || item.weightPercentage > 100) {
        toast.error(
          t("gradingSection.weightPercentageMustBeBetween") ||
            "Weight must be between 0 and 100",
        );
        return;
      }
    }

    if (Math.abs(totalWeight - 100) > 0.01 && localCriteria.length > 0) {
      toast.error(
        t("gradingSection.weightError") || "Total weight must be exactly 100%",
      );
      return;
    }

    setGradingCriteria(localCriteria);
    setIsEditing(false);
    toast.success(
      t("gradingSection.criteriaUpdated") || "Criteria updated successfully",
    );
  };

  const handleCancel = () => {
    setLocalCriteria(gradingCriteria);
    setIsEditing(false);
  };

  return (
    <Card
      id="card5"
      className="lg:col-span-2 scroll-mt-6 border-none shadow-md"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>{t("gradingSection.title") || "Grading Configuration"}</span>
          </CardTitle>
          {gradingEnabled && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t("gradingSection.edit") || "Edit Criteria"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleAutoBalance}
                    size="sm"
                    variant="secondary"
                  >
                    Auto-Balance
                  </Button>
                  <Button onClick={handleCancel} size="sm" variant="ghost">
                    {t("gradingSection.cancel") || "Cancel"}
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {t("gradingSection.saveChanges") ||
                      t("gradingSection.save") ||
                      "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
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
            <Label
              htmlFor="gradingEnabled"
              className="cursor-pointer font-normal leading-relaxed"
            >
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
              </div>

              {/* Weight Summary */}
              {localCriteria.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {t("gradingSection.totalWeight") || "Total Weight"}
                    </span>
                    <span
                      className={`font-bold ${
                        Math.abs(totalWeight - 100) < 0.01
                          ? "text-green-600 dark:text-green-400"
                          : totalWeight > 100
                            ? "text-red-600 dark:text-red-400"
                            : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {totalWeight.toFixed(2)}%
                    </span>
                  </div>
                  {Math.abs(totalWeight - 100) >= 0.01 && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {t("gradingSection.weightWarning") ||
                        "Total weight should equal 100% for balanced grading"}
                    </p>
                  )}
                </div>
              )}

              {/* Criteria Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">
                        {t("gradingSection.criteriaName") || "Criteria Name"}
                      </TableHead>
                      <TableHead className="w-[35%]">
                        {t("gradingSection.criteriaDescription") ||
                          "Description"}
                      </TableHead>
                      <TableHead className="w-[15%] text-center">
                        {t("gradingSection.maxScore") || "Max Score"}
                      </TableHead>
                      <TableHead className="w-[15%] text-center">
                        {t("gradingSection.weight") || "Weight"} %
                      </TableHead>
                      {isEditing && <TableHead className="w-[5%]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localCriteria.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isEditing ? 5 : 4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {t("gradingSection.noCriteria") ||
                            "No criteria added yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      localCriteria.map((criteria) => (
                        <TableRow key={criteria.id}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                placeholder={
                                  t("gradingSection.placeholderCriteriaName") ||
                                  "Criteria Name"
                                }
                                value={criteria.name}
                                onChange={(e) =>
                                  handleUpdateField(
                                    criteria.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <span className="font-medium">
                                {criteria.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                placeholder={
                                  t(
                                    "gradingSection.placeholderCriteriaDescription",
                                  ) || "Description"
                                }
                                value={criteria.description || ""}
                                onChange={(e) =>
                                  handleUpdateField(
                                    criteria.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {criteria.description}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="1"
                                className="text-center"
                                value={
                                  criteria.maxScore === 0
                                    ? ""
                                    : criteria.maxScore
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val.includes("e") ||
                                    val.includes("E") ||
                                    val.includes("-")
                                  ) {
                                    return;
                                  }
                                  handleUpdateField(
                                    criteria.id,
                                    "maxScore",
                                    val === "" ? 0 : Number(val),
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "e" ||
                                    e.key === "E" ||
                                    e.key === "-"
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            ) : (
                              criteria.maxScore
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                className="text-center"
                                value={
                                  criteria.weightPercentage === 0
                                    ? ""
                                    : criteria.weightPercentage
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val.includes("e") ||
                                    val.includes("E") ||
                                    val.includes("-")
                                  ) {
                                    return;
                                  }
                                  handleUpdateField(
                                    criteria.id,
                                    "weightPercentage",
                                    val === "" ? 0 : Number(val),
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "e" ||
                                    e.key === "E" ||
                                    e.key === "-"
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            ) : (
                              `${criteria.weightPercentage}%`
                            )}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleDeleteCriteria(criteria.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {isEditing && (
                <Button
                  onClick={handleAddCriteria}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("gradingSection.addCriteria") || "Add Criteria"}
                </Button>
              )}
            </div>

            <DeleteConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setDeleteTargetId(null);
              }}
              onConfirm={handleConfirmDelete}
              title={
                t("gradingSection.deleteConfirmTitle") ||
                "Delete grading criteria"
              }
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
