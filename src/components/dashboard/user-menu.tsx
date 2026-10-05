import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const { data } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    window.location.assign("/login");
  };

  return (
    <div className="flex items-center gap-2">
      {data?.user.email && (
        <span className="hidden md:inline text-sm text-muted-foreground">{data.user.email}</span>
      )}
      <Button variant="ghost" size="sm" onClick={signOut} disabled={signingOut} title="Salir">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </div>
  );
}
