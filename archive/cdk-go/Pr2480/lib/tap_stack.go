package lib

import (
	"fmt"
	"time"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
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

type TapStack struct {
	awscdk.Stack
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create KMS key for encryption
	kmsKey := awskms.NewKey(stack, jsii.String("TapKMSKey"), &awskms.KeyProps{
		Description:       jsii.String("KMS key for TAP infrastructure encryption"),
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

	// Create VPC with explicit AZ configuration to avoid CDK selection issues
	vpc := awsec2.NewVpc(stack, jsii.String("TapVPC"), &awsec2.VpcProps{
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:                jsii.String("Public"),
				SubnetType:          awsec2.SubnetType_PUBLIC,
				CidrMask:            jsii.Number(24),
				MapPublicIpOnLaunch: jsii.Bool(true),
			},
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Database"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(28), // Smaller CIDR for database subnets
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		// Use specific AZs to avoid CDK selection issues
		AvailabilityZones: &[]*string{
			jsii.String("us-east-1a"),
			jsii.String("us-east-1b"),
		},
	})

	// We'll create subnets in the same AZ but with different CIDR blocks
	// This is a workaround for the CDK subnet selection issue

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

	// Create IAM role for EC2 instances (least privilege)
	ec2Role := awsiam.NewRole(stack, jsii.String("EC2Role"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("CloudWatchAgentServerPolicy")),
		},
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"S3LogsAccess": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("s3:PutObject"),
							jsii.String("s3:PutObjectAcl"),
						},
						Resources: &[]*string{
							logsBucket.BucketArn(),
							jsii.String(*logsBucket.BucketArn() + "/*"),
						},
					}),
				},
			}),
		},
	})

	_ = awsiam.NewInstanceProfile(stack, jsii.String("EC2InstanceProfile"), &awsiam.InstanceProfileProps{
		Role: ec2Role,
	})

	// Create Launch Template for EC2 instances
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	userData.AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y httpd"),
		jsii.String("systemctl start httpd"),
		jsii.String("systemctl enable httpd"),
		jsii.String("echo '<h1>TAP Production Server</h1>' > /var/www/html/index.html"),
		jsii.String("yum install -y amazon-cloudwatch-agent"),
	)

	launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("TapLaunchTemplate"), &awsec2.LaunchTemplateProps{
		InstanceType:  awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MEDIUM),
		MachineImage:  awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{}),
		SecurityGroup: ec2SecurityGroup,
		UserData:      userData,
		Role:          ec2Role,
		BlockDevices: &[]*awsec2.BlockDevice{
			{
				DeviceName: jsii.String("/dev/xvda"),
				Volume: awsec2.BlockDeviceVolume_Ebs(jsii.Number(20), &awsec2.EbsDeviceOptions{
					Encrypted: jsii.Bool(true),
					KmsKey:    kmsKey,
				}),
			},
		},
	})

	// Create Auto Scaling Group
	autoScalingGroup := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("TapAutoScalingGroup"), &awsautoscaling.AutoScalingGroupProps{
		Vpc:             vpc,
		LaunchTemplate:  launchTemplate,
		MinCapacity:     jsii.Number(2),
		MaxCapacity:     jsii.Number(10),
		DesiredCapacity: jsii.Number(2),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		HealthCheck: awsautoscaling.HealthCheck_Elb(&awsautoscaling.ElbHealthCheckOptions{
			Grace: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
	})

	// Add CPU-based scaling policy
	autoScalingGroup.ScaleOnCpuUtilization(jsii.String("CpuScaling"), &awsautoscaling.CpuUtilizationScalingProps{
		TargetUtilizationPercent: jsii.Number(70),
	})

	// Create Application Load Balancer
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("TapALB"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc:            vpc,
		InternetFacing: jsii.Bool(true),
		SecurityGroup:  albSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Enable ALB access logs - Commented out due to region requirement
	// alb.LogAccessLogs(logsBucket, jsii.String("alb-logs"))

	// Create Target Group
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("TapTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		Port:       jsii.Number(80),
		Protocol:   awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		Vpc:        vpc,
		TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
		HealthCheck: &awselasticloadbalancingv2.HealthCheck{
			Path:                    jsii.String("/"),
			Protocol:                awselasticloadbalancingv2.Protocol_HTTP,
			HealthyThresholdCount:   jsii.Number(2),
			UnhealthyThresholdCount: jsii.Number(3),
			Timeout:                 awscdk.Duration_Seconds(jsii.Number(5)),
			Interval:                awscdk.Duration_Seconds(jsii.Number(30)),
		},
	})

	// Add Auto Scaling Group to Target Group
	autoScalingGroup.AttachToApplicationTargetGroup(targetGroup)

	// Create ALB Listener
	_ = alb.AddListener(jsii.String("TapListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:     jsii.Number(80),
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{
			targetGroup,
		},
	})

	// Create RDS Subnet Group
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("TapDBSubnetGroup"), &awsrds.SubnetGroupProps{
		Description: jsii.String("Subnet group for TAP RDS database"),
		Vpc:         vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	// Create RDS instance
	database := awsrds.NewDatabaseInstance(stack, jsii.String("TapDatabase"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_40(),
		}),
		InstanceType:              awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		Vpc:                       vpc,
		SubnetGroup:               dbSubnetGroup,
		SecurityGroups:            &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		MultiAz:                   jsii.Bool(false),
		StorageEncrypted:          jsii.Bool(true),
		StorageEncryptionKey:      kmsKey,
		BackupRetention:           awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection:        jsii.Bool(false), // Disabled for easier cleanup during development
		DatabaseName:              jsii.String("tapdb"),
		Credentials:               awsrds.Credentials_FromGeneratedSecret(jsii.String("admin"), nil),
		MonitoringInterval:        awscdk.Duration_Minutes(jsii.Number(1)),
		EnablePerformanceInsights: jsii.Bool(false),
	})

	// Create WAF Web ACL - Commented out due to API compatibility issues
	// webAcl := awswafv2.NewCfnWebACL(stack, jsii.String("TapWebACL"), &awswafv2.CfnWebACLProps{
	// 	Scope: jsii.String("REGIONAL"),
	// 	DefaultAction: &awswafv2.CfnWebACL_DefaultActionProperty{
	// 		Allow: &awswafv2.CfnWebACL_AllowActionProperty{},
	// 	},
	// 	VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
	// 		SampledRequestsEnabled:   jsii.Bool(true),
	// 		CloudWatchMetricsEnabled: jsii.Bool(true),
	// 		MetricName:               jsii.String("TapWebACL"),
	// 	},
	// })

	// Associate WAF with ALB - Commented out due to API compatibility issues
	// awswafv2.NewCfnWebACLAssociation(stack, jsii.String("TapWebACLAssociation"), &awswafv2.CfnWebACLAssociationProps{
	// 	ResourceArn: alb.LoadBalancerArn(),
	// 	WebAclArn:   webAcl.AttrArn(),
	// })

	// CloudTrail creation removed to avoid S3 bucket policy circular dependency

	// AWS Config resources commented out to avoid delivery channel limit issues
	// There's already a delivery channel in the account, and AWS Config only allows one per region
	// configRole := awsiam.NewRole(stack, jsii.String("ConfigRole"), &awsiam.RoleProps{
	// 	AssumedBy: awsiam.NewServicePrincipal(jsii.String("config.amazonaws.com"), nil),
	// 	InlinePolicies: &map[string]awsiam.PolicyDocument{
	// 		"ConfigPolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
	// 			Statements: &[]awsiam.PolicyStatement{
	// 				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
	// 					Effect: awsiam.Effect_ALLOW,
	// 					Actions: &[]*string{
	// 						jsii.String("s3:GetBucketAcl"),
	// 						jsii.String("s3:ListBucket"),
	// 						jsii.String("s3:GetBucketLocation"),
	// 						jsii.String("s3:ListBucketMultipartUploads"),
	// 						jsii.String("s3:ListBucketVersions"),
	// 						jsii.String("s3:GetObject"),
	// 						jsii.String("s3:GetObjectAcl"),
	// 						jsii.String("s3:GetObjectVersion"),
	// 						jsii.String("s3:GetObjectVersionAcl"),
	// 						jsii.String("s3:PutObject"),
	// 						jsii.String("s3:PutObjectAcl"),
	// 						jsii.String("s3:PutObjectVersionAcl"),
	// 						jsii.String("s3:DeleteObject"),
	// 						jsii.String("s3:DeleteObjectVersion"),
	// 					},
	// 					Resources: &[]*string{
	// 						jsii.String("arn:aws:s3:::tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix),
	// 						jsii.String("arn:aws:s3:::tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix + "/*"),
	// 					},
	// 				}),
	// 				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
	// 					Effect: awsiam.Effect_ALLOW,
	// 					Actions: &[]*string{
	// 						jsii.String("logs:CreateLogGroup"),
	// 						jsii.String("logs:CreateLogStream"),
	// 						jsii.String("logs:PutLogEvents"),
	// 						jsii.String("logs:DescribeLogGroups"),
	// 						jsii.String("logs:DescribeLogStreams"),
	// 					},
	// 					Resources: &[]*string{
	// 						jsii.String("arn:aws:logs:*:*:*"),
	// 					},
	// 				}),
	// 				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
	// 					Effect: awsiam.Effect_ALLOW,
	// 					Actions: &[]*string{
	// 						jsii.String("config:Put*"),
	// 						jsii.String("config:Get*"),
	// 						jsii.String("config:List*"),
	// 						jsii.String("config:Describe*"),
	// 					},
	// 					Resources: &[]*string{
	// 						jsii.String("*"),
	// 					},
	// 				}),
	// 			},
	// 		}),
	// 	},
	// })

	// configBucket := awss3.NewBucket(stack, jsii.String("TapConfigBucket"), &awss3.BucketProps{
	// 	BucketName:        jsii.String("tap-config-" + *stack.Account() + "-" + *stack.Region() + "-" + uniqueSuffix),
	// 	Encryption:        awss3.BucketEncryption_KMS,
	// 	EncryptionKey:     kmsKey,
	// 	BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
	// 	Versioned:         jsii.Bool(true),
	// })

	// AWS Config delivery channel creation commented out to avoid limit issues
	// There's already a delivery channel in the account, and AWS Config only allows one per region
	// deliveryChannel := awsconfig.NewCfnDeliveryChannel(stack, jsii.String("TapConfigDeliveryChannel"), &awsconfig.CfnDeliveryChannelProps{
	// 	S3BucketName: configBucket.BucketName(),
	// 	S3KeyPrefix:  jsii.String("config"),
	// })

	// configRecorder := awsconfig.NewCfnConfigurationRecorder(stack, jsii.String("TapConfigRecorder"), &awsconfig.CfnConfigurationRecorderProps{
	// 	RoleArn: configRole.RoleArn(),
	// 	RecordingGroup: &awsconfig.CfnConfigurationRecorder_RecordingGroupProperty{
	// 		AllSupported:               jsii.Bool(true),
	// 		IncludeGlobalResourceTypes: jsii.Bool(true),
	// 	},
	// })

	// configRecorder.AddDependency(deliveryChannel)

	// Create CloudWatch Alarms - Commented out due to API compatibility issues
	// awscloudwatch.NewAlarm(stack, jsii.String("HighCPUAlarm"), &awscloudwatch.AlarmProps{
	// 	AlarmDescription:   jsii.String("High CPU utilization alarm"),
	// 	Metric:             autoScalingGroup.MetricCpuUtilization(&awscloudwatch.MetricOptions{}),
	// 	Threshold:          jsii.Number(80),
	// 	EvaluationPeriods:  jsii.Number(2),
	// 	ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	// })

	// awscloudwatch.NewAlarm(stack, jsii.String("DatabaseConnectionsAlarm"), &awscloudwatch.AlarmProps{
	// 	AlarmDescription:   jsii.String("High database connections alarm"),
	// 	Metric:             database.MetricDatabaseConnections(&awscloudwatch.MetricOptions{}),
	// 	Threshold:          jsii.Number(50),
	// 	EvaluationPeriods:  jsii.Number(2),
	// 	ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	// })

	// Output important information
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("LoadBalancerDNS"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("DNS name of the Application Load Balancer"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{
		Value:       logsBucket.BucketName(),
		Description: jsii.String("S3 bucket name for logs"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       database.InstanceEndpoint().Hostname(),
		Description: jsii.String("RDS database endpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("KMSKeyId"), &awscdk.CfnOutputProps{
		Value:       kmsKey.KeyId(),
		Description: jsii.String("KMS Key ID for encryption"),
	})

	return TapStack{
		Stack: stack,
	}
}
