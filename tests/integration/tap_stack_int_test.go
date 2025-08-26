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
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// loadDeploymentOutputs loads the deployment outputs from flat-outputs.json
func loadDeploymentOutputs(t *testing.T) map[string]string {
	t.Helper()

	outputsPath := "cfn-outputs/flat-outputs.json"
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

// createAWSConfig creates an AWS config for testing
func createAWSConfig(t *testing.T) aws.Config {
	t.Helper()

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-west-2"),
	)
	if err != nil {
		t.Fatalf("failed to create AWS config: %v", err)
	}

	return cfg
}

func TestVPCExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe VPC
	result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
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

	if !vpc.EnableDnsHostnames {
		t.Error("expected VPC DNS hostnames to be enabled")
	}

	if !vpc.EnableDnsSupport {
		t.Error("expected VPC DNS support to be enabled")
	}

	// Check VPC tags
	foundNameTag := false
	foundEnvTag := false
	for _, tag := range vpc.Tags {
		if *tag.Key == "Name" {
			foundNameTag = true
			if !strings.Contains(*tag.Value, "webapp-vpc") {
				t.Errorf("expected VPC Name tag to contain 'webapp-vpc', got %s", *tag.Value)
			}
		}
		if *tag.Key == "Environment" {
			foundEnvTag = true
		}
	}

	if !foundNameTag {
		t.Error("VPC Name tag not found")
	}
	if !foundEnvTag {
		t.Error("VPC Environment tag not found")
	}
}

func TestSubnetsExist(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe all subnets in the VPC
	result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe subnets: %v", err)
	}

	if len(result.Subnets) < 3 {
		t.Errorf("expected at least 3 subnets, got %d", len(result.Subnets))
	}

	publicSubnets := 0
	privateSubnets := 0
	expectedCIDRs := map[string]bool{
		"10.0.1.0/24": false, // public subnet
		"10.0.2.0/24": false, // private subnet 1
		"10.0.3.0/24": false, // private subnet 2
	}

	for _, subnet := range result.Subnets {
		// Mark CIDR as found
		if _, exists := expectedCIDRs[*subnet.CidrBlock]; exists {
			expectedCIDRs[*subnet.CidrBlock] = true
		}

		if subnet.MapPublicIpOnLaunch {
			publicSubnets++
		} else {
			privateSubnets++
		}

		// Check subnet tags
		foundNameTag := false
		for _, tag := range subnet.Tags {
			if *tag.Key == "Name" {
				foundNameTag = true
				if !strings.Contains(*tag.Value, "webapp") {
					t.Errorf("expected subnet Name tag to contain 'webapp', got %s", *tag.Value)
				}
			}
		}
		if !foundNameTag {
			t.Errorf("subnet %s missing Name tag", *subnet.SubnetId)
		}
	}

	if publicSubnets != 1 {
		t.Errorf("expected 1 public subnet, got %d", publicSubnets)
	}
	if privateSubnets != 2 {
		t.Errorf("expected 2 private subnets, got %d", privateSubnets)
	}

	// Verify all expected CIDRs were found
	for cidr, found := range expectedCIDRs {
		if !found {
			t.Errorf("expected subnet with CIDR %s not found", cidr)
		}
	}
}

func TestInternetGatewayExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe Internet Gateways attached to VPC
	result, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("attachment.vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe internet gateways: %v", err)
	}

	if len(result.InternetGateways) == 0 {
		t.Fatal("no internet gateway attached to VPC")
	}

	igw := result.InternetGateways[0]

	// Check attachments
	if len(igw.Attachments) == 0 {
		t.Fatal("internet gateway has no attachments")
	}

	attachment := igw.Attachments[0]
	if *attachment.VpcId != vpcID {
		t.Errorf("expected IGW attached to VPC %s, got %s", vpcID, *attachment.VpcId)
	}

	if attachment.State != types.AttachmentStatusAttached {
		t.Errorf("expected IGW attachment state 'attached', got %s", attachment.State)
	}
}

func TestRouteTableConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe route tables in VPC
	result, err := ec2Client.DescribeRouteTables(context.TODO(), &ec2.DescribeRouteTablesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe route tables: %v", err)
	}

	if len(result.RouteTables) < 2 { // At least main + custom public
		t.Errorf("expected at least 2 route tables, got %d", len(result.RouteTables))
	}

	// Find the public route table (has route to internet gateway)
	var publicRouteTable *types.RouteTable
	for _, rt := range result.RouteTables {
		for _, route := range rt.Routes {
			if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
				publicRouteTable = &rt
				break
			}
		}
		if publicRouteTable != nil {
			break
		}
	}

	if publicRouteTable == nil {
		t.Fatal("public route table with internet gateway route not found")
	}

	// Verify internet gateway route
	foundIgwRoute := false
	for _, route := range publicRouteTable.Routes {
		if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" {
			if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
				foundIgwRoute = true
				break
			}
		}
	}

	if !foundIgwRoute {
		t.Error("route to internet gateway (0.0.0.0/0) not found in public route table")
	}
}

func TestSecurityGroupsExist(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Describe security groups in VPC
	result, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe security groups: %v", err)
	}

	// Should have at least 3: default + ec2 + rds
	if len(result.SecurityGroups) < 3 {
		t.Errorf("expected at least 3 security groups, got %d", len(result.SecurityGroups))
	}

	var ec2SG, rdsSG *types.SecurityGroup
	for _, sg := range result.SecurityGroups {
		if strings.Contains(*sg.GroupName, "ec2-sg") {
			ec2SG = &sg
		} else if strings.Contains(*sg.GroupName, "rds-sg") {
			rdsSG = &sg
		}
	}

	if ec2SG == nil {
		t.Fatal("EC2 security group not found")
	}

	if rdsSG == nil {
		t.Fatal("RDS security group not found")
	}

	// Check EC2 security group SSH rule
	foundSSHRule := false
	for _, rule := range ec2SG.IpPermissions {
		if *rule.FromPort == 22 && *rule.ToPort == 22 && *rule.IpProtocol == "tcp" {
			foundSSHRule = true
			break
		}
	}
	if !foundSSHRule {
		t.Error("SSH rule not found in EC2 security group")
	}

	// Check RDS security group MySQL rule
	foundMySQLRule := false
	for _, rule := range rdsSG.IpPermissions {
		if *rule.FromPort == 3306 && *rule.ToPort == 3306 && *rule.IpProtocol == "tcp" {
			foundMySQLRule = true
			break
		}
	}
	if !foundMySQLRule {
		t.Error("MySQL rule not found in RDS security group")
	}
}

func TestEC2InstanceExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	instanceID, ok := outputs["ec2_instance_id"]
	if !ok {
		t.Fatal("ec2_instance_id not found in outputs")
	}

	// Describe instance
	result, err := ec2Client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance not found")
	}

	instance := result.Reservations[0].Instances[0]

	// Verify instance is running or pending
	if instance.State.Name != types.InstanceStateNameRunning &&
		instance.State.Name != types.InstanceStateNamePending {
		t.Logf("Instance state: %s (may be starting up)", instance.State.Name)
	}

	// Check instance type
	if instance.InstanceType != types.InstanceTypeT3Micro {
		t.Errorf("expected instance type t3.micro, got %s", instance.InstanceType)
	}

	// Check if instance is in public subnet (has public IP)
	if instance.PublicIpAddress == nil {
		t.Error("expected instance to have a public IP address")
	}

	// Check tags
	foundNameTag := false
	foundRoleTag := false
	for _, tag := range instance.Tags {
		if *tag.Key == "Name" {
			foundNameTag = true
			if !strings.Contains(*tag.Value, "web-server") {
				t.Errorf("expected instance Name tag to contain 'web-server', got %s", *tag.Value)
			}
		}
		if *tag.Key == "Role" {
			foundRoleTag = true
			if *tag.Value != "WebServer" {
				t.Errorf("expected instance Role tag 'WebServer', got %s", *tag.Value)
			}
		}
	}

	if !foundNameTag {
		t.Error("instance Name tag not found")
	}
	if !foundRoleTag {
		t.Error("instance Role tag not found")
	}

	// Check security groups
	if len(instance.SecurityGroups) == 0 {
		t.Error("instance has no security groups")
	}

	foundEC2SG := false
	for _, sg := range instance.SecurityGroups {
		if strings.Contains(*sg.GroupName, "ec2-sg") {
			foundEC2SG = true
			break
		}
	}
	if !foundEC2SG {
		t.Error("instance is not associated with EC2 security group")
	}
}

func TestRDSInstanceExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	rdsClient := rds.NewFromConfig(cfg)

	// Get RDS endpoint from outputs to find the DB identifier
	rdsEndpoint, ok := outputs["rds_endpoint"]
	if !ok {
		t.Fatal("rds_endpoint not found in outputs")
	}

	// Extract DB identifier from endpoint (format: identifier.region.rds.amazonaws.com)
	parts := strings.Split(rdsEndpoint, ".")
	if len(parts) < 2 {
		t.Fatalf("unexpected RDS endpoint format: %s", rdsEndpoint)
	}
	dbIdentifier := parts[0]

	// Describe RDS instance
	result, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	})
	if err != nil {
		t.Fatalf("failed to describe RDS instance: %v", err)
	}

	if len(result.DBInstances) == 0 {
		t.Fatal("RDS instance not found")
	}

	instance := result.DBInstances[0]

	// Verify RDS configuration
	if *instance.Engine != "mysql" {
		t.Errorf("expected RDS engine 'mysql', got %s", *instance.Engine)
	}

	if !strings.HasPrefix(*instance.EngineVersion, "8.0") {
		t.Errorf("expected RDS engine version to start with '8.0', got %s", *instance.EngineVersion)
	}

	if *instance.DBInstanceClass != "db.t3.micro" {
		t.Errorf("expected RDS instance class 'db.t3.micro', got %s", *instance.DBInstanceClass)
	}

	if *instance.DBName != "webapp" {
		t.Errorf("expected RDS database name 'webapp', got %s", *instance.DBName)
	}

	if !instance.StorageEncrypted {
		t.Error("expected RDS storage to be encrypted")
	}

	// Check if instance is available or in creating state
	if instance.DBInstanceStatus != "available" && instance.DBInstanceStatus != "creating" {
		t.Logf("RDS instance status: %s (may be starting up)", instance.DBInstanceStatus)
	}

	// Check backup configuration
	if *instance.BackupRetentionPeriod < 7 {
		t.Errorf("expected backup retention period >= 7 days, got %d", *instance.BackupRetentionPeriod)
	}

	// Check if instance is in private subnets
	if instance.DBSubnetGroup == nil {
		t.Error("RDS instance should be in a DB subnet group")
	} else {
		if len(instance.DBSubnetGroup.Subnets) < 2 {
			t.Errorf("expected RDS instance in at least 2 subnets, got %d", len(instance.DBSubnetGroup.Subnets))
		}
	}

	// Check security groups
	if len(instance.VpcSecurityGroups) == 0 {
		t.Error("RDS instance has no VPC security groups")
	}

	foundRDSSG := false
	for _, sg := range instance.VpcSecurityGroups {
		if sg.Status == "active" {
			foundRDSSG = true
			break
		}
	}
	if !foundRDSSG {
		t.Error("RDS instance is not associated with active security group")
	}
}

func TestS3BucketExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	s3Client := s3.NewFromConfig(cfg)

	bucketName, ok := outputs["s3_state_bucket"]
	if !ok {
		t.Fatal("s3_state_bucket not found in outputs")
	}

	// Check bucket exists
	_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to verify S3 bucket exists: %v", err)
	}

	// Check encryption configuration
	encResult, err := s3Client.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
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

	if rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != s3types.ServerSideEncryptionAes256 {
		t.Errorf("expected AES256 encryption, got %s", rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
	}

	// Check public access block
	pabResult, err := s3Client.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get public access block: %v", err)
	}

	pab := pabResult.PublicAccessBlockConfiguration
	if !pab.BlockPublicAcls || !pab.BlockPublicPolicy ||
		!pab.IgnorePublicAcls || !pab.RestrictPublicBuckets {
		t.Error("public access not fully blocked")
	}

	// Check versioning
	versResult, err := s3Client.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get bucket versioning: %v", err)
	}

	if versResult.Status != s3types.BucketVersioningStatusEnabled {
		t.Error("bucket versioning not enabled")
	}
}

func TestNetworkConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	instanceID, ok := outputs["ec2_instance_id"]
	if !ok {
		t.Fatal("ec2_instance_id not found in outputs")
	}

	// Get instance details
	instanceResult, err := ec2Client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	if len(instanceResult.Reservations) == 0 || len(instanceResult.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance not found")
	}

	instance := instanceResult.Reservations[0].Instances[0]

	// Verify instance is in public subnet (has public IP and IGW route)
	if instance.PublicIpAddress == nil {
		t.Error("instance should have public IP for internet connectivity")
	}

	// Check route table for the instance's subnet
	subnetResult, err := ec2Client.DescribeRouteTables(context.TODO(), &ec2.DescribeRouteTablesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("association.subnet-id"),
				Values: []string{*instance.SubnetId},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe route tables for subnet: %v", err)
	}

	if len(subnetResult.RouteTables) == 0 {
		t.Fatal("no route table associated with instance subnet")
	}

	// Check for internet gateway route
	foundIGWRoute := false
	for _, rt := range subnetResult.RouteTables {
		for _, route := range rt.Routes {
			if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" {
				if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
					foundIGWRoute = true
					break
				}
			}
		}
		if foundIGWRoute {
			break
		}
	}

	if !foundIGWRoute {
		t.Error("instance subnet does not have route to internet gateway")
	}
}

func TestRDSConnectivityFromEC2(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	instanceID, ok := outputs["ec2_instance_id"]
	if !ok {
		t.Fatal("ec2_instance_id not found in outputs")
	}

	rdsEndpoint, ok := outputs["rds_endpoint"]
	if !ok {
		t.Fatal("rds_endpoint not found in outputs")
	}

	// Get instance details
	instanceResult, err := ec2Client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	if len(instanceResult.Reservations) == 0 || len(instanceResult.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance not found")
	}

	instance := instanceResult.Reservations[0].Instances[0]

	// Extract RDS identifier and get RDS details
	parts := strings.Split(rdsEndpoint, ".")
	if len(parts) < 2 {
		t.Fatalf("unexpected RDS endpoint format: %s", rdsEndpoint)
	}
	dbIdentifier := parts[0]

	rdsClient := rds.NewFromConfig(cfg)
	rdsResult, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	})
	if err != nil {
		t.Fatalf("failed to describe RDS instance: %v", err)
	}

	if len(rdsResult.DBInstances) == 0 {
		t.Fatal("RDS instance not found")
	}

	rdsInstance := rdsResult.DBInstances[0]

	// Verify EC2 and RDS are in the same VPC
	if *instance.VpcId != *rdsInstance.DBSubnetGroup.VpcId {
		t.Errorf("EC2 and RDS should be in the same VPC. EC2: %s, RDS: %s",
			*instance.VpcId, *rdsInstance.DBSubnetGroup.VpcId)
	}

	// Check that EC2 security group is allowed in RDS security group
	ec2SGIds := make([]string, len(instance.SecurityGroups))
	for i, sg := range instance.SecurityGroups {
		ec2SGIds[i] = *sg.GroupId
	}

	rdsVpcSGIds := make([]string, len(rdsInstance.VpcSecurityGroups))
	for i, sg := range rdsInstance.VpcSecurityGroups {
		rdsVpcSGIds[i] = *sg.VpcSecurityGroupId
	}

	// Get RDS security group rules to verify EC2 can connect
	sgResult, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupIds: rdsVpcSGIds,
	})
	if err != nil {
		t.Fatalf("failed to describe RDS security groups: %v", err)
	}

	foundConnectivityRule := false
	for _, sg := range sgResult.SecurityGroups {
		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 3306 && *rule.ToPort == 3306 {
				// Check if rule allows EC2 security groups
				for _, userIdGroupPair := range rule.UserIdGroupPairs {
					for _, ec2SGID := range ec2SGIds {
						if *userIdGroupPair.GroupId == ec2SGID {
							foundConnectivityRule = true
							break
						}
					}
					if foundConnectivityRule {
						break
					}
				}
			}
			if foundConnectivityRule {
				break
			}
		}
		if foundConnectivityRule {
			break
		}
	}

	if !foundConnectivityRule {
		t.Error("RDS security group does not allow connections from EC2 security group")
	}
}

func TestDeploymentOutputsComplete(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	requiredOutputs := []string{
		"vpc_id",
		"ec2_instance_id",
		"ec2_public_ip",
		"ec2_public_dns",
		"rds_endpoint",
		"rds_port",
		"s3_state_bucket",
		"database_name",
		"ssh_command",
	}

	for _, output := range requiredOutputs {
		if value, ok := outputs[output]; !ok || value == "" {
			t.Errorf("required output '%s' is missing or empty", output)
		}
	}

	// Validate specific output formats
	if vpcID := outputs["vpc_id"]; !strings.HasPrefix(vpcID, "vpc-") {
		t.Errorf("expected vpc_id to start with 'vpc-', got %s", vpcID)
	}

	if instanceID := outputs["ec2_instance_id"]; !strings.HasPrefix(instanceID, "i-") {
		t.Errorf("expected ec2_instance_id to start with 'i-', got %s", instanceID)
	}

	if rdsEndpoint := outputs["rds_endpoint"]; !strings.Contains(rdsEndpoint, ".rds.amazonaws.com") {
		t.Errorf("expected rds_endpoint to contain '.rds.amazonaws.com', got %s", rdsEndpoint)
	}

	if rdsPort := outputs["rds_port"]; rdsPort != "3306" {
		t.Errorf("expected rds_port to be '3306', got %s", rdsPort)
	}

	if dbName := outputs["database_name"]; dbName != "webapp" {
		t.Errorf("expected database_name to be 'webapp', got %s", dbName)
	}

	if sshCommand := outputs["ssh_command"]; !strings.Contains(sshCommand, "ssh -i") {
		t.Errorf("expected ssh_command to contain 'ssh -i', got %s", sshCommand)
	}
}

func TestResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	instanceID, ok := outputs["ec2_instance_id"]
	if !ok {
		t.Fatal("ec2_instance_id not found in outputs")
	}

	requiredTags := map[string]bool{
		"Environment": false,
		"Project":     false,
		"ManagedBy":   false,
	}

	// Check VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	vpc := vpcResult.Vpcs[0]
	vpcTagMap := make(map[string]bool)
	for tagKey := range requiredTags {
		vpcTagMap[tagKey] = false
	}

	for _, tag := range vpc.Tags {
		if _, required := vpcTagMap[*tag.Key]; required {
			vpcTagMap[*tag.Key] = true
		}
	}

	for tagKey, found := range vpcTagMap {
		if !found {
			t.Errorf("VPC missing required tag: %s", tagKey)
		}
	}

	// Check EC2 instance tags
	instanceResult, err := ec2Client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		t.Fatalf("failed to describe instance: %v", err)
	}

	instance := instanceResult.Reservations[0].Instances[0]
	instanceTagMap := make(map[string]bool)
	for tagKey := range requiredTags {
		instanceTagMap[tagKey] = false
	}

	for _, tag := range instance.Tags {
		if _, required := instanceTagMap[*tag.Key]; required {
			instanceTagMap[*tag.Key] = true
		}
	}

	for tagKey, found := range instanceTagMap {
		if !found {
			t.Errorf("EC2 instance missing required tag: %s", tagKey)
		}
	}
}

func TestHighAvailabilitySetup(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)

	vpcID, ok := outputs["vpc_id"]
	if !ok {
		t.Fatal("vpc_id not found in outputs")
	}

	// Get all subnets in VPC
	subnetResult, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe subnets: %v", err)
	}

	// Check that private subnets are in different AZs
	privateSubnetAZs := make(map[string]bool)
	for _, subnet := range subnetResult.Subnets {
		if !subnet.MapPublicIpOnLaunch { // Private subnet
			privateSubnetAZs[*subnet.AvailabilityZone] = true
		}
	}

	if len(privateSubnetAZs) < 2 {
		t.Errorf("expected private subnets in at least 2 availability zones for HA, got %d", len(privateSubnetAZs))
	}

	// Verify RDS is Multi-AZ capable (has subnets in multiple AZs)
	rdsEndpoint, ok := outputs["rds_endpoint"]
	if !ok {
		t.Fatal("rds_endpoint not found in outputs")
	}

	parts := strings.Split(rdsEndpoint, ".")
	if len(parts) < 2 {
		t.Fatalf("unexpected RDS endpoint format: %s", rdsEndpoint)
	}
	dbIdentifier := parts[0]

	rdsClient := rds.NewFromConfig(cfg)
	rdsResult, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	})
	if err != nil {
		t.Fatalf("failed to describe RDS instance: %v", err)
	}

	rdsInstance := rdsResult.DBInstances[0]
	if rdsInstance.DBSubnetGroup == nil {
		t.Fatal("RDS instance should be in a DB subnet group")
	}

	rdsSubnetAZs := make(map[string]bool)
	for _, subnet := range rdsInstance.DBSubnetGroup.Subnets {
		rdsSubnetAZs[*subnet.SubnetAvailabilityZone.Name] = true
	}

	if len(rdsSubnetAZs) < 2 {
		t.Errorf("RDS subnet group should span at least 2 availability zones for HA, got %d", len(rdsSubnetAZs))
	}
}

func TestPerformanceMonitoring(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	cfg := createAWSConfig(t)

	// For future enhancement: Add CloudWatch monitoring tests
	// This test ensures outputs exist for monitoring setup

	instanceID, ok := outputs["ec2_instance_id"]
	if !ok {
		t.Fatal("ec2_instance_id not found in outputs - needed for monitoring")
	}

	rdsEndpoint, ok := outputs["rds_endpoint"]
	if !ok {
		t.Fatal("rds_endpoint not found in outputs - needed for monitoring")
	}

	// Basic validation that we have the resources needed for monitoring
	if instanceID == "" || rdsEndpoint == "" {
		t.Error("monitoring setup requires valid instance ID and RDS endpoint")
	}

	t.Logf("Monitoring targets available - EC2: %s, RDS: %s", instanceID, rdsEndpoint)
}
