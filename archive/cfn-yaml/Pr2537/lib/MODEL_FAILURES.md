This document captures common model failures when generating CloudFormation templates, unit tests, and integration tests for the TapStack use case.

---

## Common Template Failures
1. **Deprecated Resource Types**
   - Using `AWS::AutoScaling::LaunchConfiguration` instead of `LaunchTemplate`.
   - Failure: `The Launch Configuration creation operation is not available`.

2. **Availability Zone Selection Errors**
   - Using `Fn::Select [0, !GetAZs ""]` caused `CREATE_FAILED: index 1 does not exist`.
   - Correct approach: Do not use AZs explicitly, rely on Subnet CIDRs only.

3. **SSM Parameter Misuse**
   - Using `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` incorrectly with a `Default` property.
   - Error: `E3006 Resource type does not exist in us-east-1`.
   - Fix: Reference SSM parameter directly in LaunchTemplate without a `Default`.

4. **Missing Parameters**
   - Omitting `AmiId` or `S3BucketName` parameters.
   - Failure: `Parameters must have values`.

5. **Rollback in Progress**
   - Incorrect AZ or CIDR assignments caused CloudFormation rollback.
   - Root cause: Invalid Subnet mappings.

---

## Common Unit Test Failures
1. **Hardcoded Logical IDs**
   - Tests assume wrong logical resource names (`MyVPC` vs `VPC`).
2. **Over-simplified Assertions**
   - Only checking resource existence, not validating properties like CIDRs, ingress rules, encryption.

---

## Common Integration Test Failures
1. **Not Reading Outputs Correctly**
   - Misinterpreting `cfn-outputs/all-outputs.json` (consolidated vs flat structure).
   - Fix: Implement logic to normalize both formats.

2. **Region Mismatches**
   - Defaulting to `us-east-1` when deployed in `us-west-2`.
   - Fix: Use `AWS_REGION || AWS_DEFAULT_REGION`.

3. **Insufficient Retry Logic**
   - NAT Gateway and ASG policies often take time to appear.
   - Without retries, tests fail intermittently.

4. **S3 Edge Cases**
   - Buckets with no tags throw `NoSuchTagSet`.
   - Tests must catch this gracefully.

---

## Quality Failures
- Missing `Outputs` for critical resources (VPC, Subnets, SG, IAM, Bucket).
- Lack of cross-stack `Export` names.
- Poor coverage in unit/integration tests.

---

## Prevention Recommendations
- Always use `LaunchTemplate` + `LatestAmiId` SSM parameter.
- Avoid AZ selection via `Fn::Select`.
- Implement retry logic in integration tests.
- Validate encryption + versioning for S3 buckets.
- Ensure Outputs are exhaustive and correctly structured.
