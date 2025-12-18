-- Direct SQL queries for normalization audit
-- Run these in psql or pgAdmin to assess data structure

-- 1. Check brf_operational_costs schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'brf_operational_costs'
ORDER BY ordinal_position;

-- 2. Check total_area_sqm availability
SELECT 
  COUNT(*) as total_brfs,
  COUNT(p.total_area_sqm) as brfs_with_area,
  ROUND(AVG(p.total_area_sqm), 2) as avg_area,
  ROUND((COUNT(p.total_area_sqm)::numeric / COUNT(*)::numeric * 100), 1) as coverage_percent
FROM brf_property p;

-- 3. Sample BRF cost structure (RAW VALUES)
SELECT 
  m.brf_name,
  p.total_area_sqm,
  oc.heating_cost as heating_raw,
  oc.electricity_cost as electricity_raw,
  oc.water_cost as water_raw,
  oc.cleaning_cost as cleaning_raw,
  oc.total_operational_costs as total_raw,
  -- Compute per sqm to see if it makes sense
  ROUND(oc.heating_cost / NULLIF(p.total_area_sqm, 0), 2) as heating_per_sqm,
  ROUND(oc.electricity_cost / NULLIF(p.total_area_sqm, 0), 2) as elec_per_sqm
FROM brf_metadata m
JOIN brf_property p USING (zelda_id)
LEFT JOIN brf_operational_costs oc USING (zelda_id)
WHERE p.total_area_sqm > 0 AND oc.heating_cost > 0
LIMIT 5;

-- 4. Statistical Analysis (Heating Cost) - CRITICAL TEST
WITH cost_data AS (
  SELECT 
    oc.heating_cost as raw_value,
    p.total_area_sqm,
    oc.heating_cost / NULLIF(p.total_area_sqm, 0) as per_sqm
  FROM brf_operational_costs oc
  JOIN brf_property p USING (zelda_id)
  WHERE oc.heating_cost > 0 AND p.total_area_sqm > 0
)
SELECT 
  COUNT(*) as sample_size,
  -- Raw values (if already per sqm, should be small numbers like 50-200)
  ROUND(AVG(raw_value), 2) as avg_raw,
  ROUND(MIN(raw_value), 2) as min_raw,
  ROUND(MAX(raw_value), 2) as max_raw,
  -- Computed per sqm
  ROUND(AVG(per_sqm), 2) as avg_per_sqm,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY per_sqm), 2) as median_per_sqm,
  ROUND(STDDEV(per_sqm), 2) as stddev_per_sqm
FROM cost_data;

-- 5. Detailed costs check
SELECT 
  d.category,
  COUNT(*) as num_brfs,
  ROUND(AVG(d.amount_current), 2) as avg_amount,
  ROUND(MIN(d.amount_current), 2) as min_amount,
  ROUND(MAX(d.amount_current), 2) as max_amount
FROM brf_operating_costs_detail d
WHERE d.amount_current > 0
GROUP BY d.category
ORDER BY avg_amount DESC
LIMIT 10;
