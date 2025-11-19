package test

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestZeroTrustStackUnit(t *testing.T) {
	t.Parallel()

	// Define the Terraform options for unit testing (no apply)
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix": "test-unit",
		},
		NoColor: true,
	})

	// Ensure cleanup
	defer terraform.Destroy(t, terraformOptions)

	// Validate Terraform syntax
	t.Run("TerraformValidate", func(t *testing.T) {
		terraform.Init(t, terraformOptions)
		terraform.Validate(t, terraformOptions)
	})

	// Test plan output
	t.Run("TerraformPlan", func(t *testing.T) {
		planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

		// Assert planned resources
		assert.NotNil(t, planStruct)
		assert.NotNil(t, planStruct.ResourcePlannedValuesMap)

		// Test VPC creation
		vpc := planStruct.ResourcePlannedValuesMap["aws_vpc.main"]
		assert.NotNil(t, vpc, "VPC should be planned")
		assert.Equal(t, "aws_vpc", vpc.Type)
		assert.Contains(t, vpc.AttributeValues["tags"].(map[string]interface{})["Name"], "test-unit")

		// Test KMS keys
		kmsMain := planStruct.ResourcePlannedValuesMap["aws_kms_key.main"]
		assert.NotNil(t, kmsMain, "Main KMS key should be planned")
		assert.Equal(t, true, kmsMain.AttributeValues["enable_key_rotation"])
		assert.Equal(t, float64(7), kmsMain.AttributeValues["deletion_window_in_days"])

		kmsCloudwatch := planStruct.ResourcePlannedValuesMap["aws_kms_key.cloudwatch"]
		assert.NotNil(t, kmsCloudwatch, "CloudWatch KMS key should be planned")
		assert.Equal(t, true, kmsCloudwatch.AttributeValues["enable_key_rotation"])

		// Test S3 buckets
		sensitiveDataBucket := planStruct.ResourcePlannedValuesMap["aws_s3_bucket.sensitive_data"]
		assert.NotNil(t, sensitiveDataBucket, "Sensitive data bucket should be planned")
		assert.Contains(t, sensitiveDataBucket.AttributeValues["bucket"], "test-unit")
		assert.Equal(t, true, sensitiveDataBucket.AttributeValues["force_destroy"])

		cloudtrailBucket := planStruct.ResourcePlannedValuesMap["aws_s3_bucket.cloudtrail"]
		assert.NotNil(t, cloudtrailBucket, "CloudTrail bucket should be planned")
		assert.Contains(t, cloudtrailBucket.AttributeValues["bucket"], "test-unit")

		accessLogsBucket := planStruct.ResourcePlannedValuesMap["aws_s3_bucket.access_logs"]
		assert.NotNil(t, accessLogsBucket, "Access logs bucket should be planned")
		assert.Contains(t, accessLogsBucket.AttributeValues["bucket"], "test-unit")

		configBucket := planStruct.ResourcePlannedValuesMap["aws_s3_bucket.config"]
		assert.NotNil(t, configBucket, "Config bucket should be planned")
		assert.Contains(t, configBucket.AttributeValues["bucket"], "test-unit")

		// Test S3 bucket encryption
		sensitiveEncryption := planStruct.ResourcePlannedValuesMap["aws_s3_bucket_server_side_encryption_configuration.sensitive_data"]
		assert.NotNil(t, sensitiveEncryption, "Sensitive data bucket encryption should be configured")
		rule := sensitiveEncryption.AttributeValues["rule"].([]interface{})[0].(map[string]interface{})
		encryptionDefault := rule["apply_server_side_encryption_by_default"].(map[string]interface{})
		assert.Equal(t, "aws:kms", encryptionDefault["sse_algorithm"])

		// Test S3 versioning
		versioning := planStruct.ResourcePlannedValuesMap["aws_s3_bucket_versioning.sensitive_data"]
		assert.NotNil(t, versioning, "Bucket versioning should be enabled")
		versioningConfig := versioning.AttributeValues["versioning_configuration"].([]interface{})[0].(map[string]interface{})
		assert.Equal(t, "Enabled", versioningConfig["status"])

		// Test S3 public access block
		publicAccessBlock := planStruct.ResourcePlannedValuesMap["aws_s3_bucket_public_access_block.sensitive_data"]
		assert.NotNil(t, publicAccessBlock, "Public access block should be configured")
		assert.Equal(t, true, publicAccessBlock.AttributeValues["block_public_acls"])
		assert.Equal(t, true, publicAccessBlock.AttributeValues["block_public_policy"])
		assert.Equal(t, true, publicAccessBlock.AttributeValues["ignore_public_acls"])
		assert.Equal(t, true, publicAccessBlock.AttributeValues["restrict_public_buckets"])

		// Test CloudTrail
		cloudtrail := planStruct.ResourcePlannedValuesMap["aws_cloudtrail.main"]
		assert.NotNil(t, cloudtrail, "CloudTrail should be planned")
		assert.Contains(t, cloudtrail.AttributeValues["name"], "test-unit")
		assert.Equal(t, true, cloudtrail.AttributeValues["enable_logging"])
		assert.Equal(t, true, cloudtrail.AttributeValues["enable_log_file_validation"])
		assert.Equal(t, true, cloudtrail.AttributeValues["is_multi_region_trail"])

		// Test CloudWatch log groups
		flowLogsGroup := planStruct.ResourcePlannedValuesMap["aws_cloudwatch_log_group.flow_logs"]
		assert.NotNil(t, flowLogsGroup, "Flow logs group should be planned")
		assert.Contains(t, flowLogsGroup.AttributeValues["name"], "test-unit")
		assert.Equal(t, float64(30), flowLogsGroup.AttributeValues["retention_in_days"])

		cloudtrailGroup := planStruct.ResourcePlannedValuesMap["aws_cloudwatch_log_group.cloudtrail"]
		assert.NotNil(t, cloudtrailGroup, "CloudTrail log group should be planned")
		assert.Equal(t, float64(90), cloudtrailGroup.AttributeValues["retention_in_days"])

		// Test Security Group
		securityGroup := planStruct.ResourcePlannedValuesMap["aws_security_group.data_processing"]
		assert.NotNil(t, securityGroup, "Security group should be planned")
		assert.Contains(t, securityGroup.AttributeValues["name_prefix"], "test-unit")

		ingress := securityGroup.AttributeValues["ingress"].([]interface{})
		assert.Equal(t, 1, len(ingress), "Should have exactly one ingress rule")
		ingressRule := ingress[0].(map[string]interface{})
		assert.Equal(t, float64(443), ingressRule["from_port"])
		assert.Equal(t, float64(443), ingressRule["to_port"])
		assert.Equal(t, "tcp", ingressRule["protocol"])

		// Test VPC endpoints
		s3Endpoint := planStruct.ResourcePlannedValuesMap["aws_vpc_endpoint.s3"]
		assert.NotNil(t, s3Endpoint, "S3 VPC endpoint should be planned")
		assert.Contains(t, s3Endpoint.AttributeValues["service_name"], "s3")
		assert.Equal(t, "Gateway", s3Endpoint.AttributeValues["vpc_endpoint_type"])

		kmsEndpoint := planStruct.ResourcePlannedValuesMap["aws_vpc_endpoint.kms"]
		assert.NotNil(t, kmsEndpoint, "KMS VPC endpoint should be planned")
		assert.Contains(t, kmsEndpoint.AttributeValues["service_name"], "kms")
		assert.Equal(t, "Interface", kmsEndpoint.AttributeValues["vpc_endpoint_type"])
		assert.Equal(t, true, kmsEndpoint.AttributeValues["private_dns_enabled"])

		// Test IAM roles
		flowLogsRole := planStruct.ResourcePlannedValuesMap["aws_iam_role.flow_logs"]
		assert.NotNil(t, flowLogsRole, "Flow logs IAM role should be planned")
		assert.Contains(t, flowLogsRole.AttributeValues["name_prefix"], "test-unit")

		configRole := planStruct.ResourcePlannedValuesMap["aws_iam_role.config"]
		assert.NotNil(t, configRole, "Config IAM role should be planned")
		assert.Contains(t, configRole.AttributeValues["name_prefix"], "test-unit")

		// Test VPC Flow Logs
		flowLog := planStruct.ResourcePlannedValuesMap["aws_flow_log.main"]
		assert.NotNil(t, flowLog, "VPC Flow log should be planned")
		assert.Equal(t, "ALL", flowLog.AttributeValues["traffic_type"])

		// Test CloudWatch alarms
		unauthorizedAlarm := planStruct.ResourcePlannedValuesMap["aws_cloudwatch_metric_alarm.unauthorized_api_calls"]
		assert.NotNil(t, unauthorizedAlarm, "Unauthorized API calls alarm should be planned")
		assert.Contains(t, unauthorizedAlarm.AttributeValues["alarm_name"], "test-unit")
		assert.Equal(t, float64(5), unauthorizedAlarm.AttributeValues["threshold"])

		rootUsageAlarm := planStruct.ResourcePlannedValuesMap["aws_cloudwatch_metric_alarm.root_usage"]
		assert.NotNil(t, rootUsageAlarm, "Root usage alarm should be planned")
		assert.Equal(t, float64(0), rootUsageAlarm.AttributeValues["threshold"])

		kmsAlarm := planStruct.ResourcePlannedValuesMap["aws_cloudwatch_metric_alarm.kms_deletion"]
		assert.NotNil(t, kmsAlarm, "KMS deletion alarm should be planned")

		// Test Network ACL
		nacl := planStruct.ResourcePlannedValuesMap["aws_network_acl.private"]
		assert.NotNil(t, nacl, "Network ACL should be planned")

		ingresses := nacl.AttributeValues["ingress"].([]interface{})
		assert.GreaterOrEqual(t, len(ingresses), 2, "Should have at least 2 ingress rules")

		egresses := nacl.AttributeValues["egress"].([]interface{})
		assert.GreaterOrEqual(t, len(egresses), 2, "Should have at least 2 egress rules")
	})

	// Test outputs - verify terraform output command works
	t.Run("TerraformOutputs", func(t *testing.T) {
		// Just verify we can run terraform output
		output := terraform.Output(t, terraformOptions, "vpc_id")
		assert.NotEmpty(t, output, "VPC ID output should not be empty")
	})

	// Test resource naming conventions
	t.Run("ResourceNaming", func(t *testing.T) {
		planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

		// Check that all resources with names include the environment suffix
		resourcesWithNames := []string{
			"aws_vpc.main",
			"aws_kms_key.main",
			"aws_kms_key.cloudwatch",
			"aws_s3_bucket.sensitive_data",
			"aws_s3_bucket.cloudtrail",
			"aws_cloudtrail.main",
		}

		for _, resourceAddr := range resourcesWithNames {
			resource := planStruct.ResourcePlannedValuesMap[resourceAddr]
			if resource != nil {
				// Check for name or tags containing environment_suffix
				if name, ok := resource.AttributeValues["name"].(string); ok {
					assert.Contains(t, name, "test-unit", "Resource %s name should contain environment suffix", resourceAddr)
				} else if bucket, ok := resource.AttributeValues["bucket"].(string); ok {
					assert.Contains(t, bucket, "test-unit", "Resource %s bucket should contain environment suffix", resourceAddr)
				} else if tags, ok := resource.AttributeValues["tags"].(map[string]interface{}); ok {
					if nameTag, exists := tags["Name"]; exists {
						assert.Contains(t, nameTag.(string), "test-unit", "Resource %s Name tag should contain environment suffix", resourceAddr)
					}
				}
			}
		}
	})
}

func TestReadOutputsFile(t *testing.T) {
	t.Run("OutputsFileFormat", func(t *testing.T) {
		outputsFile := "../cfn-outputs/flat-outputs.json"
		if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
			t.Skip("Outputs file does not exist, skipping")
		}

		data, err := os.ReadFile(outputsFile)
		assert.NoError(t, err, "Should be able to read outputs file")

		var outputs map[string]interface{}
		err = json.Unmarshal(data, &outputs)
		assert.NoError(t, err, "Outputs should be valid JSON")
		assert.NotEmpty(t, outputs, "Outputs should not be empty")

		// Check for expected output keys
		expectedKeys := []string{
			"vpc_id",
			"kms_key_id",
			"sensitive_data_bucket_name",
			"cloudtrail_name",
		}

		for _, key := range expectedKeys {
			assert.Contains(t, outputs, key, "Outputs should contain %s", key)
		}
	})
}
