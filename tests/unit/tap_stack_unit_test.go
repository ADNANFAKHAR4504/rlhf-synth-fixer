package tests

import (
	"encoding/json"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

func TestTapStack(t *testing.T) {
	defer jsii.Close()

	// GIVEN
	app := awscdk.NewApp(nil)

	// WHEN
	stack := lib.NewTapStack(app, "test-stack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})

	// THEN
	template := assertions.Template_FromStack(stack, nil)

	// Test VPC creation
	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
		"EnableDnsHostnames": true,
		"EnableDnsSupport":   true,
	})

	// Test EC2 Security Group allows HTTPS
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
		"SecurityGroupIngress": []interface{}{
			map[string]interface{}{
				"CidrIp":     "0.0.0.0/0",
				"FromPort":   443,
				"ToPort":     443,
				"IpProtocol": "tcp",
			},
		},
	})

	// Test RDS instance has encryption enabled
	template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
		"StorageEncrypted": true,
		"Engine":           "postgres",
	})

	// Test CloudTrail exists
	template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
		"IncludeGlobalServiceEvents": true,
		"IsMultiRegionTrail":         true,
		"EnableLogFileValidation":    true,
	})

	// Test tags are applied
	templateJson := template.ToJSON()
	templateStr, _ := json.Marshal(templateJson)
	assert.Contains(t, string(templateStr), "Environment")
	assert.Contains(t, string(templateStr), "Production")
	assert.Contains(t, string(templateStr), "Department")
	assert.Contains(t, string(templateStr), "IT")
}

func TestStackHasRequiredOutputs(t *testing.T) {
	defer jsii.Close()

	// GIVEN
	app := awscdk.NewApp(nil)

	// WHEN
	stack := lib.NewTapStack(app, "test-stack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})

	// THEN
	template := assertions.Template_FromStack(stack, nil)

	// Check for required outputs
	outputs := []string{
		"VPCId",
		"WebServerInstanceId",
		"WebServerPublicIP",
		"DatabaseEndpoint",
		"DatabaseSecretArn",
		"CloudTrailArn",
	}

	for _, output := range outputs {
		template.HasOutput(jsii.String(output), map[string]interface{}{})
	}
}
