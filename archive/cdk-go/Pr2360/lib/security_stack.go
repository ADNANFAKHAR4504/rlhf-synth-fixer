package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	Vpc               awsec2.IVpc
}

type SecurityStack struct {
	awscdk.NestedStack
	EksSecurityGroup          awsec2.ISecurityGroup
	DatabaseSecurityGroup     awsec2.ISecurityGroup
	LoadBalancerSecurityGroup awsec2.ISecurityGroup
}

func NewSecurityStack(scope constructs.Construct, id *string, props *SecurityStackProps) *SecurityStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// EKS Security Group
	eksSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("EKSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              props.Vpc,
		Description:      jsii.String("Security group for EKS cluster"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Database Security Group
	dbSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              props.Vpc,
		Description:      jsii.String("Security group for RDS Aurora database"),
		AllowAllOutbound: jsii.Bool(false),
	})

	// Allow EKS to access database
	dbSecurityGroup.AddIngressRule(
		eksSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow EKS to access MySQL"),
		nil,
	)

	// Load Balancer Security Group
	lbSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("LoadBalancerSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              props.Vpc,
		Description:      jsii.String("Security group for Application Load Balancer"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Allow HTTP and HTTPS traffic
	lbSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP"),
		nil,
	)
	lbSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS"),
		nil,
	)

	// Allow load balancer to communicate with EKS
	eksSecurityGroup.AddIngressRule(
		lbSecurityGroup,
		awsec2.Port_AllTraffic(),
		jsii.String("Allow ALB to EKS"),
		nil,
	)

	// Note: Using existing GuardDuty detector in the account
	// The existing detector already provides security monitoring for the account

	return &SecurityStack{
		NestedStack:               nestedStack,
		EksSecurityGroup:          eksSecurityGroup,
		DatabaseSecurityGroup:     dbSecurityGroup,
		LoadBalancerSecurityGroup: lbSecurityGroup,
	}
}
