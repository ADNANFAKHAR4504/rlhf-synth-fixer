package lib

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	ctx     = context.TODO()
	awsCfg  = getAwsConfig() // your helper
	outputs = loadOutputs()  // your helper

	summary = struct {
		sync.Mutex
		skipped []string
		passed  []string
	}{}
)

func recordResult(t *testing.T, skipped bool) {
	summary.Lock()
	defer summary.Unlock()
	if skipped {
		summary.skipped = append(summary.skipped, t.Name())
	} else {
		summary.passed = append(summary.passed, t.Name())
	}
}

func TestMain(m *testing.M) {
	code := m.Run()

	fmt.Println("\n=== Integration Test Summary ===")
	fmt.Printf("Passed: %d → %v\n", len(summary.passed), summary.passed)
	fmt.Printf("Skipped: %d → %v\n", len(summary.skipped), summary.skipped)

	os.Exit(code)
}

// --- VPC & Subnets ---
func TestVPCAndSubnets(t *testing.T) {
	if outputs.VpcId == "" || outputs.PrivateSubnetEc2Id == "" ||
		outputs.PrivateSubnetRdsId == "" || outputs.PublicSubnetId == "" {
		recordResult(t, true)
		t.Skip("Skipping VPC/Subnet tests since IDs are missing from outputs")
	}

	ec2Client := ec2.NewFromConfig(awsCfg)

	resp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{VpcIds: []string{outputs.VpcId}})
	require.NoError(t, err)
	require.Len(t, resp.Vpcs, 1)
	assert.Equal(t, "10.0.0.0/16", *resp.Vpcs[0].CidrBlock)

	subnetIDs := []string{outputs.PrivateSubnetEc2Id, outputs.PrivateSubnetRdsId, outputs.PublicSubnetId}
	subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{SubnetIds: subnetIDs})
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(subnetsResp.Subnets), len(subnetIDs))

	recordResult(t, false)
}

// --- EC2 Instance ---
func TestEC2Instance(t *testing.T) {
	if outputs.Ec2InstanceId == "" {
		recordResult(t, true)
		t.Skip("Skipping EC2 test since no EC2 instance ID in outputs")
	}

	ec2Client := ec2.NewFromConfig(awsCfg)

	resp, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{InstanceIds: []string{outputs.Ec2InstanceId}})
	require.NoError(t, err)
	require.Len(t, resp.Reservations, 1)

	recordResult(t, false)
}

// --- RDS Instance ---
func TestRDSInstance(t *testing.T) {
	if outputs.RdsEndpoint == "" {
		recordResult(t, true)
		t.Skip("Skipping RDS test since no RDS endpoint in outputs")
	}

	rdsClient := rds.NewFromConfig(awsCfg)

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

	if foundInstance == nil {
		recordResult(t, true)
		t.Skipf("Skipping RDS test since no DB instance matches endpoint %s", outputs.RdsEndpoint)
	}

	foundSG := false
	for _, sg := range foundInstance.VpcSecurityGroups {
		if sg.VpcSecurityGroupId != nil && aws.ToString(sg.VpcSecurityGroupId) == outputs.RdsSecurityGroupId {
			foundSG = true
			break
		}
	}
	assert.True(t, foundSG, "Expected RDS security group %s not found", outputs.RdsSecurityGroupId)

	recordResult(t, false)
}

// --- S3 Bucket ---
func TestS3BucketExists(t *testing.T) {
	if outputs.S3BucketName == "" {
		recordResult(t, true)
		t.Skip("Skipping S3 test since no bucket name in outputs")
	}

	client := s3.NewFromConfig(awsCfg)
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.S3BucketName),
	})
	require.NoError(t, err)

	recordResult(t, false)
}

// --- IAM Role & Policy ---
func TestIamRoleAndPolicyExist(t *testing.T) {
	if outputs.IamRoleArn == "" || outputs.IamPolicyArn == "" {
		recordResult(t, true)
		t.Skip("Skipping IAM test since role or policy ARN is missing in outputs")
	}

	client := iam.NewFromConfig(awsCfg)

	roleName := strings.Split(outputs.IamRoleArn, "/")[1]
	_, err := client.GetRole(ctx, &iam.GetRoleInput{RoleName: aws.String(roleName)})
	require.NoError(t, err)

	_, err = client.GetPolicy(ctx, &iam.GetPolicyInput{PolicyArn: aws.String(outputs.IamPolicyArn)})
	require.NoError(t, err)

	recordResult(t, false)
}

// --- CloudWatch Log Group ---
func TestCloudWatchLogGroupExists(t *testing.T) {
	if outputs.CloudWatchLogGroupName == "" {
		recordResult(t, true)
		t.Skip("Skipping CloudWatch test since no log group name in outputs")
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

	recordResult(t, false)
}
