package lib

import (
	"encoding/json"
	"testing"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupUnitTests synthesizes the stack and parses the JSON output for testing.
func setupUnitTests(t *testing.T) map[string]interface{} {
	// GIVEN
	stack := NewTapStack(cdktf.NewApp(nil), "test-unit-stack")

	// WHEN
	synthesized := cdktf.Testing_Synth(stack, jsii.Bool(true))

	// THEN
	var output map[string]interface{}
	err := json.Unmarshal([]byte(*synthesized), &output)
	require.NoError(t, err, "Failed to parse synthesized JSON")
	return output
}

// TestSuite runs all unit tests against a single synthesized stack.
func TestSuite(t *testing.T) {
	synthesizedJson := setupUnitTests(t)
	resourceMap := synthesizedJson["resource"].(map[string]interface{})

	t.Run("S3BucketShouldHaveEncryption", func(t *testing.T) {
		s3Encryption := resourceMap["aws_s3_bucket_server_side_encryption_configuration"].(map[string]interface{})["logBucketEncryption"]
		config := s3Encryption.(map[string]interface{})
		rule := config["rule"].([]interface{})[0].(map[string]interface{})
		defaultEncryption := rule["apply_server_side_encryption_by_default"].(map[string]interface{})

		assert.Equal(t, "AES256", defaultEncryption["sse_algorithm"])
	})

	t.Run("IAMPolicyShouldEnforceMFA", func(t *testing.T) {
		iamPolicy := resourceMap["aws_iam_account_password_policy"].(map[string]interface{})["mfaPolicy"]
		config := iamPolicy.(map[string]interface{})

		assert.Equal(t, float64(14), config["minimum_password_length"])
		assert.Equal(t, true, config["require_numbers"])
	})

	t.Run("EBSVolumeShouldBeEncrypted", func(t *testing.T) {
		instance := resourceMap["aws_instance"].(map[string]interface{})["appInstance"]
		config := instance.(map[string]interface{})
		rootBlockDevice := config["root_block_device"].(map[string]interface{})

		assert.Equal(t, true, rootBlockDevice["encrypted"])
	})

	t.Run("SecurityGroupsShouldNotHavePublicSSH", func(t *testing.T) {
		securityGroups := resourceMap["aws_security_group"].(map[string]interface{})
		isSshOpen := false

		for _, sgInterface := range securityGroups {
			sg := sgInterface.(map[string]interface{})
			if ingress, ok := sg["ingress"].([]interface{}); ok {
				for _, ruleInterface := range ingress {
					rule := ruleInterface.(map[string]interface{})
					if fromPort, ok := rule["from_port"].(float64); ok && fromPort == 22 {
						if cidrBlocks, ok := rule["cidr_blocks"].([]interface{}); ok {
							for _, cidr := range cidrBlocks {
								if cidr == "0.0.0.0/0" {
									isSshOpen = true
									break
								}
							}
						}
					}
					if isSshOpen {
						break
					}
				}
			}
			if isSshOpen {
				break
			}
		}
		assert.False(t, isSshOpen, "Found a security group with SSH open to 0.0.0.0/0")
	})

	t.Run("EC2IAMPolicyShouldUseLeastPrivilege", func(t *testing.T) {
		iamPolicy := resourceMap["aws_iam_policy"].(map[string]interface{})["ec2Policy"]
		config := iamPolicy.(map[string]interface{})

		// --- FIX: The synthesized policy contains Terraform tokens (e.g., ${...}),
		// so it's not valid JSON. We must test it with string contains checks instead of parsing. ---
		policyString := config["policy"].(string)

		// 1. Ensure the action is specific and not a wildcard
		assert.Contains(t, policyString, "s3:PutObject")
		assert.NotContains(t, policyString, `"Action":"*"`)
		assert.NotContains(t, policyString, `"Action":["*"]`)

		// 2. Ensure the resource is scoped to the log bucket and not a wildcard
		assert.Contains(t, policyString, "${aws_s3_bucket.logBucket.arn}/*")
		assert.NotContains(t, policyString, `"Resource":"*"`)
		// --- END FIX ---
	})
}
