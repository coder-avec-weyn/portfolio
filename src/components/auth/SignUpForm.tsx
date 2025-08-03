import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../../supabase/supabase";
import { Upload, Loader2 } from "lucide-react";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setProfileImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setProfileImagePreview(previewUrl);
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!profileImage) return null;

    setIsUploadingImage(true);
    try {
      // Compress image to WebP format for better performance
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(profileImage);
      });

      // Set canvas dimensions (max 800x800 for high quality)
      const maxSize = 800;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to WebP blob
      const webpBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/webp",
          0.9, // 90% quality
        );
      });

      const fileName = `${userId}/avatar.webp`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("public-profile-images")
        .upload(fileName, webpBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
        throw uploadError;
      }

      return fileName; // Return the storage path
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Image Upload Failed",
        description:
          "Failed to upload profile image. Account created without image.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Upload profile image if provided
      let avatarUrl = null;
      if (profileImage) {
        avatarUrl = await uploadProfileImage(authData.user.id);
      }

      // Update profile with image URL if uploaded
      if (avatarUrl) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      toast({
        title: "Account created successfully",
        description: profileImage
          ? "Please check your email to verify your account. Profile image uploaded successfully!"
          : "Please check your email to verify your account.",
        duration: 5000,
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Error creating account");
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-sm font-medium text-gray-700"
            >
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="profileImage"
              className="text-sm font-medium text-gray-700"
            >
              Profile Image (Optional)
            </Label>
            <div className="flex flex-col items-center space-y-4">
              {profileImagePreview && (
                <div className="relative">
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}
              <div className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profileImage"
                  disabled={isUploadingImage}
                />
                <label
                  htmlFor="profileImage"
                  className="flex items-center justify-center gap-2 w-full h-12 px-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm text-gray-600">
                    {profileImage ? "Change Image" : "Upload Profile Image"}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Max 10MB • JPEG, PNG, GIF, WebP supported
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={isUploadingImage}
            className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <div className="text-xs text-center text-gray-500 mt-6">
            By creating an account, you agree to our{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="text-sm text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
