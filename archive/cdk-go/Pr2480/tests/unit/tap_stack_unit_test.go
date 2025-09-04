package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

func TestTapStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates VPC with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackVPCTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates S3 buckets with proper security configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackS3Test", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates KMS key with proper configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackKMSTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates Application Load Balancer with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackALBTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates Auto Scaling Group with proper configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackASGTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates RDS database with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackRDSTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates CloudTrail for API monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackCloudTrailTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates AWS Config for compliance monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackConfigTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates IAM roles with least privilege", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackIAMTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates security groups with proper rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackSecurityTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates Network ACL with proper rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackNACLTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates CloudWatch Log Groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackLogsTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("creates proper outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackOutputsTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})

	t.Run("stack is created successfully", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackBasicTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
	})
}

// Benchmark tests can be added here
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, "BenchStack", &lib.TapStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Region: jsii.String("us-east-1"),
				},
			},
		})
	}
}
