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

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
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
	outputPath := filepath.Join("cfn-outputs", "flat-outputs.json")
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		t.Skipf("Deployment outputs file not found at %s. Skipping integration tests that require actual deployment.", outputPath)
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

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	t.Run("stack construction creates correct structure", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackConstructionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack, "Stack should be created successfully")
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix, "Environment suffix should be set correctly")

		// Verify the stack can be synthesized without errors
		template := app.Synth(nil)
		assert.NotNil(t, template, "Stack should synthesize successfully")
	})

	t.Run("environment suffix resolution works correctly", func(t *testing.T) {
		testCases := []struct {
			name           string
			props          *lib.TapStackProps
			contextValue   interface{}
			expectedSuffix string
		}{
			{
				name: "props takes precedence",
				props: &lib.TapStackProps{
					StackProps:        &awscdk.StackProps{},
					EnvironmentSuffix: jsii.String("props-env"),
				},
				contextValue:   "context-env",
				expectedSuffix: "props-env",
			},
			{
				name:           "context used when props is nil",
				props:          &lib.TapStackProps{StackProps: &awscdk.StackProps{}},
				contextValue:   "context-env",
				expectedSuffix: "context-env",
			},
			{
				name:           "defaults to dev when both nil",
				props:          &lib.TapStackProps{StackProps: &awscdk.StackProps{}},
				contextValue:   nil,
				expectedSuffix: "dev",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				app := awscdk.NewApp(nil)
				if tc.contextValue != nil {
					app.Node().SetContext(jsii.String("environmentSuffix"), tc.contextValue)
				}

				stack := lib.NewTapStack(app, jsii.String("TestStack"), tc.props)
				assert.Equal(t, tc.expectedSuffix, *stack.EnvironmentSuffix)
			})
		}
	})

	t.Run("deployed vpc exists and has correct configuration", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.VpcId == "" {
			t.Skip("VPC ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		// Test VPC exists and has correct CIDR
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Should find exactly one VPC")

		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")

		// Verify Environment tag
		envTag := findTag(vpc.Tags, "Environment")
		assert.Equal(t, "Production", envTag, "VPC should be tagged with Environment=Production")

		// Test subnets exist and are properly distributed
		subnetResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")

		// Should have 4 subnets total (2 public, 2 private across 2 AZs)
		assert.Len(t, subnetResp.Subnets, 4, "Should have 4 subnets (2 public + 2 private)")

		// Verify we have subnets in 2 different AZs
		azSet := make(map[string]bool)
		publicCount, privateCount := 0, 0

		for _, subnet := range subnetResp.Subnets {
			azSet[*subnet.AvailabilityZone] = true

			// Check if subnet is public (has route to internet gateway)
			routeResp, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("association.subnet-id"),
						Values: []string{*subnet.SubnetId},
					},
				},
			})
			require.NoError(t, err, "Failed to describe route tables")

			isPublic := false
			for _, routeTable := range routeResp.RouteTables {
				for _, route := range routeTable.Routes {
					if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
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

		assert.Len(t, azSet, 2, "Subnets should span 2 availability zones")
		assert.Equal(t, 2, publicCount, "Should have 2 public subnets")
		assert.Equal(t, 2, privateCount, "Should have 2 private subnets")
	})

	t.Run("bastion host is properly configured", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.BastionInstanceId == "" {
			t.Skip("Bastion instance ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		// Verify bastion instance exists and is running
		instanceResp, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.BastionInstanceId},
		})
		require.NoError(t, err, "Failed to describe bastion instance")
		require.Len(t, instanceResp.Reservations, 1, "Should find bastion reservation")
		require.Len(t, instanceResp.Reservations[0].Instances, 1, "Should find bastion instance")

		instance := instanceResp.Reservations[0].Instances[0]

		// Verify instance is in public subnet
		assert.NotNil(t, instance.PublicIpAddress, "Bastion should have public IP")
		assert.Equal(t, outputs.BastionPublicIp, *instance.PublicIpAddress, "Public IP should match output")

		// Verify instance type
		assert.Equal(t, ec2types.InstanceTypeT3Micro, instance.InstanceType, "Bastion should be t3.micro")

		// Verify Environment tag
		envTag := findInstanceTag(instance.Tags, "Environment")
		assert.Equal(t, "Production", envTag, "Bastion should be tagged with Environment=Production")

		roleTag := findInstanceTag(instance.Tags, "Role")
		assert.Equal(t, "Bastion", roleTag, "Bastion should be tagged with Role=Bastion")

		// Verify security group allows SSH from trusted CIDR
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{instance.SecurityGroups[0].GroupId},
		})
		require.NoError(t, err, "Failed to describe security group")
		require.Len(t, sgResp.SecurityGroups, 1, "Should find bastion security group")

		sg := sgResp.SecurityGroups[0]
		sshRuleFound := false
		for _, rule := range sg.IpPermissions {
			if rule.FromPort != nil && *rule.FromPort == 22 && rule.ToPort != nil && *rule.ToPort == 22 {
				for _, ipRange := range rule.IpRanges {
					if *ipRange.CidrIp == "203.0.113.0/24" {
						sshRuleFound = true
						break
					}
				}
			}
		}
		assert.True(t, sshRuleFound, "Security group should allow SSH from 203.0.113.0/24")
	})

	t.Run("s3 bucket has block public access enabled", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.ArtifactsBucketName == "" {
			t.Skip("S3 bucket name not found in deployment outputs")
		}

		s3Client := s3.NewFromConfig(cfg)

		// Verify bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.ArtifactsBucketName),
		})
		require.NoError(t, err, "Bucket should exist and be accessible")

		// Verify Block Public Access settings
		bpaResp, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.ArtifactsBucketName),
		})
		require.NoError(t, err, "Should be able to get public access block settings")

		bpa := bpaResp.PublicAccessBlockConfiguration
		assert.True(t, *bpa.BlockPublicAcls, "BlockPublicAcls should be enabled")
		assert.True(t, *bpa.BlockPublicPolicy, "BlockPublicPolicy should be enabled")
		assert.True(t, *bpa.IgnorePublicAcls, "IgnorePublicAcls should be enabled")
		assert.True(t, *bpa.RestrictPublicBuckets, "RestrictPublicBuckets should be enabled")

		// Verify bucket versioning is enabled
		versioningResp, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.ArtifactsBucketName),
		})
		require.NoError(t, err, "Should be able to get bucket versioning")
		assert.Equal(t, s3types.BucketVersioningStatusEnabled, versioningResp.Status, "Bucket versioning should be enabled")

		// Verify bucket encryption
		encryptionResp, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.ArtifactsBucketName),
		})
		require.NoError(t, err, "Should be able to get bucket encryption")
		require.Len(t, encryptionResp.ServerSideEncryptionConfiguration.Rules, 1, "Should have one encryption rule")

		rule := encryptionResp.ServerSideEncryptionConfiguration.Rules[0]
		assert.Equal(t, s3types.ServerSideEncryptionAes256, rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm, "Should use AES256 encryption")
	})

	t.Run("nat gateways provide private subnet connectivity", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.VpcId == "" {
			t.Skip("VPC ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		// Find NAT gateways in the VPC
		natResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
				{
					Name:   aws.String("state"),
					Values: []string{"available"},
				},
			},
		})
		require.NoError(t, err, "Failed to describe NAT gateways")

		// Should have 2 NAT gateways for HA (one per AZ)
		assert.Len(t, natResp.NatGateways, 2, "Should have 2 NAT gateways for high availability")

		// Verify NAT gateways are in different AZs
		azSet := make(map[string]bool)
		for _, natGw := range natResp.NatGateways {
			azSet[*natGw.SubnetId] = true
		}
		assert.Len(t, azSet, 2, "NAT gateways should be in different subnets/AZs")
	})

	t.Run("security groups enforce least privilege access", func(t *testing.T) {
		outputs := loadDeploymentOutputs(t)
		if outputs == nil || outputs.VpcId == "" {
			t.Skip("VPC ID not found in deployment outputs")
		}

		ec2Client := ec2.NewFromConfig(cfg)

		// Get all security groups in the VPC
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe security groups")

		var bastionSG, privateSG *ec2types.SecurityGroup
		for _, sg := range sgResp.SecurityGroups {
			if sg.GroupName != nil {
				switch *sg.GroupName {
				case "tap-bastion-sg":
					bastionSG = &sg
				case "tap-private-sg":
					privateSG = &sg
				}
			}
		}

		require.NotNil(t, bastionSG, "Bastion security group should exist")
		require.NotNil(t, privateSG, "Private security group should exist")

		// Verify bastion SG only allows SSH from trusted CIDR
		sshFromTrustedFound := false
		for _, rule := range bastionSG.IpPermissions {
			if rule.FromPort != nil && *rule.FromPort == 22 {
				for _, ipRange := range rule.IpRanges {
					if *ipRange.CidrIp == "203.0.113.0/24" {
						sshFromTrustedFound = true
					}
				}
			}
		}
		assert.True(t, sshFromTrustedFound, "Bastion SG should allow SSH from trusted CIDR")

		// Verify private SG allows SSH only from bastion SG
		sshFromBastionFound := false
		httpFromVpcFound := false
		httpsFromVpcFound := false

		for _, rule := range privateSG.IpPermissions {
			if rule.FromPort != nil && *rule.FromPort == 22 {
				for _, sgRule := range rule.UserIdGroupPairs {
					if *sgRule.GroupId == *bastionSG.GroupId {
						sshFromBastionFound = true
					}
				}
			}
			if rule.FromPort != nil && *rule.FromPort == 80 {
				for _, ipRange := range rule.IpRanges {
					if *ipRange.CidrIp == "10.0.0.0/16" {
						httpFromVpcFound = true
					}
				}
			}
			if rule.FromPort != nil && *rule.FromPort == 443 {
				for _, ipRange := range rule.IpRanges {
					if *ipRange.CidrIp == "10.0.0.0/16" {
						httpsFromVpcFound = true
					}
				}
			}
		}

		assert.True(t, sshFromBastionFound, "Private SG should allow SSH from bastion SG")
		assert.True(t, httpFromVpcFound, "Private SG should allow HTTP from VPC CIDR")
		assert.True(t, httpsFromVpcFound, "Private SG should allow HTTPS from VPC CIDR")
	})
}

// Helper function to find tag value by key
func findTag(tags []ec2types.Tag, key string) string {
	for _, tag := range tags {
		if *tag.Key == key {
			return *tag.Value
		}
	}
	return ""
}

// Helper function to find instance tag value by key
func findInstanceTag(tags []ec2types.Tag, key string) string {
	for _, tag := range tags {
		if *tag.Key == key {
			return *tag.Value
		}
	}
	return ""
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
