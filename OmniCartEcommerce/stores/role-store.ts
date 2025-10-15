"use client"

import { create } from "zustand"
import type { Role } from "@/lib/types"

// For demo: the "manager" is associated to shop-1 by default
type State = {
  role: Role
  managerShopId?: string
}
type Actions = {
  setRole: (r: Role) => void
  setManagerShop: (id: string) => void
}

export const useRoleStore = create<State & Actions>((set) => ({
  role: "customer",
  managerShopId: "shop-1",
  setRole: (r) => set({ role: r }),
  setManagerShop: (id) => set({ managerShopId: id }),
}))
