# Security Configuration as Code - CDKTF+Go Implementation

## File: tap_stack.go

```go
package main

import (
	"fmt"
	"os"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/flowlog"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lambdafunction"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

type TapStackProps struct {
	EnvironmentSuffix string
	StateBucket       string
	StateBucketRegion string
	AwsRegion         string
	RepositoryName    string
	CommitAuthor      string
}

// BuildSecurityStack creates the main security infrastructure (for unit tests)
func BuildSecurityStack(stack cdktf.TerraformStack, region string, vpcId *string) {
	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "prod"
	}

	// Create environment prefix for resource naming
	envPrefix := fmt.Sprintf("%s", environmentSuffix)

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(region),
		DefaultTags: &[]interface{}{
			map[string]interface{}{
				"tags": map[string]*string{
					"Environment": jsii.String("prod"),
					"Project":     jsii.String("security-config"),
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("prod-security-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for security infrastructure encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-security-kms-key", envPrefix)),
		},
	})

	// KMS Key Alias
	kmsalias.NewKmsAlias(stack, jsii.String("prod-security-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String("alias/prod-security-key"),
		TargetKeyId: kmsKey.KeyId(),
	})

	// S3 Bucket with encryption
	s3Bucket := s3bucket.NewS3Bucket(stack, jsii.String("prod-security-logs-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("prod-security-logs-bucket-%s", region)),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-security-logs-bucket"),
		},
	})

	// S3 Bucket Server-Side Encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("prod-s3-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: s3Bucket.Id(),
		Rule: &[]*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					KmsMasterKeyId: kmsKey.Arn(),
					SseAlgorithm:   jsii.String("aws:kms"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// CloudWatch Log Group for Lambda
	lambdaLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("prod-lambda-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String("/aws/lambda/prod-security-function"),
		RetentionInDays: jsii.Number(14),
		KmsKeyId:        kmsKey.Arn(),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-lambda-log-group"),
		},
	})

	// IAM Role for Lambda with least privilege
	lambdaRole := iamrole.NewIamRole(stack, jsii.String("prod-lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: jsii.String("prod-lambda-execution-role"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-lambda-execution-role"),
		},
	})

	// Custom IAM Policy for Lambda with least privilege
	lambdaPolicy := iampolicy.NewIamPolicy(stack, jsii.String("prod-lambda-policy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("prod-lambda-policy"),
		Description: jsii.String("Least privilege policy for Lambda function"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:%s:*:log-group:/aws/lambda/prod-security-function:*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "%s"
				}
			]
		}`, region, *kmsKey.Arn())),
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("prod-lambda-policy-attachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: lambdaPolicy.Arn(),
	})

	// Lambda Function for VPC logging (test version)
	lambdaFunction := lambdafunction.NewLambdaFunction(stack, jsii.String("prod-security-function"), &lambdafunction.LambdaFunctionConfig{
		FunctionName: jsii.String("prod-security-function"),
		Role:         lambdaRole.Arn(),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("python3.9"),
		Filename:     jsii.String("../../../lib/lambda.zip"),
		KmsKeyArn:    kmsKey.Arn(),
		Timeout:      jsii.Number(30),
		MemorySize:   jsii.Number(256),
		Environment: &lambdafunction.LambdaFunctionEnvironment{
			Variables: &map[string]*string{
				"BUCKET_NAME": s3Bucket.Bucket(),
				"KMS_KEY_ID":  kmsKey.KeyId(),
				"ENVIRONMENT": jsii.String("prod"),
			},
		},
		DependsOn: &[]cdktf.ITerraformDependable{lambdaLogGroup},
		Tags: &map[string]*string{
			"Name": jsii.String("prod-security-function"),
		},
	})

	flowlog.NewFlowLog(stack, jsii.String("prod-vpc-flow-logs"), &flowlog.FlowLogConfig{
		VpcId:              vpcId,
		TrafficType:        jsii.String("ALL"),
		LogDestinationType: jsii.String("s3"),
		LogDestination:     jsii.String(fmt.Sprintf("arn:aws:s3:::%s/vpc-flow-logs/", *s3Bucket.Bucket())),
		LogFormat:          jsii.String("$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status}"),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-vpc-flow-logs"),
		},
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       kmsKey.KeyId(),
		Description: jsii.String("KMS Key ID for encryption"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Bucket.Bucket(),
		Description: jsii.String("S3 bucket name for security logs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("lambda_function_name"), &cdktf.TerraformOutputConfig{
		Value:       lambdaFunction.FunctionName(),
		Description: jsii.String("Lambda function name with logging enabled"),
	})
}

func NewTapStack(scope cdktf.App, id string, props *TapStackProps) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = props.EnvironmentSuffix // Default from props
	}

	// Get state bucket configuration from environment variables
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = props.StateBucket // Default from props
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = props.StateBucketRegion // Default from props
	}

	// Configure S3 backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(fmt.Sprintf("%s/%s.tfstate", environmentSuffix, id)),
		Region: jsii.String(stateBucketRegion),
	})

	// Create environment prefix for resource naming
	envPrefix := fmt.Sprintf("%s-cdktf", environmentSuffix)

	// Create VPC
	vpcResource := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-main-vpc", envPrefix)),
		},
	})

	// Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("main-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-main-igw", envPrefix)),
		},
	})

	// Public Subnets
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:               vpcResource.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String("us-east-1a"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-public-subnet-1", envPrefix)),
		},
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:               vpcResource.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    jsii.String("us-east-1b"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-public-subnet-2", envPrefix)),
		},
	})

	// Private Subnets
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            vpcResource.Id(),
		CidrBlock:        jsii.String("10.0.10.0/24"),
		AvailabilityZone: jsii.String("us-east-1a"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-private-subnet-1", envPrefix)),
		},
	})

	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            vpcResource.Id(),
		CidrBlock:        jsii.String("10.0.20.0/24"),
		AvailabilityZone: jsii.String("us-east-1b"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-private-subnet-2", envPrefix)),
		},
	})

	// Elastic IP for NAT Gateway
	natEip := eip.NewEip(stack, jsii.String("nat-eip"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-nat-eip", envPrefix)),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	// NAT Gateway
	natGw := natgateway.NewNatGateway(stack, jsii.String("main-nat"), &natgateway.NatGatewayConfig{
		AllocationId: natEip.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-main-nat", envPrefix)),
		},
	})

	// Route Tables
	publicRt := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-public-rt", envPrefix)),
		},
	})

	privateRt := routetable.NewRouteTable(stack, jsii.String("private-rt"), &routetable.RouteTableConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-private-rt", envPrefix)),
		},
	})

	// Routes
	route.NewRoute(stack, jsii.String("public-internet-route"), &route.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	route.NewRoute(stack, jsii.String("private-nat-route"), &route.RouteConfig{
		RouteTableId:         privateRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw.Id(),
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
		RouteTableId: privateRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rta-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRt.Id(),
	})

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(props.AwsRegion),
		DefaultTags: &[]interface{}{
			map[string]interface{}{
				"tags": map[string]*string{
					"Environment": jsii.String(environmentSuffix),
					"Repository":  jsii.String(props.RepositoryName),
					"Author":      jsii.String(props.CommitAuthor),
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("security-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for security infrastructure encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-security-kms-key", envPrefix)),
		},
	})

	// KMS Key Alias
	kmsalias.NewKmsAlias(stack, jsii.String("security-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/%s-security-key", envPrefix)),
		TargetKeyId: kmsKey.KeyId(),
	})

	// S3 Bucket with encryption
	s3Bucket := s3bucket.NewS3Bucket(stack, jsii.String("security-logs-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("%s-security-logs-bucket-%s", envPrefix, props.AwsRegion)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-security-logs-bucket", envPrefix)),
		},
	})

	// S3 Bucket Server-Side Encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("s3-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: s3Bucket.Id(),
		Rule: &[]*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					KmsMasterKeyId: kmsKey.Arn(),
					SseAlgorithm:   jsii.String("aws:kms"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// CloudWatch Log Group for VPC Logging Lambda
	lambdaLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("vpc-logging-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/lambda/%s-vpc-logging-function", envPrefix)),
		RetentionInDays: jsii.Number(14),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-vpc-logging-log-group", envPrefix)),
		},
	})

	// IAM Role for Lambda with least privilege
	lambdaRole := iamrole.NewIamRole(stack, jsii.String("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("%s-lambda-execution-role", envPrefix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-lambda-execution-role", envPrefix)),
		},
	})

	// Custom IAM Policy for VPC Logging Lambda with least privilege
	lambdaPolicy := iampolicy.NewIamPolicy(stack, jsii.String("vpc-logging-policy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String(fmt.Sprintf("%s-vpc-logging-policy", envPrefix)),
		Description: jsii.String("Least privilege policy for VPC logging Lambda function"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:%s:*:log-group:/aws/lambda/%s-vpc-logging-function:*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"ec2:DescribeVpcs",
						"ec2:DescribeFlowLogs",
						"logs:DescribeLogGroups",
						"logs:DescribeLogStreams"
					],
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"s3:PutObject",
						"s3:GetObject"
					],
					"Resource": "arn:aws:s3:::%s/*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "%s"
				}
			]
		}`, props.AwsRegion, envPrefix, *s3Bucket.Bucket(), *kmsKey.Arn())),
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("lambda-policy-attachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: lambdaPolicy.Arn(),
	})

	// Lambda Function for VPC logging
	lambdaFunction := lambdafunction.NewLambdaFunction(stack, jsii.String("vpc-logging-function"), &lambdafunction.LambdaFunctionConfig{
		FunctionName: jsii.String(fmt.Sprintf("%s-vpc-logging-function", envPrefix)),
		Role:         lambdaRole.Arn(),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("python3.9"),
		Filename:     jsii.String("../../../lib/lambda.zip"),
		KmsKeyArn:    kmsKey.Arn(),
		Timeout:      jsii.Number(30),
		MemorySize:   jsii.Number(256),
		Environment: &lambdafunction.LambdaFunctionEnvironment{
			Variables: &map[string]*string{
				"VPC_ID":      vpcResource.Id(),
				"LOG_BUCKET":  s3Bucket.Bucket(),
				"KMS_KEY_ID":  kmsKey.KeyId(),
				"ENVIRONMENT": jsii.String(environmentSuffix),
				"LOG_GROUP":   lambdaLogGroup.Name(),
			},
		},

		DependsOn: &[]cdktf.ITerraformDependable{lambdaLogGroup},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-vpc-logging-function", envPrefix)),
		},
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       kmsKey.KeyId(),
		Description: jsii.String("KMS Key ID for encryption"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       s3Bucket.Bucket(),
		Description: jsii.String("S3 bucket name for security logs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("lambda_function_name"), &cdktf.TerraformOutputConfig{
		Value:       lambdaFunction.FunctionName(),
		Description: jsii.String("Lambda function name with logging enabled"),
	})

	// VPC Flow Logs
	flowlog.NewFlowLog(stack, jsii.String("vpc-flow-logs"), &flowlog.FlowLogConfig{
		VpcId:              vpcResource.Id(),
		TrafficType:        jsii.String("ALL"),
		LogDestinationType: jsii.String("s3"),
		LogDestination:     jsii.String(fmt.Sprintf("arn:aws:s3:::%s/vpc-flow-logs/", *s3Bucket.Bucket())),
		LogFormat:          jsii.String("$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status}"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-vpc-flow-logs", envPrefix)),
		},
	})

	// VPC Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcResource.Id(),
		Description: jsii.String("VPC ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Join(jsii.String(","), &[]*string{publicSubnet1.Id(), publicSubnet2.Id()}),
		Description: jsii.String("Public subnet IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Join(jsii.String(","), &[]*string{privateSubnet1.Id(), privateSubnet2.Id()}),
		Description: jsii.String("Private subnet IDs"),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)

	// Get environment variables from the environment or use defaults
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}

	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		awsRegion = "us-east-1"
	}

	repositoryName := os.Getenv("REPOSITORY")
	if repositoryName == "" {
		repositoryName = "unknown"
	}

	commitAuthor := os.Getenv("COMMIT_AUTHOR")
	if commitAuthor == "" {
		commitAuthor = "unknown"
	}

	// Calculate the stack name
	stackName := fmt.Sprintf("TapStack%s", environmentSuffix)

	// Create the TapStack with the calculated properties
	NewTapStack(app, stackName, &TapStackProps{
		EnvironmentSuffix: environmentSuffix,
		StateBucket:       stateBucket,
		StateBucketRegion: stateBucketRegion,
		AwsRegion:         awsRegion,
		RepositoryName:    repositoryName,
		CommitAuthor:      commitAuthor,
	})

	// Synthesize the app to generate the Terraform configuration
	app.Synth()
}
```

## File: index.py

```python
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    VPC Logging Lambda function for monitoring VPC Flow Logs
    """
    vpc_id = os.environ.get('VPC_ID')
    log_bucket = os.environ.get('LOG_BUCKET')
    environment = os.environ.get('ENVIRONMENT')

    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    logs = boto3.client('logs')

    try:
        # Check VPC Flow Logs status
        flow_logs = ec2.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        log_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'vpc_id': vpc_id,
            'environment': environment,
            'flow_logs_count': len(flow_logs['FlowLogs']),
            'flow_logs_status': [fl['FlowLogStatus'] for fl in flow_logs['FlowLogs']],
            'message': 'VPC logging monitoring completed'
        }

        # Log to CloudWatch
        print(json.dumps(log_message))

        return {
            'statusCode': 200,
            'body': json.dumps(log_message)
        }

    except Exception as e:
        error_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'vpc_id': vpc_id,
            'environment': environment,
            'error': str(e),
            'message': 'VPC logging monitoring failed'
        }

        print(json.dumps(error_message))

        return {
            'statusCode': 500,
            'body': json.dumps(error_message)
        }
```
