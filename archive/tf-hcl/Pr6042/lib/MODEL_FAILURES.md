## Failure 1 — Invalid PostgreSQL Version 15.4

### Failure Type

Critical Failure

### Error Message

```
Error: creating RDS DB Instance (rds-postgres-prod-postgres): api error InvalidParameterCombination: Cannot find version 15.4 for postgres
```

### Root Cause Analysis

The PostgreSQL version `15.4` specified in the configuration . Supported versions are `15.10`, `15.12`, `15.13`, and `15.14`.

### Fix

Updated `engine_version` to `15.14`.

---

## Failure 2 — Invalid IOPS Configuration for Storage Size

### Failure Type

Critical Failure

### Error Message

```
api error InvalidParameterCombination: You can't specify IOPS or storage throughput for engine postgres and a storage size less than 400.
```

### Root Cause Analysis

IOPS and throughput were explicitly defined for a `gp3` storage volume of `100GB`. AWS requires at least `400GB` to allow these parameters for PostgreSQL.

### Fix

Removed `iops` and `storage_throughput` configuration. Default gp3 baseline performance (3000 IOPS, 125 MB/s) applies automatically.

---

## Failure 3 — Incompatible Parameters: log_statement='all'

### Failure Type

Critical Failure

### Error Message

```
RDS Instance State: incompatible-parameters
```

### Root Cause Analysis

Using `log_statement='all'` with CloudWatch log exports caused excessive logging, resulting in the instance entering an incompatible state.

### Fix

Changed `log_statement` to `"ddl"` to reduce logging volume and maintain audit visibility.

---

## Failure 4 — effective_cache_size Integer Overflow

### Failure Type

Critical Failure

### Error Message

```
invalid value for parameter "effective_cache_size": "2871174144"
```

### Root Cause Analysis

`effective_cache_size` was set using `{DBInstanceClassMemory*3/4}`, which exceeded PostgreSQL’s 32-bit integer range when interpreted in 8KB pages.

### Fix

Replaced with static value `393216` (≈3GB), appropriate for `db.t3.medium` instance.
