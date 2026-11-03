import {
  useCallback, useDeferredValue, useEffect, useId, useMemo, useState,
  type CSSProperties, type FormEvent, type ReactNode,
} from "react";
import { users as seedUsers } from "../data/mockData";
import { ROLES, countBy, isRole, type Role } from "../data/domain";
import { PAGE_PERMISSIONS, useApp } from "../context/AppContext";

/* ───────────── Types & config ───────────── */

type Status = "Active" | "Invited" | "Suspended";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin: string;
  incidents: number;
}

type RoleFilter = "All" | Role;
const FILTERS: readonly RoleFilter[] = ["All", ...ROLES];

const ROLE_TONE: Record<Role, string> = {
  Administrator: "var(--color-red)",
  "Security Officer": "var(--color-cyan)",
  Analyst: "var(--color-purple)",
  Staff: "var(--color-green)",
  Student: "var(--color-amber)",
};

const ROLE_SHORT: Record<Role, string> = {
  Administrator: "Admin", "Security Officer": "Sec. Officer", Analyst: "Analyst", Staff: "Staff", Student: "Student",
};

/** Page rows come straight from PAGE_PERMISSIONS, so this table can't drift from what the app enforces. */
const PAGE_ROWS: { label: string; page: string }[] = [
  { label: "Open Incidents page", page: "incidents" },
  { label: "Open Risk Map", page: "riskmap" },
  { label: "Open Analytics", page: "analytics" },
  { label: "Open Alerts", page: "alerts" },
  { label: "ML Insights", page: "ml" },
  { label: "View Audit Trail", page: "audit" },
  { label: "Manage Users", page: "users" },
  { label: "System Settings", page: "settings" },
];

/** Fine-grained actions aren't in PAGE_PERMISSIONS yet. Move this next to it so both live in one place. */
const ACTION_ROWS: { label: string; roles: readonly Role[] }[] = [
  { label: "View all incidents", roles: ["Administrator", "Security Officer", "Analyst"] },
  { label: "Create incidents", roles: ["Administrator", "Security Officer", "Staff", "Student"] },
  { label: "Edit incidents", roles: ["Administrator", "Security Officer"] },
  { label: "Assign incidents", roles: ["Administrator", "Security Officer"] },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TITLE_RE = /^(dr|lt|sgt|off|eng|prof|mr|mrs|ms)\.?$/i;

/* ───────────── Helpers ───────────── */

const initialUsers = (): ManagedUser[] =>
  seedUsers.flatMap((u) => (isRole(u.role) ? [{ ...u, role: u.role, status: "Active" as Status }] : []));

const initials = (name: string) =>
  name.split(/\s+/).filter((w) => w && !TITLE_RE.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const nextUserId = (list: ManagedUser[]) =>
  `USR-${String(list.reduce((m, u) => Math.max(m, Number(u.id.slice(4)) || 0), 0) + 1).padStart(4, "0")}`;

const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const tone = (role: Role) => ({ "--tone": ROLE_TONE[role] }) as CSSProperties;

/* ───────────── Building blocks ───────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
           className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 id={titleId} className="font-display text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-text-muted text-xs font-mono block mb-1">{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} role="alert" className="text-red text-xs font-mono mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-bg border border-border focus:border-cyan rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim outline-none font-mono disabled:opacity-50";

interface FormValues { name: string; email: string; role: Role; sendOAuth: boolean }

function UserForm({ mode, initial, users, roleLockedReason, onSubmit, onClose }: {
  mode: "invite" | "edit";
  initial?: ManagedUser;
  users: ManagedUser[];
  roleLockedReason: string | null;
  onSubmit: (v: FormValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const [v, setV] = useState<FormValues>({
    name: initial?.name ?? "", email: initial?.email ?? "", role: initial?.role ?? "Student", sendOAuth: true,
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email", string>>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (v.name.trim().length < 2) next.name = "Enter the person’s full name.";
    if (!EMAIL_RE.test(v.email)) next.email = "Enter a valid email address.";
    else if (users.some((u) => u.id !== initial?.id && u.email.toLowerCase() === v.email.toLowerCase()))
      next.email = "A user with this email already exists.";
    setErrors(next);
    if (!Object.keys(next).length) onSubmit({ ...v, name: v.name.trim(), email: v.email.trim() });
  }

  return (
    <Modal title={mode === "invite" ? "Invite user" : `Edit ${initial?.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Field label="Full name" htmlFor={`${uid}-name`} error={errors.name}>
          <input id={`${uid}-name`} autoFocus type="text" value={v.name} placeholder="e.g. Dr. Arjun Sharma"
                 aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-error` : undefined}
                 onChange={(e) => setV({ ...v, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Campus email" htmlFor={`${uid}-email`} error={errors.email}>
          <input id={`${uid}-email`} type="email" value={v.email} placeholder="user@vitstudent.ac.in"
                 disabled={mode === "edit"} aria-invalid={!!errors.email}
                 aria-describedby={errors.email ? `${uid}-email-error` : undefined}
                 onChange={(e) => setV({ ...v, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Role" htmlFor={`${uid}-role`}>
          <select id={`${uid}-role`} value={v.role} disabled={!!roleLockedReason}
                  onChange={(e) => isRole(e.target.value) && setV({ ...v, role: e.target.value })} className={inputCls}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {roleLockedReason && <p className="text-amber text-xs font-mono mt-1">{roleLockedReason}</p>}
        </Field>
        {mode === "invite" && (
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id={`${uid}-oauth`} checked={v.sendOAuth}
                   onChange={(e) => setV({ ...v, sendOAuth: e.target.checked })}
                   className="w-4 h-4 rounded border-border bg-bg accent-cyan" />
            <label htmlFor={`${uid}-oauth`} className="text-xs text-text-muted font-mono">Send Google OAuth invitation link</label>
          </div>
        )}
        <div className="flex gap-2 pt-3">
          <button type="submit" className="btn-primary flex-1 rounded-lg py-2.5 text-sm">
            {mode === "invite" ? "Send invitation" : "Save changes"}
          </button>
          <button type="button" onClick={onClose}
                  className="flex-1 border border-border text-text-muted rounded-lg py-2.5 text-sm hover:border-border-bright transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UserCard({ user, lockReason, onEdit, onToggle }: {
  user: ManagedUser; lockReason: string | null; onEdit: () => void; onToggle: () => void;
}) {
  const dot = user.status === "Active" ? "bg-green" : user.status === "Invited" ? "bg-amber" : "bg-text-muted";
  const suspended = user.status === "Suspended";
  return (
    <article className={`bg-surface border border-border rounded-xl p-5 card-hover ${suspended ? "opacity-70" : ""}`} style={tone(user.role)}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0"
             style={{
               color: "var(--tone)",
               background: "color-mix(in oklab, var(--tone) 12%, transparent)",
               border: "1px solid color-mix(in oklab, var(--tone) 28%, transparent)",
             }}>
          {initials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text truncate">{user.name}</h3>
          <p className="text-xs font-mono text-text-muted truncate">{user.email}</p>
        </div>
        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dot}`} title={user.status} aria-label={user.status} />
      </div>

      <dl className="space-y-2 text-xs font-mono mb-4">
        {[
          ["Role", <span key="r" className="badge" style={{ "--tone": "var(--tone)" } as CSSProperties}>{user.role}</span>],
          ["User ID", user.id],
          ["Status", user.status],
          ["Last login", user.lastLogin],
          ["Incidents", user.incidents],
        ].map(([k, val]) => (
          <div key={String(k)} className="flex items-center justify-between">
            <dt className="text-text-muted">{k}</dt>
            <dd className="text-text">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <button onClick={onEdit}
                className="flex-1 border border-border text-text-muted hover:text-text hover:border-border-bright rounded-lg py-1.5 text-xs font-mono transition-colors">
          Edit
        </button>
        <button onClick={onToggle} disabled={!suspended && !!lockReason} title={!suspended ? lockReason ?? undefined : undefined}
                className={`flex-1 rounded-lg py-1.5 text-xs font-mono transition-colors border disabled:opacity-40 disabled:pointer-events-none ${
                  suspended
                    ? "border-green/30 text-green/80 hover:text-green hover:border-green/50"
                    : "border-red/20 text-red/60 hover:text-red hover:border-red/40"}`}>
          {suspended ? "Reactivate" : "Suspend"}
        </button>
      </div>
    </article>
  );
}

function PermissionMatrix() {
  const rows = useMemo(() => [
    ...ACTION_ROWS.map((r) => ({ label: r.label, has: (role: Role) => r.roles.includes(role) })),
    ...PAGE_ROWS.map((r) => ({ label: r.label, has: (role: Role) => PAGE_PERMISSIONS[role]?.includes(r.page) ?? false })),
  ], []);

  return (
    <section className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-display font-semibold text-text tracking-wide">Role permission matrix</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Which roles can use each feature</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="text-left px-5 py-3 text-text-muted text-xs font-mono">Permission</th>
              {ROLES.map((r) => (
                <th key={r} scope="col" className="px-4 py-3 text-text-muted text-xs font-mono text-center whitespace-nowrap">{ROLE_SHORT[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                <th scope="row" className="px-5 py-3 text-sm text-text text-left font-normal">{row.label}</th>
                {ROLES.map((role) => {
                  const yes = row.has(role);
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <span className="sr-only">{yes ? "Allowed" : "Not allowed"}</span>
                      <svg aria-hidden className={`w-4 h-4 mx-auto ${yes ? "text-green" : "text-border"}`} viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" strokeWidth="2.5">
                        {yes ? <polyline points="20 6 9 17 4 12" /> : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
                      </svg>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────── Page ───────────── */

type Dialog =
  | { kind: "invite" }
  | { kind: "edit"; id: string }
  | { kind: "suspend"; id: string }
  | null;

export default function UserManagement() {
  const { user: me, addAuditLog, showToast } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const deferredQuery = useDeferredValue(query);
  const closeDialog = useCallback(() => setDialog(null), []);

  const counts = useMemo(() => countBy(users, (u) => u.role), [users]);
  const activeAdmins = users.filter((u) => u.role === "Administrator" && u.status === "Active").length;

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return users.filter((u) =>
      (roleFilter === "All" || u.role === roleFilter) &&
      (!q || [u.name, u.email, u.id].some((s) => s.toLowerCase().includes(q))));
  }, [users, roleFilter, deferredQuery]);

  /** Why this user's access can't be reduced right now, or null if it can. */
  function lockReason(u: ManagedUser): string | null {
    if (u.email === me?.email) return "You can’t reduce your own access.";
    if (u.role === "Administrator" && u.status === "Active" && activeAdmins <= 1)
      return "At least one active administrator is required.";
    return null;
  }

  function audit(action: string, entity: string, prev: string, next: string) {
    addAuditLog({ user: me?.email ?? "unknown", action, entity, prev, next, time: stamp(), ip: "10.4.x.x" });
  }

  function handleInvite(v: FormValues) {
    const created: ManagedUser = {
      id: nextUserId(users), name: v.name, email: v.email, role: v.role,
      status: "Invited", lastLogin: "—", incidents: 0,
    };
    setUsers((prev) => [created, ...prev]);
    audit("USER_INVITED", created.id, "—", v.role);
    showToast({ type: "success", title: "Invitation sent", message: `${v.name} was invited as ${v.role}.` });
    closeDialog();
  }

  function handleEdit(target: ManagedUser, v: FormValues) {
    setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, name: v.name, role: v.role } : u)));
    if (v.role !== target.role) audit("USER_ROLE_MODIFIED", target.id, target.role, v.role);
    showToast({ type: "success", title: "User updated", message: `${v.name} saved.` });
    closeDialog();
  }

  function setSuspended(target: ManagedUser, suspend: boolean) {
    const next: Status = suspend ? "Suspended" : "Active";
    setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, status: next } : u)));
    audit(suspend ? "USER_SUSPENDED" : "USER_REACTIVATED", target.id, target.status, next);
    showToast({ type: suspend ? "warning" : "success", title: suspend ? "User suspended" : "User reactivated", message: target.name });
    closeDialog();
  }

  const editing = dialog?.kind === "edit" ? users.find((u) => u.id === dialog.id) : undefined;
  const suspending = dialog?.kind === "suspend" ? users.find((u) => u.id === dialog.id) : undefined;
  const invited = users.filter((u) => u.status === "Invited").length;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bg">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">User management</h1>
          <p className="text-text-muted text-xs font-mono mt-0.5">
            {users.filter((u) => u.status === "Active").length} active
            {invited > 0 && ` · ${invited} invited`} · {users.length} total
          </p>
        </div>
        <button onClick={() => setDialog({ kind: "invite" })} className="btn-primary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Invite user
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or ID"
               aria-label="Search users" className={`${inputCls} max-w-xs`} />
        <div role="group" aria-label="Filter by role" className="flex flex-wrap gap-2">
          {FILTERS.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} aria-pressed={roleFilter === r}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      roleFilter === r ? "bg-cyan/10 border-cyan/30 text-cyan" : "bg-surface border-border text-text-muted hover:border-border-bright"}`}>
              {r} <span className="opacity-60">{r === "All" ? users.length : counts[r] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} lockReason={lockReason(u)}
                      onEdit={() => setDialog({ kind: "edit", id: u.id })}
                      onToggle={() => (u.status === "Suspended" ? setSuspended(u, false) : setDialog({ kind: "suspend", id: u.id }))} />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 text-center mb-6">
          <p className="text-text text-sm">No users match these filters.</p>
          <button onClick={() => { setQuery(""); setRoleFilter("All"); }} className="text-cyan text-xs font-mono mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      <PermissionMatrix />

      {dialog?.kind === "invite" && (
        <UserForm mode="invite" users={users} roleLockedReason={null} onSubmit={handleInvite} onClose={closeDialog} />
      )}
      {editing && (
        <UserForm mode="edit" initial={editing} users={users}
                  roleLockedReason={lockReason(editing)} onSubmit={(v) => handleEdit(editing, v)} onClose={closeDialog} />
      )}
      {suspending && (
        <Modal title={`Suspend ${suspending.name}?`} onClose={closeDialog}>
          <p className="text-text-muted text-sm mb-5">
            They will lose access immediately. You can reactivate the account at any time, and this action is recorded in the audit trail.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSuspended(suspending, true)}
                    className="flex-1 bg-red/10 border border-red/30 text-red rounded-lg py-2.5 text-sm font-mono hover:bg-red/20 transition-colors">
              Suspend user
            </button>
            <button autoFocus onClick={closeDialog}
                    className="flex-1 border border-border text-text-muted rounded-lg py-2.5 text-sm font-mono hover:border-border-bright transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
