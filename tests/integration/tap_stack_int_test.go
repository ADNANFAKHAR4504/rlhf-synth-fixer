//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
	client := ec2.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.VpcId)
	vpcs, err := client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{VpcIds: []string{outputs.VpcId}})
	require.NoError(t, err)
	require.Len(t, vpcs.Vpcs, 1)
	vpc := vpcs.Vpcs[0]
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)

	subnetsOutput, err := client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		SubnetIds: []string{outputs.PrivateSubnetEc2Id, outputs.PrivateSubnetRdsId, outputs.PublicSubnetId},
	})
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(subnetsOutput.Subnets), 3)

	azs := make(map[string]bool)
	for _, sn := range subnetsOutput.Subnets {
		assert.Equal(t, outputs.VpcId, *sn.VpcId)
		azs[*sn.AvailabilityZone] = true
	}
	assert.GreaterOrEqual(t, len(azs), 2)
}

func TestEC2Instance(t *testing.T) {
	client := ec2.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.Ec2InstanceId)
	instResp, err := client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
		InstanceIds: []string{outputs.Ec2InstanceId},
	})
	require.NoError(t, err)
	require.Len(t, instResp.Reservations, 1)
	instance := instResp.Reservations[0].Instances[0]

	assert.Equal(t, outputs.Ec2PrivateIp, *instance.PrivateIpAddress)
	assert.Equal(t, outputs.PrivateSubnetEc2Id, *instance.SubnetId)

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
	client := rds.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.RdsEndpoint)
	instancesResp, err := client.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{})
	require.NoError(t, err)

	var dbInstance *rds.DBInstance
	for _, db := range instancesResp.DBInstances {
		if db.Endpoint != nil && (db.Endpoint.Address+":"+fmt.Sprint(*db.Endpoint.Port)) == outputs.RdsEndpoint {
			dbInstance = &db
			break
		}
	}
	require.NotNil(t, dbInstance)

	found := false
	for _, sg := range dbInstance.VpcSecurityGroups {
		if *sg.VpcSecurityGroupId == outputs.RdsSecurityGroupId {
			found = true
			break
		}
	}
	assert.True(t, found)
}

func TestS3Bucket(t *testing.T) {
	client := s3.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.S3BucketName)
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &outputs.S3BucketName})
	assert.NoError(t, err)

	verResp, err := client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: &outputs.S3BucketName,
	})
	require.NoError(t, err)
	assert.Equal(t, "Enabled", verResp.Status)
}

func TestSecurityGroupsTags(t *testing.T) {
	client := ec2.NewFromConfig(awsConfig)
	sgIds := []string{outputs.Ec2SecurityGroupId, outputs.RdsSecurityGroupId}

	for _, sgId := range sgIds {
		require.NotEmpty(t, sgId)
		sgResp, err := client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{sgId},
		})
		require.NoError(t, err)
		require.Len(t, sgResp.SecurityGroups, 1)
		sg := sgResp.SecurityGroups[0]

		var hasProjectTag, hasComplianceTag bool
		for _, tag := range sg.Tags {
			if *tag.Key == "Project" && *tag.Value == "SecureInfrastructure" {
				hasProjectTag = true
			}
			if *tag.Key == "Compliance" && *tag.Value == "HIPAA" {
				hasComplianceTag = true
			}
		}
		assert.True(t, hasProjectTag)
		assert.True(t, hasComplianceTag)
	}
}

func TestEndToEndWorkflow(t *testing.T) {
	t.Run("Basic sanity checks", func(t *testing.T) {
		assert.NotEmpty(t, outputs.VpcId)
		assert.NotEmpty(t, outputs.Ec2InstanceId)
		assert.NotEmpty(t, outputs.RdsEndpoint)
		assert.NotEmpty(t, outputs.S3BucketName)
	})
}
