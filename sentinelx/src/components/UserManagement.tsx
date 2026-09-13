import { useState } from "react";
import { users } from "../data/mockData";

const ROLES = ["All", "Administrator", "Security Officer", "Analyst", "Staff", "Student"];

const ROLE_COLORS: Record<string, string> = {
  Administrator: "#ef4444",
  "Security Officer": "#00d4ff",
  Analyst: "#7c3aed",
  Staff: "#10b981",
  Student: "#f59e0b",
};

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState("All");
  const [showInvite, setShowInvite] = useState(false);

  const filtered = users.filter(u => roleFilter === "All" || u.role === roleFilter);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">User Management</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">{users.filter(u => u.status === "Active").length} active · {users.length} total</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Invite User
        </button>
      </div>

      {/* Role filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${roleFilter === r ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "bg-[#0d1525] border-[#1e3058] text-[#4a6090] hover:border-[#2a4580]"}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* User grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {filtered.map(user => {
          const roleColor = ROLE_COLORS[user.role] || "#4a6090";
          return (
            <div key={user.id} className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 card-hover">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                  style={{ background: `${roleColor}15`, border: `1px solid ${roleColor}30`, color: roleColor }}
                >
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e2eaf8] truncate">{user.name}</p>
                  <p className="text-xs font-mono text-[#4a6090] truncate">{user.email}</p>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${user.status === "Active" ? "bg-[#10b981]" : "bg-[#4a6090]"}`} />
              </div>
              <div className="space-y-2 text-xs font-mono mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#4a6090]">Role</span>
                  <span className="badge" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4a6090]">User ID</span>
                  <span className="text-[#e2eaf8]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4a6090]">Last Login</span>
                  <span className="text-[#e2eaf8]">{user.lastLogin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4a6090]">Incidents</span>
                  <span className="text-[#e2eaf8]">{user.incidents}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 border border-[#1e3058] text-[#4a6090] hover:text-[#e2eaf8] hover:border-[#2a4580] rounded-lg py-1.5 text-xs font-mono transition-colors">Edit</button>
                <button className="flex-1 border border-[#ef4444]/20 text-[#ef4444]/60 hover:text-[#ef4444] hover:border-[#ef4444]/40 rounded-lg py-1.5 text-xs font-mono transition-colors">Suspend</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions matrix */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e3058]">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Role Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3058]">
                <th className="text-left px-5 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider">Permission</th>
                {["Admin", "Sec. Officer", "Analyst", "Staff", "Student"].map(r => (
                  <th key={r} className="px-4 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider text-center whitespace-nowrap">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { perm: "View All Incidents", a: true, so: true, an: true, st: false, stu: false },
                { perm: "Create Incidents", a: true, so: true, an: false, st: true, stu: true },
                { perm: "Edit Incidents", a: true, so: true, an: false, st: false, stu: false },
                { perm: "Assign Incidents", a: true, so: true, an: false, st: false, stu: false },
                { perm: "View Analytics", a: true, so: true, an: true, st: false, stu: false },
                { perm: "ML Insights", a: true, so: false, an: true, st: false, stu: false },
                { perm: "Manage Users", a: true, so: false, an: false, st: false, stu: false },
                { perm: "View Audit Trail", a: true, so: false, an: true, st: false, stu: false },
                { perm: "System Settings", a: true, so: false, an: false, st: false, stu: false },
              ].map(row => (
                <tr key={row.perm} className="border-b border-[#1e3058]/50 hover:bg-[#111e35] transition-colors">
                  <td className="px-5 py-3 text-sm text-[#e2eaf8]">{row.perm}</td>
                  {[row.a, row.so, row.an, row.st, row.stu].map((has, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {has ? (
                        <svg className="w-4 h-4 text-[#10b981] mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#1e3058] mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-md animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-white">Invite User</h2>
              <button onClick={() => setShowInvite(false)} className="text-[#4a6090] hover:text-[#e2eaf8]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Full Name</label>
                <input type="text" placeholder="e.g. Dr. Arjun Sharma" className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"/>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Campus Email</label>
                <input type="email" placeholder="user@campus.edu" className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"/>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Role</label>
                <select className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] outline-none font-mono">
                  {ROLES.slice(1).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="google" className="w-4 h-4 rounded border-[#1e3058] bg-[#0a1020] accent-[#00d4ff]"/>
                <label htmlFor="google" className="text-xs text-[#4a6090] font-mono">Send Google OAuth invitation link</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1 rounded-lg py-2.5 text-sm" onClick={() => setShowInvite(false)}>Send Invitation</button>
              <button onClick={() => setShowInvite(false)} className="flex-1 border border-[#1e3058] text-[#4a6090] rounded-lg py-2.5 text-sm hover:border-[#2a4580] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
