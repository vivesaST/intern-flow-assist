import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function PlacementRequired({ feature = "this feature" }: { feature?: string }) {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 grid place-items-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Awaiting placement assignment</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          You need a confirmed placement and assigned supervisor before you can use {feature}.
          Please contact your internship coordinator.
        </p>
      </CardContent>
    </Card>
  );
}