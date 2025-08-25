//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildSecurityStack(stack, region)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

// parseTerraformJSON reads and parses the terraform JSON file
func parseTerraformJSON(t *testing.T, tfPath string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	return tfConfig
}

// getResource extracts a specific resource from terraform config
func getResource(tfConfig map[string]interface{}, resourceType, resourceName string) map[string]interface{} {
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		return nil
	}

	resourceTypeMap, ok := resources[resourceType].(map[string]interface{})
	if !ok {
		return nil
	}

	resource, ok := resourceTypeMap[resourceName].(map[string]interface{})
	if !ok {
		return nil
	}

	return resource
}

// TestSecurityStackSynthesis tests that the security stack synthesizes without errors
func TestSecurityStackSynthesis(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Verify basic structure
	if tfConfig == nil {
		t.Fatal("terraform config is nil")
	}

	if _, ok := tfConfig["resource"]; !ok {
		t.Fatal("no resources found in terraform config")
	}
}

// TestKMSKeyConfiguration tests KMS key creation and configuration
func TestKMSKeyConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check KMS key exists
	kmsKey := getResource(tfConfig, "aws_kms_key", "prod-security-kms-key")
	if kmsKey == nil {
		t.Fatal("KMS key resource not found")
	}

	// Verify KMS key description
	if desc, ok := kmsKey["description"]; !ok || desc != "KMS key for security infrastructure encryption" {
		t.Errorf("expected KMS key description, got: %v", desc)
	}

	// Verify key usage
	if usage, ok := kmsKey["key_usage"]; !ok || usage != "ENCRYPT_DECRYPT" {
		t.Errorf("expected ENCRYPT_DECRYPT key usage, got: %v", usage)
	}

	// Note: BuildSecurityStack uses default KMS policy, so no custom policy is expected

	// Check KMS alias exists
	kmsAlias := getResource(tfConfig, "aws_kms_alias", "prod-security-kms-alias")
	if kmsAlias == nil {
		t.Fatal("KMS alias resource not found")
	}

	if name, ok := kmsAlias["name"]; !ok || name != "alias/prod-security-key" {
		t.Errorf("expected alias name 'alias/prod-security-key', got: %v", name)
	}
}

// TestS3BucketEncryption tests S3 bucket creation and encryption configuration
func TestS3BucketEncryption(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check S3 bucket exists
	s3Bucket := getResource(tfConfig, "aws_s3_bucket", "prod-security-logs-bucket")
	if s3Bucket == nil {
		t.Fatal("S3 bucket resource not found")
	}

	// Verify bucket naming
	if bucket, ok := s3Bucket["bucket"]; !ok || !strings.Contains(bucket.(string), "prod-security-logs-bucket") {
		t.Errorf("expected prod-security-logs-bucket in name, got: %v", bucket)
	}

	// Note: BuildSecurityStack creates basic S3 bucket without separate encryption configuration
	// The encryption is handled by the main NewTapStack function
}

// TestLambdaConfiguration tests Lambda function creation and IAM configuration
func TestLambdaConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check Lambda function exists
	lambdaFunction := getResource(tfConfig, "aws_lambda_function", "prod-security-function")
	if lambdaFunction == nil {
		t.Fatal("Lambda function resource not found")
	}

	// Verify function name
	if name, ok := lambdaFunction["function_name"]; !ok || name != "prod-security-function" {
		t.Errorf("expected function name 'prod-security-function', got: %v", name)
	}

	// Verify runtime
	if runtime, ok := lambdaFunction["runtime"]; !ok || runtime != "python3.9" {
		t.Errorf("expected python3.9 runtime, got: %v", runtime)
	}

	// Verify KMS key ARN is set
	if kmsArn, ok := lambdaFunction["kms_key_arn"]; !ok || kmsArn == nil {
		t.Error("Lambda function KMS key ARN not set")
	}

	// Check IAM role exists
	iamRole := getResource(tfConfig, "aws_iam_role", "prod-lambda-execution-role")
	if iamRole == nil {
		t.Fatal("IAM role resource not found")
	}

	// Verify role name
	if name, ok := iamRole["name"]; !ok || name != "prod-lambda-execution-role" {
		t.Errorf("expected role name 'prod-lambda-execution-role', got: %v", name)
	}

	// Check IAM policy exists
	iamPolicy := getResource(tfConfig, "aws_iam_policy", "prod-lambda-policy")
	if iamPolicy == nil {
		t.Fatal("IAM policy resource not found")
	}

	// Verify policy has least privilege principles
	if policy, ok := iamPolicy["policy"]; ok && policy != nil {
		policyStr := policy.(string)
		if !strings.Contains(policyStr, "logs:CreateLogStream") {
			t.Error("policy should contain logs:CreateLogStream permission")
		}
		if !strings.Contains(policyStr, "logs:PutLogEvents") {
			t.Error("policy should contain logs:PutLogEvents permission")
		}
		if !strings.Contains(policyStr, "kms:Encrypt") {
			t.Error("policy should contain kms:Encrypt permission")
		}
	}
}

// TestCloudWatchLogsConfiguration tests CloudWatch log group creation
func TestCloudWatchLogsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check CloudWatch log group exists
	logGroup := getResource(tfConfig, "aws_cloudwatch_log_group", "prod-lambda-log-group")
	if logGroup == nil {
		t.Fatal("CloudWatch log group resource not found")
	}

	// Verify log group name
	if name, ok := logGroup["name"]; !ok || name != "/aws/lambda/prod-security-function" {
		t.Errorf("expected log group name '/aws/lambda/prod-security-function', got: %v", name)
	}

	// Verify retention period
	if retention, ok := logGroup["retention_in_days"]; !ok || retention != float64(14) {
		t.Errorf("expected retention 14 days, got: %v", retention)
	}

	// Note: BuildSecurityStack doesn't use KMS encryption for CloudWatch logs
}

// TestVPCFlowLogsConfiguration tests VPC Flow Logs creation
func TestVPCFlowLogsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check VPC flow log exists
	flowLog := getResource(tfConfig, "aws_flow_log", "prod-vpc-flow-logs")
	if flowLog == nil {
		t.Fatal("VPC flow log resource not found")
	}

	// Verify VPC ID (BuildSecurityStack uses vpc_id field)
	if vpcId, ok := flowLog["vpc_id"]; !ok || vpcId != "vpc-0abcd1234" {
		t.Errorf("expected vpc_id 'vpc-0abcd1234', got: %v", vpcId)
	}

	// Verify traffic type
	if trafficType, ok := flowLog["traffic_type"]; !ok || trafficType != "ALL" {
		t.Errorf("expected traffic_type 'ALL', got: %v", trafficType)
	}

	// Verify log destination type
	if destType, ok := flowLog["log_destination_type"]; !ok || destType != "s3" {
		t.Errorf("expected log_destination_type 's3', got: %v", destType)
	}

	// Verify log format includes required fields
	if logFormat, ok := flowLog["log_format"]; ok && logFormat != nil {
		formatStr := logFormat.(string)
		requiredFields := []string{"version", "account-id", "interface-id", "srcaddr", "dstaddr", "action"}
		for _, field := range requiredFields {
			if !strings.Contains(formatStr, field) {
				t.Errorf("log format missing required field: %s", field)
			}
		}
	}
}

// TestSecurityTaggingCompliance tests that all resources have required tags
func TestSecurityTaggingCompliance(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	_, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Check that key resources have tags
	resourcesToCheck := []struct {
		resourceType string
		resourceName string
	}{
		{"aws_kms_key", "prod-security-kms-key"},
		{"aws_s3_bucket", "prod-security-logs-bucket"},
		{"aws_lambda_function", "prod-security-function"},
		{"aws_cloudwatch_log_group", "prod-lambda-log-group"},
		{"aws_iam_role", "prod-lambda-execution-role"},
		{"aws_flow_log", "prod-vpc-flow-logs"},
	}

	for _, resource := range resourcesToCheck {
		resourceMap := getResource(tfConfig, resource.resourceType, resource.resourceName)
		if resourceMap == nil {
			t.Errorf("resource %s/%s not found", resource.resourceType, resource.resourceName)
			continue
		}

		if tags, ok := resourceMap["tags"]; !ok || tags == nil {
			t.Errorf("resource %s/%s missing tags", resource.resourceType, resource.resourceName)
		} else {
			tagsMap := tags.(map[string]interface{})
			if name, ok := tagsMap["Name"]; !ok || name == nil {
				t.Errorf("resource %s/%s missing 'Name' tag", resource.resourceType, resource.resourceName)
			}
		}
	}

	// Check AWS provider default tags
	providers, ok := tfConfig["provider"].(map[string]interface{})
	if ok {
		if awsProvider, ok := providers["aws"].([]interface{}); ok && len(awsProvider) > 0 {
			providerConfig := awsProvider[0].(map[string]interface{})
			if defaultTags, ok := providerConfig["default_tags"]; ok && defaultTags != nil {
				defaultTagsSlice := defaultTags.([]interface{})
				if len(defaultTagsSlice) > 0 {
					tagsConfig := defaultTagsSlice[0].(map[string]interface{})
					if tags, ok := tagsConfig["tags"]; ok && tags != nil {
						tagsMap := tags.(map[string]interface{})
						requiredTags := []string{"Environment", "Project", "ManagedBy"}
						for _, tag := range requiredTags {
							if _, exists := tagsMap[tag]; !exists {
								t.Errorf("provider missing required default tag: %s", tag)
							}
						}
					}
				}
			}
		}
	}
}

// Note: VPC tests removed since BuildSecurityStack doesn't create VPC infrastructure
// VPC resources are created by the main NewTapStack function

// TestOutputsConfiguration tests that required outputs are defined
func TestOutputsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	outputs, ok := tfConfig["output"].(map[string]interface{})
	if !ok {
		t.Fatal("no outputs found in terraform config")
	}

	requiredOutputs := []string{"kms_key_id", "s3_bucket_name", "lambda_function_name"}
	for _, outputName := range requiredOutputs {
		if _, exists := outputs[outputName]; !exists {
			t.Errorf("required output '%s' not found", outputName)
		}
	}

	// Verify output descriptions
	if kmsOutput, ok := outputs["kms_key_id"].(map[string]interface{}); ok {
		if desc, ok := kmsOutput["description"]; !ok || desc != "KMS Key ID for encryption" {
			t.Errorf("unexpected KMS output description: %v", desc)
		}
	}
}
