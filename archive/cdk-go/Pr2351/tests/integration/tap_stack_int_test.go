//go:build integration

package lib_test

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the structure of the CloudFormation outputs.
type Outputs struct {
	VPCId               string
	WebServerInstanceId string
	WebServerPublicIP   string
	DatabaseEndpoint    string
	DatabaseIdentifier  string
	DatabaseSecretArn   string
}

// loadOutputs dynamically fetches outputs from the deployed CloudFormation stack.
func loadOutputs(t *testing.T, ctx context.Context, cfg aws.Config) *Outputs {
	cfnClient := cloudformation.NewFromConfig(cfg)
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}
	stackName := fmt.Sprintf("TapStack%s", environmentSuffix)

	resp, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	})
	require.NoError(t, err, "Failed to describe CloudFormation stack")
	require.Len(t, resp.Stacks, 1, fmt.Sprintf("Expected exactly one stack named %s", stackName))

	outputsMap := make(map[string]string)
	for _, output := range resp.Stacks[0].Outputs {
		outputsMap[*output.OutputKey] = *output.OutputValue
	}

	return &Outputs{
		VPCId:               outputsMap["VPCId"],
		WebServerInstanceId: outputsMap["WebServerInstanceId"],
		WebServerPublicIP:   outputsMap["WebServerPublicIP"],
		DatabaseEndpoint:    outputsMap["DatabaseEndpoint"],
		DatabaseIdentifier:  outputsMap["DatabaseIdentifier"],
		DatabaseSecretArn:   outputsMap["DatabaseSecretArn"],
	}
}

func TestTapStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)
	rdsClient := rds.NewFromConfig(cfg)
	outputs := loadOutputs(t, ctx, cfg)

	t.Run("VPC is correctly configured", func(t *testing.T) {
		require.NotEmpty(t, outputs.VPCId, "VPCId should be exported")

		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		// Check DNS attributes
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

	t.Run("Security Groups have correct rules", func(t *testing.T) {
		require.NotEmpty(t, outputs.WebServerInstanceId, "WebServerInstanceId should be exported")

		instanceResp, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.WebServerInstanceId},
		})
		require.NoError(t, err)
		require.Len(t, instanceResp.Reservations, 1)
		require.Len(t, instanceResp.Reservations[0].Instances, 1)
		instance := instanceResp.Reservations[0].Instances[0]
		require.Len(t, instance.SecurityGroups, 1)
		webServerSgId := *instance.SecurityGroups[0].GroupId

		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{webServerSgId},
		})
		require.NoError(t, err)
		require.Len(t, sgResp.SecurityGroups, 1)
		webServerSg := sgResp.SecurityGroups[0]

		// Assert Web Server SG has only HTTPS ingress
		assert.Len(t, webServerSg.IpPermissions, 1, "Web server SG should have one inbound rule")
		httpsRule := webServerSg.IpPermissions[0]
		assert.Equal(t, int32(443), *httpsRule.FromPort)
		assert.Equal(t, int32(443), *httpsRule.ToPort)
		require.Len(t, httpsRule.IpRanges, 1)
		assert.Equal(t, "0.0.0.0/0", *httpsRule.IpRanges[0].CidrIp)
	})

	t.Run("VPC has correct subnets and Internet Gateway", func(t *testing.T) {
		require.NotEmpty(t, outputs.VPCId, "VPCId should be exported")

		// Describe subnets
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")
		assert.Len(t, subnetsResp.Subnets, 4, "VPC should have 4 subnets (2 public, 2 private isolated)")

		// Describe Internet Gateway
		igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe internet gateways")
		assert.Len(t, igwResp.InternetGateways, 1, "VPC should have exactly one Internet Gateway")
	})

	t.Run("RDS instance is encrypted", func(t *testing.T) {
		require.NotEmpty(t, outputs.DatabaseIdentifier, "DatabaseIdentifier should be exported")

		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(outputs.DatabaseIdentifier),
		})
		require.NoError(t, err, "Failed to describe RDS instance")
		require.Len(t, dbResp.DBInstances, 1, "Expected exactly one RDS instance")

		dbInstance := dbResp.DBInstances[0]
		assert.True(t, *dbInstance.StorageEncrypted, "RDS storage should be encrypted")
	})

	t.Run("Outputs are correctly exported", func(t *testing.T) {
		assert.NotEmpty(t, outputs.VPCId, "VPCId should be exported")
		assert.NotEmpty(t, outputs.WebServerInstanceId, "WebServerInstanceId should be exported")
		assert.NotEmpty(t, outputs.DatabaseEndpoint, "DatabaseEndpoint should be exported")
		assert.NotEmpty(t, outputs.DatabaseIdentifier, "DatabaseIdentifier should be exported")
		assert.NotEmpty(t, outputs.DatabaseSecretArn, "DatabaseSecretArn should be exported")
	})
}
