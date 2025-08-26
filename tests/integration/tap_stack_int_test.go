//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type DeploymentOutputs struct {
	VpcId               string `json:"VpcId,omitempty"`
	BastionInstanceId   string `json:"BastionInstanceId,omitempty"`
	BastionPublicIp     string `json:"BastionPublicIp,omitempty"`
	ArtifactsBucketName string `json:"ArtifactsBucketName,omitempty"`
}

func loadDeploymentOutputs(t *testing.T) *DeploymentOutputs {
	paths := []string{
		filepath.Join("..", "cfn-outputs", "flat-outputs.json"),
		filepath.Join("cfn-outputs", "flat-outputs.json"),
		filepath.Join(".", "..", "cfn-outputs", "flat-outputs.json"),
	}

	var outputPath string
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			outputPath = p
			break
		}
	}

	if outputPath == "" {
		t.Skipf("Deployment outputs file not found in any known path: %v. Skipping integration tests.", paths)
		return nil
	}

	data, err := os.ReadFile(outputPath)
	require.NoError(t, err, "Failed to read deployment outputs")

	var outputs DeploymentOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse deployment outputs JSON")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	t.Run("deployed vpc exists and has correct configuration", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.VpcId == "" {
			t.Skip("VPC ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Should find exactly one VPC")

		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", aws.ToString(vpc.CidrBlock), "VPC should have correct CIDR block")

		envTag := findTag(vpc.Tags, "Environment")
		assert.Equal(t, "Production", envTag, "VPC should be tagged with Environment=Production")

		subnetResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")

		assert.GreaterOrEqual(t, len(subnetResp.Subnets), 4, "Should have at least 4 subnets")

		azSet := make(map[string]bool)
		publicCount, privateCount := 0, 0

		for _, subnet := range subnetResp.Subnets {
			azSet[aws.ToString(subnet.AvailabilityZone)] = true

			routeResp, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("association.subnet-id"),
						Values: []string{aws.ToString(subnet.SubnetId)},
					},
				},
			})
			require.NoError(t, err, "Failed to describe route tables")

			isPublic := false
			for _, routeTable := range routeResp.RouteTables {
				for _, route := range routeTable.Routes {
					if route.GatewayId != nil && strings.HasPrefix(aws.ToString(route.GatewayId), "igw-") {
						isPublic = true
						break
					}
				}
			}

			if isPublic {
				publicCount++
			} else {
				privateCount++
			}
		}

		assert.GreaterOrEqual(t, len(azSet), 2, "Subnets should span at least 2 availability zones")
		assert.GreaterOrEqual(t, publicCount, 2, "Should have at least 2 public subnets")
		assert.GreaterOrEqual(t, privateCount, 2, "Should have at least 2 private subnets")
	})

	t.Run("bastion host is properly configured", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.BastionInstanceId == "" {
			t.Skip("Bastion instance ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		instanceResp, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.BastionInstanceId},
		})
		require.NoError(t, err, "Failed to describe bastion instance")
		require.Len(t, instanceResp.Reservations, 1, "Should find bastion reservation")
		require.Len(t, instanceResp.Reservations[0].Instances, 1, "Should find bastion instance")

		instance := instanceResp.Reservations[0].Instances[0]

		assert.NotNil(t, instance.PublicIpAddress, "Bastion should have public IP")

		assert.Equal(t, ec2types.InstanceTypeT3Micro, instance.InstanceType, "Bastion should be t3.micro")

		envTag := findInstanceTag(instance.Tags, "Environment")
		assert.Equal(t, "Production", envTag, "Bastion should be tagged with Environment=Production")

		roleTag := findInstanceTag(instance.Tags, "Role")
		assert.Equal(t, "Bastion", roleTag, "Bastion should be tagged with Role=Bastion")

		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{aws.ToString(instance.SecurityGroups[0].GroupId)},
		})
		require.NoError(t, err, "Failed to describe security group")
		require.Len(t, sgResp.SecurityGroups, 1, "Should find bastion security group")

		sg := sgResp.SecurityGroups[0]
		sshRuleFound := false
		for _, rule := range sg.IpPermissions {
			if rule.FromPort != nil && *rule.FromPort == 22 && rule.ToPort != nil && *rule.ToPort == 22 {
				for _, ipRange := range rule.IpRanges {
					if aws.ToString(ipRange.CidrIp) == "203.0.113.0/24" {
						sshRuleFound = true
						break
					}
				}
			}
		}
		assert.True(t, sshRuleFound, "Security group should allow SSH from 203.0.113.0/24")
	})

	t.Run("nat gateways provide private subnet connectivity", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.VpcId == "" {
			t.Skip("VPC ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		natResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []ec2types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VpcId}},
				{Name: aws.String("state"), Values: []string{"available"}},
			},
		})
		require.NoError(t, err, "Failed to describe NAT gateways")

		assert.GreaterOrEqual(t, len(natResp.NatGateways), 2, "Should have at least 2 NAT gateways for high availability")

		azSet := make(map[string]bool)
		for _, natGw := range natResp.NatGateways {
			azSet[aws.ToString(natGw.SubnetId)] = true
		}
		assert.GreaterOrEqual(t, len(azSet), 2, "NAT gateways should be in different subnets/AZs")
	})
}

func findTag(tags []ec2types.Tag, key string) string {
	for _, tag := range tags {
		if aws.ToString(tag.Key) == key {
			return aws.ToString(tag.Value)
		}
	}
	return ""
}

func findInstanceTag(tags []ec2types.Tag, key string) string {
	for _, tag := range tags {
		if aws.ToString(tag.Key) == key {
			return aws.ToString(tag.Value)
		}
	}
	return ""
}

func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
