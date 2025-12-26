# Integration Test Issues and Fixes

## Current Issue: Missing CDKTF Outputs in CI

### Problem
The LocalStack CI integration tests are failing with "Missing required stack outputs" error.

**Root Cause**: The CI script that extracts outputs from CDKTF deployment logs doesn't properly handle multi-line array outputs like:
- `kms_key_ids` (array of 3 strings)
- `public_subnet_ids` (array of 2 strings)
- `private_subnet_ids` (array of 2 strings)

The script only extracts 10 outputs instead of the expected 17, missing the 7 array-based outputs.

### Solution Options

#### Option 1: Use cdktf output --outputs-file (Recommended)
Instead of parsing deployment logs, use CDKTF's built-in JSON output:

```bash
cdktf output --outputs-file cdk-outputs/flat-outputs.json TapStackpr9594
```

This is implemented in `extract-cdktf-outputs.sh`. The CI script should call this after deployment instead of parsing logs.

#### Option 2: Fix Log Parsing (Current Approach)
The CI script parses `cdktf deploy` output, but the regex/awk/grep commands don't handle multi-line arrays.

Example of problematic output format:
```
kms_key_ids = [
  "uuid-1",
  "uuid-2",
  "uuid-3"
]
```

The parser sees `kms_key_ids = [` and stops, not capturing the array values.

### Test Improvements Made

1. **Dynamic Output Directory Detection** (`test/tap-stack.int.test.ts` line 86-94)
   - Detects if running in LocalStack CI mode
   - Reads from `cdk-outputs/` for LocalStack CI
   - Reads from `cfn-outputs/` for regular CI

2. **Better Error Messages** (`test/tap-stack.int.test.ts` line 127-153)
   - Lists specific missing outputs
   - Shows available output keys
   - Makes debugging easier

### Action Items

- [ ] Update CI script (`.github/workflows/` or `scripts/`) to use `extract-cdktf-outputs.sh` after CDKTF deployment
- [ ] OR: Fix the log parsing in CI to handle multi-line arrays properly

### Files Modified

- `test/tap-stack.int.test.ts` - Added dynamic directory detection and better error messages
- `extract-cdktf-outputs.sh` - Script to properly extract all CDKTF outputs including arrays
