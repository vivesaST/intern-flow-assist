import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, XCircle } from "lucide-react";

export function PlacementRequired({
  feature = "this feature",
  requestStatus,
  reviewNote,
}: {
  feature?: string;
  requestStatus?: string | null;
  reviewNote?: string | null;
}) {
  const pending = requestStatus === "pending";
  const rejected = requestStatus === "rejected" || requestStatus === "more_info";

  const Icon = pending ? Clock : rejected ? XCircle : AlertCircle;
  const tone = pending
    ? "bg-blue-100 text-blue-700"
    : rejected
      ? "bg-destructive/10 text-destructive"
      : "bg-amber-100 text-amber-700";

  const heading = pending
    ? "Placement request under review"
    : rejected
      ? requestStatus === "more_info"
        ? "More information needed"
        : "Placement request rejected"
      : "No placement assigned yet";

  const body = pending
    ? `Your coordinator is reviewing your placement request. ${feature} unlocks as soon as it is approved.`
    : rejected
      ? reviewNote || "Your coordinator asked you to revise and resubmit your placement request."
      : `Submit a placement request with your acceptance letter to unlock ${feature}.`;

  return (
    <Card>
      <CardContent className="p-10 text-center space-y-4">
        <div className={`mx-auto h-12 w-12 rounded-full grid place-items-center ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{heading}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
        </div>
        {!pending && (
          <Button asChild>
            <Link to="/placement-request">
              {rejected ? "Edit and resubmit request" : "Submit placement request"}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
