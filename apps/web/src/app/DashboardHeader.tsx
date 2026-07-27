import { signOut } from "../auth";
import { AvatarMenu } from "./AvatarMenu";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/problems", label: "Problems" },
  { href: "/revision", label: "Revision" },
  { href: "/insights", label: "Insights" },
] as const;

export function DashboardHeader({
  active,
  displayName,
  githubHandle,
  githubRepo,
  manageUrl,
  connectUrl,
  token,
}: {
  active: (typeof navItems)[number]["href"];
  displayName: string;
  githubHandle: string | null;
  githubRepo: string | null;
  manageUrl?: string;
  connectUrl?: string;
  token: string;
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
      <AvatarMenu
        displayName={displayName}
        githubHandle={githubHandle}
        githubRepo={githubRepo}
        manageUrl={manageUrl}
        connectUrl={connectUrl}
        token={token}
        signOutAction={async () => {
          "use server";
          await signOut();
        }}
      />
    </div>
  );
}
