You're absolutely right - let me fix all these issues! These are exactly the kind of subtle problems that make CDK Go tricky. Let me provide the complete, working fixes.

## Fix 1: Type mismatches and imports

**internal/stacks/security.go** (Fixed)

```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/security"
)

type SecurityStack struct {
    *BaseStack
    KMSKeys  *security.KMSKeys
    IAMRoles *security.IAMRoles
    WebACL   awswafv2.CfnWebACL  // Fixed: Use the correct type
}

func NewSecurityStack(scope constructs.Construct, id string, props *BaseStackProps) *SecurityStack {
    baseStack := NewBaseStack(scope, id, props)

    // Get account ID for KMS policies
    accountId := baseStack.Stack.Account()

    // Create KMS keys
    kmsKeys := security.NewKMSKeys(
        baseStack.Stack,
        jsii.String("KMS"),
        *accountId,
        baseStack.Config.CommonTags,
    )

    // Create IAM roles (we'll need S3 bucket ARN later)
    iamRoles := security.NewIAMRoles(
        baseStack.Stack,
        jsii.String("IAM"),
        "arn:aws:s3:::placeholder", // Will be updated later
        *kmsKeys.S3Key.KeyArn(),
    )

    // Create WAF Web ACL - returns the correct type now
    webACL := security.NewWebACL(
        baseStack.Stack,
        jsii.String("WAF"),
        baseStack.Config.Prefix,
    )

    return &SecurityStack{
        BaseStack: baseStack,
        KMSKeys:   kmsKeys,
        IAMRoles:  iamRoles,
        WebACL:    webACL,  // This now matches the type
    }
}
```

**internal/stacks/compute.go** (Fixed imports)

```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"      // Added missing import
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"   // Added missing import
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/compute"
)

type ComputeStack struct {
    *BaseStack
    BastionHost    awsec2.Instance    // Now properly imported
    LambdaFunction awslambda.Function // Now properly imported
}

func NewComputeStack(scope constructs.Construct, id string, props *BaseStackProps, networkStack *NetworkStack, securityStack *SecurityStack) *ComputeStack {
    baseStack := NewBaseStack(scope, id, props)

    // Create bastion host
    bastionHost := compute.NewBastionHost(
        baseStack.Stack,
        jsii.String("Bastion"),
        networkStack.VPCConstruct.VPC,
        networkStack.SecurityGroups.BastionSG,
        securityStack.IAMRoles.BastionRole,
        baseStack.Config.Prefix,
        baseStack.Config.CommonTags,
    )

    // Create Lambda function
    lambdaFunction := compute.NewLambdaFunction(
        baseStack.Stack,
        jsii.String("Lambda"),
        networkStack.VPCConstruct.VPC,
        networkStack.SecurityGroups.LambdaSG,
        securityStack.IAMRoles.LambdaExecutionRole,
        baseStack.Config.Prefix,
        baseStack.Config.CommonTags,
    )

    return &ComputeStack{
        BaseStack:      baseStack,
        BastionHost:    bastionHost,
        LambdaFunction: lambdaFunction,
    }
}
```

## Fix 2: Base stack function signature

**internal/stacks/base.go** (Fixed)

```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/config"
)

type BaseStackProps struct {
    awscdk.StackProps
    Config *config.Config
}

type BaseStack struct {
    awscdk.Stack
    Config *config.Config
}

func NewBaseStack(scope constructs.Construct, id string, props *BaseStackProps) *BaseStack {
    // Fixed: Correct function signature
    stack := awscdk.NewStack(scope, jsii.String(id), &props.StackProps)

    // Apply common tags to the entire stack
    for key, value := range props.Config.CommonTags {
        awscdk.Tags_Of(stack).Add(jsii.String(key), value, nil)
    }

    return &BaseStack{
        Stack:  stack,
        Config: props.Config,
    }
}
```

## Fix 3: Complete main.go with proper region handling

**cmd/deploy/main.go** (Complete version)

```go
package main

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/sts"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    appConfig "secure-infrastructure/internal/config"
    "secure-infrastructure/internal/stacks"
)

func main() {
    defer jsii.Close()

    app := awscdk.NewApp(nil)

    // Get environment from context or default to "dev"
    env := "dev"
    if envContext := app.Node().TryGetContext(jsii.String("environment")); envContext != nil {
        if envStr, ok := envContext.(string); ok {
            env = envStr
        }
    }

    // Get AWS account and region
    awsEnv, err := getAWSEnvironment()
    if err != nil {
        fmt.Printf("Error getting AWS environment: %v\n", err)
        os.Exit(1)
    }

    // Create configuration
    cfg := appConfig.NewConfig(env)

    // Create stack props with proper environment
    stackProps := &stacks.BaseStackProps{
        StackProps: awscdk.StackProps{
            Env: &awscdk.Environment{
                Account: jsii.String(awsEnv.Account),
                Region:  jsii.String(awsEnv.Region),
            },
            Description: jsii.String("Secure multi-tier infrastructure"),
        },
        Config: cfg,
    }

    // Create stacks in dependency order
    fmt.Println("Creating Network Stack...")
    networkStack := stacks.NewNetworkStack(app, "NetworkStack", stackProps)

    fmt.Println("Creating Security Stack...")
    securityStack := stacks.NewSecurityStack(app, "SecurityStack", stackProps)

    fmt.Println("Creating Storage Stack...")
    storageStack := stacks.NewStorageStack(app, "StorageStack", stackProps, securityStack)

    fmt.Println("Creating Compute Stack...")
    computeStack := stacks.NewComputeStack(app, "ComputeStack", stackProps, networkStack, securityStack)

    // Set up dependencies
    securityStack.AddDependency(networkStack.Stack, jsii.String("Network must be created first"))
    storageStack.AddDependency(securityStack.Stack, jsii.String("Security resources must be created first"))
    computeStack.AddDependency(networkStack.Stack, jsii.String("Network must be created first"))
    computeStack.AddDependency(securityStack.Stack, jsii.String("Security resources must be created first"))

    fmt.Printf("Synthesizing CDK app for environment: %s\n", env)
    app.Synth(nil)
}

type AWSEnvironment struct {
    Account string
    Region  string
}

func getAWSEnvironment() (*AWSEnvironment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Load AWS config
    cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
    if err != nil {
        return nil, fmt.Errorf("unable to load AWS config: %w", err)
    }

    // Get account ID
    stsClient := sts.NewFromConfig(cfg)
    identity, err := stsClient.GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
    if err != nil {
        return nil, fmt.Errorf("unable to get caller identity: %w", err)
    }

    return &AWSEnvironment{
        Account: aws.ToString(identity.Account),
        Region:  "us-east-1", // Force us-east-1 for CloudFront WAF
    }, nil
}
```

## Fix 4: Unique S3 bucket names and key pair creation

**internal/config/config.go** (Updated with unique naming)

```go
package config

import (
    "fmt"
    "math/rand"
    "time"
)

type Config struct {
    Environment string
    Region      string
    AZs         []string
    Prefix      string
    UniqueSuffix string // Added for globally unique names

    // Network configuration
    VPCCidr           string
    PublicSubnetCidrs []string
    PrivateSubnetCidrs []string

    // Security configuration
    AllowedSSHCidrs []string

    // Monitoring
    LogRetentionDays float64

    // Tags
    CommonTags map[string]*string
}

func NewConfig(env string) *Config {
    // Generate unique suffix for globally unique resources
    rand.Seed(time.Now().UnixNano())
    uniqueSuffix := fmt.Sprintf("%d", rand.Intn(100000))

    prefix := fmt.Sprintf("prod-%s", env)

    return &Config{
        Environment:  env,
        Region:       "us-east-1",
        AZs:          []string{"us-east-1a", "us-east-1b"},
        Prefix:       prefix,
        UniqueSuffix: uniqueSuffix,

        VPCCidr:            "10.0.0.0/16",
        PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24"},
        PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24"},

        AllowedSSHCidrs: []string{"10.0.0.0/16"}, // Only from VPC

        LogRetentionDays: 30,

        CommonTags: map[string]*string{
            "Environment": stringPtr(env),
            "Project":     stringPtr("secure-infrastructure"),
            "ManagedBy":   stringPtr("cdk"),
        },
    }
}

func stringPtr(s string) *string {
    return &s
}
```

**internal/constructs/network/vpc.go** (Fixed unique bucket names)

```go
package network

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/config"
)

type VPCConstruct struct {
    VPC             awsec2.Vpc
    PublicSubnets   []awsec2.ISubnet
    PrivateSubnets  []awsec2.ISubnet
    FlowLogsBucket  awss3.Bucket
}

func NewVPCConstruct(scope constructs.Construct, id string, cfg *config.Config, tags map[string]*string) *VPCConstruct {
    // Create S3 bucket for VPC Flow Logs with unique name
    flowLogsBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-vpc-flow-logs", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-vpc-flow-logs-%s", cfg.Prefix, cfg.UniqueSuffix)),
        Versioned:         jsii.Bool(true),
        PublicReadAccess:  jsii.Bool(false),
        PublicWriteAccess: jsii.Bool(false),
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
        LifecycleRules: &[]*awss3.LifecycleRule{
            {
                Id:      jsii.String("DeleteOldVersions"),
                Enabled: jsii.Bool(true),
                NoncurrentVersionExpiration: awscdk.Duration_Days(jsii.Number(90)),
            },
        },
    })

    // Create VPC
    vpc := awsec2.NewVpc(scope, jsii.String(fmt.Sprintf("%s-vpc", id)), &awsec2.VpcProps{
        IpAddresses: awsec2.IpAddresses_Cidr(jsii.String(cfg.VPCCidr)),
        MaxAzs:      jsii.Number(len(cfg.AZs)),
        SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
            {
                Name:       jsii.String("public"),
                SubnetType: awsec2.SubnetType_PUBLIC,
                CidrMask:   jsii.Number(24),
            },
            {
                Name:       jsii.String("private"),
                SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
                CidrMask:   jsii.Number(24),
            },
        },
        EnableDnsHostnames: jsii.Bool(true),
        EnableDnsSupport:   jsii.Bool(true),
    })

    // Create CloudWatch Log Group for VPC Flow Logs
    logGroup := awslogs.NewLogGroup(scope, jsii.String(fmt.Sprintf("%s-vpc-flow-logs-group", id)), &awslogs.LogGroupProps{
        LogGroupName:  jsii.String(fmt.Sprintf("/aws/vpc/flowlogs/%s", cfg.Prefix)),
        RetentionDays: awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Enable VPC Flow Logs to both S3 and CloudWatch
    vpc.AddFlowLog(jsii.String("FlowLogsS3"), &awsec2.FlowLogOptions{
        Destination: awsec2.FlowLogDestination_ToS3(flowLogsBucket, jsii.String("vpc-flow-logs/")),
        TrafficType: awsec2.FlowLogTrafficType_ALL,
    })

    vpc.AddFlowLog(jsii.String("FlowLogsCloudWatch"), &awsec2.FlowLogOptions{
        Destination: awsec2.FlowLogDestination_ToCloudWatchLogs(logGroup, nil),
        TrafficType: awsec2.FlowLogTrafficType_ALL,
    })

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(vpc).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(flowLogsBucket).Add(jsii.String(key), value, nil)
    }

    return &VPCConstruct{
        VPC:             vpc,
        PublicSubnets:   vpc.PublicSubnets(),
        PrivateSubnets:  vpc.PrivateSubnets(),
        FlowLogsBucket:  flowLogsBucket,
    }
}
```

## Fix 5: Bastion host with key pair creation and proper dependencies

**internal/constructs/compute/bastion.go** (Fixed dependencies and key pair)

```go
package compute

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type BastionConstruct struct {
    Instance        awsec2.Instance
    KeyPair         awsec2.CfnKeyPair
    InstanceProfile awsiam.CfnInstanceProfile
}

func NewBastionHost(scope constructs.Construct, id string, vpc awsec2.IVpc, securityGroup awsec2.ISecurityGroup, role awsiam.IRole, prefix string, tags map[string]*string) *BastionConstruct {
    // Create EC2 Key Pair
    keyPair := awsec2.NewCfnKeyPair(scope, jsii.String(fmt.Sprintf("%s-bastion-keypair", id)), &awsec2.CfnKeyPairProps{
        KeyName: jsii.String(fmt.Sprintf("%s-bastion-key", prefix)),
        KeyType: jsii.String("rsa"),
        KeyFormat: jsii.String("pem"),
    })

    // Create instance profile with explicit dependency
    instanceProfile := awsiam.NewCfnInstanceProfile(scope, jsii.String(fmt.Sprintf("%s-bastion-profile", id)), &awsiam.CfnInstanceProfileProps{
        Roles: &[]*string{role.RoleName()},
        InstanceProfileName: jsii.String(fmt.Sprintf("%s-bastion-profile", prefix)),
    })

    // User data script for bastion host
    userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
    userData.AddCommands(
        "yum update -y",
        "yum install -y amazon-cloudwatch-agent",
        "yum install -y awslogs",

        // Configure CloudWatch agent
        fmt.Sprintf(`cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/bastion/%s/secure",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/bastion/%s/messages",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF`, prefix, prefix),

        // Start CloudWatch agent
        "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",

        // Configure SSH logging
        "echo 'LogLevel VERBOSE' >> /etc/ssh/sshd_config",
        "systemctl restart sshd",
    )

    // Create bastion host
    bastion := awsec2.NewInstance(scope, jsii.String(fmt.Sprintf("%s-bastion", id)), &awsec2.InstanceProps{
        InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux(&awsec2.AmazonLinuxImageProps{
            Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
        }),
        Vpc:             vpc,
        VpcSubnets:      &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
        SecurityGroup:   securityGroup,
        Role:            role,
        UserData:        userData,
        KeyName:         keyPair.KeyName(),
        DetailedMonitoring: jsii.Bool(true),
    })

    // Set up dependencies
    bastion.Node().AddDependency(instanceProfile)
    bastion.Node().AddDependency(keyPair)

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(bastion).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(keyPair).Add(jsii.String(key), value, nil)
    }

    return &BastionConstruct{
        Instance:        bastion,
        KeyPair:         keyPair,
        InstanceProfile: instanceProfile,
    }
}
```

## Fix 6: Updated storage with unique bucket names

**internal/constructs/storage/s3.go** (Fixed unique names)

```go
package storage

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awskms"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type S3Buckets struct {
    ContentBucket awss3.Bucket
    LogsBucket    awss3.Bucket
}

func NewS3Buckets(scope constructs.Construct, id string, kmsKey awskms.IKey, prefix string, uniqueSuffix string, tags map[string]*string) *S3Buckets {
    // Logging bucket (must be created first) with unique name
    logsBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-logs-bucket", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-access-logs-%s", prefix, uniqueSuffix)),
        Versioned:         jsii.Bool(false),
        PublicReadAccess:  jsii.Bool(false),
        PublicWriteAccess: jsii.Bool(false),
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
        LifecycleRules: &[]*awss3.LifecycleRule{
            {
                Id:         jsii.String("DeleteOldLogs"),
                Enabled:    jsii.Bool(true),
                Expiration: awscdk.Duration_Days(jsii.Number(90)),
            },
        },
    })

    // Main content bucket with encryption and unique name
    contentBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-content-bucket", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-content-%s", prefix, uniqueSuffix)),
        Versioned:         jsii.Bool(true),
        PublicReadAccess:  jsii.Bool(false),
        PublicWriteAccess: jsii.Bool(false),
        BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
        Encryption:        awss3.BucketEncryption_KMS,
        EncryptionKey:     kmsKey,
        RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
        ServerAccessLogsBucket: logsBucket,
        ServerAccessLogsPrefix: jsii.String("content-bucket-logs/"),
        LifecycleRules: &[]*awss3.LifecycleRule{
            {
                Id:      jsii.String("TransitionToIA"),
                Enabled: jsii.Bool(true),
                Transitions: &[]*awss3.Transition{
                    {
                        StorageClass:        awss3.StorageClass_INFREQUENT_ACCESS,
                        TransitionAfter:     awscdk.Duration_Days(jsii.Number(30)),
                    },
                    {
                        StorageClass:        awss3.StorageClass_GLACIER,
                        TransitionAfter:     awscdk.Duration_Days(jsii.Number(90)),
                    },
                },
            },
            {
                Id:                              jsii.String("DeleteOldVersions"),
                Enabled:                         jsii.Bool(true),
                NoncurrentVersionExpiration:     awscdk.Duration_Days(jsii.Number(365)),
            },
        },
    })

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(contentBucket).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(logsBucket).Add(jsii.String(key), value, nil)
    }

    return &S3Buckets{
        ContentBucket: contentBucket,
        LogsBucket:    logsBucket,
    }
}
```

## Fix 7: Updated storage stack to pass unique suffix

**internal/stacks/storage.go** (Updated)

```go
package stacks

import (
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/storage"
)

type StorageStack struct {
    *BaseStack
    S3Buckets        *storage.S3Buckets
    CloudFront       *storage.CloudFrontConstruct
}

func NewStorageStack(scope constructs.Construct, id string, props *BaseStackProps, securityStack *SecurityStack) *StorageStack {
    baseStack := NewBaseStack(scope, id, props)

    // Create S3 buckets with unique suffix
    s3Buckets := storage.NewS3Buckets(
        baseStack.Stack,
        jsii.String("S3"),
        securityStack.KMSKeys.S3Key,
        baseStack.Config.Prefix,
        baseStack.Config.UniqueSuffix, // Pass unique suffix
        baseStack.Config.CommonTags,
    )

    // Create CloudFront distribution
    cloudfront := storage.NewCloudFrontConstruct(
        baseStack.Stack,
        jsii.String("CloudFront"),
        s3Buckets.ContentBucket,
        s3Buckets.LogsBucket,
        securityStack.WebACL,
        baseStack.Config.Prefix,
        baseStack.Config.CommonTags,
    )

    return &StorageStack{
        BaseStack:  baseStack,
        S3Buckets:  s3Buckets,
        CloudFront: cloudfront,
    }
}
```

## Fix 8: Updated compute stack to use new bastion construct

**internal/stacks/compute.go** (Updated)

```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/compute"
)

type ComputeStack struct {
    *BaseStack
    BastionConstruct *compute.BastionConstruct // Updated to use construct
    LambdaFunction   awslambda.Function
}

func NewComputeStack(scope constructs.Construct, id string, props *BaseStackProps, networkStack *NetworkStack, securityStack *SecurityStack) *ComputeStack {
    baseStack := NewBaseStack(scope, id, props)

    // Create bastion host
    bastionConstruct := compute.NewBastionHost(
        baseStack.Stack,
        jsii.String("Bastion"),
        networkStack.VPCConstruct.VPC,
        networkStack.SecurityGroups.BastionSG,
        securityStack.IAMRoles.BastionRole,
        baseStack.Config.Prefix,
        baseStack.Config.CommonTags,
    )

    // Create Lambda function
    lambdaFunction := compute.NewLambdaFunction(
        baseStack.Stack,
        jsii.String("Lambda"),
        networkStack.VPCConstruct.VPC,
        networkStack.SecurityGroups.LambdaSG,
        securityStack.IAMRoles.LambdaExecutionRole,
        baseStack.Config.Prefix,
        baseStack.Config.CommonTags,
    )

    return &ComputeStack{
        BaseStack:        baseStack,
        BastionConstruct: bastionConstruct,
        LambdaFunction:   lambdaFunction,
    }
}
```

## Updated go.mod with all dependencies

**go.mod**

```go
module secure-infrastructure

go 1.19

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
    github.com/aws/aws-sdk-go-v2 v1.21.0
    github.com/aws/aws-sdk-go-v2/config v1.18.45
    github.com/aws/aws-sdk-go-v2/service/sts v1.23.0
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.89.0
)
```

## Deployment commands

Now you can deploy with:

```bash
# Install dependencies
go mod tidy

# Build to check for compilation errors
go build ./cmd/deploy

# Deploy all stacks
cdk deploy --all --require-approval never

# Or deploy individually with dependencies
cdk deploy NetworkStack
cdk deploy SecurityStack
cdk deploy StorageStack
cdk deploy ComputeStack
```

This should now compile and deploy successfully! The key fixes were:

1. Fixed all type mismatches and imports
2. Completed the main.go with proper AWS environment detection
3. Added unique suffixes to S3 bucket names
4. Created EC2 key pairs and handled instance profile dependencies
5. Fixed the WAF region issue by forcing us-east-1
6.
