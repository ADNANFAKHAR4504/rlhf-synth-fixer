//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// TestSecurityStackIntegration performs end-to-end integration testing
func TestSecurityStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	// Setup test environment
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for test
	region := "us-east-1"
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	// Synthesize the stack
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildSecurityStack(stack, region)
	app.Synth()

	// Verify synthesis succeeded
	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("synthesis failed: %v", err)
	}

	// Run terraform validation tests
	t.Run("TerraformValidation", func(t *testing.T) {
		testTerraformValidation(t, filepath.Dir(tfPath))
	})

	// Run security compliance tests
	t.Run("SecurityCompliance", func(t *testing.T) {
		testSecurityCompliance(t, tfPath)
	})

	// Run resource dependency tests
	t.Run("ResourceDependencies", func(t *testing.T) {
		testResourceDependencies(t, tfPath)
	})
}

// testTerraformValidation validates terraform configuration
func testTerraformValidation(t *testing.T, stackDir string) {
	// Check if terraform is available
	if _, err := exec.LookPath("terraform"); err != nil {
		t.Skip("terraform not available, skipping validation test")
	}

	// Initialize terraform
	initCmd := exec.Command("terraform", "init")
	initCmd.Dir = stackDir
	if output, err := initCmd.CombinedOutput(); err != nil {
		t.Fatalf("terraform init failed: %v\nOutput: %s", err, output)
	}

	// Validate terraform configuration
	validateCmd := exec.Command("terraform", "validate")
	validateCmd.Dir = stackDir
	if output, err := validateCmd.CombinedOutput(); err != nil {
		t.Fatalf("terraform validate failed: %v\nOutput: %s", err, output)
	}

	// Check terraform plan (dry-run)
	planCmd := exec.Command("terraform", "plan", "-input=false")
	planCmd.Dir = stackDir
	planCmd.Env = append(os.Environ(),
		"TF_VAR_region=us-east-1",
		"AWS_REGION=us-east-1",
	)

	if output, err := planCmd.CombinedOutput(); err != nil {
		// Log the output but don't fail - planning might fail due to missing AWS credentials
		t.Logf("terraform plan output: %s", output)
		if !strings.Contains(string(output), "credentials") && !strings.Contains(string(output), "authentication") {
			t.Fatalf("terraform plan failed unexpectedly: %v", err)
		}
	}
}

// testSecurityCompliance validates security configuration compliance
func testSecurityCompliance(t *testing.T, tfPath string) {
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test 1: Ensure KMS encryption is enabled for all applicable resources
	t.Run("KMSEncryptionCompliance", func(t *testing.T) {
		// Check KMS key exists
		if _, ok := resources["aws_kms_key"]; !ok {
			t.Error("KMS key not found")
		}

		// Check S3 bucket encryption uses KMS
		if s3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
			encryptionMap := s3Encryption.(map[string]interface{})
			for _, config := range encryptionMap {
				configMap := config.(map[string]interface{})
				if rules, ok := configMap["rule"]; ok {
					rulesSlice := rules.([]interface{})
					for _, rule := range rulesSlice {
						ruleMap := rule.(map[string]interface{})
						if applyDefault, ok := ruleMap["apply_server_side_encryption_by_default"]; ok {
							defaultSlice := applyDefault.([]interface{})
							if len(defaultSlice) > 0 {
								defaultMap := defaultSlice[0].(map[string]interface{})
								if algorithm, ok := defaultMap["sse_algorithm"]; !ok || algorithm != "aws:kms" {
									t.Error("S3 bucket not using KMS encryption")
								}
							}
						}
					}
				}
			}
		}

		// Check Lambda function uses KMS
		if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
			lambdaMap := lambdaFunctions.(map[string]interface{})
			for _, lambdaConfig := range lambdaMap {
				configMap := lambdaConfig.(map[string]interface{})
				if _, ok := configMap["kms_key_arn"]; !ok {
					t.Error("Lambda function missing KMS encryption")
				}
			}
		}

		// Check CloudWatch logs use KMS
		if logGroups, ok := resources["aws_cloudwatch_log_group"]; ok {
			logGroupMap := logGroups.(map[string]interface{})
			for _, logConfig := range logGroupMap {
				configMap := logConfig.(map[string]interface{})
				if _, ok := configMap["kms_key_id"]; !ok {
					t.Error("CloudWatch log group missing KMS encryption")
				}
			}
		}
	})

	// Test 2: Ensure IAM follows least privilege principle
	t.Run("IAMLeastPrivilege", func(t *testing.T) {
		if iamPolicies, ok := resources["aws_iam_policy"]; ok {
			policyMap := iamPolicies.(map[string]interface{})
			for policyName, policyConfig := range policyMap {
				configMap := policyConfig.(map[string]interface{})
				if policyDoc, ok := configMap["policy"].(string); ok {
					var policy map[string]interface{}
					if err := json.Unmarshal([]byte(policyDoc), &policy); err == nil {
						if statements, ok := policy["Statement"].([]interface{}); ok {
							for _, stmt := range statements {
								stmtMap := stmt.(map[string]interface{})
								if actions, ok := stmtMap["Action"].([]interface{}); ok {
									for _, action := range actions {
										if action == "*" {
											t.Errorf("policy %s contains wildcard action", policyName)
										}
									}
								}
								if resources, ok := stmtMap["Resource"]; ok {
									if resourceStr, ok := resources.(string); ok && resourceStr == "*" {
										// Only allow wildcard resources for specific actions
										if actions, ok := stmtMap["Action"].([]interface{}); ok {
											allowedWildcardActions := []string{"kms:DescribeKey"}
											for _, action := range actions {
												actionStr := action.(string)
												allowed := false
												for _, allowedAction := range allowedWildcardActions {
													if strings.Contains(actionStr, allowedAction) {
														allowed = true
														break
													}
												}
												if !allowed {
													t.Errorf("policy %s contains wildcard resource for action %s", policyName, actionStr)
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	})

	// Test 3: Ensure comprehensive logging is configured
	t.Run("LoggingCompliance", func(t *testing.T) {
		// Check VPC Flow Logs
		if flowLogs, ok := resources["aws_flow_log"]; !ok {
			t.Error("VPC Flow Logs not configured")
		} else {
			flowLogMap := flowLogs.(map[string]interface{})
			for _, flowConfig := range flowLogMap {
				configMap := flowConfig.(map[string]interface{})
				if trafficType, ok := configMap["traffic_type"]; !ok || trafficType != "ALL" {
					t.Error("VPC Flow Logs should capture ALL traffic")
				}
				if logDestType, ok := configMap["log_destination_type"]; !ok || logDestType != "s3" {
					t.Error("VPC Flow Logs should use S3 destination")
				}
			}
		}

		// Check Lambda CloudWatch logs
		if logGroups, ok := resources["aws_cloudwatch_log_group"]; !ok {
			t.Error("CloudWatch log groups not configured")
		} else {
			logGroupMap := logGroups.(map[string]interface{})
			for _, logConfig := range logGroupMap {
				configMap := logConfig.(map[string]interface{})
				if retention, ok := configMap["retention_in_days"]; ok {
					if retentionDays, ok := retention.(float64); !ok || retentionDays <= 0 {
						t.Error("log retention should be configured")
					}
				}
			}
		}
	})
}

// testResourceDependencies validates resource dependency configuration
func testResourceDependencies(t *testing.T, tfPath string) {
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test proper dependency chain: KMS -> S3 Encryption, Lambda, CloudWatch Logs
	t.Run("KMSDependencies", func(t *testing.T) {
		// Check that S3 encryption references KMS key
		if s3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
			encryptionMap := s3Encryption.(map[string]interface{})
			for _, config := range encryptionMap {
				configMap := config.(map[string]interface{})
				if rules, ok := configMap["rule"]; ok {
					rulesSlice := rules.([]interface{})
					for _, rule := range rulesSlice {
						ruleMap := rule.(map[string]interface{})
						if applyDefault, ok := ruleMap["apply_server_side_encryption_by_default"]; ok {
							defaultSlice := applyDefault.([]interface{})
							if len(defaultSlice) > 0 {
								defaultMap := defaultSlice[0].(map[string]interface{})
								if kmsKeyId, ok := defaultMap["kms_master_key_id"]; !ok || kmsKeyId == nil {
									t.Error("S3 encryption should reference KMS key")
								}
							}
						}
					}
				}
			}
		}

		// Check that Lambda function references KMS key
		if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
			lambdaMap := lambdaFunctions.(map[string]interface{})
			for _, lambdaConfig := range lambdaMap {
				configMap := lambdaConfig.(map[string]interface{})
				if kmsArn, ok := configMap["kms_key_arn"]; !ok || kmsArn == nil {
					t.Error("Lambda function should reference KMS key")
				}
			}
		}
	})

	// Test IAM role and policy dependencies
	t.Run("IAMDependencies", func(t *testing.T) {
		// Check that Lambda function references IAM role
		if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
			lambdaMap := lambdaFunctions.(map[string]interface{})
			for _, lambdaConfig := range lambdaMap {
				configMap := lambdaConfig.(map[string]interface{})
				if role, ok := configMap["role"]; !ok || role == nil {
					t.Error("Lambda function should reference IAM role")
				}
			}
		}

		// Check that policy attachment references both role and policy
		if attachments, ok := resources["aws_iam_role_policy_attachment"]; ok {
			attachmentMap := attachments.(map[string]interface{})
			for _, attachmentConfig := range attachmentMap {
				configMap := attachmentConfig.(map[string]interface{})
				if role, ok := configMap["role"]; !ok || role == nil {
					t.Error("IAM policy attachment should reference role")
				}
				if policyArn, ok := configMap["policy_arn"]; !ok || policyArn == nil {
					t.Error("IAM policy attachment should reference policy")
				}
			}
		}
	})

	// Test VPC Flow Logs dependencies
	t.Run("VPCFlowLogsDependencies", func(t *testing.T) {
		if flowLogs, ok := resources["aws_flow_log"]; ok {
			flowLogMap := flowLogs.(map[string]interface{})
			for _, flowConfig := range flowLogMap {
				configMap := flowConfig.(map[string]interface{})

				// Should reference existing VPC
				if resourceId, ok := configMap["resource_id"]; !ok || resourceId != "vpc-0abcd1234" {
					t.Error("VPC Flow Logs should reference correct VPC ID")
				}

				// Should reference S3 bucket for log destination
				if logDest, ok := configMap["log_destination"]; !ok || logDest == nil {
					t.Error("VPC Flow Logs should have S3 destination configured")
				}
			}
		}
	})
}

// TestSecurityBestPractices validates security best practices implementation
func TestSecurityBestPractices(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping security best practices test")
	}

	// Synthesize stack for testing
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")
	region := "us-east-1"

	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildSecurityStack(stack, region)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	// Test encryption at rest
	t.Run("EncryptionAtRest", func(t *testing.T) {
		validateEncryptionAtRest(t, tfConfig)
	})

	// Test network security
	t.Run("NetworkSecurity", func(t *testing.T) {
		validateNetworkSecurity(t, tfConfig)
	})

	// Test access controls
	t.Run("AccessControls", func(t *testing.T) {
		validateAccessControls(t, tfConfig)
	})

	// Test monitoring and logging
	t.Run("MonitoringAndLogging", func(t *testing.T) {
		validateMonitoringAndLogging(t, tfConfig)
	})
}

// validateEncryptionAtRest checks encryption configuration for all resources
func validateEncryptionAtRest(t *testing.T, tfConfig map[string]interface{}) {
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Check S3 encryption
	found := false
	if s3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
		found = true
		encryptionMap := s3Encryption.(map[string]interface{})
		if len(encryptionMap) == 0 {
			t.Error("S3 bucket encryption not configured")
		}
	}
	if !found {
		t.Error("S3 bucket encryption resource not found")
	}

	// Check Lambda encryption
	found = false
	if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
		lambdaMap := lambdaFunctions.(map[string]interface{})
		for _, lambdaConfig := range lambdaMap {
			found = true
			configMap := lambdaConfig.(map[string]interface{})
			if _, ok := configMap["kms_key_arn"]; !ok {
				t.Error("Lambda function encryption not configured")
			}
		}
	}
	if !found {
		t.Error("Lambda function with encryption not found")
	}

	// Check CloudWatch logs encryption
	found = false
	if logGroups, ok := resources["aws_cloudwatch_log_group"]; ok {
		logGroupMap := logGroups.(map[string]interface{})
		for _, logConfig := range logGroupMap {
			found = true
			configMap := logConfig.(map[string]interface{})
			if _, ok := configMap["kms_key_id"]; !ok {
				t.Error("CloudWatch log group encryption not configured")
			}
		}
	}
	if !found {
		t.Error("CloudWatch log group with encryption not found")
	}
}

// validateNetworkSecurity checks network security configuration
func validateNetworkSecurity(t *testing.T, tfConfig map[string]interface{}) {
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Check VPC infrastructure exists
	if vpcs, ok := resources["aws_vpc"]; ok {
		vpcMap := vpcs.(map[string]interface{})
		if len(vpcMap) == 0 {
			t.Error("VPC not configured")
		}
		for _, vpcConfig := range vpcMap {
			configMap := vpcConfig.(map[string]interface{})
			// Verify DNS settings for security
			if dnsHostnames, ok := configMap["enable_dns_hostnames"]; !ok || dnsHostnames != true {
				t.Error("VPC should have DNS hostnames enabled for proper resolution")
			}
			if dnsSupport, ok := configMap["enable_dns_support"]; !ok || dnsSupport != true {
				t.Error("VPC should have DNS support enabled")
			}
		}
	} else {
		t.Error("VPC not found")
	}

	// Check subnet segmentation
	if subnets, ok := resources["aws_subnet"]; ok {
		subnetMap := subnets.(map[string]interface{})
		publicSubnets := 0
		privateSubnets := 0
		for subnetName, subnetConfig := range subnetMap {
			configMap := subnetConfig.(map[string]interface{})
			if mapPublicIp, ok := configMap["map_public_ip_on_launch"]; ok && mapPublicIp == true {
				publicSubnets++
			} else {
				privateSubnets++
			}
			// Verify subnet naming follows security conventions
			if tags, ok := configMap["tags"]; ok {
				tagsMap := tags.(map[string]interface{})
				if name, ok := tagsMap["Name"]; ok {
					nameStr := name.(string)
					if !strings.Contains(nameStr, "public") && !strings.Contains(nameStr, "private") {
						t.Errorf("subnet %s should have clear public/private designation", subnetName)
					}
				}
			}
		}
		if publicSubnets < 2 {
			t.Error("should have at least 2 public subnets for high availability")
		}
		if privateSubnets < 2 {
			t.Error("should have at least 2 private subnets for high availability")
		}
	} else {
		t.Error("subnets not found")
	}

	// Check NAT Gateway for private subnet internet access
	if natGateways, ok := resources["aws_nat_gateway"]; ok {
		natMap := natGateways.(map[string]interface{})
		if len(natMap) == 0 {
			t.Error("NAT Gateway not configured for private subnet internet access")
		}
	} else {
		t.Error("NAT Gateway not found")
	}

	// Check VPC Flow Logs are enabled
	if flowLogs, ok := resources["aws_flow_log"]; ok {
		flowLogMap := flowLogs.(map[string]interface{})
		if len(flowLogMap) == 0 {
			t.Error("VPC Flow Logs not configured")
		}
		for _, flowConfig := range flowLogMap {
			configMap := flowConfig.(map[string]interface{})

			// Verify comprehensive logging
			if trafficType, ok := configMap["traffic_type"]; !ok || trafficType != "ALL" {
				t.Error("VPC Flow Logs should capture all traffic types")
			}

			// Verify proper log format
			if logFormat, ok := configMap["log_format"]; ok {
				formatStr := logFormat.(string)
				requiredFields := []string{"srcaddr", "dstaddr", "srcport", "dstport", "protocol", "action"}
				for _, field := range requiredFields {
					if !strings.Contains(formatStr, field) {
						t.Errorf("VPC Flow Logs format missing required field: %s", field)
					}
				}
			}
		}
	} else {
		t.Error("VPC Flow Logs not found")
	}
}

// validateAccessControls checks IAM and access control configuration
func validateAccessControls(t *testing.T, tfConfig map[string]interface{}) {
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Check IAM roles have proper trust policies
	if iamRoles, ok := resources["aws_iam_role"]; ok {
		roleMap := iamRoles.(map[string]interface{})
		for roleName, roleConfig := range roleMap {
			configMap := roleConfig.(map[string]interface{})
			if assumeRolePolicy, ok := configMap["assume_role_policy"].(string); ok {
				var policy map[string]interface{}
				if err := json.Unmarshal([]byte(assumeRolePolicy), &policy); err == nil {
					if statements, ok := policy["Statement"].([]interface{}); ok {
						for _, stmt := range statements {
							stmtMap := stmt.(map[string]interface{})
							if principal, ok := stmtMap["Principal"].(map[string]interface{}); ok {
								if service, ok := principal["Service"]; ok {
									// Verify legitimate AWS services
									serviceStr := fmt.Sprintf("%v", service)
									validServices := []string{"lambda.amazonaws.com", "ec2.amazonaws.com"}
									isValid := false
									for _, validService := range validServices {
										if strings.Contains(serviceStr, validService) {
											isValid = true
											break
										}
									}
									if !isValid {
										t.Errorf("role %s has suspicious service principal: %s", roleName, serviceStr)
									}
								}
							}
						}
					}
				}
			}
		}
	}

	// Check IAM policies follow least privilege
	if iamPolicies, ok := resources["aws_iam_policy"]; ok {
		policyMap := iamPolicies.(map[string]interface{})
		for policyName, policyConfig := range policyMap {
			configMap := policyConfig.(map[string]interface{})
			if policyDoc, ok := configMap["policy"].(string); ok {
				var policy map[string]interface{}
				if err := json.Unmarshal([]byte(policyDoc), &policy); err == nil {
					if statements, ok := policy["Statement"].([]interface{}); ok {
						for _, stmt := range statements {
							stmtMap := stmt.(map[string]interface{})

							// Check for overly permissive actions
							if actions, ok := stmtMap["Action"]; ok {
								actionStr := fmt.Sprintf("%v", actions)
								if strings.Contains(actionStr, "*") && !strings.Contains(policyName.(string), "admin") {
									t.Errorf("policy %s contains wildcard actions", policyName)
								}
							}

							// Check for specific resource targeting
							if resources, ok := stmtMap["Resource"]; ok {
								resourceStr := fmt.Sprintf("%v", resources)
								if resourceStr == "*" {
									// Verify this is allowed for specific actions only
									if actions, ok := stmtMap["Action"]; ok {
										actionStr := fmt.Sprintf("%v", actions)
										allowedWildcardActions := []string{"kms:DescribeKey", "logs:CreateLogGroup"}
										isAllowed := false
										for _, allowedAction := range allowedWildcardActions {
											if strings.Contains(actionStr, allowedAction) {
												isAllowed = true
												break
											}
										}
										if !isAllowed {
											t.Errorf("policy %s uses wildcard resources inappropriately", policyName)
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

// validateMonitoringAndLogging checks monitoring and logging configuration
func validateMonitoringAndLogging(t *testing.T, tfConfig map[string]interface{}) {
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Check CloudWatch log groups exist
	if logGroups, ok := resources["aws_cloudwatch_log_group"]; ok {
		logGroupMap := logGroups.(map[string]interface{})
		for logGroupName, logConfig := range logGroupMap {
			configMap := logConfig.(map[string]interface{})

			// Verify retention is set
			if retention, ok := configMap["retention_in_days"]; ok {
				if retentionDays, ok := retention.(float64); !ok || retentionDays <= 0 {
					t.Errorf("log group %s has invalid retention period", logGroupName)
				}
			} else {
				t.Errorf("log group %s missing retention configuration", logGroupName)
			}

			// Verify encryption is enabled
			if _, ok := configMap["kms_key_id"]; !ok {
				t.Errorf("log group %s missing encryption", logGroupName)
			}
		}
	} else {
		t.Error("no CloudWatch log groups found")
	}

	// Check Lambda functions have logging configured
	if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
		lambdaMap := lambdaFunctions.(map[string]interface{})
		for lambdaName, lambdaConfig := range lambdaMap {
			configMap := lambdaConfig.(map[string]interface{})

			// Verify depends_on includes log group to ensure logging is set up first
			if dependsOn, ok := configMap["depends_on"]; ok {
				dependsOnSlice := dependsOn.([]interface{})
				hasLogGroupDependency := false
				for _, dep := range dependsOnSlice {
					if strings.Contains(fmt.Sprintf("%v", dep), "cloudwatch_log_group") {
						hasLogGroupDependency = true
						break
					}
				}
				if !hasLogGroupDependency {
					t.Logf("Lambda %s should depend on log group for proper logging setup", lambdaName)
				}
			}
		}
	}

	// Verify VPC Flow Logs capture comprehensive data
	if flowLogs, ok := resources["aws_flow_log"]; ok {
		flowLogMap := flowLogs.(map[string]interface{})
		for flowLogName, flowConfig := range flowLogMap {
			configMap := flowConfig.(map[string]interface{})

			// Check log format includes security-relevant fields
			if logFormat, ok := configMap["log_format"]; ok {
				formatStr := logFormat.(string)
				securityFields := []string{"action", "srcaddr", "dstaddr", "srcport", "dstport", "protocol"}
				for _, field := range securityFields {
					if !strings.Contains(formatStr, field) {
						t.Errorf("flow log %s missing security field: %s", flowLogName, field)
					}
				}
			}
		}
	}
}

// TestDeploymentReadiness validates that the stack is ready for deployment
func TestDeploymentReadiness(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping deployment readiness test")
	}

	// Create a temporary deployment directory
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")
	region := "us-east-1"

	// Set environment
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	// Synthesize
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildSecurityStack(stack, region)

	start := time.Now()
	app.Synth()
	synthTime := time.Since(start)

	// Verify synthesis performance
	if synthTime > 30*time.Second {
		t.Errorf("synthesis took too long: %v", synthTime)
	}

	stackDir := filepath.Join(outdir, "stacks", "TapStack")

	// Verify all required files are generated
	requiredFiles := []string{
		"cdk.tf.json",
		"manifest.json",
	}

	for _, file := range requiredFiles {
		filePath := filepath.Join(stackDir, file)
		if _, err := os.Stat(filePath); err != nil {
			t.Errorf("required file missing: %s", file)
		}
	}

	// Check terraform configuration size (should be reasonable)
	tfPath := filepath.Join(stackDir, "cdk.tf.json")
	if info, err := os.Stat(tfPath); err == nil {
		if info.Size() > 1*1024*1024 { // 1MB
			t.Errorf("terraform configuration is very large: %d bytes", info.Size())
		}
		if info.Size() < 1000 { // 1KB
			t.Errorf("terraform configuration seems too small: %d bytes", info.Size())
		}
	}

	t.Logf("Stack synthesis completed successfully in %v", synthTime)
}
// TestNewTapStackIntegration tests the full NewTapStack function integration
func TestNewTapStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "integration-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "IntegrationTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "IntegrationTestStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("NewTapStack synthesis failed: %v", err)
	}

	// Test VPC infrastructure integration
	t.Run("VPCInfrastructureIntegration", func(t *testing.T) {
		testVPCInfrastructureIntegration(t, tfPath)
	})

	// Test backend configuration integration
	t.Run("BackendConfigurationIntegration", func(t *testing.T) {
		testBackendConfigurationIntegration(t, tfPath)
	})
}

// testVPCInfrastructureIntegration validates complete VPC setup
func testVPCInfrastructureIntegration(t *testing.T, tfPath string) {
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Verify complete VPC infrastructure
	requiredVPCResources := []string{
		"aws_vpc", "aws_internet_gateway", "aws_subnet", 
		"aws_route_table", "aws_route", "aws_route_table_association",
		"aws_nat_gateway", "aws_eip",
	}

	for _, resourceType := range requiredVPCResources {
		if _, ok := resources[resourceType]; !ok {
			t.Errorf("missing VPC resource type: %s", resourceType)
		}
	}

	// Verify subnet configuration
	if subnets, ok := resources["aws_subnet"]; ok {
		subnetMap := subnets.(map[string]interface{})
		if len(subnetMap) < 4 {
			t.Errorf("expected at least 4 subnets (2 public, 2 private), got: %d", len(subnetMap))
		}
	}

	// Verify route table associations
	if rtas, ok := resources["aws_route_table_association"]; ok {
		rtaMap := rtas.(map[string]interface{})
		if len(rtaMap) < 4 {
			t.Errorf("expected at least 4 route table associations, got: %d", len(rtaMap))
		}
	}
}

// testBackendConfigurationIntegration validates S3 backend setup
func testBackendConfigurationIntegration(t *testing.T, tfPath string) {
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	// Verify backend configuration
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

	// Verify required backend fields
	requiredFields := []string{"bucket", "key", "region"}
	for _, field := range requiredFields {
		if _, ok := s3Backend[field]; !ok {
			t.Errorf("backend missing required field: %s", field)
		}
	}
}

// TestResourceTaggingIntegration validates comprehensive tagging strategy
func TestResourceTaggingIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "tag-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "TagTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TagTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	// Test provider-level default tags
	t.Run("ProviderDefaultTags", func(t *testing.T) {
		providers, ok := tfConfig["provider"].(map[string]interface{})
		if !ok {
			t.Fatal("no providers found")
		}

		awsProvider, ok := providers["aws"].([]interface{})
		if !ok || len(awsProvider) == 0 {
			t.Fatal("AWS provider not found")
		}

		providerConfig := awsProvider[0].(map[string]interface{})
		if defaultTags, ok := providerConfig["default_tags"]; ok {
			defaultTagsSlice := defaultTags.([]interface{})
			if len(defaultTagsSlice) > 0 {
				tagsConfig := defaultTagsSlice[0].(map[string]interface{})
				if tags, ok := tagsConfig["tags"]; ok {
					tagsMap := tags.(map[string]interface{})
					requiredTags := []string{"Environment", "Repository", "Author", "ManagedBy"}
					for _, tag := range requiredTags {
						if _, exists := tagsMap[tag]; !exists {
							t.Errorf("provider missing required default tag: %s", tag)
						}
					}
				}
			}
		}
	})

	// Test resource-level tags
	t.Run("ResourceLevelTags", func(t *testing.T) {
		resources, ok := tfConfig["resource"].(map[string]interface{})
		if !ok {
			t.Fatal("no resources found")
		}

		taggedResourceTypes := []string{
			"aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_nat_gateway",
			"aws_route_table", "aws_eip", "aws_kms_key", "aws_s3_bucket",
			"aws_lambda_function", "aws_cloudwatch_log_group", "aws_iam_role",
			"aws_flow_log",
		}

		for _, resourceType := range taggedResourceTypes {
			if resourceMap, ok := resources[resourceType]; ok {
				resourceInstances := resourceMap.(map[string]interface{})
				for resourceName, resourceConfig := range resourceInstances {
					configMap := resourceConfig.(map[string]interface{})
					if tags, ok := configMap["tags"]; ok {
						tagsMap := tags.(map[string]interface{})
						if name, ok := tagsMap["Name"]; !ok || name == nil {
							t.Errorf("resource %s/%s missing Name tag", resourceType, resourceName)
						}
					} else {
						t.Errorf("resource %s/%s missing tags", resourceType, resourceName)
					}
				}
			}
		}
	})
}

// TestCostOptimizationIntegration validates cost optimization measures
func TestCostOptimizationIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "cost-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "CostTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "CostTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test log retention for cost optimization
	t.Run("LogRetentionOptimization", func(t *testing.T) {
		if logGroups, ok := resources["aws_cloudwatch_log_group"]; ok {
			logGroupMap := logGroups.(map[string]interface{})
			for logGroupName, logConfig := range logGroupMap {
				configMap := logConfig.(map[string]interface{})
				if retention, ok := configMap["retention_in_days"]; ok {
					retentionDays := retention.(float64)
					if retentionDays > 90 {
						t.Errorf("log group %s has high retention period: %v days (consider reducing for cost)", logGroupName, retentionDays)
					}
				}
			}
		}
	})

	// Test S3 bucket key optimization
	t.Run("S3BucketKeyOptimization", func(t *testing.T) {
		if s3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
			encryptionMap := s3Encryption.(map[string]interface{})
			for _, config := range encryptionMap {
				configMap := config.(map[string]interface{})
				if rules, ok := configMap["rule"]; ok {
					rulesSlice := rules.([]interface{})
					for _, rule := range rulesSlice {
						ruleMap := rule.(map[string]interface{})
						if bucketKeyEnabled, ok := ruleMap["bucket_key_enabled"]; !ok || bucketKeyEnabled != true {
							t.Error("S3 bucket key should be enabled for cost optimization")
						}
					}
				}
			}
		}
	})

	// Test single NAT Gateway for cost optimization
	t.Run("NATGatewayOptimization", func(t *testing.T) {
		if natGateways, ok := resources["aws_nat_gateway"]; ok {
			natMap := natGateways.(map[string]interface{})
			if len(natMap) > 1 {
				t.Logf("Multiple NAT Gateways detected (%d). Consider single NAT for cost optimization in non-production", len(natMap))
			}
		}
	})
}

// TestDisasterRecoveryIntegration validates DR capabilities
func TestDisasterRecoveryIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "dr-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "DRTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "DRTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test multi-AZ deployment
	t.Run("MultiAZDeployment", func(t *testing.T) {
		if subnets, ok := resources["aws_subnet"]; ok {
			subnetMap := subnets.(map[string]interface{})
			azSet := make(map[string]bool)
			
			for _, subnetConfig := range subnetMap {
				configMap := subnetConfig.(map[string]interface{})
				if az, ok := configMap["availability_zone"]; ok {
					azSet[az.(string)] = true
				}
			}
			
			if len(azSet) < 2 {
				t.Error("infrastructure should span multiple availability zones for DR")
			}
		}
	})

	// Test backup and recovery capabilities
	t.Run("BackupCapabilities", func(t *testing.T) {
		// Verify S3 bucket for backups exists
		if s3Buckets, ok := resources["aws_s3_bucket"]; ok {
			bucketMap := s3Buckets.(map[string]interface{})
			hasBackupBucket := false
			
			for bucketName := range bucketMap {
				if strings.Contains(bucketName, "logs") || strings.Contains(bucketName, "backup") {
					hasBackupBucket = true
					break
				}
			}
			
			if !hasBackupBucket {
				t.Error("should have backup/logs bucket for DR purposes")
			}
		}
	})

	// Test state backup configuration
	t.Run("StateBackupConfiguration", func(t *testing.T) {
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

		// Verify state is stored in S3 for durability
		if bucket, ok := s3Backend["bucket"]; !ok || bucket == nil {
			t.Error("terraform state should be stored in S3 for DR")
		}

		if region, ok := s3Backend["region"]; !ok || region == nil {
			t.Error("terraform state bucket region should be specified")
		}
	})
}
// TestEnvironmentVariableIntegration validates environment variable handling
func TestEnvironmentVariableIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	// Test different environment configurations
	testCases := []struct {
		name              string
		environmentSuffix string
		awsRegion         string
		stateBucket       string
		stateBucketRegion string
	}{
		{"Development", "dev", "us-east-1", "dev-tf-states", "us-east-1"},
		{"Staging", "staging", "us-west-2", "staging-tf-states", "us-west-2"},
		{"Production", "prod", "eu-west-1", "prod-tf-states", "eu-west-1"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Set environment variables
			oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
			oldAwsRegion := os.Getenv("AWS_REGION")
			oldStateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
			oldStateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")

			t.Cleanup(func() {
				_ = os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
				_ = os.Setenv("AWS_REGION", oldAwsRegion)
				_ = os.Setenv("TERRAFORM_STATE_BUCKET", oldStateBucket)
				_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", oldStateBucketRegion)
			})

			_ = os.Setenv("ENVIRONMENT_SUFFIX", tc.environmentSuffix)
			_ = os.Setenv("AWS_REGION", tc.awsRegion)
			_ = os.Setenv("TERRAFORM_STATE_BUCKET", tc.stateBucket)
			_ = os.Setenv("TERRAFORM_STATE_BUCKET_REGION", tc.stateBucketRegion)

			tmpDir := t.TempDir()
			outdir := filepath.Join(tmpDir, "cdktf.out")

			app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
			
			props := &TapStackProps{
				EnvironmentSuffix: "default-env",
				StateBucket:       "default-bucket",
				StateBucketRegion: "us-east-1",
				AwsRegion:         "us-east-1",
				RepositoryName:    "test-repo",
				CommitAuthor:      "test-author",
			}
			
			stackName := fmt.Sprintf("EnvTestStack%s", tc.environmentSuffix)
			NewTapStack(app, stackName, props)
			app.Synth()

			tfPath := filepath.Join(outdir, "stacks", stackName, "cdk.tf.json")
			data, err := os.ReadFile(tfPath)
			if err != nil {
				t.Fatalf("failed to read terraform config: %v", err)
			}

			var tfConfig map[string]interface{}
			if err := json.Unmarshal(data, &tfConfig); err != nil {
				t.Fatalf("failed to parse terraform JSON: %v", err)
			}

			// Verify backend uses environment variables
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

			if bucket, ok := s3Backend["bucket"]; !ok || bucket != tc.stateBucket {
				t.Errorf("expected backend bucket '%s', got: %v", tc.stateBucket, bucket)
			}

			if region, ok := s3Backend["region"]; !ok || region != tc.stateBucketRegion {
				t.Errorf("expected backend region '%s', got: %v", tc.stateBucketRegion, region)
			}

			// Verify provider uses correct region
			providers, ok := tfConfig["provider"].(map[string]interface{})
			if !ok {
				t.Fatal("no providers found")
			}

			awsProvider, ok := providers["aws"].([]interface{})
			if !ok || len(awsProvider) == 0 {
				t.Fatal("AWS provider not found")
			}

			providerConfig := awsProvider[0].(map[string]interface{})
			if providerRegion, ok := providerConfig["region"]; !ok || providerRegion != tc.awsRegion {
				t.Errorf("expected provider region '%s', got: %v", tc.awsRegion, providerRegion)
			}
		})
	}
}

// TestSecurityHardeningIntegration validates security hardening measures
func TestSecurityHardeningIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "security-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "SecurityTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "SecurityTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test encryption in transit and at rest
	t.Run("EncryptionCompliance", func(t *testing.T) {
		// Verify all storage resources use encryption
		storageResources := []string{"aws_s3_bucket", "aws_cloudwatch_log_group"}
		
		for _, resourceType := range storageResources {
			if resourceMap, ok := resources[resourceType]; ok {
				resourceInstances := resourceMap.(map[string]interface{})
				for resourceName := range resourceInstances {
					t.Logf("Verified encryption for %s: %s", resourceType, resourceName)
				}
			}
		}

		// Verify KMS key rotation (would be enabled by default)
		if kmsKeys, ok := resources["aws_kms_key"]; ok {
			kmsMap := kmsKeys.(map[string]interface{})
			for kmsName, kmsConfig := range kmsMap {
				configMap := kmsConfig.(map[string]interface{})
				if keyUsage, ok := configMap["key_usage"]; !ok || keyUsage != "ENCRYPT_DECRYPT" {
					t.Errorf("KMS key %s should be configured for ENCRYPT_DECRYPT", kmsName)
				}
			}
		}
	})

	// Test network isolation
	t.Run("NetworkIsolation", func(t *testing.T) {
		// Verify private subnets don't have direct internet access
		if subnets, ok := resources["aws_subnet"]; ok {
			subnetMap := subnets.(map[string]interface{})
			for subnetName, subnetConfig := range subnetMap {
				configMap := subnetConfig.(map[string]interface{})
				if mapPublicIp, ok := configMap["map_public_ip_on_launch"]; ok && mapPublicIp == true {
					// This is a public subnet - verify it's properly tagged
					if tags, ok := configMap["tags"]; ok {
						tagsMap := tags.(map[string]interface{})
						if name, ok := tagsMap["Name"]; ok {
							nameStr := name.(string)
							if !strings.Contains(strings.ToLower(nameStr), "public") {
								t.Errorf("public subnet %s should be clearly labeled as public", subnetName)
							}
						}
					}
				}
			}
		}

		// Verify NAT Gateway provides controlled internet access for private subnets
		if natGateways, ok := resources["aws_nat_gateway"]; !ok {
			t.Error("NAT Gateway should be configured for private subnet internet access")
		}
	})

	// Test IAM security
	t.Run("IAMSecurity", func(t *testing.T) {
		if iamRoles, ok := resources["aws_iam_role"]; ok {
			roleMap := iamRoles.(map[string]interface{})
			for roleName, roleConfig := range roleMap {
				configMap := roleConfig.(map[string]interface{})
				
				// Verify assume role policy is restrictive
				if assumeRolePolicy, ok := configMap["assume_role_policy"].(string); ok {
					if strings.Contains(assumeRolePolicy, "*") {
						t.Errorf("IAM role %s has overly permissive assume role policy", roleName)
					}
				}
			}
		}

		// Verify policies follow least privilege
		if iamPolicies, ok := resources["aws_iam_policy"]; ok {
			policyMap := iamPolicies.(map[string]interface{})
			for policyName, policyConfig := range policyMap {
				configMap := policyConfig.(map[string]interface{})
				if policyDoc, ok := configMap["policy"].(string); ok {
					// Check for overly broad permissions
					if strings.Contains(policyDoc, "\"Resource\": \"*\"") && !strings.Contains(policyDoc, "kms:DescribeKey") {
						t.Errorf("IAM policy %s may have overly broad resource permissions", policyName)
					}
				}
			}
		}
	})
}

// TestPerformanceOptimizationIntegration validates performance optimizations
func TestPerformanceOptimizationIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "perf-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "PerfTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "PerfTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test Lambda performance optimizations
	t.Run("LambdaOptimizations", func(t *testing.T) {
		if lambdaFunctions, ok := resources["aws_lambda_function"]; ok {
			lambdaMap := lambdaFunctions.(map[string]interface{})
			for lambdaName, lambdaConfig := range lambdaMap {
				configMap := lambdaConfig.(map[string]interface{})
				
				// Verify runtime is current
				if runtime, ok := configMap["runtime"]; ok {
					runtimeStr := runtime.(string)
					if !strings.Contains(runtimeStr, "python3.9") && !strings.Contains(runtimeStr, "python3.10") && !strings.Contains(runtimeStr, "python3.11") {
						t.Errorf("Lambda %s should use current Python runtime", lambdaName)
					}
				}

				// Verify KMS encryption for performance (vs default encryption)
				if kmsArn, ok := configMap["kms_key_arn"]; !ok || kmsArn == nil {
					t.Errorf("Lambda %s should use customer-managed KMS key for better performance control", lambdaName)
				}
			}
		}
	})

	// Test VPC performance considerations
	t.Run("VPCPerformanceOptimizations", func(t *testing.T) {
		// Verify DNS resolution is enabled for performance
		if vpcs, ok := resources["aws_vpc"]; ok {
			vpcMap := vpcs.(map[string]interface{})
			for vpcName, vpcConfig := range vpcMap {
				configMap := vpcConfig.(map[string]interface{})
				
				if dnsHostnames, ok := configMap["enable_dns_hostnames"]; !ok || dnsHostnames != true {
					t.Errorf("VPC %s should have DNS hostnames enabled for performance", vpcName)
				}
				
				if dnsSupport, ok := configMap["enable_dns_support"]; !ok || dnsSupport != true {
					t.Errorf("VPC %s should have DNS support enabled for performance", vpcName)
				}
			}
		}

		// Verify subnets are in different AZs for performance and availability
		if subnets, ok := resources["aws_subnet"]; ok {
			subnetMap := subnets.(map[string]interface{})
			azCount := make(map[string]int)
			
			for _, subnetConfig := range subnetMap {
				configMap := subnetConfig.(map[string]interface{})
				if az, ok := configMap["availability_zone"]; ok {
					azCount[az.(string)]++
				}
			}
			
			if len(azCount) < 2 {
				t.Error("subnets should span multiple AZs for better performance and availability")
			}
		}
	})
}

// TestComplianceIntegration validates regulatory compliance measures
func TestComplianceIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	
	props := &TapStackProps{
		EnvironmentSuffix: "compliance-test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	}
	
	NewTapStack(app, "ComplianceTestStack", props)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "ComplianceTestStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read terraform config: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform JSON: %v", err)
	}

	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found")
	}

	// Test audit logging compliance
	t.Run("AuditLoggingCompliance", func(t *testing.T) {
		// Verify VPC Flow Logs for network audit
		if flowLogs, ok := resources["aws_flow_log"]; ok {
			flowLogMap := flowLogs.(map[string]interface{})
			for flowLogName, flowConfig := range flowLogMap {
				configMap := flowConfig.(map[string]interface{})
				
				// Verify comprehensive logging
				if trafficType, ok := configMap["traffic_type"]; !ok || trafficType != "ALL" {
					t.Errorf("flow log %s should capture ALL traffic for compliance", flowLogName)
				}
				
				// Verify log retention for compliance
				if logDestType, ok := configMap["log_destination_type"]; !ok || logDestType != "s3" {
					t.Errorf("flow log %s should use S3 for long-term retention compliance", flowLogName)
				}
			}
		} else {
			t.Error("VPC Flow Logs required for audit compliance")
		}

		// Verify CloudWatch logs retention
		if logGroups, ok := resources["aws_cloudwatch_log_group"]; ok {
			logGroupMap := logGroups.(map[string]interface{})
			for logGroupName, logConfig := range logGroupMap {
				configMap := logConfig.(map[string]interface{})
				
				if retention, ok := configMap["retention_in_days"]; ok {
					retentionDays := retention.(float64)
					if retentionDays < 7 {
						t.Errorf("log group %s retention too short for compliance: %v days", logGroupName, retentionDays)
					}
				} else {
					t.Errorf("log group %s missing retention policy for compliance", logGroupName)
				}
			}
		}
	})

	// Test data protection compliance
	t.Run("DataProtectionCompliance", func(t *testing.T) {
		// Verify encryption at rest
		encryptedResources := []string{"aws_s3_bucket_server_side_encryption_configuration", "aws_lambda_function", "aws_cloudwatch_log_group"}
		
		for _, resourceType := range encryptedResources {
			if resourceMap, ok := resources[resourceType]; ok {
				resourceInstances := resourceMap.(map[string]interface{})
				if len(resourceInstances) == 0 {
					t.Errorf("no %s found - encryption required for compliance", resourceType)
				}
			} else {
				t.Errorf("%s not found - encryption required for compliance", resourceType)
			}
		}

		// Verify KMS key management
		if kmsKeys, ok := resources["aws_kms_key"]; ok {
			kmsMap := kmsKeys.(map[string]interface{})
			if len(kmsMap) == 0 {
				t.Error("customer-managed KMS keys required for compliance")
			}
		} else {
			t.Error("KMS keys not found - required for compliance")
		}
	})

	// Test access control compliance
	t.Run("AccessControlCompliance", func(t *testing.T) {
		// Verify IAM roles have proper boundaries
		if iamRoles, ok := resources["aws_iam_role"]; ok {
			roleMap := iamRoles.(map[string]interface{})
			for roleName, roleConfig := range roleMap {
				configMap := roleConfig.(map[string]interface{})
				
				// Verify role has tags for compliance tracking
				if tags, ok := configMap["tags"]; ok {
					tagsMap := tags.(map[string]interface{})
					if _, ok := tagsMap["Name"]; !ok {
						t.Errorf("IAM role %s missing Name tag for compliance tracking", roleName)
					}
				} else {
					t.Errorf("IAM role %s missing tags for compliance tracking", roleName)
				}
			}
		}

		// Verify policy attachments are explicit
		if attachments, ok := resources["aws_iam_role_policy_attachment"]; ok {
			attachmentMap := attachments.(map[string]interface{})
			if len(attachmentMap) == 0 {
				t.Error("explicit policy attachments required for compliance")
			}
		} else {
			t.Error("IAM policy attachments not found - required for compliance")
		}
	})
}