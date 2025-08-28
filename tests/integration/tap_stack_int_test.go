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
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/rds"
	"github.com/aws/aws-sdk-go/service/s3"
)

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
		Region: aws.String("us-east-1"), // Changed to us-east-1 as per your requirement
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
	foundProjectTag := false
	for _, tag := range vpc.Tags {
		if *tag.Key == "Name" {
			foundNameTag = true
			t.Logf("Found VPC Name tag: %s", *tag.Value)
		}
		if *tag.Key == "Project" && *tag.Value == "tap" {
			foundProjectTag = true
		}
	}

	if !foundNameTag {
		t.Error("VPC Name tag not found")
	}
	if !foundProjectTag {
		t.Error("VPC Project tag not found or incorrect")
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
	natGatewayID := outputs["nat_gateway_id"]

	// Check NAT Gateway
	natResult, err := ec2Client.DescribeNatGateways(&ec2.DescribeNatGatewaysInput{
		NatGatewayIds: []*string{aws.String(natGatewayID)},
	})
	if err != nil {
		t.Fatalf("failed to describe NAT gateway: %v", err)
	}

	natGw := natResult.NatGateways[0]
	if *natGw.State != "available" {
		t.Errorf("NAT Gateway not available, state: %s", *natGw.State)
	}
	if *natGw.VpcId != vpcID {
		t.Error("NAT Gateway not in correct VPC")
	}

	// Check Internet Gateway by describing route tables
	rtResult, err := ec2Client.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe route tables: %v", err)
	}

	igwFound := false
	for _, rt := range rtResult.RouteTables {
		for _, route := range rt.Routes {
			if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
				igwFound = true
				break
			}
		}
		if igwFound {
			break
		}
	}

	if !igwFound {
		t.Error("Internet Gateway not found in route tables")
	}

	t.Log("Network connectivity verified: IGW and NAT Gateway")
}

func TestSecurityGroups(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	// Parse security group IDs from JSON
	securityGroupIDsStr := outputs["security_group_ids"]
	var securityGroupIDs map[string]string
	if err := json.Unmarshal([]byte(securityGroupIDsStr), &securityGroupIDs); err != nil {
		t.Fatalf("failed to parse security group IDs: %v", err)
	}

	// Test ALB Security Group
	albSGID := securityGroupIDs["alb"]
	albSGResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(albSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe ALB security group: %v", err)
	}

	albSG := albSGResult.SecurityGroups[0]
	httpsRuleFound := false
	for _, rule := range albSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 443 && *rule.ToPort == 443 {
			httpsRuleFound = true
			// Verify it's restricted to specific IP ranges
			if len(rule.IpRanges) == 0 {
				t.Error("HTTPS rule should have specific IP ranges")
			}
		}
	}
	if !httpsRuleFound {
		t.Error("HTTPS inbound rule not found in ALB security group")
	}

	// Test App Security Group
	appSGID := securityGroupIDs["app"]
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
			// Verify it references the ALB security group
			if len(rule.UserIdGroupPairs) == 0 {
				t.Error("App security group should reference ALB security group")
			}
		}
	}
	if !appRuleFound {
		t.Error("Port 8080 inbound rule not found in app security group")
	}

	// Test Database Security Group
	dbSGID := securityGroupIDs["db"]
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

func TestS3Buckets(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	s3Client := s3.New(sess)

	// Parse S3 bucket names from JSON
	s3BucketNamesStr := outputs["s3_bucket_names"]
	var s3BucketNames map[string]string
	if err := json.Unmarshal([]byte(s3BucketNamesStr), &s3BucketNames); err != nil {
		t.Fatalf("failed to parse S3 bucket names: %v", err)
	}

	// Test App Data Bucket
	appBucketName := s3BucketNames["app_data"]

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

	// Check bucket encryption
	encResult, err := s3Client.GetBucketEncryption(&s3.GetBucketEncryptionInput{
		Bucket: aws.String(appBucketName),
	})
	if err != nil {
		t.Errorf("app data bucket encryption not configured: %v", err)
	} else {
		if len(encResult.ServerSideEncryptionConfiguration.Rules) == 0 {
			t.Error("app data bucket should have encryption rules")
		} else {
			rule := encResult.ServerSideEncryptionConfiguration.Rules[0]
			if *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != "aws:kms" {
				t.Error("app data bucket should use KMS encryption")
			}
		}
	}

	// Test CloudTrail Bucket
	cloudtrailBucketName := s3BucketNames["cloudtrail"]

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

	// Check CloudTrail bucket policy exists
	_, err = s3Client.GetBucketPolicy(&s3.GetBucketPolicyInput{
		Bucket: aws.String(cloudtrailBucketName),
	})
	if err != nil {
		t.Errorf("CloudTrail bucket policy not found: %v", err)
	}

	t.Log("All S3 buckets are properly secured with encryption and access controls")
}

func TestIAMRoles(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	iamClient := iam.New(sess)

	// Parse IAM role ARNs from JSON
	iamRoleArnsStr := outputs["iam_role_arns"]
	var iamRoleArns map[string]string
	if err := json.Unmarshal([]byte(iamRoleArnsStr), &iamRoleArns); err != nil {
		t.Fatalf("failed to parse IAM role ARNs: %v", err)
	}

	// Test CloudTrail Role
	cloudtrailRoleArn := iamRoleArns["cloudtrail"]
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

	// Check CloudTrail role inline policies
	inlinePolicies, err := iamClient.ListRolePolicies(&iam.ListRolePoliciesInput{
		RoleName: aws.String(cloudtrailRoleName),
	})
	if err != nil {
		t.Fatalf("failed to list CloudTrail role inline policies: %v", err)
	}

	if len(inlinePolicies.PolicyNames) == 0 {
		t.Error("CloudTrail role should have inline policies for CloudWatch Logs access")
	}

	// Test EC2 App Role
	ec2RoleArn := iamRoleArns["ec2_app"]
	ec2RoleName := strings.Split(ec2RoleArn, "/")[1]

	ec2RoleResult, err := iamClient.GetRole(&iam.GetRoleInput{
		RoleName: aws.String(ec2RoleName),
	})
	if err != nil {
		t.Fatalf("failed to get EC2 app role: %v", err)
	}

	if ec2RoleResult.Role.AssumeRolePolicyDocument == nil {
		t.Error("EC2 app role should have assume role policy")
	}

	// Check attached managed policies
	attachedPolicies, err := iamClient.ListAttachedRolePolicies(&iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(ec2RoleName),
	})
	if err != nil {
		t.Fatalf("failed to list EC2 role attached policies: %v", err)
	}

	cloudWatchPolicyFound := false
	for _, policy := range attachedPolicies.AttachedPolicies {
		if strings.Contains(*policy.PolicyArn, "CloudWatchAgentServerPolicy") {
			cloudWatchPolicyFound = true
		}
	}

	if !cloudWatchPolicyFound {
		t.Error("EC2 role missing CloudWatchAgentServerPolicy")
	}

	// Check inline policies for S3 and Secrets Manager access
	ec2InlinePolicies, err := iamClient.ListRolePolicies(&iam.ListRolePoliciesInput{
		RoleName: aws.String(ec2RoleName),
	})
	if err != nil {
		t.Fatalf("failed to list EC2 role inline policies: %v", err)
	}

	if len(ec2InlinePolicies.PolicyNames) < 2 {
		t.Error("EC2 role should have inline policies for S3 and Secrets Manager access")
	}

	t.Log("All IAM roles are properly configured")
}

func TestCloudTrail(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	cloudtrailClient := cloudtrail.New(sess)

	cloudtrailArn := outputs["cloudtrail_arn"]
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

	// Verify KMS encryption
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

	// Parse security group IDs and check tags
	securityGroupIDsStr := outputs["security_group_ids"]
	var securityGroupIDs map[string]string
	if err := json.Unmarshal([]byte(securityGroupIDsStr), &securityGroupIDs); err != nil {
		t.Fatalf("failed to parse security group IDs: %v", err)
	}

	// Check ALB security group tags
	albSGID := securityGroupIDs["alb"]
	sgResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(albSGID)},
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
		"Project":   "tap",
		"ManagedBy": "cdktf",
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

func TestNetworkACLs(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpc_id"]

	// Get network ACLs for the VPC
	naclResult, err := ec2Client.DescribeNetworkAcls(&ec2.DescribeNetworkAclsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe network ACLs: %v", err)
	}

	if len(naclResult.NetworkAcls) == 0 {
		t.Fatal("No network ACLs found for VPC")
	}

	// Verify default NACL exists and has proper rules
	for _, nacl := range naclResult.NetworkAcls {
		if *nacl.IsDefault {
			// Default NACL should allow all traffic (AWS default behavior)
			if len(nacl.Entries) == 0 {
				t.Error("Default NACL should have entries")
			}
			t.Logf("Default NACL found with %d entries", len(nacl.Entries))
		}
	}

	t.Log("Network ACLs verified")
}

func TestRouteTables(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpc_id"]
	natGatewayID := outputs["nat_gateway_id"]

	// Get route tables for the VPC
	rtResult, err := ec2Client.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe route tables: %v", err)
	}

	publicRTFound := false
	privateRTFound := false

	for _, rt := range rtResult.RouteTables {
		for _, route := range rt.Routes {
			// Check for Internet Gateway route (public route table)
			if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
				publicRTFound = true
				t.Log("Public route table found with IGW route")
			}
			// Check for NAT Gateway route (private route table)
			if route.NatGatewayId != nil && *route.NatGatewayId == natGatewayID {
				privateRTFound = true
				t.Log("Private route table found with NAT Gateway route")
			}
		}
	}

	if !publicRTFound {
		t.Error("Public route table with IGW route not found")
	}
	if !privateRTFound {
		t.Error("Private route table with NAT Gateway route not found")
	}

	t.Log("Route tables properly configured")
}

func TestSecurityGroupRules(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	// Parse security group IDs from JSON
	securityGroupIDsStr := outputs["security_group_ids"]
	var securityGroupIDs map[string]string
	if err := json.Unmarshal([]byte(securityGroupIDsStr), &securityGroupIDs); err != nil {
		t.Fatalf("failed to parse security group IDs: %v", err)
	}

	// Test bastion security group rules
	bastionSGID := securityGroupIDs["bastion"]
	bastionSGResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		GroupIds: []*string{aws.String(bastionSGID)},
	})
	if err != nil {
		t.Fatalf("failed to describe bastion security group: %v", err)
	}

	bastionSG := bastionSGResult.SecurityGroups[0]

	// Check SSH ingress rule
	sshIngressFound := false
	for _, rule := range bastionSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 22 && *rule.ToPort == 22 {
			sshIngressFound = true
			// Verify it's restricted to specific IP ranges, not 0.0.0.0/0
			for _, ipRange := range rule.IpRanges {
				if *ipRange.CidrIp == "0.0.0.0/0" {
					t.Error("Bastion SSH should not be open to 0.0.0.0/0")
				}
			}
		}
	}
	if !sshIngressFound {
		t.Error("SSH ingress rule not found in bastion security group")
	}

	// Check HTTPS egress rule
	httpsEgressFound := false
	for _, rule := range bastionSG.IpPermissionsEgress {
		if rule.FromPort != nil && *rule.FromPort == 443 && *rule.ToPort == 443 {
			httpsEgressFound = true
		}
	}
	if !httpsEgressFound {
		t.Error("HTTPS egress rule not found in bastion security group")
	}

	t.Log("Security group rules properly configured with least privilege")
}

func TestComplianceAndSecurity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)

	// Test 1: Verify no resources are publicly accessible that shouldn't be
	ec2Client := ec2.New(sess)
	rdsClient := rds.New(sess)

	// Check RDS is not publicly accessible
	rdsEndpoint := outputs["rds_endpoint"]
	if rdsEndpoint != "" {
		parts := strings.Split(rdsEndpoint, ".")
		if len(parts) >= 2 {
			rdsInstanceID := parts[0]
			result, err := rdsClient.DescribeDBInstances(&rds.DescribeDBInstancesInput{
				DBInstanceIdentifier: aws.String(rdsInstanceID),
			})
			if err == nil && len(result.DBInstances) > 0 {
				if *result.DBInstances[0].PubliclyAccessible {
					t.Error("RDS instance should not be publicly accessible")
				}
			}
		}
	}

	// Test 2: Verify all security groups follow least privilege
	securityGroupIDsStr := outputs["security_group_ids"]
	var securityGroupIDs map[string]string
	if err := json.Unmarshal([]byte(securityGroupIDsStr), &securityGroupIDs); err == nil {
		for sgType, sgID := range securityGroupIDs {
			sgResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
				GroupIds: []*string{aws.String(sgID)},
			})
			if err != nil {
				continue
			}

			if len(sgResult.SecurityGroups) > 0 {
				sg := sgResult.SecurityGroups[0]

				// Check for overly permissive rules
				for _, rule := range sg.IpPermissions {
					for _, ipRange := range rule.IpRanges {
						if *ipRange.CidrIp == "0.0.0.0/0" {
							// Only ALB security group should have 0.0.0.0/0 for HTTP/HTTPS
							if sgType != "alb" || (rule.FromPort == nil || (*rule.FromPort != 80 && *rule.FromPort != 443)) {
								t.Errorf("Security group %s (%s) has overly permissive rule allowing 0.0.0.0/0", sgType, sgID)
							}
						}
					}
				}
			}
		}
	}

	// Test 3: Verify encryption is enabled where required
	s3Client := s3.New(sess)
	s3BucketNamesStr := outputs["s3_bucket_names"]
	var s3BucketNames map[string]string
	if err := json.Unmarshal([]byte(s3BucketNamesStr), &s3BucketNames); err == nil {
		for bucketType, bucketName := range s3BucketNames {
			encResult, err := s3Client.GetBucketEncryption(&s3.GetBucketEncryptionInput{
				Bucket: aws.String(bucketName),
			})
			if err != nil {
				t.Errorf("Bucket %s (%s) should have encryption configured", bucketType, bucketName)
				continue
			}

			if len(encResult.ServerSideEncryptionConfiguration.Rules) == 0 {
				t.Errorf("Bucket %s (%s) should have encryption rules", bucketType, bucketName)
			} else {
				rule := encResult.ServerSideEncryptionConfiguration.Rules[0]
				if *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != "aws:kms" {
					t.Errorf("Bucket %s (%s) should use KMS encryption", bucketType, bucketName)
				}
			}
		}
	}

	t.Log("Compliance and security checks completed")
}
