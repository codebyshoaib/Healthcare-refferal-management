import { type FormEvent, useEffect, useState } from "react";
import { useAppContext, type CoverageAreaInput } from "../context/AppContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { X } from "lucide-react";

const ORG_TYPES = [
  "clinic",
  "pharmacy",
  "home_health",
  "nursing_home",
  "transportation",
  "dme",
];
const ORG_ROLES = ["sender", "receiver", "both"];

export default function OrganizationsPage() {
  const {
    organizations,
    loading,
    error,
    clearError,
    fetchOrganizations,
    createOrganization,
  } = useAppContext();

  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("clinic");
  const [role, setRole] = useState("both");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [coverage, setCoverage] = useState<CoverageAreaInput[]>([
    { state: "CA", county: "", city: "", zip_code: "" },
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const addCoverageRow = () =>
    setCoverage((p) => [
      ...p,
      { state: "CA", county: "", city: "", zip_code: "" },
    ]);

  const removeCoverageRow = (idx: number) =>
    setCoverage((p) => (p.length === 1 ? p : p.filter((_, i) => i !== idx)));

  const updateCoverageRow = (idx: number, patch: Partial<CoverageAreaInput>) =>
    setCoverage((p) => p.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const applyFilters = async () => {
    const filters: any = {};
    if (typeFilter) filters.type = typeFilter;
    if (roleFilter) filters.role = roleFilter;
    await fetchOrganizations(filters);
  };

  const clearFilters = async () => {
    setTypeFilter("");
    setRoleFilter("");
    await fetchOrganizations();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    const cleanedCoverage = coverage
      .map((c) => ({
        state: c.state.trim(),
        county: c.county?.trim() || undefined,
        city: c.city?.trim() || undefined,
        zip_code: c.zip_code.trim(),
      }))
      .filter((c) => c.zip_code.length > 0);

    const created = await createOrganization({
      name: name.trim(),
      type,
      role,
      contact_info: {
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      },
      coverage_areas: cleanedCoverage.length ? cleanedCoverage : undefined,
    });

    if (created) {
      setName("");
      setEmail("");
      setPhone("");
      setCoverage([{ state: "CA", county: "", city: "", zip_code: "" }]);
      await fetchOrganizations();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-gray-800">Organizations</h3>

      {error && (
        <Alert
          variant="destructive"
          className="flex items-center justify-between"
        >
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-4"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create */}
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Register a new healthcare organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Organization name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Type
                  </label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value)
                    }
                    placeholder="555-1234"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Coverage Areas</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCoverageRow}
                  >
                    + Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {coverage.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2">
                      <Input
                        placeholder="State"
                        value={c.state}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCoverageRow(idx, { state: e.target.value })
                        }
                        className="text-sm"
                      />
                      <Input
                        placeholder="County"
                        value={c.county || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCoverageRow(idx, { county: e.target.value })
                        }
                        className="text-sm"
                      />
                      <Input
                        placeholder="City"
                        value={c.city || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCoverageRow(idx, { city: e.target.value })
                        }
                        className="text-sm"
                      />
                      <Input
                        placeholder="Zip"
                        value={c.zip_code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCoverageRow(idx, { zip_code: e.target.value })
                        }
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeCoverageRow(idx)}
                        disabled={coverage.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full"
              >
                {loading ? "Saving..." : "Create Organization"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>List & Filters</CardTitle>
            <CardDescription>View and filter organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={typeFilter || undefined}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={roleFilter || undefined}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={applyFilters}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1"
                >
                  Apply Filters
                </Button>
                {(typeFilter || roleFilter) && (
                  <Button
                    onClick={clearFilters}
                    disabled={loading}
                    variant="outline"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {loading && organizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="space-y-3">
                  {organizations.map((o) => (
                    <Card
                      key={o.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <strong className="text-lg">{o.name}</strong>
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            {o.type} • {o.role}
                          </span>
                        </div>
                        {(o.contact_info?.email || o.contact_info?.phone) && (
                          <div className="text-sm text-muted-foreground mb-2 flex flex-col">
                            {o.contact_info?.email && (
                              <span>Email: {o.contact_info.email}</span>
                            )}

                            {o.contact_info?.phone && (
                              <span>Phone: {o.contact_info.phone}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {organizations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No organizations found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
