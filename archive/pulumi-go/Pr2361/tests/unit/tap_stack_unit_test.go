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
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"`)
		assert.Contains(t, contentStr, `"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"`)

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
		assert.Contains(t, contentStr, `getEnvOrDefault("ENVIRONMENT", "dev")`)
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
}

func TestSecurityGroups(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates VPC endpoints security group", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, "vpc-endpoints"`)
		assert.Contains(t, contentStr, `"Security group for VPC endpoints"`)
	})

	t.Run("has proper ingress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `FromPort:    pulumi.Int(443)`)
		assert.Contains(t, contentStr, `Protocol:    pulumi.String("tcp")`)
	})

	t.Run("has proper egress rules", func(t *testing.T) {
		assert.Contains(t, contentStr, `Protocol:    pulumi.String("-1")`)
		assert.Contains(t, contentStr, `CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")}`)
	})
}

func TestVpcEndpoints(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates S3 VPC endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "s3"`)
		assert.Contains(t, contentStr, `VpcEndpointType: pulumi.String("Gateway")`)
	})

	t.Run("creates KMS VPC endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "kms"`)
		assert.Contains(t, contentStr, `VpcEndpointType:   pulumi.String("Interface")`)
	})

	t.Run("creates CloudTrail VPC endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "cloudtrail"`)
	})

	t.Run("creates CloudWatch Logs VPC endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "logs"`)
	})
}

func TestS3Buckets(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates CloudTrail logs bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, "cloudtrail-logs"`)
		assert.Contains(t, contentStr, `cloudtrail-logs`)
	})

	t.Run("creates application data bucket", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucket(ctx, "app-data"`)
		assert.Contains(t, contentStr, `app-data`)
	})

	t.Run("configures bucket encryption", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketServerSideEncryptionConfigurationV2`)
		assert.Contains(t, contentStr, `KmsMasterKeyId: kmsKey.Arn`)
		assert.Contains(t, contentStr, `SseAlgorithm:   pulumi.String("aws:kms")`)
	})

	t.Run("configures bucket public access block", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketPublicAccessBlock`)
		assert.Contains(t, contentStr, `BlockPublicAcls:       pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `BlockPublicPolicy:     pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `IgnorePublicAcls:      pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `RestrictPublicBuckets: pulumi.Bool(true)`)
	})

	t.Run("configures bucket versioning", func(t *testing.T) {
		assert.Contains(t, contentStr, `s3.NewBucketVersioningV2`)
		assert.Contains(t, contentStr, `Status: pulumi.String("Enabled")`)
	})
}

func TestKMSKeys(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates KMS key", func(t *testing.T) {
		assert.Contains(t, contentStr, `kms.NewKey(ctx, "main"`)
		assert.Contains(t, contentStr, `DeletionWindowInDays:  pulumi.Int(7)`)
		assert.Contains(t, contentStr, `EnableKeyRotation:     pulumi.Bool(true)`)
		assert.Contains(t, contentStr, `CustomerMasterKeySpec: pulumi.String("SYMMETRIC_DEFAULT")`)
	})

	t.Run("creates KMS alias", func(t *testing.T) {
		assert.Contains(t, contentStr, `kms.NewAlias(ctx, "main"`)
		assert.Contains(t, contentStr, `TargetKeyId: kmsKey.KeyId`)
	})
}

func TestIAMRoles(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates developer role", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewRole(ctx, "developer"`)
		assert.Contains(t, contentStr, `developer-role`)
	})

	t.Run("creates developer policy", func(t *testing.T) {
		assert.Contains(t, contentStr, `iam.NewRolePolicy(ctx, "developer-policy"`)
		assert.Contains(t, contentStr, `"s3:GetObject"`)
		assert.Contains(t, contentStr, `"s3:PutObject"`)
		assert.Contains(t, contentStr, `"s3:ListBucket"`)
		assert.Contains(t, contentStr, `"kms:Decrypt"`)
		assert.Contains(t, contentStr, `"kms:GenerateDataKey"`)
	})

	t.Run("has proper assume role policy", func(t *testing.T) {
		assert.Contains(t, contentStr, `"sts:AssumeRole"`)
		assert.Contains(t, contentStr, `"sts:ExternalId": "developer-access"`)
	})
}

func TestCloudWatchLogs(t *testing.T) {
	content, err := os.ReadFile(filepath.Join(".", "tap_stack.go"))
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates CloudTrail log group", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewLogGroup(ctx, "cloudtrail"`)
		assert.Contains(t, contentStr, `RetentionInDays: pulumi.Int(2557)`)
	})

	t.Run("creates application log group", func(t *testing.T) {
		assert.Contains(t, contentStr, `cloudwatch.NewLogGroup(ctx, "application"`)
		assert.Contains(t, contentStr, `RetentionInDays: pulumi.Int(90)`)
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

	t.Run("exports KMS key information", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("kms_key_id", kmsKey.KeyId)`)
		assert.Contains(t, contentStr, `ctx.Export("kms_key_arn", kmsKey.Arn)`)
	})

	t.Run("exports S3 bucket names", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("cloudtrail_logs_bucket"`)
		assert.Contains(t, contentStr, `ctx.Export("app_data_bucket"`)
	})

	t.Run("exports IAM roles", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("iam_roles"`)
	})

	t.Run("exports VPC endpoints", func(t *testing.T) {
		assert.Contains(t, contentStr, `ctx.Export("vpc_endpoints"`)
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
		assert.Contains(t, contentStr, `-vpc-endpoints-sg`)
		assert.Contains(t, contentStr, `-cloudtrail-logs`)
		assert.Contains(t, contentStr, `-app-data`)
		assert.Contains(t, contentStr, `-developer-role`)
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

// Helper function to check if file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
