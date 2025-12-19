npm run localstack:cfn:test


> tap@0.1.0 localstack:cfn:test
> ./scripts/localstack-cloudformation-test.sh

🧪 Running Integration Tests against LocalStack...
✅ LocalStack is running
✅ Infrastructure outputs found
✅ Infrastructure outputs validated
📦 Installing npm dependencies...

> tap@0.1.0 preinstall
> echo 'Skipping version checks for CI/CD'

Skipping version checks for CI/CD

> tap@0.1.0 prepare
> husky


up to date, audited 3207 packages in 21s

304 packages are looking for funding
  run `npm fund` for details

19 vulnerabilities (5 low, 5 moderate, 9 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
✅ Dependencies installed successfully
🔧 Setting up LocalStack environment...
🌐 Environment configured for LocalStack:
  • AWS_ENDPOINT_URL: http://localhost:4566
  • AWS_REGION: us-east-1
  • SSL Verification: Disabled
🚀 Starting integration tests...

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/prakhar/Desktop/Code/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules                                                                                                   
  
 PASS  test/tap-stack.int.test.ts
  Secure Financial Data Processing Stack - Integration Tests
    VPC and Networking
      ✓ VPC exists and is configured correctly (212 ms)
      ✓ Three private subnets exist across different AZs (36 ms)
      ✓ VPC endpoints exist for S3 and DynamoDB (67 ms)
      ✓ Security group exists and restricts traffic correctly (44 ms)
    S3 Buckets
      ✓ Input bucket exists and is accessible (12 ms)
      ✓ Output bucket exists and is accessible (3 ms)
      ✓ Input bucket has KMS encryption enabled (14 ms)
      ✓ Output bucket has KMS encryption enabled (16 ms)
      ✓ Input bucket has versioning enabled (22 ms)
      ✓ Output bucket has versioning enabled (5 ms)
    DynamoDB Table
      ✓ Transaction metadata table exists (1838 ms)
      ✓ Table has encryption at rest enabled (313 ms)
      ✓ Table has correct key schema (66 ms)
      ✓ Table uses on-demand billing mode (78 ms)
    Lambda Function
      ✓ Lambda function exists (476 ms)
      ✓ Lambda function is configured in VPC (18 ms)
      ✓ Lambda function has correct runtime and handler (6 ms)
      ✓ Lambda function has environment variables configured (7 ms)
    KMS Keys
      ✓ KMS key exists and is accessible (32 ms)
      ✓ KMS key alias exists (6 ms)
    IAM Role and Policies
      ✓ Lambda execution role exists (43 ms)
      ✓ Lambda role has VPC access managed policy (6 ms)
      ✓ Lambda role has inline policy with least privilege permissions (18 ms)
    CloudWatch Logs
      ✓ Lambda log group exists with 7-year retention (35 ms)
    CloudWatch Alarms
      ✓ Lambda error alarm exists (15 ms)
    End-to-End Integration
      ✓ All critical resources are deployed and accessible (84 ms)

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        5.016 s, estimated 14 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured