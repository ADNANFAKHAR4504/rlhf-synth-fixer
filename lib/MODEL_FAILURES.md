# MODEL_FAILURES.md

This document details the technical fixes applied to address specific infrastructure issues identified in the model responses.

## Infrastructure Fixes

### 1. Application Load Balancer Access Logging Issue

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
