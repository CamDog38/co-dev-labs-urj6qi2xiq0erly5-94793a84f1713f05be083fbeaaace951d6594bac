import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const response = await fetch("/api/admin/check-admin-exists");
      const data = await response.json();
      setHasAdmin(data.hasAdmin);
    } catch (error) {
      console.error("Error checking admin existence:", error);
      setError("Failed to check admin status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { user, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!user) {
        setError("Failed to sign in");
        return;
      }

      if (!hasAdmin) {
        // If no admin exists, set this user as admin
        const response = await fetch("/api/admin/set-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            role: "admin"
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to set admin role");
          return;
        }

        router.push("/admin");
        return;
      }

      // Check if user has admin role (for existing admin case)
      const response = await fetch("/api/user/role");
      const { role } = await response.json();

      if (role !== "admin") {
        setError("Unauthorized access. Admin privileges required.");
        return;
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {hasAdmin ? "Admin Login" : "Setup First Admin"}
          </CardTitle>
          <CardDescription className="text-center">
            {hasAdmin 
              ? "Please sign in with your admin credentials"
              : "No admin account exists. The first user to log in will become the admin."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (hasAdmin ? "Sign in" : "Set up admin account")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}