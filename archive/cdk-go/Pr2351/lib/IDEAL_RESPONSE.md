# Ideal Response

This document outlines the ideal implementation of the `tap_stack.go` file.

## `lib/tap_stack.go`

```go
package lib

import (
	"fmt"
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	// Get environment suffix from props, context, or use 'dev' as default
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Create stack name with environment suffix
	stackName := fmt.Sprintf("TapStack%s", environmentSuffix)
	sprops.StackName = jsii.String(stackName)
	stack := awscdk.NewStack(scope, jsii.String(id), &sprops)

	// Apply tags to the stack
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Department"), jsii.String("IT"), nil)

	// Create VPC with public and isolated private subnets (no NAT Gateway needed)
	vpc := awsec2.NewVpc(stack, jsii.String("ITProductionVPC"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(2), // Deploy across 2 availability zones for resilience
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("PublicSubnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("PrivateSubnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, // No internet access needed
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		NatGateways:        jsii.Number(0), // No NAT Gateways = No EIPs needed
	})

	// Security Group for Web Server (EC2) - Only allows HTTPS from internet
	webServerSG := awsec2.NewSecurityGroup(stack, jsii.String("WebServerSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for web server - HTTPS only"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Allow HTTPS traffic from anywhere on the internet
	webServerSG.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS from internet"),
		jsii.Bool(false),
	)

	// Security Group for RDS Database - Only allows connections from web server
	databaseSG := awsec2.NewSecurityGroup(stack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for RDS database - Web server access only"),
		AllowAllOutbound: jsii.Bool(false),
	})

	// Allow PostgreSQL connections only from the web server security group
	databaseSG.AddIngressRule(
		webServerSG,
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL from web server only"),
		jsii.Bool(false),
	)

	// IAM Role for EC2 instance
	ec2Role := awsiam.NewRole(stack, jsii.String("WebServerRole"), &awsiam.RoleProps{
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		Description: jsii.String("Basic IAM role for web server EC2 instance"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Get the latest Amazon Linux 2 AMI
	amazonLinuxAmi := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	// EC2 Instance in public subnet for web server
	webServer := awsec2.NewInstance(stack, jsii.String("WebServerInstance"), &awsec2.InstanceProps{
		InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage: amazonLinuxAmi,
		Vpc:          vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
		SecurityGroup: webServerSG,
		Role:          ec2Role,
		UserData: awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
			Shebang: jsii.String("#!/bin/bash"),
		}),
	})

	// Add basic setup commands to user data
	webServer.UserData().AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y amazon-cloudwatch-agent"),
		jsii.String("# Add your application setup commands here"),
	)

	// Subnet Group for RDS in isolated private subnets
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
		Description: jsii.String("Subnet group for RDS database in private subnets"),
		Vpc:         vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, // Updated to use isolated subnets
		},
	})

	// RDS PostgreSQL Database with encryption at rest
	database := awsrds.NewDatabaseInstance(stack, jsii.String("PostgreSQLDatabase"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
			Version: awsrds.PostgresEngineVersion_VER_15(),
		}),
		InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		Vpc:          vpc,
		SubnetGroup:  dbSubnetGroup,
		SecurityGroups: &[]awsec2.ISecurityGroup{
			databaseSG,
		},
		StorageEncrypted:           jsii.Bool(true), // Encryption at rest enabled
		DatabaseName:               jsii.String("production_db"),
		Credentials:                awsrds.Credentials_FromGeneratedSecret(jsii.String("dbadmin"), &awsrds.CredentialsBaseOptions{}),
		AllocatedStorage:           jsii.Number(20),
		StorageType:                awsrds.StorageType_GP2,
		BackupRetention:            awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups:     jsii.Bool(false),
		DeletionProtection:         jsii.Bool(true),
		MultiAz:                    jsii.Bool(false),
		PreferredBackupWindow:      jsii.String("03:00-04:00"),
		PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
	})

	// Outputs
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID for the IT Production environment"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("WebServerInstanceId"), &awscdk.CfnOutputProps{
		Value:       webServer.InstanceId(),
		Description: jsii.String("EC2 Web Server Instance ID"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("WebServerPublicIP"), &awscdk.CfnOutputProps{
		Value:       webServer.InstancePublicIp(),
		Description: jsii.String("Web Server Public IP Address"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       database.InstanceEndpoint().Hostname(),
		Description: jsii.String("RDS PostgreSQL Database Endpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseIdentifier"), &awscdk.CfnOutputProps{
		Value:       database.InstanceIdentifier(),
		Description: jsii.String("RDS PostgreSQL Database Identifier"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseSecretArn"), &awscdk.CfnOutputProps{
		Value:       database.Secret().SecretArn(),
		Description: jsii.String("ARN of the secret containing database credentials"),
	})

	return stack
}
```
