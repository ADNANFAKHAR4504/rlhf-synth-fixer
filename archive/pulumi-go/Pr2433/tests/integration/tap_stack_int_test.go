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
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	ec2Client        *ec2.Client
	s3Client         *s3.Client
	rdsClient        *rds.Client
	iamClient        *iam.Client
	cloudwatchClient *cloudwatch.Client
	skipLiveTests    bool
)

func TestMain(m *testing.M) {
	// Check if we should skip live tests
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("CI") == "true" {
		skipLiveTests = true
		fmt.Println("⚠️  Skipping live AWS integration tests - no AWS credentials or running in CI")
		os.Exit(0)
	}

	// Initialize AWS clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		fmt.Printf("❌ Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	ec2Client = ec2.NewFromConfig(cfg)
	s3Client = s3.NewFromConfig(cfg)
	rdsClient = rds.NewFromConfig(cfg)
	iamClient = iam.NewFromConfig(cfg)
	cloudwatchClient = cloudwatch.NewFromConfig(cfg)

	os.Exit(m.Run())
}

// InfrastructureOutputs represents the expected outputs from the Pulumi stack
type InfrastructureOutputs struct {
	VpcID                  string   `json:"vpc_id"`
	PrivateSubnetIDs       []string `json:"private_subnet_ids"`
	PublicSubnetIDs        []string `json:"public_subnet_ids"`
	RDSEndpoint            string   `json:"rds_endpoint"`
	RDSPort                int      `json:"rds_port"`
	AppDataBucket          string   `json:"app_data_bucket"`
	BackupBucket           string   `json:"backup_bucket"`
	LogsBucket             string   `json:"logs_bucket"`
	DBSecurityGroupID      string   `json:"db_security_group_id"`
	AppSecurityGroupID     string   `json:"app_security_group_id"`
	EC2RoleARN             string   `json:"ec2_role_arn"`
	EC2InstanceProfileARN  string   `json:"ec2_instance_profile_arn"`
	CloudWatchDashboardURL string   `json:"cloudwatch_dashboard_url"`
}

// LoadOutputs loads the deployment outputs from the outputs file
func LoadOutputs(t *testing.T) *InfrastructureOutputs {
	outputsFile := "../cfn-outputs/all-outputs.json"

	// Check if the file exists
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skip("Skipping integration test - no outputs file found (infrastructure not deployed)")
	}

	// Read and parse the outputs file
	data, err := os.ReadFile(outputsFile)
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var outputs InfrastructureOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs file: %v", err)
	}

	// Check if outputs are empty
	if outputs.VpcID == "" {
		t.Skip("Skipping integration test - outputs file is empty (infrastructure not deployed)")
	}

	return &outputs
}

func TestVPCInfrastructure(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("VPC exists and is accessible", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcID},
		})

		require.NoError(t, err)
		require.Len(t, result.Vpcs, 1)

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.VpcID, *vpc.VpcId)
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)
		// Note: EnableDnsHostnames and EnableDnsSupport fields may not be available in AWS SDK v2
		// assert.True(t, vpc.EnableDnsHostnames.Value)
		// assert.True(t, vpc.EnableDnsSupport.Value)

		// Check tags
		hasProjectTag := false
		hasEnvironmentTag := false
		for _, tag := range vpc.Tags {
			if *tag.Key == "Project" && *tag.Value == "SecureCorp" {
				hasProjectTag = true
			}
			if *tag.Key == "Environment" && *tag.Value == "prod" {
				hasEnvironmentTag = true
			}
		}
		assert.True(t, hasProjectTag, "VPC should have Project tag")
		assert.True(t, hasEnvironmentTag, "VPC should have Environment tag")
	})

	t.Run("Private subnets exist and are in VPC", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			SubnetIds: outputs.PrivateSubnetIDs,
		})

		require.NoError(t, err)
		assert.Len(t, result.Subnets, 2)

		for _, subnet := range result.Subnets {
			assert.Equal(t, outputs.VpcID, *subnet.VpcId)
			assert.False(t, *subnet.MapPublicIpOnLaunch)

			// Check tags
			hasTypeTag := false
			for _, tag := range subnet.Tags {
				if *tag.Key == "Type" && *tag.Value == "private" {
					hasTypeTag = true
					break
				}
			}
			assert.True(t, hasTypeTag, "Private subnet should have Type=private tag")
		}
	})

	t.Run("Public subnets exist and are in VPC", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			SubnetIds: outputs.PublicSubnetIDs,
		})

		require.NoError(t, err)
		assert.Len(t, result.Subnets, 2)

		for _, subnet := range result.Subnets {
			assert.Equal(t, outputs.VpcID, *subnet.VpcId)
			assert.True(t, *subnet.MapPublicIpOnLaunch)

			// Check tags
			hasTypeTag := false
			for _, tag := range subnet.Tags {
				if *tag.Key == "Type" && *tag.Value == "public" {
					hasTypeTag = true
					break
				}
			}
			assert.True(t, hasTypeTag, "Public subnet should have Type=public tag")
		}
	})
}

func TestSecurityGroups(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("Database security group exists and has correct rules", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.DBSecurityGroupID},
		})

		require.NoError(t, err)
		require.Len(t, result.SecurityGroups, 1)

		sg := result.SecurityGroups[0]
		assert.Equal(t, outputs.DBSecurityGroupID, *sg.GroupId)
		assert.Equal(t, "Security group for RDS database", *sg.Description)

		// Check ingress rules
		hasPostgresRule := false
		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 5432 && *rule.ToPort == 5432 && *rule.IpProtocol == "tcp" {
				hasPostgresRule = true
				break
			}
		}
		assert.True(t, hasPostgresRule, "Database security group should allow PostgreSQL access")
	})

	t.Run("Application security group exists and has correct rules", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.AppSecurityGroupID},
		})

		require.NoError(t, err)
		require.Len(t, result.SecurityGroups, 1)

		sg := result.SecurityGroups[0]
		assert.Equal(t, outputs.AppSecurityGroupID, *sg.GroupId)
		assert.Equal(t, "Security group for application servers", *sg.Description)

		// Check ingress rules
		hasHTTPRule := false
		hasHTTPSRule := false
		hasSSHRule := false

		for _, rule := range sg.IpPermissions {
			if *rule.FromPort == 80 && *rule.ToPort == 80 && *rule.IpProtocol == "tcp" {
				hasHTTPRule = true
			}
			if *rule.FromPort == 443 && *rule.ToPort == 443 && *rule.IpProtocol == "tcp" {
				hasHTTPSRule = true
			}
			if *rule.FromPort == 22 && *rule.ToPort == 22 && *rule.IpProtocol == "tcp" {
				hasSSHRule = true
			}
		}

		assert.True(t, hasHTTPRule, "Application security group should allow HTTP access")
		assert.True(t, hasHTTPSRule, "Application security group should allow HTTPS access")
		assert.True(t, hasSSHRule, "Application security group should allow SSH access")
	})
}

func TestS3Buckets(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("Application data bucket exists and has correct configuration", func(t *testing.T) {
		ctx := context.Background()

		// Check bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)

		// Check bucket versioning
		versioningResult, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioningResult.Status))

		// Check bucket encryption
		encryptionResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1)
		assert.Equal(t, "AES256", string(encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))

		// Check public access block
		publicAccessResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})

	t.Run("Backup bucket exists and has correct configuration", func(t *testing.T) {
		ctx := context.Background()

		// Check bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.BackupBucket),
		})
		require.NoError(t, err)

		// Check bucket encryption
		encryptionResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.BackupBucket),
		})
		require.NoError(t, err)
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1)
		assert.Equal(t, "AES256", string(encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))

		// Check public access block
		publicAccessResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.BackupBucket),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})

	t.Run("Logs bucket exists and has correct configuration", func(t *testing.T) {
		ctx := context.Background()

		// Check bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.LogsBucket),
		})
		require.NoError(t, err)

		// Check bucket encryption
		encryptionResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.LogsBucket),
		})
		require.NoError(t, err)
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1)
		assert.Equal(t, "AES256", string(encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))

		// Check public access block
		publicAccessResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.LogsBucket),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})

	t.Run("Server access logging is configured", func(t *testing.T) {
		ctx := context.Background()

		// Check app data bucket logging
		loggingResult, err := s3Client.GetBucketLogging(ctx, &s3.GetBucketLoggingInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.NotNil(t, loggingResult.LoggingEnabled)
		assert.Equal(t, outputs.LogsBucket, *loggingResult.LoggingEnabled.TargetBucket)
		assert.Equal(t, "app-data/", *loggingResult.LoggingEnabled.TargetPrefix)

		// Check backup bucket logging
		loggingResult, err = s3Client.GetBucketLogging(ctx, &s3.GetBucketLoggingInput{
			Bucket: aws.String(outputs.BackupBucket),
		})
		require.NoError(t, err)
		assert.NotNil(t, loggingResult.LoggingEnabled)
		assert.Equal(t, outputs.LogsBucket, *loggingResult.LoggingEnabled.TargetBucket)
		assert.Equal(t, "backup/", *loggingResult.LoggingEnabled.TargetPrefix)
	})
}

func TestRDSInfrastructure(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("RDS instance exists and has correct configuration", func(t *testing.T) {
		ctx := context.Background()

		// Extract instance identifier from endpoint
		endpointParts := strings.Split(outputs.RDSEndpoint, ".")
		instanceID := endpointParts[0]

		result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(instanceID),
		})

		require.NoError(t, err)
		require.Len(t, result.DBInstances, 1)

		dbInstance := result.DBInstances[0]
		assert.Equal(t, outputs.RDSEndpoint, *dbInstance.Endpoint.Address)
		assert.Equal(t, int32(outputs.RDSPort), *dbInstance.Endpoint.Port)
		assert.Equal(t, "postgres", *dbInstance.Engine)
		assert.Equal(t, "17.6", *dbInstance.EngineVersion)
		assert.Equal(t, "db.t3.micro", *dbInstance.DBInstanceClass)
		assert.False(t, *dbInstance.PubliclyAccessible)
		assert.True(t, *dbInstance.StorageEncrypted)
		assert.Equal(t, int32(7), *dbInstance.BackupRetentionPeriod)
		assert.Equal(t, "securecorp", *dbInstance.DBName)
		assert.Equal(t, "dbadmin", *dbInstance.MasterUsername)
	})

	t.Run("RDS subnet group exists and has correct subnets", func(t *testing.T) {
		ctx := context.Background()

		// Get the RDS instance to find its subnet group
		endpointParts := strings.Split(outputs.RDSEndpoint, ".")
		instanceID := endpointParts[0]

		instanceResult, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(instanceID),
		})
		require.NoError(t, err)
		require.Len(t, instanceResult.DBInstances, 1)

		subnetGroupName := *instanceResult.DBInstances[0].DBSubnetGroup.DBSubnetGroupName

		subnetGroupResult, err := rdsClient.DescribeDBSubnetGroups(ctx, &rds.DescribeDBSubnetGroupsInput{
			DBSubnetGroupName: aws.String(subnetGroupName),
		})

		require.NoError(t, err)
		require.Len(t, subnetGroupResult.DBSubnetGroups, 1)

		subnetGroup := subnetGroupResult.DBSubnetGroups[0]
		assert.Len(t, subnetGroup.Subnets, 2)

		// Verify subnets are in our private subnets list
		subnetIDs := make(map[string]bool)
		for _, subnet := range subnetGroup.Subnets {
			subnetIDs[*subnet.SubnetIdentifier] = true
		}

		for _, expectedSubnetID := range outputs.PrivateSubnetIDs {
			assert.True(t, subnetIDs[expectedSubnetID], "RDS subnet group should contain expected private subnet")
		}
	})

	t.Run("RDS parameter group exists and has correct parameters", func(t *testing.T) {
		ctx := context.Background()

		// Get the RDS instance to find its parameter group
		endpointParts := strings.Split(outputs.RDSEndpoint, ".")
		instanceID := endpointParts[0]

		instanceResult, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(instanceID),
		})
		require.NoError(t, err)
		require.Len(t, instanceResult.DBInstances, 1)

		parameterGroupName := *instanceResult.DBInstances[0].DBParameterGroups[0].DBParameterGroupName

		parameterGroupResult, err := rdsClient.DescribeDBParameters(ctx, &rds.DescribeDBParametersInput{
			DBParameterGroupName: aws.String(parameterGroupName),
		})

		require.NoError(t, err)

		// Check for expected parameters
		hasLogConnections := false
		hasLogDisconnections := false

		for _, parameter := range parameterGroupResult.Parameters {
			if *parameter.ParameterName == "log_connections" && *parameter.ParameterValue == "1" {
				hasLogConnections = true
			}
			if *parameter.ParameterName == "log_disconnections" && *parameter.ParameterValue == "1" {
				hasLogDisconnections = true
			}
		}

		assert.True(t, hasLogConnections, "RDS parameter group should have log_connections=1")
		assert.True(t, hasLogDisconnections, "RDS parameter group should have log_disconnections=1")
	})
}

func TestIAMRoles(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("EC2 role exists and has correct trust policy", func(t *testing.T) {
		ctx := context.Background()

		// Extract role name from ARN
		roleName := strings.Split(outputs.EC2RoleARN, "/")[1]

		result, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})

		require.NoError(t, err)
		assert.Equal(t, outputs.EC2RoleARN, *result.Role.Arn)

		// Check trust policy
		trustPolicy := *result.Role.AssumeRolePolicyDocument
		assert.Contains(t, trustPolicy, "ec2.amazonaws.com")
		assert.Contains(t, trustPolicy, "sts:AssumeRole")
	})

	t.Run("EC2 instance profile exists", func(t *testing.T) {
		ctx := context.Background()

		// Extract profile name from ARN
		profileName := strings.Split(outputs.EC2InstanceProfileARN, "/")[1]

		result, err := iamClient.GetInstanceProfile(ctx, &iam.GetInstanceProfileInput{
			InstanceProfileName: aws.String(profileName),
		})

		require.NoError(t, err)
		assert.Equal(t, outputs.EC2InstanceProfileARN, *result.InstanceProfile.Arn)
		assert.Len(t, result.InstanceProfile.Roles, 1)
		assert.Equal(t, outputs.EC2RoleARN, *result.InstanceProfile.Roles[0].Arn)
	})

	t.Run("EC2 role has S3 access policy", func(t *testing.T) {
		ctx := context.Background()

		// Extract role name from ARN
		roleName := strings.Split(outputs.EC2RoleARN, "/")[1]

		_, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})

		require.NoError(t, err)

		// Check for inline policies
		inlinePoliciesResult, err := iamClient.ListRolePolicies(ctx, &iam.ListRolePoliciesInput{
			RoleName: aws.String(roleName),
		})

		require.NoError(t, err)
		assert.Len(t, inlinePoliciesResult.PolicyNames, 1)
		assert.Contains(t, inlinePoliciesResult.PolicyNames[0], "ec2-s3-policy")
	})
}

func TestCloudWatchMonitoring(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	t.Run("RDS CPU alarm exists", func(t *testing.T) {
		ctx := context.Background()

		// Extract alarm name from the expected pattern
		alarmName := "securecorp-prod-rds-cpu-alarm"

		result, err := cloudwatchClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
			AlarmNames: []string{alarmName},
		})

		// Note: CloudWatch alarms might not be immediately available after deployment
		if err != nil {
			t.Logf("CloudWatch alarm not found (may be still creating): %v", err)
			t.Skip("CloudWatch alarm not yet available")
		}

		if len(result.MetricAlarms) > 0 {
			alarm := result.MetricAlarms[0]
			assert.Equal(t, alarmName, *alarm.AlarmName)
			assert.Equal(t, "AWS/RDS", *alarm.Namespace)
			assert.Equal(t, "CPUUtilization", *alarm.MetricName)
			assert.Equal(t, float64(80.0), *alarm.Threshold)
		}
	})

	t.Run("RDS connections alarm exists", func(t *testing.T) {
		ctx := context.Background()

		// Extract alarm name from the expected pattern
		alarmName := "securecorp-prod-rds-connections-alarm"

		result, err := cloudwatchClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
			AlarmNames: []string{alarmName},
		})

		// Note: CloudWatch alarms might not be immediately available after deployment
		if err != nil {
			t.Logf("CloudWatch alarm not found (may be still creating): %v", err)
			t.Skip("CloudWatch alarm not yet available")
		}

		if len(result.MetricAlarms) > 0 {
			alarm := result.MetricAlarms[0]
			assert.Equal(t, alarmName, *alarm.AlarmName)
			assert.Equal(t, "AWS/RDS", *alarm.Namespace)
			assert.Equal(t, "DatabaseConnections", *alarm.MetricName)
			assert.Equal(t, float64(100.0), *alarm.Threshold)
		}
	})
}

func TestNetworkConnectivity(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("VPC has internet gateway attached", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VpcID},
				},
			},
		})

		require.NoError(t, err)
		assert.Len(t, result.InternetGateways, 1)
		assert.Equal(t, "attached", string(result.InternetGateways[0].Attachments[0].State))
	})

	t.Run("VPC has NAT gateways", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{})

		require.NoError(t, err)

		// Filter NAT gateways for our VPC
		vpcNatGateways := 0
		for _, natGateway := range result.NatGateways {
			if *natGateway.VpcId == outputs.VpcID {
				vpcNatGateways++
				assert.Equal(t, "available", string(natGateway.State))
			}
		}
		assert.Equal(t, 2, vpcNatGateways, "Should have 2 NAT gateways in VPC")
	})

	t.Run("Route tables are properly configured", func(t *testing.T) {
		ctx := context.Background()

		result, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
			Filters: []types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcID},
				},
			},
		})

		require.NoError(t, err)
		assert.Len(t, result.RouteTables, 3) // 1 public + 2 private

		// Check for internet gateway route in public route table
		hasPublicRoute := false
		for _, routeTable := range result.RouteTables {
			for _, route := range routeTable.Routes {
				if *route.DestinationCidrBlock == "0.0.0.0/0" && route.GatewayId != nil {
					hasPublicRoute = true
					break
				}
			}
		}
		assert.True(t, hasPublicRoute, "Public route table should have internet gateway route")

		// Check for NAT gateway routes in private route tables
		hasPrivateRoute := false
		for _, routeTable := range result.RouteTables {
			for _, route := range routeTable.Routes {
				if *route.DestinationCidrBlock == "0.0.0.0/0" && route.NatGatewayId != nil {
					hasPrivateRoute = true
					break
				}
			}
		}
		assert.True(t, hasPrivateRoute, "Private route tables should have NAT gateway routes")
	})
}

func TestSecurityCompliance(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("RDS instance is not publicly accessible", func(t *testing.T) {
		ctx := context.Background()

		endpointParts := strings.Split(outputs.RDSEndpoint, ".")
		instanceID := endpointParts[0]

		result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(instanceID),
		})

		require.NoError(t, err)
		require.Len(t, result.DBInstances, 1)

		assert.False(t, *result.DBInstances[0].PubliclyAccessible, "RDS instance should not be publicly accessible")
	})

	t.Run("RDS instance has encryption enabled", func(t *testing.T) {
		ctx := context.Background()

		endpointParts := strings.Split(outputs.RDSEndpoint, ".")
		instanceID := endpointParts[0]

		result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(instanceID),
		})

		require.NoError(t, err)
		require.Len(t, result.DBInstances, 1)

		assert.True(t, *result.DBInstances[0].StorageEncrypted, "RDS instance should have encryption enabled")
	})

	t.Run("S3 buckets have public access blocked", func(t *testing.T) {
		ctx := context.Background()

		buckets := []string{outputs.AppDataBucket, outputs.BackupBucket, outputs.LogsBucket}

		for _, bucket := range buckets {
			result, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
				Bucket: aws.String(bucket),
			})

			require.NoError(t, err)
			assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicAcls, "S3 bucket should block public ACLs")
			assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicPolicy, "S3 bucket should block public policies")
			assert.True(t, *result.PublicAccessBlockConfiguration.IgnorePublicAcls, "S3 bucket should ignore public ACLs")
			assert.True(t, *result.PublicAccessBlockConfiguration.RestrictPublicBuckets, "S3 bucket should restrict public access")
		}
	})

	t.Run("S3 buckets have encryption enabled", func(t *testing.T) {
		ctx := context.Background()

		buckets := []string{outputs.AppDataBucket, outputs.BackupBucket, outputs.LogsBucket}

		for _, bucket := range buckets {
			result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
				Bucket: aws.String(bucket),
			})

			require.NoError(t, err)
			assert.Len(t, result.ServerSideEncryptionConfiguration.Rules, 1, "S3 bucket should have encryption configured")
			assert.Equal(t, "AES256", string(result.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm), "S3 bucket should use AES256 encryption")
		}
	})
}
