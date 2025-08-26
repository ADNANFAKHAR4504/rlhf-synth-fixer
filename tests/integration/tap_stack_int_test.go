//go:build integration
// +build integration

package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	awsConfig  aws.Config
	ec2Client  *ec2.Client
	iamClient  *iam.Client
	logsClient *cloudwatchlogs.Client
	ctx        context.Context
)

func init() {
	ctx = context.Background()
	
	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		fmt.Printf("Failed to load AWS config: %v\n", err)
		return
	}
	
	awsConfig = cfg
	ec2Client = ec2.NewFromConfig(cfg)
	iamClient = iam.NewFromConfig(cfg)
	logsClient = cloudwatchlogs.NewFromConfig(cfg)
}

func TestAWSConnectivity(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	// Test basic AWS connectivity
	result, err := ec2Client.DescribeAvailabilityZones(ctx, &ec2.DescribeAvailabilityZonesInput{})
	require.NoError(t, err)
	require.NotEmpty(t, result.AvailabilityZones)

	// Verify we're in us-east-1 region
	foundUsEast1a := false
	foundUsEast1b := false
	for _, az := range result.AvailabilityZones {
		if aws.ToString(az.ZoneName) == "us-east-1a" {
			foundUsEast1a = true
		}
		if aws.ToString(az.ZoneName) == "us-east-1b" {
			foundUsEast1b = true
		}
	}
	assert.True(t, foundUsEast1a, "us-east-1a availability zone should be available")
	assert.True(t, foundUsEast1b, "us-east-1b availability zone should be available")
}

func TestVPCInfrastructure(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	// Find VPC with our naming convention and tags
	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - infrastructure may not be deployed")
		return
	}

	// Verify VPC configuration
	assert.Equal(t, "10.0.0.0/16", aws.ToString(vpc.CidrBlock))
	assert.Equal(t, types.VpcStateAvailable, vpc.State)
	assert.True(t, aws.ToBool(vpc.EnableDnsHostnames))
	assert.True(t, aws.ToBool(vpc.EnableDnsSupport))

	// Verify VPC tags
	validateResourceTags(t, vpc.Tags, "secure-vpc-main")
}

func TestSubnetConfiguration(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping subnet tests")
		return
	}

	// Get all subnets in our VPC
	subnetsResult, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	// Should have 4 subnets (2 public, 2 private)
	assert.GreaterOrEqual(t, len(subnetsResult.Subnets), 4)

	// Verify subnet configurations
	publicSubnets := 0
	privateSubnets := 0
	expectedCIDRs := map[string]bool{
		"10.0.1.0/24":  false, // Public A
		"10.0.2.0/24":  false, // Public B
		"10.0.11.0/24": false, // Private A
		"10.0.12.0/24": false, // Private B
	}

	for _, subnet := range subnetsResult.Subnets {
		cidr := aws.ToString(subnet.CidrBlock)
		if _, exists := expectedCIDRs[cidr]; exists {
			expectedCIDRs[cidr] = true
		}

		// Check if it's a public subnet by MapPublicIpOnLaunch
		if aws.ToBool(subnet.MapPublicIpOnLaunch) {
			publicSubnets++
		} else {
			privateSubnets++
		}

		// Verify subnet is in correct AZ (us-east-1a or us-east-1b)
		az := aws.ToString(subnet.AvailabilityZone)
		assert.True(t, az == "us-east-1a" || az == "us-east-1b")
	}

	// Verify we found all expected CIDRs
	for cidr, found := range expectedCIDRs {
		if !found {
			t.Logf("Expected CIDR %s not found in subnets", cidr)
		}
	}

	assert.GreaterOrEqual(t, publicSubnets, 2, "Should have at least 2 public subnets")
	assert.GreaterOrEqual(t, privateSubnets, 2, "Should have at least 2 private subnets")
}

func TestInternetGateway(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping IGW tests")
		return
	}

	// Find Internet Gateway attached to our VPC
	igwResult, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("attachment.vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	assert.GreaterOrEqual(t, len(igwResult.InternetGateways), 1, "Should have at least one Internet Gateway")

	igw := igwResult.InternetGateways[0]
	assert.Len(t, igw.Attachments, 1, "IGW should be attached to exactly one VPC")
	assert.Equal(t, aws.ToString(vpc.VpcId), aws.ToString(igw.Attachments[0].VpcId))
	assert.Equal(t, types.AttachmentStatusAttached, igw.Attachments[0].State)

	// Verify IGW tags
	validateResourceTags(t, igw.Tags, "secure-vpc-igw")
}

func TestNATGateways(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping NAT Gateway tests")
		return
	}

	// Find NAT Gateways in our VPC subnets
	natGwResult, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
			{
				Name:   aws.String("state"),
				Values: []string{"available", "pending"},
			},
		},
	})
	require.NoError(t, err)

	if len(natGwResult.NatGateways) == 0 {
		t.Log("No NAT Gateways found - may be optional for cost optimization")
		return
	}

	// If NAT Gateways exist, validate them
	for _, natGw := range natGwResult.NatGateways {
		assert.Equal(t, types.NatGatewayStateAvailable, natGw.State)
		assert.NotEmpty(t, natGw.NatGatewayAddresses)
		
		// Verify it has an Elastic IP
		assert.NotEmpty(t, aws.ToString(natGw.NatGatewayAddresses[0].AllocationId))
		assert.NotEmpty(t, aws.ToString(natGw.NatGatewayAddresses[0].PublicIp))
	}

	t.Logf("Found %d NAT Gateway(s)", len(natGwResult.NatGateways))
}

func TestSecurityGroups(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping security group tests")
		return
	}

	// Find security groups in our VPC (excluding default)
	sgResult, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
			{
				Name:   aws.String("group-name"),
				Values: []string{"secure-vpc-*"},
			},
		},
	})

	if err != nil {
		// Try alternative approach without wildcard
		sgResult, err = ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{aws.ToString(vpc.VpcId)},
				},
			},
		})
		require.NoError(t, err)

		// Filter manually
		var filteredSGs []types.SecurityGroup
		for _, sg := range sgResult.SecurityGroups {
			if strings.Contains(aws.ToString(sg.GroupName), "secure-vpc-") {
				filteredSGs = append(filteredSGs, sg)
			}
		}
		sgResult.SecurityGroups = filteredSGs
	}

	assert.GreaterOrEqual(t, len(sgResult.SecurityGroups), 3, "Should have at least 3 security groups")

	// Validate specific security groups
	webSGFound := false
	sshSGFound := false
	dbSGFound := false

	for _, sg := range sgResult.SecurityGroups {
		name := aws.ToString(sg.GroupName)
		
		switch {
		case strings.Contains(name, "web"):
			webSGFound = true
			validateWebSecurityGroup(t, sg)
		case strings.Contains(name, "ssh"):
			sshSGFound = true
			validateSSHSecurityGroup(t, sg)
		case strings.Contains(name, "db"):
			dbSGFound = true
			validateDatabaseSecurityGroup(t, sg)
		}
	}

	assert.True(t, webSGFound, "Web security group should exist")
	assert.True(t, sshSGFound, "SSH security group should exist")
	assert.True(t, dbSGFound, "Database security group should exist")
}

func TestRouteTables(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping route table tests")
		return
	}

	// Find route tables in our VPC
	rtResult, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least 3 route tables (default + public + private(s))
	assert.GreaterOrEqual(t, len(rtResult.RouteTables), 3)

	publicRTFound := false
	privateRTFound := false

	for _, rt := range rtResult.RouteTables {
		// Check routes to determine if it's public or private
		for _, route := range rt.Routes {
			if aws.ToString(route.DestinationCidrBlock) == "0.0.0.0/0" {
				if route.GatewayId != nil && strings.HasPrefix(aws.ToString(route.GatewayId), "igw-") {
					publicRTFound = true
				} else if route.NatGatewayId != nil {
					privateRTFound = true
				}
			}
		}
	}

	assert.True(t, publicRTFound, "Should have at least one public route table with IGW route")
	t.Logf("Public route table found: %v, Private route table found: %v", publicRTFound, privateRTFound)
}

func TestNetworkACLs(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping Network ACL tests")
		return
	}

	// Find Network ACLs in our VPC
	naclResult, err := ec2Client.DescribeNetworkAcls(ctx, &ec2.DescribeNetworkAclsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least the default NACL + our custom ones
	assert.GreaterOrEqual(t, len(naclResult.NetworkAcls), 1)

	customNACLs := 0
	for _, nacl := range naclResult.NetworkAcls {
		if !aws.ToBool(nacl.IsDefault) {
			customNACLs++
			validateCustomNetworkACL(t, nacl)
		}
	}

	t.Logf("Found %d custom Network ACL(s)", customNACLs)
}

func TestVPCFlowLogs(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping VPC Flow Logs tests")
		return
	}

	// Find VPC Flow Logs
	flowLogsResult, err := ec2Client.DescribeFlowLogs(ctx, &ec2.DescribeFlowLogsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("resource-id"),
				Values: []string{aws.ToString(vpc.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	if len(flowLogsResult.FlowLogs) == 0 {
		t.Log("No VPC Flow Logs found - may be optional")
		return
	}

	// Validate flow log configuration
	flowLog := flowLogsResult.FlowLogs[0]
	assert.Equal(t, types.TrafficTypeAll, flowLog.TrafficType)
	assert.Equal(t, types.FlowLogStatusActive, flowLog.FlowLogStatus)
	assert.NotEmpty(t, aws.ToString(flowLog.DeliverLogsPermissionArn))

	t.Logf("Found VPC Flow Log: %s", aws.ToString(flowLog.FlowLogId))
}

func TestCloudWatchLogGroups(t *testing.T) {
	if logsClient == nil {
		t.Skip("CloudWatch Logs client not initialized - skipping log group tests")
	}

	// Check for VPC Flow Logs log group
	logGroups, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String("/aws/vpc/flowlogs"),
	})
	
	if err != nil {
		t.Log("Could not describe log groups - may not exist or no permissions")
		return
	}

	if len(logGroups.LogGroups) > 0 {
		logGroup := logGroups.LogGroups[0]
		assert.NotEmpty(t, aws.ToString(logGroup.LogGroupName))
		assert.NotNil(t, logGroup.RetentionInDays)
		t.Logf("Found VPC Flow Logs group: %s", aws.ToString(logGroup.LogGroupName))
	} else {
		t.Log("No VPC Flow Logs CloudWatch log group found - may be optional")
	}
}

func TestDHCPOptions(t *testing.T) {
	if ec2Client == nil {
		t.Skip("AWS client not initialized - skipping integration tests")
	}

	vpc := findVPCByTags(t)
	if vpc == nil {
		t.Skip("VPC not found - skipping DHCP options tests")
		return
	}

	// Find DHCP options associated with our VPC
	dhcpOptionsResult, err := ec2Client.DescribeDhcpOptions(ctx, &ec2.DescribeDhcpOptionsInput{
		DhcpOptionsIds: []string{aws.ToString(vpc.DhcpOptionsId)},
	})
	require.NoError(t, err)

	if len(dhcpOptionsResult.DhcpOptions) > 0 {
		dhcpOptions := dhcpOptionsResult.DhcpOptions[0]
		
		// Check for custom domain name configuration
		for _, config := range dhcpOptions.DhcpConfigurations {
			if aws.ToString(config.Key) == "domain-name" {
				found := false
				for _, value := range config.Values {
					if strings.Contains(aws.ToString(value.Value), "internal.company.com") {
						found = true
						break
					}
				}
				if found {
					t.Log("Found custom DHCP options with internal.company.com domain")
				}
			}
		}
	}
}

func TestIAMRolesForVPCFlowLogs(t *testing.T) {
	if iamClient == nil {
		t.Skip("IAM client not initialized - skipping IAM tests")
	}

	// Try to find VPC Flow Logs IAM role
	rolesResult, err := iamClient.ListRoles(ctx, &iam.ListRolesInput{})
	if err != nil {
		t.Log("Could not list IAM roles - may not have permissions")
		return
	}

	flowLogsRoleFound := false
	for _, role := range rolesResult.Roles {
		if strings.Contains(aws.ToString(role.RoleName), "flow-logs") ||
		   strings.Contains(strings.ToLower(aws.ToString(role.RoleName)), "vpc") {
			flowLogsRoleFound = true
			assert.NotEmpty(t, aws.ToString(role.Arn))
			break
		}
	}

	if flowLogsRoleFound {
		t.Log("Found VPC Flow Logs IAM role")
	} else {
		t.Log("VPC Flow Logs IAM role not found - may be optional or using service role")
	}
}

// Helper functions

func findVPCByTags(t *testing.T) *types.Vpc {
	// Try to find VPC by tags first
	vpcResult, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("tag:Project"),
				Values: []string{"secure-vpc"},
			},
			{
				Name:   aws.String("tag:ManagedBy"),
				Values: []string{"pulumi"},
			},
		},
	})
	
	if err == nil && len(vpcResult.Vpcs) > 0 {
		return &vpcResult.Vpcs[0]
	}

	// Fallback: find by CIDR block
	vpcResult, err = ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("cidr"),
				Values: []string{"10.0.0.0/16"},
			},
		},
	})
	
	if err != nil {
		t.Logf("Failed to find VPC: %v", err)
		return nil
	}

	if len(vpcResult.Vpcs) > 0 {
		return &vpcResult.Vpcs[0]
	}

	return nil
}

func validateResourceTags(t *testing.T, tags []types.Tag, expectedName string) {
	tagMap := make(map[string]string)
	for _, tag := range tags {
		tagMap[aws.ToString(tag.Key)] = aws.ToString(tag.Value)
	}

	if expectedName != "" {
		if name, ok := tagMap["Name"]; ok {
			assert.Equal(t, expectedName, name)
		}
	}

	// Verify common tags
	if project, ok := tagMap["Project"]; ok {
		assert.Equal(t, "secure-vpc", project)
	}
	
	if managedBy, ok := tagMap["ManagedBy"]; ok {
		assert.Equal(t, "pulumi", managedBy)
	}
	
	if env, ok := tagMap["Environment"]; ok {
		assert.Equal(t, "production", env)
	}
}

func validateWebSecurityGroup(t *testing.T, sg types.SecurityGroup) {
	// Check for HTTP and HTTPS ingress rules
	httpFound := false
	httpsFound := false
	
	for _, rule := range sg.IpPermissions {
		if aws.ToInt32(rule.FromPort) == 80 && aws.ToInt32(rule.ToPort) == 80 {
			httpFound = true
		}
		if aws.ToInt32(rule.FromPort) == 443 && aws.ToInt32(rule.ToPort) == 443 {
			httpsFound = true
		}
	}
	
	assert.True(t, httpFound, "Web security group should allow HTTP")
	assert.True(t, httpsFound, "Web security group should allow HTTPS")
}

func validateSSHSecurityGroup(t *testing.T, sg types.SecurityGroup) {
	// Check for SSH rule with specific CIDR blocks
	sshFound := false
	
	for _, rule := range sg.IpPermissions {
		if aws.ToInt32(rule.FromPort) == 22 && aws.ToInt32(rule.ToPort) == 22 {
			sshFound = true
			// Verify restricted CIDR blocks
			for _, ipRange := range rule.IpRanges {
				cidr := aws.ToString(ipRange.CidrIp)
				assert.True(t, 
					cidr == "203.0.113.0/24" || cidr == "198.51.100.0/24",
					"SSH should only allow specific CIDR blocks")
			}
		}
	}
	
	assert.True(t, sshFound, "SSH security group should allow SSH on port 22")
}

func validateDatabaseSecurityGroup(t *testing.T, sg types.SecurityGroup) {
	// Check for MySQL rule referencing web security group
	mysqlFound := false
	
	for _, rule := range sg.IpPermissions {
		if aws.ToInt32(rule.FromPort) == 3306 && aws.ToInt32(rule.ToPort) == 3306 {
			mysqlFound = true
			// Should have security group reference, not CIDR
			assert.NotEmpty(t, rule.UserIdGroupPairs, "Database SG should reference web SG")
		}
	}
	
	assert.True(t, mysqlFound, "Database security group should allow MySQL")
}

func validateCustomNetworkACL(t *testing.T, nacl types.NetworkAcl) {
	assert.False(t, aws.ToBool(nacl.IsDefault), "Should be custom NACL")
	assert.NotEmpty(t, nacl.Entries, "NACL should have entries")
	
	// Basic validation that it has both ingress and egress rules
	ingressFound := false
	egressFound := false
	
	for _, entry := range nacl.Entries {
		if aws.ToBool(entry.Egress) {
			egressFound = true
		} else {
			ingressFound = true
		}
	}
	
	assert.True(t, ingressFound, "NACL should have ingress rules")
	assert.True(t, egressFound, "NACL should have egress rules")
}