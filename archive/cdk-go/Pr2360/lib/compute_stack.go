package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	Vpc               awsec2.IVpc
	EksSecurityGroup  awsec2.ISecurityGroup
}

type ComputeStack struct {
	awscdk.NestedStack
	EksCluster   interface{} // Placeholder for EKS cluster
	LoadBalancer awselasticloadbalancingv2.IApplicationLoadBalancer
}

func NewComputeStack(scope constructs.Construct, id *string, props *ComputeStackProps) *ComputeStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Get environment suffix with fallback
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil && *props.EnvironmentSuffix != "" {
		envSuffix = *props.EnvironmentSuffix
	}

	// Create IAM role for EC2 instances
	instanceRole := awsiam.NewRole(nestedStack, jsii.String("InstanceRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Application Load Balancer
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(nestedStack, jsii.String("ALB"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc:              props.Vpc,
		InternetFacing:   jsii.Bool(true),
		LoadBalancerName: jsii.String("tap-alb-" + envSuffix),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Default target group for ALB
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(nestedStack, jsii.String("DefaultTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		Port:       jsii.Number(80),
		Vpc:        props.Vpc,
		Protocol:   awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
		HealthCheck: &awselasticloadbalancingv2.HealthCheck{
			Path:             jsii.String("/health"),
			HealthyHttpCodes: jsii.String("200"),
		},
	})

	// HTTP Listener
	alb.AddListener(jsii.String("HttpListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:                jsii.Number(80),
		Protocol:            awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup},
	})

	// HTTPS would require a certificate; for now we'll just use HTTP

	// Create Auto Scaling Group for compute instances
	asg := awsautoscaling.NewAutoScalingGroup(nestedStack, jsii.String("ComputeASG"), &awsautoscaling.AutoScalingGroupProps{
		Vpc:             props.Vpc,
		InstanceType:    awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MEDIUM),
		MachineImage:    awsec2.MachineImage_LatestAmazonLinux2(nil),
		MinCapacity:     jsii.Number(1),
		MaxCapacity:     jsii.Number(10),
		DesiredCapacity: jsii.Number(3),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		Role: instanceRole,
		UserData: awsec2.UserData_Custom(jsii.String(`#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user
`)),
	})

	// Attach ASG to target group
	asg.AttachToApplicationTargetGroup(targetGroup)

	// Allow traffic from ALB to instances
	asg.Connections().AllowFrom(alb, awsec2.Port_AllTraffic(), jsii.String("Allow ALB"))

	// Output the load balancer DNS name
	awscdk.NewCfnOutput(nestedStack, jsii.String("LoadBalancerDNS"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("DNS name of the Application Load Balancer"),
	})

	return &ComputeStack{
		NestedStack:  nestedStack,
		EksCluster:   nil, // Placeholder for EKS
		LoadBalancer: alb,
	}
}
