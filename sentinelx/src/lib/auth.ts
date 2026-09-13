export interface AppUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function decodeGoogleCredential(credential: string): GoogleProfile {
  const payload = credential.split(".")[1];
  if (!payload) {
    throw new Error("Malformed Google credential");
  }
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const json = decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  const claims = JSON.parse(json) as { name?: string; email?: string; picture?: string };
  if (!claims.email) {
    throw new Error("Google credential is missing an email claim");
  }
  return {
    name: claims.name ?? claims.email,
    email: claims.email,
    picture: claims.picture,
  };
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_DIRECTORY: Record<string, string> = {
  "p.sharma@campus.edu": "Administrator",
  "k.nair@campus.edu": "Security Officer",
  "m.iyer@campus.edu": "Analyst",
};

export function resolveRole(email: string): string {
  return ROLE_DIRECTORY[email.toLowerCase()] ?? "Student";
}

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: "Dr. Priya Sharma", email: "p.sharma@campus.edu", password: "admin123", role: "Administrator" },
  { name: "Lt. Kavita Nair", email: "k.nair@campus.edu", password: "security123", role: "Security Officer" },
  { name: "Dr. Meera Iyer", email: "m.iyer@campus.edu", password: "analyst123", role: "Analyst" },
  { name: "Ankit Rao", email: "a.rao@campus.edu", password: "staff123", role: "Staff" },
  { name: "Rohan Verma", email: "r.verma@campus.edu", password: "student123", role: "Student" },
];

export function authenticateDemoAccount(email: string, password: string): DemoAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((a) => a.email === normalizedEmail);
  if (!account || account.password !== password) {
    return null;
  }
  return account;
}

export function toAppUser(name: string, email: string, role: string): AppUser {
  return { name, email, role, avatar: initialsFromName(name) };
}
