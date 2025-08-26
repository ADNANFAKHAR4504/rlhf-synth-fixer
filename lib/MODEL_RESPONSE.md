I'll create a comprehensive AWS CDK application in Go that provisions a production-ready network environment following all your requirements. Here's the complete solution:

## Complete CDK Application (main.go)

```go
package main

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ProductionNetworkStackProps struct {
	awscdk.StackProps
}

type ProductionNetworkStack struct {
	awscdk.Stack
}

func NewProductionNetworkStack(scope constructs.Construct, id string, props *ProductionNetworkStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Common tags for all resources
	productionTags := &map[string]*string{
		"Environment": jsii.String("Production"),
		"Project":     jsii.String("ProductionNetwork"),
		"ManagedBy":   jsii.String("CDK"),
	}

	// Apply tags to the stack
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("ProductionNetwork"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)

	// 1. Create VPC with CIDR 10.0.0.0/16
	vpc := awsec2.NewVpc(stack, jsii.String("ProductionVPC"), &awsec2.VpcProps{
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:      jsii.Number(2),
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
		NatGateways:        jsii.Number(2), // One NAT Gateway per AZ for high availability
		Tags:               productionTags,
	})

	// 2. Security Group for Bastion Host
	bastionSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("BastionSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for Bastion host"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("bastion-sg"),
	})

	// Allow SSH access only from specific IP range (203.0.113.0/24)
	bastionSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("203.0.113.0/24")),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH access from trusted IP range"),
		jsii.Bool(false),
	)

	// Apply tags to security group
	awscdk.Tags_Of(bastionSecurityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(bastionSecurityGroup).Add(jsii.String("Name"), jsii.String("BastionSecurityGroup"), nil)

	// 3. Security Group for Private Resources
	privateSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("PrivateSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for private resources"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("private-resources-sg"),
	})

	// Allow SSH access from Bastion host only
	privateSecurityGroup.AddIngressRule(
		awsec2.Peer_SecurityGroupId(bastionSecurityGroup.SecurityGroupId()),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH access from Bastion host"),
		jsii.Bool(false),
	)

	// Allow HTTP/HTTPS traffic within the VPC
	privateSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("HTTP access from VPC"),
		jsii.Bool(false),
	)

	privateSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS access from VPC"),
		jsii.Bool(false),
	)

	// Apply tags to private security group
	awscdk.Tags_Of(privateSecurityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(privateSecurityGroup).Add(jsii.String("Name"), jsii.String("PrivateSecurityGroup"), nil)

	// 4. Get the latest Amazon Linux 2 AMI
	amazonLinuxAmi := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	// 5. Create Bastion Host in Public Subnet
	bastionHost := awsec2.NewInstance(stack, jsii.String("BastionHost"), &awsec2.InstanceProps{
		Vpc:                      vpc,
		InstanceType:             awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage:             amazonLinuxAmi,
		SecurityGroup:            bastionSecurityGroup,
		VpcSubnets:               &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
		KeyName:                  jsii.String("my-key-pair"), // Replace with your key pair name
		DetailedMonitoring:       jsii.Bool(true),
		AssociatePublicIpAddress: jsii.Bool(true),
		UserData: awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
			Shebang: jsii.String("#!/bin/bash"),
		}),
	})

	// Add user data to configure the bastion host
	bastionHost.UserData().AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y aws-cli"),
		jsii.String("yum install -y htop"),
		jsii.String("echo 'Bastion host setup complete' > /tmp/setup-complete.txt"),
	)

	// Apply tags to bastion host
	awscdk.Tags_Of(bastionHost).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(bastionHost).Add(jsii.String("Name"), jsii.String("ProductionBastionHost"), nil)
	awscdk.Tags_Of(bastionHost).Add(jsii.String("Role"), jsii.String("Bastion"), nil)

	// 6. Create S3 Bucket with Block Public Access enabled
	s3Bucket := awss3.NewBucket(stack, jsii.String("ProductionS3Bucket"), &awss3.BucketProps{
		BucketName: jsii.String("production-network-bucket-" + *awscdk.Aws_ACCOUNT_ID() + "-" + *awscdk.Aws_REGION()),
		Versioned:  jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteIncompleteMultipartUploads"),
				Enabled: jsii.Bool(true),
				AbortIncompleteMultipartUploadAfter: awscdk.Duration_Days(jsii.Number(7)),
			},
			{
				Id:      jsii.String("TransitionToIA"),
				Enabled: jsii.Bool(true),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:     awss3.StorageClass_INFREQUENT_ACCESS,
						TransitionAfter:  awscdk.Duration_Days(jsii.Number(30)),
					},
					{
						StorageClass:     awss3.StorageClass_GLACIER,
						TransitionAfter:  awscdk.Duration_Days(jsii.Number(90)),
					},
				},
			},
		},
	})

	// Apply tags to S3 bucket
	awscdk.Tags_Of(s3Bucket).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(s3Bucket).Add(jsii.String("Purpose"), jsii.String("ProductionData"), nil)

	// 7. VPC Flow Logs for security monitoring
	flowLogsRole := awsec2.NewFlowLogRole(stack, jsii.String("FlowLogsRole"), &awsec2.FlowLogRoleProps{})
	
	awsec2.NewFlowLog(stack, jsii.String("VPCFlowLogs"), &awsec2.FlowLogProps{
		ResourceType: awsec2.FlowLogResourceType_FromVpc(vpc),
		Destination:  awsec2.FlowLogDestination_ToCloudWatchLogs(nil, flowLogsRole),
		TrafficType:  awsec2.FlowLogTrafficType_ALL,
	})

	// 8. Output important information
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String("ProductionVPCId"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("BastionHostPublicIP"), &awscdk.CfnOutputProps{
		Value:       bastionHost.InstancePublicIp(),
		Description: jsii.String("Bastion Host Public IP"),
		ExportName:  jsii.String("BastionHostPublicIP"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("BastionHostInstanceId"), &awscdk.CfnOutputProps{
		Value:       bastionHost.InstanceId(),
		Description: jsii.String("Bastion Host Instance ID"),
		ExportName:  jsii.String("BastionHostInstanceId"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{
		Value:       s3Bucket.BucketName(),
		Description: jsii.String("S3 Bucket Name"),
		ExportName:  jsii.String("ProductionS3BucketName"),
	})

	// Output subnet information
	publicSubnets := vpc.PublicSubnets()
	privateSubnets := vpc.PrivateSubnets()

	for i, subnet := range *publicSubnets {
		awscdk.NewCfnOutput(stack, jsii.String("PublicSubnet"+string(rune(i+1))+"Id"), &awscdk.CfnOutputProps{
			Value:       subnet.SubnetId(),
			Description: jsii.String("Public Subnet " + string(rune(i+1)) + " ID"),
		})
	}

	for i, subnet := range *privateSubnets {
		awscdk.NewCfnOutput(stack, jsii.String("PrivateSubnet"+string(rune(i+1))+"Id"), &awscdk.CfnOutputProps{
			Value:       subnet.SubnetId(),
			Description: jsii.String("Private Subnet " + string(rune(i+1)) + " ID"),
		})
	}

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewProductionNetworkStack(app, "ProductionNetworkStack", &ProductionNetworkStackProps{
		awscdk.StackProps{
			Env: env(),
			Description: jsii.String("Production-ready AWS network infrastructure with VPC, subnets, NAT gateways, and bastion host"),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	return nil
	// Uncomment if you want to specify account and region
	// return &awscdk.Environment{
	//  Account: jsii.String("123456789012"),
	//  Region:  jsii.String("us-east-1"),
	// }
}
```

## Supporting Files

### go.mod
```go
module production-network

go 1.21

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.110.1
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
)
```

### cdk.json
```json
{
  "app": "go run main.go",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "go.mod",
      "go.sum",
      "**/*test.go"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-route53:deleteRoute53RecordSet": true,
    "@aws-cdk/aws-cloudformation:checkIntrinsicsConcatenation": true,
    "@aws-cdk/aws-lambda-nodejs:alwaysUseLatestRuntimeVersion": true
  }
}
```

## Key Features Implemented

### 🏗️ **Network Architecture**
- **VPC**: Created with CIDR 10.0.0.0/16 across 2 AZs
- **Subnets**: 2 public subnets (10.0.0.0/24, 10.0.1.0/24) and 2 private subnets (10.0.2.0/24, 10.0.3.0/24)
- **Internet Gateway**: Automatically attached for public subnet internet access
- **NAT Gateways**: One per AZ for high availability and private subnet outbound connectivity

### 🔒 **Security Implementation**
- **Security Groups**: 
  - Bastion SG: SSH access only from 203.0.113.0/24
  - Private SG: SSH only from bastion, HTTP/HTTPS within VPC
- **Bastion Host**: t3.micro instance in public subnet with detailed monitoring
- **VPC Flow Logs**: Enabled for security monitoring and compliance

### 📦 **Storage Security**
- **S3 Bucket**: Block Public Access enabled, versioning, encryption, SSL enforcement
- **Lifecycle Rules**: Automatic transition to IA (30 days) and Glacier (90 days)

### 🏷️ **Resource Management**
- **Consistent Tagging**: All resources tagged with "Environment" = "Production"
- **CloudFormation Outputs**: Key resource IDs exported for reference

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Install AWS CDK CLI
   npm install -g aws-cdk
   
   # Configure AWS credentials
   aws configure
   ```

2. **Setup Project**:
   ```bash
   mkdir production-network && cd production-network
   go mod init production-network
   # Copy the files above
   go mod tidy
   ```

3. **Deploy**:
   ```bash
   # Bootstrap CDK (first time only)
   cdk bootstrap
   
   # Deploy the stack
   cdk deploy
   ```

4. **Important Notes**:
   - Replace `"my-key-pair"` with your actual EC2 key pair name
   - Modify the trusted IP range (203.0.113.0/24) as needed
   - The S3 bucket name includes account ID and region for uniqueness

This infrastructure follows AWS Well-Architected Framework principles with emphasis on security, reliability, and cost optimization. The bastion host provides secure access to private resources while maintaining network isolation and implementing least-privilege access controls.