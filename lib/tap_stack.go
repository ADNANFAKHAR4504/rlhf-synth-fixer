package main

import (
	"fmt"
	"os"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	// Force jsii subpackages into module graph for CI (since .gen is ignored by go mod tidy)
	_ "github.com/aws/constructs-go/constructs/v10/jsii"
	_ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"
	logs "cdk.tf/go/stack/generated/aws/cloudwatchloggroup"
	iampolicy "cdk.tf/go/stack/generated/aws/iampolicy"
	iamrole "cdk.tf/go/stack/generated/aws/iamrole"
	iamrolepolicyattachment "cdk.tf/go/stack/generated/aws/iamrolepolicyattachment"
	kms "cdk.tf/go/stack/generated/aws/kmskey"
	kmskeyalias "cdk.tf/go/stack/generated/aws/kmsalias"
	lambdafunction "cdk.tf/go/stack/generated/aws/lambdafunction"
	s3bucket "cdk.tf/go/stack/generated/aws/s3bucket"
	s3bucketencryption "cdk.tf/go/stack/generated/aws/s3bucketserversideencryptionconfiguration"
	vpcflowlog "cdk.tf/go/stack/generated/aws/flowlog"
	awsprovider "cdk.tf/go/stack/generated/aws/provider"
)

// TapStack creates a comprehensive security configuration stack
type TapStack struct {
	cdktf.TerraformStack
}

// BuildSecurityStack creates the main security infrastructure
func BuildSecurityStack(stack cdktf.TerraformStack, region string) {
	// AWS Provider
	awsprovider.NewAwsProvider(stack, jsii.String("aws"), &awsprovider.AwsProviderConfig{
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
	kmsKey := kms.NewKmsKey(stack, jsii.String("prod-security-kms-key"), &kms.KmsKeyConfig{
		Description: jsii.String("KMS key for security infrastructure encryption"),
		KeyUsage:   jsii.String("ENCRYPT_DECRYPT"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::*:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Principal": {
						"Service": [
							"s3.amazonaws.com",
							"lambda.amazonaws.com",
							"logs.amazonaws.com"
						]
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
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-security-kms-key"),
		},
	})

	// KMS Key Alias
	kmskeyalias.NewKmsAlias(stack, jsii.String("prod-security-kms-alias"), &kmskeyalias.KmsAliasConfig{
		Name:         jsii.String("alias/prod-security-key"),
		TargetKeyId:  kmsKey.KeyId(),
	})

	// S3 Bucket with encryption
	s3Bucket := s3bucket.NewS3Bucket(stack, jsii.String("prod-security-logs-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("prod-security-logs-bucket-" + region),
		Tags: &map[string]*string{
			"Name": jsii.String("prod-security-logs-bucket"),
		},
	})

	// S3 Bucket Server-Side Encryption
	s3bucketencryption.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("prod-s3-encryption"), &s3bucketencryption.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: s3Bucket.Id(),
		Rule: &[]*s3bucketencryption.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					KmsMasterKeyId: kmsKey.Arn(),
					SseAlgorithm:   jsii.String("aws:kms"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// CloudWatch Log Group for Lambda
	lambdaLogGroup := logs.NewCloudwatchLogGroup(stack, jsii.String("prod-lambda-log-group"), &logs.CloudwatchLogGroupConfig{
		Name:            jsii.String("/aws/lambda/prod-security-function"),
		RetentionInDays: jsii.Number(14),
		KmsKeyId:       kmsKey.Arn(),
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
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:` + region + `:*:log-group:/aws/lambda/prod-security-function:*"
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
					"Resource": "` + *kmsKey.Arn() + `"
				}
			]
		}`),
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("prod-lambda-policy-attachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: lambdaPolicy.Arn(),
	})

	// Lambda Function with logging enabled
	lambdaFunction := lambdafunction.NewLambdaFunction(stack, jsii.String("prod-security-function"), &lambdafunction.LambdaFunctionConfig{
		FunctionName: jsii.String("prod-security-function"),
		Role:         lambdaRole.Arn(),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("python3.9"),
		Filename:     jsii.String("./lambda.zip"),
		KmsKeyArn:    kmsKey.Arn(),
		DependsOn:    &[]cdktf.ITerraformDependable{lambdaLogGroup},
		Tags: &map[string]*string{
			"Name": jsii.String("prod-security-function"),
		},
	})

	// VPC Flow Logs
	vpcflowlog.NewFlowLog(stack, jsii.String("prod-vpc-flow-logs"), &vpcflowlog.FlowLogConfig{
		VpcId:              jsii.String("vpc-0abcd1234"),
		TrafficType:        jsii.String("ALL"),
		LogDestinationType: jsii.String("s3"),
		LogDestination:     jsii.String(fmt.Sprintf("arn:aws:s3:::%s/vpc-flow-logs/", *s3Bucket.Bucket())),
		LogFormat:          jsii.String("${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}"),
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

func main() {
	app := cdktf.NewApp(nil)

	// Get region from environment or default to us-east-1
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	// Create the security stack
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildSecurityStack(stack, region)

	app.Synth()
}

func str(v string) *string { return &v }
