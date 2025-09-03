//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// DeploymentOutputs holds Pulumi flat-outputs.json data
type DeploymentOutputs struct {
	Ec2InstanceId      string `json:"ec2InstanceId"`
	Ec2PrivateIp       string `json:"ec2PrivateIp"`
	Ec2SecurityGroupId string `json:"ec2SecurityGroupId"`
	PrivateSubnetEc2Id string `json:"privateSubnetEc2Id"`
	PrivateSubnetRdsId string `json:"privateSubnetRdsId"`
	PublicSubnetId     string `json:"publicSubnetId"`
	RdsEndpoint        string `json:"rdsEndpoint"`
	RdsSecurityGroupId string `json:"rdsSecurityGroupId"`
	S3BucketName       string `json:"s3BucketName"`
	VpcId              string `json:"vpcId"`
}

var (
	outputs   DeploymentOutputs
	awsConfig aws.Config
	ctx       = context.Background()
)

func TestMain(m *testing.M) {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		fmt.Printf("Failed to read outputs file: %v\n", err)
		os.Exit(1)
	}
	if err := json.Unmarshal(data, &outputs); err != nil {
		fmt.Printf("Failed to parse outputs JSON: %v\n", err)
		os.Exit(1)
	}

	awsConfig, err = config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		fmt.Printf("Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()
	os.Exit(code)
}

func TestVPCAndSubnets(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.VpcId)
	resp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{VpcIds: []string{outputs.VpcId}})
	require.NoError(t, err)
	require.Len(t, resp.Vpcs, 1)
	assert.Equal(t, "10.0.0.0/16", *resp.Vpcs[0].CidrBlock)

	subnetIDs := []string{outputs.PrivateSubnetEc2Id, outputs.PrivateSubnetRdsId, outputs.PublicSubnetId}
	subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{SubnetIds: subnetIDs})
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(subnetsResp.Subnets), len(subnetIDs))

	azSet := map[string]bool{}
	for _, subnet := range subnetsResp.Subnets {
		assert.Equal(t, outputs.VpcId, *subnet.VpcId)
		azSet[*subnet.AvailabilityZone] = true
	}
	assert.GreaterOrEqual(t, len(azSet), 2)
}

func TestEC2Instance(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.Ec2InstanceId)
	resp, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{InstanceIds: []string{outputs.Ec2InstanceId}})
	require.NoError(t, err)
	require.Len(t, resp.Reservations, 1)

	instance := resp.Reservations[0].Instances[0]
	assert.Equal(t, outputs.PrivateSubnetEc2Id, *instance.SubnetId)
	assert.Equal(t, outputs.Ec2PrivateIp, *instance.PrivateIpAddress)

	found := false
	for _, sg := range instance.SecurityGroups {
		if *sg.GroupId == outputs.Ec2SecurityGroupId {
			found = true
			break
		}
	}
	assert.True(t, found)
}

func TestRDSInstance(t *testing.T) {
	rdsClient := rds.NewFromConfig(awsConfig)
	require.NotEmpty(t, outputs.RdsEndpoint)

	instancesResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{})
	require.NoError(t, err)

	var foundInstance *rdstypes.DBInstance
	for _, db := range instancesResp.DBInstances {
		if db.Endpoint != nil {
			address := aws.ToString(db.Endpoint.Address)
			port := aws.ToInt32(db.Endpoint.Port)
			endpoint := fmt.Sprintf("%s:%d", address, port)
			if endpoint == outputs.RdsEndpoint {
				foundInstance = &db
				break
			}
		}
	}

	require.NotNil(t, foundInstance)

	foundSG := false
	for _, sg := range foundInstance.VpcSecurityGroups {
		if sg.VpcSecurityGroupId != nil && aws.ToString(sg.VpcSecurityGroupId) == outputs.RdsSecurityGroupId {
			foundSG = true
			break
		}
	}
	assert.True(t, foundSG)
}

func TestS3Bucket(t *testing.T) {
	s3Client := s3.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.S3BucketName)

	_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &outputs.S3BucketName})
	assert.NoError(t, err)

	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{Bucket: &outputs.S3BucketName})
	require.NoError(t, err)

	assert.Equal(t, s3types.BucketVersioningStatusEnabled, versioning.Status)
}
