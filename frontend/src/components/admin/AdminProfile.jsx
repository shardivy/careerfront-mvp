import { useCallback, useRef, useState } from "react";
import {
  LayoutDashboard,
  Camera,
  Save,
  KeyRound,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Briefcase,
  UserCog,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

/**
 * AdminProfile
 *
 * Every field below is sourced from a real column in the schema — see the
 * inline `table.column` comments. Nothing here is invented; where the
 * schema doesn't have a concept yet (e.g. session management has no
 * `admin_sessions` table), it's left out rather than faked.
 *
 * Tables used:
 *   users                 -> identity, contact, verification, status
 *   organization_members  -> designation, employee code, reporting line
 *   roles / user_roles    -> role badges (a user can hold multiple roles)
 *
 * Wire-up:
 *   GET  /api/admin/me            -> users + organization_members(is_primary=true) + user_roles -> roles
 *   PATCH /api/admin/me           -> users (first_name, last_name, mobile, profile_photo)
 *   POST /api/admin/me/password   -> users.password_hash (+ bumps password_changed_at)
 */

// ---- Sample data (wire these up to your API) -----------------------------

// users table
const INITIAL_USER = {
  public_id: "550e8400-e29b-...",
  first_name: "Elena",
  last_name: "Dsouza",
  email: "elena.dsouza@truemindpath.com",
  mobile: "+91 98200 11234",
  profile_photo: "",
  is_email_verified: true,
  is_mobile_verified: false,
  status: "ACTIVE", // ACTIVE | INACTIVE | BLOCKED | DELETED
  last_login_at: "2026-07-30 09:12",
  password_changed_at: "2026-05-02",
  created_at: "2023-03-14",
};

// organization_members row where is_primary = TRUE
const PRIMARY_MEMBERSHIP = {
  organization_name: "TrueMindPath HQ",
  employee_code: "EMP0012",
  designation: "Platform Operations Lead",
  joining_date: "2023-03-14",
  reporting_to_name: "Rahul Sharma",
  is_primary: true,
  status: "ACTIVE",
};

// roles the user holds, via user_roles -> roles (a user can have more than one)
const ASSIGNED_ROLES = [
  { code: "SUPER_ADMIN", name: "Super Admin", assigned_at: "2023-03-14" },
  { code: "ORGANIZATION_ADMIN", name: "Organization Admin", assigned_at: "2024-01-10" },
];

const PROFILE_TABS = ["Profile", "Organization & Roles", "Security"];

// ---- Small building blocks -------------------------------------------------

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-medium text-slate-500">{children}</label>
);

const FieldSource = ({ children }) => (
  <p className="mt-1 font-mono text-[10px] text-slate-300">{children}</p>
);

const TextInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400",
        Icon ? "pl-9 pr-3" : "px-3"
      )}
    />
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: adminTheme.badge.positive,
    INACTIVE: adminTheme.badge.neutral,
    BLOCKED: adminTheme.badge.negative,
    DELETED: adminTheme.badge.negative,
  };
  return <span className={map[status] || adminTheme.badge.neutral}>{status}</span>;
};

const VerificationRow = ({ label, verified, icon: Icon, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{value}</p>
      </div>
    </div>
    {verified ? (
      <span className={cn(adminTheme.badge.positive, "gap-1")}>
        <ShieldCheck className="h-3 w-3" />
        Verified
      </span>
    ) : (
      <span className={cn(adminTheme.badge.negative, "gap-1")}>
        <ShieldAlert className="h-3 w-3" />
        Unverified
      </span>
    )}
  </div>
);

// ---- Sections ---------------------------------------------------------------

const TopBar = ({ dirty, onSave }) => (
  <div className={cn("border-b bg-white", adminTheme.border.default)}>
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-4 px-3 py-5 sm:px-4 lg:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutDashboard className="h-5 w-5 text-slate-400" />
          Admin Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">users · organization_members · user_roles</p>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!dirty}
        className={cn(adminTheme.actionButton.primary, !dirty && "cursor-not-allowed opacity-50 hover:bg-slate-900")}
      >
        <Save className="h-4 w-4" />
        Save Changes
      </button>
    </div>
  </div>
);

const ProfileHeaderCard = ({ user, membership, onAvatarClick }) => {
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn(adminTheme.card.base, adminTheme.card.padding, "flex flex-wrap items-center gap-6")}>
      <div className="relative shrink-0">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
          {initials}
        </div>
        <button
          type="button"
          onClick={onAvatarClick}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
          aria-label="Change avatar"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-w-[200px] flex-1">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-slate-900">{fullName}</p>
          <StatusBadge status={user.status} />
        </div>
        <p className={cn(adminTheme.card.subtitle, "mt-1 flex items-center gap-1.5")}>
          <Building2 className="h-3.5 w-3.5" />
          {membership.organization_name} · {membership.designation}
        </p>
      </div>

      <div className="flex gap-6 border-l border-slate-100 pl-6 text-sm">
        <div>
          <p className="text-xs text-slate-400">Member since</p>
          <p className="mt-0.5 font-medium text-slate-900">{user.created_at}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Last login</p>
          <p className="mt-0.5 font-medium text-slate-900">{user.last_login_at}</p>
        </div>
      </div>
    </div>
  );
};

const TabNav = ({ tab, setTab }) => (
  <div className="flex items-center gap-5 border-b border-slate-200">
    {PROFILE_TABS.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => setTab(option)}
        className={cn(
          "relative pb-3 text-sm font-medium transition-colors",
          option === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
        )}
      >
        {option}
        {option === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-900" />}
      </button>
    ))}
  </div>
);

// users: first_name, last_name, email, mobile, profile_photo
const ProfileTabContent = ({ user, onChange }) => (
  <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
    <p className={adminTheme.card.title}>Personal Information</p>
    <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>Sourced from the users table.</p>

    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel>First name</FieldLabel>
        <TextInput value={user.first_name} onChange={(e) => onChange("first_name", e.target.value)} />
        <FieldSource>users.first_name</FieldSource>
      </div>
      <div>
        <FieldLabel>Last name</FieldLabel>
        <TextInput value={user.last_name} onChange={(e) => onChange("last_name", e.target.value)} />
        <FieldSource>users.last_name</FieldSource>
      </div>
      <div>
        <FieldLabel>Email address</FieldLabel>
        <TextInput icon={Mail} type="email" value={user.email} disabled />
        <FieldSource>users.email — unique, verify separately to change</FieldSource>
      </div>
      <div>
        <FieldLabel>Mobile number</FieldLabel>
        <TextInput icon={Phone} value={user.mobile} onChange={(e) => onChange("mobile", e.target.value)} />
        <FieldSource>users.mobile</FieldSource>
      </div>
    </div>

    <div className="mt-6 space-y-3">
      <VerificationRow
        label="Email verification"
        verified={user.is_email_verified}
        icon={Mail}
        value="users.is_email_verified"
      />
      <VerificationRow
        label="Mobile verification"
        verified={user.is_mobile_verified}
        icon={Phone}
        value="users.is_mobile_verified"
      />
    </div>
  </div>
);

// organization_members: employee_code, designation, joining_date, reporting_to
// user_roles -> roles: multiple role assignments
const OrganizationTabContent = ({ membership }) => (
  <div className="space-y-4">
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <p className={adminTheme.card.title}>Organization Membership</p>
      <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>Sourced from organization_members (is_primary = TRUE).</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Organization</FieldLabel>
          <TextInput icon={Building2} value={membership.organization_name} disabled />
          <FieldSource>organizations.name (via organization_members.organization_id)</FieldSource>
        </div>
        <div>
          <FieldLabel>Employee code</FieldLabel>
          <TextInput value={membership.employee_code} disabled />
          <FieldSource>organization_members.employee_code</FieldSource>
        </div>
        <div>
          <FieldLabel>Designation</FieldLabel>
          <TextInput icon={Briefcase} value={membership.designation} disabled />
          <FieldSource>organization_members.designation</FieldSource>
        </div>
        <div>
          <FieldLabel>Joining date</FieldLabel>
          <TextInput icon={CalendarDays} value={membership.joining_date} disabled />
          <FieldSource>organization_members.joining_date</FieldSource>
        </div>
        <div>
          <FieldLabel>Reporting to</FieldLabel>
          <TextInput icon={UserCog} value={membership.reporting_to_name} disabled />
          <FieldSource>organization_members.reporting_to -&gt; users.id</FieldSource>
        </div>
        <div>
          <FieldLabel>Membership status</FieldLabel>
          <div className="flex h-10 items-center">
            <StatusBadge status={membership.status} />
            {membership.is_primary && <span className={cn(adminTheme.badge.neutral, "ml-2")}>Primary org</span>}
          </div>
          <FieldSource>organization_members.status / is_primary</FieldSource>
        </div>
      </div>
    </div>

    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <p className={adminTheme.card.title}>Assigned Roles</p>
      <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>Sourced from user_roles, joined to roles.</p>

      <ul className="mt-4 divide-y divide-slate-100">
        {ASSIGNED_ROLES.map((role) => (
          <li key={role.code} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{role.name}</p>
                <p className="font-mono text-[10px] text-slate-300">roles.code = {role.code}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Assigned {role.assigned_at}</p>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// users: password_hash (via /password endpoint), password_changed_at, status, last_login_at
const SecurityTabContent = ({ user }) => (
  <div className="space-y-4">
    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <p className={adminTheme.card.title}>Password</p>
      <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>
        Last changed {user.password_changed_at} · updates users.password_hash + password_changed_at
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Current password</FieldLabel>
          <TextInput icon={KeyRound} type="password" placeholder="••••••••" />
        </div>
        <div>
          <FieldLabel>New password</FieldLabel>
          <TextInput icon={KeyRound} type="password" placeholder="••••••••" />
        </div>
        <div>
          <FieldLabel>Confirm new password</FieldLabel>
          <TextInput icon={KeyRound} type="password" placeholder="••••••••" />
        </div>
      </div>

      <button type="button" className={cn(adminTheme.actionButton.secondary, "mt-5")}>
        Update Password
      </button>
    </div>

    <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
      <p className={adminTheme.card.title}>Account Status</p>
      <p className={cn(adminTheme.card.subtitle, "mt-0.5")}>users.status</p>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Last login</p>
            <p className="text-xs text-slate-400">users.last_login_at</p>
          </div>
        </div>
        <span className="text-sm font-medium text-slate-900">{user.last_login_at}</span>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Note: session/device management isn't in the current schema — there's no admin_sessions table yet. Add one
        if you want per-device sign-out here.
      </p>
    </div>
  </div>
);

// ---- Page --------------------------------------------------------------------

const AdminProfile = () => {
  const [user, setUser] = useState(INITIAL_USER);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("Profile");
  const fileInputRef = useRef(null);

  const handleChange = useCallback((field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    // Replace with: PATCH /api/admin/me { first_name, last_name, mobile, profile_photo }
    setDirty(false);
  }, []);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("min-h-screen", adminTheme.surface.page)}>
      <TopBar dirty={dirty} onSave={handleSave} />

      <main className="mx-auto max-w-[1200px] space-y-5 px-3 py-6 sm:px-4 lg:px-6">
        <ProfileHeaderCard user={user} membership={PRIMARY_MEMBERSHIP} onAvatarClick={handleAvatarClick} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />

        <TabNav tab={tab} setTab={setTab} />

        {tab === "Profile" && <ProfileTabContent user={user} onChange={handleChange} />}
        {tab === "Organization & Roles" && <OrganizationTabContent membership={PRIMARY_MEMBERSHIP} />}
        {tab === "Security" && <SecurityTabContent user={user} />}
      </main>
    </div>
  );
};

export default AdminProfile;