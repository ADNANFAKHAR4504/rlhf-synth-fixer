[0;34m🧪 Running Integration Tests against LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[0;32m✅ Infrastructure outputs found[0m
[0;32m✅ Infrastructure outputs validated[0m
[1;33m📦 Installing npm dependencies...[0m

> tap@0.1.0 preinstall
> echo 'Skipping version checks for CI/CD'

Skipping version checks for CI/CD

> tap@0.1.0 prepare
> husky


up to date, audited 2336 packages in 13s

308 packages are looking for funding
  run `npm fund` for details

17 vulnerabilities (5 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
[0;32m✅ Dependencies installed successfully[0m
[1;33m🔧 Setting up LocalStack environment...[0m
[0;34m🌐 Environment configured for LocalStack:[0m
[1;33m  • AWS_ENDPOINT_URL: http://localhost:4566[0m
[1;33m  • AWS_REGION: us-east-1[0m
[1;33m  • SSL Verification: Disabled[0m
[1;33m🚀 Starting integration tests...[0m

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/chandangupta/Desktop/localstack-task/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
  console.log
    [E2E Test] Step 1: Calling API Gateway endpoint...

      at Object.<anonymous> (test/tap-stack.int.test.ts:700:15)

  console.log
    [E2E Test] Step 2: Waiting for logs to propagate...

      at Object.<anonymous> (test/tap-stack.int.test.ts:716:15)

  console.log
    [E2E Test] Step 3: Querying Lambda CloudWatch Logs...

      at Object.<anonymous> (test/tap-stack.int.test.ts:720:15)

  console.log
    [E2E Test] Step 4: Querying API Gateway CloudWatch Logs...

      at Object.<anonymous> (test/tap-stack.int.test.ts:730:15)

  console.log
    [E2E Test] Step 5: Verifying CloudWatch Alarms are monitoring...

      at Object.<anonymous> (test/tap-stack.int.test.ts:738:15)

  console.log
    [E2E Test] E2E test completed successfully - All 5 steps verified

      at Object.<anonymous> (test/tap-stack.int.test.ts:744:15)

  console.log
    [E2E S3 Test] Step 1: Creating object in S3 with AES256 encryption...

      at Object.<anonymous> (test/tap-stack.int.test.ts:758:15)

  console.log
    [E2E S3 Test] Step 2: Retrieving object and verifying content...

      at Object.<anonymous> (test/tap-stack.int.test.ts:776:15)

  console.log
    [E2E S3 Test] Step 3: Updating object to create new version...

      at Object.<anonymous> (test/tap-stack.int.test.ts:794:15)

  console.log
    [E2E S3 Test] Step 4: Verifying versioning - multiple versions exist...

      at Object.<anonymous> (test/tap-stack.int.test.ts:809:15)

  console.log
    [E2E S3 Test] Step 5: Getting updated object and verifying changes...

      at Object.<anonymous> (test/tap-stack.int.test.ts:821:15)

  console.log
    [E2E S3 Test] Step 6: Deleting object and verifying cleanup...

      at Object.<anonymous> (test/tap-stack.int.test.ts:834:15)

  console.log
    [E2E S3 Test] Step 7: Verifying object is no longer accessible...

      at Object.<anonymous> (test/tap-stack.int.test.ts:845:15)

  console.log
    [E2E S3 Test] E2E S3 workflow completed successfully - All 7 steps verified

      at Object.<anonymous> (test/tap-stack.int.test.ts:859:15)

  console.log
    [E2E Monitoring Test] Step 1: Invoking Lambda multiple times to generate metrics...

      at Object.<anonymous> (test/tap-stack.int.test.ts:865:15)

  console.log
    [E2E Monitoring Test] Invocation 1/5 completed successfully

      at test/tap-stack.int.test.ts:882:17
          at Array.forEach (<anonymous>)

  console.log
    [E2E Monitoring Test] Invocation 2/5 completed successfully

      at test/tap-stack.int.test.ts:882:17
          at Array.forEach (<anonymous>)

  console.log
    [E2E Monitoring Test] Invocation 3/5 completed successfully

      at test/tap-stack.int.test.ts:882:17
          at Array.forEach (<anonymous>)

  console.log
    [E2E Monitoring Test] Invocation 4/5 completed successfully

      at test/tap-stack.int.test.ts:882:17
          at Array.forEach (<anonymous>)

  console.log
    [E2E Monitoring Test] Invocation 5/5 completed successfully

      at test/tap-stack.int.test.ts:882:17
          at Array.forEach (<anonymous>)

  console.log
    [E2E Monitoring Test] Step 2: Waiting for metrics to propagate to CloudWatch...

      at Object.<anonymous> (test/tap-stack.int.test.ts:885:15)

  console.log
    [E2E Monitoring Test] Step 3: Verifying CloudWatch Alarms are monitoring Lambda...

      at Object.<anonymous> (test/tap-stack.int.test.ts:889:15)

  console.log
    [E2E Monitoring Test] Step 4: Verifying Lambda execution logs in CloudWatch...

      at Object.<anonymous> (test/tap-stack.int.test.ts:914:15)

  console.log
    [E2E Monitoring Test] E2E monitoring workflow completed - All 4 steps verified

      at Object.<anonymous> (test/tap-stack.int.test.ts:932:15)

  console.log
    [E2E Monitoring Test] Captured 14 Lambda executions in CloudWatch Logs

      at Object.<anonymous> (test/tap-stack.int.test.ts:933:15)

  console.log
    [E2E Network Test] Step 1: Verifying VPC exists...

      at Object.<anonymous> (test/tap-stack.int.test.ts:939:15)

  console.log
    [E2E Network Test] Step 2: Verifying Internet Gateway attached...

      at Object.<anonymous> (test/tap-stack.int.test.ts:948:15)

  console.log
    [E2E Network Test] Step 3: Verifying NAT Gateway exists and is available...

      at Object.<anonymous> (test/tap-stack.int.test.ts:957:15)

  console.log
    [E2E Network Test] Step 4: Verifying public subnet has route to IGW...

      at Object.<anonymous> (test/tap-stack.int.test.ts:966:15)

  console.log
    [E2E Network Test] Step 5: Verifying private subnet has route to NAT...

      at Object.<anonymous> (test/tap-stack.int.test.ts:985:15)

  console.log
    [E2E Network Test] Step 6: Verifying Lambda in VPC can access external resources...

      at Object.<anonymous> (test/tap-stack.int.test.ts:999:15)

  console.log
    [E2E Network Test] E2E network flow completed - All 6 steps verified

      at Object.<anonymous> (test/tap-stack.int.test.ts:1004:15)

  console.log
    [E2E Security Test] Step 1: Getting VPC security groups...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1010:15)

  console.log
    [E2E Security Test] Step 2: Finding Lambda security group...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1018:15)

  console.log
    [E2E Security Test] Step 3: Finding RDS security group...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1024:15)

  console.log
    [E2E Security Test] Step 4: Verifying Lambda security group allows all outbound...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1032:15)

  console.log
    [E2E Security Test] Step 5: Verifying RDS security group ONLY allows Lambda...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1037:15)

  console.log
    [E2E Security Test] Step 6: Verifying NO public access on PostgreSQL port...

      at Object.<anonymous> (test/tap-stack.int.test.ts:1044:15)

  console.log
    [E2E Security Test] E2E security flow completed - All 6 steps verified

      at Object.<anonymous> (test/tap-stack.int.test.ts:1051:15)

PASS test/tap-stack.int.test.ts (169.09 s)
  Integration Tests for Serverless Python Application with RDS PostgreSQL
    [SERVICE-LEVEL] Lambda Function - Direct Invocation
      ✓ should invoke Lambda function directly and receive successful response with correct message (710 ms)
      ✓ should invoke Lambda function with custom payload and verify execution (14 ms)
    [SERVICE-LEVEL] S3 Bucket - Object Operations with Encryption
      ✓ should PUT object to S3 bucket with AES256 encryption (12 ms)
      ✓ should GET object from S3 bucket and verify content (8 ms)
      ✓ should DELETE object from S3 bucket and verify removal (10 ms)
      ✓ should verify S3 bucket has versioning enabled by creating multiple versions (14 ms)
    [SERVICE-LEVEL] Secrets Manager - Retrieve Database Credentials
      ✓ should retrieve secret value from Secrets Manager (4 ms)
      ✓ should describe secret and verify configuration (2 ms)
    [SERVICE-LEVEL] CloudWatch Logs - Query Lambda Execution Logs
      ✓ should query CloudWatch Logs for Lambda execution records (11 ms)
      ✓ should verify Lambda log group has correct retention period (2 ms)
    [SERVICE-LEVEL] CloudWatch Alarms - Verify Monitoring Configuration
      ✓ should verify Lambda, API Gateway, and RDS alarms are configured and active (6 ms)
      ✓ should be able to send custom metrics to CloudWatch (4 ms)
    [SERVICE-LEVEL] RDS Instance - Verify Database Configuration
      ✓ should have RDS PostgreSQL instance available with correct configuration (6 ms)
    [CROSS-SERVICE] API Gateway -> Lambda Integration
      ✓ should call API Gateway endpoint and verify Lambda execution (38 ms)
      ✓ should verify API Gateway triggers Lambda with request context (14 ms)
    [CROSS-SERVICE] Lambda -> CloudWatch Logs Integration
      ✓ should invoke Lambda and verify logs appear in CloudWatch with execution details (9 ms)
      ✓ should verify Lambda execution metrics are sent to CloudWatch (10037 ms)
    [CROSS-SERVICE] API Gateway -> CloudWatch Logs Integration
      ✓ should call API Gateway and verify access logs in CloudWatch (70316 ms)
    [CROSS-SERVICE] Secrets Manager -> RDS Credentials Integration
      ✓ should verify RDS credentials in Secrets Manager match RDS configuration (27 ms)
    [CROSS-SERVICE] VPC -> Lambda Network Integration
      ✓ should verify Lambda is deployed in VPC private subnets (32 ms)
      ✓ should verify Lambda security group allows outbound traffic (9 ms)
    [E2E] Complete API Gateway -> Lambda -> CloudWatch Logs Flow
      ✓ should execute complete request flow: API call -> Lambda execution -> CloudWatch logging -> Cleanup verification (70397 ms)
    [E2E] Complete S3 Workflow: PUT -> GET -> Versioning -> DELETE with Encryption
      ✓ should execute complete S3 workflow with real data and cleanup (47 ms)
    [E2E] Complete Monitoring Flow: Lambda Invocation -> Metrics -> CloudWatch Alarms
      ✓ should execute complete monitoring workflow with real Lambda executions (16611 ms)
    [E2E] Network Flow: Internet Gateway -> VPC -> Subnets -> NAT Gateway
      ✓ should have complete network connectivity from internet to private subnets via NAT (67 ms)
    [E2E] Security Flow: Security Groups -> RDS Access Control
      ✓ should enforce security group rules: RDS only accessible from Lambda security group (19 ms)

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        169.242 s
Ran all test suites matching /.int.test.ts$/i.
[0;32m🎉 Integration tests completed successfully![0m
[0;34m📊 Test Summary:[0m
[1;33m  • All infrastructure components validated[0m
[1;33m  • LocalStack environment verified[0m
[1;33m  • Resources properly configured[0m
