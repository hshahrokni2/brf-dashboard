-- Note: brf_property table does NOT have an 'area' column for district filtering
-- The table only has: address, postal_code, city, municipality
-- District filtering will need to be implemented differently or skipped

-- Working schema:
-- brf_governance: auditor, auditor_firm (NOT primary_auditor_name/firm)
-- brf_loans: current_amount (NOT outstanding_balance)
-- brf_property: NO area column (filtering by district not possible currently)
