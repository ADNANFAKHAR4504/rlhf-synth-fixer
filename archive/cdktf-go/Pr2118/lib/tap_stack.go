package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
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
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securityhubaccount"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackConfig struct {
	Region      *string
	Environment *string
	Project     *string
	Owner       *string
	CostCenter  *string
}

func NewTapStack(scope cdktf.App, id *string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, id)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr961"
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

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("security-kms-key"), &kmskey.KmsKeyConfig{
		Description:           jsii.String("KMS key for security infrastructure encryption"),
		KeyUsage:              jsii.String("ENCRYPT_DECRYPT"),
		CustomerMasterKeySpec: jsii.String("SYMMETRIC_DEFAULT"),
		MultiRegion:           jsii.Bool(true),
		EnableKeyRotation:     jsii.Bool(true),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM policies",
					"Effect": "Allow",
					"Principal": {
						"AWS": "*"
					},
					"Action": "kms:*",
					"Resource": "*"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-infrastructure-kms-key-%s", environmentSuffix)),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("security-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/security-infrastructure-%s", environmentSuffix)),
		TargetKeyId: kmsKey.KeyId(),
	})

	// VPC
	mainVpc := vpc.NewVpc(stack, jsii.String("security-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-vpc-%s", environmentSuffix)),
		},
	})

	// Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("security-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-igw-%s", environmentSuffix)),
		},
	})

	// Public Subnets
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String(*cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(0)), nil)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("public-subnet-1-%s", environmentSuffix)),
			"Type": jsii.String("public"),
		},
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    jsii.String(*cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(1)), nil)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("public-subnet-2-%s", environmentSuffix)),
			"Type": jsii.String("public"),
		},
	})

	// Private Subnets
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.11.0/24"),
		AvailabilityZone: jsii.String(*cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(0)), nil)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("private-subnet-1-%s", environmentSuffix)),
			"Type": jsii.String("private"),
		},
	})

	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.12.0/24"),
		AvailabilityZone: jsii.String(*cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(1)), nil)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("private-subnet-2-%s", environmentSuffix)),
			"Type": jsii.String("private"),
		},
	})

	// NAT Gateway EIPs
	natEip1 := eip.NewEip(stack, jsii.String("nat-eip-1"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("nat-eip-1-%s", environmentSuffix)),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	natEip2 := eip.NewEip(stack, jsii.String("nat-eip-2"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("nat-eip-2-%s", environmentSuffix)),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	// NAT Gateways
	natGw1 := natgateway.NewNatGateway(stack, jsii.String("nat-gateway-1"), &natgateway.NatGatewayConfig{
		AllocationId: natEip1.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("nat-gateway-1-%s", environmentSuffix)),
		},
	})

	natGw2 := natgateway.NewNatGateway(stack, jsii.String("nat-gateway-2"), &natgateway.NatGatewayConfig{
		AllocationId: natEip2.Id(),
		SubnetId:     publicSubnet2.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("nat-gateway-2-%s", environmentSuffix)),
		},
	})

	// Route Tables
	publicRt := routetable.NewRouteTable(stack, jsii.String("public-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("public-route-table-%s", environmentSuffix)),
		},
	})

	privateRt1 := routetable.NewRouteTable(stack, jsii.String("private-route-table-1"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("private-route-table-1-%s", environmentSuffix)),
		},
	})

	privateRt2 := routetable.NewRouteTable(stack, jsii.String("private-route-table-2"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("private-route-table-2-%s", environmentSuffix)),
		},
	})

	// Routes
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	route.NewRoute(stack, jsii.String("private-route-1"), &route.RouteConfig{
		RouteTableId:         privateRt1.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw1.Id(),
	})

	route.NewRoute(stack, jsii.String("private-route-2"), &route.RouteConfig{
		RouteTableId:         privateRt2.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw2.Id(),
	})

	// Route Table Associations
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rta-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rta-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rta-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRt1.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rta-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRt2.Id(),
	})

	// Security Groups
	webSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("web-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("web-security-group-%s", environmentSuffix)),
		Description: jsii.String("Security group for web tier"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("web-security-group-%s", environmentSuffix)),
		},
	})

	// Security Group Rules for Web Tier (restrictive IP ranges)
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("web-ingress-http"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("ingress"),
		FromPort:        jsii.Number(80),
		ToPort:          jsii.Number(80),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("10.0.0.0/8")}, // Restricted to private networks
		SecurityGroupId: webSecurityGroup.Id(),
		Description:     jsii.String("HTTP access from private networks only"),
	})

	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("web-ingress-https"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("ingress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("10.0.0.0/8")}, // Restricted to private networks
		SecurityGroupId: webSecurityGroup.Id(),
		Description:     jsii.String("HTTPS access from private networks only"),
	})

	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("web-egress-all"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(0),
		ToPort:          jsii.Number(65535),
		Protocol:        jsii.String("-1"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: webSecurityGroup.Id(),
		Description:     jsii.String("All outbound traffic"),
	})

	appSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("app-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("app-security-group-%s", environmentSuffix)),
		Description: jsii.String("Security group for application tier"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("app-security-group-%s", environmentSuffix)),
		},
	})

	dbSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("db-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("db-security-group-%s", environmentSuffix)),
		Description: jsii.String("Security group for database tier"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("db-security-group-%s", environmentSuffix)),
		},
	})

	// Database Security Group Rules
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("db-ingress-postgres"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(5432),
		ToPort:                jsii.Number(5432),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: appSecurityGroup.Id(),
		SecurityGroupId:       dbSecurityGroup.Id(),
		Description:           jsii.String("PostgreSQL access from application tier only"),
	})

	// IAM Roles
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("EC2SecurityRole-%s", environmentSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "ec2.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("EC2SecurityRole-%s", environmentSuffix)),
		},
	})

	// IAM Policy for EC2 (least privilege)
	ec2Policy := iampolicy.NewIamPolicy(stack, jsii.String("ec2-policy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String(fmt.Sprintf("EC2SecurityPolicy-%s", environmentSuffix)),
		Description: jsii.String("Least privilege policy for EC2 instances"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:*:*:*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetObject"
					],
					"Resource": "arn:aws:s3:::*secure-data*/*"
				}
			]
		}`),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("ec2-policy-attachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: ec2Policy.Arn(),
	})

	// S3 Bucket with secure naming and encryption
	secureDataBucket := s3bucket.NewS3Bucket(stack, jsii.String("secure-data-bucket"), &s3bucket.S3BucketConfig{
		Bucket:       jsii.String(fmt.Sprintf("secure-data-%s-%s-primary", *config.Environment, environmentSuffix)),
		ForceDestroy: jsii.Bool(true), // Allow cleanup
		Tags: &map[string]*string{
			"Name":           jsii.String("secure-data-primary"),
			"Classification": jsii.String("confidential"),
		},
	})

	// Enable versioning on the secure data bucket
	s3bucketversioning.NewS3BucketVersioningA(stack, jsii.String("secure-data-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: secureDataBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// S3 Bucket Encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("secure-data-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: secureDataBucket.Id(),
		Rule: &[]s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn(),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// S3 Bucket Policy
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("secure-data-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: secureDataBucket.Id(),
		Policy: cdktf.Fn_Jsonencode(&map[string]interface{}{
			"Version": "2012-10-17",
			"Statement": []interface{}{
				map[string]interface{}{
					"Sid":       "DenyInsecureConnections",
					"Effect":    "Deny",
					"Principal": "*",
					"Action":    "s3:*",
					"Resource": []interface{}{
						secureDataBucket.Arn(),
						cdktf.Fn_Join(jsii.String(""), &[]*string{secureDataBucket.Arn(), jsii.String("/*")}),
					},
					"Condition": map[string]interface{}{
						"Bool": map[string]interface{}{
							"aws:SecureTransport": "false",
						},
					},
				},
				map[string]interface{}{
					"Sid":       "DenyUnencryptedUploads",
					"Effect":    "Deny",
					"Principal": "*",
					"Action":    "s3:PutObject",
					"Resource":  cdktf.Fn_Join(jsii.String(""), &[]*string{secureDataBucket.Arn(), jsii.String("/*")}),
					"Condition": map[string]interface{}{
						"StringNotEquals": map[string]interface{}{
							"s3:x-amz-server-side-encryption": "aws:kms",
						},
					},
				},
			},
		}),
	})

	// CloudTrail S3 Bucket for logs
	cloudtrailBucket := s3bucket.NewS3Bucket(stack, jsii.String("cloudtrail-logs-bucket"), &s3bucket.S3BucketConfig{
		Bucket:       jsii.String(fmt.Sprintf("secure-data-cloudtrail-%s-%s", *config.Environment, environmentSuffix)),
		ForceDestroy: jsii.Bool(true), // Allow cleanup
		Tags: &map[string]*string{
			"Name":    jsii.String("cloudtrail-logs"),
			"Purpose": jsii.String("audit-logging"),
		},
	})

	// CloudTrail bucket policy
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("cloudtrail-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: cloudtrailBucket.Id(),
		Policy: cdktf.Fn_Jsonencode(&map[string]interface{}{
			"Version": "2012-10-17",
			"Statement": []interface{}{
				map[string]interface{}{
					"Sid":    "AWSCloudTrailAclCheck",
					"Effect": "Allow",
					"Principal": map[string]interface{}{
						"Service": "cloudtrail.amazonaws.com",
					},
					"Action":   "s3:GetBucketAcl",
					"Resource": cloudtrailBucket.Arn(),
				},
				map[string]interface{}{
					"Sid":    "AWSCloudTrailWrite",
					"Effect": "Allow",
					"Principal": map[string]interface{}{
						"Service": "cloudtrail.amazonaws.com",
					},
					"Action":   "s3:PutObject",
					"Resource": cdktf.Fn_Join(jsii.String(""), &[]*string{cloudtrailBucket.Arn(), jsii.String("/*")}),
					"Condition": map[string]interface{}{
						"StringEquals": map[string]interface{}{
							"s3:x-amz-acl": "bucket-owner-full-control",
						},
					},
				},
			},
		}),
	})

	// CloudTrail
	cloudtrail.NewCloudtrail(stack, jsii.String("security-cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                       jsii.String(fmt.Sprintf("security-audit-trail-%s", environmentSuffix)),
		S3BucketName:               cloudtrailBucket.Id(),
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableLogFileValidation:    jsii.Bool(true),
		KmsKeyId:                   kmsKey.Arn(),
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:           jsii.String("All"),
				IncludeManagementEvents: jsii.Bool(true),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-audit-trail-%s", environmentSuffix)),
		},
	})

	// Security Hub in primary region (us-west-2)
	securityhubaccount.NewSecurityhubAccount(stack, jsii.String("security-hub"), &securityhubaccount.SecurityhubAccountConfig{
		EnableDefaultStandards: jsii.Bool(true),
	})

	// AWS Provider for us-east-1 (Security Hub secondary)
	awsEast := provider.NewAwsProvider(stack, jsii.String("aws-east"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		Alias:  jsii.String("east"),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": config.Environment,
					"Project":     config.Project,
					"Region":      jsii.String("secondary"),
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// Security Hub in us-east-1
	securityhubaccount.NewSecurityhubAccount(stack, jsii.String("security-hub-east"), &securityhubaccount.SecurityhubAccountConfig{
		Provider:               awsEast,
		EnableDefaultStandards: jsii.Bool(true),
	})

	// DB Subnet Group
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:      jsii.String(fmt.Sprintf("security-db-subnet-group-%s", environmentSuffix)),
		SubnetIds: &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-db-subnet-group-%s", environmentSuffix)),
		},
	})

	// RDS Instance with KMS encryption
	dbinstance.NewDbInstance(stack, jsii.String("security-database"), &dbinstance.DbInstanceConfig{
		Identifier:            jsii.String(fmt.Sprintf("security-db-%s", environmentSuffix)),
		AllocatedStorage:      jsii.Number(20),
		StorageType:           jsii.String("gp3"),
		Engine:                jsii.String("postgres"),
		EngineVersion:         jsii.String("15.7"),
		InstanceClass:         jsii.String("db.t3.micro"),
		MultiAz:               jsii.Bool(true),
		DbName:                jsii.String("securitydb"),
		Username:              jsii.String("dbadmin"),
		Password:              jsii.String("changeme123!"), // In production, use AWS Secrets Manager
		VpcSecurityGroupIds:   &[]*string{dbSecurityGroup.Id()},
		DbSubnetGroupName:     dbSubnetGroup.Name(),
		StorageEncrypted:      jsii.Bool(true),
		KmsKeyId:              kmsKey.Arn(),
		BackupRetentionPeriod: jsii.Number(7),
		BackupWindow:          jsii.String("03:00-04:00"),
		MaintenanceWindow:     jsii.String("Mon:04:00-Mon:05:00"),
		SkipFinalSnapshot:     jsii.Bool(true),
		DeletionProtection:    jsii.Bool(false),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-database-%s", environmentSuffix)),
		},
	})

	// Stack Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("VpcId"), &cdktf.TerraformOutputConfig{
		Value:       mainVpc.Id(),
		Description: jsii.String("VPC ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("SecureDataBucket"), &cdktf.TerraformOutputConfig{
		Value:       secureDataBucket.Id(),
		Description: jsii.String("Secure Data S3 Bucket Name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("CloudTrailBucket"), &cdktf.TerraformOutputConfig{
		Value:       cloudtrailBucket.Id(),
		Description: jsii.String("CloudTrail S3 Bucket Name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("KmsKeyId"), &cdktf.TerraformOutputConfig{
		Value:       kmsKey.Id(),
		Description: jsii.String("KMS Key ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("RdsInstanceId"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String(fmt.Sprintf("security-db-%s", environmentSuffix)),
		Description: jsii.String("RDS Instance Identifier"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("PublicSubnet1Id"), &cdktf.TerraformOutputConfig{
		Value:       publicSubnet1.Id(),
		Description: jsii.String("Public Subnet 1 ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("PrivateSubnet1Id"), &cdktf.TerraformOutputConfig{
		Value:       privateSubnet1.Id(),
		Description: jsii.String("Private Subnet 1 ID"),
	})

	return stack
}
