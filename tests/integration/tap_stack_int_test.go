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

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/logs"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// DeploymentOutputs maps flat-outputs.json
type DeploymentOutputs struct {
	AutoScalingGroupName   string `json:"autoScalingGroupName"`
	CloudWatchLogGroupArn  string `json:"cloudWatchLogGroupArn"`
	CloudWatchLogGroupName string `json:"cloudWatchLogGroupName"`
	DbSecurityGroupId      string `json:"dbSecurityGroupId"`
	DbUsername             string `json:"dbUsername"`
	IamPolicyArn           string `json:"iamPolicyArn"`
	IamRoleArn             string `json:"iamRoleArn"`
	InternetGatewayId      string `json:"internetGatewayId"`
	LaunchTemplateId       string `json:"launchTemplateId"`
	NatGateway1Id          string `json:"natGateway1Id"`
	NatGateway2Id          string `json:"natGateway2Id"`
	PrivateSubnet1Id       string `json:"privateSubnet1Id"`
	PrivateSubnet2Id       string `json:"privateSubnet2Id"`
	PublicSubnet1Id        string `json:"publicSubnet1Id"`
	PublicSubnet2Id        string `json:"publicSubnet2Id"`
	RdsEndpoint            string `json:"rdsEndpoint"`
	RdsInstanceId          string `json:"rdsInstanceId"`
	S3BucketArn            string `json:"s3BucketArn"`
	S3BucketName           string `json:"s3BucketName"`
	VpcCidr                string `json:"vpcCidr"`
	VpcId                  string `json:"vpcId"`
	WebSecurityGroupId     string `json:"webSecurityGroupId"`
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

	resp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{VpcIds: []string{outputs.VpcId}})
	require.NoError(t, err)
	require.Len(t, resp.Vpcs, 1)
	assert.Equal(t, outputs.VpcCidr, *resp.Vpcs[0].CidrBlock)

	subnetIDs := []string{outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PublicSubnet1Id, outputs.PublicSubnet2Id}
	subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{SubnetIds: subnetIDs})
	require.NoError(t, err)
	assert.Len(t, subnetsResp.Subnets, len(subnetIDs))

	for _, subnet := range subnetsResp.Subnets {
		assert.Equal(t, outputs.VpcId, *subnet.VpcId)
	}
}

func TestInternetGateway(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)
	resp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{InternetGatewayIds: []string{outputs.InternetGatewayId}})
	require.NoError(t, err)
	require.Len(t, resp.InternetGateways, 1)
}

func TestNatGateways(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)
	ids := []string{outputs.NatGateway1Id, outputs.NatGateway2Id}
	resp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{NatGatewayIds: ids})
	require.NoError(t, err)
	assert.Len(t, resp.NatGateways, len(ids))
}

func TestLaunchTemplate(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)
	resp, err := ec2Client.DescribeLaunchTemplates(ctx, &ec2.DescribeLaunchTemplatesInput{LaunchTemplateIds: []string{outputs.LaunchTemplateId}})
	require.NoError(t, err)
	require.Len(t, resp.LaunchTemplates, 1)
}

func TestAutoScalingGroup(t *testing.T) {
	asgClient := autoscaling.NewFromConfig(awsConfig)
	resp, err := asgClient.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{AutoScalingGroupNames: []string{outputs.AutoScalingGroupName}})
	require.NoError(t, err)
	require.Len(t, resp.AutoScalingGroups, 1)
	assert.Equal(t, outputs.AutoScalingGroupName, *resp.AutoScalingGroups[0].AutoScalingGroupName)
}

func TestSecurityGroups(t *testing.T) {
	ec2Client := ec2.NewFromConfig(awsConfig)
	sgIDs := []string{outputs.DbSecurityGroupId, outputs.WebSecurityGroupId}
	resp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{GroupIds: sgIDs})
	require.NoError(t, err)
	assert.Len(t, resp.SecurityGroups, len(sgIDs))
}

func TestRDSInstance(t *testing.T) {
	rdsClient := rds.NewFromConfig(awsConfig)
	resp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{DBInstanceIdentifier: aws.String(outputs.RdsInstanceId)})
	require.NoError(t, err)
	require.Len(t, resp.DBInstances, 1)

	db := resp.DBInstances[0]
	endpoint := fmt.Sprintf("%s:%d", aws.ToString(db.Endpoint.Address), aws.ToInt32(db.Endpoint.Port))
	assert.Equal(t, outputs.RdsEndpoint, endpoint)
}

func TestS3Bucket(t *testing.T) {
	s3Client := s3.NewFromConfig(awsConfig)

	_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &outputs.S3BucketName})
	assert.NoError(t, err)

	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{Bucket: &outputs.S3BucketName})
	require.NoError(t, err)
	assert.Equal(t, s3types.BucketVersioningStatusEnabled, versioning.Status)
}

func TestCloudWatchLogs(t *testing.T) {
	logsClient := logs.NewFromConfig(awsConfig)

	resp, err := logsClient.DescribeLogGroups(ctx, &logs.DescribeLogGroupsInput{LogGroupNamePrefix: aws.String(outputs.CloudWatchLogGroupName)})
	require.NoError(t, err)

	found := false
	for _, lg := range resp.LogGroups {
		if aws.ToString(lg.Arn) == outputs.CloudWatchLogGroupArn {
			found = true
			break
		}
	}
	assert.True(t, found)
}

func TestIAMRoleAndPolicy(t *testing.T) {
	iamClient := iam.NewFromConfig(awsConfig)

	roleName := strings.Split(outputs.IamRoleArn, "/")[1]
	_, err := iamClient.GetRole(ctx, &iam.GetRoleInput{RoleName: aws.String(roleName)})
	assert.NoError(t, err)

	policyArn := outputs.IamPolicyArn
	_, err = iamClient.GetPolicy(ctx, &iam.GetPolicyInput{PolicyArn: aws.String(policyArn)})
	assert.NoError(t, err)
}
