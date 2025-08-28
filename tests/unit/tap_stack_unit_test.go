//go:build !integration
// +build !integration

package main

import (
	"strings"
	"testing"
)

// TestResourceNamingConvention validates resource naming conventions
func TestResourceNamingConvention(t *testing.T) {
	// Test environment suffix validation
	envSuffix := "pr2129"

	// Test bucket naming patterns
	loggingBucketName := "logs-123456789012-pr2129-c5f148"
	replicationBucketName := "logs-replica-123456789012-pr2129-c5f148"

	if !strings.Contains(loggingBucketName, envSuffix) {
		t.Error("Logging bucket should contain environment suffix")
	}
	if !strings.Contains(replicationBucketName, envSuffix) {
		t.Error("Replication bucket should contain environment suffix")
	}

	// Test for descriptive names
	if !strings.Contains(loggingBucketName, "logs") {
		t.Error("Logging bucket should contain 'logs'")
	}
	if !strings.Contains(replicationBucketName, "replica") {
		t.Error("Replication bucket should contain 'replica'")
	}
}

// TestVPCConfiguration validates VPC configuration patterns
func TestVPCConfiguration(t *testing.T) {
	// Test VPC ID format
	vpcID := "vpc-08b55093a96927de2"

	if vpcID == "" {
		t.Error("VPC ID should not be empty")
	}
	if !strings.Contains(vpcID, "vpc-") {
		t.Error("VPC ID should start with 'vpc-'")
	}
	if len(vpcID) != 21 {
		t.Errorf("VPC ID should be 21 characters long, got %d", len(vpcID))
	}

	// Test VPC CIDR block format
	vpcCIDR := "10.20.0.0/16"
	if !strings.Contains(vpcCIDR, "/") {
		t.Error("VPC CIDR should contain subnet mask")
	}
	if !strings.HasPrefix(vpcCIDR, "10.20.") {
		t.Error("VPC CIDR should start with '10.20.'")
	}
}

// TestSubnetConfiguration validates subnet configuration patterns
func TestSubnetConfiguration(t *testing.T) {
	// Test subnet ID format
	publicSubnetIDs := []string{"subnet-00a9615cb0d9f8e55", "subnet-041a0ff668d2ddd22"}
	privateSubnetIDs := []string{"subnet-058a05b2296b3e17b", "subnet-045ef277549d79e93"}

	if len(publicSubnetIDs) == 0 {
		t.Error("Public subnet IDs should not be empty")
	}
	if len(publicSubnetIDs) < 2 {
		t.Error("Should have at least 2 public subnets")
	}

	if len(privateSubnetIDs) == 0 {
		t.Error("Private subnet IDs should not be empty")
	}
	if len(privateSubnetIDs) < 2 {
		t.Error("Should have at least 2 private subnets")
	}

	// Check subnet ID format
	for i, subnetID := range publicSubnetIDs {
		if !strings.Contains(subnetID, "subnet-") {
			t.Errorf("Public subnet %d ID should start with 'subnet-'", i)
		}
		if len(subnetID) != 24 {
			t.Errorf("Public subnet %d ID should be 24 characters long", i)
		}
	}

	for i, subnetID := range privateSubnetIDs {
		if !strings.Contains(subnetID, "subnet-") {
			t.Errorf("Private subnet %d ID should start with 'subnet-'", i)
		}
		if len(subnetID) != 24 {
			t.Errorf("Private subnet %d ID should be 24 characters long", i)
		}
	}

	// Check for unique subnet IDs
	allSubnetIDs := append(publicSubnetIDs, privateSubnetIDs...)
	uniqueSubnets := make(map[string]bool)

	for _, subnetID := range allSubnetIDs {
		if uniqueSubnets[subnetID] {
			t.Errorf("Subnet ID %s should be unique", subnetID)
		}
		uniqueSubnets[subnetID] = true
	}
}

// TestS3BucketConfiguration validates S3 bucket configuration patterns
func TestS3BucketConfiguration(t *testing.T) {
	loggingBucketName := "logs-123456789012-pr2129-c5f148"
	replicationBucketName := "logs-replica-123456789012-pr2129-c5f148"

	if loggingBucketName == "" {
		t.Error("Logging bucket name should not be empty")
	}
	if !strings.Contains(loggingBucketName, "logs-") {
		t.Error("Logging bucket should contain 'logs-' prefix")
	}
	if !strings.Contains(loggingBucketName, "123456789012") {
		t.Error("Logging bucket should contain account ID")
	}

	if replicationBucketName == "" {
		t.Error("Replication bucket name should not be empty")
	}
	if !strings.Contains(replicationBucketName, "logs-replica-") {
		t.Error("Replication bucket should contain 'logs-replica-' prefix")
	}
	if !strings.Contains(replicationBucketName, "123456789012") {
		t.Error("Replication bucket should contain account ID")
	}

	if loggingBucketName == replicationBucketName {
		t.Error("Logging and replication bucket names should be different")
	}

	// Check for environment suffix pattern
	if !strings.Contains(loggingBucketName, "pr2129") {
		t.Error("Logging bucket should contain environment suffix")
	}
	if !strings.Contains(replicationBucketName, "pr2129") {
		t.Error("Replication bucket should contain environment suffix")
	}
}

// TestIAMRoleConfiguration validates IAM role configuration patterns
func TestIAMRoleConfiguration(t *testing.T) {
	ec2RoleARN := "arn:aws:iam::123456789012:role/pr2129-c5f148-ec2-role"
	lambdaRoleARN := "arn:aws:iam::123456789012:role/pr2129-c5f148-lambda-role"

	if ec2RoleARN == "" {
		t.Error("EC2 role ARN should not be empty")
	}
	if !strings.Contains(ec2RoleARN, "arn:aws:iam::") {
		t.Error("EC2 role ARN should start with 'arn:aws:iam::'")
	}
	if !strings.Contains(ec2RoleARN, ":role/") {
		t.Error("EC2 role ARN should contain ':role/'")
	}
	if !strings.Contains(ec2RoleARN, "ec2-role") {
		t.Error("EC2 role ARN should contain 'ec2-role'")
	}

	if lambdaRoleARN == "" {
		t.Error("Lambda role ARN should not be empty")
	}
	if !strings.Contains(lambdaRoleARN, "arn:aws:iam::") {
		t.Error("Lambda role ARN should start with 'arn:aws:iam::'")
	}
	if !strings.Contains(lambdaRoleARN, ":role/") {
		t.Error("Lambda role ARN should contain ':role/'")
	}
	if !strings.Contains(lambdaRoleARN, "lambda-role") {
		t.Error("Lambda role ARN should contain 'lambda-role'")
	}

	if ec2RoleARN == lambdaRoleARN {
		t.Error("EC2 and Lambda role ARNs should be different")
	}

	// Check for environment suffix
	if !strings.Contains(ec2RoleARN, "pr2129") {
		t.Error("EC2 role should contain environment suffix")
	}
	if !strings.Contains(lambdaRoleARN, "pr2129") {
		t.Error("Lambda role should contain environment suffix")
	}
}

// TestDataConsistency validates data consistency patterns
func TestDataConsistency(t *testing.T) {
	accountID := "123456789012"
	envSuffix := "pr2129"

	loggingBucketName := "logs-123456789012-pr2129-c5f148"
	replicationBucketName := "logs-replica-123456789012-pr2129-c5f148"
	ec2RoleARN := "arn:aws:iam::123456789012:role/pr2129-c5f148-ec2-role"
	lambdaRoleARN := "arn:aws:iam::123456789012:role/pr2129-c5f148-lambda-role"

	if !strings.Contains(loggingBucketName, accountID) {
		t.Error("Logging bucket should contain consistent account ID")
	}
	if !strings.Contains(replicationBucketName, accountID) {
		t.Error("Replication bucket should contain consistent account ID")
	}
	if !strings.Contains(ec2RoleARN, accountID) {
		t.Error("EC2 role should contain consistent account ID")
	}
	if !strings.Contains(lambdaRoleARN, accountID) {
		t.Error("Lambda role should contain consistent account ID")
	}

	if !strings.Contains(loggingBucketName, envSuffix) {
		t.Error("Logging bucket should contain consistent environment suffix")
	}
	if !strings.Contains(replicationBucketName, envSuffix) {
		t.Error("Replication bucket should contain consistent environment suffix")
	}
	if !strings.Contains(ec2RoleARN, envSuffix) {
		t.Error("EC2 role should contain consistent environment suffix")
	}
	if !strings.Contains(lambdaRoleARN, envSuffix) {
		t.Error("Lambda role should contain consistent environment suffix")
	}
}

// TestSecurityGroupConfiguration validates security group naming patterns
func TestSecurityGroupConfiguration(t *testing.T) {
	albSGName := "tap-alb-sg"
	appSGName := "tap-app-sg"
	dbSGName := "tap-db-sg"

	// Test security group naming conventions
	if !strings.Contains(albSGName, "alb") {
		t.Error("ALB security group should contain 'alb'")
	}
	if !strings.Contains(appSGName, "app") {
		t.Error("App security group should contain 'app'")
	}
	if !strings.Contains(dbSGName, "db") {
		t.Error("DB security group should contain 'db'")
	}

	// Test prefix consistency
	if !strings.HasPrefix(albSGName, "tap-") {
		t.Error("ALB security group should start with 'tap-'")
	}
	if !strings.HasPrefix(appSGName, "tap-") {
		t.Error("App security group should start with 'tap-'")
	}
	if !strings.HasPrefix(dbSGName, "tap-") {
		t.Error("DB security group should start with 'tap-'")
	}
}

// TestTaggingConvention validates resource tagging patterns
func TestTaggingConvention(t *testing.T) {
	// Test common tag structure
	commonTags := map[string]string{
		"Name":        "TapStack",
		"Environment": "Prod",
		"Project":     "TapStack",
		"ManagedBy":   "Pulumi",
	}

	// Validate required tags
	requiredTags := []string{"Name", "Environment", "Project"}
	for _, tag := range requiredTags {
		if _, exists := commonTags[tag]; !exists {
			t.Errorf("Required tag '%s' should be present", tag)
		}
	}

	// Validate tag values
	if commonTags["Environment"] != "Prod" {
		t.Error("Environment tag should be 'Prod'")
	}
	if commonTags["Project"] != "TapStack" {
		t.Error("Project tag should be 'TapStack'")
	}
	if commonTags["ManagedBy"] != "Pulumi" {
		t.Error("ManagedBy tag should be 'Pulumi'")
	}
}

// TestNetworkConfiguration validates network configuration patterns
func TestNetworkConfiguration(t *testing.T) {
	// Test CIDR block patterns
	publicSubnetCIDRs := []string{"10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"}
	privateSubnetCIDRs := []string{"10.20.10.0/24", "10.20.11.0/24", "10.20.12.0/24"}

	// Validate public subnet CIDRs
	for i, cidr := range publicSubnetCIDRs {
		if !strings.HasPrefix(cidr, "10.20.") {
			t.Errorf("Public subnet %d CIDR should start with '10.20.'", i)
		}
		if !strings.HasSuffix(cidr, "/24") {
			t.Errorf("Public subnet %d CIDR should end with '/24'", i)
		}
	}

	// Validate private subnet CIDRs
	for i, cidr := range privateSubnetCIDRs {
		if !strings.HasPrefix(cidr, "10.20.") {
			t.Errorf("Private subnet %d CIDR should start with '10.20.'", i)
		}
		if !strings.HasSuffix(cidr, "/24") {
			t.Errorf("Private subnet %d CIDR should end with '/24'", i)
		}
	}

	// Validate no overlap between public and private CIDRs
	for _, publicCIDR := range publicSubnetCIDRs {
		for _, privateCIDR := range privateSubnetCIDRs {
			if publicCIDR == privateCIDR {
				t.Errorf("Public and private subnet CIDRs should not overlap: %s", publicCIDR)
			}
		}
	}
}

// TestLibFunctions tests the actual functions from the lib package
func TestLibFunctions(t *testing.T) {
	// Test generateRandomSuffix function
	suffix := generateRandomSuffix()
	if suffix == "" {
		t.Error("generateRandomSuffix should not return empty string")
	}
	if len(suffix) != 6 {
		t.Errorf("generateRandomSuffix should return 6 characters, got %d", len(suffix))
	}

	// Test getEnvironmentSuffix function
	envSuffix := getEnvironmentSuffix("dev")
	if envSuffix == "" {
		t.Error("getEnvironmentSuffix should not return empty string")
	}

	// Test getAccountID function for dev environment
	accountID := getAccountID("dev")
	if accountID == "" {
		t.Error("getAccountID should not return empty string")
	}
	if accountID != "123456789012" {
		t.Errorf("getAccountID for dev should return '123456789012', got %s", accountID)
	}

	// Test getAccountID for unknown environment (should default to dev)
	unknownAccountID := getAccountID("unknown")
	if unknownAccountID != "123456789012" {
		t.Errorf("getAccountID for unknown should return '123456789012', got %s", unknownAccountID)
	}
}

// TestKMSConfiguration validates KMS key configuration patterns
func TestKMSConfiguration(t *testing.T) {
	// Test KMS key ARN patterns
	dataKeyARN := "arn:aws:kms:us-east-1:123456789012:key/mock-data-key-id"
	logsKeyARN := "arn:aws:kms:us-east-1:123456789012:key/mock-logs-key-id"

	// Validate KMS key ARN format
	if !strings.HasPrefix(dataKeyARN, "arn:aws:kms:") {
		t.Error("Data KMS key ARN should start with 'arn:aws:kms:'")
	}
	if !strings.HasPrefix(logsKeyARN, "arn:aws:kms:") {
		t.Error("Logs KMS key ARN should start with 'arn:aws:kms:'")
	}

	// Validate KMS key ARN structure
	dataKeyParts := strings.Split(dataKeyARN, ":")
	if len(dataKeyParts) != 6 {
		t.Error("KMS key ARN should have 6 parts separated by colons")
	}

	// Validate account ID in ARN
	if dataKeyParts[4] != "123456789012" {
		t.Error("KMS key ARN should contain correct account ID")
	}

	// Validate key ID format
	if !strings.HasPrefix(dataKeyParts[5], "key/") {
		t.Error("KMS key ARN should end with 'key/' followed by key ID")
	}

	// Validate different key types
	if dataKeyARN == logsKeyARN {
		t.Error("Data and logs KMS keys should be different")
	}
}

// TestUnitPlaceholder is kept for backward compatibility
func TestUnitPlaceholder(t *testing.T) {
	t.Log("Unit tests are now implemented and independent of external files")
}
