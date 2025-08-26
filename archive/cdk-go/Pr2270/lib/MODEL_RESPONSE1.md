I'll help you build a robust, multi-region AWS infrastructure using AWS CDK with Go. Let me create a comprehensive solution that addresses all your requirements.

## Project Structure

First, let's set up the project structure:

```
aws-multi-region-infrastructure/
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
│       └── tags.go
└── README.md
```

## 1. Go Module Setup

**go.mod**
```go
module aws-multi-region-infrastructure

go 1.21

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.110.1
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
)
```

## 2. Configuration

**internal/config/config.go**
```go
package config

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
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
}

func NewInfraConfig() *InfraConfig {
    return &InfraConfig{
        Environment:       "production",
        PrimaryRegion:     "us-west-2",
        SecondaryRegion:   "us-east-1",
        VpcCidr:          "10.0.0.0/16",
        SecondaryVpcCidr: "10.1.0.0/16",
        MinCapacity:      1,
        MaxCapacity:      2,
        DesiredCapacity:  1,
    }
}

type StackProps struct {
    awscdk.StackProps
    Config *InfraConfig
}
```

## 3. Utility Functions

**internal/utils/tags.go**
```go
package utils

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
)

func ApplyCommonTags(scope constructs.Construct, environment string) {
    awscdk.Tags_Of(scope).Add(jsii.String("Environment"), jsii.String(environment), nil)
    awscdk.Tags_Of(scope).Add(jsii.String("Project"), jsii.String("MultiRegionInfra"), nil)
    awscdk.Tags_Of(scope).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
}

func jsii.String(s string) *string {
    return &s
}

func jsii.Number(n float64) *float64 {
    return &n
}

func jsii.Bool(b bool) *bool {
    return &b
}
```

## 4. Networking Stack

**internal/stacks/networking.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-multi-region-infrastructure/internal/config"
    "aws-multi-region-infrastructure/internal/utils"
)

type NetworkingStack struct {
    awscdk.Stack
    VPC            awsec2.Vpc
    PublicSubnets  []awsec2.ISubnet
    PrivateSubnets []awsec2.ISubnet
    WebSecurityGroup awsec2.SecurityGroup
    DatabaseSecurityGroup awsec2.SecurityGroup
}

func NewNetworkingStack(scope constructs.Construct, id string, props *config.StackProps) *NetworkingStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // Apply common tags
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create VPC
    vpc := awsec2.NewVpc(stack, utils.jsii.String("MainVPC"), &awsec2.VpcProps{
        Cidr: utils.jsii.String(props.Config.VpcCidr),
        MaxAzs: utils.jsii.Number(2),
        SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
            {
                Name:       utils.jsii.String("PublicSubnet"),
                SubnetType: awsec2.SubnetType_PUBLIC,
                CidrMask:   utils.jsii.Number(24),
            },
            {
                Name:       utils.jsii.String("PrivateSubnet"),
                SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
                CidrMask:   utils.jsii.Number(24),
            },
            {
                Name:       utils.jsii.String("DatabaseSubnet"),
                SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
                CidrMask:   utils.jsii.Number(24),
            },
        },
        EnableDnsHostnames: utils.jsii.Bool(true),
        EnableDnsSupport:   utils.jsii.Bool(true),
    })
    
    // Web Security Group (HTTPS only)
    webSG := awsec2.NewSecurityGroup(stack, utils.jsii.String("WebSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         vpc,
        Description: utils.jsii.String("Security group for web servers"),
        AllowAllOutbound: utils.jsii.Bool(true),
    })
    
    webSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(utils.jsii.Number(443)),
        utils.jsii.String("Allow HTTPS traffic"),
        utils.jsii.Bool(false),
    )
    
    webSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(utils.jsii.Number(80)),
        utils.jsii.String("Allow HTTP traffic for redirect"),
        utils.jsii.Bool(false),
    )
    
    // Database Security Group
    dbSG := awsec2.NewSecurityGroup(stack, utils.jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         vpc,
        Description: utils.jsii.String("Security group for RDS database"),
        AllowAllOutbound: utils.jsii.Bool(false),
    })
    
    dbSG.AddIngressRule(
        webSG,
        awsec2.Port_Tcp(utils.jsii.Number(3306)),
        utils.jsii.String("Allow MySQL access from web servers"),
        utils.jsii.Bool(false),
    )
    
    // Network ACLs for additional security
    webNacl := awsec2.NewNetworkAcl(stack, utils.jsii.String("WebNetworkAcl"), &awsec2.NetworkAclProps{
        Vpc: vpc,
        SubnetSelection: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    })
    
    // Allow HTTPS inbound
    webNacl.AddEntry(utils.jsii.String("AllowHTTPSInbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock: utils.jsii.String("0.0.0.0/0"),
        RuleNumber: utils.jsii.Number(100),
        Traffic: awsec2.AclTraffic_TcpPort(utils.jsii.Number(443)),
        Direction: awsec2.TrafficDirection_INGRESS,
        RuleAction: awsec2.Action_ALLOW,
    })
    
    // Allow ephemeral ports outbound
    webNacl.AddEntry(utils.jsii.String("AllowEphemeralOutbound"), &awsec2.CommonNetworkAclEntryOptions{
        CidrBlock: utils.jsii.String("0.0.0.0/0"),
        RuleNumber: utils.jsii.Number(100),
        Traffic: awsec2.AclTraffic_TcpPortRange(utils.jsii.Number(1024), utils.jsii.Number(65535)),
        Direction: awsec2.TrafficDirection_EGRESS,
        RuleAction: awsec2.Action_ALLOW,
    })
    
    // Export VPC ID for cross-stack references
    awscdk.NewCfnOutput(stack, utils.jsii.String("VPCId"), &awscdk.CfnOutputProps{
        Value:       vpc.VpcId(),
        Description: utils.jsii.String("VPC ID for cross-stack references"),
        ExportName:  utils.jsii.String("VPCId"),
    })
    
    return &NetworkingStack{
        Stack:                 stack,
        VPC:                   vpc,
        PublicSubnets:         vpc.PublicSubnets(),
        PrivateSubnets:        vpc.PrivateSubnets(),
        WebSecurityGroup:      webSG,
        DatabaseSecurityGroup: dbSG,
    }
}
```

## 5. Compute Stack

**internal/stacks/compute.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-multi-region-infrastructure/internal/config"
    "aws-multi-region-infrastructure/internal/utils"
)

type ComputeStack struct {
    awscdk.Stack
    AutoScalingGroup awsautoscaling.AutoScalingGroup
    InstanceRole     awsiam.Role
}

func NewComputeStack(scope constructs.Construct, id string, props *config.StackProps, networkingStack *NetworkingStack) *ComputeStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create IAM role for EC2 instances with minimal permissions
    instanceRole := awsiam.NewRole(stack, utils.jsii.String("EC2InstanceRole"), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(utils.jsii.String("ec2.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(utils.jsii.String("AmazonSSMManagedInstanceCore")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "ParameterStoreAccess": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            utils.jsii.String("ssm:GetParameter"),
                            utils.jsii.String("ssm:GetParameters"),
                            utils.jsii.String("ssm:GetParametersByPath"),
                        },
                        Resources: &[]*string{
                            utils.jsii.String("arn:aws:ssm:*:*:parameter/myapp/*"),
                        },
                    }),
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            utils.jsii.String("kms:Decrypt"),
                        },
                        Resources: &[]*string{
                            utils.jsii.String("arn:aws:kms:*:*:key/*"),
                        },
                        Conditions: &map[string]interface{}{
                            "StringEquals": map[string]interface{}{
                                "kms:ViaService": []string{
                                    "ssm." + props.Config.PrimaryRegion + ".amazonaws.com",
                                },
                            },
                        },
                    }),
                },
            }),
        },
    })
    
    instanceProfile := awsiam.NewInstanceProfile(stack, utils.jsii.String("EC2InstanceProfile"), &awsiam.InstanceProfileProps{
        Role: instanceRole,
    })
    
    // User data script for instance initialization
    userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
    userData.AddCommands(
        utils.jsii.String("yum update -y"),
        utils.jsii.String("yum install -y amazon-cloudwatch-agent"),
        utils.jsii.String("yum install -y nginx"),
        utils.jsii.String("systemctl start nginx"),
        utils.jsii.String("systemctl enable nginx"),
        utils.jsii.String("# Configure CloudWatch agent"),
        utils.jsii.String("/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s"),
    )
    
    // Launch template
    launchTemplate := awsec2.NewLaunchTemplate(stack, utils.jsii.String("WebServerLaunchTemplate"), &awsec2.LaunchTemplateProps{
        InstanceType: awsec2.NewInstanceType(utils.jsii.String("t3.micro")),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
            Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
        }),
        SecurityGroup: networkingStack.WebSecurityGroup,
        Role:         instanceRole,
        UserData:     userData,
        DetailedMonitoring: utils.jsii.Bool(true),
    })
    
    // Auto Scaling Group
    asg := awsautoscaling.NewAutoScalingGroup(stack, utils.jsii.String("WebServerASG"), &awsautoscaling.AutoScalingGroupProps{
        Vpc:              networkingStack.VPC,
        LaunchTemplate:   launchTemplate,
        MinCapacity:      utils.jsii.Number(props.Config.MinCapacity),
        MaxCapacity:      utils.jsii.Number(props.Config.MaxCapacity),
        DesiredCapacity:  utils.jsii.Number(props.Config.DesiredCapacity),
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
        },
        HealthCheck: awsautoscaling.HealthCheck_Ec2(&awsautoscaling.Ec2HealthCheckOptions{
            Grace: awscdk.Duration_Minutes(utils.jsii.Number(5)),
        }),
        UpdatePolicy: awsautoscaling.UpdatePolicy_RollingUpdate(&awsautoscaling.RollingUpdateOptions{
            MaxBatchSize:                utils.jsii.Number(1),
            MinInstancesInService:       utils.jsii.Number(1),
            PauseTime:                   awscdk.Duration_Minutes(utils.jsii.Number(5)),
            WaitOnResourceSignals:       utils.jsii.Bool(true),
            SuspendProcesses:            &[]awsautoscaling.ScalingProcess{},
        }),
    })
    
    // CPU-based scaling policy
    asg.ScaleOnCpuUtilization(utils.jsii.String("CPUScaling"), &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: utils.jsii.Number(70),
        ScaleInCooldown:          awscdk.Duration_Minutes(utils.jsii.Number(5)),
        ScaleOutCooldown:         awscdk.Duration_Minutes(utils.jsii.Number(5)),
    })
    
    // CloudWatch alarms for monitoring
    awscloudwatch.NewAlarm(stack, utils.jsii.String("HighCPUAlarm"), &awscloudwatch.AlarmProps{
        Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
            Namespace:  utils.jsii.String("AWS/EC2"),
            MetricName: utils.jsii.String("CPUUtilization"),
            DimensionsMap: &map[string]*string{
                "AutoScalingGroupName": asg.AutoScalingGroupName(),
            },
            Statistic: awscloudwatch.Statistic_AVERAGE,
            Period:     awscdk.Duration_Minutes(utils.jsii.Number(5)),
        }),
        Threshold:          utils.jsii.Number(80),
        ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
        EvaluationPeriods:  utils.jsii.Number(2),
        TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
        AlarmDescription:   utils.jsii.String("High CPU utilization alarm"),
    })
    
    return &ComputeStack{
        Stack:            stack,
        AutoScalingGroup: asg,
        InstanceRole:     instanceRole,
    }
}
```

## 6. Storage Stack

**internal/stacks/storage.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/aws-cdk-go/awscdk/v2/awskms"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsssm"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-multi-region-infrastructure/internal/config"
    "aws-multi-region-infrastructure/internal/utils"
)

type StorageStack struct {
    awscdk.Stack
    PrimaryBucket   awss3.Bucket
    SecondaryBucket awss3.Bucket
    KMSKey         awskms.Key
}

func NewStorageStack(scope constructs.Construct, id string, props *config.StackProps) *StorageStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create KMS key for encryption
    kmsKey := awskms.NewKey(stack, utils.jsii.String("StorageKMSKey"), &awskms.KeyProps{
        Description: utils.jsii.String("KMS key for S3 and Parameter Store encryption"),
        EnableKeyRotation: utils.jsii.Bool(true),
        RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
    })
    
    // Primary S3 bucket
    primaryBucket := awss3.NewBucket(stack, utils.jsii.String("PrimaryStorageBucket"), &awss3.BucketProps{
        BucketName: utils.jsii.String("myapp-primary-" + props.Config.Environment + "-" + props.Config.PrimaryRegion),
        Versioned:  utils.jsii.Bool(true),
        Encryption: awss3.BucketEncryption_KMS,
        EncryptionKey: kmsKey,
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
        LifecycleRules: &[]*awss3.LifecycleRule{
            {
                Id:      utils.jsii.String("DeleteIncompleteMultipartUploads"),
                Enabled: utils.jsii.Bool(true),
                AbortIncompleteMultipartUploadAfter: awscdk.Duration_Days(utils.jsii.Number(7)),
            },
            {
                Id:      utils.jsii.String("TransitionToIA"),
                Enabled: utils.jsii.Bool(true),
                Transitions: &[]*awss3.Transition{
                    {
                        StorageClass: awss3.StorageClass_INFREQUENT_ACCESS,
                        TransitionAfter: awscdk.Duration_Days(utils.jsii.Number(30)),
                    },
                    {
                        StorageClass: awss3.StorageClass_GLACIER,
                        TransitionAfter: awscdk.Duration_Days(utils.jsii.Number(90)),
                    },
                },
            },
        },
        NotificationDestinations: &[]awss3.IBucketNotificationDestination{},
    })
    
    // Cross-region replication bucket
    secondaryBucket := awss3.NewBucket(stack, utils.jsii.String("SecondaryStorageBucket"), &awss3.BucketProps{
        BucketName: utils.jsii.String("myapp-secondary-" + props.Config.Environment + "-" + props.Config.SecondaryRegion),
        Versioned:  utils.jsii.Bool(true),
        Encryption: awss3.BucketEncryption_KMS,
        EncryptionKey: kmsKey,
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
    })
    
    // Store sensitive configuration in Parameter Store
    awsssm.NewStringParameter(stack, utils.jsii.String("DatabasePassword"), &awsssm.StringParameterProps{
        ParameterName: utils.jsii.String("/myapp/database/password"),
        StringValue:   utils.jsii.String("ChangeMeInProduction!"),
        Type:          awsssm.ParameterType_SECURE_STRING,
        Description:   utils.jsii.String("Database password"),
        Tier:          awsssm.ParameterTier_STANDARD,
    })
    
    awsssm.NewStringParameter(stack, utils.jsii.String("APIKey"), &awsssm.StringParameterProps{
        ParameterName: utils.jsii.String("/myapp/api/key"),
        StringValue:   utils.jsii.String("your-api-key-here"),
        Type:          awsssm.ParameterType_SECURE_STRING,
        Description:   utils.jsii.String("API key for external services"),
        Tier:          awsssm.ParameterTier_STANDARD,
    })
    
    // Export bucket names
    awscdk.NewCfnOutput(stack, utils.jsii.String("PrimaryBucketName"), &awscdk.CfnOutputProps{
        Value:       primaryBucket.BucketName(),
        Description: utils.jsii.String("Primary S3 bucket name"),
        ExportName:  utils.jsii.String("PrimaryBucketName"),
    })
    
    awscdk.NewCfnOutput(stack, utils.jsii.String("SecondaryBucketName"), &awscdk.CfnOutputProps{
        Value:       secondaryBucket.BucketName(),
        Description: utils.jsii.String("Secondary S3 bucket name"),
        ExportName:  utils.jsii.String("SecondaryBucketName"),
    })
    
    return &StorageStack{
        Stack:           stack,
        PrimaryBucket:   primaryBucket,
        SecondaryBucket: secondaryBucket,
        KMSKey:         kmsKey,
    }
}
```

## 7. Database Stack

**internal/stacks/database.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-multi-region-infrastructure/internal/config"
    "aws-multi-region-infrastructure/internal/utils"
)

type DatabaseStack struct {
    awscdk.Stack
    Database awsrds.DatabaseInstance
}

func NewDatabaseStack(scope constructs.Construct, id string, props *config.StackProps, networkingStack *NetworkingStack) *DatabaseStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Create subnet group for RDS
    subnetGroup := awsrds.NewSubnetGroup(stack, utils.jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
        Description: utils.jsii.String("Subnet group for RDS database"),
        Vpc:         networkingStack.VPC,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
        },
    })
    
    // Create parameter group for MySQL
    parameterGroup := awsrds.NewParameterGroup(stack, utils.jsii.String("DatabaseParameterGroup"), &awsrds.ParameterGroupProps{
        Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
            Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
        }),
        Description: utils.jsii.String("Parameter group for MySQL database"),
        Parameters: &map[string]*string{
            "innodb_buffer_pool_size": utils.jsii.String("{DBInstanceClassMemory*3/4}"),
            "max_connections":         utils.jsii.String("100"),
            "slow_query_log":         utils.jsii.String("1"),
            "long_query_time":        utils.jsii.String("2"),
        },
    })
    
    // Create RDS instance with Multi-AZ
    database := awsrds.NewDatabaseInstance(stack, utils.jsii.String("MainDatabase"), &awsrds.DatabaseInstanceProps{
        Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
            Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
        }),
        InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MICRO),
        Vpc:          networkingStack.VPC,
        SecurityGroups: &[]awsec2.ISecurityGroup{
            networkingStack.DatabaseSecurityGroup,
        },
        SubnetGroup:           subnetGroup,
        ParameterGroup:        parameterGroup,
        MultiAz:              utils.jsii.Bool(true),
        StorageEncrypted:     utils.jsii.Bool(true),
        BackupRetention:      awscdk.Duration_Days(utils.jsii.Number(7)),
        DeleteAutomatedBackups: utils.jsii.Bool(false),
        DeletionProtection:   utils.jsii.Bool(true),
        DatabaseName:         utils.jsii.String("myapp"),
        Credentials: awsrds.Credentials_FromGeneratedSecret(utils.jsii.String("admin"), &awsrds.CredentialsBaseOptions{
            SecretName: utils.jsii.String("rds-credentials"),
        }),
        MonitoringInterval:   awscdk.Duration_Seconds(utils.jsii.Number(60)),
        EnablePerformanceInsights: utils.jsii.Bool(true),
        PerformanceInsightRetention: awsrds.PerformanceInsightRetention_DEFAULT,
        CloudwatchLogsExports: &[]*string{
            utils.jsii.String("error"),
            utils.jsii.String("general"),
            utils.jsii.String("slow-query"),
        },
        RemovalPolicy: awscdk.RemovalPolicy_SNAPSHOT,
    })
    
    // Export database endpoint
    awscdk.NewCfnOutput(stack, utils.jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
        Value:       database.InstanceEndpoint().Hostname(),
        Description: utils.jsii.String("RDS database endpoint"),
        ExportName:  utils.jsii.String("DatabaseEndpoint"),
    })
    
    return &DatabaseStack{
        Stack:    stack,
        Database: database,
    }
}
```

## 8. Lambda Stack

**internal/stacks/lambda.go**
```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
    "github.com/aws/constructs-go/constructs/v10"
    "aws-multi-region-infrastructure/internal/config"
    "aws-multi-region-infrastructure/internal/utils"
)

type LambdaStack struct {
    awscdk.Stack
    ProcessorFunction awslambda.Function
}

func NewLambdaStack(scope constructs.Construct, id string, props *config.StackProps, storageStack *StorageStack) *LambdaStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    utils.ApplyCommonTags(stack, props.Config.Environment)
    
    // Lambda execution role
    lambdaRole := awsiam.NewRole(stack, utils.jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(utils.jsii.String("lambda.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(utils.jsii.String("service-role/AWSLambdaBasicExecutionRole")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "S3Access": awsiam.NewPolicyDocument(&awsiam.PolicyDoc