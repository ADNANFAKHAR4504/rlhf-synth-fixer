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
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// -------------------------------------------------------------------
// Globals
// -------------------------------------------------------------------
var (
	ctx     = context.TODO()
	awsCfg  = getAwsConfig()
	outputs = loadOutputs()
)

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
func getAwsConfig() aws.Config {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic(fmt.Errorf("failed to load AWS config: %w", err))
	}
	return cfg
}

type Outputs struct {
	VpcId                  string `json:"VpcId"`
	PrivateSubnetEc2Id     string `json:"PrivateSubnetEc2Id"`
	PrivateSubnetRdsId     string `json:"PrivateSubnetRdsId"`
	PublicSubnetId         string `json:"PublicSubnetId"`
	Ec2InstanceId          string `json:"Ec2InstanceId"`
	RdsEndpoint            string `json:"RdsEndpoint"`
	RdsSecurityGroupId     string `json:"RdsSecurityGroupId"`
	S3BucketName           string `json:"S3BucketName"`
	IamRoleArn             string `json:"IamRoleArn"`
	IamPolicyArn           string `json:"IamPolicyArn"`
	CloudWatchLogGroupName string `json:"CloudWatchLogGroupName"`
}

func loadOutputs() Outputs {
	f, err := os.Open("../cfn-outputs/all-outputs.json")
	if err != nil {
		// No outputs file available, skip everything gracefully
		return Outputs{}
	}
	defer f.Close()

	var out Outputs
	if err := json.NewDecoder(f).Decode(&out); err != nil {
		return Outputs{}
	}
	return out
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

func TestVPCAndSubnets(t *testing.T) {
	if outputs.VpcId == "" || outputs.PublicSubnetId == "" || outputs.PrivateSubnetEc2Id == "" || outputs.PrivateSubnetRdsId == "" {
		t.Skip("Skipping VPC/Subnets test: missing outputs")
	}
	client := ec2.NewFromConfig(awsCfg)
	_, err := client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		SubnetIds: []string{outputs.PublicSubnetId, outputs.PrivateSubnetEc2Id, outputs.PrivateSubnetRdsId},
	})
	require.NoError(t, err)
}

func TestEC2Instance(t *testing.T) {
	if outputs.Ec2InstanceId == "" {
		t.Skip("Skipping EC2 test: missing outputs")
	}
	client := ec2.NewFromConfig(awsCfg)
	out, err := client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
		InstanceIds: []string{outputs.Ec2InstanceId},
	})
	require.NoError(t, err)
	assert.NotEmpty(t, out.Reservations)
}

func TestRDSInstance(t *testing.T) {
	if outputs.RdsEndpoint == "" {
		t.Skip("Skipping RDS test: missing outputs")
	}
	client := rds.NewFromConfig(awsCfg)
	out, err := client.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{})
	require.NoError(t, err)

	found := false
	for _, db := range out.DBInstances {
		if db.Endpoint != nil && aws.ToString(db.Endpoint.Address) == outputs.RdsEndpoint {
			found = true
			break
		}
	}
	assert.True(t, found, "RDS endpoint not found")
}

func TestS3BucketExists(t *testing.T) {
	if outputs.S3BucketName == "" {
		t.Skip("Skipping S3 test: missing outputs")
	}
	client := s3.NewFromConfig(awsCfg)
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.S3BucketName),
	})
	require.NoError(t, err)
}

func TestIamRoleAndPolicyExist(t *testing.T) {
	if outputs.IamRoleArn == "" || outputs.IamPolicyArn == "" {
		t.Skip("Skipping IAM test: missing outputs")
	}
	client := iam.NewFromConfig(awsCfg)

	// Role
	_, err := client.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String(strings.Split(outputs.IamRoleArn, "/")[1]),
	})
	require.NoError(t, err)

	// Policy
	_, err = client.GetPolicy(ctx, &iam.GetPolicyInput{
		PolicyArn: aws.String(outputs.IamPolicyArn),
	})
	require.NoError(t, err)
}

func TestCloudWatchLogGroupExists(t *testing.T) {
	if outputs.CloudWatchLogGroupName == "" {
		t.Skip("Skipping CloudWatch test: missing outputs")
	}
	client := cloudwatchlogs.NewFromConfig(awsCfg)
	out, err := client.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
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
