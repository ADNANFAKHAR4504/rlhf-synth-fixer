
> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /root/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
  console.log
    Skipping integration tests - not in CI/CD environment

      at Object.<anonymous> (test/tap-stack.int.test.ts:30:15)

PASS test/tap-stack.int.test.ts (6.622 s)
  TapStack Integration Tests
    Stack Deployment Verification
      ✓ should have stack deployed successfully (2 ms)
      ✓ should have all required stack outputs (1 ms)
    S3 Bucket Integration Tests
      ✓ should have primary S3 bucket accessible (1 ms)
      ✓ should have secondary S3 bucket accessible (1 ms)
      ✓ should have S3 buckets with proper encryption configuration (2 ms)
      ✓ should have S3 buckets with versioning enabled (3 ms)
      ✓ should have S3 buckets with public access blocked
      ✓ should have S3 bucket policies in place
    KMS Key Integration Tests
      ✓ should have KMS key accessible (1 ms)
      ✓ should have KMS key with proper key policy
      ✓ should be able to encrypt/decrypt with KMS key
    IAM Role Integration Tests
      ✓ should have IAM role accessible
      ✓ should have IAM role with correct policies attached
      ✓ should have instance profile accessible
    End-to-End Functionality Tests
      ✓ should be able to upload and download objects with encryption
      ✓ should reject unencrypted uploads
      ✓ should reject non-HTTPS requests
    Security Validation Tests
      ✓ should have no publicly accessible S3 objects
      ✓ should have proper resource tagging for governance

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        7.467 s
Ran all test suites matching /.int.test.ts$/i.
