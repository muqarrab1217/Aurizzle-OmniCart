"use client"

import Link from "next/link"
import { ShoppingCart, User, Menu, LogOut, Home, UserCircle, Store } from "lucide-react"
import { useCartStore } from "@/stores/cart-store"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 max-w-6xl mx-auto rounded-lg my-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-white/30 dark:border-gray-700/30 shadow-lg shadow-black/5">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
              OmniCart
            </Link>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm hover:text-primary flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/shop" className="text-sm hover:text-primary">
              Shop
            </Link>
            {/* Show navigation based on authentication and role */}
            {isAuthenticated && user && (
              <>
                {(user.role === "customer") && (
                  <>
                    <Link href="/orders" className="text-sm hover:text-primary">
                      My Orders
                    </Link>
                  </>
                )}
                {(user.role === "manager") && (
                  <>
                    <Link href="/manager/products" className="text-sm hover:text-primary">
                      Products
                    </Link>
                    <Link href="/manager/orders" className="text-sm hover:text-primary">
                      Orders
                    </Link>
                  </>
                )}
                {user.role === "super-admin" && (
                  <>
                    <Link href="/admin/shops" className="text-sm hover:text-primary">
                      Manage Shops
                    </Link>
                    <Link href="/admin/super" className="text-sm hover:text-primary">
                      Super Admin
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <span className="hidden md:inline text-sm text-muted-foreground mr-2">
                  Welcome, {user.name}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 h-9 w-9 p-0 rounded-full">
                      <UserCircle className="h-6 w-6" />
                      <span className="sr-only">Profile menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "customer" && !user.shopId && (
                      <DropdownMenuItem asChild>
                        <Link href="/profile?tab=shop" className="cursor-pointer">
                          <Store className="mr-2 h-4 w-4" />
                          <span>Create Shop</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login" aria-label="Login">
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Button>
              </Link>
            )}
            
            <Link href="/cart" aria-label="Cart">
              <Button variant="outline" className="relative bg-transparent">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
                {count > 0 && (
                  <span
                    aria-label={`${count} items in cart`}
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-medium text-accent-foreground"
                  >
                    {count}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {open && (
          <div className="mt-3 flex flex-col gap-2 md:hidden backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 rounded-xl border border-white/30 dark:border-gray-700/30 p-4 shadow-lg shadow-black/10">
            <Link href="/" className="py-2 text-sm hover:text-primary flex items-center gap-2" onClick={() => setOpen(false)}>
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/shop" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
              Shop
            </Link>
            {/* Show navigation based on authentication and role */}
            {isAuthenticated && user && (
              <>
                {user.role === "customer" && (
                  <Link href="/orders" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                    My Orders
                  </Link>
                )}
                {user.role === "manager" && (
                  <>
                    <Link href="/manager/products" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                      Products
                    </Link>
                    <Link href="/manager/orders" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                      Orders
                    </Link>
                  </>
                )}
                {user.role === "super-admin" && (
                  <>
                    <Link href="/admin/products" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                      Products
                    </Link>
                    <Link href="/admin/shops" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                      Manage Shops
                    </Link>
                    <Link href="/admin/super" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                      Super Admin
                    </Link>
                  </>
                )}
                <div className="border-t pt-2 mt-2">
                  <Link href="/profile" className="py-2 text-sm hover:text-primary flex items-center gap-2" onClick={() => setOpen(false)}>
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  {user.role === "customer" && !user.shopId && (
                    <Link href="/profile?tab=shop" className="py-2 text-sm hover:text-primary flex items-center gap-2" onClick={() => setOpen(false)}>
                      <Store className="h-4 w-4" />
                      Create Shop
                    </Link>
                  )}
                  <button 
                    className="py-2 text-sm hover:text-primary text-left flex items-center gap-2 w-full" 
                    onClick={() => { handleLogout(); setOpen(false); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <Link href="/login" className="py-2 text-sm hover:text-primary" onClick={() => setOpen(false)}>
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
