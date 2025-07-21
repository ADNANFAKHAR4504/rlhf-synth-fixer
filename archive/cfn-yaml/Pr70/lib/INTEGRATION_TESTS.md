# Integration tests

```text

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

PASS test/tap-stack.int.test.ts
  TapStack Integration Tests
    ProductionOnlyInstance (EC2)
      ✓ should be running (2 ms)
      ✓ should have the correct "Environment" tag (1 ms)
      ✓ should have the correct Security Group attached (1 ms)
      ✓ should have the correct IAM Instance Profile attached (1 ms)
      ✓ should be using a dynamic AMI from SSM (1 ms)
    SharedVPC
      ✓ should exist, be available, and have correct tags (126 ms)
    PublicSubnet
      ✓ should exist, be available, map public IPs, and have correct tags (130 ms)
    AppS3Bucket
      ✓ should have the "Environment" tag set to the stack name (254 ms)
    AppSecurityGroup
      ✓ should allow inbound HTTP and HTTPS traffic (127 ms)
    EC2InstanceRole (IAM)
      ✓ should have a trust policy for the EC2 service (327 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        2.692 s, estimated 4 s
Ran all test suites matching /.int.test.ts$/i.
```
