//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// OutputData represents the structure of flat-outputs.json
type OutputData struct {
	AvailabilityZones   string `json:"availabilityZones"`
	EnvironmentSuffix   string `json:"environmentSuffix"`
	InternetGatewayId   string `json:"internetGatewayId"`
	PrivateRouteTableId string `json:"privateRouteTableId"`
	PrivateSubnetIds    string `json:"privateSubnetIds"`
	PublicRouteTableId  string `json:"publicRouteTableId"`
	PublicSubnetIds     string `json:"publicSubnetIds"`
	ResourcePrefix      string `json:"resourcePrefix"`
	VpcCidrBlock        string `json:"vpcCidrBlock"`
	VpcId               string `json:"vpcId"`
}

var (
	ec2Client *ec2.Client
	outputs   *OutputData
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		panic(err)
	}
	ec2Client = ec2.NewFromConfig(cfg)
}

// loadOutputs loads and parses the flat-outputs.json file
func loadOutputs(t *testing.T) *OutputData {
	if outputs != nil {
		return outputs
	}

	outputsFile := "../cfn-outputs/flat-outputs.json"
	data, err := ioutil.ReadFile(outputsFile)
	require.NoError(t, err, "Failed to read outputs file")

	outputs = &OutputData{}
	err = json.Unmarshal(data, outputs)
	require.NoError(t, err, "Failed to parse outputs JSON")

	return outputs
}

// TestVPCExists tests VPC exists and has correct configuration per PROMPT.md
func TestVPCExists(t *testing.T) {
	outputs := loadOutputs(t)

	result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err, "Failed to describe VPC")
	require.Len(t, result.Vpcs, 1, "VPC should exist")

	vpc := result.Vpcs[0]
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC CIDR should be 10.0.0.0/16 per PROMPT.md")
	assert.Equal(t, types.VpcStateAvailable, vpc.State, "VPC should be available")

	// Check VPC attributes separately
	attrsResult, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     &outputs.VpcId,
		Attribute: types.VpcAttributeNameEnableDnsHostnames,
	})
	require.NoError(t, err, "Failed to get DNS hostnames attribute")
	assert.True(t, *attrsResult.EnableDnsHostnames.Value, "DNS hostnames should be enabled per PROMPT.md")

	attrsResult2, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     &outputs.VpcId,
		Attribute: types.VpcAttributeNameEnableDnsSupport,
	})
	require.NoError(t, err, "Failed to get DNS support attribute")
	assert.True(t, *attrsResult2.EnableDnsSupport.Value, "DNS support should be enabled per PROMPT.md")
}

// TestPublicSubnets tests public subnets configuration per PROMPT.md
func TestPublicSubnets(t *testing.T) {
	outputs := loadOutputs(t)

	var publicSubnetIds []string
	err := json.Unmarshal([]byte(outputs.PublicSubnetIds), &publicSubnetIds)
	require.NoError(t, err)
	require.Len(t, publicSubnetIds, 2, "Should have 2 public subnets per PROMPT.md")

	result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: publicSubnetIds,
	})
	require.NoError(t, err, "Failed to describe public subnets")
	require.Len(t, result.Subnets, 2, "Should have 2 public subnets")

	expectedCidrs := []string{"10.0.1.0/24", "10.0.2.0/24"}
	actualCidrs := make([]string, len(result.Subnets))
	azs := make([]string, len(result.Subnets))

	for i, subnet := range result.Subnets {
		actualCidrs[i] = *subnet.CidrBlock
		azs[i] = *subnet.AvailabilityZone
		assert.Equal(t, outputs.VpcId, *subnet.VpcId, "Subnet should be in correct VPC")
		assert.True(t, *subnet.MapPublicIpOnLaunch, "Public subnets should map public IP on launch")
		assert.Equal(t, types.SubnetStateAvailable, subnet.State, "Subnet should be available")
	}

	assert.ElementsMatch(t, expectedCidrs, actualCidrs, "Public subnet CIDRs should match PROMPT.md")
	assert.NotEqual(t, azs[0], azs[1], "Public subnets should be in different AZs per PROMPT.md")
}

// TestPrivateSubnets tests private subnets configuration per PROMPT.md
func TestPrivateSubnets(t *testing.T) {
	outputs := loadOutputs(t)

	var privateSubnetIds []string
	err := json.Unmarshal([]byte(outputs.PrivateSubnetIds), &privateSubnetIds)
	require.NoError(t, err)
	require.Len(t, privateSubnetIds, 2, "Should have 2 private subnets per PROMPT.md")

	result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: privateSubnetIds,
	})
	require.NoError(t, err, "Failed to describe private subnets")
	require.Len(t, result.Subnets, 2, "Should have 2 private subnets")

	expectedCidrs := []string{"10.0.10.0/24", "10.0.11.0/24"}
	actualCidrs := make([]string, len(result.Subnets))
	azs := make([]string, len(result.Subnets))

	for i, subnet := range result.Subnets {
		actualCidrs[i] = *subnet.CidrBlock
		azs[i] = *subnet.AvailabilityZone
		assert.Equal(t, outputs.VpcId, *subnet.VpcId, "Subnet should be in correct VPC")
		assert.False(t, *subnet.MapPublicIpOnLaunch, "Private subnets should not map public IP on launch")
		assert.Equal(t, types.SubnetStateAvailable, subnet.State, "Subnet should be available")
	}

	assert.ElementsMatch(t, expectedCidrs, actualCidrs, "Private subnet CIDRs should match PROMPT.md")
	assert.NotEqual(t, azs[0], azs[1], "Private subnets should be in different AZs per PROMPT.md")
}

// TestInternetGateway tests IGW exists and is attached per PROMPT.md
func TestInternetGateway(t *testing.T) {
	outputs := loadOutputs(t)

	result, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []string{outputs.InternetGatewayId},
	})
	require.NoError(t, err, "Failed to describe Internet Gateway")
	require.Len(t, result.InternetGateways, 1, "Internet Gateway should exist")

	igw := result.InternetGateways[0]
	require.Len(t, igw.Attachments, 1, "IGW should have one attachment")
	assert.Equal(t, outputs.VpcId, *igw.Attachments[0].VpcId, "IGW should be attached to correct VPC")
	assert.Equal(t, types.AttachmentStatusAttached, igw.Attachments[0].State, "IGW should be attached")
}

// TestPublicRouteTable tests public route table configuration per PROMPT.md
func TestPublicRouteTable(t *testing.T) {
	outputs := loadOutputs(t)

	result, err := ec2Client.DescribeRouteTables(context.TODO(), &ec2.DescribeRouteTablesInput{
		RouteTableIds: []string{outputs.PublicRouteTableId},
	})
	require.NoError(t, err, "Failed to describe public route table")
	require.Len(t, result.RouteTables, 1, "Public route table should exist")

	rt := result.RouteTables[0]
	assert.Equal(t, outputs.VpcId, *rt.VpcId, "Route table should be in correct VPC")

	// Check for default route to IGW
	hasDefaultRoute := false
	for _, route := range rt.Routes {
		if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" {
			hasDefaultRoute = true
			assert.Equal(t, outputs.InternetGatewayId, *route.GatewayId, "Default route should point to IGW")
			assert.Equal(t, types.RouteStateActive, route.State, "Route should be active")
		}
	}
	assert.True(t, hasDefaultRoute, "Public route table should have default route to IGW per PROMPT.md")

	// Check subnet associations
	var publicSubnetIds []string
	json.Unmarshal([]byte(outputs.PublicSubnetIds), &publicSubnetIds)

	associatedSubnets := make([]string, 0)
	for _, assoc := range rt.Associations {
		if assoc.SubnetId != nil {
			associatedSubnets = append(associatedSubnets, *assoc.SubnetId)
		}
	}
	assert.ElementsMatch(t, publicSubnetIds, associatedSubnets, "Public route table should be associated with public subnets")
}

// TestPrivateRouteTable tests private route table exists
func TestPrivateRouteTable(t *testing.T) {
	outputs := loadOutputs(t)

	result, err := ec2Client.DescribeRouteTables(context.TODO(), &ec2.DescribeRouteTablesInput{
		RouteTableIds: []string{outputs.PrivateRouteTableId},
	})
	require.NoError(t, err, "Failed to describe private route table")
	require.Len(t, result.RouteTables, 1, "Private route table should exist")

	rt := result.RouteTables[0]
	assert.Equal(t, outputs.VpcId, *rt.VpcId, "Route table should be in correct VPC")

	// Check subnet associations
	var privateSubnetIds []string
	json.Unmarshal([]byte(outputs.PrivateSubnetIds), &privateSubnetIds)

	associatedSubnets := make([]string, 0)
	for _, assoc := range rt.Associations {
		if assoc.SubnetId != nil {
			associatedSubnets = append(associatedSubnets, *assoc.SubnetId)
		}
	}
	assert.ElementsMatch(t, privateSubnetIds, associatedSubnets, "Private route table should be associated with private subnets")
}

// TestResourceNaming tests naming conventions per PROMPT.md
func TestResourceNaming(t *testing.T) {
	outputs := loadOutputs(t)

	// Test VPC tags
	result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err)

	vpc := result.Vpcs[0]
	nameTag := getTagValue(vpc.Tags, "Name")
	assert.True(t, strings.HasPrefix(nameTag, "iac-task-"), "VPC name should have iac-task prefix per PROMPT.md")
	assert.Contains(t, nameTag, "vpc", "VPC name should contain 'vpc'")

	// Test subnet tags
	var allSubnetIds []string
	var publicSubnetIds, privateSubnetIds []string
	json.Unmarshal([]byte(outputs.PublicSubnetIds), &publicSubnetIds)
	json.Unmarshal([]byte(outputs.PrivateSubnetIds), &privateSubnetIds)
	allSubnetIds = append(allSubnetIds, publicSubnetIds...)
	allSubnetIds = append(allSubnetIds, privateSubnetIds...)

	subnetResult, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: allSubnetIds,
	})
	require.NoError(t, err)

	for _, subnet := range subnetResult.Subnets {
		nameTag := getTagValue(subnet.Tags, "Name")
		assert.True(t, strings.HasPrefix(nameTag, "iac-task-"), "Subnet name should have iac-task prefix per PROMPT.md")
		assert.Contains(t, nameTag, "subnet", "Subnet name should contain 'subnet'")
	}
}

// TestRegionCompliance tests deployment is in us-east-1 per PROMPT.md
func TestRegionCompliance(t *testing.T) {
	outputs := loadOutputs(t)

	var azList []string
	err := json.Unmarshal([]byte(outputs.AvailabilityZones), &azList)
	require.NoError(t, err)

	for _, az := range azList {
		assert.True(t, strings.HasPrefix(az, "us-east-1"), "All AZs should be in us-east-1 region per PROMPT.md")
	}
}

// TestVPCLatticeReadiness tests VPC configuration for VPC Lattice per PROMPT.md
func TestVPCLatticeReadiness(t *testing.T) {
	outputs := loadOutputs(t)

	result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err)

	vpc := result.Vpcs[0]
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should use IPv4 CIDR for VPC Lattice integration")

	// Check VPC attributes for VPC Lattice readiness
	attrsResult, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     &outputs.VpcId,
		Attribute: types.VpcAttributeNameEnableDnsHostnames,
	})
	require.NoError(t, err)
	assert.True(t, *attrsResult.EnableDnsHostnames.Value, "DNS hostnames required for VPC Lattice")

	attrsResult2, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     &outputs.VpcId,
		Attribute: types.VpcAttributeNameEnableDnsSupport,
	})
	require.NoError(t, err)
	assert.True(t, *attrsResult2.EnableDnsSupport.Value, "DNS support required for VPC Lattice")
}

// TestPrivateLinkReadiness tests subnet architecture for PrivateLink per PROMPT.md
func TestPrivateLinkReadiness(t *testing.T) {
	outputs := loadOutputs(t)

	var privateSubnetIds []string
	json.Unmarshal([]byte(outputs.PrivateSubnetIds), &privateSubnetIds)

	result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: privateSubnetIds,
	})
	require.NoError(t, err)

	azs := make(map[string]bool)
	for _, subnet := range result.Subnets {
		azs[*subnet.AvailabilityZone] = true
		assert.Equal(t, types.SubnetStateAvailable, subnet.State, "Private subnets should be available for PrivateLink endpoints")
	}

	assert.True(t, len(azs) >= 2, "Should have private subnets in multiple AZs for PrivateLink HA")
}

// TestResourceTags tests proper tagging per PROMPT.md
func TestResourceTags(t *testing.T) {
	outputs := loadOutputs(t)

	// Test VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err)

	vpc := vpcResult.Vpcs[0]
	assert.NotEmpty(t, getTagValue(vpc.Tags, "Name"), "VPC should have Name tag")
	assert.NotEmpty(t, getTagValue(vpc.Tags, "Project"), "VPC should have Project tag")

	// Test IGW tags
	igwResult, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []string{outputs.InternetGatewayId},
	})
	require.NoError(t, err)

	igw := igwResult.InternetGateways[0]
	assert.NotEmpty(t, getTagValue(igw.Tags, "Name"), "IGW should have Name tag")
	assert.NotEmpty(t, getTagValue(igw.Tags, "Project"), "IGW should have Project tag")
}

// getTagValue helper function to get tag value by key
func getTagValue(tags []types.Tag, key string) string {
	for _, tag := range tags {
		if *tag.Key == key {
			return *tag.Value
		}
	}
	return ""
}
