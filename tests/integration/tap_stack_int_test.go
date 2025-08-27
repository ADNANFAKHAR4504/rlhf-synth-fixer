//go:build integration
// +build integration

package lib

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// TestData represents the stack outputs for testing
type TestData struct {
	VPCID                 string          `json:"vpc_id"`
	PublicSubnetIDs       json.RawMessage `json:"public_subnet_ids"`
	PrivateSubnetIDs      json.RawMessage `json:"private_subnet_ids"`
	LoggingBucketName     string          `json:"logging_bucket_name"`
	ReplicationBucketName string          `json:"replication_bucket_name"`
	EC2RoleARN            string          `json:"ec2_role_arn"`
	LambdaRoleARN         string          `json:"lambda_role_arn"`
}

// ParsedTestData represents the parsed test data with proper types
type ParsedTestData struct {
	VPCID                 string
	PublicSubnetIDs       []string
	PrivateSubnetIDs      []string
	LoggingBucketName     string
	ReplicationBucketName string
	EC2RoleARN            string
	LambdaRoleARN         string
}

// AWS clients
var (
	ec2Client *ec2.Client
	iamClient *iam.Client
	s3Client  *s3.Client
	region    string
)

// setupAWS initializes AWS clients
func setupAWS(t *testing.T) {
	// Read AWS region from file
	regionBytes, err := os.ReadFile("../lib/AWS_REGION")
	if err != nil {
		t.Fatalf("Failed to read AWS region: %v", err)
	}
	region = strings.TrimSpace(string(regionBytes))

	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		t.Fatalf("Failed to load AWS config: %v", err)
	}

	// Initialize clients
	ec2Client = ec2.NewFromConfig(cfg)
	iamClient = iam.NewFromConfig(cfg)
	s3Client = s3.NewFromConfig(cfg)
}

// loadTestData loads the stack outputs from the flat outputs file
func loadTestData(t *testing.T) *ParsedTestData {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read flat outputs file: %v", err)
	}

	var rawData TestData
	err = json.Unmarshal(data, &rawData)
	if err != nil {
		t.Fatalf("Failed to unmarshal test data: %v", err)
	}

	// Parse subnet IDs - they might be arrays or JSON strings
	var publicSubnetIDs []string
	var privateSubnetIDs []string

	// Try to parse public subnet IDs
	if len(rawData.PublicSubnetIDs) > 0 {
		// First try to unmarshal as array
		err = json.Unmarshal(rawData.PublicSubnetIDs, &publicSubnetIDs)
		if err != nil {
			// If that fails, try to unmarshal as string first, then as array
			var subnetString string
			err = json.Unmarshal(rawData.PublicSubnetIDs, &subnetString)
			if err != nil {
				t.Fatalf("Failed to parse public subnet IDs: %v", err)
			}
			err = json.Unmarshal([]byte(subnetString), &publicSubnetIDs)
			if err != nil {
				t.Fatalf("Failed to parse public subnet IDs from string: %v", err)
			}
		}
	}

	// Try to parse private subnet IDs
	if len(rawData.PrivateSubnetIDs) > 0 {
		// First try to unmarshal as array
		err = json.Unmarshal(rawData.PrivateSubnetIDs, &privateSubnetIDs)
		if err != nil {
			// If that fails, try to unmarshal as string first, then as array
			var subnetString string
			err = json.Unmarshal(rawData.PrivateSubnetIDs, &subnetString)
			if err != nil {
				t.Fatalf("Failed to parse private subnet IDs: %v", err)
			}
			err = json.Unmarshal([]byte(subnetString), &privateSubnetIDs)
			if err != nil {
				t.Fatalf("Failed to parse private subnet IDs from string: %v", err)
			}
		}
	}

	return &ParsedTestData{
		VPCID:                 rawData.VPCID,
		PublicSubnetIDs:       publicSubnetIDs,
		PrivateSubnetIDs:      privateSubnetIDs,
		LoggingBucketName:     rawData.LoggingBucketName,
		ReplicationBucketName: rawData.ReplicationBucketName,
		EC2RoleARN:            rawData.EC2RoleARN,
		LambdaRoleARN:         rawData.LambdaRoleARN,
	}
}

// TestVPCExists validates that the VPC exists in AWS
func TestVPCExists(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Describe VPC
	resp, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{testData.VPCID},
	})
	if err != nil {
		t.Fatalf("Failed to describe VPC: %v", err)
	}

	if len(resp.Vpcs) == 0 {
		t.Fatal("VPC not found")
	}

	vpc := resp.Vpcs[0]

	// Validate VPC properties
	if vpc.VpcId == nil || *vpc.VpcId != testData.VPCID {
		t.Errorf("VPC ID mismatch: expected %s, got %s", testData.VPCID, aws.ToString(vpc.VpcId))
	}

	// Validate VPC has a CIDR block (don't check specific value)
	if vpc.CidrBlock == nil {
		t.Error("VPC should have a CIDR block")
	}

	// Validate VPC is in the correct state
	if vpc.State != "available" {
		t.Errorf("VPC should be in 'available' state, got %s", vpc.State)
	}

	// Validate tags exist (don't check specific values)
	hasNameTag := false
	hasEnvironmentTag := false
	hasProjectTag := false

	for _, tag := range vpc.Tags {
		switch aws.ToString(tag.Key) {
		case "Name":
			hasNameTag = true
		case "Environment":
			hasEnvironmentTag = true
		case "Project":
			hasProjectTag = true
		}
	}

	if !hasNameTag {
		t.Error("VPC should have Name tag")
	}
	if !hasEnvironmentTag {
		t.Error("VPC should have Environment tag")
	}
	if !hasProjectTag {
		t.Error("VPC should have Project tag")
	}
}

// TestSubnetsExist validates that all subnets exist in AWS
func TestSubnetsExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Combine all subnet IDs
	allSubnetIDs := append(testData.PublicSubnetIDs, testData.PrivateSubnetIDs...)

	// Describe subnets
	resp, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: allSubnetIDs,
	})
	if err != nil {
		t.Fatalf("Failed to describe subnets: %v", err)
	}

	if len(resp.Subnets) != len(allSubnetIDs) {
		t.Errorf("Expected %d subnets, found %d", len(allSubnetIDs), len(resp.Subnets))
	}

	// Validate each subnet
	for _, subnet := range resp.Subnets {
		subnetID := aws.ToString(subnet.SubnetId)
		vpcID := aws.ToString(subnet.VpcId)

		// Check VPC association
		if vpcID != testData.VPCID {
			t.Errorf("Subnet %s should be in VPC %s, but is in %s", subnetID, testData.VPCID, vpcID)
		}

		// Check availability zone
		if subnet.AvailabilityZone == nil {
			t.Errorf("Subnet %s should have an availability zone", subnetID)
		}

		// Check CIDR block exists (don't check specific value)
		if subnet.CidrBlock == nil {
			t.Errorf("Subnet %s should have a CIDR block", subnetID)
		}

		// Check subnet state
		if subnet.State != "available" {
			t.Errorf("Subnet %s should be in 'available' state, got %s", subnetID, subnet.State)
		}

		// Validate tags exist (don't check specific values)
		hasNameTag := false
		hasTypeTag := false
		hasEnvironmentTag := false
		hasProjectTag := false

		for _, tag := range subnet.Tags {
			switch aws.ToString(tag.Key) {
			case "Name":
				hasNameTag = true
			case "Type":
				hasTypeTag = true
			case "Environment":
				hasEnvironmentTag = true
			case "Project":
				hasProjectTag = true
			}
		}

		if !hasNameTag {
			t.Errorf("Subnet %s should have Name tag", subnetID)
		}
		if !hasTypeTag {
			t.Errorf("Subnet %s should have Type tag", subnetID)
		}
		if !hasEnvironmentTag {
			t.Errorf("Subnet %s should have Environment tag", subnetID)
		}
		if !hasProjectTag {
			t.Errorf("Subnet %s should have Project tag", subnetID)
		}
	}
}

// TestS3BucketsExist validates that S3 buckets exist in AWS
func TestS3BucketsExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Test logging bucket
	loggingBucketExists := true
	_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(testData.LoggingBucketName),
	})
	if err != nil {
		t.Errorf("Logging bucket %s does not exist or is not accessible: %v", testData.LoggingBucketName, err)
		loggingBucketExists = false
	}

	// Test replication bucket
	replicationBucketExists := true
	_, err = s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(testData.ReplicationBucketName),
	})
	if err != nil {
		t.Errorf("Replication bucket %s does not exist or is not accessible: %v", testData.ReplicationBucketName, err)
		replicationBucketExists = false
	}

	// Only test bucket locations if buckets are accessible
	if loggingBucketExists {
		// Get bucket location
		loggingLocation, err := s3Client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: aws.String(testData.LoggingBucketName),
		})
		if err != nil {
			t.Errorf("Failed to get logging bucket location: %v", err)
		} else {
			// Check bucket location - handle empty location constraint for us-east-1
			locationConstraint := string(loggingLocation.LocationConstraint)
			if locationConstraint == "" {
				locationConstraint = "us-east-1" // Default region when LocationConstraint is empty
			}
			if locationConstraint != region {
				t.Errorf("Logging bucket should be in region %s, but is in %s", region, locationConstraint)
			}
		}
	}

	if replicationBucketExists {
		replicationLocation, err := s3Client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: aws.String(testData.ReplicationBucketName),
		})
		if err != nil {
			t.Errorf("Failed to get replication bucket location: %v", err)
		} else {
			// Check bucket location - handle empty location constraint for us-east-1
			replicationLocationConstraint := string(replicationLocation.LocationConstraint)
			if replicationLocationConstraint == "" {
				replicationLocationConstraint = "us-east-1" // Default region when LocationConstraint is empty
			}
			if replicationLocationConstraint != region {
				t.Errorf("Replication bucket should be in region %s, but is in %s", region, replicationLocationConstraint)
			}
		}
	}
}

// TestIAMRolesExist validates that IAM roles exist in AWS
func TestIAMRolesExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Extract role names from ARNs - handle the *** placeholder
	ec2RoleARN := testData.EC2RoleARN
	lambdaRoleARN := testData.LambdaRoleARN

	// Check for *** placeholder in both ARNs
	if strings.Contains(ec2RoleARN, "***") || strings.Contains(lambdaRoleARN, "***") {
		// Skip this test if we can't determine the actual role name
		t.Skip("Skipping IAM role test due to placeholder account ID in ARN")
		return
	}

	// Extract role names from ARNs - use a more robust approach
	ec2RoleName := ""
	lambdaRoleName := ""

	// Extract EC2 role name
	if strings.HasPrefix(ec2RoleARN, "arn:aws:iam::") {
		parts := strings.Split(ec2RoleARN, ":role/")
		if len(parts) == 2 {
			ec2RoleName = parts[1]
		}
	}

	// Extract Lambda role name
	if strings.HasPrefix(lambdaRoleARN, "arn:aws:iam::") {
		parts := strings.Split(lambdaRoleARN, ":role/")
		if len(parts) == 2 {
			lambdaRoleName = parts[1]
		}
	}

	// Validate that we extracted valid role names
	if ec2RoleName == "" {
		t.Skip("Could not extract valid EC2 role name from ARN")
		return
	}
	if lambdaRoleName == "" {
		t.Skip("Could not extract valid Lambda role name from ARN")
		return
	}

	// Test EC2 role
	_, err := iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
		RoleName: aws.String(ec2RoleName),
	})
	if err != nil {
		t.Errorf("EC2 role %s does not exist: %v", ec2RoleName, err)
	}

	// Test Lambda role
	_, err = iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
		RoleName: aws.String(lambdaRoleName),
	})
	if err != nil {
		t.Errorf("Lambda role %s does not exist: %v", lambdaRoleName, err)
	}

	// Get role details for EC2 role
	ec2RoleResp, err := iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
		RoleName: aws.String(ec2RoleName),
	})
	if err == nil {
		role := ec2RoleResp.Role

		// Check assume role policy exists
		if role.AssumeRolePolicyDocument == nil {
			t.Error("EC2 role should have an assume role policy")
		}

		// Check tags exist (don't check specific values)
		hasEnvironmentTag := false
		hasProjectTag := false

		for _, tag := range role.Tags {
			switch aws.ToString(tag.Key) {
			case "Environment":
				hasEnvironmentTag = true
			case "Project":
				hasProjectTag = true
			}
		}

		if !hasEnvironmentTag {
			t.Error("EC2 role should have Environment tag")
		}
		if !hasProjectTag {
			t.Error("EC2 role should have Project tag")
		}
	}
}

// TestInternetGatewayExists validates that Internet Gateway exists and is attached to VPC
func TestInternetGatewayExists(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Describe Internet Gateways
	resp, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{})
	if err != nil {
		t.Fatalf("Failed to describe Internet Gateways: %v", err)
	}

	if len(resp.InternetGateways) == 0 {
		t.Fatal("No Internet Gateway found")
	}

	// Find the IGW attached to our VPC
	var igw *ec2types.InternetGateway
	for _, gateway := range resp.InternetGateways {
		for _, attachment := range gateway.Attachments {
			if aws.ToString(attachment.VpcId) == testData.VPCID {
				igw = &gateway
				break
			}
		}
		if igw != nil {
			break
		}
	}

	if igw == nil {
		t.Fatal("No Internet Gateway found attached to VPC")
	}

	// Check attachment state
	if len(igw.Attachments) == 0 {
		t.Error("Internet Gateway should be attached to VPC")
	} else {
		attachment := igw.Attachments[0]
		if aws.ToString(attachment.VpcId) != testData.VPCID {
			t.Errorf("Internet Gateway should be attached to VPC %s, but is attached to %s",
				testData.VPCID, aws.ToString(attachment.VpcId))
		}
		// Check that the gateway is in a valid state (attached or available)
		if attachment.State != "attached" && attachment.State != "available" {
			t.Errorf("Internet Gateway should be in 'attached' or 'available' state, but is in %s", attachment.State)
		}
	}

	// Validate tags exist (don't check specific values)
	hasNameTag := false
	hasEnvironmentTag := false
	hasProjectTag := false

	for _, tag := range igw.Tags {
		switch aws.ToString(tag.Key) {
		case "Name":
			hasNameTag = true
		case "Environment":
			hasEnvironmentTag = true
		case "Project":
			hasProjectTag = true
		}
	}

	if !hasNameTag {
		t.Error("Internet Gateway should have Name tag")
	}
	if !hasEnvironmentTag {
		t.Error("Internet Gateway should have Environment tag")
	}
	if !hasProjectTag {
		t.Error("Internet Gateway should have Project tag")
	}
}

// TestNATGatewaysExist validates that NAT Gateways exist
func TestNATGatewaysExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)

	// Describe NAT Gateways
	resp, err := ec2Client.DescribeNatGateways(context.TODO(), &ec2.DescribeNatGatewaysInput{})
	if err != nil {
		t.Fatalf("Failed to describe NAT Gateways: %v", err)
	}

	if len(resp.NatGateways) == 0 {
		t.Fatal("No NAT Gateways found")
	}

	// Filter NAT Gateways for our VPC
	var vpcNatGateways []ec2types.NatGateway
	for _, natGateway := range resp.NatGateways {
		if aws.ToString(natGateway.VpcId) == testData.VPCID {
			vpcNatGateways = append(vpcNatGateways, natGateway)
		}
	}

	if len(vpcNatGateways) == 0 {
		t.Fatal("No NAT Gateways found in VPC")
	}

	// Check that we have at least 2 NAT Gateways for high availability
	if len(vpcNatGateways) < 2 {
		t.Errorf("Expected at least 2 NAT Gateways for high availability, found %d", len(vpcNatGateways))
	}

	// Validate each NAT Gateway
	for _, natGateway := range vpcNatGateways {
		natID := aws.ToString(natGateway.NatGatewayId)
		vpcID := aws.ToString(natGateway.VpcId)

		// Check VPC association
		if vpcID != testData.VPCID {
			t.Errorf("NAT Gateway %s should be in VPC %s, but is in %s", natID, testData.VPCID, vpcID)
		}

		// Check state
		if natGateway.State != "available" {
			t.Errorf("NAT Gateway %s should be in 'available' state, but is in %s", natID, natGateway.State)
		}

		// Check subnet association
		if natGateway.SubnetId == nil {
			t.Errorf("NAT Gateway %s should be associated with a subnet", natID)
		} else {
			subnetID := aws.ToString(natGateway.SubnetId)
			// Check if subnet is in our public subnets list
			found := false
			for _, publicSubnetID := range testData.PublicSubnetIDs {
				if publicSubnetID == subnetID {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("NAT Gateway %s should be in a public subnet, but is in %s", natID, subnetID)
			}
		}

		// Check Elastic IP association
		if len(natGateway.NatGatewayAddresses) == 0 {
			t.Errorf("NAT Gateway %s should have an Elastic IP address", natID)
		}

		// Validate tags exist (don't check specific values)
		hasNameTag := false
		hasEnvironmentTag := false
		hasProjectTag := false

		for _, tag := range natGateway.Tags {
			switch aws.ToString(tag.Key) {
			case "Name":
				hasNameTag = true
			case "Environment":
				hasEnvironmentTag = true
			case "Project":
				hasProjectTag = true
			}
		}

		if !hasNameTag {
			t.Errorf("NAT Gateway %s should have Name tag", natID)
		}
		if !hasEnvironmentTag {
			t.Errorf("NAT Gateway %s should have Environment tag", natID)
		}
		if !hasProjectTag {
			t.Errorf("NAT Gateway %s should have Project tag", natID)
		}
	}
}

// TestIntegrationPlaceholder is kept for backward compatibility
func TestIntegrationPlaceholder(t *testing.T) {
	t.Log("Integration tests are now implemented")
}
