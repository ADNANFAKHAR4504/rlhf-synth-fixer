# AWS Infrastructure Setup with Pulumi Go

Here's a comprehensive Pulumi Go program that meets all your requirements:

## Project Structure

First, create the necessary files:

### `go.mod`

```go
module aws-infrastructure

go 1.21

require (
    github.com/pulumi/pulumi-aws/sdk/v6 v6.0.0
    github.com/pulumi/pulumi/sdk/v3 v3.0.0
)
```

### `main.go`

```go
package main

import (
    "fmt"

    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        // Common tags for all resources
        commonTags := pulumi.StringMap{
            "Environment": pulumi.String("Production"),
        }

        // Create VPC
        vpc, err := createVPC(ctx, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create VPC: %w", err)
        }

        // Create Internet Gateway
        igw, err := createInternetGateway(ctx, vpc, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create Internet Gateway: %w", err)
        }

        // Create subnets
        subnetA, subnetB, err := createSubnets(ctx, vpc, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create subnets: %w", err)
        }

        // Create route table and routes
        err = createRouteTable(ctx, vpc, igw, subnetA, subnetB, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create route table: %w", err)
        }

        // Create security group
        securityGroup, err := createSecurityGroup(ctx, vpc, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create security group: %w", err)
        }

        // Create IAM role and instance profile
        role, instanceProfile, err := createIAMResources(ctx, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create IAM resources: %w", err)
        }

        // Create S3 bucket
        bucket, err := createS3Bucket(ctx, role, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create S3 bucket: %w", err)
        }

        // Get the latest Amazon Linux 2 AMI
        ami, err := getLatestAmazonLinux2AMI(ctx)
        if err != nil {
            return fmt.Errorf("failed to get AMI: %w", err)
        }

        // Create EC2 instance
        instance, err := createEC2Instance(ctx, subnetA, securityGroup, instanceProfile, ami, commonTags)
        if err != nil {
            return fmt.Errorf("failed to create EC2 instance: %w", err)
        }

        // Export outputs
        return exportOutputs(ctx, vpc, subnetA, subnetB, instance, bucket, securityGroup, role)
    })
}

// createVPC creates a VPC with the specified CIDR block
func createVPC(ctx *pulumi.Context, tags pulumi.StringMap) (*ec2.Vpc, error) {
    vpc, err := ec2.NewVpc(ctx, "main-vpc", &ec2.VpcArgs{
        CidrBlock:          pulumi.String("10.0.0.0/16"),
        EnableDnsHostnames: pulumi.Bool(true),
        EnableDnsSupport:   pulumi.Bool(true),
        Tags: tags,
    })
    if err != nil {
        return nil, err
    }

    return vpc, nil
}

// createInternetGateway creates an Internet Gateway and attaches it to the VPC
func createInternetGateway(ctx *pulumi.Context, vpc *ec2.Vpc, tags pulumi.StringMap) (*ec2.InternetGateway, error) {
    igw, err := ec2.NewInternetGateway(ctx, "main-igw", &ec2.InternetGatewayArgs{
        VpcId: vpc.ID(),
        Tags:  tags,
    })
    if err != nil {
        return nil, err
    }

    return igw, nil
}

// createSubnets creates two subnets in different availability zones
func createSubnets(ctx *pulumi.Context, vpc *ec2.Vpc, tags pulumi.StringMap) (*ec2.Subnet, *ec2.Subnet, error) {
    subnetA, err := ec2.NewSubnet(ctx, "subnet-a", &ec2.SubnetArgs{
        VpcId:                   vpc.ID(),
        CidrBlock:              pulumi.String("10.0.1.0/24"),
        AvailabilityZone:       pulumi.String("us-east-1a"),
        MapPublicIpOnLaunch:    pulumi.Bool(true),
        Tags: tags,
    })
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create subnet A: %w", err)
    }

    subnetB, err := ec2.NewSubnet(ctx, "subnet-b", &ec2.SubnetArgs{
        VpcId:                   vpc.ID(),
        CidrBlock:              pulumi.String("10.0.2.0/24"),
        AvailabilityZone:       pulumi.String("us-east-1b"),
        MapPublicIpOnLaunch:    pulumi.Bool(true),
        Tags: tags,
    })
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create subnet B: %w", err)
    }

    return subnetA, subnetB, nil
}

// createRouteTable creates a route table and associates it with subnets
func createRouteTable(ctx *pulumi.Context, vpc *ec2.Vpc, igw *ec2.InternetGateway, subnetA, subnetB *ec2.Subnet, tags pulumi.StringMap) error {
    // Create route table
    routeTable, err := ec2.NewRouteTable(ctx, "main-route-table", &ec2.RouteTableArgs{
        VpcId: vpc.ID(),
        Tags:  tags,
    })
    if err != nil {
        return fmt.Errorf("failed to create route table: %w", err)
    }

    // Create route to Internet Gateway
    _, err = ec2.NewRoute(ctx, "internet-route", &ec2.RouteArgs{
        RouteTableId:         routeTable.ID(),
        DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
        GatewayId:           igw.ID(),
    })
    if err != nil {
        return fmt.Errorf("failed to create internet route: %w", err)
    }

    // Associate route table with subnet A
    _, err = ec2.NewRouteTableAssociation(ctx, "subnet-a-route-association", &ec2.RouteTableAssociationArgs{
        SubnetId:     subnetA.ID(),
        RouteTableId: routeTable.ID(),
    })
    if err != nil {
        return fmt.Errorf("failed to associate route table with subnet A: %w", err)
    }

    // Associate route table with subnet B
    _, err = ec2.NewRouteTableAssociation(ctx, "subnet-b-route-association", &ec2.RouteTableAssociationArgs{
        SubnetId:     subnetB.ID(),
        RouteTableId: routeTable.ID(),
    })
    if err != nil {
        return fmt.Errorf("failed to associate route table with subnet B: %w", err)
    }

    return nil
}

// createSecurityGroup creates a security group with SSH access from specific IP range
func createSecurityGroup(ctx *pulumi.Context, vpc *ec2.Vpc, tags pulumi.StringMap) (*ec2.SecurityGroup, error) {
    securityGroup, err := ec2.NewSecurityGroup(ctx, "web-security-group", &ec2.SecurityGroupArgs{
        VpcId:       vpc.ID(),
        Description: pulumi.String("Security group for EC2 instance with SSH access"),

        Ingress: ec2.SecurityGroupIngressArray{
            &ec2.SecurityGroupIngressArgs{
                Protocol:   pulumi.String("tcp"),
                FromPort:   pulumi.Int(22),
                ToPort:     pulumi.Int(22),
                CidrBlocks: pulumi.StringArray{pulumi.String("203.0.113.0/24")},
            },
        },

        Egress: ec2.SecurityGroupEgressArray{
            &ec2.SecurityGroupEgressArgs{
                Protocol:   pulumi.String("-1"),
                FromPort:   pulumi.Int(0),
                ToPort:     pulumi.Int(0),
                CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
            },
        },

        Tags: tags,
    })
    if err != nil {
        return nil, err
    }

    return securityGroup, nil
}

// createIAMResources creates IAM role and instance profile for EC2
func createIAMResources(ctx *pulumi.Context, tags pulumi.StringMap) (*iam.Role, *iam.InstanceProfile, error) {
    // Create IAM role
    role, err := iam.NewRole(ctx, "ec2-s3-role", &iam.RoleArgs{
        AssumeRolePolicy: pulumi.String(`{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }
            ]
        }`),
        Tags: tags,
    })
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create IAM role: %w", err)
    }

    // Create instance profile
    instanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-instance-profile", &iam.InstanceProfileArgs{
        Role: role.Name,
        Tags: tags,
    })
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create instance profile: %w", err)
    }

    return role, instanceProfile, nil
}

// createS3Bucket creates an S3 bucket with versioning and encryption
func createS3Bucket(ctx *pulumi.Context, role *iam.Role, tags pulumi.StringMap) (*s3.BucketV2, error) {
    // Generate a unique bucket name
    bucketName := "prod-infrastructure-bucket-" + ctx.Stack()

    // Create S3 bucket
    bucket, err := s3.NewBucketV2(ctx, "main-bucket", &s3.BucketV2Args{
        Bucket: pulumi.String(bucketName),
        Tags:   tags,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create S3 bucket: %w", err)
    }

    // Enable versioning
    _, err = s3.NewBucketVersioningV2(ctx, "bucket-versioning", &s3.BucketVersioningV2Args{
        Bucket: bucket.ID(),
        VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
            Status: pulumi.String("Enabled"),
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to enable bucket versioning: %w", err)
    }

    // Enable server-side encryption
    _, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
        Bucket: bucket.ID(),
        Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
            &s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
                ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
                    SseAlgorithm: pulumi.String("AES256"),
                },
            },
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to enable bucket encryption: %w", err)
    }

    // Create IAM policy for S3 read access
    policyDocument := bucket.ID().ApplyT(func(bucketID string) string {
        return fmt.Sprintf(`{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "arn:aws:s3:::%s",
                        "arn:aws:s3:::%s/*"
                    ]
                }
            ]
        }`, bucketID, bucketID)
    }).(pulumi.StringOutput)

    policy, err := iam.NewPolicy(ctx, "s3-read-policy", &iam.PolicyArgs{
        Policy: policyDocument,
        Tags:   tags,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create S3 policy: %w", err)
    }

    // Attach policy to role
    _, err = iam.NewRolePolicyAttachment(ctx, "s3-policy-attachment", &iam.RolePolicyAttachmentArgs{
        Role:      role.Name,
        PolicyArn: policy.Arn,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to attach policy to role: %w", err)
    }

    return bucket, nil
}

// getLatestAmazonLinux2AMI retrieves the latest Amazon Linux 2 AMI
func getLatestAmazonLinux2AMI(ctx *pulumi.Context) (*ec2.LookupAmiResult, error) {
    ami, err := ec2.LookupAmi(ctx, &ec2.LookupAmiArgs{
        MostRecent: pulumi.BoolRef(true),
        Owners:     []string{"amazon"},
        Filters: []ec2.GetAmiFilter{
            {
                Name:   "name",
                Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
            },
            {
                Name:   "virtualization-type",
                Values: []string{"hvm"},
            },
        },
    })
    if err != nil {
        return nil, err
    }

    return ami, nil
}

// createEC2Instance creates an EC2 instance with the specified configuration
func createEC2Instance(ctx *pulumi.Context, subnet *ec2.Subnet, securityGroup *ec2.SecurityGroup, instanceProfile *iam.InstanceProfile, ami *ec2.LookupAmiResult, tags pulumi.StringMap) (*ec2.Instance, error) {
    instance, err := ec2.NewInstance(ctx, "web-server", &ec2.InstanceArgs{
        InstanceType:        pulumi.String("t3.medium"),
        Ami:                pulumi.String(ami.Id),
        SubnetId:           subnet.ID(),
        VpcSecurityGroupIds: pulumi.StringArray{securityGroup.ID()},
        IamInstanceProfile: instanceProfile.Name,

        Tags: tags,
    })
    if err != nil {
        return nil, err
    }

    return instance, nil
}

// exportOutputs exports all required output values
func exportOutputs(ctx *pulumi.Context, vpc *ec2.Vpc, subnetA, subnetB *ec2.Subnet, instance *ec2.Instance, bucket *s3.BucketV2, securityGroup *ec2.SecurityGroup, role *iam.Role) error {
    ctx.Export("vpcId", vpc.ID())
    ctx.Export("subnetAId", subnetA.ID())
    ctx.Export("subnetBId", subnetB.ID())
    ctx.Export("instanceId", instance.ID())
    ctx.Export("instancePublicIp", instance.PublicIp)
    ctx.Export("bucketName", bucket.ID())
    ctx.Export("securityGroupId", securityGroup.ID())
    ctx.Export("iamRoleArn", role.Arn)

    return nil
}
```

### `Pulumi.yaml`

```yaml
name: aws-infrastructure
runtime: go
description: AWS Infrastructure Setup with Pulumi Go

config:
  aws:region: us-east-1
```

## Key Features Explained

### 1. **Resource Dependencies**

The code implements proper dependency management through Pulumi's resource dependency system:

- VPC is created first
- Subnets depend on VPC
- Security groups depend on VPC
- EC2 instance depends on subnets, security groups, and IAM instance profile

### 2. **Security Best Practices**

- **Least Privilege IAM**: EC2 role only has S3 read permissions for the specific bucket
- **Network Security**: Security group only allows SSH from the specified IP range (203.0.113.0/24)
- **Encryption**: S3 bucket has server-side encryption enabled

### 3. **Error Handling**

Each function returns proper Go errors that are handled at the main level, providing clear error messages for debugging.

### 4. **Resource Tagging**

All resources are consistently tagged with `Environment: Production` using a common tags map.

### 5. **Internet Connectivity**

- Internet Gateway provides internet access
- Route table routes traffic to IGW
- Subnets are configured to assign public IPs

## Deployment Instructions

1. **Initialize the project**:

   ```bash
   mkdir aws-infrastructure && cd aws-infrastructure
   pulumi new aws-go --force
   ```

2. **Replace the generated files** with the code above

3. **Install dependencies**:

   ```bash
   go mod tidy
   ```

4. **Configure AWS credentials**:

   ```bash
   aws configure
   # or set environment variables
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

5. **Deploy the infrastructure**:
   ```bash
   pulumi up
   ```

## Expected Outputs

After deployment, you'll see outputs like:

```
Outputs:
    bucketName      : "prod-infrastructure-bucket-dev"
    iamRoleArn      : "arn:aws:iam::123456789012:role/ec2-s3-role-a1b2c3d"
    instanceId      : "i-0123456789abcdef0"
    instancePublicIp: "54.123.45.67"
    securityGroupId : "sg-0123456789abcdef0"
    subnetAId       : "subnet-0123456789abcdef0"
    subnetBId       : "subnet-0fedcba987654321"
    vpcId           : "vpc-0123456789abcdef0"
```

This implementation follows all the specified requirements and Go best practices, providing a production-ready AWS infrastructure setup.
