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

func TestFileStructureAndSyntax(t *testing.T) {
	t.Run("tap_stack.go_exists_and_is_readable", func(t *testing.T) {
		filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
		content, err := os.ReadFile(filePath)
		assert.True(t, err == nil, "tap_stack.go should exist and be readable")
		assert.NotEmpty(t, content, "tap_stack.go should not be empty")
	})

	t.Run("has_valid_Go_syntax_structure", func(t *testing.T) {
		filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
		content, err := os.ReadFile(filePath)
		require.NoError(t, err)

		// Check for required imports
		assert.Contains(t, content, "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2")
		assert.Contains(t, content, "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds")
		assert.Contains(t, content, "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/alb")
		assert.Contains(t, content, "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/wafv2")
		assert.Contains(t, content, "github.com/pulumi/pulumi/sdk/v3/go/pulumi")
	})

	t.Run("uses_environment_variables_for_configuration", func(t *testing.T) {
		filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
		content, err := os.ReadFile(filePath)
		require.NoError(t, err)

		// Check for configuration usage
		assert.Contains(t, content, "config.New(ctx, \"\")")
		assert.Contains(t, content, "cfg.Require(\"projectName\")")
		assert.Contains(t, content, "cfg.Require(\"environment\")")
		assert.Contains(t, content, "cfg.RequireSecret(\"dbPassword\")")
	})
}

func TestVariableDefinitions(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("defines_required_variables", func(t *testing.T) {
		assert.Contains(t, content, "projectName := cfg.Require(\"projectName\")")
		assert.Contains(t, content, "environment := cfg.Require(\"environment\")")
		assert.Contains(t, content, "region := \"us-west-2\"")
	})

	t.Run("defines_common_tags", func(t *testing.T) {
		assert.Contains(t, content, "commonTags := pulumi.StringMap{")
		assert.Contains(t, content, "\"Project\":")
		assert.Contains(t, content, "\"Environment\":")
		assert.Contains(t, content, "\"ManagedBy\":")
	})
}

func TestVPCAndNetworkingResources(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_vpc_with_correct_cidr", func(t *testing.T) {
		assert.Contains(t, content, "CidrBlock:          pulumi.String(\"10.0.0.0/16\")")
		assert.Contains(t, content, "EnableDnsHostnames: pulumi.Bool(true)")
		assert.Contains(t, content, "EnableDnsSupport:   pulumi.Bool(true)")
	})

	t.Run("creates_public_subnets", func(t *testing.T) {
		assert.Contains(t, content, "publicSubnets := make([]*ec2.Subnet, 2)")
		assert.Contains(t, content, "MapPublicIpOnLaunch: pulumi.Bool(true)")
	})

	t.Run("creates_private_subnets", func(t *testing.T) {
		assert.Contains(t, content, "privateSubnets := make([]*ec2.Subnet, 2)")
	})

	t.Run("creates_internet_gateway", func(t *testing.T) {
		assert.Contains(t, content, "ec2.NewInternetGateway")
	})

	t.Run("creates_nat_gateway", func(t *testing.T) {
		assert.Contains(t, content, "ec2.NewNatGateway")
		assert.Contains(t, content, "ec2.NewEip")
	})
}

func TestSecurityGroups(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_bastion_security_group", func(t *testing.T) {
		assert.Contains(t, content, "bastionSg, err := ec2.NewSecurityGroup")
		assert.Contains(t, content, "FromPort:   pulumi.Int(22)")
		assert.Contains(t, content, "ToPort:     pulumi.Int(22)")
	})

	t.Run("creates_app_security_group", func(t *testing.T) {
		assert.Contains(t, content, "appSg, err := ec2.NewSecurityGroup")
		assert.Contains(t, content, "FromPort:       pulumi.Int(80)")
		assert.Contains(t, content, "FromPort:       pulumi.Int(443)")
	})

	t.Run("creates_alb_security_group", func(t *testing.T) {
		assert.Contains(t, content, "albSg, err := ec2.NewSecurityGroup")
	})

	t.Run("creates_rds_security_group", func(t *testing.T) {
		assert.Contains(t, content, "rdsSg, err := ec2.NewSecurityGroup")
		assert.Contains(t, content, "FromPort:       pulumi.Int(3306)")
		assert.Contains(t, content, "ToPort:         pulumi.Int(3306)")
	})
}

func TestRDSConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_rds_subnet_group", func(t *testing.T) {
		assert.Contains(t, content, "rds.NewSubnetGroup")
	})

	t.Run("creates_rds_parameter_group", func(t *testing.T) {
		assert.Contains(t, content, "rds.NewParameterGroup")
		assert.Contains(t, content, "Family: pulumi.String(\"mysql8.0\")")
	})

	t.Run("creates_rds_instance_with_security", func(t *testing.T) {
		assert.Contains(t, content, "rds.NewInstance")
		assert.Contains(t, content, "Engine:                pulumi.String(\"mysql\")")
		assert.Contains(t, content, "EngineVersion:         pulumi.String(\"8.0.35\")")
		assert.Contains(t, content, "StorageEncrypted:      pulumi.Bool(true)")
		assert.Contains(t, content, "MultiAz:               pulumi.Bool(true)")
		assert.Contains(t, content, "BackupRetentionPeriod: pulumi.Int(7)")
	})
}

func TestLoadBalancerConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_alb", func(t *testing.T) {
		assert.Contains(t, content, "alb.NewLoadBalancer")
		assert.Contains(t, content, "LoadBalancerType:   pulumi.String(\"application\")")
		assert.Contains(t, content, "Internal:           pulumi.Bool(false)")
	})

	t.Run("creates_target_group", func(t *testing.T) {
		assert.Contains(t, content, "alb.NewTargetGroup")
		assert.Contains(t, content, "Protocol:   pulumi.String(\"HTTP\")")
		assert.Contains(t, content, "TargetType: pulumi.String(\"instance\")")
	})

	t.Run("creates_alb_listener", func(t *testing.T) {
		assert.Contains(t, content, "alb.NewListener")
		assert.Contains(t, content, "Port:            pulumi.Int(80)")
		assert.Contains(t, content, "Protocol:        pulumi.String(\"HTTP\")")
	})
}

func TestAutoScalingConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_launch_template", func(t *testing.T) {
		assert.Contains(t, content, "ec2.NewLaunchTemplate")
		assert.Contains(t, content, "InstanceType: pulumi.String(\"t3.micro\")")
	})

	t.Run("creates_auto_scaling_group", func(t *testing.T) {
		assert.Contains(t, content, "autoscaling.NewGroup")
		assert.Contains(t, content, "DesiredCapacity:     pulumi.Int(2)")
		assert.Contains(t, content, "MaxSize:             pulumi.Int(4)")
		assert.Contains(t, content, "MinSize:             pulumi.Int(1)")
	})
}

func TestBastionHost(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_bastion_instance", func(t *testing.T) {
		assert.Contains(t, content, "ec2.NewInstance")
		assert.Contains(t, content, "InstanceType:  pulumi.String(\"t3.micro\")")
	})
}

func TestWAFConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_waf_web_acl", func(t *testing.T) {
		assert.Contains(t, content, "wafv2.NewWebAcl")
		assert.Contains(t, content, "Scope:       pulumi.String(\"REGIONAL\")")
	})

	t.Run("creates_waf_association", func(t *testing.T) {
		assert.Contains(t, content, "wafv2.NewWebAclAssociation")
	})
}

func TestMonitoringAndLogging(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_cloudtrail", func(t *testing.T) {
		assert.Contains(t, content, "cloudtrail.NewTrail")
		assert.Contains(t, content, "IncludeGlobalServiceEvents: pulumi.Bool(true)")
		assert.Contains(t, content, "IsMultiRegionTrail:        pulumi.Bool(true)")
	})

	t.Run("creates_cloudwatch_alarms", func(t *testing.T) {
		assert.Contains(t, content, "cloudwatch.NewMetricAlarm")
		assert.Contains(t, content, "MetricName:         pulumi.String(\"CPUUtilization\")")
		assert.Contains(t, content, "Namespace:          pulumi.String(\"AWS/RDS\")")
	})
}

func TestIAMConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_ec2_role", func(t *testing.T) {
		assert.Contains(t, content, "iam.NewRole")
		assert.Contains(t, content, "sts:AssumeRole")
	})

	t.Run("creates_instance_profile", func(t *testing.T) {
		assert.Contains(t, content, "iam.NewInstanceProfile")
	})

	t.Run("creates_cloudwatch_policy", func(t *testing.T) {
		assert.Contains(t, content, "iam.NewPolicy")
		assert.Contains(t, content, "logs:CreateLogGroup")
	})
}

func TestKMSConfiguration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_kms_key", func(t *testing.T) {
		assert.Contains(t, content, "kms.NewKey")
		assert.Contains(t, content, "EnableKeyRotation:   pulumi.Bool(true)")
	})
}

func TestS3Configuration(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("creates_alb_logs_bucket", func(t *testing.T) {
		assert.Contains(t, content, "s3.NewBucket")
		assert.Contains(t, content, "alb-logs")
	})

	t.Run("creates_cloudtrail_bucket", func(t *testing.T) {
		assert.Contains(t, content, "cloudtrail-bucket")
	})
}

func TestExports(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("exports_required_values", func(t *testing.T) {
		assert.Contains(t, content, "ctx.Export(\"vpcId\", vpc.ID())")
		assert.Contains(t, content, "ctx.Export(\"rdsEndpoint\", rdsInstance.Endpoint)")
		assert.Contains(t, content, "ctx.Export(\"albDnsName\", alb.DnsName)")
		assert.Contains(t, content, "ctx.Export(\"bastionPublicIp\", bastionInstance.PublicIp)")
		assert.Contains(t, content, "ctx.Export(\"kmsKeyArn\", kmsKey.Arn)")
		assert.Contains(t, content, "ctx.Export(\"wafWebAclArn\", wafWebAcl.Arn)")
	})
}

func TestNamingConventions(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("uses_consistent_naming", func(t *testing.T) {
		assert.Contains(t, content, "fmt.Sprintf(\"%s-vpc\", projectName)")
		assert.Contains(t, content, "fmt.Sprintf(\"%s-alb\", projectName)")
		assert.Contains(t, content, "fmt.Sprintf(\"%s-rds\", projectName)")
	})
}

func TestCommonTags(t *testing.T) {
	filePath := filepath.Join("..", "..", "lib", "tap_stack.go")
	content, err := os.ReadFile(filePath)
	require.NoError(t, err)

	t.Run("applies_common_tags_to_resources", func(t *testing.T) {
		assert.Contains(t, content, "Tags:               commonTags")
		assert.Contains(t, content, "Tags:  commonTags")
	})
}
