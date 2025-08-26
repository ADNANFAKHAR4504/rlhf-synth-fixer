//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, stackName string, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	NewTapStack(app, jsii.String(stackName), &TapStackConfig{
		Region:      jsii.String(region),
		Environment: jsii.String("test"),
		Project:     jsii.String("security-test"),
		Owner:       jsii.String("test-team"),
		CostCenter:  jsii.String("test-center"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
			jsii.String("198.51.100.0/24"),
		},
	})

	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", stackName, "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

func loadSynthesizedStack(t *testing.T, tfPath string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(tfPath)
	require.NoError(t, err)

	var tfConfig map[string]interface{}
	err = json.Unmarshal(data, &tfConfig)
	require.NoError(t, err)

	return tfConfig
}

func TestTapStackCreation(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify basic structure
	assert.Contains(t, tfConfig, "provider")
	assert.Contains(t, tfConfig, "resource")
	assert.Contains(t, tfConfig, "output")
	assert.Contains(t, tfConfig, "data")
	assert.Contains(t, tfConfig, "terraform")
}

func TestVPCConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackVPCTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get VPC resource
	resources := tfConfig["resource"].(map[string]interface{})
	vpcResources := resources["aws_vpc"].(map[string]interface{})

	// Verify VPC exists with correct configuration
	assert.Contains(t, vpcResources, "main-vpc")
	vpc := vpcResources["main-vpc"].(map[string]interface{})
	assert.Equal(t, "10.0.0.0/16", vpc["cidr_block"])
	assert.Equal(t, true, vpc["enable_dns_hostnames"])
	assert.Equal(t, true, vpc["enable_dns_support"])
}

func TestSubnetConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackSubnetTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get subnet resources
	resources := tfConfig["resource"].(map[string]interface{})
	subnetResources := resources["aws_subnet"].(map[string]interface{})

	// Test public subnets
	assert.Contains(t, subnetResources, "public-subnet-1")
	publicSubnet1 := subnetResources["public-subnet-1"].(map[string]interface{})
	assert.Equal(t, "10.0.1.0/24", publicSubnet1["cidr_block"])
	assert.Equal(t, true, publicSubnet1["map_public_ip_on_launch"])

	assert.Contains(t, subnetResources, "public-subnet-2")
	publicSubnet2 := subnetResources["public-subnet-2"].(map[string]interface{})
	assert.Equal(t, "10.0.2.0/24", publicSubnet2["cidr_block"])

	// Test private subnets
	assert.Contains(t, subnetResources, "private-subnet-1")
	privateSubnet1 := subnetResources["private-subnet-1"].(map[string]interface{})
	assert.Equal(t, "10.0.10.0/24", privateSubnet1["cidr_block"])

	assert.Contains(t, subnetResources, "private-subnet-2")
	privateSubnet2 := subnetResources["private-subnet-2"].(map[string]interface{})
	assert.Equal(t, "10.0.11.0/24", privateSubnet2["cidr_block"])
}

func TestSecurityGroups(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackSGTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get security group resources
	resources := tfConfig["resource"].(map[string]interface{})
	sgResources := resources["aws_security_group"].(map[string]interface{})

	// Verify security groups exist
	assert.Contains(t, sgResources, "web-sg")
	assert.Contains(t, sgResources, "app-sg")
	assert.Contains(t, sgResources, "rds-sg")
	assert.Contains(t, sgResources, "lambda-sg")

	// Check web security group configuration
	webSg := sgResources["web-sg"].(map[string]interface{})
	assert.Equal(t, "Security group for web tier with restricted access", webSg["description"])

	// Check security group rules
	sgRules := resources["aws_security_group_rule"].(map[string]interface{})

	// Web HTTPS ingress rules (should have multiple for different IP ranges)
	assert.Contains(t, sgRules, "web-https-inbound-0")
	httpsRule := sgRules["web-https-inbound-0"].(map[string]interface{})
	assert.Equal(t, "ingress", httpsRule["type"])
	assert.Equal(t, float64(443), httpsRule["from_port"])
	assert.Equal(t, float64(443), httpsRule["to_port"])

	// App from web rule
	assert.Contains(t, sgRules, "app-from-web")
	appRule := sgRules["app-from-web"].(map[string]interface{})
	assert.Equal(t, "ingress", appRule["type"])
	assert.Equal(t, float64(8080), appRule["from_port"])

	// Database ingress rule
	assert.Contains(t, sgRules, "rds-from-app")
	dbRule := sgRules["rds-from-app"].(map[string]interface{})
	assert.Equal(t, "ingress", dbRule["type"])
	assert.Equal(t, float64(5432), dbRule["from_port"])

	// Lambda HTTPS outbound rule
	assert.Contains(t, sgRules, "lambda-https-outbound")
	lambdaRule := sgRules["lambda-https-outbound"].(map[string]interface{})
	assert.Equal(t, "egress", lambdaRule["type"])
	assert.Equal(t, float64(443), lambdaRule["from_port"])
}

func TestKMSConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackKMSTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get KMS resources
	resources := tfConfig["resource"].(map[string]interface{})
	kmsKeys := resources["aws_kms_key"].(map[string]interface{})
	kmsAliases := resources["aws_kms_alias"].(map[string]interface{})

	// Verify RDS KMS key configuration
	assert.Contains(t, kmsKeys, "rds-kms-key")
	rdsKmsKey := kmsKeys["rds-kms-key"].(map[string]interface{})
	assert.Equal(t, true, rdsKmsKey["enable_key_rotation"])
	assert.Equal(t, "ENCRYPT_DECRYPT", rdsKmsKey["key_usage"])
	assert.Contains(t, rdsKmsKey["description"].(string), "FIPS 140-3 Level 3")

	// Verify S3 KMS key
	assert.Contains(t, kmsKeys, "s3-kms-key")
	s3KmsKey := kmsKeys["s3-kms-key"].(map[string]interface{})
	assert.Equal(t, true, s3KmsKey["enable_key_rotation"])

	// Verify CloudTrail KMS key
	assert.Contains(t, kmsKeys, "cloudtrail-kms-key")
	cloudtrailKmsKey := kmsKeys["cloudtrail-kms-key"].(map[string]interface{})
	assert.Equal(t, true, cloudtrailKmsKey["enable_key_rotation"])

	// Verify KMS aliases
	assert.Contains(t, kmsAliases, "rds-kms-alias")
	assert.Contains(t, kmsAliases, "s3-kms-alias")
	assert.Contains(t, kmsAliases, "cloudtrail-kms-alias")
}

func TestS3BucketConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackS3Test", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get S3 resources
	resources := tfConfig["resource"].(map[string]interface{})
	s3Buckets := resources["aws_s3_bucket"].(map[string]interface{})

	// Verify S3 buckets exist
	assert.Contains(t, s3Buckets, "app-data-bucket")
	assert.Contains(t, s3Buckets, "cloudtrail-bucket")

	// Check app data bucket configuration
	appDataBucket := s3Buckets["app-data-bucket"].(map[string]interface{})
	bucketName := appDataBucket["bucket"].(string)
	assert.Contains(t, bucketName, "tap-app-data-bucket")

	// Check CloudTrail bucket configuration
	cloudtrailBucket := s3Buckets["cloudtrail-bucket"].(map[string]interface{})
	cloudtrailName := cloudtrailBucket["bucket"].(string)
	assert.Contains(t, cloudtrailName, "tap-cloudtrail-logs")
}

func TestS3BucketPoliciesAndSecurity(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackS3PolicyTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get S3 bucket policy and public access block resources
	resources := tfConfig["resource"].(map[string]interface{})
	s3Policies := resources["aws_s3_bucket_policy"].(map[string]interface{})
	s3PublicAccessBlocks := resources["aws_s3_bucket_public_access_block"].(map[string]interface{})

	// Verify bucket policies exist
	assert.Contains(t, s3Policies, "app-data-bucket-policy")
	assert.Contains(t, s3Policies, "cloudtrail-bucket-policy")

	// Verify public access blocks exist
	assert.Contains(t, s3PublicAccessBlocks, "app-data-bucket-pab")
	assert.Contains(t, s3PublicAccessBlocks, "cloudtrail-bucket-pab")

	// Check public access block configuration
	appDataPAB := s3PublicAccessBlocks["app-data-bucket-pab"].(map[string]interface{})
	assert.Equal(t, true, appDataPAB["block_public_acls"])
	assert.Equal(t, true, appDataPAB["block_public_policy"])
	assert.Equal(t, true, appDataPAB["ignore_public_acls"])
	assert.Equal(t, true, appDataPAB["restrict_public_buckets"])
}

func TestIAMRolesAndPolicies(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackIAMTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get IAM resources
	resources := tfConfig["resource"].(map[string]interface{})
	iamRoles := resources["aws_iam_role"].(map[string]interface{})
	iamRolePolicyAttachments := resources["aws_iam_role_policy_attachment"].(map[string]interface{})

	// Verify Lambda execution role exists
	assert.Contains(t, iamRoles, "lambda-execution-role")
	lambdaRole := iamRoles["lambda-execution-role"].(map[string]interface{})
	roleName := lambdaRole["name"].(string)
	assert.Contains(t, roleName, "tap-lambda-execution-role")

	// Verify CloudTrail role exists
	assert.Contains(t, iamRoles, "cloudtrail-role")
	cloudtrailRole := iamRoles["cloudtrail-role"].(map[string]interface{})
	cloudtrailRoleName := cloudtrailRole["name"].(string)
	assert.Contains(t, cloudtrailRoleName, "tap-cloudtrail-role")

	// Verify policy attachments exist
	assert.Contains(t, iamRolePolicyAttachments, "lambda-basic-execution")
	assert.Contains(t, iamRolePolicyAttachments, "lambda-vpc-execution")
	assert.Contains(t, iamRolePolicyAttachments, "cloudtrail-logs-policy")

	// Check Lambda basic execution policy attachment
	lambdaBasicAttachment := iamRolePolicyAttachments["lambda-basic-execution"].(map[string]interface{})
	assert.Equal(t, "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole", lambdaBasicAttachment["policy_arn"])
}

func TestRDSConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackRDSTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get RDS resources
	resources := tfConfig["resource"].(map[string]interface{})
	dbInstances := resources["aws_db_instance"].(map[string]interface{})
	dbSubnetGroups := resources["aws_db_subnet_group"].(map[string]interface{})

	// Verify RDS instance configuration
	assert.Contains(t, dbInstances, "postgres-db")
	rdsInstance := dbInstances["postgres-db"].(map[string]interface{})
	assert.Equal(t, true, rdsInstance["storage_encrypted"])
	assert.Equal(t, true, rdsInstance["deletion_protection"])
	assert.Equal(t, "postgres", rdsInstance["engine"])
	assert.Equal(t, "db.t3.micro", rdsInstance["instance_class"])
	assert.Equal(t, float64(20), rdsInstance["allocated_storage"])
	assert.Equal(t, "gp3", rdsInstance["storage_type"])
	assert.Equal(t, true, rdsInstance["multi_az"])
	assert.Equal(t, false, rdsInstance["publicly_accessible"])

	// Verify DB subnet group
	assert.Contains(t, dbSubnetGroups, "db-subnet-group")
	dbSubnetGroup := dbSubnetGroups["db-subnet-group"].(map[string]interface{})
	subnetIds := dbSubnetGroup["subnet_ids"].([]interface{})
	assert.Len(t, subnetIds, 2) // Should have 2 private subnets
}

func TestCloudTrailConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackCloudTrailTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get CloudTrail and CloudWatch resources
	resources := tfConfig["resource"].(map[string]interface{})
	cloudtrails := resources["aws_cloudtrail"].(map[string]interface{})
	logGroups := resources["aws_cloudwatch_log_group"].(map[string]interface{})

	// Verify CloudTrail configuration
	assert.Contains(t, cloudtrails, "main-cloudtrail")
	cloudtrail := cloudtrails["main-cloudtrail"].(map[string]interface{})
	assert.Equal(t, true, cloudtrail["include_global_service_events"])
	assert.Equal(t, true, cloudtrail["is_multi_region_trail"])
	assert.Equal(t, true, cloudtrail["enable_log_file_validation"])
	assert.Equal(t, true, cloudtrail["enable_logging"])

	// Verify CloudWatch log group
	assert.Contains(t, logGroups, "cloudtrail-log-group")
	logGroup := logGroups["cloudtrail-log-group"].(map[string]interface{})
	assert.Equal(t, float64(90), logGroup["retention_in_days"])

	// Verify event selector configuration
	eventSelectors := cloudtrail["event_selector"].([]interface{})
	assert.Len(t, eventSelectors, 1)
	eventSelector := eventSelectors[0].(map[string]interface{})
	assert.Equal(t, "All", eventSelector["read_write_type"])
	assert.Equal(t, true, eventSelector["include_management_events"])
}

func TestNATGatewayConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackNATTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get NAT Gateway resources
	resources := tfConfig["resource"].(map[string]interface{})
	natGateways := resources["aws_nat_gateway"].(map[string]interface{})
	eips := resources["aws_eip"].(map[string]interface{})

	// Verify NAT Gateways exist
	assert.Contains(t, natGateways, "nat-gw-1")
	assert.Contains(t, natGateways, "nat-gw-2")

	// Verify EIPs for NAT Gateways
	assert.Contains(t, eips, "nat-eip-1")
	assert.Contains(t, eips, "nat-eip-2")

	// Check EIP configuration
	natEip1 := eips["nat-eip-1"].(map[string]interface{})
	assert.Equal(t, "vpc", natEip1["domain"])
}

func TestRouteTableConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackRouteTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get route table resources
	resources := tfConfig["resource"].(map[string]interface{})
	routeTables := resources["aws_route_table"].(map[string]interface{})
	routes := resources["aws_route"].(map[string]interface{})
	routeTableAssociations := resources["aws_route_table_association"].(map[string]interface{})

	// Verify route tables exist
	assert.Contains(t, routeTables, "public-rt")
	assert.Contains(t, routeTables, "private-rt-1")
	assert.Contains(t, routeTables, "private-rt-2")

	// Verify routes exist
	assert.Contains(t, routes, "public-route")
	assert.Contains(t, routes, "private-route-1")
	assert.Contains(t, routes, "private-route-2")

	// Verify route table associations
	assert.Contains(t, routeTableAssociations, "public-rt-assoc-1")
	assert.Contains(t, routeTableAssociations, "public-rt-assoc-2")
	assert.Contains(t, routeTableAssociations, "private-rt-assoc-1")
	assert.Contains(t, routeTableAssociations, "private-rt-assoc-2")

	// Check public route configuration
	publicRoute := routes["public-route"].(map[string]interface{})
	assert.Equal(t, "0.0.0.0/0", publicRoute["destination_cidr_block"])
}

func TestInternetGatewayConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackIGWTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get Internet Gateway resources
	resources := tfConfig["resource"].(map[string]interface{})
	igws := resources["aws_internet_gateway"].(map[string]interface{})

	// Verify Internet Gateway exists
	assert.Contains(t, igws, "main-igw")
	igw := igws["main-igw"].(map[string]interface{})

	// Check that IGW has proper tags
	tags := igw["tags"].(map[string]interface{})
	assert.Contains(t, tags, "Name")
	assert.Contains(t, tags, "Environment")
}

func TestStackOutputs(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackOutputTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get outputs
	outputs := tfConfig["output"].(map[string]interface{})

	// Verify all expected outputs exist
	expectedOutputs := []string{
		"vpc_id",
		"vpc_cidr_block",
		"public_subnet_ids",
		"private_subnet_ids",
		"internet_gateway_id",
		"nat_gateway_ids",
		"web_security_group_id",
		"app_security_group_id",
		"db_security_group_id",
		"lambda_security_group_id",
		"rds_kms_key_id",
		"rds_kms_key_arn",
		"s3_kms_key_id",
		"cloudtrail_kms_key_id",
		"app_data_bucket_id",
		"cloudtrail_bucket_id",
		"rds_instance_id",
		"rds_instance_endpoint",
		"lambda_execution_role_arn",
		"cloudtrail_role_arn",
		"cloudtrail_trail_arn",
		"db_subnet_group_name",
	}

	for _, outputName := range expectedOutputs {
		assert.Contains(t, outputs, outputName, "Output %s should exist", outputName)
	}

	// Check sensitive outputs
	rdsEndpointOutput := outputs["rds_instance_endpoint"].(map[string]interface{})
	assert.Equal(t, true, rdsEndpointOutput["sensitive"])
}

func TestResourceTagging(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackTagTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get provider configuration
	provider := tfConfig["provider"].(map[string]interface{})
	awsProvider := provider["aws"].([]interface{})[0].(map[string]interface{})

	// Verify default tags are configured
	assert.Contains(t, awsProvider, "default_tags")
	defaultTags := awsProvider["default_tags"].([]interface{})[0].(map[string]interface{})
	tags := defaultTags["tags"].(map[string]interface{})

	// Check required tags
	assert.Contains(t, tags, "Environment")
	assert.Contains(t, tags, "Project")
	assert.Contains(t, tags, "Owner")
	assert.Contains(t, tags, "CostCenter")
	assert.Contains(t, tags, "ManagedBy")
	assert.Contains(t, tags, "Compliance")

	// Check tag values
	assert.Equal(t, "test", tags["Environment"])
	assert.Equal(t, "security-test", tags["Project"])
	assert.Equal(t, "cdktf", tags["ManagedBy"])
	assert.Equal(t, "FIPS-140-3-Level-3", tags["Compliance"])
}

func TestEnvironmentSuffixHandling(t *testing.T) {
	// Test with custom environment suffix
	oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	os.Setenv("ENVIRONMENT_SUFFIX", "customtest123")
	defer func() {
		if oldEnvSuffix == "" {
			os.Unsetenv("ENVIRONMENT_SUFFIX")
		} else {
			os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
		}
	}()

	tfPath := synthStack(t, "TapStackEnvTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify resources are created
	assert.Contains(t, tfConfig, "resource")
	resources := tfConfig["resource"].(map[string]interface{})
	assert.NotEmpty(t, resources)

	// Check that resources contain the custom environment suffix
	s3Buckets := resources["aws_s3_bucket"].(map[string]interface{})
	appDataBucket := s3Buckets["app-data-bucket"].(map[string]interface{})
	bucketName := appDataBucket["bucket"].(string)
	assert.Contains(t, bucketName, "cdktf-customtest123")
}

func TestBackendConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackBackendTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify S3 backend configuration
	assert.Contains(t, tfConfig, "terraform")
	terraform := tfConfig["terraform"].(map[string]interface{})
	assert.Contains(t, terraform, "backend")

	backend := terraform["backend"].(map[string]interface{})
	assert.Contains(t, backend, "s3")

	s3Backend := backend["s3"].(map[string]interface{})
	assert.Contains(t, s3Backend, "bucket")
	assert.Contains(t, s3Backend, "key")
	assert.Contains(t, s3Backend, "region")
	assert.Equal(t, true, s3Backend["encrypt"])
}

func TestDataSources(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackDataTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get data sources
	dataSources := tfConfig["data"].(map[string]interface{})

	// Verify required data sources exist
	assert.Contains(t, dataSources, "aws_caller_identity")
	assert.Contains(t, dataSources, "aws_availability_zones")

	// Check availability zones data source configuration
	azData := dataSources["aws_availability_zones"].(map[string]interface{})
	azAvailable := azData["available"].(map[string]interface{})
	assert.Equal(t, "available", azAvailable["state"])
}

func TestSecurityCompliance(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackComplianceTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})

	// Test RDS encryption compliance
	dbInstances := resources["aws_db_instance"].(map[string]interface{})
	rdsInstance := dbInstances["postgres-db"].(map[string]interface{})
	assert.Equal(t, true, rdsInstance["storage_encrypted"])
	assert.Equal(t, true, rdsInstance["deletion_protection"])

	// Test S3 bucket security
	s3PublicAccessBlocks := resources["aws_s3_bucket_public_access_block"].(map[string]interface{})
	appDataPAB := s3PublicAccessBlocks["app-data-bucket-pab"].(map[string]interface{})
	assert.Equal(t, true, appDataPAB["block_public_acls"])
	assert.Equal(t, true, appDataPAB["block_public_policy"])

	// Test KMS key rotation
	kmsKeys := resources["aws_kms_key"].(map[string]interface{})
	rdsKmsKey := kmsKeys["rds-kms-key"].(map[string]interface{})
	assert.Equal(t, true, rdsKmsKey["enable_key_rotation"])

	// Test CloudTrail logging
	cloudtrails := resources["aws_cloudtrail"].(map[string]interface{})
	cloudtrail := cloudtrails["main-cloudtrail"].(map[string]interface{})
	assert.Equal(t, true, cloudtrail["enable_log_file_validation"])
	assert.Equal(t, true, cloudtrail["is_multi_region_trail"])
}
