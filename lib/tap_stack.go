package main

import (
	"fmt"
	"os"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lambdafunction"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
)

type TapStackProps struct {
	EnvironmentSuffix string
	StateBucket       string
	StateBucketRegion string
	AwsRegion         string
	RepositoryName    string
	CommitAuthor      string
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

	// CloudWatch Log Group for Lambda
	lambdaLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("lambda-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/lambda/%s-security-function", envPrefix)),
		RetentionInDays: jsii.Number(14),
		KmsKeyId:        kmsKey.Arn(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-lambda-log-group", envPrefix)),
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

	// Custom IAM Policy for Lambda with least privilege
	lambdaPolicy := iampolicy.NewIamPolicy(stack, jsii.String("lambda-policy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String(fmt.Sprintf("%s-lambda-policy", envPrefix)),
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
					"Resource": "arn:aws:logs:%s:*:log-group:/aws/lambda/%s-security-function:*"
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
		}`, props.AwsRegion, envPrefix, *kmsKey.Arn())),
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("lambda-policy-attachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: lambdaPolicy.Arn(),
	})

	// Lambda Function with logging enabled
	lambdaFunction := lambdafunction.NewLambdaFunction(stack, jsii.String("security-function"), &lambdafunction.LambdaFunctionConfig{
		FunctionName: jsii.String(fmt.Sprintf("%s-security-function", envPrefix)),
		Role:         lambdaRole.Arn(),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("python3.9"),
		Filename:     jsii.String("./lambda.zip"),
		KmsKeyArn:    kmsKey.Arn(),
		DependsOn:    &[]cdktf.ITerraformDependable{lambdaLogGroup},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("%s-security-function", envPrefix)),
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
