package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsssm"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
//
// Note:
//   - Creates AWS resources directly in this stack as per model response implementation.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Get account and region for resource naming
	account := stack.Account()
	region := stack.Region()

	// Apply common tags
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)

	// ===================
	// KMS Key for Encryption
	// ===================
	kmsKey := awskms.NewKey(stack, jsii.String("InfraKMSKey"), &awskms.KeyProps{
		Description:       jsii.String("KMS key for infrastructure encryption"),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})

	// ===================
	// VPC and Networking
	// ===================
	vpc := awsec2.NewVpc(stack, jsii.String("MainVPC"), &awsec2.VpcProps{
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")), // Updated from Cidr
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
			{
				Name:       jsii.String("DatabaseSubnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(26),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		NatGateways:        jsii.Number(1),
	})

	// ===================
	// Security Groups
	// ===================

	// Application Load Balancer Security Group
	albSG := awsec2.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for Application Load Balancer"),
		AllowAllOutbound: jsii.Bool(true), // Changed to true for ALB to work properly
	})

	// Allow HTTPS traffic to ALB
	albSG.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS traffic"),
		jsii.Bool(false), // Added missing parameter
	)

	// Allow HTTP traffic for redirect
	albSG.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP traffic for redirect"),
		jsii.Bool(false), // Added missing parameter
	)

	// Web Server Security Group
	webSG := awsec2.NewSecurityGroup(stack, jsii.String("WebSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for web servers"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Allow traffic from ALB only
	webSG.AddIngressRule(
		albSG,
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP from ALB"),
		jsii.Bool(false), // Added missing parameter
	)

	// Database Security Group
	dbSG := awsec2.NewSecurityGroup(stack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String("Security group for RDS database"),
		AllowAllOutbound: jsii.Bool(false),
	})

	dbSG.AddIngressRule(
		webSG,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow MySQL access from web servers"),
		jsii.Bool(false), // Added missing parameter
	)

	// ===================
	// S3 Storage
	// ===================
	// Generate unique bucket name using account ID and region

	primaryBucket := awss3.NewBucket(stack, jsii.String("PrimaryStorageBucket"), &awss3.BucketProps{
		Versioned:         jsii.Bool(true),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     kmsKey,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:                                  jsii.String("DeleteIncompleteMultipartUploads"),
				Enabled:                             jsii.Bool(true),
				AbortIncompleteMultipartUploadAfter: awscdk.Duration_Days(jsii.Number(7)),
			},
			{
				Id:      jsii.String("TransitionToIA"),
				Enabled: jsii.Bool(true),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:    awss3.StorageClass_INFREQUENT_ACCESS(), // Fixed: Added parentheses
						TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
					},
					{
						StorageClass:    awss3.StorageClass_GLACIER(), // Fixed: Added parentheses
						TransitionAfter: awscdk.Duration_Days(jsii.Number(90)),
					},
				},
			},
		},
	})

	// ===================
	// Lambda Function for S3 Processing
	// ===================
	s3ProcessorFunction := awslambda.NewFunction(stack, jsii.String("S3ProcessorFunction"), &awslambda.FunctionProps{
		Runtime: awslambda.Runtime_PYTHON_3_9(),
		Handler: jsii.String("index.handler"),
		Code: awslambda.Code_FromInline(jsii.String(`
import json
import boto3

def handler(event, context):
    print(f"Processing S3 event: {json.dumps(event)}")
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        print(f"Processing file {key} from bucket {bucket}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed S3 event')
    }
        `)),
		Environment: &map[string]*string{
			"ENVIRONMENT": jsii.String(environmentSuffix),
		},
		Timeout: awscdk.Duration_Minutes(jsii.Number(5)),
	})

	// Grant S3 permissions to Lambda
	primaryBucket.GrantRead(s3ProcessorFunction, nil)

	// Add S3 event notification
	primaryBucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(s3ProcessorFunction),
		&awss3.NotificationKeyFilter{
			Prefix: jsii.String("uploads/"),
		},
	)

	// ===================
	// Parameter Store for Sensitive Data (Fixed deprecation warnings)
	// ===================
	awsssm.NewStringParameter(stack, jsii.String("DatabasePassword"), &awsssm.StringParameterProps{
		ParameterName: jsii.String("/myapp/database/password"),
		StringValue:   jsii.String("TempPassword123!ChangeInProduction"),
		// Removed Type field as it's deprecated and always defaults to String for StringParameter
		Description: jsii.String("Database master password"),
		Tier:        awsssm.ParameterTier_STANDARD,
	})

	awsssm.NewStringParameter(stack, jsii.String("APIKey"), &awsssm.StringParameterProps{
		ParameterName: jsii.String("/myapp/api/key"),
		StringValue:   jsii.String("demo-api-key-change-in-production"),
		// Removed Type field as it's deprecated
		Description: jsii.String("API key for external services"),
		Tier:        awsssm.ParameterTier_STANDARD,
	})

	// ===================
	// RDS Database (Multi-AZ)
	// ===================
	subnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
		Description: jsii.String("Subnet group for RDS database"),
		Vpc:         vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	database := awsrds.NewDatabaseInstance(stack, jsii.String("MainDatabase"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_37(), // Changed to more stable version
		}),
		InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_SMALL),
		Vpc:          vpc,
		SecurityGroups: &[]awsec2.ISecurityGroup{
			dbSG,
		},
		SubnetGroup:            subnetGroup,
		MultiAz:                jsii.Bool(true),
		StorageEncrypted:       jsii.Bool(true),
		StorageEncryptionKey:   kmsKey,
		BackupRetention:        awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups: jsii.Bool(false),
		DeletionProtection:     jsii.Bool(false), // Changed to false for easier testing
		DatabaseName:           jsii.String("myapp"),
		AllocatedStorage:       jsii.Number(20),
		MaxAllocatedStorage:    jsii.Number(100),
		Credentials: awsrds.Credentials_FromGeneratedSecret(jsii.String("admin"), &awsrds.CredentialsBaseOptions{
			SecretName: jsii.String(fmt.Sprintf("rds-credentials-%s", environmentSuffix)),
		}),
		MonitoringInterval:        awscdk.Duration_Seconds(jsii.Number(60)),
		EnablePerformanceInsights: jsii.Bool(false),
		CloudwatchLogsExports: &[]*string{
			jsii.String("error"),
			jsii.String("general"),
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// ===================
	// IAM Role for EC2 Instances
	// ===================
	instanceRole := awsiam.NewRole(stack, jsii.String("EC2InstanceRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("CloudWatchAgentServerPolicy")),
		},
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"MinimalPermissions": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("ssm:GetParameter"),
							jsii.String("ssm:GetParameters"),
							jsii.String("ssm:GetParametersByPath"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:ssm:%s:%s:parameter/myapp/*", *region, *account)),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("kms:Decrypt"),
						},
						Resources: &[]*string{
							kmsKey.KeyArn(),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("s3:GetObject"),
							jsii.String("s3:PutObject"),
						},
						Resources: &[]*string{
							primaryBucket.ArnForObjects(jsii.String("*")),
						},
					}),
				},
			}),
		},
	})

	// ===================
	// CloudWatch Log Groups
	// ===================
	awslogs.NewLogGroup(stack, jsii.String("NginxAccessLogs"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/ec2/nginx/access"),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	awslogs.NewLogGroup(stack, jsii.String("NginxErrorLogs"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/ec2/nginx/error"),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// ===================
	// User Data for EC2 Instances
	// ===================
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	userData.AddCommands(
		jsii.String("#!/bin/bash"),
		jsii.String("yum update -y"),
		jsii.String("yum install -y amazon-cloudwatch-agent nginx htop"),
		jsii.String("systemctl start nginx"),
		jsii.String("systemctl enable nginx"),
		jsii.String("echo 'OK' > /usr/share/nginx/html/health"),
		jsii.String("echo '<h1>MyApp is Running</h1>' > /usr/share/nginx/html/index.html"),
		jsii.String("/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s"),
	)

	// ===================
	// Launch Template
	// ===================
	launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("WebServerLaunchTemplate"), &awsec2.LaunchTemplateProps{
		InstanceType: awsec2.NewInstanceType(jsii.String("t3.small")), // Changed to t3.small for cost
		MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
			// Removed Generation field as it doesn't exist in the latest CDK version
		}),
		SecurityGroup:      webSG,
		Role:               instanceRole,
		UserData:           userData,
		DetailedMonitoring: jsii.Bool(true),
		BlockDevices: &[]*awsec2.BlockDevice{
			{
				DeviceName: jsii.String("/dev/xvda"),
				Volume: awsec2.BlockDeviceVolume_Ebs(jsii.Number(20), &awsec2.EbsDeviceOptions{
					VolumeType: awsec2.EbsDeviceVolumeType_GP3,
					Encrypted:  jsii.Bool(true),
				}),
			},
		},
	})

	// ===================
	// Application Load Balancer
	// ===================
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("ApplicationLoadBalancer"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc:            vpc,
		InternetFacing: jsii.Bool(true),
		SecurityGroup:  albSG,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Target Group
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("WebServerTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		Port:     jsii.Number(80),
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		Vpc:      vpc,
		HealthCheck: &awselasticloadbalancingv2.HealthCheck{
			Path:                    jsii.String("/health"),
			Protocol:                awselasticloadbalancingv2.Protocol_HTTP,
			HealthyThresholdCount:   jsii.Number(2),
			UnhealthyThresholdCount: jsii.Number(3),
			Timeout:                 awscdk.Duration_Seconds(jsii.Number(10)),
			Interval:                awscdk.Duration_Seconds(jsii.Number(30)),
		},
		TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
	})

	// ALB Listener
	alb.AddListener(jsii.String("HTTPListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:     jsii.Number(80),
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{
			targetGroup,
		},
	})

	// ===================
	// Auto Scaling Group
	// ===================
	asg := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("WebServerASG"), &awsautoscaling.AutoScalingGroupProps{
		Vpc:             vpc,
		LaunchTemplate:  launchTemplate,
		MinCapacity:     jsii.Number(2),
		MaxCapacity:     jsii.Number(10),
		DesiredCapacity: jsii.Number(2),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// Attach ASG to target group
	asg.AttachToApplicationTargetGroup(targetGroup)

	// ===================
	// Auto Scaling Policies
	// ===================

	// CPU-based scaling
	asg.ScaleOnCpuUtilization(jsii.String("CPUScaling"), &awsautoscaling.CpuUtilizationScalingProps{
		TargetUtilizationPercent: jsii.Number(70),
		// Removed ScaleInCooldown and ScaleOutCooldown as they don't exist in this struct
	})

	// ===================
	// CloudWatch Dashboard
	// ===================
	dashboard := awscloudwatch.NewDashboard(stack, jsii.String("InfrastructureDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String(fmt.Sprintf("MyApp-%s-Dashboard", environmentSuffix)),
	})

	// Add CPU metric widget
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("EC2 CPU Utilization"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace:  jsii.String("AWS/EC2"),
					MetricName: jsii.String("CPUUtilization"),
					DimensionsMap: &map[string]*string{
						"AutoScalingGroupName": asg.AutoScalingGroupName(),
					},
					Statistic: jsii.String("Average"), // Fixed: Use string instead of constant
				}),
			},
		}),
	)

	// ===================
	// CloudFormation Outputs
	// ===================
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String(fmt.Sprintf("VPC-ID-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ALBDNSName"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS Name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{
		Value:       primaryBucket.BucketName(),
		Description: jsii.String("Primary S3 Bucket Name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       database.InstanceEndpoint().Hostname(),
		Description: jsii.String("RDS Database Endpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("LambdaFunctionName"), &awscdk.CfnOutputProps{
		Value:       s3ProcessorFunction.FunctionName(),
		Description: jsii.String("S3 Processor Lambda Function Name"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
