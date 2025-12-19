# CDKTF Go Security Configuration Implementation

This implementation creates a secure IAM configuration for the SecureApp project using CDKTF with Go, incorporating AWS best practices and latest security features.

## lib/tap_stack.go

```go
package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	// AWS Provider and resources
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/accessanalyzeranalyzer"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dynamodbtable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
)

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		DefaultTags: &provider.AwsProviderDefaultTags{
			Tags: &map[string]*string{
				"Project":     jsii.String("SecureApp"),
				"Environment": jsii.String("production"),
				"ManagedBy":   jsii.String("CDKTF"),
			},
		},
	})

	// Create IAM Trust Policy Document for the role
	trustPolicy := `{
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
	}`

	// Create IAM Role
	secureAppRole := iamrole.NewIamRole(stack, jsii.String("SecureApp-Role"), &iamrole.IamRoleConfig{
		Name:               jsii.String("SecureApp-Role"),
		AssumeRolePolicy:   jsii.String(trustPolicy),
		Description:        jsii.String("IAM Role for SecureApp with restricted S3 and DynamoDB access"),
		MaxSessionDuration: jsii.Number(3600),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Role"),
			"Description": jsii.String("Secure IAM role with least privilege access"),
		},
	})

	// Create S3 Bucket with security configurations
	secureAppBucket := s3bucket.NewS3Bucket(stack, jsii.String("SecureApp-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("secureapp-bucket"),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-bucket"),
			"Description": jsii.String("Secure S3 bucket for SecureApp project"),
		},
	})

	// Block all public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("SecureApp-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*secureAppBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Enable S3 bucket versioning
	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("SecureApp-bucket-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: jsii.String(*secureAppBucket.Id()),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable S3 bucket encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("SecureApp-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: jsii.String(*secureAppBucket.Id()),
		Rule: []s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// Create explicit deny policy for public access
	bucketPolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyPublicAccess",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"arn:aws:s3:::secureapp-bucket",
					"arn:aws:s3:::secureapp-bucket/*"
				],
				"Condition": {
					"StringNotEquals": {
						"aws:PrincipalArn": "` + *secureAppRole.Arn() + `"
					}
				}
			}
		]
	}`

	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("SecureApp-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: jsii.String(*secureAppBucket.Id()),
		Policy: jsii.String(bucketPolicy),
	})

	// Create DynamoDB Table with security configurations
	secureAppTable := dynamodbtable.NewDynamodbTable(stack, jsii.String("SecureApp-Table"), &dynamodbtable.DynamodbTableConfig{
		Name:        jsii.String("SecureApp-Table"),
		BillingMode: jsii.String("PAY_PER_REQUEST"),
		Attribute: []dynamodbtable.DynamodbTableAttribute{
			{
				Name: jsii.String("id"),
				Type: jsii.String("S"),
			},
		},
		HashKey: jsii.String("id"),
		ServerSideEncryption: &dynamodbtable.DynamodbTableServerSideEncryption{
			Enabled: jsii.Bool(true),
		},
		PointInTimeRecovery: &dynamodbtable.DynamodbTablePointInTimeRecovery{
			Enabled: jsii.Bool(true),
		},
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Table"),
			"Description": jsii.String("Secure DynamoDB table for SecureApp project"),
		},
	})

	// Create IAM Policy with restricted permissions
	policyDocument := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "S3RestrictedAccess",
				"Effect": "Allow",
				"Action": [
					"s3:GetObject",
					"s3:PutObject",
					"s3:DeleteObject",
					"s3:ListBucket"
				],
				"Resource": [
					"arn:aws:s3:::secureapp-bucket",
					"arn:aws:s3:::secureapp-bucket/*"
				],
				"Condition": {
					"StringEquals": {
						"s3:x-amz-server-side-encryption": "AES256"
					},
					"Bool": {
						"s3:x-amz-server-side-encryption-bucket-key-enabled": "true"
					}
				}
			},
			{
				"Sid": "DynamoDBRestrictedAccess",
				"Effect": "Allow",
				"Action": [
					"dynamodb:GetItem",
					"dynamodb:PutItem",
					"dynamodb:UpdateItem",
					"dynamodb:DeleteItem",
					"dynamodb:Query",
					"dynamodb:Scan"
				],
				"Resource": "arn:aws:dynamodb:us-east-1:*:table/SecureApp-Table",
				"Condition": {
					"ForAllValues:StringEquals": {
						"dynamodb:Attributes": [
							"id",
							"data",
							"timestamp"
						]
					}
				}
			},
			{
				"Sid": "BasicLambdaExecution",
				"Effect": "Allow",
				"Action": [
					"logs:CreateLogGroup",
					"logs:CreateLogStream",
					"logs:PutLogEvents"
				],
				"Resource": "arn:aws:logs:us-east-1:*:*"
			}
		]
	}`

	secureAppPolicy := iampolicy.NewIamPolicy(stack, jsii.String("SecureApp-Policy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("SecureApp-Policy"),
		Description: jsii.String("Restricted policy for SecureApp S3 and DynamoDB access"),
		Policy:      jsii.String(policyDocument),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-Policy"),
			"Description": jsii.String("Least privilege policy for SecureApp resources"),
		},
	})

	// Attach the policy to the role
	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("SecureApp-PolicyAttachment"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Name:      jsii.String("SecureApp-PolicyAttachment"),
		PolicyArn: jsii.String(*secureAppPolicy.Arn()),
		Roles:     &[]*string{secureAppRole.Name()},
	})

	// Create IAM Access Analyzer for security monitoring (2025 feature)
	accessanalyzeranalyzer.NewAccessanalyzerAnalyzer(stack, jsii.String("SecureApp-AccessAnalyzer"), &accessanalyzeranalyzer.AccessanalyzerAnalyzerConfig{
		AnalyzerName: jsii.String("SecureApp-AccessAnalyzer"),
		Type:         jsii.String("ACCOUNT"),
		Tags: &map[string]*string{
			"Name":        jsii.String("SecureApp-AccessAnalyzer"),
			"Description": jsii.String("Access analyzer for SecureApp security monitoring"),
		},
	})

	// Output important resource ARNs and names
	cdktf.NewTerraformOutput(stack, jsii.String("iam_role_arn"), &cdktf.TerraformOutputConfig{
		Value: secureAppRole.Arn(),
		Description: jsii.String("ARN of the SecureApp IAM Role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_name"), &cdktf.TerraformOutputConfig{
		Value: secureAppBucket.Bucket(),
		Description: jsii.String("Name of the SecureApp S3 Bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("dynamodb_table_name"), &cdktf.TerraformOutputConfig{
		Value: secureAppTable.Name(),
		Description: jsii.String("Name of the SecureApp DynamoDB Table"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("access_analyzer_name"), &cdktf.TerraformOutputConfig{
		Value: jsii.String("SecureApp-AccessAnalyzer"),
		Description: jsii.String("Name of the IAM Access Analyzer"),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
```

## lib/go.mod

```
module github.com/TuringGpt/iac-test-automations

go 1.21

require (
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.95.0
	github.com/hashicorp/terraform-cdk-go/cdktf v0.20.1
	github.com/cdktf/cdktf-provider-aws-go/aws/v19 v19.0.0
)
```

## tests/unit/tap_stack_unit_test.go

```go
package tests

import (
	"testing"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
)

func TestTapStackCreation(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "test-stack")
	
	// Test that stack is created
	assert.NotNil(t, stack)
	
	// Test that stack synthesizes without errors
	manifest := cdktf.Testing_Synth(stack, nil)
	assert.NotNil(t, manifest)
}

func TestSecurityConfigurations(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "test-stack")
	
	// Synthesize the stack
	manifest := cdktf.Testing_Synth(stack, nil)
	
	// Test IAM role exists
	assert.Contains(t, *manifest, "SecureApp-Role")
	
	// Test S3 bucket exists with proper configuration
	assert.Contains(t, *manifest, "secureapp-bucket")
	assert.Contains(t, *manifest, "block_public_acls")
	
	// Test DynamoDB table exists
	assert.Contains(t, *manifest, "SecureApp-Table")
	
	// Test IAM Access Analyzer exists
	assert.Contains(t, *manifest, "SecureApp-AccessAnalyzer")
}
```

## tests/integration/tap_stack_int_test.go

```go
package tests

import (
	"context"
	"os"
	"testing"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/stretchr/testify/assert"
)

func TestDeployedInfrastructure(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TEST=1 to run.")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	assert.NoError(t, err)

	// Test IAM Role exists
	iamClient := iam.NewFromConfig(cfg)
	roleOutput, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String("SecureApp-Role"),
	})
	assert.NoError(t, err)
	assert.NotNil(t, roleOutput.Role)

	// Test S3 Bucket exists and has proper security settings
	s3Client := s3.NewFromConfig(cfg)
	
	// Check bucket exists
	_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String("secureapp-bucket"),
	})
	assert.NoError(t, err)

	// Check public access is blocked
	publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String("secureapp-bucket"),
	})
	assert.NoError(t, err)
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls)
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy)

	// Test DynamoDB Table exists
	dynamoClient := dynamodb.NewFromConfig(cfg)
	tableOutput, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
		TableName: aws.String("SecureApp-Table"),
	})
	assert.NoError(t, err)
	assert.Equal(t, "ACTIVE", string(tableOutput.Table.TableStatus))
}
```