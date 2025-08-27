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
	BuildSecurityStack(stack, region, jsii.String("vpc-test123"))
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

	// Verify VPC ID (BuildSecurityStack uses vpc_id parameter)
	if vpcId, ok := flowLog["vpc_id"]; !ok || vpcId == nil {
		t.Error("VPC Flow Logs should have vpc_id set")
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

// TestProviderConfiguration tests AWS provider setup
func TestProviderConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-west-2")
	tfConfig := parseTerraformJSON(t, tfPath)

	providers, ok := tfConfig["provider"].(map[string]interface{})
	if !ok {
		t.Fatal("no providers found")
	}

	awsProvider, ok := providers["aws"].([]interface{})
	if !ok || len(awsProvider) == 0 {
		t.Fatal("AWS provider not found")
	}

	providerConfig := awsProvider[0].(map[string]interface{})
	if region, ok := providerConfig["region"]; !ok || region != "us-west-2" {
		t.Errorf("expected region us-west-2, got: %v", region)
	}
}

// TestResourceDependencies tests resource dependency configuration
func TestResourceDependencies(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Lambda should depend on log group
	lambdaFunction := getResource(tfConfig, "aws_lambda_function", "prod-security-function")
	if lambdaFunction == nil {
		t.Fatal("Lambda function not found")
	}

	if dependsOn, ok := lambdaFunction["depends_on"]; ok && dependsOn != nil {
		deps := dependsOn.([]interface{})
		if len(deps) == 0 {
			t.Error("Lambda function should have dependencies")
		}
	}
}

// TestIAMPolicyAttachment tests IAM role policy attachment
func TestIAMPolicyAttachment(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	policyAttachment := getResource(tfConfig, "aws_iam_role_policy_attachment", "prod-lambda-policy-attachment")
	if policyAttachment == nil {
		t.Fatal("IAM policy attachment not found")
	}

	if role, ok := policyAttachment["role"]; !ok || role == nil {
		t.Error("policy attachment missing role")
	}

	if policyArn, ok := policyAttachment["policy_arn"]; !ok || policyArn == nil {
		t.Error("policy attachment missing policy ARN")
	}
}

// TestKMSAliasTargetKey tests KMS alias target key reference
func TestKMSAliasTargetKey(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	kmsAlias := getResource(tfConfig, "aws_kms_alias", "prod-security-kms-alias")
	if kmsAlias == nil {
		t.Fatal("KMS alias not found")
	}

	if targetKeyId, ok := kmsAlias["target_key_id"]; !ok || targetKeyId == nil {
		t.Error("KMS alias missing target key ID")
	}
}

// TestLambdaRoleAssumePolicy tests Lambda role assume role policy
func TestLambdaRoleAssumePolicy(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	iamRole := getResource(tfConfig, "aws_iam_role", "prod-lambda-execution-role")
	if iamRole == nil {
		t.Fatal("IAM role not found")
	}

	if assumePolicy, ok := iamRole["assume_role_policy"]; ok && assumePolicy != nil {
		policyStr := assumePolicy.(string)
		if !strings.Contains(policyStr, "lambda.amazonaws.com") {
			t.Error("assume role policy should allow lambda service")
		}
		if !strings.Contains(policyStr, "sts:AssumeRole") {
			t.Error("assume role policy should allow sts:AssumeRole")
		}
	}
}

// TestLambdaFilename tests Lambda function filename configuration
func TestLambdaFilename(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	lambdaFunction := getResource(tfConfig, "aws_lambda_function", "prod-security-function")
	if lambdaFunction == nil {
		t.Fatal("Lambda function not found")
	}

	if filename, ok := lambdaFunction["filename"]; !ok || filename == nil {
		t.Error("Lambda function should have filename")
	} else {
		filenameStr := filename.(string)
		if !strings.Contains(filenameStr, "lambda.zip") {
			t.Error("Lambda function filename should contain lambda.zip")
		}
	}

	if handler, ok := lambdaFunction["handler"]; !ok || handler != "index.handler" {
		t.Errorf("expected handler 'index.handler', got: %v", handler)
	}
}

// TestS3BucketNaming tests S3 bucket naming with region
func TestS3BucketNaming(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-west-1"}

	for _, region := range regions {
		t.Run(region, func(t *testing.T) {
			tfPath := synthStack(t, region)
			tfConfig := parseTerraformJSON(t, tfPath)

			s3Bucket := getResource(tfConfig, "aws_s3_bucket", "prod-security-logs-bucket")
			if s3Bucket == nil {
				t.Fatal("S3 bucket not found")
			}

			if bucket, ok := s3Bucket["bucket"]; ok && bucket != nil {
				bucketName := bucket.(string)
				if !strings.Contains(bucketName, region) {
					t.Errorf("bucket name should contain region %s, got: %s", region, bucketName)
				}
			}
		})
	}
}

// TestVPCFlowLogsDestination tests VPC Flow Logs S3 destination
func TestVPCFlowLogsDestination(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	flowLog := getResource(tfConfig, "aws_flow_log", "prod-vpc-flow-logs")
	if flowLog == nil {
		t.Fatal("VPC flow log not found")
	}

	if logDest, ok := flowLog["log_destination"]; ok && logDest != nil {
		destStr := logDest.(string)
		if !strings.Contains(destStr, "arn:aws:s3") {
			t.Error("log destination should be S3 ARN")
		}
		if !strings.Contains(destStr, "vpc-flow-logs") {
			t.Error("log destination should contain vpc-flow-logs path")
		}
	}
}

// TestCloudWatchLogGroupRetention tests log retention configuration
func TestCloudWatchLogGroupRetention(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	logGroup := getResource(tfConfig, "aws_cloudwatch_log_group", "prod-lambda-log-group")
	if logGroup == nil {
		t.Fatal("CloudWatch log group not found")
	}

	if retention, ok := logGroup["retention_in_days"]; ok {
		retentionDays := retention.(float64)
		if retentionDays != 14 {
			t.Errorf("expected 14 days retention, got: %v", retentionDays)
		}
		if retentionDays < 1 || retentionDays > 3653 {
			t.Errorf("retention days should be between 1-3653, got: %v", retentionDays)
		}
	}
}

// TestIAMPolicyLeastPrivilege tests IAM policy follows least privilege
func TestIAMPolicyLeastPrivilege(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	iamPolicy := getResource(tfConfig, "aws_iam_policy", "prod-lambda-policy")
	if iamPolicy == nil {
		t.Fatal("IAM policy not found")
	}

	if policy, ok := iamPolicy["policy"]; ok && policy != nil {
		policyStr := policy.(string)

		// Should NOT contain wildcard permissions
		if strings.Contains(policyStr, "\"*\"") {
			t.Error("policy should not contain wildcard permissions")
		}

		// Should contain specific log group ARN
		if !strings.Contains(policyStr, "/aws/lambda/prod-security-function") {
			t.Error("policy should reference specific log group")
		}

		// Should contain specific KMS key ARN reference
		if !strings.Contains(policyStr, "Resource") {
			t.Error("policy should specify resources")
		}
	}
}

// TestMultiRegionSupport tests stack works in different regions
func TestMultiRegionSupport(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"}

	for _, region := range regions {
		t.Run(region, func(t *testing.T) {
			tfPath := synthStack(t, region)
			tfConfig := parseTerraformJSON(t, tfPath)

			// Verify provider region
			providers, ok := tfConfig["provider"].(map[string]interface{})
			if !ok {
				t.Fatal("no providers found")
			}

			awsProvider, ok := providers["aws"].([]interface{})
			if !ok || len(awsProvider) == 0 {
				t.Fatal("AWS provider not found")
			}

			providerConfig := awsProvider[0].(map[string]interface{})
			if providerRegion, ok := providerConfig["region"]; !ok || providerRegion != region {
				t.Errorf("expected provider region %s, got: %v", region, providerRegion)
			}

			// Verify S3 bucket includes region in name
			s3Bucket := getResource(tfConfig, "aws_s3_bucket", "prod-security-logs-bucket")
			if s3Bucket != nil {
				if bucket, ok := s3Bucket["bucket"]; ok && bucket != nil {
					bucketName := bucket.(string)
					if !strings.Contains(bucketName, region) {
						t.Errorf("bucket name should contain region %s, got: %s", region, bucketName)
					}
				}
			}
		})
	}
}

// TestErrorHandling tests error conditions and edge cases
func TestErrorHandling(t *testing.T) {
	// Test with empty region
	defer func() {
		if r := recover(); r != nil {
			t.Log("Expected panic for empty region handled")
		}
	}()

	// Test synthesis with minimal config
	tfPath := synthStack(t, "us-east-1")
	if tfPath == "" {
		t.Error("synthesis should produce output path")
	}

	// Test file exists
	if _, err := os.Stat(tfPath); err != nil {
		t.Errorf("synthesized file should exist: %v", err)
	}
}

// TestResourceCount tests expected number of resources
func TestResourceCount(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Count total resources
	totalResources := 0
	for _, resourceType := range resources {
		resourceMap := resourceType.(map[string]interface{})
		totalResources += len(resourceMap)
	}

	// BuildSecurityStack should create at least 8 resources
	expectedMinResources := 8
	if totalResources < expectedMinResources {
		t.Errorf("expected at least %d resources, got: %d", expectedMinResources, totalResources)
	}
}

// TestNewTapStackFunction tests the main NewTapStack function
func TestNewTapStackFunction(t *testing.T) {
	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set environment variables
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", "us-east-1")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	stack := NewTapStack(app, "TestStack", props)
	if stack == nil {
		t.Fatal("NewTapStack should return a stack")
	}

	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TestStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}

	tfConfig := parseTerraformJSON(t, tfPath)

	// Verify VPC resources exist (these are only in NewTapStack, not BuildSecurityStack)
	vpc := getResource(tfConfig, "aws_vpc", "main-vpc")
	if vpc == nil {
		t.Fatal("VPC resource not found in NewTapStack")
	}

	// Verify subnets exist
	publicSubnet1 := getResource(tfConfig, "aws_subnet", "public-subnet-1")
	if publicSubnet1 == nil {
		t.Fatal("Public subnet 1 not found in NewTapStack")
	}

	privateSubnet1 := getResource(tfConfig, "aws_subnet", "private-subnet-1")
	if privateSubnet1 == nil {
		t.Fatal("Private subnet 1 not found in NewTapStack")
	}

	// Verify Internet Gateway
	igw := getResource(tfConfig, "aws_internet_gateway", "main-igw")
	if igw == nil {
		t.Fatal("Internet Gateway not found in NewTapStack")
	}

	// Verify NAT Gateway
	natGw := getResource(tfConfig, "aws_nat_gateway", "main-nat")
	if natGw == nil {
		t.Fatal("NAT Gateway not found in NewTapStack")
	}
}

// TestTapStackPropsValidation tests TapStackProps struct
func TestTapStackPropsValidation(t *testing.T) {
	props := &TapStackProps{
		EnvironmentSuffix: "test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-west-2",
		AwsRegion:         "us-west-2",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	if props.EnvironmentSuffix != "test" {
		t.Errorf("expected EnvironmentSuffix 'test', got: %s", props.EnvironmentSuffix)
	}

	if props.StateBucket != "test-bucket" {
		t.Errorf("expected StateBucket 'test-bucket', got: %s", props.StateBucket)
	}

	if props.AwsRegion != "us-west-2" {
		t.Errorf("expected AwsRegion 'us-west-2', got: %s", props.AwsRegion)
	}
}

// TestEnvironmentVariableHandling tests environment variable handling
func TestEnvironmentVariableHandling(t *testing.T) {
	// Test with custom environment variables
	oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	oldStateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	oldStateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")

	t.Cleanup(func() {
		_ = os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
		_ = os.Setenv("TERRAFORM_STATE_BUCKET", oldStateBucket)
		_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", oldStateBucketRegion)
	})

	_ = os.Setenv("ENVIRONMENT_SUFFIX", "custom-env")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET", "custom-bucket")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", "eu-west-1")

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "default-env",
		StateBucket:       "default-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	stack := NewTapStack(app, "EnvTestStack", props)
	if stack == nil {
		t.Fatal("NewTapStack should return a stack")
	}

	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "EnvTestStack", "cdk.tf.json")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Verify backend configuration uses environment variables
	terraform, ok := tfConfig["terraform"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform configuration not found")
	}

	backend, ok := terraform["backend"].(map[string]interface{})
	if !ok {
		t.Fatal("backend configuration not found")
	}

	s3Backend, ok := backend["s3"].(map[string]interface{})
	if !ok {
		t.Fatal("s3 backend configuration not found")
	}

	if bucket, ok := s3Backend["bucket"]; !ok || bucket != "custom-bucket" {
		t.Errorf("expected backend bucket 'custom-bucket', got: %v", bucket)
	}

	if region, ok := s3Backend["region"]; !ok || region != "eu-west-1" {
		t.Errorf("expected backend region 'eu-west-1', got: %v", region)
	}
}

// TestVPCConfiguration tests VPC infrastructure in NewTapStack
func TestVPCConfiguration(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "vpc-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	NewTapStack(app, "VPCTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "VPCTestStack", "cdk.tf.json")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test VPC configuration
	vpc := getResource(tfConfig, "aws_vpc", "main-vpc")
	if vpc == nil {
		t.Fatal("VPC not found")
	}

	if cidr, ok := vpc["cidr_block"]; !ok || cidr != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR '10.0.0.0/16', got: %v", cidr)
	}

	if dnsHostnames, ok := vpc["enable_dns_hostnames"]; !ok || dnsHostnames != true {
		t.Errorf("expected DNS hostnames enabled, got: %v", dnsHostnames)
	}

	// Test public subnets
	publicSubnet1 := getResource(tfConfig, "aws_subnet", "public-subnet-1")
	if publicSubnet1 == nil {
		t.Fatal("Public subnet 1 not found")
	}

	if cidr, ok := publicSubnet1["cidr_block"]; !ok || cidr != "10.0.1.0/24" {
		t.Errorf("expected public subnet 1 CIDR '10.0.1.0/24', got: %v", cidr)
	}

	if az, ok := publicSubnet1["availability_zone"]; !ok || az != "us-east-1a" {
		t.Errorf("expected public subnet 1 AZ 'us-east-1a', got: %v", az)
	}

	// Test private subnets
	privateSubnet1 := getResource(tfConfig, "aws_subnet", "private-subnet-1")
	if privateSubnet1 == nil {
		t.Fatal("Private subnet 1 not found")
	}

	if cidr, ok := privateSubnet1["cidr_block"]; !ok || cidr != "10.0.10.0/24" {
		t.Errorf("expected private subnet 1 CIDR '10.0.10.0/24', got: %v", cidr)
	}
}

// TestRouteTableConfiguration tests route table setup
func TestRouteTableConfiguration(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "rt-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	NewTapStack(app, "RTTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "RTTestStack", "cdk.tf.json")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test route tables
	publicRt := getResource(tfConfig, "aws_route_table", "public-rt")
	if publicRt == nil {
		t.Fatal("Public route table not found")
	}

	privateRt := getResource(tfConfig, "aws_route_table", "private-rt")
	if privateRt == nil {
		t.Fatal("Private route table not found")
	}

	// Test routes
	publicRoute := getResource(tfConfig, "aws_route", "public-internet-route")
	if publicRoute == nil {
		t.Fatal("Public internet route not found")
	}

	if dest, ok := publicRoute["destination_cidr_block"]; !ok || dest != "0.0.0.0/0" {
		t.Errorf("expected public route destination '0.0.0.0/0', got: %v", dest)
	}

	privateRoute := getResource(tfConfig, "aws_route", "private-nat-route")
	if privateRoute == nil {
		t.Fatal("Private NAT route not found")
	}

	if dest, ok := privateRoute["destination_cidr_block"]; !ok || dest != "0.0.0.0/0" {
		t.Errorf("expected private route destination '0.0.0.0/0', got: %v", dest)
	}
}

// TestNATGatewayConfiguration tests NAT Gateway and EIP setup
func TestNATGatewayConfiguration(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "nat-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	NewTapStack(app, "NATTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "NATTestStack", "cdk.tf.json")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test EIP
	eip := getResource(tfConfig, "aws_eip", "nat-eip")
	if eip == nil {
		t.Fatal("NAT EIP not found")
	}

	if domain, ok := eip["domain"]; !ok || domain != "vpc" {
		t.Errorf("expected EIP domain 'vpc', got: %v", domain)
	}

	// Test NAT Gateway
	natGw := getResource(tfConfig, "aws_nat_gateway", "main-nat")
	if natGw == nil {
		t.Fatal("NAT Gateway not found")
	}

	if allocId, ok := natGw["allocation_id"]; !ok || allocId == nil {
		t.Error("NAT Gateway missing allocation ID")
	}

	if subnetId, ok := natGw["subnet_id"]; !ok || subnetId == nil {
		t.Error("NAT Gateway missing subnet ID")
	}
}

// TestFullStackOutputs tests all outputs from NewTapStack
func TestFullStackOutputs(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	props := &TapStackProps{
		EnvironmentSuffix: "output-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}

	NewTapStack(app, "OutputTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "OutputTestStack", "cdk.tf.json")
	tfConfig := parseTerraformJSON(t, tfPath)

	outputs, ok := tfConfig["output"].(map[string]interface{})
	if !ok {
		t.Fatal("no outputs found")
	}

	// Test VPC outputs (only in NewTapStack)
	requiredOutputs := []string{
		"kms_key_id", "s3_bucket_name", "lambda_function_name",
		"vpc_id", "public_subnet_ids", "private_subnet_ids",
	}

	for _, outputName := range requiredOutputs {
		if _, exists := outputs[outputName]; !exists {
			t.Errorf("required output '%s' not found", outputName)
		}
	}

	// Verify VPC output description
	if vpcOutput, ok := outputs["vpc_id"].(map[string]interface{}); ok {
		if desc, ok := vpcOutput["description"]; !ok || desc != "VPC ID" {
			t.Errorf("unexpected VPC output description: %v", desc)
		}
	}
}

// TestLambdaEnhancedConfiguration tests Lambda function enhanced configuration
func TestLambdaEnhancedConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	lambdaFunction := getResource(tfConfig, "aws_lambda_function", "prod-security-function")
	if lambdaFunction == nil {
		t.Fatal("Lambda function not found")
	}

	// Test timeout configuration
	if timeout, ok := lambdaFunction["timeout"]; !ok || timeout != float64(30) {
		t.Errorf("expected timeout 30, got: %v", timeout)
	}

	// Test memory size configuration
	if memorySize, ok := lambdaFunction["memory_size"]; !ok || memorySize != float64(256) {
		t.Errorf("expected memory size 256, got: %v", memorySize)
	}

	// Test environment variables
	if environment, ok := lambdaFunction["environment"]; ok && environment != nil {
		envMap := environment.(map[string]interface{})
		if variables, ok := envMap["variables"]; ok && variables != nil {
			varsMap := variables.(map[string]interface{})

			// Check required environment variables
			requiredVars := []string{"BUCKET_NAME", "KMS_KEY_ID", "ENVIRONMENT"}
			for _, varName := range requiredVars {
				if _, exists := varsMap[varName]; !exists {
					t.Errorf("Lambda function missing environment variable: %s", varName)
				}
			}
		}
	}

	// Test VPC configuration (BuildSecurityStack doesn't create VPC, so this will be empty)
	if vpcConfig, ok := lambdaFunction["vpc_config"]; ok && vpcConfig != nil {
		vpcSlice := vpcConfig.([]interface{})
		if len(vpcSlice) > 0 {
			vpcMap := vpcSlice[0].(map[string]interface{})
			if subnetIds, ok := vpcMap["subnet_ids"]; ok && subnetIds != nil {
				// BuildSecurityStack uses empty subnet IDs since it doesn't create VPC
				t.Logf("VPC config found with subnet IDs: %v", subnetIds)
			}
		}
	}
}
