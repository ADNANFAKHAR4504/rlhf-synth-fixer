package lib

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
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type FlatOutputs struct {
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

var outputs FlatOutputs
var awsCfg aws.Config

func TestMain(m *testing.M) {
	// Load outputs
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		fmt.Println("Failed to read outputs:", err)
		os.Exit(1)
	}
	err = json.Unmarshal(data, &outputs)
	if err != nil {
		fmt.Println("Failed to parse outputs:", err)
		os.Exit(1)
	}

	// Load AWS config
	awsCfg, err = config.LoadDefaultConfig(context.Background())
	if err != nil {
		fmt.Println("Failed to load AWS config:", err)
		os.Exit(1)
	}

	os.Exit(m.Run())
}

func TestVpcExists(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	out, err := client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err)
	require.Len(t, out.Vpcs, 1)
	assert.Equal(t, outputs.VpcCidr, *out.Vpcs[0].CidrBlock)
}

func TestSubnetsExist(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	subnets := []string{outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PublicSubnet1Id, outputs.PublicSubnet2Id}
	out, err := client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: subnets,
	})
	require.NoError(t, err)
	assert.Len(t, out.Subnets, 4)
	for _, sn := range out.Subnets {
		assert.Equal(t, outputs.VpcId, *sn.VpcId)
	}
}

func TestInternetGatewayExists(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	out, err := client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []string{outputs.InternetGatewayId},
	})
	require.NoError(t, err)
	require.Len(t, out.InternetGateways, 1)
}

func TestNatGatewaysExist(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	nats := []string{outputs.NatGateway1Id, outputs.NatGateway2Id}
	out, err := client.DescribeNatGateways(context.TODO(), &ec2.DescribeNatGatewaysInput{
		NatGatewayIds: nats,
	})
	require.NoError(t, err)
	assert.Len(t, out.NatGateways, 2)
}

func TestAutoScalingGroupExists(t *testing.T) {
	client := autoscaling.NewFromConfig(awsCfg)
	out, err := client.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{outputs.AutoScalingGroupName},
	})
	require.NoError(t, err)
	require.Len(t, out.AutoScalingGroups, 1)
	assert.Equal(t, outputs.AutoScalingGroupName, *out.AutoScalingGroups[0].AutoScalingGroupName)
}

func TestLaunchTemplateExists(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	out, err := client.DescribeLaunchTemplates(context.TODO(), &ec2.DescribeLaunchTemplatesInput{
		LaunchTemplateIds: []string{outputs.LaunchTemplateId},
	})
	require.NoError(t, err)
	require.Len(t, out.LaunchTemplates, 1)
}

func TestSecurityGroupsExist(t *testing.T) {
	client := ec2.NewFromConfig(awsCfg)
	sgs := []string{outputs.DbSecurityGroupId, outputs.WebSecurityGroupId}
	out, err := client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupIds: sgs,
	})
	require.NoError(t, err)
	assert.Len(t, out.SecurityGroups, 2)
}

func TestRdsInstanceExists(t *testing.T) {
	client := rds.NewFromConfig(awsCfg)
	out, err := client.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(outputs.RdsInstanceId),
	})
	require.NoError(t, err)
	require.Len(t, out.DBInstances, 1)
	assert.Equal(t, outputs.RdsEndpoint, *out.DBInstances[0].Endpoint.Address+":"+fmt.Sprint(out.DBInstances[0].Endpoint.Port))
}

func TestS3BucketExists(t *testing.T) {
	client := s3.NewFromConfig(awsCfg)
	_, err := client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(outputs.S3BucketName),
	})
	require.NoError(t, err)
}

func TestIamRoleAndPolicyExist(t *testing.T) {
	client := iam.NewFromConfig(awsCfg)
	// Role
	_, err := client.GetRole(context.TODO(), &iam.GetRoleInput{
		RoleName: aws.String(strings.Split(outputs.IamRoleArn, "/")[1]),
	})
	require.NoError(t, err)

	// Policy
	_, err = client.GetPolicy(context.TODO(), &iam.GetPolicyInput{
		PolicyArn: aws.String(outputs.IamPolicyArn),
	})
	require.NoError(t, err)
}

func TestCloudWatchLogGroupExists(t *testing.T) {
	client := cloudwatchlogs.NewFromConfig(awsCfg)
	out, err := client.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String(outputs.CloudWatchLogGroupName),
	})
	require.NoError(t, err)
	found := false
	for _, lg := range out.LogGroups {
		if *lg.LogGroupName == outputs.CloudWatchLogGroupName {
			found = true
			break
		}
	}
	assert.True(t, found, "CloudWatch log group not found")
}
