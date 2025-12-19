> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN)
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /home/iqbala/projects/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules

 PASS  test/tap-stack.int.test.ts
  TapStack — LocalStack Integration Tests
    ✓ 1) Parses outputs and has required core infra keys (3 ms)
    ✓ 2) Project and environment suffix follow expected pattern (1 ms)
    ✓ 3) STS identity is accessible via LocalStack (59 ms)
    ✓ 4) S3 Log bucket exists and is versioned (path-style, LocalStack-safe) (49 ms)
    ✓ 5) S3 Log bucket ARN ends with bucket name (2 ms)
    ✓ 6) DynamoDB table exists with pk/sk schema (29 ms)
    ✓ 7) DynamoDB table supports basic CRUD round-trip (100 ms)
    ✓ 8) DynamoDB table ARN matches table name (1 ms)
    ✓ 9) Application Auto Scaling targets exist or are at least listable (15 ms)
    ✓ 10) Scaling policies for DDB are discoverable (9 ms)
    ✓ 11) Secrets Manager secret exists (14 ms)
    ✓ 12) Secrets Manager secret has CreatedDate set (10 ms)
    ✓ 13) SNS Alarm topic exists and is readable (16 ms)
    ✓ 14) Alarm topic ARN looks like a valid SNS ARN (LocalStack-compatible) (1 ms)
    ✓ 15) Lambda log group exists (from LambdaLogGroupArn output) (26 ms)
    ✓ 16) CloudWatch has at least one log group defined (14 ms)
    ✓ 17) DynamoDB ThrottledRequests metric is listable in CloudWatch (83 ms)
    ✓ 18) VPC and Security Group for API exist with expected Name tags (44 ms)
    ✓ 19) VPC has the expected CIDR block 10.80.0.0/16 (15 ms)
    ✓ 21) VPC is tagged with Owner and CostCenter (18 ms)
    ✓ 22) API Security Group is tagged with Owner and CostCenter (15 ms)
    ✓ 23) Secrets Manager ARN looks structurally valid (1 ms)

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        3.838 s, estimated 4 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured