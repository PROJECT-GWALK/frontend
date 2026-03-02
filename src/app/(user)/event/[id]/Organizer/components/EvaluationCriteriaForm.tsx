"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, AlertCircle, BookOpen, Edit2, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  createEvaluationCriteria,
  getEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriteria,
} from "@/utils/apievaluation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableStyle } from "@hello-pangea/dnd";

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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const clonePortalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "0";
    el.style.height = "0";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
    clonePortalRef.current = el;
    return () => {
      clonePortalRef.current = null;
      document.body.removeChild(el);
    };
  }, []);

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
    if (!isEditing) {
      setCriteria(initialCriteria);
      setDeletedIds(new Set());
    }
  }, [initialCriteria, isEditing]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weightPercentage, 0);

  const handleAutoBalance = () => {
    if (criteria.length === 0) return;

    const sorted = criteria.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
    setCriteria(nextCriteria);
    toast.info("Weights auto-balanced. Click Save to apply.");
  };

  const handleAddCriteria = () => {
    const maxSortOrder = criteria.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0);
    const newCriteria: CriteriaFormData = {
      id: `new-${Date.now()}`,
      name: "",
      maxScore: 100,
      weightPercentage: 0,
      sortOrder: maxSortOrder + 1,
    };
    setCriteria((prev) => [...prev, newCriteria]);
    if (!isEditing) setIsEditing(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = tableContainerRef.current;
        el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    });
  };

  const handleUpdateField = (
    id: string,
    field: keyof CriteriaFormData,
    value: CriteriaFormData[keyof CriteriaFormData],
  ) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleDelete = (id: string) => {
    if (id.startsWith("new-")) {
      setCriteria(criteria.filter((c) => c.id !== id));
    } else {
      setDeletedIds(new Set([...deletedIds, id]));
      setCriteria(criteria.filter((c) => c.id !== id));
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(criteria);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCriteria(items);
  };

  const getCloneStyle = (style: DraggableStyle | undefined): CSSProperties => {
    const base = (style as unknown as CSSProperties) ?? {};
    const width = tableRef.current?.getBoundingClientRect().width;
    return {
      ...base,
      width: width ?? base.width,
      pointerEvents: "none",
      zIndex: 9999,
    };
  };

  const handleSaveAll = async () => {
    // Validation
    for (const item of criteria) {
      if (!item.name.trim()) {
        toast.error(t("gradingSection.criteriaNameRequired"));
        return;
      }
      if (!Number.isFinite(item.maxScore) || item.maxScore <= 0) {
        toast.error(t("gradingSection.maxScoreMustBePositive"));
        return;
      }
      if (
        !Number.isFinite(item.weightPercentage) ||
        item.weightPercentage < 0 ||
        item.weightPercentage > 100
      ) {
        toast.error(
          t("gradingSection.weightPercentageMustBeBetween") || "Weight must be between 0 and 100",
        );
        return;
      }
    }

    if (Math.abs(totalWeight - 100) > 0.01 && criteria.length > 0) {
      toast.error(t("gradingSection.weightError") || "Total weight must be exactly 100%");
      return;
    }

    setLoading(true);
    try {
      // 1. Delete removed items
      for (const id of deletedIds) {
        await deleteEvaluationCriteria(eventId, id);
      }

      // 2. Ensure all criteria have sortOrder based on their current position
      const criteriaWithSortOrder = criteria.map((c, index) => ({
        ...c,
        sortOrder: index,
      }));

      // 3. Create/Update items
      const updatedList: CriteriaFormData[] = [];
      for (const item of criteriaWithSortOrder) {
        if (item.id?.startsWith("new-")) {
          const res = await createEvaluationCriteria(eventId, {
            name: item.name,
            maxScore: item.maxScore,
            weightPercentage: item.weightPercentage,
            description: item.description,
            sortOrder: item.sortOrder,
          });
          updatedList.push({ ...item, id: res.criteria.id });
        } else if (item.id) {
          await updateEvaluationCriteria(eventId, item.id, {
            name: item.name,
            maxScore: item.maxScore,
            weightPercentage: item.weightPercentage,
            description: item.description,
            sortOrder: item.sortOrder,
          });
          updatedList.push(item);
        }
      }

      setCriteria(updatedList);
      onUpdate(updatedList);
      setIsEditing(false);
      setDeletedIds(new Set());
      toast.success(t("gradingSection.criteriaUpdated") || "Grading criteria saved successfully");
    } catch (error) {
      console.error(error);
      toast.error(
        getApiErrorMessage(
          error,
          t("gradingSection.failedToSaveCriteria") || "Failed to save criteria",
        ),
      );
      // Refresh from server to ensure consistency
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

  const handleCancel = () => {
    setIsEditing(false);
    setCriteria(initialCriteria);
    setDeletedIds(new Set());
  };

  return (
    <Card className="w-full border-none shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle>{t("gradingSection.criteria")}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                {t("gradingSection.edit") || "Edit Criteria"}
              </Button>
            ) : (
              <>
                <Button onClick={handleAutoBalance} size="sm" variant="secondary">
                  Auto-Balance
                </Button>
                <Button onClick={handleCancel} size="sm" variant="ghost">
                  {t("gradingSection.cancel") || "Cancel"}
                </Button>
                <Button onClick={handleSaveAll} size="sm" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {t("gradingSection.save") || "Save Changes"}
                </Button>
              </>
            )}
          </div>
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
              <div
                ref={tableContainerRef}
                className="border rounded-md max-h-125 overflow-y-auto overflow-x-hidden relative"
              >
                {mounted ? (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <table
                      ref={tableRef}
                      className="w-full caption-bottom text-sm table-fixed text-[11px] sm:text-sm"
                    >
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                          {isEditing && <TableHead className="w-10 p-0 sm:p-2"></TableHead>}
                          <TableHead className="w-[8%] text-center">#</TableHead>
                          <TableHead className="w-[37%] sm:w-[20%] whitespace-normal wrap-break-word p-1 sm:p-2">
                            {t("gradingSection.criteriaName") || "Criteria Name"}
                          </TableHead>
                          <TableHead className="hidden sm:table-cell w-[34%] whitespace-normal wrap-break-word p-2">
                            {t("gradingSection.criteriaDescription") || "Description"}
                          </TableHead>
                          <TableHead className="w-[20%] sm:w-[16%] text-center whitespace-normal p-1 sm:p-2 leading-tight">
                            {t("gradingSection.maxScore") || "Max Score"}
                          </TableHead>
                          <TableHead className="w-[20%] sm:w-[16%] text-center whitespace-normal p-1 sm:p-2 leading-tight">
                            {t("gradingSection.weight") || "Weight"} %
                          </TableHead>
                          {isEditing && <TableHead className="w-10 sm:w-15 p-1 sm:p-2"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <Droppable
                        droppableId="criteria-list"
                        getContainerForClone={() => clonePortalRef.current ?? document.body}
                        renderClone={(provided, snapshot, rubric) => (
                        <table
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                          className="bg-muted shadow-lg table-fixed w-full text-[11px] sm:text-sm"
                          style={{ ...getCloneStyle(provided.draggableProps.style), borderCollapse: "collapse" }}
                        >
                          <TableHeader className="invisible h-0">
                            <TableRow className="h-0">
                              {isEditing && <TableHead className="w-10 h-0 p-0" />}
                              <TableHead className="w-[8%] h-0 p-0" />
                              <TableHead className="w-[37%] sm:w-[20%] h-0 p-0" />
                              <TableHead className="hidden sm:table-cell w-[34%] h-0 p-0" />
                              <TableHead className="w-[20%] sm:w-[16%] h-0 p-0" />
                              <TableHead className="w-[20%] sm:w-[16%] h-0 p-0" />
                              {isEditing && <TableHead className="w-10 sm:w-15 h-0 p-0" />}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="table-row">
                           {isEditing && (
                            <TableCell className="w-10 p-0 text-center align-middle">
                              <div
                                {...provided.dragHandleProps}
                                className="flex h-10 w-10 items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-center font-medium">
                            {rubric.source.index + 1}
                          </TableCell>
                          <TableCell className="whitespace-normal wrap-break-word p-1 sm:p-2 align-top">
                            <span className="font-medium">{criteria[rubric.source.index]?.name}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-normal wrap-break-word">
                            <span className="text-muted-foreground text-sm">
                              {criteria[rubric.source.index]?.description}
                            </span>
                          </TableCell>
                          <TableCell className="text-center p-1 sm:p-2 align-top">
                             {criteria[rubric.source.index]?.maxScore}
                          </TableCell>
                          <TableCell className="text-center p-1 sm:p-2 align-top">
                             {criteria[rubric.source.index]?.weightPercentage}%
                          </TableCell>
                          {isEditing && (
                            <TableCell className="p-1 sm:p-2 align-top text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </TableCell>
                          )}
                            </TableRow>
                          </TableBody>
                        </table>
                      )}
                      >
                        {(provided) => (
                          <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                            {criteria.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={isEditing ? 7 : 5}
                                  className="h-24 text-center text-muted-foreground"
                                >
                                  {t("gradingSection.noCriteria") || "No criteria added yet"}
                                </TableCell>
                              </TableRow>
                            ) : (
                              criteria.map((item, index) => (
                                <Draggable
                                  key={item.id || `temp-${index}`}
                                  draggableId={item.id || `temp-${index}`}
                                  index={index}
                                  isDragDisabled={!isEditing}
                                >
                                  {(provided, snapshot) => (
                                    <TableRow
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? "bg-muted shadow-lg table-row" : ""}
                                      style={{
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      {isEditing && (
                                        <TableCell className="w-10 p-0 text-center align-middle">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="flex h-10 w-10 items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                        </TableCell>
                                      )}
                                      <TableCell className="text-center font-medium">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell className="whitespace-normal wrap-break-word p-1 sm:p-2 align-top">
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <Input
                                              value={item.name}
                                              onChange={(e) => handleUpdateField(item.id!, "name", e.target.value)}
                                              placeholder={t("gradingSection.placeholderCriteriaName")}
                                            className="h-8 text-[11px] sm:text-sm w-full min-w-0"
                                            />
                                            <div className="sm:hidden">
                                              <Input
                                                value={item.description || ""}
                                                onChange={(e) =>
                                                  handleUpdateField(item.id!, "description", e.target.value)
                                                }
                                                placeholder={t("gradingSection.placeholderCriteriaDescription")}
                                              className="h-8 text-[11px] sm:text-sm w-full min-w-0"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="sm:hidden mt-1 text-[11px] text-muted-foreground whitespace-normal wrap-break-word">
                                              {item.description || "-"}
                                            </div>
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="hidden sm:table-cell whitespace-normal wrap-break-word">
                                        {isEditing ? (
                                          <Input
                                            value={item.description || ""}
                                            onChange={(e) =>
                                              handleUpdateField(item.id!, "description", e.target.value)
                                            }
                                            placeholder={t("gradingSection.placeholderCriteriaDescription")}
                                          className="h-8 text-[11px] sm:text-sm w-full min-w-0"
                                          />
                                        ) : (
                                          <span className="text-muted-foreground text-sm">{item.description}</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center p-1 sm:p-2 align-top">
                                        {isEditing ? (
                                          <Input
                                            type="number"
                                            min={0}
                                            className="h-8 text-center text-[11px] sm:text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={item.maxScore === 0 ? "" : item.maxScore}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === "") {
                                                handleUpdateField(item.id!, "maxScore", 0);
                                                return;
                                              }
                                              const num = Number(val);
                                              if (!isNaN(num)) {
                                                handleUpdateField(item.id!, "maxScore", Math.max(0, num));
                                              }
                                            }}
                                          />
                                        ) : (
                                          item.maxScore
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center p-1 sm:p-2 align-top">
                                        {isEditing ? (
                                          <Input
                                            type="number"
                                            min={0}
                                            placeholder="0-100%"
                                            className="h-8 text-center text-[11px] sm:text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={item.weightPercentage === 0 ? "" : item.weightPercentage}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === "") {
                                                handleUpdateField(item.id!, "weightPercentage", 0);
                                                return;
                                              }
                                              const num = Number(val);
                                              if (!isNaN(num)) {
                                                handleUpdateField(item.id!, "weightPercentage", Math.max(0, num));
                                              }
                                            }}
                                          />
                                        ) : (
                                          `${item.weightPercentage}%`
                                        )}
                                      </TableCell>
                                      {isEditing && (
                                        <TableCell className="p-1 sm:p-2 align-top text-center">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(item.id!)}
                                          >
                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </Button>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </table>
                  </DragDropContext>
                ) : null}
              </div>

        {isEditing && (
          <Button onClick={handleAddCriteria} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t("gradingSection.addCriteria") || "Add Criteria"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
