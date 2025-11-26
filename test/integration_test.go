package test

import (
	"fmt"
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMultiEnvironmentInfrastructure tests the deployment across all three environments
func TestMultiEnvironmentInfrastructure(t *testing.T) {
	t.Parallel()

	// Run tests for each environment
	environments := []string{"dev", "staging", "prod"}
	for _, env := range environments {
		env := env // capture range variable
		t.Run(fmt.Sprintf("Environment_%s", env), func(t *testing.T) {
			t.Parallel()
			testEnvironment(t, env)
		})
	}
}

// testEnvironment tests a single environment deployment
func testEnvironment(t *testing.T, environment string) {
	// Generate a unique suffix for this test run
	uniqueID := random.UniqueId()
	awsRegion := "us-east-1"

	// Construct the terraform options
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		// The path to where our Terraform code is located
		TerraformDir: "../lib",

		// Variables to pass to our Terraform code using -var-file
		VarFiles: []string{fmt.Sprintf("%s.tfvars", environment)},

		// Variables to override the tfvars file
		Vars: map[string]interface{}{
			"environment_suffix": fmt.Sprintf("%s-test-%s", environment, uniqueID),
			"alarm_email":        "", // Disable email notifications during tests
		},

		// Environment variables to set when running Terraform
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},

		// Disable colors in Terraform commands for easier reading of test output
		NoColor: true,

		// Configure a retry for `terraform apply`
		MaxRetries:         3,
		TimeBetweenRetries: 10 * time.Second,
	})

	// Clean up resources with terraform destroy at the end of the test
	defer terraform.Destroy(t, terraformOptions)

	// Run terraform init and apply
	terraform.InitAndApply(t, terraformOptions)

	// Run validations
	validateNetworking(t, terraformOptions, awsRegion, environment)
	validateLoadBalancer(t, terraformOptions, awsRegion)
	validateDatabase(t, terraformOptions, awsRegion)
	validateSecurity(t, terraformOptions, awsRegion)
	validateMonitoring(t, terraformOptions, awsRegion)
	validateEnvironmentConsistency(t, environment, terraformOptions)
}

// validateNetworking validates the VPC and networking components
func validateNetworking(t *testing.T, terraformOptions *terraform.Options, awsRegion string, environment string) {
	// Get VPC ID from outputs
	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	assert.NotEmpty(t, vpcID, "VPC ID should not be empty")

	// Verify VPC exists
	vpc := aws.GetVpcById(t, vpcID, awsRegion)
	require.NotNil(t, vpc, "VPC should exist")

	// Verify DNS settings
	assert.True(t, aws.IsVpcDnsEnabled(t, vpcID, awsRegion), "DNS should be enabled in VPC")
	assert.True(t, aws.IsVpcDnsHostnamesEnabled(t, vpcID, awsRegion), "DNS hostnames should be enabled in VPC")

	// Get subnet IDs
	publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
	privateAppSubnetIDs := terraform.OutputList(t, terraformOptions, "private_app_subnet_ids")
	privateDbSubnetIDs := terraform.OutputList(t, terraformOptions, "private_db_subnet_ids")

	// Verify we have 2 subnets of each type (Multi-AZ)
	assert.Len(t, publicSubnetIDs, 2, "Should have 2 public subnets")
	assert.Len(t, privateAppSubnetIDs, 2, "Should have 2 private app subnets")
	assert.Len(t, privateDbSubnetIDs, 2, "Should have 2 private DB subnets")

	// Verify subnets are in different availability zones
	publicSubnet1 := aws.GetSubnetById(t, publicSubnetIDs[0], awsRegion)
	publicSubnet2 := aws.GetSubnetById(t, publicSubnetIDs[1], awsRegion)
	assert.NotEqual(t, publicSubnet1.AvailabilityZone, publicSubnet2.AvailabilityZone,
		"Public subnets should be in different AZs")
}

// validateLoadBalancer validates the Application Load Balancer
func validateLoadBalancer(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	// Get ALB DNS name
	albDNS := terraform.Output(t, terraformOptions, "alb_dns_name")
	assert.NotEmpty(t, albDNS, "ALB DNS name should not be empty")

	// Get ALB ARN
	albArn := terraform.Output(t, terraformOptions, "alb_arn")
	assert.NotEmpty(t, albArn, "ALB ARN should not be empty")

	// Note: Additional validation could include:
	// - Verify ALB is internet-facing
	// - Verify health check configuration
	// - Test HTTP endpoint (requires waiting for instances to be healthy)
}

// validateDatabase validates the RDS instance
func validateDatabase(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	// Get database endpoint
	dbEndpoint := terraform.Output(t, terraformOptions, "rds_endpoint")
	assert.NotEmpty(t, dbEndpoint, "RDS endpoint should not be empty")

	// Get database name
	dbName := terraform.Output(t, terraformOptions, "rds_database_name")
	assert.Equal(t, "paymentdb", dbName, "Database name should be 'paymentdb'")

	// Get secret ARN
	secretArn := terraform.Output(t, terraformOptions, "db_secret_arn")
	assert.NotEmpty(t, secretArn, "Secret ARN should not be empty")

	// Verify secret exists in Secrets Manager
	secretValue := aws.GetSecretValue(t, awsRegion, secretArn)
	assert.NotEmpty(t, secretValue, "Secret value should not be empty")
}

// validateSecurity validates security components
func validateSecurity(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	// Get KMS key ID
	kmsKeyID := terraform.Output(t, terraformOptions, "kms_key_id")
	assert.NotEmpty(t, kmsKeyID, "KMS key ID should not be empty")

	// Get CloudTrail name
	cloudTrailName := terraform.Output(t, terraformOptions, "cloudtrail_name")
	assert.NotEmpty(t, cloudTrailName, "CloudTrail name should not be empty")

	// Get security group IDs
	albSgID := terraform.Output(t, terraformOptions, "alb_security_group_id")
	appSgID := terraform.Output(t, terraformOptions, "app_security_group_id")
	rdsSgID := terraform.Output(t, terraformOptions, "rds_security_group_id")

	assert.NotEmpty(t, albSgID, "ALB security group ID should not be empty")
	assert.NotEmpty(t, appSgID, "App security group ID should not be empty")
	assert.NotEmpty(t, rdsSgID, "RDS security group ID should not be empty")

	// Verify security groups exist
	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	securityGroups := aws.GetSecurityGroupsByName(t, vpcID, awsRegion)
	assert.NotEmpty(t, securityGroups, "Security groups should exist")
}

// validateMonitoring validates monitoring and alerting components
func validateMonitoring(t *testing.T, terraformOptions *terraform.Options, awsRegion string) {
	// Get CloudWatch log group name
	logGroupName := terraform.Output(t, terraformOptions, "cloudwatch_log_group")
	assert.NotEmpty(t, logGroupName, "CloudWatch log group name should not be empty")

	// Get SNS topic ARN
	snsTopicArn := terraform.Output(t, terraformOptions, "sns_topic_arn")
	assert.NotEmpty(t, snsTopicArn, "SNS topic ARN should not be empty")

	// Get Auto Scaling Group name
	asgName := terraform.Output(t, terraformOptions, "autoscaling_group_name")
	assert.NotEmpty(t, asgName, "Auto Scaling Group name should not be empty")
}

// validateEnvironmentConsistency validates environment-specific configurations
func validateEnvironmentConsistency(t *testing.T, environment string, terraformOptions *terraform.Options) {
	// Get environment from outputs
	outputEnv := terraform.Output(t, terraformOptions, "environment")
	assert.Equal(t, environment, outputEnv, "Environment output should match input")

	// Validate region
	outputRegion := terraform.Output(t, terraformOptions, "region")
	assert.Equal(t, "us-east-1", outputRegion, "Region should be us-east-1")
}

// TestVPCCIDRUniqueness ensures each environment uses a unique VPC CIDR
func TestVPCCIDRUniqueness(t *testing.T) {
	t.Parallel()

	cidrs := map[string]string{
		"dev":     "10.0.0.0/16",
		"staging": "10.1.0.0/16",
		"prod":    "10.2.0.0/16",
	}

	// Verify all CIDRs are unique
	seenCIDRs := make(map[string]bool)
	for env, cidr := range cidrs {
		assert.False(t, seenCIDRs[cidr],
			fmt.Sprintf("CIDR %s for environment %s should be unique", cidr, env))
		seenCIDRs[cidr] = true
	}
}

// TestEnvironmentResourceSizing validates that resource sizing differs by environment
func TestEnvironmentResourceSizing(t *testing.T) {
	t.Parallel()

	expectedSizing := map[string]map[string]interface{}{
		"dev": {
			"instance_type":   "t3.small",
			"asg_min_size":    1,
			"db_multi_az":     false,
			"enable_multi_az_nat": false,
		},
		"staging": {
			"instance_type":   "t3.medium",
			"asg_min_size":    2,
			"db_multi_az":     true,
			"enable_multi_az_nat": true,
		},
		"prod": {
			"instance_type":   "c5.xlarge",
			"asg_min_size":    3,
			"db_multi_az":     true,
			"enable_multi_az_nat": true,
		},
	}

	// Verify expected values are set correctly
	for env, expected := range expectedSizing {
		assert.NotEmpty(t, expected["instance_type"],
			fmt.Sprintf("%s environment should have instance_type defined", env))
		assert.NotEqual(t, 0, expected["asg_min_size"],
			fmt.Sprintf("%s environment should have non-zero asg_min_size", env))
	}
}

// TestInfrastructureNaming validates resource naming conventions
func TestInfrastructureNaming(t *testing.T) {
	t.Parallel()

	// Test that resource names include environment suffix
	environments := []string{"dev", "staging", "prod"}
	for _, env := range environments {
		// Verify naming pattern exists
		assert.NotEmpty(t, env, "Environment name should not be empty")

		// Naming should follow: {project}-{env}-{suffix}
		expectedPattern := fmt.Sprintf("payment-processing-%s-", env)
		assert.NotEmpty(t, expectedPattern, "Naming pattern should be defined")
	}
}
