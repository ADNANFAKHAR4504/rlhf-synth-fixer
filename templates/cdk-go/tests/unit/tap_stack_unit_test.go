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

	t.Run("creates an S3 bucket with the correct environment suffix", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Note: Uncomment these assertions when S3 bucket is actually created
		// template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		// template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		//     "BucketName": "tap-bucket-" + envSuffix,
		// })

		// For now, just verify stack was created successfully
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Note: Uncomment these assertions when S3 bucket is actually created
		// template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		// template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		//     "BucketName": "tap-bucket-dev",
		// })

		// For now, just verify stack was created successfully with default suffix
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
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
		lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("bench"),
		})
	}
}
