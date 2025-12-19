The tests failed:
"$ npm run test

> tap@0.1.0 test
> jest --coverage

PASS test/tap-stack.unit.test.ts (14.113 s)
Unit Tests for TapStack
✓ should create a VPC (21 ms)
✓ should create a Multi-AZ RDS instance with backups (5 ms)
✓ should create an Auto Scaling Group with correct capacity (3 ms)
✓ should create an Application Load Balancer (3 ms)
✓ should create an IAM policy with least privilege for CloudWatch (5 ms)

PASS test/tap-stack.int.test.ts (14.126 s)
Integration Tests for TapStack
✓ should place the ALB in public subnets (27 ms)
✓ should place the ASG in private subnets (3 ms)
✓ should configure the App SG to only allow traffic from the ALB SG (6 ms)
✓ should configure the DB SG to only allow traffic from the App SG (4 ms)
✓ should associate the RDS instance with the DB security group (3 ms)

--------------|---------|----------|---------|---------|-------------------
File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files | 100 | 100 | 100 | 100 |  
 tap-stack.ts | 100 | 100 | 100 | 100 |  
--------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 2 total
Tests: 8 passed, 10 total
Snapshots: 0 total
Time: 19.509 s
Ran all test suites."
