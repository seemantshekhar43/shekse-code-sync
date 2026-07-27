import { signOut } from "../auth";
import { initials } from "../lib/dashboard-format";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/problems", label: "Problems" },
  { href: "/revision", label: "Revision" },
  { href: "/insights", label: "Insights" },
] as const;

export function DashboardHeader({
  active,
  displayName,
}: {
  active: (typeof navItems)[number]["href"];
  displayName: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-serif text-base font-semibold">
          <span className="h-[9px] w-[9px] rounded-full bg-green shadow-[0_0_0_3px_var(--green-soft)]" />
          ShekseCodeSync
        </div>
        <nav className="flex gap-5 text-sm">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`font-medium ${item.href === active ? "text-ink" : "text-muted"}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          title={`Sign out${displayName ? ` (${displayName})` : ""}`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green text-xs font-semibold text-white"
        >
          {initials(displayName)}
        </button>
      </form>
    </div>
  );
}
