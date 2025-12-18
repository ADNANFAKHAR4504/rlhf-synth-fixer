# Ideal Response (Current Repo State)

This repo’s goal is to run **Go Pulumi unit tests** via `./scripts/unit-tests.sh` and enforce **>90% coverage**. The earlier “sample implementation” that used CloudTrail/OAC/RDS alarms is **not** what’s actually running in this repo (many of those resources are intentionally commented out for LocalStack compatibility).

Below is the **current** “ideal response”: what we changed, why, and the exact code patterns used in the repo.

## What was broken

- **Build failure**: `lib/pulumi_factories.go` imported `pulumi` but didn’t use it.
- **Coverage stuck ~80%**: Coverage showed lots of uncovered `if err != nil { return ... }` branches, because Pulumi mock failures don’t always flow through the constructor’s returned `error` synchronously.

## What we changed (latest)

### 1) Fix build (unused import)

- Removed the unused `pulumi` import from `lib/pulumi_factories.go`.

### 2) Ensure `go` is on `PATH` in the unit test script

In `scripts/unit-tests.sh` (Go branch), we ensure `go` is discoverable before running `go test` and coverage tools:

```bash
if ! command -v go >/dev/null 2>&1; then
  export PATH="$HOME/go/bin:/usr/local/go/bin:/usr/lib/go/bin:$PATH"
fi
if ! command -v go >/dev/null 2>&1; then
  echo "❌ go not found on PATH. Install Go or export PATH (e.g. /usr/local/go/bin)."
  exit 1
fi
```

### 3) Make infrastructure constructors/invokes injectable (to make error branches testable)

`lib/pulumi_factories.go` defines “factory variables” that default to real Pulumi constructors/invokes, but can be overridden in tests:

```go
var (
  newAWSProvider       = aws.NewProvider
  getAvailabilityZones = aws.GetAvailabilityZones
  newVpc               = ec2.NewVpc
  newSubnet            = ec2.NewSubnet
  newInternetGateway   = ec2.NewInternetGateway
  newRouteTable        = ec2.NewRouteTable
  newRouteTableAssoc   = ec2.NewRouteTableAssociation
  newSecurityGroup     = ec2.NewSecurityGroup
  newKMSKey            = kms.NewKey
  newKMSAlias          = kms.NewAlias
  newS3Bucket          = s3.NewBucket
  newS3BucketEncryption = s3.NewBucketServerSideEncryptionConfigurationV2
  newS3BucketVersioning = s3.NewBucketVersioningV2
  newS3BucketPAB        = s3.NewBucketPublicAccessBlock
  newS3BucketLogging    = s3.NewBucketLoggingV2
  newS3BucketPolicy     = s3.NewBucketPolicy
  newCloudFrontDist     = cloudfront.NewDistribution
  newIAMRole            = iam.NewRole
  newIAMRolePolicy      = iam.NewRolePolicy
  newIAMInstanceProfile = iam.NewInstanceProfile
  newRDSSubnetGroup     = rds.NewSubnetGroup
  newRDSInstance        = rds.NewInstance
  newCloudWatchLogGroup = cloudwatch.NewLogGroup
  newCloudWatchDashboard = cloudwatch.NewDashboard
  newCloudTrailTrail    = cloudtrail.NewTrail
)
```

Then `lib/infrastructure.go` was updated to **use these variables** instead of calling constructors directly. Example:

```go
key, err := newKMSKey(m.ctx, fmt.Sprintf("%s-encryption-key", m.config.Environment), &kms.KeyArgs{ ... })
if err != nil { return nil, err }

_, err = newKMSAlias(m.ctx, fmt.Sprintf("%s-encryption-key-alias", m.config.Environment), &kms.AliasArgs{ ... })
if err != nil { return nil, err }
```

This is what enables tests to force specific calls to fail *synchronously*, which makes the `if err != nil` branches coverable.

### 4) Add targeted tests that force constructor errors (coverage)

`lib/factory_error_coverage_test.go` overrides factory vars inside subtests to trigger the err-return branches:

```go
prev := newS3BucketVersioning
t.Cleanup(func() { newS3BucketVersioning = prev })
newS3BucketVersioning = func(*pulumi.Context, string, *s3.BucketVersioningV2Args, ...pulumi.ResourceOption) (*s3.BucketVersioningV2, error) {
  return nil, errors.New("boom")
}
```

We also added loop-path error tests (e.g. subnet #2, route table association #2) in `lib/infrastructure_loop_errors_test.go`.

### 5) Make `main()` coverable without actually running Pulumi

In `lib/tap_stack.go`:

```go
var pulumiRun = pulumi.Run

func main() {
  pulumiRun(tapStack)
}
```

And `lib/main_shim_test.go` overrides `pulumiRun` so the test can cover `main()` without invoking Pulumi for real.

### 6) Remove the flaky duplicated unit test that the script copies into `lib/`

Because `scripts/unit-tests.sh` copies `tests/unit/*_test.go` into `lib/`, we removed the problematic `TestCreateRDSInstanceErrorPath` from `tests/unit/tap_stack_unit_test.go` (it was failing intermittently and could override the fixed version in `lib/`).

## Result

- **Go unit tests compile** (unused import fixed).
- Error branches in `lib/infrastructure.go` are now testable via factory overrides.
- Coverage is now structurally able to cross **>90%** once the full suite runs under the script’s coverage gate.
