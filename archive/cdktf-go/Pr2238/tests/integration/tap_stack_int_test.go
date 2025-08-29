//go:build integration
// +build integration

package lib

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
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3Types "github.com/aws/aws-sdk-go-v2/service/s3/types"
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

	// When tests are copied to lib/, we need to go up one level to project root
	flatOutputsPath := filepath.Join(currentDir, "..", "cfn-outputs", "flat-outputs.json")

	// Try alternative path if first doesn't exist
	if _, err := os.Stat(flatOutputsPath); os.IsNotExist(err) {
		// Try from current directory (if running from project root)
		flatOutputsPath = filepath.Join(currentDir, "cfn-outputs", "flat-outputs.json")
	}

	if _, err := os.Stat(flatOutputsPath); os.IsNotExist(err) {
		return FlatOutputs{}, nil // Return empty map if file doesn't exist
	}

	data, err := os.ReadFile(flatOutputsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read flat-outputs.json: %w", err)
	}

	// Parse nested structure first
	var nestedOutputs map[string]map[string]interface{}
	if err := json.Unmarshal(data, &nestedOutputs); err != nil {
		return nil, fmt.Errorf("failed to parse flat-outputs.json: %w", err)
	}

	// Flatten the nested structure
	outputs := make(FlatOutputs)
	for stackName, stackOutputs := range nestedOutputs {
		for outputKey, outputValue := range stackOutputs {
			// Convert to string
			valueStr := fmt.Sprintf("%v", outputValue)
			// Store both with stack prefix and without for compatibility
			outputs[fmt.Sprintf("%s.%s", stackName, outputKey)] = valueStr
			outputs[outputKey] = valueStr
		}
	}

	return outputs, nil
}

// getOutputValue retrieves a specific output value from the flat outputs
func getOutputValue(outputs FlatOutputs, outputKey string) (string, bool) {
	// First try direct lookup
	if value, exists := outputs[outputKey]; exists {
		return value, true
	}

	// Look for the output key in the flat outputs
	// The key format is typically: StackName.OutputKey
	for key, value := range outputs {
		if strings.HasSuffix(key, "."+outputKey) || strings.Contains(key, outputKey) {
			return value, true
		}
	}

	return "", false
} // getEnvironmentSuffix returns the environment suffix from env var or default
func getEnvironmentSuffix() string {
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "dev"
	}
	return envSuffix
}

// Global AWS config and outputs for integration tests
var awsConfig aws.Config
var flatOutputs FlatOutputs

func TestMain(m *testing.M) {
	// Initialize AWS config once for all tests
	ctx := context.Background()
	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		awsRegion = "us-east-1"
	}

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(awsRegion))
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
	vpcID, exists := getOutputValue(flatOutputs, "vpc_id")
	if !exists {
		t.Skip("vpc_id output not found in flat-outputs.json - skipping VPC test")
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

// TestSubnetsExist tests that all subnets exist and are configured correctly
func TestSubnetsExist(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	// Test public subnet
	t.Run("PublicSubnet", func(t *testing.T) {
		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2Types.Filter{
				{
					Name:   aws.String("tag:Name"),
					Values: []string{fmt.Sprintf("%s-public-subnet", envPrefix)},
				},
			},
		})

		if err != nil {
			t.Fatalf("Failed to describe public subnet: %v", err)
		}

		if len(result.Subnets) == 0 {
			t.Fatal("Public subnet not found")
		}

		subnet := result.Subnets[0]

		if *subnet.CidrBlock != "10.0.1.0/24" {
			t.Errorf("Expected public subnet CIDR 10.0.1.0/24, got %s", *subnet.CidrBlock)
		}

		if !*subnet.MapPublicIpOnLaunch {
			t.Error("Public subnet should have map_public_ip_on_launch enabled")
		}

		// Check subnet type tag
		var subnetType string
		for _, tag := range subnet.Tags {
			if *tag.Key == "Type" {
				subnetType = *tag.Value
				break
			}
		}

		if subnetType != "Public" {
			t.Errorf("Expected subnet type 'Public', got %s", subnetType)
		}

		t.Logf("✅ Public subnet %s exists and is properly configured", *subnet.SubnetId)
	})

	// Test private subnets
	t.Run("PrivateSubnets", func(t *testing.T) {
		for i := 1; i <= 2; i++ {
			result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				Filters: []ec2Types.Filter{
					{
						Name:   aws.String("tag:Name"),
						Values: []string{fmt.Sprintf("%s-private-subnet-%d", envPrefix, i)},
					},
				},
			})

			if err != nil {
				t.Fatalf("Failed to describe private subnet %d: %v", i, err)
			}

			if len(result.Subnets) == 0 {
				t.Fatalf("Private subnet %d not found", i)
			}

			subnet := result.Subnets[0]
			expectedCidr := fmt.Sprintf("10.0.%d.0/24", i+1)

			if *subnet.CidrBlock != expectedCidr {
				t.Errorf("Expected private subnet %d CIDR %s, got %s", i, expectedCidr, *subnet.CidrBlock)
			}

			// Check subnet type tag
			var subnetType string
			for _, tag := range subnet.Tags {
				if *tag.Key == "Type" {
					subnetType = *tag.Value
					break
				}
			}

			if subnetType != "Private" {
				t.Errorf("Expected subnet type 'Private', got %s", subnetType)
			}

			t.Logf("✅ Private subnet %d (%s) exists and is properly configured", i, *subnet.SubnetId)
		}
	})
}

// TestInternetGatewayExists tests that the Internet Gateway exists and is attached
func TestInternetGatewayExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get VPC ID from outputs first
	vpcID, exists := getOutputValue(flatOutputs, "vpc_id")
	if !exists {
		t.Skip("vpc_id output not found in flat-outputs.json - skipping IGW test")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	result, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("%s-igw", envPrefix)},
			},
		},
	})

	if err != nil {
		t.Fatalf("Failed to describe internet gateways: %v", err)
	}

	if len(result.InternetGateways) == 0 {
		t.Fatal("Internet Gateway not found")
	}

	igw := result.InternetGateways[0]

	// Verify IGW is attached to our VPC
	var attachedToVPC bool
	for _, attachment := range igw.Attachments {
		if *attachment.VpcId == vpcID && (attachment.State == ec2Types.AttachmentStatusAttached || attachment.State == "available") {
			attachedToVPC = true
			break
		}
	}

	if !attachedToVPC {
		t.Errorf("Internet Gateway should be attached to VPC %s", vpcID)
	}

	t.Logf("✅ Internet Gateway %s exists and is attached to VPC %s", *igw.InternetGatewayId, vpcID)
}

// TestRouteTableExists tests that route tables exist and have correct routes
func TestRouteTableExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	// Test public route table
	result, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("%s-public-rt", envPrefix)},
			},
		},
	})

	if err != nil {
		t.Fatalf("Failed to describe route tables: %v", err)
	}

	if len(result.RouteTables) == 0 {
		t.Fatal("Public route table not found")
	}

	routeTable := result.RouteTables[0]

	// Check for internet route (0.0.0.0/0)
	var hasInternetRoute bool
	for _, route := range routeTable.Routes {
		if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" && route.GatewayId != nil {
			hasInternetRoute = true
			break
		}
	}

	if !hasInternetRoute {
		t.Error("Public route table should have a route to internet gateway for 0.0.0.0/0")
	}

	t.Logf("✅ Public route table %s exists and has internet route", *routeTable.RouteTableId)
}

// TestSecurityGroupsExist tests that security groups exist and have correct rules
func TestSecurityGroupsExist(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	// Test EC2 security group
	t.Run("EC2SecurityGroup", func(t *testing.T) {
		result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2Types.Filter{
				{
					Name:   aws.String("group-name"),
					Values: []string{fmt.Sprintf("%s-ec2-sg", envPrefix)},
				},
			},
		})

		if err != nil {
			t.Fatalf("Failed to describe EC2 security groups: %v", err)
		}

		if len(result.SecurityGroups) == 0 {
			t.Fatal("EC2 security group not found")
		}

		sg := result.SecurityGroups[0]

		// Check for SSH rule (port 22)
		var hasSSH bool
		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 22 && *rule.ToPort == 22 && *rule.IpProtocol == "tcp" {
				hasSSH = true
				break
			}
		}

		if !hasSSH {
			t.Error("EC2 security group should allow SSH (port 22)")
		}

		// Check for outbound rule
		if len(sg.IpPermissionsEgress) == 0 {
			t.Error("EC2 security group should have outbound rules")
		}

		t.Logf("✅ EC2 security group %s exists and has correct rules", *sg.GroupId)
	})

	// Test RDS security group
	t.Run("RDSSecurityGroup", func(t *testing.T) {
		result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2Types.Filter{
				{
					Name:   aws.String("group-name"),
					Values: []string{fmt.Sprintf("%s-rds-sg", envPrefix)},
				},
			},
		})

		if err != nil {
			t.Fatalf("Failed to describe RDS security groups: %v", err)
		}

		if len(result.SecurityGroups) == 0 {
			t.Fatal("RDS security group not found")
		}

		sg := result.SecurityGroups[0]

		// Check for MySQL rule (port 3306)
		var hasMySQL bool
		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 3306 && *rule.ToPort == 3306 && *rule.IpProtocol == "tcp" {
				hasMySQL = true
				break
			}
		}

		if !hasMySQL {
			t.Error("RDS security group should allow MySQL (port 3306)")
		}

		t.Logf("✅ RDS security group %s exists and has MySQL access", *sg.GroupId)
	})
}

// TestEC2InstanceExists tests that the EC2 instance exists and is configured correctly
func TestEC2InstanceExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Try to get instance ID from outputs first
	instanceID, exists := getOutputValue(flatOutputs, "ec2_instance_id")
	if !exists {
		t.Skip("ec2_instance_id output not found in flat-outputs.json - testing by name tag")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	var result *ec2.DescribeInstancesOutput
	var err error

	if exists {
		// Use instance ID if available
		result, err = ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{instanceID},
		})
	} else {
		// Fall back to searching by name tag
		result, err = ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			Filters: []ec2Types.Filter{
				{
					Name:   aws.String("tag:Name"),
					Values: []string{fmt.Sprintf("%s-web-server", envPrefix)},
				},
				{
					Name:   aws.String("instance-state-name"),
					Values: []string{"running", "pending", "stopped"},
				},
			},
		})
	}

	if err != nil {
		t.Fatalf("Failed to describe instances: %v", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		t.Fatal("EC2 instance not found")
	}

	instance := result.Reservations[0].Instances[0]

	// Verify instance is in public subnet (has public IP)
	if instance.PublicIpAddress == nil {
		t.Error("EC2 instance should have a public IP address")
	}

	// Verify instance has correct tags
	var hasRole, hasEnvironment bool
	for _, tag := range instance.Tags {
		if *tag.Key == "Role" && *tag.Value == "WebServer" {
			hasRole = true
		}
		if *tag.Key == "Environment" && *tag.Value == envSuffix {
			hasEnvironment = true
		}
	}

	if !hasRole {
		t.Error("EC2 instance should have Role tag set to 'WebServer'")
	}

	if !hasEnvironment {
		t.Errorf("EC2 instance should have Environment tag set to '%s'", envSuffix)
	}

	t.Logf("✅ EC2 instance %s exists and is properly configured", *instance.InstanceId)
}

// TestRDSInstanceExists tests that the RDS instance exists and is configured correctly
func TestRDSInstanceExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	rdsClient := rds.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	dbIdentifier := fmt.Sprintf("%s-mysql-db", envPrefix)

	result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	})

	if err != nil {
		t.Fatalf("Failed to describe RDS instance: %v", err)
	}

	if len(result.DBInstances) == 0 {
		t.Fatal("RDS instance not found")
	}

	dbInstance := result.DBInstances[0]

	// Verify database configuration
	if *dbInstance.Engine != "mysql" {
		t.Errorf("Expected engine 'mysql', got %s", *dbInstance.Engine)
	}

	if *dbInstance.DBInstanceClass != "db.t3.micro" {
		t.Errorf("Expected instance class 'db.t3.micro', got %s", *dbInstance.DBInstanceClass)
	}

	if *dbInstance.AllocatedStorage != 20 {
		t.Errorf("Expected allocated storage 20, got %d", *dbInstance.AllocatedStorage)
	}

	if !*dbInstance.StorageEncrypted {
		t.Error("RDS instance should have storage encryption enabled")
	}

	if *dbInstance.BackupRetentionPeriod != 7 {
		t.Errorf("Expected backup retention period 7, got %d", *dbInstance.BackupRetentionPeriod)
	}

	// Verify database name
	if dbInstance.DBName != nil && *dbInstance.DBName != "webapp" {
		t.Errorf("Expected database name 'webapp', got %s", *dbInstance.DBName)
	}

	t.Logf("✅ RDS instance %s exists and is properly configured", *dbInstance.DBInstanceIdentifier)
}

// TestS3BucketExists tests that the S3 bucket exists and is configured correctly
func TestS3BucketExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get bucket name from outputs
	bucketName, exists := getOutputValue(flatOutputs, "s3_state_bucket")
	if !exists {
		t.Skip("s3_state_bucket output not found in flat-outputs.json - skipping S3 test")
	}

	ctx := context.Background()
	s3Client := s3.NewFromConfig(awsConfig)

	// Test bucket exists
	_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		t.Fatalf("Failed to access S3 bucket %s: %v", bucketName, err)
	}

	// Test bucket versioning
	versioningResult, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		t.Fatalf("Failed to get bucket versioning: %v", err)
	}

	if versioningResult.Status != s3Types.BucketVersioningStatusEnabled {
		t.Error("S3 bucket should have versioning enabled")
	}

	// Test bucket encryption
	encResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		t.Fatalf("Failed to get bucket encryption: %v", err)
	}

	if len(encResult.ServerSideEncryptionConfiguration.Rules) == 0 {
		t.Error("S3 bucket should have encryption rules")
	} else {
		rule := encResult.ServerSideEncryptionConfiguration.Rules[0]
		if rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm != s3Types.ServerSideEncryptionAes256 {
			t.Error("S3 bucket should use AES256 encryption")
		}
	}

	// Test public access block
	publicAccessResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		t.Fatalf("Failed to get public access block: %v", err)
	}

	pab := publicAccessResult.PublicAccessBlockConfiguration
	if !*pab.BlockPublicAcls || !*pab.BlockPublicPolicy || !*pab.IgnorePublicAcls || !*pab.RestrictPublicBuckets {
		t.Error("S3 bucket should have all public access blocked")
	}

	t.Logf("✅ S3 bucket %s exists and is properly configured", bucketName)
}

// TestInfrastructureConnectivity tests basic connectivity between components
func TestInfrastructureConnectivity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Get VPC ID from outputs
	vpcID, vpcExists := getOutputValue(flatOutputs, "vpc_id")
	if !vpcExists {
		t.Skip("vpc_id output not found in flat-outputs.json - skipping connectivity test")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

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

	// Get all subnets in this VPC
	subnetResult, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})

	if err != nil {
		t.Fatalf("Failed to describe subnets in VPC %s: %v", vpcID, err)
	}

	if len(subnetResult.Subnets) < 3 {
		t.Errorf("Expected at least 3 subnets (1 public, 2 private), got %d", len(subnetResult.Subnets))
	}

	// Verify all subnets are in the correct VPC
	for _, subnet := range subnetResult.Subnets {
		if *subnet.VpcId != *vpc.VpcId {
			t.Errorf("Subnet %s should be in VPC %s, but is in %s", *subnet.SubnetId, *vpc.VpcId, *subnet.VpcId)
		}
	}

	// Test EC2 instance is in correct VPC
	instanceResult, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("%s-web-server", envPrefix)},
			},
			{
				Name:   aws.String("instance-state-name"),
				Values: []string{"running", "pending", "stopped"},
			},
		},
	})

	if err == nil && len(instanceResult.Reservations) > 0 && len(instanceResult.Reservations[0].Instances) > 0 {
		instance := instanceResult.Reservations[0].Instances[0]
		if *instance.VpcId != vpcID {
			t.Errorf("EC2 instance should be in VPC %s, but is in %s", vpcID, *instance.VpcId)
		}
	}

	t.Logf("✅ Infrastructure connectivity verified: All components are properly connected within VPC %s", vpcID)
}

// TestEndToEndWorkflow tests a complete workflow scenario
func TestEndToEndWorkflow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping end-to-end test in short mode")
	}

	t.Log("Running end-to-end workflow test")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	// Test that all critical components are operational
	t.Run("Network_Infrastructure", func(t *testing.T) {
		TestVPCExists(t)
		TestSubnetsExist(t)
		TestInternetGatewayExists(t)
		TestRouteTableExists(t)
	})

	t.Run("Security_Configuration", func(t *testing.T) {
		TestSecurityGroupsExist(t)
	})

	t.Run("Compute_Resources", func(t *testing.T) {
		TestEC2InstanceExists(t)
	})

	t.Run("Database_Resources", func(t *testing.T) {
		TestRDSInstanceExists(t)
	})

	t.Run("Storage_Resources", func(t *testing.T) {
		TestS3BucketExists(t)
	})

	t.Run("Infrastructure_Connectivity", func(t *testing.T) {
		TestInfrastructureConnectivity(t)
	})

	select {
	case <-ctx.Done():
		t.Fatal("End-to-end test timed out")
	default:
		t.Log("✅ End-to-end test completed successfully")
	}
}

// TestOutputsAccessibility tests that all expected outputs are accessible
func TestOutputsAccessibility(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Expected outputs based on the stack definition
	expectedOutputs := []string{
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

	for _, outputKey := range expectedOutputs {
		value, exists := getOutputValue(flatOutputs, outputKey)
		if !exists {
			t.Errorf("Expected output '%s' not found in flat-outputs.json", outputKey)
			continue
		}

		if value == "" {
			t.Errorf("Output '%s' is empty", outputKey)
			continue
		}

		t.Logf("✅ Output '%s': %s", outputKey, value)
	}
}

// TestResourceTags tests that all resources have proper tagging
func TestResourceTags(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	ec2Client := ec2.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()

	// Get VPC ID from outputs
	vpcID, exists := getOutputValue(flatOutputs, "vpc_id")
	if !exists {
		t.Skip("vpc_id output not found in flat-outputs.json - skipping tag test")
	}

	// Test VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	})

	if err != nil {
		t.Fatalf("Failed to describe VPC for tag testing: %v", err)
	}

	if len(vpcResult.Vpcs) > 0 {
		vpc := vpcResult.Vpcs[0]

		var hasEnvironmentTag, hasProjectTag bool
		for _, tag := range vpc.Tags {
			if *tag.Key == "Environment" && *tag.Value == envSuffix {
				hasEnvironmentTag = true
			}
			if *tag.Key == "Project" && *tag.Value == "webapp-foundation" {
				hasProjectTag = true
			}
		}

		if !hasEnvironmentTag {
			t.Errorf("VPC should have Environment tag set to '%s'", envSuffix)
		}

		if !hasProjectTag {
			t.Error("VPC should have Project tag set to 'webapp-foundation'")
		}

		t.Log("✅ VPC has proper tags")
	}
}

// TestDatabaseSubnetGroup tests the DB subnet group configuration
func TestDatabaseSubnetGroup(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	rdsClient := rds.NewFromConfig(awsConfig)
	envSuffix := getEnvironmentSuffix()
	envPrefix := fmt.Sprintf("%s-webapp", envSuffix)

	subnetGroupName := fmt.Sprintf("%s-db-subnet-group", envPrefix)

	result, err := rdsClient.DescribeDBSubnetGroups(ctx, &rds.DescribeDBSubnetGroupsInput{
		DBSubnetGroupName: aws.String(subnetGroupName),
	})

	if err != nil {
		t.Fatalf("Failed to describe DB subnet group: %v", err)
	}

	if len(result.DBSubnetGroups) == 0 {
		t.Fatal("DB subnet group not found")
	}

	subnetGroup := result.DBSubnetGroups[0]

	// Verify it has at least 2 subnets (for Multi-AZ)
	if len(subnetGroup.Subnets) < 2 {
		t.Errorf("DB subnet group should have at least 2 subnets, got %d", len(subnetGroup.Subnets))
	}

	// Verify subnets are in different AZs
	azMap := make(map[string]bool)
	for _, subnet := range subnetGroup.Subnets {
		azMap[*subnet.SubnetAvailabilityZone.Name] = true
	}

	if len(azMap) < 2 {
		t.Error("DB subnet group should span multiple availability zones")
	}

	t.Logf("✅ DB subnet group %s is properly configured with %d subnets across %d AZs",
		*subnetGroup.DBSubnetGroupName, len(subnetGroup.Subnets), len(azMap))
}
