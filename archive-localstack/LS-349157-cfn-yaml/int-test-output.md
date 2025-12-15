> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN)
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /home/iqbala/projects/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules

 PASS  test/tap-stack.int.test.ts (51.63 s)
  TapStack — Live Integration (resilient) ✅
    ✓ parsed outputs and region are sane (3 ms)
    ✓ VPC exists (or at least describable) (877 ms)
    ✓ public subnets belong to VPC and mapPublicIpOnLaunch=true (if exported) (201 ms)
    ✓ private subnets belong to VPC and do NOT mapPublicIpOnLaunch (if exported) (27 ms)
    ✓ NAT gateways in VPC are best-effort (dev/LocalStack may omit) (156 ms)
    ✓ ALB exists, type application, DNS matches outputs (335 ms)
    ✓ ALB security group exposes only HTTP/HTTPS to the world (no extra open ports) (137 ms)
    ✓ WAFv2 WebACL (if provided) exists and has AWS managed rules (1 ms)
    ✓ WAFv2 WebACL (if provided) is associated with the ALB (1 ms)
    ✓ Flow Logs log group present (best-effort) (71 ms)
    ✓ Flow Log resource (by ID) is describable when ID is known (1 ms)
    ✓ Gateway VPC endpoint for S3 exists (or endpoint APIs are unavailable) (142 ms)
    ✓ Interface endpoints (logs, sts, kms, ssm) exist (best-effort) (15 ms)
    ✓ KMS keys from outputs are describable when possible (best-effort) (1636 ms)
    ✓ CloudWatch alarms describable; any RDS CPU alarms (if present) have sane threshold (32 ms)
    ✓ AWS Config: recorder and delivery channel checks are non-blocking but live (897 ms)
    ✓ AWS Config: core managed rules presence is best-effort (no failures if permissions/lag) (12 ms)
    ✓ Security Hub: hub describable (if enabled) and status output (if present) is consistent (7311 ms)
    ✓ Security Hub: standards listable (if allowed); accept already-enabled or not-enabled states (8984 ms)
    ✓ GuardDuty: detector describable when ID exported (best-effort) (2 ms)
    ✓ RDS: instance (if present) is encrypted, MultiAZ, not publicly accessible (2 ms)
    ✓ RDS: parameter group 'rds.force_ssl' validated if readable; otherwise acceptable (2 ms)
    ✓ ALB target group exists and has HTTP health checks (best-effort) (149 ms)
    ✓ RDS endpoint resolves via DNS; TCP 5432 connectivity best-effort (may be private) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        53.431 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured