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
import { Badge } from "@/components/ui/badge";
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
import { Shield, ShieldOff, Ban, UserCheck, Trash2, Check, Search } from "lucide-react";
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
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>

      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <Select
            value={filterRole}
            onValueChange={(v) => {
              setFilterRole(v as "ALL" | "ADMIN" | "USER");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name ?? "—"}</div>
                    {currentUser?.id === u.id && (
                      <span className="text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{u.username ?? "—"}</TableCell>
                  <TableCell>{u.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "destructive" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {currentUser?.id === u.id ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <>
                          {!u.banned && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  {u.role === "ADMIN" ? (
                                    <ShieldOff className="h-4 w-4" />
                                  ) : (
                                    <Shield className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Toggle Role</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Change Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to change role of <b>{u.name}</b> to <b>{u.role === "ADMIN" ? "USER" : "ADMIN"}</b>?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRoleChange(
                                        u.id,
                                        u.role === "ADMIN" ? "USER" : "ADMIN"
                                      )
                                    }
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                {u.banned ? (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Ban className="h-4 w-4 text-orange-500" />
                                )}
                                <span className="sr-only">Ban/Unban</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {u.banned ? "Unban User" : "Ban User"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {u.banned
                                    ? "Are you sure you want to unban this user?"
                                    : "Please provide a reason for banning this user."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              {!u.banned && (
                                <div className="py-2">
                                  <Textarea
                                    placeholder="Reason for ban..."
                                    value={banReason}
                                    onChange={(e) => {
                                      setBanReason(e.target.value);
                                      handleAutoResize(e);
                                    }}
                                    className="resize-none overflow-hidden min-h-[80px]"
                                    rows={1}
                                  />
                                </div>
                              )}
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    u.banned
                                      ? handleUnban(u.id)
                                      : handleBanConfirm(u.id)
                                  }
                                  className={!u.banned ? "bg-destructive hover:bg-destructive/90" : ""}
                                >
                                  {u.banned ? "Unban" : "Ban"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <b>{u.name}</b>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(u.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer"
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
                    isActive={pItem === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pItem as number);
                    }}
                    className="cursor-pointer"
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
                className="cursor-pointer"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
