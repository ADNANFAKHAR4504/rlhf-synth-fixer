# Model Failures and Common Issues - Pulumi Go Implementation

This document outlines potential failures and issues that may occur during the implementation and deployment of the SecureCorp AWS infrastructure using Pulumi Go.

## Common Implementation Failures

### 1. Import and Dependency Issues

**Problem**: Missing or incorrect Pulumi AWS SDK imports
```
Error: cannot find package "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
```

**Solution**: Ensure all required imports are present:
```go
import (
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)
```

### 2. Resource Creation Order Dependencies

**Problem**: Resources created in wrong order causing dependency failures
```
Error: InvalidParameterValue: The subnet 'subnet-12345' does not exist
```

**Solution**: Ensure proper resource dependencies:
```go
// Create VPC first
vpc, err := ec2.NewVpc(ctx, "main", &ec2.VpcArgs{
    // ... configuration
})

// Then create subnets that depend on VPC
subnet, err := ec2.NewSubnet(ctx, "public-0", &ec2.SubnetArgs{
    VpcId: vpc.ID(), // Explicit dependency
    // ... other configuration
})
```

### 3. Availability Zone Availability

**Problem**: Requested availability zones not available in the region
```
Error: InvalidParameterValue: The subnet AZ 'us-east-1a' is not available
```

**Solution**: Use data source to get available AZs:
```go
availabilityZones, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
    State: pulumi.StringRef("available"),
})
if err != nil {
    return err
}

// Use availabilityZones.Names[i] for subnet creation
```

### 4. KMS Key Policy Issues

**Problem**: KMS key policy not allowing CloudTrail access
```
Error: AccessDenied: User: arn:aws:sts::123456789012:assumed-role/... is not authorized to perform: kms:GenerateDataKey on resource
```

**Solution**: Ensure KMS key policy includes CloudTrail permissions:
```go
// The KMS key should allow CloudTrail service principal
// This is handled automatically by Pulumi AWS provider
```

### 5. S3 Bucket Naming Conflicts

**Problem**: S3 bucket name already exists globally
```
Error: BucketAlreadyExists: The requested bucket name is not available
```

**Solution**: Use unique naming with random suffix:
```go
// Add random suffix to bucket names
bucketName := pulumi.Sprintf("%s-%s-cloudtrail-logs-%s", projectName, environment, randomString)
```

### 6. IAM Role Policy JSON Formatting

**Problem**: Invalid JSON in IAM policy documents
```
Error: MalformedPolicyDocument: The policy document is malformed
```

**Solution**: Use proper JSON formatting and escape characters:
```go
assumeRolePolicy := pulumi.String(`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_ID:root"
            }
        }
    ]
}`)
```

### 7. VPC Endpoint Service Name Issues

**Problem**: Incorrect VPC endpoint service name format
```
Error: InvalidParameterValue: The service name 's3' is not valid
```

**Solution**: Use correct service name format:
```go
serviceName := pulumi.Sprintf("com.amazonaws.%s.s3", awsRegion)
```

### 8. Security Group Rule Conflicts

**Problem**: Duplicate or conflicting security group rules
```
Error: InvalidPermission.Duplicate: The specified rule already exists
```

**Solution**: Ensure unique rule descriptions and avoid duplicates:
```go
Ingress: ec2.SecurityGroupIngressArray{
    &ec2.SecurityGroupIngressArgs{
        FromPort:   pulumi.Int(443),
        ToPort:     pulumi.Int(443),
        Protocol:   pulumi.String("tcp"),
        CidrBlocks: pulumi.StringArray{pulumi.String(vpcCidr)},
        Description: pulumi.String("HTTPS from VPC"), // Unique description
    },
}
```

## Deployment Failures

### 1. AWS Credentials and Permissions

**Problem**: Insufficient AWS permissions
```
Error: AccessDenied: User is not authorized to perform: ec2:CreateVpc
```

**Solution**: Ensure AWS credentials have required permissions:
- EC2 full access
- IAM full access
- S3 full access
- KMS full access
- CloudWatch Logs full access

### 2. Resource Limits

**Problem**: AWS service limits exceeded
```
Error: VpcLimitExceeded: The maximum number of VPCs has been reached
```

**Solution**: 
- Check current resource usage in AWS console
- Delete unused resources
- Request limit increases if needed

### 3. Region-Specific Issues

**Problem**: Resources not available in selected region
```
Error: InvalidParameterValue: NAT Gateway is not supported in this region
```

**Solution**: Verify resource availability in the target region before deployment.

## Testing Failures

### 1. Unit Test Failures

**Problem**: Unit tests failing due to missing imports or incorrect assertions
```
Error: undefined: assert
```

**Solution**: Ensure test dependencies are properly imported:
```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)
```

### 2. Integration Test Failures

**Problem**: Integration tests failing due to missing AWS credentials
```
Error: NoCredentialProviders: no valid providers in chain
```

**Solution**: Set up AWS credentials before running integration tests:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

### 3. Output File Issues

**Problem**: Integration tests can't find output files
```
Error: open ../cfn-outputs/all-outputs.json: no such file or directory
```

**Solution**: Ensure infrastructure is deployed and outputs are generated before running integration tests.

## Performance Issues

### 1. Slow Resource Creation

**Problem**: NAT Gateway creation taking too long
```
Warning: NAT Gateway creation can take 5-10 minutes
```

**Solution**: This is normal AWS behavior. Consider using existing NAT Gateways if available.

### 2. Memory Usage

**Problem**: High memory usage during deployment
```
Error: out of memory
```

**Solution**: 
- Increase system memory
- Deploy resources in smaller batches
- Use resource targeting for specific resources

## Best Practices to Avoid Failures

### 1. Error Handling

Always implement proper error handling:
```go
resource, err := ec2.NewVpc(ctx, "main", &ec2.VpcArgs{
    // ... configuration
})
if err != nil {
    return fmt.Errorf("failed to create VPC: %w", err)
}
```

### 2. Resource Dependencies

Use explicit dependencies to ensure proper creation order:
```go
// Use .ID() to create explicit dependencies
subnet, err := ec2.NewSubnet(ctx, "private-0", &ec2.SubnetArgs{
    VpcId: vpc.ID(), // Explicit dependency
    // ... other configuration
})
```

### 3. Configuration Validation

Validate configuration before resource creation:
```go
if environment == "" {
    return fmt.Errorf("environment variable is required")
}
```

### 4. Resource Naming

Use consistent and unique naming conventions:
```go
resourceName := pulumi.Sprintf("%s-%s-%s", projectName, environment, resourceType)
```

### 5. Tagging Strategy

Implement consistent tagging across all resources:
```go
commonTags := pulumi.StringMap{
    "Project":     pulumi.String("SecureCorp"),
    "Environment": pulumi.String(environment),
    "ManagedBy":   pulumi.String("pulumi"),
    "Owner":       pulumi.String("DevOps"),
}
```

## Troubleshooting Steps

1. **Check Pulumi logs**: `pulumi logs --follow`
2. **Verify AWS credentials**: `aws sts get-caller-identity`
3. **Check resource limits**: AWS Service Quotas console
4. **Validate configuration**: Review environment variables and resource parameters
5. **Check network connectivity**: Ensure access to AWS APIs
6. **Review IAM permissions**: Verify required permissions are granted

## Recovery Procedures

### 1. Partial Deployment Failure

If deployment fails partway through:
1. Review the error logs
2. Fix the identified issue
3. Run `pulumi up` to continue deployment
4. Pulumi will skip already-created resources

### 2. Complete Deployment Failure

If deployment fails completely:
1. Run `pulumi destroy` to clean up partial resources
2. Fix the root cause
3. Run `pulumi up` to redeploy

### 3. Resource State Mismatch

If Pulumi state doesn't match actual AWS resources:
1. Run `pulumi refresh` to sync state
2. Review and resolve any discrepancies
3. Continue with deployment

This documentation helps identify and resolve common issues during the Pulumi Go implementation of the SecureCorp AWS infrastructure.