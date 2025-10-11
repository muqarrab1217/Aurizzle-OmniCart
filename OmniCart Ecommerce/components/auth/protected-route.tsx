"use client"

import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { Role } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Role[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Only check authentication after hydration
    if (!isHydrated) return

    if (!isAuthenticated || !user) {
      router.push(redirectTo)
    } else if (!allowedRoles.includes(user.role)) {
      router.push("/")
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, redirectTo, router])

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Router will redirect
  }

  if (!allowedRoles.includes(user.role)) {
    return null // Router will redirect
  }

  return <>{children}</>
}
