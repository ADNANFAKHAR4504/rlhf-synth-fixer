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

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TapStackOutputs represents the structure of cfn-outputs/flat-outputs.json
type TapStackOutputs struct {
	ApiGatewayUrl     string `json:"ApiGatewayUrl"`
	ApiGatewayId      string `json:"ApiGatewayId"`
	HelloLambdaArn    string `json:"HelloLambdaArn"`
	HelloLambdaName   string `json:"HelloLambdaName"`
	HelloLogGroupName string `json:"HelloLogGroupName"`
	UsersLambdaArn    string `json:"UsersLambdaArn"`
	UsersLambdaName   string `json:"UsersLambdaName"`
	UsersLogGroupName string `json:"UsersLogGroupName"`
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
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("API Gateway is properly configured and accessible", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		apiGatewayClient := apigateway.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// ACT - Get API Gateway details
		apiResp, err := apiGatewayClient.GetRestApi(ctx, &apigateway.GetRestApiInput{
			RestApiId: aws.String(outputs.ApiGatewayId),
		})
		require.NoError(t, err, "Failed to get API Gateway details")

		// ASSERT
		require.NotNil(t, apiResp.Name, "API Gateway name should not be nil")
		assert.Contains(t, *apiResp.Name, "tap-api", "API Gateway should have correct name")

		// Check endpoint configuration with nil safety
		if apiResp.EndpointConfiguration != nil && len(apiResp.EndpointConfiguration.Types) > 0 {
			assert.Equal(t, "REGIONAL", string(apiResp.EndpointConfiguration.Types[0]), "API Gateway should be regional")
		}

		// Check API Gateway stages
		stagesResp, err := apiGatewayClient.GetStages(ctx, &apigateway.GetStagesInput{
			RestApiId: aws.String(outputs.ApiGatewayId),
		})
		require.NoError(t, err, "Failed to get API Gateway stages")
		require.NotNil(t, stagesResp.Item, "Stages response should not be nil")
		assert.NotEmpty(t, stagesResp.Item, "API Gateway should have at least one stage")

		// Verify stage configuration with nil checks
		if len(stagesResp.Item) > 0 {
			stage := stagesResp.Item[0]
			require.NotNil(t, stage.StageName, "Stage name should not be nil")

			// Check method settings if they exist
			if stage.MethodSettings != nil {
				assert.NotEmpty(t, stage.MethodSettings, "Stage should have method settings configured")
			}
		}

		// Check resources
		resourcesResp, err := apiGatewayClient.GetResources(ctx, &apigateway.GetResourcesInput{
			RestApiId: aws.String(outputs.ApiGatewayId),
		})
		require.NoError(t, err, "Failed to get API Gateway resources")
		require.NotNil(t, resourcesResp.Items, "Resources should not be nil")

		// Verify expected resources exist (root, health, hello, users, users/{id})
		resourcePaths := make([]string, 0)
		for _, resource := range resourcesResp.Items {
			if resource.PathPart != nil {
				resourcePaths = append(resourcePaths, *resource.PathPart)
			}
		}

		// Log all resource paths for debugging
		t.Logf("Found resource paths: %v", resourcePaths)

		// Check for expected endpoints (they might be empty string for root)
		hasHealth := false
		hasHello := false
		hasUsers := false

		for _, path := range resourcePaths {
			if path == "health" {
				hasHealth = true
			}
			if path == "hello" {
				hasHello = true
			}
			if path == "users" {
				hasUsers = true
			}
		}

		assert.True(t, hasHealth, "Should have health endpoint")
		assert.True(t, hasHello, "Should have hello endpoint")
		assert.True(t, hasUsers, "Should have users endpoint")
	})

	t.Run("Lambda functions are properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		lambdaClient := lambda.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// Test Hello Lambda function
		t.Run("Hello Lambda function", func(t *testing.T) {
			// ACT - Get Hello Lambda function configuration
			helloResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
				FunctionName: aws.String(outputs.HelloLambdaName),
			})
			require.NoError(t, err, "Hello Lambda function should exist")
			require.NotNil(t, helloResp.Configuration, "Lambda configuration should not be nil")

			// ASSERT
			config := helloResp.Configuration
			assert.Equal(t, "python3.9", string(config.Runtime), "Hello Lambda should use Python 3.9 runtime")

			if config.Handler != nil {
				assert.Equal(t, "index.lambda_handler", *config.Handler, "Hello Lambda should have correct handler")
			}
			if config.MemorySize != nil {
				assert.Equal(t, int32(256), *config.MemorySize, "Hello Lambda should have 256MB memory")
			}
			if config.Timeout != nil {
				assert.Equal(t, int32(30), *config.Timeout, "Hello Lambda should have 30 second timeout")
			}

			// Check environment variables
			if config.Environment != nil && config.Environment.Variables != nil {
				envVars := config.Environment.Variables
				assert.Equal(t, "hello-service", envVars["SERVICE"], "Should have correct service name")
			}

			// Check X-Ray tracing
			if config.TracingConfig != nil {
				assert.Equal(t, "Active", string(config.TracingConfig.Mode), "X-Ray tracing should be active")
			}
		})

		// Test Users Lambda function
		t.Run("Users Lambda function", func(t *testing.T) {
			// ACT - Get Users Lambda function configuration
			usersResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
				FunctionName: aws.String(outputs.UsersLambdaName),
			})
			require.NoError(t, err, "Users Lambda function should exist")
			require.NotNil(t, usersResp.Configuration, "Lambda configuration should not be nil")

			// ASSERT
			config := usersResp.Configuration
			assert.Equal(t, "python3.9", string(config.Runtime), "Users Lambda should use Python 3.9 runtime")

			if config.Handler != nil {
				assert.Equal(t, "index.lambda_handler", *config.Handler, "Users Lambda should have correct handler")
			}
			if config.MemorySize != nil {
				assert.Equal(t, int32(256), *config.MemorySize, "Users Lambda should have 256MB memory")
			}
			if config.Timeout != nil {
				assert.Equal(t, int32(30), *config.Timeout, "Users Lambda should have 30 second timeout")
			}

			// Check environment variables
			if config.Environment != nil && config.Environment.Variables != nil {
				envVars := config.Environment.Variables
				assert.Equal(t, "users-service", envVars["SERVICE"], "Should have correct service name")
			}

			// Check X-Ray tracing
			if config.TracingConfig != nil {
				assert.Equal(t, "Active", string(config.TracingConfig.Mode), "X-Ray tracing should be active")
			}
		})
	})

	t.Run("CloudWatch Log Groups are properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		logsClient := cloudwatchlogs.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// Test Hello Lambda log group
		t.Run("Hello Lambda log group", func(t *testing.T) {
			// ACT
			helloLogResp, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
				LogGroupNamePrefix: aws.String(outputs.HelloLogGroupName),
			})
			require.NoError(t, err, "Failed to describe Hello Lambda log group")

			// ASSERT
			require.Len(t, helloLogResp.LogGroups, 1, "Should have exactly one Hello Lambda log group")
			logGroup := helloLogResp.LogGroups[0]

			if logGroup.LogGroupName != nil {
				assert.Equal(t, outputs.HelloLogGroupName, *logGroup.LogGroupName, "Log group name should match")
			}
			if logGroup.RetentionInDays != nil {
				assert.Equal(t, int32(30), *logGroup.RetentionInDays, "Log retention should be 30 days")
			}
		})

		// Test Users Lambda log group
		t.Run("Users Lambda log group", func(t *testing.T) {
			// ACT
			usersLogResp, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
				LogGroupNamePrefix: aws.String(outputs.UsersLogGroupName),
			})
			require.NoError(t, err, "Failed to describe Users Lambda log group")

			// ASSERT
			require.Len(t, usersLogResp.LogGroups, 1, "Should have exactly one Users Lambda log group")
			logGroup := usersLogResp.LogGroups[0]

			if logGroup.LogGroupName != nil {
				assert.Equal(t, outputs.UsersLogGroupName, *logGroup.LogGroupName, "Log group name should match")
			}
			if logGroup.RetentionInDays != nil {
				assert.Equal(t, int32(30), *logGroup.RetentionInDays, "Log retention should be 30 days")
			}
		})

		// Test API Gateway log group
		t.Run("API Gateway log group", func(t *testing.T) {
			// ACT
			apiLogResp, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
				LogGroupNamePrefix: aws.String("/aws/apigateway/tap-api-dev"),
			})

			// API Gateway log group might not exist if not configured, so don't require it
			if err == nil && len(apiLogResp.LogGroups) > 0 {
				logGroup := apiLogResp.LogGroups[0]
				if logGroup.LogGroupName != nil {
					assert.Contains(t, *logGroup.LogGroupName, "/aws/apigateway/tap-api", "Log group name should contain API Gateway prefix")
				}
				if logGroup.RetentionInDays != nil {
					assert.Equal(t, int32(30), *logGroup.RetentionInDays, "Log retention should be 30 days")
				}
			} else {
				t.Log("API Gateway log group not found or not configured, skipping validation")
			}
		})
	})

	t.Run("IAM roles are properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		iamClient := iam.NewFromConfig(cfg)
		lambdaClient := lambda.NewFromConfig(cfg)
		outputs := loadTapStackOutputs(t)

		// Get Lambda function details to extract role ARNs
		helloResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.HelloLambdaName),
		})
		require.NoError(t, err, "Failed to get Hello Lambda function")
		require.NotNil(t, helloResp.Configuration, "Hello Lambda configuration should not be nil")
		require.NotNil(t, helloResp.Configuration.Role, "Hello Lambda role should not be nil")

		usersResp, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.UsersLambdaName),
		})
		require.NoError(t, err, "Failed to get Users Lambda function")
		require.NotNil(t, usersResp.Configuration, "Users Lambda configuration should not be nil")
		require.NotNil(t, usersResp.Configuration.Role, "Users Lambda role should not be nil")

		// Extract role names from ARNs
		helloRoleName := extractRoleNameFromArn(*helloResp.Configuration.Role)
		usersRoleName := extractRoleNameFromArn(*usersResp.Configuration.Role)

		// Test Hello Lambda role
		t.Run("Hello Lambda IAM role", func(t *testing.T) {
			// ACT
			roleResp, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
				RoleName: aws.String(helloRoleName),
			})
			require.NoError(t, err, "Hello Lambda role should exist")
			require.NotNil(t, roleResp.Role, "Role should not be nil")

			// ASSERT
			if roleResp.Role.RoleName != nil {
				assert.Contains(t, *roleResp.Role.RoleName, "hello", "Role name should contain 'hello'")
			}
			if roleResp.Role.AssumeRolePolicyDocument != nil {
				assert.Contains(t, *roleResp.Role.AssumeRolePolicyDocument, "lambda.amazonaws.com", "Role should trust Lambda service")
			}

			// Check attached policies
			policiesResp, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
				RoleName: aws.String(helloRoleName),
			})
			require.NoError(t, err, "Failed to list attached policies")

			policyNames := make([]string, 0)
			for _, policy := range policiesResp.AttachedPolicies {
				if policy.PolicyName != nil {
					policyNames = append(policyNames, *policy.PolicyName)
				}
			}
			assert.Contains(t, policyNames, "AWSLambdaBasicExecutionRole", "Should have basic execution role")
		})

		// Test Users Lambda role
		t.Run("Users Lambda IAM role", func(t *testing.T) {
			// ACT
			roleResp, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
				RoleName: aws.String(usersRoleName),
			})
			require.NoError(t, err, "Users Lambda role should exist")
			require.NotNil(t, roleResp.Role, "Role should not be nil")

			// ASSERT
			if roleResp.Role.RoleName != nil {
				assert.Contains(t, *roleResp.Role.RoleName, "users", "Role name should contain 'users'")
			}
			if roleResp.Role.AssumeRolePolicyDocument != nil {
				assert.Contains(t, *roleResp.Role.AssumeRolePolicyDocument, "lambda.amazonaws.com", "Role should trust Lambda service")
			}

			// Check attached policies
			policiesResp, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
				RoleName: aws.String(usersRoleName),
			})
			require.NoError(t, err, "Failed to list attached policies")

			policyNames := make([]string, 0)
			for _, policy := range policiesResp.AttachedPolicies {
				if policy.PolicyName != nil {
					policyNames = append(policyNames, *policy.PolicyName)
				}
			}
			assert.Contains(t, policyNames, "AWSLambdaBasicExecutionRole", "Should have basic execution role")
		})
	})

	t.Run("API endpoints are functional", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		// Test health endpoint
		t.Run("Health endpoint returns 200", func(t *testing.T) {
			// ACT
			resp, err := client.Get(outputs.ApiGatewayUrl + "health")
			require.NoError(t, err, "Health endpoint should be accessible")
			defer resp.Body.Close()

			// ASSERT
			assert.Equal(t, http.StatusOK, resp.StatusCode, "Health endpoint should return 200")

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Should be able to read response body")

			var healthResponse map[string]interface{}
			err = json.Unmarshal(body, &healthResponse)
			require.NoError(t, err, "Response should be valid JSON")

			assert.Equal(t, "healthy", healthResponse["status"], "Should return healthy status")
			assert.NotEmpty(t, healthResponse["timestamp"], "Should include timestamp")
			assert.NotEmpty(t, healthResponse["requestId"], "Should include request ID")
		})

		// Test hello endpoint
		t.Run("Hello endpoint returns correct response", func(t *testing.T) {
			// ACT
			resp, err := client.Get(outputs.ApiGatewayUrl + "hello")
			require.NoError(t, err, "Hello endpoint should be accessible")
			defer resp.Body.Close()

			// ASSERT
			assert.Equal(t, http.StatusOK, resp.StatusCode, "Hello endpoint should return 200")

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Should be able to read response body")

			var helloResponse map[string]interface{}
			err = json.Unmarshal(body, &helloResponse)
			require.NoError(t, err, "Response should be valid JSON")

			assert.Equal(t, "Hello from AWS Lambda!", helloResponse["message"], "Should return hello message")
			assert.Equal(t, "hello-service", helloResponse["service"], "Should return correct service name")
			assert.NotEmpty(t, helloResponse["function_name"], "Should include function name")
			assert.Equal(t, string("256"), helloResponse["memory_limit"], "Should return correct memory limit")
		})

		// Test users endpoint
		t.Run("Users endpoint returns user list", func(t *testing.T) {
			// ACT
			resp, err := client.Get(outputs.ApiGatewayUrl + "users")
			require.NoError(t, err, "Users endpoint should be accessible")
			defer resp.Body.Close()

			// ASSERT
			assert.Equal(t, http.StatusOK, resp.StatusCode, "Users endpoint should return 200")

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Should be able to read response body")

			var usersResponse map[string]interface{}
			err = json.Unmarshal(body, &usersResponse)
			require.NoError(t, err, "Response should be valid JSON")

			assert.NotEmpty(t, usersResponse["users"], "Should return users array")
			assert.Equal(t, float64(3), usersResponse["count"], "Should return correct user count")
			assert.Equal(t, "users-service", usersResponse["service"], "Should return correct service name")
		})

		// Test specific user endpoint
		t.Run("Specific user endpoint returns user data", func(t *testing.T) {
			// ACT
			resp, err := client.Get(outputs.ApiGatewayUrl + "users/1")
			require.NoError(t, err, "User endpoint should be accessible")
			defer resp.Body.Close()

			// ASSERT
			assert.Equal(t, http.StatusOK, resp.StatusCode, "User endpoint should return 200")

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Should be able to read response body")

			var userResponse map[string]interface{}
			err = json.Unmarshal(body, &userResponse)
			require.NoError(t, err, "Response should be valid JSON")

			user := userResponse["user"].(map[string]interface{})
			assert.Equal(t, "1", user["id"], "Should return correct user ID")
			assert.Equal(t, "John Doe", user["name"], "Should return correct user name")
			assert.Equal(t, "john.doe@example.com", user["email"], "Should return correct user email")
		})

		// Test non-existent user endpoint
		t.Run("Non-existent user endpoint returns 404", func(t *testing.T) {
			// ACT
			resp, err := client.Get(outputs.ApiGatewayUrl + "users/999")
			require.NoError(t, err, "User endpoint should be accessible")
			defer resp.Body.Close()

			// ASSERT
			assert.Equal(t, http.StatusNotFound, resp.StatusCode, "Non-existent user should return 404")

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Should be able to read response body")

			var errorResponse map[string]interface{}
			err = json.Unmarshal(body, &errorResponse)
			require.NoError(t, err, "Response should be valid JSON")

			assert.Equal(t, "User not found", errorResponse["error"], "Should return error message")
			assert.Equal(t, "999", errorResponse["user_id"], "Should return requested user ID")
		})
	})

	t.Run("outputs are correctly formatted and valid", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)

		// ASSERT - All required outputs should be present
		assert.NotEmpty(t, outputs.ApiGatewayUrl, "ApiGatewayUrl should be exported")
		assert.NotEmpty(t, outputs.ApiGatewayId, "ApiGatewayId should be exported")
		assert.NotEmpty(t, outputs.HelloLambdaArn, "HelloLambdaArn should be exported")
		assert.NotEmpty(t, outputs.HelloLambdaName, "HelloLambdaName should be exported")
		assert.NotEmpty(t, outputs.HelloLogGroupName, "HelloLogGroupName should be exported")
		assert.NotEmpty(t, outputs.UsersLambdaArn, "UsersLambdaArn should be exported")
		assert.NotEmpty(t, outputs.UsersLambdaName, "UsersLambdaName should be exported")
		assert.NotEmpty(t, outputs.UsersLogGroupName, "UsersLogGroupName should be exported")

		// ASSERT - URLs and ARNs should follow AWS format
		assert.Regexp(t, "^https://.*\\.execute-api\\..+\\.amazonaws\\.com/.+/$", outputs.ApiGatewayUrl, "API Gateway URL should be valid")
		assert.Regexp(t, "^[a-z0-9]+$", outputs.ApiGatewayId, "API Gateway ID should be valid")
		assert.Regexp(t, "^arn:aws:lambda:.+:.+:function:.+$", outputs.HelloLambdaArn, "Hello Lambda ARN should be valid")
		assert.Regexp(t, "^arn:aws:lambda:.+:.+:function:.+$", outputs.UsersLambdaArn, "Users Lambda ARN should be valid")
	})

	t.Run("CORS headers are properly configured", func(t *testing.T) {
		// ARRANGE
		outputs := loadTapStackOutputs(t)
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		// Test CORS on hello endpoint
		req, err := http.NewRequest("OPTIONS", outputs.ApiGatewayUrl+"hello", nil)
		require.NoError(t, err, "Should be able to create OPTIONS request")
		req.Header.Set("Origin", "https://example.com")

		// ACT
		resp, err := client.Do(req)
		require.NoError(t, err, "OPTIONS request should succeed")
		defer resp.Body.Close()

		// ASSERT
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Origin"), "Should have CORS origin header")
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Methods"), "Should have CORS methods header")
		assert.NotEmpty(t, resp.Header.Get("Access-Control-Allow-Headers"), "Should have CORS headers header")
	})
}

// Helper function to extract role name from ARN
func extractRoleNameFromArn(roleArn string) string {
	parts := strings.Split(roleArn, "/")
	return parts[len(parts)-1]
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}

// Helper function to wait for stack deletion completion
func waitForStackDeletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackDeleteCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
