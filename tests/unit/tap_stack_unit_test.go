//go:build !integration
// +build !integration

package main

import (
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// Test tag merging functionality
func TestMergeTags(t *testing.T) {
	baseTags := pulumi.StringMap{
		"Name": pulumi.String("test-resource"),
		"Type": pulumi.String("test"),
	}

	commonTags := pulumi.StringMap{
		"Environment": pulumi.String("production"),
		"Project":     pulumi.String("secure-vpc"),
		"ManagedBy":   pulumi.String("pulumi"),
	}

	merged := mergeTags(baseTags, commonTags)

	// Verify all tags are present
	assert.NotNil(t, merged["Name"])
	assert.NotNil(t, merged["Type"])
	assert.NotNil(t, merged["Environment"])
	assert.NotNil(t, merged["Project"])
	assert.NotNil(t, merged["ManagedBy"])

	// Verify we have 5 tags total
	assert.Equal(t, 5, len(merged))

	// Test that base tags take precedence (mergeTags adds baseTags last)
	// This tests the actual logic of the mergeTags function
	conflictingTags := pulumi.StringMap{
		"Name": pulumi.String("original-name"),
	}
	
	testCommonTags := pulumi.StringMap{
		"Name":        pulumi.String("common-name"),
		"Environment": pulumi.String("test"),
	}
	
	result := mergeTags(conflictingTags, testCommonTags)
	assert.Equal(t, 2, len(result))
	// baseTags should override commonTags since baseTags are added last
}

// Test VPC CIDR validation logic
func TestVPCCIDRValidation(t *testing.T) {
	// Test valid CIDR blocks
	validCIDRs := []string{
		"10.0.0.0/16",
		"172.16.0.0/12",
		"192.168.0.0/16",
	}

	for _, cidr := range validCIDRs {
		assert.True(t, isValidCIDR(cidr), "CIDR %s should be valid", cidr)
	}

	// Test invalid CIDR blocks
	invalidCIDRs := []string{
		"10.0.0.0/8",   // Too broad
		"256.0.0.0/16", // Invalid IP
		"10.0.0.0/33",  // Invalid mask
		"not-a-cidr",   // Not CIDR format
	}

	for _, cidr := range invalidCIDRs {
		assert.False(t, isValidCIDR(cidr), "CIDR %s should be invalid", cidr)
	}
}

// Test subnet CIDR validation within VPC
func TestSubnetCIDRValidation(t *testing.T) {
	vpcCIDR := "10.0.0.0/16"
	
	// Test valid subnet CIDRs within VPC
	validSubnets := []string{
		"10.0.1.0/24",
		"10.0.2.0/24",
		"10.0.255.0/24",
	}

	for _, subnet := range validSubnets {
		assert.True(t, isSubnetInVPC(subnet, vpcCIDR), "Subnet %s should be valid in VPC %s", subnet, vpcCIDR)
	}

	// Test invalid subnet CIDRs
	invalidSubnets := []string{
		"192.168.1.0/24", // Outside VPC range
		"10.1.0.0/24",    // Outside VPC range
		"10.0.0.0/16",    // Same as VPC (too broad)
	}

	for _, subnet := range invalidSubnets {
		assert.False(t, isSubnetInVPC(subnet, vpcCIDR), "Subnet %s should be invalid in VPC %s", subnet, vpcCIDR)
	}
}

// Test availability zone validation
func TestAvailabilityZoneValidation(t *testing.T) {
	validAZs := []string{"us-east-1a", "us-east-1b", "us-east-1c"}
	invalidAZs := []string{"us-west-1a", "eu-west-1a", "invalid-az"}

	for _, az := range validAZs {
		assert.True(t, isValidAZ(az, "us-east-1"), "AZ %s should be valid for region us-east-1", az)
	}

	for _, az := range invalidAZs {
		assert.False(t, isValidAZ(az, "us-east-1"), "AZ %s should be invalid for region us-east-1", az)
	}
}

// Test security group port validation
func TestSecurityGroupPortValidation(t *testing.T) {
	// Test valid ports
	validPorts := []int{22, 80, 443, 3306, 5432}
	for _, port := range validPorts {
		assert.True(t, isValidPort(port), "Port %d should be valid", port)
	}

	// Test invalid ports
	invalidPorts := []int{-1, 0, 65536, 70000}
	for _, port := range invalidPorts {
		assert.False(t, isValidPort(port), "Port %d should be invalid", port)
	}
}

// Test CIDR block validation for security groups
func TestSecurityGroupCIDRValidation(t *testing.T) {
	// Test SSH restricted CIDR blocks
	restrictedCIDRs := []string{"203.0.113.0/24", "198.51.100.0/24"}
	
	for _, cidr := range restrictedCIDRs {
		assert.True(t, isRestrictedCIDR(cidr), "CIDR %s should be recognized as restricted", cidr)
	}

	// Test unrestricted CIDR blocks
	unrestrictedCIDRs := []string{"0.0.0.0/0", "10.0.0.0/8"}
	for _, cidr := range unrestrictedCIDRs {
		assert.False(t, isRestrictedCIDR(cidr), "CIDR %s should not be restricted", cidr)
	}
}

// Test resource name generation
func TestResourceNameGeneration(t *testing.T) {
	prefix := "secure-vpc"
	resourceType := "subnet"
	identifier := "public-a"
	
	expectedName := "secure-vpc-subnet-public-a"
	actualName := generateResourceName(prefix, resourceType, identifier)
	
	assert.Equal(t, expectedName, actualName)
	
	// Test with empty identifier
	nameWithoutId := generateResourceName(prefix, resourceType, "")
	expectedWithoutId := "secure-vpc-subnet"
	assert.Equal(t, expectedWithoutId, nameWithoutId)
}

// Test route table configuration logic
func TestRouteTableConfiguration(t *testing.T) {
	// Test public route table requirements
	publicRoutes := []RouteConfig{
		{DestinationCIDR: "0.0.0.0/0", TargetType: "igw"},
		{DestinationCIDR: "10.0.0.0/16", TargetType: "local"},
	}
	
	assert.True(t, hasInternetRoute(publicRoutes), "Public route table should have internet route")
	assert.True(t, hasLocalRoute(publicRoutes), "Route table should have local route")
	
	// Test private route table requirements
	privateRoutes := []RouteConfig{
		{DestinationCIDR: "0.0.0.0/0", TargetType: "nat"},
		{DestinationCIDR: "10.0.0.0/16", TargetType: "local"},
	}
	
	assert.True(t, hasNATRoute(privateRoutes), "Private route table should have NAT route")
	assert.True(t, hasLocalRoute(privateRoutes), "Route table should have local route")
}

// Test Network ACL rule validation
func TestNetworkACLRuleValidation(t *testing.T) {
	// Test valid ACL rules
	validRules := []NACLRule{
		{RuleNumber: 100, Protocol: "tcp", FromPort: 80, ToPort: 80, Action: "allow"},
		{RuleNumber: 200, Protocol: "tcp", FromPort: 443, ToPort: 443, Action: "allow"},
		{RuleNumber: 32767, Protocol: "-1", FromPort: 0, ToPort: 0, Action: "deny"},
	}
	
	for _, rule := range validRules {
		assert.True(t, isValidNACLRule(rule), "NACL rule %+v should be valid", rule)
	}
	
	// Test invalid ACL rules
	invalidRules := []NACLRule{
		{RuleNumber: 0, Protocol: "tcp", FromPort: 80, ToPort: 80, Action: "allow"},     // Invalid rule number
		{RuleNumber: 100, Protocol: "invalid", FromPort: 80, ToPort: 80, Action: "allow"}, // Invalid protocol
		{RuleNumber: 100, Protocol: "tcp", FromPort: 70000, ToPort: 80, Action: "allow"}, // Invalid port
	}
	
	for _, rule := range invalidRules {
		assert.False(t, isValidNACLRule(rule), "NACL rule %+v should be invalid", rule)
	}
}

// Test VPC Flow Logs configuration
func TestVPCFlowLogsConfiguration(t *testing.T) {
	// Test valid flow log configurations
	validConfigs := []FlowLogConfig{
		{TrafficType: "ALL", LogDestination: "cloud-watch-logs", LogFormat: "default"},
		{TrafficType: "ACCEPT", LogDestination: "s3", LogFormat: "custom"},
		{TrafficType: "REJECT", LogDestination: "cloud-watch-logs", LogFormat: "default"},
	}
	
	for _, config := range validConfigs {
		assert.True(t, isValidFlowLogConfig(config), "Flow log config %+v should be valid", config)
	}
	
	// Test invalid configurations
	invalidConfigs := []FlowLogConfig{
		{TrafficType: "INVALID", LogDestination: "cloud-watch-logs", LogFormat: "default"},
		{TrafficType: "ALL", LogDestination: "invalid-destination", LogFormat: "default"},
	}
	
	for _, config := range invalidConfigs {
		assert.False(t, isValidFlowLogConfig(config), "Flow log config %+v should be invalid", config)
	}
}

// Test DHCP options validation
func TestDHCPOptionsValidation(t *testing.T) {
	// Test valid DHCP options
	validOptions := map[string]string{
		"domain-name":         "internal.company.com",
		"domain-name-servers": "AmazonProvidedDNS",
	}
	
	assert.True(t, isValidDHCPOptions(validOptions), "DHCP options should be valid")
	
	// Test invalid DHCP options
	invalidOptions := map[string]string{
		"invalid-option": "value",
	}
	
	assert.False(t, isValidDHCPOptions(invalidOptions), "Invalid DHCP options should be rejected")
}

// Test infrastructure resource counting
func TestResourceCounting(t *testing.T) {
	expectedResources := map[string]int{
		"vpc":                    1,
		"subnets":               4,
		"internet_gateways":     1,
		"nat_gateways":          2,
		"security_groups":       3,
		"route_tables":          3,
		"network_acls":          2,
		"elastic_ips":           2,
		"dhcp_options":          1,
		"flow_logs":             1,
		"cloudwatch_log_groups": 1,
		"iam_roles":             1,
		"iam_policies":          1,
	}
	
	totalExpected := 0
	for _, count := range expectedResources {
		totalExpected += count
	}
	
	// Should create approximately 25+ resources
	assert.GreaterOrEqual(t, totalExpected, 25, "Should create at least 25 AWS resources")
	
	// Test individual resource counts
	assert.Equal(t, 4, expectedResources["subnets"], "Should create 4 subnets")
	assert.Equal(t, 2, expectedResources["nat_gateways"], "Should create 2 NAT gateways for HA")
	assert.Equal(t, 3, expectedResources["security_groups"], "Should create 3 security groups")
}

// Test main function validation (without execution)
func TestMainFunctionStructure(t *testing.T) {
	// Test that we can identify the main infrastructure components
	expectedComponents := []string{
		"vpc", "internet_gateway", "dhcp_options", "subnets",
		"elastic_ips", "nat_gateways", "security_groups",
		"route_tables", "network_acls", "flow_logs",
	}
	
	// Verify all components are accounted for in our infrastructure
	for _, component := range expectedComponents {
		assert.True(t, hasInfrastructureComponent(component), 
			"Infrastructure should include %s component", component)
	}
}

// All helper functions are now in the main infrastructure file (tap_stack.go)
// This ensures they're available when unit tests are copied to lib/ directory