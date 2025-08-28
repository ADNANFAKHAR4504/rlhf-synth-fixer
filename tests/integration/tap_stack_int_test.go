//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// PulumiOutputs represents the structure of Pulumi stack outputs
type PulumiOutputs struct {
	VpcID                   string `json:"vpcId"`
	InternetGatewayID       string `json:"internetGatewayId"`
	PublicSubnetAID         string `json:"publicSubnetAId"`
	PublicSubnetBID         string `json:"publicSubnetBId"`
	PrivateSubnetAID        string `json:"privateSubnetAId"`
	PrivateSubnetBID        string `json:"privateSubnetBId"`
	NatGatewayAID           string `json:"natGatewayAId"`
	NatGatewayBID           string `json:"natGatewayBId"`
	ElasticIPAAddress       string `json:"elasticIpAAddress"`
	ElasticIPBAddress       string `json:"elasticIpBAddress"`
	WebSecurityGroupID      string `json:"webSecurityGroupId"`
	SSHSecurityGroupID      string `json:"sshSecurityGroupId"`
	DatabaseSecurityGroupID string `json:"databaseSecurityGroupId"`
	Subnets                 string `json:"subnets"`
}

var (
	awsConfig    aws.Config
	ec2Client    *ec2.Client
	outputs      *PulumiOutputs
	stackName    string
	outputsCache *PulumiOutputs
)

// Setup function to initialize AWS clients and read Pulumi outputs
func setup(t *testing.T) {
	t.Helper()

	// Skip if running in CI without deployment
	if os.Getenv("SKIP_INTEGRATION_TESTS") == "true" {
		t.Skip("Skipping integration tests as SKIP_INTEGRATION_TESTS is set")
	}

	// Load AWS configuration
	var err error
	awsConfig, err = config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		t.Skip("AWS config not available, skipping integration tests")
	}

	// Initialize EC2 client
	ec2Client = ec2.NewFromConfig(awsConfig)

	// Read Pulumi outputs
	outputs = readPulumiOutputs(t)
}

// readPulumiOutputs reads the outputs from the Pulumi stack
func readPulumiOutputs(t *testing.T) *PulumiOutputs {
	t.Helper()

	// Return cached outputs if already loaded
	if outputsCache != nil {
		return outputsCache
	}

	// Get stack name from environment or use default
	stackName = os.Getenv("PULUMI_STACK")
	if stackName == "" {
		stackName = "TapStackpr" + os.Getenv("ENVIRONMENT_SUFFIX")
		if stackName == "TapStackpr" {
			stackName = "TapStack" // fallback to default
		}
	}

	// Try to read from various output files (if exists)
	// Note: Integration tests run in lib/ directory, so we need to check parent directory too
	outputFiles := []string{
		"outputs.json",
		"../outputs.json",
		"cfn-outputs/flat-outputs.json",
		"../cfn-outputs/flat-outputs.json",
		"../cfn-outputs.json",
		"lib/cfn-outputs/flat-outputs.json",
		"flat-outputs.json",
		"../flat-outputs.json",
		"stack-outputs.json",
		"../stack-outputs.json",
	}

	for _, outputFile := range outputFiles {
		if data, err := os.ReadFile(outputFile); err == nil {
			var outputs PulumiOutputs
			if err := json.Unmarshal(data, &outputs); err == nil {
				t.Logf("Successfully read outputs from %s", outputFile)
				outputsCache = &outputs
				return &outputs
			}
		}
	}

	// If output file doesn't exist, try to get from Pulumi CLI
	cmd := exec.Command("pulumi", "stack", "output", "--json", "--stack", stackName)
	output, err := cmd.Output()
	if err != nil {
		// If Pulumi command fails, try to use fallback resource IDs from AWS discovery
		t.Logf("Warning: Could not read Pulumi outputs: %v. Attempting AWS resource discovery...", err)
		return discoverAWSResources(t)
	}

	// Parse the raw outputs
	var rawOutputs map[string]interface{}
	if err := json.Unmarshal(output, &rawOutputs); err != nil {
		t.Fatalf("Failed to parse Pulumi outputs: %v", err)
	}

	// Convert to structured outputs
	outputsJSON, _ := json.Marshal(rawOutputs)
	var outputs PulumiOutputs
	json.Unmarshal(outputsJSON, &outputs)

	outputsCache = &outputs
	return &outputs
}

// Test VPC configuration by verifying actual deployed VPC
func TestVPCDeployment(t *testing.T) {
	setup(t)

	// Skip if no VPC ID in outputs
	if outputs.VpcID == "" {
		t.Skip("No VPC ID found in outputs, infrastructure may not be deployed")
	}

	// Describe the actual VPC
	ctx := context.TODO()
	result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcID},
	})
	require.NoError(t, err)
	require.Len(t, result.Vpcs, 1)

	vpc := result.Vpcs[0]

	// Verify VPC configuration
	assert.Equal(t, "10.0.0.0/16", aws.ToString(vpc.CidrBlock))
	assert.Equal(t, types.VpcStateAvailable, vpc.State)
	// Note: DNS settings are attributes, not direct fields in SDK v2
	// These would need separate DescribeVpcAttribute calls to verify

	// Verify VPC tags
	validateTags(t, vpc.Tags, "secure-vpc-main")
}

// Test Internet Gateway configuration
func TestInternetGatewayDeployment(t *testing.T) {
	setup(t)

	if outputs.InternetGatewayID == "" {
		t.Skip("No Internet Gateway ID found in outputs")
	}

	ctx := context.TODO()
	result, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []string{outputs.InternetGatewayID},
	})
	require.NoError(t, err)
	require.Len(t, result.InternetGateways, 1)

	igw := result.InternetGateways[0]

	// Verify IGW is attached to VPC
	require.Len(t, igw.Attachments, 1)
	assert.Equal(t, outputs.VpcID, aws.ToString(igw.Attachments[0].VpcId))
	// Check attachment state - in AWS SDK v2, we just verify it's not empty
	attachmentState := string(igw.Attachments[0].State)
	assert.NotEmpty(t, attachmentState, "IGW should have an attachment state")
	assert.Contains(t, []string{"attached", "available"}, attachmentState, "IGW should be properly attached")

	validateTags(t, igw.Tags, "secure-vpc-igw")
}

// Test Subnet configurations
func TestSubnetDeployments(t *testing.T) {
	setup(t)

	testCases := []struct {
		name     string
		subnetID string
		expected struct {
			cidr        string
			az          string
			mapPublicIP bool
			isPublic    bool
		}
	}{
		{
			name:     "Public Subnet A",
			subnetID: outputs.PublicSubnetAID,
			expected: struct {
				cidr        string
				az          string
				mapPublicIP bool
				isPublic    bool
			}{
				cidr:        "10.0.1.0/24",
				az:          "us-east-1a",
				mapPublicIP: true,
				isPublic:    true,
			},
		},
		{
			name:     "Public Subnet B",
			subnetID: outputs.PublicSubnetBID,
			expected: struct {
				cidr        string
				az          string
				mapPublicIP bool
				isPublic    bool
			}{
				cidr:        "10.0.2.0/24",
				az:          "us-east-1b",
				mapPublicIP: true,
				isPublic:    true,
			},
		},
		{
			name:     "Private Subnet A",
			subnetID: outputs.PrivateSubnetAID,
			expected: struct {
				cidr        string
				az          string
				mapPublicIP bool
				isPublic    bool
			}{
				cidr:        "10.0.11.0/24",
				az:          "us-east-1a",
				mapPublicIP: false,
				isPublic:    false,
			},
		},
		{
			name:     "Private Subnet B",
			subnetID: outputs.PrivateSubnetBID,
			expected: struct {
				cidr        string
				az          string
				mapPublicIP bool
				isPublic    bool
			}{
				cidr:        "10.0.12.0/24",
				az:          "us-east-1b",
				mapPublicIP: false,
				isPublic:    false,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.subnetID == "" {
				t.Skip("Subnet ID not found in outputs")
			}

			ctx := context.TODO()
			result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				SubnetIds: []string{tc.subnetID},
			})
			require.NoError(t, err)
			require.Len(t, result.Subnets, 1)

			subnet := result.Subnets[0]

			assert.Equal(t, tc.expected.cidr, aws.ToString(subnet.CidrBlock))
			assert.Equal(t, tc.expected.az, aws.ToString(subnet.AvailabilityZone))
			assert.Equal(t, tc.expected.mapPublicIP, aws.ToBool(subnet.MapPublicIpOnLaunch))
			assert.Equal(t, outputs.VpcID, aws.ToString(subnet.VpcId))
		})
	}
}

// Test NAT Gateway configurations
func TestNATGatewayDeployments(t *testing.T) {
	setup(t)

	natGateways := []struct {
		name      string
		gatewayID string
		subnetID  string
		eipAddr   string
	}{
		{
			name:      "NAT Gateway A",
			gatewayID: outputs.NatGatewayAID,
			subnetID:  outputs.PublicSubnetAID,
			eipAddr:   outputs.ElasticIPAAddress,
		},
		{
			name:      "NAT Gateway B",
			gatewayID: outputs.NatGatewayBID,
			subnetID:  outputs.PublicSubnetBID,
			eipAddr:   outputs.ElasticIPBAddress,
		},
	}

	for _, ng := range natGateways {
		t.Run(ng.name, func(t *testing.T) {
			if ng.gatewayID == "" {
				t.Skip("NAT Gateway ID not found in outputs")
			}

			ctx := context.TODO()
			result, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
				NatGatewayIds: []string{ng.gatewayID},
			})
			require.NoError(t, err)
			require.Len(t, result.NatGateways, 1)

			natGateway := result.NatGateways[0]

			assert.Equal(t, types.NatGatewayStateAvailable, natGateway.State)
			assert.Equal(t, ng.subnetID, aws.ToString(natGateway.SubnetId))
			assert.Equal(t, outputs.VpcID, aws.ToString(natGateway.VpcId))

			// Verify NAT Gateway has an Elastic IP
			require.Greater(t, len(natGateway.NatGatewayAddresses), 0)
		})
	}
}

// Test Security Group configurations
func TestSecurityGroupDeployments(t *testing.T) {
	setup(t)

	testCases := []struct {
		name        string
		groupID     string
		description string
		validateFn  func(*testing.T, types.SecurityGroup)
	}{
		{
			name:        "Web Security Group",
			groupID:     outputs.WebSecurityGroupID,
			description: "Security group for web servers",
			validateFn: func(t *testing.T, sg types.SecurityGroup) {
				// Check for HTTP and HTTPS ingress rules
				hasHTTP := false
				hasHTTPS := false
				for _, rule := range sg.IpPermissions {
					if aws.ToInt32(rule.FromPort) == 80 && aws.ToInt32(rule.ToPort) == 80 {
						hasHTTP = true
					}
					if aws.ToInt32(rule.FromPort) == 443 && aws.ToInt32(rule.ToPort) == 443 {
						hasHTTPS = true
					}
				}
				assert.True(t, hasHTTP, "Web security group should allow HTTP")
				assert.True(t, hasHTTPS, "Web security group should allow HTTPS")
			},
		},
		{
			name:        "SSH Security Group",
			groupID:     outputs.SSHSecurityGroupID,
			description: "Security group for SSH access",
			validateFn: func(t *testing.T, sg types.SecurityGroup) {
				// Check for SSH rule with restricted access
				hasSSH := false
				hasRestrictedAccess := false
				for _, rule := range sg.IpPermissions {
					if aws.ToInt32(rule.FromPort) == 22 && aws.ToInt32(rule.ToPort) == 22 {
						hasSSH = true
						// Check if access is restricted (not 0.0.0.0/0)
						for _, ipRange := range rule.IpRanges {
							if aws.ToString(ipRange.CidrIp) != "0.0.0.0/0" {
								hasRestrictedAccess = true
							}
						}
					}
				}
				assert.True(t, hasSSH, "SSH security group should allow SSH")
				assert.True(t, hasRestrictedAccess, "SSH access should be restricted")
			},
		},
		{
			name:        "Database Security Group",
			groupID:     outputs.DatabaseSecurityGroupID,
			description: "Security group for database servers",
			validateFn: func(t *testing.T, sg types.SecurityGroup) {
				// Check for MySQL rule from web security group
				hasMySQL := false
				hasSourceSG := false
				for _, rule := range sg.IpPermissions {
					if aws.ToInt32(rule.FromPort) == 3306 && aws.ToInt32(rule.ToPort) == 3306 {
						hasMySQL = true
						// Check if source is web security group
						for _, userIdGroup := range rule.UserIdGroupPairs {
							if aws.ToString(userIdGroup.GroupId) == outputs.WebSecurityGroupID {
								hasSourceSG = true
							}
						}
					}
				}
				assert.True(t, hasMySQL, "Database security group should allow MySQL")
				assert.True(t, hasSourceSG, "MySQL access should be from web security group only")
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.groupID == "" {
				t.Skip("Security Group ID not found in outputs")
			}

			ctx := context.TODO()
			result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
				GroupIds: []string{tc.groupID},
			})
			require.NoError(t, err)
			require.Len(t, result.SecurityGroups, 1)

			sg := result.SecurityGroups[0]

			assert.Equal(t, tc.description, aws.ToString(sg.Description))
			assert.Equal(t, outputs.VpcID, aws.ToString(sg.VpcId))

			// Run specific validation for this security group
			tc.validateFn(t, sg)
		})
	}
}

// Test Route Table configurations
func TestRouteTableDeployments(t *testing.T) {
	setup(t)

	if outputs.VpcID == "" {
		t.Skip("VPC ID not found in outputs")
	}

	ctx := context.TODO()

	// Get all route tables for the VPC
	result, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcID},
			},
		},
	})
	require.NoError(t, err)

	publicRouteTables := 0
	privateRouteTables := 0

	for _, rt := range result.RouteTables {
		hasInternetRoute := false
		hasNATRoute := false

		for _, route := range rt.Routes {
			if aws.ToString(route.DestinationCidrBlock) == "0.0.0.0/0" {
				if route.GatewayId != nil && aws.ToString(route.GatewayId) != "local" {
					hasInternetRoute = true
				}
				if route.NatGatewayId != nil {
					hasNATRoute = true
				}
			}
		}

		if hasInternetRoute {
			publicRouteTables++
		} else if hasNATRoute {
			privateRouteTables++
		}
	}

	// Should have at least 1 public and 2 private route tables
	assert.GreaterOrEqual(t, publicRouteTables, 1, "Should have at least 1 public route table")
	assert.GreaterOrEqual(t, privateRouteTables, 2, "Should have at least 2 private route tables")
}

// Test Network ACL configurations
func TestNetworkACLDeployments(t *testing.T) {
	setup(t)

	if outputs.VpcID == "" {
		t.Skip("VPC ID not found in outputs")
	}

	ctx := context.TODO()

	// Get all NACLs for the VPC
	result, err := ec2Client.DescribeNetworkAcls(ctx, &ec2.DescribeNetworkAclsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcID},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least 3 NACLs (1 default + 2 custom)
	assert.GreaterOrEqual(t, len(result.NetworkAcls), 3, "Should have at least 3 Network ACLs")

	// Check for custom NACLs (non-default)
	customNACLs := 0
	for _, nacl := range result.NetworkAcls {
		if !aws.ToBool(nacl.IsDefault) {
			customNACLs++

			// Verify NACL has rules
			assert.Greater(t, len(nacl.Entries), 0, "Network ACL should have rules")
		}
	}

	assert.GreaterOrEqual(t, customNACLs, 2, "Should have at least 2 custom Network ACLs")
}

// Test VPC Flow Logs configuration
func TestVPCFlowLogsDeployment(t *testing.T) {
	setup(t)

	if outputs.VpcID == "" {
		t.Skip("VPC ID not found in outputs")
	}

	ctx := context.TODO()

	// Get flow logs for the VPC
	result, err := ec2Client.DescribeFlowLogs(ctx, &ec2.DescribeFlowLogsInput{
		Filter: []types.Filter{
			{
				Name:   aws.String("resource-id"),
				Values: []string{outputs.VpcID},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least 1 flow log
	assert.GreaterOrEqual(t, len(result.FlowLogs), 1, "VPC should have at least 1 flow log")

	if len(result.FlowLogs) > 0 {
		flowLog := result.FlowLogs[0]

		// Verify flow log configuration
		assert.Equal(t, outputs.VpcID, aws.ToString(flowLog.ResourceId))
		assert.Equal(t, types.TrafficTypeAll, flowLog.TrafficType)
		assert.NotEmpty(t, aws.ToString(flowLog.LogGroupName), "Flow log should have a log group")
	}
}

// Test high availability configuration
func TestHighAvailabilityConfiguration(t *testing.T) {
	setup(t)

	// Skip if no infrastructure deployed
	if outputs.VpcID == "" {
		t.Skip("No infrastructure deployed, skipping HA configuration test")
	}

	// Verify resources are deployed across multiple AZs
	assert.NotEmpty(t, outputs.PublicSubnetAID, "Public Subnet A should exist")
	assert.NotEmpty(t, outputs.PublicSubnetBID, "Public Subnet B should exist")
	assert.NotEmpty(t, outputs.PrivateSubnetAID, "Private Subnet A should exist")
	assert.NotEmpty(t, outputs.PrivateSubnetBID, "Private Subnet B should exist")

	// Verify dual NAT Gateways for redundancy
	assert.NotEmpty(t, outputs.NatGatewayAID, "NAT Gateway A should exist")
	assert.NotEmpty(t, outputs.NatGatewayBID, "NAT Gateway B should exist")

	// Note: Subnet AZ distribution is validated in individual subnet tests
	// The subnet details are available in the Subnets JSON string field if needed
}

// discoverAWSResources discovers AWS resources when output files are not available
func discoverAWSResources(t *testing.T) *PulumiOutputs {
	ctx := context.TODO()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Logf("Failed to load AWS config: %v", err)
		return &PulumiOutputs{}
	}

	ec2Client := ec2.NewFromConfig(cfg)
	outputs := &PulumiOutputs{}

	// Discover VPC
	vpcs, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		Filters: []types.Filter{
			{Name: aws.String("tag:Project"), Values: []string{"secure-vpc"}},
			{Name: aws.String("state"), Values: []string{"available"}},
		},
	})
	if err == nil && len(vpcs.Vpcs) > 0 {
		outputs.VpcID = aws.ToString(vpcs.Vpcs[0].VpcId)
		t.Logf("Discovered VPC: %s", outputs.VpcID)
	}

	if outputs.VpcID != "" {
		// Discover Internet Gateway
		igws, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []types.Filter{
				{Name: aws.String("attachment.vpc-id"), Values: []string{outputs.VpcID}},
			},
		})
		if err == nil && len(igws.InternetGateways) > 0 {
			outputs.InternetGatewayID = aws.ToString(igws.InternetGateways[0].InternetGatewayId)
		}

		// Discover Subnets
		subnets, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VpcID}},
				{Name: aws.String("tag:Project"), Values: []string{"secure-vpc"}},
			},
		})
		if err == nil {
			for _, subnet := range subnets.Subnets {
				subnetId := aws.ToString(subnet.SubnetId)
				az := aws.ToString(subnet.AvailabilityZone)
				isPublic := aws.ToBool(subnet.MapPublicIpOnLaunch)

				// More robust matching based on AZ and public/private nature
				if isPublic && az == "us-east-1a" {
					outputs.PublicSubnetAID = subnetId
				} else if isPublic && az == "us-east-1b" {
					outputs.PublicSubnetBID = subnetId
				} else if !isPublic && az == "us-east-1a" {
					outputs.PrivateSubnetAID = subnetId
				} else if !isPublic && az == "us-east-1b" {
					outputs.PrivateSubnetBID = subnetId
				}
			}
		}

		// Discover NAT Gateways
		nats, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VpcID}},
				{Name: aws.String("state"), Values: []string{"available"}},
			},
		})
		if err == nil {
			for _, nat := range nats.NatGateways {
				natId := aws.ToString(nat.NatGatewayId)
				subnetId := aws.ToString(nat.SubnetId)

				// Determine AZ based on subnet location
				if subnetId == outputs.PublicSubnetAID {
					outputs.NatGatewayAID = natId
					if len(nat.NatGatewayAddresses) > 0 {
						outputs.ElasticIPAAddress = aws.ToString(nat.NatGatewayAddresses[0].PublicIp)
					}
				} else if subnetId == outputs.PublicSubnetBID {
					outputs.NatGatewayBID = natId
					if len(nat.NatGatewayAddresses) > 0 {
						outputs.ElasticIPBAddress = aws.ToString(nat.NatGatewayAddresses[0].PublicIp)
					}
				} else {
					// Fallback: assign first NAT gateway to A, second to B
					if outputs.NatGatewayAID == "" {
						outputs.NatGatewayAID = natId
						if len(nat.NatGatewayAddresses) > 0 {
							outputs.ElasticIPAAddress = aws.ToString(nat.NatGatewayAddresses[0].PublicIp)
						}
					} else if outputs.NatGatewayBID == "" {
						outputs.NatGatewayBID = natId
						if len(nat.NatGatewayAddresses) > 0 {
							outputs.ElasticIPBAddress = aws.ToString(nat.NatGatewayAddresses[0].PublicIp)
						}
					}
				}
			}
		}

		// Discover Security Groups
		sgs, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VpcID}},
				{Name: aws.String("tag:Project"), Values: []string{"secure-vpc"}},
			},
		})
		if err == nil {
			for _, sg := range sgs.SecurityGroups {
				sgName := aws.ToString(sg.GroupName)
				sgId := aws.ToString(sg.GroupId)
				sgDesc := aws.ToString(sg.Description)

				// Match based on description for more accuracy
				switch {
				case strings.Contains(sgDesc, "web servers"):
					outputs.WebSecurityGroupID = sgId
				case strings.Contains(sgDesc, "SSH access"):
					outputs.SSHSecurityGroupID = sgId
				case strings.Contains(sgDesc, "database servers"):
					outputs.DatabaseSecurityGroupID = sgId
				case strings.Contains(sgName, "web"):
					outputs.WebSecurityGroupID = sgId
				case strings.Contains(sgName, "ssh"):
					outputs.SSHSecurityGroupID = sgId
				case strings.Contains(sgName, "db"):
					outputs.DatabaseSecurityGroupID = sgId
				}
			}
		}
	}

	if outputs.VpcID != "" {
		t.Logf("Successfully discovered AWS resources for VPC: %s", outputs.VpcID)
	} else {
		t.Logf("No AWS resources discovered - infrastructure may not be deployed")
	}

	return outputs
}

// Helper function to validate resource tags
func validateTags(t *testing.T, tags []types.Tag, expectedName string) {
	t.Helper()

	tagMap := make(map[string]string)
	for _, tag := range tags {
		tagMap[aws.ToString(tag.Key)] = aws.ToString(tag.Value)
	}

	assert.Equal(t, expectedName, tagMap["Name"])
	assert.Equal(t, "production", tagMap["Environment"])
	assert.Equal(t, "secure-vpc", tagMap["Project"])
	assert.Equal(t, "pulumi", tagMap["ManagedBy"])
}
