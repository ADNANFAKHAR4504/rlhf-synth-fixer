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

	config := &TapStackConfig{
		Region:            region,
		Environment:       "production",
		AppName:           "test-app",
		EnvironmentSuffix: "test",
		StateBucket:       "default-terraform-state-bucket",
		StateBucketRegion: region,
	}

	NewTapStack(app, "TapStackTest", config)
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

	// Verify DNS support enabled
	if dnsSupport, ok := vpc["enable_dns_support"]; !ok || dnsSupport != true {
		t.Errorf("expected DNS support enabled, got: %v", dnsSupport)
	}
}

// TestSubnetConfiguration tests subnet creation across multiple AZs
func TestSubnetConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check public subnets
	publicSubnet0 := getResource(tfConfig, "aws_subnet", "public-subnet-0")
	if publicSubnet0 == nil {
		t.Fatal("Public subnet 0 not found")
	}

	if cidr, ok := publicSubnet0["cidr_block"]; !ok || cidr != "10.0.1.0/24" {
		t.Errorf("expected public subnet 0 CIDR '10.0.1.0/24', got: %v", cidr)
	}

	// Check private subnets
	privateSubnet0 := getResource(tfConfig, "aws_subnet", "private-subnet-0")
	if privateSubnet0 == nil {
		t.Fatal("Private subnet 0 not found")
	}

	if cidr, ok := privateSubnet0["cidr_block"]; !ok || cidr != "10.0.100.0/24" {
		t.Errorf("expected private subnet 0 CIDR '10.0.100.0/24', got: %v", cidr)
	}
}

// TestInternetGatewayConfiguration tests Internet Gateway creation
func TestInternetGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	igw := getResource(tfConfig, "aws_internet_gateway", "igw")
	if igw == nil {
		t.Fatal("Internet Gateway not found")
	}

	// Verify IGW is attached to VPC
	if vpcId, ok := igw["vpc_id"]; !ok || vpcId == nil {
		t.Error("Internet Gateway should be attached to VPC")
	}
}

// TestNATGatewayConfiguration tests NAT Gateway creation
func TestNATGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	natGw := getResource(tfConfig, "aws_nat_gateway", "nat-gw")
	if natGw == nil {
		t.Fatal("NAT Gateway not found")
	}

	// Verify NAT Gateway has allocation ID and subnet ID
	if allocId, ok := natGw["allocation_id"]; !ok || allocId == nil {
		t.Error("NAT Gateway should have allocation ID")
	}

	if subnetId, ok := natGw["subnet_id"]; !ok || subnetId == nil {
		t.Error("NAT Gateway should have subnet ID")
	}
}

// TestRouteTableConfiguration tests route table creation and associations
func TestRouteTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check public route table
	publicRT := getResource(tfConfig, "aws_route_table", "public-rt")
	if publicRT == nil {
		t.Fatal("Public route table not found")
	}

	// Check private route table
	privateRT := getResource(tfConfig, "aws_route_table", "private-rt")
	if privateRT == nil {
		t.Fatal("Private route table not found")
	}

	// Check route table associations exist
	publicRTA := getResource(tfConfig, "aws_route_table_association", "public-rta-0")
	if publicRTA == nil {
		t.Fatal("Public route table association 0 not found")
	}

	privateRTA := getResource(tfConfig, "aws_route_table_association", "private-rta-0")
	if privateRTA == nil {
		t.Fatal("Private route table association 0 not found")
	}
}

// TestLambdaExecutionRole tests IAM role creation for Lambda
func TestLambdaExecutionRole(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	role := getResource(tfConfig, "aws_iam_role", "lambda-execution-role")
	if role == nil {
		t.Fatal("Lambda execution role not found")
	}

	// Verify assume role policy
	if policy, ok := role["assume_role_policy"]; !ok || policy == nil {
		t.Error("Lambda execution role should have assume role policy")
	}

	// Check policy attachments
	basicExecution := getResource(tfConfig, "aws_iam_role_policy_attachment", "lambda-basic-execution")
	if basicExecution == nil {
		t.Fatal("Lambda basic execution policy attachment not found")
	}

	vpcExecution := getResource(tfConfig, "aws_iam_role_policy_attachment", "lambda-vpc-execution")
	if vpcExecution == nil {
		t.Fatal("Lambda VPC execution policy attachment not found")
	}

	xrayWrite := getResource(tfConfig, "aws_iam_role_policy_attachment", "lambda-xray-write")
	if xrayWrite == nil {
		t.Fatal("Lambda X-Ray write policy attachment not found")
	}
}

// TestSecurityGroupConfiguration tests security group creation
func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check Lambda security group
	lambdaSG := getResource(tfConfig, "aws_security_group", "lambda-sg")
	if lambdaSG == nil {
		t.Fatal("Lambda security group not found")
	}

	// Verify security group is in VPC
	if vpcId, ok := lambdaSG["vpc_id"]; !ok || vpcId == nil {
		t.Error("Lambda security group should be in VPC")
	}

	// Check security group rules
	httpsEgress := getResource(tfConfig, "aws_security_group_rule", "lambda-egress-https")
	if httpsEgress == nil {
		t.Fatal("Lambda HTTPS egress rule not found")
	}

	httpEgress := getResource(tfConfig, "aws_security_group_rule", "lambda-egress-http")
	if httpEgress == nil {
		t.Fatal("Lambda HTTP egress rule not found")
	}
}

// TestS3BucketConfiguration tests S3 bucket creation and configuration
func TestS3BucketConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check S3 bucket
	bucket := getResource(tfConfig, "aws_s3_bucket", "lambda-deployment-bucket")
	if bucket == nil {
		t.Fatal("Lambda deployment bucket not found")
	}

	// Check bucket versioning
	versioning := getResource(tfConfig, "aws_s3_bucket_versioning", "lambda-bucket-versioning")
	if versioning == nil {
		t.Fatal("S3 bucket versioning not found")
	}

	// Check bucket encryption
	encryption := getResource(tfConfig, "aws_s3_bucket_server_side_encryption_configuration", "lambda-bucket-encryption")
	if encryption == nil {
		t.Fatal("S3 bucket encryption not found")
	}

	// Check bucket policy
	policy := getResource(tfConfig, "aws_s3_bucket_policy", "lambda-bucket-policy")
	if policy == nil {
		t.Fatal("S3 bucket policy not found")
	}
}

// TestDynamoDBTableConfiguration tests DynamoDB table creation
func TestDynamoDBTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	table := getResource(tfConfig, "aws_dynamodb_table", "sessions-table")
	if table == nil {
		t.Fatal("DynamoDB sessions table not found")
	}

	// Verify billing mode
	if billingMode, ok := table["billing_mode"]; !ok || billingMode != "PAY_PER_REQUEST" {
		t.Errorf("expected billing mode 'PAY_PER_REQUEST', got: %v", billingMode)
	}

	// Verify hash key
	if hashKey, ok := table["hash_key"]; !ok || hashKey != "session_id" {
		t.Errorf("expected hash key 'session_id', got: %v", hashKey)
	}
}

// TestSSMParameterConfiguration tests SSM parameter creation
func TestSSMParameterConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	param := getResource(tfConfig, "aws_ssm_parameter", "api-key-param")
	if param == nil {
		t.Fatal("SSM API key parameter not found")
	}

	// Verify parameter type
	if paramType, ok := param["type"]; !ok || paramType != "SecureString" {
		t.Errorf("expected parameter type 'SecureString', got: %v", paramType)
	}
}

// TestLambdaFunctionConfiguration tests Lambda function creation
func TestLambdaFunctionConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	functionNames := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	for _, funcName := range functionNames {
		t.Run(funcName, func(t *testing.T) {
			function := getResource(tfConfig, "aws_lambda_function", funcName)
			if function == nil {
				t.Fatalf("Lambda function %s not found", funcName)
			}

			// Verify runtime
			if runtime, ok := function["runtime"]; !ok || runtime != "nodejs18.x" {
				t.Errorf("expected runtime 'nodejs18.x', got: %v", runtime)
			}

			// Verify handler
			if handler, ok := function["handler"]; !ok || handler != "index.handler" {
				t.Errorf("expected handler 'index.handler', got: %v", handler)
			}

			// Check corresponding log group
			logGroup := getResource(tfConfig, "aws_cloudwatch_log_group", funcName+"-logs")
			if logGroup == nil {
				t.Errorf("CloudWatch log group for %s not found", funcName)
			}
		})
	}
}

// TestAPIGatewayConfiguration tests API Gateway creation
func TestAPIGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check API Gateway
	api := getResource(tfConfig, "aws_api_gateway_rest_api", "api-gateway")
	if api == nil {
		t.Fatal("API Gateway not found")
	}

	// Check API resource
	resource := getResource(tfConfig, "aws_api_gateway_resource", "api-resource")
	if resource == nil {
		t.Fatal("API Gateway resource not found")
	}

	// Check methods
	methods := []string{"GET", "POST", "PUT", "DELETE"}
	for _, method := range methods {
		methodResource := getResource(tfConfig, "aws_api_gateway_method", "method-"+method)
		if methodResource == nil {
			t.Errorf("API Gateway method %s not found", method)
		}

		integration := getResource(tfConfig, "aws_api_gateway_integration", "integration-"+method)
		if integration == nil {
			t.Errorf("API Gateway integration for %s not found", method)
		}
	}
}

// TestVPCEndpointsConfiguration tests VPC endpoints creation
func TestVPCEndpointsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check DynamoDB endpoint
	dynamoEndpoint := getResource(tfConfig, "aws_vpc_endpoint", "dynamodb-endpoint")
	if dynamoEndpoint == nil {
		t.Fatal("DynamoDB VPC endpoint not found")
	}

	// Verify route table IDs are populated (not empty)
	if routeTableIds, ok := dynamoEndpoint["route_table_ids"].([]interface{}); ok {
		if len(routeTableIds) == 0 {
			t.Error("DynamoDB VPC endpoint should have route table IDs")
		}
	}

	// Check S3 endpoint
	s3Endpoint := getResource(tfConfig, "aws_vpc_endpoint", "s3-endpoint")
	if s3Endpoint == nil {
		t.Fatal("S3 VPC endpoint not found")
	}

	// Verify route table IDs are populated (not empty)
	if routeTableIds, ok := s3Endpoint["route_table_ids"].([]interface{}); ok {
		if len(routeTableIds) == 0 {
			t.Error("S3 VPC endpoint should have route table IDs")
		}
	}
}

// TestBackendConfiguration tests S3 backend configuration
func TestBackendConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check if backend configuration exists
	if terraform, ok := tfConfig["terraform"].(map[string]interface{}); ok {
		if backend, ok := terraform["backend"].(map[string]interface{}); ok {
			if s3Backend, ok := backend["s3"].(map[string]interface{}); ok {
				if bucket, ok := s3Backend["bucket"]; !ok || bucket == nil {
					t.Error("S3 backend should have bucket configured")
				}
				if key, ok := s3Backend["key"]; !ok || key == nil {
					t.Error("S3 backend should have key configured")
				}
				if region, ok := s3Backend["region"]; !ok || region == nil {
					t.Error("S3 backend should have region configured")
				}
			} else {
				t.Error("Expected S3 backend configuration")
			}
		} else {
			t.Error("Expected backend configuration")
		}
	} else {
		t.Error("Expected terraform configuration")
	}
}

// TestProviderConfiguration tests AWS provider configuration
func TestProviderConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Check provider configuration
	if provider, ok := tfConfig["provider"].(map[string]interface{}); ok {
		// Provider can be either array or object format depending on CDKTF version
		if awsArray, ok := provider["aws"].([]interface{}); ok && len(awsArray) > 0 {
			if aws, ok := awsArray[0].(map[string]interface{}); ok {
				if region, ok := aws["region"]; !ok || region != "us-east-1" {
					t.Errorf("expected provider region 'us-east-1', got: %v", region)
				}
			}
		} else if aws, ok := provider["aws"].(map[string]interface{}); ok {
			if region, ok := aws["region"]; !ok || region != "us-east-1" {
				t.Errorf("expected provider region 'us-east-1', got: %v", region)
			}
		} else {
			t.Error("Expected AWS provider configuration")
		}
	} else {
		t.Error("Expected provider configuration")
	}
}

// TestResourceCount tests that expected number of resources are created
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
		if resourceMap, ok := resourceType.(map[string]interface{}); ok {
			totalResources += len(resourceMap)
		}
	}

	// Expect at least 50 resources (VPC, subnets, security groups, Lambda functions, etc.)
	if totalResources < 50 {
		t.Errorf("expected at least 50 resources, got: %d", totalResources)
	}

	t.Logf("Total resources created: %d", totalResources)
}

// TestOutputsConfiguration tests that required outputs are created
func TestOutputsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	outputs, ok := tfConfig["output"].(map[string]interface{})
	if !ok {
		t.Fatal("no outputs found")
	}

	// Check for expected outputs
	if _, ok := outputs["vpc-id"]; !ok {
		t.Error("VPC ID output not found")
	}

	if _, ok := outputs["api-gateway-url"]; ok {
		t.Log("API Gateway URL output found")
	}

	if _, ok := outputs["dynamodb-table-name"]; ok {
		t.Log("DynamoDB table name output found")
	}

	if _, ok := outputs["s3-bucket-name"]; ok {
		t.Log("S3 bucket name output found")
	}
}

// TestMultiRegionSupport tests stack deployment in different regions
func TestMultiRegionSupport(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-west-1"}

	for _, region := range regions {
		t.Run(region, func(t *testing.T) {
			tfPath := synthStack(t, region)
			tfConfig := parseTerraformJSON(t, tfPath)

			// Verify provider region is set correctly
			if provider, ok := tfConfig["provider"].(map[string]interface{}); ok {
				if aws, ok := provider["aws"].(map[string]interface{}); ok {
					if providerRegion, ok := aws["region"]; !ok || providerRegion != region {
						t.Errorf("expected provider region '%s', got: %v", region, providerRegion)
					}
				}
			}

			t.Logf("Successfully synthesized stack for region: %s", region)
		})
	}
}

// TestEnvironmentPrefixUsage tests that environment prefix is used in resource names
func TestEnvironmentPrefixUsage(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	tfConfig := parseTerraformJSON(t, tfPath)

	// Expected prefix based on environment suffix "test"
	expectedPrefix := "test-xk9f"

	// Resources to check for prefix usage
	resourcesToCheck := map[string]string{
		"aws_s3_bucket":            "lambda-deployment-bucket",
		"aws_dynamodb_table":       "sessions-table",
		"aws_iam_role":             "lambda-execution-role",
		"aws_api_gateway_rest_api": "api-gateway",
		"aws_lambda_function":      "get-handler",
	}

	for resourceType, resourceName := range resourcesToCheck {
		t.Run(resourceType+"/"+resourceName, func(t *testing.T) {
			resource := getResource(tfConfig, resourceType, resourceName)
			if resource == nil {
				t.Fatalf("Resource %s/%s not found", resourceType, resourceName)
			}

			// Check if resource name contains the expected prefix
			var resourceNameField string
			switch resourceType {
			case "aws_s3_bucket":
				if bucket, ok := resource["bucket"].(string); ok {
					resourceNameField = bucket
				}
			case "aws_dynamodb_table":
				if name, ok := resource["name"].(string); ok {
					resourceNameField = name
				}
			case "aws_iam_role":
				if name, ok := resource["name"].(string); ok {
					resourceNameField = name
				}
			case "aws_api_gateway_rest_api":
				if name, ok := resource["name"].(string); ok {
					resourceNameField = name
				}
			case "aws_lambda_function":
				if name, ok := resource["function_name"].(string); ok {
					resourceNameField = name
				}
			}

			if !strings.Contains(resourceNameField, expectedPrefix) {
				t.Errorf("Resource name '%s' should contain prefix '%s'", resourceNameField, expectedPrefix)
			}
		})
	}
}

// TestEnvironmentVariableHandling tests environment variable handling
func TestEnvironmentVariableHandling(t *testing.T) {
	// Save original environment variables
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

	// Set custom environment variables
	_ = os.Setenv("AWS_REGION", "us-east-1")
	_ = os.Setenv("ENVIRONMENT_SUFFIX", "custom-test")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET", "custom-state-bucket")
	_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", "eu-west-1")

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	config := &TapStackConfig{
		Region:            "us-east-1",
		Environment:       "production",
		AppName:           "test-app",
		EnvironmentSuffix: "default-env",    // This should be overridden by env var
		StateBucket:       "default-bucket", // This should be overridden by env var
		StateBucketRegion: "us-east-1",      // This should be overridden by env var
	}

	NewTapStack(app, "EnvTestStack", config)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "EnvTestStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}

	tfConfig := parseTerraformJSON(t, tfPath)

	// Verify backend uses custom values from environment variables
	if terraform, ok := tfConfig["terraform"].(map[string]interface{}); ok {
		if backend, ok := terraform["backend"].(map[string]interface{}); ok {
			if s3Backend, ok := backend["s3"].(map[string]interface{}); ok {
				if bucket, ok := s3Backend["bucket"].(string); ok {
					if bucket != "custom-state-bucket" {
						t.Errorf("expected backend bucket 'custom-state-bucket', got: %s", bucket)
					}
				}
				if region, ok := s3Backend["region"].(string); ok {
					if region != "eu-west-1" {
						t.Errorf("expected backend region 'eu-west-1', got: %s", region)
					}
				}
			}
		}
	}

	// Verify resource names use custom environment suffix
	s3Bucket := getResource(tfConfig, "aws_s3_bucket", "lambda-deployment-bucket")
	if s3Bucket != nil {
		if bucket, ok := s3Bucket["bucket"].(string); ok {
			if !strings.Contains(bucket, "custom-test-xk9f") {
				t.Errorf("expected bucket name to contain 'custom-test-xk9f', got: %s", bucket)
			}
		}
	}
}
