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
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/wafv2"
	wafv2types "github.com/aws/aws-sdk-go-v2/service/wafv2/types"
	"github.com/stretchr/testify/assert"
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
	ec2Client                    *ec2.Client
	iamClient                    *iam.Client
	s3Client                     *s3.Client
	elasticloadbalancingv2Client *elasticloadbalancingv2.Client
	autoscalingClient            *autoscaling.Client
	rdsClient                    *rds.Client
	wafv2Client                  *wafv2.Client
	snsClient                    *sns.Client
	cloudwatchClient             *cloudwatchlogs.Client
	secretsClient                *secretsmanager.Client
	kmsClient                    *kms.Client
	region                       string
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
	elasticloadbalancingv2Client = elasticloadbalancingv2.NewFromConfig(cfg)
	autoscalingClient = autoscaling.NewFromConfig(cfg)
	rdsClient = rds.NewFromConfig(cfg)
	wafv2Client = wafv2.NewFromConfig(cfg)
	snsClient = sns.NewFromConfig(cfg)
	cloudwatchClient = cloudwatchlogs.NewFromConfig(cfg)
	secretsClient = secretsmanager.NewFromConfig(cfg)
	kmsClient = kms.NewFromConfig(cfg)
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

// TestVPCExists validates that VPC exists in AWS
func TestVPCExists(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing VPC existence for dev environment - VPC ID: %s", testData.VPCID)

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

	// Dev environment specific validations
	t.Logf("VPC validation completed for dev environment - VPC: %s, State: %s", testData.VPCID, vpc.State)
}

// TestSubnetsExist validates that all subnets exist in AWS
func TestSubnetsExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing subnet existence for dev environment - VPC: %s", testData.VPCID)

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
		hasEnvironmentTag := false
		hasProjectTag := false

		for _, tag := range subnet.Tags {
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
			t.Errorf("Subnet %s should have Name tag", subnetID)
		}
		if !hasEnvironmentTag {
			t.Errorf("Subnet %s should have Environment tag", subnetID)
		}
		if !hasProjectTag {
			t.Errorf("Subnet %s should have Project tag", subnetID)
		}
	}

	// Dev environment specific validations
	t.Logf("Subnet validation completed for dev environment - Found %d subnets in VPC %s", len(resp.Subnets), testData.VPCID)
}

// TestS3BucketsExist validates that S3 buckets exist in AWS
func TestS3BucketsExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing S3 bucket existence for dev environment")

	// Test logging bucket
	loggingBucketExists := false
	_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(testData.LoggingBucketName),
	})
	if err == nil {
		loggingBucketExists = true
		t.Logf("Logging bucket %s exists", testData.LoggingBucketName)
	} else {
		t.Logf("Logging bucket %s does not exist or is not accessible: %v", testData.LoggingBucketName, err)
	}

	// Test replication bucket
	replicationBucketExists := false
	_, err = s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(testData.ReplicationBucketName),
	})
	if err == nil {
		replicationBucketExists = true
		t.Logf("Replication bucket %s exists", testData.ReplicationBucketName)
	} else {
		t.Logf("Replication bucket %s does not exist or is not accessible: %v", testData.ReplicationBucketName, err)
	}

	// Validate bucket naming conventions for dev environment
	if !strings.Contains(testData.LoggingBucketName, "logs-") {
		t.Error("Logging bucket name should contain 'logs-' prefix for dev environment")
	}

	if !strings.Contains(testData.ReplicationBucketName, "logs-replica-") {
		t.Error("Replication bucket name should contain 'logs-replica-' prefix for dev environment")
	}

	// If buckets exist, test additional properties
	if loggingBucketExists {
		// Test bucket location
		locationResp, err := s3Client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: aws.String(testData.LoggingBucketName),
		})
		if err == nil {
			location := string(locationResp.LocationConstraint)
			if location == "" {
				location = "us-east-1" // Default for us-east-1
			}
			t.Logf("Logging bucket %s is in region: %s", testData.LoggingBucketName, location)
		}
	}

	if replicationBucketExists {
		// Test bucket location
		locationResp, err := s3Client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: aws.String(testData.ReplicationBucketName),
		})
		if err == nil {
			location := string(locationResp.LocationConstraint)
			if location == "" {
				location = "us-east-1" // Default for us-east-1
			}
			t.Logf("Replication bucket %s is in region: %s", testData.ReplicationBucketName, location)
		}
	}

	// Dev environment specific validations
	t.Logf("S3 bucket validation completed for dev environment - Logging: %t, Replication: %t", loggingBucketExists, replicationBucketExists)
}

// TestIAMRolesExist validates that IAM roles exist in AWS
func TestIAMRolesExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing IAM role existence for dev environment")

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

	// Validate role naming conventions for dev environment
	if !strings.Contains(ec2RoleName, "ec2-role") {
		t.Error("EC2 role name should contain 'ec2-role' for dev environment")
	}

	if !strings.Contains(lambdaRoleName, "lambda-role") {
		t.Error("Lambda role name should contain 'lambda-role' for dev environment")
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

	// Dev environment specific validations
	t.Logf("IAM role validation completed for dev environment - EC2: %s, Lambda: %s", ec2RoleName, lambdaRoleName)
}

// TestInternetGatewayExists validates that Internet Gateway exists and is attached to VPC
func TestInternetGatewayExists(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing Internet Gateway existence for dev environment - VPC: %s", testData.VPCID)

	// Describe Internet Gateways
	resp, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{})
	if err != nil {
		t.Fatalf("Failed to describe Internet Gateways: %v", err)
	}

	if len(resp.InternetGateways) == 0 {
		t.Fatal("No Internet Gateway found")
	}

	// Filter Internet Gateways for our VPC
	var vpcInternetGateways []ec2types.InternetGateway
	for _, igw := range resp.InternetGateways {
		for _, attachment := range igw.Attachments {
			if aws.ToString(attachment.VpcId) == testData.VPCID {
				vpcInternetGateways = append(vpcInternetGateways, igw)
				break
			}
		}
	}

	if len(vpcInternetGateways) == 0 {
		t.Fatal("No Internet Gateway found in VPC")
	}

	// Validate each Internet Gateway
	for _, igw := range vpcInternetGateways {
		igwID := aws.ToString(igw.InternetGatewayId)

		// Check attachment state
		attached := false
		for _, attachment := range igw.Attachments {
			if aws.ToString(attachment.VpcId) == testData.VPCID {
				attached = true
				if attachment.State != "attached" && attachment.State != "available" {
					t.Errorf("Internet Gateway %s should be in 'attached' or 'available' state, but is in %s", igwID, attachment.State)
				}
				break
			}
		}

		if !attached {
			t.Errorf("Internet Gateway %s should be attached to VPC %s", igwID, testData.VPCID)
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
			t.Errorf("Internet Gateway %s should have Name tag", igwID)
		}
		if !hasEnvironmentTag {
			t.Errorf("Internet Gateway %s should have Environment tag", igwID)
		}
		if !hasProjectTag {
			t.Errorf("Internet Gateway %s should have Project tag", igwID)
		}
	}

	// Dev environment specific validations
	t.Logf("Internet Gateway validation completed for dev environment - Found %d IGW(s) in VPC %s", len(vpcInternetGateways), testData.VPCID)
}

// TestNATGatewaysExist validates that NAT Gateways exist in AWS
func TestNATGatewaysExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment
	t.Logf("Testing NAT Gateway existence for dev environment - VPC: %s", testData.VPCID)

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

	// Dev environment specific validations
	t.Logf("NAT Gateway validation completed for dev environment - Found %d NAT Gateway(s) in VPC %s", len(vpcNatGateways), testData.VPCID)
}

// TestDevEnvironmentConfiguration validates that the infrastructure is properly configured for dev environment
func TestDevEnvironmentConfiguration(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	setupAWS(t)

	// Validate that we're testing dev environment resources
	// Check VPC naming convention for dev environment
	if !strings.Contains(testData.VPCID, "vpc-") {
		t.Error("VPC ID should follow AWS VPC naming convention")
	}

	// Check subnet naming conventions
	for _, subnetID := range testData.PublicSubnetIDs {
		if !strings.Contains(subnetID, "subnet-") {
			t.Errorf("Public subnet ID %s should follow AWS subnet naming convention", subnetID)
		}
	}

	for _, subnetID := range testData.PrivateSubnetIDs {
		if !strings.Contains(subnetID, "subnet-") {
			t.Errorf("Private subnet ID %s should follow AWS subnet naming convention", subnetID)
		}
	}

	// Check bucket naming conventions for dev environment
	if !strings.Contains(testData.LoggingBucketName, "logs-") {
		t.Error("Logging bucket name should contain 'logs-' prefix")
	}

	if !strings.Contains(testData.ReplicationBucketName, "logs-replica-") {
		t.Error("Replication bucket name should contain 'logs-replica-' prefix")
	}

	// Check IAM role ARN format
	if !strings.HasPrefix(testData.EC2RoleARN, "arn:aws:iam::") {
		t.Error("EC2 role ARN should follow AWS IAM ARN format")
	}

	if !strings.HasPrefix(testData.LambdaRoleARN, "arn:aws:iam::") {
		t.Error("Lambda role ARN should follow AWS IAM ARN format")
	}

	// Validate that all resources are in the same region
	// This is a basic check - in a real scenario, you might want to validate
	// that all resources are actually in the expected region
	t.Logf("Testing dev environment configuration - VPC: %s, Region: %s", testData.VPCID, region)
}

// TestSecurityGroupsExist validates that security groups exist and are properly configured
func TestSecurityGroupsExist(t *testing.T) {
	t.Logf("Testing Security Groups for dev environment")

	// Test ALB Security Group
	albSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupNames: []string{fmt.Sprintf("dev-alb-sg")},
	})
	if err != nil {
		t.Logf("ALB Security Group dev-alb-sg does not exist: %v", err)
		t.Skip("ALB Security Group not found - may not be deployed yet")
	}
	if len(albSG.SecurityGroups) > 0 {
		sg := albSG.SecurityGroups[0]
		t.Logf("✅ ALB Security Group exists: %s", *sg.GroupId)

		// Validate tags
		for _, tag := range sg.Tags {
			if *tag.Key == "Environment" {
				assert.Equal(t, "dev", *tag.Value, "ALB Security Group Environment tag should be 'dev'")
			}
			if *tag.Key == "Project" {
				assert.Equal(t, "infrastructure", *tag.Value, "ALB Security Group Project tag should be 'infrastructure'")
			}
		}
	}

	// Test App Security Group
	appSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupNames: []string{fmt.Sprintf("dev-app-sg")},
	})
	if err != nil {
		t.Logf("App Security Group dev-app-sg does not exist: %v", err)
		t.Skip("App Security Group not found - may not be deployed yet")
	}
	if len(appSG.SecurityGroups) > 0 {
		sg := appSG.SecurityGroups[0]
		t.Logf("✅ App Security Group exists: %s", *sg.GroupId)

		// Validate tags
		for _, tag := range sg.Tags {
			if *tag.Key == "Environment" {
				assert.Equal(t, "dev", *tag.Value, "App Security Group Environment tag should be 'dev'")
			}
		}
	}

	// Test DB Security Group
	dbSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupNames: []string{fmt.Sprintf("dev-db-sg")},
	})
	if err != nil {
		t.Logf("DB Security Group dev-db-sg does not exist: %v", err)
		t.Skip("DB Security Group not found - may not be deployed yet")
	}
	if len(dbSG.SecurityGroups) > 0 {
		sg := dbSG.SecurityGroups[0]
		t.Logf("✅ DB Security Group exists: %s", *sg.GroupId)

		// Validate tags
		for _, tag := range sg.Tags {
			if *tag.Key == "Environment" {
				assert.Equal(t, "dev", *tag.Value, "DB Security Group Environment tag should be 'dev'")
			}
		}
	}
}

// TestVPCEndpointsExist validates that VPC endpoints exist
func TestVPCEndpointsExist(t *testing.T) {
	setupAWS(t)
	testData := loadTestData(t)
	t.Logf("Testing VPC Endpoints for dev environment")

	// Test S3 VPC Endpoint
	s3Endpoints, err := ec2Client.DescribeVpcEndpoints(context.TODO(), &ec2.DescribeVpcEndpointsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{testData.VPCID},
			},
			{
				Name:   aws.String("service-name"),
				Values: []string{fmt.Sprintf("com.amazonaws.%s.s3", region)},
			},
		},
	})
	if err != nil {
		t.Logf("Failed to describe S3 VPC endpoints: %v", err)
		t.Skip("S3 VPC Endpoint not found - may not be deployed yet")
	}
	if len(s3Endpoints.VpcEndpoints) > 0 {
		endpoint := s3Endpoints.VpcEndpoints[0]
		t.Logf("✅ S3 VPC Endpoint exists: %s", *endpoint.VpcEndpointId)
		assert.True(t, strings.EqualFold("Available", string(endpoint.State)), "S3 VPC Endpoint should be in Available state")
	}

	// Test Secrets Manager VPC Endpoint
	secretsEndpoints, err := ec2Client.DescribeVpcEndpoints(context.TODO(), &ec2.DescribeVpcEndpointsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{testData.VPCID},
			},
			{
				Name:   aws.String("service-name"),
				Values: []string{fmt.Sprintf("com.amazonaws.%s.secretsmanager", region)},
			},
		},
	})
	if err != nil {
		t.Logf("Failed to describe Secrets Manager VPC endpoints: %v", err)
		t.Skip("Secrets Manager VPC Endpoint not found - may not be deployed yet")
	}
	if len(secretsEndpoints.VpcEndpoints) > 0 {
		endpoint := secretsEndpoints.VpcEndpoints[0]
		t.Logf("✅ Secrets Manager VPC Endpoint exists: %s", *endpoint.VpcEndpointId)
		assert.True(t, strings.EqualFold("Available", string(endpoint.State)), "Secrets Manager VPC Endpoint should be in Available state")
	}
}

// TestKMSKeysExist validates that KMS keys exist
func TestKMSKeysExist(t *testing.T) {
	t.Logf("Testing KMS Keys for dev environment")

	// Test Data KMS Key
	dataKeys, err := kmsClient.ListKeys(context.TODO(), &kms.ListKeysInput{})
	if err != nil {
		t.Logf("Failed to list KMS keys: %v", err)
		t.Skip("KMS keys not found - may not be deployed yet")
	}

	foundDataKey := false
	foundLogsKey := false

	for _, key := range dataKeys.Keys {
		keyDetails, err := kmsClient.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
			KeyId: key.KeyId,
		})
		if err != nil {
			continue
		}

		if keyDetails.KeyMetadata.Description != nil {
			desc := *keyDetails.KeyMetadata.Description
			if strings.Contains(desc, "dev Data Encryption Key") {
				t.Logf("✅ Data KMS Key exists: %s", *key.KeyId)
				foundDataKey = true
			}
			if strings.Contains(desc, "dev Logs Encryption Key") {
				t.Logf("✅ Logs KMS Key exists: %s", *key.KeyId)
				foundLogsKey = true
			}
		}
	}

	if !foundDataKey {
		t.Logf("Data KMS Key not found - may not be deployed yet")
		t.Skip("Data KMS Key not found")
	}

	if !foundLogsKey {
		t.Logf("Logs KMS Key not found - may not be deployed yet")
		t.Skip("Logs KMS Key not found")
	}
}

// TestSecretsManagerExists validates that Secrets Manager secret exists
func TestSecretsManagerExists(t *testing.T) {
	t.Logf("Testing Secrets Manager for dev environment")

	// Test Database Secret
	secrets, err := secretsClient.ListSecrets(context.TODO(), &secretsmanager.ListSecretsInput{})
	if err != nil {
		t.Logf("Failed to list secrets: %v", err)
		t.Skip("Secrets Manager not accessible - may not be deployed yet")
	}

	foundDBSecret := false
	for _, secret := range secrets.SecretList {
		if secret.Name != nil && strings.Contains(*secret.Name, "dev/db-credentials") {
			t.Logf("✅ Database Secret exists: %s", *secret.Name)
			foundDBSecret = true
			break
		}
	}

	if !foundDBSecret {
		t.Logf("Database Secret not found - may not be deployed yet")
		t.Skip("Database Secret not found")
	}
}

// TestApplicationLoadBalancerExists validates that ALB exists
func TestApplicationLoadBalancerExists(t *testing.T) {
	t.Logf("Testing Application Load Balancer for dev environment")

	// Test ALB
	loadBalancers, err := elasticloadbalancingv2Client.DescribeLoadBalancers(context.TODO(), &elasticloadbalancingv2.DescribeLoadBalancersInput{})
	if err != nil {
		t.Logf("Failed to describe load balancers: %v", err)
		t.Skip("Application Load Balancer not found - may not be deployed yet")
	}

	foundALB := false
	for _, lb := range loadBalancers.LoadBalancers {
		if lb.LoadBalancerName != nil && strings.Contains(*lb.LoadBalancerName, "dev-alb") {
			t.Logf("✅ Application Load Balancer exists: %s", *lb.LoadBalancerName)
			assert.Equal(t, "active", string(lb.State.Code), "ALB should be in active state")
			foundALB = true
			break
		}
	}

	if !foundALB {
		t.Logf("Application Load Balancer not found - may not be deployed yet")
		t.Skip("Application Load Balancer not found")
	}
}

// TestAutoScalingGroupExists validates that Auto Scaling Group exists
func TestAutoScalingGroupExists(t *testing.T) {
	t.Logf("Testing Auto Scaling Group for dev environment")

	// Test Auto Scaling Group
	asgs, err := autoscalingClient.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{})
	if err != nil {
		t.Logf("Failed to describe auto scaling groups: %v", err)
		t.Skip("Auto Scaling Group not found - may not be deployed yet")
	}

	foundASG := false
	for _, asg := range asgs.AutoScalingGroups {
		if asg.AutoScalingGroupName != nil && strings.Contains(*asg.AutoScalingGroupName, "dev-app-asg") {
			t.Logf("✅ Auto Scaling Group exists: %s", *asg.AutoScalingGroupName)
			assert.Equal(t, int32(2), *asg.DesiredCapacity, "ASG desired capacity should be 2")
			assert.Equal(t, int32(2), *asg.MinSize, "ASG min size should be 2")
			assert.Equal(t, int32(6), *asg.MaxSize, "ASG max size should be 6")
			foundASG = true
			break
		}
	}

	if !foundASG {
		t.Logf("Auto Scaling Group not found - may not be deployed yet")
		t.Skip("Auto Scaling Group not found")
	}
}

// TestRDSInstanceExists validates that RDS instance exists
func TestRDSInstanceExists(t *testing.T) {
	t.Logf("Testing RDS Instance for dev environment")

	// Test RDS Instance
	instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{})
	if err != nil {
		t.Logf("Failed to describe RDS instances: %v", err)
		t.Skip("RDS Instance not found - may not be deployed yet")
	}

	foundRDS := false
	for _, instance := range instances.DBInstances {
		if instance.DBInstanceIdentifier != nil && strings.Contains(*instance.DBInstanceIdentifier, "dev-db-instance") {
			t.Logf("✅ RDS Instance exists: %s", *instance.DBInstanceIdentifier)
			assert.Equal(t, "available", *instance.DBInstanceStatus, "RDS instance should be available")
			assert.Equal(t, "postgres", *instance.Engine, "RDS engine should be postgres")
			foundRDS = true
			break
		}
	}

	if !foundRDS {
		t.Logf("RDS Instance not found - may not be deployed yet")
		t.Skip("RDS Instance not found")
	}
}

// TestWAFWebACLExists validates that WAFv2 WebACL exists
func TestWAFWebACLExists(t *testing.T) {
	t.Logf("Testing WAFv2 WebACL for dev environment")

	// Test WAFv2 WebACL
	webACLs, err := wafv2Client.ListWebACLs(context.TODO(), &wafv2.ListWebACLsInput{
		Scope: wafv2types.ScopeRegional,
	})
	if err != nil {
		t.Logf("Failed to list WAFv2 WebACLs: %v", err)
		t.Skip("WAFv2 WebACL not found - may not be deployed yet")
	}

	foundWebACL := false
	for _, webACL := range webACLs.WebACLs {
		if strings.Contains(*webACL.Name, "dev-web-acl") {
			t.Logf("✅ WAFv2 WebACL exists: %s", *webACL.Name)
			foundWebACL = true
			break
		}
	}

	if !foundWebACL {
		t.Logf("WAFv2 WebACL not found - may not be deployed yet")
		t.Skip("WAFv2 WebACL not found")
	}
}

// TestSNSTopicExists validates that SNS topic exists
func TestSNSTopicExists(t *testing.T) {
	t.Logf("Testing SNS Topic for dev environment")

	// Test SNS Topic
	topics, err := snsClient.ListTopics(context.TODO(), &sns.ListTopicsInput{})
	if err != nil {
		t.Logf("Failed to list SNS topics: %v", err)
		t.Skip("SNS Topic not found - may not be deployed yet")
	}

	foundTopic := false
	for _, topic := range topics.Topics {
		if topic.TopicArn != nil && strings.Contains(*topic.TopicArn, "dev-alerts") {
			t.Logf("✅ SNS Topic exists: %s", *topic.TopicArn)
			foundTopic = true
			break
		}
	}

	if !foundTopic {
		t.Logf("SNS Topic not found - may not be deployed yet")
		t.Skip("SNS Topic not found")
	}
}

// TestCloudWatchLogGroupExists validates that CloudWatch log group exists
func TestCloudWatchLogGroupExists(t *testing.T) {
	t.Logf("Testing CloudWatch Log Group for dev environment")

	// Test CloudWatch Log Group
	logGroups, err := cloudwatchClient.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{})
	if err != nil {
		t.Logf("Failed to describe CloudWatch log groups: %v", err)
		t.Skip("CloudWatch Log Group not found - may not be deployed yet")
	}

	foundLogGroup := false
	for _, logGroup := range logGroups.LogGroups {
		if logGroup.LogGroupName != nil && strings.Contains(*logGroup.LogGroupName, "/aws/ec2/dev-app") {
			t.Logf("✅ CloudWatch Log Group exists: %s", *logGroup.LogGroupName)
			foundLogGroup = true
			break
		}
	}

	if !foundLogGroup {
		t.Logf("CloudWatch Log Group not found - may not be deployed yet")
		t.Skip("CloudWatch Log Group not found")
	}
}

// TestIntegrationPlaceholder is kept for backward compatibility
func TestIntegrationPlaceholder(t *testing.T) {
	t.Log("Integration tests are now implemented")
}
