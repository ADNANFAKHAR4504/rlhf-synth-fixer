# SecureCorp AWS Infrastructure - Pulumi Go Implementation

## Overview

This implementation provides a comprehensive AWS infrastructure setup using Pulumi Go, replicating the Terraform functionality from Pr2064. The infrastructure includes secure networking, data encryption, access control, and comprehensive logging and monitoring.

## Architecture

The infrastructure implements a secure, multi-AZ AWS environment with the following components:

### Core Infrastructure
- **VPC**: Multi-AZ VPC with public and private subnets
- **Networking**: Internet Gateway, NAT Gateways, Route Tables
- **Security Groups**: VPC endpoints and private subnet security groups
- **VPC Endpoints**: S3, KMS, CloudTrail, and CloudWatch Logs endpoints

### Security & Encryption
- **KMS**: Customer-managed encryption key with rotation enabled
- **S3 Buckets**: Encrypted buckets for CloudTrail logs and application data
- **IAM Roles**: Role-based access control with least privilege

### Monitoring & Logging
- **CloudWatch Log Groups**: CloudTrail and application logging
- **S3 Bucket**: Dedicated bucket for CloudTrail logs with lifecycle policies

## Implementation Details

### Configuration Management

The implementation uses environment variables for configuration:

```go
environment := getEnvOrDefault("ENVIRONMENT", "dev")
awsRegion := getEnvOrDefault("AWS_REGION", "us-east-1")
projectName := getEnvOrDefault("PROJECT_NAME", "securecorp")
vpcCidr := getEnvOrDefault("VPC_CIDR", "10.0.0.0/16")
```

### Resource Naming Convention

All resources follow a consistent naming pattern:
```
{projectName}-{environment}-{resourceType}-{identifier}
```

Example: `securecorp-dev-vpc-endpoints-sg`

### Common Tags

All resources are tagged with consistent metadata:

```go
commonTags := pulumi.StringMap{
    "Project":     pulumi.String("SecureCorp"),
    "Environment": pulumi.String(environment),
    "ManagedBy":   pulumi.String("pulumi"),
    "Owner":       pulumi.String("DevOps"),
}
```

## Key Features

### 1. Multi-AZ VPC Setup

Creates a VPC with 2 public and 2 private subnets across different availability zones:

```go
// Create public subnets
publicSubnets := make([]*ec2.Subnet, 2)
for i := 0; i < 2; i++ {
    subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-%d", i), &ec2.SubnetArgs{
        VpcId:               vpc.ID(),
        CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i),
        AvailabilityZone:    pulumi.String(availabilityZones.Names[i]),
        MapPublicIpOnLaunch: pulumi.Bool(true),
        Tags:                commonTags,
    })
    // ... error handling
}

// Create private subnets
privateSubnets := make([]*ec2.Subnet, 2)
for i := 0; i < 2; i++ {
    subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-%d", i), &ec2.SubnetArgs{
        VpcId:            vpc.ID(),
        CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+2),
        AvailabilityZone: pulumi.String(availabilityZones.Names[i]),
        Tags:             commonTags,
    })
    // ... error handling
}
```

### 2. NAT Gateway Configuration

Provides internet access for private subnets through NAT Gateways:

```go
// Create NAT Gateway EIPs
natEips := make([]*ec2.Eip, 2)
for i := 0; i < 2; i++ {
    eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-%d", i), &ec2.EipArgs{
        Domain: pulumi.String("vpc"),
        Tags:   commonTags,
    })
    // ... error handling
}

// Create NAT Gateways
natGateways := make([]*ec2.NatGateway, 2)
for i := 0; i < 2; i++ {
    natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("main-%d", i), &ec2.NatGatewayArgs{
        AllocationId: natEips[i].ID(),
        SubnetId:     publicSubnets[i].ID(),
        Tags:         commonTags,
    })
    // ... error handling
}
```

### 3. Security Groups

Implements defense in depth with specific security groups:

```go
// VPC Endpoints Security Group
vpcEndpointsSg, err := ec2.NewSecurityGroup(ctx, "vpc-endpoints", &ec2.SecurityGroupArgs{
    Name:        pulumi.Sprintf("%s-%s-vpc-endpoints-sg", projectName, environment),
    Description: pulumi.String("Security group for VPC endpoints"),
    VpcId:       vpc.ID(),
    Ingress: ec2.SecurityGroupIngressArray{
        &ec2.SecurityGroupIngressArgs{
            FromPort:   pulumi.Int(443),
            ToPort:     pulumi.Int(443),
            Protocol:   pulumi.String("tcp"),
            CidrBlocks: pulumi.StringArray{pulumi.String(vpcCidr)},
            Description: pulumi.String("HTTPS from VPC"),
        },
    },
    Egress: ec2.SecurityGroupEgressArray{
        &ec2.SecurityGroupEgressArgs{
            FromPort:   pulumi.Int(0),
            ToPort:     pulumi.Int(0),
            Protocol:   pulumi.String("-1"),
            CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
            Description: pulumi.String("All outbound traffic"),
        },
    },
    Tags: commonTags,
})
```

### 4. VPC Endpoints

Keeps traffic within AWS network for enhanced security:

```go
// S3 Gateway Endpoint
s3Endpoint, err := ec2.NewVpcEndpoint(ctx, "s3", &ec2.VpcEndpointArgs{
    VpcId:            vpc.ID(),
    ServiceName:       pulumi.Sprintf("com.amazonaws.%s.s3", awsRegion),
    VpcEndpointType:   pulumi.String("Gateway"),
    RouteTableIds:     pulumi.StringArray{publicRouteTable.ID()},
    Tags:              commonTags,
})

// KMS Interface Endpoint
kmsEndpoint, err := ec2.NewVpcEndpoint(ctx, "kms", &ec2.VpcEndpointArgs{
    VpcId:              vpc.ID(),
    ServiceName:         pulumi.Sprintf("com.amazonaws.%s.kms", awsRegion),
    VpcEndpointType:     pulumi.String("Interface"),
    SubnetIds:           pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
    SecurityGroupIds:    pulumi.StringArray{vpcEndpointsSg.ID()},
    PrivateDnsEnabled:   pulumi.Bool(true),
    Tags:                commonTags,
})
```

### 5. KMS Encryption

Customer-managed encryption key with best practices:

```go
kmsKey, err := kms.NewKey(ctx, "main", &kms.KeyArgs{
    Description:            pulumi.Sprintf("KMS key for %s %s resources", projectName, environment),
    DeletionWindowInDays:   pulumi.Int(7),
    EnableKeyRotation:      pulumi.Bool(true),
    CustomerMasterKeySpec:  pulumi.String("SYMMETRIC_DEFAULT"),
    KeyUsage:               pulumi.String("ENCRYPT_DECRYPT"),
    MultiRegion:            pulumi.Bool(true),
    Tags:                   commonTags,
})

// Create KMS alias
_, err = kms.NewAlias(ctx, "main", &kms.AliasArgs{
    Name:         pulumi.Sprintf("alias/%s-%s-key", projectName, environment),
    TargetKeyId:  kmsKey.KeyId,
})
```

### 6. S3 Bucket Security

Encrypted buckets with comprehensive security settings:

```go
// CloudTrail logs bucket
cloudtrailLogsBucket, err := s3.NewBucket(ctx, "cloudtrail-logs", &s3.BucketArgs{
    Bucket: pulumi.Sprintf("%s-%s-cloudtrail-logs", projectName, environment),
    Tags:   commonTags,
})

// Configure encryption
_, err = s3.NewBucketServerSideEncryptionConfiguration(ctx, "cloudtrail-logs-encryption", &s3.BucketServerSideEncryptionConfigurationArgs{
    Bucket: cloudtrailLogsBucket.ID(),
    Rules: s3.BucketServerSideEncryptionConfigurationRuleArray{
        &s3.BucketServerSideEncryptionConfigurationRuleArgs{
            ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs{
                KmsMasterKeyId: kmsKey.Arn,
                SseAlgorithm:   pulumi.String("aws:kms"),
            },
        },
    },
})

// Configure public access block
_, err = s3.NewBucketPublicAccessBlock(ctx, "cloudtrail-logs-public-access", &s3.BucketPublicAccessBlockArgs{
    Bucket:                cloudtrailLogsBucket.ID(),
    BlockPublicAcls:       pulumi.Bool(true),
    BlockPublicPolicy:     pulumi.Bool(true),
    IgnorePublicAcls:      pulumi.Bool(true),
    RestrictPublicBuckets: pulumi.Bool(true),
})

// Configure versioning
_, err = s3.NewBucketVersioning(ctx, "cloudtrail-logs-versioning", &s3.BucketVersioningArgs{
    Bucket: cloudtrailLogsBucket.ID(),
    VersioningConfiguration: &s3.BucketVersioningVersioningConfigurationArgs{
        Status: pulumi.String("Enabled"),
    },
})
```

### 7. IAM Role-Based Access Control

Implements least privilege access with developer role:

```go
developerRole, err := iam.NewRole(ctx, "developer", &iam.RoleArgs{
    Name: pulumi.Sprintf("%s-%s-developer-role", projectName, environment),
    AssumeRolePolicy: pulumi.String(`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::ACCOUNT_ID:root"
                },
                "Condition": {
                    "StringEquals": {
                        "sts:ExternalId": "developer-access"
                    }
                }
            }
        ]
    }`),
    Tags: commonTags,
})

// Create developer policy with least privilege
_, err = iam.NewRolePolicy(ctx, "developer-policy", &iam.RolePolicyArgs{
    Name: pulumi.Sprintf("%s-%s-developer-policy", projectName, environment),
    Role: developerRole.Name,
    Policy: pulumi.All(appDataBucket.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
        bucketArn := args[0].(string)
        keyArn := args[1].(string)
        return fmt.Sprintf(`{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "%s",
                        "%s/*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-server-side-encryption": "aws:kms"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": ["%s"]
                }
            ]
        }`, bucketArn, bucketArn, keyArn)
    }).(pulumi.StringOutput),
})
```

### 8. CloudWatch Logging

Comprehensive logging with appropriate retention periods:

```go
// CloudTrail log group (7 years retention)
cloudtrailLogGroup, err := cloudwatch.NewLogGroup(ctx, "cloudtrail", &cloudwatch.LogGroupArgs{
    LogGroupName:    pulumi.Sprintf("/aws/cloudtrail/%s-%s", projectName, environment),
    RetentionInDays: pulumi.Int(2557), // 7 years
    Tags:            commonTags,
})

// Application log group (90 days retention)
applicationLogGroup, err := cloudwatch.NewLogGroup(ctx, "application", &cloudwatch.LogGroupArgs{
    LogGroupName:    pulumi.Sprintf("/aws/application/%s-%s", projectName, environment),
    RetentionInDays: pulumi.Int(90),
    Tags:            commonTags,
})
```

## Outputs

The implementation exports comprehensive outputs for integration with other systems:

```go
// Export outputs
ctx.Export("vpc_id", vpc.ID())
ctx.Export("private_subnet_ids", pulumi.All(privateSubnets[0].ID(), privateSubnets[1].ID()))
ctx.Export("public_subnet_ids", pulumi.All(publicSubnets[0].ID(), publicSubnets[1].ID()))
ctx.Export("kms_key_id", kmsKey.KeyId)
ctx.Export("kms_key_arn", kmsKey.Arn)
ctx.Export("cloudtrail_logs_bucket", cloudtrailLogsBucket.Bucket)
ctx.Export("app_data_bucket", appDataBucket.Bucket)
ctx.Export("iam_roles", pulumi.Map{
    "developer": developerRole.Arn,
})
ctx.Export("vpc_endpoints", pulumi.Map{
    "s3":         s3Endpoint.ID(),
    "kms":        kmsEndpoint.ID(),
    "cloudtrail": cloudtrailEndpoint.ID(),
    "logs":       logsEndpoint.ID(),
})
```

## Testing

### Unit Tests

Comprehensive unit tests validate the code structure and syntax:

- File structure and syntax validation
- Variable definitions and configuration
- VPC and networking resource creation
- Security group configuration
- VPC endpoint setup
- S3 bucket configuration
- KMS key setup
- IAM role and policy creation
- CloudWatch log group configuration
- Output validation
- Naming conventions
- Common tags application
- Helper functions

### Integration Tests

Live AWS integration tests validate actual resource deployment:

- Infrastructure outputs validation
- Live VPC creation and configuration
- Live S3 bucket verification
- Live KMS key validation
- Live IAM role verification
- Live VPC endpoint testing
- Live CloudWatch log group validation
- Security constraints enforcement

## Security Features

1. **Encryption at Rest**: All data encrypted with customer-managed KMS keys
2. **Network Security**: VPC endpoints keep traffic within AWS network
3. **Access Control**: Role-based access with least privilege
4. **Public Access Block**: S3 buckets configured to block all public access
5. **Versioning**: S3 buckets have versioning enabled for data protection
6. **Comprehensive Logging**: CloudTrail and application logging with appropriate retention

## Compliance

The implementation follows AWS Well-Architected Framework security pillar:

- **Identity and Access Management**: Role-based access control
- **Data Protection**: Encryption at rest and in transit
- **Infrastructure Protection**: VPC, security groups, and VPC endpoints
- **Detection**: Comprehensive logging and monitoring
- **Incident Response**: Audit trails and access logs

## Deployment

To deploy this infrastructure:

1. Set environment variables:
   ```bash
   export ENVIRONMENT=dev
   export AWS_REGION=us-east-1
   export PROJECT_NAME=securecorp
   export VPC_CIDR=10.0.0.0/16
   ```

2. Initialize Pulumi:
   ```bash
   pulumi stack init securecorp-dev
   ```

3. Deploy:
   ```bash
   pulumi up
   ```

4. Run tests:
   ```bash
   # Unit tests
   go test -v ./tests/unit/
   
   # Integration tests (requires AWS credentials)
   go test -v ./tests/integration/
   ```

This implementation provides a production-ready, secure AWS infrastructure that follows best practices and compliance requirements.
