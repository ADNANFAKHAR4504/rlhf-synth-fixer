I see the issues! The errors indicate that your CI/CD pipeline is expecting a different project structure and there are some compatibility issues. Let me provide you with the corrected code that should work with your existing pipeline setup.

## Updated Project Structure

Based on the errors, it looks like your pipeline expects:

- A `lib/` directory with the stack definition
- A `bin/` directory with the main application
- The import path `github.com/TuringGpt/iac-test-automations/lib`

## lib/tap_stack.go

Create this file in the `lib/` directory:

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
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
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Common tags for all resources
	commonTags := &map[string]*string{
		"Environment": jsii.String("Production"),
		"Department":  jsii.String("IT"),
	}

	// Apply tags to the stack
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Department"), jsii.String("IT"), nil)

	// Create VPC with public and private subnets across 2 AZs
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
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Security Group for Web Server (EC2) - Only allows HTTPS from internet
	webServerSG := awsec2.NewSecurityGroup(stack, jsii.String("WebServerSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for web server - HTTPS only"),
		AllowAllOutbound: jsii.Bool(true), // Allow outbound traffic for updates, etc.
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
		AllowAllOutbound: jsii.Bool(false), // Database doesn't need outbound access
	})

	// Allow PostgreSQL connections only from the web server security group
	databaseSG.AddIngressRule(
		webServerSG,
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL from web server only"),
		jsii.Bool(false),
	)

	// IAM Role for EC2 instance (basic role following best practices)
	ec2Role := awsiam.NewRole(stack, jsii.String("WebServerRole"), &awsiam.RoleProps{
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		Description: jsii.String("Basic IAM role for web server EC2 instance"),
		// Adding basic SSM permissions for instance management
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Instance Profile for the EC2 role
	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("WebServerInstanceProfile"), &awsiam.InstanceProfileProps{
		Role: ec2Role,
	})

	// Get the latest Amazon Linux 2 AMI - Fixed the Generation field issue
	amazonLinuxAmi := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		// Removed the Generation field as it's not available in this version
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

	// Subnet Group for RDS in private subnets
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
		Description: jsii.String("Subnet group for RDS database in private subnets"),
		Vpc:         vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// RDS PostgreSQL Database with encryption at rest
	database := awsrds.NewDatabaseInstance(stack, jsii.String("PostgreSQLDatabase"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
			Version: awsrds.PostgresEngineVersion_VER_15(), // Using compatible version
		}),
		InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		Vpc:          vpc,
		SubnetGroup:  dbSubnetGroup,
		SecurityGroups: &[]awsec2.ISecurityGroup{
			databaseSG,
		},
		// Critical requirement: Encryption at rest enabled
		StorageEncrypted: jsii.Bool(true),
		// Database configuration
		DatabaseName:           jsii.String("production_db"),
		Credentials:            awsrds.Credentials_FromGeneratedSecret(jsii.String("dbadmin"), &awsrds.CredentialsBaseOptions{}),
		AllocatedStorage:       jsii.Number(20),
		StorageType:            awsrds.StorageType_GP2,
		BackupRetention:        awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups: jsii.Bool(false),
		DeletionProtection:     jsii.Bool(true), // Protect against accidental deletion
		MultiAz:                jsii.Bool(false), // Set to true for production high availability
		// Enable automated backups and maintenance
		PreferredBackupWindow:      jsii.String("03:00-04:00"),
		PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
	})

	// S3 Bucket for CloudTrail logs
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailLogsBucket"), &awss3.BucketProps{
		BucketName:        nil, // Let AWS generate a unique name
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned:         jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)), // Keep logs for 90 days
			},
		},
	})

	// CloudTrail for API activity logging
	trail := awscloudtrail.NewTrail(stack, jsii.String("ITProductionCloudTrail"), &awscloudtrail.TrailProps{
		Bucket:                     cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableFileValidation:       jsii.Bool(true),
		SendToCloudWatchLogs:       jsii.Bool(false), // Set to true if you want CloudWatch integration
	})

	// Output important information
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

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseSecretArn"), &awscdk.CfnOutputProps{
		Value:       database.Secret().SecretArn(),
		Description: jsii.String("ARN of the secret containing database credentials"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("CloudTrailArn"), &awscdk.CfnOutputProps{
		Value:       trail.TrailArn(),
		Description: jsii.String("CloudTrail ARN for API logging"),
	})

	return stack
}
```

## bin/tap.go

Create this file in the `bin/` directory:

```go
package main

import (
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to be deployed.
func env() *awscdk.Environment {
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	region := os.Getenv("CDK_DEFAULT_REGION")

	if region == "" {
		region = "us-east-1" // Default to us-east-1 as requested
	}

	return &awscdk.Environment{
		Account: jsii.String(account),
		Region:  jsii.String(region),
	}
}
```

## tests/unit/tap_stack_unit_test.go

Create this file for unit tests:

```go
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
		awscdk.StackProps{
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
		awscdk.StackProps{
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
```

## go.mod

Update your `go.mod` file:

```go
module github.com/TuringGpt/iac-test-automations

go 1.19

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.89.0
	github.com/stretchr/testify v1.11.0
)

require (
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/cdklabs/awscdk-asset-awscli-go/awscliv1/v2 v2.2.200 // indirect
	github.com/cdklabs/awscdk-asset-kubectl-go/kubectlv20/v2 v2.1.2 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/yuin/goldmark v1.4.13 // indirect
	golang.org/x/lint v0.0.0-20210508222113-6edffad5e616 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/sync v0.7.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/tools v0.21.1-0.20240508182429-e35e4ccd0d2d // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

## Key Changes Made

1. **Fixed import path**: Changed to use `github.com/TuringGpt/iac-test-automations/lib`
2. **Removed Generation field**: Fixed the `AmazonLinux2ImageSsmParameterProps` struct issue
3. **Updated PostgreSQL version**: Used `VER_15()` instead of `VER_15_4()` for compatibility
4. **Proper project structure**: Separated into `lib/` and `bin/` directories as expected by your pipeline
5. **Added unit tests**: Comprehensive tests for the infrastructure components
6. **Environment handling**: Better environment variable handling in the main function

The code now follows your CI/CD pipeline's expected structure and should pass both the synth and lint stages. All the original requirements are maintained:

- ✅ Deployed in `us-east-1` region
- ✅ Tagged with `Environment: Production` and `Department: IT`
- ✅ VPC with public/private subnets across 2 AZs
- ✅ EC2 in public subnet with HTTPS-only security group
- ✅ RDS PostgreSQL with encryption at rest in private subnets
- ✅ Database security group only allows connections from web server
- ✅ CloudTrail enabled for API logging
- ✅ Proper IAM roles and security configurations
