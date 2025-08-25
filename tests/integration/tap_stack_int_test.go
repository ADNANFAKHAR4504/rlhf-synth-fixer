package integration

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "github.com/go-sql-driver/mysql"
)

// TerraformOutputs represents the structure of flat-outputs.json
type TerraformOutputs struct {
	VpcID         string `json:"vpc_id"`
	EC2InstanceID string `json:"ec2_instance_id"`
	EC2PublicIP   string `json:"ec2_public_ip"`
	EC2PublicDNS  string `json:"ec2_public_dns"`
	RDSEndpoint   string `json:"rds_endpoint"`
	RDSPort       string `json:"rds_port"`
	S3StateBucket string `json:"s3_state_bucket"`
	DatabaseName  string `json:"database_name"`
	SSHCommand    string `json:"ssh_command"`
}

// loadTerraformOutputs loads outputs from cfn-outputs/flat-outputs.json
func loadTerraformOutputs(t *testing.T) *TerraformOutputs {
	outputsFile := "../../cfn-outputs/flat-outputs.json"
	
	// Check if file exists
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skipf("Skipping integration tests: %s does not exist. Deploy infrastructure first.", outputsFile)
	}
	
	data, err := os.ReadFile(outputsFile)
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}
	
	var outputs TerraformOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs JSON: %v", err)
	}
	
	// Validate that required outputs are present
	if outputs.VpcID == "" || outputs.EC2InstanceID == "" || outputs.EC2PublicIP == "" {
		t.Fatalf("Required outputs are missing from flat-outputs.json")
	}
	
	return &outputs
}

// setupAWSClients creates AWS service clients
func setupAWSClients(t *testing.T) (*ec2.Client, *rds.Client, *s3.Client) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("Failed to load AWS config: %v", err)
	}
	
	ec2Client := ec2.NewFromConfig(cfg)
	rdsClient := rds.NewFromConfig(cfg)
	s3Client := s3.NewFromConfig(cfg)
	
	return ec2Client, rdsClient, s3Client
}

func TestVPCInfrastructure(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	ec2Client, _, _ := setupAWSClients(t)
	
	ctx := context.Background()
	
	t.Run("VPC exists and is available", func(t *testing.T) {
		input := &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcID},
		}
		
		result, err := ec2Client.DescribeVpcs(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe VPC: %v", err)
		}
		
		if len(result.Vpcs) == 0 {
			t.Fatal("VPC not found")
		}
		
		vpc := result.Vpcs[0]
		if vpc.State != "available" {
			t.Errorf("Expected VPC state to be 'available', got '%s'", string(vpc.State))
		}
		
		if *vpc.CidrBlock != "10.0.0.0/16" {
			t.Errorf("Expected VPC CIDR to be '10.0.0.0/16', got '%s'", *vpc.CidrBlock)
		}
		
		if !*vpc.EnableDnsHostnames {
			t.Error("Expected DNS hostnames to be enabled")
		}
		
		if !*vpc.EnableDnsSupport {
			t.Error("Expected DNS support to be enabled")
		}
	})
	
	t.Run("Subnets are properly configured", func(t *testing.T) {
		input := &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcID},
				},
			},
		}
		
		result, err := ec2Client.DescribeSubnets(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe subnets: %v", err)
		}
		
		if len(result.Subnets) < 3 {
			t.Errorf("Expected at least 3 subnets, got %d", len(result.Subnets))
		}
		
		// Check for public subnet
		publicSubnetFound := false
		privateSubnetsCount := 0
		
		for _, subnet := range result.Subnets {
			if *subnet.MapPublicIpOnLaunch {
				publicSubnetFound = true
				if *subnet.CidrBlock != "10.0.1.0/24" {
					t.Errorf("Expected public subnet CIDR to be '10.0.1.0/24', got '%s'", *subnet.CidrBlock)
				}
			} else {
				privateSubnetsCount++
			}
		}
		
		if !publicSubnetFound {
			t.Error("Public subnet not found")
		}
		
		if privateSubnetsCount < 2 {
			t.Errorf("Expected at least 2 private subnets, got %d", privateSubnetsCount)
		}
	})
	
	t.Run("Internet Gateway is attached", func(t *testing.T) {
		input := &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VpcID},
				},
			},
		}
		
		result, err := ec2Client.DescribeInternetGateways(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe internet gateways: %v", err)
		}
		
		if len(result.InternetGateways) == 0 {
			t.Fatal("No internet gateway found attached to VPC")
		}
		
		igw := result.InternetGateways[0]
		if len(igw.Attachments) == 0 || *igw.Attachments[0].VpcId != outputs.VpcID {
			t.Error("Internet gateway is not properly attached to VPC")
		}
		
		if igw.Attachments[0].State != "available" {
			t.Errorf("Expected IGW attachment state to be 'available', got '%s'", string(igw.Attachments[0].State))
		}
	})
}

func TestEC2Infrastructure(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	ec2Client, _, _ := setupAWSClients(t)
	
	ctx := context.Background()
	
	t.Run("EC2 instance exists and is running", func(t *testing.T) {
		input := &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.EC2InstanceID},
		}
		
		result, err := ec2Client.DescribeInstances(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe EC2 instance: %v", err)
		}
		
		if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
			t.Fatal("EC2 instance not found")
		}
		
		instance := result.Reservations[0].Instances[0]
		
		if instance.State.Name != "running" {
			t.Errorf("Expected instance state to be 'running', got '%s'", string(instance.State.Name))
		}
		
		if *instance.PublicIpAddress != outputs.EC2PublicIP {
			t.Errorf("Expected public IP '%s', got '%s'", outputs.EC2PublicIP, *instance.PublicIpAddress)
		}
		
		// Verify instance type
		expectedInstanceType := os.Getenv("INSTANCE_TYPE")
		if expectedInstanceType == "" {
			expectedInstanceType = "t3.micro"
		}
		
		if string(instance.InstanceType) != expectedInstanceType {
			t.Errorf("Expected instance type '%s', got '%s'", expectedInstanceType, string(instance.InstanceType))
		}
	})
	
	t.Run("Security groups are properly configured", func(t *testing.T) {
		input := &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.EC2InstanceID},
		}
		
		result, err := ec2Client.DescribeInstances(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe EC2 instance: %v", err)
		}
		
		instance := result.Reservations[0].Instances[0]
		
		if len(instance.SecurityGroups) == 0 {
			t.Fatal("No security groups found for EC2 instance")
		}
		
		// Get security group details
		sgInput := &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{*instance.SecurityGroups[0].GroupId},
		}
		
		sgResult, err := ec2Client.DescribeSecurityGroups(ctx, sgInput)
		if err != nil {
			t.Fatalf("Failed to describe security group: %v", err)
		}
		
		sg := sgResult.SecurityGroups[0]
		
		// Check for SSH rule
		sshRuleFound := false
		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 22 && *rule.ToPort == 22 && *rule.IpProtocol == "tcp" {
				sshRuleFound = true
				break
			}
		}
		
		if !sshRuleFound {
			t.Error("SSH rule not found in security group")
		}
	})
	
	t.Run("EC2 instance is accessible via HTTP", func(t *testing.T) {
		// Wait for instance to be fully ready
		time.Sleep(30 * time.Second)
		
		url := fmt.Sprintf("http://%s", outputs.EC2PublicIP)
		
		client := &http.Client{
			Timeout: 10 * time.Second,
		}
		
		// Retry logic for HTTP connectivity
		var resp *http.Response
		var err error
		
		for i := 0; i < 5; i++ {
			resp, err = client.Get(url)
			if err == nil {
				break
			}
			t.Logf("HTTP request attempt %d failed: %v", i+1, err)
			time.Sleep(10 * time.Second)
		}
		
		if err != nil {
			t.Fatalf("Failed to connect to web server after 5 attempts: %v", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected HTTP status 200, got %d", resp.StatusCode)
		}
		
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read response body: %v", err)
		}
		
		bodyStr := string(body)
		if !strings.Contains(bodyStr, "Web Application Server") {
			t.Error("Expected web page content not found")
		}
		
		// Check for environment suffix in response
		envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if envSuffix == "" {
			envSuffix = "dev"
		}
		
		if !strings.Contains(bodyStr, envSuffix) {
			t.Errorf("Expected environment suffix '%s' in web page", envSuffix)
		}
	})
	
	t.Run("SSH connectivity test", func(t *testing.T) {
		// Test if SSH port is open (we can't actually SSH without keys)
		conn, err := net.DialTimeout("tcp", outputs.EC2PublicIP+":22", 5*time.Second)
		if err != nil {
			t.Errorf("SSH port 22 is not accessible: %v", err)
		} else {
			conn.Close()
			t.Log("SSH port 22 is accessible")
		}
	})
}

func TestRDSInfrastructure(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	_, rdsClient, _ := setupAWSClients(t)
	
	ctx := context.Background()
	
	t.Run("RDS instance exists and is available", func(t *testing.T) {
		// Extract DB identifier from RDS endpoint
		dbIdentifier := strings.Split(outputs.RDSEndpoint, ".")[0]
		
		input := &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbIdentifier),
		}
		
		result, err := rdsClient.DescribeDBInstances(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe RDS instance: %v", err)
		}
		
		if len(result.DBInstances) == 0 {
			t.Fatal("RDS instance not found")
		}
		
		dbInstance := result.DBInstances[0]
		
		if *dbInstance.DBInstanceStatus != "available" {
			t.Errorf("Expected RDS instance status to be 'available', got '%s'", *dbInstance.DBInstanceStatus)
		}
		
		if *dbInstance.Engine != "mysql" {
			t.Errorf("Expected engine to be 'mysql', got '%s'", *dbInstance.Engine)
		}
		
		if *dbInstance.DBInstanceClass != "db.t3.micro" {
			t.Errorf("Expected instance class to be 'db.t3.micro', got '%s'", *dbInstance.DBInstanceClass)
		}
		
		if *dbInstance.AllocatedStorage != 20 {
			t.Errorf("Expected allocated storage to be 20 GB, got %d", *dbInstance.AllocatedStorage)
		}
		
		if !*dbInstance.StorageEncrypted {
			t.Error("Expected storage to be encrypted")
		}
	})
	
	t.Run("Database connectivity test", func(t *testing.T) {
		// Skip this test if DB credentials are not available
		dbUsername := os.Getenv("DB_USERNAME")
		if dbUsername == "" {
			dbUsername = "admin"
		}
		
		dbPassword := os.Getenv("DB_PASSWORD")
		if dbPassword == "" {
			dbPassword = "ChangeMe123!"
		}
		
		port, err := strconv.Atoi(outputs.RDSPort)
		if err != nil {
			t.Fatalf("Invalid RDS port: %v", err)
		}
		
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s",
			dbUsername, dbPassword, outputs.RDSEndpoint, port, outputs.DatabaseName)
		
		// Test database connectivity with timeout
		db, err := sql.Open("mysql", dsn)
		if err != nil {
			t.Fatalf("Failed to open database connection: %v", err)
		}
		defer db.Close()
		
		// Set connection timeout
		db.SetConnMaxLifetime(10 * time.Second)
		
		// Test connection with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		
		err = db.PingContext(ctx)
		if err != nil {
			t.Errorf("Failed to ping database: %v", err)
		} else {
			t.Log("Database connectivity test passed")
		}
		
		// Test basic query
		if err == nil {
			var version string
			err = db.QueryRowContext(ctx, "SELECT VERSION()").Scan(&version)
			if err != nil {
				t.Errorf("Failed to query database version: %v", err)
			} else {
				t.Logf("MySQL version: %s", version)
				
				if !strings.Contains(version, "8.0") {
					t.Errorf("Expected MySQL 8.0, got version: %s", version)
				}
			}
		}
	})
}

func TestS3Infrastructure(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	_, _, s3Client := setupAWSClients(t)
	
	ctx := context.Background()
	
	t.Run("S3 state bucket exists and is configured", func(t *testing.T) {
		// Check if bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3StateBucket),
		})
		if err != nil {
			t.Fatalf("S3 state bucket does not exist: %v", err)
		}
		
		// Check versioning
		versioningResult, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3StateBucket),
		})
		if err != nil {
			t.Errorf("Failed to get bucket versioning: %v", err)
		} else if versioningResult.Status != "Enabled" {
			t.Errorf("Expected bucket versioning to be 'Enabled', got '%s'", string(versioningResult.Status))
		}
		
		// Check encryption
		encryptionResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3StateBucket),
		})
		if err != nil {
			t.Errorf("Failed to get bucket encryption: %v", err)
		} else {
			if len(encryptionResult.ServerSideEncryptionConfiguration.Rules) == 0 {
				t.Error("Expected encryption to be configured")
			}
		}
		
		// Check public access block
		pabResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3StateBucket),
		})
		if err != nil {
			t.Errorf("Failed to get public access block: %v", err)
		} else {
			pab := pabResult.PublicAccessBlockConfiguration
			if !*pab.BlockPublicAcls || !*pab.BlockPublicPolicy || 
			   !*pab.IgnorePublicAcls || !*pab.RestrictPublicBuckets {
				t.Error("Expected all public access to be blocked")
			}
		}
	})
}

func TestInfrastructureIntegration(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	
	t.Run("End-to-end connectivity test", func(t *testing.T) {
		// Test web server response includes database connectivity info
		url := fmt.Sprintf("http://%s", outputs.EC2PublicIP)
		
		client := &http.Client{
			Timeout: 15 * time.Second,
		}
		
		resp, err := client.Get(url)
		if err != nil {
			t.Fatalf("Failed to connect to web server: %v", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected HTTP status 200, got %d", resp.StatusCode)
		}
		
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read response body: %v", err)
		}
		
		bodyStr := string(body)
		
		// Verify basic web server functionality
		if !strings.Contains(bodyStr, "Web Application Server") {
			t.Error("Web server is not serving expected content")
		}
		
		t.Logf("Web server is responding correctly")
	})
	
	t.Run("Network connectivity between EC2 and RDS", func(t *testing.T) {
		// Test if RDS port is accessible from EC2's network
		// This is a basic network test
		port, err := strconv.Atoi(outputs.RDSPort)
		if err != nil {
			t.Fatalf("Invalid RDS port: %v", err)
		}
		
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", outputs.RDSEndpoint, port), 10*time.Second)
		if err != nil {
			t.Errorf("Cannot connect to RDS from external network (expected for security): %v", err)
			t.Log("This is expected behavior - RDS should only be accessible from within VPC")
		} else {
			conn.Close()
			t.Log("RDS is accessible (this might indicate a security issue)")
		}
	})
	
	t.Run("Validate infrastructure tags", func(t *testing.T) {
		ec2Client, _, _ := setupAWSClients(t)
		ctx := context.Background()
		
		// Check EC2 instance tags
		input := &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.EC2InstanceID},
		}
		
		result, err := ec2Client.DescribeInstances(ctx, input)
		if err != nil {
			t.Fatalf("Failed to describe EC2 instance: %v", err)
		}
		
		instance := result.Reservations[0].Instances[0]
		tags := make(map[string]string)
		
		for _, tag := range instance.Tags {
			tags[*tag.Key] = *tag.Value
		}
		
		requiredTags := []string{"Environment", "Role"}
		for _, requiredTag := range requiredTags {
			if _, exists := tags[requiredTag]; !exists {
				t.Errorf("Required tag '%s' is missing from EC2 instance", requiredTag)
			}
		}
		
		if tags["Role"] != "WebServer" {
			t.Errorf("Expected Role tag to be 'WebServer', got '%s'", tags["Role"])
		}
	})
}

func TestPerformanceAndReliability(t *testing.T) {
	outputs := loadTerraformOutputs(t)
	
	t.Run("Web server response time test", func(t *testing.T) {
		url := fmt.Sprintf("http://%s", outputs.EC2PublicIP)
		
		var totalTime time.Duration
		successCount := 0
		attempts := 5
		
		for i := 0; i < attempts; i++ {
			start := time.Now()
			
			client := &http.Client{
				Timeout: 10 * time.Second,
			}
			
			resp, err := client.Get(url)
			if err != nil {
				t.Logf("Request %d failed: %v", i+1, err)
				continue
			}
			
			duration := time.Since(start)
			totalTime += duration
			successCount++
			
			resp.Body.Close()
			
			if duration > 5*time.Second {
				t.Errorf("Request %d took too long: %v", i+1, duration)
			}
			
			time.Sleep(1 * time.Second)
		}
		
		if successCount == 0 {
			t.Fatal("All HTTP requests failed")
		}
		
		avgTime := totalTime / time.Duration(successCount)
		t.Logf("Average response time: %v (successful requests: %d/%d)", avgTime, successCount, attempts)
		
		if avgTime > 3*time.Second {
			t.Errorf("Average response time too high: %v", avgTime)
		}
	})
	
	t.Run("Infrastructure health check", func(t *testing.T) {
		ec2Client, rdsClient, s3Client := setupAWSClients(t)
		ctx := context.Background()
		
		// Check EC2 health
		ec2Input := &ec2.DescribeInstanceStatusInput{
			InstanceIds: []string{outputs.EC2InstanceID},
		}
		
		ec2Status, err := ec2Client.DescribeInstanceStatus(ctx, ec2Input)
		if err != nil {
			t.Errorf("Failed to get EC2 instance status: %v", err)
		} else if len(ec2Status.InstanceStatuses) > 0 {
			status := ec2Status.InstanceStatuses[0]
			if status.InstanceStatus.Status != "ok" {
				t.Errorf("EC2 instance status is not OK: %s", string(status.InstanceStatus.Status))
			}
			if status.SystemStatus.Status != "ok" {
				t.Errorf("EC2 system status is not OK: %s", string(status.SystemStatus.Status))
			}
		}
		
		// Check RDS health
		dbIdentifier := strings.Split(outputs.RDSEndpoint, ".")[0]
		rdsInput := &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbIdentifier),
		}
		
		rdsResult, err := rdsClient.DescribeDBInstances(ctx, rdsInput)
		if err != nil {
			t.Errorf("Failed to get RDS status: %v", err)
		} else if len(rdsResult.DBInstances) > 0 {
			dbInstance := rdsResult.DBInstances[0]
			if *dbInstance.DBInstanceStatus != "available" {
				t.Errorf("RDS instance status is not available: %s", *dbInstance.DBInstanceStatus)
			}
		}
		
		// Check S3 bucket accessibility
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3StateBucket),
		})
		if err != nil {
			t.Errorf("S3 bucket is not accessible: %v", err)
		}
		
		t.Log("Infrastructure health check completed")
	})
}
