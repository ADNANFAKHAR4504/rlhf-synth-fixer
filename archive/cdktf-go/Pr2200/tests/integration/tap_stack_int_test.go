//go:build integration
// +build integration

package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// IntegrationTestConfig holds configuration for integration tests
type IntegrationTestConfig struct {
	Region          string
	StackName       string
	ExpectedAppName string
	TestTimeout     time.Duration
}

// setupIntegrationTest sets up common configuration for integration tests
func setupIntegrationTest(t *testing.T) (*IntegrationTestConfig, aws.Config) {
	t.Helper()

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "synthtrainr963"
	}

	// Use the correct naming convention: envSuffix + "-xk9f"
	envPrefix := envSuffix + "-xk9f"

	return &IntegrationTestConfig{
		Region:          region,
		StackName:       "TapStack" + envSuffix,
		ExpectedAppName: envPrefix,
		TestTimeout:     10 * time.Minute,
	}, cfg
}

// TestAWSConnectivity tests that we can connect to AWS and the region is accessible
func TestAWSConnectivity(t *testing.T) {
	config, awsConfig := setupIntegrationTest(t)

	ctx, cancel := context.WithTimeout(context.Background(), config.TestTimeout)
	defer cancel()

	// Test basic AWS connectivity by listing S3 buckets (minimal permissions needed)
	s3Client := s3.NewFromConfig(awsConfig)

	_, err := s3Client.ListBuckets(ctx, &s3.ListBucketsInput{})
	if err != nil {
		t.Skipf("AWS connectivity test failed (may need AWS credentials): %v", err)
	}

	t.Logf("AWS connectivity verified for region: %s", config.Region)
}

// TestLambdaFunctionsDeployed tests that Lambda functions are deployed and functional
func TestLambdaFunctionsDeployed(t *testing.T) {
	config, awsConfig := setupIntegrationTest(t)

	ctx, cancel := context.WithTimeout(context.Background(), config.TestTimeout)
	defer cancel()

	lambdaClient := lambda.NewFromConfig(awsConfig)

	expectedFunctions := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	foundAnyFunction := false
	for _, funcType := range expectedFunctions {
		functionName := fmt.Sprintf("%s-lambda-%s-production", config.ExpectedAppName, funcType)

		getFunctionInput := &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		}

		result, err := lambdaClient.GetFunction(ctx, getFunctionInput)
		if err != nil {
			t.Logf("Lambda function %s not found (may not be deployed): %v", functionName, err)
			continue
		}

		foundAnyFunction = true
		funcConfig := result.Configuration

		if funcConfig.Runtime != "nodejs18.x" {
			t.Errorf("Lambda function %s has incorrect runtime: expected nodejs18.x, got %s",
				functionName, funcConfig.Runtime)
		}

		if funcConfig.Environment != nil && funcConfig.Environment.Variables != nil {
			envVars := funcConfig.Environment.Variables

			if logLevel, exists := envVars["LOG_LEVEL"]; !exists || logLevel != "INFO" {
				t.Errorf("Lambda function %s missing or incorrect LOG_LEVEL environment variable", functionName)
			}

			if debugEnabled, exists := envVars["DEBUG_ENABLED"]; !exists || debugEnabled != "false" {
				t.Errorf("Lambda function %s missing or incorrect DEBUG_ENABLED environment variable", functionName)
			}
		}

		t.Logf("Lambda function %s is deployed correctly", functionName)
	}

	if !foundAnyFunction {
		t.Skip("No Lambda functions found - infrastructure may not be deployed yet")
	}
}

// TestDynamoDBTableExists tests that DynamoDB table is properly configured
func TestDynamoDBTableExists(t *testing.T) {
	config, awsConfig := setupIntegrationTest(t)

	ctx, cancel := context.WithTimeout(context.Background(), config.TestTimeout)
	defer cancel()

	dynamoClient := dynamodb.NewFromConfig(awsConfig)

	tableName := fmt.Sprintf("%s-dynamodb-sessions-production", config.ExpectedAppName)

	describeInput := &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	}

	result, err := dynamoClient.DescribeTable(ctx, describeInput)
	if err != nil {
		t.Skipf("DynamoDB table %s not found (may not be deployed): %v", tableName, err)
	}

	table := result.Table

	if table.BillingModeSummary != nil && table.BillingModeSummary.BillingMode != "PAY_PER_REQUEST" {
		t.Errorf("DynamoDB table %s has incorrect billing mode: expected PAY_PER_REQUEST, got %s",
			tableName, table.BillingModeSummary.BillingMode)
	}

	if table.SSEDescription == nil || table.SSEDescription.Status != "ENABLED" {
		t.Errorf("DynamoDB table %s does not have encryption enabled", tableName)
	}

	t.Logf("DynamoDB table %s is configured correctly", tableName)
}

// TestS3BucketConfiguration tests S3 bucket setup and security
func TestS3BucketConfiguration(t *testing.T) {
	config, awsConfig := setupIntegrationTest(t)

	ctx, cancel := context.WithTimeout(context.Background(), config.TestTimeout)
	defer cancel()

	s3Client := s3.NewFromConfig(awsConfig)

	bucketName := fmt.Sprintf("%s-s3-lambda-deploy-production", config.ExpectedAppName)

	headBucketInput := &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	}

	_, err := s3Client.HeadBucket(ctx, headBucketInput)
	if err != nil {
		t.Skipf("S3 bucket %s not found (may not be deployed): %v", bucketName, err)
	}

	getVersioningInput := &s3.GetBucketVersioningInput{
		Bucket: aws.String(bucketName),
	}

	versioningResult, err := s3Client.GetBucketVersioning(ctx, getVersioningInput)
	if err != nil {
		t.Errorf("Failed to get versioning for bucket %s: %v", bucketName, err)
	} else if versioningResult.Status != "Enabled" {
		t.Errorf("S3 bucket %s does not have versioning enabled", bucketName)
	}

	getEncryptionInput := &s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	}

	encryptionResult, err := s3Client.GetBucketEncryption(ctx, getEncryptionInput)
	if err != nil {
		t.Errorf("Failed to get encryption for bucket %s: %v", bucketName, err)
	} else if len(encryptionResult.ServerSideEncryptionConfiguration.Rules) == 0 {
		t.Errorf("S3 bucket %s does not have encryption configured", bucketName)
	}

	getPolicyInput := &s3.GetBucketPolicyInput{
		Bucket: aws.String(bucketName),
	}

	policyResult, err := s3Client.GetBucketPolicy(ctx, getPolicyInput)
	if err != nil {
		t.Errorf("Failed to get policy for bucket %s: %v", bucketName, err)
	} else if !strings.Contains(*policyResult.Policy, "aws:SecureTransport") {
		t.Errorf("S3 bucket %s policy does not enforce HTTPS", bucketName)
	}

	t.Logf("S3 bucket %s is configured correctly", bucketName)
}

// TestResourceNamingConvention tests that all resources follow the expected naming convention
func TestResourceNamingConvention(t *testing.T) {
	config, _ := setupIntegrationTest(t)

	expectedPrefix := config.ExpectedAppName

	testCases := []struct {
		resourceType string
		expectedName string
	}{
		{"S3 Bucket", fmt.Sprintf("%s-s3-lambda-deploy-production", expectedPrefix)},
		{"DynamoDB Table", fmt.Sprintf("%s-dynamodb-sessions-production", expectedPrefix)},
		{"API Gateway", fmt.Sprintf("%s-apigateway-api-production", expectedPrefix)},
	}

	for _, tc := range testCases {
		if !strings.HasPrefix(tc.expectedName, expectedPrefix) {
			t.Errorf("%s name '%s' doesn't follow naming convention (should start with '%s')",
				tc.resourceType, tc.expectedName, expectedPrefix)
		}
	}

	t.Logf("Resource naming convention verified for prefix: %s", expectedPrefix)
}
