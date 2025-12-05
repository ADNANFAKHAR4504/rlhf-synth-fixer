# Model Failures and Corrections

This document describes the issues found in MODEL_RESPONSE.md and how they were corrected in IDEAL_RESPONSE.md.

## Issues Found and Fixed

### 1. Incorrect AWS Config IAM Managed Policy Name

**Issue in MODEL_RESPONSE:**
```typescript
managedPolicies: [
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole')
]
```

**Why it's wrong:**
- The correct AWS managed policy name is `service-role/AWS_ConfigRole` (with `AWS_` prefix)
- Using the wrong policy name would cause IAM permission failures at runtime
- This is mentioned in PROMPT.md: "Use service-role/AWS_ConfigRole for AWS Config IAM managed policy"

**Correction in IDEAL_RESPONSE:**
```typescript
managedPolicies: [
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')
]
```

**Impact:** CRITICAL - Without the correct managed policy, AWS Config would not have permissions to record resource configurations or write to the S3 bucket.

---

### 2. Missing Import for EventBridge Targets

**Issue in MODEL_RESPONSE:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
```

Later in code:
```typescript
rule.onComplianceChange('ComplianceChange', {
  target: new cdk.aws_events_targets.LambdaFunction(complianceLambda)
});
```

**Why it's wrong:**
- The code uses `cdk.aws_events_targets.LambdaFunction` but doesn't import the events_targets module
- This would cause a TypeScript compilation error
- The import statement is missing at the top of the file

**Correction in IDEAL_RESPONSE:**
```typescript
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
// ... rest of imports

// Later in code:
rule.onComplianceChange('ComplianceChange', {
  target: new events_targets.LambdaFunction(complianceLambda)
});
```

**Impact:** HIGH - Code would not compile without this import, causing build failures.

---

### 3. Missing TypeScript Configuration for Lambda

**Issue in MODEL_RESPONSE:**
- No `tsconfig.json` file provided for the Lambda function
- Lambda code is TypeScript but missing compilation configuration

**Why it's wrong:**
- Lambda TypeScript code needs tsconfig.json to compile properly
- Without it, developers can't build the Lambda function
- The package.json has a "build" script referencing tsc, but no tsconfig to configure it

**Correction in IDEAL_RESPONSE:**
Added `lib/lambda/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

**Impact:** MEDIUM - Lambda code cannot be built without proper TypeScript configuration.

---

## Summary of Changes

| Issue | Severity | Type | Fixed |
|-------|----------|------|-------|
| Wrong IAM managed policy name (ConfigRole vs AWS_ConfigRole) | CRITICAL | Configuration Error | Yes |
| Missing events_targets import | HIGH | Compilation Error | Yes |
| Missing Lambda tsconfig.json | MEDIUM | Build Configuration | Yes |

## Lessons Learned

1. **AWS Service Role Names**: Always verify exact AWS managed policy names, including prefixes like `AWS_`
2. **Import Statements**: Ensure all CDK modules used in code are properly imported at the top
3. **Lambda Configuration**: TypeScript Lambda functions need complete build configuration (tsconfig.json)
4. **PROMPT.md Guidance**: The prompt explicitly mentioned the correct policy name - following requirements carefully prevents errors

## Testing Recommendations

1. **IAM Policy Test**: Verify AWS Config can assume the role and has required permissions
2. **Compilation Test**: Run `npm run build` to ensure TypeScript compiles without errors
3. **Lambda Build Test**: Build Lambda function separately to verify tsconfig works
4. **Deployment Test**: Deploy stack and verify Config recorder starts successfully
5. **Integration Test**: Trigger a compliance violation and verify Lambda receives event and sends SNS notification