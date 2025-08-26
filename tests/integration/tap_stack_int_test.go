//go:build integration
// +build integration

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

// TestVPCEndpointsIntegration tests VPC endpoints for Session Manager
func TestVPCEndpointsIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeVpcEndpoints(&ec2.DescribeVpcEndpointsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(outputs.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least SSM endpoints
	assert.GreaterOrEqual(t, len(result.VpcEndpoints), 1)

	for _, endpoint := range result.VpcEndpoints {
		assert.Equal(t, "Interface", *endpoint.VpcEndpointType)
		assert.Equal(t, "available", *endpoint.State)
	}
}

// TestRouteTablesIntegration tests route table configuration
func TestRouteTablesIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(outputs.VpcId)},
			},
		},
	})
	require.NoError(t, err)

	// Should have at least one custom route table
	assert.GreaterOrEqual(t, len(result.RouteTables), 1)

	for _, rt := range result.RouteTables {
		for _, route := range rt.Routes {
			if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" {
				assert.NotNil(t, route.GatewayId)
				assert.Equal(t, outputs.InternetGatewayId, *route.GatewayId)
			}
		}
	}
}

// TestKMSKeyIntegration tests KMS key configuration
func TestKMSKeyIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	s3Svc := s3.New(sess)

	encryption, err := s3Svc.GetBucketEncryption(&s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	require.NoError(t, err)

	rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
	assert.Equal(t, "aws:kms", *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
	assert.NotNil(t, rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID)
}

// TestS3PublicAccessBlockIntegration tests S3 public access block
func TestS3PublicAccessBlockIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	s3Svc := s3.New(sess)

	pab, err := s3Svc.GetPublicAccessBlock(&s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	require.NoError(t, err)

	config := pab.PublicAccessBlockConfiguration
	assert.True(t, *config.BlockPublicAcls)
	assert.True(t, *config.BlockPublicPolicy)
	assert.True(t, *config.IgnorePublicAcls)
	assert.True(t, *config.RestrictPublicBuckets)
}

// TestIAMInstanceProfileIntegration tests instance profile
func TestIAMInstanceProfileIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	iamSvc := iam.New(sess)

	profileName := extractRoleNameFromArn(outputs.EC2InstanceProfileArn)

	profile, err := iamSvc.GetInstanceProfile(&iam.GetInstanceProfileInput{
		InstanceProfileName: aws.String(profileName),
	})
	require.NoError(t, err)

	assert.Len(t, profile.InstanceProfile.Roles, 1)
	assert.Contains(t, *profile.InstanceProfile.Roles[0].RoleName, "EC2-Role")
}

// TestSecurityGroupRulesIntegration tests security group rules in detail
func TestSecurityGroupRulesIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	result, err := ec2Svc.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(outputs.SecurityGroupId)},
	})
	require.NoError(t, err)

	sg := result.SecurityGroups[0]

	// Check ingress rules are restricted to VPC
	for _, rule := range sg.IpPermissions {
		for _, cidr := range rule.IpRanges {
			assert.True(t, strings.HasPrefix(*cidr.CidrIp, "10.0."))
		}
	}

	// Check egress rules allow HTTPS and HTTP
	httpsAllowed := false
	httpAllowed := false
	for _, rule := range sg.IpPermissionsEgress {
		if rule.FromPort != nil {
			if *rule.FromPort == 443 {
				httpsAllowed = true
			}
			if *rule.FromPort == 80 {
				httpAllowed = true
			}
		}
	}
	assert.True(t, httpsAllowed)
	assert.True(t, httpAllowed)
}

// TestResourceTaggingIntegration tests resource tagging compliance
func TestResourceTaggingIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())

	// Test VPC tags
	ec2Svc := ec2.New(sess)
	vpcResult, err := ec2Svc.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(outputs.VpcId)},
	})
	require.NoError(t, err)

	vpcTags := make(map[string]string)
	for _, tag := range vpcResult.Vpcs[0].Tags {
		vpcTags[*tag.Key] = *tag.Value
	}
	assert.Equal(t, "Development", vpcTags["Environment"])
	assert.Equal(t, "CloudEnvironmentSetup", vpcTags["Project"])
	assert.Equal(t, "Pulumi", vpcTags["ManagedBy"])

	// Test S3 bucket tags
	s3Svc := s3.New(sess)
	bucketTags, err := s3Svc.GetBucketTagging(&s3.GetBucketTaggingInput{
		Bucket: aws.String(outputs.LogsBucketName),
	})
	if err == nil {
		tagMap := make(map[string]string)
		for _, tag := range bucketTags.TagSet {
			tagMap[*tag.Key] = *tag.Value
		}
		assert.Equal(t, "Development", tagMap["Environment"])
		assert.Equal(t, "CloudEnvironmentSetup", tagMap["Project"])
	}
}

// TestNetworkConnectivityIntegration tests network connectivity
func TestNetworkConnectivityIntegration(t *testing.T) {
	outputs := loadCFNOutputs(t)
	sess := session.Must(session.NewSession())
	ec2Svc := ec2.New(sess)

	// Parse subnet IDs
	var subnetIds []string
	err := json.Unmarshal([]byte(outputs.PublicSubnetIds), &subnetIds)
	require.NoError(t, err)

	// Check route table associations
	for _, subnetId := range subnetIds {
		result, err := ec2Svc.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
			Filters: []*ec2.Filter{
				{
					Name:   aws.String("association.subnet-id"),
					Values: []*string{aws.String(subnetId)},
				},
			},
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(result.RouteTables), 1)
	}
}

// TestE2EInfrastructureValidation tests end-to-end infrastructure
func TestE2EInfrastructureValidation(t *testing.T) {
	outputs := loadCFNOutputs(t)

	// Validate all required outputs are present
	assert.NotEmpty(t, outputs.VpcId)
	assert.NotEmpty(t, outputs.PublicSubnetIds)
	assert.NotEmpty(t, outputs.InternetGatewayId)
	assert.NotEmpty(t, outputs.SecurityGroupId)
	assert.NotEmpty(t, outputs.EC2RoleArn)
	assert.NotEmpty(t, outputs.EC2InstanceProfileArn)
	assert.NotEmpty(t, outputs.RDSRoleArn)
	assert.NotEmpty(t, outputs.LogsBucketName)
	assert.NotEmpty(t, outputs.LogsBucketArn)

	// Validate ARN formats
	assert.Contains(t, outputs.EC2RoleArn, "arn:aws:iam::")
	assert.Contains(t, outputs.EC2InstanceProfileArn, "arn:aws:iam::")
	assert.Contains(t, outputs.RDSRoleArn, "arn:aws:iam::")
	assert.Contains(t, outputs.LogsBucketArn, "arn:aws:s3:::")

	// Validate resource IDs format
	assert.True(t, strings.HasPrefix(outputs.VpcId, "vpc-"))
	assert.True(t, strings.HasPrefix(outputs.InternetGatewayId, "igw-"))
	assert.True(t, strings.HasPrefix(outputs.SecurityGroupId, "sg-"))
}
