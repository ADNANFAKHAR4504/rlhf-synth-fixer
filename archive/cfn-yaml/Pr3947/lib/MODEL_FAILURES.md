# MODEL_FAILURES.md

This document details the infrastructure changes required to transform the CloudFormation template into its ideal state, focusing on technical implementation and fixes.

## Core Infrastructure Improvements

### 1. Load Balancer Security Enhancement

**Current State**: Basic ALB configuration without access logs and HTTPS

**Required Changes**:

1. **Access Logging Setup**:

```yaml
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  DependsOn: LogsBucketPolicy
  Properties:
    LoadBalancerAttributes:
      - Key: access_logs.s3.enabled
        Value: 'true'
      - Key: access_logs.s3.bucket
        Value: !Ref LogsBucket
      - Key: access_logs.s3.prefix
        Value: alb-logs
```

2. **S3 Log Bucket Configuration**:

```yaml
LogsBucket:
  Type: AWS::S3::Bucket
  Properties:
    VersioningConfiguration:
      Status: Enabled
    LifecycleConfiguration:
      Rules:
        - Id: DeleteOldLogs
          Status: Enabled
          ExpirationInDays: 90
```

3. **Bucket Policy for ALB Access**:

````yaml
LogsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref LogsBucket
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: elasticloadbalancing.amazonaws.com
          Action: s3:PutObject
          Resource: !Sub ${LogsBucket.Arn}/alb-logs/*

### 2. SSL/TLS Configuration

**Current State**: HTTP only, no SSL/TLS configuration
**Required Changes**:

1. **Certificate Manager Setup**:
```yaml
SSLCertificate:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: !Ref DomainName
    ValidationMethod: DNS
      "Tags": [
        {
          "Key": "Environment",
          "Value": {"Ref": "Environment"}
        }
      ]
    }
  }
}
````

2. **HTTPS Listener Configuration**:

```json
{
  "HTTPSListener": {
    "Type": "AWS::ElasticLoadBalancingV2::Listener",
    "Properties": {
      "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
      "Port": 443,
      "Protocol": "HTTPS",
      "Certificates": [
        {
          "CertificateArn": { "Ref": "SSLCertificate" }
        }
      ],
      "DefaultActions": [
        {
          "Type": "forward",
          "TargetGroupArn": { "Ref": "DefaultTargetGroup" }
        }
      ]
    }
  }
}
```

3. **HTTP to HTTPS Redirection**:

````yaml
HTTPListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP
    DefaultActions:
      - Type: redirect
        RedirectConfig:
          Protocol: HTTPS
          Port: '443'
          StatusCode: HTTP_301
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
````

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

### 3. Infrastructure Testing Enhancement

**Current State**: Basic infrastructure tests lacking type safety and proper error handling

**Required Changes**:

1. **Type-Safe AWS Resource Testing**:

```typescript
interface ALBResource {
  LoadBalancerArn: string;
  AvailabilityZones?: Array<{
    SubnetId: string;
    ZoneName: string;
  }>;
  State?: {
    Code: string;
    Reason?: string;
  };
}

interface VPCResource {
  VpcId: string;
  Tags?: Array<{
    Key: string;
    Value: string;
  }>;
}

// Type-safe resource testing
const validateALB = async (alb: ALBResource): Promise<void> => {
  // Validate multi-AZ deployment
  const azCount = alb.AvailabilityZones?.length ?? 0;
  expect(azCount).toBeGreaterThanOrEqual(2);

  // Validate ALB state
  expect(alb.State?.Code).toBe('active');

  // Validate ALB tags
  const tags = await getResourceTags(alb.LoadBalancerArn);
  expect(tags).toHaveProperty('Environment');
};
```

2. **Error Handling Implementation**:

```typescript
interface APIError extends Error {
  code?: string;
  statusCode?: number;
}

const safeResourceFetch = async <T>(fetcher: () => Promise<T>): Promise<T> => {
  try {
    return await fetcher();
  } catch (error) {
    const apiError = error as APIError;
    if (apiError.code === 'ResourceNotFoundException') {
      throw new Error(`Resource not found: ${apiError.message}`);
    }
    throw error;
  }
};
```

3. **Test Suite Organization**:

```typescript
describe('Infrastructure Validation', () => {
  describe('Network Resources', () => {
    test('VPC Configuration', async () => {
      const vpc = await safeResourceFetch(getVPC);
      expect(vpc.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'test',
      });
    });

    test('Subnet Distribution', async () => {
      const subnets = await safeResourceFetch(getSubnets);
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });
});
```

## Implementation Guide

### 1. Access Log Implementation Steps

1. Create S3 bucket with versioning and lifecycle rules
2. Configure bucket policy for ALB access
3. Enable access logs on ALB
4. Verify log delivery

### 2. HTTPS Configuration Steps

1. Register valid domain name
2. Request ACM certificate
3. Configure DNS validation
4. Add HTTPS listener
5. Implement HTTP to HTTPS redirect

### 3. Testing Guidelines

1. Use type-safe interfaces for AWS resources
2. Implement comprehensive error handling
3. Follow testing best practices:
   - Independent test cases
   - Clear failure messages
   - Proper resource cleanup

This implementation provides:

- Type-safe infrastructure testing
- Robust error handling
- Clear upgrade paths
- Proper resource management
