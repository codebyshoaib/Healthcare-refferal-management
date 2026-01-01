import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function SendReferralPage() {
  const navigate = useNavigate();

  const {
    organizations,
    loading,
    error,
    clearError,
    fetchOrganizations,
    createReferral,
  } = useAppContext();

  const [senderOrgId, setSenderOrgId] = useState("");
  const [receiverOrgId, setReceiverOrgId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (organizations.length === 0) fetchOrganizations();
  }, [fetchOrganizations, organizations.length]);

  const senderOptions = useMemo(
    () =>
      organizations.filter(
        (org) => org.role === "sender" || org.role === "both"
      ),
    [organizations]
  );
  const receiverOptions = useMemo(
    () =>
      organizations.filter(
        (org) => org.role === "receiver" || org.role === "both"
      ),
    [organizations]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!senderOrgId || !receiverOrgId) return;
    if (senderOrgId === receiverOrgId) {
      return;
    }

    const created = await createReferral({
      sender_org_id: senderOrgId,
      receiver_org_id: receiverOrgId,
      patient_name: patientName.trim(),
      insurance_number: insuranceNumber.trim(),
      notes: notes.trim() || undefined,
    });

    if (created) {
      setSenderOrgId("");
      setReceiverOrgId("");
      setPatientName("");
      setInsuranceNumber("");
      setNotes("");
      navigate("/incoming-referrals");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-gray-800">Send Referral</h3>
      {error && (
        <Alert
          variant="destructive"
          className="flex items-center justify-between"
        >
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="senderOrgId" className="text-sm font-medium">
              Sender Organization
            </label>
            <Select value={senderOrgId} onValueChange={setSenderOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sender organization" />
              </SelectTrigger>
              <SelectContent>
                {senderOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only organizations with role <b>sender</b> or <b>both</b>
            </p>
          </div>
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
          </div>
          <div className="space-y-2">
            <label htmlFor="patientName" className="text-sm font-medium">
              Patient Name
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              placeholder="Patient name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="insuranceNumber" className="text-sm font-medium">
              Insurance Number
            </label>
            <Input
              value={insuranceNumber}
              onChange={(e) => setInsuranceNumber(e.target.value)}
              required
              placeholder="Insurance number"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additonal notes"
            />
          </div>
          <Button
            type="submit"
            disabled={
              loading ||
              !senderOrgId ||
              !receiverOrgId ||
              !patientName ||
              !insuranceNumber
            }
            className="p-5"
          >
            {loading ? "Sending..." : "Send Referral"}
          </Button>
        </div>
      </form>
    </div>
  );
}
