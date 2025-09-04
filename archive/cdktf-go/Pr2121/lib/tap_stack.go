package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	// Force jsii subpackages into module graph for CI (since .gen is ignored by go mod tidy)
	_ "github.com/aws/constructs-go/constructs/v10/jsii"
	_ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"

	// Generated AWS provider bindings
	azs "github.com/TuringGpt/iac-test-automations/.gen/aws/dataawsavailabilityzones"
	eip "github.com/TuringGpt/iac-test-automations/.gen/aws/eip"
	iampolicy "github.com/TuringGpt/iac-test-automations/.gen/aws/iampolicy"
	iamrole "github.com/TuringGpt/iac-test-automations/.gen/aws/iamrole"
	iamrolepolicyattachment "github.com/TuringGpt/iac-test-automations/.gen/aws/iamrolepolicyattachment"
	igw "github.com/TuringGpt/iac-test-automations/.gen/aws/internetgateway"
	natgw "github.com/TuringGpt/iac-test-automations/.gen/aws/natgateway"
	awscdktf "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	route "github.com/TuringGpt/iac-test-automations/.gen/aws/route"
	routetable "github.com/TuringGpt/iac-test-automations/.gen/aws/routetable"
	routetableassoc "github.com/TuringGpt/iac-test-automations/.gen/aws/routetableassociation"
	s3bucket "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	s3bucketpolicy "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpolicy"
	s3bucketpab "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	s3bucketenc "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketserversideencryptionconfiguration"
	s3bucketver "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
	subnet "github.com/TuringGpt/iac-test-automations/.gen/aws/subnet"
	vpc "github.com/TuringGpt/iac-test-automations/.gen/aws/vpc"
)

// EnvironmentConfig holds all environment-specific configuration
type EnvironmentConfig struct {
	Environment  string
	Region       string
	AccountID    string
	Suffix       string // Environment suffix for resource naming
	RandomSuffix string // Random suffix to avoid naming conflicts
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

// VPCComponent represents a complete VPC setup
type VPCComponent struct {
	VPC             vpc.Vpc
	PublicSubnets   []subnet.Subnet
	PrivateSubnets  []subnet.Subnet
	InternetGateway igw.InternetGateway
	NATGateways     []natgw.NatGateway
}

// IAMComponent represents IAM roles and policies
type IAMComponent struct {
	EC2Role    iamrole.IamRole
	LambdaRole iamrole.IamRole
}

// S3Component represents S3 buckets for logging
type S3Component struct {
	LoggingBucket     s3bucket.S3Bucket
	ReplicationBucket s3bucket.S3Bucket
}

// InfrastructureStack represents the main infrastructure stack
type InfrastructureStack struct {
	cdktf.TerraformStack
	Config  *EnvironmentConfig
	VPC     *VPCComponent
	IAM     *IAMComponent
	Storage *S3Component
}

// BuildApp constructs the CDKTF app and stack with the multi-environment infrastructure
func BuildApp() cdktf.App {
	app := cdktf.NewApp(nil)
	stack := cdktf.NewTerraformStack(app, str("TapStack"))

	// Get environment from env var or default to dev
	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		environment = "dev"
	}

	// Get configuration for the environment
	cfg, err := GetConfig(environment)
	if err != nil {
		fmt.Printf("Error getting config: %v\n", err)
		os.Exit(1)
	}

	// Build infrastructure on this stack
	BuildInfrastructureStack(stack, cfg)

	return app
}

// Minimal CDKTF app entrypoint
func main() {
	app := BuildApp()
	app.Synth()
}

func str(v string) *string { return &v }

// generateRandomSuffix creates a random 6-character suffix for resource naming
func generateRandomSuffix() string {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to a simple timestamp-based suffix if random generation fails
		return fmt.Sprintf("%d", os.Getpid()%1000000)
	}
	return hex.EncodeToString(bytes)
}

// getEnvironmentSuffix returns the environment suffix from environment variables
func getEnvironmentSuffix(environment string) string {
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = environment
	}
	return suffix
}

// getAccountID returns the account ID from environment variable or uses placeholder
func getAccountID(environment string) string {
	accountID := os.Getenv("AWS_ACCOUNT_ID")
	if accountID == "" {
		// Use environment-specific placeholder if no account ID is provided
		switch environment {
		case "dev":
			return "123456789012" // Replace with your dev account ID
		case "staging":
			return "123456789013" // Replace with your staging account ID
		case "prod":
			return "123456789014" // Replace with your prod account ID
		default:
			return "123456789012" // Default fallback
		}
	}
	return accountID
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
	environment := "dev"
	suffix := getEnvironmentSuffix(environment)
	randomSuffix := generateRandomSuffix()
	accountID := getAccountID(environment)

	return &EnvironmentConfig{
		Environment:        environment,
		Region:             "us-east-1",
		AccountID:          accountID,
		Suffix:             suffix,
		RandomSuffix:       randomSuffix,
		VPCCidr:            "10.0.0.0/16",
		PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24"},
		PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24"},
		LoggingBucket:      fmt.Sprintf("logs-%s-%s-%s", accountID, suffix, randomSuffix),
		ReplicationBucket:  fmt.Sprintf("logs-replica-%s-%s-%s", accountID, suffix, randomSuffix),
		RolePrefix:         fmt.Sprintf("%s-%s", suffix, randomSuffix),
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
			"Suffix":      suffix,
		},
	}
}

func getStagingConfig() *EnvironmentConfig {
	environment := "staging"
	suffix := getEnvironmentSuffix(environment)
	randomSuffix := generateRandomSuffix()
	accountID := getAccountID(environment)

	return &EnvironmentConfig{
		Environment:        environment,
		Region:             "us-east-2",
		AccountID:          accountID,
		Suffix:             suffix,
		RandomSuffix:       randomSuffix,
		VPCCidr:            "10.1.0.0/16",
		PublicSubnetCidrs:  []string{"10.1.1.0/24", "10.1.2.0/24"},
		PrivateSubnetCidrs: []string{"10.1.10.0/24", "10.1.20.0/24"},
		LoggingBucket:      fmt.Sprintf("logs-%s-%s-%s", accountID, suffix, randomSuffix),
		ReplicationBucket:  fmt.Sprintf("logs-replica-%s-%s-%s", accountID, suffix, randomSuffix),
		RolePrefix:         fmt.Sprintf("%s-%s", suffix, randomSuffix),
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
			"Suffix":      suffix,
		},
	}
}

func getProdConfig() *EnvironmentConfig {
	environment := "prod"
	suffix := getEnvironmentSuffix(environment)
	randomSuffix := generateRandomSuffix()
	accountID := getAccountID(environment)

	return &EnvironmentConfig{
		Environment:        environment,
		Region:             "us-west-1",
		AccountID:          accountID,
		Suffix:             suffix,
		RandomSuffix:       randomSuffix,
		VPCCidr:            "10.2.0.0/16",
		PublicSubnetCidrs:  []string{"10.2.1.0/24", "10.2.2.0/24"},
		PrivateSubnetCidrs: []string{"10.2.10.0/24", "10.2.20.0/24"},
		LoggingBucket:      fmt.Sprintf("logs-%s-%s-%s", accountID, suffix, randomSuffix),
		ReplicationBucket:  fmt.Sprintf("logs-replica-%s-%s-%s", accountID, suffix, randomSuffix),
		RolePrefix:         fmt.Sprintf("%s-%s", suffix, randomSuffix),
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "cdktf",
			"Suffix":      suffix,
		},
	}
}

// BuildInfrastructureStack provisions the complete multi-environment infrastructure
func BuildInfrastructureStack(stack cdktf.TerraformStack, cfg *EnvironmentConfig) {
	// Configure AWS provider with region-specific settings
	// This creates the Terraform provider block in the generated JSON
	awscdktf.NewAwsProvider(stack, str("aws"), &awscdktf.AwsProviderConfig{Region: &cfg.Region})

	// Build VPC component
	vpcComponent := buildVPCComponent(stack, cfg)

	// Build IAM component
	iamComponent := buildIAMComponent(stack, cfg)

	// Build S3 component
	s3Component := buildS3Component(stack, cfg)

	// Outputs
	cdktf.NewTerraformOutput(stack, str("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcComponent.VPC.Id(),
		Description: str("VPC ID"),
	})

	cdktf.NewTerraformOutput(stack, str("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcComponent.PublicSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: str("Public subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, str("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value: func() *[]*string {
			var ids []*string
			for _, subnet := range vpcComponent.PrivateSubnets {
				ids = append(ids, subnet.Id())
			}
			return &ids
		}(),
		Description: str("Private subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, str("logging_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Component.LoggingBucket.Id(),
		Description: str("Logging bucket name"),
	})

	cdktf.NewTerraformOutput(stack, str("replication_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Component.ReplicationBucket.Id(),
		Description: str("Replication bucket name"),
	})

	cdktf.NewTerraformOutput(stack, str("ec2_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       iamComponent.EC2Role.Arn(),
		Description: str("EC2 role ARN"),
	})

	cdktf.NewTerraformOutput(stack, str("lambda_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       iamComponent.LambdaRole.Arn(),
		Description: str("Lambda role ARN"),
	})
}

// buildVPCComponent creates a complete VPC with public and private subnets
func buildVPCComponent(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *VPCComponent {
	// Get availability zones
	availabilityZones := azs.NewDataAwsAvailabilityZones(stack, str("azs"), &azs.DataAwsAvailabilityZonesConfig{
		State: str("available"),
	})

	// Create VPC
	mainVPC := vpc.NewVpc(stack, str("MainVPC"), &vpc.VpcConfig{
		CidrBlock:          str(cfg.VPCCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("%s-vpc", cfg.Environment)),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Create Internet Gateway
	internetGateway := igw.NewInternetGateway(stack, str("InternetGateway"), &igw.InternetGatewayConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("%s-igw", cfg.Environment)),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Create public subnets and NAT gateways
	var publicSubnets []subnet.Subnet
	var natGateways []natgw.NatGateway

	for i, cidr := range cfg.PublicSubnetCidrs {
		publicSubnet := subnet.NewSubnet(stack, str(fmt.Sprintf("PublicSubnet%d", i)), &subnet.SubnetConfig{
			VpcId:     mainVPC.Id(),
			CidrBlock: str(cidr),
			// Use Fn_Element to safely access AZ list - this creates a Terraform function call
			// instead of trying to resolve the value at synthesis time  
			AvailabilityZone:    jsii.String(fmt.Sprintf("${element(%s, %d)}", *availabilityZones.Fqn(), i)),
			MapPublicIpOnLaunch: jsii.Bool(true),
			Tags: &map[string]*string{
				"Name":        str(fmt.Sprintf("%s-public-subnet-%d", cfg.Environment, i)),
				"Type":        str("public"),
				"Environment": str(cfg.Environment),
				"Project":     str(cfg.CommonTags["Project"]),
				"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
			},
		})
		publicSubnets = append(publicSubnets, publicSubnet)

		// Create EIP for NAT Gateway
		natEIP := eip.NewEip(stack, str(fmt.Sprintf("NatEIP%d", i)), &eip.EipConfig{
			Domain: str("vpc"),
			Tags: &map[string]*string{
				"Name":        str(fmt.Sprintf("%s-nat-eip-%d", cfg.Environment, i)),
				"Environment": str(cfg.Environment),
				"Project":     str(cfg.CommonTags["Project"]),
				"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
			},
		})

		// Create NAT Gateway
		natGateway := natgw.NewNatGateway(stack, str(fmt.Sprintf("NatGateway%d", i)), &natgw.NatGatewayConfig{
			AllocationId: natEIP.Id(),
			SubnetId:     publicSubnet.Id(),
			Tags: &map[string]*string{
				"Name":        str(fmt.Sprintf("%s-nat-gw-%d", cfg.Environment, i)),
				"Environment": str(cfg.Environment),
				"Project":     str(cfg.CommonTags["Project"]),
				"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
			},
		})
		natGateways = append(natGateways, natGateway)
	}

	// Create public route table
	publicRouteTable := routetable.NewRouteTable(stack, str("PublicRouteTable"), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("%s-public-rt", cfg.Environment)),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Add route to internet gateway
	route.NewRoute(stack, str("PublicRoute"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: str("0.0.0.0/0"),
		GatewayId:            internetGateway.Id(),
	})

	// Associate public subnets with public route table
	for i, subnet := range publicSubnets {
		routetableassoc.NewRouteTableAssociation(stack, str(fmt.Sprintf("PublicRouteTableAssociation%d", i)), &routetableassoc.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRouteTable.Id(),
		})
	}

	// Create private subnets
	var privateSubnets []subnet.Subnet
	for i, cidr := range cfg.PrivateSubnetCidrs {
		privateSubnet := subnet.NewSubnet(stack, str(fmt.Sprintf("PrivateSubnet%d", i)), &subnet.SubnetConfig{
			VpcId:            mainVPC.Id(),
			CidrBlock:        str(cidr),
			AvailabilityZone: jsii.String(fmt.Sprintf("${element(%s, %d)}", *availabilityZones.Fqn(), i)),
			Tags: &map[string]*string{
				"Name":        str(fmt.Sprintf("%s-private-subnet-%d", cfg.Environment, i)),
				"Type":        str("private"),
				"Environment": str(cfg.Environment),
				"Project":     str(cfg.CommonTags["Project"]),
				"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
			},
		})
		privateSubnets = append(privateSubnets, privateSubnet)

		// Create private route table for this subnet
		privateRouteTable := routetable.NewRouteTable(stack, str(fmt.Sprintf("PrivateRouteTable%d", i)), &routetable.RouteTableConfig{
			VpcId: mainVPC.Id(),
			Tags: &map[string]*string{
				"Name":        str(fmt.Sprintf("%s-private-rt-%d", cfg.Environment, i)),
				"Environment": str(cfg.Environment),
				"Project":     str(cfg.CommonTags["Project"]),
				"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
			},
		})

		// Add route to NAT gateway (use element function to get the corresponding NAT gateway)
		// For simplicity, we'll use the same index as the subnet (assuming 1:1 mapping)
		var natGatewayId *string
		if i < len(natGateways) {
			natGatewayId = natGateways[i].Id()
		} else {
			// If we have more private subnets than NAT gateways, use modulo
			natGatewayId = natGateways[i%len(natGateways)].Id()
		}

		route.NewRoute(stack, str(fmt.Sprintf("PrivateRoute%d", i)), &route.RouteConfig{
			RouteTableId:         privateRouteTable.Id(),
			DestinationCidrBlock: str("0.0.0.0/0"),
			NatGatewayId:         natGatewayId,
		})

		// Associate private subnet with private route table
		routetableassoc.NewRouteTableAssociation(stack, str(fmt.Sprintf("PrivateRouteTableAssociation%d", i)), &routetableassoc.RouteTableAssociationConfig{
			SubnetId:     privateSubnet.Id(),
			RouteTableId: privateRouteTable.Id(),
		})
	}

	return &VPCComponent{
		VPC:             mainVPC,
		PublicSubnets:   publicSubnets,
		PrivateSubnets:  privateSubnets,
		InternetGateway: internetGateway,
		NATGateways:     natGateways,
	}
}

// buildIAMComponent creates common IAM roles
func buildIAMComponent(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *IAMComponent {
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

	ec2PolicyJSON, err := json.Marshal(ec2AssumeRolePolicy)
	if err != nil {
		fmt.Printf("Error marshalling EC2 assume role policy: %v\n", err)
		return nil
	}

	// Create EC2 role
	ec2Role := iamrole.NewIamRole(stack, str("EC2Role"), &iamrole.IamRoleConfig{
		Name:             str(fmt.Sprintf("%s-ec2-role", cfg.RolePrefix)),
		AssumeRolePolicy: str(string(ec2PolicyJSON)),
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("%s-ec2-role", cfg.Environment)),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Attach basic EC2 policies
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, str("EC2SSMPolicy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
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

	lambdaPolicyJSON, err := json.Marshal(lambdaAssumeRolePolicy)
	if err != nil {
		fmt.Printf("Error marshalling Lambda assume role policy: %v\n", err)
		return nil
	}

	// Create Lambda role
	lambdaRole := iamrole.NewIamRole(stack, str("LambdaRole"), &iamrole.IamRoleConfig{
		Name:             str(fmt.Sprintf("%s-lambda-role", cfg.RolePrefix)),
		AssumeRolePolicy: str(string(lambdaPolicyJSON)),
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("%s-lambda-role", cfg.Environment)),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Attach basic Lambda execution policy
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, str("LambdaBasicPolicy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	// Create custom policy for cross-account S3 access
	s3CrossAccountPolicy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Effect": "Allow",
				"Action": []string{
					"s3:GetObject",
					"s3:PutObject",
					"s3:DeleteObject",
				},
				"Resource": []string{
					fmt.Sprintf("arn:aws:s3:::%s/*", cfg.LoggingBucket),
					fmt.Sprintf("arn:aws:s3:::%s/*", cfg.ReplicationBucket),
				},
			},
			{
				"Effect": "Allow",
				"Action": []string{
					"s3:ListBucket",
				},
				"Resource": []string{
					fmt.Sprintf("arn:aws:s3:::%s", cfg.LoggingBucket),
					fmt.Sprintf("arn:aws:s3:::%s", cfg.ReplicationBucket),
				},
			},
		},
	}

	s3PolicyJSON, err := json.Marshal(s3CrossAccountPolicy)
	if err != nil {
		fmt.Printf("Error marshalling S3 cross-account policy: %v\n", err)
		return nil
	}

	s3Policy := iampolicy.NewIamPolicy(stack, str("S3CrossAccountPolicy"), &iampolicy.IamPolicyConfig{
		Name:        str(fmt.Sprintf("%s-s3-cross-account-policy", cfg.RolePrefix)),
		Description: str("Policy for cross-account S3 access"),
		Policy:      str(string(s3PolicyJSON)),
	})

	// Attach S3 policy to both roles
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, str("EC2S3PolicyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: s3Policy.Arn(),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, str("LambdaS3PolicyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: s3Policy.Arn(),
	})

	return &IAMComponent{
		EC2Role:    ec2Role,
		LambdaRole: lambdaRole,
	}
}

// buildS3Component creates S3 buckets with proper configuration
func buildS3Component(stack cdktf.TerraformStack, cfg *EnvironmentConfig) *S3Component {
	// Create main logging bucket
	loggingBucket := s3bucket.NewS3Bucket(stack, str("LoggingBucket"), &s3bucket.S3BucketConfig{
		Bucket: str(cfg.LoggingBucket),
		Tags: &map[string]*string{
			"Name":        str(cfg.LoggingBucket),
			"Purpose":     str("logging"),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Enable versioning on logging bucket
	s3bucketver.NewS3BucketVersioningA(stack, str("LoggingBucketVersioning"), &s3bucketver.S3BucketVersioningAConfig{
		Bucket: loggingBucket.Id(),
		VersioningConfiguration: &s3bucketver.S3BucketVersioningVersioningConfiguration{
			Status: str("Enabled"),
		},
	})

	// Enable encryption on logging bucket
	s3bucketenc.NewS3BucketServerSideEncryptionConfigurationA(stack, str("LoggingBucketEncryption"), &s3bucketenc.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: loggingBucket.Id(),
		Rule: &[]*s3bucketenc.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketenc.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					SseAlgorithm: str("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// Block public access on logging bucket
	s3bucketpab.NewS3BucketPublicAccessBlock(stack, str("LoggingBucketPAB"), &s3bucketpab.S3BucketPublicAccessBlockConfig{
		Bucket:                loggingBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Create replication bucket
	replicationBucket := s3bucket.NewS3Bucket(stack, str("ReplicationBucket"), &s3bucket.S3BucketConfig{
		Bucket: str(cfg.ReplicationBucket),
		Tags: &map[string]*string{
			"Name":        str(cfg.ReplicationBucket),
			"Purpose":     str("replication"),
			"Environment": str(cfg.Environment),
			"Project":     str(cfg.CommonTags["Project"]),
			"ManagedBy":   str(cfg.CommonTags["ManagedBy"]),
		},
	})

	// Configure replication bucket similarly
	s3bucketver.NewS3BucketVersioningA(stack, str("ReplicationBucketVersioning"), &s3bucketver.S3BucketVersioningAConfig{
		Bucket: replicationBucket.Id(),
		VersioningConfiguration: &s3bucketver.S3BucketVersioningVersioningConfiguration{
			Status: str("Enabled"),
		},
	})

	s3bucketenc.NewS3BucketServerSideEncryptionConfigurationA(stack, str("ReplicationBucketEncryption"), &s3bucketenc.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: replicationBucket.Id(),
		Rule: &[]*s3bucketenc.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketenc.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					SseAlgorithm: str("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	s3bucketpab.NewS3BucketPublicAccessBlock(stack, str("ReplicationBucketPAB"), &s3bucketpab.S3BucketPublicAccessBlockConfig{
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
				"Sid":       "DenyInsecureConnections",
				"Effect":    "Deny",
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

	policyJSON, err := json.Marshal(bucketPolicy)
	if err != nil {
		fmt.Printf("Error marshalling S3 bucket policy: %v\n", err)
		return nil
	}

	s3bucketpolicy.NewS3BucketPolicy(stack, str("LoggingBucketPolicy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: loggingBucket.Id(),
		Policy: str(string(policyJSON)),
	})

	return &S3Component{
		LoggingBucket:     loggingBucket,
		ReplicationBucket: replicationBucket,
	}
}
