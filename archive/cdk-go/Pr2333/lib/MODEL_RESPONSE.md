I'll create a comprehensive AWS CDK application in Go that provisions a secure, highly available web application infrastructure. Let me break this down into the required files.

## Project Structure

```
.
├── tap.go                 # Entry point
├── lib/
│   └── tap_stack.go      # Stack definition
├── go.mod
└── go.sum
```

## Entry Point (`tap.go`)

```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"

	"tap-infrastructure/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is
// to be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String("us-west-2"), // Fixed region as per requirements
	}
}
```

## Stack Definition (`lib/tap_stack.go`)

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsconfig"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
}

type TapStack struct {
	awscdk.Stack
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// 1. VPC Setup with public and private subnets across 2 AZs
	vpc := awsec2.NewVpc(stack, jsii.String("tap-vpc"), &awsec2.VpcProps{
		VpcName:           jsii.String("tap-vpc"),
		IpAddresses:       awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:            jsii.Number(2), // Dual AZ requirement
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("isolated-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// 2. Security Groups
	// Web tier security group (ALB)
	albSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("tap-alb-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("tap-alb-sg"),
		Description:       jsii.String("Security group for Application Load Balancer"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	albSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP traffic"),
		jsii.Bool(false),
	)
	albSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS traffic"),
		jsii.Bool(false),
	)

	// EC2 security group
	ec2SecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("tap-ec2-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("tap-ec2-sg"),
		Description:       jsii.String("Security group for EC2 instances"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	ec2SecurityGroup.AddIngressRule(
		albSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP from ALB"),
		jsii.Bool(false),
	)

	// Database security group
	dbSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("tap-db-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("tap-db-sg"),
		Description:       jsii.String("Security group for RDS database"),
		AllowAllOutbound:  jsii.Bool(false),
	})

	dbSecurityGroup.AddIngressRule(
		ec2SecurityGroup,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow MySQL from EC2"),
		jsii.Bool(false),
	)

	// 3. IAM Role for EC2 instances (least privilege)
	ec2Role := awsiam.NewRole(stack, jsii.String("tap-ec2-role"), &awsiam.RoleProps{
		RoleName:  jsii.String("tap-ec2-role"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Add custom policy for S3 and DynamoDB access
	ec2Role.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("s3:GetObject"),
			jsii.String("s3:PutObject"),
			jsii.String("dynamodb:GetItem"),
			jsii.String("dynamodb:PutItem"),
			jsii.String("dynamodb:UpdateItem"),
			jsii.String("dynamodb:DeleteItem"),
			jsii.String("dynamodb:Query"),
			jsii.String("dynamodb:Scan"),
		},
		Resources: &[]*string{
			jsii.String("arn:aws:s3:::tap-*/*"),
			jsii.String("arn:aws:dynamodb:us-west-2:*:table/tap-*"),
		},
	}))

	// Instance profile for EC2
	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("tap-instance-profile"), &awsiam.InstanceProfileProps{
		InstanceProfileName: jsii.String("tap-instance-profile"),
		Role:                ec2Role,
	})

	// 4. S3 Buckets with encryption and blocked public access
	s3Bucket := awss3.NewBucket(stack, jsii.String("tap-storage-bucket"), &awss3.BucketProps{
		BucketName:          jsii.String("tap-storage-bucket-" + *awscdk.Aws_ACCOUNT_ID()),
		Encryption:          awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess:   awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned:           jsii.Bool(true),
		RemovalPolicy:       awscdk.RemovalPolicy_DESTROY,
		EnforceSSL:          jsii.Bool(true),
	})

	// 5. Secrets Manager for database credentials
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("tap-db-secret"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("tap-db-credentials"),
		Description: jsii.String("Database credentials for TAP application"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "admin"}`),
			GenerateStringKey:    jsii.String("password"),
			ExcludeCharacters:    jsii.String(`"@/\`),
		},
	})

	// 6. RDS Database in private subnets
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("tap-db-subnet-group"), &awsrds.SubnetGroupProps{
		SubnetGroupName: jsii.String("tap-db-subnet-group"),
		Description:     jsii.String("Subnet group for TAP database"),
		Vpc:             vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	rdsInstance := awsrds.NewDatabaseInstance(stack, jsii.String("tap-database"), &awsrds.DatabaseInstanceProps{
		InstanceIdentifier: jsii.String("tap-database"),
		Engine:            awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
		}),
		InstanceType:      awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MICRO),
		Credentials:       awsrds.Credentials_FromSecret(dbSecret, jsii.String("admin")),
		Vpc:               vpc,
		SubnetGroup:       dbSubnetGroup,
		SecurityGroups:    &[]awsec2.ISecurityGroup{dbSecurityGroup},
		MultiAz:           jsii.Bool(true),
		StorageEncrypted:  jsii.Bool(true),
		BackupRetention:   awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection: jsii.Bool(false), // Set to true in production
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})

	// 7. DynamoDB with point-in-time recovery
	dynamoTable := awsdynamodb.NewTable(stack, jsii.String("tap-dynamodb-table"), &awsdynamodb.TableProps{
		TableName:   jsii.String("tap-dynamodb-table"),
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("id"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		PointInTimeRecovery: jsii.Bool(true),
		Encryption:          awsdynamodb.TableEncryption_AWS_MANAGED,
		RemovalPolicy:       awscdk.RemovalPolicy_DESTROY,
	})

	// 8. Application Load Balancer
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("tap-alb"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		LoadBalancerName: jsii.String("tap-alb"),
		Vpc:              vpc,
		InternetFacing:   jsii.Bool(true),
		SecurityGroup:    albSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// 9. Launch Template for EC2 instances
	launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("tap-launch-template"), &awsec2.LaunchTemplateProps{
		LaunchTemplateName: jsii.String("tap-launch-template"),
		InstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage:       awsec2.MachineImage_LatestAmazonLinux2(),
		SecurityGroup:      ec2SecurityGroup,
		Role:               ec2Role,
		UserData: awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
			Shebang: jsii.String("#!/bin/bash"),
		}),
	})

	// Add user data script
	launchTemplate.UserData().AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y httpd"),
		jsii.String("systemctl start httpd"),
		jsii.String("systemctl enable httpd"),
		jsii.String("echo '<h1>TAP Web Application</h1>' > /var/www/html/index.html"),
	)

	// 10. Auto Scaling Group
	asg := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("tap-asg"), &awsautoscaling.AutoScalingGroupProps{
		AutoScalingGroupName: jsii.String("tap-asg"),
		Vpc:                  vpc,
		LaunchTemplate:       launchTemplate,
		MinCapacity:          jsii.Number(2),
		MaxCapacity:          jsii.Number(6),
		DesiredCapacity:      jsii.Number(2),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		HealthCheck: awsautoscaling.HealthCheck_Elb(&awscdk.Duration{
			Nanos: jsii.Number(300000000000), // 5 minutes
		}),
	})

	// 11. Target Group and Listener
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("tap-target-group"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		TargetGroupName: jsii.String("tap-target-group"),
		Port:            jsii.Number(80),
		Protocol:        awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		Vpc:             vpc,
		TargetType:      awselasticloadbalancingv2.TargetType_INSTANCE,
		HealthCheckPath: jsii.String("/"),
	})

	asg.AttachToApplicationTargetGroup(targetGroup)

	listener := alb.AddListener(jsii.String("tap-listener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:           jsii.Number(80),
		Protocol:       awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultAction:  awselasticloadbalancingv2.ListenerAction_Forward(&[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup}, nil),
	})

	// 12. WAF Web ACL
	webAcl := awswafv2.NewCfnWebACL(stack, jsii.String("tap-waf"), &awswafv2.CfnWebACLProps{
		Name:  jsii.String("tap-waf"),
		Scope: jsii.String("CLOUDFRONT"),
		DefaultAction: &awswafv2.CfnWebACL_DefaultActionProperty{
			Allow: &awswafv2.CfnWebACL_AllowActionProperty{},
		},
		Rules: &[]*awswafv2.CfnWebACL_RuleProperty{
			{
				Name:     jsii.String("AWSManagedRulesCommonRuleSet"),
				Priority: jsii.Number(1),
				Statement: &awswafv2.CfnWebACL_StatementProperty{
					ManagedRuleGroupStatement: &awswafv2.CfnWebACL_ManagedRuleGroupStatementProperty{
						VendorName: jsii.String("AWS"),
						Name:       jsii.String("AWSManagedRulesCommonRuleSet"),
					},
				},
				OverrideAction: &awswafv2.CfnWebACL_OverrideActionProperty{
					None: &awswafv2.CfnWebACL_NoneActionProperty{},
				},
				VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
					SampledRequestsEnabled:   jsii.Bool(true),
					CloudWatchMetricsEnabled: jsii.Bool(true),
					MetricName:               jsii.String("CommonRuleSetMetric"),
				},
			},
		},
		VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
			SampledRequestsEnabled:   jsii.Bool(true),
			CloudWatchMetricsEnabled: jsii.Bool(true),
			MetricName:               jsii.String("tapWAFMetric"),
		},
	})

	// 13. CloudFront Distribution with WAF
	distribution := awscloudfront.NewDistribution(stack, jsii.String("tap-cloudfront"), &awscloudfront.DistributionProps{
		DefaultBehavior: &awscloudfront.BehaviorOptions{
			Origin: awscloudfrontorigins.NewApplicationLoadBalancerV2Origin(alb, &awscloudfrontorigins.ApplicationLoadBalancerV2OriginProps{
				ProtocolPolicy: awscloudfront.OriginProtocolPolicy_HTTP_ONLY,
			}),
			ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
			AllowedMethods:       awscloudfront.AllowedMethods_ALLOW_ALL(),
			CachedMethods:        awscloudfront.CachedMethods_CACHE_GET_HEAD(),
		},
		WebAclId: webAcl.AttrArn(),
	})

	// 14. AWS Config for compliance monitoring
	configRole := awsiam.NewRole(stack, jsii.String("tap-config-role"), &awsiam.RoleProps{
		RoleName:  jsii.String("tap-config-role"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("config.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/ConfigRole")),
		},
	})

	configBucket := awss3.NewBucket(stack, jsii.String("tap-config-bucket"), &awss3.BucketProps{
		BucketName:        jsii.String("tap-config-bucket-" + *awscdk.Aws_ACCOUNT_ID()),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})

	configRecorder := awsconfig.NewCfnConfigurationRecorder(stack, jsii.String("tap-config-recorder"), &awsconfig.CfnConfigurationRecorderProps{
		Name:    jsii.String("tap-config-recorder"),
		RoleArn: configRole.RoleArn(),
		RecordingGroup: &awsconfig.CfnConfigurationRecorder_RecordingGroupProperty{
			AllSupported:                 jsii.Bool(true),
			IncludeGlobalResourceTypes:   jsii.Bool(true),
			ResourceTypes:                &[]*string{},
		},
	})

	deliveryChannel := awsconfig.NewCfnDeliveryChannel(stack, jsii.String("tap-config-delivery-channel"), &awsconfig.CfnDeliveryChannelProps{
		Name:           jsii.String("tap-config-delivery-channel"),
		S3BucketName:   configBucket.BucketName(),
	})

	// Ensure proper dependencies
	deliveryChannel.AddDependency(configRecorder)

	// 15. Outputs
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("LoadBalancerDNS"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("CloudFrontDomainName"), &awscdk.CfnOutputProps{
		Value:       distribution.DistributionDomainName(),
		Description: jsii.String("CloudFront distribution domain name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{
		Value:       s3Bucket.BucketName(),
		Description: jsii.String("S3 bucket name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       rdsInstance.InstanceEndpoint().Hostname(),
		Description: jsii.String("RDS database endpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DynamoDBTableName"), &awscdk.CfnOutputProps{
		Value:       dynamoTable.TableName(),
		Description: jsii.String("DynamoDB table name"),
	})

	return TapStack{
		Stack: stack,
	}
}
```

## Go Module Files

### `go.mod`

```go
module tap-infrastructure

go 1.21

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.114.1
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.95.0
)

require (
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/cdklabs/awscdk-asset-awscli-go/awscliv1/v2 v2.2.202 // indirect
	github.com/cdklabs/awscdk-asset-kubectl-go/kubectlv20/v2 v2.1.2 // indirect
	github.com/cdklabs/awscdk-asset-node-proxy-agent-go/nodeproxyagentv6/v2 v2.0.1 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/yuin/goldmark v1.4.13 // indirect
	golang.org/x/lint v0.0.0-20210508222113-6edffad5e616 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/tools v0.21.1-0.20240508182429-e35e4ccd0d2d // indirect
)
```

## Key Features Implemented

### 🏗️ **Infrastructure Components**

1. **VPC with Multi-AZ Setup**
   - Public, private, and isolated subnets across 2 availability zones
   - Proper routing and NAT gateways for internet access

2. **Compute & Auto Scaling**
   - Launch template with Amazon Linux 2
   - Auto Scaling Group with 2-6 instances
   - Application Load Balancer for high availability

3. **Security Layers**
   - Multiple security groups with least privilege access
   - IAM roles with minimal required permissions
   - WAF protection against common web exploits

4. **Storage Solutions**
   - S3 buckets with server-side encryption and blocked public access
   - RDS MySQL in private subnets with encryption
   - DynamoDB with point-in-time recovery

5. **Security & Compliance**
   - AWS Secrets Manager for database credentials
   - AWS Config for compliance monitoring
   - CloudFront with WAF integration

### 🔒 **Security Best Practices**

- **Network Isolation**: Databases in isolated subnets
- **Encryption**: All storage encrypted at rest
- **Access Control**: Strict IAM policies and security groups
- **Monitoring**: AWS Config for continuous compliance
- **Web Protection**: WAF rules against common attacks

### 🚀 **Deployment Instructions**

1. **Initialize the project**:
   ```bash
   go mod init tap-infrastructure
   go mod tidy
   ```

2. **Deploy the stack**:
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-west-2
   cdk deploy TapStack
   ```

3. **Access the application**:
   - Use the CloudFront domain name from the outputs
   - The WAF will protect against common web exploits

### 📊 **Monitoring & Compliance**

The stack includes AWS Config to continuously monitor resource compliance and track configuration changes. All resources follow the naming convention `tap-resource-type` as specified.

This infrastructure provides a production-ready, secure, and highly available web application environment that meets all the specified requirements while following AWS best practices.