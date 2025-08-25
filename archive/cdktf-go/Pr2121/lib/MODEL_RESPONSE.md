I'll help you build a well-structured CDKTF Go project that handles multiple environments cleanly. Let me show you a complete, production-ready solution.

## Project Structure

Here's the recommended project structure:

```
aws-infrastructure/
├── cmd/
│   └── main.go                 # Main application entry point
├── internal/
│   ├── config/
│   │   ├── config.go          # Configuration management
│   │   └── environments.go    # Environment-specific configs
│   ├── components/
│   │   ├── networking/
│   │   │   └── vpc.go         # VPC component
│   │   ├── iam/
│   │   │   └── roles.go       # IAM component
│   │   └── storage/
│   │       └── s3.go          # S3 component
│   └── stacks/
│       └── infrastructure.go   # Main infrastructure stack
├── deployments/
│   ├── dev/
│   │   └── cdktf.json
│   ├── staging/
│   │   └── cdktf.json
│   └── prod/
│       └── cdktf.json
├── scripts/
│   ├── deploy.sh
│   └── destroy.sh
├── go.mod
├── go.sum
└── README.md
```

## Core Implementation

### 1. Configuration Management

**internal/config/config.go**
```go
package config

import (
	"fmt"
	"os"
)

// EnvironmentConfig holds all environment-specific configuration
type EnvironmentConfig struct {
	Environment string
	Region      string
	AccountID   string
	
	// Networking
	VPCCidr           string
	PublicSubnetCidrs []string
	PrivateSubnetCidrs []string
	
	// S3
	LoggingBucket     string
	ReplicationBucket string
	
	// IAM
	RolePrefix string
	
	// Tags
	CommonTags map[string]string
}

// GetConfig returns the configuration for the specified environment
func GetConfig(env string) (*EnvironmentConfig, error) {
	configs := map[string]*EnvironmentConfig{
		"dev":     getDevConfig(),
		"staging": getStagingConfig(),
		"prod":    getProdConfig(),
	}
	
	config, exists := configs[env]
	if !exists {
		return nil, fmt.Errorf("unknown environment: %s", env)
	}
	
	return config, nil
}

// GetEnvironmentFromEnvVar gets the environment from environment variable
func GetEnvironmentFromEnvVar() string {
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		return "dev" // default to dev
	}
	return env
}
```

**internal/config/environments.go**
```go
package config

func getDevConfig() *EnvironmentConfig {
	return &EnvironmentConfig{
		Environment: "dev",
		Region:      "us-east-1",
		AccountID:   "123456789012", // Replace with your dev account ID
		
		VPCCidr:            "10.0.0.0/16",
		PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24"},
		PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24"},
		
		LoggingBucket:     "my-company-logs-dev",
		ReplicationBucket: "my-company-logs-dev-replica",
		
		RolePrefix: "dev",
		
		CommonTags: map[string]string{
			"Environment": "dev",
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
		},
	}
}

func getStagingConfig() *EnvironmentConfig {
	return &EnvironmentConfig{
		Environment: "staging",
		Region:      "us-east-2",
		AccountID:   "123456789013", // Replace with your staging account ID
		
		VPCCidr:            "10.1.0.0/16",
		PublicSubnetCidrs:  []string{"10.1.1.0/24", "10.1.2.0/24"},
		PrivateSubnetCidrs: []string{"10.1.10.0/24", "10.1.20.0/24"},
		
		LoggingBucket:     "my-company-logs-staging",
		ReplicationBucket: "my-company-logs-staging-replica",
		
		RolePrefix: "staging",
		
		CommonTags: map[string]string{
			"Environment": "staging",
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
		},
	}
}

func getProdConfig() *EnvironmentConfig {
	return &EnvironmentConfig{
		Environment: "prod",
		Region:      "us-west-1",
		AccountID:   "123456789014", // Replace with your prod account ID
		
		VPCCidr:            "10.2.0.0/16",
		PublicSubnetCidrs:  []string{"10.2.1.0/24", "10.2.2.0/24"},
		PrivateSubnetCidrs: []string{"10.2.10.0/24", "10.2.20.0/24"},
		
		LoggingBucket:     "my-company-logs-prod",
		ReplicationBucket: "my-company-logs-prod-replica",
		
		RolePrefix: "prod",
		
		CommonTags: map[string]string{
			"Environment": "prod",
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
		},
	}
}
```

### 2. Reusable Components

**internal/components/networking/vpc.go**
```go
package networking

import (
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"

	"your-module/internal/config"
)

// VPCComponent represents a complete VPC setup
type VPCComponent struct {
	VPC             vpc.Vpc
	PublicSubnets   []subnet.Subnet
	PrivateSubnets  []subnet.Subnet
	InternetGateway internetgateway.InternetGateway
	NATGateways     []natgateway.NatGateway
}

// NewVPCComponent creates a new VPC with public and private subnets
func NewVPCComponent(scope constructs.Construct, id string, cfg *config.EnvironmentConfig) *VPCComponent {
	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(scope, jsii.String("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create VPC
	mainVPC := vpc.NewVpc(scope, jsii.String(fmt.Sprintf("%s-vpc", id)), &vpc.VpcConfig{
		CidrBlock:          jsii.String(cfg.VPCCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-vpc", cfg.Environment)),
		},
	})

	// Apply common tags
	for key, value := range cfg.CommonTags {
		cdktf.Tags_Of(mainVPC).Add(jsii.String(key), jsii.String(value))
	}

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(scope, jsii.String(fmt.Sprintf("%s-igw", id)), &internetgateway.InternetGatewayConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-igw", cfg.Environment)),
		},
	})

	// Create public subnets
	var publicSubnets []subnet.Subnet
	var natGateways []natgateway.NatGateway

	for i, cidr := range cfg.PublicSubnetCidrs {
		publicSubnet := subnet.NewSubnet(scope, jsii.String(fmt.Sprintf("%s-public-subnet-%d", id, i)), &subnet.SubnetConfig{
			VpcId:                   mainVPC.Id(),
			CidrBlock:              jsii.String(cidr),
			AvailabilityZone:       jsii.String(*azs.Names().Get(jsii.Number(i))),
			MapPublicIpOnLaunch:    jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-public-subnet-%d", cfg.Environment, i)),
				"Type": jsii.String("public"),
			},
		})
		publicSubnets = append(publicSubnets, publicSubnet)

		// Create EIP for NAT Gateway
		natEIP := eip.NewEip(scope, jsii.String(fmt.Sprintf("%s-nat-eip-%d", id, i)), &eip.EipConfig{
			Domain: jsii.String("vpc"),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-nat-eip-%d", cfg.Environment, i)),
			},
		})

		// Create NAT Gateway
		natGW := natgateway.NewNatGateway(scope, jsii.String(fmt.Sprintf("%s-nat-gw-%d", id, i)), &natgateway.NatGatewayConfig{
			AllocationId: natEIP.Id(),
			SubnetId:     publicSubnet.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-nat-gw-%d", cfg.Environment, i)),
			},
		})
		natGateways = append(natGateways, natGW)
	}

	// Create public route table
	publicRT := routetable.NewRouteTable(scope, jsii.String(fmt.Sprintf("%s-public-rt", id)), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-public-rt", cfg.Environment)),
		},
	})

	// Add route to internet gateway
	route.NewRoute(scope, jsii.String(fmt.Sprintf("%s-public-route", id)), &route.RouteConfig{
		RouteTableId:         publicRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, subnet := range publicSubnets {
		routetableassociation.NewRouteTableAssociation(scope, jsii.String(fmt.Sprintf("%s-public-rta-%d", id, i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRT.Id(),
		})
	}

	// Create private subnets
	var privateSubnets []subnet.Subnet
	for i, cidr := range cfg.PrivateSubnetCidrs {
		privateSubnet := subnet.NewSubnet(scope, jsii.String(fmt.Sprintf("%s-private-subnet-%d", id, i)), &subnet.SubnetConfig{
			VpcId:            mainVPC.Id(),
			CidrBlock:        jsii.String(cidr),
			AvailabilityZone: jsii.String(*azs.Names().Get(jsii.Number(i))),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-private-subnet-%d", cfg.Environment, i)),
				"Type": jsii.String("private"),
			},
		})
		privateSubnets = append(privateSubnets, privateSubnet)

		// Create private route table for this subnet
		privateRT := routetable.NewRouteTable(scope, jsii.String(fmt.Sprintf("%s-private-rt-%d", id, i)), &routetable.RouteTableConfig{
			VpcId: mainVPC.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-private-rt-%d", cfg.Environment, i)),
			},
		})

		// Add route to NAT gateway
		route.NewRoute(scope, jsii.String(fmt.Sprintf("%s-private-route-%d", id, i)), &route.RouteConfig{
			RouteTableId:         privateRT.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGateways[i].Id(),
		})

		// Associate private subnet with private route table
		routetableassociation.NewRouteTableAssociation(scope, jsii.String(fmt.Sprintf("%s-private-rta-%d", id, i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     privateSubnet.Id(),
			RouteTableId: privateRT.Id(),
		})
	}

	return &VPCComponent{
		VPC:             mainVPC,
		PublicSubnets:   publicSubnets,
		PrivateSubnets:  privateSubnets,
		InternetGateway: igw,
		NATGateways:     natGateways,
	}
}
```

**internal/components/iam/roles.go**
```go
package iam

import (
	"encoding/json"
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"

	"your-module/internal/config"
)

// IAMComponent represents IAM roles and policies
type IAMComponent struct {
	EC2Role    iamrole.IamRole
	LambdaRole iamrole.IamRole
}

// NewIAMComponent creates common IAM roles
func NewIAMComponent(scope constructs.Construct, id string, cfg *config.EnvironmentConfig) *IAMComponent {
	// EC2 assume role policy
	ec2AssumeRolePolicy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": map[string]interface{}{
					"Service": "ec2.amazonaws.com",
				},
			},
		},
	}

	ec2PolicyJSON, _ := json.Marshal(ec2AssumeRolePolicy)

	// Create EC2 role
	ec2Role := iamrole.NewIamRole(scope, jsii.String(fmt.Sprintf("%s-ec2-role", id)), &iamrole.IamRoleConfig{
		Name:             jsii.String(fmt.Sprintf("%s-ec2-role", cfg.RolePrefix)),
		AssumeRolePolicy: jsii.String(string(ec2PolicyJSON)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-ec2-role", cfg.Environment)),
		},
	})

	// Apply common tags
	for key, value := range cfg.CommonTags {
		cdktf.Tags_Of(ec2Role).Add(jsii.String(key), jsii.String(value))
	}

	// Attach basic EC2 policies
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String(fmt.Sprintf("%s-ec2-ssm-policy", id)), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
	})

	// Lambda assume role policy
	lambdaAssumeRolePolicy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": map[string]interface{}{
					"Service": "lambda.amazonaws.com",
				},
			},
		},
	}

	lambdaPolicyJSON, _ := json.Marshal(lambdaAssumeRolePolicy)

	// Create Lambda role
	lambdaRole := iamrole.NewIamRole(scope, jsii.String(fmt.Sprintf("%s-lambda-role", id)), &iamrole.IamRoleConfig{
		Name:             jsii.String(fmt.Sprintf("%s-lambda-role", cfg.RolePrefix)),
		AssumeRolePolicy: jsii.String(string(lambdaPolicyJSON)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-lambda-role", cfg.Environment)),
		},
	})

	// Apply common tags to Lambda role
	for key, value := range cfg.CommonTags {
		cdktf.Tags_Of(lambdaRole).Add(jsii.String(key), jsii.String(value))
	}

	// Attach basic Lambda execution policy
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String(fmt.Sprintf("%s-lambda-basic-policy", id)), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	return &IAMComponent{
		EC2Role:    ec2Role,
		LambdaRole: lambdaRole,
	}
}
```

**internal/components/storage/s3.go**
```go
package storage

import (
	"encoding/json"
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketreplication"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"

	"your-module/internal/config"
)

// S3Component represents S3 buckets for logging
type S3Component struct {
	LoggingBucket     s3bucket.S3Bucket
	ReplicationBucket s3bucket.S3Bucket
}

// NewS3Component creates S3 buckets with proper configuration
func NewS3Component(scope constructs.Construct, id string, cfg *config.EnvironmentConfig) *S3Component {
	// Create main logging bucket
	loggingBucket := s3bucket.NewS3Bucket(scope, jsii.String(fmt.Sprintf("%s-logging-bucket", id)), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(cfg.LoggingBucket),
		Tags: &map[string]*string{
			"Name":    jsii.String(cfg.LoggingBucket),
			"Purpose": jsii.String("logging"),
		},
	})

	// Apply common tags
	for key, value := range cfg.CommonTags {
		cdktf.Tags_Of(loggingBucket).Add(jsii.String(key), jsii.String(value))
	}

	// Enable versioning
	s3bucketversioning.NewS3BucketVersioning(scope, jsii.String(fmt.Sprintf("%s-logging-versioning", id)), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: loggingBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable encryption
	s3bucketencryption.NewS3BucketEncryption(scope, jsii.String(fmt.Sprintf("%s-logging-encryption", id)), &s3bucketencryption.S3BucketEncryptionConfig{
		Bucket: loggingBucket.Id(),
		ServerSideEncryptionConfiguration: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfiguration{
			Rule: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRule{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
			},
		},
	})

	// Block public access
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(scope, jsii.String(fmt.Sprintf("%s-logging-pab", id)), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                loggingBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Create replication bucket
	replicationBucket := s3bucket.NewS3Bucket(scope, jsii.String(fmt.Sprintf("%s-replication-bucket", id)), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(cfg.ReplicationBucket),
		Tags: &map[string]*string{
			"Name":    jsii.String(cfg.ReplicationBucket),
			"Purpose": jsii.String("replication"),
		},
	})

	// Apply common tags to replication bucket
	for key, value := range cfg.CommonTags {
		cdktf.Tags_Of(replicationBucket).Add(jsii.String(key), jsii.String(value))
	}

	// Configure replication bucket similarly
	s3bucketversioning.NewS3BucketVersioning(scope, jsii.String(fmt.Sprintf("%s-replication-versioning", id)), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: replicationBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	s3bucketencryption.NewS3BucketEncryption(scope, jsii.String(fmt.Sprintf("%s-replication-encryption", id)), &s3bucketencryption.S3BucketEncryptionConfig{
		Bucket: replicationBucket.Id(),
		ServerSideEncryptionConfiguration: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfiguration{
			Rule: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRule{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
			},
		},
	})

	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(scope, jsii.String(fmt.Sprintf("%s-replication-pab", id)), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                replicationBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Add bucket policy for cross-account access (if needed)
	bucketPolicy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Sid":    "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action":    "s3:*",
				"Resource": []string{
					fmt.Sprintf("arn:aws:s3:::%s", cfg.LoggingBucket),
					fmt.Sprintf("arn:aws:s3:::%s/*", cfg.LoggingBucket),
				},
				"Condition": map[string]interface{}{
					"Bool": map[string]interface{}{
						"aws:SecureTransport": "false",
					},
				},
			},
		},
	}

	policyJSON, _ := json.Marshal(bucketPolicy)

	s3bucketpolicy.NewS3BucketPolicy(scope, jsii.String(fmt.Sprintf("%s-logging-policy", id)), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: loggingBucket.Id(),
		Policy: jsii.String(string(policyJSON)),
	})

	return &S3Component{
		LoggingBucket:     loggingBucket,
		ReplicationBucket: replicationBucket,
	}
}
```

### 3. Main Infrastructure Stack

**internal/stacks/infrastructure.go**
```go
package stacks

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	"your-module/internal/components/iam"
	"your-module/internal/components/networking"
	"your-module/internal/components/storage"
	"your-module/internal/config"
)

// InfrastructureStack represents the main infrastructure stack
type InfrastructureStack struct {
	cdktf.TerraformStack
	Config     *config.EnvironmentConfig
	VPC        *networking.VPCComponent
	IAM        *iam.IAMComponent
	Storage    *storage.S3Component
}

// NewInfrastructureStack creates a new infrastructure stack
func NewInfrastructureStack(scope constructs.Construct, id string, cfg *config.EnvironmentConfig) *InfrastructureStack {
	stack := cdktf.NewTerraformStack(scope, jsii.String(id))

	// Create VPC component
	vpcComponent := networking.NewVPCComponent(stack, "networking", cfg)

	// Create IAM component
	iamComponent := iam.NewIAMComponent(stack, "iam", cfg)

	// Create S3 component
	s3Component := storage.NewS3Component(stack, "storage", cfg)

	// Add outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcComponent.VPC.Id(),
		Description: jsii.String("VPC ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcComponent.PublicSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: jsii.String("Public subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcComponent.PrivateSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: jsii.String("Private subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("logging_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Component.LoggingBucket.Id(),
		Description: jsii.String("Logging bucket name"),
	})

	return &InfrastructureStack{
		TerraformStack: stack,
		Config:         cfg,
		VPC:            vpcComponent,
		IAM:            iamComponent,
		Storage:        s3Component,
	}
}
```

### 4. Main Application

**cmd/main.go**
```go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"

	"your-module/internal/config"
	"your-module/internal/stacks"
)

func main() {
	// Get environment from environment variable or command line
	environment := config.GetEnvironmentFromEnvVar()
	if len(os.Args) > 1 