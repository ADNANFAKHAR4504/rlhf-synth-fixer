# Security framework for financial services app

need to build out a comprehensive security setup using CDK + typescript. client is in financial services so compliance is a big deal. going with zero-trust architecture.

## basic setup

using aws cdk, typescript, single stack file approach. everything in lib/tap-stack.ts

why one file? easier to review/audit for compliance, everything in one place. might seem odd but trust me it works better for this use case.

## requirements

### iam roles
need to generate roles dynamically based on least privilege. no hardcoded policies. validate everything before deploying.

- proper typescript types throughout
- unit tests for policy generation logic
- auto validation of policy docs

### kms key hierarchy
three separate keys:
1. data encryption key
2. secrets encryption key
3. logs encryption key

enable auto rotation on all of them. if/when we go multi region each region gets own keys. key policies need to be restrictive - only specific services/principals.

### access control
compliance requirements here are strict:

console users - MFA required, no exceptions
service accounts - iam roles only, never access keys
ip restrictions using condition keys where applicable
sensitive operations need MFA
everything must pass access analyzer validation before deploy

### cross account
support cross-account but securely:
- assume role w/ external ids (prevents confused deputy)
- session duration limits
- role chaining if needed but keep it secure

### secrets manager
automatic rotation for:
- db creds (30 day rotation)
- api keys (90 days)
- service tokens (90 days)

resource policies to block cross account access except through proper assume role chains. everything encrypted w/ customer managed kms keys.

### s3
standard stuff:
- https only (deny http)
- kms encryption at rest
- least privilege bucket policies

### cloudwatch logs
encrypt everything. use the dedicated logs kms key. retention based on data classification:
- audit logs: 10 years (financial reqs)
- security logs: 90 days
- app logs: 30 days

### permission boundaries
need these to prevent privilege escalation:
- block creating roles/users without boundaries
- enforce tagging
- guardrails that even admins cant bypass

### scps
org wide policies for:
- region restrictions
- prevent disabling security services
- enforce encryption

note: scps cant be managed through cdk directly but we can document the policy docs for reference

### access analyzer
turn on for continuous monitoring. ideally hook into cicd pipeline to catch issues pre-deploy.

## implementation notes

**iam policies**
use condition keys for ip ranges. enforce mfa for sensitive ops. run access analyzer validation before any deployment.

**kms**
enable auto rotation. tight key policies. region specific if multi region.

**secrets**
block cross account by default. only allow through assume role chains. set rotation schedules (30d for db, 90d for keys/tokens).

**code quality**
typescript with types. unit tests for policy gen. integration tests against real aws resources - no mocking. load outputs from cfn-outputs/flat-outputs.json

**multi region**
might need this later. if so each region needs own kms keys and secrets. security posture consistent across regions.

**file structure**
lib/tap-stack.ts contains everything. use sections with comments and helper methods to keep organized.

## what needs to work

when done:
- policies pass access analyzer
- kms auto rotation enabled
- secrets auto rotate on schedule
- mfa enforced for humans
- cross account locked down
- s3 encryption enforced (transit + rest)
- cloudwatch logs encrypted
- permission boundaries work
- multi region capable
- tests pass
- financial services compliance met
- single file implementation

## security considerations

start with least privilege. customer managed kms keys. cloudtrail enabled. proper resource tagging.

also consider:
- config rules for compliance
- guardduty
- vpc endpoints
- private subnets
- s3 versioning + mfa delete
- backup/dr

## code structure

basic layout:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as accessanalyzer from 'aws-cdk-lib/aws-accessanalyzer';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // kms keys first
    // then iam roles/policies
    // secrets manager
    // s3 buckets
    // cloudwatch logs
    // permission boundaries
    // access analyzer
    // cfn outputs
  }

  // helper methods
  private createMfaPolicy(): iam.PolicyDocument {
    // impl
  }
}
```

## testing

integration tests use aws sdk v2, test against actual resources. load outputs like:
```typescript
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
```

then verify via api calls. no mocking for integration tests.

## deployment

set AWS_REGION env var before deploy. support different environments (dev/staging/prod). use cdk context for config.

## notes

zero trust architecture - nothing trusted by default, everything explicitly allowed.

version control everything (iac). automated compliance scanning.

financial services = strict compliance requirements especially data retention, encryption, audit logging.

focus on programmatic policy generation not hardcoded. automated rotation for everything.

everything in lib/tap-stack.ts, don't split into multiple files.
