//go:build !integration
// +build !integration

package main

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	stackFile = "tap_stack.go"
)

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func TestFileStructure(t *testing.T) {
	t.Run("tap_stack.go exists and is readable", func(t *testing.T) {
		exists := fileExists(stackFile)
		assert.True(t, exists, "tap_stack.go should exist")

		content, err := os.ReadFile(stackFile)
		require.NoError(t, err)
		assert.Greater(t, len(content), 0, "tap_stack.go should not be empty")
	})

	t.Run("has valid Go package structure", func(t *testing.T) {
		content, err := os.ReadFile(stackFile)
		require.NoError(t, err)
		contentStr := string(content)

		assert.Contains(t, contentStr, "package main")
		assert.Contains(t, contentStr, "func main() {")
		assert.Contains(t, contentStr, "pulumi.Run(")
	})

	t.Run("has required imports", func(t *testing.T) {
		content, err := os.ReadFile(stackFile)
		require.NoError(t, err)
		contentStr := string(content)

		requiredImports := []string{
			`"github.com/pulumi/pulumi/sdk/v3/go/pulumi"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"`,
			`"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"`,
		}

		for _, imp := range requiredImports {
			assert.Contains(t, contentStr, imp)
		}
	})
}

func TestConstants(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("defines region constant", func(t *testing.T) {
		assert.Contains(t, contentStr, `region       = "us-east-1"`)
	})

	t.Run("defines VPC CIDR", func(t *testing.T) {
		assert.Contains(t, contentStr, `vpcCIDR      = "10.0.0.0/16"`)
	})

	t.Run("defines availability zones", func(t *testing.T) {
		assert.Contains(t, contentStr, `az1          = "us-east-1a"`)
		assert.Contains(t, contentStr, `az2          = "us-east-1b"`)
	})
}

func TestHelperFunctions(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("defines sanitizeName function", func(t *testing.T) {
		assert.Contains(t, contentStr, "func sanitizeName(name string) string {")
	})

	t.Run("defines generateDBUsername function", func(t *testing.T) {
		assert.Contains(t, contentStr, "func generateDBUsername(length int) (string, error) {")
	})

	t.Run("defines generateDBPassword function", func(t *testing.T) {
		assert.Contains(t, contentStr, "func generateDBPassword(length int) (string, error) {")
	})
}

func TestVPCResources(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates VPC", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpc(ctx, "iot-vpc"`)
		assert.Contains(t, contentStr, `EnableDnsHostnames: pulumi.Bool(true)`)
	})

	t.Run("creates Internet Gateway", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewInternetGateway(ctx, "iot-igw"`)
	})

	t.Run("creates subnets", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewSubnet(ctx, "public-subnet-1"`)
		assert.Contains(t, contentStr, `ec2.NewSubnet(ctx, "private-subnet-1"`)
	})

	t.Run("creates NAT Gateway", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewNatGateway(ctx, "nat-gw"`)
	})
}

func TestVPCEndpoints(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates S3 Gateway Endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "s3-endpoint"`)
	})

	t.Run("creates Secrets Manager Endpoint", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "secretsmanager-endpoint"`)
	})

	t.Run("creates ECR Endpoints", func(t *testing.T) {
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "ecr-api-endpoint"`)
		assert.Contains(t, contentStr, `ec2.NewVpcEndpoint(ctx, "ecr-dkr-endpoint"`)
	})
}

func TestSecurityGroups(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	securityGroups := []string{"api-sg", "alb-sg", "ecs-sg", "vpce-sg", "redis-sg", "db-sg"}

	for _, sg := range securityGroups {
		t.Run("creates "+sg, func(t *testing.T) {
			assert.Contains(t, contentStr, `ec2.NewSecurityGroup(ctx, "`+sg+`"`)
		})
	}
}

func TestDatabaseResources(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates Secrets Manager secret", func(t *testing.T) {
		assert.Contains(t, contentStr, `secretsmanager.NewSecret(ctx, "db-secret"`)
	})

	t.Run("creates RDS instance", func(t *testing.T) {
		assert.Contains(t, contentStr, `rds.NewInstance(ctx, "iot-db"`)
		assert.Contains(t, contentStr, `Engine:                pulumi.String("postgres")`)
	})

	t.Run("creates ElastiCache Redis", func(t *testing.T) {
		assert.Contains(t, contentStr, `elasticache.NewReplicationGroup(ctx, "redis-cluster"`)
	})
}

func TestECSResources(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates ECS cluster", func(t *testing.T) {
		assert.Contains(t, contentStr, `ecs.NewCluster(ctx, "iot-cluster"`)
	})

	t.Run("creates task definition", func(t *testing.T) {
		assert.Contains(t, contentStr, `ecs.NewTaskDefinition(ctx, "iot-task"`)
	})

	t.Run("creates ECS service", func(t *testing.T) {
		assert.Contains(t, contentStr, `ecs.NewService(ctx, "iot-service"`)
	})
}

func TestALBResources(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates ALB", func(t *testing.T) {
		assert.Contains(t, contentStr, `lb.NewLoadBalancer(ctx, "iot-alb"`)
	})

	t.Run("creates target group", func(t *testing.T) {
		assert.Contains(t, contentStr, `lb.NewTargetGroup(ctx, "ecs-target-group"`)
	})

	t.Run("creates listener", func(t *testing.T) {
		assert.Contains(t, contentStr, `lb.NewListener(ctx, "alb-listener"`)
	})
}

func TestAPIGatewayResources(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	t.Run("creates REST API", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewRestApi(ctx, "iot-api"`)
	})

	t.Run("creates API resource", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewResource(ctx, "api-resource"`)
	})

	t.Run("creates API method", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewMethod(ctx, "api-method"`)
	})

	t.Run("creates API integration", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewIntegration(ctx, "api-integration"`)
		assert.Contains(t, contentStr, `Type:                  pulumi.String("HTTP_PROXY")`)
	})

	t.Run("creates deployment", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewDeployment(ctx, "api-deployment"`)
	})

	t.Run("creates stage", func(t *testing.T) {
		assert.Contains(t, contentStr, `apigateway.NewStage(ctx, "api-stage"`)
	})
}

func TestExports(t *testing.T) {
	content, err := os.ReadFile(stackFile)
	require.NoError(t, err)
	contentStr := string(content)

	exports := []string{
		"vpcId", "albDnsName", "apiGatewayUrl", "rdsEndpoint", "redisEndpoint",
		"ecsClusterName", "ecrRepositoryUrl", "s3EndpointId",
	}

	for _, export := range exports {
		t.Run("exports "+export, func(t *testing.T) {
			assert.Contains(t, contentStr, `ctx.Export("`+export+`"`)
		})
	}
}
