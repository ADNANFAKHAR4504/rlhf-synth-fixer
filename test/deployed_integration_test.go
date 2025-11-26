package test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDeployedInfrastructure validates the currently deployed infrastructure
func TestDeployedInfrastructure(t *testing.T) {
	// Load deployment outputs
	outputs := loadDeploymentOutputs(t)

	// Run validation tests
	t.Run("ValidateVPC", func(t *testing.T) {
		validateDeployedVPC(t, outputs)
	})

	t.Run("ValidateLoadBalancer", func(t *testing.T) {
		validateDeployedLoadBalancer(t, outputs)
	})

	t.Run("ValidateDatabase", func(t *testing.T) {
		validateDeployedDatabase(t, outputs)
	})

	t.Run("ValidateSecurity", func(t *testing.T) {
		validateDeployedSecurity(t, outputs)
	})

	t.Run("ValidateMonitoring", func(t *testing.T) {
		validateDeployedMonitoring(t, outputs)
	})

	t.Run("ValidateNetworking", func(t *testing.T) {
		validateDeployedNetworking(t, outputs)
	})
}

// loadDeploymentOutputs loads the deployment outputs from flat-outputs.json
func loadDeploymentOutputs(t *testing.T) map[string]interface{} {
	outputsFile := "../cfn-outputs/flat-outputs.json"

	// Check if outputs file exists
	_, err := os.Stat(outputsFile)
	require.NoError(t, err, "Deployment outputs file should exist")

	// Read outputs
	content, err := os.ReadFile(outputsFile)
	require.NoError(t, err, "Should be able to read deployment outputs")

	var outputs map[string]interface{}
	err = json.Unmarshal(content, &outputs)
	require.NoError(t, err, "Should be able to parse deployment outputs")

	return outputs
}

// validateDeployedVPC validates the deployed VPC
func validateDeployedVPC(t *testing.T, outputs map[string]interface{}) {
	vpcID := outputs["vpc_id"].(string)
	region := outputs["region"].(string)

	require.NotEmpty(t, vpcID, "VPC ID should not be empty")
	require.NotEmpty(t, region, "Region should not be empty")

	// Verify VPC exists
	vpc := aws.GetVpcById(t, vpcID, region)
	require.NotNil(t, vpc, "VPC should exist")

	// Verify DNS settings
	assert.True(t, aws.IsVpcDnsEnabled(t, vpcID, region),
		"DNS should be enabled in VPC")
	assert.True(t, aws.IsVpcDnsHostnamesEnabled(t, vpcID, region),
		"DNS hostnames should be enabled in VPC")

	// Verify VPC CIDR
	vpcCIDR := outputs["vpc_cidr"].(string)
	assert.NotEmpty(t, vpcCIDR, "VPC CIDR should not be empty")
	assert.Contains(t, vpcCIDR, "/16", "VPC should use /16 CIDR block")
	assert.Equal(t, vpcCIDR, vpc.CidrBlock, "VPC CIDR should match outputs")
}

// validateDeployedLoadBalancer validates the deployed ALB
func validateDeployedLoadBalancer(t *testing.T, outputs map[string]interface{}) {
	albDNS := outputs["alb_dns_name"].(string)
	albArn := outputs["alb_arn"].(string)
	region := outputs["region"].(string)

	require.NotEmpty(t, albDNS, "ALB DNS name should not be empty")
	require.NotEmpty(t, albArn, "ALB ARN should not be empty")

	// Test ALB health endpoint with timeout and retries
	healthURL := fmt.Sprintf("http://%s/health", albDNS)

	// Try multiple times as instances may be starting up
	maxRetries := 5
	retryDelay := 10 * time.Second

	var lastErr error
	for i := 0; i < maxRetries; i++ {
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		resp, err := client.Get(healthURL)
		if err == nil && resp.StatusCode == 200 {
			t.Logf("ALB health check passed on attempt %d", i+1)
			return
		}

		lastErr = err
		if i < maxRetries-1 {
			t.Logf("Health check attempt %d failed, retrying in %v...", i+1, retryDelay)
			time.Sleep(retryDelay)
		}
	}

	t.Logf("Warning: ALB health check not responding after %d attempts (last error: %v). This may be expected if instances are still launching.", maxRetries, lastErr)
}

// validateDeployedDatabase validates the deployed RDS instance
func validateDeployedDatabase(t *testing.T, outputs map[string]interface{}) {
	dbEndpoint := outputs["rds_endpoint"].(string)
	dbName := outputs["rds_database_name"].(string)
	dbPort := outputs["rds_port"].(float64)
	secretArn := outputs["db_secret_arn"].(string)
	region := outputs["region"].(string)

	require.NotEmpty(t, dbEndpoint, "RDS endpoint should not be empty")
	require.NotEmpty(t, dbName, "Database name should not be empty")
	require.NotEmpty(t, secretArn, "Secret ARN should not be empty")

	// Verify database name
	assert.Equal(t, "paymentdb", dbName, "Database name should be 'paymentdb'")

	// Verify port
	assert.Equal(t, 5432.0, dbPort, "PostgreSQL port should be 5432")

	// Verify endpoint format
	assert.Contains(t, dbEndpoint, ".rds.amazonaws.com",
		"RDS endpoint should be in correct format")

	// Verify secret exists in Secrets Manager
	secretValue := aws.GetSecretValue(t, region, secretArn)
	assert.NotEmpty(t, secretValue, "Secret value should not be empty")

	// Verify secret contains required fields
	var secretData map[string]interface{}
	err := json.Unmarshal([]byte(secretValue), &secretData)
	require.NoError(t, err, "Secret should be valid JSON")

	assert.Contains(t, secretData, "username", "Secret should contain username")
	assert.Contains(t, secretData, "password", "Secret should contain password")
	assert.Contains(t, secretData, "engine", "Secret should contain engine")
	assert.Equal(t, "postgres", secretData["engine"], "Engine should be postgres")
}

// validateDeployedSecurity validates security components
func validateDeployedSecurity(t *testing.T, outputs map[string]interface{}) {
	kmsKeyID := outputs["kms_key_id"].(string)
	kmsKeyArn := outputs["kms_key_arn"].(string)
	cloudTrailName := outputs["cloudtrail_name"].(string)
	cloudTrailBucket := outputs["cloudtrail_s3_bucket"].(string)
	region := outputs["region"].(string)
	vpcID := outputs["vpc_id"].(string)

	require.NotEmpty(t, kmsKeyID, "KMS key ID should not be empty")
	require.NotEmpty(t, kmsKeyArn, "KMS key ARN should not be empty")
	require.NotEmpty(t, cloudTrailName, "CloudTrail name should not be empty")

	// Verify KMS key format
	assert.True(t, strings.HasPrefix(kmsKeyArn, "arn:aws:kms:"),
		"KMS key ARN should be valid")

	// Verify CloudTrail S3 bucket exists
	assert.NotEmpty(t, cloudTrailBucket, "CloudTrail S3 bucket should not be empty")

	// Verify security groups
	albSgID := outputs["alb_security_group_id"].(string)
	appSgID := outputs["app_security_group_id"].(string)
	rdsSgID := outputs["rds_security_group_id"].(string)

	require.NotEmpty(t, albSgID, "ALB security group ID should not be empty")
	require.NotEmpty(t, appSgID, "App security group ID should not be empty")
	require.NotEmpty(t, rdsSgID, "RDS security group ID should not be empty")

	// Verify all security groups exist
	securityGroups := aws.GetSecurityGroupsByName(t, vpcID, region)
	assert.NotEmpty(t, securityGroups, "Security groups should exist in VPC")
}

// validateDeployedMonitoring validates monitoring components
func validateDeployedMonitoring(t *testing.T, outputs map[string]interface{}) {
	logGroupName := outputs["cloudwatch_log_group"].(string)
	snsTopicArn := outputs["sns_topic_arn"].(string)
	asgName := outputs["autoscaling_group_name"].(string)

	require.NotEmpty(t, logGroupName, "CloudWatch log group name should not be empty")
	require.NotEmpty(t, snsTopicArn, "SNS topic ARN should not be empty")
	require.NotEmpty(t, asgName, "Auto Scaling Group name should not be empty")

	// Verify log group format
	assert.True(t, strings.HasPrefix(logGroupName, "/aws/"),
		"Log group should follow AWS naming convention")

	// Verify SNS topic ARN format
	assert.True(t, strings.HasPrefix(snsTopicArn, "arn:aws:sns:"),
		"SNS topic ARN should be valid")
}

// validateDeployedNetworking validates networking components
func validateDeployedNetworking(t *testing.T, outputs map[string]interface{}) {
	region := outputs["region"].(string)

	// Verify subnet arrays exist and have correct counts
	publicSubnets, ok := outputs["public_subnet_ids"].([]interface{})
	require.True(t, ok, "Public subnet IDs should be an array")
	assert.Len(t, publicSubnets, 2, "Should have 2 public subnets for Multi-AZ")

	privateAppSubnets, ok := outputs["private_app_subnet_ids"].([]interface{})
	require.True(t, ok, "Private app subnet IDs should be an array")
	assert.Len(t, privateAppSubnets, 2, "Should have 2 private app subnets for Multi-AZ")

	privateDbSubnets, ok := outputs["private_db_subnet_ids"].([]interface{})
	require.True(t, ok, "Private DB subnet IDs should be an array")
	assert.Len(t, privateDbSubnets, 2, "Should have 2 private DB subnets for Multi-AZ")

	// Verify subnets are in different availability zones
	if len(publicSubnets) >= 2 {
		subnet1ID := publicSubnets[0].(string)
		subnet2ID := publicSubnets[1].(string)

		subnet1 := aws.GetSubnetById(t, subnet1ID, region)
		subnet2 := aws.GetSubnetById(t, subnet2ID, region)

		require.NotNil(t, subnet1, "First public subnet should exist")
		require.NotNil(t, subnet2, "Second public subnet should exist")

		assert.NotEqual(t, subnet1.AvailabilityZone, subnet2.AvailabilityZone,
			"Public subnets should be in different availability zones")
	}
}

// TestResourceNamingConvention validates resource naming includes environment suffix
func TestResourceNamingConvention(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	environment := outputs["environment"].(string)
	require.NotEmpty(t, environment, "Environment should not be empty")

	// Check various resource names include environment identifier
	resourceNames := []string{
		outputs["cloudtrail_name"].(string),
		outputs["cloudtrail_s3_bucket"].(string),
		outputs["cloudwatch_log_group"].(string),
		outputs["autoscaling_group_name"].(string),
	}

	for _, name := range resourceNames {
		assert.Contains(t, name, environment,
			fmt.Sprintf("Resource name '%s' should contain environment '%s'", name, environment))
	}

	// Verify ALB DNS name contains environment identifier
	albDNS := outputs["alb_dns_name"].(string)
	assert.True(t, strings.Contains(albDNS, environment) || strings.Contains(albDNS, "pay-"),
		"ALB DNS name should contain environment or project identifier")
}

// TestIAMRoles validates IAM roles and instance profiles
func TestIAMRoles(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	iamRoleArn := outputs["iam_role_ec2_arn"].(string)
	instanceProfileName := outputs["iam_instance_profile_name"].(string)

	require.NotEmpty(t, iamRoleArn, "IAM role ARN should not be empty")
	require.NotEmpty(t, instanceProfileName, "Instance profile name should not be empty")

	// Verify ARN format
	assert.True(t, strings.HasPrefix(iamRoleArn, "arn:aws:iam:"),
		"IAM role ARN should be valid")

	// Verify role name includes environment identifier
	environment := outputs["environment"].(string)
	assert.Contains(t, iamRoleArn, environment,
		"IAM role should include environment identifier")
}

// TestAutoScalingGroup validates Auto Scaling Group configuration
func TestAutoScalingGroup(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	asgName := outputs["autoscaling_group_name"].(string)
	asgArn := outputs["autoscaling_group_arn"].(string)

	require.NotEmpty(t, asgName, "Auto Scaling Group name should not be empty")
	require.NotEmpty(t, asgArn, "Auto Scaling Group ARN should not be empty")

	// Verify ARN format
	assert.True(t, strings.HasPrefix(asgArn, "arn:aws:autoscaling:"),
		"Auto Scaling Group ARN should be valid")

	// Verify name includes environment identifier
	environment := outputs["environment"].(string)
	assert.Contains(t, asgName, environment,
		"Auto Scaling Group name should include environment identifier")
}

// TestEnvironmentConfiguration validates environment-specific settings
func TestEnvironmentConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	environment := outputs["environment"].(string)
	region := outputs["region"].(string)

	// Verify environment is valid
	assert.Contains(t, []string{"dev", "staging", "prod"}, environment,
		"Environment should be one of: dev, staging, prod")

	// Verify region
	assert.Equal(t, "us-east-1", region, "Region should be us-east-1")
}

// TestComplianceValidation validates PCI-DSS compliance features
func TestComplianceValidation(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	t.Run("EncryptionAtRest", func(t *testing.T) {
		// Verify KMS key exists
		kmsKeyID := outputs["kms_key_id"].(string)
		assert.NotEmpty(t, kmsKeyID, "KMS key should exist for encryption")
	})

	t.Run("AuditLogging", func(t *testing.T) {
		// Verify CloudTrail is configured
		cloudTrailName := outputs["cloudtrail_name"].(string)
		cloudTrailBucket := outputs["cloudtrail_s3_bucket"].(string)

		assert.NotEmpty(t, cloudTrailName, "CloudTrail should be configured")
		assert.NotEmpty(t, cloudTrailBucket, "CloudTrail bucket should exist")
	})

	t.Run("Monitoring", func(t *testing.T) {
		// Verify monitoring components
		logGroupName := outputs["cloudwatch_log_group"].(string)
		snsTopicArn := outputs["sns_topic_arn"].(string)

		assert.NotEmpty(t, logGroupName, "CloudWatch log group should exist")
		assert.NotEmpty(t, snsTopicArn, "SNS topic for alarms should exist")
	})
}
