import { ConfigTabs } from "./ConfigTabs";

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      <ConfigTabs />
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
