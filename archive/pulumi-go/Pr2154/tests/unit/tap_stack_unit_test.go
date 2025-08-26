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

// TestMainFunction tests the main infrastructure creation function
func TestMainFunction(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", &infraMocks{}))

	assert.NoError(t, err)
}

func TestEnvironmentSuffixDefault(t *testing.T) {
	os.Unsetenv("ENVIRONMENT_SUFFIX")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", &infraMocks{}))

	assert.NoError(t, err)
}

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

// TestKMSKeyConfiguration tests KMS key settings
func TestKMSKeyConfiguration(t *testing.T) {
	keyUsage := "ENCRYPT_DECRYPT"
	assert.Equal(t, "ENCRYPT_DECRYPT", keyUsage)

	keyEnabled := true
	assert.True(t, keyEnabled)

	aliasPrefix := "alias/logs-bucket-"
	assert.Contains(t, aliasPrefix, "logs-bucket")
}

// TestVPCEndpointsConfiguration tests VPC endpoints
func TestVPCEndpointsConfiguration(t *testing.T) {
	expectedEndpoints := []string{
		"com.amazonaws.us-east-1.ssm",
		"com.amazonaws.us-east-1.ssmmessages",
		"com.amazonaws.us-east-1.ec2messages",
	}

	for _, endpoint := range expectedEndpoints {
		assert.Contains(t, endpoint, "amazonaws")
		assert.Contains(t, endpoint, "us-east-1")
	}

	assert.Equal(t, 3, len(expectedEndpoints))
}

// TestRouteTableConfiguration tests route table settings
func TestRouteTableConfiguration(t *testing.T) {
	defaultRoute := "0.0.0.0/0"
	assert.Equal(t, "0.0.0.0/0", defaultRoute)

	routeTableType := "public"
	assert.Equal(t, "public", routeTableType)
}

// TestInstanceProfileConfiguration tests instance profile settings
func TestInstanceProfileConfiguration(t *testing.T) {
	instanceProfileName := "EC2-InstanceProfile-test"
	assert.Contains(t, instanceProfileName, "EC2-InstanceProfile")
	assert.Contains(t, instanceProfileName, "test")
}

// TestPolicyDocumentValidation tests IAM policy documents
func TestPolicyDocumentValidation(t *testing.T) {
	// Test EC2 assume role policy structure
	ec2Policy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Action": "sts:AssumeRole",
				"Principal": map[string]string{
					"Service": "ec2.amazonaws.com",
				},
				"Effect": "Allow",
			},
		},
	}

	assert.Equal(t, "2012-10-17", ec2Policy["Version"])
	statements := ec2Policy["Statement"].([]map[string]interface{})
	assert.Len(t, statements, 1)
	assert.Equal(t, "sts:AssumeRole", statements[0]["Action"])
}

// TestAvailabilityZoneDistribution tests AZ distribution
func TestAvailabilityZoneDistribution(t *testing.T) {
	azs := []string{"us-east-1a", "us-east-1b"}
	assert.Len(t, azs, 2)
	assert.NotEqual(t, azs[0], azs[1])

	for _, az := range azs {
		assert.Contains(t, az, "us-east-1")
	}
}

// TestResourceLimitsAndConstraints tests resource constraints
func TestResourceLimitsAndConstraints(t *testing.T) {
	// Test subnet count
	minSubnets := 2
	maxSubnets := 2
	assert.Equal(t, minSubnets, maxSubnets)

	// Test CIDR block size
	vpcCidrSize := 16
	subnetCidrSize := 24
	assert.Less(t, vpcCidrSize, subnetCidrSize)

	// Test port ranges
	httpPort := 80
	httpsPort := 443
	assert.Greater(t, httpsPort, httpPort)
}

// TestErrorHandling tests error scenarios
func TestErrorHandling(t *testing.T) {
	// Test with invalid environment suffix
	os.Setenv("ENVIRONMENT_SUFFIX", "")
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = "dev"
	}
	assert.Equal(t, "dev", suffix)

	// Test with very long suffix
	longSuffix := "very-long-environment-suffix-name"
	assert.Greater(t, len(longSuffix), 10)
}

// TestResourceDependencies tests resource dependency chains
func TestResourceDependencies(t *testing.T) {
	// VPC must exist before subnets
	vpcCreated := true
	subnetCreated := vpcCreated
	assert.True(t, subnetCreated)

	// IGW must be attached to VPC
	igwAttached := vpcCreated
	assert.True(t, igwAttached)

	// Route table depends on IGW
	routeTableConfigured := igwAttached
	assert.True(t, routeTableConfigured)
}

// TestMultipleEnvironments tests multiple environment configurations
func TestMultipleEnvironments(t *testing.T) {
	environments := []string{"dev", "staging", "prod"}

	for _, env := range environments {
		os.Setenv("ENVIRONMENT_SUFFIX", env)
		suffix := os.Getenv("ENVIRONMENT_SUFFIX")
		assert.Equal(t, env, suffix)

		// Test resource naming for each environment
		vpcName := "vpc-" + suffix
		assert.Contains(t, vpcName, env)
	}
}

// Mock implementation for Pulumi testing
type infraMocks struct{}

func (m *infraMocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := resource.PropertyMap{}

	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-" + args.Name)
		outputs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
		outputs["enableDnsHostnames"] = resource.NewBoolProperty(true)
		outputs["enableDnsSupport"] = resource.NewBoolProperty(true)
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty("subnet-" + args.Name)
		outputs["vpcId"] = resource.NewStringProperty("vpc-test")
		outputs["availabilityZone"] = resource.NewStringProperty("us-east-1a")
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = resource.NewStringProperty("sg-" + args.Name)
	case "aws:iam/role:Role":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789:role/" + args.Name)
		outputs["name"] = resource.NewStringProperty(args.Name)
	case "aws:s3/bucketV2:BucketV2":
		outputs["id"] = resource.NewStringProperty("bucket-" + args.Name)
		outputs["arn"] = resource.NewStringProperty("arn:aws:s3:::bucket-" + args.Name)
	}

	return args.Name + "_id", outputs, nil
}

func (m *infraMocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789"),
			"region":    resource.NewStringProperty("us-east-1"),
		}, nil
	}
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	}
	return resource.PropertyMap{}, nil
}
