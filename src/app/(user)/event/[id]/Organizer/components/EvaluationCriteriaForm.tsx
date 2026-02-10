"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriteria,
} from "@/utils/apievaluation";

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

  const totalWeight = criteria.reduce((sum, c) => sum + c.weightPercentage, 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01; // Allow for floating point precision

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

  const handleUpdateField = (id: string, field: keyof CriteriaFormData, value: any) => {
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

      if (item.maxScore <= 0) {
        toast.error("Max score must be greater than 0");
        return;
      }

      if (item.weightPercentage < 0 || item.weightPercentage > 100) {
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

        setCriteria(criteria.map((c) => (c.id === id ? { ...c, id: res.criteria.id } : c)));
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
        toast.success("Criteria updated");
      }

      setEditing(new Set([...editing].filter((e) => e !== id)));
      onUpdate(criteria);
    } catch (error) {
      toast.error("Failed to save criteria");
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
      setCriteria(criteria.filter((c) => c.id !== id));
      setEditing(new Set([...editing].filter((e) => e !== id)));
      onUpdate(criteria.filter((c) => c.id !== id));
      toast.success("Criteria deleted");
    } catch (error) {
      toast.error("Failed to delete criteria");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evaluation Criteria</CardTitle>
          <Button onClick={handleAddCriteria} size="sm" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add Criteria
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight Warning */}
        {criteria.length > 0 && !isValidWeight && (
          <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Weight Total: {totalWeight.toFixed(2)}%</p>
              <p className="text-sm">Total weight should equal 100%</p>
            </div>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-3">
          {criteria.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No criteria added yet</p>
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
                          <label className="text-sm font-semibold">Name *</label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateField(item.id!, "name", e.target.value)}
                            placeholder="e.g., Creativity"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold">Max Score *</label>
                          <Input
                            type="number"
                            value={item.maxScore}
                            onChange={(e) =>
                              handleUpdateField(item.id!, "maxScore", parseFloat(e.target.value))
                            }
                            placeholder="100"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold">Description</label>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateField(item.id!, "description", e.target.value)
                          }
                          placeholder="Optional description"
                          className="mt-1 min-h-20"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">Weight Percentage (%) *</label>
                        <Input
                          type="number"
                          value={item.weightPercentage}
                          onChange={(e) =>
                            handleUpdateField(
                              item.id!,
                              "weightPercentage",
                              parseFloat(e.target.value),
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
                          Save
                        </Button>
                        <Button
                          onClick={() =>
                            setEditing(new Set([...editing].filter((e) => e !== item.id)))
                          }
                          variant="outline"
                          disabled={loading}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="secondary">{item.weightPercentage}%</Badge>
                          <Badge variant="outline">Max: {item.maxScore}</Badge>
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
                          Edit
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

        {/* Total Weight Display */}
        {criteria.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Total Weight:</span>
              <span className={`font-bold ${isValidWeight ? "text-green-600" : "text-orange-600"}`}>
                {totalWeight.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
