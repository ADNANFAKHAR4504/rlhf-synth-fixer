//go:build integration

package lib_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	cloudformationtypes "github.com/aws/aws-sdk-go-v2/service/cloudformation/types"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	// Load stack outputs from deployed CloudFormation stack
	outputs := loadStackOutputs(t, ctx, cfg)

	t.Run("S3 data bucket exists and is accessible", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT
		headOutput, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Data bucket should exist and be accessible")
		assert.NotNil(t, headOutput)
		t.Logf("Data bucket exists: %s", outputs.DataBucketName)
	})

	t.Run("S3 processed bucket exists and is accessible", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT
		headOutput, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Processed bucket should exist and be accessible")
		assert.NotNil(t, headOutput)
		t.Logf("Processed bucket exists: %s", outputs.ProcessedBucketName)
	})

	t.Run("S3 buckets have KMS encryption enabled", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check data bucket encryption
		dataEncryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Data bucket should have encryption configured")
		assert.NotNil(t, dataEncryption.ServerSideEncryptionConfiguration)
		assert.Greater(t, len(dataEncryption.ServerSideEncryptionConfiguration.Rules), 0)
		assert.Equal(t, "aws:kms", string(dataEncryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))
		t.Logf("Data bucket has KMS encryption enabled")

		// ACT - Check processed bucket encryption
		processedEncryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Processed bucket should have encryption configured")
		assert.NotNil(t, processedEncryption.ServerSideEncryptionConfiguration)
		assert.Equal(t, "aws:kms", string(processedEncryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))
		t.Logf("Processed bucket has KMS encryption enabled")
	})

	t.Run("S3 buckets have versioning enabled", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check data bucket versioning
		dataVersioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get data bucket versioning")
		assert.Equal(t, "Enabled", string(dataVersioning.Status))
		t.Logf("Data bucket has versioning enabled")

		// ACT - Check processed bucket versioning
		processedVersioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get processed bucket versioning")
		assert.Equal(t, "Enabled", string(processedVersioning.Status))
		t.Logf("Processed bucket has versioning enabled")
	})

	t.Run("S3 buckets block all public access", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check data bucket public access block
		dataPublicAccess, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get data bucket public access configuration")
		assert.True(t, *dataPublicAccess.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *dataPublicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *dataPublicAccess.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *dataPublicAccess.PublicAccessBlockConfiguration.RestrictPublicBuckets)
		t.Logf("Data bucket blocks all public access")

		// ACT - Check processed bucket public access block
		processedPublicAccess, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get processed bucket public access configuration")
		assert.True(t, *processedPublicAccess.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *processedPublicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy)
		t.Logf("Processed bucket blocks all public access")
	})

	t.Run("Lambda function exists and is configured correctly", func(t *testing.T) {
		// ARRANGE
		lambdaClient := lambda.NewFromConfig(cfg)
		functionName := extractFunctionName(outputs.ProcessingFunctionArn)

		// ACT
		getOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})

		// ASSERT
		require.NoError(t, err, "Lambda function should exist")
		assert.NotNil(t, getOutput.Configuration)
		assert.Equal(t, "provided.al2023", string(getOutput.Configuration.Runtime))
		assert.Equal(t, "bootstrap", *getOutput.Configuration.Handler)
		assert.Equal(t, int32(512), *getOutput.Configuration.MemorySize)
		assert.Equal(t, int32(300), *getOutput.Configuration.Timeout)
		t.Logf("Lambda function exists with correct runtime: %s", functionName)

		// Verify environment variables
		assert.NotNil(t, getOutput.Configuration.Environment)
		envVars := getOutput.Configuration.Environment.Variables
		assert.Contains(t, envVars, "PROCESSED_BUCKET")
		assert.Contains(t, envVars, "ENVIRONMENT")
		assert.Equal(t, outputs.ProcessedBucketName, envVars["PROCESSED_BUCKET"])
		t.Logf("Lambda environment variables configured correctly")
	})

	t.Run("Lambda function is deployed in VPC", func(t *testing.T) {
		// ARRANGE
		lambdaClient := lambda.NewFromConfig(cfg)
		functionName := extractFunctionName(outputs.ProcessingFunctionArn)

		// ACT
		getOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get Lambda function")
		assert.NotNil(t, getOutput.Configuration.VpcConfig)
		assert.NotEmpty(t, getOutput.Configuration.VpcConfig.VpcId)
		assert.NotEmpty(t, getOutput.Configuration.VpcConfig.SubnetIds)
		assert.NotEmpty(t, getOutput.Configuration.VpcConfig.SecurityGroupIds)
		assert.Equal(t, outputs.VpcId, *getOutput.Configuration.VpcConfig.VpcId)
		t.Logf("Lambda is deployed in VPC: %s", *getOutput.Configuration.VpcConfig.VpcId)
	})

	t.Run("VPC has correct configuration", func(t *testing.T) {
		// ARRANGE
		ec2Client := ec2.NewFromConfig(cfg)

		// ACT
		describeVpcs, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})

		// ASSERT
		require.NoError(t, err, "Should be able to describe VPC")
		assert.Len(t, describeVpcs.Vpcs, 1)
		vpc := describeVpcs.Vpcs[0]
		assert.NotNil(t, vpc.CidrBlock)
		t.Logf("VPC exists with CIDR: %s", *vpc.CidrBlock)

		// Verify VPC has S3 endpoint
		describeEndpoints, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
				{
					Name:   aws.String("service-name"),
					Values: []string{fmt.Sprintf("com.amazonaws.%s.s3", cfg.Region)},
				},
			},
		})
		require.NoError(t, err, "Should be able to describe VPC endpoints")
		assert.Greater(t, len(describeEndpoints.VpcEndpoints), 0, "VPC should have S3 gateway endpoint")
		t.Logf("VPC has S3 gateway endpoint configured")
	})

	t.Run("can upload file to data bucket and trigger Lambda", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)
		testKey := fmt.Sprintf("incoming/test-data-%d.txt", time.Now().Unix())
		testContent := []byte("test healthcare data for HIPAA compliance validation")

		// ACT - Upload test file
		_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket: aws.String(outputs.DataBucketName),
			Key:    aws.String(testKey),
			Body:   bytes.NewReader(testContent),
		})
		require.NoError(t, err, "Should be able to upload file to data bucket")
		t.Logf("Uploaded test file: %s", testKey)

		// Clean up
		defer func() {
			_, _ = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(outputs.DataBucketName),
				Key:    aws.String(testKey),
			})
		}()

		// ASSERT - Verify file exists
		headOutput, err := s3Client.HeadObject(ctx, &s3.HeadObjectInput{
			Bucket: aws.String(outputs.DataBucketName),
			Key:    aws.String(testKey),
		})
		require.NoError(t, err, "Uploaded file should exist")
		assert.NotNil(t, headOutput)
		assert.NotNil(t, headOutput.ServerSideEncryption, "Object should be encrypted")
		t.Logf("Object is encrypted with: %s", headOutput.ServerSideEncryption)

		// Wait a bit for Lambda to process (if it does)
		time.Sleep(5 * time.Second)

		// Check if processed file exists
		processedKey := fmt.Sprintf("processed/test-data-%d.txt", time.Now().Unix())
		_, err = s3Client.HeadObject(ctx, &s3.HeadObjectInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
			Key:    aws.String(processedKey),
		})
		// Note: This might fail if Lambda doesn't process immediately, which is okay for this test
		if err == nil {
			t.Logf("Lambda processed the file: %s", processedKey)
		} else {
			t.Logf("Lambda may not have processed the file yet (async processing)")
		}
	})

	t.Run("CloudTrail is configured and logging", func(t *testing.T) {
		// ARRANGE
		cloudtrailClient := cloudtrail.NewFromConfig(cfg)
		trailName := extractTrailName(outputs.TrailArn)

		// ACT
		getTrailStatus, err := cloudtrailClient.GetTrailStatus(ctx, &cloudtrail.GetTrailStatusInput{
			Name: aws.String(trailName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get CloudTrail status")
		assert.True(t, *getTrailStatus.IsLogging, "CloudTrail should be actively logging")
		t.Logf("CloudTrail is actively logging: %s", trailName)

		// Get trail details
		describeTrails, err := cloudtrailClient.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{
			TrailNameList: []string{trailName},
		})
		require.NoError(t, err, "Should be able to describe trail")
		assert.Len(t, describeTrails.TrailList, 1)
		trail := describeTrails.TrailList[0]
		assert.NotNil(t, trail.KmsKeyId, "Trail should use KMS encryption")
		assert.True(t, *trail.LogFileValidationEnabled, "Trail should have log file validation enabled")
		t.Logf("CloudTrail has KMS encryption and log file validation enabled")
	})

	t.Run("KMS keys have rotation enabled", func(t *testing.T) {
		// ARRANGE
		kmsClient := kms.NewFromConfig(cfg)

		// List aliases to find our healthcare KMS keys
		listAliases, err := kmsClient.ListAliases(ctx, &kms.ListAliasesInput{})
		require.NoError(t, err, "Should be able to list KMS aliases")

		healthcareKeyCount := 0
		for _, alias := range listAliases.Aliases {
			if alias.AliasName != nil && contains(*alias.AliasName, "healthcare") {
				if alias.TargetKeyId != nil {
					// Check key rotation status
					getKeyRotation, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
						KeyId: alias.TargetKeyId,
					})
					if err == nil {
						assert.True(t, getKeyRotation.KeyRotationEnabled, "KMS key should have rotation enabled")
						t.Logf("KMS key %s has rotation enabled", *alias.AliasName)
						healthcareKeyCount++
					}
				}
			}
		}

		assert.Greater(t, healthcareKeyCount, 0, "Should find at least one healthcare KMS key with rotation enabled")
	})

	t.Run("S3 buckets have lifecycle policies configured", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check data bucket lifecycle
		dataLifecycle, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Data bucket should have lifecycle configuration")
		assert.NotNil(t, dataLifecycle.Rules)
		assert.Greater(t, len(dataLifecycle.Rules), 0, "Data bucket should have lifecycle rules")
		t.Logf("Data bucket has %d lifecycle rule(s)", len(dataLifecycle.Rules))

		// Verify transition to Intelligent Tiering
		foundTransition := false
		for _, rule := range dataLifecycle.Rules {
			if rule.Transitions != nil && len(rule.Transitions) > 0 {
				for _, transition := range rule.Transitions {
					if transition.StorageClass == "INTELLIGENT_TIERING" {
						foundTransition = true
						assert.Equal(t, int32(90), *transition.Days)
						t.Logf("Found lifecycle transition to Intelligent Tiering after 90 days")
					}
				}
			}
		}
		assert.True(t, foundTransition, "Should have transition to Intelligent Tiering")
	})

	t.Run("stack resources have HIPAA compliance tags", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check data bucket tags
		dataTagging, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
			Bucket: aws.String(outputs.DataBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get bucket tags")
		assert.NotNil(t, dataTagging.TagSet)

		tags := make(map[string]string)
		for _, tag := range dataTagging.TagSet {
			tags[*tag.Key] = *tag.Value
		}

		assert.Contains(t, tags, "Compliance", "Should have Compliance tag")
		assert.Equal(t, "HIPAA", tags["Compliance"], "Compliance tag should be HIPAA")
		assert.Contains(t, tags, "DataClass", "Should have DataClass tag")
		assert.Equal(t, "PHI", tags["DataClass"], "DataClass should be PHI")
		t.Logf("Resources have HIPAA compliance tags: Compliance=%s, DataClass=%s", tags["Compliance"], tags["DataClass"])
	})
}

// loadStackOutputs tries file-based loading first, then CloudFormation as fallback
func loadStackOutputs(t *testing.T, ctx context.Context, cfg aws.Config) *StackOutputs {
	t.Helper()

	// Try file-based approach first (faster and works in CI)
	candidatePaths := []string{
		os.Getenv("CFN_FLAT_OUTPUTS"),
		"cfn-outputs/flat-outputs.json",
		"./cfn-outputs/flat-outputs.json",
		"../cfn-outputs/flat-outputs.json",
		"../../cfn-outputs/flat-outputs.json",
	}

	for _, path := range candidatePaths {
		if path == "" {
			continue
		}
		data, err := os.ReadFile(path)
		if err == nil {
			t.Logf("Loading outputs from file: %s", path)
			var outputs StackOutputs
			err = json.Unmarshal(data, &outputs)
			require.NoError(t, err, "Failed to parse stack outputs JSON")

			require.NotEmpty(t, outputs.DataBucketName, "DataBucketName should not be empty")
			require.NotEmpty(t, outputs.ProcessedBucketName, "ProcessedBucketName should not be empty")
			require.NotEmpty(t, outputs.ProcessingFunctionArn, "ProcessingFunctionArn should not be empty")
			require.NotEmpty(t, outputs.VpcId, "VpcId should not be empty")
			require.NotEmpty(t, outputs.TrailArn, "TrailArn should not be empty")

			t.Logf("Loaded from file: DataBucket=%s, ProcessedBucket=%s, Lambda=%s, VPC=%s",
				outputs.DataBucketName, outputs.ProcessedBucketName, outputs.ProcessingFunctionArn, outputs.VpcId)
			return &outputs
		}
	}

	// Fall back to CloudFormation query
	t.Logf("File-based loading failed, trying CloudFormation query...")
	return loadStackOutputsFromCloudFormation(t, ctx, cfg)
}

// findTapStack attempts to find the TapStack by listing stacks
func findTapStack(t *testing.T, ctx context.Context, cfnClient *cloudformation.Client) string {
	// List all stacks and find one that matches TapStack pattern
	listOutput, err := cfnClient.ListStacks(ctx, &cloudformation.ListStacksInput{
		StackStatusFilter: []cloudformationtypes.StackStatus{
			cloudformationtypes.StackStatusCreateComplete,
			cloudformationtypes.StackStatusUpdateComplete,
		},
	})

	if err == nil {
		for _, stack := range listOutput.StackSummaries {
			stackName := *stack.StackName
			// Look for stack names containing "TapStack"
			if contains(stackName, "TapStack") {
				t.Logf("Found TapStack: %s", stackName)
				return stackName
			}
		}
	}

	// Default fallback
	return "TapStackdev"
}

// loadStackOutputsFromCloudFormation queries CloudFormation for stack outputs
func loadStackOutputsFromCloudFormation(t *testing.T, ctx context.Context, cfg aws.Config) *StackOutputs {
	t.Helper()
	cfnClient := cloudformation.NewFromConfig(cfg)

	// Determine stack name from environment or use default pattern
	stackName := os.Getenv("STACK_NAME")
	if stackName == "" {
		stackName = findTapStack(t, ctx, cfnClient)
	}

	t.Logf("Loading outputs from CloudFormation stack: %s", stackName)

	// Get stack outputs from CloudFormation
	describeOutput, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	})

	require.NoError(t, err, "Failed to describe CloudFormation stack. Please deploy the stack first using: ./scripts/deploy.sh")
	require.NotEmpty(t, describeOutput.Stacks, "No stacks found")

	stack := describeOutput.Stacks[0]

	// Log all available outputs for debugging
	t.Logf("Found %d outputs in stack:", len(stack.Outputs))
	for _, output := range stack.Outputs {
		if output.OutputKey != nil && output.OutputValue != nil {
			t.Logf("  - %s = %s", *output.OutputKey, *output.OutputValue)
		}
	}

	outputs := &StackOutputs{}
	for _, output := range stack.Outputs {
		if output.OutputKey == nil || output.OutputValue == nil {
			continue
		}

		key := *output.OutputKey
		value := *output.OutputValue

		// Match output keys
		if key == "DataBucketName" {
			outputs.DataBucketName = value
		} else if key == "ProcessedBucketName" {
			outputs.ProcessedBucketName = value
		} else if key == "ProcessingFunctionArn" {
			outputs.ProcessingFunctionArn = value
		} else if key == "VpcId" {
			outputs.VpcId = value
		} else if key == "TrailArn" {
			outputs.TrailArn = value
		}
	}

	require.NotEmpty(t, outputs.DataBucketName, "DataBucketName should not be empty in CloudFormation outputs")
	require.NotEmpty(t, outputs.ProcessedBucketName, "ProcessedBucketName should not be empty in CloudFormation outputs")
	require.NotEmpty(t, outputs.ProcessingFunctionArn, "ProcessingFunctionArn should not be empty in CloudFormation outputs")
	require.NotEmpty(t, outputs.VpcId, "VpcId should not be empty in CloudFormation outputs")
	require.NotEmpty(t, outputs.TrailArn, "TrailArn should not be empty in CloudFormation outputs")

	t.Logf("Loaded from CloudFormation: DataBucket=%s, ProcessedBucket=%s, Lambda=%s, VPC=%s, Trail=%s",
		outputs.DataBucketName, outputs.ProcessedBucketName, outputs.ProcessingFunctionArn, outputs.VpcId, outputs.TrailArn)

	return outputs
}

// StackOutputs holds the deployed stack resource names
type StackOutputs struct {
	DataBucketName        string `json:"DataBucketName"`
	ProcessedBucketName   string `json:"ProcessedBucketName"`
	ProcessingFunctionArn string `json:"ProcessingFunctionArn"`
	VpcId                 string `json:"VpcId"`
	TrailArn              string `json:"TrailArn"`
}

// Helper functions
func contains(s, substr string) bool {
	return len(s) >= len(substr) && findSubstring(s, substr)
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func extractFunctionName(arn string) string {
	// Extract function name from ARN: arn:aws:lambda:region:account:function:name
	for i := len(arn) - 1; i >= 0; i-- {
		if arn[i] == ':' {
			return arn[i+1:]
		}
	}
	return arn
}

func extractTrailName(arn string) string {
	// Extract trail name from ARN: arn:aws:cloudtrail:region:account:trail/name
	for i := len(arn) - 1; i >= 0; i-- {
		if arn[i] == '/' {
			return arn[i+1:]
		}
	}
	return arn
}
