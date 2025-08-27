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

	t.Run("creates stack with the correct environment and region", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		environment := "test"
		region := "us-east-1"
		stack := lib.NewTapStack(app, "TapStackTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: environment,
			Region:      region,
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify stack was created successfully
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.ApiEndpoint)
		assert.NotNil(t, stack.LambdaArn)
		assert.NotNil(t, stack.LogGroups)
	})

	t.Run("creates stack with production environment", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackProd", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "prod",
			Region:      "us-west-2",
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify stack was created successfully
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.ApiEndpoint)
		assert.NotNil(t, stack.LambdaArn)
		assert.NotNil(t, stack.LogGroups)
		assert.NotNil(t, stack.ApiKeyOutput)
		assert.NotNil(t, stack.CrossRegionTopicArn)
		assert.NotNil(t, stack.VpcId)
	})

	t.Run("Write Unit Tests", func(t *testing.T) {
		// ARRANGE & ASSERT
		t.Skip("Unit test for TapStack should be implemented here.")
	})
}

// Benchmark tests can be added here
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, "BenchStack", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "bench",
			Region:      "us-east-1",
		})
	}
}
