# Integration tests

```text

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

PASS test/cfn-security-template.int.test.ts
  CloudFormation Security Infrastructure Integration Tests
    Stack Outputs Validation
      ✓ should have VPC-related outputs (1 ms)
      ✓ should have security-related outputs
      ✓ should have database-related outputs
      ✓ should have storage-related outputs
      ✓ should have load balancer outputs
      ✓ should have CDN-related outputs
    Resource Naming Conventions
      ✓ should follow consistent naming patterns
    Security Compliance Checks
      ✓ should have HTTPS endpoints only
      ✓ should not expose internal identifiers
    High Availability Validation
      ✓ should have multi-AZ resource indicators
    Basic Connectivity Tests
      ✓ World

PASS test/tap-stack.int.test.ts
  Secure Web Infrastructure Init Test
    ✓ VPC ID should follow AWS format
    ✓ KMS Key ARN should be valid
    ✓ Database endpoint should be a valid RDS endpoint
    ✓ Content bucket should follow naming conventions
    ✓ Logging bucket should follow naming conventions
    ✓ Load Balancer DNS should look like a valid AWS ELB address
    ✓ CloudFront domain name should look valid
    ✓ CloudFront Distribution ID should start with E
    ✓ WebACL ARN should be valid
    ✓ Auto Scaling Group name should end in -Pr24 (1 ms)
    ✓ CloudWatch CPU alarm ARN should be valid
    ✓ Environment suffix should be a short tag
    ✓ DynamoDB table name should be consistent with suffix
    ✓ Stack name should match naming convention

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        0.246 s, estimated 1 s
Ran all test suites matching /.int.test.ts$/i.
```
