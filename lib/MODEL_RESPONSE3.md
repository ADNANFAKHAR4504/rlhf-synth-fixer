The error is occurring because we're trying to access array elements directly when the values are not known at compile time. Let me fix this by using the proper CDKTF functions.

Here's the corrected single-file solution:

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
	AvailabilityZones  []string // Pre-defined AZs to avoid runtime token issues

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
		AvailabilityZones:  []string{"us-east-1a", "us-east-1b"}, // Fixed AZs

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
		AvailabilityZones:  []string{"us-east-2a", "us-east-2b"}, // Fixed AZs

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
		AvailabilityZones:  []string{"us-west-1a", "us-west-1c"}, // Fixed AZs

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
		if i >= len(cfg.AvailabilityZones) {
			log.Printf("Warning: Not enough availability zones defined for subnet %d", i)
			continue
		}

		publicSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:               mainVPC.Id(),
			CidrBlock:           jsii.String(cidr),
			AvailabilityZone:    jsii.String(cfg.AvailabilityZones[i]), // Use predefined AZ
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
		if i >= len(cfg.AvailabilityZones) {
			log.Printf("Warning: Not enough availability zones defined for private subnet %d", i)
			continue
		}

		privateSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            mainVPC.Id(),
			CidrBlock:        jsii.String(cidr),
			AvailabilityZone: jsii.String(cfg.AvailabilityZones[i]), // Use predefined AZ
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

		// Make sure we have a corresponding NAT gateway
		if i < len(natGateways) {
			// Add route to NAT gateway
			route.NewRoute(stack, jsii.String(fmt.Sprintf("private-route-%d", i)), &route.RouteConfig{
				RouteTableId:         privateRT.Id(),
				DestinationCidrBlock: jsii.String("0.0.0.0/0"),
				NatGatewayId:         natGateways[i].Id(),
			})
		}

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

	// Enable server-side encryption
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

	// Create outputs for subnet IDs using cdktf.Fn.Join to handle the list properly
	var publicSubnetIds []*string
	for _, subnet := range vpcResources.PublicSubnets {
		publicSubnetIds = append(publicSubnetIds, subnet.Id())
	}

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Join(jsii.String(","), &publicSubnetIds),
		Description: jsii.String("Public subnet IDs (comma-separated)"),
	})

	var privateSubnetIds []*string
	for _, subnet := range vpcResources.PrivateSubnets {
		privateSubnetIds = append(privateSubnetIds, subnet.Id())
	}

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Join(jsii.String(","), &privateSubnetIds),
		Description: jsii.String("Private subnet IDs (comma-separated)"),
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

## Key Changes Made to Fix the Token Error:

1. **Removed Dynamic AZ Lookup**: Instead of using `dataawsavailabilityzones` and trying to access array elements at runtime, I've predefined the availability zones in the configuration for each environment.

2. **Fixed Array Access**: Replaced any dynamic array access with predefined values in the configuration.

3. **Improved Output Handling**: Used `cdktf.Fn_Join()` to properly handle arrays of subnet IDs in outputs instead of trying to return arrays directly.

4. **Added Safety Checks**: Added bounds checking when iterating through subnets and availability zones.

## Updated go.mod:

```go
module aws-infrastructure

go 1.21

require (
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.113.0
    github.com/hashicorp/terraform-cdk-go/cdktf v0.20.1
    github.com/cdktf/cdktf-provider-aws-go/aws/v19 v19.0.7
)
```

## Usage:

1. **Make sure your bucket names are globally unique** - update the `12345` suffix in the configuration functions.

2. **Update the availability zones** if needed for your specific regions.

3. **Deploy:**
```bash
# Initialize
go mod tidy
cdktf get

# Deploy to dev
ENVIRONMENT=dev cdktf deploy --auto-approve

# Deploy to other environments
ENVIRONMENT=staging cdktf deploy --auto-approve
ENVIRONMENT=prod cdktf deploy --auto-approve
```

This should now deploy without the token error. The key was avoiding any runtime array access and using predefined values in the configuration instead.