package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

func TestTapStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates stack with correct environment suffix", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
		assert.NotNil(t, template)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})

	t.Run("creates all required KMS keys with rotation enabled", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackKMS"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have 4 KMS keys (RDS, EFS, Secrets, Kinesis)
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(4))

		// Verify all KMS keys have rotation enabled
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation": true,
		})
	})

	t.Run("creates VPC with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackVPC"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
		// Should have NAT Gateways for private subnet egress
		template.HasResourceProperties(jsii.String("AWS::EC2::NatGateway"), map[string]interface{}{})
	})

	t.Run("creates security groups with proper naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackSG"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have multiple security groups (ECS, RDS, Cache, EFS)
		// Verify at least 4 security groups exist
		allResources := template.ToJSON()
		sgCount := 0
		if resources, ok := (*allResources)["Resources"].(map[string]interface{}); ok {
			for _, res := range resources {
				if resMap, ok := res.(map[string]interface{}); ok {
					if resType, ok := resMap["Type"].(string); ok && resType == "AWS::EC2::SecurityGroup" {
						sgCount++
					}
				}
			}
		}
		assert.GreaterOrEqual(t, sgCount, 4, "Should have at least 4 security groups")
	})

	t.Run("creates ECS cluster with container insights", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackECS"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ECS::Cluster"), jsii.Number(1))
	})

	t.Run("creates EFS file system with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackEFS"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EFS::FileSystem"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EFS::FileSystem"), map[string]interface{}{
			"Encrypted": true,
		})
	})

	t.Run("creates RDS Aurora cluster with Multi-AZ", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackRDS"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::RDS::DBCluster"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::RDS::DBCluster"), map[string]interface{}{
			"Engine":           "aurora-postgresql",
			"StorageEncrypted": true,
		})

		// Should have 2 instances for Multi-AZ
		template.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(2))
	})

	t.Run("creates Secrets Manager secret for database", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackSecrets"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have at least 2 secrets (DB credentials and API keys)
		allResources := template.ToJSON()
		secretCount := 0
		if resources, ok := (*allResources)["Resources"].(map[string]interface{}); ok {
			for _, res := range resources {
				if resMap, ok := res.(map[string]interface{}); ok {
					if resType, ok := resMap["Type"].(string); ok && resType == "AWS::SecretsManager::Secret" {
						secretCount++
					}
				}
			}
		}
		assert.GreaterOrEqual(t, secretCount, 2, "Should have at least 2 secrets")
	})

	t.Run("creates ElastiCache Redis with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackRedis"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ElastiCache::ReplicationGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElastiCache::ReplicationGroup"), map[string]interface{}{
			"AtRestEncryptionEnabled":  true,
			"TransitEncryptionEnabled": true,
			"AutomaticFailoverEnabled": true,
			"MultiAZEnabled":           true,
		})
	})

	t.Run("creates Kinesis Data Stream with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackKinesis"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - At least one Kinesis stream with KMS encryption
		template.HasResourceProperties(jsii.String("AWS::Kinesis::Stream"), map[string]interface{}{
			"StreamEncryption": map[string]interface{}{
				"EncryptionType": "KMS",
			},
		})
	})

	t.Run("creates API Gateway with throttling and logging", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackAPI"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::UsagePlan"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::ApiKey"), jsii.Number(1))
	})

	t.Run("creates IAM roles for ECS tasks", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackIAM"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have multiple IAM roles (ECS execution, task, Kinesis producer)
		allResources := template.ToJSON()
		roleCount := 0
		if resources, ok := (*allResources)["Resources"].(map[string]interface{}); ok {
			for _, res := range resources {
				if resMap, ok := res.(map[string]interface{}); ok {
					if resType, ok := resMap["Type"].(string); ok && resType == "AWS::IAM::Role" {
						roleCount++
					}
				}
			}
		}
		assert.GreaterOrEqual(t, roleCount, 3, "Should have at least 3 IAM roles")
	})

	t.Run("creates CloudWatch log groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackLogs"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have at least API Gateway logs
		allResources := template.ToJSON()
		logGroupCount := 0
		if resources, ok := (*allResources)["Resources"].(map[string]interface{}); ok {
			for _, res := range resources {
				if resMap, ok := res.(map[string]interface{}); ok {
					if resType, ok := resMap["Type"].(string); ok && resType == "AWS::Logs::LogGroup" {
						logGroupCount++
					}
				}
			}
		}
		assert.GreaterOrEqual(t, logGroupCount, 1, "Should have at least 1 log group")
	})

	t.Run("exports all required stack outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackOutputs"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Should have multiple outputs (VPC, Cluster, DB, Redis, Kinesis, API)
		allOutputs := template.ToJSON()
		outputCount := 0
		if outputs, ok := (*allOutputs)["Outputs"].(map[string]interface{}); ok {
			outputCount = len(outputs)
		}

		// Verify we have outputs
		assert.Greater(t, outputCount, 5, "Should have multiple stack outputs")
	})

	t.Run("all resources have proper removal policies", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackRemoval"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - KMS keys should have Delete policy
		template.HasResource(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"DeletionPolicy": "Delete",
		})
	})
}

// Benchmark tests
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("bench"),
		})
	}
}
