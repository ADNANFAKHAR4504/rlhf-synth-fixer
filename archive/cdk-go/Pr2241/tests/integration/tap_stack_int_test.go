//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the structure of cfn-outputs/flat-outputs.json
type Outputs struct {
	VPCId           string `json:"VPCId"`
	SecurityGroupId string `json:"SecurityGroupId"`
	VPCCidr         string `json:"VPCCidr"`
}

// loadOutputs loads deployment outputs from cfn-outputs/flat-outputs.json
func loadOutputs(t *testing.T) *Outputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Cannot load cfn-outputs/flat-outputs.json: %v", err)
	}

	var outputs Outputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs/flat-outputs.json")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("deployed VPC has correct CIDR block", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe VPC
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		// ASSERT
		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		// Check DNS attributes separately using DescribeVpcAttribute
		dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err, "Failed to get DNS support attribute")
		assert.True(t, *dnsSupport.EnableDnsSupport.Value, "VPC should have DNS support enabled")

		dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err, "Failed to get DNS hostnames attribute")
		assert.True(t, *dnsHostnames.EnableDnsHostnames.Value, "VPC should have DNS hostnames enabled")
	})

	t.Run("deployed security group has correct rules", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe Security Group
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.SecurityGroupId},
		})
		require.NoError(t, err, "Failed to describe security group")
		require.Len(t, sgResp.SecurityGroups, 1, "Expected exactly one security group")

		// ASSERT
		sg := sgResp.SecurityGroups[0]
		assert.Equal(t, "cf-ec2-sg", *sg.GroupName, "Security group should have correct name")
		assert.Contains(t, *sg.Description, "Security group for EC2 web server", "Security group should have correct description")

		// ASSERT - Inbound rules
		assert.Len(t, sg.IpPermissions, 3, "Security group should have three inbound rules")

		// Helper function to check for a specific rule
		ruleExists := func(port int32, cidr string) bool {
			for _, rule := range sg.IpPermissions {
				if *rule.FromPort == port && *rule.ToPort == port && *rule.IpProtocol == "tcp" {
					for _, ipRange := range rule.IpRanges {
						if *ipRange.CidrIp == cidr {
							return true
						}
					}
				}
			}
			return false
		}

		assert.True(t, ruleExists(80, "0.0.0.0/0"), "Inbound rule for HTTP on port 80 from anywhere should exist")
		assert.True(t, ruleExists(443, "0.0.0.0/0"), "Inbound rule for HTTPS on port 443 from anywhere should exist")
		assert.True(t, ruleExists(22, "0.0.0.0/0"), "Inbound rule for SSH on port 22 from the allowed IP should exist")

		// ASSERT - Outbound rules
		assert.True(t, len(sg.IpPermissionsEgress) > 0, "Security group should have outbound rules")
	})

	t.Run("VPC has correct subnets and Internet Gateway", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe subnets
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")

		// ASSERT - Should have 4 subnets (2 AZs * 2 types)
		assert.Len(t, subnetsResp.Subnets, 4, "VPC should have 4 subnets")

		// ACT - Describe Internet Gateway
		igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe internet gateways")

		// ASSERT - Should have one Internet Gateway attached
		assert.Len(t, igwResp.InternetGateways, 1, "VPC should have exactly one Internet Gateway")
		assert.Len(t, igwResp.InternetGateways[0].Attachments, 1, "Internet Gateway should be attached to VPC")
		assert.Equal(t, outputs.VPCId, *igwResp.InternetGateways[0].Attachments[0].VpcId, "Internet Gateway should be attached to correct VPC")
	})

	t.Run("outputs are correctly exported", func(t *testing.T) {
		// ARRANGE
		outputs := loadOutputs(t)

		// ASSERT - All required outputs should be present
		assert.NotEmpty(t, outputs.VPCId, "VPCId should be exported")
		assert.NotEmpty(t, outputs.SecurityGroupId, "SecurityGroupId should be exported")
		assert.NotEmpty(t, outputs.VPCCidr, "VPCCidr should be exported")
		assert.Equal(t, "10.0.0.0/16", outputs.VPCCidr, "VPCCidr should match expected value")

		// ASSERT - IDs should follow AWS format
		assert.Regexp(t, "^vpc-[a-f0-9]+$", outputs.VPCId, "VPCId should follow AWS VPC ID format")
		assert.Regexp(t, "^sg-[a-f0-9]+$", outputs.SecurityGroupId, "SecurityGroupId should follow AWS Security Group ID format")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
