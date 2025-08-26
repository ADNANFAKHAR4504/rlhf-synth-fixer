//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"io/ioutil"
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

	config := &TapStackConfig{
		Region:            region,
		EnvironmentSuffix: "test",
	}
	NewTapStack(app, "TapStack", config)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

// TestStackSynthesis tests that the stack synthesizes without errors
func TestStackSynthesis(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	// Read and parse the synthesized JSON
	data, err := ioutil.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("Failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("Failed to parse synthesized JSON: %v", err)
	}

	// Verify basic structure
	if _, ok := tfConfig["provider"]; !ok {
		t.Error("Expected provider configuration in synthesized output")
	}

	if _, ok := tfConfig["resource"]; !ok {
		t.Error("Expected resources in synthesized output")
	}
}

// TestSecurityGroupConfiguration tests that security groups are properly configured for HTTPS only
func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	data, err := ioutil.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("Failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("Failed to parse synthesized JSON: %v", err)
	}

	// Check for security group resources
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Resources not found in synthesized output")
	}

	securityGroups, ok := resources["aws_security_group"].(map[string]interface{})
	if !ok {
		t.Fatal("Security groups not found in resources")
	}

	// Verify ALB security group allows only HTTPS (port 443)
	for name, sg := range securityGroups {
		sgConfig := sg.(map[string]interface{})
		if strings.Contains(name, "ALB") || strings.Contains(name, "alb") {
			ingress := sgConfig["ingress"].([]interface{})
			if len(ingress) == 0 {
				t.Error("ALB security group has no ingress rules")
			}
			for _, rule := range ingress {
				ruleMap := rule.(map[string]interface{})
				fromPort := ruleMap["from_port"].(float64)
				toPort := ruleMap["to_port"].(float64)
				if fromPort != 443 || toPort != 443 {
					t.Errorf("ALB security group allows non-HTTPS traffic: ports %v-%v", fromPort, toPort)
				}
			}
		}
	}
}

// TestKMSEncryption tests that KMS encryption is configured for S3
func TestKMSEncryption(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	data, err := ioutil.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("Failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("Failed to parse synthesized JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Resources not found in synthesized output")
	}

	// Check for KMS key
	kmsKeys, ok := resources["aws_kms_key"].(map[string]interface{})
	if !ok || len(kmsKeys) == 0 {
		t.Fatal("KMS key not found in resources")
	}

	// Verify KMS key rotation is enabled
	for _, key := range kmsKeys {
		keyConfig := key.(map[string]interface{})
		if rotation, ok := keyConfig["enable_key_rotation"]; ok {
			if rotation != true {
				t.Error("KMS key rotation is not enabled")
			}
		}
	}
}

// TestIAMRolesAndPolicies tests that IAM roles follow least privilege
func TestIAMRolesAndPolicies(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	data, err := ioutil.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("Failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("Failed to parse synthesized JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Resources not found in synthesized output")
	}

	// Check for IAM roles
	iamRoles, ok := resources["aws_iam_role"].(map[string]interface{})
	if !ok || len(iamRoles) == 0 {
		t.Fatal("IAM roles not found in resources")
	}

	// Check for IAM policies
	iamPolicies, ok := resources["aws_iam_policy"].(map[string]interface{})
	if !ok || len(iamPolicies) == 0 {
		t.Fatal("IAM policies not found in resources")
	}

	// Verify policies are attached to roles
	attachments, ok := resources["aws_iam_role_policy_attachment"].(map[string]interface{})
	if !ok || len(attachments) == 0 {
		t.Error("IAM role policy attachments not found")
	}
}

// TestCloudWatchMonitoring tests that CloudWatch alarms are configured
func TestCloudWatchMonitoring(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")

	data, err := ioutil.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("Failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("Failed to parse synthesized JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("Resources not found in synthesized output")
	}

	// Check for CloudWatch log groups
	logGroups, ok := resources["aws_cloudwatch_log_group"].(map[string]interface{})
	if !ok || len(logGroups) == 0 {
		t.Error("CloudWatch log groups not found in resources")
	}

	// Check for CloudWatch alarms
	alarms, ok := resources["aws_cloudwatch_metric_alarm"].(map[string]interface{})
	if !ok || len(alarms) == 0 {
		t.Error("CloudWatch metric alarms not found in resources")
	}

	// Verify alarm configuration
	for _, alarm := range alarms {
		alarmConfig := alarm.(map[string]interface{})
		if metricName, ok := alarmConfig["metric_name"]; ok {
			if metricName == "UnauthorizedAPICallsAttempt" {
				// Verify threshold is set appropriately
				if threshold, ok := alarmConfig["threshold"]; ok {
					if threshold.(float64) != 1 {
						t.Error("Security alarm threshold is not set to 1")
					}
				}
			}
		}
	}
}
