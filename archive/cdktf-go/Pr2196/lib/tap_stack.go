package main

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/accessanalyzeranalyzer"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dynamodbtable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
)

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from ENV variable
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "prod"
	}
	environmentSuffix := fmt.Sprintf("cdktf-%s", envSuffix)

	// Configure AWS provider for us-east-1
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Project":     jsii.String("SecureApp"),
					"Environment": jsii.String("Production"),
					"ManagedBy":   jsii.String("CDKTF"),
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

	// Create IAM role for SecureApp with Lambda service principal
	secureAppRole := iamrole.NewIamRole(stack, jsii.String("SecureAppRole"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("SecureApp-Role-%s", environmentSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					},
					"Action": "sts:AssumeRole",
					"Condition": {
						"StringEquals": {
							"aws:RequestedRegion": "us-east-1"
						}
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Role"),
			"Description": jsii.String("IAM role for SecureApp with restricted S3 and DynamoDB access"),
		},
	})

	// Create unique bucket name using timestamp and environment suffix
	bucketSuffix := strconv.FormatInt(time.Now().Unix(), 16)
	bucketName := fmt.Sprintf("secureapp-bucket-%s-%s", environmentSuffix, bucketSuffix)

	// Create S3 bucket with security configurations
	secureAppBucket := s3bucket.NewS3Bucket(stack, jsii.String("SecureAppBucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(bucketName),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-bucket"),
			"Description": jsii.String("Secure S3 bucket for SecureApp data storage"),
		},
	})

	// Block all public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("SecureAppBucketPAB"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                secureAppBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Enable S3 bucket encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("SecureAppBucketEncryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: secureAppBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
					SseAlgorithm: jsii.String("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// Enable S3 bucket versioning
	s3bucketversioning.NewS3BucketVersioningA(stack, jsii.String("SecureAppBucketVersioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: secureAppBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Create DynamoDB table with encryption
	secureAppTable := dynamodbtable.NewDynamodbTable(stack, jsii.String("SecureAppTable"), &dynamodbtable.DynamodbTableConfig{
		Name:        jsii.String(fmt.Sprintf("SecureApp-Table-%s", environmentSuffix)),
		BillingMode: jsii.String("PAY_PER_REQUEST"),
		HashKey:     jsii.String("id"),
		Attribute: []*dynamodbtable.DynamodbTableAttribute{
			{
				Name: jsii.String("id"),
				Type: jsii.String("S"),
			},
		},
		ServerSideEncryption: &dynamodbtable.DynamodbTableServerSideEncryption{
			Enabled: jsii.Bool(true),
		},
		PointInTimeRecovery: &dynamodbtable.DynamodbTablePointInTimeRecovery{
			Enabled: jsii.Bool(true),
		},
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Table"),
			"Description": jsii.String("Secure DynamoDB table for SecureApp session data"),
		},
	})

	// Create IAM policy for restricted S3 and DynamoDB access
	secureAppPolicy := iampolicy.NewIamPolicy(stack, jsii.String("SecureAppPolicy"), &iampolicy.IamPolicyConfig{
		Name: jsii.String(fmt.Sprintf("SecureApp-Policy-%s", environmentSuffix)),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetObject",
						"s3:PutObject",
						"s3:DeleteObject",
						"s3:ListBucket"
					],
					"Resource": [
						"` + *secureAppBucket.Arn() + `",
						"` + *secureAppBucket.Arn() + `/*"
					],
					"Condition": {
						"StringEquals": {
							"s3:x-amz-server-side-encryption": "AES256"
						}
					}
				},
				{
					"Effect": "Allow",
					"Action": [
						"dynamodb:GetItem",
						"dynamodb:PutItem",
						"dynamodb:UpdateItem",
						"dynamodb:DeleteItem",
						"dynamodb:Query",
						"dynamodb:Scan"
					],
					"Resource": "` + *secureAppTable.Arn() + `"
				},
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:us-east-1:*:*"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Policy"),
			"Description": jsii.String("Least privilege policy for SecureApp resources"),
		},
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("SecureAppRolePolicyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      secureAppRole.Name(),
		PolicyArn: secureAppPolicy.Arn(),
	})

	// Create IAM Access Analyzer for 2025 security monitoring
	analyzer := accessanalyzeranalyzer.NewAccessanalyzerAnalyzer(stack, jsii.String("SecureAppAccessAnalyzer"), &accessanalyzeranalyzer.AccessanalyzerAnalyzerConfig{
		AnalyzerName: jsii.String(fmt.Sprintf("SecureApp-AccessAnalyzer-%s", environmentSuffix)),
		Type:         jsii.String("ACCOUNT"),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-AccessAnalyzer"),
			"Description": jsii.String("Access analyzer for SecureApp security monitoring"),
		},
	})

	// Add bucket policy to ensure HTTPS only access
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("SecureAppBucketPolicy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: secureAppBucket.Id(),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "DenyInsecureConnections",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:*",
					"Resource": [
						"` + *secureAppBucket.Arn() + `",
						"` + *secureAppBucket.Arn() + `/*"
					],
					"Condition": {
						"Bool": {
							"aws:SecureTransport": "false"
						}
					}
				}
			]
		}`),
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       secureAppBucket.Id(),
		Description: jsii.String("Name of the S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("bucket_arn"), &cdktf.TerraformOutputConfig{
		Value:       secureAppBucket.Arn(),
		Description: jsii.String("ARN of the S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("dynamodb_table_name"), &cdktf.TerraformOutputConfig{
		Value:       secureAppTable.Name(),
		Description: jsii.String("Name of the DynamoDB table"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("dynamodb_table_arn"), &cdktf.TerraformOutputConfig{
		Value:       secureAppTable.Arn(),
		Description: jsii.String("ARN of the DynamoDB table"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("iam_role_name"), &cdktf.TerraformOutputConfig{
		Value:       secureAppRole.Name(),
		Description: jsii.String("Name of the IAM role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("iam_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       secureAppRole.Arn(),
		Description: jsii.String("ARN of the IAM role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("access_analyzer_arn"), &cdktf.TerraformOutputConfig{
		Value:       analyzer.Arn(),
		Description: jsii.String("ARN of the Access Analyzer"),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
