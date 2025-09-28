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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getCurrentUser } from "@/utils/apiuser";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ShieldOff, Ban, UserCheck, Trash2, Check } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banReason, setBanReason] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 10;
  // เพิ่ม state สำหรับตัวกรองบทบาท
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "USER">("ALL");

  const fetchUsers = async () => {
    try {
      // ใช้ค่าจาก filterRole เพื่อเรียก API ที่ให้มา
      const roleParam = filterRole === "ALL" ? undefined : filterRole;
      const res = await getAllUsers(roleParam);
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
  }, [filterRole]); // โหลดใหม่เมื่อเปลี่ยนตัวกรอง

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

  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.username?.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const getRenderedPages = (): (number | "ellipsis")[] => {
    const total = totalPages || 1;
    const pages: (number | "ellipsis")[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    // แสดงหน้าแรก
    pages.push(1);

    if (page > 3) pages.push("ellipsis");

    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < total - 2) pages.push("ellipsis");

    pages.push(total);

    return pages;
  };

  return (
    <div className="flex justify-center">
      <div className="space-y-4 w-full max-w-6xl">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>User Management</span>
            {/* กลุ่มเครื่องมือด้านขวา: Select + Search */}
            <div className="flex items-center gap-2">
              <Select
                value={filterRole}
                onValueChange={(v) => {
                  setFilterRole(v as "ALL" | "ADMIN" | "USER");
                  setPage(1); // รีเซ็ตหน้าเมื่อเปลี่ยนตัวกรอง
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Search by name, email, or username..."
                className="max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                      <TableHead className="text-center">Actions</TableHead>
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
                        <TableCell className="align-middle text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            {/* ถ้าเป็นตัวเอง → ไม่ให้ action */}
                            {currentUser?.id === u.id ? (
                              <span>-</span>
                            ) : (
                              <>
                                {/* Change Role */}
                                {!(u as any).banned && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="secondary" className="gap-2 hover:brightness-90">
                                        {u.role === "ADMIN" ? (
                                          <ShieldOff className="h-4 w-4" />
                                        ) : (
                                          <Shield className="h-4 w-4" />
                                        )}
                                        Set {u.role === "ADMIN" ? "USER" : "ADMIN"}
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
                                          to <b>{u.role === "ADMIN" ? "USER" : "ADMIN"}</b>?
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
                                              u.role === "ADMIN" ? "USER" : "ADMIN"
                                            )
                                          }
                                          className="gap-2 hover:brightness-90"
                                        >
                                          <Check className="h-4 w-4" />
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
                                    className="gap-2 hover:brightness-90"
                                    onClick={() => handleUnban(u.id)}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Unban
                                  </Button>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="secondary" className="gap-2 hover:brightness-90">
                                        <Ban className="h-4 w-4" />
                                        Ban
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Ban User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Please provide a reason for banning this user.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <Textarea
                                        className="overflow-hidden resize-none"
                                        rows={3}
                                        placeholder="Reason"
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        onInput={handleAutoResize}
                                      />
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          onClick={() => handleBanConfirm(u.id)}
                                          className="gap-2 hover:brightness-90"
                                        >
                                          <Ban className="h-4 w-4" />
                                          Confirm Ban
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                
                                {/* Delete */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="gap-2 hover:brightness-90">
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
                                        className="gap-2 hover:brightness-90"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Confirm Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
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
                      {getRenderedPages().map((pItem, idx) =>
                        pItem === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={`page-${pItem}`}>
                            <PaginationLink
                              href="#"
                              isActive={pItem === page}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(pItem as number);
                              }}
                            >
                              {pItem}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages || 1, p + 1))
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
