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
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})

	// ---------------- Unit Tests from tap_stack_unit_test.go ----------------

	t.Run("NAT Gateways - One per AZ", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackUnderTest"), &lib.TapStackProps{})
		tpl := assertions.Template_FromStack(stack.Stack, nil)
		tpl.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(2))
	})

	t.Run("Bastion SG allows SSH from CIDR", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackUnderTest"), &lib.TapStackProps{})
		tpl := assertions.Template_FromStack(stack.Stack, nil)

		// FIX: match the inline ingress on the SG resource
		tpl.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{
			"SecurityGroupIngress": assertions.Match_ArrayWith(&[]interface{}{
				assertions.Match_ObjectLike(&map[string]interface{}{
					"IpProtocol": "tcp",
					"FromPort":   22.0,
					"ToPort":     22.0,
					"CidrIp":     "203.0.113.0/24",
				}),
			}),
		})
	})

	t.Run("Private SG allows HTTP/HTTPS internal traffic", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackUnderTest"), &lib.TapStackProps{})
		tpl := assertions.Template_FromStack(stack.Stack, nil)

		// FIX: match the inline ingress on the SG resource for both ports
		tpl.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{
			"SecurityGroupIngress": assertions.Match_ArrayWith(&[]interface{}{
				assertions.Match_ObjectLike(&map[string]interface{}{
					"IpProtocol": "tcp",
					"FromPort":   80.0,
					"ToPort":     80.0,
					"CidrIp":     "10.0.0.0/16",
				}),
				assertions.Match_ObjectLike(&map[string]interface{}{
					"IpProtocol": "tcp",
					"FromPort":   443.0,
					"ToPort":     443.0,
					"CidrIp":     "10.0.0.0/16",
				}),
			}),
		})
	})

	t.Run("S3 Bucket BPA and Encryption", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackUnderTest"), &lib.TapStackProps{})
		tpl := assertions.Template_FromStack(stack.Stack, nil)
		tpl.HasResourceProperties(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
			"BucketEncryption": map[string]interface{}{
				"ServerSideEncryptionConfiguration": assertions.Match_ArrayWith(&[]interface{}{
					assertions.Match_ObjectLike(&map[string]interface{}{
						"ServerSideEncryptionByDefault": map[string]interface{}{
							"SSEAlgorithm": "AES256",
						},
					}),
				}),
			},
		})
	})

	t.Run("Outputs exist for VPC, Bastion, and Bucket", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackUnderTest"), &lib.TapStackProps{})
		tpl := assertions.Template_FromStack(stack.Stack, nil)
		tpl.HasOutput(jsii.String("VpcId"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))
		tpl.HasOutput(jsii.String("BastionInstanceId"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))
		tpl.HasOutput(jsii.String("BastionPublicIp"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))
		tpl.HasOutput(jsii.String("ArtifactsBucketName"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))
	})
}

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
