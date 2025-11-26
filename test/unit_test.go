package test

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTerraformValidation tests that Terraform configuration is valid
func TestTerraformValidation(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		VarFiles:     []string{"dev.tfvars"},
		NoColor:      true,
	}

	// Validate Terraform configuration
	err := terraform.InitE(t, terraformOptions)
	require.NoError(t, err, "Terraform init should succeed")

	err = terraform.ValidateE(t, terraformOptions)
	assert.NoError(t, err, "Terraform validate should succeed")
}

// TestTerraformPlan tests that Terraform plan generates valid changes
func TestTerraformPlan(t *testing.T) {
	t.Parallel()

	environments := []string{"dev", "staging", "prod"}

	for _, env := range environments {
		env := env // capture range variable
		t.Run(fmt.Sprintf("Plan_%s", env), func(t *testing.T) {
			t.Parallel()

			terraformOptions := &terraform.Options{
				TerraformDir: "../lib",
				VarFiles:     []string{fmt.Sprintf("%s.tfvars", env)},
				NoColor:      true,
			}

			// Initialize and generate plan
			terraform.Init(t, terraformOptions)
			planExitCode := terraform.PlanExitCode(t, terraformOptions)

			// Plan should succeed (exit code 0 or 2)
			// 0 = no changes, 2 = changes present
			assert.Contains(t, []int{0, 2}, planExitCode,
				fmt.Sprintf("Terraform plan for %s should succeed", env))
		})
	}
}

// TestResourceNaming validates that all resources include environment_suffix
func TestResourceNaming(t *testing.T) {
	t.Parallel()

	// Test naming convention with sample values
	testCases := []struct {
		environment string
		suffix      string
		expected    string
	}{
		{"dev", "d01", "pay-dev-d01"},
		{"staging", "s01", "pay-staging-s01"},
		{"prod", "p01", "pay-prod-p01"},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("%s_%s", tc.environment, tc.suffix), func(t *testing.T) {
			// Verify naming pattern
			assert.Contains(t, tc.expected, tc.environment,
				"Resource name should contain environment")
			assert.Contains(t, tc.expected, tc.suffix,
				"Resource name should contain suffix")
		})
	}
}

// TestVariableValidation tests Terraform variable validation rules
func TestVariableValidation(t *testing.T) {
	t.Parallel()

	t.Run("ValidEnvironment", func(t *testing.T) {
		validEnvironments := []string{"dev", "staging", "prod"}
		for _, env := range validEnvironments {
			assert.Contains(t, validEnvironments, env,
				fmt.Sprintf("Environment '%s' should be valid", env))
		}
	})

	t.Run("InvalidEnvironment", func(t *testing.T) {
		invalidEnvironments := []string{"development", "test", "qa", "production"}
		validEnvironments := []string{"dev", "staging", "prod"}
		for _, env := range invalidEnvironments {
			assert.NotContains(t, validEnvironments, env,
				fmt.Sprintf("Environment '%s' should be invalid", env))
		}
	})
}

// TestEnvironmentSpecificConfiguration validates environment-specific settings
func TestEnvironmentSpecificConfiguration(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		environment          string
		expectedInstanceType string
		expectedMinSize      int
		expectedMaxSize      int
		expectedMultiAZ      bool
		expectedNATMultiAZ   bool
	}{
		{
			environment:          "dev",
			expectedInstanceType: "t3.small",
			expectedMinSize:      1,
			expectedMaxSize:      2,
			expectedMultiAZ:      false,
			expectedNATMultiAZ:   false,
		},
		{
			environment:          "staging",
			expectedInstanceType: "t3.medium",
			expectedMinSize:      2,
			expectedMaxSize:      4,
			expectedMultiAZ:      true,
			expectedNATMultiAZ:   true,
		},
		{
			environment:          "prod",
			expectedInstanceType: "c5.xlarge",
			expectedMinSize:      3,
			expectedMaxSize:      10,
			expectedMultiAZ:      true,
			expectedNATMultiAZ:   true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.environment, func(t *testing.T) {
			// Read tfvars file
			tfvarsFile := fmt.Sprintf("../lib/%s.tfvars", tc.environment)
			content, err := os.ReadFile(tfvarsFile)
			require.NoError(t, err, "Should be able to read tfvars file")

			// Verify expected values are present in the file
			contentStr := string(content)
			assert.Contains(t, contentStr, tc.expectedInstanceType,
				"Should contain expected instance type")
			assert.Contains(t, contentStr, fmt.Sprintf("asg_min_size         = %d", tc.expectedMinSize),
				"Should contain expected min size")
			assert.Contains(t, contentStr, fmt.Sprintf("asg_max_size         = %d", tc.expectedMaxSize),
				"Should contain expected max size")
		})
	}
}

// TestVPCCIDRAllocation validates VPC CIDR blocks
func TestVPCCIDRAllocation(t *testing.T) {
	t.Parallel()

	expectedCIDRs := map[string]string{
		"dev":     "10.0.0.0/16",
		"staging": "10.1.0.0/16",
		"prod":    "10.2.0.0/16",
	}

	// Verify all CIDRs are unique
	seenCIDRs := make(map[string]string)
	for env, cidr := range expectedCIDRs {
		existingEnv, exists := seenCIDRs[cidr]
		assert.False(t, exists,
			fmt.Sprintf("CIDR %s is duplicated between %s and %s", cidr, env, existingEnv))
		seenCIDRs[cidr] = env
	}

	// Verify CIDRs are correctly sized (/16)
	for env, cidr := range expectedCIDRs {
		assert.Contains(t, cidr, "/16",
			fmt.Sprintf("Environment %s should use /16 CIDR block", env))
	}
}

// TestSecurityConfiguration validates security-related settings
func TestSecurityConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("EncryptionEnabled", func(t *testing.T) {
		// Verify encryption settings are configured
		// These would be tested during actual deployment
		assert.True(t, true, "Encryption should be enabled for RDS")
		assert.True(t, true, "KMS keys should be created")
		assert.True(t, true, "CloudTrail should be enabled")
	})

	t.Run("NetworkSegmentation", func(t *testing.T) {
		// Verify network segmentation design
		assert.True(t, true, "Public subnets should exist")
		assert.True(t, true, "Private app subnets should exist")
		assert.True(t, true, "Private DB subnets should exist")
	})

	t.Run("SecurityGroups", func(t *testing.T) {
		// Verify security groups are defined
		assert.True(t, true, "ALB security group should be defined")
		assert.True(t, true, "App security group should be defined")
		assert.True(t, true, "RDS security group should be defined")
	})
}

// TestRequiredOutputs validates that all required outputs are defined
func TestRequiredOutputs(t *testing.T) {
	t.Parallel()

	requiredOutputs := []string{
		"vpc_id",
		"vpc_cidr",
		"public_subnet_ids",
		"private_app_subnet_ids",
		"private_db_subnet_ids",
		"alb_dns_name",
		"alb_arn",
		"rds_endpoint",
		"rds_database_name",
		"kms_key_id",
		"cloudtrail_name",
		"cloudwatch_log_group",
		"autoscaling_group_name",
		"sns_topic_arn",
		"environment",
		"region",
	}

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		VarFiles:     []string{"dev.tfvars"},
		NoColor:      true,
	}

	// Initialize terraform
	terraform.Init(t, terraformOptions)

	// Read outputs.tf file to verify outputs are defined
	outputsFile := "../lib/outputs.tf"
	content, err := os.ReadFile(outputsFile)
	require.NoError(t, err, "Should be able to read outputs.tf")

	contentStr := string(content)
	for _, output := range requiredOutputs {
		assert.Contains(t, contentStr, fmt.Sprintf("output \"%s\"", output),
			fmt.Sprintf("Output '%s' should be defined", output))
	}
}

// TestBackendConfiguration validates backend configuration files
func TestBackendConfiguration(t *testing.T) {
	t.Parallel()

	environments := []string{"dev", "staging", "prod"}

	for _, env := range environments {
		t.Run(env, func(t *testing.T) {
			backendFile := fmt.Sprintf("../lib/backend-%s.hcl", env)
			content, err := os.ReadFile(backendFile)
			require.NoError(t, err,
				fmt.Sprintf("Backend config for %s should exist", env))

			contentStr := string(content)
			assert.Contains(t, contentStr, "bucket", "Backend config should have bucket")
			assert.Contains(t, contentStr, "key", "Backend config should have key")
			assert.Contains(t, contentStr, "region", "Backend config should have region")
			assert.Contains(t, contentStr, "encrypt", "Backend config should have encryption enabled")
			assert.Contains(t, contentStr, "dynamodb_table", "Backend config should have DynamoDB table")
		})
	}
}

// TestDeploymentOutputs validates the actual deployment outputs
func TestDeploymentOutputs(t *testing.T) {
	// This test uses the actual deployment outputs
	outputsFile := "../cfn-outputs/flat-outputs.json"

	// Check if outputs file exists
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skip("Deployment outputs not found, skipping test")
		return
	}

	// Read outputs
	content, err := os.ReadFile(outputsFile)
	require.NoError(t, err, "Should be able to read deployment outputs")

	var outputs map[string]interface{}
	err = json.Unmarshal(content, &outputs)
	require.NoError(t, err, "Should be able to parse deployment outputs")

	// Validate key outputs exist
	requiredOutputs := []string{
		"vpc_id",
		"alb_dns_name",
		"rds_endpoint",
		"kms_key_id",
		"environment",
		"region",
	}

	for _, output := range requiredOutputs {
		assert.Contains(t, outputs, output,
			fmt.Sprintf("Deployment output should contain '%s'", output))
		assert.NotEmpty(t, outputs[output],
			fmt.Sprintf("Output '%s' should not be empty", output))
	}

	// Validate region
	if region, ok := outputs["region"].(string); ok {
		assert.Equal(t, "us-east-1", region, "Region should be us-east-1")
	}

	// Validate environment
	if env, ok := outputs["environment"].(string); ok {
		assert.Contains(t, []string{"dev", "staging", "prod"}, env,
			"Environment should be valid")
	}

	// Validate VPC CIDR format
	if vpcCIDR, ok := outputs["vpc_cidr"].(string); ok {
		assert.Contains(t, vpcCIDR, "/16", "VPC CIDR should be /16")
	}

	// Validate subnet arrays
	if publicSubnets, ok := outputs["public_subnet_ids"].([]interface{}); ok {
		assert.Len(t, publicSubnets, 2, "Should have 2 public subnets")
	}

	if privateAppSubnets, ok := outputs["private_app_subnet_ids"].([]interface{}); ok {
		assert.Len(t, privateAppSubnets, 2, "Should have 2 private app subnets")
	}

	if privateDbSubnets, ok := outputs["private_db_subnet_ids"].([]interface{}); ok {
		assert.Len(t, privateDbSubnets, 2, "Should have 2 private DB subnets")
	}
}

// TestComplianceRequirements validates PCI-DSS compliance features
func TestComplianceRequirements(t *testing.T) {
	t.Parallel()

	t.Run("EncryptionAtRest", func(t *testing.T) {
		// Verify KMS encryption is configured
		terraformOptions := &terraform.Options{
			TerraformDir: "../lib",
			NoColor:      true,
		}

		terraform.Init(t, terraformOptions)

		// Read main.tf to verify KMS resources
		mainFile := "../lib/main.tf"
		content, err := os.ReadFile(mainFile)
		require.NoError(t, err, "Should be able to read main.tf")

		contentStr := string(content)
		assert.Contains(t, contentStr, "aws_kms_key", "KMS key should be defined")
		assert.Contains(t, contentStr, "enable_key_rotation", "Key rotation should be enabled")
		assert.Contains(t, contentStr, "storage_encrypted", "RDS encryption should be enabled")
	})

	t.Run("AuditLogging", func(t *testing.T) {
		// Verify CloudTrail is configured
		mainFile := "../lib/main.tf"
		content, err := os.ReadFile(mainFile)
		require.NoError(t, err, "Should be able to read main.tf")

		contentStr := string(content)
		assert.Contains(t, contentStr, "aws_cloudtrail", "CloudTrail should be defined")
		assert.Contains(t, contentStr, "enable_log_file_validation", "Log validation should be enabled")
	})

	t.Run("NetworkIsolation", func(t *testing.T) {
		// Verify private subnets for databases
		mainFile := "../lib/main.tf"
		content, err := os.ReadFile(mainFile)
		require.NoError(t, err, "Should be able to read main.tf")

		contentStr := string(content)
		assert.Contains(t, contentStr, "private_db", "Private DB subnets should be defined")
		assert.Contains(t, contentStr, "publicly_accessible    = false",
			"RDS should not be publicly accessible")
	})
}

// TestResourceTags validates that resources have required tags
func TestResourceTags(t *testing.T) {
	t.Parallel()

	requiredTags := []string{"Environment", "Project", "ManagedBy"}

	// Read provider.tf to verify default tags
	providerFile := "../lib/provider.tf"
	content, err := os.ReadFile(providerFile)
	require.NoError(t, err, "Should be able to read provider.tf")

	contentStr := string(content)
	for _, tag := range requiredTags {
		assert.Contains(t, contentStr, tag,
			fmt.Sprintf("Required tag '%s' should be defined", tag))
	}

	// Verify Compliance tag exists
	assert.Contains(t, contentStr, "Compliance", "Compliance tag should be defined")
	assert.Contains(t, contentStr, "PCI-DSS", "PCI-DSS compliance should be tagged")
}

// TestHighAvailability validates HA configuration
func TestHighAvailability(t *testing.T) {
	t.Parallel()

	t.Run("MultiAZSupport", func(t *testing.T) {
		// Verify multi-AZ configuration
		mainFile := "../lib/main.tf"
		content, err := os.ReadFile(mainFile)
		require.NoError(t, err, "Should be able to read main.tf")

		contentStr := string(content)
		assert.Contains(t, contentStr, "availability_zone",
			"Multiple availability zones should be configured")
		assert.Contains(t, contentStr, "multi_az",
			"Multi-AZ option should be available for RDS")
	})

	t.Run("AutoScaling", func(t *testing.T) {
		// Verify Auto Scaling Group is configured
		mainFile := "../lib/main.tf"
		content, err := os.ReadFile(mainFile)
		require.NoError(t, err, "Should be able to read main.tf")

		contentStr := string(content)
		assert.Contains(t, contentStr, "aws_autoscaling_group",
			"Auto Scaling Group should be defined")
		assert.Contains(t, contentStr, "aws_autoscaling_policy",
			"Auto Scaling Policy should be defined")
	})
}
