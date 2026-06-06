import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AdminRealtime } from "@/components/admin/AdminRealtime";

const AdminRefreshContext = createContext(0);

export function useAdminRefreshTick(): number {
  return useContext(AdminRefreshContext);
}

export function AdminRefreshProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const onChange = useCallback(() => setTick((t) => t + 1), []);

  return (
    <AdminRefreshContext.Provider value={tick}>
      <AdminRealtime onChange={onChange} />
      {children}
    </AdminRefreshContext.Provider>
  );
}
