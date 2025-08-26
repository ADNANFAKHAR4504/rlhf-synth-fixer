I'll help you build a comprehensive, production-ready AWS infrastructure using AWS CDK with Go. Let me create a robust solution that addresses all your requirements with proper scaling, security, and monitoring.

## Project Structure

```
aws-scalable-infrastructure/
├── go.mod
├── go.sum
├── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── stacks/
│   │   ├── networking.go
│   │   ├── compute.go
│   │   ├── storage.go
│   │   ├── database.go
│   │   ├── lambda.go
│   │   ├── monitoring.go
│   │   └── dns.go
│   └── utils/
│       └── helpers.go
├── lambda/
│   └── s3-processor/
│       └── main.go
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

## 2. Configuration and Utilities

**internal/config/config.go**
```go
package config

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
)

type InfraConfig struct {
    Environment       string
    PrimaryRegion     string
    SecondaryRegion   string
    VpcCidr          string
    SecondaryVpcCidr string
    MinCapacity      float64
    MaxCapacity      float64
    DesiredCapacity  float64
    InstanceType     string
}

func NewInfraConfig() *InfraConfig {
    return &InfraConfig{
        Environment:       "production",
        PrimaryRegion:     "us-west-2",
        SecondaryRegion:   "us-east-1",
        VpcCidr:          "10.0.0.0/16",
        SecondaryVpcCidr: "10.1.0.0/16",
        MinCapacity:      2,
        MaxCapacity:      10,
        DesiredCapacity:  3,
        InstanceType:     "t3.medium",
    }
}

type StackProps struct {
    awscdk.StackProps
    Config *InfraConfig
}
```

**internal/utils/helpers.go**
```go
package utils

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
)

func Ptr[T any](v T) *T {
    return &v
}

func ApplyCommonTags(scope constructs.Construct, environment string) {
    awscdk.Tags_Of(scope).Add(Ptr("Environment"), Ptr(environment), nil)
    awscdk.Tags_Of(scope).Add(Ptr("Project"), Ptr("ScalableInfra"), nil)
    awscdk.Tags_Of(scope).Add(Ptr("ManagedBy"), Ptr("CDK"), nil)
    awscdk.Tags_Of(scope).Add(Ptr("CostCenter"), Ptr("Engineering"), nil)
}

func CreateResourceName(prefix, environment, suffix string) string {
    return prefix + "-" + environment + "-" + suffix
}
```

## 3. Networking Stack

**internal/stacks/networking.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-scalable-infrastructure/internal/config"
    "aws-scalable-infrastructure/internal/utils"
)

type NetworkingStack struct {
    awscdk.Stack
    VPC                   awsec2.Vpc
    PublicSubnets         []awsec2.ISubnet
    PrivateSubnets        []awsec2.ISubnet
    DatabaseSubnets       []awsec2.ISubnet
    WebSecurityGroup      awsec2.SecurityGroup
    DatabaseSecurityGroup awsec2.SecurityGroup
    LambdaSecurityGroup   awsec2.SecurityGroup
    ALBSecurityGroup      awsec2.SecurityGroup
}

func NewNetworkingStack(scope constructs.Construct, id string, props *config.StackProps) *NetworkingStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create VPC with multiple AZs for high availability
    vpc := awsec2.NewVpc(stack, utils.Ptr("MainVPC"), &awsec2.VpcProps{
        Cidr:   utils.Ptr(props.Config.VpcCidr),
        MaxAzs: utils.Ptr(float64(3)), // Use 3 AZs for better availability
        SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
            {
                Name:       utils.Ptr("PublicSubnet"),
                SubnetType: awsec2.SubnetType_PUBLIC,
                CidrMask:   utils.Ptr(float64(24)),
            },
            {
                Name:       utils.Ptr("PrivateSubnet"),
                SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
                CidrMask:   utils.Ptr(float64(24)),
            },
            {
                Name:       utils.Ptr("DatabaseSubnet"),
                SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
                CidrMask:   utils.Ptr(float64(26)),
            },
        },
        EnableDnsHostnames: utils.Ptr(true),
        EnableDnsSupport:   utils.Ptr(true),
        NatGateways:        utils.Ptr(float64(3)), // One NAT gateway per AZ for HA
    })
    
    // Application Load Balancer Security Group
    albSG := awsec2.NewSecurityGroup(stack, utils.Ptr("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:              vpc,
        Description:      utils.Ptr("Security group for Application Load Balancer"),
        AllowAllOutbound: utils.Ptr(false),
    })
    
    // Allow HTTPS and HTTP traffic to ALB
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(utils.Ptr(float64(443))),
        utils.Ptr("Allow HTTPS traffic"),
        utils.Ptr(false),
    )
    
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(utils.Ptr(float64(80))),
        utils.Ptr("Allow HTTP traffic for redirect"),
        utils.Ptr(false),
    )
    
    // Allow outbound to web servers
    albSG.AddEgressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(utils.Ptr(float64(80))),
        utils.Ptr("Allow HTTP to web servers"),
    )
    
    // Web Server Security Group
    webSG := awsec2.NewSecurityGroup(stack, utils.Ptr("WebSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:              vpc,
        Description:      utils.Ptr("Security group for web servers"),
        AllowAllOutbound: utils.Ptr(true),
    })
    
    // Allow traffic from ALB only
    webSG.AddIngressRule(
        albSG,
        awsec2.Port_Tcp(utils.Ptr(float64(80))),
        utils.Ptr("Allow HTTP from ALB"),
        utils.Ptr(false),
    )
    
    // Allow SSH from bastion (if needed)
    webSG.AddIngressRule(
        awsec2.Peer_Ipv4(utils.Ptr(props.Config.VpcCidr)),
        awsec2.Port_Tcp(utils.Ptr(float64(22))),
        utils.Ptr("Allow SSH from VPC"),
        utils.Ptr(false),
    )
    
    // Database Security Group
    dbSG := awsec2.NewSecurityGroup(stack, utils.Ptr("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:              vpc,
        Description:      utils.Ptr("Security group for RDS database"),
        AllowAllOutbound: utils.Ptr(false),
    })
    
    dbSG.AddIngressRule(
        webSG,
        awsec2.Port_Tcp(utils.Ptr(float64(3306))),
        utils.Ptr("Allow MySQL access from web servers"),
        utils.Ptr(false),
    )
    
    // Lambda Security Group
    lambdaSG := awsec2.NewSecurityGroup(stack, utils.Ptr("LambdaSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:              vpc,
        Description:      utils.Ptr("Security group for Lambda functions"),
        AllowAllOutbound: utils.Ptr(true),
    })
    
    // Network ACLs for additional security layers
    publicNacl := awsec2.NewNetworkAcl(stack, utils.Ptr("PublicNetworkAcl"), &awsec2.NetworkAclProps{
        Vpc: vpc,
        SubnetSelection: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    })
    
    // Allow HTTPS inbound
    publicNacl.AddEntry(utils.Ptr("AllowHTTPSInbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:   utils.Ptr("0.0.0.0/0"),
        RuleNumber:  utils.Ptr(float64(100)),
        Traffic:     awsec2.AclTraffic_TcpPort(utils.Ptr(float64(443))),
        Direction:   awsec2.TrafficDirection_INGRESS,
        RuleAction:  awsec2.Action_ALLOW,
    })
    
    // Allow HTTP inbound (for redirect)
    publicNacl.AddEntry(utils.Ptr("AllowHTTPInbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:   utils.Ptr("0.0.0.0/0"),
        RuleNumber:  utils.Ptr(float64(110)),
        Traffic:     awsec2.AclTraffic_TcpPort(utils.Ptr(float64(80))),
        Direction:   awsec2.TrafficDirection_INGRESS,
        RuleAction:  awsec2.Action_ALLOW,
    })
    
    // Allow ephemeral ports outbound
    publicNacl.AddEntry(utils.Ptr("AllowEphemeralOutbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock:   utils.Ptr("0.0.0.0/0"),
        RuleNumber:  utils.Ptr(float64(100)),
        Traffic:     awsec2.AclTraffic_TcpPortRange(utils.Ptr(float64(1024)), utils.Ptr(float64(65535))),
        Direction:   awsec2.TrafficDirection_EGRESS,
        RuleAction:  awsec2.Action_ALLOW,
    })
    
    // Export important resources
    awscdk.NewCfnOutput(stack, utils.Ptr("VPCId"), &awscdk.CfnOutputProps{
        Value:       vpc.VpcId(),
        Description: utils.Ptr("VPC ID for cross-stack references"),
        ExportName:  utils.Ptr("VPCId-" + props.Config.Environment),
    })
    
    awscdk.NewCfnOutput(stack, utils.Ptr("PublicSubnetIds"), &awscdk.CfnOutputProps{
        Value:       awscdk.Fn_Join(utils.Ptr(","), vpc.PublicSubnets()),
        Description: utils.Ptr("Public subnet IDs"),
        ExportName:  utils.Ptr("PublicSubnetIds-" + props.Config.Environment),
    })
    
    awscdk.NewCfnOutput(stack, utils.Ptr("PrivateSubnetIds"), &awscdk.CfnOutputProps{
        Value:       awscdk.Fn_Join(utils.Ptr(","), vpc.PrivateSubnets()),
        Description: utils.Ptr("Private subnet IDs"),
        ExportName:  utils.Ptr("PrivateSubnetIds-" + props.Config.Environment),
    })
    
    return &NetworkingStack{
        Stack:                 stack,
        VPC:                   vpc,
        PublicSubnets:         vpc.PublicSubnets(),
        PrivateSubnets:        vpc.PrivateSubnets(),
        DatabaseSubnets:       vpc.IsolatedSubnets(),
        WebSecurityGroup:      webSG,
        DatabaseSecurityGroup: dbSG,
        LambdaSecurityGroup:   lambdaSG,
        ALBSecurityGroup:      albSG,
    }
}
```

## 4. Compute Stack with Auto Scaling

**internal/stacks/compute.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-scalable-infrastructure/internal/config"
    "aws-scalable-infrastructure/internal/utils"
)

type ComputeStack struct {
    awscdk.Stack
    AutoScalingGroup     awsautoscaling.AutoScalingGroup
    ApplicationLoadBalancer awselasticloadbalancingv2.ApplicationLoadBalancer
    TargetGroup         awselasticloadbalancingv2.ApplicationTargetGroup
    InstanceRole        awsiam.Role
}

func NewComputeStack(scope constructs.Construct, id string, props *config.StackProps, networkingStack *NetworkingStack) *ComputeStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create IAM role for EC2 instances with minimal required permissions
    instanceRole := awsiam.NewRole(stack, utils.Ptr("EC2InstanceRole"), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(utils.Ptr("ec2.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(utils.Ptr("AmazonSSMManagedInstanceCore")),
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(utils.Ptr("CloudWatchAgentServerPolicy")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "ParameterStoreAccess": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            utils.Ptr("ssm:GetParameter"),
                            utils.Ptr("ssm:GetParameters"),
                            utils.Ptr("ssm:GetParametersByPath"),
                        },
                        Resources: &[]*string{
                            utils.Ptr("arn:aws:ssm:" + props.Config.PrimaryRegion + ":*:parameter/myapp/*"),
                        },
                    }),
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            utils.Ptr("kms:Decrypt"),
                        },
                        Resources: &[]*string{
                            utils.Ptr("arn:aws:kms:" + props.Config.PrimaryRegion + ":*:key/*"),
                        },
                        Conditions: &map[string]interface{}{
                            "StringEquals": map[string]interface{}{
                                "kms:ViaService": "ssm." + props.Config.PrimaryRegion + ".amazonaws.com",
                            },
                        },
                    }),
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            utils.Ptr("s3:GetObject"),
                            utils.Ptr("s3:PutObject"),
                        },
                        Resources: &[]*string{
                            utils.Ptr("arn:aws:s3:::myapp-*-" + props.Config.Environment + "/*"),
                        },
                    }),
                },
            }),
        },
    })
    
    // Enhanced user data script for robust instance initialization
    userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
    userData.AddCommands(
        utils.Ptr("#!/bin/bash"),
        utils.Ptr("yum update -y"),
        utils.Ptr("yum install -y amazon-cloudwatch-agent nginx htop"),
        
        // Configure nginx
        utils.Ptr("systemctl start nginx"),
        utils.Ptr("systemctl enable nginx"),
        
        // Configure CloudWatch agent
        utils.Ptr("cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'"),
        utils.Ptr(`{
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
        utils.Ptr("EOF"),
        
        // Start CloudWatch agent
        utils.Ptr("/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"),
        
        // Signal successful initialization
        utils.Ptr("yum install -y aws-cfn-bootstrap"),
        utils.Ptr("/opt/aws/bin/cfn-signal -e $? --stack " + *stack.StackName() + " --resource AutoScalingGroup --region " + props.Config.PrimaryRegion),
    )
    
    // Launch template with enhanced configuration
    launchTemplate := awsec2.NewLaunchTemplate(stack, utils.Ptr("WebServerLaunchTemplate"), &awsec2.LaunchTemplateProps{
        InstanceType: awsec2.NewInstanceType(utils.Ptr(props.Config.InstanceType)),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
            Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
        }),
        SecurityGroup:      networkingStack.WebSecurityGroup,
        Role:              instanceRole,
        UserData:          userData,
        DetailedMonitoring: utils.Ptr(true),
        BlockDevices: &[]*awsec2.BlockDevice{
            {
                DeviceName: utils.Ptr("/dev/xvda"),
                Volume: awsec2.BlockDeviceVolume_Ebs(utils.Ptr(float64(20)), &awsec2.EbsDeviceOptions{
                    VolumeType: awsec2.EbsDeviceVolumeType_GP3,
                    Encrypted:  utils.Ptr(true),
                }),
            },
        },
    })
    
    // Application Load Balancer
    alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, utils.Ptr("ApplicationLoadBalancer"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
        Vpc:            networkingStack.VPC,
        InternetFacing: utils.Ptr(true),
        SecurityGroup:  networkingStack.ALBSecurityGroup,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    })
    
    // Target Group
    targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, utils.Ptr("WebServerTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
        Port:     utils.Ptr(float64(80)),
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
        Vpc:      networkingStack.VPC,
        HealthCheck: &awselasticloadbalancingv2.HealthCheck{
            Path:                utils.Ptr("/health"),
            Protocol:            awselasticloadbalancingv2.Protocol_HTTP,
            HealthyThresholdCount: utils.Ptr(float64(2)),
            UnhealthyThresholdCount: utils.Ptr(float64(3)),
            Timeout:             awscdk.Duration_Seconds(utils.Ptr(float64(10))),
            Interval:            awscdk.Duration_Seconds(utils.Ptr(float64(30))),
        },
        TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
    })
    
    // ALB Listener
    listener := alb.AddListener(utils.Ptr("HTTPListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
        Port:     utils.Ptr(float64(80)),
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
        DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{
            targetGroup,
        },
    })
    
    // Auto Scaling Group with enhanced configuration
    asg := awsautoscaling.NewAutoScalingGroup(stack, utils.Ptr("WebServerASG"), &awsautoscaling.AutoScalingGroupProps{
        Vpc:             networkingStack.VPC,
        LaunchTemplate:  launchTemplate,
        MinCapacity:     utils.Ptr(props.Config.MinCapacity),
        MaxCapacity:     utils.Ptr(props.Config.MaxCapacity),
        DesiredCapacity: utils.Ptr(props.Config.DesiredCapacity),
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
        },
        HealthCheck: awsautoscaling.HealthCheck_Elb(&awsautoscaling.ElbHealthCheckOptions{
            Grace: awscdk.Duration_Minutes(utils.Ptr(float64(5))),
        }),
        UpdatePolicy: awsautoscaling.UpdatePolicy_RollingUpdate(&awsautoscaling.RollingUpdateOptions{
            MaxBatchSize:          utils.Ptr(float64(2)),
            MinInstancesInService: utils.Ptr(props.Config.MinCapacity),
            PauseTime:             awscdk.Duration_Minutes(utils.Ptr(float64(10))),
            WaitOnResourceSignals: utils.Ptr(true),
        }),
        Signals: awsautoscaling.Signals_WaitForAll(&awsautoscaling.SignalsOptions{
            Timeout: awscdk.Duration_Minutes(utils.Ptr(float64(15))),
        }),
    })
    
    // Attach ASG to target group
    asg.AttachToApplicationTargetGroup(targetGroup)
    
    // Multiple scaling policies for different scenarios
    
    // CPU-based scaling
    cpuScaling := asg.ScaleOnCpuUtilization(utils.Ptr("CPUScaling"), &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: utils.Ptr(float64(70)),
        ScaleInCooldown:          awscdk.Duration_Minutes(utils.Ptr(float64(5))),
        ScaleOutCooldown:         awscdk.Duration_Minutes(utils.Ptr(float64(3))),
    })
    
    // Request count-based scaling
    asg.ScaleOnRequestCount(utils.Ptr("RequestCountScaling"), &awsautoscaling.RequestCountScalingProps{
        RequestsPerMinute:        utils.Ptr(float64(1000)),
        TargetGroup:              targetGroup,
        ScaleInCooldown:          awscdk.Duration_Minutes(utils.Ptr(float64(5))),
        ScaleOutCooldown:         awscdk.Duration_Minutes(utils.Ptr(float64(3))),
    })
    
    // Memory-based scaling using custom metric
    memoryMetric := awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
        Namespace:  utils.Ptr("MyApp/EC2"),
        MetricName: utils.Ptr("MemoryUtilization"),
        DimensionsMap: &map[string]*string{
            "AutoScalingGroupName": asg.AutoScalingGroupName(),
        },
        Statistic: awscloudwatch.Statistic_AVERAGE,
        Period:    awscdk.Duration_Minutes(utils.Ptr(float64(5))),
    })
    
    asg.ScaleOnMetric(utils.Ptr("MemoryScaling"), &awsautoscaling.BasicStepScalingPolicyProps{
        Metric:               memoryMetric,
        ScalingSteps: &[]*awsautoscaling.ScalingInterval{
            {
                Upper:  utils.Ptr(float64(50)),
                Change: utils.Ptr(float64(-1)),
            },
            {
                Lower:  utils.Ptr(float64(80)),
                Change: utils.Ptr(float64(1)),
            },
            {
                Lower:  utils.Ptr(float64(90)),
                Change: utils.Ptr(float64(2)),
            },
        },
        AdjustmentType: awsautoscaling.AdjustmentType_CHANGE_IN_CAPACITY,
    })
    
    // CloudWatch Alarms for monitoring
    awscloudwatch.NewAlarm(stack, utils.Ptr("HighCPUAlarm"), &awscloudwatch.AlarmProps{
        Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
            Namespace:  utils.Ptr("AWS/EC2"),
            MetricName: utils.Ptr("CPUUtilization"),
            DimensionsMap: &map[string]*string{
                "AutoScalingGroupName": asg.AutoScalingGroupName(),
            },
            Statistic: awscloudwatch.Statistic_AVERAGE,
            Period:    awscdk.Duration_Minutes(utils.Ptr(float64(5))),
        }),
        Threshold:          utils.Ptr(float64(85)),
        ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
        EvaluationPeriods:  utils.Ptr(float64(2)),
        TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
        AlarmDescription:   utils.Ptr("High CPU utilization alarm"),
    })
    
    // Export important resources
    awscdk.NewCfnOutput(stack, utils.Ptr("LoadBalancerDNS"), &awscdk.CfnOutputProps{
        Value:       alb.LoadBalancerDnsName(),
        Description: utils.Ptr("Application Load Balancer DNS name"),
        ExportName:  utils.Ptr("LoadBalancerDNS-" + props.Config.Environment),
    })
    
    return &ComputeStack{
        Stack:                   stack,
        AutoScalingGroup:        asg,
        ApplicationLoadBalancer: alb,
        TargetGroup:            targetGroup,
        InstanceRole:           instanceRole,
    }
}
```

## 5. Storage Stack with S3 and KMS

**internal/stacks/storage.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/aws-cdk-go/awscdk/v2/awskms"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsssm"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-scalable-infrastructure/internal/config"
    "aws-scalable-infrastructure/internal/utils"
)

type StorageStack struct {
    awscdk.Stack
    PrimaryBucket     awss3.Bucket
    SecondaryBucket   awss3.Bucket
    LoggingBucket     awss3.Bucket
    KMSKey           awskms.Key
    ReplicationRole   awsiam.Role
}

func NewStorageStack(scope constructs.Construct, id string, props *config.StackProps) *StorageStack {
    stack := awscdk.NewStack(scope, &id, &props