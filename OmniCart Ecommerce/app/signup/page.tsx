"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signup } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Always register as customer - users can create a shop later
      const success = await signup(name, email, password, "customer")
      if (success) {
        router.push("/")
      } else {
        setError("Email already exists. Please use a different email.")
      }
    } catch (err: any) {
      console.error("Signup error:", err)
      
      // Provide more specific error messages
      if (err.message === "Failed to fetch" || err.message.includes("fetch")) {
        setError("Cannot connect to server. Please check your internet connection and try again.")
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name" 
                required
                disabled={isLoading}
              />
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                type="email" 
                required
                disabled={isLoading}
              />
              <Input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                type="password" 
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="text-primary underline hover:text-primary/80" href="/login">
                Log in
              </Link>
            </p>
          </div>

          {/* Become a seller info */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Want to sell on OmniCart?</h4>
            <p className="text-xs text-muted-foreground">
              After signing up, you can create your own shop from your profile page and start selling products to customers worldwide!
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
