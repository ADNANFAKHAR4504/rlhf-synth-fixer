# AWS CDK + Go Migration Guide

I'll help you build a production-ready CDK Go infrastructure that follows best practices. Let me break this down into a complete, maintainable solution.

## Project Structure

First, let's set up a proper Go CDK project structure:

```
migration-infrastructure/
├── cmd/
│   └── deploy/
│       └── main.go
├── internal/
│   ├── stacks/
│   │   ├── network.go
│   │   ├── security.go
│   │   ├── database.go
│   │   ├── application.go
│   │   └── cdn.go
│   └── config/
│       └── config.go
├── go.mod
├── go.sum
├── cdk.json
└── README.md
```

## Complete Implementation

### 1. Go Module Setup (`go.mod`)

```go
module migration-infrastructure

go 1.21

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.110.1
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
)
```

### 2. Configuration (`internal/config/config.go`)

```go
package config

import "github.com/aws/aws-cdk-go/awscdk/v2"

type AppConfig struct {
    Environment *awscdk.Environment
    AppName     string
    Stage       string
    
    // Network configuration
    VpcCidr           string
    OfficeNetworkCidr string
    
    // Database configuration
    DatabaseName     string
    DatabaseUsername string
    
    // Application configuration
    MinCapacity      float64
    MaxCapacity      float64
    DesiredCapacity  float64
    
    // SSL Certificate ARN (you'll need to create this manually first)
    CertificateArn string
}

func NewProductionConfig() *AppConfig {
    return &AppConfig{
        Environment: &awscdk.Environment{
            Account: awscdk.String("123456789012"), // Replace with your account
            Region:  awscdk.String("us-east-1"),
        },
        AppName:           "migration-app",
        Stage:             "prod",
        VpcCidr:           "10.0.0.0/16",
        OfficeNetworkCidr: "192.168.1.0/24",
        DatabaseName:      "appdb",
        DatabaseUsername:  "dbadmin",
        MinCapacity:       2,
        MaxCapacity:       10,
        DesiredCapacity:   3,
        // You'll need to request this certificate in ACM first
        CertificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id",
    }
}
```

### 3. Network Stack (`internal/stacks/network.go`)

```go
package stacks

import (
    "fmt"
    
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    
    "migration-infrastructure/internal/config"
)

type NetworkStackProps struct {
    awscdk.StackProps
    Config *config.AppConfig
}

type NetworkStack struct {
    awscdk.Stack
    VPC               awsec2.Vpc
    PublicSubnets     *[]awsec2.ISubnet
    PrivateSubnets    *[]awsec2.ISubnet
    DatabaseSubnets   *[]awsec2.ISubnet
    InternetGateway   awsec2.CfnInternetGateway
    NATGateway        awsec2.CfnNatGateway
}

func NewNetworkStack(scope constructs.Construct, id string, props *NetworkStackProps) *NetworkStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // Create VPC
    vpc := awsec2.NewVpc(stack, jsii.String("VPC"), &awsec2.VpcProps{
        IpAddresses: awsec2.IpAddresses_Cidr(jsii.String(props.Config.VpcCidr)),
        MaxAzs:      jsii.Number(2),
        SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
            {
                Name:       jsii.String("Public"),
                SubnetType: awsec2.SubnetType_PUBLIC,
                CidrMask:   jsii.Number(24),
            },
            {
                Name:       jsii.String("Private"),
                SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
                CidrMask:   jsii.Number(24),
            },
            {
                Name:       jsii.String("Database"),
                SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
                CidrMask:   jsii.Number(24),
            },
        },
        EnableDnsHostnames: jsii.Bool(true),
        EnableDnsSupport:   jsii.Bool(true),
    })
    
    // Get subnet references
    publicSubnets := vpc.PublicSubnets()
    privateSubnets := vpc.PrivateSubnets()
    isolatedSubnets := vpc.IsolatedSubnets()
    
    // Add tags for better organization
    awscdk.Tags_Of(vpc).Add(jsii.String("Name"), 
        jsii.String(fmt.Sprintf("%s-vpc", props.Config.AppName)), nil)
    awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), 
        jsii.String(props.Config.Stage), nil)
    
    return &NetworkStack{
        Stack:           stack,
        VPC:             vpc,
        PublicSubnets:   publicSubnets,
        PrivateSubnets:  privateSubnets,
        DatabaseSubnets: isolatedSubnets,
    }
}
```

### 4. Security Stack (`internal/stacks/security.go`)

```go
package stacks

import (
    "fmt"
    
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    
    "migration-infrastructure/internal/config"
)

type SecurityStackProps struct {
    awscdk.StackProps
    Config        *config.AppConfig
    NetworkStack  *NetworkStack
}

type SecurityStack struct {
    awscdk.Stack
    ALBSecurityGroup    awsec2.SecurityGroup
    AppSecurityGroup    awsec2.SecurityGroup
    DatabaseSecurityGroup awsec2.SecurityGroup
}

func NewSecurityStack(scope constructs.Construct, id string, props *SecurityStackProps) *SecurityStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // ALB Security Group - allows HTTP/HTTPS from internet and office
    albSG := awsec2.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         props.NetworkStack.VPC,
        Description: jsii.String("Security group for Application Load Balancer"),
        SecurityGroupName: jsii.String(fmt.Sprintf("%s-alb-sg", props.Config.AppName)),
    })
    
    // Allow HTTPS from anywhere (CloudFront will handle this)
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(443)),
        jsii.String("HTTPS from internet"),
        jsii.Bool(false),
    )
    
    // Allow HTTP from anywhere (will redirect to HTTPS)
    albSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("HTTP from internet"),
        jsii.Bool(false),
    )
    
    // Allow direct access from office network for testing
    albSG.AddIngressRule(
        awsec2.Peer_Ipv4(jsii.String(props.Config.OfficeNetworkCidr)),
        awsec2.Port_Tcp(jsii.Number(8080)),
        jsii.String("Direct access from office"),
        jsii.Bool(false),
    )
    
    // App Security Group - allows traffic from ALB only
    appSG := awsec2.NewSecurityGroup(stack, jsii.String("AppSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         props.NetworkStack.VPC,
        Description: jsii.String("Security group for application servers"),
        SecurityGroupName: jsii.String(fmt.Sprintf("%s-app-sg", props.Config.AppName)),
    })
    
    // Allow traffic from ALB on app port
    appSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(albSG.SecurityGroupId(), jsii.String("ALB")),
        awsec2.Port_Tcp(jsii.Number(8080)),
        jsii.String("HTTP from ALB"),
        jsii.Bool(false),
    )
    
    // Allow SSH from office network for troubleshooting
    appSG.AddIngressRule(
        awsec2.Peer_Ipv4(jsii.String(props.Config.OfficeNetworkCidr)),
        awsec2.Port_Tcp(jsii.Number(22)),
        jsii.String("SSH from office"),
        jsii.Bool(false),
    )
    
    // Database Security Group - allows traffic from app servers only
    dbSG := awsec2.NewSecurityGroup(stack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         props.NetworkStack.VPC,
        Description: jsii.String("Security group for RDS database"),
        SecurityGroupName: jsii.String(fmt.Sprintf("%s-db-sg", props.Config.AppName)),
    })
    
    // Allow PostgreSQL from app servers
    dbSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(appSG.SecurityGroupId(), jsii.String("App servers")),
        awsec2.Port_Tcp(jsii.Number(5432)),
        jsii.String("PostgreSQL from app servers"),
        jsii.Bool(false),
    )
    
    // Allow PostgreSQL from office network for admin access
    dbSG.AddIngressRule(
        awsec2.Peer_Ipv4(jsii.String(props.Config.OfficeNetworkCidr)),
        awsec2.Port_Tcp(jsii.Number(5432)),
        jsii.String("PostgreSQL from office"),
        jsii.Bool(false),
    )
    
    return &SecurityStack{
        Stack:                 stack,
        ALBSecurityGroup:      albSG,
        AppSecurityGroup:      appSG,
        DatabaseSecurityGroup: dbSG,
    }
}
```

### 5. Database Stack (`internal/stacks/database.go`)

```go
package stacks

import (
    "fmt"
    
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    
    "migration-infrastructure/internal/config"
)

type DatabaseStackProps struct {
    awscdk.StackProps
    Config        *config.AppConfig
    NetworkStack  *NetworkStack
    SecurityStack *SecurityStack
}

type DatabaseStack struct {
    awscdk.Stack
    Database awsrds.DatabaseInstance
    SubnetGroup awsrds.SubnetGroup
}

func NewDatabaseStack(scope constructs.Construct, id string, props *DatabaseStackProps) *DatabaseStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // Create DB subnet group
    subnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
        Description: jsii.String("Subnet group for RDS database"),
        Vpc:         props.NetworkStack.VPC,
        Subnets:     props.NetworkStack.DatabaseSubnets,
        SubnetGroupName: jsii.String(fmt.Sprintf("%s-db-subnet-group", props.Config.AppName)),
    })
    
    // Create RDS instance
    database := awsrds.NewDatabaseInstance(stack, jsii.String("Database"), &awsrds.DatabaseInstanceProps{
        Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
            Version: awsrds.PostgresEngineVersion_VER_15_4(),
        }),
        InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MEDIUM),
        Credentials: awsrds.Credentials_FromGeneratedSecret(jsii.String(props.Config.DatabaseUsername), &awsrds.CredentialsBaseOptions{
            SecretName: jsii.String(fmt.Sprintf("%s-db-credentials", props.Config.AppName)),
        }),
        DatabaseName: jsii.String(props.Config.DatabaseName),
        
        // Network configuration
        Vpc:           props.NetworkStack.VPC,
        SubnetGroup:   subnetGroup,
        SecurityGroups: &[]awsec2.ISecurityGroup{
            props.SecurityStack.DatabaseSecurityGroup,
        },
        
        // High availability and backup
        MultiAz:                jsii.Bool(true),
        BackupRetention:        awscdk.Duration_Days(jsii.Number(7)),
        DeleteAutomatedBackups: jsii.Bool(false),
        DeletionProtection:     jsii.Bool(true),
        
        // Performance and monitoring
        MonitoringInterval:     awscdk.Duration_Seconds(jsii.Number(60)),
        EnablePerformanceInsights: jsii.Bool(true),
        
        // Storage
        AllocatedStorage:     jsii.Number(100),
        MaxAllocatedStorage:  jsii.Number(1000),
        StorageType:          awsrds.StorageType_GP2,
        StorageEncrypted:     jsii.Bool(true),
        
        // Maintenance
        AutoMinorVersionUpgrade: jsii.Bool(true),
        PreferredBackupWindow:   jsii.String("03:00-04:00"),
        PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
        
        // Naming
        InstanceIdentifier: jsii.String(fmt.Sprintf("%s-database", props.Config.AppName)),
    })
    
    // Output the database endpoint
    awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
        Value:       database.InstanceEndpoint().Hostname(),
        Description: jsii.String("RDS instance endpoint"),
        ExportName:  jsii.String(fmt.Sprintf("%s-db-endpoint", props.Config.AppName)),
    })
    
    return &DatabaseStack{
        Stack:       stack,
        Database:    database,
        SubnetGroup: subnetGroup,
    }
}
```

### 6. Application Stack (`internal/stacks/application.go`)

```go
package stacks

import (
    "fmt"
    
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    
    "migration-infrastructure/internal/config"
)

type ApplicationStackProps struct {
    awscdk.StackProps
    Config        *config.AppConfig
    NetworkStack  *NetworkStack
    SecurityStack *SecurityStack
    DatabaseStack *DatabaseStack
}

type ApplicationStack struct {
    awscdk.Stack
    LoadBalancer      awselasticloadbalancingv2.ApplicationLoadBalancer
    AutoScalingGroup  awsautoscaling.AutoScalingGroup
    SessionTable      awsdynamodb.Table
    LogsBucket        awss3.Bucket
}

func NewApplicationStack(scope constructs.Construct, id string, props *ApplicationStackProps) *ApplicationStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // Create S3 bucket for application logs
    logsBucket := awss3.NewBucket(stack, jsii.String("LogsBucket"), &awss3.BucketProps{
        BucketName: jsii.String(fmt.Sprintf("%s-app-logs-%s", props.Config.AppName, props.Config.Stage)),
        Versioned:  jsii.Bool(false),
        Encryption: awss3.BucketEncryption_S3_MANAGED,
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        LifecycleRules: &[]*awss3.LifecycleRule{
            {
                Id:      jsii.String("DeleteOldLogs"),
                Enabled: jsii.Bool(true),
                Expiration: awscdk.Duration_Days(jsii.Number(90)),
            },
        },
    })
    
    // Create DynamoDB table for session storage
    sessionTable := awsdynamodb.NewTable(stack, jsii.String("SessionTable"), &awsdynamodb.TableProps{
        TableName: jsii.String(fmt.Sprintf("%s-sessions", props.Config.AppName)),
        PartitionKey: &awsdynamodb.Attribute{
            Name: jsii.String("session_id"),
            Type: awsdynamodb.AttributeType_STRING,
        },
        BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
        Encryption:  awsdynamodb.TableEncryption_AWS_MANAGED,
        TimeToLiveAttribute: jsii.String("expires_at"),
        PointInTimeRecovery: jsii.Bool(true),
    })
    
    // Create IAM role for EC2 instances
    instanceRole := awsiam.NewRole(stack, jsii.String("InstanceRole"), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("CloudWatchAgentServerPolicy")),
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
        },
    })
    
    // Allow access to DynamoDB and S3
    sessionTable.GrantReadWriteData(instanceRole)
    logsBucket.GrantWrite(instanceRole)
    
    // Allow reading database credentials from Secrets Manager
    props.DatabaseStack.Database.Secret().GrantRead(instanceRole)
    
    // Create instance profile
    instanceProfile := awsiam.NewCfnInstanceProfile(stack, jsii.String("InstanceProfile"), &awsiam.CfnInstanceProfileProps{
        Roles: &[]*string{instanceRole.RoleName()},
    })
    
    // User data script for EC2 instances
    userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
    userData.AddCommands(
        "yum update -y",
        "yum install -y amazon-cloudwatch-agent",
        // Add your application installation commands here
        "echo 'Application setup complete'",
    )
    
    // Create launch template
    launchTemplate := awsec2.NewLaunchTemplate(stack, jsii.String("LaunchTemplate"), &awsec2.LaunchTemplateProps{
        LaunchTemplateName: jsii.String(fmt.Sprintf("%s-launch-template", props.Config.AppName)),
        InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MEDIUM),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{}),
        SecurityGroup: props.SecurityStack.AppSecurityGroup,
        UserData: userData,
        Role: instanceRole,
    })
    
    // Create Auto Scaling Group
    asg := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("AutoScalingGroup"), &awsautoscaling.AutoScalingGroupProps{
        Vpc: props.NetworkStack.VPC,
        VpcSubnets: &awsec2.SubnetSelection{
            Subnets: *props.NetworkStack.PrivateSubnets,
        },
        LaunchTemplate: launchTemplate,
        MinCapacity: jsii.Number(props.Config.MinCapacity),
        MaxCapacity: jsii.Number(props.Config.MaxCapacity),
        DesiredCapacity: jsii.Number(props.Config.DesiredCapacity),
        HealthCheck: awsautoscaling.HealthCheck_Elb(&awsautoscaling.ElbHealthCheckOptions{
            Grace: awscdk.Duration_Seconds(jsii.Number(300)),
        }),
        UpdatePolicy: awsautoscaling.UpdatePolicy_RollingUpdate(&awsautoscaling.RollingUpdateOptions{
            MaxBatchSize:                jsii.Number(1),
            MinInstancesInService:       jsii.Number(1),
            PauseTime:                   awscdk.Duration_Minutes(jsii.Number(5)),
            WaitOnResourceSignals:       jsii.Bool(false),
        }),
    })
    
    // Add CPU-based scaling
    asg.ScaleOnCpuUtilization(jsii.String("CpuScaling"), &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: jsii.Number(70),
        ScaleInCooldown:          awscdk.Duration_Minutes(jsii.Number(5)),
        ScaleOutCooldown:         awscdk.Duration_Minutes(jsii.Number(3)),
    })
    
    // Create Application Load Balancer
    alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("LoadBalancer"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
        Vpc: props.NetworkStack.VPC,
        VpcSubnets: &awsec2.SubnetSelection{
            Subnets: *props.NetworkStack.PublicSubnets,
        },
        SecurityGroup: props.SecurityStack.ALBSecurityGroup,
        InternetFacing: jsii.Bool(true),
        LoadBalancerName: jsii.String(fmt.Sprintf("%s-alb", props.Config.AppName)),
    })
    
    // Create target group
    targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("TargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
        Vpc: props.NetworkStack.VPC,
        Port: jsii.Number(8080),
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
        TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
        HealthCheck: &awselasticloadbalancingv2.HealthCheck{
            Path:                jsii.String("/health"),
            Protocol:            awselasticloadbalancingv2.Protocol_HTTP,
            Port:                jsii.String("8080"),
            HealthyThresholdCount: jsii.Number(2),
            UnhealthyThresholdCount: jsii.Number(3),
            Timeout:             awscdk.Duration_Seconds(jsii.Number(10)),
            Interval:            awscdk.Duration_Seconds(jsii.Number(30)),
        },
        TargetGroupName: jsii.String(fmt.Sprintf("%s-tg", props.Config.AppName)),
    })
    
    // Attach ASG to target group
    asg.AttachToApplicationTargetGroup(targetGroup)
    
    // Add HTTPS listener
    alb.AddListener(jsii.String("HttpsListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
        Port: jsii.Number(443),
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTPS,
        Certificates: &[]awselasticloadbalancingv2.IListenerCertificate{
            awselasticloadbalancingv2.ListenerCertificate_FromArn(jsii.String(props.Config.CertificateArn)),
        },
        DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup},
    })
    
    // Add HTTP listener that redirects to HTTPS
    alb.AddListener(jsii.String("HttpListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
        Port: jsii.Number(80),
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
        DefaultAction: awselasticloadbalancingv2.ListenerAction_Redirect(&awselasticloadbalancingv2.RedirectOptions{
            Protocol: jsii.String("HTTPS"),
            Port:     jsii.String("443"),
            Permanent: jsii.Bool(true),
        }),
    })
    
    // Output ALB DNS name
    awscdk.NewCfnOutput(stack, jsii.String("LoadBalancerDNS"), &awscdk.CfnOutputProps{
        Value:       alb.LoadBalancerDnsName(),
        Description: jsii.String("Application Load Balancer DNS name"),
        ExportName:  jsii.String(fmt.Sprintf("%s-alb-dns", props.Config.AppName)),
    })
    
    return &ApplicationStack{
        Stack:            stack,
        LoadBalancer:     alb,
        AutoScalingGroup: asg,
        SessionTable:     sessionTable,
        LogsBucket:       logsBucket,
    }
}
```

### 7. CDN Stack (`internal/stacks/cdn.go`)

```go
package stacks

import (
    "fmt"
    
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    
    "migration-infrastructure/internal/config"
)

type CDNStackProps struct {
    awscdk.StackProps
    Config           *config.AppConfig
    ApplicationStack *ApplicationStack
}

type CDNStack struct {
    awscdk.Stack
    Distribution awscloudfront.Distribution
}

func NewCDNStack(scope constructs.Construct, id string, props *CDNStackProps) *CDNStack {
    stack := awscdk.NewStack(scope, &id, &props.StackProps)
    
    // Create CloudFront distribution
    distribution := awscloudfront.NewDistribution(stack, jsii.String("Distribution"), &awscloudfront.DistributionProps{
        DefaultBehavior: &awscloudfront.BehaviorOptions{
            Origin: awscloudfrontorigins.NewLoadBalancerV2Origin(props.ApplicationStack.LoadBalancer, &awscloudfrontorigins.LoadBalancerV2OriginProps{
                ProtocolPolicy: awscloudfront.OriginProtocolPolicy_HTTPS_ONLY,
                HttpPort:       jsii.Number(80),
                HttpsPort:      jsii.Number(443),
            }),
            ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
            AllowedMethods:       awscloudfront.AllowedMethods_ALLOW_ALL(),
            CachedMethods:        awscloudfront.CachedMethods_CACHE_GET_HEAD_OPTIONS(),
            CachePolicy:          awscloudfront.CachePolicy_CACHING_OPTIMIZED(),
            OriginRequestPolicy:  awscloudfront.OriginRequestPolicy_CORS_S3_ORIGIN(),
            Compress:             jsii.Bool(true),
        },
        
        // Additional behaviors for static assets
        AdditionalBehaviors: &map[string]*awscloudfront.BehaviorOptions{
            "/static/*": {
                Origin: awscloudfrontorigins.NewLoadBalancerV2Origin(props.ApplicationStack.LoadBalancer, &awscloudfrontorigins.LoadBalancerV2OriginProps{
                    ProtocolPolicy: awscloudfront.OriginProtocolPolicy_HTTPS_ONLY,
                }),
                ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
                CachePolicy:          awscloudfront.CachePolicy_CACHING_OPTIMIZED(),
                Compress:             jsii.Bool(true),
            },
            "/api/*": {
                Origin: awscloudfrontorigins.NewLoadBalancerV2Origin(props.ApplicationStack.LoadBalancer, &awscloudfrontorigins.LoadBalancerV2OriginProps{
                    ProtocolPolicy: awscloudfront.OriginProtocolPolicy_HTTPS_ONLY,
                }),
                ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
                CachePolicy:          awscloudfront.CachePolicy_CACHING_DISABLED(),
                OriginRequestPolicy:  awscloudfront.OriginRequestPolicy_ALL_VIEWER(),
                AllowedMethods:       awscloudfront.AllowedMethods_ALLOW_ALL(),
            },
        },
        
        // Geographic restrictions (optional)
        GeoRestriction: aw