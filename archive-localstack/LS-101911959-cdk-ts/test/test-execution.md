🚀 Starting integration tests...
📋 Running test:integration script...

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/prakhar/Desktop/Code/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
 FAIL  test/tap-stack.int.test.ts
  TapStack Integration Tests - Secure Financial Data Processing
    VPC and Networking Validation
      ✓ should have VPC with correct ID (252 ms)
      ✓ should have 3 private isolated subnets across 3 AZs (63 ms)
      ✓ should have security groups for Lambda and endpoints (39 ms)
      ✓ should have VPC endpoints for S3, DynamoDB, CloudWatch Logs, and KMS (25 ms)
    S3 Buckets Validation
      ✕ should have input bucket with correct name (201 ms)
      ✕ should have output bucket with correct name (165 ms)
      ✕ input bucket should have KMS encryption enabled (36 ms)
      ✕ output bucket should have KMS encryption enabled (5 ms)
      ✕ input bucket should have versioning enabled (6 ms)
      ✕ output bucket should have versioning enabled (5 ms)
      ✕ input bucket should have lifecycle policies configured (5 ms)
      ✕ output bucket should have lifecycle policies configured (6 ms)
      ✕ input bucket should have public access blocked (15 ms)
      ✕ output bucket should have public access blocked (4 ms)
    Lambda Function Validation
      ✓ should have Lambda function with correct name (199 ms)
      ✓ Lambda function should be configured in VPC (5 ms)
      ✓ Lambda function should have correct environment variables (3 ms)
      ✓ Lambda function should have IAM role attached (2 ms)
      ✓ Lambda function should have log group configured (25 ms)
    DynamoDB Table Validation
      ✓ should have DynamoDB table with correct name (661 ms)
      ✓ DynamoDB table should have correct partition and sort keys (31 ms)
      ✓ DynamoDB table should have KMS encryption enabled (13 ms)
      ✕ DynamoDB table should have point-in-time recovery enabled (6 ms)
    KMS Keys Validation
      ✓ should have input bucket KMS key (25 ms)
      ✓ should have output bucket KMS key (4 ms)
      ✓ should have DynamoDB KMS key (5 ms)
      ✓ KMS keys should have aliases configured (13 ms)
      ✓ KMS keys should have key rotation enabled (3 ms)
    SNS Topic Validation
      ✓ should have security alert SNS topic (46 ms)
    CloudWatch Logs Validation
      ✕ should have Lambda log group with 7-year retention (3 ms)
      ✕ should have metric filter for unauthorized access (8 ms)
    CloudWatch Alarms Validation
      ✕ should have alarm for failed Lambda invocations (7 ms)
      ✓ should have alarm for unauthorized access attempts (3 ms)
    IAM Role Validation
      ✓ Lambda function role should exist (39 ms)
      ✓ Lambda role should have inline policies with explicit denies (16 ms)
    End-to-End Security Validation
      ✕ all resources should be properly encrypted (61 ms)
      ✓ VPC should have no internet gateway (private subnets only) (15 ms)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › should have input bucket with correct name

    expect(received).resolves.not.toThrow()

    Received promise rejected instead of resolved
    Rejected to value: [Unknown: UnknownError]

      207 |     test('should have input bucket with correct name', async () => {
      208 |       const command = new HeadBucketCommand({ Bucket: inputBucketName });
    > 209 |       await expect(s3Client.send(command)).resolves.not.toThrow();
          |             ^
      210 |     });
      211 |
      212 |     test('should have output bucket with correct name', async () => {

      at expect (node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:209:13)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › should have output bucket with correct name

    expect(received).resolves.not.toThrow()

    Received promise rejected instead of resolved
    Rejected to value: [Unknown: UnknownError]

      212 |     test('should have output bucket with correct name', async () => {
      213 |       const command = new HeadBucketCommand({ Bucket: outputBucketName });
    > 214 |       await expect(s3Client.send(command)).resolves.not.toThrow();
          |             ^
      215 |     });
      216 |
      217 |     test('input bucket should have KMS encryption enabled', async () => {

      at expect (node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:214:13)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › input bucket should have KMS encryption enabled

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      224 |       const rules =
      225 |         response.ServerSideEncryptionConfiguration?.Rules || [];
    > 226 |       expect(rules.length).toBeGreaterThan(0);
          |                            ^
      227 |
      228 |       const kmsRule = rules.find(
      229 |         rule =>

      at Object.<anonymous> (test/tap-stack.int.test.ts:226:28)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › output bucket should have KMS encryption enabled

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      245 |       const rules =
      246 |         response.ServerSideEncryptionConfiguration?.Rules || [];
    > 247 |       expect(rules.length).toBeGreaterThan(0);
          |                            ^
      248 |
      249 |       const kmsRule = rules.find(
      250 |         rule =>

      at Object.<anonymous> (test/tap-stack.int.test.ts:247:28)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › input bucket should have versioning enabled

    expect(received).toBe(expected) // Object.is equality

    Expected: "Enabled"
    Received: undefined

      260 |       const response = await s3Client.send(command);
      261 |
    > 262 |       expect(response.Status).toBe('Enabled');
          |                               ^
      263 |     });
      264 |
      265 |     test('output bucket should have versioning enabled', async () => {

      at Object.<anonymous> (test/tap-stack.int.test.ts:262:31)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › output bucket should have versioning enabled

    expect(received).toBe(expected) // Object.is equality

    Expected: "Enabled"
    Received: undefined

      269 |       const response = await s3Client.send(command);
      270 |
    > 271 |       expect(response.Status).toBe('Enabled');
          |                               ^
      272 |     });
      273 |
      274 |     test('input bucket should have lifecycle policies configured', async () => {

      at Object.<anonymous> (test/tap-stack.int.test.ts:271:31)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › input bucket should have lifecycle policies configured

    expect(received).toBeDefined()

    Received: undefined

      278 |       const response = await s3Client.send(command);
      279 |
    > 280 |       expect(response.Rules).toBeDefined();
          |                              ^
      281 |       expect(response.Rules?.length).toBeGreaterThan(0);
      282 |     });
      283 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:280:30)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › output bucket should have lifecycle policies configured

    expect(received).toBeDefined()

    Received: undefined

      288 |       const response = await s3Client.send(command);
      289 |
    > 290 |       expect(response.Rules).toBeDefined();
          |                              ^
      291 |       expect(response.Rules?.length).toBeGreaterThan(0);
      292 |     });
      293 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:290:30)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › input bucket should have public access blocked

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: undefined

      301 |       expect(
      302 |         response.PublicAccessBlockConfiguration?.BlockPublicAcls
    > 303 |       ).toBe(true);
          |         ^
      304 |       expect(
      305 |         response.PublicAccessBlockConfiguration?.BlockPublicPolicy
      306 |       ).toBe(true);

      at Object.<anonymous> (test/tap-stack.int.test.ts:303:9)

  ● TapStack Integration Tests - Secure Financial Data Processing › S3 Buckets Validation › output bucket should have public access blocked

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: undefined

      322 |       expect(
      323 |         response.PublicAccessBlockConfiguration?.BlockPublicAcls
    > 324 |       ).toBe(true);
          |         ^
      325 |     });
      326 |   });
      327 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:324:9)

  ● TapStack Integration Tests - Secure Financial Data Processing › DynamoDB Table Validation › DynamoDB table should have point-in-time recovery enabled

    expect(received).toBe(expected) // Object.is equality

    Expected: "ENABLED"
    Received: "DISABLED"

      457 |         response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
      458 |           ?.PointInTimeRecoveryStatus
    > 459 |       ).toBe('ENABLED');
          |         ^
      460 |     });
      461 |   });
      462 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:459:9)

  ● TapStack Integration Tests - Secure Financial Data Processing › CloudWatch Logs Validation › should have Lambda log group with 7-year retention

    expect(received).toBeGreaterThanOrEqual(expected)

    Matcher error: received value must be a number or bigint

    Received has value: undefined

      565 |       expect(logGroup).toBeDefined();
      566 |       // 7 years = 2555-2557 days (accounting for leap years)
    > 567 |       expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(2555);
          |                                         ^
      568 |       expect(logGroup?.retentionInDays).toBeLessThanOrEqual(2557);
      569 |     });
      570 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:567:41)

  ● TapStack Integration Tests - Secure Financial Data Processing › CloudWatch Logs Validation › should have metric filter for unauthorized access

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      586 |         );
      587 |       });
    > 588 |       expect(hasUnauthorizedFilter).toBe(true);
          |                                     ^
      589 |     });
      590 |   });
      591 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:588:37)

  ● TapStack Integration Tests - Secure Financial Data Processing › CloudWatch Alarms Validation › should have alarm for failed Lambda invocations

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      606 |         );
      607 |       });
    > 608 |       expect(hasFailedInvocationsAlarm).toBe(true);
          |                                         ^
      609 |     });
      610 |
      611 |     test('should have alarm for unauthorized access attempts', async () => {

      at Object.<anonymous> (test/tap-stack.int.test.ts:608:41)

  ● TapStack Integration Tests - Secure Financial Data Processing › End-to-End Security Validation › all resources should be properly encrypted

    expect(received).toBeDefined()

    Received: undefined

      755 |       });
      756 |       const lambdaResponse = await lambdaClient.send(lambdaCommand);
    > 757 |       expect(lambdaResponse.KMSKeyArn).toBeDefined();
          |                                        ^
      758 |     });
      759 |
      760 |     test('VPC should have no internet gateway (private subnets only)', async () => {

      at Object.<anonymous> (test/tap-stack.int.test.ts:757:40)

Test Suites: 1 failed, 1 total
Tests:       15 failed, 22 passed, 37 total
Snapshots:   0 total
Time:        3.155 s
Ran all test suites matching /.int.test.ts$/i.
❌ Integration tests failed!
🔍 Troubleshooting:
  1. Check LocalStack status: curl http://localhost:4566/_localstack/health
  2. Verify infrastructure: ./scripts/localstack-cdk-deploy.sh
  3. Check outputs file: cat cfn-outputs/flat-outputs.json
  4. Review LocalStack logs: localstack logs
(venv) prakhar@Prakhars-MacBook-Air iac-test-automations % 