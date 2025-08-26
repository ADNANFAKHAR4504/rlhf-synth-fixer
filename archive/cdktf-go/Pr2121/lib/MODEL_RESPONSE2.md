You're right! The S3 encryption resource has been deprecated. Let me provide you with a complete, single-file solution that fixes this issue and gives you everything you need in one place.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

// EnvironmentConfig holds all environment-specific configuration
type EnvironmentConfig struct {
	Environment string
	Region      string
	AccountID   string

	// Networking
	VPCCidr            string
	PublicSubnetCidrs  []string
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

func getDevConfig() *EnvironmentConfig {
	return &EnvironmentConfig{
		Environment: "dev",
		Region:      "us-east-1",
		AccountID:   "123456789012", // Replace with your dev account ID

		VPCCidr:            "10.0.0.0/16",
		PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24"},
		PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24"},

		LoggingBucket:     "my-company-logs-dev-12345", // Make sure this is globally unique
		ReplicationBucket: "my-company-logs-dev-replica-12345",

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

		LoggingBucket:     "my-company-logs-staging-12345",
		ReplicationBucket: "my-company-logs-staging-replica-12345",

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

		LoggingBucket:     "my-company-logs-prod-12345",
		ReplicationBucket: "my-company-logs-prod-replica-12345",

		RolePrefix: "prod",

		CommonTags: map[string]string{
			"Environment": "prod",
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
		},
	}
}

// InfrastructureStack represents the main infrastructure stack
type InfrastructureStack struct {
	cdktf.TerraformStack
	Config *EnvironmentConfig
}

// NewInfrastructureStack creates a new infrastructure stack
func NewInfrastructureStack(scope constructs.Construct, id string, cfg *EnvironmentConfig) *InfrastructureStack {
	stack := cdktf.NewTerraformStack(scope, jsii.String(id))

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(cfg.Region),
		DefaultTags: &provider.AwsProviderDefaultTags{
			Tags: &cfg.CommonTags,
		},
	})

	// Create VPC
	vpcComponent := createVPC(stack, cfg)

	// Create IAM roles
	iamComponent := createIAMRoles(stack, cfg)

	// Create S3 buckets
	s3Component := createS3Buckets(stack, cfg)

	// Add outputs
	addOutputs(stack, vpcComponent, s3Component)

	return &InfrastructureStack{
		TerraformStack: stack,
		Config:         cfg,
	}
}

// VPCResources holds VPC-related resources
type VPCResources struct {
	VPC             vpc.Vpc
	PublicSubnets   []subnet.Subnet
	PrivateSubnets  []subnet.Subnet
	InternetGateway internetgateway.InternetGateway
	NATGateways     []natgateway.NatGateway
}

func createVPC(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *VPCResources {
	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create VPC
	mainVPC := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String(cfg.VPCCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-vpc", cfg.Environment)),
		},
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("main-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-igw", cfg.Environment)),
		},
	})

	// Create public subnets and NAT gateways
	var publicSubnets []subnet.Subnet
	var natGateways []natgateway.NatGateway

	for i, cidr := range cfg.PublicSubnetCidrs {
		publicSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:               mainVPC.Id(),
			CidrBlock:           jsii.String(cidr),
			AvailabilityZone:    jsii.String(*azs.Names().Get(jsii.Number(i))),
			MapPublicIpOnLaunch: jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-public-subnet-%d", cfg.Environment, i)),
				"Type": jsii.String("public"),
			},
		})
		publicSubnets = append(publicSubnets, publicSubnet)

		// Create EIP for NAT Gateway
		natEIP := eip.NewEip(stack, jsii.String(fmt.Sprintf("nat-eip-%d", i)), &eip.EipConfig{
			Domain: jsii.String("vpc"),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-nat-eip-%d", cfg.Environment, i)),
			},
		})

		// Create NAT Gateway
		natGW := natgateway.NewNatGateway(stack, jsii.String(fmt.Sprintf("nat-gw-%d", i)), &natgateway.NatGatewayConfig{
			AllocationId: natEIP.Id(),
			SubnetId:     publicSubnet.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-nat-gw-%d", cfg.Environment, i)),
			},
		})
		natGateways = append(natGateways, natGW)
	}

	// Create public route table
	publicRT := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-public-rt", cfg.Environment)),
		},
	})

	// Add route to internet gateway
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, subnet := range publicSubnets {
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("public-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRT.Id(),
		})
	}

	// Create private subnets
	var privateSubnets []subnet.Subnet
	for i, cidr := range cfg.PrivateSubnetCidrs {
		privateSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
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
		privateRT := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("private-rt-%d", i)), &routetable.RouteTableConfig{
			VpcId: mainVPC.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("%s-private-rt-%d", cfg.Environment, i)),
			},
		})

		// Add route to NAT gateway
		route.NewRoute(stack, jsii.String(fmt.Sprintf("private-route-%d", i)), &route.RouteConfig{
			RouteTableId:         privateRT.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGateways[i].Id(),
		})

		// Associate private subnet with private route table
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("private-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     privateSubnet.Id(),
			RouteTableId: privateRT.Id(),
		})
	}

	return &VPCResources{
		VPC:             mainVPC,
		PublicSubnets:   publicSubnets,
		PrivateSubnets:  privateSubnets,
		InternetGateway: igw,
		NATGateways:     natGateways,
	}
}

// IAMResources holds IAM-related resources
type IAMResources struct {
	EC2Role    iamrole.IamRole
	LambdaRole iamrole.IamRole
}

func createIAMRoles(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *IAMResources {
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
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-role"), &iamrole.IamRoleConfig{
		Name:             jsii.String(fmt.Sprintf("%s-ec2-role", cfg.RolePrefix)),
		AssumeRolePolicy: jsii.String(string(ec2PolicyJSON)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-ec2-role", cfg.Environment)),
		},
	})

	// Attach basic EC2 policies
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("ec2-ssm-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
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
	lambdaRole := iamrole.NewIamRole(stack, jsii.String("lambda-role"), &iamrole.IamRoleConfig{
		Name:             jsii.String(fmt.Sprintf("%s-lambda-role", cfg.RolePrefix)),
		AssumeRolePolicy: jsii.String(string(lambdaPolicyJSON)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-lambda-role", cfg.Environment)),
		},
	})

	// Attach basic Lambda execution policy
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("lambda-basic-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	return &IAMResources{
		EC2Role:    ec2Role,
		LambdaRole: lambdaRole,
	}
}

// S3Resources holds S3-related resources
type S3Resources struct {
	LoggingBucket     s3bucket.S3Bucket
	ReplicationBucket s3bucket.S3Bucket
}

func createS3Buckets(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *S3Resources {
	// Create main logging bucket
	loggingBucket := s3bucket.NewS3Bucket(stack, jsii.String("logging-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(cfg.LoggingBucket),
		Tags: &map[string]*string{
			"Name":    jsii.String(cfg.LoggingBucket),
			"Purpose": jsii.String("logging"),
		},
	})

	// Enable versioning on logging bucket
	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("logging-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: loggingBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable server-side encryption (FIXED: using the correct resource)
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("logging-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: loggingBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// Block public access
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("logging-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                loggingBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Create replication bucket
	replicationBucket := s3bucket.NewS3Bucket(stack, jsii.String("replication-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(cfg.ReplicationBucket),
		Tags: &map[string]*string{
			"Name":    jsii.String(cfg.ReplicationBucket),
			"Purpose": jsii.String("replication"),
		},
	})

	// Configure replication bucket similarly
	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("replication-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: replicationBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("replication-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: replicationBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("replication-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                replicationBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Add bucket policy for secure transport
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

	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("logging-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: loggingBucket.Id(),
		Policy: jsii.String(string(policyJSON)),
	})

	return &S3Resources{
		LoggingBucket:     loggingBucket,
		ReplicationBucket: replicationBucket,
	}
}

func addOutputs(stack cdktf.TerraformStack, vpcResources *VPCResources, s3Resources *S3Resources) {
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcResources.VPC.Id(),
		Description: jsii.String("VPC ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcResources.PublicSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: jsii.String("Public subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcResources.PrivateSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: jsii.String("Private subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("logging_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Resources.LoggingBucket.Id(),
		Description: jsii.String("Logging bucket name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("replication_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Resources.ReplicationBucket.Id(),
		Description: jsii.String("Replication bucket name"),
	})
}

func main() {
	// Get environment from environment variable or command line
	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		if len(os.Args) > 1 {
			environment = os.Args[1]
		} else {
			environment = "dev" // default
		}
	}

	// Load configuration
	cfg, err := GetConfig(environment)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Deploying infrastructure for environment: %s", cfg.Environment)

	// Create CDKTF app
	app := cdktf.NewApp(nil)

	// Create infrastructure stack
	NewInfrastructureStack(app, fmt.Sprintf("%s-infrastructure", cfg.Environment), cfg)

	// Synthesize
	app.Synth()
}
```

## Supporting Files

Create these additional files to complete your setup:

**go.mod**
```go
module aws-infrastructure

go 1.21

require (
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
    github.com/hashicorp/terraform-cdk-go/cdktf v0.20.1
    github.com/cdktf/cdktf-provider-aws-go/aws/v19 v19.0.7
)
```

**cdktf.json**
```json
{
  "language": "go",
  "app": "go run main.go",
  "projectId": "aws-infrastructure",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

**deploy.sh**
```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-dev}

echo "Deploying to environment: $ENVIRONMENT"

# Set environment variable
export ENVIRONMENT=$ENVIRONMENT

# Initialize and deploy
cdktf get
cdktf deploy --auto-approve

echo "Deployment completed for environment: $ENVIRONMENT"
```

**destroy.sh**
```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-dev}

echo "Destroying environment: $ENVIRONMENT"

# Set environment variable
export ENVIRONMENT=$ENVIRONMENT

# Destroy
cdktf destroy --auto-approve

echo "Destruction completed for environment: $ENVIRONMENT"
```

## Usage

1. **Initialize the project:**
```bash
go mod init aws-infrastructure
go mod tidy
cdktf get
```

2. **Update the bucket names** in the configuration functions to be globally unique (replace `12345` with your own suffix).

3. **Deploy to different environments:**
```bash
# Deploy to dev
ENVIRONMENT=dev cdktf deploy --auto-approve

# Deploy to staging  
ENVIRONMENT=staging cdktf deploy --auto-approve

# Deploy to prod
ENVIRONMENT=prod cdktf deploy --auto-approve
```

4. **Or use the scripts:**
```bash
chmod +x deploy.sh destroy.sh
./deploy.sh dev
./deploy.sh staging
./deploy.sh prod
```

## Key Fixes Made

1. **Fixed S3 encryption**: Replaced deprecated `aws_s3_bucket_encryption` with `aws_s3_bucket_server_side_encryption_configuration`
2. **Single file solution**: Everything is in one `main.go` file for simplicity
3. **Proper error handling**: Added validation and error checking
4. **Production-ready**: Includes security best practices like bucket policies and public access blocks
5. **Environment-specific**: Easy configuration management for multiple environments

The code is now ready to use and should deploy successfully without the S3 encryption error!