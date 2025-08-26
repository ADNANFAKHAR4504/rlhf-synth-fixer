package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
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
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackConfig struct {
	Region          *string
	Environment     *string
	Project         *string
	Owner           *string
	CostCenter      *string
	VpcCidr         *string
	AllowedIpRanges []*string
}

func NewTapStack(scope cdktf.App, id *string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, id)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}
	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	// AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: config.Region,
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": config.Environment,
					"Project":     config.Project,
					"Owner":       config.Owner,
					"CostCenter":  config.CostCenter,
					"ManagedBy":   jsii.String("cdktf"),
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
		Key:     jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", environmentSuffix, environmentSuffix)),
		Region:  jsii.String(stateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// Get current AWS account and region information
	currentAccount := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// RDS KMS Key with FIPS 140-3 Level 3 compliance
	rdsKmsKey := kmskey.NewKmsKey(stack, jsii.String("rds-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for RDS encryption with FIPS 140-3 Level 3 compliance"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		// Remove KeySpec field - not available in this version
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
			"Name":        jsii.String(fmt.Sprintf("tap-rds-kms-key-%s", environmentSuffix)),
			"Purpose":     jsii.String("RDS-Encryption"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
			"Environment": config.Environment,
		},
	})

	rdsKmsAlias := kmsalias.NewKmsAlias(stack, jsii.String("rds-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-rds-encryption-key-%s", environmentSuffix)),
		TargetKeyId: rdsKmsKey.KeyId(),
	})

	// S3 KMS Key
	s3KmsKey := kmskey.NewKmsKey(stack, jsii.String("s3-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for S3 bucket encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		// Remove KeySpec field
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
			"Name":        jsii.String(fmt.Sprintf("tap-s3-kms-key-%s", environmentSuffix)),
			"Purpose":     jsii.String("S3-Encryption"),
			"Environment": config.Environment,
		},
	})

	s3KmsAlias := kmsalias.NewKmsAlias(stack, jsii.String("s3-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-s3-encryption-key-%s", environmentSuffix)),
		TargetKeyId: s3KmsKey.KeyId(),
	})

	// CloudTrail KMS Key
	cloudtrailKmsKey := kmskey.NewKmsKey(stack, jsii.String("cloudtrail-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for CloudTrail log encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
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
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:us-west-2:%s:trail/tap-main-trail-%s"
						}
					}
				},
				{
					"Sid": "Allow CloudWatch Logs",
					"Effect": "Allow",
					"Principal": {
						"Service": "logs.us-west-2.amazonaws.com"
					},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`, *currentAccount.AccountId(), *currentAccount.AccountId(), environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-cloudtrail-kms-key-%s", environmentSuffix)),
			"Purpose":     jsii.String("CloudTrail-Encryption"),
			"Environment": config.Environment,
		},
	})

	cloudtrailKmsAlias := kmsalias.NewKmsAlias(stack, jsii.String("cloudtrail-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-cloudtrail-encryption-key-%s", environmentSuffix)),
		TargetKeyId: cloudtrailKmsKey.KeyId(),
	})

	// VPC
	mainVpc := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          config.VpcCidr,
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-main-vpc-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("main-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-main-igw-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Public Subnet 1
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(0)).(string)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-subnet-1-%s", environmentSuffix)),
			"Type":        jsii.String("Public"),
			"Environment": config.Environment,
		},
	})

	// Public Subnet 2
	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(1)).(string)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-subnet-2-%s", environmentSuffix)),
			"Type":        jsii.String("Public"),
			"Environment": config.Environment,
		},
	})

	// Private Subnet 1
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.10.0/24"),
		AvailabilityZone: jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(0)).(string)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-subnet-1-%s", environmentSuffix)),
			"Type":        jsii.String("Private"),
			"Environment": config.Environment,
		},
	})

	// Private Subnet 2
	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.11.0/24"),
		AvailabilityZone: jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(1)).(string)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-subnet-2-%s", environmentSuffix)),
			"Type":        jsii.String("Private"),
			"Environment": config.Environment,
		},
	})

	// EIP for NAT Gateway 1
	natEip1 := eip.NewEip(stack, jsii.String("nat-eip-1"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-eip-1-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// EIP for NAT Gateway 2
	natEip2 := eip.NewEip(stack, jsii.String("nat-eip-2"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-eip-2-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// NAT Gateway 1
	natGw1 := natgateway.NewNatGateway(stack, jsii.String("nat-gw-1"), &natgateway.NatGatewayConfig{
		AllocationId: natEip1.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-gw-1-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// NAT Gateway 2
	natGw2 := natgateway.NewNatGateway(stack, jsii.String("nat-gw-2"), &natgateway.NatGatewayConfig{
		AllocationId: natEip2.Id(),
		SubnetId:     publicSubnet2.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-gw-2-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Public Route Table
	publicRt := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-rt-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Public Route
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rt-assoc-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rt-assoc-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRt.Id(),
	})

	// Private Route Table 1
	privateRt1 := routetable.NewRouteTable(stack, jsii.String("private-rt-1"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-rt-1-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Private Route 1
	route.NewRoute(stack, jsii.String("private-route-1"), &route.RouteConfig{
		RouteTableId:         privateRt1.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw1.Id(),
	})

	// Private Route Table 2
	privateRt2 := routetable.NewRouteTable(stack, jsii.String("private-rt-2"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-rt-2-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// Private Route 2
	route.NewRoute(stack, jsii.String("private-route-2"), &route.RouteConfig{
		RouteTableId:         privateRt2.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw2.Id(),
	})

	// Associate private subnets with private route tables
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rt-assoc-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRt1.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rt-assoc-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRt2.Id(),
	})

	// Web tier security group - restrictive inbound rules
	webSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("web-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-web-sg-%s", environmentSuffix)),
		Description: jsii.String("Security group for web tier with restricted access"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-web-sg-%s", environmentSuffix)),
			"Tier":        jsii.String("Web"),
			"Environment": config.Environment,
		},
	})

	// Allow HTTPS from specific IP ranges only
	for i, ipRange := range config.AllowedIpRanges {
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-https-inbound-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(443),
			ToPort:          jsii.Number(443),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{ipRange},
			SecurityGroupId: webSecurityGroup.Id(),
			Description:     jsii.String(fmt.Sprintf("HTTPS access from corporate network %d", i+1)),
		})
	}

	// Application tier security group
	appSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("app-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-app-sg-%s", environmentSuffix)),
		Description: jsii.String("Security group for application tier"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-app-sg-%s", environmentSuffix)),
			"Tier":        jsii.String("Application"),
			"Environment": config.Environment,
		},
	})

	// Allow traffic from web tier to app tier
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-from-web"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(8080),
		ToPort:                jsii.Number(8080),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: webSecurityGroup.Id(),
		SecurityGroupId:       appSecurityGroup.Id(),
		Description:           jsii.String("Application access from web tier"),
	})

	// Database security group
	dbSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("rds-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-rds-sg-%s", environmentSuffix)),
		Description: jsii.String("Security group for RDS database"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-rds-sg-%s", environmentSuffix)),
			"Tier":        jsii.String("Database"),
			"Environment": config.Environment,
		},
	})

	// Allow database access from app tier only
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("rds-from-app"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(5432),
		ToPort:                jsii.Number(5432),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: appSecurityGroup.Id(),
		SecurityGroupId:       dbSecurityGroup.Id(),
		Description:           jsii.String("PostgreSQL access from application tier"),
	})

	// Lambda security group
	lambdaSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("lambda-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-lambda-sg-%s", environmentSuffix)),
		Description: jsii.String("Security group for Lambda functions"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-lambda-sg-%s", environmentSuffix)),
			"Service":     jsii.String("Lambda"),
			"Environment": config.Environment,
		},
	})

	// Outbound rules for Lambda (HTTPS only)
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("lambda-https-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: lambdaSecurityGroup.Id(),
		Description:     jsii.String("HTTPS outbound for Lambda functions"),
	})

	// Lambda execution role using AWS managed policies only
	lambdaRole := iamrole.NewIamRole(stack, jsii.String("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("tap-lambda-execution-role-%s", environmentSuffix)),
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
			"Name":        jsii.String(fmt.Sprintf("tap-lambda-execution-role-%s", environmentSuffix)),
			"Service":     jsii.String("Lambda"),
			"Environment": config.Environment,
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
		Name: jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", environmentSuffix)),
		AssumeRolePolicy: jsii.String(`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": [
                        "cloudtrail.amazonaws.com",
                        "logs.amazonaws.com"
                    ]
                }
            }
        ]
    }`),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", environmentSuffix)),
			"Service":     jsii.String("CloudTrail"),
			"Environment": config.Environment,
		},
	})

	// Attach AWS managed policy for CloudTrail
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("cloudtrail-logs-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      cloudtrailRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"),
	})

	// S3 Bucket for application data
	appDataBucket := s3bucket.NewS3Bucket(stack, jsii.String("app-data-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-app-data-bucket-%s", environmentSuffix)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-app-data-bucket-%s", environmentSuffix)),
			"Purpose":     jsii.String("Application-Data"),
			"Environment": config.Environment,
		},
	})

	// Block all public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("app-data-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*appDataBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// S3 bucket policy to deny unencrypted uploads
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("app-data-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: jsii.String(*appDataBucket.Id()),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyUnencryptedObjectUploads",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:PutObject",
				"Resource": "arn:aws:s3:::%s/*",
				"Condition": {
					"StringNotEquals": {
						"s3:x-amz-server-side-encryption": "aws:kms"
					}
				}
			},
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
	}`, *appDataBucket.Id(), *appDataBucket.Id(), *appDataBucket.Id())),
	})

	// CloudTrail S3 bucket
	cloudtrailBucket := s3bucket.NewS3Bucket(stack, jsii.String("cloudtrail-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s", environmentSuffix)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s", environmentSuffix)),
			"Purpose":     jsii.String("CloudTrail-Logs"),
			"Environment": config.Environment,
		},
	})

	// Block all public access to CloudTrail bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("cloudtrail-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*cloudtrailBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// CloudTrail bucket policy
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("cloudtrail-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: jsii.String(*cloudtrailBucket.Id()),
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
				"Resource": "arn:aws:s3:::%s"
			},
			{
				"Sid": "AWSCloudTrailWrite",
				"Effect": "Allow",
				"Principal": {
					"Service": "cloudtrail.amazonaws.com"
				},
				"Action": "s3:PutObject",
				"Resource": "arn:aws:s3:::%s/*",
				"Condition": {
					"StringEquals": {
						"s3:x-amz-acl": "bucket-owner-full-control"
					}
				}
			}
		]
	}`, *cloudtrailBucket.Id(), *cloudtrailBucket.Id())),
	})

	// DB Subnet Group for RDS
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:      jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", environmentSuffix)),
		SubnetIds: &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// RDS PostgreSQL instance with encryption
	rdsInstance := dbinstance.NewDbInstance(stack, jsii.String("postgres-db"), &dbinstance.DbInstanceConfig{
		Identifier:            jsii.String(fmt.Sprintf("tap-postgres-db-%s", environmentSuffix)),
		Engine:                jsii.String("postgres"),
		InstanceClass:         jsii.String("db.t3.micro"),
		AllocatedStorage:      jsii.Number(20),
		StorageType:           jsii.String("gp3"),
		StorageEncrypted:      jsii.Bool(true),
		KmsKeyId:              rdsKmsKey.Arn(),
		DbName:                jsii.String("tapdb"),
		Username:              jsii.String("dbadmin"),
		Password:              jsii.String("changeme123!"),
		DbSubnetGroupName:     dbSubnetGroup.Name(),
		VpcSecurityGroupIds:   &[]*string{dbSecurityGroup.Id()},
		BackupRetentionPeriod: jsii.Number(7),
		BackupWindow:          jsii.String("03:00-04:00"),
		MaintenanceWindow:     jsii.String("sun:04:00-sun:05:00"),
		MultiAz:               jsii.Bool(true),
		PubliclyAccessible:    jsii.Bool(false),
		MonitoringInterval:    jsii.Number(0),
		EnabledCloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		DeletionProtection: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-postgres-db-%s", environmentSuffix)),
			"Environment": config.Environment,
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("cloudtrail-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/cloudtrail/tap-trail-%s", environmentSuffix)),
		RetentionInDays: jsii.Number(90),
		KmsKeyId:        cloudtrailKmsKey.Arn(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
	})

	// CloudTrail for comprehensive logging
	cloudtrailTrail := cloudtrail.NewCloudtrail(stack, jsii.String("main-cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                       jsii.String(fmt.Sprintf("tap-main-trail-%s", environmentSuffix)),
		S3BucketName:               cloudtrailBucket.Id(),
		S3KeyPrefix:                jsii.String("cloudtrail-logs/"),
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableLogging:              jsii.Bool(true),
		EnableLogFileValidation:    jsii.Bool(true),
		KmsKeyId:                   cloudtrailKmsKey.Arn(),
		CloudWatchLogsGroupArn:     jsii.String(fmt.Sprintf("%s:*", *cloudtrailLogGroup.Arn())),
		CloudWatchLogsRoleArn:      cloudtrailRole.Arn(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-main-trail-%s", environmentSuffix)),
			"Environment": config.Environment,
		},
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:           jsii.String("All"),
				IncludeManagementEvents: jsii.Bool(true),
				ExcludeManagementEventSources: &[]*string{
					jsii.String("kms.amazonaws.com"),
					jsii.String("rdsdata.amazonaws.com"),
				},
				DataResource: &[]*cloudtrail.CloudtrailEventSelectorDataResource{
					{
						Type:   jsii.String("AWS::S3::Object"),
						Values: &[]*string{jsii.String(fmt.Sprintf("%s/*", *appDataBucket.Arn()))},
					},
				},
			},
		},
	})

	// Output Variables for main components
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       mainVpc.Id(),
		Description: jsii.String("ID of the main VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("vpc_cidr_block"), &cdktf.TerraformOutputConfig{
		Value:       mainVpc.CidrBlock(),
		Description: jsii.String("CIDR block of the main VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Jsonencode(&[]*string{publicSubnet1.Id(), publicSubnet2.Id()}),
		Description: jsii.String("IDs of the public subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Jsonencode(&[]*string{privateSubnet1.Id(), privateSubnet2.Id()}),
		Description: jsii.String("IDs of the private subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("internet_gateway_id"), &cdktf.TerraformOutputConfig{
		Value:       igw.Id(),
		Description: jsii.String("ID of the Internet Gateway"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("nat_gateway_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Jsonencode(&[]*string{natGw1.Id(), natGw2.Id()}),
		Description: jsii.String("IDs of the NAT Gateways"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("web_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       webSecurityGroup.Id(),
		Description: jsii.String("ID of the web tier security group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("app_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       appSecurityGroup.Id(),
		Description: jsii.String("ID of the application tier security group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("db_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       dbSecurityGroup.Id(),
		Description: jsii.String("ID of the database security group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("lambda_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       lambdaSecurityGroup.Id(),
		Description: jsii.String("ID of the Lambda security group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       rdsKmsKey.KeyId(),
		Description: jsii.String("ID of the RDS KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_kms_key_arn"), &cdktf.TerraformOutputConfig{
		Value:       rdsKmsKey.Arn(),
		Description: jsii.String("ARN of the RDS KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_kms_alias_name"), &cdktf.TerraformOutputConfig{
		Value:       rdsKmsAlias.Name(),
		Description: jsii.String("Name of the RDS KMS key alias"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       s3KmsKey.KeyId(),
		Description: jsii.String("ID of the S3 KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_kms_key_arn"), &cdktf.TerraformOutputConfig{
		Value:       s3KmsKey.Arn(),
		Description: jsii.String("ARN of the S3 KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_kms_alias_name"), &cdktf.TerraformOutputConfig{
		Value:       s3KmsAlias.Name(),
		Description: jsii.String("Name of the S3 KMS key alias"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailKmsKey.KeyId(),
		Description: jsii.String("ID of the CloudTrail KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_kms_key_arn"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailKmsKey.Arn(),
		Description: jsii.String("ARN of the CloudTrail KMS encryption key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_kms_alias_name"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailKmsAlias.Name(),
		Description: jsii.String("Name of the CloudTrail KMS key alias"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("app_data_bucket_id"), &cdktf.TerraformOutputConfig{
		Value:       appDataBucket.Id(),
		Description: jsii.String("ID of the application data S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("app_data_bucket_arn"), &cdktf.TerraformOutputConfig{
		Value:       appDataBucket.Arn(),
		Description: jsii.String("ARN of the application data S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_bucket_id"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailBucket.Id(),
		Description: jsii.String("ID of the CloudTrail S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_bucket_arn"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailBucket.Arn(),
		Description: jsii.String("ARN of the CloudTrail S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_instance_id"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Id(),
		Description: jsii.String("ID of the RDS PostgreSQL instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_instance_arn"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Arn(),
		Description: jsii.String("ARN of the RDS PostgreSQL instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_instance_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Endpoint(),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(true),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_instance_port"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Port(),
		Description: jsii.String("RDS instance port"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("lambda_execution_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       lambdaRole.Arn(),
		Description: jsii.String("ARN of the Lambda execution role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailRole.Arn(),
		Description: jsii.String("ARN of the CloudTrail role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_trail_arn"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailTrail.Arn(),
		Description: jsii.String("ARN of the CloudTrail trail"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_log_group_arn"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailLogGroup.Arn(),
		Description: jsii.String("ARN of the CloudTrail log group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("db_subnet_group_name"), &cdktf.TerraformOutputConfig{
		Value:       dbSubnetGroup.Name(),
		Description: jsii.String("Name of the database subnet group"),
	})

	return stack
}
