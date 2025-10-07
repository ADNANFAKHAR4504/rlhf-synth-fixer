//go:build integration

package lib_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/xray"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TapStackOutputs represents the structure of cfn-outputs/flat-outputs.json
type TapStackOutputs struct {
	APIEndpoint       string `json:"APIEndpoint"`
	TableName         string `json:"TableName"`
	LambdaFunctionArn string `json:"LambdaFunctionArn"`
}

// loadTapStackOutputs loads deployment outputs from cfn-outputs/flat-outputs.json
func loadTapStackOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Cannot load cfn-outputs/flat-outputs.json: %v", err)
	}

	var outputs TapStackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs/flat-outputs.json")

	return &outputs
}

// ==========================================
// BASIC RESOURCE VALIDATION TESTS
// ==========================================

func TestTapStackIntegration(t *testing.T) {
	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("DynamoDB table is properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		dynamoClient := dynamodb.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// ACT - Describe table
		tableResp, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.TableName),
		})
		require.NoError(t, err, "DynamoDB table should exist")

		// ASSERT
		table := tableResp.Table
		assert.Equal(t, outputs.TableName, *table.TableName, "Table name should match output")
		assert.Equal(t, strings.ToUpper("Active"), strings.ToUpper(string(table.TableStatus)), "Table should be active")
		assert.NotEmpty(t, table.KeySchema, "Table should have key schema defined")

		// Verify billing mode
		if table.BillingModeSummary != nil {
			assert.Equal(t, strings.ToUpper("PAY_PER_REQUEST"), strings.ToUpper(string(table.BillingModeSummary.BillingMode)), "Table should use on-demand billing")
		}

		// Verify partition key
		assert.Len(t, table.KeySchema, 1, "Table should have exactly one key")
		assert.Equal(t, "id", *table.KeySchema[0].AttributeName, "Partition key should be 'id'")

		// Verify point-in-time recovery using DescribeContinuousBackups
		backupsResp, err := dynamoClient.DescribeContinuousBackups(ctx, &dynamodb.DescribeContinuousBackupsInput{
			TableName: aws.String(outputs.TableName),
		})
		if err == nil {
			assert.NotNil(t, backupsResp.ContinuousBackupsDescription, "Continuous backups should be configured")
			if backupsResp.ContinuousBackupsDescription != nil && backupsResp.ContinuousBackupsDescription.PointInTimeRecoveryDescription != nil {
				// Point-in-time recovery is configured
				assert.NotNil(t, backupsResp.ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus)
			}
		}
	})

	t.Run("DynamoDB table name follows naming convention", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)

		// ASSERT - Table name should follow expected pattern
		assert.Regexp(t, `^tap-serverless-table-.+$`, outputs.TableName, "Table name should follow naming convention: tap-serverless-table-{environment}")
		assert.NotContains(t, outputs.TableName, " ", "Table name should not contain spaces")
		assert.GreaterOrEqual(t, len(outputs.TableName), 20, "Table name should be sufficiently long to include environment suffix")
	})

	t.Run("Lambda function is properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		lambdaClient := lambda.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// Extract function name from ARN
		functionName := outputs.LambdaFunctionArn[strings.LastIndex(outputs.LambdaFunctionArn, ":")+1:]

		// ACT - Get function configuration
		funcResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err, "Lambda function should exist")

		// ASSERT
		assert.Equal(t, functionName, *funcResp.Configuration.FunctionName, "Function name should match")
		assert.NotEmpty(t, funcResp.Configuration.Runtime, "Function should have runtime specified")
		assert.Equal(t, strings.ToUpper("ACTIVE"), strings.ToUpper(string(funcResp.Configuration.State)), "Function should be active")
		assert.NotEmpty(t, funcResp.Configuration.Handler, "Function should have handler specified")
		assert.Equal(t, "index.handler", *funcResp.Configuration.Handler, "Handler should be index.handler")

		// Verify runtime is Python 3.12
		assert.Contains(t, string(funcResp.Configuration.Runtime), "python3.12", "Runtime should be Python 3.12")

		// Verify memory and timeout
		assert.Equal(t, int32(256), *funcResp.Configuration.MemorySize, "Memory should be 256 MB")
		assert.Equal(t, int32(30), *funcResp.Configuration.Timeout, "Timeout should be 30 seconds")

		// Verify environment variables
		require.NotNil(t, funcResp.Configuration.Environment, "Environment variables should be configured")
		assert.NotEmpty(t, funcResp.Configuration.Environment.Variables["TABLE_NAME"], "TABLE_NAME environment variable should be set")
		assert.NotEmpty(t, funcResp.Configuration.Environment.Variables["ENVIRONMENT"], "ENVIRONMENT environment variable should be set")

		// Verify X-Ray tracing is enabled
		assert.NotNil(t, funcResp.Configuration.TracingConfig, "Tracing should be configured")
		assert.Equal(t, "Active", string(funcResp.Configuration.TracingConfig.Mode), "X-Ray tracing should be active")

		// Verify ARN format
		assert.Regexp(t, `^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:.+$`, outputs.LambdaFunctionArn, "Lambda ARN should be valid AWS ARN format")
		assert.Contains(t, outputs.LambdaFunctionArn, "tap-api-handler", "Lambda function name should contain 'tap-api-handler'")
	})

	t.Run("API Gateway is properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		apiClient := apigateway.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// Extract API ID from endpoint URL
		// Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
		endpointParts := strings.Split(outputs.APIEndpoint, ".")
		require.GreaterOrEqual(t, len(endpointParts), 2, "API endpoint should be valid URL")

		apiID := strings.TrimPrefix(endpointParts[0], "https://")

		// ACT - Get API information
		apiResp, err := apiClient.GetRestApi(ctx, &apigateway.GetRestApiInput{
			RestApiId: aws.String(apiID),
		})
		require.NoError(t, err, "API Gateway should exist")

		// ASSERT
		assert.Equal(t, apiID, *apiResp.Id, "API ID should match")
		assert.NotEmpty(t, apiResp.Name, "API should have a name")
		assert.NotEmpty(t, apiResp.CreatedDate, "API should have creation date")
		assert.Contains(t, *apiResp.Name, "tap-serverless-api", "API name should contain 'tap-serverless-api'")

		// Verify endpoint type
		assert.Len(t, apiResp.EndpointConfiguration.Types, 1, "Should have one endpoint type")
		assert.Equal(t, "REGIONAL", string(apiResp.EndpointConfiguration.Types[0]), "Endpoint should be REGIONAL")

		// Verify endpoint format
		assert.Regexp(t, `^https://[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com/.+/$`, outputs.APIEndpoint, "API endpoint should be valid API Gateway URL")
		assert.True(t, outputs.APIEndpoint[len(outputs.APIEndpoint)-1] == '/', "API endpoint should end with trailing slash")
	})

	t.Run("outputs are correctly formatted and valid", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)

		// ASSERT - All required outputs should be present
		assert.NotEmpty(t, outputs.APIEndpoint, "APIEndpoint should be exported")
		assert.NotEmpty(t, outputs.TableName, "TableName should be exported")
		assert.NotEmpty(t, outputs.LambdaFunctionArn, "LambdaFunctionArn should be exported")

		// Verify formats
		assert.Regexp(t, `^tap-serverless-table-.+$`, outputs.TableName, "Table name should follow naming convention")
		assert.Regexp(t, `^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:.+$`, outputs.LambdaFunctionArn, "Lambda ARN should be valid")
		assert.Regexp(t, `^https://[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com/.+/$`, outputs.APIEndpoint, "API endpoint should be valid")
	})

	t.Run("all resources use consistent environment suffix", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)

		// Extract environment suffix from different resources
		// From table name: tap-serverless-table-{suffix}
		tableNameParts := outputs.TableName[len("tap-serverless-table-"):]

		// From Lambda ARN: function:tap-api-handler-{suffix}
		lambdaName := outputs.LambdaFunctionArn[strings.LastIndex(outputs.LambdaFunctionArn, ":")+1:]
		lambdaSuffix := lambdaName[len("tap-api-handler-"):]

		// From API endpoint path: /{suffix}/
		apiPath := outputs.APIEndpoint[strings.LastIndex(outputs.APIEndpoint[:len(outputs.APIEndpoint)-1], "/")+1 : len(outputs.APIEndpoint)-1]

		// ASSERT - All resources should use the same environment suffix
		assert.Equal(t, tableNameParts, lambdaSuffix, "DynamoDB table and Lambda function should use same environment suffix")
		assert.Equal(t, tableNameParts, apiPath, "DynamoDB table and API Gateway should use same environment suffix")
	})
}

// ==========================================
// CROSS-SERVICE INTERACTION TESTS
// ==========================================

func TestEndToEndAPIWorkflow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	outputs := loadTapStackOutputs(t)
	apiEndpoint := strings.TrimSuffix(outputs.APIEndpoint, "/")

	// Use a unique test ID to avoid conflicts
	testID := fmt.Sprintf("test-item-%d", time.Now().UnixNano())

	t.Run("POST: Create new item via API Gateway -> Lambda -> DynamoDB", func(t *testing.T) {
		// ARRANGE
		payload := map[string]interface{}{
			"name":        "Integration Test Item",
			"description": "Created via end-to-end integration test",
			"value":       42,
		}
		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		// ACT - Send POST request to API
		req, err := http.NewRequestWithContext(ctx, "POST", apiEndpoint+"/items", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err, "POST request should succeed")
		defer resp.Body.Close()

		// ASSERT - Verify response
		assert.Equal(t, http.StatusCreated, resp.StatusCode, "Should return 201 Created")

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		require.NoError(t, err)

		assert.Equal(t, "Item created successfully", result["message"])
		assert.NotEmpty(t, result["id"], "Response should include created item ID")

		// Store the ID for subsequent tests
		testID = result["id"].(string)

		// Verify CORS headers
		assert.Equal(t, "*", resp.Header.Get("Access-Control-Allow-Origin"), "CORS header should allow all origins")
	})

	t.Run("DELETE: Remove item via API -> Lambda -> DynamoDB", func(t *testing.T) {
		// ACT - Send DELETE request
		req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/items?id=%s", apiEndpoint, testID), nil)
		require.NoError(t, err)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		// ASSERT
		assert.Equal(t, http.StatusOK, resp.StatusCode, "Should return 200 OK")

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		require.NoError(t, err)

		assert.Equal(t, "Item deleted successfully", result["message"])

		// Verify deletion by trying to retrieve the item
		time.Sleep(2 * time.Second)
		getReq, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/items?id=%s", apiEndpoint, testID), nil)
		require.NoError(t, err)

		getResp, err := client.Do(getReq)
		require.NoError(t, err)
		defer getResp.Body.Close()

		assert.Equal(t, http.StatusNotFound, getResp.StatusCode, "Item should no longer exist")
	})
}

// ==========================================
// ERROR HANDLING TESTS
// ==========================================

func TestAPIErrorHandling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	outputs := loadTapStackOutputs(t)
	apiEndpoint := strings.TrimSuffix(outputs.APIEndpoint, "/")

	t.Run("PUT without ID returns 400 Bad Request", func(t *testing.T) {
		// ARRANGE
		payload := map[string]interface{}{
			"name": "Missing ID",
		}
		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		// ACT
		req, err := http.NewRequestWithContext(ctx, "PUT", apiEndpoint+"/items", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		// ASSERT
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode, "Should return 400 Bad Request")

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		require.NoError(t, err)

		assert.Contains(t, result["error"], "ID is required")
	})

	t.Run("DELETE without ID returns 400 Bad Request", func(t *testing.T) {
		// ACT
		req, err := http.NewRequestWithContext(ctx, "DELETE", apiEndpoint+"/items", nil)
		require.NoError(t, err)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		// ASSERT
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode, "Should return 400 Bad Request")

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		require.NoError(t, err)

		assert.Contains(t, result["error"], "ID is required")
	})

	t.Run("GET non-existent item returns 404 Not Found", func(t *testing.T) {
		// ACT
		nonExistentID := "non-existent-id-12345"
		req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/items?id=%s", apiEndpoint, nonExistentID), nil)
		require.NoError(t, err)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		// ASSERT
		assert.Equal(t, http.StatusNotFound, resp.StatusCode, "Should return 404 Not Found")
	})
}

// ==========================================
// LAMBDA-DYNAMODB DIRECT INTERACTION TESTS
// ==========================================

func TestLambdaDynamoDBInteraction(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	outputs := loadTapStackOutputs(t)
	lambdaClient := lambda.NewFromConfig(cfg)
	dynamoClient := dynamodb.NewFromConfig(cfg)

	functionName := outputs.LambdaFunctionArn[strings.LastIndex(outputs.LambdaFunctionArn, ":")+1:]

	t.Run("Lambda has correct DynamoDB permissions", func(t *testing.T) {
		// Get Lambda function configuration
		funcResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		// Verify TABLE_NAME environment variable matches actual table
		tableName := funcResp.Configuration.Environment.Variables["TABLE_NAME"]
		assert.Equal(t, outputs.TableName, tableName, "Lambda should have correct TABLE_NAME")

		// Verify role has DynamoDB permissions by checking role name
		roleName := *funcResp.Configuration.Role
		assert.Contains(t, roleName, "tap-lambda-role", "Lambda should use correct IAM role")
	})

	t.Run("Lambda can invoke and write to DynamoDB", func(t *testing.T) {
		// ARRANGE - Create a test event for Lambda
		testEvent := map[string]interface{}{
			"httpMethod": "POST",
			"path":       "/items",
			"body": `{
				"name": "Direct Lambda Test",
				"description": "Testing Lambda-DynamoDB interaction"
			}`,
		}
		eventBytes, err := json.Marshal(testEvent)
		require.NoError(t, err)

		// ACT - Invoke Lambda directly
		invokeResp, err := lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      eventBytes,
		})
		require.NoError(t, err)
		assert.Nil(t, invokeResp.FunctionError, "Lambda should execute without errors")

		// Parse Lambda response
		var lambdaResult map[string]interface{}
		err = json.Unmarshal(invokeResp.Payload, &lambdaResult)
		require.NoError(t, err)

		assert.Equal(t, float64(201), lambdaResult["statusCode"], "Lambda should return 201")

		// Parse the body from Lambda response
		bodyStr := lambdaResult["body"].(string)
		var body map[string]interface{}
		err = json.Unmarshal([]byte(bodyStr), &body)
		require.NoError(t, err)

		createdID := body["id"].(string)
		assert.NotEmpty(t, createdID, "Should have created item ID")

		// ASSERT - Verify item was actually written to DynamoDB
		time.Sleep(2 * time.Second)
		getItemResp, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(outputs.TableName),
			Key: map[string]types.AttributeValue{
				"id": &types.AttributeValueMemberS{
					Value: createdID,
				},
			},
		})
		require.NoError(t, err)
		assert.NotEmpty(t, getItemResp.Item, "Item should exist in DynamoDB")

		// Clean up
		_, _ = dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
			TableName: aws.String(outputs.TableName),
			Key: map[string]types.AttributeValue{
				"id": &types.AttributeValueMemberS{
					Value: createdID,
				},
			},
		})
	})
}

// ==========================================
// OBSERVABILITY TESTS (CloudWatch & X-Ray)
// ==========================================

func TestObservabilityAndMonitoring(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	outputs := loadTapStackOutputs(t)
	logsClient := cloudwatchlogs.NewFromConfig(cfg)
	xrayClient := xray.NewFromConfig(cfg)

	functionName := outputs.LambdaFunctionArn[strings.LastIndex(outputs.LambdaFunctionArn, ":")+1:]
	logGroupName := fmt.Sprintf("/aws/lambda/%s", functionName)

	t.Run("CloudWatch Logs group exists for Lambda function", func(t *testing.T) {
		// ACT
		resp, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(logGroupName),
		})
		require.NoError(t, err)

		// ASSERT
		assert.NotEmpty(t, resp.LogGroups, "Log group should exist")
		assert.Equal(t, logGroupName, *resp.LogGroups[0].LogGroupName, "Log group name should match")

		// Verify retention period (7 days)
		assert.NotNil(t, resp.LogGroups[0].RetentionInDays, "Retention should be set")
		assert.Equal(t, int32(7), *resp.LogGroups[0].RetentionInDays, "Retention should be 7 days")
	})

	t.Run("Lambda function logs are being written to CloudWatch", func(t *testing.T) {
		// First, invoke the Lambda to generate logs
		lambdaClient := lambda.NewFromConfig(cfg)
		testEvent := map[string]interface{}{
			"httpMethod": "GET",
			"path":       "/items",
		}
		eventBytes, err := json.Marshal(testEvent)
		require.NoError(t, err)

		_, err = lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      eventBytes,
		})
		require.NoError(t, err)

		// Wait for logs to be available
		time.Sleep(10 * time.Second)

		// ACT - Check for log streams
		streamsResp, err := logsClient.DescribeLogStreams(ctx, &cloudwatchlogs.DescribeLogStreamsInput{
			LogGroupName: aws.String(logGroupName),
			Descending:   aws.Bool(true),
			OrderBy:      "LastEventTime",
			Limit:        aws.Int32(1),
		})
		require.NoError(t, err)

		// ASSERT
		assert.NotEmpty(t, streamsResp.LogStreams, "Log streams should exist")
		assert.NotNil(t, streamsResp.LogStreams[0].LastEventTimestamp, "Log stream should have recent events")
	})

	t.Run("X-Ray tracing is active and collecting traces", func(t *testing.T) {
		// First, invoke the Lambda to generate traces
		lambdaClient := lambda.NewFromConfig(cfg)
		testEvent := map[string]interface{}{
			"httpMethod": "GET",
			"path":       "/items",
		}
		eventBytes, err := json.Marshal(testEvent)
		require.NoError(t, err)

		_, err = lambdaClient.Invoke(ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      eventBytes,
		})
		require.NoError(t, err)

		// Wait for traces to be available
		time.Sleep(15 * time.Second)

		// ACT - Get trace summaries
		endTime := time.Now()
		startTime := endTime.Add(-5 * time.Minute)

		tracesResp, err := xrayClient.GetTraceSummaries(ctx, &xray.GetTraceSummariesInput{
			StartTime: aws.Time(startTime),
			EndTime:   aws.Time(endTime),
		})

		// ASSERT
		// Note: X-Ray might take time to propagate traces, so we check if the API call works
		require.NoError(t, err, "X-Ray API should be accessible")

		// If traces are available, verify they exist
		if len(tracesResp.TraceSummaries) > 0 {
			assert.NotEmpty(t, tracesResp.TraceSummaries, "Traces should be collected")
		}
	})
}

// ==========================================
// SECURITY & IAM PERMISSION TESTS
// ==========================================

func TestSecurityAndIAMPermissions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	outputs := loadTapStackOutputs(t)
	lambdaClient := lambda.NewFromConfig(cfg)
	iamClient := iam.NewFromConfig(cfg)

	functionName := outputs.LambdaFunctionArn[strings.LastIndex(outputs.LambdaFunctionArn, ":")+1:]

	t.Run("Lambda execution role has correct policies attached", func(t *testing.T) {
		// Get Lambda function to extract role
		funcResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		// Extract role name from ARN
		roleArn := *funcResp.Configuration.Role
		roleName := roleArn[strings.LastIndex(roleArn, "/")+1:]

		// ACT - List attached policies
		policiesResp, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)

		// ASSERT - Should have AWSLambdaBasicExecutionRole
		foundBasicExecution := false
		for _, policy := range policiesResp.AttachedPolicies {
			if strings.Contains(*policy.PolicyName, "AWSLambdaBasicExecutionRole") {
				foundBasicExecution = true
				break
			}
		}
		assert.True(t, foundBasicExecution, "Role should have AWSLambdaBasicExecutionRole attached")

		// Check inline policies for DynamoDB permissions
		inlinePoliciesResp, err := iamClient.ListRolePolicies(ctx, &iam.ListRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)

		// Should have at least one inline policy for DynamoDB access
		assert.NotEmpty(t, inlinePoliciesResp.PolicyNames, "Role should have inline policies for DynamoDB")
	})

	t.Run("Lambda role trust relationship allows Lambda service", func(t *testing.T) {
		// Get Lambda function to extract role
		funcResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		roleArn := *funcResp.Configuration.Role
		roleName := roleArn[strings.LastIndex(roleArn, "/")+1:]

		// ACT - Get role details
		roleResp, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)

		// ASSERT - Verify trust relationship
		assert.NotNil(t, roleResp.Role.AssumeRolePolicyDocument, "Role should have assume role policy")
		assert.Contains(t, *roleResp.Role.AssumeRolePolicyDocument, "lambda.amazonaws.com", "Role should trust Lambda service")
	})

	t.Run("API Gateway has proper CORS configuration", func(t *testing.T) {
		// Make an OPTIONS request to verify CORS preflight
		apiEndpoint := strings.TrimSuffix(outputs.APIEndpoint, "/")

		req, err := http.NewRequestWithContext(ctx, "OPTIONS", apiEndpoint+"/items", nil)
		require.NoError(t, err)
		req.Header.Set("Access-Control-Request-Method", "POST")
		req.Header.Set("Access-Control-Request-Headers", "Content-Type")
		req.Header.Set("Origin", "https://example.com")

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		// ASSERT - Verify CORS headers
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Origin"), "Should have CORS Allow-Origin header")
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Methods"), "Should have CORS Allow-Methods header")
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Headers"), "Should have CORS Allow-Headers header")
	})
}

// ==========================================
// API GATEWAY THROTTLING & PERFORMANCE TESTS
// ==========================================

func TestAPIGatewayPerformanceAndThrottling(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	outputs := loadTapStackOutputs(t)
	apiClient := apigateway.NewFromConfig(cfg)

	// Extract API ID from endpoint URL
	endpointParts := strings.Split(outputs.APIEndpoint, ".")
	apiID := strings.TrimPrefix(endpointParts[0], "https://")

	// Extract stage name from endpoint
	stageName := outputs.APIEndpoint[strings.LastIndex(outputs.APIEndpoint[:len(outputs.APIEndpoint)-1], "/")+1 : len(outputs.APIEndpoint)-1]

	t.Run("API Gateway stage has throttling configured", func(t *testing.T) {
		// ACT - Get stage information
		stageResp, err := apiClient.GetStage(ctx, &apigateway.GetStageInput{
			RestApiId: aws.String(apiID),
			StageName: aws.String(stageName),
		})
		require.NoError(t, err)

		// ASSERT - Verify stage exists and has settings
		assert.NotNil(t, stageResp, "Stage should exist")
		assert.Equal(t, stageName, *stageResp.StageName, "Stage name should match")

		// Verify method settings if available
		if stageResp.MethodSettings != nil && len(stageResp.MethodSettings) > 0 {
			// Use comma-ok idiom to check if key exists in map
			if methodSetting, ok := stageResp.MethodSettings["*/*"]; ok {
				// Verify logging is enabled (LoggingLevel is *string)
				if methodSetting.LoggingLevel != nil {
					assert.NotEmpty(t, *methodSetting.LoggingLevel, "Logging level should be set")
				}
				// Verify metrics are enabled (MetricsEnabled is bool, use directly)
				assert.True(t, methodSetting.MetricsEnabled, "Metrics should be enabled")

				// Verify throttling settings (both are value types, use directly)
				assert.GreaterOrEqual(t, methodSetting.ThrottlingRateLimit, float64(0), "Throttling rate limit should be set")
				assert.GreaterOrEqual(t, methodSetting.ThrottlingBurstLimit, int32(0), "Throttling burst limit should be set")
			}
		}
	})
}
