import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Lock, Loader2, Users, FileSpreadsheet, LogOut } from "lucide-react";

type Registration = {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  specialty: string;
  hospital: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticatedPassword, setAuthenticatedPassword] = useState<string | null>(null);

  // Retrieve password from session storage if available
  useEffect(() => {
    const saved = sessionStorage.getItem("adminPassword");
    if (saved) setAuthenticatedPassword(saved);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      setAuthenticatedPassword(password);
      sessionStorage.setItem("adminPassword", password);
    }
  };

  const handleLogout = () => {
    setAuthenticatedPassword(null);
    setPassword("");
    sessionStorage.removeItem("adminPassword");
  };

  const { data, isLoading, error } = useQuery<Registration[]>({
    queryKey: ["admin-registrations", authenticatedPassword],
    queryFn: async () => {
      const res = await fetch("/api/admin/registrations", {
        headers: {
          Authorization: `Bearer ${authenticatedPassword}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error("Invalid password");
        }
        throw new Error("Failed to fetch data");
      }
      return res.json();
    },
    enabled: !!authenticatedPassword,
    retry: false,
  });

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = ["ID", "First Name", "Last Name", "Mobile", "Email", "Specialty", "Hospital", "Registration Date"];
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = [
        row.id,
        `"${row.firstName.replace(/"/g, '""')}"`,
        `"${row.lastName.replace(/"/g, '""')}"`,
        `"${row.mobile}"`,
        `"${row.email}"`,
        `"${row.specialty.replace(/"/g, '""')}"`,
        `"${row.hospital.replace(/"/g, '""')}"`,
        `"${new Date(row.createdAt).toLocaleString()}"`,
      ];
      csvRows.push(values.join(","));
    }

    const csvData = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dallah_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authenticatedPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter password to view registrations</p>
          </div>
          
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : "Authentication failed"}
            </div>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Diabetes & Obesity Conference Registrations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={isLoading || !data || data.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                <p className="text-3xl font-bold text-foreground">{data ? data.length : "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-medium text-foreground">Attendees List</h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading registrations...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                Error loading data. Please try again.
              </div>
            ) : data?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No registrations found yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Specialty</th>
                    <th className="px-6 py-3 font-medium">Hospital</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{user.mobile}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{user.specialty}</td>
                      <td className="px-6 py-4 text-foreground">{user.hospital}</td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
