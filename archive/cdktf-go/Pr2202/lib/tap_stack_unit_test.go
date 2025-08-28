package main

import (
	"encoding/json"
	"testing"

	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
)

func TestTapStackUnitValidation(t *testing.T) {
	// Setup
	app := cdktf.NewApp(nil)
	config := &TapStackConfig{
		Region:            "us-east-1",
		EnvironmentSuffix: "test",
	}

	// Create stack
	stack := NewTapStack(app, "TestStack", config)

	// Synthesize to get Terraform configuration
	manifest := cdktf.Testing_Synth(stack, nil)

	// Parse the synthesized JSON
	var tfConfig map[string]interface{}
	err := json.Unmarshal([]byte(*manifest), &tfConfig)
	assert.NoError(t, err, "Should be able to parse synthesized Terraform JSON")

	// Get resources
	resources, ok := tfConfig["resource"].(map[string]interface{})
	assert.True(t, ok, "Should have resources section")

	// Test 1: Verify KMS key exists with proper configuration
	kmsKeys, ok := resources["aws_kms_key"].(map[string]interface{})
	assert.True(t, ok, "Should have KMS keys defined")
	assert.NotEmpty(t, kmsKeys, "Should have at least one KMS key")

	// Check KMS key configuration
	for _, keyConfig := range kmsKeys {
		keyMap := keyConfig.(map[string]interface{})
		assert.True(t, keyMap["enable_key_rotation"].(bool), "KMS key should have rotation enabled")
		assert.Equal(t, float64(90), keyMap["rotation_period_in_days"].(float64), "KMS rotation should be 90 days")
	}

	// Test 2: Verify S3 bucket exists with encryption
	s3Buckets, ok := resources["aws_s3_bucket"].(map[string]interface{})
	assert.True(t, ok, "Should have S3 buckets defined")
	assert.NotEmpty(t, s3Buckets, "Should have at least one S3 bucket")

	// Test 3: Verify S3 public access block
	s3PublicBlocks, ok := resources["aws_s3_bucket_public_access_block"].(map[string]interface{})
	assert.True(t, ok, "Should have S3 public access blocks")
	assert.NotEmpty(t, s3PublicBlocks, "Should have at least one public access block")

	// Test 4: Verify security groups exist
	securityGroups, ok := resources["aws_security_group"].(map[string]interface{})
	assert.True(t, ok, "Should have security groups defined")
	assert.NotEmpty(t, securityGroups, "Should have at least one security group")

	// Verify HTTPS-only configuration
	for _, sgConfig := range securityGroups {
		sgMap := sgConfig.(map[string]interface{})
		if ingress, hasIngress := sgMap["ingress"]; hasIngress {
			ingressRules := ingress.([]interface{})
			for _, rule := range ingressRules {
				ruleMap := rule.(map[string]interface{})
				if fromPort, hasFromPort := ruleMap["from_port"]; hasFromPort {
					port := fromPort.(float64)
					assert.Equal(t, float64(443), port, "Security group should only allow HTTPS (port 443)")
				}
			}
		}
	}

	// Test 5: Verify IAM roles exist
	iamRoles, ok := resources["aws_iam_role"].(map[string]interface{})
	assert.True(t, ok, "Should have IAM roles defined")
	assert.NotEmpty(t, iamRoles, "Should have at least one IAM role")

	// Test 6: Verify IAM policies exist
	iamPolicies, ok := resources["aws_iam_policy"].(map[string]interface{})
	assert.True(t, ok, "Should have IAM policies defined")
	assert.NotEmpty(t, iamPolicies, "Should have at least one IAM policy")

	// Test 7: Verify CloudWatch log groups exist
	logGroups, ok := resources["aws_cloudwatch_log_group"].(map[string]interface{})
	assert.True(t, ok, "Should have CloudWatch log groups defined")
	assert.NotEmpty(t, logGroups, "Should have at least one log group")

	// Test 8: Verify CloudWatch metric alarms exist
	metricAlarms, ok := resources["aws_cloudwatch_metric_alarm"].(map[string]interface{})
	assert.True(t, ok, "Should have CloudWatch metric alarms defined")
	assert.NotEmpty(t, metricAlarms, "Should have at least one metric alarm")

	// Test 9: Verify VPC configuration
	vpcs, ok := resources["aws_vpc"].(map[string]interface{})
	assert.True(t, ok, "Should have VPC defined")
	assert.NotEmpty(t, vpcs, "Should have at least one VPC")

	// Test 10: Verify Load Balancer exists
	loadBalancers, ok := resources["aws_lb"].(map[string]interface{})
	assert.True(t, ok, "Should have load balancers defined")
	assert.NotEmpty(t, loadBalancers, "Should have at least one load balancer")
}

func TestTapStackSecurityCompliance(t *testing.T) {
	// Setup
	app := cdktf.NewApp(nil)
	config := &TapStackConfig{
		Region:            "us-east-1",
		EnvironmentSuffix: "security-test",
	}

	// Create stack
	stack := NewTapStack(app, "SecurityTestStack", config)

	// Synthesize
	manifest := cdktf.Testing_Synth(stack, nil)

	// Parse the synthesized JSON
	var tfConfig map[string]interface{}
	err := json.Unmarshal([]byte(*manifest), &tfConfig)
	assert.NoError(t, err, "Should be able to parse synthesized Terraform JSON")

	resources := tfConfig["resource"].(map[string]interface{})

	// Security Test 1: Ensure S3 bucket policy denies non-HTTPS requests
	s3BucketPolicies, ok := resources["aws_s3_bucket_policy"].(map[string]interface{})
	assert.True(t, ok, "Should have S3 bucket policies")

	for _, policyConfig := range s3BucketPolicies {
		policyMap := policyConfig.(map[string]interface{})
		policyJSON := policyMap["policy"].(string)

		// Check that policy contains secure transport requirement
		assert.Contains(t, policyJSON, "aws:SecureTransport", "S3 bucket policy should enforce secure transport")
		assert.Contains(t, policyJSON, "false", "S3 bucket policy should deny when SecureTransport is false")
	}

	// Security Test 2: Verify KMS key policies are restrictive
	kmsKeys, ok := resources["aws_kms_key"].(map[string]interface{})
	assert.True(t, ok, "Should have KMS keys")

	for _, keyConfig := range kmsKeys {
		keyMap := keyConfig.(map[string]interface{})
		if policy, hasPolicy := keyMap["policy"]; hasPolicy {
			policyJSON := policy.(string)
			assert.Contains(t, policyJSON, "kms:*", "KMS policy should include root permissions")
			assert.Contains(t, policyJSON, "s3.amazonaws.com", "KMS policy should allow S3 service access")
		}
	}

	// Security Test 3: Verify all security groups follow least privilege
	securityGroups := resources["aws_security_group"].(map[string]interface{})
	for _, sgConfig := range securityGroups {
		sgMap := sgConfig.(map[string]interface{})
		if ingress, hasIngress := sgMap["ingress"]; hasIngress {
			ingressRules := ingress.([]interface{})
			for _, rule := range ingressRules {
				ruleMap := rule.(map[string]interface{})
				// Ensure no overly permissive rules (all ports open)
				if fromPort, hasFromPort := ruleMap["from_port"]; hasFromPort {
					if toPort, hasToPort := ruleMap["to_port"]; hasToPort {
						from := fromPort.(float64)
						to := toPort.(float64)
						assert.False(t, from == 0 && to == 65535, "Security groups should not allow all ports")
					}
				}
			}
		}
	}

	// Security Test 4: Verify IAM policies follow least privilege
	iamPolicies := resources["aws_iam_policy"].(map[string]interface{})
	for _, policyConfig := range iamPolicies {
		policyMap := policyConfig.(map[string]interface{})
		policyJSON := policyMap["policy"].(string)

		// Should not contain overly broad permissions
		assert.NotContains(t, policyJSON, "\"*\"", "IAM policies should not grant all permissions on all resources")
	}
}
