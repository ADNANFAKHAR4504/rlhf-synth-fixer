package lib

import (
	"encoding/json"
	"testing"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupIntegrationTests synthesizes the stack and parses the JSON output for testing.
func setupIntegrationTests(t *testing.T) map[string]interface{} {
	// GIVEN
	stack := NewTapStack(cdktf.NewApp(nil), "test-integration-stack")

	// WHEN
	// --- FIX: Add the missing boolean argument to Testing_Synth ---
	synthesized := cdktf.Testing_Synth(stack, jsii.Bool(true))
	// --- END FIX ---

	// THEN
	var output map[string]interface{}
	err := json.Unmarshal([]byte(*synthesized), &output)
	require.NoError(t, err, "Failed to parse synthesized JSON")
	return output
}

// TestSuite runs all integration-style unit tests against a single synthesized stack.
func TestSuite(t *testing.T) {
	synthesizedJson := setupIntegrationTests(t)
	resourceMap := synthesizedJson["resource"].(map[string]interface{})

	t.Run("EC2InstanceShouldBeInPrivateSubnet", func(t *testing.T) {
		instance := resourceMap["aws_instance"].(map[string]interface{})["appInstance"]
		config := instance.(map[string]interface{})

		// This token represents the ID of the private subnet. The test verifies the instance is attached to it.
		privateSubnetToken := "${aws_subnet.privateSubnetA.id}"
		assert.Equal(t, privateSubnetToken, config["subnet_id"])
	})

	t.Run("LoadBalancerShouldBeInPublicSubnets", func(t *testing.T) {
		lb := resourceMap["aws_lb"].(map[string]interface{})["appLb"]
		config := lb.(map[string]interface{})
		subnets := config["subnets"].([]interface{})

		publicSubnetAToken := "${aws_subnet.publicSubnetA.id}"
		publicSubnetBToken := "${aws_subnet.publicSubnetB.id}"

		assert.Contains(t, subnets, publicSubnetAToken)
		assert.Contains(t, subnets, publicSubnetBToken)
	})

	t.Run("AppSecurityGroupShouldOnlyAllowTrafficFromLB", func(t *testing.T) {
		appSg := resourceMap["aws_security_group"].(map[string]interface{})["appSg"]
		config := appSg.(map[string]interface{})
		ingress := config["ingress"].([]interface{})[0].(map[string]interface{})

		// Verifies that the only source for traffic is the load balancer's security group.
		lbSgToken := "${aws_security_group.lbSg.id}"
		sourceSgs := ingress["security_groups"].([]interface{})

		assert.Equal(t, float64(80), ingress["from_port"])
		assert.Contains(t, sourceSgs, lbSgToken)
		assert.Nil(t, ingress["cidr_blocks"], "Ingress should not have CIDR blocks, only a source security group")
	})
}
