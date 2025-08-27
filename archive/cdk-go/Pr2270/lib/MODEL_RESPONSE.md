I'll help you build a comprehensive, production-ready AWS infrastructure using AWS CDK with Go in a single stack. Let me create a robust solution that addresses all your requirements.

## Project Structure

```
aws-scalable-infrastructure/
├── go.mod
├── go.sum
├── main.go
├── config/
│   └── config.go
└── README.md
```

## 1. Go Module Setup

**go.mod**
```go
module aws-scalable-infrastructure

go 1.21

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.110.1
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
)
```

## 2. Configuration

**config/config.go**
```go
package config

type InfraConfig struct {
    Environment       string
    Region           string
    VpcCidr          string
    MinCapacity      float64
    MaxCapacity      float64
    DesiredCapacity  float64
    InstanceType     string
    DatabaseEngine   string
    DatabaseVersion  string
}

func NewInfraConfig() *InfraConfig {
    return &InfraConfig{
        Environment:      "production",
        Region:          "us-west-2",
        VpcCidr:         "10.0.0.0/16",
        MinCapacity:     2,
        MaxCapacity:     10,
        DesiredCapacity: 3,
        InstanceType:    "t3.medium",
        DatabaseEngine:  "mysql",
        DatabaseVersion: "8.0.35",
    }
}
```

## 3. Main Infrastructure Stack

**main.go**
```go
package main

import (
    "aws-scalable-infrastructure/config"
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awskms"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsssm"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

// Utility function for string pointers
func jsii.String(s string) *string {
    return jsii.String(s)
}

// Utility function for number pointers
func jsii.Number(n float64) *float64 {
    return jsii.Number(n)
}

// Utility function for boolean pointers
func jsii.Bool(b bool) *bool {
    return jsii.Bool(b)
}

// Apply common tags to resources
func applyCommonTags(scope constructs.Construct, environment string) {
    awscdk.Tags_Of(scope).Add(jsii.String("Environment"), jsii.String(environment), nil)
    awscdk.Tags_Of(scope).Add(jsii.String("Project"), jsii.String("ScalableInfra"), nil)
    awscdk.Tags_Of(scope).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
    awscdk.Tags_Of(scope).Add(jsii.String("CostCenter"), jsii.String("Engineering"), nil)
}

type ScalableInfrastructureStackProps struct {
    awscdk.StackProps
    Config *config.InfraConfig
}

type ScalableInfrastructureStack struct {
    awscdk.Stack
}

func NewScalableInfrastructureStack(scope constructs.Construct, id string, props *ScalableInfrastructureStackProps) *ScalableInfrastructureStack {
    var sprops awscdk.StackProps
    if props != nil {
        sprops = props.StackProps
    }
    stack := awscdk.NewStack(scope, &id, &sprops)

    // Apply common tags
    applyCommonTags(stack, props.Config.Environment)

    // ===================
    // KMS Key for Encryption
    // ===================
    kmsKey := awskms.NewKey(stack, jsii.String("InfraKMSKey"), &awskms.KeyProps{
        Description:       jsii.String("KMS key for infrastructure encryption"),
        EnableKeyRotation: jsii.Bool(true),
        RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
        KeyPolicy: awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
            Statements: &[]awsiam.PolicyStatement{
                awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                    Effect: awsiam.Effect_ALLOW,
                    Principals: &[]awsiam.IPrincipal{
                        awsiam.NewAccountRootPrincipal(),
                    },
                    Actions: &[]*string{
                        jsii.String("kms:*"),
                    },
                    Resources: &[]*string{
                        jsii.String("*"),
                    },
                }),
            },
        }),
    })

    // ===================
    // VPC and Networking
    // ===================
    vpc := awsec2.NewVpc(stack, jsii.String("MainVPC"), &awsec2.VpcProps{
        Cidr:   jsii.String(props.Config.VpcCidr),
        MaxAzs: jsii.Number(3), // Use 3 AZs for high availability
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
        NatGateways:        jsii.Number(3), // One NAT gateway per AZ for HA
    })

    // ===================
    // Security Groups
    // ===================

    // Application Load Balancer Security Group
    albSG := awsec2.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:              vpc,
        Description:      jsii.String("Security group for Application Load Balancer"),
        AllowAllOutbound: jsii.Bool(false),
    })

    // Allow HTTPS traffic to ALB
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(443)),
        jsii.String("Allow HTTPS traffic"),
        jsii.Bool(false),
    )

    // Allow HTTP traffic for redirect
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("Allow HTTP traffic for redirect"),
        jsii.Bool(false),
    )

    // Allow outbound to web servers
    albSG.AddEgressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("Allow HTTP to web servers"),
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
        jsii.Bool(false),
    )

    // Allow SSH from VPC for management
    webSG.AddIngressRule(
        awsec2.Peer_Ipv4(jsii.String(props.Config.VpcCidr)),
        awsec2.Port_Tcp(jsii.Number(22)),
        jsii.String("Allow SSH from VPC"),
        jsii.Bool(false),
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
        jsii.Bool(false),
    )

    // ===================
    // Network ACLs for Additional Security
    // ===================
    publicNacl := awsec2.NewNetworkAcl(stack, jsii.String("PublicNetworkAcl"), &awsec2.NetworkAclProps{
        Vpc: vpc,
        SubnetSelection: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    })

    // Allow HTTPS inbound
    publicNacl.AddEntry(jsii.String("AllowHTTPSInbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:  jsii.String("0.0.0.0/0"),
        RuleNumber: jsii.Number(100),
        Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(443)),
        Direction:  awsec2.TrafficDirection_INGRESS,
        RuleAction: awsec2.Action_ALLOW,
    })

    // Allow HTTP inbound (for redirect)
    publicNacl.AddEntry(jsii.String("AllowHTTPInbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:  jsii.String("0.0.0.0/0"),
        RuleNumber: jsii.Number(110),
        Traffic:    awsec2.AclTraffic_TcpPort(jsii.Number(80)),
        Direction:  awsec2.TrafficDirection_INGRESS,
        RuleAction: awsec2.Action_ALLOW,
    })

    // Allow ephemeral ports outbound
    publicNacl.AddEntry(jsii.String("AllowEphemeralOutbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:  jsii.String("0.0.0.0/0"),
        RuleNumber: jsii.Number(100),
        Traffic:    awsec2.AclTraffic_TcpPortRange(jsii.Number(1024), jsii.Number(65535)),
        Direction:  awsec2.TrafficDirection_EGRESS,
        RuleAction: awsec2.Action_ALLOW,
    })

    // ===================
    // S3 Storage
    // ===================
    primaryBucket := awss3.NewBucket(stack, jsii.String("PrimaryStorageBucket"), &awss3.BucketProps{
        BucketName:        jsii.String("myapp-primary-" + props.Config.Environment + "-" + props.Config.Region),
        Versioned:         jsii.Bool(true),
        Encryption:        awss3.BucketEncryption_KMS,
        EncryptionKey:     kmsKey,
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
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
                        StorageClass:    awss3.StorageClass_INFREQUENT_ACCESS,
                        TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
                    },
                    {
                        StorageClass:    awss3.StorageClass_GLACIER,
                        TransitionAfter: awscdk.Duration_Days(jsii.Number(90)),
                    },
                },
            },
        },
    })

    // ===================
    // Parameter Store for Sensitive Data
    // ===================
    awsssm.NewStringParameter(stack, jsii.String("DatabasePassword"), &awsssm.StringParameterProps{
        ParameterName: jsii.String("/myapp/database/password"),
        StringValue:   jsii.String("ChangeThisInProduction!"),
        Type:          awsssm.ParameterType_SECURE_STRING,
        Description:   jsii.String("Database master password"),
        Tier:          awsssm.ParameterTier_STANDARD,
    })

    awsssm.NewStringParameter(stack, jsii.String("APIKey"), &awsssm.StringParameterProps{
        ParameterName: jsii.String("/myapp/api/key"),
        StringValue:   jsii.String("your-secure-api-key-here"),
        Type:          awsssm.ParameterType_SECURE_STRING,
        Description:   jsii.String("API key for external services"),
        Tier:          awsssm.ParameterTier_STANDARD,
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

    parameterGroup := awsrds.NewParameterGroup(stack, jsii.String("DatabaseParameterGroup"), &awsrds.ParameterGroupProps{
        Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
            Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
        }),
        Description: jsii.String("Parameter group for MySQL database"),
        Parameters: &map[string]*string{
            "innodb_buffer_pool_size": jsii.String("{DBInstanceClassMemory*3/4}"),
            "max_connections":         jsii.String("200"),
            "slow_query_log":         jsii.String("1"),
            "long_query_time":        jsii.String("2"),
        },
    })

    database := awsrds.NewDatabaseInstance(stack, jsii.String("MainDatabase"), &awsrds.DatabaseInstanceProps{
        Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
            Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
        }),
        InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_SMALL),
        Vpc:          vpc,
        SecurityGroups: &[]awsec2.ISecurityGroup{
            dbSG,
        },
        SubnetGroup:              subnetGroup,
        ParameterGroup:           parameterGroup,
        MultiAz:                  jsii.Bool(true),
        StorageEncrypted:         jsii.Bool(true),
        StorageEncryptionKey:     kmsKey,
        BackupRetention:          awscdk.Duration_Days(jsii.Number(7)),
        DeleteAutomatedBackups:   jsii.Bool(false),
        DeletionProtection:       jsii.Bool(true),
        DatabaseName:             jsii.String("myapp"),
        AllocatedStorage:         jsii.Number(20),
        MaxAllocatedStorage:      jsii.Number(100),
        Credentials: awsrds.Credentials_FromGeneratedSecret(jsii.String("admin"), &awsrds.CredentialsBaseOptions{
            SecretName: jsii.String("rds-credentials"),
        }),
        MonitoringInterval:        awscdk.Duration_Seconds(jsii.Number(60)),
        EnablePerformanceInsights: jsii.Bool(true),
        PerformanceInsightRetention: awsrds.PerformanceInsightRetention_DEFAULT,
        CloudwatchLogsExports: &[]*string{
            jsii.String("error"),
            jsii.String("general"),
            jsii.String("slow-query"),
        },
        RemovalPolicy: awscdk.RemovalPolicy_SNAPSHOT,
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
                            jsii.String("arn:aws:ssm:" + props.Config.Region + ":*:parameter/myapp/*"),
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
                        Conditions: &map[string]interface{}{
                            "StringEquals": map[string]interface{}{
                                "kms:ViaService": "ssm." + props.Config.Region + ".amazonaws.com",
                            },
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

        // Configure nginx
        jsii.String("systemctl start nginx"),
        jsii.String("systemctl enable nginx"),

        // Create health check endpoint
        jsii.String("echo 'OK' > /usr/share/nginx/html/health"),

        // Configure CloudWatch agent
        jsii.String("cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'"),
        jsii.String(`{
            "metrics": {
                "namespace": "MyApp/EC2",
                "metrics_collected": {
                    "cpu": {
                        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                        "metrics_collection_interval": 60
                    },
                    "disk": {
                        "measurement": ["used_percent"],
                        "metrics_collection_interval": 60,
                        "resources": ["*"]
                    },
                    "mem": {
                        "measurement": ["mem_used_percent"],
                        "metrics_collection_interval": 60
                    }
                }
            },
            "logs": {
                "logs_collected": {
                    "files": {
                        "collect_list": [
                            {
                                "file_path": "/var/log/nginx/access.log",
                                "log_group_name": "/aws/ec2/nginx/access",
                                "log_stream_name": "{instance_id}"
                            },
                            {
                                "file_path": "/var/log/nginx/error.log",
                                "log_group_name": "/aws/ec2/nginx/error",
                                "log_stream_name": "{instance_id}"
                            }
                        ]
                    }
                }
            }
        }`),
        jsii.String("EOF"),

        // Start CloudWatch agent
        jsii.String("/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"),

        // Signal successful initialization
        jsii.String("yum install -y aws-cfn-bootstrap"),
        jsii.String("/opt/aws/bin/cfn-signal -e $? --stack " + *stack.StackName() + " --resource AutoScalingGroup --region " + props.Config.Region),
    )

    // ===================
    // Launch Template
    // ===================
    launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("WebServerLaunchTemplate"), &awsec2.LaunchTemplateProps{
        InstanceType: awsec2.NewInstanceType(jsii.String(props.Config.InstanceType)),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
            Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
        }),
        SecurityGroup:      webSG,
        Role:              instanceRole,
        UserData:          userData,
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
        MinCapacity:     jsii.Number(props.Config.MinCapacity),
        MaxCapacity:     jsii.Number(props.Config.MaxCapacity),
        DesiredCapacity: jsii.Number(props.Config.DesiredCapacity),
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
        },
        HealthCheck: awsautoscaling.HealthCheck_Elb(&awsautoscaling.ElbHealthCheckOptions{
            Grace: awscdk.Duration_Minutes(jsii.Number(5)),
        }),
        UpdatePolicy: awsautoscaling.UpdatePolicy_RollingUpdate(&awsautoscaling.RollingUpdateOptions{
            MaxBatchSize:          jsii.Number(2),
            MinInstancesInService: jsii.Number(props.Config.MinCapacity),
            PauseTime:             awscdk.Duration_Minutes(jsii.Number(10)),
            WaitOnResourceSignals: jsii.Bool(true),
        }),
        Signals: awsautoscaling.Signals_WaitForAll(&awsautoscaling.SignalsOptions{
            Timeout: awscdk.Duration_Minutes(jsii.Number(15)),
        }),
    })

    // Attach ASG to target group
    asg.AttachToApplicationTargetGroup(targetGroup)

    // ===================
    // Auto Scaling Policies
    // ===================

    // CPU-based scaling
    asg.ScaleOnCpuUtilization(jsii.String("CPUScaling"), &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: jsii.Number(70),
        ScaleInCooldown:          awscdk.Duration_Minutes(jsii.Number(5)),
        ScaleOutCooldown:         awscdk.Duration_Minutes(jsii.Number(3)),
    })

    // Request count-based scaling
    asg.ScaleOnRequestCount(jsii.String("RequestCountScaling"), &awsautoscaling.RequestCountScalingProps{
        RequestsPerMinute: jsii.Number(1000),
        TargetGroup:       targetGroup,
        ScaleInCooldown:   awscdk.Duration_Minutes(jsii.Number(5)),
        ScaleOutCooldown:  awscdk.Duration_Minutes(jsii.Number(3)),
    })

    // ===================
    // CloudWatch Dashboard
    // ===================
    dashboard := awscloudwatch.NewDashboard(stack, jsii.String("InfrastructureDashboard"), &awscloudwatch.DashboardProps{
        DashboardName: jsii.String("MyApp-" + props.Config.Environment + "-Dashboard"),
    })

    // Add widgets to dashboard
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
                    Statistic: awscloudwatch.Statistic_AVERAGE,
                