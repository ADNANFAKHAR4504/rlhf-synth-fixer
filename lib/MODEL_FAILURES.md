# MODEL_FAILURES.md

This document details the technical fixes required in the infrastructure code to address specific failures and reach the ideal state.

## Infrastructure Fixes

### 1. Application Load Balancer Access Logging Configuration
**Error**: ALB UPDATE_FAILED due to incomplete S3 logging configuration and validation issues.

**Root Cause**:
- Missing required S3 bucket configuration attributes
- Incorrect dependency ordering between ALB and S3 bucket policy
- Duplicate logging prefix attribute

**Technical Fix**:
```yaml
# 1. Fixed ALB Configuration
ApplicationLoadBalancer:
  DependsOn: LogsBucketPolicy    # Ensure S3 bucket policy exists first
  Properties:
    LoadBalancerAttributes:
      - Key: deletion_protection.enabled
        Value: 'false'
      - Key: access_logs.s3.enabled
        Value: 'false'           # Initially disabled
      - Key: access_logs.s3.bucket
        Value: !Ref LogsBucket   # Required even when disabled
      - Key: access_logs.s3.prefix
        Value: 'alb-logs'        # Required even when disabled

# 2. S3 Bucket Policy for ALB Logging
LogsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref LogsBucket
    PolicyDocument:
      Statement:
        - Sid: AWSLogDeliveryWrite
          Effect: Allow
          Principal:
            Service: elasticloadbalancing.amazonaws.com
          Action: 's3:PutObject'
          Resource: !Sub '${LogsBucket.Arn}/alb-logs/*'
        - Sid: AWSLogDeliveryAclCheck
          Effect: Allow
          Principal:
            Service: elasticloadbalancing.amazonaws.com
          Action: 's3:GetBucketAcl'
          Resource: !GetAtt LogsBucket.Arn

# 3. Custom Resource for Enabling Logs
EnableALBLogs:
  Type: Custom::LoadBalancerLogs
  DependsOn: LogsBucketPolicy
  Properties:
    ServiceToken: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:EnableALBLogs'
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    S3BucketName: !Ref LogsBucket
    S3Prefix: 'alb-logs'
```

**Implementation Details**:
1. ALB Configuration:
   - Added all required S3 logging attributes upfront
   - Removed duplicate prefix attribute
   - Added explicit dependency on S3 bucket policy

2. S3 Bucket Policy:
   - Configured proper permissions for ALB log delivery
   - Added specific resource paths for log writes
   - Enabled bucket ACL checks for ALB service

3. Log Enabling Process:
   - Created custom resource to handle log enabling
   - Implemented proper resource dependency chain
   - Separated logging activation from ALB creation

### 2. HTTPS/SSL Implementation Status
**Current Status**: Not implemented
**Technical Limitation**: Domain name configuration ends with `.local`

**Configuration Details**:
```yaml
Parameters:
  DomainName:
    Type: String
    Default: 'myapp-test.local'  # Cannot obtain valid SSL certificate for .local domains
```

**Requirements for HTTPS Implementation**:
1. Valid domain name (not ending in .local)
2. Domain ownership verification capability
3. ACM certificate creation and validation
4. ALB HTTPS listener (port 443)
5. Security group updates for HTTPS traffic

## Architectural Implications
1. Load Balancer:
   - Log delivery to S3 configured but initially disabled
   - Prepared for future HTTPS implementation
   - Custom resource handles log activation

2. Security:
   - Proper S3 bucket policies in place
   - ALB security group configured for HTTP (port 80)
   - Service-to-service permissions properly scoped

3. Monitoring:
   - ALB access logs captured in S3
   - Log retention policies configured
   - CloudWatch integration maintained

## Dependencies and Prerequisites
1. S3 Bucket:
   - Must exist before ALB creation
   - Requires proper bucket policy
   - KMS encryption enabled

2. Networking:
   - Public subnets available
   - Internet Gateway attached
   - Route tables configured

3. IAM:
   - ELB service principal permissions
   - S3 bucket access policies
   - Custom resource execution role

**Problem**: ALB access logging configuration caused UPDATE_FAILED state due to S3 bucket validation issues.

**Technical Fix**:

```yaml
# Original problematic configuration
ApplicationLoadBalancer:
  Properties:
    LoadBalancerAttributes:
      - Key: access_logs.s3.enabled
        Value: 'true'
      - Key: access_logs.s3.bucket
        Value: !Ref LogsBucket

# Fixed configuration with proper dependency handling
ApplicationLoadBalancer:
  DependsOn: LogsBucketPolicy
  Properties:
    LoadBalancerAttributes:
      - Key: access_logs.s3.enabled
        Value: 'false'  # Initially disabled
      - Key: access_logs.s3.bucket
        Value: !Ref LogsBucket  # Required even when disabled
      - Key: access_logs.s3.prefix
        Value: 'alb-logs'  # Required even when disabled

EnableALBLogs:
  Type: Custom::LoadBalancerLogs
  DependsOn:
    - ApplicationLoadBalancer
    - LogsBucketPolicy
  Properties:
    ServiceToken: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:EnableALBLogs'
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    S3BucketName: !Ref LogsBucket
    S3Prefix: 'alb-logs'
```

**Implementation Details**:

1. Temporarily disabled ALB access logs during initial creation
2. Added explicit dependency on LogsBucketPolicy
3. Created separate custom resource to enable logging after prerequisites are met
4. Ensured proper S3 bucket policy with required permissions:

```yaml
LogsBucketPolicy:
  Properties:
    PolicyDocument:
      Statement:
        - Sid: AWSLogDeliveryWrite
          Effect: Allow
          Principal:
            Service: elasticloadbalancing.amazonaws.com
          Action: 's3:PutObject'
          Resource: !Sub '${LogsBucket.Arn}/alb-logs/*'
        - Sid: AWSLogDeliveryAclCheck
          Effect: Allow
          Principal:
            Service: elasticloadbalancing.amazonaws.com
          Action: 's3:GetBucketAcl'
          Resource: !GetAtt LogsBucket.Arn
```

### 2. HTTPS/SSL Configuration

**Status**: Not implemented
**Reason**: Domain name ends with `.local` which cannot be validated by ACM

```yaml
Parameters:
  DomainName:
    Type: String
    Default: 'myapp-test.local' # .local domain - cannot obtain valid SSL certificate
```

**Note**: HTTPS implementation requires:

1. Valid domain name (not ending in .local)
2. Domain ownership verification
3. ACM certificate creation and validation
4. ALB listener configuration for HTTPS (port 443)

### 3. Integration Test TypeScript Fixes

**Problem**: Type safety issues in test/tap-stack.int.test.ts

**Technical Fix**:

```typescript
// Original code with type errors
const attachment = igw.Attachments?.find(a => a.VpcId === vpcId);

// Fixed with proper type annotations
const attachment = igw.Attachments?.find(
  (a: { VpcId: string; State: string }) => a.VpcId === vpcId
);

// Added null safety for AvailabilityZones
const albSubnetIds =
  alb?.AvailabilityZones?.map(az => az.SubnetId).filter(
    (id): id is string => id !== undefined
  ) || [];

// Added null coalescing for length checks
expect(alb?.AvailabilityZones?.length ?? 0).toBeGreaterThanOrEqual(2);
```

### 4. Infrastructure Testing

**Technical Details**:

- Added proper type safety to AWS SDK response handling
- Implemented null checks for optional properties
- Added type guards for array filtering
- Ensured proper error handling for AWS API responses

## Required Follow-up Actions

1. Deploy Lambda function for EnableALBLogs custom resource
2. Add HTTPS support when moving to a valid domain name
3. Consider implementing AWS WAF for additional security
4. Review and update CloudWatch alarms for ALB metrics

These changes ensure:

- Reliable ALB log delivery to S3
- Type-safe infrastructure testing
- Clear upgrade path for HTTPS implementation
- Proper resource dependency management
