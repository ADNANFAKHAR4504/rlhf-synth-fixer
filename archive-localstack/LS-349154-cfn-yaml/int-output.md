> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN)
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /home/iqbala/projects/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules

 PASS  test/tap-stack.int.test.ts (39.904 s)
  TapStack — Live Integration Suite
    ✓ 01) outputs parsed; minimal required keys exist for this env (9 ms)
    ✓ 02) region is valid (AWS) or defaulted (LocalStack)
    ✓ 03) VPC exists (133 ms)
    ✓ 04) public subnets belong to VPC and are distinct AZs (best effort on LocalStack) (25 ms)
    ✓ 05) private subnets belong to VPC and are distinct AZs (best effort on LocalStack) (31 ms)
    ✓ 06) NAT gateways present (skip strictness on LocalStack) (40 ms)
    ✓ 07) VPC endpoints include S3 and Secrets Manager (best effort on LocalStack) (33 ms)
    ✓ 08) ALB / App / RDS security groups exist (44 ms)
    ✓ 09) App SG allows outbound 443 (or default all) (21 ms)
    ✓ 10) Logging bucket exists and has versioning enabled (or Suspended on LocalStack) (8229 ms)
    ✓ 11) Bucket encryption endpoints respond (best effort on LocalStack) (17417 ms)
    ✓ 12) ALB exists and access logs attributes present (strict on AWS; soft on LocalStack) (42 ms)
    ✓ 13) Target group exists and protocol is HTTP (27 ms)
    ✓ 14) An Auto Scaling Group is attached to the target group (best effort on LocalStack) (71 ms)
    ✓ 15) CloudTrail exists and logging status query works (AWS strict, LocalStack best-effort) (20 ms)
    ✓ 16) CloudTrail LogGroup exists (parsed from ARN) when output provided
    ✓ 17) REST API and stage 'v1' exist when API Gateway is provisioned (1 ms)
    ✓ 18) APIGW invoke URL responds when API Gateway is provisioned (1 ms)
    ✓ 19) KMS key is describable (AWS strict, LocalStack best-effort) (8219 ms)
    ✓ 20) RDS Secret exists (DescribeSecret) when RDS is provisioned (1 ms)
    ✓ 21) RDS instance is StorageEncrypted (MultiAZ check only on AWS) when RDS is provisioned (1 ms)
    ✓ 22) Security Alarm SNS Topic exists when configured (1 ms)
    ✓ 23) GuardDuty detector is enabled when configured (1 ms)
    ✓ 24) CloudWatch DescribeAlarms responds (75 ms)
    ✓ 25) Security metrics namespace is queryable (AWS strict, LocalStack best-effort) (144 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        40.784 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured