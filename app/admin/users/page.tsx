"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminUser,
  setAdminUsersPage,
  setAdminUsersError,
  setAdminUsersLoading,
} from "@/store/slices/admin-users.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAdminUsersPage,
  patchUserRole,
  type AdminUserRow,
  type AdminUserQueryParams,
  type Role,
} from "@/features/admin-users/api";
import { notifyActionError, notifyActionSuccess } from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";

import UserSummaryCards from "./components/UserSummaryCards";
import UsersToolbar from "./components/UsersToolbar";
import UsersTable from "./components/UsersTable";
import AdminPagination from "@/components/admin/AdminPagination";

type RoleFilter = "ALL" | Role;

const PAGE_SIZE = 20;

export default function AdminCustomersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.adminUsers.items);
  const meta = useSelector((state: RootState) => state.adminUsers.meta);
  const isLoading = useSelector(
    (state: RootState) => state.adminUsers.isLoading,
  );
  const error = useSelector((state: RootState) => state.adminUsers.error);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (params: AdminUserQueryParams) => {
      dispatch(setAdminUsersLoading(true));
      dispatch(setAdminUsersError(null));
      try {
        const result = await fetchAdminUsersPage(params);
        dispatch(setAdminUsersPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load customers.";
        dispatch(setAdminUsersError(message));
      } finally {
        dispatch(setAdminUsersLoading(false));
      }
    },
    [dispatch],
  );

  // Fetch whenever server query params change
  useEffect(() => {
    const params: AdminUserQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== "ALL") params.role = roleFilter;

    void fetchPage(params);
  }, [page, debouncedSearch, roleFilter, fetchPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((value: RoleFilter) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminUserQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== "ALL") params.role = roleFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, roleFilter, fetchPage]);

  const handleToggleRole = async (user: AdminUserRow) => {
    if (user.id === currentUserId) {
      const message = "You can't change your own role.";
      setMutationError(message);
      notifyActionError(message, message);
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
      const message = `${user.name || user.email} is now ${next}.`;
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update role.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to update role.");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="space-y-4">
      <UserSummaryCards
        totalCustomers={meta?.total ?? users.length}
        admins={meta?.adminCount ?? 0}
        withOrders={meta?.withOrdersCount ?? 0}
        lifetimeRevenue={meta?.lifetimeRevenue ?? 0}
      />

      <UsersToolbar
        query={search}
        roleFilter={roleFilter}
        visibleCount={users.length}
        totalCount={meta?.total ?? users.length}
        isLoading={isLoading}
        onQueryChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onRefresh={handleRefresh}
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
        users={users}
        isLoading={isLoading}
        totalCount={meta?.total ?? users.length}
        busyUserId={busyUserId}
        currentUserId={currentUserId}
        onToggleRole={(user) => {
          void handleToggleRole(user);
        }}
      />

      {meta && meta.totalPages > 1 && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
