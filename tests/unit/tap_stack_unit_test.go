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
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

		// Verify S3 bucket exists with correct name
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "cicd-artifacts-" + envSuffix,
		})
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)

		// Verify default environment suffix is used
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "cicd-artifacts-dev",
		})
	})

	t.Run("creates SNS topic with correct name", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackSNS"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::SNS::Topic"), map[string]interface{}{
			"TopicName":   "pipeline-notifications-" + envSuffix,
			"DisplayName": "CI/CD Pipeline Notifications",
		})
	})

	t.Run("creates CloudWatch log group with correct retention", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackLogs"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName":    "/aws/codebuild/build-project-" + envSuffix,
			"RetentionInDays": float64(7),
		})
	})

	t.Run("creates CodeBuild project with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackCodeBuild"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CodeBuild::Project"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::CodeBuild::Project"), map[string]interface{}{
			"Name":             "build-project-" + envSuffix,
			"Description":      "Build project for CI/CD pipeline",
			"TimeoutInMinutes": float64(30),
			"Environment": map[string]interface{}{
				"ComputeType":    "BUILD_GENERAL1_SMALL",
				"Image":          "aws/codebuild/standard:7.0",
				"PrivilegedMode": false,
				"Type":           "LINUX_CONTAINER",
			},
		})
	})

	t.Run("creates CodePipeline with three stages", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackPipeline"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CodePipeline::Pipeline"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::CodePipeline::Pipeline"), map[string]interface{}{
			"Name": "cicd-pipeline-" + envSuffix,
			"Stages": []interface{}{
				map[string]interface{}{
					"Name": "Source",
				},
				map[string]interface{}{
					"Name": "Build",
				},
				map[string]interface{}{
					"Name": "Deploy",
				},
			},
		})
	})

	t.Run("creates IAM roles with correct permissions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackIAM"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - CodeBuild role
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"RoleName":    "codebuild-role-" + envSuffix,
			"Description": "Service role for CodeBuild project",
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": []interface{}{
					map[string]interface{}{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "codebuild.amazonaws.com",
						},
					},
				},
			},
		})

		// ASSERT - CodePipeline role
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"RoleName":    "codepipeline-role-" + envSuffix,
			"Description": "Service role for CodePipeline",
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": []interface{}{
					map[string]interface{}{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "codepipeline.amazonaws.com",
						},
					},
				},
			},
		})
	})

	t.Run("creates all required stack outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackOutputs"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Verify all four outputs exist by checking the template
		template.HasOutput(jsii.String("PipelineArn"), &map[string]interface{}{
			"Description": "ARN of the CI/CD pipeline",
		})
		template.HasOutput(jsii.String("BuildProjectName"), &map[string]interface{}{
			"Description": "Name of the CodeBuild project",
		})
		template.HasOutput(jsii.String("ArtifactBucketName"), &map[string]interface{}{
			"Description": "Name of the artifact storage bucket",
		})
		template.HasOutput(jsii.String("NotificationTopicArn"), &map[string]interface{}{
			"Description": "ARN of the SNS notification topic",
		})
	})

	t.Run("S3 bucket has versioning enabled", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackVersioning"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("S3 bucket has encryption enabled", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackEncryption"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketEncryption": map[string]interface{}{
				"ServerSideEncryptionConfiguration": []interface{}{
					map[string]interface{}{
						"ServerSideEncryptionByDefault": map[string]interface{}{
							"SSEAlgorithm": "AES256",
						},
					},
				},
			},
		})
	})

	t.Run("S3 bucket blocks all public access", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackPublicAccess"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
		})
	})

	t.Run("CodeBuild has buildspec with correct type", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackBuildSpec"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::CodeBuild::Project"), map[string]interface{}{
			"Source": map[string]interface{}{
				"Type": "NO_SOURCE",
			},
		})
	})

	t.Run("handles nil props gracefully", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ASSERT - Should not panic
		assert.NotPanics(t, func() {
			stack := lib.NewTapStack(app, jsii.String("TapStackNilProps"), nil)
			assert.NotNil(t, stack)
			assert.Equal(t, "dev", *stack.EnvironmentSuffix)
		})
	})

	t.Run("resources have correct deletion policy", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackDeletion"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - S3 bucket has Delete policy
		template.HasResource(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"UpdateReplacePolicy": "Delete",
			"DeletionPolicy":      "Delete",
		})

		// ASSERT - Log group has Delete policy
		template.HasResource(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"UpdateReplacePolicy": "Delete",
			"DeletionPolicy":      "Delete",
		})
	})
}

// Benchmark tests
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("bench"),
		})
	}
}
