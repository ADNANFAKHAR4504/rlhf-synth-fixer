package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/alb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/wafv2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
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
	// Application
	DomainName     string
	CertificateARN string
	TrustedCIDRs   []string
	// Tags
	CommonTags map[string]string
}

// VPCComponent represents a complete VPC setup
type VPCComponent struct {
	VPC             *ec2.Vpc
	PublicSubnets   []*ec2.Subnet
	PrivateSubnets  []*ec2.Subnet
	InternetGateway *ec2.InternetGateway
	NATGateways     []*ec2.NatGateway
}

// IAMComponent represents IAM roles and policies
type IAMComponent struct {
	EC2Role            *iam.Role
	LambdaRole         *iam.Role
	EC2InstanceProfile *iam.InstanceProfile
}

// S3Component represents S3 buckets for logging
type S3Component struct {
	LoggingBucket     *s3.BucketV2
	ReplicationBucket *s3.BucketV2
}

// KMSComponent represents KMS keys for encryption
type KMSComponent struct {
	DataKey *kms.Key
	LogsKey *kms.Key
}

// SecurityComponent represents security groups
type SecurityComponent struct {
	ALBSecurityGroup *ec2.SecurityGroup
	AppSecurityGroup *ec2.SecurityGroup
	DBSecurityGroup  *ec2.SecurityGroup
}

// ApplicationComponent represents application infrastructure
type ApplicationComponent struct {
	LoadBalancer     *alb.LoadBalancer
	TargetGroup      *alb.TargetGroup
	AutoScalingGroup *autoscaling.Group
	LaunchTemplate   *ec2.LaunchTemplate
}

// DatabaseComponent represents RDS database
type DatabaseComponent struct {
	SubnetGroup *rds.SubnetGroup
	Instance    *rds.Instance
	Secret      *secretsmanager.Secret
}

// MonitoringComponent represents monitoring infrastructure
type MonitoringComponent struct {
	SNSTopic           *sns.Topic
	CloudWatchLogGroup *cloudwatch.LogGroup
	WAFWebACL          *wafv2.WebAcl
}

// InfrastructureStack represents the main infrastructure stack
type InfrastructureStack struct {
	Config      *EnvironmentConfig
	VPC         *VPCComponent
	IAM         *IAMComponent
	Storage     *S3Component
	KMS         *KMSComponent
	Security    *SecurityComponent
	Application *ApplicationComponent
	Database    *DatabaseComponent
	Monitoring  *MonitoringComponent
}

// generateRandomSuffix creates a random 6-character suffix for resource naming
func generateRandomSuffix() string {
	// bytes := make([]byte, 3)
	// if _, err := rand.Read(bytes); err != nil {
	// 	// Fallback to a simple timestamp-based suffix if random generation fails
	// 	return fmt.Sprintf("%d", os.Getpid()%1000000)
	// }
	// return hex.EncodeToString(bytes)
	return "6a0ce9"
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
		// Only support dev environment
		return "123456789012" // Replace with your dev account ID
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
		PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"},
		PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"},
		LoggingBucket:      fmt.Sprintf("logs-%s-%s-%s", accountID, suffix, randomSuffix),
		ReplicationBucket:  fmt.Sprintf("logs-replica-%s-%s-%s", accountID, suffix, randomSuffix),
		RolePrefix:         fmt.Sprintf("%s-%s", suffix, randomSuffix),
		DomainName:         "dev.example.com",                       // TODO: Replace with actual domain
		CertificateARN:     "",                                      // TODO: Add ACM certificate ARN
		TrustedCIDRs:       []string{"10.0.0.0/8", "172.16.0.0/12"}, // TODO: Add office IPs
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "pulumi",
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
		DomainName:         "staging.example.com",                   // TODO: Replace with actual domain
		CertificateARN:     "",                                      // TODO: Add ACM certificate ARN
		TrustedCIDRs:       []string{"10.0.0.0/8", "172.16.0.0/12"}, // TODO: Add office IPs
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "pulumi",
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
		DomainName:         "example.com",                           // TODO: Replace with actual domain
		CertificateARN:     "",                                      // TODO: Add ACM certificate ARN
		TrustedCIDRs:       []string{"10.0.0.0/8", "172.16.0.0/12"}, // TODO: Add office IPs
		CommonTags: map[string]string{
			"Environment": environment,
			"Project":     "infrastructure",
			"ManagedBy":   "pulumi",
			"Suffix":      suffix,
		},
	}
}

// BuildInfrastructureStack provisions the complete multi-environment infrastructure
func BuildInfrastructureStack(ctx *pulumi.Context, cfg *EnvironmentConfig) (*InfrastructureStack, error) {
	// Build VPC component
	vpcComponent, err := buildVPCComponent(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("error building VPC component: %v", err)
	}

	// Build IAM component
	iamComponent, err := buildIAMComponent(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("error building IAM component: %v", err)
	}

	// Build S3 component
	s3Component, err := buildS3Component(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("error building S3 component: %v", err)
	}

	// Build KMS component
	kmsComponent, err := buildKMSComponent(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("error building KMS component: %v", err)
	}

	// Build Security component
	securityComponent, err := buildSecurityComponent(ctx, cfg, vpcComponent)
	if err != nil {
		return nil, fmt.Errorf("error building Security component: %v", err)
	}

	// Build Application component
	applicationComponent, err := buildApplicationComponent(ctx, cfg, vpcComponent, securityComponent, iamComponent)
	if err != nil {
		return nil, fmt.Errorf("error building Application component: %v", err)
	}

	// Build Database component
	databaseComponent, err := buildDatabaseComponent(ctx, cfg, vpcComponent, securityComponent, kmsComponent)
	if err != nil {
		return nil, fmt.Errorf("error building Database component: %v", err)
	}

	// Build Monitoring component
	monitoringComponent, err := buildMonitoringComponent(ctx, cfg, vpcComponent, securityComponent, kmsComponent)
	if err != nil {
		return nil, fmt.Errorf("error building Monitoring component: %v", err)
	}

	// Build VPC Endpoints
	_, err = buildVPCEndpoints(ctx, cfg, vpcComponent, securityComponent)
	if err != nil {
		return nil, fmt.Errorf("error building VPC Endpoints: %v", err)
	}

	// Outputs
	ctx.Export("vpc_id", vpcComponent.VPC.ID())

	// Handle 3 subnets for exports
	publicSubnetIds := pulumi.All(vpcComponent.PublicSubnets[0].ID(), vpcComponent.PublicSubnets[1].ID(), vpcComponent.PublicSubnets[2].ID())
	ctx.Export("public_subnet_ids", publicSubnetIds)

	privateSubnetIds := pulumi.All(vpcComponent.PrivateSubnets[0].ID(), vpcComponent.PrivateSubnets[1].ID(), vpcComponent.PrivateSubnets[2].ID())
	ctx.Export("private_subnet_ids", privateSubnetIds)

	ctx.Export("logging_bucket_name", s3Component.LoggingBucket.ID())
	ctx.Export("replication_bucket_name", s3Component.ReplicationBucket.ID())
	ctx.Export("ec2_role_arn", iamComponent.EC2Role.Arn)
	ctx.Export("ec2_instance_profile_arn", iamComponent.EC2InstanceProfile.Arn)
	ctx.Export("lambda_role_arn", iamComponent.LambdaRole.Arn)
	ctx.Export("data_kms_key_arn", kmsComponent.DataKey.Arn)
	ctx.Export("logs_kms_key_arn", kmsComponent.LogsKey.Arn)

	return &InfrastructureStack{
		Config:      cfg,
		VPC:         vpcComponent,
		IAM:         iamComponent,
		Storage:     s3Component,
		KMS:         kmsComponent,
		Security:    securityComponent,
		Application: applicationComponent,
		Database:    databaseComponent,
		Monitoring:  monitoringComponent,
	}, nil
}

// buildVPCComponent creates a complete VPC with public and private subnets
func buildVPCComponent(ctx *pulumi.Context, cfg *EnvironmentConfig) (*VPCComponent, error) {
	// Get availability zones - using a simpler approach
	availabilityZones := []string{"us-east-1a", "us-east-1b", "us-east-1c"}
	if cfg.Region == "us-east-2" {
		availabilityZones = []string{"us-east-2a", "us-east-2b", "us-east-2c"}
	} else if cfg.Region == "us-west-1" {
		availabilityZones = []string{"us-west-1a", "us-west-1b", "us-west-1c"}
	}

	// Create VPC
	mainVPC, err := ec2.NewVpc(ctx, "MainVPC", &ec2.VpcArgs{
		CidrBlock:          pulumi.String(cfg.VPCCidr),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-vpc", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating VPC: %v", err)
	}

	// Create Internet Gateway
	internetGateway, err := ec2.NewInternetGateway(ctx, "InternetGateway", &ec2.InternetGatewayArgs{
		VpcId: mainVPC.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-igw", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Internet Gateway: %v", err)
	}

	// Create public subnets and NAT gateways
	var publicSubnets []*ec2.Subnet
	var natGateways []*ec2.NatGateway

	for i, cidr := range cfg.PublicSubnetCidrs {
		publicSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("PublicSubnet%d", i), &ec2.SubnetArgs{
			VpcId:               mainVPC.ID(),
			CidrBlock:           pulumi.String(cidr),
			AvailabilityZone:    pulumi.String(availabilityZones[i]),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-public-subnet-%d", cfg.Environment, i)),
				"Type":        pulumi.String("public"),
				"Environment": pulumi.String(cfg.Environment),
				"Project":     pulumi.String(cfg.CommonTags["Project"]),
				"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("error creating public subnet %d: %v", i, err)
		}
		publicSubnets = append(publicSubnets, publicSubnet)

		// Create EIP for NAT Gateway
		natEIP, err := ec2.NewEip(ctx, fmt.Sprintf("NatEIP%d", i), &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-nat-eip-%d", cfg.Environment, i)),
				"Environment": pulumi.String(cfg.Environment),
				"Project":     pulumi.String(cfg.CommonTags["Project"]),
				"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("error creating NAT EIP %d: %v", i, err)
		}

		// Create NAT Gateway
		natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("NatGateway%d", i), &ec2.NatGatewayArgs{
			AllocationId: natEIP.ID(),
			SubnetId:     publicSubnet.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-nat-gw-%d", cfg.Environment, i)),
				"Environment": pulumi.String(cfg.Environment),
				"Project":     pulumi.String(cfg.CommonTags["Project"]),
				"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("error creating NAT Gateway %d: %v", i, err)
		}
		natGateways = append(natGateways, natGateway)
	}

	// Create public route table
	publicRouteTable, err := ec2.NewRouteTable(ctx, "PublicRouteTable", &ec2.RouteTableArgs{
		VpcId: mainVPC.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-public-rt", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating public route table: %v", err)
	}

	// Add route to internet gateway
	_, err = ec2.NewRoute(ctx, "PublicRoute", &ec2.RouteArgs{
		RouteTableId:         publicRouteTable.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		GatewayId:            internetGateway.ID(),
	})
	if err != nil {
		return nil, fmt.Errorf("error creating public route: %v", err)
	}

	// Associate public subnets with public route table
	for i, subnet := range publicSubnets {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("PublicRouteTableAssociation%d", i), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return nil, fmt.Errorf("error associating public subnet %d: %v", i, err)
		}
	}

	// Create private subnets
	var privateSubnets []*ec2.Subnet
	for i, cidr := range cfg.PrivateSubnetCidrs {
		privateSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("PrivateSubnet%d", i), &ec2.SubnetArgs{
			VpcId:            mainVPC.ID(),
			CidrBlock:        pulumi.String(cidr),
			AvailabilityZone: pulumi.String(availabilityZones[i]),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-subnet-%d", cfg.Environment, i)),
				"Type":        pulumi.String("private"),
				"Environment": pulumi.String(cfg.Environment),
				"Project":     pulumi.String(cfg.CommonTags["Project"]),
				"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("error creating private subnet %d: %v", i, err)
		}
		privateSubnets = append(privateSubnets, privateSubnet)

		// Create private route table for this subnet
		privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("PrivateRouteTable%d", i), &ec2.RouteTableArgs{
			VpcId: mainVPC.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-rt-%d", cfg.Environment, i)),
				"Environment": pulumi.String(cfg.Environment),
				"Project":     pulumi.String(cfg.CommonTags["Project"]),
				"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("error creating private route table %d: %v", i, err)
		}

		// Add route to NAT gateway (use element function to get the corresponding NAT gateway)
		// For simplicity, we'll use the same index as the subnet (assuming 1:1 mapping)
		var natGatewayId pulumi.IDOutput
		if i < len(natGateways) {
			natGatewayId = natGateways[i].ID()
		} else {
			// If we have more private subnets than NAT gateways, use modulo
			natGatewayId = natGateways[i%len(natGateways)].ID()
		}

		_, err = ec2.NewRoute(ctx, fmt.Sprintf("PrivateRoute%d", i), &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGatewayId,
		})
		if err != nil {
			return nil, fmt.Errorf("error creating private route %d: %v", i, err)
		}

		// Associate private subnet with private route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("PrivateRouteTableAssociation%d", i), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return nil, fmt.Errorf("error associating private subnet %d: %v", i, err)
		}
	}

	return &VPCComponent{
		VPC:             mainVPC,
		PublicSubnets:   publicSubnets,
		PrivateSubnets:  privateSubnets,
		InternetGateway: internetGateway,
		NATGateways:     natGateways,
	}, nil
}

// buildIAMComponent creates common IAM roles
func buildIAMComponent(ctx *pulumi.Context, cfg *EnvironmentConfig) (*IAMComponent, error) {
	// EC2 assume role policy
	ec2AssumeRolePolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": {
					"Service": "ec2.amazonaws.com"
				}
			}
		]
	}`

	// Create EC2 role
	ec2Role, err := iam.NewRole(ctx, "EC2Role", &iam.RoleArgs{
		Name:             pulumi.String(fmt.Sprintf("%s-ec2-role", cfg.RolePrefix)),
		AssumeRolePolicy: pulumi.String(ec2AssumeRolePolicy),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-ec2-role", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating EC2 role: %v", err)
	}

	// Attach basic EC2 policies
	_, err = iam.NewRolePolicyAttachment(ctx, "EC2SSMPolicy", &iam.RolePolicyAttachmentArgs{
		Role:      ec2Role.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
	})
	if err != nil {
		return nil, fmt.Errorf("error attaching SSM policy to EC2 role: %v", err)
	}

	// Lambda assume role policy
	lambdaAssumeRolePolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": {
					"Service": "lambda.amazonaws.com"
				}
			}
		]
	}`

	// Create Lambda role
	lambdaRole, err := iam.NewRole(ctx, "LambdaRole", &iam.RoleArgs{
		Name:             pulumi.String(fmt.Sprintf("%s-lambda-role", cfg.RolePrefix)),
		AssumeRolePolicy: pulumi.String(lambdaAssumeRolePolicy),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-lambda-role", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Lambda role: %v", err)
	}

	// Attach basic Lambda execution policy
	_, err = iam.NewRolePolicyAttachment(ctx, "LambdaBasicPolicy", &iam.RolePolicyAttachmentArgs{
		Role:      lambdaRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})
	if err != nil {
		return nil, fmt.Errorf("error attaching basic policy to Lambda role: %v", err)
	}

	// Create custom policy for cross-account S3 access
	s3CrossAccountPolicy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Action": [
					"s3:GetObject",
					"s3:PutObject",
					"s3:DeleteObject"
				],
				"Resource": [
					"arn:aws:s3:::%s/*",
					"arn:aws:s3:::%s/*"
				]
			},
			{
				"Effect": "Allow",
				"Action": [
					"s3:ListBucket"
				],
				"Resource": [
					"arn:aws:s3:::%s",
					"arn:aws:s3:::%s"
				]
			}
		]
	}`, cfg.LoggingBucket, cfg.ReplicationBucket, cfg.LoggingBucket, cfg.ReplicationBucket)

	s3Policy, err := iam.NewPolicy(ctx, "S3CrossAccountPolicy", &iam.PolicyArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-s3-cross-account-policy", cfg.RolePrefix)),
		Description: pulumi.String("Policy for cross-account S3 access"),
		Policy:      pulumi.String(s3CrossAccountPolicy),
	})
	if err != nil {
		return nil, fmt.Errorf("error creating S3 cross-account policy: %v", err)
	}

	// Attach S3 policy to both roles
	_, err = iam.NewRolePolicyAttachment(ctx, "EC2S3PolicyAttachment", &iam.RolePolicyAttachmentArgs{
		Role:      ec2Role.Name,
		PolicyArn: s3Policy.Arn,
	})
	if err != nil {
		return nil, fmt.Errorf("error attaching S3 policy to EC2 role: %v", err)
	}

	_, err = iam.NewRolePolicyAttachment(ctx, "LambdaS3PolicyAttachment", &iam.RolePolicyAttachmentArgs{
		Role:      lambdaRole.Name,
		PolicyArn: s3Policy.Arn,
	})
	if err != nil {
		return nil, fmt.Errorf("error attaching S3 policy to Lambda role: %v", err)
	}

	// Create EC2 instance profile
	ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, "EC2InstanceProfile", &iam.InstanceProfileArgs{
		Name: pulumi.String(fmt.Sprintf("%s-ec2-instance-profile", cfg.RolePrefix)),
		Role: ec2Role.Name,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-ec2-instance-profile", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating EC2 instance profile: %v", err)
	}

	return &IAMComponent{
		EC2Role:            ec2Role,
		LambdaRole:         lambdaRole,
		EC2InstanceProfile: ec2InstanceProfile,
	}, nil
}

// buildS3Component creates S3 buckets with proper configuration
func buildS3Component(ctx *pulumi.Context, cfg *EnvironmentConfig) (*S3Component, error) {
	// Create main logging bucket
	loggingBucket, err := s3.NewBucketV2(ctx, "LoggingBucket", &s3.BucketV2Args{
		Bucket: pulumi.String(cfg.LoggingBucket),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(cfg.LoggingBucket),
			"Purpose":     pulumi.String("logging"),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating logging bucket: %v", err)
	}

	// Enable versioning on logging bucket
	_, err = s3.NewBucketVersioningV2(ctx, "LoggingBucketVersioning", &s3.BucketVersioningV2Args{
		Bucket: loggingBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling versioning on logging bucket: %v", err)
	}

	// Enable encryption on logging bucket
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "LoggingBucketEncryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: loggingBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("AES256"),
				},
				BucketKeyEnabled: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling encryption on logging bucket: %v", err)
	}

	// Block public access on logging bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "LoggingBucketPAB", &s3.BucketPublicAccessBlockArgs{
		Bucket:                loggingBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("error blocking public access on logging bucket: %v", err)
	}

	// Create replication bucket
	replicationBucket, err := s3.NewBucketV2(ctx, "ReplicationBucket", &s3.BucketV2Args{
		Bucket: pulumi.String(cfg.ReplicationBucket),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(cfg.ReplicationBucket),
			"Purpose":     pulumi.String("replication"),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating replication bucket: %v", err)
	}

	// Configure replication bucket similarly
	_, err = s3.NewBucketVersioningV2(ctx, "ReplicationBucketVersioning", &s3.BucketVersioningV2Args{
		Bucket: replicationBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling versioning on replication bucket: %v", err)
	}

	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "ReplicationBucketEncryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: replicationBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("AES256"),
				},
				BucketKeyEnabled: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling encryption on replication bucket: %v", err)
	}

	_, err = s3.NewBucketPublicAccessBlock(ctx, "ReplicationBucketPAB", &s3.BucketPublicAccessBlockArgs{
		Bucket:                replicationBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("error blocking public access on replication bucket: %v", err)
	}

	// Add bucket policy for secure transport
	bucketPolicy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"arn:aws:s3:::%s",
					"arn:aws:s3:::%s/*"
				],
				"Condition": {
					"Bool": {
						"aws:SecureTransport": "false"
					}
				}
			}
		]
	}`, cfg.LoggingBucket, cfg.LoggingBucket)

	_, err = s3.NewBucketPolicy(ctx, "LoggingBucketPolicy", &s3.BucketPolicyArgs{
		Bucket: loggingBucket.ID(),
		Policy: pulumi.String(bucketPolicy),
	})
	if err != nil {
		return nil, fmt.Errorf("error creating bucket policy: %v", err)
	}

	return &S3Component{
		LoggingBucket:     loggingBucket,
		ReplicationBucket: replicationBucket,
	}, nil
}

// buildKMSComponent creates KMS keys for encryption
func buildKMSComponent(ctx *pulumi.Context, cfg *EnvironmentConfig) (*KMSComponent, error) {
	// KMS Key for data encryption (S3, RDS, Secrets Manager)
	dataKey, err := kms.NewKey(ctx, "DataKMSKey", &kms.KeyArgs{
		Description:          pulumi.String(fmt.Sprintf("%s Data Encryption Key", cfg.Environment)),
		DeletionWindowInDays: pulumi.Int(30),
		EnableKeyRotation:    pulumi.Bool(true),
		MultiRegion:          pulumi.Bool(false),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-data-kms-key", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating data KMS key: %v", err)
	}

	// KMS Key alias for data
	_, err = kms.NewAlias(ctx, "DataKMSAlias", &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/%s-data", cfg.Environment)),
		TargetKeyId: dataKey.KeyId,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating data KMS alias: %v", err)
	}

	// KMS Key for logs encryption (CloudWatch, WAF)
	logsKey, err := kms.NewKey(ctx, "LogsKMSKey", &kms.KeyArgs{
		Description:          pulumi.String(fmt.Sprintf("%s Logs Encryption Key", cfg.Environment)),
		DeletionWindowInDays: pulumi.Int(30),
		EnableKeyRotation:    pulumi.Bool(true),
		MultiRegion:          pulumi.Bool(false),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-logs-kms-key", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating logs KMS key: %v", err)
	}

	// KMS Key alias for logs
	_, err = kms.NewAlias(ctx, "LogsKMSAlias", &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/%s-logs", cfg.Environment)),
		TargetKeyId: logsKey.KeyId,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating logs KMS alias: %v", err)
	}

	return &KMSComponent{
		DataKey: dataKey,
		LogsKey: logsKey,
	}, nil
}

// buildSecurityComponent creates security groups with least privilege access
func buildSecurityComponent(ctx *pulumi.Context, cfg *EnvironmentConfig, vpc *VPCComponent) (*SecurityComponent, error) {
	// ALB Security Group - allow HTTP/HTTPS from trusted sources
	albSecurityGroup, err := ec2.NewSecurityGroup(ctx, "ALBSecurityGroup", &ec2.SecurityGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-alb-sg", cfg.Environment)),
		Description: pulumi.String("Security group for Application Load Balancer"),
		VpcId:       vpc.VPC.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(80),
				ToPort:     pulumi.Int(80),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // TODO: Restrict to trusted CIDRs
			},
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // TODO: Restrict to trusted CIDRs
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
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-alb-sg", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating ALB security group: %v", err)
	}

	// App Security Group - allow HTTP from ALB only
	appSecurityGroup, err := ec2.NewSecurityGroup(ctx, "AppSecurityGroup", &ec2.SecurityGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-app-sg", cfg.Environment)),
		Description: pulumi.String("Security group for application instances"),
		VpcId:       vpc.VPC.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(80),
				ToPort:         pulumi.Int(80),
				SecurityGroups: pulumi.StringArray{albSecurityGroup.ID()},
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
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-app-sg", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating app security group: %v", err)
	}

	// DB Security Group - allow PostgreSQL from app instances only
	dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "DBSecurityGroup", &ec2.SecurityGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-db-sg", cfg.Environment)),
		Description: pulumi.String("Security group for RDS database"),
		VpcId:       vpc.VPC.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(5432),
				ToPort:         pulumi.Int(5432),
				SecurityGroups: pulumi.StringArray{appSecurityGroup.ID()},
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
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-db-sg", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating DB security group: %v", err)
	}

	return &SecurityComponent{
		ALBSecurityGroup: albSecurityGroup,
		AppSecurityGroup: appSecurityGroup,
		DBSecurityGroup:  dbSecurityGroup,
	}, nil
}

// buildApplicationComponent creates ALB, target group, and auto scaling group
func buildApplicationComponent(ctx *pulumi.Context, cfg *EnvironmentConfig, vpc *VPCComponent, security *SecurityComponent, iam *IAMComponent) (*ApplicationComponent, error) {
	// Create target group
	targetGroup, err := alb.NewTargetGroup(ctx, "AppTargetGroup", &alb.TargetGroupArgs{
		Name:       pulumi.String(fmt.Sprintf("%s-app-tg", cfg.Environment)),
		Port:       pulumi.Int(80),
		Protocol:   pulumi.String("HTTP"),
		VpcId:      vpc.VPC.ID(),
		TargetType: pulumi.String("instance"),
		HealthCheck: &alb.TargetGroupHealthCheckArgs{
			Enabled:            pulumi.Bool(true),
			HealthyThreshold:   pulumi.Int(2),
			Interval:           pulumi.Int(30),
			Matcher:            pulumi.String("200"),
			Path:               pulumi.String("/healthz"),
			Port:               pulumi.String("traffic-port"),
			Protocol:           pulumi.String("HTTP"),
			Timeout:            pulumi.Int(5),
			UnhealthyThreshold: pulumi.Int(2),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-app-tg", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating target group: %v", err)
	}

	// Create Application Load Balancer
	loadBalancer, err := alb.NewLoadBalancer(ctx, "AppLoadBalancer", &alb.LoadBalancerArgs{
		Name:                     pulumi.String(fmt.Sprintf("%s-alb", cfg.Environment)),
		Internal:                 pulumi.Bool(false),
		LoadBalancerType:         pulumi.String("application"),
		SecurityGroups:           pulumi.StringArray{security.ALBSecurityGroup.ID()},
		Subnets:                  pulumi.StringArray{vpc.PublicSubnets[0].ID(), vpc.PublicSubnets[1].ID(), vpc.PublicSubnets[2].ID()},
		EnableDeletionProtection: pulumi.Bool(false), // TODO: Enable for production
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-alb", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating load balancer: %v", err)
	}

	// Create listener (HTTP only for dev - TODO: Add HTTPS with ACM certificate)
	_, err = alb.NewListener(ctx, "AppListener", &alb.ListenerArgs{
		LoadBalancerArn: loadBalancer.Arn,
		Port:            pulumi.Int(80),
		Protocol:        pulumi.String("HTTP"),
		DefaultActions: alb.ListenerDefaultActionArray{
			&alb.ListenerDefaultActionArgs{
				Type:           pulumi.String("forward"),
				TargetGroupArn: targetGroup.Arn,
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating listener: %v", err)
	}

	// Create launch template
	launchTemplate, err := ec2.NewLaunchTemplate(ctx, "AppLaunchTemplate", &ec2.LaunchTemplateArgs{
		NamePrefix:          pulumi.String(fmt.Sprintf("%s-app-lt", cfg.Environment)),
		ImageId:             pulumi.String("ami-0c02fb55956c7d316"), // Amazon Linux 2023
		InstanceType:        pulumi.String("t3.micro"),
		VpcSecurityGroupIds: pulumi.StringArray{security.AppSecurityGroup.ID()},
		UserData:            pulumi.String("IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZAogc3lzdGVtY3RsIHN0YXJ0IGh0dHBkCnN5c3RlbWN0bCBlbmFibGUgaHR0cGQKZWNobyAiPGgxPkhlbGxvIGZyb20gJCho b3N0bmFtZSAtZik8L2gxPiIgPiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWwKZWNobyAiT0siID4gL3Zhci93d3cvaHRtbC9oZWFsdGg6"),
		IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
			Name: iam.EC2InstanceProfile.Name,
		},
		MetadataOptions: &ec2.LaunchTemplateMetadataOptionsArgs{
			HttpTokens: pulumi.String("required"), // IMDSv2
		},
		TagSpecifications: ec2.LaunchTemplateTagSpecificationArray{
			&ec2.LaunchTemplateTagSpecificationArgs{
				ResourceType: pulumi.String("instance"),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("%s-app-instance", cfg.Environment)),
					"Environment": pulumi.String(cfg.Environment),
					"Project":     pulumi.String(cfg.CommonTags["Project"]),
					"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
				},
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating launch template: %v", err)
	}

	// Create auto scaling group
	autoScalingGroup, err := autoscaling.NewGroup(ctx, "AppAutoScalingGroup", &autoscaling.GroupArgs{
		Name:            pulumi.String(fmt.Sprintf("%s-app-asg", cfg.Environment)),
		DesiredCapacity: pulumi.Int(2),
		MaxSize:         pulumi.Int(6),
		MinSize:         pulumi.Int(2),
		LaunchTemplate: &autoscaling.GroupLaunchTemplateArgs{
			Id:      launchTemplate.ID(),
			Version: pulumi.String("$Latest"),
		},
		VpcZoneIdentifiers: pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		TargetGroupArns:    pulumi.StringArray{targetGroup.Arn},
		Tags: autoscaling.GroupTagArray{
			&autoscaling.GroupTagArgs{
				Key:               pulumi.String("Name"),
				Value:             pulumi.String(fmt.Sprintf("%s-app-instance", cfg.Environment)),
				PropagateAtLaunch: pulumi.Bool(true),
			},
			&autoscaling.GroupTagArgs{
				Key:               pulumi.String("Environment"),
				Value:             pulumi.String(cfg.Environment),
				PropagateAtLaunch: pulumi.Bool(true),
			},
			&autoscaling.GroupTagArgs{
				Key:               pulumi.String("Project"),
				Value:             pulumi.String(cfg.CommonTags["Project"]),
				PropagateAtLaunch: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating auto scaling group: %v", err)
	}

	return &ApplicationComponent{
		LoadBalancer:     loadBalancer,
		TargetGroup:      targetGroup,
		AutoScalingGroup: autoScalingGroup,
		LaunchTemplate:   launchTemplate,
	}, nil
}

// buildDatabaseComponent creates RDS PostgreSQL database
func buildDatabaseComponent(ctx *pulumi.Context, cfg *EnvironmentConfig, vpc *VPCComponent, security *SecurityComponent, kms *KMSComponent) (*DatabaseComponent, error) {
	// Create subnet group for RDS
	subnetGroup, err := rds.NewSubnetGroup(ctx, "DBSubnetGroup", &rds.SubnetGroupArgs{
		Name:      pulumi.String(fmt.Sprintf("%s-db-subnet-group", cfg.Environment)),
		SubnetIds: pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-db-subnet-group", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating subnet group: %v", err)
	}

	// Create database secret
	secret, err := secretsmanager.NewSecret(ctx, "DBSecret", &secretsmanager.SecretArgs{
		Name:        pulumi.String(fmt.Sprintf("%s/db-credentials", cfg.Environment)),
		Description: pulumi.String(fmt.Sprintf("Database credentials for %s environment", cfg.Environment)),
		KmsKeyId:    kms.DataKey.KeyId,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-db-secret", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating database secret: %v", err)
	}

	// Create RDS instance
	instance, err := rds.NewInstance(ctx, "DBInstance", &rds.InstanceArgs{
		Identifier:               pulumi.String(fmt.Sprintf("%s-db-instance", cfg.Environment)),
		AllocatedStorage:         pulumi.Int(20),
		StorageType:              pulumi.String("gp2"),
		Engine:                   pulumi.String("postgres"),
		EngineVersion:            pulumi.String("17.5"),
		InstanceClass:            pulumi.String("db.t3.micro"),
		DbName:                   pulumi.String("appdb"),
		Username:                 pulumi.String("postgres"),
		ManageMasterUserPassword: pulumi.Bool(true),
		MasterUserSecretKmsKeyId: kms.DataKey.KeyId,
		VpcSecurityGroupIds:      pulumi.StringArray{security.DBSecurityGroup.ID()},
		DbSubnetGroupName:        subnetGroup.Name,
		BackupRetentionPeriod:    pulumi.Int(7),
		MultiAz:                  pulumi.Bool(false), // TODO: Enable for production
		PubliclyAccessible:       pulumi.Bool(false),
		SkipFinalSnapshot:        pulumi.Bool(true),  // TODO: Disable for production
		DeletionProtection:       pulumi.Bool(false), // TODO: Enable for production
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-db-instance", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating RDS instance: %v", err)
	}

	return &DatabaseComponent{
		SubnetGroup: subnetGroup,
		Instance:    instance,
		Secret:      secret,
	}, nil
}

// buildMonitoringComponent creates CloudWatch monitoring and WAFv2
func buildMonitoringComponent(ctx *pulumi.Context, cfg *EnvironmentConfig, vpc *VPCComponent, security *SecurityComponent, kms *KMSComponent) (*MonitoringComponent, error) {
	// Create SNS topic for alerts
	snsTopic, err := sns.NewTopic(ctx, "AlertsTopic", &sns.TopicArgs{
		Name: pulumi.String(fmt.Sprintf("%s-alerts", cfg.Environment)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-alerts-topic", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating SNS topic: %v", err)
	}

	// Create CloudWatch log group
	logGroup, err := cloudwatch.NewLogGroup(ctx, "AppLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/ec2/%s-app", cfg.Environment)),
		RetentionInDays: pulumi.Int(30),
		// KmsKeyId:        kms.LogsKey.KeyId, // TODO: Enable KMS encryption after initial deployment
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-app-logs", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating log group: %v", err)
	}

	// Create WAFv2 WebACL
	webACL, err := wafv2.NewWebAcl(ctx, "AppWebACL", &wafv2.WebAclArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-web-acl", cfg.Environment)),
		Description: pulumi.String(fmt.Sprintf("WAFv2 WebACL for %s environment", cfg.Environment)),
		Scope:       pulumi.String("REGIONAL"),
		DefaultAction: &wafv2.WebAclDefaultActionArgs{
			Allow: &wafv2.WebAclDefaultActionAllowArgs{},
		},
		Rules: wafv2.WebAclRuleArray{
			&wafv2.WebAclRuleArgs{
				Name:     pulumi.String("RateLimitRule"),
				Priority: pulumi.Int(1),
				Action: &wafv2.WebAclRuleActionArgs{
					Block: &wafv2.WebAclRuleActionBlockArgs{},
				},
				Statement: &wafv2.WebAclRuleStatementArgs{
					RateBasedStatement: &wafv2.WebAclRuleStatementRateBasedStatementArgs{
						Limit:            pulumi.Int(2000),
						AggregateKeyType: pulumi.String("IP"),
					},
				},
				VisibilityConfig: &wafv2.WebAclRuleVisibilityConfigArgs{
					CloudwatchMetricsEnabled: pulumi.Bool(true),
					MetricName:               pulumi.String("RateLimitRule"),
					SampledRequestsEnabled:   pulumi.Bool(true),
				},
			},
		},
		VisibilityConfig: &wafv2.WebAclVisibilityConfigArgs{
			CloudwatchMetricsEnabled: pulumi.Bool(true),
			MetricName:               pulumi.String(fmt.Sprintf("%s-web-acl", cfg.Environment)),
			SampledRequestsEnabled:   pulumi.Bool(true),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-web-acl", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating WAFv2 WebACL: %v", err)
	}

	return &MonitoringComponent{
		SNSTopic:           snsTopic,
		CloudWatchLogGroup: logGroup,
		WAFWebACL:          webACL,
	}, nil
}

// buildVPCEndpoints creates VPC endpoints for AWS services
func buildVPCEndpoints(ctx *pulumi.Context, cfg *EnvironmentConfig, vpc *VPCComponent, security *SecurityComponent) ([]*ec2.VpcEndpoint, error) {
	var endpoints []*ec2.VpcEndpoint

	// Create security group for VPC endpoints
	vpcEndpointSecurityGroup, err := ec2.NewSecurityGroup(ctx, "VPCEndpointSecurityGroup", &ec2.SecurityGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("%s-vpc-endpoint-sg", cfg.Environment)),
		Description: pulumi.String("Security group for VPC endpoints"),
		VpcId:       vpc.VPC.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(443),
				ToPort:         pulumi.Int(443),
				SecurityGroups: pulumi.StringArray{security.AppSecurityGroup.ID()},
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
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-vpc-endpoint-sg", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating VPC endpoint security group: %v", err)
	}

	// S3 VPC Endpoint
	s3Endpoint, err := ec2.NewVpcEndpoint(ctx, "S3Endpoint", &ec2.VpcEndpointArgs{
		VpcId:           vpc.VPC.ID(),
		ServiceName:     pulumi.String(fmt.Sprintf("com.amazonaws.%s.s3", cfg.Region)),
		VpcEndpointType: pulumi.String("Gateway"),
		RouteTableIds:   pulumi.StringArray{}, // Will be added to private route tables
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-s3-endpoint", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating S3 VPC endpoint: %v", err)
	}
	endpoints = append(endpoints, s3Endpoint)

	// Secrets Manager VPC Endpoint
	secretsEndpoint, err := ec2.NewVpcEndpoint(ctx, "SecretsEndpoint", &ec2.VpcEndpointArgs{
		VpcId:             vpc.VPC.ID(),
		ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.secretsmanager", cfg.Region)),
		VpcEndpointType:   pulumi.String("Interface"),
		SubnetIds:         pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-secrets-endpoint", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Secrets Manager VPC endpoint: %v", err)
	}
	endpoints = append(endpoints, secretsEndpoint)

	// CloudWatch Logs VPC Endpoint
	logsEndpoint, err := ec2.NewVpcEndpoint(ctx, "LogsEndpoint", &ec2.VpcEndpointArgs{
		VpcId:             vpc.VPC.ID(),
		ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.logs", cfg.Region)),
		VpcEndpointType:   pulumi.String("Interface"),
		SubnetIds:         pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-logs-endpoint", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating CloudWatch Logs VPC endpoint: %v", err)
	}
	endpoints = append(endpoints, logsEndpoint)

	// SSM VPC Endpoint
	ssmEndpoint, err := ec2.NewVpcEndpoint(ctx, "SSMEndpoint", &ec2.VpcEndpointArgs{
		VpcId:             vpc.VPC.ID(),
		ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.ssm", cfg.Region)),
		VpcEndpointType:   pulumi.String("Interface"),
		SubnetIds:         pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-ssm-endpoint", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating SSM VPC endpoint: %v", err)
	}
	endpoints = append(endpoints, ssmEndpoint)

	// KMS VPC Endpoint
	kmsEndpoint, err := ec2.NewVpcEndpoint(ctx, "KMSEndpoint", &ec2.VpcEndpointArgs{
		VpcId:             vpc.VPC.ID(),
		ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.kms", cfg.Region)),
		VpcEndpointType:   pulumi.String("Interface"),
		SubnetIds:         pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID(), vpc.PrivateSubnets[2].ID()},
		SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-kms-endpoint", cfg.Environment)),
			"Environment": pulumi.String(cfg.Environment),
			"Project":     pulumi.String(cfg.CommonTags["Project"]),
			"ManagedBy":   pulumi.String(cfg.CommonTags["ManagedBy"]),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating KMS VPC endpoint: %v", err)
	}
	endpoints = append(endpoints, kmsEndpoint)

	return endpoints, nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment from env var or default to dev
		environment := os.Getenv("ENVIRONMENT")
		if environment == "" {
			environment = "dev"
		}

		// Get configuration for the environment
		cfg, err := GetConfig(environment)
		if err != nil {
			return fmt.Errorf("error getting config: %v", err)
		}

		// Build the infrastructure stack
		_, err = BuildInfrastructureStack(ctx, cfg)
		if err != nil {
			return fmt.Errorf("error building infrastructure: %v", err)
		}

		return nil
	})
}
