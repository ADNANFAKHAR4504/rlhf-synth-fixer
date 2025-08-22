# Turn 2: PostgreSQL Version Issue

## Issue Encountered
The CDK deployment failed with the following error:

```
CREATE_FAILED | AWS::RDS::DBInstance | TapDatabaseFBE8E10C
Resource handler returned message: "Cannot find version 15.4 for postgres (Service: Rds, Status Code: 400, Request ID: 57830b41-103c-42eb-9bc2-f1d3fe51e223) (SDK Attempt Count: 1)"
```

## Root Cause
The PostgreSQL version `15.4` specified in the RDS DatabaseInstance is not available in the current AWS region (us-east-1).

## Code Location
File: `lib/tap-stack.ts`
Lines: 140-142

```typescript
const database = new rds.DatabaseInstance(this, 'TapDatabase', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,  // <- This version is not available
  }),
});
```

## Suggested Fix
Update the PostgreSQL version to a supported version. Common available versions include:
- `rds.PostgresEngineVersion.VER_15_3`
- `rds.PostgresEngineVersion.VER_14_9`
- `rds.PostgresEngineVersion.VER_13_13`

## Additional Context
The stack synthesis completed successfully, indicating the CDK code structure is correct. The issue only manifested during actual AWS resource creation, which is typical for version availability problems.

## Next Steps
1. Update the PostgreSQL version to a supported version
2. Re-run `npm run cdk:deploy` to attempt deployment again
3. Monitor for any additional deployment issues
