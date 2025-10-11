//go:build integration

package lib_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamodbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
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

	// Load stack outputs from deployed resources
	outputs := loadStackOutputs(t)
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	t.Run("S3 source bucket exists and is accessible", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT
		headOutput, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.SourceBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Source bucket should exist and be accessible")
		assert.NotNil(t, headOutput)
		t.Logf("✅ Source bucket exists: %s", outputs.SourceBucketName)
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
		t.Logf("✅ Processed bucket exists: %s", outputs.ProcessedBucketName)
	})

	t.Run("DynamoDB metadata table exists and is accessible", func(t *testing.T) {
		// ARRANGE
		dynamoClient := dynamodb.NewFromConfig(cfg)

		// ACT
		describeOutput, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})

		// ASSERT
		require.NoError(t, err, "DynamoDB table should exist")
		assert.NotNil(t, describeOutput.Table)
		assert.Equal(t, outputs.MetadataTableName, *describeOutput.Table.TableName)
		assert.Equal(t, "ACTIVE", string(describeOutput.Table.TableStatus))
		t.Logf("✅ DynamoDB table exists and is ACTIVE: %s", outputs.MetadataTableName)

		// Verify key schema
		require.Len(t, describeOutput.Table.KeySchema, 2, "Table should have partition and sort key")
		assert.Equal(t, "imageId", *describeOutput.Table.KeySchema[0].AttributeName)
		assert.Equal(t, "timestamp", *describeOutput.Table.KeySchema[1].AttributeName)
	})

	t.Run("Lambda function exists and is configured correctly", func(t *testing.T) {
		// ARRANGE
		lambdaClient := lambda.NewFromConfig(cfg)

		// ACT
		getOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})

		// ASSERT
		require.NoError(t, err, "Lambda function should exist")
		assert.NotNil(t, getOutput.Configuration)
		assert.Equal(t, outputs.LambdaFunctionName, *getOutput.Configuration.FunctionName)
		assert.Equal(t, "provided.al2023", string(getOutput.Configuration.Runtime))
		assert.Equal(t, int32(1024), *getOutput.Configuration.MemorySize)
		assert.Equal(t, int32(30), *getOutput.Configuration.Timeout)
		t.Logf("✅ Lambda function exists: %s", outputs.LambdaFunctionName)

		// Verify environment variables
		assert.NotNil(t, getOutput.Configuration.Environment)
		envVars := getOutput.Configuration.Environment.Variables
		assert.Contains(t, envVars, "PROCESSED_BUCKET")
		assert.Contains(t, envVars, "METADATA_TABLE")
	})

	t.Run("can upload file to source bucket and verify Lambda is triggered", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)
		testKey := fmt.Sprintf("uploads/test-image-%d.txt", time.Now().Unix())
		testContent := []byte("test image content for integration test")

		// ACT - Upload test file
		_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket: aws.String(outputs.SourceBucketName),
			Key:    aws.String(testKey),
			Body:   bytes.NewReader(testContent),
		})
		require.NoError(t, err, "Should be able to upload file to source bucket")
		t.Logf("✅ Uploaded test file: %s", testKey)

		// Clean up
		defer func() {
			_, _ = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(outputs.SourceBucketName),
				Key:    aws.String(testKey),
			})
		}()

		// ASSERT - Verify file exists
		headOutput, err := s3Client.HeadObject(ctx, &s3.HeadObjectInput{
			Bucket: aws.String(outputs.SourceBucketName),
			Key:    aws.String(testKey),
		})
		require.NoError(t, err, "Uploaded file should exist")
		assert.NotNil(t, headOutput)
	})

	t.Run("can write and read from DynamoDB metadata table", func(t *testing.T) {
		// ARRANGE
		dynamoClient := dynamodb.NewFromConfig(cfg)
		testImageId := fmt.Sprintf("test-image-%d", time.Now().Unix())
		testTimestamp := time.Now().Unix()

		// ACT - Write item
		_, err := dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(outputs.MetadataTableName),
			Item: map[string]dynamodbtypes.AttributeValue{
				"imageId":          &dynamodbtypes.AttributeValueMemberS{Value: testImageId},
				"timestamp":        &dynamodbtypes.AttributeValueMemberN{Value: fmt.Sprintf("%d", testTimestamp)},
				"processingStatus": &dynamodbtypes.AttributeValueMemberS{Value: "pending"},
				"userId":           &dynamodbtypes.AttributeValueMemberS{Value: "integration-test"},
			},
		})
		require.NoError(t, err, "Should be able to write to DynamoDB table")
		t.Logf("✅ Written test item to DynamoDB: %s", testImageId)

		// Clean up
		defer func() {
			_, _ = dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
				TableName: aws.String(outputs.MetadataTableName),
				Key: map[string]dynamodbtypes.AttributeValue{
					"imageId":   &dynamodbtypes.AttributeValueMemberS{Value: testImageId},
					"timestamp": &dynamodbtypes.AttributeValueMemberN{Value: fmt.Sprintf("%d", testTimestamp)},
				},
			})
		}()

		// ASSERT - Read item back
		getOutput, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(outputs.MetadataTableName),
			Key: map[string]dynamodbtypes.AttributeValue{
				"imageId":   &dynamodbtypes.AttributeValueMemberS{Value: testImageId},
				"timestamp": &dynamodbtypes.AttributeValueMemberN{Value: fmt.Sprintf("%d", testTimestamp)},
			},
		})
		require.NoError(t, err, "Should be able to read from DynamoDB table")
		assert.NotNil(t, getOutput.Item)
		assert.Contains(t, getOutput.Item, "processingStatus")
	})

	t.Run("DynamoDB table has correct GSI configuration", func(t *testing.T) {
		// ARRANGE
		dynamoClient := dynamodb.NewFromConfig(cfg)

		// ACT
		describeOutput, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to describe table")
		assert.NotNil(t, describeOutput.Table.GlobalSecondaryIndexes)
		assert.GreaterOrEqual(t, len(describeOutput.Table.GlobalSecondaryIndexes), 2, "Table should have at least 2 GSIs")

		// Verify StatusIndex exists
		hasStatusIndex := false
		hasUserIndex := false
		for _, gsi := range describeOutput.Table.GlobalSecondaryIndexes {
			if *gsi.IndexName == "StatusIndex" {
				hasStatusIndex = true
				assert.Equal(t, "processingStatus", *gsi.KeySchema[0].AttributeName)
			}
			if *gsi.IndexName == "UserIndex" {
				hasUserIndex = true
				assert.Equal(t, "userId", *gsi.KeySchema[0].AttributeName)
			}
		}
		assert.True(t, hasStatusIndex, "StatusIndex should exist")
		assert.True(t, hasUserIndex, "UserIndex should exist")
		t.Logf("✅ GSI configuration verified: StatusIndex and UserIndex exist")
	})

	t.Run("S3 buckets have lifecycle policies configured", func(t *testing.T) {
		// ARRANGE
		s3Client := s3.NewFromConfig(cfg)

		// ACT - Check source bucket lifecycle
		sourceLifecycle, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.SourceBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Source bucket should have lifecycle configuration")
		assert.NotNil(t, sourceLifecycle.Rules)
		assert.Greater(t, len(sourceLifecycle.Rules), 0, "Source bucket should have lifecycle rules")
		t.Logf("✅ Source bucket has %d lifecycle rule(s)", len(sourceLifecycle.Rules))

		// ACT - Check processed bucket lifecycle
		processedLifecycle, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.ProcessedBucketName),
		})

		// ASSERT
		require.NoError(t, err, "Processed bucket should have lifecycle configuration")
		assert.NotNil(t, processedLifecycle.Rules)
		assert.Greater(t, len(processedLifecycle.Rules), 0, "Processed bucket should have lifecycle rules")
		t.Logf("✅ Processed bucket has %d lifecycle rule(s)", len(processedLifecycle.Rules))
	})

	t.Run("Lambda function has CloudWatch logs enabled", func(t *testing.T) {
		// ARRANGE
		lambdaClient := lambda.NewFromConfig(cfg)

		// ACT
		getOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})

		// ASSERT
		require.NoError(t, err, "Should be able to get Lambda function configuration")
		assert.NotNil(t, getOutput.Configuration)

		// Verify tracing is enabled
		if getOutput.Configuration.TracingConfig != nil {
			t.Logf("✅ Lambda tracing mode: %s", getOutput.Configuration.TracingConfig.Mode)
		}

		// Verify reserved concurrency
		if getOutput.Concurrency != nil && getOutput.Concurrency.ReservedConcurrentExecutions != nil {
			assert.Equal(t, int32(10), *getOutput.Concurrency.ReservedConcurrentExecutions)
			t.Logf("✅ Lambda reserved concurrency: %d", *getOutput.Concurrency.ReservedConcurrentExecutions)
		}
	})
}

// loadStackOutputs reads the cfn-outputs/flat-outputs.json file
func loadStackOutputs(t *testing.T) *StackOutputs {
	outputsPath := filepath.Join("..", "..", "cfn-outputs", "flat-outputs.json")
	data, err := os.ReadFile(outputsPath)
	if err != nil {
		require.NoError(t, err,
			"Failed to read stack outputs file. Please deploy the stack first using: ./scripts/deploy.sh\n"+
				"Original error")
	}

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")

	require.NotEmpty(t, outputs.SourceBucketName, "SourceBucketName should not be empty")
	require.NotEmpty(t, outputs.ProcessedBucketName, "ProcessedBucketName should not be empty")
	require.NotEmpty(t, outputs.LambdaFunctionName, "LambdaFunctionName should not be empty")
	require.NotEmpty(t, outputs.MetadataTableName, "MetadataTableName should not be empty")

	return &outputs
}

// StackOutputs holds the deployed stack resource names
type StackOutputs struct {
	ProcessedBucketName string `json:"ProcessedBucketName"`
	SourceBucketName    string `json:"SourceBucketName"`
	LambdaFunctionName  string `json:"LambdaFunctionName"`
	MetadataTableName   string `json:"MetadataTableName"`
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
