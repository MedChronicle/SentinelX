export const mockUser = {
  name: "Dr. Priya Sharma",
  email: "p.sharma@campus.edu",
  role: "Administrator",
  avatar: "PS",
  lastLogin: "2026-09-13 08:41 UTC",
};

export const stats = {
  totalIncidents: 1284,
  openIncidents: 47,
  criticalIncidents: 12,
  resolvedToday: 23,
  avgResolutionHours: 4.2,
  riskScore: 68,
  anomaliesDetected: 8,
  activeAlerts: 15,
};

export const incidents = [
  { id: "INC-2891", type: "Unauthorized Access", location: "Block C — Server Room", severity: "Critical", status: "Escalated", reporter: "Sgt. Rajan Mehta", assigned: "Lt. Kavita Nair", time: "2026-09-13 07:22", riskScore: 91 },
  { id: "INC-2890", type: "Suspicious Activity", location: "Parking Lot B — Zone 3", severity: "High", status: "Investigating", reporter: "CCTV Auto-Detect", assigned: "Off. Dev Patel", time: "2026-09-13 06:55", riskScore: 74 },
  { id: "INC-2889", type: "Network Security Alert", location: "IT Infrastructure Hub", severity: "Critical", status: "Open", reporter: "IDS System", assigned: "Unassigned", time: "2026-09-13 06:31", riskScore: 88 },
  { id: "INC-2888", type: "Environmental Risk", location: "Chemistry Lab — Wing D", severity: "High", status: "Resolved", reporter: "Sensor Array D-4", assigned: "Dr. Meera Iyer", time: "2026-09-13 05:10", riskScore: 62 },
  { id: "INC-2887", type: "Emergency — Medical", location: "Gymnasium", severity: "Moderate", status: "Resolved", reporter: "Staff — Ankit Rao", assigned: "Medical Unit 1", time: "2026-09-13 04:48", riskScore: 45 },
  { id: "INC-2886", type: "Infrastructure Failure", location: "Admin Block — UPS Room", severity: "High", status: "Investigating", reporter: "SCADA Monitor", assigned: "Eng. Suresh Kumar", time: "2026-09-13 03:30", riskScore: 71 },
  { id: "INC-2885", type: "Unauthorized Access", location: "Research Lab — Floor 5", severity: "Moderate", status: "Closed", reporter: "Access Control Sys", assigned: "Sgt. Rajan Mehta", time: "2026-09-12 22:15", riskScore: 38 },
  { id: "INC-2884", type: "Fire Alarm — False", location: "Cafeteria Block", severity: "Low", status: "Closed", reporter: "Fire Sensor F-12", assigned: "Maint. Team B", time: "2026-09-12 21:00", riskScore: 18 },
  { id: "INC-2883", type: "Network Security Alert", location: "Library — Wi-Fi Zone", severity: "High", status: "Open", reporter: "IDS System", assigned: "Unassigned", time: "2026-09-12 20:44", riskScore: 79 },
  { id: "INC-2882", type: "Suspicious Activity", location: "Student Hostel A", severity: "Moderate", status: "Investigating", reporter: "Guard — Balveer Singh", assigned: "Off. Neha Kapoor", time: "2026-09-12 19:30", riskScore: 52 },
];

export const trendData = [
  { date: "Sep 4", incidents: 18, critical: 2, resolved: 16 },
  { date: "Sep 5", incidents: 24, critical: 4, resolved: 19 },
  { date: "Sep 6", incidents: 15, critical: 1, resolved: 14 },
  { date: "Sep 7", incidents: 31, critical: 7, resolved: 22 },
  { date: "Sep 8", incidents: 27, critical: 5, resolved: 25 },
  { date: "Sep 9", incidents: 20, critical: 3, resolved: 18 },
  { date: "Sep 10", incidents: 35, critical: 8, resolved: 28 },
  { date: "Sep 11", incidents: 29, critical: 6, resolved: 24 },
  { date: "Sep 12", incidents: 42, critical: 10, resolved: 33 },
  { date: "Sep 13", incidents: 47, critical: 12, resolved: 23 },
];

export const incidentTypeData = [
  { name: "Unauthorized Access", value: 312, color: "#ef4444" },
  { name: "Network Security", value: 287, color: "#00d4ff" },
  { name: "Suspicious Activity", value: 241, color: "#f59e0b" },
  { name: "Infrastructure", value: 189, color: "#7c3aed" },
  { name: "Environmental", value: 143, color: "#10b981" },
  { name: "Emergency", value: 112, color: "#ec4899" },
];

export const locationRiskData = [
  { location: "Server Room — Block C", incidents: 87, riskScore: 91, trend: "+12%" },
  { location: "Parking Lot B", incidents: 64, riskScore: 74, trend: "+8%" },
  { location: "Research Labs — F5", incidents: 58, riskScore: 71, trend: "+5%" },
  { location: "IT Infrastructure Hub", incidents: 52, riskScore: 69, trend: "+18%" },
  { location: "Student Hostel A", incidents: 43, riskScore: 55, trend: "-3%" },
  { location: "Chemistry Lab D", incidents: 38, riskScore: 62, trend: "+2%" },
];

export const alerts = [
  { id: "ALT-1041", rule: "Critical incident auto-escalation", incident: "INC-2891", severity: "Critical", time: "07:22", status: "Active", description: "Unauthorized server room access — immediate response required" },
  { id: "ALT-1040", rule: "Repeated location — elevated risk", incident: "INC-2889", severity: "Critical", time: "06:31", status: "Active", description: "3rd network intrusion attempt at IT Hub in 24h window" },
  { id: "ALT-1039", rule: "SLA exceeded — no assignment", incident: "INC-2883", severity: "High", time: "05:00", status: "Active", description: "Network alert unassigned for 15h — SLA breach at 4h" },
  { id: "ALT-1038", rule: "ML anomaly cluster detected", incident: "Multiple", severity: "High", time: "04:30", status: "Acknowledged", description: "Anomaly model flagged 4 correlated incidents overnight" },
  { id: "ALT-1037", rule: "High-risk zone monitoring", incident: "INC-2886", severity: "Moderate", time: "03:30", status: "Acknowledged", description: "UPS failure in Admin Block — power continuity at risk" },
  { id: "ALT-1036", rule: "Repeated location — elevated risk", incident: "INC-2890", severity: "High", time: "06:55", status: "Active", description: "5th suspicious activity in Parking Lot B this week" },
  { id: "ALT-1035", rule: "SLA breach warning", incident: "INC-2888", severity: "Low", time: "Yesterday", status: "Resolved", description: "Environmental alert resolved — SLA met within 6h" },
];

export const mlInsights = [
  { type: "Anomaly Detected", location: "IT Infrastructure Hub", confidence: 94, detail: "Unusual port-scan pattern — 3 AM activity spike inconsistent with baseline", flagged: "2026-09-13 03:12", model: "Isolation Forest" },
  { type: "High-Risk Prediction", location: "Server Room — Block C", confidence: 87, detail: "Access pattern analysis predicts unauthorized attempt within next 6h", flagged: "2026-09-13 05:00", model: "Random Forest" },
  { type: "Trend Alert", location: "Parking Lot B", confidence: 79, detail: "Weekly incident frequency rising 8% — correlates with semester exam period", flagged: "2026-09-13 02:30", model: "Time-Series ARIMA" },
  { type: "Anomaly Detected", location: "Student Hostel A", confidence: 71, detail: "Access card cloning pattern detected — 3 distinct IDs sharing same badge", flagged: "2026-09-12 23:45", model: "Isolation Forest" },
  { type: "Risk Cluster", location: "Research Labs — Floor 5", confidence: 68, detail: "Lab access during off-hours clustered to same individual — review needed", flagged: "2026-09-12 22:10", model: "XGBoost" },
];

export const auditLogs = [
  { id: "AUD-9882", user: "p.sharma@campus.edu", action: "INCIDENT_ESCALATED", entity: "INC-2891", prev: "Investigating", next: "Escalated", time: "2026-09-13 07:25", hash: "a3f9d2c1", ip: "10.4.1.22" },
  { id: "AUD-9881", user: "k.nair@campus.edu", action: "INCIDENT_ASSIGNED", entity: "INC-2891", prev: "Unassigned", next: "Lt. K. Nair", time: "2026-09-13 07:24", hash: "b7e1a4f3", ip: "10.4.1.35" },
  { id: "AUD-9880", user: "system@sentinelx", action: "ALERT_GENERATED", entity: "ALT-1041", prev: "—", next: "Active", time: "2026-09-13 07:22", hash: "c2d8f5a9", ip: "10.4.0.1" },
  { id: "AUD-9879", user: "r.mehta@campus.edu", action: "INCIDENT_CREATED", entity: "INC-2891", prev: "—", next: "Open", time: "2026-09-13 07:22", hash: "d1a7b3e6", ip: "10.4.2.18" },
  { id: "AUD-9878", user: "ids-system@sentinelx", action: "INCIDENT_CREATED", entity: "INC-2889", prev: "—", next: "Open", time: "2026-09-13 06:31", hash: "e8c4f2b7", ip: "10.4.0.3" },
  { id: "AUD-9877", user: "d.patel@campus.edu", action: "INCIDENT_STATUS_CHANGED", entity: "INC-2890", prev: "Open", next: "Investigating", time: "2026-09-13 07:05", hash: "f3b9e1d4", ip: "10.4.3.44" },
  { id: "AUD-9876", user: "p.sharma@campus.edu", action: "USER_ROLE_MODIFIED", entity: "USR-0044", prev: "Analyst", next: "Security Officer", time: "2026-09-13 06:00", hash: "a9d2c7f1", ip: "10.4.1.22" },
  { id: "AUD-9875", user: "system@sentinelx", action: "ML_PREDICTION_STORED", entity: "PRED-0291", prev: "—", next: "Score: 94%", time: "2026-09-13 05:15", hash: "b4e8a3c6", ip: "10.4.0.2" },
];

export const users = [
  { id: "USR-0001", name: "Dr. Priya Sharma", email: "p.sharma@campus.edu", role: "Administrator", status: "Active", lastLogin: "Today 08:41", incidents: 0 },
  { id: "USR-0012", name: "Lt. Kavita Nair", email: "k.nair@campus.edu", role: "Security Officer", status: "Active", lastLogin: "Today 07:24", incidents: 23 },
  { id: "USR-0018", name: "Sgt. Rajan Mehta", email: "r.mehta@campus.edu", role: "Security Officer", status: "Active", lastLogin: "Today 07:22", incidents: 41 },
  { id: "USR-0025", name: "Off. Dev Patel", email: "d.patel@campus.edu", role: "Security Officer", status: "Active", lastLogin: "Today 07:05", incidents: 18 },
  { id: "USR-0033", name: "Dr. Meera Iyer", email: "m.iyer@campus.edu", role: "Analyst", status: "Active", lastLogin: "Yesterday", incidents: 0 },
  { id: "USR-0044", name: "Eng. Suresh Kumar", email: "s.kumar@campus.edu", role: "Security Officer", status: "Active", lastLogin: "Today 03:30", incidents: 12 },
  { id: "USR-0051", name: "Off. Neha Kapoor", email: "n.kapoor@campus.edu", role: "Security Officer", status: "Active", lastLogin: "Yesterday", incidents: 9 },
  { id: "USR-0067", name: "Guard Balveer Singh", email: "b.singh@campus.edu", role: "Staff", status: "Active", lastLogin: "Today 19:30", incidents: 7 },
  { id: "USR-0072", name: "Ankit Rao", email: "a.rao@campus.edu", role: "Staff", status: "Inactive", lastLogin: "Sep 10", incidents: 3 },
];

export const heatmapZones = [
  { id: 1, name: "Server Room — Block C", x: 72, y: 18, risk: 91, incidents: 87, type: "Critical" },
  { id: 2, name: "IT Infrastructure Hub", x: 58, y: 32, risk: 88, incidents: 52, type: "Critical" },
  { id: 3, name: "Parking Lot B", x: 25, y: 65, risk: 74, incidents: 64, type: "High" },
  { id: 4, name: "Research Labs — F5", x: 82, y: 45, risk: 71, incidents: 58, type: "High" },
  { id: 5, name: "Chemistry Lab D", x: 45, y: 55, risk: 62, incidents: 38, type: "High" },
  { id: 6, name: "Student Hostel A", x: 15, y: 35, risk: 55, incidents: 43, type: "Moderate" },
  { id: 7, name: "Cafeteria Block", x: 50, y: 75, risk: 32, incidents: 22, type: "Moderate" },
  { id: 8, name: "Gymnasium", x: 35, y: 82, risk: 28, incidents: 18, type: "Low" },
  { id: 9, name: "Admin Block", x: 62, y: 70, risk: 71, incidents: 31, type: "High" },
  { id: 10, name: "Library", x: 30, y: 50, risk: 48, incidents: 27, type: "Moderate" },
];
