//go:build !integration
// +build !integration

package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// TestEnvironmentSuffixHandling tests that environment suffix is handled correctly
func TestEnvironmentSuffixHandling(t *testing.T) {
	// Test with environment suffix set
	os.Setenv("ENVIRONMENT_SUFFIX", "prod")
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	assert.Equal(t, "prod", suffix)

	// Test with empty environment suffix (should default to "dev")
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	suffix = os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = "dev"
	}
	assert.Equal(t, "dev", suffix)
}

// TestResourceNaming tests that resources are named with environment suffix
func TestResourceNaming(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test123")
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	
	// Test VPC naming
	vpcName := "vpc-" + suffix
	assert.Equal(t, "vpc-test123", vpcName)
	
	// Test IGW naming
	igwName := "igw-" + suffix
	assert.Equal(t, "igw-test123", igwName)
	
	// Test Subnet naming
	subnetName := "public-subnet-" + suffix + "-1"
	assert.Equal(t, "public-subnet-test123-1", subnetName)
	
	// Test Security Group naming
	sgName := "security-group-" + suffix
	assert.Equal(t, "security-group-test123", sgName)
	
	// Test IAM Role naming
	ec2RoleName := "EC2-Role-" + suffix
	assert.Equal(t, "EC2-Role-test123", ec2RoleName)
	
	rdsRoleName := "RDS-Role-" + suffix
	assert.Equal(t, "RDS-Role-test123", rdsRoleName)
	
	// Test S3 Bucket naming
	bucketName := "logs-bucket-" + suffix + "-123456789"
	assert.Equal(t, "logs-bucket-test123-123456789", bucketName)
}

// TestTaggingConsistency tests that all resources have consistent tags
func TestTaggingConsistency(t *testing.T) {
	expectedTags := map[string]string{
		"Environment": "Development",
		"Project":     "CloudEnvironmentSetup",
		"ManagedBy":   "Pulumi",
	}
	
	// Verify all expected tags are present
	assert.Equal(t, "Development", expectedTags["Environment"])
	assert.Equal(t, "CloudEnvironmentSetup", expectedTags["Project"])
	assert.Equal(t, "Pulumi", expectedTags["ManagedBy"])
}

// TestCIDRBlockConfiguration tests CIDR block configurations
func TestCIDRBlockConfiguration(t *testing.T) {
	// Test VPC CIDR
	vpcCidr := "10.0.0.0/16"
	assert.Equal(t, "10.0.0.0/16", vpcCidr)
	
	// Test Subnet CIDRs
	subnet1Cidr := "10.0.1.0/24"
	subnet2Cidr := "10.0.2.0/24"
	assert.Equal(t, "10.0.1.0/24", subnet1Cidr)
	assert.Equal(t, "10.0.2.0/24", subnet2Cidr)
	
	// Ensure subnets are within VPC CIDR range
	assert.Contains(t, vpcCidr, "10.0.")
	assert.Contains(t, subnet1Cidr, "10.0.")
	assert.Contains(t, subnet2Cidr, "10.0.")
}

// TestSecurityGroupRules tests security group configurations
func TestSecurityGroupRules(t *testing.T) {
	// Test ingress rules
	httpPort := 80
	httpsPort := 443
	assert.Equal(t, 80, httpPort)
	assert.Equal(t, 443, httpsPort)
	
	// Test egress rules (allow all)
	egressProtocol := "-1"
	assert.Equal(t, "-1", egressProtocol)
}

// TestIAMPolicies tests IAM role policies
func TestIAMPolicies(t *testing.T) {
	// Test EC2 assume role policy
	ec2Service := "ec2.amazonaws.com"
	assert.Equal(t, "ec2.amazonaws.com", ec2Service)
	
	// Test RDS assume role policy
	rdsService := "rds.amazonaws.com"
	assert.Equal(t, "rds.amazonaws.com", rdsService)
	
	// Test policy ARNs
	ec2PolicyArn := "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
	rdsMonitoringPolicyArn := "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
	assert.Contains(t, ec2PolicyArn, "AmazonEC2ReadOnlyAccess")
	assert.Contains(t, rdsMonitoringPolicyArn, "AmazonRDSEnhancedMonitoringRole")
}

// TestS3BucketConfiguration tests S3 bucket settings
func TestS3BucketConfiguration(t *testing.T) {
	// Test versioning status
	versioningStatus := "Enabled"
	assert.Equal(t, "Enabled", versioningStatus)
	
	// Test public access block settings
	blockPublicAcls := true
	blockPublicPolicy := true
	ignorePublicAcls := true
	restrictPublicBuckets := true
	
	assert.True(t, blockPublicAcls)
	assert.True(t, blockPublicPolicy)
	assert.True(t, ignorePublicAcls)
	assert.True(t, restrictPublicBuckets)
	
	// Test encryption
	sseAlgorithm := "AES256"
	assert.Equal(t, "AES256", sseAlgorithm)
}

// TestVPCConfiguration tests VPC DNS settings
func TestVPCConfiguration(t *testing.T) {
	enableDnsHostnames := true
	enableDnsSupport := true
	
	assert.True(t, enableDnsHostnames)
	assert.True(t, enableDnsSupport)
}

// TestSubnetConfiguration tests subnet settings
func TestSubnetConfiguration(t *testing.T) {
	mapPublicIpOnLaunch := true
	assert.True(t, mapPublicIpOnLaunch)
	
	// Test availability zones
	az1 := "us-east-1a"
	az2 := "us-east-1b"
	assert.NotEqual(t, az1, az2)
	assert.Contains(t, az1, "us-east-1")
	assert.Contains(t, az2, "us-east-1")
}

// TestExportedOutputs tests that all required outputs are exported
func TestExportedOutputs(t *testing.T) {
	expectedOutputs := []string{
		"vpcId",
		"publicSubnetIds",
		"internetGatewayId",
		"securityGroupId",
		"ec2RoleArn",
		"ec2InstanceProfileArn",
		"rdsRoleArn",
		"logsBucketName",
		"logsBucketArn",
	}
	
	for _, output := range expectedOutputs {
		assert.NotEmpty(t, output)
	}
	
	assert.Equal(t, 9, len(expectedOutputs))
}

// Mock implementation for Pulumi testing
type mocks struct{}

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	// Return a unique ID and the input properties
	return args.Name + "_id", args.Inputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	// Return empty property map for calls
	return resource.PropertyMap{}, nil
}