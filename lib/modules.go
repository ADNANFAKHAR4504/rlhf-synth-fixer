package main

import (
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lambdafunction"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

// SecurityInfrastructure contains all the security-focused infrastructure components
type SecurityInfrastructure struct {
	// KMS Keys
	S3KMSKey  kmskey.KmsKey
	RDSKMSKey kmskey.KmsKey

	// IAM Roles
	LambdaRole     iamrole.IamRole
	CloudTrailRole iamrole.IamRole

	// S3 Buckets
	MainBucket      s3bucket.S3Bucket
	LogBucket       s3bucket.S3Bucket
	CloudTrailBucket s3bucket.S3Bucket

	// VPC Components
	VPC               vpc.Vpc
	InternetGateway   internetgateway.InternetGateway
	PublicSubnet1     subnet.Subnet
	PublicSubnet2     subnet.Subnet
	PrivateSubnet1    subnet.Subnet
	PrivateSubnet2    subnet.Subnet
	PublicRouteTable  routetable.RouteTable
	PrivateRouteTable1 routetable.RouteTable
	PrivateRouteTable2 routetable.RouteTable
	NATGateway1       natgateway.NatGateway
	NATGateway2       natgateway.NatGateway
	EIP1              eip.Eip
	EIP2              eip.Eip

	// Security Groups
	LambdaSG securitygroup.SecurityGroup
	RDSSSG   securitygroup.SecurityGroup

	// RDS Components
	DBSubnetGroup dbsubnetgroup.DbSubnetGroup
	RDSInstance   dbinstance.DbInstance

	// Lambda Components
	LambdaLogGroup cloudwatchloggroup.CloudwatchLogGroup
	LambdaFunction lambdafunction.LambdaFunction

	// CloudTrail
	CloudTrail cloudtrail.Cloudtrail
}

// CreateKMSKeys creates KMS keys for S3 and RDS encryption
func CreateKMSKeys(scope constructs.Construct, projectName string) (kmskey.KmsKey, kmskey.KmsKey) {
	// S3 KMS Key
	s3Key := kmskey.NewKmsKey(scope, jsii.String("s3-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for S3 bucket encryption"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::*:root"
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
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-s3-kms-key", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// RDS KMS Key
	rdsKey := kmskey.NewKmsKey(scope, jsii.String("rds-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for RDS encryption"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-rds-kms-key", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	return s3Key, rdsKey
}

// CreateIAMRoles creates IAM roles with AWS managed policies only
func CreateIAMRoles(scope constructs.Construct, projectName string) (iamrole.IamRole, iamrole.IamRole) {
	// Lambda Execution Role
	lambdaRole := iamrole.NewIamRole(scope, jsii.String("lambda-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("%s-lambda-role", projectName)),
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
			"Name":        jsii.String(fmt.Sprintf("%s-lambda-role", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Attach AWS managed policy for Lambda basic execution
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("lambda-basic-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	// CloudTrail Service Role
	cloudTrailRole := iamrole.NewIamRole(scope, jsii.String("cloudtrail-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("%s-cloudtrail-role", projectName)),
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
			"Name":        jsii.String(fmt.Sprintf("%s-cloudtrail-role", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Attach AWS managed policy for CloudTrail
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("cloudtrail-service-role"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      cloudTrailRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/CloudWatchLogsFullAccess"),
	})

	return lambdaRole, cloudTrailRole
}

// CreateS3Buckets creates private S3 buckets with KMS encryption
func CreateS3Buckets(scope constructs.Construct, projectName string, kmsKey kmskey.KmsKey) (s3bucket.S3Bucket, s3bucket.S3Bucket, s3bucket.S3Bucket) {
	// Main S3 Bucket
	mainBucket := s3bucket.NewS3Bucket(scope, jsii.String("main-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("%s-main-bucket", projectName)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-main-bucket", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Log S3 Bucket
	logBucket := s3bucket.NewS3Bucket(scope, jsii.String("log-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("%s-log-bucket", projectName)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-log-bucket", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// CloudTrail S3 Bucket
	cloudTrailBucket := s3bucket.NewS3Bucket(scope, jsii.String("cloudtrail-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("%s-cloudtrail-bucket", projectName)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-cloudtrail-bucket", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Configure encryption and public access blocking for all buckets
	buckets := []s3bucket.S3Bucket{mainBucket, logBucket, cloudTrailBucket}
	bucketNames := []string{"main", "log", "cloudtrail"}

	for i, bucket := range buckets {
		// Enable KMS encryption
		s3bucketencryption.NewS3BucketEncryption(scope, jsii.String(fmt.Sprintf("%s-bucket-encryption", bucketNames[i])), &s3bucketencryption.S3BucketEncryptionConfig{
			Bucket: bucket.Id(),
			ServerSideEncryptionConfiguration: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfiguration{
				Rule: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRule{
					ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
						KmsMasterKeyId: kmsKey.Arn(),
						SseAlgorithm:   jsii.String("aws:kms"),
					},
				},
			},
		})

		// Block public access
		s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(scope, jsii.String(fmt.Sprintf("%s-bucket-pab", bucketNames[i])), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
			Bucket:                bucket.Id(),
			BlockPublicAcls:       jsii.Bool(true),
			BlockPublicPolicy:     jsii.Bool(true),
			IgnorePublicAcls:      jsii.Bool(true),
			RestrictPublicBuckets: jsii.Bool(true),
		})
	}

	return mainBucket, logBucket, cloudTrailBucket
}

// CreateVPC creates a highly available VPC with public and private subnets across 2 AZs
func CreateVPC(scope constructs.Construct, projectName string, vpcCidr string, publicSubnet1Cidr, publicSubnet2Cidr, privateSubnet1Cidr, privateSubnet2Cidr string) (vpc.Vpc, subnet.Subnet, subnet.Subnet, subnet.Subnet, subnet.Subnet, internetgateway.InternetGateway, natgateway.NatGateway, natgateway.NatGateway) {
	// Create VPC
	mainVPC := vpc.NewVpc(scope, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String(vpcCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-vpc", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(scope, jsii.String("internet-gateway"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-igw", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Public Subnets
	publicSubnet1 := subnet.NewSubnet(scope, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:               mainVPC.Id(),
		CidrBlock:           jsii.String(publicSubnet1Cidr),
		AvailabilityZone:    jsii.String("us-west-2a"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-public-subnet-1", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	publicSubnet2 := subnet.NewSubnet(scope, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:               mainVPC.Id(),
		CidrBlock:           jsii.String(publicSubnet2Cidr),
		AvailabilityZone:    jsii.String("us-west-2b"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-public-subnet-2", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Private Subnets
	privateSubnet1 := subnet.NewSubnet(scope, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            mainVPC.Id(),
		CidrBlock:        jsii.String(privateSubnet1Cidr),
		AvailabilityZone: jsii.String("us-west-2a"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-subnet-1", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	privateSubnet2 := subnet.NewSubnet(scope, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            mainVPC.Id(),
		CidrBlock:        jsii.String(privateSubnet2Cidr),
		AvailabilityZone: jsii.String("us-west-2b"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-subnet-2", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Elastic IPs for NAT Gateways
	eip1 := eip.NewEip(scope, jsii.String("nat-eip-1"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-nat-eip-1", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	eip2 := eip.NewEip(scope, jsii.String("nat-eip-2"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-nat-eip-2", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create NAT Gateways
	natGW1 := natgateway.NewNatGateway(scope, jsii.String("nat-gateway-1"), &natgateway.NatGatewayConfig{
		AllocationId: eip1.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-nat-gw-1", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	natGW2 := natgateway.NewNatGateway(scope, jsii.String("nat-gateway-2"), &natgateway.NatGatewayConfig{
		AllocationId: eip2.Id(),
		SubnetId:     publicSubnet2.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-nat-gw-2", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Route Tables
	publicRT := routetable.NewRouteTable(scope, jsii.String("public-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-public-rt", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	privateRT1 := routetable.NewRouteTable(scope, jsii.String("private-route-table-1"), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-rt-1", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	privateRT2 := routetable.NewRouteTable(scope, jsii.String("private-route-table-2"), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-rt-2", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Routes
	route.NewRoute(scope, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	route.NewRoute(scope, jsii.String("private-route-1"), &route.RouteConfig{
		RouteTableId:         privateRT1.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGW1.Id(),
	})

	route.NewRoute(scope, jsii.String("private-route-2"), &route.RouteConfig{
		RouteTableId:         privateRT2.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGW2.Id(),
	})

	// Associate Route Tables with Subnets
	routetableassociation.NewRouteTableAssociation(scope, jsii.String("public-rta-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRT.Id(),
	})

	routetableassociation.NewRouteTableAssociation(scope, jsii.String("public-rta-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRT.Id(),
	})

	routetableassociation.NewRouteTableAssociation(scope, jsii.String("private-rta-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRT1.Id(),
	})

	routetableassociation.NewRouteTableAssociation(scope, jsii.String("private-rta-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRT2.Id(),
	})

	return mainVPC, publicSubnet1, publicSubnet2, privateSubnet1, privateSubnet2, igw, natGW1, natGW2
}

// CreateSecurityGroups creates security groups for Lambda and RDS
func CreateSecurityGroups(scope constructs.Construct, projectName string, vpcId *string) (securitygroup.SecurityGroup, securitygroup.SecurityGroup) {
	// Lambda Security Group
	lambdaSG := securitygroup.NewSecurityGroup(scope, jsii.String("lambda-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("%s-lambda-sg", projectName)),
		Description: jsii.String("Security group for Lambda functions"),
		VpcId:       vpcId,
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				FromPort:   jsii.Number(0),
				ToPort:     jsii.Number(65535),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
			},
		},
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-lambda-sg", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// RDS Security Group
	rdsSG := securitygroup.NewSecurityGroup(scope, jsii.String("rds-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("%s-rds-sg", projectName)),
		Description: jsii.String("Security group for RDS instances"),
		VpcId:       vpcId,
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				FromPort:        jsii.Number(3306),
				ToPort:          jsii.Number(3306),
				Protocol:        jsii.String("tcp"),
				SecurityGroups:  &[]*string{lambdaSG.Id()},
				Description:     jsii.String("MySQL access from Lambda"),
			},
		},
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-rds-sg", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	return lambdaSG, rdsSG
}

// CreateRDS creates an RDS instance with KMS encryption
func CreateRDS(scope constructs.Construct, projectName string, privateSubnet1, privateSubnet2 subnet.Subnet, rdsSG securitygroup.SecurityGroup, kmsKey kmskey.KmsKey) dbinstance.DbInstance {
	// Create DB Subnet Group
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(scope, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:       jsii.String(fmt.Sprintf("%s-db-subnet-group", projectName)),
		SubnetIds:  &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-db-subnet-group", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create RDS Instance
	rdsInstance := dbinstance.NewDbInstance(scope, jsii.String("rds-instance"), &dbinstance.DbInstanceConfig{
		Identifier:     jsii.String(fmt.Sprintf("%s-rds-instance", projectName)),
		Engine:         jsii.String("mysql"),
		EngineVersion:  jsii.String("8.0"),
		InstanceClass:  jsii.String("db.t3.micro"),
		AllocatedStorage: jsii.Number(20),
		DbName:         jsii.String("production"),
		Username:       jsii.String("admin"),
		Password:       jsii.String("changeme123!"), // In production, use AWS Secrets Manager
		VpcSecurityGroupIds: &[]*string{rdsSG.Id()},
		DbSubnetGroupName:   dbSubnetGroup.Name(),
		StorageEncrypted:    jsii.Bool(true),
		KmsKeyId:           kmsKey.Arn(),
		BackupRetentionPeriod: jsii.Number(7),
		BackupWindow:       jsii.String("03:00-04:00"),
		MaintenanceWindow:  jsii.String("sun:04:00-sun:05:00"),
		SkipFinalSnapshot:  jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-rds-instance", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	return rdsInstance
}

// CreateLambda creates a Lambda function with CloudWatch logging enabled
func CreateLambda(scope constructs.Construct, projectName string, lambdaRole iamrole.IamRole, lambdaSG securitygroup.SecurityGroup, privateSubnet1, privateSubnet2 subnet.Subnet) lambdafunction.LambdaFunction {
	// Create CloudWatch Log Group
	logGroup := cloudwatchloggroup.NewCloudwatchLogGroup(scope, jsii.String("lambda-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/lambda/%s-function", projectName)),
		RetentionInDays: jsii.Number(14),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-lambda-logs", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	// Create Lambda Function
	lambdaFunc := lambdafunction.NewLambdaFunction(scope, jsii.String("lambda-function"), &lambdafunction.LambdaFunctionConfig{
		FunctionName: jsii.String(fmt.Sprintf("%s-function", projectName)),
		Role:         lambdaRole.Arn(),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("python3.9"),
		Filename:     jsii.String("lambda.zip"), // You'll need to create this zip file
		VpcConfig: &lambdafunction.LambdaFunctionVpcConfig{
			SecurityGroupIds: &[]*string{lambdaSG.Id()},
			SubnetIds:        &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		},
		DependsOn: &[]cdktf.ITerraformDependable{logGroup},
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-function", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	return lambdaFunc
}

// CreateCloudTrail creates CloudTrail with multi-region logging
func CreateCloudTrail(scope constructs.Construct, projectName string, s3Bucket s3bucket.S3Bucket, kmsKey kmskey.KmsKey) cloudtrail.Cloudtrail {
	trail := cloudtrail.NewCloudtrail(scope, jsii.String("cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                         jsii.String(fmt.Sprintf("%s-cloudtrail", projectName)),
		S3BucketName:                 s3Bucket.Id(),
		IncludeGlobalServiceEvents:   jsii.Bool(true),
		IsMultiRegionTrail:           jsii.Bool(true),
		EnableLogFileValidation:      jsii.Bool(true),
		KmsKeyId:                     kmsKey.Arn(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-cloudtrail", projectName)),
			"Environment": jsii.String("Production"),
		},
	})

	return trail
}