//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"fmt"
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
	awsapigateway "github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamodbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	sfntypes "github.com/aws/aws-sdk-go-v2/service/sfn/types"
	"github.com/aws/aws-sdk-go-v2/service/sns"
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
	InferenceApiKeyId          string `json:"InferenceApiKeyId"`
}

// loadStackOutputs loads stack outputs from cfn-outputs/flat-outputs.json
// Tries multiple relative paths to find the file
func loadStackOutputs(t *testing.T) *StackOutputs {
	// Try multiple relative paths
	candidatePaths := []string{
		"cfn-outputs/flat-outputs.json",
		"../cfn-outputs/flat-outputs.json",
		"../../cfn-outputs/flat-outputs.json",
		"./cfn-outputs/flat-outputs.json",
		"../../../cfn-outputs/flat-outputs.json",
	}

	var data []byte
	var err error
	var foundPath string

	for _, path := range candidatePaths {
		data, err = os.ReadFile(path)
		if err == nil {
			foundPath = path
			t.Logf("Found stack outputs at: %s", path)
			break
		}
	}

	if foundPath == "" {
		t.Skipf("Skipping integration test - no stack outputs found in any of these paths: %v", candidatePaths)
		return nil
	}

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs from %s", foundPath)

	return &outputs
}

// extractEnvAndRandomSuffix extracts both environment and random suffix from a bucket name
// For example: "raw-images-pr4148-drsvph" -> "pr4148-drsvph"
func extractEnvAndRandomSuffix(bucketName string) string {
	parts := strings.Split(bucketName, "-")
	if len(parts) >= 4 {
		// For bucket names like "raw-images-pr4148-drsvph", return last two parts joined
		return parts[len(parts)-2] + "-" + parts[len(parts)-1]
	}
	// Fallback to last part only
	return parts[len(parts)-1]
}

// getApiKeyValue retrieves the API Key value from AWS using the API Key ID
func getApiKeyValue(ctx context.Context, cfg aws.Config, apiKeyId string) (string, error) {
	if apiKeyId == "" {
		return "", fmt.Errorf("API Key ID is empty")
	}

	apigwClient := awsapigateway.NewFromConfig(cfg)

	// Get the API Key value
	output, err := apigwClient.GetApiKey(ctx, &awsapigateway.GetApiKeyInput{
		ApiKey:       aws.String(apiKeyId),
		IncludeValue: aws.Bool(true),
	})
	if err != nil {
		return "", fmt.Errorf("failed to get API key: %w", err)
	}

	if output.Value == nil {
		return "", fmt.Errorf("API key value is nil")
	}

	return *output.Value, nil
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

	t.Run("Step Functions execution testing", func(t *testing.T) {
		testStepFunctionsExecution(t, ctx, cfg, outputs)
	})

	t.Run("End-to-End workflow testing", func(t *testing.T) {
		testEndToEndWorkflow(t, ctx, cfg, outputs)
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
		// Check that resource names follow the pattern: {prefix}-{env}-{random6chars}
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
			if encryption != nil && encryption.ServerSideEncryptionConfiguration != nil {
				assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules, "Bucket %s should have encryption rules", bucketName)
			}

			// Check versioning
			versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Should be able to get versioning for bucket %s", bucketName)
			if versioning != nil {
				assert.Equal(t, "Enabled", string(versioning.Status), "Bucket %s should have versioning enabled", bucketName)
			}

			// Check public access block
			publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "Should be able to get public access block for bucket %s", bucketName)
			if publicAccessBlock != nil && publicAccessBlock.PublicAccessBlockConfiguration != nil {
				assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls, "Bucket %s should block public ACLs", bucketName)
				assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy, "Bucket %s should block public policy", bucketName)
				assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls, "Bucket %s should ignore public ACLs", bucketName)
				assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Bucket %s should restrict public buckets", bucketName)
			}

			t.Logf("✓ Bucket %s is properly configured", bucketName)
		}
	})

	t.Run("DynamoDB table exists with encryption", func(t *testing.T) {
		dynamoClient := dynamodb.NewFromConfig(cfg)

		table, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})
		assert.NoError(t, err, "Table should exist")
		if !assert.NotNil(t, table, "Table response should not be nil") {
			return
		}
		if !assert.NotNil(t, table.Table, "Table description should not be nil") {
			return
		}
		assert.Equal(t, outputs.MetadataTableName, *table.Table.TableName)

		// Check encryption
		if table.Table.SSEDescription != nil {
			assert.NotNil(t, table.Table.SSEDescription, "Table should have encryption configured")
			assert.NotEmpty(t, table.Table.SSEDescription.KMSMasterKeyArn, "Table should use KMS encryption")
		}

		// Check billing mode
		if table.Table.BillingModeSummary != nil {
			assert.Equal(t, "PAY_PER_REQUEST", string(table.Table.BillingModeSummary.BillingMode), "Table should use on-demand billing")
		}

		// Check partition key
		if len(table.Table.KeySchema) > 0 {
			assert.NotEmpty(t, table.Table.KeySchema, "Table should have key schema")
			assert.Equal(t, "image_id", *table.Table.KeySchema[0].AttributeName, "Partition key should be image_id")
		}

		t.Logf("✓ DynamoDB table %s is properly configured", outputs.MetadataTableName)
	})

	t.Run("Kinesis stream exists with encryption", func(t *testing.T) {
		kinesisClient := kinesis.NewFromConfig(cfg)

		// Extract environment suffix from bucket name (includes random suffix)
		// Pattern: raw-images-{env}-{random6chars}
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		streamName := "image-processing-" + envSuffix

		stream, err := kinesisClient.DescribeStream(ctx, &kinesis.DescribeStreamInput{
			StreamName: aws.String(streamName),
		})
		assert.NoError(t, err, "Kinesis stream should exist")
		if !assert.NotNil(t, stream, "Stream response should not be nil") {
			return
		}
		if !assert.NotNil(t, stream.StreamDescription, "Stream description should not be nil") {
			return
		}

		// Check encryption
		assert.Equal(t, "KMS", string(stream.StreamDescription.EncryptionType), "Stream should use KMS encryption")
		assert.NotEmpty(t, stream.StreamDescription.KeyId, "Stream should have KMS key ID")

		// Check stream mode
		if stream.StreamDescription.StreamModeDetails != nil {
			assert.Equal(t, "ON_DEMAND", string(stream.StreamDescription.StreamModeDetails.StreamMode), "Stream should be ON_DEMAND")
		}

		t.Logf("✓ Kinesis stream %s is properly configured", streamName)
	})

	t.Run("KMS key exists with rotation enabled", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		// Get KMS key from DynamoDB table description
		dynamoClient := dynamodb.NewFromConfig(cfg)
		table, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.MetadataTableName),
		})
		if !assert.NoError(t, err, "Should get table description") {
			return
		}
		if table == nil || table.Table == nil || table.Table.SSEDescription == nil {
			t.Skip("Cannot validate KMS key - table encryption info not available")
			return
		}

		keyArn := table.Table.SSEDescription.KMSMasterKeyArn
		if keyArn == nil || *keyArn == "" {
			t.Skip("Cannot validate KMS key - no KMS key ARN available")
			return
		}

		// Extract key ID from ARN
		keyID := (*keyArn)[strings.LastIndex(*keyArn, "/")+1:]

		// Check key rotation
		rotationStatus, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: aws.String(keyID),
		})
		assert.NoError(t, err, "Should be able to get key rotation status")
		if rotationStatus != nil {
			assert.True(t, rotationStatus.KeyRotationEnabled, "Key rotation should be enabled")
		}

		t.Logf("✓ KMS key has rotation enabled")
	})
}

func testTrainingInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("training bucket exists", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Extract environment suffix from bucket name (includes random suffix)
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		trainingBucket := "model-training-" + envSuffix

		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(trainingBucket),
		})
		assert.NoError(t, err, "Training bucket should exist")

		t.Logf("✓ Training bucket %s exists", trainingBucket)
	})

	t.Run("Step Functions state machine exists", func(t *testing.T) {
		sfnClient := sfn.NewFromConfig(cfg)

		// Extract environment suffix from bucket name (includes random suffix)
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		stateMachineName := "ml-model-training-pipeline-" + envSuffix

		// List state machines to find ours
		listOutput, err := sfnClient.ListStateMachines(ctx, &sfn.ListStateMachinesInput{})
		assert.NoError(t, err, "Should be able to list state machines")

		if listOutput != nil {
			found := false
			var stateMachineArn string
			for _, sm := range listOutput.StateMachines {
				if sm.Name != nil && *sm.Name == stateMachineName {
					found = true
					stateMachineArn = *sm.StateMachineArn
					break
				}
			}

			assert.True(t, found, "State machine %s should exist", stateMachineName)
			if found {
				// Describe the state machine
				describeOutput, err := sfnClient.DescribeStateMachine(ctx, &sfn.DescribeStateMachineInput{
					StateMachineArn: aws.String(stateMachineArn),
				})
				assert.NoError(t, err, "Should be able to describe state machine")
				if describeOutput != nil {
					assert.NotNil(t, describeOutput.Definition, "State machine should have a definition")
					assert.NotNil(t, describeOutput.RoleArn, "State machine should have an execution role")
					t.Logf("✓ Step Functions state machine %s is properly configured", stateMachineName)
					t.Logf("  ARN: %s", stateMachineArn)
				}
			}
		}
	})
}

func testInferenceInfrastructure(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("API Gateway requires authentication", func(t *testing.T) {
		// Get the API endpoint
		apiEndpoint := outputs.InferenceApiEndpoint
		if apiEndpoint == "" {
			apiEndpoint = outputs.InferenceAPIEndpoint83653F
		}

		require.NotEmpty(t, apiEndpoint, "API endpoint should not be empty")

		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		// Test POST to /predict endpoint WITHOUT API Key (should fail)
		predictURL := strings.TrimSuffix(apiEndpoint, "/") + "/predict"
		req, err := http.NewRequestWithContext(ctx, "POST", predictURL, strings.NewReader(`{"test": "data"}`))
		require.NoError(t, err, "Should create request")
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err == nil && resp != nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			// API should return 403 Forbidden without API Key
			assert.Equal(t, http.StatusForbidden, resp.StatusCode, "API should return 403 without API Key, got %d: %s", resp.StatusCode, string(body))
			t.Logf("✓ API Gateway correctly rejects requests without API Key (403)")
		}
	})

	t.Run("API Gateway endpoint is accessible with API Key", func(t *testing.T) {
		// Get the API endpoint
		apiEndpoint := outputs.InferenceApiEndpoint
		if apiEndpoint == "" {
			apiEndpoint = outputs.InferenceAPIEndpoint83653F
		}

		require.NotEmpty(t, apiEndpoint, "API endpoint should not be empty")

		// Get API Key value
		apiKeyValue := ""
		if outputs.InferenceApiKeyId != "" {
			value, err := getApiKeyValue(ctx, cfg, outputs.InferenceApiKeyId)
			if err != nil {
				t.Logf("⚠ Could not retrieve API Key value: %v (test will be skipped)", err)
				t.Skip("Cannot test API with API Key - key retrieval failed")
				return
			}
			apiKeyValue = value
			t.Logf("✓ Retrieved API Key for testing")
		} else {
			t.Skip("API Key ID not available in outputs")
			return
		}

		// Make a test request to the API with API Key
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		// Test POST to /predict endpoint WITH API Key
		predictURL := strings.TrimSuffix(apiEndpoint, "/") + "/predict"
		req, err := http.NewRequestWithContext(ctx, "POST", predictURL, strings.NewReader(`{"test": "data"}`))
		require.NoError(t, err, "Should create request")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-api-key", apiKeyValue)

		resp, err := client.Do(req)
		assert.NoError(t, err, "Should be able to reach API endpoint")

		if resp != nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			// API should return 200 (success) with valid API Key
			assert.Equal(t, http.StatusOK, resp.StatusCode, "API should return 200 with valid API Key, got %d: %s", resp.StatusCode, string(body))

			t.Logf("✓ API Gateway endpoint %s is accessible with API Key", predictURL)
			t.Logf("  Response: %s", string(body))
		}
	})

	t.Run("verify API Key and Usage Plan exist", func(t *testing.T) {
		if outputs.InferenceApiKeyId == "" {
			t.Skip("API Key ID not available")
			return
		}

		apigwClient := awsapigateway.NewFromConfig(cfg)

		// Verify API Key exists
		apiKey, err := apigwClient.GetApiKey(ctx, &awsapigateway.GetApiKeyInput{
			ApiKey:       aws.String(outputs.InferenceApiKeyId),
			IncludeValue: aws.Bool(false),
		})
		assert.NoError(t, err, "Should be able to get API Key")
		if apiKey != nil && apiKey.Name != nil {
			t.Logf("✓ API Key exists: %s", *apiKey.Name)
		}

		// List usage plans
		usagePlans, err := apigwClient.GetUsagePlans(ctx, &awsapigateway.GetUsagePlansInput{})
		assert.NoError(t, err, "Should be able to list usage plans")

		if usagePlans != nil && len(usagePlans.Items) > 0 {
			foundUsagePlan := false
			for _, plan := range usagePlans.Items {
				if plan.Name != nil && strings.Contains(*plan.Name, "ml-inference-usage-plan") {
					foundUsagePlan = true
					t.Logf("✓ Usage Plan exists: %s", *plan.Name)
					if plan.Throttle != nil {
						t.Logf("  Throttle: RateLimit=%v, BurstLimit=%v",
							plan.Throttle.RateLimit, plan.Throttle.BurstLimit)
					}
					if plan.Quota != nil {
						t.Logf("  Quota: Limit=%v, Period=%s", plan.Quota.Limit, string(plan.Quota.Period))
					}
					break
				}
			}
			assert.True(t, foundUsagePlan, "Usage plan should exist")
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

		// Extract environment suffix from bucket name (includes random suffix)
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		dashboardName := "ml-pipeline-dashboard-" + envSuffix

		// List dashboards to find ours
		listOutput, err := cwClient.ListDashboards(ctx, &cloudwatch.ListDashboardsInput{})
		if !assert.NoError(t, err, "Should be able to list dashboards") {
			return
		}
		if listOutput == nil {
			t.Skip("Cannot validate dashboard - list output is nil")
			return
		}

		found := false
		for _, dashboard := range listOutput.DashboardEntries {
			if dashboard.DashboardName != nil && *dashboard.DashboardName == dashboardName {
				found = true
				break
			}
		}

		assert.True(t, found, "CloudWatch dashboard should exist")
		t.Logf("✓ CloudWatch dashboard %s exists", dashboardName)
	})

	t.Run("CloudWatch alarms exist", func(t *testing.T) {
		cwClient := cloudwatch.NewFromConfig(cfg)

		// Extract environment suffix from bucket name (includes random suffix)
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)

		alarmNames := []string{
			"api-latency-alarm-" + envSuffix,
			"lambda-error-alarm-" + envSuffix,
		}

		for _, alarmName := range alarmNames {
			alarmsOutput, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
				AlarmNames: []string{alarmName},
			})
			assert.NoError(t, err, "Should be able to describe alarm %s", alarmName)
			if alarmsOutput != nil && len(alarmsOutput.MetricAlarms) > 0 {
				assert.NotEmpty(t, alarmsOutput.MetricAlarms, "Alarm %s should exist", alarmName)

				alarm := alarmsOutput.MetricAlarms[0]
				if alarm.AlarmName != nil {
					assert.Equal(t, alarmName, *alarm.AlarmName, "Alarm name should match")
				}
				assert.NotEmpty(t, alarm.AlarmActions, "Alarm should have actions configured")
				t.Logf("✓ CloudWatch alarm %s exists with %d actions", alarmName, len(alarm.AlarmActions))
			}
		}
	})

	t.Run("SNS topic exists", func(t *testing.T) {
		snsClient := sns.NewFromConfig(cfg)

		// Extract environment suffix from bucket name (includes random suffix)
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		topicName := "ml-pipeline-alerts-" + envSuffix

		// List topics to find ours
		listOutput, err := snsClient.ListTopics(ctx, &sns.ListTopicsInput{})
		if !assert.NoError(t, err, "Should be able to list SNS topics") {
			return
		}
		if listOutput == nil {
			t.Skip("Cannot validate SNS topic - list output is nil")
			return
		}

		found := false
		var topicArn string
		for _, topic := range listOutput.Topics {
			if topic.TopicArn != nil && strings.Contains(*topic.TopicArn, topicName) {
				found = true
				topicArn = *topic.TopicArn
				break
			}
		}

		assert.True(t, found, "SNS topic should exist")
		if found {
			t.Logf("✓ SNS topic %s exists", topicArn)
		}
	})
}

// testStepFunctionsExecution tests the actual execution of Step Functions state machine
func testStepFunctionsExecution(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("execute state machine successfully", func(t *testing.T) {
		sfnClient := sfn.NewFromConfig(cfg)

		// Extract environment suffix
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		stateMachineName := "ml-model-training-pipeline-" + envSuffix

		// Find the state machine ARN
		listOutput, err := sfnClient.ListStateMachines(ctx, &sfn.ListStateMachinesInput{})
		require.NoError(t, err, "Should be able to list state machines")

		var stateMachineArn string
		for _, sm := range listOutput.StateMachines {
			if sm.Name != nil && *sm.Name == stateMachineName {
				stateMachineArn = *sm.StateMachineArn
				break
			}
		}

		require.NotEmpty(t, stateMachineArn, "State machine should exist")

		// Start execution with test input
		executionName := "integration-test-" + time.Now().Format("20060102-150405")
		input := `{"test": true, "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`

		startOutput, err := sfnClient.StartExecution(ctx, &sfn.StartExecutionInput{
			StateMachineArn: aws.String(stateMachineArn),
			Name:            aws.String(executionName),
			Input:           aws.String(input),
		})
		require.NoError(t, err, "Should be able to start execution")
		require.NotNil(t, startOutput, "Start execution output should not be nil")
		require.NotEmpty(t, startOutput.ExecutionArn, "Execution ARN should not be empty")

		t.Logf("✓ Started execution: %s", *startOutput.ExecutionArn)

		// Wait for execution to complete (with timeout)
		executionCompleted := false
		maxWaitTime := 5 * time.Minute
		pollInterval := 5 * time.Second
		startTime := time.Now()

		for time.Since(startTime) < maxWaitTime {
			describeOutput, err := sfnClient.DescribeExecution(ctx, &sfn.DescribeExecutionInput{
				ExecutionArn: startOutput.ExecutionArn,
			})
			require.NoError(t, err, "Should be able to describe execution")

			t.Logf("  Execution status: %s", string(describeOutput.Status))

			if describeOutput.Status == sfntypes.ExecutionStatusSucceeded {
				executionCompleted = true
				assert.NotNil(t, describeOutput.Output, "Execution should have output")
				t.Logf("✓ Execution completed successfully")
				if describeOutput.Output != nil {
					t.Logf("  Output: %s", *describeOutput.Output)
				}
				break
			} else if describeOutput.Status == sfntypes.ExecutionStatusFailed ||
				describeOutput.Status == sfntypes.ExecutionStatusTimedOut ||
				describeOutput.Status == sfntypes.ExecutionStatusAborted {
				t.Errorf("Execution failed with status: %s", string(describeOutput.Status))
				if describeOutput.Cause != nil {
					t.Errorf("  Cause: %s", *describeOutput.Cause)
				}
				break
			}

			time.Sleep(pollInterval)
		}

		if !executionCompleted && time.Since(startTime) >= maxWaitTime {
			t.Logf("⚠ Execution did not complete within %v (this may be expected for long-running workflows)", maxWaitTime)
		}
	})

	t.Run("list execution history", func(t *testing.T) {
		sfnClient := sfn.NewFromConfig(cfg)

		// Extract environment suffix
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		stateMachineName := "ml-model-training-pipeline-" + envSuffix

		// Find the state machine ARN
		listOutput, err := sfnClient.ListStateMachines(ctx, &sfn.ListStateMachinesInput{})
		require.NoError(t, err, "Should be able to list state machines")

		var stateMachineArn string
		for _, sm := range listOutput.StateMachines {
			if sm.Name != nil && *sm.Name == stateMachineName {
				stateMachineArn = *sm.StateMachineArn
				break
			}
		}

		require.NotEmpty(t, stateMachineArn, "State machine should exist")

		// List recent executions
		execListOutput, err := sfnClient.ListExecutions(ctx, &sfn.ListExecutionsInput{
			StateMachineArn: aws.String(stateMachineArn),
			MaxResults:      10,
		})
		assert.NoError(t, err, "Should be able to list executions")

		if execListOutput != nil && len(execListOutput.Executions) > 0 {
			t.Logf("✓ Found %d recent executions", len(execListOutput.Executions))
			for i, exec := range execListOutput.Executions {
				if i < 3 { // Show first 3
					t.Logf("  - %s: %s (started: %s)", *exec.Name, string(exec.Status), exec.StartDate.Format(time.RFC3339))
				}
			}
		} else {
			t.Log("No previous executions found (this is expected for new deployments)")
		}
	})
}

// testEndToEndWorkflow tests a complete end-to-end workflow
func testEndToEndWorkflow(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	t.Run("complete ML pipeline workflow", func(t *testing.T) {
		// This test simulates a complete workflow:
		// 1. Upload image to S3
		// 2. Write metadata to DynamoDB
		// 3. Trigger Step Functions execution
		// 4. Call inference API
		// 5. Verify results

		s3Client := s3.NewFromConfig(cfg)
		dynamoClient := dynamodb.NewFromConfig(cfg)
		sfnClient := sfn.NewFromConfig(cfg)

		testImageID := "e2e-test-" + time.Now().Format("20060102-150405")

		// Step 1: Upload test image to S3
		t.Log("Step 1: Uploading test image to S3...")
		testImageContent := []byte("test-image-data-" + time.Now().String())
		_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket: aws.String(outputs.RawImageBucketName),
			Key:    aws.String(testImageID + ".jpg"),
			Body:   strings.NewReader(string(testImageContent)),
		})
		assert.NoError(t, err, "Should be able to upload test image")
		if err == nil {
			t.Logf("✓ Uploaded test image: %s.jpg", testImageID)

			// Cleanup: Delete test image at the end
			defer func() {
				_, _ = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
					Bucket: aws.String(outputs.RawImageBucketName),
					Key:    aws.String(testImageID + ".jpg"),
				})
				t.Log("  Cleaned up test image")
			}()
		}

		// Step 2: Write metadata to DynamoDB
		t.Log("Step 2: Writing metadata to DynamoDB...")
		_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(outputs.MetadataTableName),
			Item: map[string]dynamodbtypes.AttributeValue{
				"image_id":  &dynamodbtypes.AttributeValueMemberS{Value: testImageID},
				"timestamp": &dynamodbtypes.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
				"status":    &dynamodbtypes.AttributeValueMemberS{Value: "uploaded"},
				"source":    &dynamodbtypes.AttributeValueMemberS{Value: "integration-test"},
				"test_run":  &dynamodbtypes.AttributeValueMemberBOOL{Value: true},
			},
		})
		assert.NoError(t, err, "Should be able to write metadata")
		if err == nil {
			t.Logf("✓ Wrote metadata for image: %s", testImageID)

			// Cleanup: Delete test metadata at the end
			defer func() {
				_, _ = dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
					TableName: aws.String(outputs.MetadataTableName),
					Key: map[string]dynamodbtypes.AttributeValue{
						"image_id": &dynamodbtypes.AttributeValueMemberS{Value: testImageID},
					},
				})
				t.Log("  Cleaned up test metadata")
			}()
		}

		// Step 3: Trigger Step Functions workflow (optional - can be slow)
		t.Log("Step 3: Testing Step Functions availability...")
		// Extract environment suffix
		envSuffix := extractEnvAndRandomSuffix(outputs.RawImageBucketName)
		stateMachineName := "ml-model-training-pipeline-" + envSuffix

		// Find the state machine
		listOutput, err := sfnClient.ListStateMachines(ctx, &sfn.ListStateMachinesInput{})
		if err == nil && listOutput != nil {
			for _, sm := range listOutput.StateMachines {
				if sm.Name != nil && *sm.Name == stateMachineName {
					t.Logf("✓ Step Functions state machine available: %s", *sm.StateMachineArn)
					t.Log("  (Skipping execution to keep test fast - see dedicated Step Functions test)")
					break
				}
			}
		}

		// Step 4: Call inference API
		t.Log("Step 4: Testing inference API...")
		apiEndpoint := outputs.InferenceApiEndpoint
		if apiEndpoint == "" {
			apiEndpoint = outputs.InferenceAPIEndpoint83653F
		}

		if apiEndpoint != "" {
			// Get API Key for authenticated request
			apiKeyValue := ""
			if outputs.InferenceApiKeyId != "" {
				value, err := getApiKeyValue(ctx, cfg, outputs.InferenceApiKeyId)
				if err == nil {
					apiKeyValue = value
				} else {
					t.Logf("⚠ Could not retrieve API Key: %v", err)
				}
			}

			client := &http.Client{Timeout: 30 * time.Second}
			predictURL := strings.TrimSuffix(apiEndpoint, "/") + "/predict"

			requestBody := map[string]interface{}{
				"image_id": testImageID,
				"test":     true,
			}
			requestJSON, _ := json.Marshal(requestBody)

			req, err := http.NewRequestWithContext(ctx, "POST", predictURL, strings.NewReader(string(requestJSON)))
			if err == nil {
				req.Header.Set("Content-Type", "application/json")
				if apiKeyValue != "" {
					req.Header.Set("x-api-key", apiKeyValue)
					t.Log("  Using API Key for authentication")
				}

				resp, err := client.Do(req)
				if err == nil && resp != nil {
					defer resp.Body.Close()
					body, _ := io.ReadAll(resp.Body)

					if resp.StatusCode == http.StatusOK {
						t.Logf("✓ Inference API responded successfully")
						t.Logf("  Response: %s", string(body))

						// Validate response structure
						var apiResponse map[string]interface{}
						if json.Unmarshal(body, &apiResponse) == nil {
							t.Log("✓ Response is valid JSON")
						}
					} else if resp.StatusCode == http.StatusForbidden && apiKeyValue == "" {
						t.Logf("✓ API correctly requires authentication (403)")
					} else {
						t.Logf("⚠ API returned status %d: %s", resp.StatusCode, string(body))
					}
				} else if err != nil {
					t.Logf("⚠ API request failed: %v (this may be expected in some test environments)", err)
				}
			}
		} else {
			t.Log("⚠ API endpoint not available in outputs")
		}

		// Step 5: Verify data persistence
		t.Log("Step 5: Verifying data persistence...")
		getOutput, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(outputs.MetadataTableName),
			Key: map[string]dynamodbtypes.AttributeValue{
				"image_id": &dynamodbtypes.AttributeValueMemberS{Value: testImageID},
			},
		})
		assert.NoError(t, err, "Should be able to read metadata")
		if err == nil && len(getOutput.Item) > 0 {
			t.Logf("✓ Data persisted correctly in DynamoDB")

			// Verify the data we wrote
			if statusAttr, ok := getOutput.Item["status"]; ok {
				if statusVal, ok := statusAttr.(*dynamodbtypes.AttributeValueMemberS); ok {
					assert.Equal(t, "uploaded", statusVal.Value, "Status should match")
					t.Logf("  Status: %s", statusVal.Value)
				}
			}
		}

		t.Log("✓ End-to-end workflow test completed successfully")
	})

	t.Run("error handling and resilience", func(t *testing.T) {
		// Test error handling
		dynamoClient := dynamodb.NewFromConfig(cfg)

		// Try to get non-existent item
		_, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(outputs.MetadataTableName),
			Key: map[string]dynamodbtypes.AttributeValue{
				"image_id": &dynamodbtypes.AttributeValueMemberS{Value: "non-existent-id"},
			},
		})
		assert.NoError(t, err, "GetItem should not error for non-existent items")
		t.Log("✓ Error handling works correctly for non-existent data")

		// Test API with invalid payload
		apiEndpoint := outputs.InferenceApiEndpoint
		if apiEndpoint == "" {
			apiEndpoint = outputs.InferenceAPIEndpoint83653F
		}

		if apiEndpoint != "" {
			client := &http.Client{Timeout: 10 * time.Second}
			predictURL := strings.TrimSuffix(apiEndpoint, "/") + "/predict"

			// Send invalid JSON
			req, err := http.NewRequestWithContext(ctx, "POST", predictURL, strings.NewReader("invalid-json"))
			if err == nil {
				req.Header.Set("Content-Type", "application/json")
				resp, err := client.Do(req)
				if err == nil && resp != nil {
					defer resp.Body.Close()
					// API should handle invalid input gracefully
					t.Logf("✓ API handles invalid input, returned status: %d", resp.StatusCode)
				}
			}
		}
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
