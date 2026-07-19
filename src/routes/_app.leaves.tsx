import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Check, X, Trash2, MoreHorizontal, Pencil } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/common/status-badge";
import { PaginationBar } from "@/components/common/pagination-bar";
import { LoadingBlock, EmptyState, ErrorState } from "@/components/common/states";
import { Field } from "@/routes/_app.employees";
import { leavesApi } from "@/lib/api/leaves";
import { apiErrorMessage } from "@/lib/api/client";
import { fmtDate } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/api/types";

const leaveTypes: LeaveType[] = ["ANNUAL", "SICK", "CASUAL", "MATERNITY", "UNPAID"];

const schema = z
  .object({
    leaveType: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "UNPAID"]),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().min(1, "Required"),
    reason: z.string().trim().min(1, "Required"),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/leaves")({
  head: () => ({ meta: [{ title: "Leave - Operion" }] }),
  component: LeavesPage,
});

function LeavesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const canApprove = useCan("leaves:approve");
  const canReadAll = useCan("leaves:readAll");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave requests"
        description="Submit and manage time-off requests."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Request leave
          </Button>
        }
      />

      {canReadAll ? (
        <Tabs defaultValue="me">
          <TabsList>
            <TabsTrigger value="me">My requests</TabsTrigger>
            <TabsTrigger value="pending">Pending approval</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <TabsContent value="me" className="mt-4">
            <LeaveTable mode="me" onEdit={setEditing} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <LeaveTable mode="status" status="PENDING" onEdit={setEditing} />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <LeaveTable mode="all" onEdit={setEditing} />
          </TabsContent>
        </Tabs>
      ) : (
        <LeaveTable mode="me" onEdit={setEditing} />
      )}

      <CreateDialog open={open} onOpenChange={setOpen} />
      <EditDialog leave={editing} onOpenChange={(v: boolean) => !v && setEditing(null)} />
    </div>
  );
}

function LeaveTable({
  mode,
  status,
  onEdit,
}: {
  mode: "me" | "all" | "status";
  status?: LeaveStatus;
  onEdit: (leave: LeaveRequest) => void;
}) {
  const [page, setPage] = useState(0);
  const canApprove = useCan("leaves:approve");
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<LeaveRequest | null>(null);
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ["leaves", mode, status, { page }],
    queryFn: () => {
      if (mode === "me") return leavesApi.mine({ page, size: 10, sort: "createdAt,desc" });
      if (mode === "status" && status)
        return leavesApi.byStatus(status, { page, size: 10, sort: "createdAt,desc" });
      return leavesApi.all({ page, size: 10, sort: "createdAt,desc" });
    },
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) =>
      leavesApi.decide(id, status),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (e) => {
      const errorMsg = apiErrorMessage(e);
      if (errorMsg.includes("cannot approve or reject your own")) {
        toast.error("You cannot approve or reject your own leave request");
      } else {
        toast.error(errorMsg);
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => leavesApi.remove(deleting!.id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      setDeleting(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const canApproveRequest = (leave: LeaveRequest) => {
    return canApprove && leave.status === "PENDING" && leave.employeeId !== user?.id;
  };

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} />;
  if ((query.data?.content.length ?? 0) === 0) return <EmptyState title="No leave requests" />;

  return (
    <>
      <TooltipProvider>
        <Card className="overflow-hidden border-border/60 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {mode !== "me" ? <TableHead>Employee</TableHead> : null}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data!.content.map((l) => (
                <TableRow key={l.id}>
                  {mode !== "me" ? (
                    <TableCell className="font-medium">{l.employeeName}</TableCell>
                  ) : null}
                  <TableCell>
                    <StatusBadge value={l.leaveType} />
                  </TableCell>
                  <TableCell>
                    {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {l.reason}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={l.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canApprove && l.status === "PENDING" ? (
                          <>
                            {canApproveRequest(l) ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => decide.mutate({ id: l.id, status: "APPROVED" })}
                                >
                                  <Check className="h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => decide.mutate({ id: l.id, status: "REJECTED" })}
                                >
                                  <X className="h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                      disabled
                                      className="text-muted-foreground cursor-not-allowed"
                                    >
                                      <Check className="h-4 w-4" /> Approve
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>You cannot approve your own leave request</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                      disabled
                                      className="text-muted-foreground cursor-not-allowed"
                                    >
                                      <X className="h-4 w-4" /> Reject
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>You cannot reject your own leave request</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </>
                        ) : null}
                        {(mode === "me" && l.status === "PENDING") ? (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(l)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(l)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar
            page={page}
            totalPages={query.data!.totalPages}
            totalElements={query.data!.totalElements}
            onPageChange={setPage}
          />
        </Card>
      </TooltipProvider>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete leave request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" },
  });

  const mutation = useMutation({
    mutationFn: leavesApi.create,
    onSuccess: () => {
      toast.success("Leave request submitted");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      form.reset({ leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Type">
            <Select
              value={form.watch("leaveType")}
              onValueChange={(v) => form.setValue("leaveType", v as LeaveType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" error={form.formState.errors.startDate?.message}>
              <Input type="date" {...form.register("startDate")} />
            </Field>
            <Field label="End date" error={form.formState.errors.endDate?.message}>
              <Input type="date" {...form.register("endDate")} />
            </Field>
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea rows={3} {...form.register("reason")} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  leave,
  onOpenChange,
}: {
  leave: LeaveRequest | null;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: leave
      ? {
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          reason: leave.reason,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => leavesApi.update(leave!.id, v),
    onSuccess: () => {
      toast.success("Leave request updated");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Dialog open={!!leave} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit leave request</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Type">
            <Select
              value={form.watch("leaveType")}
              onValueChange={(v) => form.setValue("leaveType", v as LeaveType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" error={form.formState.errors.startDate?.message}>
              <Input type="date" {...form.register("startDate")} />
            </Field>
            <Field label="End date" error={form.formState.errors.endDate?.message}>
              <Input type="date" {...form.register("endDate")} />
            </Field>
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea rows={3} {...form.register("reason")} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
