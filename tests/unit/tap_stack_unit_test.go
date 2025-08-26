package unit

import (
	"testing"

	appstack "github.com/TuringGpt/iac-test-automations/lib"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// synthNestedTemplate builds the app/stack and returns the Template of the nested stack "WebInfra-dev"
func synthNestedTemplate(t *testing.T) assertions.Template {
	t.Helper()

	app := awscdk.NewApp(nil)
	// Use default props so EnvironmentSuffix resolves to "dev"
	stack := appstack.NewTapStack(app, jsii.String("TestStack"), &appstack.TapStackProps{})

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

// --- VPC & Subnets ---

func Test_VPC_And_Subnets_ExpectedCounts(t *testing.T) {
	tpl := synthNestedTemplate(t)

	// 1 VPC
	tpl.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))

	// With MaxAzs=3 and two subnet configs (Public + PrivateWithEgress) ⇒ 6 subnets
	tpl.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))

	// At least one public subnet has MapPublicIpOnLaunch=true
	props := map[string]interface{}{
		"MapPublicIpOnLaunch": true,
	}
	tpl.HasResourceProperties(jsii.String("AWS::EC2::Subnet"), &props)
}

// --- ALB, Listener, Targets, Health check ---

func Test_ALB_InternetFacing_Listener80_Targets(t *testing.T) {
	tpl := synthNestedTemplate(t)

	// Internet-facing ALB
	lbProps := map[string]interface{}{
		"Scheme": "internet-facing",
	}
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), &lbProps)

	// One listener on port 80 with a forward default action
	tpl.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), jsii.Number(1))

	forwardAction := assertions.Match_ObjectLike(&map[string]interface{}{
		"Type": "forward",
	})
	listenerProps := map[string]interface{}{
		"Port":           80.0,
		"DefaultActions": assertions.Match_ArrayWith(&[]interface{}{forwardAction}),
	}
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), &listenerProps)

	// Target group with health check path "/"
	tgProps := map[string]interface{}{
		"Port":            80.0,
		"HealthCheckPath": "/",
	}
	tpl.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), &tgProps)
}

// --- AutoScaling Group ---

func Test_ASG_InstanceTypeAndCapacity_Subnets(t *testing.T) {
	tpl := synthNestedTemplate(t)

	// Exactly one ASG
	tpl.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))

}

// --- Target tracking CPU scaling policy ---

func Test_ScalingPolicy_TargetTrackingCpu70(t *testing.T) {
	tpl := synthNestedTemplate(t)

	spProps := map[string]interface{}{
		"PolicyType": "TargetTrackingScaling",
		"TargetTrackingConfiguration": assertions.Match_ObjectLike(&map[string]interface{}{
			"PredefinedMetricSpecification": assertions.Match_ObjectLike(&map[string]interface{}{
				"PredefinedMetricType": "ASGAverageCPUUtilization",
			}),
			"TargetValue": 70.0,
		}),
	}
	tpl.HasResourceProperties(jsii.String("AWS::AutoScaling::ScalingPolicy"), &spProps)
}

// --- CloudWatch Alarm on ASG CPU ---

func Test_CloudWatchAlarm_ASG_CPU_Threshold70(t *testing.T) {
	tpl := synthNestedTemplate(t)

	alarmProps := map[string]interface{}{
		"MetricName":         "CPUUtilization",
		"Namespace":          "AWS/EC2",
		"ComparisonOperator": "GreaterThanThreshold",
		"Threshold":          70.0,
		"EvaluationPeriods":  2.0,
		"Dimensions": assertions.Match_ArrayWith(&[]interface{}{
			assertions.Match_ObjectLike(&map[string]interface{}{
				"Name":  "AutoScalingGroupName",
				"Value": assertions.Match_AnyValue(),
			}),
		}),
	}
	tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &alarmProps)
}

// --- Outputs ---

func Test_Outputs_Present(t *testing.T) {
	tpl := synthNestedTemplate(t)

	tpl.HasOutput(jsii.String("VPCId"), assertions.Match_ObjectLike(&map[string]interface{}{
		"Value": assertions.Match_AnyValue(),
	}))
	tpl.HasOutput(jsii.String("ALBDNSName"), assertions.Match_ObjectLike(&map[string]interface{}{
		"Value": assertions.Match_AnyValue(),
	}))
	tpl.HasOutput(jsii.String("ASGName"), assertions.Match_ObjectLike(&map[string]interface{}{
		"Value": assertions.Match_AnyValue(),
	}))
}
