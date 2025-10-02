//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
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
