### lib/tap_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"

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
	VPC           awsec2.Vpc
	SecurityGroup awsec2.SecurityGroup
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// 1. VPC Setup with public and private subnets across 2 AZs
	vpc := awsec2.NewVpc(stack, jsii.String("tap-vpc"), &awsec2.VpcProps{
		VpcName:            jsii.String("tap-vpc"),
		IpAddresses:        awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:             jsii.Number(2), // Dual AZ requirement
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
		RoleName:  jsii.String("tap-ec2-role-" + *awscdk.Aws_ACCOUNT_ID()),
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

	// Instance profile for EC2 (commented out as not used)
	// instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("tap-instance-profile"), &awsiam.InstanceProfileProps{
	// 	InstanceProfileName: jsii.String("tap-instance-profile"),
	// 	Role:                ec2Role,
	// })

	// 4. S3 Buckets with encryption and blocked public access
	s3Bucket := awss3.NewBucket(stack, jsii.String("tap-storage-bucket"), &awss3.BucketProps{
		BucketName:        jsii.String("tap-storage-bucket-" + *awscdk.Aws_ACCOUNT_ID()),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		EnforceSSL:        jsii.Bool(true),
	})

	// 5. Secrets Manager for database credentials
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("tap-db-secret"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("tap-db-credentials-" + *awscdk.Aws_ACCOUNT_ID()),
		Description: jsii.String("Database credentials for TAP application"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "admin"}`),
			GenerateStringKey:    jsii.String("password"),
			ExcludeCharacters:    jsii.String(`"@/\`),
		},
	})

	// 6. RDS Database in private subnets
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("tap-db-subnet-group"), &awsrds.SubnetGroupProps{
		SubnetGroupName: jsii.String("tap-db-subnet-group-" + *awscdk.Aws_ACCOUNT_ID()),
		Description:     jsii.String("Subnet group for TAP database"),
		Vpc:             vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	rdsInstance := awsrds.NewDatabaseInstance(stack, jsii.String("tap-database"), &awsrds.DatabaseInstanceProps{
		InstanceIdentifier: jsii.String("tap-database-" + *awscdk.Aws_ACCOUNT_ID()),
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_39(),
		}),
		InstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MICRO),
		Credentials:        awsrds.Credentials_FromSecret(dbSecret, jsii.String("admin")),
		Vpc:                vpc,
		SubnetGroup:        dbSubnetGroup,
		SecurityGroups:     &[]awsec2.ISecurityGroup{dbSecurityGroup},
		MultiAz:            jsii.Bool(true),
		StorageEncrypted:   jsii.Bool(true),
		BackupRetention:    awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection: jsii.Bool(false), // Set to true in production
		RemovalPolicy:      awscdk.RemovalPolicy_DESTROY,
	})

	// 7. DynamoDB with point-in-time recovery
	dynamoTable := awsdynamodb.NewTable(stack, jsii.String("tap-dynamodb-table"), &awsdynamodb.TableProps{
		TableName:   jsii.String("tap-dynamodb-table-" + *awscdk.Aws_ACCOUNT_ID()),
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
		LoadBalancerName: jsii.String("tap-alb-" + *awscdk.Aws_ACCOUNT_ID()),
		Vpc:              vpc,
		InternetFacing:   jsii.Bool(true),
		SecurityGroup:    albSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// 9. Launch Template for EC2 instances
	launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("tap-launch-template"), &awsec2.LaunchTemplateProps{
		LaunchTemplateName: jsii.String("tap-launch-template-" + *awscdk.Aws_ACCOUNT_ID()),
		InstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage:       awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{}),
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
		AutoScalingGroupName: jsii.String("tap-asg-" + *awscdk.Aws_ACCOUNT_ID()),
		Vpc:                  vpc,
		LaunchTemplate:       launchTemplate,
		MinCapacity:          jsii.Number(2),
		MaxCapacity:          jsii.Number(6),
		DesiredCapacity:      jsii.Number(2),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		HealthCheck: awsautoscaling.HealthCheck_Elb(&awsautoscaling.ElbHealthCheckOptions{
			Grace: awscdk.Duration_Seconds(jsii.Number(300)),
		}),
	})

	// 11. Target Group and Listener
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("tap-target-group"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		TargetGroupName: jsii.String("tap-target-group-" + *awscdk.Aws_ACCOUNT_ID()),
		Port:            jsii.Number(80),
		Protocol:        awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		Vpc:             vpc,
		TargetType:      awselasticloadbalancingv2.TargetType_INSTANCE,
	})

	asg.AttachToApplicationTargetGroup(targetGroup)

	_ = alb.AddListener(jsii.String("tap-listener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port:          jsii.Number(80),
		Protocol:      awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultAction: awselasticloadbalancingv2.ListenerAction_Forward(&[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup}, nil),
	})

	// 12. WAF Web ACL
	webAcl := awswafv2.NewCfnWebACL(stack, jsii.String("tap-waf"), &awswafv2.CfnWebACLProps{
		Name:  jsii.String("tap-waf-" + *awscdk.Aws_ACCOUNT_ID()),
		Scope: jsii.String("REGIONAL"),
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
					None: &map[string]interface{}{},
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

	// Associate WAF with ALB
	awswafv2.NewCfnWebACLAssociation(stack, jsii.String("tap-waf-alb-association"), &awswafv2.CfnWebACLAssociationProps{
		ResourceArn: alb.LoadBalancerArn(),
		WebAclArn:   webAcl.AttrArn(),
	})

	// 13. CloudFront Distribution (without WAF, since we're using REGIONAL WAF with ALB)
	distribution := awscloudfront.NewDistribution(stack, jsii.String("tap-cloudfront"), &awscloudfront.DistributionProps{
		DefaultBehavior: &awscloudfront.BehaviorOptions{
			Origin: awscloudfrontorigins.NewHttpOrigin(jsii.String(*alb.LoadBalancerDnsName()), &awscloudfrontorigins.HttpOriginProps{
				ProtocolPolicy: awscloudfront.OriginProtocolPolicy_HTTP_ONLY,
			}),
			ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
			AllowedMethods:       awscloudfront.AllowedMethods_ALLOW_ALL(),
			CachedMethods:        awscloudfront.CachedMethods_CACHE_GET_HEAD(),
		},
	})

	// Note: AWS Config removed due to regional limit of 1 configuration recorder per region
	// The AWS account already has an existing configuration recorder in this region

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
		Stack:         stack,
		VPC:           vpc,
		SecurityGroup: ec2SecurityGroup,
	}
}
```

### main.go

```go
// In main.go
package main

import (
	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)
	lib.NewTapStack(app, "tap-iac-stack")
	app.Synth()
}
```

### tap.go
```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"github.com/TuringGpt/iac-test-automations/lib"
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
	// For synthesis, we can skip account ID if not available
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	if account == "" {
		return nil // CDK will use default environment for synthesis
	}
	return &awscdk.Environment{
		Account: jsii.String(account),
		Region:  jsii.String("us-west-2"), // Fixed region as per requirements
	}
}
```