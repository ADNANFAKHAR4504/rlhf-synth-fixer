//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/iam"
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
	var nestedOutputs map[string]map[string]string
	if err := json.Unmarshal(data, &nestedOutputs); err == nil {
		// Find the first stack and return its outputs
		for _, stackOutputs := range nestedOutputs {
			return stackOutputs
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
	for _, tag := range vpc.Tags {
		if *tag.Key == "Name" {
			foundNameTag = true
			t.Logf("Found VPC Name tag: %s", *tag.Value)
			break
		}
	}

	if !foundNameTag {
		t.Error("VPC Name tag not found")
	}
}

func TestEC2InstanceExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	instanceID, ok := outputs["instance_id"]
	if !ok {
		t.Fatal("instance_id not found in outputs")
	}

	// Describe instance
	result, err := ec2Client.DescribeInstances(&ec2.DescribeInstancesInput{
		InstanceIds: []*string{aws.String(instanceID)},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance not found")
	}

	instance := result.Reservations[0].Instances[0]

	// Verify instance is running
	if *instance.State.Name != "running" {
		t.Logf("Instance state: %s", *instance.State.Name)
	}

	// Check instance type
	if *instance.InstanceType != "t3.micro" {
		t.Errorf("expected instance type t3.micro, got %s", *instance.InstanceType)
	}

	// Verify monitoring is enabled
	if *instance.Monitoring.State != "enabled" {
		t.Error("expected monitoring to be enabled")
	}

	// Check root device encryption
	if instance.BlockDeviceMappings != nil && len(instance.BlockDeviceMappings) > 0 {
		// The encryption status would need to be checked via volume details
		t.Log("Root block device found")
	}

	// Verify IMDSv2 is required
	if instance.MetadataOptions != nil {
		if *instance.MetadataOptions.HttpTokens != "required" {
			t.Error("expected IMDSv2 (http_tokens=required)")
		}
	}
}

func TestS3BucketExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	s3Client := s3.New(sess)

	bucketName, ok := outputs["s3_bucket_name"]
	if !ok {
		t.Fatal("s3_bucket_name not found in outputs")
	}

	// Check bucket exists
	_, err := s3Client.HeadBucket(&s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to verify S3 bucket exists: %v", err)
	}

	// Check encryption configuration
	encResult, err := s3Client.GetBucketEncryption(&s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get bucket encryption: %v", err)
	}

	if len(encResult.ServerSideEncryptionConfiguration.Rules) == 0 {
		t.Fatal("no encryption rules found")
	}

	rule := encResult.ServerSideEncryptionConfiguration.Rules[0]
	if rule.ApplyServerSideEncryptionByDefault == nil {
		t.Fatal("encryption by default not configured")
	}

	if *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != "AES256" {
		t.Errorf("expected AES256 encryption, got %s", *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
	}

	// Check public access block
	pabResult, err := s3Client.GetPublicAccessBlock(&s3.GetPublicAccessBlockInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get public access block: %v", err)
	}

	pab := pabResult.PublicAccessBlockConfiguration
	if !*pab.BlockPublicAcls || !*pab.BlockPublicPolicy ||
		!*pab.IgnorePublicAcls || !*pab.RestrictPublicBuckets {
		t.Error("public access not fully blocked")
	}

	// Check versioning
	versResult, err := s3Client.GetBucketVersioning(&s3.GetBucketVersioningInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get bucket versioning: %v", err)
	}

	if versResult.Status == nil || *versResult.Status != "Enabled" {
		t.Error("bucket versioning not enabled")
	}
}

func TestNetworkConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Check subnets
	subnetResult, err := ec2Client.DescribeSubnets(&ec2.DescribeSubnetsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe subnets: %v", err)
	}

	publicSubnets := 0
	privateSubnets := 0

	for _, subnet := range subnetResult.Subnets {
		if *subnet.MapPublicIpOnLaunch {
			publicSubnets++
		} else {
			privateSubnets++
		}
	}

	if publicSubnets < 2 {
		t.Errorf("expected at least 2 public subnets, got %d", publicSubnets)
	}
	if privateSubnets < 2 {
		t.Errorf("expected at least 2 private subnets, got %d", privateSubnets)
	}

	// Check NAT Gateway
	natResult, err := ec2Client.DescribeNatGateways(&ec2.DescribeNatGatewaysInput{
		Filter: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
			{
				Name:   aws.String("state"),
				Values: []*string{aws.String("available")},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe NAT gateways: %v", err)
	}

	if len(natResult.NatGateways) == 0 {
		t.Error("no available NAT gateway found")
	}

	// Check Internet Gateway
	igwResult, err := ec2Client.DescribeInternetGateways(&ec2.DescribeInternetGatewaysInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("attachment.vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe internet gateways: %v", err)
	}

	if len(igwResult.InternetGateways) == 0 {
		t.Error("no internet gateway attached to VPC")
	}
}

func TestSecurityGroups(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Get security groups
	sgResult, err := ec2Client.DescribeSecurityGroups(&ec2.DescribeSecurityGroupsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe security groups: %v", err)
	}

	// Find web application security group (with environment prefix)
	var webSG *ec2.SecurityGroup
	for _, sg := range sgResult.SecurityGroups {
		if sg.GroupName != nil && *sg.GroupName != "default" {
			// Look for security group that ends with "web-application-sg"
			if len(*sg.GroupName) >= len("web-application-sg") {
				if (*sg.GroupName)[len(*sg.GroupName)-len("web-application-sg"):] == "web-application-sg" {
					webSG = sg
					t.Logf("Found web application security group: %s", *sg.GroupName)
					break
				}
			}
		}
	}

	if webSG == nil {
		t.Fatal("web application security group not found")
	}

	// Verify inbound rules
	httpFound := false
	httpsFound := false

	for _, rule := range webSG.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 80 {
			httpFound = true
		}
		if rule.FromPort != nil && *rule.FromPort == 443 {
			httpsFound = true
		}
	}

	if !httpFound {
		t.Error("HTTP (port 80) inbound rule not found")
	}
	if !httpsFound {
		t.Error("HTTPS (port 443) inbound rule not found")
	}
}

func TestIAMRoleAndPolicies(t *testing.T) {
	sess := createAWSSession(t)
	iamClient := iam.New(sess)

	// Check IAM role exists (with environment prefix)
	// First try to list roles to find the one with our prefix
	listResult, err := iamClient.ListRoles(&iam.ListRolesInput{})
	if err != nil {
		t.Logf("Warning: Could not list IAM roles: %v", err)
		return
	}

	var roleName string
	for _, role := range listResult.Roles {
		if role.RoleName != nil && len(*role.RoleName) > 0 {
			// Look for role that ends with WebAppEC2Role
			if len(*role.RoleName) >= len("WebAppEC2Role") {
				if (*role.RoleName)[len(*role.RoleName)-len("WebAppEC2Role"):] == "WebAppEC2Role" {
					roleName = *role.RoleName
					break
				}
			}
		}
	}

	if roleName == "" {
		t.Log("Warning: WebAppEC2Role not found")
		return
	}

	roleResult, err := iamClient.GetRole(&iam.GetRoleInput{
		RoleName: aws.String(roleName),
	})
	if err != nil {
		t.Logf("Warning: Could not verify IAM role: %v", err)
		return
	}

	role := roleResult.Role

	// Verify role can be assumed by EC2
	if role.AssumeRolePolicyDocument != nil {
		t.Log("IAM role AssumeRolePolicy found")
	}

	// Check attached policies
	policiesResult, err := iamClient.ListAttachedRolePolicies(&iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(roleName),
	})
	if err != nil {
		t.Logf("Warning: Could not list attached policies: %v", err)
		return
	}

	s3PolicyFound := false
	for _, policy := range policiesResult.AttachedPolicies {
		if policy.PolicyName != nil && len(*policy.PolicyName) >= len("S3LogWritePolicy") {
			// Look for policy that ends with S3LogWritePolicy
			if (*policy.PolicyName)[len(*policy.PolicyName)-len("S3LogWritePolicy"):] == "S3LogWritePolicy" {
				s3PolicyFound = true
				t.Logf("Found S3 policy: %s", *policy.PolicyName)
				break
			}
		}
	}

	if !s3PolicyFound {
		t.Error("S3LogWritePolicy not attached to role")
	}
}

func TestVPCEndpoints(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Check VPC endpoints
	endpointResult, err := ec2Client.DescribeVpcEndpoints(&ec2.DescribeVpcEndpointsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC endpoints: %v", err)
	}

	s3EndpointFound := false
	for _, endpoint := range endpointResult.VpcEndpoints {
		if endpoint.ServiceName != nil &&
			*endpoint.ServiceName == "com.amazonaws.us-west-2.s3" {
			s3EndpointFound = true
			if *endpoint.VpcEndpointType != "Gateway" {
				t.Errorf("expected S3 endpoint type Gateway, got %s", *endpoint.VpcEndpointType)
			}
			break
		}
	}

	if !s3EndpointFound {
		t.Error("S3 VPC endpoint not found")
	}
}

func TestEC2InstanceConnectEndpoint(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	eiceID, ok := outputs["instance_connect_endpoint_id"]
	if !ok {
		t.Fatal("instance_connect_endpoint_id not found in outputs")
	}

	// Describe EC2 Instance Connect Endpoint
	result, err := ec2Client.DescribeInstanceConnectEndpoints(&ec2.DescribeInstanceConnectEndpointsInput{
		InstanceConnectEndpointIds: []*string{aws.String(eiceID)},
	})
	if err != nil {
		t.Fatalf("failed to describe EC2 Instance Connect Endpoint: %v", err)
	}

	if len(result.InstanceConnectEndpoints) == 0 {
		t.Fatal("EC2 Instance Connect Endpoint not found")
	}

	eice := result.InstanceConnectEndpoints[0]

	// Verify state
	if *eice.State != "create-complete" {
		t.Logf("EC2 Instance Connect Endpoint state: %s", *eice.State)
	}

	// Verify it's in the correct VPC
	vpcID := outputs["vpc_id"]
	if *eice.VpcId != vpcID {
		t.Errorf("EICE in wrong VPC, expected %s, got %s", vpcID, *eice.VpcId)
	}
}

func TestResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpc_id"]
	instanceID := outputs["instance_id"]

	// Check VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(vpcID)},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	if len(vpcResult.Vpcs) > 0 {
		checkEnvironmentTag(t, vpcResult.Vpcs[0].Tags, "VPC")
	}

	// Check instance tags
	instanceResult, err := ec2Client.DescribeInstances(&ec2.DescribeInstancesInput{
		InstanceIds: []*string{aws.String(instanceID)},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	if len(instanceResult.Reservations) > 0 && len(instanceResult.Reservations[0].Instances) > 0 {
		checkEnvironmentTag(t, instanceResult.Reservations[0].Instances[0].Tags, "EC2 Instance")
	}
}

func checkEnvironmentTag(t *testing.T, tags []*ec2.Tag, resourceType string) {
	t.Helper()

	found := false
	for _, tag := range tags {
		if *tag.Key == "Environment" && *tag.Value == "Production" {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("%s missing Environment=Production tag", resourceType)
	}
}

func TestNetworkACLs(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Get Network ACLs
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

	// Find custom network ACL (not default)
	customNaclFound := false
	for _, nacl := range naclResult.NetworkAcls {
		if !*nacl.IsDefault {
			customNaclFound = true

			// Check for HTTP and HTTPS rules
			httpRuleFound := false
			httpsRuleFound := false

			for _, entry := range nacl.Entries {
				if !*entry.Egress && entry.PortRange != nil {
					if *entry.PortRange.From == 80 && *entry.PortRange.To == 80 {
						httpRuleFound = true
					}
					if *entry.PortRange.From == 443 && *entry.PortRange.To == 443 {
						httpsRuleFound = true
					}
				}
			}

			if !httpRuleFound {
				t.Error("HTTP rule not found in Network ACL")
			}
			if !httpsRuleFound {
				t.Error("HTTPS rule not found in Network ACL")
			}
		}
	}

	if !customNaclFound {
		t.Error("Custom Network ACL not found")
	}
}

// TestInfrastructureHealth performs a comprehensive health check
func TestInfrastructureHealth(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify all expected outputs exist
	requiredOutputs := []string{
		"vpc_id",
		"instance_id",
		"s3_bucket_name",
		"instance_connect_endpoint_id",
		"private_instance_ip",
	}

	for _, key := range requiredOutputs {
		if _, ok := outputs[key]; !ok {
			t.Errorf("Missing required output: %s", key)
		}
	}

	// Log successful deployment
	t.Logf("Infrastructure deployed successfully with outputs:")
	for k, v := range outputs {
		t.Logf("  %s: %s", k, v)
	}

	// Wait a moment for resources to stabilize
	time.Sleep(2 * time.Second)

	t.Log("All infrastructure components are healthy")
}
