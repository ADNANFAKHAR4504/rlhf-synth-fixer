package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type Ec2StackProps struct {
	*awscdk.StackProps
	Vpc             awsec2.IVpc
	PrivateSubnet   awsec2.ISubnet
	InstanceProfile awsiam.InstanceProfile
	InstanceType    string
	EnvironmentName string
}

type Ec2Stack struct {
	awscdk.Stack
	Instance      awsec2.Instance
	SecurityGroup awsec2.SecurityGroup
}

func NewEc2Stack(scope constructs.Construct, id *string, props *Ec2StackProps) *Ec2Stack {
	var sprops awscdk.StackProps
	if props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Set default instance type if not provided
	instanceType := props.InstanceType
	if instanceType == "" {
		instanceType = "t3.micro" // Free tier eligible for cost optimization
	}

	// Create security group with minimal required access
	securityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ProductionEC2SecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		Description:       jsii.String("Security group for production EC2 instance"),
		SecurityGroupName: jsii.String("production-ec2-sg"),
		AllowAllOutbound:  jsii.Bool(true), // Allow outbound traffic for updates and Secrets Manager access
	})

	// Allow SSH access only from within VPC (more secure than public access)
	securityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")), // VPC CIDR
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH access from within VPC"),
		jsii.Bool(false),
	)

	// Allow HTTPS outbound for Secrets Manager VPC endpoint
	securityGroup.AddEgressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS outbound for AWS services"),
		jsii.Bool(false),
	)

	// Get the latest Amazon Linux 2023 AMI for fast deployment
	ami := awsec2.MachineImage_LatestAmazonLinux2023(&awsec2.AmazonLinux2023ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	// User data script to install and configure the instance
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
		Shebang: jsii.String("#!/bin/bash"),
	})
	userData.AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y aws-cli jq"),
		jsii.String("# Install AWS CLI v2 if not present"),
		jsii.String("curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"),
		jsii.String("unzip awscliv2.zip"),
		jsii.String("sudo ./aws/install --update"),
		jsii.String("# Test Secrets Manager access"),
		jsii.String("aws secretsmanager get-secret-value --secret-id prod/app/config --region us-east-1 || echo 'Secrets access will be available after deployment'"),
	)

	// Create EC2 instance in private subnet
	instance := awsec2.NewInstance(stack, jsii.String("ProductionEC2Instance"), &awsec2.InstanceProps{
		InstanceType: awsec2.NewInstanceType(jsii.String(instanceType)),
		MachineImage: ami,
		Vpc:          props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			Subnets: &[]awsec2.ISubnet{props.PrivateSubnet},
		},
		SecurityGroup:      securityGroup,
		Role:               props.InstanceProfile.Role(),
		UserData:           userData,
		DetailedMonitoring: jsii.Bool(false), // Disable for cost optimization
		InstanceName:       jsii.String("production-application-server"),
	})

	// Tag all resources
	awscdk.Tags_Of(instance).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(instance).Add(jsii.String("Component"), jsii.String("Application"), nil)
	awscdk.Tags_Of(instance).Add(jsii.String("BackupRequired"), jsii.String("true"), nil)

	awscdk.Tags_Of(securityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Component"), jsii.String("Security"), nil)

	// Output the instance ID
	awscdk.NewCfnOutput(stack, jsii.String("InstanceId"), &awscdk.CfnOutputProps{
		Value:       instance.InstanceId(),
		Description: jsii.String("EC2 Instance ID"),
		ExportName:  jsii.String("ProductionInstanceId"),
	})

	// Output the private IP
	awscdk.NewCfnOutput(stack, jsii.String("InstancePrivateIP"), &awscdk.CfnOutputProps{
		Value:       instance.InstancePrivateIp(),
		Description: jsii.String("EC2 Instance Private IP Address"),
		ExportName:  jsii.String("ProductionInstancePrivateIP"),
	})

	return &Ec2Stack{
		Stack:         stack,
		Instance:      instance,
		SecurityGroup: securityGroup,
	}
}
