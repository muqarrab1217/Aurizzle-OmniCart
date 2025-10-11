"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useShopStore } from "@/stores/shop-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, Lock, Building, MapPin, Store, Save, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"

export default function ProfilePage() {
  const { user, isAuthenticated, updateUserShop, updateUserProfile } = useAuthStore()
  const { createShop } = useShopStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [activeTab, setActiveTab] = useState("profile")

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.name.split(" ")[0] || "",
    lastName: user?.name.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: "",
    cnic: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [profilePhoto, setProfilePhoto] = useState<string>("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  // Shop Creation State (for customers)
  const [shopCreation, setShopCreation] = useState({
    name: "",
    ownerName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: ""
  })

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "shop") {
      setActiveTab("shop")
    }

    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const response = await api.getProfile()
        if (response.success && response.data) {
          setPersonalInfo(prev => ({
            ...prev,
            phone: response.data.phone || "",
            cnic: response.data.cnic || "",
          }))
          setProfilePhoto(response.data.profilePhoto || "")
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [searchParams, user])

  if (!isAuthenticated || !user) {
    router.push("/login")
    return null
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB")
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Only image files (JPEG, PNG, GIF, WebP) are allowed")
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!photoFile) return

    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await api.uploadProfilePhoto(photoFile)
      if (response.success) {
        const photoPath = response.data.profilePhoto
        setProfilePhoto(photoPath)
        setPhotoPreview("")
        setPhotoFile(null)
        
        // Update local user state
        updateUserProfile({ profilePhoto: photoPath })
        
        setSuccessMessage("Profile photo updated successfully!")
      } else {
        setErrorMessage("Failed to upload photo. Please try again.")
      }
    } catch (error: any) {
      console.error("Upload photo error:", error)
      setErrorMessage(error.message || "An error occurred while uploading photo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSuccessMessage("")
    setErrorMessage("")
    
    // Validate required fields
    if (!personalInfo.firstName || !personalInfo.lastName) {
      setErrorMessage("First name and last name are required!")
      setIsSaving(false)
      return
    }

    try {
      // Update profile
      const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
      const response = await api.updateProfile({
        name: fullName,
        phone: personalInfo.phone,
        cnic: personalInfo.cnic,
      })

      if (response.success) {
        // Update local user state
        updateUserProfile({
          name: fullName,
          phone: personalInfo.phone,
          cnic: personalInfo.cnic,
        })
      }

      // Update password if provided
      if (personalInfo.newPassword) {
        if (personalInfo.newPassword !== personalInfo.confirmPassword) {
          setErrorMessage("New passwords do not match!")
          setIsSaving(false)
          return
        }
        if (!personalInfo.currentPassword) {
          setErrorMessage("Please enter your current password to change it.")
          setIsSaving(false)
          return
        }

        await api.updatePassword(personalInfo.currentPassword, personalInfo.newPassword)
        setPersonalInfo({
          ...personalInfo,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      }

      setSuccessMessage("Profile updated successfully!")
    } catch (error: any) {
      console.error("Update profile error:", error)
      setErrorMessage(error.message || "Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const isProfileComplete = () => {
    // Check both form state and user store to ensure data is saved
    return !!(
      user?.name &&
      (user?.phone || personalInfo.phone) &&
      (user?.cnic || personalInfo.cnic) &&
      (user?.profilePhoto || profilePhoto)
    )
  }

  const handleCreateShop = async () => {
    setIsSaving(true)
    setSuccessMessage("")
    setErrorMessage("")

    // Check if profile is complete
    if (!isProfileComplete()) {
      setErrorMessage("Please complete your profile (name, phone, CNIC, and profile photo) before creating a shop.")
      setIsSaving(false)
      setActiveTab("profile")
      return
    }

    // Validate shop information
    if (!shopCreation.name || !shopCreation.ownerName || !shopCreation.email || !shopCreation.phone || !shopCreation.address) {
      setErrorMessage("Please fill in all shop information fields.")
      setIsSaving(false)
      return
    }

    try {
      const shop = await createShop(shopCreation)
      
      if (shop) {
        // Update user's shopId (but keep as customer until approved)
        updateUserShop(shop._id || shop.id)
        setSuccessMessage("Shop registration submitted successfully! Your shop is pending admin approval. You'll be notified once approved.")
        
        // Stay on profile page to show success message
        setTimeout(() => {
          setSuccessMessage("")
        }, 5000)
      } else {
        setErrorMessage("Failed to create shop. Please try again.")
      }
    } catch (error: any) {
      console.error("Create shop error:", error)
      setErrorMessage(error.message || "An error occurred while creating your shop.")
    }
    
    setIsSaving(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super-admin":
        return "bg-purple-100 text-purple-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "customer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePhoto || photoPreview ? (
                  <img 
                    src={photoPreview || `http://localhost:5000${profilePhoto}`} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`}>
                  {user.role === "super-admin" ? "Super Admin" : user.role === "manager" ? "E-commerce Manager" : "Customer"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Profile and Shop Creation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            {user.role === "customer" && !user.shopId && (
              <TabsTrigger value="shop">Create Shop</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">

        {/* Profile Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>Upload your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview || profilePhoto ? (
                  <img 
                    src={photoPreview || `http://localhost:5000${profilePhoto}`} 
                    alt="Profile preview" 
                    className="h-32 w-32 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  id="photoUpload"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Label htmlFor="photoUpload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Photo</span>
                  </Button>
                </Label>
                {photoFile && (
                  <Button onClick={handleUploadPhoto} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Upload Photo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details (Required for shop creation)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={personalInfo.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC / National ID *</Label>
                <Input
                  id="cnic"
                  placeholder="Enter your CNIC (e.g., 12345-1234567-1)"
                  value={personalInfo.cnic}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, cnic: e.target.value })}
                  required
                />
              </div>
            </div>

            {user.role === "customer" && !user.shopId && !isProfileComplete() && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  Complete all fields above (including profile photo) to create a shop.
                </AlertDescription>
              </Alert>
            )}

            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={personalInfo.currentPassword}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentPassword: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={personalInfo.newPassword}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={personalInfo.confirmPassword}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Save Button for Profile */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Shop Creation Tab (Only for customers without a shop) */}
        {user.role === "customer" && !user.shopId && (
          <TabsContent value="shop" className="space-y-6 mt-6">
            {!isProfileComplete() && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  <strong>Profile Incomplete!</strong>
                  <br />
                  Please complete your profile first (name, phone, CNIC, and profile photo) in the "Profile Information" tab before creating a shop.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Create Your Shop
                </CardTitle>
                <CardDescription>
                  Start selling on OmniCart by creating your own shop. Fill in your shop details below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Shop Name *
                  </Label>
                  <Input
                    id="shopName"
                    placeholder="Enter your shop name"
                    value={shopCreation.name}
                    onChange={(e) => setShopCreation({ ...shopCreation, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Enter owner name"
                    value={shopCreation.ownerName}
                    onChange={(e) => setShopCreation({ ...shopCreation, ownerName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Shop Email *
                    </Label>
                    <Input
                      id="shopEmail"
                      type="email"
                      placeholder="Enter shop email"
                      value={shopCreation.email}
                      onChange={(e) => setShopCreation({ ...shopCreation, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopPhone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Shop Phone *
                    </Label>
                    <Input
                      id="shopPhone"
                      type="tel"
                      placeholder="Enter shop phone number"
                      value={shopCreation.phone}
                      onChange={(e) => setShopCreation({ ...shopCreation, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shop Address *
                  </Label>
                  <Textarea
                    id="shopAddress"
                    placeholder="Enter complete shop address"
                    rows={3}
                    value={shopCreation.address}
                    onChange={(e) => setShopCreation({ ...shopCreation, address: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">What happens after creating a shop?</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Your account will be upgraded to Manager</li>
                    <li>• You'll get access to product and order management</li>
                    <li>• You can start adding products to your shop</li>
                    <li>• You'll be able to manage orders from customers</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateShop}
                    disabled={isSaving || !isProfileComplete()}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Shop...
                      </>
                    ) : (
                      <>
                        <Store className="mr-2 h-4 w-4" />
                        Create Shop
                      </>
                    )}
                  </Button>
                </div>
                {!isProfileComplete() && (
                  <p className="text-sm text-muted-foreground text-center">
                    Complete your profile to enable shop creation
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      </div>
    </section>
  )
}
