import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { suggestOrganizations } from "../services/api";

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
  const [patientZipCode, setPatientZipCode] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const handleGetSuggestions = async () => {
    if (!patientZipCode || patientZipCode.length < 3) {
      return;
    }

    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const selectedSender = organizations.find((o) => o.id === senderOrgId);
      const res = await suggestOrganizations({
        patient_zip_code: patientZipCode,
        organization_type: selectedSender?.type,
        sender_org_id: senderOrgId || undefined,
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error("Error getting suggestions:", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (orgId: string) => {
    setReceiverOrgId(orgId);
    setShowSuggestions(false);
  };

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
            <label htmlFor="patientZipCode" className="text-sm font-medium">
              Patient Zip Code
            </label>
            <div className="flex gap-2">
              <Input
                value={patientZipCode}
                onChange={(e) => setPatientZipCode(e.target.value)}
                placeholder="e.g., 90210"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleGetSuggestions}
                disabled={
                  loadingSuggestions ||
                  !patientZipCode ||
                  patientZipCode.length < 3
                }
                variant="outline"
                className="p-4"
              >
                {loadingSuggestions ? "Loading..." : "Get MCP Suggestions"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get MCP Suggestions for the best organization to send this
              referral to
            </p>
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

      {showSuggestions && suggestions.length > 0 && (
        <Card className="p-6 mt-6">
          <h4 className="text-lg font-semibold mb-4">
            Suggestions (Top {suggestions.length})
          </h4>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.organization.id}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() =>
                  handleSelectSuggestion(suggestion.organization.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">
                        {suggestion.organization.name}
                      </h5>
                      <Badge variant="outline">
                        {suggestion.organization.type}
                      </Badge>
                      <Badge variant="secondary">
                        Match: {suggestion.match_score}/100
                      </Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {suggestion.reasons.map((reason: string, i: number) => (
                        <li key={i}>• {reason}</li>
                      ))}
                    </ul>
                    {suggestion.acceptance_stats.total_referrals > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Acceptance Rate:{" "}
                        {suggestion.acceptance_stats.acceptance_rate}% | Total
                        Referrals: {suggestion.acceptance_stats.total_referrals}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSuggestion(suggestion.organization.id);
                    }}
                  >
                    Select
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && !loadingSuggestions && (
        <Card className="p-6 mt-6">
          <p className="text-muted-foreground">
            No organizations found covering zip code {patientZipCode}. Try a
            different zip code.
          </p>
        </Card>
      )}
    </div>
  );
}
