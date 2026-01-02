ALTER TABLE organizations 
ADD CONSTRAINT unique_organization_name UNIQUE (name);

CREATE INDEX idx_coverage_areas_zip_code ON coverage_areas(zip_code);
CREATE INDEX idx_coverage_areas_state ON coverage_areas(state);
CREATE INDEX idx_coverage_areas_county ON coverage_areas(county);
CREATE INDEX idx_coverage_areas_city ON coverage_areas(city);

ALTER TABLE coverage_areas
ADD CONSTRAINT at_least_one_location CHECK (
    state IS NOT NULL OR 
    county IS NOT NULL OR 
    city IS NOT NULL OR 
    zip_code IS NOT NULL
);

CREATE INDEX idx_coverage_areas_state_zip ON coverage_areas(state, zip_code);
