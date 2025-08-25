//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/constructs-go/constructs/v10"
	jsii "github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// TapStackConfig holds configuration for the TapStack
type TapStackConfig struct {
	Region      string
	Environment string
	AppName     string
}

// TapStack represents the main infrastructure stack
type TapStack struct {
	Stack      cdktf.TerraformStack
	Config     *TapStackConfig
	Networking *NetworkingResources
	Security   *SecurityResources
	Lambda     *LambdaResources
	Monitoring *MonitoringResources
}

// Stub types for test compilation
type NetworkingResources struct{}
type SecurityResources struct{}
type LambdaResources struct{}
type MonitoringResources struct{}

// NewTapStack creates a new TapStack for testing
func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) *TapStack {
	tfStack := cdktf.NewTerraformStack(scope, &id)

	return &TapStack{
		Stack:      tfStack,
		Config:     config,
		Networking: &NetworkingResources{},
		Security:   &SecurityResources{},
		Lambda:     &LambdaResources{},
		Monitoring: &MonitoringResources{},
	}
}

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set environment variables for testing
	old := os.Getenv("AWS_REGION")
	oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	t.Cleanup(func() {
		_ = os.Setenv("AWS_REGION", old)
		_ = os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
	})
	_ = os.Setenv("AWS_REGION", region)
	_ = os.Setenv("ENVIRONMENT_SUFFIX", "test")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	config := &TapStackConfig{
		Region:      region,
		Environment: "test",
		AppName:     "trainr963-test",
	}

	NewTapStack(app, "TapStackTest", config)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStackTest", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

// readTerraformJSON reads and parses the generated Terraform JSON
func readTerraformJSON(t *testing.T, path string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read terraform file: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	return result
}

// TestTapStackCreation tests basic stack creation
func TestTapStackCreation(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	// Verify the terraform JSON structure
	if tfJSON["terraform"] == nil {
		t.Error("Expected terraform configuration in output")
	}

	if tfJSON["resource"] == nil {
		t.Error("Expected resources in terraform output")
	}
}

// TestLambdaFunctionsGenerated tests that Lambda functions are properly generated
func TestLambdaFunctionsGenerated(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check if Lambda functions exist
	expectedFunctions := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	for _, funcName := range expectedFunctions {
		found := false
		for resourceType, resourceInstances := range resources {
			if strings.Contains(resourceType, "lambda_function") {
				instances, ok := resourceInstances.(map[string]interface{})
				if !ok {
					continue
				}
				for instanceName := range instances {
					if strings.Contains(instanceName, funcName) {
						found = true
						break
					}
				}
			}
			if found {
				break
			}
		}
		if !found {
			t.Errorf("Expected Lambda function %s not found in terraform output", funcName)
		}
	}
}

// TestVPCConfiguration tests VPC and networking components
func TestVPCConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for VPC components
	expectedComponents := []string{"aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_nat_gateway"}

	for _, component := range expectedComponents {
		if resources[component] == nil {
			t.Errorf("Expected %s resource not found", component)
		}
	}
}

// TestSecurityConfiguration tests security-related resources
func TestSecurityConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for security components
	expectedComponents := []string{"aws_iam_role", "aws_iam_role_policy_attachment", "aws_security_group"}

	for _, component := range expectedComponents {
		if resources[component] == nil {
			t.Errorf("Expected %s resource not found", component)
		}
	}
}

// TestDynamoDBConfiguration tests DynamoDB table configuration
func TestDynamoDBConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for DynamoDB table
	dynamodbTables, ok := resources["aws_dynamodb_table"].(map[string]interface{})
	if !ok || len(dynamodbTables) == 0 {
		t.Fatal("Expected DynamoDB table in terraform output")
	}

	// Verify table configuration
	for _, tableConfig := range dynamodbTables {
		config, ok := tableConfig.(map[string]interface{})
		if !ok {
			continue
		}

		if billingMode, exists := config["billing_mode"]; exists {
			if billingMode != "PAY_PER_REQUEST" {
				t.Errorf("Expected billing_mode to be PAY_PER_REQUEST, got %v", billingMode)
			}
		}
	}
}

// TestS3BucketConfiguration tests S3 bucket setup
func TestS3BucketConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for S3 bucket
	if resources["aws_s3_bucket"] == nil {
		t.Error("Expected S3 bucket resource not found")
	}

	// Check for S3 encryption configuration
	if resources["aws_s3_bucket_server_side_encryption_configuration"] == nil {
		t.Error("Expected S3 encryption configuration not found")
	}

	// Check for S3 versioning
	if resources["aws_s3_bucket_versioning"] == nil {
		t.Error("Expected S3 versioning configuration not found")
	}
}

// TestAPIGatewayConfiguration tests API Gateway setup
func TestAPIGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for API Gateway components
	expectedComponents := []string{
		"aws_api_gateway_rest_api",
		"aws_api_gateway_resource",
		"aws_api_gateway_method",
		"aws_api_gateway_integration",
	}

	for _, component := range expectedComponents {
		if resources[component] == nil {
			t.Errorf("Expected %s resource not found", component)
		}
	}
}

// TestCloudWatchConfiguration tests CloudWatch logs and alarms
func TestCloudWatchConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Check for CloudWatch log groups
	if resources["aws_cloudwatch_log_group"] == nil {
		t.Error("Expected CloudWatch log group resource not found")
	}

	// Check for CloudWatch metric alarms
	if resources["aws_cloudwatch_metric_alarm"] == nil {
		t.Error("Expected CloudWatch metric alarm resource not found")
	}
}

// TestNamingConvention tests that resources follow the required naming convention
func TestNamingConvention(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfJSON := readTerraformJSON(t, tfPath)

	resources, ok := tfJSON["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected resources object in terraform output")
	}

	// Expected naming pattern: trainr963-test-component-name-test
	expectedPattern := "trainr963-test"

	// Check S3 bucket naming
	if s3Buckets, exists := resources["aws_s3_bucket"].(map[string]interface{}); exists {
		for _, bucketConfig := range s3Buckets {
			config, ok := bucketConfig.(map[string]interface{})
			if !ok {
				continue
			}
			if bucket, exists := config["bucket"]; exists {
				bucketName, ok := bucket.(string)
				if !ok {
					continue
				}
				if !strings.Contains(bucketName, expectedPattern) {
					t.Errorf("S3 bucket name %s doesn't follow naming convention", bucketName)
				}
			}
		}
	}
}
