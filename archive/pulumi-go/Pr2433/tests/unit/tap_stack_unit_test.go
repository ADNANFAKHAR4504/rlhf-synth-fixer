//go:build !integration
// +build !integration

package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	stackFile = "tap_stack.go"
)

func TestFileStructureAndSyntax(t *testing.T) {
	stackPath := filepath.Join(".", "tap_stack.go")

	t.Run("tap_stack.go exists and is readable", func(t *testing.T) {
		exists := fileExists(stackPath)
		assert.True(t, exists, "tap_stack.go should exist")

		content, err := os.ReadFile(stackPath)
		require.NoError(t, err)
		assert.Greater(t, len(content), 0, "tap_stack.go should not be empty")
	})

	t.Run("has valid Go syntax structure", func(t *testing.T) {
		content, err := os.ReadFile(stackPath)
		require.NoError(t, err)
		contentStr := string(content)

		// Check for required imports
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi/sdk/v3/go/pulumi"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"`)

		// Check for main function
		assert.Contains(t, contentStr, "func main() {")
		assert.Contains(t, contentStr, "pulumi.Run(")

		// Check for exports
		assert.Contains(t, contentStr, "ctx.Export(")
	})

	t.Run("uses environment variables for configuration", func(t *testing.T) {
		content, err := os.ReadFile(stackPath)
		require.NoError(t, err)
		contentStr := string(content)

		assert.Contains(t, contentStr, "getEnvOrDefault")
		assert.Contains(t, contentStr, "ENVIRONMENT")
		assert.Contains(t, contentStr, "AWS_REGION")
		assert.Contains(t, contentStr, "PROJECT_NAME")
		assert.Contains(t, contentStr, "VPC_CIDR")
	})
}

func TestVariableDefinitions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("declares environment variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `getEnvOrDefault("ENVIRONMENT", "prod")`)
	})

	t.Run("declares aws_region variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `getEnvOrDefault("AWS_REGION", "us-east-1")`)
	})

	t.Run("declares project_name variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `getEnvOrDefault("PROJECT_NAME", "securecorp")`)
	})

	t.Run("declares vpc_cidr variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `getEnvOrDefault("VPC_CIDR", "10.0.0.0/16")`)
	})
}

func TestVPCAndNetworkingResources(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates VPC with proper CIDR", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpc(ctx, "main"`)
		assert.Contains(t, contentStr, `CidrBlock:          pulumi.String(vpcCidr)`)
		assert.Contains(t, contentStr, `EnableDnsHostnames: pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `EnableDnsSupport:   pulumi.Bool(true)`)
	})

	t.Run("creates internet gateway", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewInternetGateway(ctx, "main"`)
	})

	t.Run("creates public and private subnets", func(t *testing.T) {
		assert.Contains(t, contentStr, `publicSubnets := make([]*ec2.Subnet, 2)`)
		assert.Contains(t, contentStr, `privateSubnets := make([]*ec2.Subnet, 2)`)
		assert.Contains(t, contentStr, `MapPublicIpOnLaunch: pulumi.Bool(true)`)
	})

	t.Run("creates NAT gateways", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewNatGateway(ctx,`)
		assert.Contains(t, contentStr, `ec2.NewEip(ctx,`)
	})

	t.Run("creates route tables", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewRouteTable(ctx, "public"`)
		assert.Contains(t, contentStr, `fmt.Sprintf("private-%d", i)`)
	})

	t.Run("associates route tables with subnets", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewRouteTableAssociation`)
	})
}

func TestSecurityGroups(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates database security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, "db-sg"`)
		assert.Contains(t, contentStr, `"Security group for RDS database"`)
	})

	t.Run("creates application security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, "app-sg"`)
		assert.Contains(t, contentStr, `"Security group for application servers"`)
	})

	t.Run("has proper database ingress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `FromPort:    pulumi.Int(5432)`)
		assert.Contains(t, contentStr, `ToPort:      pulumi.Int(5432)`)
		assert.Contains(t, contentStr, `Protocol:    pulumi.String("tcp")`)
		assert.Contains(t, contentStr, `CidrBlocks:  pulumi.StringArray{pulumi.String("10.0.0.0/16")}`)
	})

	t.Run("has proper application ingress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `FromPort:    pulumi.Int(80)`)
		assert.Contains(t, contentStr, `FromPort:    pulumi.Int(443)`)
		assert.Contains(t, contentStr, `FromPort:    pulumi.Int(22)`)
	})

	t.Run("has proper egress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `Protocol:    pulumi.String("-1")`)
		assert.Contains(t, contentStr, `CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")}`)
	})
}

func TestS3Buckets(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates application data bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, "app-data"`)
		assert.Contains(t, contentStr, `prod-%s-%s-app-data`)
	})

	t.Run("creates backup bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, "backup"`)
		assert.Contains(t, contentStr, `prod-%s-%s-backup`)
	})

	t.Run("creates logs bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, "logs"`)
		assert.Contains(t, contentStr, `prod-%s-%s-logs`)
	})

	t.Run("configures bucket versioning", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketVersioningV2`)
		assert.Contains(t, contentStr, `Status: pulumi.String("Enabled")`)
	})

	t.Run("configures bucket encryption", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketServerSideEncryptionConfigurationV2`)
		assert.Contains(t, contentStr, `SseAlgorithm: pulumi.String("AES256")`)
	})

	t.Run("configures bucket public access block", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketPublicAccessBlock`)
		assert.Contains(t, contentStr, `BlockPublicAcls:       pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `BlockPublicPolicy:     pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `IgnorePublicAcls:      pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `RestrictPublicBuckets: pulumi.Bool(true)`)
	})

	t.Run("configures server access logging", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketLoggingV2`)
		assert.Contains(t, contentStr, `TargetBucket: logsBucket.ID()`)
	})
}

func TestRDSResources(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates RDS subnet group", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewSubnetGroup(ctx, "main"`)
		assert.Contains(t, contentStr, `privateSubnets[0].ID(), privateSubnets[1].ID()`)
	})

	t.Run("creates RDS parameter group", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewParameterGroup(ctx, "main"`)
		assert.Contains(t, contentStr, `Family: pulumi.String("postgres17")`)
		assert.Contains(t, contentStr, `"log_connections"`)
		assert.Contains(t, contentStr, `"log_disconnections"`)
	})

	t.Run("creates RDS instance", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewInstance(ctx, "main"`)
		assert.Contains(t, contentStr, `Engine:                pulumi.String("postgres")`)
		assert.Contains(t, contentStr, `EngineVersion:         pulumi.String("17.6")`)
		assert.Contains(t, contentStr, `InstanceClass:         pulumi.String("db.t3.micro")`)
		assert.Contains(t, contentStr, `StorageEncrypted:      pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `PubliclyAccessible:    pulumi.Bool(false)`)
	})

	t.Run("configures RDS backup settings", func(t *testing.T) {
		assert.Contains(t, contentStr, `BackupRetentionPeriod: pulumi.Int(7)`)
		assert.Contains(t, contentStr, `BackupWindow:          pulumi.String("03:00-04:00")`)
	})
}

func TestIAMRoles(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates EC2 role", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewRole(ctx, "ec2-role"`)
		assert.Contains(t, contentStr, `"Service": "ec2.amazonaws.com"`)
	})

	t.Run("creates EC2 instance profile", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewInstanceProfile(ctx, "ec2-profile"`)
	})

	t.Run("creates S3 access policy", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewRolePolicy(ctx, "ec2-s3-policy"`)
		assert.Contains(t, contentStr, `"s3:GetObject"`)
		assert.Contains(t, contentStr, `"s3:PutObject"`)
		assert.Contains(t, contentStr, `"s3:DeleteObject"`)
		assert.Contains(t, contentStr, `"s3:ListBucket"`)
	})

	t.Run("has proper assume role policy", func(t *testing.T) {
		assert.Contains(t, contentStr, `"sts:AssumeRole"`)
		assert.Contains(t, contentStr, `"Effect": "Allow"`)
	})
}

func TestCloudWatchMonitoring(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates RDS CPU alarm", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewMetricAlarm(ctx, "rds-cpu-alarm"`)
		assert.Contains(t, contentStr, `MetricName:         pulumi.String("CPUUtilization")`)
		assert.Contains(t, contentStr, `Namespace:          pulumi.String("AWS/RDS")`)
		assert.Contains(t, contentStr, `Threshold:          pulumi.Float64(80.0)`)
	})

	t.Run("creates RDS connections alarm", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewMetricAlarm(ctx, "rds-connections-alarm"`)
		assert.Contains(t, contentStr, `MetricName:         pulumi.String("DatabaseConnections")`)
		assert.Contains(t, contentStr, `Threshold:          pulumi.Float64(100.0)`)
	})

	t.Run("creates CloudWatch dashboard", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewDashboard(ctx, "main"`)
		assert.Contains(t, contentStr, `"AWS/RDS"`)
		assert.Contains(t, contentStr, `"AWS/S3"`)
	})
}

func TestExports(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("exports VPC ID", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("vpc_id", vpc.ID())`)
	})

	t.Run("exports subnet IDs", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("private_subnet_ids"`)
		assert.Contains(t, contentStr, `ctx.Export("public_subnet_ids"`)
	})

	t.Run("exports RDS information", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("rds_endpoint", dbInstance.Endpoint)`)
		assert.Contains(t, contentStr, `ctx.Export("rds_port", dbInstance.Port)`)
	})

	t.Run("exports S3 bucket names", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("app_data_bucket", appDataBucket.Bucket)`)
		assert.Contains(t, contentStr, `ctx.Export("backup_bucket", backupBucket.Bucket)`)
		assert.Contains(t, contentStr, `ctx.Export("logs_bucket", logsBucket.Bucket)`)
	})

	t.Run("exports security group IDs", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("db_security_group_id", dbSg.ID())`)
		assert.Contains(t, contentStr, `ctx.Export("app_security_group_id", appSg.ID())`)
	})

	t.Run("exports IAM roles", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("ec2_role_arn", ec2Role.Arn)`)
		assert.Contains(t, contentStr, `ctx.Export("ec2_instance_profile_arn", ec2InstanceProfile.Arn)`)
	})

	t.Run("exports CloudWatch dashboard URL", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("cloudwatch_dashboard_url"`)
	})
}

func TestNamingConventions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("uses consistent naming convention", func(t *testing.T) {
		assert.Contains(t, contentStr, `pulumi.Sprintf("%s-%s-`, "projectName", "environment")
	})

	t.Run("uses proper resource naming", func(t *testing.T) {
		assert.Contains(t, contentStr, `-db-sg`)
		assert.Contains(t, contentStr, `-app-sg`)
		assert.Contains(t, contentStr, `-app-data`)
		assert.Contains(t, contentStr, `-backup`)
		assert.Contains(t, contentStr, `-logs`)
		assert.Contains(t, contentStr, `-ec2-role`)
	})
}

func TestCommonTags(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("defines common tags", func(t *testing.T) {
		assert.Contains(t, contentStr, `commonTags := pulumi.StringMap{`)
		assert.Contains(t, contentStr, `"Project":     pulumi.String("SecureCorp")`)
		assert.Contains(t, contentStr, `"Environment": pulumi.String(environment)`)
		assert.Contains(t, contentStr, `"ManagedBy":   pulumi.String("pulumi")`)
		assert.Contains(t, contentStr, `"Owner":       pulumi.String("DevOps")`)
	})

	t.Run("applies tags to resources", func(t *testing.T) {
		assert.Contains(t, contentStr, `Tags: commonTags`)
	})
}

func TestHelperFunctions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("has getEnvOrDefault function", func(t *testing.T) {
		assert.Contains(t, contentStr, `func getEnvOrDefault(key, defaultValue string) string {`)
		assert.Contains(t, contentStr, `os.Getenv(key)`)
	})
}

func TestSecurityCompliance(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("RDS is not publicly accessible", func(t *testing.T) {
		assert.Contains(t, contentStr, `PubliclyAccessible:    pulumi.Bool(false)`)
	})

	t.Run("RDS has encryption enabled", func(t *testing.T) {
		assert.Contains(t, contentStr, `StorageEncrypted:      pulumi.Bool(true)`)
	})

	t.Run("S3 buckets have public access blocked", func(t *testing.T) {
		assert.Contains(t, contentStr, `BlockPublicAcls:       pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `BlockPublicPolicy:     pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `IgnorePublicAcls:      pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `RestrictPublicBuckets: pulumi.Bool(true)`)
	})

	t.Run("S3 buckets have encryption enabled", func(t *testing.T) {
		assert.Contains(t, contentStr, `SseAlgorithm: pulumi.String("AES256")`)
	})
}

func TestResourceDependencies(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("subnets depend on VPC", func(t *testing.T) {
		assert.Contains(t, contentStr, `VpcId: vpc.ID()`)
	})

	t.Run("NAT gateways depend on subnets", func(t *testing.T) {
		assert.Contains(t, contentStr, `SubnetId:     publicSubnets[i].ID()`)
	})

	t.Run("RDS depends on subnet group", func(t *testing.T) {
		assert.Contains(t, contentStr, `DbSubnetGroupName:     dbSubnetGroup.Name`)
	})

	t.Run("RDS depends on security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `VpcSecurityGroupIds:   pulumi.StringArray{dbSg.ID()}`)
	})
}

// Helper function to check if file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
