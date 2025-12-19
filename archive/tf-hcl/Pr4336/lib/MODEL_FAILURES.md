# Infrastructure Code Corrections and Improvements (DR Multi-Region Terraform)

## Summary
The **generated** version contained DR/security gaps, cross-region inconsistencies, and fragile choices (e.g., hardcoded DB password, no KMS for the read replica, TTL on Route 53 aliases). The **correct** version applies production-grade practices: proper encryption, no hardcoded secrets, improved HA/DR, and better reproducibility.

## Critical Issues Fixed

### 1) Hardcoded database password
- **Issue (generated):** `password = "ChangeMePlease123!"`
- **Fix (correct):** Use `random_password.db_master` (24 chars, symbols) and escape `%` in `user_data`.
- **Impact:** Prevents secret leakage in code/state and enables safe rotation.

### 2) Encrypted secondary RDS read replica
- **Issue:** Replica lacked a dedicated KMS key in the secondary region.
- **Fix:** Create **KMS Key + Alias** in the secondary region and set `storage_encrypted = true`, `kms_key_id` on the replica.
- **Impact:** Compliance and DR readiness for data at rest in standby.

### 3) Missing secondary DB subnet group
- **Issue:** Replica implicitly depended on primary networking.
- **Fix:** Add `aws_db_subnet_group.secondary` for `secondary_data` subnets.
- **Impact:** Reliable RDS placement in the correct VPC/subnets.

### 4) Cross-region DB connectivity rules
- **Issue:** No explicit rules for MySQL traffic between regions.
- **Fix:** Security groups allow `3306` from the counterpart VPC CIDR (primary ↔ secondary).
- **Impact:** Avoids replication/app connectivity failures across regions.  
  *Note:* In production, add **inter-VPC routing** (TGW/peering) and prefer SG references when feasible.

### 5) Route 53 alias records with TTL
- **Issue:** `ttl` specified on **Alias A** records (not applicable).
- **Fix:** Remove TTL from alias records.
- **Impact:** Prevents errors/warnings and ensures correct failover behavior.

### 6) Health-check event for failover
- **Issue:** CloudWatch/EventBridge rule used `newState = "ALARM"` (mismatch).
- **Fix:** Use `newState = "UNHEALTHY"` for Route 53 health-check events.
- **Impact:** Reliable Lambda trigger when the primary is unhealthy.

### 7) DynamoDB PITR
- **Issue:** No **Point-in-Time Recovery**.
- **Fix:** Enable `point_in_time_recovery`.
- **Impact:** Safer restores from accidental writes/deletes.

### 8) Symmetric secondary networking
- **Issue:** Partial symmetry in NAT/route tables/associations.
- **Fix:** Mirror EIP/NAT/RT/associations in the secondary region.
- **Impact:** Outbound internet and dependencies work during failover.

### 9) DynamoDB global table configuration
- **Issue (generated):**
  - No **replica configuration block**, limiting cross-region availability.
  - Missing secondary indexes for querying status and time attributes.
- **Fix (correct):**
  - Configured a **replica** block for the secondary region (`region_name = var.secondary_region`).
  - Defined a **Global Secondary Index** (`status-index`) on `status` and `timestamp` fields for better query performance.
- **Impact:**
  - Full **multi-region replication** of DynamoDB data.
  - **Disaster recovery continuity** and reduced data-loss risk.
  - Improved **query flexibility** and operational observability.
