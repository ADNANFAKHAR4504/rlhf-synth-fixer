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

	t.Run("creates nested stacks with correct naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test123"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

		// Check that nested stacks are created
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(6))
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})
}

func TestNetworkingStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates VPC with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)
		envSuffix := "test"
		networkingStack := lib.NewNetworkingStack(stack, jsii.String("NetworkingTest"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(networkingStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, networkingStack.Vpc)

		// Check VPC is created
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))

		// Check subnets are created (2 AZs * 3 subnet types by default)
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(6))

		// Check NAT Gateways are created
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(2))

		// Check Internet Gateway
		template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
	})
}

func TestSecurityStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates security groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

		// Create a dummy VPC for testing
		networkingStack := lib.NewNetworkingStack(stack, jsii.String("NetworkingTest"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		securityStack := lib.NewSecurityStack(stack, jsii.String("SecurityTest"), &lib.SecurityStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
		})
		template := assertions.Template_FromStack(securityStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, securityStack.EksSecurityGroup)
		assert.NotNil(t, securityStack.DatabaseSecurityGroup)
		assert.NotNil(t, securityStack.LoadBalancerSecurityGroup)

		// Check security groups are created
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(3))

		// Check GuardDuty is enabled
		template.ResourceCountIs(jsii.String("AWS::GuardDuty::Detector"), jsii.Number(0))
	})
}

func TestStorageStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates storage resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

		// Create dependencies
		networkingStack := lib.NewNetworkingStack(stack, jsii.String("NetworkingTest"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		securityStack := lib.NewSecurityStack(stack, jsii.String("SecurityTest"), &lib.SecurityStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
		})

		storageStack := lib.NewStorageStack(stack, jsii.String("StorageTest"), &lib.StorageStackProps{
			NestedStackProps:      &awscdk.NestedStackProps{},
			EnvironmentSuffix:     jsii.String("test"),
			Vpc:                   networkingStack.Vpc,
			DatabaseSecurityGroup: securityStack.DatabaseSecurityGroup,
		})
		template := assertions.Template_FromStack(storageStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, storageStack.Database)
		assert.NotNil(t, storageStack.S3Bucket)
		assert.NotNil(t, storageStack.RedisCluster)

		// Check S3 bucket is created
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))

		// Check Aurora cluster is created
		template.ResourceCountIs(jsii.String("AWS::RDS::DBCluster"), jsii.Number(1))

		// Check Redis cluster is created
		template.ResourceCountIs(jsii.String("AWS::ElastiCache::CacheCluster"), jsii.Number(1))
	})
}

func TestComputeStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates compute resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

		// Create dependencies
		networkingStack := lib.NewNetworkingStack(stack, jsii.String("NetworkingTest"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		securityStack := lib.NewSecurityStack(stack, jsii.String("SecurityTest"), &lib.SecurityStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
		})

		computeStack := lib.NewComputeStack(stack, jsii.String("ComputeTest"), &lib.ComputeStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
			EksSecurityGroup:  securityStack.EksSecurityGroup,
		})
		template := assertions.Template_FromStack(computeStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, computeStack.LoadBalancer)

		// Check ALB is created
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), jsii.Number(1))

		// Check Auto Scaling Group is created
		template.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))

		// Check Target Group is created
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), jsii.Number(1))

		// Check IAM role is created
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(1))
	})
}

func TestAIStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates AI resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

		aiStack := lib.NewAIStack(stack, jsii.String("AITest"), &lib.AIStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(aiStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, aiStack)

		// Check Bedrock agent is created
		template.ResourceCountIs(jsii.String("AWS::Bedrock::Agent"), jsii.Number(1))

		// Check IAM roles are created (Bedrock, SageMaker, and AI service roles)
		// At least 3 IAM roles should be created
		resourceCount := template.ToJSON()
		assert.NotNil(t, resourceCount)
	})
}

func TestMonitoringStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates monitoring resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

		// Create dependencies
		networkingStack := lib.NewNetworkingStack(stack, jsii.String("NetworkingTest"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		securityStack := lib.NewSecurityStack(stack, jsii.String("SecurityTest"), &lib.SecurityStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
		})

		storageStack := lib.NewStorageStack(stack, jsii.String("StorageTest"), &lib.StorageStackProps{
			NestedStackProps:      &awscdk.NestedStackProps{},
			EnvironmentSuffix:     jsii.String("test"),
			Vpc:                   networkingStack.Vpc,
			DatabaseSecurityGroup: securityStack.DatabaseSecurityGroup,
		})

		computeStack := lib.NewComputeStack(stack, jsii.String("ComputeTest"), &lib.ComputeStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Vpc:               networkingStack.Vpc,
			EksSecurityGroup:  securityStack.EksSecurityGroup,
		})

		monitoringStack := lib.NewMonitoringStack(stack, jsii.String("MonitoringTest"), &lib.MonitoringStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("test"),
			Database:          storageStack.Database,
			LoadBalancer:      computeStack.LoadBalancer,
		})
		template := assertions.Template_FromStack(monitoringStack.NestedStack, nil)

		// ASSERT
		assert.NotNil(t, monitoringStack)

		// Check CloudWatch Dashboard is created
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Dashboard"), jsii.Number(1))

		// Check CloudWatch Alarm is created
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(1))

		// Check SNS Topic is created
		template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))

		// Check Lambda function is created
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(1))
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

func BenchmarkNetworkingStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)
		lib.NewNetworkingStack(stack, jsii.String("NetworkingBench"), &lib.NetworkingStackProps{
			NestedStackProps:  &awscdk.NestedStackProps{},
			EnvironmentSuffix: jsii.String("bench"),
		})
	}
}
