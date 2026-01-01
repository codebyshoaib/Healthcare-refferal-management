import { useAppContext, type Referral } from "../context/AppContext";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Loader2 } from "lucide-react";

function StatusBadge({ status }: { status: Referral["status"] }) {
  const cls =
    status === "pending"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 "
      : status === "accepted"
      ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      : status === "rejected"
      ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
      : "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";

  return <Badge className={cls}>{status}</Badge>;
}

export default function IncomingReferralsPage() {
  const {
    organizations,
    referrals,
    loading,
    error,
    clearError,
    fetchOrganizations,
    fetchReferrals,
    updateReferralStatus,
  } = useAppContext();

  const [receiverOrgId, setReceiverOrgId] = useState("");

  useEffect(() => {
    if (organizations.length === 0) fetchOrganizations();
  }, [fetchOrganizations, organizations.length]);

  const receiverOptions = useMemo(
    () =>
      organizations.filter(
        (org) => org.role === "receiver" || org.role === "both"
      ),
    [organizations]
  );

  useEffect(() => {
    if (!receiverOrgId) return;
    fetchReferrals({ receiver_org_id: receiverOrgId });
  }, [receiverOrgId, fetchReferrals]);

  const orgNamesById = useMemo(() => {
    return organizations.reduce((acc, org) => {
      acc[org.id] = org.name;
      return acc;
    }, {} as Record<string, string>);
  }, [organizations]);

  const incomingReferrals = useMemo(() => {
    if (!receiverOrgId) return [];
    return referrals.filter((r) => r.receiver_org_id === receiverOrgId);
  }, [referrals, receiverOrgId]);

  const onAccept = async (id: string) => {
    clearError();
    await updateReferralStatus(id, "accepted");
  };

  const onReject = async (id: string) => {
    clearError();
    await updateReferralStatus(id, "rejected");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-gray-800">
        Incoming Referrals
      </h3>
      {error && (
        <Alert
          variant="destructive"
          className="flex items-center justify-between"
        >
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" onClick={() => clearError()}>
            Dismiss
          </Button>
        </Alert>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="receiverOrgId" className="text-sm font-medium">
            Receiver Organization
          </label>
          <Select value={receiverOrgId} onValueChange={setReceiverOrgId}>
            <SelectTrigger>
              <SelectValue placeholder="Select receiver organization" />
            </SelectTrigger>
            <SelectContent>
              {receiverOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only organizations with role <b>receiver</b> or <b>both</b>
          </p>
          {!receiverOrgId && (
            <p className="text-xs text-muted-foreground">
              Select a receiver organization to view incoming referrals
            </p>
          )}
        </div>
        {receiverOrgId && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Incoming Referrals
            </h4>
            {loading && incomingReferrals.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {incomingReferrals.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No incoming referrals
                  </p>
                )}
                {incomingReferrals.map((r) => {
                  const senderName =
                    orgNamesById[r.sender_org_id] || r.sender_org_id;
                  const isPending = r.status === "pending";

                  return (
                    <div key={r.id} className="p-4 rounded-lg border shadow-sm">
                      <h5 className="text-lg font-semibold text-gray-800">
                        {r.patient_name}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        Sender: {senderName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Status:</span>
                        <StatusBadge status={r.status} />
                      </div>
                      {r.notes && (
                        <p className="text-sm text-muted-foreground">
                          Additional Notes: {r.notes}
                        </p>
                      )}

                      {isPending && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="default"
                            onClick={() => onAccept(r.id)}
                            disabled={loading}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => onReject(r.id)}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
