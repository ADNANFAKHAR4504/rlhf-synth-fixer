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
}

func TestSecurityHubConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackSecurityHubTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify basic structure
	assert.Contains(t, tfConfig, "provider")
	assert.Contains(t, tfConfig, "resource")

	// Verify Security Hub resources (both primary and secondary)
	resources := tfConfig["resource"].(map[string]interface{})
	assert.Contains(t, resources, "aws_securityhub_account")

	// Should have both primary and secondary Security Hub accounts
	securityHubAccounts := resources["aws_securityhub_account"].(map[string]interface{})
	assert.Contains(t, securityHubAccounts, "security-hub")
	assert.Contains(t, securityHubAccounts, "security-hub-east")
}

func TestVPCConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackVPCTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get VPC resource
	resources := tfConfig["resource"].(map[string]interface{})
	vpcResources := resources["aws_vpc"].(map[string]interface{})

	// Verify VPC exists with correct configuration
	assert.Contains(t, vpcResources, "security-vpc")
	vpc := vpcResources["security-vpc"].(map[string]interface{})
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
	assert.Equal(t, "10.0.11.0/24", privateSubnet1["cidr_block"])

	assert.Contains(t, subnetResources, "private-subnet-2")
	privateSubnet2 := subnetResources["private-subnet-2"].(map[string]interface{})
	assert.Equal(t, "10.0.12.0/24", privateSubnet2["cidr_block"])
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
	assert.Contains(t, sgResources, "db-sg")

	// Check security group rules
	sgRules := resources["aws_security_group_rule"].(map[string]interface{})

	// Web ingress rules
	assert.Contains(t, sgRules, "web-ingress-http")
	httpRule := sgRules["web-ingress-http"].(map[string]interface{})
	assert.Equal(t, "ingress", httpRule["type"])
	assert.Equal(t, float64(80), httpRule["from_port"])

	assert.Contains(t, sgRules, "web-ingress-https")
	httpsRule := sgRules["web-ingress-https"].(map[string]interface{})
	assert.Equal(t, float64(443), httpsRule["from_port"])

	// Database ingress rule
	assert.Contains(t, sgRules, "db-ingress-postgres")
	dbRule := sgRules["db-ingress-postgres"].(map[string]interface{})
	assert.Equal(t, float64(5432), dbRule["from_port"])
}

func TestKMSConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackKMSTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get KMS resources
	resources := tfConfig["resource"].(map[string]interface{})
	kmsKeys := resources["aws_kms_key"].(map[string]interface{})
	kmsAliases := resources["aws_kms_alias"].(map[string]interface{})

	// Verify KMS key configuration
	assert.Contains(t, kmsKeys, "security-kms-key")
	kmsKey := kmsKeys["security-kms-key"].(map[string]interface{})
	assert.Equal(t, true, kmsKey["enable_key_rotation"])
	assert.Equal(t, "ENCRYPT_DECRYPT", kmsKey["key_usage"])

	// Verify KMS alias
	assert.Contains(t, kmsAliases, "security-kms-alias")
	kmsAlias := kmsAliases["security-kms-alias"].(map[string]interface{})
	// KMS alias name should contain environment suffix
	aliasName := kmsAlias["name"].(string)
	assert.Contains(t, aliasName, "alias/security-infrastructure-cdktf-")
}

func TestS3BucketConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackS3Test", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get S3 resources
	resources := tfConfig["resource"].(map[string]interface{})
	s3Buckets := resources["aws_s3_bucket"].(map[string]interface{})

	// Verify S3 buckets exist
	assert.Contains(t, s3Buckets, "secure-data-bucket")
	assert.Contains(t, s3Buckets, "cloudtrail-logs-bucket")

	// Check bucket names contain "secure-data"
	secureDataBucket := s3Buckets["secure-data-bucket"].(map[string]interface{})
	bucketName := secureDataBucket["bucket"].(string)
	assert.Contains(t, bucketName, "secure-data")

	cloudtrailBucket := s3Buckets["cloudtrail-logs-bucket"].(map[string]interface{})
	cloudtrailName := cloudtrailBucket["bucket"].(string)
	assert.Contains(t, cloudtrailName, "secure-data-cloudtrail")

	// Verify force_destroy is set for cleanup
	assert.Equal(t, true, secureDataBucket["force_destroy"])
	assert.Equal(t, true, cloudtrailBucket["force_destroy"])
}

func TestS3BucketEncryption(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackS3EncTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get S3 encryption resources
	resources := tfConfig["resource"].(map[string]interface{})
	s3Encryption := resources["aws_s3_bucket_server_side_encryption_configuration"].(map[string]interface{})

	// Verify encryption configuration exists
	assert.Contains(t, s3Encryption, "secure-data-encryption")
}

func TestS3BucketPolicies(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackS3PolicyTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get S3 bucket policy resources
	resources := tfConfig["resource"].(map[string]interface{})
	s3Policies := resources["aws_s3_bucket_policy"].(map[string]interface{})

	// Verify bucket policies exist
	assert.Contains(t, s3Policies, "secure-data-policy")
	assert.Contains(t, s3Policies, "cloudtrail-bucket-policy")

	// Check that policies use jsonencode
	securePolicy := s3Policies["secure-data-policy"].(map[string]interface{})
	assert.Contains(t, securePolicy["policy"].(string), "jsonencode")
}

func TestIAMRolesAndPolicies(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackIAMTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get IAM resources
	resources := tfConfig["resource"].(map[string]interface{})
	iamRoles := resources["aws_iam_role"].(map[string]interface{})
	iamPolicies := resources["aws_iam_policy"].(map[string]interface{})

	// Verify IAM role exists
	assert.Contains(t, iamRoles, "ec2-role")
	ec2Role := iamRoles["ec2-role"].(map[string]interface{})
	// IAM role name should contain environment suffix
	roleName := ec2Role["name"].(string)
	assert.Contains(t, roleName, "EC2SecurityRole-cdktf-")

	// Verify IAM policy exists
	assert.Contains(t, iamPolicies, "ec2-policy")
	ec2Policy := iamPolicies["ec2-policy"].(map[string]interface{})
	// IAM policy name should contain environment suffix
	policyName := ec2Policy["name"].(string)
	assert.Contains(t, policyName, "EC2SecurityPolicy-cdktf-")

	// Verify policy attachment
	attachments := resources["aws_iam_role_policy_attachment"].(map[string]interface{})
	assert.Contains(t, attachments, "ec2-policy-attachment")
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
	assert.Contains(t, dbInstances, "security-database")
	rdsInstance := dbInstances["security-database"].(map[string]interface{})
	assert.Equal(t, true, rdsInstance["storage_encrypted"])
	assert.Equal(t, true, rdsInstance["skip_final_snapshot"])
	assert.Equal(t, false, rdsInstance["deletion_protection"])
	assert.Equal(t, "postgres", rdsInstance["engine"])
	assert.Equal(t, "15.7", rdsInstance["engine_version"])

	// Verify DB subnet group
	assert.Contains(t, dbSubnetGroups, "db-subnet-group")
}

func TestCloudTrailConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackCloudTrailTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get CloudTrail resources
	resources := tfConfig["resource"].(map[string]interface{})
	cloudtrails := resources["aws_cloudtrail"].(map[string]interface{})

	// Verify CloudTrail configuration
	assert.Contains(t, cloudtrails, "security-cloudtrail")
	cloudtrail := cloudtrails["security-cloudtrail"].(map[string]interface{})
	assert.Equal(t, true, cloudtrail["include_global_service_events"])
	assert.Equal(t, true, cloudtrail["is_multi_region_trail"])
	assert.Equal(t, true, cloudtrail["enable_log_file_validation"])
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
	assert.Contains(t, natGateways, "nat-gateway-1")
	assert.Contains(t, natGateways, "nat-gateway-2")

	// Verify EIPs for NAT Gateways
	assert.Contains(t, eips, "nat-eip-1")
	assert.Contains(t, eips, "nat-eip-2")
}

func TestRouteTableConfiguration(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackRouteTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get route table resources
	resources := tfConfig["resource"].(map[string]interface{})
	routeTables := resources["aws_route_table"].(map[string]interface{})
	routes := resources["aws_route"].(map[string]interface{})

	// Verify route tables exist
	assert.Contains(t, routeTables, "public-route-table")
	assert.Contains(t, routeTables, "private-route-table-1")
	assert.Contains(t, routeTables, "private-route-table-2")

	// Verify routes exist
	assert.Contains(t, routes, "public-route")
	assert.Contains(t, routes, "private-route-1")
	assert.Contains(t, routes, "private-route-2")
}

func TestStackOutputs(t *testing.T) {
	// Synthesize the stack
	tfPath := synthStack(t, "TapStackOutputTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get outputs
	outputs := tfConfig["output"].(map[string]interface{})

	// Verify all expected outputs exist
	expectedOutputs := []string{
		"VpcId",
		"SecureDataBucket",
		"CloudTrailBucket",
		"KmsKeyId",
		"RdsInstanceId",
		"PublicSubnet1Id",
		"PrivateSubnet1Id",
	}

	for _, outputName := range expectedOutputs {
		assert.Contains(t, outputs, outputName, "Output %s should exist", outputName)
	}
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
}

func TestEnvironmentSuffixHandling(t *testing.T) {
	// Test with custom environment suffix
	os.Setenv("ENVIRONMENT_SUFFIX", "customtest123")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	tfPath := synthStack(t, "TapStackEnvTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify resources are created
	assert.Contains(t, tfConfig, "resource")
	resources := tfConfig["resource"].(map[string]interface{})
	assert.NotEmpty(t, resources)
}

func TestMultiRegionProviderConfiguration(t *testing.T) {
	// Synthesize the unified stack
	tfPath := synthStack(t, "TapStackMultiRegionTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Get provider configuration
	provider := tfConfig["provider"].(map[string]interface{})
	awsProviders := provider["aws"].([]interface{})

	// Should have multiple AWS providers (primary and secondary)
	assert.GreaterOrEqual(t, len(awsProviders), 2)

	// Find the east region provider
	var eastProvider map[string]interface{}
	for _, p := range awsProviders {
		providerConfig := p.(map[string]interface{})
		if alias, ok := providerConfig["alias"]; ok && alias == "east" {
			eastProvider = providerConfig
			break
		}
	}

	// Verify east provider configuration
	assert.NotNil(t, eastProvider)
	assert.Equal(t, "us-east-1", eastProvider["region"])
	assert.Equal(t, "east", eastProvider["alias"])
}
