# LocalStack Community Edition Compatibility Changes

This document outlines the changes made to adapt the original financial services security stack for LocalStack Community Edition compatibility.

## Summary of Changes

This stack was originally designed for AWS production with comprehensive security features. For LocalStack Community Edition, several Pro-only features have been removed or simplified while maintaining the core security architecture.

## Infrastructure Changes

### 1. **KMS Key** (`lib/tap-stack.ts:97-103`)
- **Disabled key rotation** (`enableKeyRotation: false`)
  - Reason: Key rotation not fully supported in LocalStack Community
- **Changed removal policy** to `DESTROY`
  - Reason: Easier cleanup in development/testing environment

### 2. **VPC Configuration** (`lib/tap-stack.ts:198-202`)
- **Reduced AZs** from 3 to 2 (`maxAzs: 2`)
  - Reason: Simplified deployment for LocalStack, still maintains redundancy

### 3. **CloudWatch Log Groups** (`lib/tap-stack.ts:168-172`, `lib/tap-stack.ts:515-520`)
- **Shortened retention** from 1 year to 1 week
  - Reason: Testing environment doesn't require long-term retention
- **Changed removal policy** to `DESTROY`
  - Reason: Easier cleanup

### 4. **S3 Bucket** (`lib/tap-stack.ts:289-298`)
- **Changed removal policy** to `DESTROY`
  - Reason: Easier cleanup in testing environment
- Kept: KMS encryption, versioning, public access blocking

### 5. **RDS Database** (`lib/tap-stack.ts:410-430`)
- **Disabled Multi-AZ** (`multiAz: false`)
  - Reason: **Multi-AZ is a Pro-only feature** in LocalStack
- **Disabled Performance Insights** (`enablePerformanceInsights: false`)
  - Reason: Not supported in LocalStack Community
- **Disabled enhanced monitoring** (`monitoringInterval: 0`)
  - Reason: Limited support in LocalStack
- **Simplified logging** (`cloudwatchLogsExports: []`)
  - Reason: Reduced complexity for testing
- **Reduced backup retention** to 1 day
  - Reason: Testing environment
- **Changed removal policy** to `DESTROY` and disabled deletion protection
  - Reason: Easier cleanup

### 6. **EC2 Instance** (`lib/tap-stack.ts:74-76`, `lib/tap-stack.ts:825-836`)
- **Completely disabled**
  - Reason: EC2 instances have very limited support in LocalStack Community
  - Made property optional and commented out creation
  - Commented out related CloudFormation outputs

### 7. **CloudTrail** (`lib/tap-stack.ts:525-534`)
- **Disabled multi-region trail** (`isMultiRegionTrail: false`)
  - Reason: Limited multi-region support in LocalStack Community
- **Disabled file validation** (`enableFileValidation: false`)
  - Reason: Simplified for testing

### 8. **WAF WebACL** (`lib/tap-stack.ts:688-689`)
- **Changed scope** from `CLOUDFRONT` to `REGIONAL`
  - Reason: **CLOUDFRONT scope not fully supported in Community Edition**
  - REGIONAL scope provides similar protection for region-specific resources

## Test Modifications

### Updated for LocalStack Compatibility (`test/tap-stack.int.test.ts`)

1. **SDK Client Configuration** (lines 58-72)
   - Added support for `AWS_ENDPOINT_URL` environment variable
   - Automatically uses LocalStack endpoint when set

2. **EC2 Tests** (lines 369-380)
   - Completely skipped using `describe.skip()`
   - Reason: EC2 instance disabled in stack

3. **Subnet Count Expectations** (lines 158, 164, 170, 592, 598)
   - Reduced from 3 to 2 AZs throughout tests
   - Matches VPC configuration change

4. **RDS Multi-AZ** (line 278)
   - Changed expectation from `true` to `false`
   - Matches single-AZ configuration

5. **KMS Key Rotation** (lines 322-331)
   - Test skipped for LocalStack
   - Rotation not supported in Community

6. **CloudTrail Configuration** (lines 403-404)
   - Updated expectations for single-region, no file validation
   - Matches CloudTrail changes

7. **Log Retention** (lines 467, 487)
   - Changed from 365 days to 7 days
   - Matches LogGroup configuration

8. **WAF Scope** (line 528)
   - Changed from `CLOUDFRONT` to `REGIONAL`
   - Matches WebACL configuration

## Features Maintained

Despite the changes, the following security features are **fully maintained**:

✅ **VPC isolation** with public, private, and isolated subnets
✅ **KMS encryption** for S3, RDS, logs, and secrets
✅ **S3 bucket** with encryption, versioning, and public access blocking
✅ **RDS PostgreSQL** in isolated subnets (single-AZ)
✅ **CloudTrail** logging to S3 and CloudWatch Logs
✅ **VPC Flow Logs** for network monitoring
✅ **Security Groups** with restricted ingress/egress
✅ **IAM MFA enforcement** policies and groups
✅ **WAF WebACL** with managed rule groups (REGIONAL scope)
✅ **SNS topic** for security alerts
✅ **CloudWatch alarms** for security monitoring

## Features Removed/Simplified

❌ **EC2 instance** - Disabled (limited LocalStack support)
❌ **Multi-AZ RDS** - Changed to single-AZ (Pro-only feature)
❌ **RDS Performance Insights** - Disabled (not supported)
❌ **KMS key rotation** - Disabled (not supported)
❌ **Multi-region CloudTrail** - Single region only
❌ **Long-term log retention** - Reduced to 1 week
❌ **CloudFront-scoped WAF** - Changed to REGIONAL scope

## Deployment Instructions

### Prerequisites
- LocalStack running on `http://localhost:4566`
- AWS CLI configured with LocalStack endpoint
- CDK CLI (`cdklocal` wrapper recommended)

### Environment Variables
```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1
```

### Deployment Commands
```bash
# Bootstrap CDK (first time only)
cdklocal bootstrap

# Deploy the stack
cdklocal deploy --all --require-approval never
```

### Testing
```bash
# Run integration tests
npm test
```

## Production Deployment Notes

**⚠️ IMPORTANT**: This LocalStack-adapted version is for **development and testing only**.

For production AWS deployment:
1. Revert to the original `Pr877` code
2. Restore Multi-AZ RDS configuration
3. Re-enable Performance Insights
4. Restore EC2 instance
5. Re-enable KMS key rotation
6. Restore multi-region CloudTrail
7. Change WAF scope back to CLOUDFRONT if using CloudFront
8. Restore long-term log retention (365 days)
9. Change all `RemovalPolicy.DESTROY` back to `RemovalPolicy.RETAIN`
10. Re-enable deletion protection on RDS

## Migration Path to Production

To use this as a starting point for production:

1. **Review removal policies**: Change `DESTROY` to `RETAIN` for data protection
2. **Enable Multi-AZ**: Set `multiAz: true` for RDS
3. **Enable Performance Insights**: Set `enablePerformanceInsights: true`
4. **Restore EC2 instance**: Uncomment EC2 creation code
5. **Increase AZs**: Change `maxAzs` from 2 to 3
6. **Extend retention**: Change log retention to 365 days
7. **Enable CloudTrail features**: Multi-region and file validation
8. **Review WAF scope**: Use CLOUDFRONT if deploying CloudFront distribution

## Compliance Notes

This LocalStack version maintains the core security controls:
- ✅ Encryption at rest (KMS)
- ✅ Encryption in transit (SSL/TLS enforcement)
- ✅ Network isolation (VPC, security groups)
- ✅ Audit logging (CloudTrail)
- ✅ MFA enforcement policies
- ✅ DDoS protection (WAF)

However, for production compliance (PCI-DSS, HIPAA, SOC 2):
- Restore Multi-AZ for high availability
- Re-enable Performance Insights for monitoring
- Restore multi-region CloudTrail for comprehensive auditing
- Use CLOUDFRONT-scoped WAF for global DDoS protection
- Extend log retention to meet compliance requirements (typically 1+ years)

## Cost Considerations

LocalStack Community Edition changes **significantly reduce AWS costs** if deployed to real AWS:

**Savings**:
- Single-AZ RDS: ~50% reduction in RDS costs
- No EC2 instance: ~$10-20/month savings
- Shorter log retention: ~90% reduction in CloudWatch Logs storage
- No Performance Insights: $7-10/month savings per database

**⚠️ Trade-offs**:
- Reduced high availability (single-AZ)
- Less comprehensive monitoring
- Shorter audit trail retention

## License

This code is provided as-is for testing and development purposes. Always consult with security and compliance teams before deploying to production.
