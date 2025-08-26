package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type CFNOutputs struct {
	EC2InstanceProfileArn string `json:"ec2InstanceProfileArn"`
	EC2RoleArn            string `json:"ec2RoleArn"`
	InternetGatewayId     string `json:"internetGatewayId"`
	LogsBucketArn         string `json:"logsBucketArn"`
	LogsBucketName        string `json:"logsBucketName"`
	PublicSubnetIds       string `json:"publicSubnetIds"`
	RDSRoleArn            string `json:"rdsRoleArn"`
	SecurityGroupId       string `json:"securityGroupId"`
	VpcId                 string `json:"vpcId"`
}

func loadCFNOutputs(t *testing.T) *CFNOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	require.NoError(t, err, "Failed to read cfn-outputs file")

	var outputs CFNOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs JSON")

	return &outputs
}

func TestVPCIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(outputs.VpcId)},
	})
	require.NoError(t, err)
	require.Len(t, result.Vpcs, 1)

	vpc := result.Vpcs[0]
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)
	assert.True(t, *vpc.EnableDnsHostnames)
	assert.True(t, *vpc.EnableDnsSupport)
}

func TestSecurityGroupIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(outputs.SecurityGroupId)},
	})
	require.NoError(t, err)
	require.Len(t, result.SecurityGroups, 1)

	sg := result.SecurityGroups[0]

	for _, rule := range sg.IpPermissions {
		for _, cidr := range rule.IpRanges {
			assert.True(t, strings.HasPrefix(*cidr.CidrIp, "10.0."),
				"Ingress rule should be restricted to VPC CIDR, found: %s", *cidr.CidrIp)
		}
	}
}

func TestIAMRolesIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	iamSvc := iam.New(sess)

	ec2RoleName := extractRoleNameFromArn(outputs.EC2RoleArn)

	policies, err := iamSvc.ListAttachedRolePolicies(&iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(ec2RoleName),
	})
	require.NoError(t, err)

	hasSSMPolicy := false
	for _, policy := range policies.AttachedPolicies {
		if strings.Contains(*policy.PolicyArn, "AmazonSSMManagedInstanceCore") {
			hasSSMPolicy = true
			break
		}
	}
	assert.True(t, hasSSMPolicy, "EC2 role should have Session Manager policy")
}

func TestS3BucketIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	s3Svc := s3.New(sess)

	_, err := s3Svc.HeadBucket(&s3.HeadBucketInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	require.NoError(t, err, "Logs bucket should exist")

	versioning, err := s3Svc.GetBucketVersioning(&s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	require.NoError(t, err)
	assert.Equal(t, "Enabled", *versioning.Status)

	encryption, err := s3Svc.GetBucketEncryption(&s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	require.NoError(t, err)
	require.Len(t, encryption.ServerSideEncryptionConfiguration.Rules, 1)

	rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
	assert.Equal(t, "aws:kms", *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
}

func TestPublicSubnetsIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	var subnetIds []string
	err := json.Unmarshal([]byte(outputs.PublicSubnetIds), &subnetIds)
	require.NoError(t, err)
	require.Len(t, subnetIds, 2, "Should have exactly 2 public subnets")

	result, err := ec2Svc.DescribeSubnets(&ec2.DescribeSubnetsInput{
		SubnetIds: aws.StringSlice(subnetIds),
	})
	require.NoError(t, err)
	require.Len(t, result.Subnets, 2)

	azs := make(map[string]bool)
	for _, subnet := range result.Subnets {
		assert.Equal(t, outputs.VpcId, *subnet.VpcId)
		assert.True(t, *subnet.MapPublicIpOnLaunch)
		azs[*subnet.AvailabilityZone] = true
	}
	assert.Len(t, azs, 2, "Subnets should be in different availability zones")
}

func TestInternetGatewayIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeInternetGateways(&ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []*string{aws.String(outputs.InternetGatewayId)},
	})
	require.NoError(t, err)
	require.Len(t, result.InternetGateways, 1)

	igw := result.InternetGateways[0]
	require.Len(t, igw.Attachments, 1)
	assert.Equal(t, outputs.VpcId, *igw.Attachments[0].VpcId)
	assert.Equal(t, "available", *igw.Attachments[0].State)
}

func extractRoleNameFromArn(arn string) string {
	parts := strings.Split(arn, "/")
	return parts[len(parts)-1]
}
