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
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the structure of the CloudFormation outputs.
type Outputs struct {
	VPCId               string `json:"VPCId"`
	WebServerInstanceId string `json:"WebServerInstanceId"`
	WebServerPublicIP   string `json:"WebServerPublicIP"`
	DatabaseEndpoint    string `json:"DatabaseEndpoint"`
	DatabaseIdentifier  string `json:"DatabaseIdentifier"`
	DatabaseSecretArn   string `json:"DatabaseSecretArn"`
}

// loadOutputs loads deployment outputs from the specified JSON file.
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
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)
	rdsClient := rds.NewFromConfig(cfg)
	outputs := loadOutputs(t)

	t.Run("VPC is correctly configured", func(t *testing.T) {
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}}},
		})
		require.NoError(t, err, "Failed to describe subnets")
		assert.Len(t, subnetsResp.Subnets, 4, "VPC should have 4 subnets (2 public, 2 private isolated)")
	})

	t.Run("Security Groups have correct rules", func(t *testing.T) {
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

	t.Run("RDS instance is encrypted", func(t *testing.T) {
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
	})
}
