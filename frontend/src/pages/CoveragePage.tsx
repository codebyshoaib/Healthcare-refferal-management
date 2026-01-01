import {
  useAppContext,
  type CoverageArea,
  type OrganizationWithCoverageAreas,
} from "../context/AppContext";
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
import {
  Loader2,
  Table2,
  LayoutGrid,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type CoverageRow = {
  orgId: string;
  orgName: string;
  orgType: string;
  orgRole: string;
  email?: string;
  phone?: string;
  area: CoverageArea;
};

export default function CoveragePage() {
  const {
    organizations,
    loading,
    error,
    clearError,
    fetchOrganizations,
    fetchOrganization,
  } = useAppContext();

  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [countyFilter, setCountyFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [zipCodeFilter, setZipCodeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [details, setDetails] = useState<
    Record<string, OrganizationWithCoverageAreas>
  >({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (organizations.length === 0) fetchOrganizations();
  }, [fetchOrganizations, organizations.length]);

  useEffect(() => {
    let alive = true;

    const loadAllCoverage = async () => {
      if (organizations.length === 0) return;

      setDetailsLoading(true);
      try {
        const results = await Promise.all(
          organizations.map(async (o) => {
            const full = await fetchOrganization(o.id);
            return [o.id, full] as const;
          })
        );

        if (!alive) return;

        const map: Record<string, OrganizationWithCoverageAreas> = {};
        for (const [id, full] of results) {
          if (full) {
            map[id] = full;
          }
        }
        setDetails(map);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setDetailsLoading(false);
      }
    };
    loadAllCoverage();
    return () => {
      alive = false;
    };
  }, [organizations, fetchOrganization]);

  const rows: CoverageRow[] = useMemo(() => {
    const all: CoverageRow[] = [];

    for (const org of organizations) {
      const full = details[org.id];
      const areas = full?.coverage_areas ?? [];

      for (const area of areas) {
        all.push({
          orgId: org.id,
          orgName: org.name,
          orgType: org.type,
          orgRole: org.role,
          email: org.contact_info?.email,
          phone: org.contact_info?.phone,
          area,
        });
      }
    }

    return all;
  }, [organizations, details]);

  const filtered = useMemo(() => {
    const s = stateFilter?.trim().toLowerCase();
    const co = countyFilter.trim().toLowerCase();
    const ci = cityFilter.trim().toLowerCase();
    const z = zipCodeFilter.trim().toLowerCase();

    return rows.filter((r) => {
      const a = r.area;
      const okState = !s || (a.state || "").toLowerCase() === s;
      const okCounty = !co || (a.county || "").toLowerCase().includes(co);
      const okCity = !ci || (a.city || "").toLowerCase().includes(ci);
      const okZip = !z || (a.zip_code || "").toLowerCase().includes(z);

      return okState && okCounty && okCity && okZip;
    });
  }, [rows, stateFilter, countyFilter, cityFilter, zipCodeFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFiltered = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter, countyFilter, cityFilter, zipCodeFilter]);

  const clearFilters = () => {
    setStateFilter(undefined);
    setCountyFilter("");
    setCityFilter("");
    setZipCodeFilter("");
    setCurrentPage(1);
  };

  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      r.area.state && set.add(r.area.state);
    });
    return Array.from(set).sort();
  }, [rows]);

  const statusBadge = (text: string) => (
    <Badge className="bg-muted text-muted-foreground border border-muted-foreground/20 hover:bg-muted-foreground/10">
      {text}
    </Badge>
  );

  const showSpinner = (loading || detailsLoading) && rows.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-tight">
          Coverage Areas
        </h3>
      </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter organizations by coverage location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select
              value={stateFilter || undefined}
              onValueChange={(value) =>
                setStateFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state.toLowerCase()}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              placeholder="County"
              className="w-full"
            />
            <Input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="City"
              className="w-full"
            />
            <Input
              value={zipCodeFilter}
              onChange={(e) => setZipCodeFilter(e.target.value)}
              placeholder="Zip Code"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="p-5"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Coverage Areas</CardTitle>
            <CardDescription>
              Showing <b>{paginatedFiltered.length}</b> of <b>{rows.length}</b>{" "}
              coverage entries
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-r-none"
              >
                <Table2 className="w-4 h-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="rounded-l-none"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Cards
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSpinner ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg font-medium mb-2">
                No matching coverage areas found
              </p>
              <p className="text-sm">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : viewMode === "table" ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">
                        Organization
                      </TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">State</TableHead>
                      <TableHead className="font-semibold">County</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="font-semibold">Zip Code</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFiltered.map((r, idx) => (
                      <TableRow
                        key={`${r.orgId}-${r.area.zip_code}-${idx}`}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium p-8">
                          {r.orgName}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {r.orgType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {r.orgRole}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {r.area.state || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {r.area.county || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {r.area.city || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground font-mono text-xs">
                            {r.area.zip_code || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[150px]">
                            {r.email && (
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {r.email}
                                </span>
                              </div>
                            )}
                            {r.phone && (
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {r.phone}
                                </span>
                              </div>
                            )}
                            {!r.email && !r.phone && (
                              <span className="text-muted-foreground text-xs">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filtered.length)} of {filtered.length}{" "}
                    entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading || detailsLoading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                disabled={loading || detailsLoading}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={
                        currentPage === totalPages || loading || detailsLoading
                      }
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedFiltered.map((r, idx) => (
                  <Card
                    key={`${r.orgId}-${r.area.zip_code}-${idx}`}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{r.orgName}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {statusBadge(r.orgType)}
                        {statusBadge(r.orgRole)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Coverage Area
                        </div>
                        <div className="text-sm">
                          {r.area.state && (
                            <span className="font-medium">{r.area.state}</span>
                          )}
                          {r.area.county && (
                            <span className="text-muted-foreground">
                              {r.area.state ? ", " : ""}
                              {r.area.county}
                            </span>
                          )}
                          {r.area.city && (
                            <span className="text-muted-foreground">
                              {r.area.state || r.area.county ? ", " : ""}
                              {r.area.city}
                            </span>
                          )}
                          {r.area.zip_code && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({r.area.zip_code})
                            </span>
                          )}
                          {!r.area.state &&
                            !r.area.county &&
                            !r.area.city &&
                            !r.area.zip_code && (
                              <span className="text-muted-foreground">
                                No location specified
                              </span>
                            )}
                        </div>
                      </div>
                      {(r.email || r.phone) && (
                        <div>
                          <div className="text-sm space-y-1">
                            {r.email && (
                              <div className="text-muted-foreground flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {r.email}
                              </div>
                            )}
                            {r.phone && (
                              <div className="text-muted-foreground flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {r.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filtered.length)} of {filtered.length}{" "}
                    entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading || detailsLoading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                disabled={loading || detailsLoading}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={
                        currentPage === totalPages || loading || detailsLoading
                      }
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
