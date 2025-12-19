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

// TerraformManifest represents the synthesized Terraform configuration
type TerraformManifest struct {
	Provider  map[string]interface{}            `json:"provider"`
	Resource  map[string]map[string]interface{} `json:"resource"`
	Data      map[string]map[string]interface{} `json:"data,omitempty"`
	Terraform map[string]interface{}            `json:"terraform"`
}

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

	// Create the stack (same as main.go)
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	// Add AWS provider configuration
	stack.AddOverride(jsii.String("terraform.required_providers.aws"), map[string]interface{}{
		"source":  "hashicorp/aws",
		"version": "~> 6.0",
	})

	stack.AddOverride(jsii.String("provider.aws.region"), jsii.String(region))
	stack.AddOverride(jsii.String("provider.aws.default_tags.tags"), map[string]string{
		"Environment": "dev",
		"Project":     "tap",
		"ManagedBy":   "cdktf",
	})

	// Add VPC
	stack.AddOverride(jsii.String("resource.aws_vpc.tap_vpc"), map[string]interface{}{
		"cidr_block":           "10.0.0.0/16",
		"enable_dns_hostnames": true,
		"enable_dns_support":   true,
		"tags": map[string]string{
			"Name": "tap-vpc-dev",
		},
	})

	// Add private subnet
	stack.AddOverride(jsii.String("resource.aws_subnet.private_subnet"), map[string]interface{}{
		"vpc_id":            "${aws_vpc.tap_vpc.id}",
		"cidr_block":        "10.0.1.0/24",
		"availability_zone": "us-east-1a",
		"tags": map[string]string{
			"Name": "tap-private-subnet-dev",
			"Type": "private",
		},
	})

	// Add KMS key
	stack.AddOverride(jsii.String("resource.aws_kms_key.tap_kms_key"), map[string]interface{}{
		"description": "KMS key for TAP infrastructure encryption",
		"key_usage":   "ENCRYPT_DECRYPT",
		"policy": `{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudTrail to encrypt logs",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/tap-cloudtrail-dev"
						}
					}
				},
				{
					"Sid": "Allow CloudTrail to describe key",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`,
		"tags": map[string]string{
			"Name": "tap-kms-key-dev",
		},
	})

	// Add S3 bucket
	stack.AddOverride(jsii.String("resource.aws_s3_bucket.tap_bucket"), map[string]interface{}{
		"bucket": "tap-app-data-dev-${random_id.suffix.hex}",
		"tags": map[string]string{
			"Name": "tap-app-bucket-dev",
		},
	})

	// Add random ID for unique naming
	stack.AddOverride(jsii.String("resource.random_id.suffix"), map[string]interface{}{
		"byte_length": 4,
	})

	// Add S3 bucket encryption
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_server_side_encryption_configuration.tap_bucket_encryption"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.tap_bucket.id}",
		"rule": []map[string]interface{}{
			{
				"apply_server_side_encryption_by_default": map[string]interface{}{
					"sse_algorithm":     "aws:kms",
					"kms_master_key_id": "${aws_kms_key.tap_kms_key.arn}",
				},
			},
		},
	})

	// Add IAM role for EC2
	stack.AddOverride(jsii.String("resource.aws_iam_role.ec2_role"), map[string]interface{}{
		"name": "tap-ec2-role-dev",
		"assume_role_policy": `{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`,
		"tags": map[string]string{
			"Name": "tap-ec2-role-dev",
		},
	})

	// Add security group
	stack.AddOverride(jsii.String("resource.aws_security_group.ec2_sg"), map[string]interface{}{
		"name":        "tap-ec2-sg-dev",
		"vpc_id":      "${aws_vpc.tap_vpc.id}",
		"description": "Security group for TAP EC2 instances with SSL/TLS enforcement",
		"ingress": []map[string]interface{}{
			{
				"description":      "HTTPS",
				"from_port":        443,
				"to_port":          443,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"10.0.0.0/16"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
			{
				"description":      "SSH",
				"from_port":        22,
				"to_port":          22,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"10.0.0.0/16"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
		},
		"egress": []map[string]interface{}{
			{
				"description":      "HTTPS outbound",
				"from_port":        443,
				"to_port":          443,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"0.0.0.0/0"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
			{
				"description":      "HTTP outbound for package updates",
				"from_port":        80,
				"to_port":          80,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"0.0.0.0/0"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
		},
		"tags": map[string]string{
			"Name": "tap-ec2-sg-dev",
		},
	})

	// Add EC2 instance
	stack.AddOverride(jsii.String("resource.aws_instance.app_instance"), map[string]interface{}{
		"ami":                     "${data.aws_ami.latest.id}",
		"instance_type":           "t3.micro",
		"subnet_id":               "${aws_subnet.private_subnet.id}",
		"vpc_security_group_ids":  []string{"${aws_security_group.ec2_sg.id}"},
		"iam_instance_profile":    "${aws_iam_instance_profile.ec2_profile.name}",
		"monitoring":              true,
		"disable_api_termination": true,
		"root_block_device": []map[string]interface{}{
			{
				"volume_type": "gp3",
				"volume_size": 20,
				"encrypted":   true,
				"kms_key_id":  "${aws_kms_key.tap_kms_key.arn}",
			},
		},
		"tags": map[string]string{
			"Name": "tap-ec2-instance-dev",
		},
	})

	// Add CloudTrail
	stack.AddOverride(jsii.String("resource.aws_cloudtrail.audit_trail"), map[string]interface{}{
		"name":                          "tap-cloudtrail-dev",
		"s3_bucket_name":                "${aws_s3_bucket.cloudtrail_bucket.id}",
		"include_global_service_events": true,
		"is_multi_region_trail":         true,
		"enable_log_file_validation":    true,
		"kms_key_id":                    "${aws_kms_key.tap_kms_key.arn}",
		"tags": map[string]string{
			"Name": "tap-cloudtrail-dev",
		},
	})

	// Add current AWS account data source
	stack.AddOverride(jsii.String("data.aws_caller_identity.current"), map[string]interface{}{})

	// Add required provider for random
	stack.AddOverride(jsii.String("terraform.required_providers.random"), map[string]interface{}{
		"source":  "hashicorp/random",
		"version": "~> 3.1",
	})

	app.Synth()

	return filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
}

// loadTerraformJSON loads and parses the synthesized Terraform JSON
func loadTerraformJSON(t *testing.T, path string) *TerraformManifest {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("Failed to read Terraform JSON: %v", err)
	}

	var manifest TerraformManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		t.Fatalf("Failed to parse Terraform JSON: %v", err)
	}

	return &manifest
}

// TestStackSynthesis tests that the stack synthesizes without errors
func TestStackSynthesis(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	// Verify the file exists
	if _, err := os.Stat(tfPath); os.IsNotExist(err) {
		t.Fatalf("Terraform JSON file was not created: %s", tfPath)
	}

	// Verify it's valid JSON
	manifest := loadTerraformJSON(t, tfPath)
	if manifest == nil {
		t.Fatal("Failed to load Terraform manifest")
	}
}

// TestVPCConfiguration tests VPC resource configuration
func TestVPCConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	vpc, exists := manifest.Resource["aws_vpc"]["tap_vpc"]
	if !exists {
		t.Fatal("VPC resource not found")
	}

	vpcConfig, ok := vpc.(map[string]interface{})
	if !ok {
		t.Fatal("VPC configuration not in expected format")
	}

	if vpcConfig["cidr_block"] != "10.0.0.0/16" {
		t.Errorf("Expected VPC CIDR 10.0.0.0/16, got %v", vpcConfig["cidr_block"])
	}

	if vpcConfig["enable_dns_hostnames"] != true {
		t.Error("Expected enable_dns_hostnames to be true")
	}

	if vpcConfig["enable_dns_support"] != true {
		t.Error("Expected enable_dns_support to be true")
	}
}

// TestSubnetConfiguration tests subnet resource configuration
func TestSubnetConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	subnet, exists := manifest.Resource["aws_subnet"]["private_subnet"]
	if !exists {
		t.Fatal("Private subnet resource not found")
	}

	subnetConfig, ok := subnet.(map[string]interface{})
	if !ok {
		t.Fatal("Subnet configuration not in expected format")
	}

	if subnetConfig["cidr_block"] != "10.0.1.0/24" {
		t.Errorf("Expected subnet CIDR 10.0.1.0/24, got %v", subnetConfig["cidr_block"])
	}

	if subnetConfig["availability_zone"] != "us-east-1a" {
		t.Errorf("Expected AZ us-east-1a, got %v", subnetConfig["availability_zone"])
	}

	if subnetConfig["vpc_id"] != "${aws_vpc.tap_vpc.id}" {
		t.Errorf("Expected subnet to reference VPC, got %v", subnetConfig["vpc_id"])
	}
}

// TestKMSKeyConfiguration tests KMS key resource configuration
func TestKMSKeyConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	kms, exists := manifest.Resource["aws_kms_key"]["tap_kms_key"]
	if !exists {
		t.Fatal("KMS key resource not found")
	}

	kmsConfig, ok := kms.(map[string]interface{})
	if !ok {
		t.Fatal("KMS configuration not in expected format")
	}

	if kmsConfig["description"] != "KMS key for TAP infrastructure encryption" {
		t.Errorf("Unexpected KMS description: %v", kmsConfig["description"])
	}

	if kmsConfig["key_usage"] != "ENCRYPT_DECRYPT" {
		t.Errorf("Expected key_usage ENCRYPT_DECRYPT, got %v", kmsConfig["key_usage"])
	}

	// Test KMS policy exists and contains CloudTrail permissions
	policy, ok := kmsConfig["policy"].(string)
	if !ok {
		t.Fatal("KMS policy not found or invalid type")
	}

	if !strings.Contains(policy, "cloudtrail.amazonaws.com") {
		t.Error("KMS policy should contain CloudTrail service permissions")
	}

	if !strings.Contains(policy, "kms:GenerateDataKey") {
		t.Error("KMS policy should contain GenerateDataKey permission")
	}
}

// TestSecurityGroupConfiguration tests security group configuration
func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	sg, exists := manifest.Resource["aws_security_group"]["ec2_sg"]
	if !exists {
		t.Fatal("Security group resource not found")
	}

	sgConfig, ok := sg.(map[string]interface{})
	if !ok {
		t.Fatal("Security group configuration not in expected format")
	}

	if sgConfig["name"] != "tap-ec2-sg-dev" {
		t.Errorf("Expected SG name 'tap-ec2-sg-dev', got %v", sgConfig["name"])
	}

	// Test ingress rules
	ingress, ok := sgConfig["ingress"].([]interface{})
	if !ok {
		t.Fatal("Security group ingress rules not found or invalid type")
	}

	if len(ingress) != 2 {
		t.Errorf("Expected 2 ingress rules, got %d", len(ingress))
	}

	// Test egress rules
	egress, ok := sgConfig["egress"].([]interface{})
	if !ok {
		t.Fatal("Security group egress rules not found or invalid type")
	}

	if len(egress) != 2 {
		t.Errorf("Expected 2 egress rules, got %d", len(egress))
	}
}

// TestIAMRoleConfiguration tests IAM role configuration
func TestIAMRoleConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	role, exists := manifest.Resource["aws_iam_role"]["ec2_role"]
	if !exists {
		t.Fatal("IAM role resource not found")
	}

	roleConfig, ok := role.(map[string]interface{})
	if !ok {
		t.Fatal("IAM role configuration not in expected format")
	}

	if roleConfig["name"] != "tap-ec2-role-dev" {
		t.Errorf("Expected IAM role name 'tap-ec2-role-dev', got %v", roleConfig["name"])
	}

	// Test assume role policy
	assumePolicy, ok := roleConfig["assume_role_policy"].(string)
	if !ok {
		t.Fatal("IAM role assume_role_policy not found or invalid type")
	}

	if !strings.Contains(assumePolicy, "ec2.amazonaws.com") {
		t.Error("Assume role policy should allow EC2 service")
	}
}

// TestEncryptionConfiguration tests encryption settings
func TestEncryptionConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	// Test S3 bucket encryption
	encryption, exists := manifest.Resource["aws_s3_bucket_server_side_encryption_configuration"]["tap_bucket_encryption"]
	if !exists {
		t.Fatal("S3 bucket encryption configuration not found")
	}

	encryptionConfig, ok := encryption.(map[string]interface{})
	if !ok {
		t.Fatal("Encryption configuration not in expected format")
	}

	rules, ok := encryptionConfig["rule"].([]interface{})
	if !ok || len(rules) == 0 {
		t.Fatal("S3 encryption rules not found or empty")
	}

	rule := rules[0].(map[string]interface{})
	encryptionSettings := rule["apply_server_side_encryption_by_default"].(map[string]interface{})

	if encryptionSettings["sse_algorithm"] != "aws:kms" {
		t.Errorf("Expected SSE algorithm 'aws:kms', got %v", encryptionSettings["sse_algorithm"])
	}

	// Test EC2 root volume encryption
	ec2, exists := manifest.Resource["aws_instance"]["app_instance"]
	if !exists {
		t.Fatal("EC2 instance resource not found")
	}

	ec2Config, ok := ec2.(map[string]interface{})
	if !ok {
		t.Fatal("EC2 configuration not in expected format")
	}

	rootDevice, ok := ec2Config["root_block_device"].([]interface{})
	if !ok || len(rootDevice) == 0 {
		t.Fatal("EC2 root block device not found")
	}

	device := rootDevice[0].(map[string]interface{})
	if device["encrypted"] != true {
		t.Error("Expected EC2 root volume to be encrypted")
	}
}

// TestCloudTrailConfiguration tests CloudTrail configuration
func TestCloudTrailConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	cloudtrail, exists := manifest.Resource["aws_cloudtrail"]["audit_trail"]
	if !exists {
		t.Fatal("CloudTrail resource not found")
	}

	cloudtrailConfig, ok := cloudtrail.(map[string]interface{})
	if !ok {
		t.Fatal("CloudTrail configuration not in expected format")
	}

	if cloudtrailConfig["name"] != "tap-cloudtrail-dev" {
		t.Errorf("Expected CloudTrail name 'tap-cloudtrail-dev', got %v", cloudtrailConfig["name"])
	}

	if cloudtrailConfig["is_multi_region_trail"] != true {
		t.Error("Expected CloudTrail to be multi-region")
	}

	if cloudtrailConfig["enable_log_file_validation"] != true {
		t.Error("Expected CloudTrail log file validation to be enabled")
	}

	if cloudtrailConfig["include_global_service_events"] != true {
		t.Error("Expected CloudTrail to include global service events")
	}
}

// TestProviderConfiguration tests AWS provider configuration
func TestProviderConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	// Test Terraform required providers
	terraform, exists := manifest.Terraform["required_providers"]
	if !exists {
		t.Fatal("Required providers not found in terraform block")
	}

	providers, ok := terraform.(map[string]interface{})
	if !ok {
		t.Fatal("Required providers not in expected format")
	}

	// Test AWS provider
	awsProvider, exists := providers["aws"]
	if !exists {
		t.Fatal("AWS provider not found in required providers")
	}

	awsConfig, ok := awsProvider.(map[string]interface{})
	if !ok {
		t.Fatal("AWS provider config not in expected format")
	}

	if awsConfig["source"] != "hashicorp/aws" {
		t.Errorf("Expected AWS provider source 'hashicorp/aws', got %v", awsConfig["source"])
	}

	if awsConfig["version"] != "~> 6.0" {
		t.Errorf("Expected AWS provider version '~> 6.0', got %v", awsConfig["version"])
	}
}

// TestResourceTags tests that all resources have appropriate tags
func TestResourceTags(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	manifest := loadTerraformJSON(t, tfPath)

	// List of resources that should have tags
	resourcesWithTags := [][]string{
		{"aws_vpc", "tap_vpc"},
		{"aws_subnet", "private_subnet"},
		{"aws_kms_key", "tap_kms_key"},
		{"aws_s3_bucket", "tap_bucket"},
		{"aws_iam_role", "ec2_role"},
		{"aws_instance", "app_instance"},
		{"aws_cloudtrail", "audit_trail"},
	}

	for _, resource := range resourcesWithTags {
		resourceType, resourceName := resource[0], resource[1]

		res, exists := manifest.Resource[resourceType][resourceName]
		if !exists {
			t.Errorf("Resource %s.%s not found", resourceType, resourceName)
			continue
		}

		resConfig, ok := res.(map[string]interface{})
		if !ok {
			t.Errorf("Resource %s.%s configuration not in expected format", resourceType, resourceName)
			continue
		}

		tags, ok := resConfig["tags"]
		if !ok {
			t.Errorf("Resource %s.%s missing tags", resourceType, resourceName)
			continue
		}

		tagMap, ok := tags.(map[string]interface{})
		if !ok {
			t.Errorf("Resource %s.%s tags not in expected format", resourceType, resourceName)
			continue
		}

		// Check that Name tag exists
		if _, hasName := tagMap["Name"]; !hasName {
			t.Errorf("Resource %s.%s missing Name tag", resourceType, resourceName)
		}
	}
}
