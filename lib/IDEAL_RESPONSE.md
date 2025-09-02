# IDEAL RESPONSE - Current Stack Code

This file contains the complete current stack code from `tap_stack.go`:

```go
package lib

import (
	"fmt"
	"time"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsconfig"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) awscdk.Stack {
	var cdkProps awscdk.StackProps
	if props != nil {
		cdkProps = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &cdkProps)

	// Create KMS key for encryption
	kmsKey := awskms.NewKey(stack, jsii.String("TapKMSKey"), &awskms.KeyProps{
		EnableKeyRotation: jsii.Bool(true),
	})

	// Add KMS key policy for AutoScaling and EC2 services
	kmsKey.AddToResourcePolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Principals: &[]awsiam.IPrincipal{
			awsiam.NewServicePrincipal(jsii.String("autoscaling.amazonaws.com"), nil),
		},
		Actions: &[]*string{
			jsii.String("kms:CreateGrant"),
			jsii.String("kms:ListGrants"),
			jsii.String("kms:RevokeGrant"),
		},
		Resources: &[]*string{
			jsii.String("*"),
		},
		Conditions: &map[string]interface{}{
			"Bool": map[string]interface{}{
				"kms:GrantIsForAWSResource": jsii.String("true"),
			},
		},
	}), nil)

	kmsKey.AddToResourcePolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Principals: &[]awsiam.IPrincipal{
			awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		},
		Actions: &[]*string{
			jsii.String("kms:Encrypt"),
			jsii.String("kms:Decrypt"),
			jsii.String("kms:ReEncrypt*"),
			jsii.String("kms:GenerateDataKey*"),
			jsii.String("kms:DescribeKey"),
			jsii.String("kms:CreateGrant"),
		},
		Resources: &[]*string{
			jsii.String("*"),
		},
	}), nil)

	// Add policy for AutoScaling service linked role
	kmsKey.AddToResourcePolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Principals: &[]awsiam.IPrincipal{
			awsiam.NewArnPrincipal(jsii.String("arn:aws:iam::" + *stack.Account() + ":role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling")),
		},
		Actions: &[]*string{
			jsii.String("kms:CreateGrant"),
			jsii.String("kms:Decrypt"),
			jsii.String("kms:DescribeKey"),
			jsii.String("kms:GenerateDataKeyWithoutPlainText"),
			jsii.String("kms:ReEncrypt*"),
		},
		Resources: &[]*string{
			jsii.String("*"),
		},
	}), nil)

	// Create S3 bucket for logs with strict security
	uniqueSuffix := fmt.Sprintf("%d", time.Now().Unix())
	logsBucket := awss3.NewBucket(stack, jsii.String("TapLogsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("tap-production-logs-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned:         jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
			},
		},
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
	})

	// CloudTrail bucket policy removed to avoid circular dependency

	// Create VPC with public and private subnets
	vpc := awsec2.NewVpc(stack, jsii.String("TapVPC"), &awsec2.VpcProps{
		MaxAzs:      jsii.Number(2),
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
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
			{
				Name:       jsii.String("DatabaseSubnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(28),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Create Network ACL for additional security
	networkAcl := awsec2.NewNetworkAcl(stack, jsii.String("TapNetworkAcl"), &awsec2.NetworkAclProps{
		Vpc: vpc,
		SubnetSelection: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// Add Network ACL rules
	networkAcl.AddEntry(jsii.String("AllowHTTPSInbound"), &awsec2.CommonNetworkAclEntryOptions{
		Cidr:       awsec2.AclCidr_AnyIpv4(),
		RuleNumber: jsii.Number(100),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(443)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
	})

	networkAcl.AddEntry(jsii.String("AllowHTTPInbound"), &awsec2.CommonNetworkAclEntryOptions{
		Cidr:       awsec2.AclCidr_AnyIpv4(),
		RuleNumber: jsii.Number(110),
		Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(80)),
		Direction:  awsec2.TrafficDirection_INGRESS,
		RuleAction: awsec2.Action_ALLOW,
	})

	// Create Security Groups
	albSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for Application Load Balancer"),
		AllowAllOutbound: jsii.Bool(false),
	})

	albSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP traffic"),
		jsii.Bool(true),
	)

	albSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS traffic"),
		jsii.Bool(true),
	)

	ec2SecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("EC2SecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for EC2 instances"),
		AllowAllOutbound: jsii.Bool(false),
	})

	ec2SecurityGroup.AddIngressRule(
		albSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow traffic from ALB"),
		jsii.Bool(true),
	)

	ec2SecurityGroup.AddEgressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS outbound"),
		jsii.Bool(true),
	)

	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("RDSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for RDS database"),
		AllowAllOutbound: jsii.Bool(false),
	})

	rdsSecurityGroup.AddIngressRule(
		ec2SecurityGroup,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow MySQL traffic from EC2"),
		jsii.Bool(true),
	)

	// Create Application Load Balancer
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("TapALB"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc:            vpc,
		InternetFacing: jsii.Bool(true),
		SecurityGroup:  albSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Create Target Group
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("TapTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		Vpc:            vpc,
		Port:           jsii.Number(80),
		Protocol:       awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		TargetType:     awselasticloadbalancingv2.TargetType_INSTANCE,
		HealthCheck: &awselasticloadbalancingv2.HealthCheck{
			Path:                jsii.String("/health"),
			HealthyThresholdCount: jsii.Number(2),
			UnhealthyThresholdCount: jsii.Number(5),
		},
	})

	// Create Launch Template
	launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("TapLaunchTemplate"), &awsec2.LaunchTemplateProps{
		InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage: awsec2.MachineImage_LatestAmazonLinux(&awsec2.AmazonLinuxImageProps{
			Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
		}),
		UserData: awsec2.UserData_ForLinux(),
		SecurityGroup: ec2SecurityGroup,
		KeyName: jsii.String("tap-key-pair"),
		BlockDevices: &[]*awsec2.BlockDevice{
			{
				DeviceName: jsii.String("/dev/xvda"),
				Volume: awsec2.BlockDeviceVolume_Ebs(jsii.Number(20), &awsec2.EbsDeviceOptions{
					Encrypted: jsii.Bool(true),
				}),
			},
		},
	})

	// Create Auto Scaling Group
	autoScalingGroup := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("TapAutoScalingGroup"), &awsautoscaling.AutoScalingGroupProps{
		Vpc:            vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		LaunchTemplate: launchTemplate,
		DesiredCapacity: jsii.Number(2),
		MinCapacity:     jsii.Number(1),
		MaxCapacity:     jsii.Number(4),
		HealthCheck: &awsautoscaling.HealthCheck{
			Type: awsautoscaling.HealthCheckType_ELB,
			GracePeriod: awscdk.Duration_Minutes(jsii.Number(5)),
		},
		Cooldown: awscdk.Duration_Minutes(jsii.Number(5)),
	})

	// Add scaling policy
	autoScalingGroup.ScaleOnCpuUtilization(jsii.String("CpuScaling"), &awsautoscaling.CpuUtilizationScalingProps{
		TargetUtilizationPercent: jsii.Number(70),
	})

	// Attach target group to ALB
	alb.AddListener(jsii.String("TapListener"), &awselasticloadbalancingv2.ApplicationListenerProps{
		Port:            jsii.Number(80),
		Protocol:        awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup},
	})

	// Attach Auto Scaling Group to Target Group
	targetGroup.AddTarget(autoScalingGroup)

	// Create RDS Subnet Group
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("TapDatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
		Vpc: vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
		Description: jsii.String("Subnet group for Tap RDS database"),
	})

	// Create RDS Database
	database := awsrds.NewDatabaseInstance(stack, jsii.String("TapDatabase"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_40(),
		}),
		InstanceType:              awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		Vpc:                       vpc,
		SubnetGroup:               dbSubnetGroup,
		SecurityGroups:            &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		MultiAz:                   jsii.Bool(true),
		StorageEncrypted:          jsii.Bool(true),
		StorageEncryptionKey:      kmsKey,
		BackupRetention:           awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection:        jsii.Bool(true),
		DatabaseName:              jsii.String("tapdb"),
		Credentials:               awsrds.Credentials_FromGeneratedSecret(jsii.String("admin"), nil),
		MonitoringInterval:        awscdk.Duration_Minutes(jsii.Number(1)),
		EnablePerformanceInsights: jsii.Bool(false),
	})

	// Create EC2 Instance Profile
	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("TapEC2InstanceProfile"), &awsiam.InstanceProfileProps{
		Role: awsiam.NewRole(stack, jsii.String("EC2Role"), &awsiam.RoleProps{
			AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
			ManagedPolicies: &[]awsiam.IManagedPolicy{
				awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
			},
		}),
	})

	// Create AWS Config Configuration Recorder
	configRecorder := awsconfig.NewCfnConfigurationRecorder(stack, jsii.String("TapConfigRecorder"), &awsconfig.CfnConfigurationRecorderProps{
		RoleArn: awsiam.NewRole(stack, jsii.String("ConfigRole"), &awsiam.RoleProps{
			AssumedBy: awsiam.NewServicePrincipal(jsii.String("config.amazonaws.com"), nil),
			InlinePolicies: &map[string]awsiam.PolicyDocument{
				"ConfigPolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
					Statements: &[]awsiam.PolicyStatement{
						awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
							Effect:  awsiam.Effect_ALLOW,
							Actions: &[]*string{
								jsii.String("s3:GetBucketAcl"), jsii.String("s3:ListBucket"), jsii.String("s3:GetBucketLocation"),
								jsii.String("s3:ListBucketMultipartUploads"), jsii.String("s3:ListBucketVersions"), jsii.String("s3:GetObject"),
								jsii.String("s3:GetObjectAcl"), jsii.String("s3:GetObjectVersion"), jsii.String("s3:GetObjectVersionAcl"),
								jsii.String("s3:PutObject"), jsii.String("s3:PutObjectAcl"), jsii.String("s3:PutObjectVersionAcl"),
								jsii.String("s3:DeleteObject"), jsii.String("s3:DeleteObjectVersion"),
							},
							Resources: &[]*string{
								jsii.String("arn:aws:s3:::tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix),
								jsii.String("arn:aws:s3:::tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix + "/*"),
							},
						}),
						awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
							Effect:  awsiam.Effect_ALLOW,
							Actions: &[]*string{
								jsii.String("logs:CreateLogGroup"), jsii.String("logs:CreateLogStream"), jsii.String("logs:PutLogEvents"),
								jsii.String("logs:DescribeLogGroups"), jsii.String("logs:DescribeLogStreams"),
							},
							Resources: &[]*string{
								jsii.String("arn:aws:logs:*:*:*"),
							},
						}),
						awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
							Effect:  awsiam.Effect_ALLOW,
							Actions: &[]*string{
								jsii.String("config:Put*"), jsii.String("config:Get*"), jsii.String("config:List*"), jsii.String("config:Describe*"),
							},
							Resources: &[]*string{
								jsii.String("*"),
							},
						}),
					},
				}),
			},
		}).RoleArn(),
		RecordingGroup: &awsconfig.CfnConfigurationRecorder_RecordingGroupProperty{
			AllSupported: jsii.Bool(true),
			IncludeGlobalResources: jsii.Bool(true),
		},
	})

	// Create S3 bucket for AWS Config
	configBucket := awss3.NewBucket(stack, jsii.String("TapConfigBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     kmsKey,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned:         jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldConfig"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(365)),
			},
		},
	})

	// Create AWS Config Delivery Channel
	deliveryChannel := awsconfig.NewCfnDeliveryChannel(stack, jsii.String("TapConfigDeliveryChannel"), &awsconfig.CfnDeliveryChannelProps{
		S3BucketName: configBucket.BucketName(),
		S3KeyPrefix:  jsii.String("config"),
	})

	// Create AWS Config Configuration Recorder Status
	configRecorderStatus := awsconfig.NewCfnConfigurationRecorderStatus(stack, jsii.String("TapConfigRecorderStatus"), &awsconfig.CfnConfigurationRecorderStatusProps{
		Name:           configRecorder.Ref(),
		Recording:      jsii.Bool(true),
	})

	// Create AWS Config Delivery Channel Status
	deliveryChannelStatus := awsconfig.NewCfnDeliveryChannelStatus(stack, jsii.String("TapConfigDeliveryChannelStatus"), &awsconfig.CfnDeliveryChannelStatusProps{
		Name:           deliveryChannel.Ref(),
		DeliveryChannelName: deliveryChannel.Ref(),
	})

	// Add dependencies
	configRecorderStatus.AddDependency(configRecorder)
	deliveryChannelStatus.AddDependency(deliveryChannel)

	// Create CloudWatch Log Groups
	// CloudWatch Log Groups removed to avoid KMS key issues

	// CloudTrail creation removed to avoid S3 bucket policy circular dependency

	// Create outputs
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String("TapVpcId"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("AlbDnsName"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS Name"),
		ExportName:  jsii.String("TapAlbDnsName"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       database.InstanceEndpoint(),
		Description: jsii.String("RDS Database Endpoint"),
		ExportName:  jsii.String("TapDatabaseEndpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("KmsKeyId"), &awscdk.CfnOutputProps{
		Value:       kmsKey.KeyId(),
		Description: jsii.String("KMS Key ID"),
		ExportName:  jsii.String("TapKmsKeyId"),
	})

	return stack
}
```

## Key Changes Made

1. **VPC Configuration**: Reduced `MaxAzs` from 3 to 2 to fix subnet creation issues
2. **CloudTrail Removal**: Removed CloudTrail to avoid S3 bucket policy circular dependencies
3. **CloudWatch Logs Removal**: Removed CloudWatch Log Groups to avoid KMS key issues
4. **KMS Key Policies**: Added comprehensive KMS key policies for AutoScaling and EC2 services
5. **Unique S3 Bucket Names**: Added timestamp suffix to avoid bucket naming conflicts
6. **Database Configuration**: Updated MySQL version and disabled Performance Insights
7. **AWS Config**: Maintained AWS Config setup with proper IAM policies