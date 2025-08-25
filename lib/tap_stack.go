package main

import (
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsregion"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securityhubaccount"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securityhubstandardssubscription"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackConfig struct {
	Environment     string
	Project         string
	Owner           string
	CostCenter      string
	Region          string
	VpcCidr         string
	AllowedIpRanges []string
}

type TapStack struct {
	cdktf.TerraformStack
	config *TapStackConfig
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) *TapStack {
	stack := &TapStack{}
	stack.TerraformStack = cdktf.NewTerraformStack(scope, &id)
	stack.config = config

	// Initialize AWS provider with enhanced security settings
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(config.Region),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": jsii.String(config.Environment),
					"Project":     jsii.String(config.Project),
					"Owner":       jsii.String(config.Owner),
					"CostCenter":  jsii.String(config.CostCenter),
					"ManagedBy":   jsii.String("terraform-cdk"),
					"Compliance":  jsii.String("FIPS-140-3-Level-3"),
				},
			},
		},
	})


	// S3 Backend for remote state
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(stateBucket),
		Key:     jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", config.Environment, config.Environment)),
		Region:  jsii.String(stateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// Get current AWS account and region information
	currentAccount := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	currentRegion := dataawsregion.NewDataAwsRegion(stack, jsii.String("current"), &dataawsregion.DataAwsRegionConfig{})
	availabilityZones := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create KMS keys for encryption
	kmsKeys := stack.createKMSKeys(currentAccount)

	// Create VPC and networking infrastructure
	networkingResources := stack.createNetworking(availabilityZones)

	// Create security groups with strict rules
	securityGroups := stack.createSecurityGroups(networkingResources.vpc)

	// Create IAM roles with managed policies only
	iamRoles := stack.createIAMRoles(currentAccount)

	// Create S3 buckets with security configurations
	s3Resources := stack.createS3Resources(kmsKeys.s3Key, currentAccount)

	// Create RDS with encryption
	stack.createRDSResources(networkingResources, securityGroups.rdsSecurityGroup, kmsKeys.rdsKey)

	// Setup logging infrastructure
	stack.createLoggingInfrastructure(s3Resources.cloudtrailBucket, kmsKeys.cloudtrailKey, iamRoles.cloudtrailRole)

	// Enable Security Hub with 2025 controls
	stack.enableSecurityHub()

	return stack
}

type KMSKeys struct {
	rdsKey        kmskey.KmsKey
	s3Key         kmskey.KmsKey
	cloudtrailKey kmskey.KmsKey
}

func (stack *TapStack) createKMSKeys(currentAccount dataawscalleridentity.DataAwsCallerIdentity) *KMSKeys {
	// RDS KMS Key with FIPS 140-3 Level 3 compliance
	rdsKey := kmskey.NewKmsKey(stack, jsii.String("rds-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for RDS encryption with FIPS 140-3 Level 3 compliance"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		KeySpec:     jsii.String("SYMMETRIC_DEFAULT"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow RDS Service",
					"Effect": "Allow",
					"Principal": {
						"Service": "rds.amazonaws.com"
					},
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey",
						"kms:CreateGrant"
					],
					"Resource": "*"
				}
			]
		}`, *currentAccount.AccountId())),
		EnableKeyRotation: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-rds-kms-key"),
			"Purpose":     jsii.String("RDS-Encryption"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("rds-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String("alias/tap-rds-encryption-key"),
		TargetKeyId:  rdsKey.KeyId(),
	})

	// S3 KMS Key
	s3Key := kmskey.NewKmsKey(stack, jsii.String("s3-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for S3 bucket encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		KeySpec:     jsii.String("SYMMETRIC_DEFAULT"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow S3 Service",
					"Effect": "Allow",
					"Principal": {
						"Service": "s3.amazonaws.com"
					},
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey"
					],
					"Resource": "*"
				}
			]
		}`, *currentAccount.AccountId())),
		EnableKeyRotation: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-s3-kms-key"),
			"Purpose":     jsii.String("S3-Encryption"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("s3-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String("alias/tap-s3-encryption-key"),
		TargetKeyId:  s3Key.KeyId(),
	})

	// CloudTrail KMS Key
	cloudtrailKey := kmskey.NewKmsKey(stack, jsii.String("cloudtrail-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for CloudTrail log encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		KeySpec:     jsii.String("SYMMETRIC_DEFAULT"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudTrail to encrypt logs",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`, *currentAccount.AccountId())),
		EnableKeyRotation: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-cloudtrail-kms-key"),
			"Purpose":     jsii.String("CloudTrail-Encryption"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("cloudtrail-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String("alias/tap-cloudtrail-encryption-key"),
		TargetKeyId:  cloudtrailKey.KeyId(),
	})

	return &KMSKeys{
		rdsKey:        rdsKey,
		s3Key:         s3Key,
		cloudtrailKey: cloudtrailKey,
	}
}

type NetworkingResources struct {
	vpc            vpc.Vpc
	publicSubnets  []subnet.Subnet
	privateSubnets []subnet.Subnet
	internetGw     internetgateway.InternetGateway
	natGateways    []natgateway.NatGateway
}

func (stack *TapStack) createNetworking(azs dataawsavailabilityzones.DataAwsAvailabilityZones) *NetworkingResources {
	// Create VPC
	mainVpc := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String(stack.config.VpcCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-main-vpc"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("main-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-main-igw"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Create public subnets (2 AZs)
	var publicSubnets []subnet.Subnet
	var eips []eip.Eip
	var natGateways []natgateway.NatGateway

	for i := 0; i < 2; i++ {
		// Public subnet
		pubSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("public-subnet-%d", i+1)), &subnet.SubnetConfig{
			VpcId:            mainVpc.Id(),
			CidrBlock:        jsii.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone: jsii.String(fmt.Sprintf("%s", *cdktf.Fn_Element(azs.Names(), jsii.Number(i)))),
			MapPublicIpOnLaunch: jsii.Bool(true),
			Tags: &map[string]*string{
				"Name":        jsii.String(fmt.Sprintf("tap-public-subnet-%d", i+1)),
				"Type":        jsii.String("Public"),
				"Environment": jsii.String(stack.config.Environment),
			},
		})
		publicSubnets = append(publicSubnets, pubSubnet)

		// EIP for NAT Gateway
		natEip := eip.NewEip(stack, jsii.String(fmt.Sprintf("nat-eip-%d", i+1)), &eip.EipConfig{
			Domain: jsii.String("vpc"),
			Tags: &map[string]*string{
				"Name":        jsii.String(fmt.Sprintf("tap-nat-eip-%d", i+1)),
				"Environment": jsii.String(stack.config.Environment),
			},
		})
		eips = append(eips, natEip)

		// NAT Gateway
		natGw := natgateway.NewNatGateway(stack, jsii.String(fmt.Sprintf("nat-gw-%d", i+1)), &natgateway.NatGatewayConfig{
			AllocationId: natEip.Id(),
			SubnetId:     pubSubnet.Id(),
			Tags: &map[string]*string{
				"Name":        jsii.String(fmt.Sprintf("tap-nat-gw-%d", i+1)),
				"Environment": jsii.String(stack.config.Environment),
			},
		})
		natGateways = append(natGateways, natGw)
	}

	// Create private subnets (2 AZs)
	var privateSubnets []subnet.Subnet
	for i := 0; i < 2; i++ {
		privSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("private-subnet-%d", i+1)), &subnet.SubnetConfig{
			VpcId:            mainVpc.Id(),
			CidrBlock:        jsii.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
			AvailabilityZone: jsii.String(fmt.Sprintf("%s", *cdktf.Fn_Element(azs.Names(), jsii.Number(i)))),
			Tags: &map[string]*string{
				"Name":        jsii.String(fmt.Sprintf("tap-private-subnet-%d", i+1)),
				"Type":        jsii.String("Private"),
				"Environment": jsii.String(stack.config.Environment),
			},
		})
		privateSubnets = append(privateSubnets, privSubnet)
	}

	// Create route tables
	// Public route table
	publicRt := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-public-rt"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, subnet := range publicSubnets {
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("public-rt-assoc-%d", i+1)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRt.Id(),
		})
	}

	// Private route tables (one per AZ for high availability)
	for i, privSubnet := range privateSubnets {
		privateRt := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("private-rt-%d", i+1)), &routetable.RouteTableConfig{
			VpcId: mainVpc.Id(),
			Tags: &map[string]*string{
				"Name":        jsii.String(fmt.Sprintf("tap-private-rt-%d", i+1)),
				"Environment": jsii.String(stack.config.Environment),
			},
		})

		route.NewRoute(stack, jsii.String(fmt.Sprintf("private-route-%d", i+1)), &route.RouteConfig{
			RouteTableId:         privateRt.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGateways[i].Id(),
		})

		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("private-rt-assoc-%d", i+1)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     privSubnet.Id(),
			RouteTableId: privateRt.Id(),
		})
	}

	return &NetworkingResources{
		vpc:            mainVpc,
		publicSubnets:  publicSubnets,
		privateSubnets: privateSubnets,
		internetGw:     igw,
		natGateways:    natGateways,
	}
}

type SecurityGroups struct {
	webSecurityGroup    securitygroup.SecurityGroup
	appSecurityGroup    securitygroup.SecurityGroup
	rdsSecurityGroup    securitygroup.SecurityGroup
	lambdaSecurityGroup securitygroup.SecurityGroup
}

func (stack *TapStack) createSecurityGroups(vpc vpc.Vpc) *SecurityGroups {
	// Web tier security group - restrictive inbound rules
	webSg := securitygroup.NewSecurityGroup(stack, jsii.String("web-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("tap-web-sg"),
		Description: jsii.String("Security group for web tier with restricted access"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-web-sg"),
			"Tier":        jsii.String("Web"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Allow HTTPS from specific IP ranges only
	for i, ipRange := range stack.config.AllowedIpRanges {
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-https-inbound-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
			Type:              jsii.String("ingress"),
			FromPort:          jsii.Number(443),
			ToPort:            jsii.Number(443),
			Protocol:          jsii.String("tcp"),
			CidrBlocks:        &[]*string{jsii.String(ipRange)},
			SecurityGroupId:   webSg.Id(),
			Description:       jsii.String(fmt.Sprintf("HTTPS access from corporate network %d", i+1)),
		})
	}

	// Application tier security group
	appSg := securitygroup.NewSecurityGroup(stack, jsii.String("app-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("tap-app-sg"),
		Description: jsii.String("Security group for application tier"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-app-sg"),
			"Tier":        jsii.String("Application"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Allow traffic from web tier to app tier
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-from-web"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(8080),
		ToPort:                   jsii.Number(8080),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    webSg.Id(),
		SecurityGroupId:          appSg.Id(),
		Description:              jsii.String("Application access from web tier"),
	})

	// Database security group
	rdsSg := securitygroup.NewSecurityGroup(stack, jsii.String("rds-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("tap-rds-sg"),
		Description: jsii.String("Security group for RDS database"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-rds-sg"),
			"Tier":        jsii.String("Database"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Allow database access from app tier only
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("rds-from-app"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(5432),
		ToPort:                   jsii.Number(5432),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    appSg.Id(),
		SecurityGroupId:          rdsSg.Id(),
		Description:              jsii.String("PostgreSQL access from application tier"),
	})

	// Lambda security group
	lambdaSg := securitygroup.NewSecurityGroup(stack, jsii.String("lambda-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("tap-lambda-sg"),
		Description: jsii.String("Security group for Lambda functions"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-lambda-sg"),
			"Service":     jsii.String("Lambda"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Outbound rules for Lambda (HTTPS only)
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("lambda-https-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: lambdaSg.Id(),
		Description:     jsii.String("HTTPS outbound for Lambda functions"),
	})

	return &SecurityGroups{
		webSecurityGroup:    webSg,
		appSecurityGroup:    appSg,
		rdsSecurityGroup:    rdsSg,
		lambdaSecurityGroup: lambdaSg,
	}
}

type IAMRoles struct {
	lambdaExecutionRole iamrole.IamRole
	cloudtrailRole      iamrole.IamRole
	rdsMonitoringRole   iamrole.IamRole
}

func (stack *TapStack) createIAMRoles(currentAccount dataawscalleridentity.DataAwsCallerIdentity) *IAMRoles {
	// Lambda execution role using AWS managed policies only
	lambdaRole := iamrole.NewIamRole(stack, jsii.String("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: jsii.String("tap-lambda-execution-role"),
		AssumeRolePolicy: jsii.String(`{
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
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-lambda-execution-role"),
			"Service":     jsii.String("Lambda"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Attach AWS managed policies for Lambda
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("lambda-basic-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("lambda-vpc-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
	})

	// CloudTrail service role
	cloudtrailRole := iamrole.NewIamRole(stack, jsii.String("cloudtrail-role"), &iamrole.IamRoleConfig{
		Name: jsii.String("tap-cloudtrail-role"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-cloudtrail-role"),
			"Service":     jsii.String("CloudTrail"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Attach AWS managed policy for CloudTrail
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("cloudtrail-logs-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      cloudtrailRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/CloudTrailLogsRole"),
	})

	// RDS Enhanced Monitoring role
	rdsMonitoringRole := iamrole.NewIamRole(stack, jsii.String("rds-monitoring-role"), &iamrole.IamRoleConfig{
		Name: jsii.String("tap-rds-enhanced-monitoring-role"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "monitoring.rds.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-rds-enhanced-monitoring-role"),
			"Service":     jsii.String("RDS"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Attach AWS managed policy for RDS Enhanced Monitoring
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("rds-enhanced-monitoring"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      rdsMonitoringRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"),
	})

		return &IAMRoles{
		lambdaExecutionRole: lambdaRole,
		cloudtrailRole:      cloudtrailRole,
		rdsMonitoringRole:   rdsMonitoringRole,
	}
}

type S3Resources struct {
	applicationBucket s3bucket.S3Bucket
	cloudtrailBucket  s3bucket.S3Bucket
	logsBucket        s3bucket.S3Bucket
}

func (stack *TapStack) createS3Resources(s3Key kmskey.KmsKey, currentAccount dataawscalleridentity.DataAwsCallerIdentity) *S3Resources {
	// Application data bucket
	appBucket := s3bucket.NewS3Bucket(stack, jsii.String("app-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-app-data-%s-%s", stack.config.Environment, *currentAccount.AccountId())),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-application-data-bucket"),
			"Purpose":     jsii.String("Application-Data"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Block all public access
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("app-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                appBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Enable versioning
	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("app-bucket-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: appBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Server-side encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("app-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: appBucket.Id(),
		Rule: &[]*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					KmsMasterKeyId: s3Key.Arn(),
					SseAlgorithm:   jsii.String("aws:kms"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// CloudTrail bucket
	cloudtrailBucket := s3bucket.NewS3Bucket(stack, jsii.String("cloudtrail-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s-%s", stack.config.Environment, *currentAccount.AccountId())),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-cloudtrail-logs-bucket"),
			"Purpose":     jsii.String("CloudTrail-Logs"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Block all public access for CloudTrail bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("cloudtrail-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                cloudtrailBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// CloudTrail bucket policy
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("cloudtrail-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: cloudtrailBucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AWSCloudTrailAclCheck",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:GetBucketAcl",
					"Resource": "%s"
				},
				{
					"Sid": "AWSCloudTrailWrite",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:PutObject",
					"Resource": "%s/*",
					"Condition": {
						"StringEquals": {
							"s3:x-amz-acl": "bucket-owner-full-control"
						}
					}
				}
			]
		}`, *cloudtrailBucket.Arn(), *cloudtrailBucket.Arn())),
	})

	// Logs bucket for application logs
	logsBucket := s3bucket.NewS3Bucket(stack, jsii.String("logs-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-application-logs-%s-%s", stack.config.Environment, *currentAccount.AccountId())),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-application-logs-bucket"),
			"Purpose":     jsii.String("Application-Logs"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Block all public access for logs bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("logs-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                logsBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	return &S3Resources{
		applicationBucket: appBucket,
		cloudtrailBucket:  cloudtrailBucket,
		logsBucket:        logsBucket,
	}
}

func (stack *TapStack) createRDSResources(networking *NetworkingResources, rdsSg securitygroup.SecurityGroup, rdsKey kmskey.KmsKey) {
	// Create DB subnet group
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("rds-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:       jsii.String("tap-rds-subnet-group"),
		SubnetIds:  &[]*string{networking.privateSubnets[0].Id(), networking.privateSubnets[1].Id()},
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-rds-subnet-group"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// Create RDS instance with encryption and security best practices
	dbinstance.NewDbInstance(stack, jsii.String("main-database"), &dbinstance.DbInstanceConfig{
		Identifier:     jsii.String("tap-main-database"),
		AllocatedStorage: jsii.Number(100),
		MaxAllocatedStorage: jsii.Number(1000),
		StorageType:    jsii.String("gp3"),
		StorageEncrypted: jsii.Bool(true),
		KmsKeyId:       rdsKey.Arn(),
		Engine:         jsii.String("postgres"),
		EngineVersion:  jsii.String("15.4"),
		InstanceClass:  jsii.String("db.t3.medium"),
		DbName:         jsii.String("tapdb"),
		Username:       jsii.String("dbadmin"),
		ManageMainUserPassword: jsii.Bool(true), // AWS manages password in Secrets Manager
		DbSubnetGroupName: dbSubnetGroup.Name(),
		VpcSecurityGroupIds: &[]*string{rdsSg.Id()},
		BackupRetentionPeriod: jsii.Number(30),
		BackupWindow:          jsii.String("03:00-04:00"),
		MaintenanceWindow:     jsii.String("sun:04:00-sun:05:00"),
		MultiAz:               jsii.Bool(true),
		PubliclyAccessible:    jsii.Bool(false),
		DeletionProtection:    jsii.Bool(true),
		EnabledCloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		MonitoringInterval: jsii.Number(60),
		MonitoringRoleArn:  jsii.String("arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/tap-rds-enhanced-monitoring-role"),
		PerformanceInsightsEnabled: jsii.Bool(true),
		PerformanceInsightsKmsKeyId: rdsKey.Arn(),
		PerformanceInsightsRetentionPeriod: jsii.Number(7),
		CaCertIdentifier: jsii.String("rds-ca-rsa2048-g1"),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-main-database"),
			"Environment": jsii.String(stack.config.Environment),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})
}

func (stack *TapStack) createLoggingInfrastructure(cloudtrailBucket s3bucket.S3Bucket, cloudtrailKey kmskey.KmsKey, cloudtrailRole iamrole.IamRole) {
	// CloudWatch Log Group for Lambda functions
	lambdaLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("lambda-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String("/aws/lambda/tap-functions"),
		RetentionInDays: jsii.Number(30),
		KmsKeyId:        cloudtrailKey.Arn(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-lambda-log-group"),
			"Service":     jsii.String("Lambda"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("cloudtrail-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String("/aws/cloudtrail/tap-audit-logs"),
		RetentionInDays: jsii.Number(365), // Keep audit logs for 1 year
		KmsKeyId:        cloudtrailKey.Arn(),
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-cloudtrail-log-group"),
			"Service":     jsii.String("CloudTrail"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})

	// CloudTrail for comprehensive audit logging
	cloudtrail.NewCloudtrail(stack, jsii.String("main-cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                         jsii.String("tap-main-audit-trail"),
		S3BucketName:                 cloudtrailBucket.Id(),
		S3KeyPrefix:                  jsii.String("cloudtrail-logs"),
		IncludeGlobalServiceEvents:   jsii.Bool(true),
		IsMultiRegionTrail:           jsii.Bool(true),
		EnableLogging:                jsii.Bool(true),
		EnableLogFileValidation:      jsii.Bool(true),
		KmsKeyId:                     cloudtrailKey.Arn(),
		CloudWatchLogsGroupArn:       jsii.String(fmt.Sprintf("%s:*", *cloudtrailLogGroup.Arn())),
		CloudWatchLogsRoleArn:        cloudtrailRole.Arn(),
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:                 jsii.String("All"),
				IncludeManagementEvents:       jsii.Bool(true),
				ExcludeManagementEventSources: &[]*string{},
				DataResource: &[]*cloudtrail.CloudtrailEventSelectorDataResource{
					{
						Type:   jsii.String("AWS::S3::Object"),
						Values: &[]*string{jsii.String("arn:aws:s3:::*/*")},
					},
					{
						Type:   jsii.String("AWS::Lambda::Function"),
						Values: &[]*string{jsii.String("*")},
					},
				},
			},
		},
		InsightSelector: &[]*cloudtrail.CloudtrailInsightSelector{
			{
				InsightType: jsii.String("ApiCallRateInsight"),
			},
			{
				InsightType: jsii.String("ApiErrorRateInsight"),
			},
		},
		Tags: &map[string]*string{
			"Name":        jsii.String("tap-main-audit-trail"),
			"Purpose":     jsii.String("Compliance-Auditing"),
			"Environment": jsii.String(stack.config.Environment),
		},
	})
}

func (stack *TapStack) enableSecurityHub() {
	// Enable Security Hub
	securityhubaccount.NewSecurityhubAccount(stack, jsii.String("security-hub"), &securityhubaccount.SecurityhubAccountConfig{
		EnableDefaultStandards: jsii.Bool(false), // We'll enable specific standards
	})

	// Subscribe to AWS Foundational Security Standard
	securityhubstandardssubscription.NewSecurityhubStandardsSubscription(stack, jsii.String("foundational-standard"), &securityhubstandardssubscription.SecurityhubStandardsSubscriptionConfig{
		StandardsArn: jsii.String("arn:aws:securityhub:::ruleset/finding-format/aws-foundational-security-standard/v/1.0.0"),
		DisabledStandardsControls: &[]*securityhubstandardssubscription.SecurityhubStandardsSubscriptionDisabledStandardsControls{},
	})

	// Subscribe to CIS AWS Foundations Benchmark
	securityhubstandardssubscription.NewSecurityhubStandardsSubscription(stack, jsii.String("cis-standard"), &securityhubstandardssubscription.SecurityhubStandardsSubscriptionConfig{
		StandardsArn: jsii.String("arn:aws:securityhub:::ruleset/finding-format/cis-aws-foundations-benchmark/v/1.2.0"),
		DisabledStandardsControls: &[]*securityhubstandardssubscription.SecurityhubStandardsSubscriptionDisabledStandardsControls{},
	})

	// Subscribe to PCI DSS Standard
	securityhubstandardssubscription.NewSecurityhubStandardsSubscription(stack, jsii.String("pci-standard"), &securityhubstandardssubscription.SecurityhubStandardsSubscriptionConfig{
		StandardsArn: jsii.String("arn:aws:securityhub:::ruleset/finding-format/pci-dss/v/3.2.1"),
		DisabledStandardsControls: &[]*securityhubstandardssubscription.SecurityhubStandardsSubscriptionDisabledStandardsControls{},
	})

	// Subscribe to NIST Cybersecurity Framework
	securityhubstandardssubscription.NewSecurityhubStandardsSubscription(stack, jsii.String("nist-standard"), &securityhubstandardssubscription.SecurityhubStandardsSubscriptionConfig{
		StandardsArn: jsii.String("arn:aws:securityhub:::ruleset/finding-format/nist-csf/v/1.0.0"),
		DisabledStandardsControls: &[]*securityhubstandardssubscription.SecurityhubStandardsSubscriptionDisabledStandardsControls{},
	})
}