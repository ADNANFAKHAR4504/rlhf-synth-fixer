# Three-Tier VPC Architecture Implementation

This implementation creates a secure, production-ready three-tier VPC architecture for a payment processing platform using AWS CDK in Go.

## Architecture Overview

The infrastructure provisions:
- VPC with 10.0.0.0/16 CIDR across 3 availability zones
- Three subnet tiers: Public (web), Private (application), and Isolated (database)
- Layered security with Security Groups and Network ACLs
- Application Load Balancer for traffic distribution
- VPC Flow Logs for compliance monitoring
- VPC Endpoints for S3 and DynamoDB cost optimization
- High availability with one NAT Gateway per availability zone

## Implementation

### lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the deployment environment
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the three-tier VPC architecture
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
	VPC               awsec2.Vpc
	PublicSubnets     []awsec2.ISubnet
	PrivateSubnets    []awsec2.ISubnet
	DatabaseSubnets   []awsec2.ISubnet
	WebSecurityGroup  awsec2.SecurityGroup
	AppSecurityGroup  awsec2.SecurityGroup
	DBSecurityGroup   awsec2.SecurityGroup
	LoadBalancer      awselasticloadbalancingv2.ApplicationLoadBalancer
}

// NewTapStack creates a new instance of TapStack with three-tier VPC architecture
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	tapStack := &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}

	// Create VPC with three-tier architecture
	tapStack.createVPC()

	// Create security groups
	tapStack.createSecurityGroups()

	// Create Network ACLs
	tapStack.createNetworkACLs()

	// Create VPC Flow Logs
	tapStack.createVPCFlowLogs()

	// Create VPC Endpoints
	tapStack.createVPCEndpoints()

	// Create Application Load Balancer
	tapStack.createLoadBalancer()

	// Create CloudFormation outputs
	tapStack.createOutputs()

	return tapStack
}

// createVPC creates the three-tier VPC architecture
func (ts *TapStack) createVPC() {
	// Create VPC with 10.0.0.0/16 CIDR
	ts.VPC = awsec2.NewVpc(ts.Stack, jsii.String(fmt.Sprintf("PaymentVPC-%s", *ts.EnvironmentSuffix)), &awsec2.VpcProps{
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:      jsii.Number(3),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			// Public subnets for NAT Gateways and Load Balancer
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			// Private subnets for application tier
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			// Database subnets (isolated, no internet access)
			{
				Name:       jsii.String("Database"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		NatGateways:        jsii.Number(3), // One NAT Gateway per availability zone for high availability
	})

	// Store subnet references for later use
	ts.PublicSubnets = *ts.VPC.PublicSubnets()
	ts.PrivateSubnets = *ts.VPC.PrivateSubnets()
	ts.DatabaseSubnets = *ts.VPC.IsolatedSubnets()

	// Add tags to VPC
	awscdk.Tags_Of(ts.VPC).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ts.VPC).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(ts.VPC).Add(jsii.String("Name"), jsii.String(fmt.Sprintf("payment-vpc-%s", *ts.EnvironmentSuffix)), nil)
}

// createSecurityGroups creates security groups for each tier
func (ts *TapStack) createSecurityGroups() {
	// Web tier security group (ALB)
	ts.WebSecurityGroup = awsec2.NewSecurityGroup(ts.Stack, jsii.String(fmt.Sprintf("WebSecurityGroup-%s", *ts.EnvironmentSuffix)), &awsec2.SecurityGroupProps{
		Vpc:               ts.VPC,
		Description:       jsii.String("Security group for web tier (Application Load Balancer)"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String(fmt.Sprintf("web-sg-%s", *ts.EnvironmentSuffix)),
	})

	// Allow HTTP and HTTPS from internet
	ts.WebSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP from internet"),
		jsii.Bool(false),
	)
	ts.WebSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS from internet"),
		jsii.Bool(false),
	)

	// Application tier security group
	ts.AppSecurityGroup = awsec2.NewSecurityGroup(ts.Stack, jsii.String(fmt.Sprintf("AppSecurityGroup-%s", *ts.EnvironmentSuffix)), &awsec2.SecurityGroupProps{
		Vpc:               ts.VPC,
		Description:       jsii.String("Security group for application tier"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String(fmt.Sprintf("app-sg-%s", *ts.EnvironmentSuffix)),
	})

	// Allow port 8080 from web tier only
	ts.AppSecurityGroup.AddIngressRule(
		awsec2.Peer_SecurityGroupId(ts.WebSecurityGroup.SecurityGroupId(), jsii.String("")),
		awsec2.Port_Tcp(jsii.Number(8080)),
		jsii.String("Allow port 8080 from web tier"),
		jsii.Bool(false),
	)

	// Database tier security group
	ts.DBSecurityGroup = awsec2.NewSecurityGroup(ts.Stack, jsii.String(fmt.Sprintf("DBSecurityGroup-%s", *ts.EnvironmentSuffix)), &awsec2.SecurityGroupProps{
		Vpc:               ts.VPC,
		Description:       jsii.String("Security group for database tier"),
		AllowAllOutbound:  jsii.Bool(false),
		SecurityGroupName: jsii.String(fmt.Sprintf("db-sg-%s", *ts.EnvironmentSuffix)),
	})

	// Allow PostgreSQL port 5432 from app tier only
	ts.DBSecurityGroup.AddIngressRule(
		awsec2.Peer_SecurityGroupId(ts.AppSecurityGroup.SecurityGroupId(), jsii.String("")),
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL from app tier"),
		jsii.Bool(false),
	)

	// Add tags to security groups
	awscdk.Tags_Of(ts.WebSecurityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ts.WebSecurityGroup).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(ts.WebSecurityGroup).Add(jsii.String("Tier"), jsii.String("Web"), nil)

	awscdk.Tags_Of(ts.AppSecurityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ts.AppSecurityGroup).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(ts.AppSecurityGroup).Add(jsii.String("Tier"), jsii.String("Application"), nil)

	awscdk.Tags_Of(ts.DBSecurityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ts.DBSecurityGroup).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(ts.DBSecurityGroup).Add(jsii.String("Tier"), jsii.String("Database"), nil)
}

// createNetworkACLs creates restrictive Network ACLs for each tier
func (ts *TapStack) createNetworkACLs() {
	// Public subnet Network ACL
	publicNACL := awsec2.NewNetworkAcl(ts.Stack, jsii.String(fmt.Sprintf("PublicNetworkACL-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclProps{
		Vpc:            ts.VPC,
		NetworkAclName: jsii.String(fmt.Sprintf("public-nacl-%s", *ts.EnvironmentSuffix)),
	})

	// Allow HTTP/HTTPS inbound
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PublicInboundHTTP-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: publicNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(80)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PublicInboundHTTPS-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: publicNACL,
		RuleNumber: jsii.Number(110),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(443)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	// Allow ephemeral ports for return traffic
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PublicInboundEphemeral-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: publicNACL,
		RuleNumber: jsii.Number(120),
		Traffic:    awsec2.AclTraffic_TcpPortRange(jsii.Number(1024), jsii.Number(65535)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	// Allow all outbound
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PublicOutboundAll-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: publicNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_AllTraffic(),
		Direction:  awsec2.TrafficDirection_EGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	// Associate with public subnets
	for i, subnet := range ts.PublicSubnets {
		awsec2.NewSubnetNetworkAclAssociation(ts.Stack, jsii.String(fmt.Sprintf("PublicSubnetNACLAssoc-%d-%s", i, *ts.EnvironmentSuffix)), &awsec2.SubnetNetworkAclAssociationProps{
			NetworkAcl: publicNACL,
			Subnet:     subnet,
		})
	}

	// Private subnet Network ACL
	privateNACL := awsec2.NewNetworkAcl(ts.Stack, jsii.String(fmt.Sprintf("PrivateNetworkACL-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclProps{
		Vpc:            ts.VPC,
		NetworkAclName: jsii.String(fmt.Sprintf("private-nacl-%s", *ts.EnvironmentSuffix)),
	})

	// Allow port 8080 from public subnets
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PrivateInbound8080-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: privateNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(8080)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_Ipv4(jsii.String("10.0.0.0/16")),
	})

	// Allow ephemeral ports for return traffic
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PrivateInboundEphemeral-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: privateNACL,
		RuleNumber: jsii.Number(110),
		Traffic:    awsec2.AclTraffic_TcpPortRange(jsii.Number(1024), jsii.Number(65535)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	// Allow all outbound (for NAT Gateway access)
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("PrivateOutboundAll-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: privateNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_AllTraffic(),
		Direction:  awsec2.TrafficDirection_EGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_AnyIpv4(),
	})

	// Associate with private subnets
	for i, subnet := range ts.PrivateSubnets {
		awsec2.NewSubnetNetworkAclAssociation(ts.Stack, jsii.String(fmt.Sprintf("PrivateSubnetNACLAssoc-%d-%s", i, *ts.EnvironmentSuffix)), &awsec2.SubnetNetworkAclAssociationProps{
			NetworkAcl: privateNACL,
			Subnet:     subnet,
		})
	}

	// Database subnet Network ACL
	databaseNACL := awsec2.NewNetworkAcl(ts.Stack, jsii.String(fmt.Sprintf("DatabaseNetworkACL-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclProps{
		Vpc:            ts.VPC,
		NetworkAclName: jsii.String(fmt.Sprintf("database-nacl-%s", *ts.EnvironmentSuffix)),
	})

	// Allow port 5432 from private subnets only
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("DatabaseInbound5432-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: databaseNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(5432)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_Ipv4(jsii.String("10.0.0.0/16")),
	})

	// Allow ephemeral ports for return traffic to private subnets
	awsec2.NewNetworkAclEntry(ts.Stack, jsii.String(fmt.Sprintf("DatabaseOutboundEphemeral-%s", *ts.EnvironmentSuffix)), &awsec2.NetworkAclEntryProps{
		NetworkAcl: databaseNACL,
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_TcpPortRange(jsii.Number(1024), jsii.Number(65535)),
		Direction:  awsec2.TrafficDirection_EGRESS,
		RuleAction: awsec2.Action_ALLOW,
		Cidr:       awsec2.AclCidr_Ipv4(jsii.String("10.0.0.0/16")),
	})

	// Associate with database subnets
	for i, subnet := range ts.DatabaseSubnets {
		awsec2.NewSubnetNetworkAclAssociation(ts.Stack, jsii.String(fmt.Sprintf("DatabaseSubnetNACLAssoc-%d-%s", i, *ts.EnvironmentSuffix)), &awsec2.SubnetNetworkAclAssociationProps{
			NetworkAcl: databaseNACL,
			Subnet:     subnet,
		})
	}

	// Add tags
	awscdk.Tags_Of(publicNACL).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(publicNACL).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(privateNACL).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(privateNACL).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(databaseNACL).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(databaseNACL).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
}

// createVPCFlowLogs creates VPC Flow Logs for compliance monitoring
func (ts *TapStack) createVPCFlowLogs() {
	// Create CloudWatch Log Group for VPC Flow Logs
	logGroup := awslogs.NewLogGroup(ts.Stack, jsii.String(fmt.Sprintf("VPCFlowLogsGroup-%s", *ts.EnvironmentSuffix)), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/vpc/flowlogs-%s", *ts.EnvironmentSuffix)),
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		Retention:     awslogs.RetentionDays_ONE_MONTH,
	})

	// Create VPC Flow Logs
	awsec2.NewFlowLog(ts.Stack, jsii.String(fmt.Sprintf("VPCFlowLogs-%s", *ts.EnvironmentSuffix)), &awsec2.FlowLogProps{
		ResourceType: awsec2.FlowLogResourceType_FromVpc(ts.VPC),
		TrafficType:  awsec2.FlowLogTrafficType_ALL,
		Destination:  awsec2.FlowLogDestination_ToCloudWatchLogs(logGroup, nil),
		FlowLogName:  jsii.String(fmt.Sprintf("vpc-flow-logs-%s", *ts.EnvironmentSuffix)),
	})

	// Add tags
	awscdk.Tags_Of(logGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(logGroup).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
}

// createVPCEndpoints creates VPC endpoints for S3 and DynamoDB
func (ts *TapStack) createVPCEndpoints() {
	// S3 Gateway Endpoint
	s3Endpoint := ts.VPC.AddGatewayEndpoint(jsii.String(fmt.Sprintf("S3Endpoint-%s", *ts.EnvironmentSuffix)), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				Subnets: &ts.PrivateSubnets,
			},
		},
	})

	// DynamoDB Gateway Endpoint
	dynamoEndpoint := ts.VPC.AddGatewayEndpoint(jsii.String(fmt.Sprintf("DynamoDBEndpoint-%s", *ts.EnvironmentSuffix)), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_DYNAMODB(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				Subnets: &ts.PrivateSubnets,
			},
		},
	})

	// Add tags
	awscdk.Tags_Of(s3Endpoint).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(s3Endpoint).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
	awscdk.Tags_Of(dynamoEndpoint).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(dynamoEndpoint).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)
}

// createLoadBalancer creates Application Load Balancer in public subnets
func (ts *TapStack) createLoadBalancer() {
	ts.LoadBalancer = awselasticloadbalancingv2.NewApplicationLoadBalancer(ts.Stack, jsii.String(fmt.Sprintf("PaymentALB-%s", *ts.EnvironmentSuffix)), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc:              ts.VPC,
		InternetFacing:   jsii.Bool(true),
		LoadBalancerName: jsii.String(fmt.Sprintf("payment-alb-%s", *ts.EnvironmentSuffix)),
		SecurityGroup:    ts.WebSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Add default listener
	listener := ts.LoadBalancer.AddListener(jsii.String(fmt.Sprintf("ALBListener-%s", *ts.EnvironmentSuffix)), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:     jsii.Number(80),
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultAction: awselasticloadbalancingv2.ListenerAction_FixedResponse(jsii.Number(200), &awselasticloadbalancingv2.FixedResponseOptions{
			ContentType: jsii.String("text/plain"),
			MessageBody: jsii.String("Payment Platform - Load Balancer Health Check"),
		}),
	})

	// Add tags
	awscdk.Tags_Of(ts.LoadBalancer).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ts.LoadBalancer).Add(jsii.String("Project"), jsii.String("PaymentPlatform"), nil)

	// Suppress listener unused warning
	_ = listener
}

// createOutputs creates CloudFormation outputs for integration
func (ts *TapStack) createOutputs() {
	// VPC ID output
	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("VPCId-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.VPC.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-ID-%s", *ts.EnvironmentSuffix)),
	})

	// Public subnet IDs
	for i, subnet := range ts.PublicSubnets {
		awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("PublicSubnet%dId-%s", i+1, *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
			Value:       subnet.SubnetId(),
			Description: jsii.String(fmt.Sprintf("Public Subnet %d ID", i+1)),
			ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-PublicSubnet%d-%s", i+1, *ts.EnvironmentSuffix)),
		})
	}

	// Private subnet IDs
	for i, subnet := range ts.PrivateSubnets {
		awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("PrivateSubnet%dId-%s", i+1, *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
			Value:       subnet.SubnetId(),
			Description: jsii.String(fmt.Sprintf("Private Subnet %d ID", i+1)),
			ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-PrivateSubnet%d-%s", i+1, *ts.EnvironmentSuffix)),
		})
	}

	// Database subnet IDs
	for i, subnet := range ts.DatabaseSubnets {
		awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("DatabaseSubnet%dId-%s", i+1, *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
			Value:       subnet.SubnetId(),
			Description: jsii.String(fmt.Sprintf("Database Subnet %d ID", i+1)),
			ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-DatabaseSubnet%d-%s", i+1, *ts.EnvironmentSuffix)),
		})
	}

	// Security group IDs
	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("WebSecurityGroupId-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.WebSecurityGroup.SecurityGroupId(),
		Description: jsii.String("Web tier security group ID"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-WebSG-%s", *ts.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("AppSecurityGroupId-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.AppSecurityGroup.SecurityGroupId(),
		Description: jsii.String("Application tier security group ID"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-AppSG-%s", *ts.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("DatabaseSecurityGroupId-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.DBSecurityGroup.SecurityGroupId(),
		Description: jsii.String("Database tier security group ID"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-DatabaseSG-%s", *ts.EnvironmentSuffix)),
	})

	// Load balancer ARN and DNS
	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("LoadBalancerArn-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.LoadBalancer.LoadBalancerArn(),
		Description: jsii.String("Application Load Balancer ARN"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-ALB-ARN-%s", *ts.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(ts.Stack, jsii.String(fmt.Sprintf("LoadBalancerDNS-%s", *ts.EnvironmentSuffix)), &awscdk.CfnOutputProps{
		Value:       ts.LoadBalancer.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS name"),
		ExportName:  jsii.String(fmt.Sprintf("PaymentVPC-ALB-DNS-%s", *ts.EnvironmentSuffix)),
	})
}
```
