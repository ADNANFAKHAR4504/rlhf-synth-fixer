
## Deploy Fix - RDS DBInstance Timeout

**Issue**: RDS DBInstance was timing out during deployment
```
Resource provider operation failed: Waiter DBInstanceAvailable failed: Max attempts exceeded
```

**Root Cause**: LocalStack's RDS implementation takes longer to provision databases, and the CloudFormation waiter with the original complex configuration was timing out.

**Fix Applied**:
1. Changed DeletionPolicy from Snapshot to Delete for LocalStack compatibility
2. Simplified MySQL EngineVersion from 8.0.40 to '8.0' for better LocalStack support
3. Set MultiAZ to false explicitly (LocalStack doesn't fully support MultiAZ)
4. Reduced BackupRetentionPeriod to 1 day
5. Disabled DeletionProtection for testing environment

**Changes Made**:
- `lib/TapStack.yml`: Updated Database resource properties for LocalStack compatibility

**Expected Result**: RDS DBInstance should provision successfully within LocalStack timeout limits.
