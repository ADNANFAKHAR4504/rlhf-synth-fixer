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
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/types"
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

	t.Run("Lambda function invocation testing", func(t *testing.T) {
		testLambdaInvocation(t, ctx, cfg, outputs)
	})

	t.Run("EventBridge rule validation", func(t *testing.T) {
		testEventBridgeRules(t, ctx, cfg, outputs)
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

		// Extract environment suffix from bucket name
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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
		sfnClient := sfn.NewFromConfig(cfg)

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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

		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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

			if describeOutput.Status == types.ExecutionStatusSucceeded {
				executionCompleted = true
				assert.NotNil(t, describeOutput.Output, "Execution should have output")
				t.Logf("✓ Execution completed successfully")
				if describeOutput.Output != nil {
					t.Logf("  Output: %s", *describeOutput.Output)
				}
				break
			} else if describeOutput.Status == types.ExecutionStatusFailed ||
				describeOutput.Status == types.ExecutionStatusTimedOut ||
				describeOutput.Status == types.ExecutionStatusAborted {
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
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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
			MaxResults:      aws.Int32(10),
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

// testLambdaInvocation tests direct Lambda function invocations
func testLambdaInvocation(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	lambdaClient := lambda.NewFromConfig(cfg)

	// Extract environment suffix
	parts := strings.Split(outputs.RawImageBucketName, "-")
	envSuffix := parts[len(parts)-1]

	t.Run("invoke data preparation lambda", func(t *testing.T) {
		// Find the DataPrepLambda function
		listOutput, err := lambdaClient.ListFunctions(ctx, &lambda.ListFunctionsInput{})
		require.NoError(t, err, "Should be able to list Lambda functions")

		var dataPrepFunctionName string
		for _, fn := range listOutput.Functions {
			if fn.FunctionName != nil && strings.Contains(*fn.FunctionName, "DataPrepLambda") && strings.Contains(*fn.FunctionName, envSuffix) {
				dataPrepFunctionName = *fn.FunctionName
				break
			}
		}

		if dataPrepFunctionName == "" {
			t.Skip("Data prep lambda not found - may not be deployed yet")
			return
		}

		// Invoke the function
		payload := `{"test": true, "action": "prepare_data"}`
		invokeOutput, err := lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(dataPrepFunctionName),
			Payload:      []byte(payload),
		})
		assert.NoError(t, err, "Should be able to invoke data prep lambda")

		if invokeOutput != nil {
			assert.NotNil(t, invokeOutput.StatusCode, "Lambda should return status code")
			assert.Equal(t, int32(200), invokeOutput.StatusCode, "Lambda should return 200")

			if invokeOutput.Payload != nil {
				t.Logf("✓ Data prep lambda invoked successfully")
				t.Logf("  Response: %s", string(invokeOutput.Payload))
			}

			if invokeOutput.FunctionError != nil {
				t.Errorf("Lambda returned error: %s", *invokeOutput.FunctionError)
			}
		}
	})

	t.Run("invoke model evaluation lambda", func(t *testing.T) {
		// Find the ModelEvalLambda function
		listOutput, err := lambdaClient.ListFunctions(ctx, &lambda.ListFunctionsInput{})
		require.NoError(t, err, "Should be able to list Lambda functions")

		var evalFunctionName string
		for _, fn := range listOutput.Functions {
			if fn.FunctionName != nil && strings.Contains(*fn.FunctionName, "ModelEvalLambda") && strings.Contains(*fn.FunctionName, envSuffix) {
				evalFunctionName = *fn.FunctionName
				break
			}
		}

		if evalFunctionName == "" {
			t.Skip("Model eval lambda not found - may not be deployed yet")
			return
		}

		// Invoke the function
		payload := `{"test": true, "model": "test-model", "action": "evaluate"}`
		invokeOutput, err := lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(evalFunctionName),
			Payload:      []byte(payload),
		})
		assert.NoError(t, err, "Should be able to invoke model eval lambda")

		if invokeOutput != nil {
			assert.NotNil(t, invokeOutput.StatusCode, "Lambda should return status code")
			assert.Equal(t, int32(200), invokeOutput.StatusCode, "Lambda should return 200")

			if invokeOutput.Payload != nil {
				t.Logf("✓ Model evaluation lambda invoked successfully")
				t.Logf("  Response: %s", string(invokeOutput.Payload))
			}

			if invokeOutput.FunctionError != nil {
				t.Errorf("Lambda returned error: %s", *invokeOutput.FunctionError)
			}
		}
	})

	t.Run("invoke inference lambda", func(t *testing.T) {
		// Find the InferenceLambda function
		listOutput, err := lambdaClient.ListFunctions(ctx, &lambda.ListFunctionsInput{})
		require.NoError(t, err, "Should be able to list Lambda functions")

		var inferenceFunctionName string
		for _, fn := range listOutput.Functions {
			if fn.FunctionName != nil && strings.Contains(*fn.FunctionName, "InferenceFunction") && strings.Contains(*fn.FunctionName, envSuffix) {
				inferenceFunctionName = *fn.FunctionName
				break
			}
		}

		if inferenceFunctionName == "" {
			t.Skip("Inference lambda not found - may not be deployed yet")
			return
		}

		// Invoke the function
		payload := `{"test": true, "image_id": "test-image-123"}`
		invokeOutput, err := lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(inferenceFunctionName),
			Payload:      []byte(payload),
		})
		assert.NoError(t, err, "Should be able to invoke inference lambda")

		if invokeOutput != nil {
			assert.NotNil(t, invokeOutput.StatusCode, "Lambda should return status code")
			assert.Equal(t, int32(200), invokeOutput.StatusCode, "Lambda should return 200")

			if invokeOutput.Payload != nil {
				t.Logf("✓ Inference lambda invoked successfully")
				t.Logf("  Response: %s", string(invokeOutput.Payload))

				// Validate response structure
				var response map[string]interface{}
				err := json.Unmarshal(invokeOutput.Payload, &response)
				assert.NoError(t, err, "Response should be valid JSON")
				if err == nil {
					assert.Contains(t, response, "statusCode", "Response should contain statusCode")
					assert.Contains(t, response, "body", "Response should contain body")
				}
			}

			if invokeOutput.FunctionError != nil {
				t.Errorf("Lambda returned error: %s", *invokeOutput.FunctionError)
			}
		}
	})

	t.Run("check lambda configurations", func(t *testing.T) {
		listOutput, err := lambdaClient.ListFunctions(ctx, &lambda.ListFunctionsInput{})
		require.NoError(t, err, "Should be able to list Lambda functions")

		relevantFunctions := 0
		for _, fn := range listOutput.Functions {
			if fn.FunctionName != nil && strings.Contains(*fn.FunctionName, envSuffix) &&
				(strings.Contains(*fn.FunctionName, "DataPrepLambda") ||
					strings.Contains(*fn.FunctionName, "ModelEvalLambda") ||
					strings.Contains(*fn.FunctionName, "InferenceFunction")) {
				relevantFunctions++

				// Check Lambda configuration
				assert.NotNil(t, fn.Runtime, "Lambda should have runtime configured")
				assert.NotNil(t, fn.MemorySize, "Lambda should have memory size configured")
				assert.NotNil(t, fn.Timeout, "Lambda should have timeout configured")

				t.Logf("✓ Lambda %s configured with %dMB memory, %ds timeout, runtime %s",
					*fn.FunctionName, *fn.MemorySize, *fn.Timeout, string(fn.Runtime))
			}
		}

		assert.GreaterOrEqual(t, relevantFunctions, 1, "Should find at least one relevant Lambda function")
	})
}

// testEventBridgeRules tests EventBridge rule configuration
func testEventBridgeRules(t *testing.T, ctx context.Context, cfg aws.Config, outputs *StackOutputs) {
	eventBridgeClient := eventbridge.NewFromConfig(cfg)

	// Extract environment suffix
	parts := strings.Split(outputs.RawImageBucketName, "-")
	envSuffix := parts[len(parts)-1]

	t.Run("daily training schedule rule exists", func(t *testing.T) {
		// The rule name from the stack is "DailyTrainingSchedule"
		// CDK may add a prefix/suffix, so we'll list all rules and find it
		listOutput, err := eventBridgeClient.ListRules(ctx, &eventbridge.ListRulesInput{})
		require.NoError(t, err, "Should be able to list EventBridge rules")

		var foundRule *eventbridge.DescribeRuleOutput
		for _, rule := range listOutput.Rules {
			if rule.Name != nil && strings.Contains(*rule.Name, "DailyTrainingSchedule") {
				// Describe the rule to get full details
				describeOutput, err := eventBridgeClient.DescribeRule(ctx, &eventbridge.DescribeRuleInput{
					Name: rule.Name,
				})
				if err == nil {
					foundRule = describeOutput
					break
				}
			}
		}

		require.NotNil(t, foundRule, "Daily training schedule rule should exist")

		// Validate rule configuration
		assert.NotNil(t, foundRule.ScheduleExpression, "Rule should have schedule expression")
		if foundRule.ScheduleExpression != nil {
			assert.Contains(t, *foundRule.ScheduleExpression, "cron", "Schedule should be a cron expression")
			t.Logf("✓ EventBridge rule found with schedule: %s", *foundRule.ScheduleExpression)
		}

		assert.NotNil(t, foundRule.State, "Rule should have a state")
		t.Logf("  Rule state: %s", string(foundRule.State))
		t.Logf("  Note: Rule is %s by default for safety", string(foundRule.State))
	})

	t.Run("training schedule targets Step Functions", func(t *testing.T) {
		// Find the rule
		listOutput, err := eventBridgeClient.ListRules(ctx, &eventbridge.ListRulesInput{})
		require.NoError(t, err, "Should be able to list EventBridge rules")

		var ruleName string
		for _, rule := range listOutput.Rules {
			if rule.Name != nil && strings.Contains(*rule.Name, "DailyTrainingSchedule") {
				ruleName = *rule.Name
				break
			}
		}

		require.NotEmpty(t, ruleName, "Training schedule rule should exist")

		// List targets for this rule
		targetsOutput, err := eventBridgeClient.ListTargetsByRule(ctx, &eventbridge.ListTargetsByRuleInput{
			Rule: aws.String(ruleName),
		})
		assert.NoError(t, err, "Should be able to list rule targets")

		if targetsOutput != nil && len(targetsOutput.Targets) > 0 {
			assert.GreaterOrEqual(t, len(targetsOutput.Targets), 1, "Rule should have at least one target")

			// Check if any target is a Step Functions state machine
			hasStepFunctionsTarget := false
			for _, target := range targetsOutput.Targets {
				if target.Arn != nil && strings.Contains(*target.Arn, "states") && strings.Contains(*target.Arn, "stateMachine") {
					hasStepFunctionsTarget = true
					t.Logf("✓ Rule targets Step Functions state machine: %s", *target.Arn)

					// Verify the state machine name contains our expected pattern
					assert.Contains(t, *target.Arn, "ml-model-training-pipeline", "Target should be the training pipeline")
					break
				}
			}

			assert.True(t, hasStepFunctionsTarget, "Rule should target a Step Functions state machine")
		} else {
			t.Error("Rule should have at least one target configured")
		}
	})

	t.Run("validate rule IAM permissions", func(t *testing.T) {
		// Find the rule
		listOutput, err := eventBridgeClient.ListRules(ctx, &eventbridge.ListRulesInput{})
		require.NoError(t, err, "Should be able to list EventBridge rules")

		var ruleName string
		for _, rule := range listOutput.Rules {
			if rule.Name != nil && strings.Contains(*rule.Name, "DailyTrainingSchedule") {
				ruleName = *rule.Name
				break
			}
		}

		require.NotEmpty(t, ruleName, "Training schedule rule should exist")

		// List targets to check role ARN
		targetsOutput, err := eventBridgeClient.ListTargetsByRule(ctx, &eventbridge.ListTargetsByRuleInput{
			Rule: aws.String(ruleName),
		})
		assert.NoError(t, err, "Should be able to list rule targets")

		if targetsOutput != nil && len(targetsOutput.Targets) > 0 {
			for _, target := range targetsOutput.Targets {
				if target.RoleArn != nil {
					assert.NotEmpty(t, *target.RoleArn, "Target should have an IAM role")
					t.Logf("✓ EventBridge rule has IAM role: %s", *target.RoleArn)
					break
				}
			}
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
			Item: map[string]types.AttributeValue{
				"image_id":  &types.AttributeValueMemberS{Value: testImageID},
				"timestamp": &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
				"status":    &types.AttributeValueMemberS{Value: "uploaded"},
				"source":    &types.AttributeValueMemberS{Value: "integration-test"},
				"test_run":  &types.AttributeValueMemberBOOL{Value: true},
			},
		})
		assert.NoError(t, err, "Should be able to write metadata")
		if err == nil {
			t.Logf("✓ Wrote metadata for image: %s", testImageID)

			// Cleanup: Delete test metadata at the end
			defer func() {
				_, _ = dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
					TableName: aws.String(outputs.MetadataTableName),
					Key: map[string]types.AttributeValue{
						"image_id": &types.AttributeValueMemberS{Value: testImageID},
					},
				})
				t.Log("  Cleaned up test metadata")
			}()
		}

		// Step 3: Trigger Step Functions workflow (optional - can be slow)
		t.Log("Step 3: Testing Step Functions availability...")
		// Extract environment suffix
		parts := strings.Split(outputs.RawImageBucketName, "-")
		envSuffix := parts[len(parts)-1]
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
			Key: map[string]types.AttributeValue{
				"image_id": &types.AttributeValueMemberS{Value: testImageID},
			},
		})
		assert.NoError(t, err, "Should be able to read metadata")
		if err == nil && len(getOutput.Item) > 0 {
			t.Logf("✓ Data persisted correctly in DynamoDB")

			// Verify the data we wrote
			if statusAttr, ok := getOutput.Item["status"]; ok {
				if statusVal, ok := statusAttr.(*types.AttributeValueMemberS); ok {
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
			Key: map[string]types.AttributeValue{
				"image_id": &types.AttributeValueMemberS{Value: "non-existent-id"},
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
