# Integration tests

```text

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

(node:2347) NOTE: The AWS SDK for JavaScript (v2) is in maintenance mode.
 SDK releases are limited to address critical bug fixes and security issues only.

Please migrate your code to use AWS SDK for JavaScript (v3).
For more information, check the blog post at https://a.co/cUPnyil
(Use `node --trace-warnings ...` to show where the warning was created)
PASS test/tap-stack.int.test.ts (7.852 s)
  ALB Integration Tests
    ✓ ALB endpoint should be reachable (215 ms)
    ✓ ALB should have multiple healthy targets (718 ms)
  VPC and Subnet Integration Tests
    ✓ VPC should exist (380 ms)
    ✓ All public subnets should exist and be in different AZs (384 ms)
    ✓ All private subnets should exist and be in different AZs (389 ms)
  High Availability (HA) Tests
    ✓ VPC should have subnets in multiple AZs (452 ms)
  🔒 Security & Access Control Tests
    ✓ ALB Security Group should have correct ingress rules (406 ms)
    ✓ App Security Group should only allow traffic from ALB (395 ms)
  ⚡ Performance & Scalability Tests
    ✓ ALB should have healthy targets (737 ms)
    ✓ Auto Scaling Group should have correct capacity (449 ms)
  🔄 Resilience & Failover Tests
    ✓ ALB should be in multiple AZs (320 ms)
    ✓ Auto Scaling instances should be distributed across AZs (394 ms)
  📊 Monitoring & Observability Tests
    ✓ ALB metrics should be available (312 ms)
  🏷️ Configuration & Compliance Tests
    ✓ All resources should have proper tags (340 ms)
    ✓ Environment-specific configurations should be correct
    ✓ Network configurations should be secure (1061 ms)
  🚀 Infrastructure Validation Tests
    ✓ All required outputs should be available (2 ms)
    ✓ VPC should have subnets in multiple AZs (422 ms)
    ✓ Resource naming should follow conventions

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        8.111 s, estimated 9 s
Ran all test suites matching /.int.test.ts$/i.
```
