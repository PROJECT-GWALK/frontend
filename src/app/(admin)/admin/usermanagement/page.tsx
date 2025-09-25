/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  banUser,
  unbanUser,
} from "@/utils/apiadmin";
import { User } from "@/utils/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getCurrentUser } from "@/utils/apiuser";
import { Textarea } from "@/components/ui/textarea";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banReason, setBanReason] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // pagination state
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.users);

      const me = await getCurrentUser();
      setCurrentUser(me.user ?? null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, role: "USER" | "ADMIN") => {
    try {
      await updateUserRole(id, role);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleBanConfirm = async (id: string) => {
    try {
      await banUser(id, banReason);
      setBanReason("");
      fetchUsers();
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  const handleUnban = async (id: string) => {
    try {
      await unbanUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  };

  // filter
  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.username?.toLowerCase().includes(keyword)
    );
  });

  // pagination slice
  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex justify-center">
      <div className="space-y-4 w-full max-w-6xl">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>User Management</span>
            <Input
              placeholder="Search by name, email, or username..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          {u.name ?? "—"}
                          {currentUser?.id === u.id && (
                            <span className="ml-1 text-xs text-blue-500">
                              (me)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{u.username ?? "—"}</TableCell>
                        <TableCell>{u.email ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-2xl ${
                              u.role === "ADMIN" ? "bg-accent" : "bg-accent"
                            }`}
                          >
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(u as any).banned ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-2xl bg-destructive text-white">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-2xl bg-green-500 text-white">
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {/* ถ้าเป็นตัวเอง → ไม่ให้ action */}
                          {currentUser?.id === u.id ? (
                            <span>-</span>
                          ) : (
                            <>
                              {/* Change Role */}
                              {!(u as any).banned && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="secondary">
                                      Set{" "}
                                      {u.role === "ADMIN" ? "USER" : "ADMIN"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Confirm Role Change
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Change role of{" "}
                                        <span className="font-semibold">
                                          {u.email ?? u.username}
                                        </span>{" "}
                                        to{" "}
                                        <b>
                                          {u.role === "ADMIN"
                                            ? "USER"
                                            : "ADMIN"}
                                        </b>
                                        ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleRoleChange(
                                            u.id,
                                            u.role === "ADMIN"
                                              ? "USER"
                                              : "ADMIN"
                                          )
                                        }
                                      >
                                        Confirm
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {/* Ban / Unban */}
                              {(u as any).banned ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUnban(u.id)}
                                >
                                  Unban
                                </Button>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="secondary">
                                      Ban
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Ban User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Please provide a reason for banning this
                                        user.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Textarea
                                      className="overflow-hidden resize-none"
                                      rows={3}
                                      placeholder="Reason"
                                      value={banReason}
                                      onChange={(e) =>
                                        setBanReason(e.target.value)
                                      }
                                      onInput={handleAutoResize}
                                    />
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        variant="destructive"
                                        onClick={() => handleBanConfirm(u.id)}
                                      >
                                        Confirm Ban
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              
                              {/* Delete */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete{" "}
                                      <span className="font-semibold">
                                        {u.email ?? u.username}
                                      </span>
                                      .
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      onClick={() => handleDelete(u.id)}
                                    >
                                      Confirm Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                      <span className="px-4 py-2 text-sm">
                        Page {page} of {totalPages || 1}
                      </span>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
