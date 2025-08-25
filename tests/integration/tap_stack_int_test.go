//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudtrail"
	"github.com/aws/aws-sdk-go/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/kms"
	// "github.com/aws/aws-sdk-go/service/rds"
	"github.com/aws/aws-sdk-go/service/s3"
)

// loadDeploymentOutputs loads the deployment outputs from flat-outputs.json
// loadDeploymentOutputs loads the deployment outputs from flat-outputs.json
func loadDeploymentOutputs(t *testing.T) map[string]string {
	t.Helper()

	outputsPath := "../cfn-outputs/flat-outputs.json"
	data, err := os.ReadFile(outputsPath)
	if err != nil {
		t.Fatalf("failed to read deployment outputs: %v", err)
	}

	// First try to parse as nested structure (CDKTF format)
	var nestedOutputs map[string]map[string]interface{}
	if err := json.Unmarshal(data, &nestedOutputs); err == nil {
		// Find the first stack and return its outputs, converting interface{} to string
		for stackName, stackOutputs := range nestedOutputs {
			t.Logf("Loading outputs from stack: %s", stackName)
			result := make(map[string]string)
			for key, value := range stackOutputs {
				// Convert interface{} to string
				switch v := value.(type) {
				case string:
					result[key] = v
				case float64:
					result[key] = fmt.Sprintf("%.0f", v)
				case int:
					result[key] = fmt.Sprintf("%d", v)
				case bool:
					result[key] = fmt.Sprintf("%t", v)
				default:
					// For complex types like arrays, convert to JSON string
					jsonBytes, _ := json.Marshal(v)
					result[key] = string(jsonBytes)
				}
			}
			return result
		}
	}

	// Fallback to flat structure
	var outputs map[string]string
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("failed to parse deployment outputs: %v", err)
	}

	return outputs
}

// createAWSSession creates an AWS session for testing
func createAWSSession(t *testing.T) *session.Session {
	t.Helper()

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"),
	})
	if err != nil {
		t.Fatalf("failed to create AWS session: %v", err)
	}

	return sess
}

func TestVPCExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe VPC
	result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(vpcID)},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	if len(result.Vpcs) == 0 {
		t.Fatal("VPC not found")
	}

	vpc := result.Vpcs[0]

	// Verify VPC configuration
	if *vpc.CidrBlock != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR 10.0.0.0/16, got %s", *vpc.CidrBlock)
	}

	// Check VPC tags
	foundNameTag := false
	foundEnvironmentTag := false
	for _, tag := range vpc.Tags {
		if *tag.Key == "Name" {
			foundNameTag = true
			t.Logf("Found VPC Name tag: %s", *tag.Value)
		}
		if *tag.Key == "Environment" && *tag.Value == "production" {
			foundEnvironmentTag = true
		}
	}

	if !foundNameTag {
		t.Error("VPC Name tag not found")
	}
	if !foundEnvironmentTag {
		t.Error("VPC Environment tag not found or incorrect")
	}
}

func TestSubnetsConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	// Parse subnet IDs from JSON arrays
	publicSubnetIDsStr := outputs["public_subnet_ids"]
	privateSubnetIDsStr := outputs["private_subnet_ids"]

	var publicSubnetIDs, privateSubnetIDs []string
	if err := json.Unmarshal([]byte(publicSubnetIDsStr), &publicSubnetIDs); err != nil {
		t.Fatalf("failed to parse public subnet IDs: %v", err)
	}
	if err := json.Unmarshal([]byte(privateSubnetIDsStr), &privateSubnetIDs); err != nil {
		t.Fatalf("failed to parse private subnet IDs: %v", err)
	}

	// Test public subnets
	for i, subnetID := range publicSubnetIDs {
		result, err := ec2Client.DescribeSubnets(&ec2.DescribeSubnetsInput{
			SubnetIds: []*string{aws.String(subnetID)},
		})
		if err != nil {
			t.Fatalf("failed to describe public subnet %d: %v", i+1, err)
		}

		subnet := result.Subnets[0]
		if !*subnet.MapPublicIpOnLaunch {
			t.Errorf("public subnet %d should map public IP on launch", i+1)
		}

		expectedCIDR := fmt.Sprintf("10.0.%d.0/24", i+1)
		if *subnet.CidrBlock != expectedCIDR {
			t.Errorf("public subnet %d expected CIDR %s, got %s", i+1, expectedCIDR, *subnet.CidrBlock)
		}
	}

	// Test private subnets
	for i, subnetID := range privateSubnetIDs {
		result, err := ec2Client.DescribeSubnets(&ec2.DescribeSubnetsInput{
			SubnetIds: []*string{aws.String(subnetID)},
		})
		if err != nil {
			t.Fatalf("failed to describe private subnet %d: %v", i+1, err)
		}

		subnet := result.Subnets[0]
		if *subnet.MapPublicIpOnLaunch {
			t.Errorf("private subnet %d should not map public IP on launch", i+1)
		}

		expectedCIDR := fmt.Sprintf("10.0.%d.0/24", i+10)
		if *subnet.CidrBlock != expectedCIDR {
			t.Errorf("private subnet %d expected CIDR %s, got %s", i+1, expectedCIDR, *subnet.CidrBlock)
		}
	}

	t.Logf("Found %d public subnets and %d private subnets", len(publicSubnetIDs), len(privateSubnetIDs))
}

func TestNetworkConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpc_id"]
	igwID := outputs["internet_gateway_id"]

	// Parse NAT Gateway IDs
	natGatewayIDsStr := outputs["nat_gateway_ids"]
	var natGatewayIDs []string
	if err := json.Unmarshal([]byte(natGatewayIDsStr), &natGatewayIDs); err != nil {
		t.Fatalf("failed to parse NAT gateway IDs: %v", err)
	}

	// Check Internet Gateway
	igwResult, err := ec2Client.DescribeInternetGateways(&ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []*string{aws.String(igwID)},
	})
	if err != nil {
		t.Fatalf("failed to describe internet gateway: %v", err)
	}

	igw := igwResult.InternetGateways[0]
	if len(igw.Attachments) == 0 || *igw.Attachments[0].VpcId != vpcID {
		t.Error("Internet Gateway not properly attached to VPC")
	}

	// Check NAT Gateways
	for i, natGwID := range natGatewayIDs {
		natResult, err := ec2Client.DescribeNatGateways(&ec2.DescribeNatGatewaysInput{
			NatGatewayIds: []*string{aws.String(natGwID)},
		})
		if err != nil {
			t.Fatalf("failed to describe NAT gateway %d: %v", i+1, err)
		}

		natGw := natResult.NatGateways[0]
		if *natGw.State != "available" {
			t.Errorf("NAT Gateway %d not available, state: %s", i+1, *natGw.State)
		}
		if *natGw.VpcId != vpcID {
			t.Errorf("NAT Gateway %d not in correct VPC", i+1)
		}
	}

	t.Logf("Network connectivity verified: IGW and %d NAT Gateways", len(natGatewayIDs))
}

func TestSecurityGroups(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	// Test Web Security Group
	webSGID := outputs["web_security_group_id"]
	webSGResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(webSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe web security group: %v", err)
	}

	webSG := webSGResult.SecurityGroups[0]
	httpsRuleFound := false
	for _, rule := range webSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 443 && *rule.ToPort == 443 {
			httpsRuleFound = true
			// Verify it's restricted to specific IP ranges
			if len(rule.IpRanges) == 0 {
				t.Error("HTTPS rule should have specific IP ranges")
			}
		}
	}
	if !httpsRuleFound {
		t.Error("HTTPS inbound rule not found in web security group")
	}

	// Test App Security Group
	appSGID := outputs["app_security_group_id"]
	appSGResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(appSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe app security group: %v", err)
	}

	appSG := appSGResult.SecurityGroups[0]
	appRuleFound := false
	for _, rule := range appSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 8080 && *rule.ToPort == 8080 {
			appRuleFound = true
			// Verify it references the web security group
			if len(rule.UserIdGroupPairs) == 0 {
				t.Error("App security group should reference web security group")
			}
		}
	}
	if !appRuleFound {
		t.Error("Port 8080 inbound rule not found in app security group")
	}

	// Test Database Security Group
	dbSGID := outputs["db_security_group_id"]
	dbSGResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(dbSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe database security group: %v", err)
	}

	dbSG := dbSGResult.SecurityGroups[0]
	dbRuleFound := false
	for _, rule := range dbSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 5432 && *rule.ToPort == 5432 {
			dbRuleFound = true
			// Verify it references the app security group
			if len(rule.UserIdGroupPairs) == 0 {
				t.Error("Database security group should reference app security group")
			}
		}
	}
	if !dbRuleFound {
		t.Error("PostgreSQL port 5432 inbound rule not found in database security group")
	}

	t.Log("All security groups configured correctly")
}

func TestKMSKeys(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	kmsClient := kms.New(sess)

	// Test RDS KMS Key
	rdsKeyID := outputs["rds_kms_key_id"]
	rdsKeyResult, err := kmsClient.DescribeKey(&kms.DescribeKeyInput{
		KeyId: aws.String(rdsKeyID),
	})
	if err != nil {
		t.Fatalf("failed to describe RDS KMS key: %v", err)
	}

	rdsKey := rdsKeyResult.KeyMetadata
	if *rdsKey.KeyUsage != "ENCRYPT_DECRYPT" {
		t.Error("RDS KMS key should be for ENCRYPT_DECRYPT")
	}
	if !*rdsKey.Enabled {
		t.Error("RDS KMS key should be enabled")
	}

	// Test S3 KMS Key
	s3KeyID := outputs["s3_kms_key_id"]
	s3KeyResult, err := kmsClient.DescribeKey(&kms.DescribeKeyInput{
		KeyId: aws.String(s3KeyID),
	})
	if err != nil {
		t.Fatalf("failed to describe S3 KMS key: %v", err)
	}

	s3Key := s3KeyResult.KeyMetadata
	if *s3Key.KeyUsage != "ENCRYPT_DECRYPT" {
		t.Error("S3 KMS key should be for ENCRYPT_DECRYPT")
	}
	if !*s3Key.Enabled {
		t.Error("S3 KMS key should be enabled")
	}

	// Test CloudTrail KMS Key
	cloudtrailKeyID := outputs["cloudtrail_kms_key_id"]
	cloudtrailKeyResult, err := kmsClient.DescribeKey(&kms.DescribeKeyInput{
		KeyId: aws.String(cloudtrailKeyID),
	})
	if err != nil {
		t.Fatalf("failed to describe CloudTrail KMS key: %v", err)
	}

	cloudtrailKey := cloudtrailKeyResult.KeyMetadata
	if *cloudtrailKey.KeyUsage != "ENCRYPT_DECRYPT" {
		t.Error("CloudTrail KMS key should be for ENCRYPT_DECRYPT")
	}
	if !*cloudtrailKey.Enabled {
		t.Error("CloudTrail KMS key should be enabled")
	}

	t.Log("All KMS keys are properly configured and enabled")
}

func TestS3Buckets(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	s3Client := s3.New(sess)

	// Test App Data Bucket
	appBucketName := outputs["app_data_bucket_id"]

	// Check bucket exists
	_, err := s3Client.HeadBucket(&s3.HeadBucketInput{
		Bucket: aws.String(appBucketName),
	})
	if err != nil {
		t.Fatalf("failed to verify app data bucket exists: %v", err)
	}

	// Check public access block
	pabResult, err := s3Client.GetPublicAccessBlock(&s3.GetPublicAccessBlockInput{
		Bucket: aws.String(appBucketName),
	})
	if err != nil {
		t.Fatalf("failed to get public access block for app bucket: %v", err)
	}

	pab := pabResult.PublicAccessBlockConfiguration
	if !*pab.BlockPublicAcls || !*pab.BlockPublicPolicy ||
		!*pab.IgnorePublicAcls || !*pab.RestrictPublicBuckets {
		t.Error("app data bucket public access not fully blocked")
	}

	// Check bucket policy exists
	_, err = s3Client.GetBucketPolicy(&s3.GetBucketPolicyInput{
		Bucket: aws.String(appBucketName),
	})
	if err != nil {
		t.Errorf("app data bucket policy not found: %v", err)
	}

	// Test CloudTrail Bucket
	cloudtrailBucketName := outputs["cloudtrail_bucket_id"]

	// Check bucket exists
	_, err = s3Client.HeadBucket(&s3.HeadBucketInput{
		Bucket: aws.String(cloudtrailBucketName),
	})
	if err != nil {
		t.Fatalf("failed to verify CloudTrail bucket exists: %v", err)
	}

	// Check CloudTrail bucket public access block
	ctPabResult, err := s3Client.GetPublicAccessBlock(&s3.GetPublicAccessBlockInput{
		Bucket: aws.String(cloudtrailBucketName),
	})
	if err != nil {
		t.Fatalf("failed to get public access block for CloudTrail bucket: %v", err)
	}

	ctPab := ctPabResult.PublicAccessBlockConfiguration
	if !*ctPab.BlockPublicAcls || !*ctPab.BlockPublicPolicy ||
		!*ctPab.IgnorePublicAcls || !*ctPab.RestrictPublicBuckets {
		t.Error("CloudTrail bucket public access not fully blocked")
	}

	t.Log("All S3 buckets are properly secured")
}

// func TestRDSInstance(t *testing.T) {
// 	outputs := loadDeploymentOutputs(t)
// 	sess := createAWSSession(t)
// 	rdsClient := rds.New(sess)

// 	rdsInstanceID := outputs["rds_instance_id"]

// 	// Describe RDS instance
// 	result, err := rdsClient.DescribeDBInstances(&rds.DescribeDBInstancesInput{
// 		DBInstanceIdentifier: aws.String(rdsInstanceID),
// 	})
// 	if err != nil {
// 		t.Fatalf("failed to describe RDS instance: %v", err)
// 	}

// 	if len(result.DBInstances) == 0 {
// 		t.Fatal("RDS instance not found")
// 	}

// 	db := result.DBInstances[0]

// 	// Verify encryption
// 	if !*db.StorageEncrypted {
// 		t.Error("RDS instance should be encrypted")
// 	}

// 	// Verify engine
// 	if *db.Engine != "postgres" {
// 		t.Errorf("expected PostgreSQL engine, got %s", *db.Engine)
// 	}

// 	// Verify Multi-AZ
// 	if !*db.MultiAZ {
// 		t.Error("RDS instance should be Multi-AZ")
// 	}

// 	// Verify not publicly accessible
// 	if *db.PubliclyAccessible {
// 		t.Error("RDS instance should not be publicly accessible")
// 	}

// 	// Verify backup retention
// 	if *db.BackupRetentionPeriod < 7 {
// 		t.Errorf("backup retention should be at least 7 days, got %d", *db.BackupRetentionPeriod)
// 	}

// 	// Verify deletion protection
// 	if !*db.DeletionProtection {
// 		t.Error("RDS instance should have deletion protection enabled")
// 	}

// 	// Verify port
// 	expectedPort := int64(5432)
// 	if *db.DbInstancePort != expectedPort {
// 		t.Errorf("expected port %d, got %d", expectedPort, *db.DbInstancePort)
// 	}

// 	t.Log("RDS instance is properly configured with security best practices")
// }

func TestIAMRoles(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	iamClient := iam.New(sess)

	// Test Lambda Execution Role
	lambdaRoleArn := outputs["lambda_execution_role_arn"]
	lambdaRoleName := strings.Split(lambdaRoleArn, "/")[1]

	lambdaRoleResult, err := iamClient.GetRole(&iam.GetRoleInput{
		RoleName: aws.String(lambdaRoleName),
	})
	if err != nil {
		t.Fatalf("failed to get Lambda execution role: %v", err)
	}

	// Verify assume role policy
	if lambdaRoleResult.Role.AssumeRolePolicyDocument == nil {
		t.Error("Lambda role should have assume role policy")
	}

	// Check attached policies
	lambdaPolicies, err := iamClient.ListAttachedRolePolicies(&iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(lambdaRoleName),
	})
	if err != nil {
		t.Fatalf("failed to list Lambda role policies: %v", err)
	}

	basicExecutionFound := false
	vpcExecutionFound := false
	for _, policy := range lambdaPolicies.AttachedPolicies {
		if strings.Contains(*policy.PolicyArn, "AWSLambdaBasicExecutionRole") {
			basicExecutionFound = true
		}
		if strings.Contains(*policy.PolicyArn, "AWSLambdaVPCAccessExecutionRole") {
			vpcExecutionFound = true
		}
	}

	if !basicExecutionFound {
		t.Error("Lambda role missing AWSLambdaBasicExecutionRole policy")
	}
	if !vpcExecutionFound {
		t.Error("Lambda role missing AWSLambdaVPCAccessExecutionRole policy")
	}

	// Test CloudTrail Role
	cloudtrailRoleArn := outputs["cloudtrail_role_arn"]
	cloudtrailRoleName := strings.Split(cloudtrailRoleArn, "/")[1]

	cloudtrailRoleResult, err := iamClient.GetRole(&iam.GetRoleInput{
		RoleName: aws.String(cloudtrailRoleName),
	})
	if err != nil {
		t.Fatalf("failed to get CloudTrail role: %v", err)
	}

	if cloudtrailRoleResult.Role.AssumeRolePolicyDocument == nil {
		t.Error("CloudTrail role should have assume role policy")
	}

	t.Log("All IAM roles are properly configured")
}

func TestCloudTrail(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	cloudtrailClient := cloudtrail.New(sess)

	cloudtrailArn := outputs["cloudtrail_trail_arn"]
	trailName := strings.Split(cloudtrailArn, "/")[1]

	// Describe CloudTrail
	result, err := cloudtrailClient.DescribeTrails(&cloudtrail.DescribeTrailsInput{
		TrailNameList: []*string{aws.String(trailName)},
	})
	if err != nil {
		t.Fatalf("failed to describe CloudTrail: %v", err)
	}

	if len(result.TrailList) == 0 {
		t.Fatal("CloudTrail not found")
	}

	trail := result.TrailList[0]

	// Verify multi-region
	if !*trail.IsMultiRegionTrail {
		t.Error("CloudTrail should be multi-region")
	}

	// Verify global service events
	if !*trail.IncludeGlobalServiceEvents {
		t.Error("CloudTrail should include global service events")
	}

	// Verify log file validation
	if !*trail.LogFileValidationEnabled {
		t.Error("CloudTrail should have log file validation enabled")
	}

	// Verify KMS encryption - Fixed field name
	if trail.KmsKeyId == nil {
		t.Error("CloudTrail should be encrypted with KMS")
	}

	// Check if trail is logging
	status, err := cloudtrailClient.GetTrailStatus(&cloudtrail.GetTrailStatusInput{
		Name: aws.String(trailName),
	})
	if err != nil {
		t.Fatalf("failed to get CloudTrail status: %v", err)
	}

	if !*status.IsLogging {
		t.Error("CloudTrail should be actively logging")
	}

	t.Log("CloudTrail is properly configured and logging")
}

func TestCloudWatchLogGroup(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	cwlClient := cloudwatchlogs.New(sess)

	logGroupArn := outputs["cloudtrail_log_group_arn"]
	logGroupName := strings.Split(logGroupArn, ":")[6]

	// Describe log group
	result, err := cwlClient.DescribeLogGroups(&cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String(logGroupName),
	})
	if err != nil {
		t.Fatalf("failed to describe log group: %v", err)
	}

	if len(result.LogGroups) == 0 {
		t.Fatal("CloudTrail log group not found")
	}

	logGroup := result.LogGroups[0]

	// Verify retention period
	if logGroup.RetentionInDays == nil || *logGroup.RetentionInDays != 90 {
		t.Errorf("expected log retention of 90 days, got %v", logGroup.RetentionInDays)
	}

	// Verify KMS encryption
	if logGroup.KmsKeyId == nil {
		t.Error("log group should be encrypted with KMS")
	}

	t.Log("CloudWatch log group is properly configured")
}

func TestResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpc_id"]

	// Check VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(vpcID)},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	if len(vpcResult.Vpcs) > 0 {
		checkRequiredTags(t, vpcResult.Vpcs[0].Tags, "VPC")
	}

	// Check security group tags
	webSGID := outputs["web_security_group_id"]
	sgResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(webSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe security group: %v", err)
	}

	if len(sgResult.SecurityGroups) > 0 {
		checkRequiredTags(t, sgResult.SecurityGroups[0].Tags, "Security Group")
	}

	t.Log("Resource tagging verified")
}

func checkRequiredTags(t *testing.T, tags []*ec2.Tag, resourceType string) {
	t.Helper()

	requiredTags := map[string]string{
		"Environment": "production",
		"Project":     "security-infra",
		"Owner":       "security-team",
		"ManagedBy":   "cdktf",
	}

	for requiredKey, expectedValue := range requiredTags {
		found := false
		for _, tag := range tags {
			if *tag.Key == requiredKey && *tag.Value == expectedValue {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("%s missing required tag %s=%s", resourceType, requiredKey, expectedValue)
		}
	}
}
