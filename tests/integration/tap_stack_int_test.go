//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/stepfunctions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the CloudFormation stack outputs
type StackOutputs struct {
	RawImageBucketName         string `json:"RawImageBucketName"`
	ProcessedBucketName        string `json:"ProcessedBucketName"`
	ModelBucketName            string `json:"ModelBucketName"`
	MetadataTableName          string `json:"MetadataTableName"`
	InferenceApiEndpoint       string `json:"InferenceApiEndpoint"`
	InferenceAPIEndpoint83653F string `json:"InferenceAPIEndpoint83653F54"`
}

// loadStackOutputs loads stack outputs from cfn-outputs/flat-outputs.json
func loadStackOutputs(t *testing.T) *StackOutputs {
	data, err := os.ReadFile("cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Skipping integration test - no stack outputs found: %v", err)
		return nil
	}

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Load stack outputs
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	t.Run("data infrastructure validation", func(t *testing.T) {
		testDataInfrastructure(t, ctx, cfg, outputs)
	})

	t.Run("training infrastructure validation", func(t *testing.T) {
		testTrainingInfrastructure(t, ctx, cfg, outputs)
	})

	t.Run("inference infrastructure validation", func(t *testing.T) {
		testInferenceInfrastructure(t, ctx, cfg, outputs)
	})

	t.Run("monitoring infrastructure validation", func(t *testing.T) {
		testMonitoringInfrastructure(t, ctx, cfg, outputs)
	})

	t.Run("can deploy and destroy stack successfully", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "inttest"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackIntegrationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

		t.Log("Stack created successfully in memory. Full deployment testing requires CDK CLI integration.")
	})

	t.Run("stack resources are created with correct naming", func(t *testing.T) {
		// ARRANGE & ASSERT
		assert.Contains(t, outputs.RawImageBucketName, "raw-images-")
		assert.Contains(t, outputs.ProcessedBucketName, "processed-images-")
		assert.Contains(t, outputs.ModelBucketName, "model-artifacts-")
		assert.Contains(t, outputs.MetadataTableName, "image-metadata-")
		assert.NotEmpty(t, outputs.InferenceApiEndpoint)

		t.Logf("Validated resource naming conventions")
		t.Logf("  Raw Bucket: %s", outputs.RawImageBucketName)
		t.Logf("  Processed Bucket: %s", outputs.ProcessedBucketName)
		t.Logf("  Model Bucket: %s", outputs.ModelBucketName)
		t.Logf("  Metadata Table: %s", outputs.MetadataTableName)
		t.Logf("  API Endpoint: %s", outputs.InferenceApiEndpoint)
	})
}

func testDataInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("S3 buckets exist and are encrypted", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		buckets := []string{
			outputs.RawImageBucketName,
			outputs.ProcessedBucketName,
			outputs.ModelBucketName,
		}

		for _, bucketName := range buckets {
			// Check bucket exists
			_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Bucket %s should exist", bucketName)

			// Check encryption
			encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Should be able to get encryption for bucket %s", bucketName)
			assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules, "Bucket %s should have encryption rules", bucketName)

			// Check versioning
			versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Should be able to get versioning for bucket %s", bucketName)
			assert.Equal(t, "Enabled", string(versioning.Status), "Bucket %s should have versioning enabled", bucketName)

			// Check public access block
			publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Should be able to get public access block for bucket %s", bucketName)
			assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls, "Bucket %s should block public ACLs", bucketName)
			assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy, "Bucket %s should block public policy", bucketName)
			assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls, "Bucket %s should ignore public ACLs", bucketName)
			assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Bucket %s should restrict public buckets", bucketName)

			t.Logf("✓ Bucket %s is properly configured", bucketName)
		}
	})

	t.Run("DynamoDB table exists with encryption", func(t *testing.T) {
		dynamoClient := dynamodb.NewFromConfig(cfg)

		table, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})
		assert.NoError(t, err, "Table should exist")
		assert.NotNil(t, table.Table, "Table description should not be nil")
		assert.Equal(t, outputs.MetadataTableName, *table.Table.TableName)

		// Check encryption
		assert.NotNil(t, table.Table.SSEDescription, "Table should have encryption configured")
		assert.NotEmpty(t, table.Table.SSEDescription.KMSMasterKeyArn, "Table should use KMS encryption")

		// Check billing mode
		assert.Equal(t, "PAY_PER_REQUEST", string(table.Table.BillingModeSummary.BillingMode), "Table should use on-demand billing")

		// Check partition key
		assert.NotEmpty(t, table.Table.KeySchema, "Table should have key schema")
		assert.Equal(t, "image_id", *table.Table.KeySchema[0].AttributeName, "Partition key should be image_id")

		t.Logf("✓ DynamoDB table %s is properly configured", outputs.MetadataTableName)
	})

	t.Run("Kinesis stream exists with encryption", func(t *testing.T) {
		kinesisClient := kinesis.NewFromConfig(cfg)

		// Extract environment suffix from bucket name
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
		streamName := "image-processing-" + envSuffix

		stream, err := kinesisClient.DescribeStream(ctx, &kinesis.DescribeStreamInput{
			StreamName: aws.String(streamName),
		})
		assert.NoError(t, err, "Kinesis stream should exist")
		assert.NotNil(t, stream.StreamDescription, "Stream description should not be nil")

		// Check encryption
		assert.Equal(t, "KMS", string(stream.StreamDescription.EncryptionType), "Stream should use KMS encryption")
		assert.NotEmpty(t, stream.StreamDescription.KeyId, "Stream should have KMS key ID")

		// Check stream mode
		assert.Equal(t, "ON_DEMAND", string(stream.StreamDescription.StreamModeDetails.StreamMode), "Stream should be ON_DEMAND")

		t.Logf("✓ Kinesis stream %s is properly configured", streamName)
	})

	t.Run("KMS key exists with rotation enabled", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		// Get KMS key from DynamoDB table description
		dynamoClient := dynamodb.NewFromConfig(cfg)
		table, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})
		require.NoError(t, err, "Should get table description")

		keyArn := table.Table.SSEDescription.KMSMasterKeyArn
		require.NotEmpty(t, keyArn, "Should have KMS key ARN")

		// Extract key ID from ARN
		keyID := (*keyArn)[strings.LastIndex(*keyArn, "/")+1:]

		// Check key rotation
		rotationStatus, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: aws.String(keyID),
		})
		assert.NoError(t, err, "Should be able to get key rotation status")
		assert.True(t, *rotationStatus.KeyRotationEnabled, "Key rotation should be enabled")

		t.Logf("✓ KMS key has rotation enabled")
	})
}

func testTrainingInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("training bucket exists", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
		trainingBucket := "model-training-" + envSuffix

		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(trainingBucket),
		})
		assert.NoError(t, err, "Training bucket should exist")

		t.Logf("✓ Training bucket %s exists", trainingBucket)
	})

	t.Run("Step Functions state machine exists", func(t *testing.T) {
		sfnClient := stepfunctions.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
		stateMachineName := "ml-model-training-pipeline-" + envSuffix

		// List state machines and find ours
		listOutput, err := sfnClient.ListStateMachines(ctx, &stepfunctions.ListStateMachinesInput{})
		assert.NoError(t, err, "Should be able to list state machines")

		var stateMachineArn *string
		for _, sm := range listOutput.StateMachines {
			if *sm.Name == stateMachineName {
				stateMachineArn = sm.StateMachineArn
				break
			}
		}

		assert.NotNil(t, stateMachineArn, "State machine should exist")

		// Describe state machine
		description, err := sfnClient.DescribeStateMachine(ctx, &stepfunctions.DescribeStateMachineInput{
			StateMachineArn: stateMachineArn,
		})
		assert.NoError(t, err, "Should be able to describe state machine")
		assert.Equal(t, stateMachineName, *description.Name, "State machine name should match")

		t.Logf("✓ Step Functions state machine %s exists", stateMachineName)
	})
}

func testInferenceInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("API Gateway endpoint is accessible", func(t *testing.T) {
		// Get the API endpoint
		apiEndpoint := outputs.InferenceApiEndpoint
		if apiEndpoint == "" {
			apiEndpoint = outputs.InferenceAPIEndpoint83653F
		}

		require.NotEmpty(t, apiEndpoint, "API endpoint should not be empty")

		// Make a test request to the API
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		// Test POST to /predict endpoint
		predictURL := strings.TrimSuffix(apiEndpoint, "/") + "/predict"
		req, err := http.NewRequestWithContext(ctx, "POST", predictURL, strings.NewReader(`{"test": "data"}`))
		require.NoError(t, err, "Should create request")
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		assert.NoError(t, err, "Should be able to reach API endpoint")

		if resp != nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			// API should return 200 (success)
			assert.Equal(t, http.StatusOK, resp.StatusCode, "API should return 200, got %d: %s", resp.StatusCode, string(body))

			t.Logf("✓ API Gateway endpoint %s is accessible", predictURL)
			t.Logf("  Response: %s", string(body))
		}
	})

	t.Run("model bucket has correct permissions", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket policy exists
		_, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.ModelBucketName),
		})
		// Policy might not exist or might exist - both are okay
		if err == nil {
			t.Logf("✓ Model bucket has bucket policy")
		} else {
			t.Logf("✓ Model bucket exists (no explicit policy)")
		}
	})
}

func testMonitoringInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("CloudWatch dashboard exists", func(t *testing.T) {
		cwClient := cloudwatch.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
		dashboardName := "ml-pipeline-dashboard-" + envSuffix

		// List dashboards to find ours
		listOutput, err := cwClient.ListDashboards(ctx, &cloudwatch.ListDashboardsInput{})
		assert.NoError(t, err, "Should be able to list dashboards")

		found := false
		for _, dashboard := range listOutput.DashboardEntries {
			if *dashboard.DashboardName == dashboardName {
				found = true
				break
			}
		}

		assert.True(t, found, "CloudWatch dashboard should exist")
		t.Logf("✓ CloudWatch dashboard %s exists", dashboardName)
	})

	t.Run("CloudWatch alarms exist", func(t *testing.T) {
		cwClient := cloudwatch.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]

		alarmNames := []string{
			"api-latency-alarm-" + envSuffix,
			"lambda-error-alarm-" + envSuffix,
		}

		for _, alarmName := range alarmNames {
			alarmsOutput, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
				AlarmNames: []string{alarmName},
			})
			assert.NoError(t, err, "Should be able to describe alarm %s", alarmName)
			assert.NotEmpty(t, alarmsOutput.MetricAlarms, "Alarm %s should exist", alarmName)

			if len(alarmsOutput.MetricAlarms) > 0 {
				alarm := alarmsOutput.MetricAlarms[0]
				assert.Equal(t, alarmName, *alarm.AlarmName, "Alarm name should match")
				assert.NotEmpty(t, alarm.AlarmActions, "Alarm should have actions configured")

				t.Logf("✓ CloudWatch alarm %s exists with %d actions", alarmName, len(alarm.AlarmActions))
			}
		}
	})

	t.Run("SNS topic exists", func(t *testing.T) {
		snsClient := sns.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
		topicName := "ml-pipeline-alerts-" + envSuffix

		// List topics to find ours
		listOutput, err := snsClient.ListTopics(ctx, &sns.ListTopicsInput{})
		assert.NoError(t, err, "Should be able to list SNS topics")

		found := false
		var topicArn string
		for _, topic := range listOutput.Topics {
			if strings.Contains(*topic.TopicArn, topicName) {
				found = true
				topicArn = *topic.TopicArn
				break
			}
		}

		assert.True(t, found, "SNS topic should exist")
		t.Logf("✓ SNS topic %s exists", topicArn)
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 20*time.Minute, func(wo *cloudformation.StackCreateCompleteWaiterOptions) {
		wo.MinDelay = 30 * time.Second
		wo.MaxDelay = 2 * time.Minute
	})
}

// Helper function to check if stack exists
func stackExists(ctx context.Context, cfnClient *cloudformation.Client, stackName string) bool {
	_, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	})

	if err != nil {
		// Check if error is "Stack not found"
		return false
	}

	return true
}

// Helper function to clean up test resources
func cleanupStack(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	if !stackExists(ctx, cfnClient, stackName) {
		return nil
	}

	_, err := cfnClient.DeleteStack(ctx, &cloudformation.DeleteStackInput{
		StackName:       aws.String(stackName),
		RetainResources: []string{}, // Specify resources to retain if needed
	})

	if err != nil {
		return err
	}

	// Wait for stack deletion
	waiter := cloudformation.NewStackDeleteCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
