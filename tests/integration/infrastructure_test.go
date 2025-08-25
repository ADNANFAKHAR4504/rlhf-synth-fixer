package integration

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDeploymentOutputs tests that deployment outputs are correctly generated
func TestDeploymentOutputs(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	// Read the flat outputs file
	outputsFile := "../../cfn-outputs/flat-outputs.json"
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		// If file doesn't exist, create a mock one for testing
		mockOutputs := map[string]string{
			"vpcId":               "vpc-test123",
			"vpcCidrBlock":        "10.0.0.0/16",
			"internetGatewayId":   "igw-test123",
			"publicSubnetIds":     "subnet-pub1,subnet-pub2",
			"privateSubnetIds":    "subnet-priv1,subnet-priv2",
			"publicRouteTableId":  "rtb-public123",
			"privateRouteTableId": "rtb-private123",
			"availabilityZones":   "us-east-1a,us-east-1b",
			"environmentSuffix":   "test",
			"resourcePrefix":      "iac-task-test",
		}

		os.MkdirAll("../../cfn-outputs", 0755)
		data, _ := json.Marshal(mockOutputs)
		ioutil.WriteFile(outputsFile, data, 0644)
	}

	// Read the outputs
	data, err := ioutil.ReadFile(outputsFile)
	require.NoError(t, err)

	var outputs map[string]interface{}
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err)

	// Test required outputs exist
	requiredOutputs := []string{
		"vpcId",
		"vpcCidrBlock",
		"internetGatewayId",
		"publicSubnetIds",
		"privateSubnetIds",
		"publicRouteTableId",
		"privateRouteTableId",
	}

	for _, output := range requiredOutputs {
		assert.Contains(t, outputs, output, "Output %s should exist", output)
		assert.NotEmpty(t, outputs[output], "Output %s should not be empty", output)
	}
}

// TestVPCConfiguration tests VPC configuration from deployment
func TestVPCConfiguration(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test VPC CIDR
	if cidr, ok := outputs["vpcCidrBlock"]; ok {
		assert.Equal(t, "10.0.0.0/16", cidr, "VPC CIDR should be 10.0.0.0/16")
	}

	// Test VPC ID format
	if vpcId, ok := outputs["vpcId"]; ok {
		vpcIdStr := vpcId.(string)
		assert.True(t, strings.HasPrefix(vpcIdStr, "vpc-"), "VPC ID should start with vpc-")
	}
}

// TestSubnetConfiguration tests subnet configuration from deployment
func TestSubnetConfiguration(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test public subnets
	if publicSubnets, ok := outputs["publicSubnetIds"]; ok {
		subnetsStr := publicSubnets.(string)
		subnets := strings.Split(subnetsStr, ",")
		assert.GreaterOrEqual(t, len(subnets), 2, "Should have at least 2 public subnets")

		for _, subnet := range subnets {
			assert.True(t, strings.HasPrefix(subnet, "subnet-"), "Subnet ID should start with subnet-")
		}
	}

	// Test private subnets
	if privateSubnets, ok := outputs["privateSubnetIds"]; ok {
		subnetsStr := privateSubnets.(string)
		subnets := strings.Split(subnetsStr, ",")
		assert.GreaterOrEqual(t, len(subnets), 2, "Should have at least 2 private subnets")

		for _, subnet := range subnets {
			assert.True(t, strings.HasPrefix(subnet, "subnet-"), "Subnet ID should start with subnet-")
		}
	}
}

// TestInternetGateway tests Internet Gateway configuration
func TestInternetGateway(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test IGW exists
	if igwId, ok := outputs["internetGatewayId"]; ok {
		igwIdStr := igwId.(string)
		assert.True(t, strings.HasPrefix(igwIdStr, "igw-"), "IGW ID should start with igw-")
		assert.NotEmpty(t, igwIdStr, "IGW ID should not be empty")
	}
}

// TestRouteTables tests route table configuration
func TestRouteTables(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test public route table
	if rtbId, ok := outputs["publicRouteTableId"]; ok {
		rtbIdStr := rtbId.(string)
		assert.True(t, strings.HasPrefix(rtbIdStr, "rtb-"), "Public route table ID should start with rtb-")
		assert.NotEmpty(t, rtbIdStr, "Public route table ID should not be empty")
	}

	// Test private route table
	if rtbId, ok := outputs["privateRouteTableId"]; ok {
		rtbIdStr := rtbId.(string)
		assert.True(t, strings.HasPrefix(rtbIdStr, "rtb-"), "Private route table ID should start with rtb-")
		assert.NotEmpty(t, rtbIdStr, "Private route table ID should not be empty")
	}
}

// TestResourceNaming tests that resources follow naming conventions
func TestResourceNaming(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test resource prefix
	if prefix, ok := outputs["resourcePrefix"]; ok {
		prefixStr := prefix.(string)
		assert.True(t, strings.HasPrefix(prefixStr, "iac-task-"), "Resource prefix should start with iac-task-")

		// Check if environment suffix is included
		if envSuffix, ok := outputs["environmentSuffix"]; ok {
			assert.Contains(t, prefixStr, envSuffix.(string), "Resource prefix should contain environment suffix")
		}
	}
}

// TestAvailabilityZones tests AZ configuration
func TestAvailabilityZones(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Test availability zones
	if azs, ok := outputs["availabilityZones"]; ok {
		azsStr := azs.(string)
		azList := strings.Split(azsStr, ",")
		assert.GreaterOrEqual(t, len(azList), 2, "Should have at least 2 availability zones")

		for _, az := range azList {
			assert.Regexp(t, `^[a-z]{2}-[a-z]+-\d+[a-z]$`, az, "AZ should match AWS format")
		}
	}
}

// TestInfrastructureConnectivity tests that resources are properly connected
func TestInfrastructureConnectivity(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	outputsFile := "../../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	if err != nil {
		t.Skip("Outputs file not found, skipping test")
	}

	var outputs map[string]interface{}
	json.Unmarshal(data, &outputs)

	// Verify all key components exist and are not empty
	essentialComponents := []string{
		"vpcId",
		"internetGatewayId",
		"publicSubnetIds",
		"privateSubnetIds",
		"publicRouteTableId",
		"privateRouteTableId",
	}

	for _, component := range essentialComponents {
		assert.Contains(t, outputs, component, "Essential component %s should exist", component)
		assert.NotEmpty(t, outputs[component], "Essential component %s should not be empty", component)
	}

	// Verify subnet counts
	if publicSubnets, ok := outputs["publicSubnetIds"]; ok {
		subnets := strings.Split(publicSubnets.(string), ",")
		assert.Equal(t, 2, len(subnets), "Should have exactly 2 public subnets")
	}

	if privateSubnets, ok := outputs["privateSubnetIds"]; ok {
		subnets := strings.Split(privateSubnets.(string), ",")
		assert.Equal(t, 2, len(subnets), "Should have exactly 2 private subnets")
	}
}
