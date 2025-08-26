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

	tapstack "github.com/TuringGpt/iac-test-automations/lib"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set environment variables for testing
	old := os.Getenv("AWS_REGION")
	oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	oldStateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	oldStateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")

	t.Cleanup(func() {
		_ = os.Setenv("AWS_REGION", old)
		_ = os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
		_ = os.Setenv("TERRAFORM_STATE_BUCKET", oldStateBucket)
		_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", oldStateBucketRegion)
	})

	_ = os.Setenv("AWS_REGION", region)
	_ = os.Setenv("ENVIRONMENT_SUFFIX", "test")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET", "test-terraform-state-bucket")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	config := &tapstack.TapStackConfig{
		Region:            region,
		Environment:       "production",
		AppName:           "test-app",
		EnvironmentSuffix: "test",
		StateBucket:       "default-terraform-state-bucket",
		StateBucketRegion: region,
	}

	tapstack.NewTapStack(app, "TapStackTest", config)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStackTest", "cdk.tf.json")
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

// TestTapStackSynthesis tests that the TapStack synthesizes without errors
func TestTapStackSynthesis(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Verify basic structure
	if tfConfig == nil {
		t.Fatal("terraform config is nil")
	}

	if _, ok := tfConfig["resource"]; !ok {
		t.Fatal("no resources found in terraform config")
	}

	t.Logf("Terraform JSON synthesized successfully to: %s", tfPath)
}

// TestVPCConfiguration tests VPC infrastructure creation
func TestVPCConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check VPC exists
	vpc := getResource(tfConfig, "aws_vpc", "vpc")
	if vpc == nil {
		t.Fatal("VPC resource not found")
	}

	// Verify VPC CIDR
	if cidr, ok := vpc["cidr_block"]; !ok || cidr != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR '10.0.0.0/16', got: %v", cidr)
	}

	// Verify DNS hostnames enabled
	if dnsHostnames, ok := vpc["enable_dns_hostnames"]; !ok || dnsHostnames != true {
		t.Errorf("expected DNS hostnames enabled, got: %v", dnsHostnames)
	}

	// Check VPC naming with EnvPrefix
	if tags, ok := vpc["tags"].(map[string]interface{}); ok {
		if name, ok := tags["Name"]; !ok || !strings.Contains(name.(string), "test-xk9f-vpc") {
			t.Errorf("expected VPC name to contain 'test-xk9f-vpc', got: %v", name)
		}
	}
}

// TestSubnetConfiguration tests subnet creation
func TestSubnetConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test public subnet
	publicSubnet := getResource(tfConfig, "aws_subnet", "public-subnet-0")
	if publicSubnet == nil {
		t.Fatal("Public subnet not found")
	}

	if cidr, ok := publicSubnet["cidr_block"]; !ok || cidr != "10.0.1.0/24" {
		t.Errorf("expected public subnet CIDR '10.0.1.0/24', got: %v", cidr)
	}

	if az, ok := publicSubnet["availability_zone"]; !ok || az != "us-east-1a" {
		t.Errorf("expected public subnet AZ 'us-east-1a', got: %v", az)
	}

	// Test private subnet
	privateSubnet := getResource(tfConfig, "aws_subnet", "private-subnet-0")
	if privateSubnet == nil {
		t.Fatal("Private subnet not found")
	}

	if cidr, ok := privateSubnet["cidr_block"]; !ok || cidr != "10.0.100.0/24" {
		t.Errorf("expected private subnet CIDR '10.0.100.0/24', got: %v", cidr)
	}
}

// TestInternetGatewayConfiguration tests Internet Gateway setup
func TestInternetGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check Internet Gateway exists
	igw := getResource(tfConfig, "aws_internet_gateway", "igw")
	if igw == nil {
		t.Fatal("Internet Gateway resource not found")
	}

	// Verify VPC attachment
	if vpcId, ok := igw["vpc_id"]; !ok || vpcId == nil {
		t.Error("Internet Gateway missing VPC attachment")
	}

	// Check naming
	if tags, ok := igw["tags"].(map[string]interface{}); ok {
		if name, ok := tags["Name"]; !ok || !strings.Contains(name.(string), "test-xk9f-igw") {
			t.Errorf("expected IGW name to contain 'test-xk9f-igw', got: %v", name)
		}
	}
}

// TestNATGatewayConfiguration tests NAT Gateway and EIP setup
func TestNATGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check EIP exists
	eip := getResource(tfConfig, "aws_eip", "nat-eip")
	if eip == nil {
		t.Fatal("NAT EIP resource not found")
	}

	if domain, ok := eip["domain"]; !ok || domain != "vpc" {
		t.Errorf("expected EIP domain 'vpc', got: %v", domain)
	}

	// Check NAT Gateway exists
	natGw := getResource(tfConfig, "aws_nat_gateway", "nat-gw")
	if natGw == nil {
		t.Fatal("NAT Gateway resource not found")
	}

	if allocId, ok := natGw["allocation_id"]; !ok || allocId == nil {
		t.Error("NAT Gateway missing allocation ID")
	}

	if subnetId, ok := natGw["subnet_id"]; !ok || subnetId == nil {
		t.Error("NAT Gateway missing subnet ID")
	}
}

// TestRouteTableConfiguration tests route table setup
func TestRouteTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check public route table
	publicRt := getResource(tfConfig, "aws_route_table", "public-rt")
	if publicRt == nil {
		t.Fatal("Public route table not found")
	}

	// Check private route table
	privateRt := getResource(tfConfig, "aws_route_table", "private-rt")
	if privateRt == nil {
		t.Fatal("Private route table not found")
	}

	// Check route table associations
	publicRta := getResource(tfConfig, "aws_route_table_association", "public-rta-0")
	if publicRta == nil {
		t.Fatal("Public route table association not found")
	}

	privateRta := getResource(tfConfig, "aws_route_table_association", "private-rta-0")
	if privateRta == nil {
		t.Fatal("Private route table association not found")
	}
}

// TestLambdaExecutionRole tests IAM role for Lambda execution
func TestLambdaExecutionRole(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check IAM role exists
	iamRole := getResource(tfConfig, "aws_iam_role", "lambda-execution-role")
	if iamRole == nil {
		t.Fatal("Lambda execution role not found")
	}

	// Verify role name uses EnvPrefix
	if name, ok := iamRole["name"]; !ok || !strings.Contains(name.(string), "test-xk9f-lambda-execution-role") {
		t.Errorf("expected role name to contain 'test-xk9f-lambda-execution-role', got: %v", name)
	}

	// Check assume role policy
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

// TestSecurityGroupConfiguration tests Lambda security group
func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check security group exists
	sg := getResource(tfConfig, "aws_security_group", "lambda-sg")
	if sg == nil {
		t.Fatal("Lambda security group not found")
	}

	// Verify description
	if desc, ok := sg["description"]; !ok || desc != "Security group for Lambda functions" {
		t.Errorf("unexpected security group description: %v", desc)
	}

	// Check egress rules
	httpsEgress := getResource(tfConfig, "aws_security_group_rule", "lambda-egress-https")
	if httpsEgress == nil {
		t.Fatal("HTTPS egress rule not found")
	}

	httpEgress := getResource(tfConfig, "aws_security_group_rule", "lambda-egress-http")
	if httpEgress == nil {
		t.Fatal("HTTP egress rule not found")
	}
}

// TestS3BucketConfiguration tests S3 bucket for Lambda deployment
func TestS3BucketConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check S3 bucket exists
	s3Bucket := getResource(tfConfig, "aws_s3_bucket", "lambda-deployment-bucket")
	if s3Bucket == nil {
		t.Fatal("S3 bucket resource not found")
	}

	// Verify bucket naming with EnvPrefix
	if bucket, ok := s3Bucket["bucket"]; !ok || !strings.Contains(bucket.(string), "test-xk9f-s3-lambda-deploy-production") {
		t.Errorf("expected bucket name to contain 'test-xk9f-s3-lambda-deploy-production', got: %v", bucket)
	}

	// Check bucket versioning
	bucketVersioning := getResource(tfConfig, "aws_s3_bucket_versioning", "lambda-bucket-versioning")
	if bucketVersioning == nil {
		t.Fatal("S3 bucket versioning not found")
	}

	// Check bucket encryption
	bucketEncryption := getResource(tfConfig, "aws_s3_bucket_server_side_encryption_configuration", "lambda-bucket-encryption")
	if bucketEncryption == nil {
		t.Fatal("S3 bucket encryption not found")
	}

	// Check bucket policy
	bucketPolicy := getResource(tfConfig, "aws_s3_bucket_policy", "lambda-bucket-policy")
	if bucketPolicy == nil {
		t.Fatal("S3 bucket policy not found")
	}
}

// TestDynamoDBTableConfiguration tests DynamoDB table creation
func TestDynamoDBTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check DynamoDB table exists
	dynamoTable := getResource(tfConfig, "aws_dynamodb_table", "sessions-table")
	if dynamoTable == nil {
		t.Fatal("DynamoDB table resource not found")
	}

	// Verify table name uses EnvPrefix
	if name, ok := dynamoTable["name"]; !ok || !strings.Contains(name.(string), "test-xk9f-dynamodb-sessions-production") {
		t.Errorf("expected table name to contain 'test-xk9f-dynamodb-sessions-production', got: %v", name)
	}

	// Verify billing mode
	if billingMode, ok := dynamoTable["billing_mode"]; !ok || billingMode != "PAY_PER_REQUEST" {
		t.Errorf("expected billing mode 'PAY_PER_REQUEST', got: %v", billingMode)
	}

	// Verify hash key
	if hashKey, ok := dynamoTable["hash_key"]; !ok || hashKey != "session_id" {
		t.Errorf("expected hash key 'session_id', got: %v", hashKey)
	}

	// Check attributes
	if attributes, ok := dynamoTable["attribute"]; ok && attributes != nil {
		attrSlice := attributes.([]interface{})
		if len(attrSlice) == 0 {
			t.Error("DynamoDB table should have attributes")
		}
	}
}

// TestSSMParameterConfiguration tests SSM parameter creation
func TestSSMParameterConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check SSM parameter exists
	ssmParam := getResource(tfConfig, "aws_ssm_parameter", "api-key-param")
	if ssmParam == nil {
		t.Fatal("SSM parameter resource not found")
	}

	// Verify parameter name uses EnvPrefix
	if name, ok := ssmParam["name"]; !ok || !strings.Contains(name.(string), "/test-xk9f/api-key/production") {
		t.Errorf("expected parameter name to contain '/test-xk9f/api-key/production', got: %v", name)
	}

	// Verify parameter type
	if paramType, ok := ssmParam["type"]; !ok || paramType != "SecureString" {
		t.Errorf("expected parameter type 'SecureString', got: %v", paramType)
	}

	// Verify description
	if desc, ok := ssmParam["description"]; !ok || desc != "API key for external services" {
		t.Errorf("unexpected parameter description: %v", desc)
	}
}

// TestLambdaFunctionConfiguration tests Lambda function creation
func TestLambdaFunctionConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test all four Lambda functions
	functionNames := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	for _, funcName := range functionNames {
		t.Run(funcName, func(t *testing.T) {
			// Check Lambda function exists
			lambdaFunc := getResource(tfConfig, "aws_lambda_function", funcName)
			if lambdaFunc == nil {
				t.Fatalf("Lambda function %s not found", funcName)
			}

			// Verify function name uses EnvPrefix
			expectedFuncName := "test-xk9f-lambda-" + funcName + "-production"
			if name, ok := lambdaFunc["function_name"]; !ok || !strings.Contains(name.(string), expectedFuncName) {
				t.Errorf("expected function name to contain '%s', got: %v", expectedFuncName, name)
			}

			// Verify runtime
			if runtime, ok := lambdaFunc["runtime"]; !ok || runtime != "nodejs20.x" {
				t.Errorf("expected runtime 'nodejs20.x', got: %v", runtime)
			}

			// Verify handler
			if handler, ok := lambdaFunc["handler"]; !ok || handler != "index.handler" {
				t.Errorf("expected handler 'index.handler', got: %v", handler)
			}

			// Verify timeout
			if timeout, ok := lambdaFunc["timeout"]; !ok || timeout != float64(30) {
				t.Errorf("expected timeout 30, got: %v", timeout)
			}

			// Check CloudWatch log group exists
			logGroup := getResource(tfConfig, "aws_cloudwatch_log_group", funcName+"-logs")
			if logGroup == nil {
				t.Fatalf("CloudWatch log group for %s not found", funcName)
			}

			// Verify log group name
			expectedLogName := "/aws/lambda/test-xk9f-lambda-" + funcName + "-production"
			if name, ok := logGroup["name"]; !ok || name != expectedLogName {
				t.Errorf("expected log group name '%s', got: %v", expectedLogName, name)
			}

			// Verify log retention
			if retention, ok := logGroup["retention_in_days"]; !ok || retention != float64(30) {
				t.Errorf("expected log retention 30 days, got: %v", retention)
			}
		})
	}
}

// TestAPIGatewayConfiguration tests API Gateway setup
func TestAPIGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check API Gateway exists
	apiGw := getResource(tfConfig, "aws_api_gateway_rest_api", "api-gateway")
	if apiGw == nil {
		t.Fatal("API Gateway resource not found")
	}

	// Verify API name uses EnvPrefix
	if name, ok := apiGw["name"]; !ok || !strings.Contains(name.(string), "test-xk9f-apigateway-api-production") {
		t.Errorf("expected API name to contain 'test-xk9f-apigateway-api-production', got: %v", name)
	}

	// Check API resource
	apiResource := getResource(tfConfig, "aws_api_gateway_resource", "api-resource")
	if apiResource == nil {
		t.Fatal("API Gateway resource not found")
	}

	if pathPart, ok := apiResource["path_part"]; !ok || pathPart != "tasks" {
		t.Errorf("expected path part 'tasks', got: %v", pathPart)
	}

	// Check HTTP methods
	methods := []string{"GET", "POST", "PUT", "DELETE"}
	for _, method := range methods {
		methodResource := getResource(tfConfig, "aws_api_gateway_method", "method-"+method)
		if methodResource == nil {
			t.Errorf("API Gateway method %s not found", method)
			continue
		}

		if httpMethod, ok := methodResource["http_method"]; !ok || httpMethod != method {
			t.Errorf("expected HTTP method '%s', got: %v", method, httpMethod)
		}

		// Check integration
		integration := getResource(tfConfig, "aws_api_gateway_integration", "integration-"+method)
		if integration == nil {
			t.Errorf("API Gateway integration for %s not found", method)
		}
	}
}

// TestVPCEndpointsConfiguration tests VPC endpoint creation
func TestVPCEndpointsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check DynamoDB VPC endpoint
	dynamoEndpoint := getResource(tfConfig, "aws_vpc_endpoint", "dynamodb-endpoint")
	if dynamoEndpoint == nil {
		t.Fatal("DynamoDB VPC endpoint not found")
	}

	if serviceType, ok := dynamoEndpoint["vpc_endpoint_type"]; !ok || serviceType != "Gateway" {
		t.Errorf("expected DynamoDB endpoint type 'Gateway', got: %v", serviceType)
	}

	// Check S3 VPC endpoint
	s3Endpoint := getResource(tfConfig, "aws_vpc_endpoint", "s3-endpoint")
	if s3Endpoint == nil {
		t.Fatal("S3 VPC endpoint not found")
	}

	if serviceType, ok := s3Endpoint["vpc_endpoint_type"]; !ok || serviceType != "Gateway" {
		t.Errorf("expected S3 endpoint type 'Gateway', got: %v", serviceType)
	}
}

// TestBackendConfiguration tests S3 backend configuration
func TestBackendConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check terraform backend configuration
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

	if bucket, ok := s3Backend["bucket"]; !ok || bucket != "test-terraform-state-bucket" {
		t.Errorf("expected backend bucket 'test-terraform-state-bucket', got: %v", bucket)
	}

	if region, ok := s3Backend["region"]; !ok || region != "us-east-1" {
		t.Errorf("expected backend region 'us-east-1', got: %v", region)
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

	// Check default tags
	if defaultTags, ok := providerConfig["default_tags"]; ok && defaultTags != nil {
		defaultTagsSlice := defaultTags.([]interface{})
		if len(defaultTagsSlice) > 0 {
			tagsConfig := defaultTagsSlice[0].(map[string]interface{})
			if tags, ok := tagsConfig["tags"]; ok && tags != nil {
				tagsMap := tags.(map[string]interface{})
				requiredTags := []string{"Environment", "Application", "ManagedBy"}
				for _, tag := range requiredTags {
					if _, exists := tagsMap[tag]; !exists {
						t.Errorf("provider missing required default tag: %s", tag)
					}
				}
			}
		}
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

	// TapStack should create at least 30 resources
	expectedMinResources := 30
	if totalResources < expectedMinResources {
		t.Errorf("expected at least %d resources, got: %d", expectedMinResources, totalResources)
	}

	t.Logf("Total resources created: %d", totalResources)
}

// TestOutputsConfiguration tests that required outputs are defined
func TestOutputsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	outputs, ok := tfConfig["output"].(map[string]interface{})
	if !ok {
		t.Fatal("no outputs found in terraform config")
	}

	requiredOutputs := []string{"vpc-id"}
	for _, outputName := range requiredOutputs {
		if _, exists := outputs[outputName]; !exists {
			t.Errorf("required output '%s' not found", outputName)
		}
	}

	// Check conditional outputs if API Gateway exists
	if _, exists := outputs["api-gateway-url"]; exists {
		t.Log("API Gateway URL output found")
	}

	if _, exists := outputs["dynamodb-table-name"]; exists {
		t.Log("DynamoDB table name output found")
	}

	if _, exists := outputs["s3-bucket-name"]; exists {
		t.Log("S3 bucket name output found")
	}
}

// TestMultiRegionSupport tests stack works in different regions
func TestMultiRegionSupport(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-west-1"}

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

			// Verify resources are created
			resources, ok := tfConfig["resource"].(map[string]interface{})
			if !ok {
				t.Fatal("no resources found")
			}

			if len(resources) == 0 {
				t.Errorf("expected resources to be created for region %s", region)
			}

			t.Logf("Successfully synthesized stack for region: %s", region)
		})
	}
}

// TestEnvironmentPrefixUsage tests that EnvPrefix is correctly used in resource naming
func TestEnvironmentPrefixUsage(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Test resources that should use the EnvPrefix pattern (test-xk9f)
	testCases := []struct {
		resourceType string
		resourceName string
		expectedName string
		nameField    string
	}{
		{"aws_s3_bucket", "lambda-deployment-bucket", "test-xk9f-s3-lambda-deploy-production", "bucket"},
		{"aws_dynamodb_table", "sessions-table", "test-xk9f-dynamodb-sessions-production", "name"},
		{"aws_iam_role", "lambda-execution-role", "test-xk9f-lambda-execution-role", "name"},
		{"aws_api_gateway_rest_api", "api-gateway", "test-xk9f-apigateway-api-production", "name"},
		{"aws_lambda_function", "get-handler", "test-xk9f-lambda-get-handler-production", "function_name"},
	}

	for _, tc := range testCases {
		t.Run(tc.resourceType+"/"+tc.resourceName, func(t *testing.T) {
			resource := getResource(tfConfig, tc.resourceType, tc.resourceName)
			if resource == nil {
				t.Fatalf("resource %s/%s not found", tc.resourceType, tc.resourceName)
			}

			if name, ok := resource[tc.nameField]; !ok || !strings.Contains(name.(string), tc.expectedName) {
				t.Errorf("expected %s to contain '%s', got: %v", tc.nameField, tc.expectedName, name)
			}
		})
	}
}

// TestEnvironmentVariableHandling tests environment variable precedence
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

	config := &tapstack.TapStackConfig{
		Region:            "us-east-1",
		Environment:       "production",
		AppName:           "test-app",
		EnvironmentSuffix: "default-env",
		StateBucket:       "default-bucket",
		StateBucketRegion: "us-east-1",
	}

	tapstack.NewTapStack(app, "EnvTestStack", config)
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

	// Verify resources use custom-env prefix (custom-env-xk9f)
	s3Bucket := getResource(tfConfig, "aws_s3_bucket", "lambda-deployment-bucket")
	if s3Bucket != nil {
		if bucket, ok := s3Bucket["bucket"]; ok && bucket != nil {
			bucketName := bucket.(string)
			if !strings.Contains(bucketName, "custom-env-xk9f") {
				t.Errorf("expected bucket name to contain 'custom-env-xk9f', got: %s", bucketName)
			}
		}
	}
}
