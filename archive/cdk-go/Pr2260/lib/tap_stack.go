package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

//
// ===== Existing types (kept intact) =====
//

type TapStackProps struct {
	*awscdk.StackProps
	// Optional environment suffix for naming (e.g., dev/prod).
	EnvironmentSuffix *string
}

type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

//
// ===== New: Nested stack for the web infrastructure =====
//

type WebInfraStack struct {
	awscdk.NestedStack
	Vpc awsec2.Vpc
	Alb awselasticloadbalancingv2.ApplicationLoadBalancer
	Asg awsautoscaling.AutoScalingGroup
}

type WebInfraStackProps struct {
	awscdk.NestedStackProps
}

// NewWebInfraStack creates VPC(3 AZs, public/private), ALB, ASG (t3.medium),
// security groups, health checks, CPU scaling and CloudWatch alarm.
func NewWebInfraStack(scope constructs.Construct, id *string, props *WebInfraStackProps) *WebInfraStack {
	nested := awscdk.NewNestedStack(scope, id, &props.NestedStackProps)

	// Stack-level tags (inherit to children) — Environment + Team
	awscdk.Tags_Of(nested).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(nested).Add(jsii.String("Team"), jsii.String("DevOps"), nil)

	// VPC with 3 AZs, 3 public + 3 private subnets
	vpc := awsec2.NewVpc(nested, jsii.String("VPC"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(3),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// Security group for ALB: allow 80/443 from anywhere (IPv4/IPv6)
	albSg := awsec2.NewSecurityGroup(nested, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for ALB"),
		AllowAllOutbound: jsii.Bool(true),
	})
	albSg.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("HTTP from anywhere"), jsii.Bool(false))
	albSg.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("HTTPS from anywhere"), jsii.Bool(false))
	albSg.AddIngressRule(awsec2.Peer_AnyIpv6(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("HTTP from anywhere IPv6"), jsii.Bool(false))
	albSg.AddIngressRule(awsec2.Peer_AnyIpv6(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("HTTPS from anywhere IPv6"), jsii.Bool(false))

	// Internet-facing ALB in public subnets
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(nested, jsii.String("ALB"),
		&awselasticloadbalancingv2.ApplicationLoadBalancerProps{
			Vpc:            vpc,
			InternetFacing: jsii.Bool(true),
			SecurityGroup:  albSg,
			VpcSubnets: &awsec2.SubnetSelection{
				SubnetType: awsec2.SubnetType_PUBLIC,
			},
		},
	)

	// Security group for EC2 instances: allow HTTP from ALB only
	instSg := awsec2.NewSecurityGroup(nested, jsii.String("InstanceSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for web instances"),
		AllowAllOutbound: jsii.Bool(true),
	})
	// Use the ALB SG directly as the peer (implements IPeer)
	instSg.AddIngressRule(
		albSg,
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("HTTP from ALB"),
		jsii.Bool(false),
	)

	// Simple user data (Apache) for demo
	ud := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	ud.AddCommands(
		jsii.String("#!/bin/bash"),
		jsii.String("yum update -y"),
		jsii.String("yum install -y httpd"),
		jsii.String("systemctl enable --now httpd"),
		jsii.String("echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html"),
	)

	// ASG: t3.medium, min=2, max=6, in private subnets
	asg := awsautoscaling.NewAutoScalingGroup(nested, jsii.String("ASG"),
		&awsautoscaling.AutoScalingGroupProps{
			Vpc:             vpc,
			InstanceType:    awsec2.NewInstanceType(jsii.String("t3.medium")),
			MachineImage:    awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{}),
			MinCapacity:     jsii.Number(2),
			DesiredCapacity: jsii.Number(2),
			MaxCapacity:     jsii.Number(6),
			SecurityGroup:   instSg,
			UserData:        ud,
			VpcSubnets: &awsec2.SubnetSelection{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
	)

	// Listener + register ASG as targets on :80 with health checks
	listener := alb.AddListener(jsii.String("Listener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port: jsii.Number(80),
		Open: jsii.Bool(true),
	})

	listener.AddTargets(jsii.String("ASGTargets"),
		&awselasticloadbalancingv2.AddApplicationTargetsProps{
			Port: jsii.Number(80),
			Targets: &[]awselasticloadbalancingv2.IApplicationLoadBalancerTarget{
				asg, // ASG implements IApplicationLoadBalancerTarget
			},
			HealthCheck: &awselasticloadbalancingv2.HealthCheck{
				Enabled:                 jsii.Bool(true),
				Path:                    jsii.String("/"),
				Interval:                awscdk.Duration_Seconds(jsii.Number(30)),
				Timeout:                 awscdk.Duration_Seconds(jsii.Number(5)),
				HealthyThresholdCount:   jsii.Number(2),
				UnhealthyThresholdCount: jsii.Number(3),
			},
		},
	)

	// CPU target-tracking scaling (~70%) + separate CloudWatch alarm
	asg.ScaleOnCpuUtilization(jsii.String("CPUScaling"),
		&awsautoscaling.CpuUtilizationScalingProps{
			TargetUtilizationPercent: jsii.Number(70),
			Cooldown:                 awscdk.Duration_Minutes(jsii.Number(5)),
		},
	)

	cpuMetric := awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
		Namespace:  jsii.String("AWS/EC2"),
		MetricName: jsii.String("CPUUtilization"),
		Statistic:  jsii.String("Average"),
		DimensionsMap: &map[string]*string{
			"AutoScalingGroupName": asg.AutoScalingGroupName(),
		},
		Period: awscdk.Duration_Minutes(jsii.Number(5)),
	})

	awscloudwatch.NewAlarm(nested, jsii.String("HighCPUAlarm"),
		&awscloudwatch.AlarmProps{
			Metric:             cpuMetric,
			Threshold:          jsii.Number(70),
			EvaluationPeriods:  jsii.Number(2),
			ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
			AlarmDescription:   jsii.String("High CPU utilization alarm (>70%)"),
		},
	)

	// Outputs
	awscdk.NewCfnOutput(nested, jsii.String("VPCId"),
		&awscdk.CfnOutputProps{Value: vpc.VpcId()})
	awscdk.NewCfnOutput(nested, jsii.String("ALBDNSName"),
		&awscdk.CfnOutputProps{Value: alb.LoadBalancerDnsName()})
	awscdk.NewCfnOutput(nested, jsii.String("ASGName"),
		&awscdk.CfnOutputProps{Value: asg.AutoScalingGroupName()})

	return &WebInfraStack{
		NestedStack: nested,
		Vpc:         vpc,
		Alb:         alb,
		Asg:         asg,
	}
}

//
// ===== Existing constructor (kept) + compose nested infra =====
//

// NewTapStack creates the orchestration stack and composes child stacks.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil && props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Resolve environment suffix: props -> context -> default 'dev'
	var envSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		envSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		envSuffix = *suffix.(*string)
	} else {
		envSuffix = "dev"
	}

	// Apply stack-level tags (inherit to nested resources)
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Team"), jsii.String("DevOps"), nil)

	// Compose the web infra as a nested stack (keeps TapStack clean)
	NewWebInfraStack(stack, jsii.String("WebInfra-"+envSuffix), &WebInfraStackProps{
		NestedStackProps: awscdk.NestedStackProps{},
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(envSuffix),
	}
}
