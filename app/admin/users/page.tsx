"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminUser,
  setAdminUsers,
  setAdminUsersError,
  setAdminUsersLoading,
} from "@/store/slices/admin-users.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAllAdminUsersSnapshot,
  patchUserRole,
  type AdminUserRow,
  type Role,
} from "@/features/admin-users/api";

import UserSummaryCards from "./components/UserSummaryCards";
import UsersToolbar from "./components/UsersToolbar";
import UsersTable from "./components/UsersTable";

type RoleFilter = "ALL" | Role;

export default function AdminCustomersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.adminUsers.items);
  const isLoading = useSelector(
    (state: RootState) => state.adminUsers.isLoading,
  );
  const isHydrated = useSelector(
    (state: RootState) => state.adminUsers.isHydrated,
  );
  const error = useSelector((state: RootState) => state.adminUsers.error);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    dispatch(setAdminUsersLoading(true));
    dispatch(setAdminUsersError(null));
    try {
      const items = await fetchAllAdminUsersSnapshot();
      dispatch(setAdminUsers(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers.";
      dispatch(setAdminUsersError(message));
    } finally {
      dispatch(setAdminUsersLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshUsers();
  }, [isHydrated, refreshUsers]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchQuery =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone ?? "").toLowerCase().includes(q) ||
        (user.city ?? "").toLowerCase().includes(q);

      const matchRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [query, roleFilter, users]);

  const totals = useMemo(() => {
    let admins = 0;
    let withOrders = 0;
    let lifetimeRevenue = 0;
    for (const user of users) {
      if (user.role === "ADMIN") admins += 1;
      if (user.ordersCount > 0) withOrders += 1;
      lifetimeRevenue += user.totalSpend;
    }
    return { admins, withOrders, lifetimeRevenue };
  }, [users]);

  const handleToggleRole = async (user: AdminUserRow) => {
    if (user.id === currentUserId) {
      setMutationError("You can't change your own role.");
      return;
    }

    const next: Role = user.role === "ADMIN" ? "USER" : "ADMIN";
    setMutationError(null);
    setSuccessNote(null);
    setBusyUserId(user.id);

    try {
      const updated = await patchUserRole(user.id, next);
      dispatch(
        patchAdminUser({
          id: user.id,
          changes: { role: updated.role, updatedAt: updated.updatedAt },
        }),
      );
      setSuccessNote(`${user.name || user.email} is now ${next}.`);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update role.";
      setMutationError(message);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="space-y-4">
      <UserSummaryCards
        totalCustomers={users.length}
        admins={totals.admins}
        withOrders={totals.withOrders}
        lifetimeRevenue={totals.lifetimeRevenue}
      />

      <UsersToolbar
        query={query}
        roleFilter={roleFilter}
        visibleCount={visibleUsers.length}
        totalCount={users.length}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onRoleChange={setRoleFilter}
        onRefresh={() => {
          void refreshUsers();
        }}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      <UsersTable
        users={visibleUsers}
        isLoading={isLoading}
        totalCount={users.length}
        busyUserId={busyUserId}
        currentUserId={currentUserId}
        onToggleRole={(user) => {
          void handleToggleRole(user);
        }}
      />
    </section>
  );
}
