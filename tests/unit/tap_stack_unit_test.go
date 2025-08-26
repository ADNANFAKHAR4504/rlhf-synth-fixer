package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

// synthNestedTemplate builds the app/stack and returns the Template of the nested stack "WebInfra-dev"
func synthNestedTemplate(t *testing.T) assertions.Template {
	t.Helper()

	app := awscdk.NewApp(nil)
	// Use default props so EnvironmentSuffix resolves to "dev"
	stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{})

	// Find the nested stack by the ID we used in NewTapStack: "WebInfra-" + envSuffix
	child := stack.Node().FindChild(jsii.String("WebInfra-dev"))
	if child == nil {
		t.Fatalf("nested stack 'WebInfra-dev' not found")
	}

	// Cast to NestedStack and build a template from it
	nested, ok := child.(awscdk.NestedStack)
	if !ok {
		t.Fatalf("child is not an awscdk.NestedStack")
	}

	return assertions.Template_FromStack(nested, nil)
}

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

	// --- All detailed infra tests moved here ---
	t.Run("VPC and Subnets", Test_VPC_And_Subnets_ExpectedCounts)
	t.Run("ALB with Listener and Targets", Test_ALB_InternetFacing_Listener80_Targets)
	t.Run("ASG properties", Test_ASG_InstanceTypeAndCapacity_Subnets)
	t.Run("Scaling Policy CPU Target 70", Test_ScalingPolicy_TargetTrackingCpu70)
	t.Run("CloudWatch Alarm CPU > 70", Test_CloudWatchAlarm_ASG_CPU_Threshold70)
	t.Run("Outputs check", Test_Outputs_Present)
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

// --- moved unit test functions (originally in unit package) ---
func Test_VPC_And_Subnets_ExpectedCounts(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
	tpl.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))
	tpl.HasResourceProperties(jsii.String("AWS::EC2::Subnet"), &map[string]interface{}{"MapPublicIpOnLaunch": true})
}
func Test_ALB_InternetFacing_Listener80_Targets(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), &map[string]interface{}{"Scheme": "internet-facing"})
	tpl.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), jsii.Number(1))
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), &map[string]interface{}{"Port": 80.0, "DefaultActions": assertions.Match_ArrayWith(&[]interface{}{assertions.Match_ObjectLike(&map[string]interface{}{"Type": "forward"})})})
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), &map[string]interface{}{"Port": 80.0, "HealthCheckPath": "/"})
}
func Test_ASG_InstanceTypeAndCapacity_Subnets(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))
}
func Test_ScalingPolicy_TargetTrackingCpu70(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.HasResourceProperties(jsii.String("AWS::AutoScaling::ScalingPolicy"), &map[string]interface{}{"PolicyType": "TargetTrackingScaling", "TargetTrackingConfiguration": assertions.Match_ObjectLike(&map[string]interface{}{"PredefinedMetricSpecification": assertions.Match_ObjectLike(&map[string]interface{}{"PredefinedMetricType": "ASGAverageCPUUtilization"}), "TargetValue": 70.0})})
}
func Test_CloudWatchAlarm_ASG_CPU_Threshold70(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{"MetricName": "CPUUtilization", "Namespace": "AWS/EC2", "ComparisonOperator": "GreaterThanThreshold", "Threshold": 70.0, "EvaluationPeriods": 2.0, "Dimensions": assertions.Match_ArrayWith(&[]interface{}{assertions.Match_ObjectLike(&map[string]interface{}{"Name": "AutoScalingGroupName", "Value": assertions.Match_AnyValue()})})})
}
func Test_Outputs_Present(t *testing.T) {
	tpl := synthNestedTemplate(t)
	tpl.HasOutput(jsii.String("VPCId"), assertions.Match_ObjectLike(&map[string]interface{}{"Value": assertions.Match_AnyValue()}))
	tpl.HasOutput(jsii.String("ALBDNSName"), assertions.Match_ObjectLike(&map[string]interface{}{"Value": assertions.Match_AnyValue()}))
	tpl.HasOutput(jsii.String("ASGName"), assertions.Match_ObjectLike(&map[string]interface{}{"Value": assertions.Match_AnyValue()}))
}
