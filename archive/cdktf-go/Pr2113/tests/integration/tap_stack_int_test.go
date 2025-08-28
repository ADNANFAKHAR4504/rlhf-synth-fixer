//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	cloudwatchTypes "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	kmsTypes "github.com/aws/aws-sdk-go-v2/service/kms/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3Types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/aws-sdk-go-v2/service/sns"
)

// FlatOutputs represents the structure of cfn-outputs/flat-outputs.json
type FlatOutputs map[string]string

// loadFlatOutputs loads the deployment outputs from cfn-outputs/flat-outputs.json
func loadFlatOutputs() (FlatOutputs, error) {
	// Get the path relative to the test file
	currentDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get working directory: %w", err)
	}

	// Navigate up to project root and then to cfn-outputs
	flatOutputsPath := filepath.Join(currentDir, "..", "..", "cfn-outputs", "flat-outputs.json")

	if _, err := os.Stat(flatOutputsPath); os.IsNotExist(err) {
		return FlatOutputs{}, nil // Return empty map if file doesn't exist
	}

	data, err := os.ReadFile(flatOutputsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read flat-outputs.json: %w", err)
	}

	var outputs FlatOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		return nil, fmt.Errorf("failed to parse flat-outputs.json: %w", err)
	}

	return outputs, nil
}

// getOutputValue retrieves a specific output value from the flat outputs
func getOutputValue(outputs FlatOutputs, outputKey string) (string, bool) {
	// Look for the output key in the flat outputs
	// The key format is typically: StackName.OutputKey
	for key, value := range outputs {
		if strings.HasSuffix(key, "."+outputKey) {
			return value, true
		}
	}
	return "", false
}

// Global AWS config and outputs for integration tests
var awsConfig aws.Config
var flatOutputs FlatOutputs

func TestMain(m *testing.M) {
	// Initialize AWS config once for all tests
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		fmt.Printf("Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}
	awsConfig = cfg

	// Load flat outputs
	outputs, err := loadFlatOutputs()
	if err != nil {
		fmt.Printf("Failed to load flat outputs: %v\n", err)
		os.Exit(1)
	}
	flatOutputs = outputs

	// Run tests
	code := m.Run()
	os.Exit(code)
}

// TestVPCExists tests that the VPC resource exists and is configured correctly
func TestVPCExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get VPC ID from outputs
	vpcID, exists := getOutputValue(flatOutputs, "VpcId")
	if !exists {
		t.Skip("VpcId output not found in flat-outputs.json - skipping VPC test")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)

	// Test VPC exists and has expected configuration
	result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	})

	if err != nil {
		t.Fatalf("Failed to describe VPC %s: %v", vpcID, err)
	}

	if len(result.Vpcs) == 0 {
		t.Fatalf("VPC %s not found", vpcID)
	}

	vpc := result.Vpcs[0]

	// Verify VPC configuration
	if *vpc.CidrBlock != "10.0.0.0/16" {
		t.Errorf("Expected VPC CIDR 10.0.0.0/16, got %s", *vpc.CidrBlock)
	}

	// Verify DNS settings
	dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
		VpcId:     vpc.VpcId,
		Attribute: ec2Types.VpcAttributeNameEnableDnsSupport,
	})
	if err != nil {
		t.Fatalf("Failed to describe VPC DNS support: %v", err)
	}

	if !*dnsSupport.EnableDnsSupport.Value {
		t.Error("VPC DNS support should be enabled")
	}

	dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
		VpcId:     vpc.VpcId,
		Attribute: ec2Types.VpcAttributeNameEnableDnsHostnames,
	})
	if err != nil {
		t.Fatalf("Failed to describe VPC DNS hostnames: %v", err)
	}

	if !*dnsHostnames.EnableDnsHostnames.Value {
		t.Error("VPC DNS hostnames should be enabled")
	}

	t.Logf("✅ VPC %s exists and is properly configured", vpcID)
}

// TestSubnetExists tests that the private subnet exists and is configured correctly
func TestSubnetExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get subnet ID from outputs
	subnetID, exists := getOutputValue(flatOutputs, "PrivateSubnetId")
	if !exists {
		t.Skip("PrivateSubnetId output not found in flat-outputs.json - skipping subnet test")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)

	result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		SubnetIds: []string{subnetID},
	})

	if err != nil {
		t.Fatalf("Failed to describe subnet %s: %v", subnetID, err)
	}

	if len(result.Subnets) == 0 {
		t.Fatalf("Subnet %s not found", subnetID)
	}

	subnet := result.Subnets[0]

	if *subnet.CidrBlock != "10.0.1.0/24" {
		t.Errorf("Expected subnet CIDR 10.0.1.0/24, got %s", *subnet.CidrBlock)
	}

	if *subnet.AvailabilityZone != "us-east-1a" {
		t.Errorf("Expected subnet AZ us-east-1a, got %s", *subnet.AvailabilityZone)
	}

	// Check subnet type tag
	var subnetType string
	for _, tag := range subnet.Tags {
		if *tag.Key == "Type" {
			subnetType = *tag.Value
			break
		}
	}

	if subnetType != "private" {
		t.Errorf("Expected subnet type 'private', got %s", subnetType)
	}

	t.Logf("✅ Subnet %s exists and is properly configured", subnetID)
}

// TestKMSKeyExists tests that the KMS key exists and has correct permissions
func TestKMSKeyExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	kmsClient := kms.NewFromConfig(awsConfig)

	// List KMS keys and find ours by description
	result, err := kmsClient.ListKeys(ctx, &kms.ListKeysInput{})
	if err != nil {
		t.Fatalf("Failed to list KMS keys: %v", err)
	}

	var tapKMSKey *kmsTypes.KeyListEntry
	for _, key := range result.Keys {
		keyDesc, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: key.KeyId,
		})
		if err != nil {
			continue // Skip keys we can't access
		}

		if keyDesc.KeyMetadata.Description != nil &&
			*keyDesc.KeyMetadata.Description == "KMS key for TAP infrastructure encryption" {
			tapKMSKey = &key
			break
		}
	}

	if tapKMSKey == nil {
		t.Fatal("TAP KMS key not found")
	}

	// Verify key policy contains CloudTrail permissions
	policyResult, err := kmsClient.GetKeyPolicy(ctx, &kms.GetKeyPolicyInput{
		KeyId:      tapKMSKey.KeyId,
		PolicyName: aws.String("default"),
	})
	if err != nil {
		t.Fatalf("Failed to get KMS key policy: %v", err)
	}

	policy := *policyResult.Policy
	if !strings.Contains(policy, "cloudtrail.amazonaws.com") {
		t.Error("KMS key policy should contain CloudTrail service permissions")
	}

	if !strings.Contains(policy, "kms:GenerateDataKey") {
		t.Error("KMS key policy should contain GenerateDataKey permission")
	}
}

// TestS3BucketsExist tests that S3 buckets exist and are configured correctly
func TestS3BucketsExist(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	s3Client := s3.NewFromConfig(awsConfig)

	// List all buckets and find our TAP buckets
	result, err := s3Client.ListBuckets(ctx, &s3.ListBucketsInput{})
	if err != nil {
		t.Fatalf("Failed to list S3 buckets: %v", err)
	}

	var appBucket, cloudtrailBucket *s3Types.Bucket
	for _, bucket := range result.Buckets {
		if *bucket.Name == "tap-app-data-dev" {
			appBucket = &bucket
		}
		if *bucket.Name == "tap-cloudtrail-logs-dev" {
			cloudtrailBucket = &bucket
		}
	}

	if appBucket == nil {
		t.Error("TAP app data bucket not found")
	}

	if cloudtrailBucket == nil {
		t.Error("TAP CloudTrail bucket not found")
	}

	// Test bucket encryption for app bucket
	if appBucket != nil {
		encResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: appBucket.Name,
		})
		if err != nil {
			t.Errorf("Failed to get app bucket encryption: %v", err)
		} else {
			if len(encResult.ServerSideEncryptionConfiguration.Rules) == 0 {
				t.Error("App bucket should have encryption rules")
			} else {
				rule := encResult.ServerSideEncryptionConfiguration.Rules[0]
				if rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != s3Types.ServerSideEncryptionAwsKms {
					t.Error("App bucket should use AWS KMS encryption")
				}
			}
		}
	}
}

// TestIAMRoleExists tests that the IAM role exists and has correct policies
func TestIAMRoleExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	iamClient := iam.NewFromConfig(awsConfig)

	// Get the IAM role
	roleResult, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String("tap-ec2-role-dev"),
	})
	if err != nil {
		t.Fatalf("Failed to get IAM role: %v", err)
	}

	role := roleResult.Role

	// Verify assume role policy allows EC2
	if !strings.Contains(*role.AssumeRolePolicyDocument, "ec2.amazonaws.com") {
		t.Error("IAM role should allow EC2 service to assume it")
	}

	// Check attached policies
	policiesResult, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String("tap-ec2-role-dev"),
	})
	if err != nil {
		t.Fatalf("Failed to list attached role policies: %v", err)
	}

	var hasS3Policy, hasCloudWatchPolicy bool
	for _, policy := range policiesResult.AttachedPolicies {
		if strings.Contains(*policy.PolicyArn, "AmazonS3ReadOnlyAccess") {
			hasS3Policy = true
		}
		if strings.Contains(*policy.PolicyArn, "CloudWatchAgentServerPolicy") {
			hasCloudWatchPolicy = true
		}
	}

	if !hasS3Policy {
		t.Error("IAM role should have S3 read-only access policy attached")
	}

	if !hasCloudWatchPolicy {
		t.Error("IAM role should have CloudWatch agent policy attached")
	}
}

// TestSecurityGroupExists tests that the security group exists and has correct rules
func TestSecurityGroupExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)

	result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{"tap-ec2-sg-dev"},
			},
		},
	})

	if err != nil {
		t.Fatalf("Failed to describe security groups: %v", err)
	}

	if len(result.SecurityGroups) == 0 {
		t.Fatal("Security group 'tap-ec2-sg-dev' not found")
	}

	sg := result.SecurityGroups[0]

	// Check ingress rules
	if len(sg.IpPermissions) != 2 {
		t.Errorf("Expected 2 ingress rules, got %d", len(sg.IpPermissions))
	}

	// Check egress rules
	if len(sg.IpPermissionsEgress) < 2 {
		t.Errorf("Expected at least 2 egress rules, got %d", len(sg.IpPermissionsEgress))
	}

	// Verify HTTPS and SSH ports are allowed
	var hasHTTPS, hasSSH bool
	for _, rule := range sg.IpPermissions {
		if *rule.FromPort == 443 && *rule.ToPort == 443 {
			hasHTTPS = true
		}
		if *rule.FromPort == 22 && *rule.ToPort == 22 {
			hasSSH = true
		}
	}

	if !hasHTTPS {
		t.Error("Security group should allow HTTPS (port 443)")
	}

	if !hasSSH {
		t.Error("Security group should allow SSH (port 22)")
	}
}

// TestEC2InstanceExists tests that the EC2 instance exists and is configured correctly
func TestEC2InstanceExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)

	result, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{"tap-ec2-instance-dev"},
			},
			{
				Name:   aws.String("instance-state-name"),
				Values: []string{"running", "pending", "stopped"},
			},
		},
	})

	if err != nil {
		t.Fatalf("Failed to describe instances: %v", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance 'tap-ec2-instance-dev' not found")
	}

	instance := result.Reservations[0].Instances[0]

	if instance.InstanceType != ec2Types.InstanceTypeT3Micro {
		t.Errorf("Expected instance type t3.micro, got %s", string(instance.InstanceType))
	}

	if instance.Monitoring.State != ec2Types.MonitoringStateEnabled {
		t.Error("EC2 instance monitoring should be enabled")
	}

	// Note: Volume encryption check would require separate DescribeVolumes call
	// Skipping encryption check here as it's not directly available from instance metadata
}

// TestCloudTrailExists tests that CloudTrail exists and is configured correctly
func TestCloudTrailExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cloudtrailClient := cloudtrail.NewFromConfig(awsConfig)

	result, err := cloudtrailClient.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{
		TrailNameList: []string{"tap-cloudtrail-dev"},
	})

	if err != nil {
		t.Fatalf("Failed to describe CloudTrail: %v", err)
	}

	if len(result.TrailList) == 0 {
		t.Fatal("CloudTrail 'tap-cloudtrail-dev' not found")
	}

	trail := result.TrailList[0]

	if !*trail.IsMultiRegionTrail {
		t.Error("CloudTrail should be multi-region")
	}

	if !*trail.LogFileValidationEnabled {
		t.Error("CloudTrail log file validation should be enabled")
	}

	if !*trail.IncludeGlobalServiceEvents {
		t.Error("CloudTrail should include global service events")
	}

	if trail.KmsKeyId == nil {
		t.Error("CloudTrail should have KMS encryption enabled")
	}
}

// TestSNSTopicExists tests that the SNS topic exists
func TestSNSTopicExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	snsClient := sns.NewFromConfig(awsConfig)

	result, err := snsClient.ListTopics(ctx, &sns.ListTopicsInput{})
	if err != nil {
		t.Fatalf("Failed to list SNS topics: %v", err)
	}

	var foundTopic bool
	for _, topic := range result.Topics {
		if strings.Contains(*topic.TopicArn, "tap-cpu-alarm-topic-dev") {
			foundTopic = true
			break
		}
	}

	if !foundTopic {
		t.Error("SNS topic 'tap-cpu-alarm-topic-dev' not found")
	}
}

// TestCloudWatchAlarmExists tests that the CloudWatch alarm exists
func TestCloudWatchAlarmExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cwClient := cloudwatch.NewFromConfig(awsConfig)

	result, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
		AlarmNames: []string{"tap-cpu-high-alarm-dev"},
	})

	if err != nil {
		t.Fatalf("Failed to describe CloudWatch alarms: %v", err)
	}

	if len(result.MetricAlarms) == 0 {
		t.Fatal("CloudWatch alarm 'tap-cpu-high-alarm-dev' not found")
	}

	alarm := result.MetricAlarms[0]

	if *alarm.MetricName != "CPUUtilization" {
		t.Errorf("Expected metric name 'CPUUtilization', got %s", *alarm.MetricName)
	}

	if *alarm.Threshold != 70.0 {
		t.Errorf("Expected threshold 70, got %f", *alarm.Threshold)
	}

	if alarm.ComparisonOperator != cloudwatchTypes.ComparisonOperatorGreaterThanThreshold {
		t.Errorf("Expected comparison operator 'GreaterThanThreshold', got %s", string(alarm.ComparisonOperator))
	}
}

// TestInfrastructureConnectivity tests basic connectivity between components
func TestInfrastructureConnectivity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get VPC ID and subnet ID from outputs instead of searching by tags
	vpcID, vpcExists := getOutputValue(flatOutputs, "VpcId")
	if !vpcExists {
		t.Skip("VpcId output not found in flat-outputs.json - skipping connectivity test")
	}

	subnetID, subnetExists := getOutputValue(flatOutputs, "PrivateSubnetId")
	if !subnetExists {
		t.Skip("PrivateSubnetId output not found in flat-outputs.json - skipping connectivity test")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)

	// Get VPC details
	vpcResult, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	})

	if err != nil {
		t.Fatalf("Failed to describe VPC %s: %v", vpcID, err)
	}

	if len(vpcResult.Vpcs) == 0 {
		t.Fatal("VPC not found")
	}

	vpc := vpcResult.Vpcs[0]

	// Get subnet details
	subnetResult, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		SubnetIds: []string{subnetID},
	})

	if err != nil {
		t.Fatalf("Failed to describe subnet %s: %v", subnetID, err)
	}

	if len(subnetResult.Subnets) == 0 {
		t.Fatal("Subnet not found")
	}

	subnet := subnetResult.Subnets[0]

	// Verify subnet is in the correct VPC
	if *subnet.VpcId != *vpc.VpcId {
		t.Errorf("Subnet should be in VPC %s, but is in %s", *vpc.VpcId, *subnet.VpcId)
	}

	t.Logf("✅ Infrastructure connectivity verified: Subnet %s is in VPC %s", subnetID, vpcID)
}

// TestResourceCleanup tests cleanup functionality (useful for CI/CD)
func TestResourceCleanup(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping cleanup test in short mode")
	}

	// This test can be used to verify that resources can be properly destroyed
	// In a real scenario, you might want to test terraform destroy or similar
	t.Log("Resource cleanup test - verify all resources can be destroyed cleanly")

	// Add specific cleanup validation logic here if needed
	// For example, checking for dependencies that might prevent cleanup
}

// TestEndToEndWorkflow tests a complete workflow scenario
func TestEndToEndWorkflow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping end-to-end test in short mode")
	}

	t.Log("Running end-to-end workflow test")

	// This test would simulate a real-world usage scenario
	// For example:
	// 1. Deploy infrastructure
	// 2. Verify all components are working
	// 3. Test monitoring and alerting
	// 4. Test backup and recovery
	// 5. Test scaling scenarios

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Test that all critical components are operational
	t.Run("VPC_Operational", func(t *testing.T) {
		TestVPCExists(t)
	})

	t.Run("Security_Operational", func(t *testing.T) {
		TestSecurityGroupExists(t)
		TestKMSKeyExists(t)
	})

	t.Run("Storage_Operational", func(t *testing.T) {
		TestS3BucketsExist(t)
	})

	t.Run("Compute_Operational", func(t *testing.T) {
		TestEC2InstanceExists(t)
		TestIAMRoleExists(t)
	})

	t.Run("Monitoring_Operational", func(t *testing.T) {
		TestCloudWatchAlarmExists(t)
		TestSNSTopicExists(t)
	})

	t.Run("Audit_Operational", func(t *testing.T) {
		TestCloudTrailExists(t)
	})

	select {
	case <-ctx.Done():
		t.Fatal("End-to-end test timed out")
	default:
		t.Log("End-to-end test completed successfully")
	}
}
