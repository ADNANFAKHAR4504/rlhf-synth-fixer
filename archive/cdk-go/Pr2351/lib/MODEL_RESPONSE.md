I'll help you create a comprehensive AWS CDK Go project for your production IT environment. This setup will include all the components you requested with proper security configurations.

## Project Structure

First, let's set up the basic project structure:

```bash
mkdir aws-it-production
cd aws-it-production
go mod init aws-it-production
```

## main.go

Here's the complete CDK Go implementation:

```go
package main

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

type ITProductionStackProps struct {
	awscdk.StackProps
}

func NewITProductionStack(scope constructs.Construct, id string, props *ITProductionStackProps) awscdk.Stack {
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
		Vpc:         vpc,
		Description: jsii.String("Security group for web server - HTTPS only"),
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
		Vpc:         vpc,
		Description: jsii.String("Security group for RDS database - Web server access only"),
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
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
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

	// Get the latest Amazon Linux 2 AMI
	amazonLinuxAmi := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
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
		Role:         ec2Role,
		KeyName:      jsii.String("your-key-pair"), // Replace with your actual key pair name
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
			Version: awsrds.PostgresEngineVersion_VER_15_4(), // Latest stable version
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
		DatabaseName:        jsii.String("production_db"),
		Credentials:         awsrds.Credentials_FromGeneratedSecret(jsii.String("dbadmin"), &awsrds.CredentialsBaseOptions{}),
		AllocatedStorage:    jsii.Number(20),
		StorageType:         awsrds.StorageType_GP2,
		BackupRetention:     awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups: jsii.Bool(false),
		DeletionProtection:  jsii.Bool(true), // Protect against accidental deletion
		MultiAz:            jsii.Bool(false),  // Set to true for production high availability
		// Enable automated backups and maintenance
		PreferredBackupWindow:      jsii.String("03:00-04:00"),
		PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
	})

	// S3 Bucket for CloudTrail logs
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailLogsBucket"), &awss3.BucketProps{
		BucketName: nil, // Let AWS generate a unique name
		Encryption: awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned: jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteOldLogs"),
				Enabled: jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)), // Keep logs for 90 days
			},
		},
	})

	// CloudTrail for API activity logging
	trail := awscloudtrail.NewTrail(stack, jsii.String("ITProductionCloudTrail"), &awscloudtrail.TrailProps{
		Bucket:                cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:    jsii.Bool(true),
		EnableFileValidation:  jsii.Bool(true),
		SendToCloudWatchLogs: jsii.Bool(false), // Set to true if you want CloudWatch integration
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

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewITProductionStack(app, "ITProductionStack", &ITProductionStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to be deployed.
func env() *awscdk.Environment {
	return &awscdk.Environment{
		Region: jsii.String("us-east-1"), // Deploy to us-east-1 as requested
	}
}
```

## go.mod

You'll also need a `go.mod` file with the required dependencies:

```go
module aws-it-production

go 1.19

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.89.0
)
```

## Deployment Instructions

1. **Install dependencies:**

   ```bash
   go mod tidy
   ```

2. **Bootstrap CDK (if not already done):**

   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
   ```

3. **Deploy the stack:**
   ```bash
   cdk deploy
   ```

## Key Features Implemented

### 🔒 **Security Configuration**

- **EC2 Security Group**: Only allows HTTPS (port 443) from the internet
- **RDS Security Group**: Only allows PostgreSQL connections (port 5432) from the web server
- **Database Encryption**: Encryption at rest is enabled as required
- **Network Isolation**: Database is in private subnets, web server in public subnet

### 🏗️ **Infrastructure Components**

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **EC2 Instance**: t3.micro instance with basic IAM role and SSM access
- **RDS PostgreSQL**: Encrypted database with automated backups
- **CloudTrail**: API activity logging with S3 storage

### 🏷️ **Resource Organization**

- All resources tagged with `Environment: Production` and `Department: IT`
- Proper naming conventions for easy identification
- CloudFormation outputs for important resource information

### 📋 **Important Notes**

1. **Key Pair**: Replace `"your-key-pair"` in the EC2 instance configuration with your actual AWS key pair name.

2. **Database Credentials**: The RDS instance uses AWS Secrets Manager for credential management. The secret ARN is provided in the outputs.

3. **Multi-AZ**: Currently set to `false` for cost optimization. Set `MultiAz: jsii.Bool(true)` for production high availability.

4. **Instance Sizes**: Using t3.micro for cost optimization. Adjust based on your actual requirements.

5. **Backup Retention**: Set to 7 days. Adjust based on your compliance requirements.

This setup provides a secure, well-organized foundation for your IT department's production workload with all the security measures you requested. The EC2 instance and RDS database can communicate securely, while the database is protected from external access.
