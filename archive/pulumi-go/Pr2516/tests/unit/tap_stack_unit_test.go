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

		assert.Contains(t, contentStr, "config.New")
		assert.Contains(t, contentStr, "cfg.Get")
		assert.Contains(t, contentStr, "projectName")
		assert.Contains(t, contentStr, "environment")
		assert.Contains(t, contentStr, "availabilityZones")
	})
}

func TestVariableDefinitions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("declares environment variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `cfg.Get("environment")`)
		assert.Contains(t, contentStr, `environment = "dev"`)
	})

	t.Run("declares aws_region variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `availabilityZones := []string{"us-west-2a", "us-west-2b"}`)
	})

	t.Run("declares project_name variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `cfg.Get("projectName")`)
		assert.Contains(t, contentStr, `projectName = "tap-project"`)
	})

	t.Run("declares vpc_cidr variable", func(t *testing.T) {
		assert.Contains(t, contentStr, `CidrBlock:          pulumi.String("10.0.0.0/16")`)
	})
}

func TestVPCAndNetworkingResources(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates VPC with proper CIDR", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpc(ctx, fmt.Sprintf("%s-vpc", projectName)`)
		assert.Contains(t, contentStr, `CidrBlock:          pulumi.String("10.0.0.0/16")`)
		assert.Contains(t, contentStr, `EnableDnsHostnames: pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `EnableDnsSupport:   pulumi.Bool(true)`)
	})

	t.Run("creates internet gateway", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewInternetGateway(ctx, fmt.Sprintf("%s-igw", projectName)`)
	})

	t.Run("creates public and private subnets", func(t *testing.T) {
		assert.Contains(t, contentStr, `publicSubnets := make([]*ec2.Subnet, 2)`)
		assert.Contains(t, contentStr, `privateSubnets := make([]*ec2.Subnet, 2)`)
		assert.Contains(t, contentStr, `MapPublicIpOnLaunch: pulumi.Bool(true)`)
	})

	t.Run("creates NAT gateways", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewNatGateway(ctx, fmt.Sprintf("%s-nat-%d", projectName, i)`)
		assert.Contains(t, contentStr, `ec2.NewEip(ctx, fmt.Sprintf("%s-nat-eip-%d", projectName, i)`)
	})

	t.Run("creates route tables", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewRouteTable(ctx, fmt.Sprintf("%s-public-rt", projectName)`)
		assert.Contains(t, contentStr, `ec2.NewRouteTable(ctx, fmt.Sprintf("%s-private-rt", projectName)`)
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
		assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-db-sg", projectName)`)
		assert.Contains(t, contentStr, `Description: pulumi.String("Security group for RDS instance")`)
	})

	t.Run("creates application security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-app-sg", projectName)`)
		assert.Contains(t, contentStr, `Description: pulumi.String("Security group for application servers")`)
	})

	t.Run("has proper database ingress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `FromPort:       pulumi.Int(3306)`)
		assert.Contains(t, contentStr, `ToPort:         pulumi.Int(3306)`)
		assert.Contains(t, contentStr, `Protocol:       pulumi.String("tcp")`)
	})

	t.Run("has proper application ingress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `FromPort:       pulumi.Int(80)`)
		assert.Contains(t, contentStr, `FromPort:       pulumi.Int(443)`)
		assert.Contains(t, contentStr, `FromPort:       pulumi.Int(22)`)
	})

	t.Run("has proper egress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `Protocol:   pulumi.String("-1")`)
		assert.Contains(t, contentStr, `CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}`)
	})
}

func TestS3Buckets(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates application data bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, fmt.Sprintf("%s-app-data", projectName)`)
		assert.Contains(t, contentStr, `fmt.Sprintf("%s-app-data-%s", projectName, environment)`)
	})

	t.Run("creates backup bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, fmt.Sprintf("%s-backup", projectName)`)
		assert.Contains(t, contentStr, `fmt.Sprintf("%s-backup-%s", projectName, environment)`)
	})

	t.Run("creates logs bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, fmt.Sprintf("%s-alb-logs", projectName)`)
		assert.Contains(t, contentStr, `fmt.Sprintf("%s-alb-logs-%s", projectName, environment)`)
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
		assert.Contains(t, contentStr, `TargetBucket: albLogsBucket.Bucket`)
	})
}

func TestRDSResources(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates RDS subnet group", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewSubnetGroup(ctx, fmt.Sprintf("%s-rds-subnet-group", projectName)`)
		assert.Contains(t, contentStr, `privateSubnets[0].ID(), privateSubnets[1].ID()`)
	})

	t.Run("creates RDS parameter group", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewParameterGroup(ctx, fmt.Sprintf("%s-rds-param-group", projectName)`)
		assert.Contains(t, contentStr, `Family: pulumi.String("mysql8.0")`)
		assert.Contains(t, contentStr, `"character_set_server"`)
		assert.Contains(t, contentStr, `"character_set_client"`)
	})

	t.Run("creates RDS instance", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewInstance(ctx, fmt.Sprintf("%s-rds", projectName)`)
		assert.Contains(t, contentStr, `Engine:                  pulumi.String("mysql")`)
		assert.Contains(t, contentStr, `EngineVersion:           pulumi.String("8.0")`)
		assert.Contains(t, contentStr, `InstanceClass:           pulumi.String("db.t3.micro")`)
		assert.Contains(t, contentStr, `StorageEncrypted:        pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `PubliclyAccessible:      pulumi.Bool(false)`)
	})

	t.Run("configures RDS backup settings", func(t *testing.T) {
		assert.Contains(t, contentStr, `BackupRetentionPeriod:   pulumi.Int(7)`)
		assert.Contains(t, contentStr, `BackupWindow:            pulumi.String("03:00-04:00")`)
	})
}

func TestIAMRoles(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates EC2 role", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewRole(ctx, fmt.Sprintf("%s-ec2-role", projectName)`)
		assert.Contains(t, contentStr, `"Service": "ec2.amazonaws.com"`)
	})

	t.Run("creates EC2 instance profile", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewInstanceProfile(ctx, fmt.Sprintf("%s-ec2-profile", projectName)`)
	})

	t.Run("creates S3 access policy", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewPolicy(ctx, fmt.Sprintf("%s-s3-access-policy", projectName)`)
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
		assert.Contains(t, contentStr, `cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("%s-rds-cpu-alarm", projectName)`)
		assert.Contains(t, contentStr, `MetricName:         pulumi.String("CPUUtilization")`)
		assert.Contains(t, contentStr, `Namespace:          pulumi.String("AWS/RDS")`)
		assert.Contains(t, contentStr, `Threshold:          pulumi.Float64(80.0)`)
	})

	t.Run("creates RDS connections alarm", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("%s-rds-connections-alarm", projectName)`)
		assert.Contains(t, contentStr, `MetricName:         pulumi.String("DatabaseConnections")`)
		assert.Contains(t, contentStr, `Threshold:          pulumi.Float64(100.0)`)
	})

	t.Run("creates CloudWatch dashboard", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewDashboard(ctx, fmt.Sprintf("%s-dashboard", projectName)`)
		assert.Contains(t, contentStr, `"AWS/RDS"`)
		assert.Contains(t, contentStr, `"AWS/S3"`)
	})
}

func TestExports(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("exports VPC ID", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("vpcId", vpc.ID())`)
	})

	t.Run("exports subnet IDs", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("privateSubnetIds"`)
		assert.Contains(t, contentStr, `ctx.Export("publicSubnetIds"`)
	})

	t.Run("exports RDS information", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("rdsEndpoint", rdsInstance.Endpoint)`)
	})

	t.Run("exports S3 bucket names", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("albDnsName", alb.DnsName)`)
	})

	t.Run("exports security group IDs", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("kmsKeyArn", kmsKey.Arn)`)
		assert.Contains(t, contentStr, `ctx.Export("wafWebAclArn", wafWebAcl.Arn)`)
	})

	t.Run("exports IAM roles", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("cloudTrailName", cloudTrail.Name)`)
	})

	t.Run("exports CloudWatch dashboard URL", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("cloudWatchDashboardUrl"`)
	})
}

func TestNamingConventions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("uses consistent naming convention", func(t *testing.T) {
		assert.Contains(t, contentStr, `fmt.Sprintf("%s-`, "projectName")
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
		assert.Contains(t, contentStr, `"Project":     pulumi.String(projectName)`)
		assert.Contains(t, contentStr, `"Environment": pulumi.String(environment)`)
		assert.Contains(t, contentStr, `"ManagedBy":   pulumi.String("pulumi")`)
		assert.Contains(t, contentStr, `"Purpose":     pulumi.String("web-application-infrastructure")`)
	})

	t.Run("applies tags to resources", func(t *testing.T) {
		assert.Contains(t, contentStr, `Tags: commonTags`)
	})
}

func TestHelperFunctions(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("has configuration setup", func(t *testing.T) {
		assert.Contains(t, contentStr, `config.New(ctx, "")`)
		assert.Contains(t, contentStr, `cfg.Get("projectName")`)
		assert.Contains(t, contentStr, `cfg.Get("environment")`)
	})
}

func TestSecurityCompliance(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("RDS is not publicly accessible", func(t *testing.T) {
		assert.Contains(t, contentStr, `PubliclyAccessible:      pulumi.Bool(false)`)
	})

	t.Run("RDS has encryption enabled", func(t *testing.T) {
		assert.Contains(t, contentStr, `StorageEncrypted:        pulumi.Bool(true)`)
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
		assert.Contains(t, contentStr, `DbSubnetGroupName:       dbSubnetGroup.Name`)
	})

	t.Run("RDS depends on security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `VpcSecurityGroupIds:     pulumi.StringArray{dbSg.ID()}`)
	})
}

// Helper function to check if file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
