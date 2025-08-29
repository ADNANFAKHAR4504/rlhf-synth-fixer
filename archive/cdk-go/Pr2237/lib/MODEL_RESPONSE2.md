You're absolutely right - I left out several critical pieces! Let me fix all those issues and provide the complete, working implementation.

## Fix 1: Complete go.mod and imports

First, let's set up the proper `go.mod`:

**go.mod**

```go
module secure-infrastructure

go 1.19

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.89.0
)
```

## Fix 2: Complete CloudFront + WAF implementation

**internal/constructs/security/waf.go**

```go
package security

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

func NewWebACL(scope constructs.Construct, id string, prefix string) awswafv2.CfnWebACL {
    // Create WAF Web ACL for CloudFront
    webACL := awswafv2.NewCfnWebACL(scope, jsii.String(fmt.Sprintf("%s-web-acl", id)), &awswafv2.CfnWebACLProps{
        Name:  jsii.String(fmt.Sprintf("%s-cloudfront-waf", prefix)),
        Scope: jsii.String("CLOUDFRONT"),
        DefaultAction: &awswafv2.CfnWebACL_DefaultActionProperty{
            Allow: &awswafv2.CfnWebACL_AllowActionProperty{},
        },
        Rules: &[]interface{}{
            // AWS Managed Rules - Core Rule Set
            &awswafv2.CfnWebACL_RuleProperty{
                Name:     jsii.String("AWS-AWSManagedRulesCommonRuleSet"),
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
            // AWS Managed Rules - Known Bad Inputs
            &awswafv2.CfnWebACL_RuleProperty{
                Name:     jsii.String("AWS-AWSManagedRulesKnownBadInputsRuleSet"),
                Priority: jsii.Number(2),
                Statement: &awswafv2.CfnWebACL_StatementProperty{
                    ManagedRuleGroupStatement: &awswafv2.CfnWebACL_ManagedRuleGroupStatementProperty{
                        VendorName: jsii.String("AWS"),
                        Name:       jsii.String("AWSManagedRulesKnownBadInputsRuleSet"),
                    },
                },
                OverrideAction: &awswafv2.CfnWebACL_OverrideActionProperty{
                    None: &awswafv2.CfnWebACL_NoneActionProperty{},
                },
                VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
                    SampledRequestsEnabled:   jsii.Bool(true),
                    CloudWatchMetricsEnabled: jsii.Bool(true),
                    MetricName:               jsii.String("KnownBadInputsMetric"),
                },
            },
            // Rate limiting rule
            &awswafv2.CfnWebACL_RuleProperty{
                Name:     jsii.String("RateLimitRule"),
                Priority: jsii.Number(3),
                Statement: &awswafv2.CfnWebACL_StatementProperty{
                    RateBasedStatement: &awswafv2.CfnWebACL_RateBasedStatementProperty{
                        Limit:              jsii.Number(2000),
                        AggregateKeyType:   jsii.String("IP"),
                    },
                },
                Action: &awswafv2.CfnWebACL_RuleActionProperty{
                    Block: &awswafv2.CfnWebACL_BlockActionProperty{},
                },
                VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
                    SampledRequestsEnabled:   jsii.Bool(true),
                    CloudWatchMetricsEnabled: jsii.Bool(true),
                    MetricName:               jsii.String("RateLimitMetric"),
                },
            },
        },
        VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
            SampledRequestsEnabled:   jsii.Bool(true),
            CloudWatchMetricsEnabled: jsii.Bool(true),
            MetricName:               jsii.String(fmt.Sprintf("%s-WebACL", prefix)),
        },
    })

    return webACL
}
```

**internal/constructs/storage/cloudfront.go** (Complete version)

```go
package storage

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudfront"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudfrontorigins"
    "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
    "github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type CloudFrontConstruct struct {
    Distribution awscloudfront.Distribution
    OAI          awscloudfront.OriginAccessIdentity
    WebACL       awswafv2.CfnWebACL
}

func NewCloudFrontConstruct(scope constructs.Construct, id string, bucket awss3.IBucket, logsBucket awss3.IBucket, webACL awswafv2.CfnWebACL, prefix string, tags map[string]*string) *CloudFrontConstruct {
    // Create Origin Access Identity
    oai := awscloudfront.NewOriginAccessIdentity(scope, jsii.String(fmt.Sprintf("%s-oai", id)), &awscloudfront.OriginAccessIdentityProps{
        Comment: jsii.String(fmt.Sprintf("Origin Access Identity for %s", prefix)),
    })

    // Grant OAI read access to the S3 bucket
    bucket.GrantRead(oai, jsii.String("*"))

    // Create CloudFront distribution
    distribution := awscloudfront.NewDistribution(scope, jsii.String(fmt.Sprintf("%s-distribution", id)), &awscloudfront.DistributionProps{
        Comment: jsii.String(fmt.Sprintf("CloudFront distribution for %s", prefix)),
        DefaultBehavior: &awscloudfront.BehaviorOptions{
            Origin: awscloudfrontorigins.NewS3Origin(bucket, &awscloudfrontorigins.S3OriginProps{
                OriginAccessIdentity: oai,
            }),
            ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_REDIRECT_TO_HTTPS,
            AllowedMethods: awscloudfront.AllowedMethods_ALLOW_GET_HEAD_OPTIONS(),
            CachedMethods: awscloudfront.CachedMethods_CACHE_GET_HEAD_OPTIONS(),
            CachePolicy: awscloudfront.CachePolicy_CACHING_OPTIMIZED(),
            OriginRequestPolicy: awscloudfront.OriginRequestPolicy_CORS_S3_ORIGIN(),
            ResponseHeadersPolicy: awscloudfront.ResponseHeadersPolicy_SECURITY_HEADERS(),
        },
        AdditionalBehaviors: &map[string]*awscloudfront.BehaviorOptions{
            "/api/*": {
                Origin: awscloudfrontorigins.NewS3Origin(bucket, &awscloudfrontorigins.S3OriginProps{
                    OriginAccessIdentity: oai,
                }),
                ViewerProtocolPolicy: awscloudfront.ViewerProtocolPolicy_HTTPS_ONLY,
                AllowedMethods: awscloudfront.AllowedMethods_ALLOW_ALL(),
                CachePolicy: awscloudfront.CachePolicy_CACHING_DISABLED(),
                OriginRequestPolicy: awscloudfront.OriginRequestPolicy_ALL_VIEWER(),
            },
        },
        LogBucket: logsBucket,
        LogFilePrefix: jsii.String("cloudfront-logs/"),
        LogIncludesCookies: jsii.Bool(false),
        PriceClass: awscloudfront.PriceClass_PRICE_CLASS_100,
        Enabled: jsii.Bool(true),
        HttpVersion: awscloudfront.HttpVersion_HTTP2,
        WebAclId: webACL.AttrArn(),
        ErrorResponses: &[]*awscloudfront.ErrorResponse{
            {
                HttpStatus: jsii.Number(403),
                ResponseHttpStatus: jsii.Number(200),
                ResponsePagePath: jsii.String("/index.html"),
                Ttl: awscdk.Duration_Minutes(jsii.Number(30)),
            },
            {
                HttpStatus: jsii.Number(404),
                ResponseHttpStatus: jsii.Number(200),
                ResponsePagePath: jsii.String("/index.html"),
                Ttl: awscdk.Duration_Minutes(jsii.Number(30)),
            },
        },
    })

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(distribution).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(oai).Add(jsii.String(key), value, nil)
    }

    return &CloudFrontConstruct{
        Distribution: distribution,
        OAI:          oai,
        WebACL:       webACL,
    }
}
```

## Fix 3: Complete Network VPC with proper imports

**internal/constructs/network/vpc.go** (Fixed version)

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
    // Create S3 bucket for VPC Flow Logs
    flowLogsBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-vpc-flow-logs", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-vpc-flow-logs", cfg.Prefix)),
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
        RetentionDays: awslogs.RetentionDays(awslogs.RetentionDays_ONE_MONTH),
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

## Fix 4: Complete Compute Components

**internal/constructs/compute/bastion.go**

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

func NewBastionHost(scope constructs.Construct, id string, vpc awsec2.IVpc, securityGroup awsec2.ISecurityGroup, role awsiam.IRole, prefix string, tags map[string]*string) awsec2.Instance {
    // Create instance profile
    instanceProfile := awsiam.NewCfnInstanceProfile(scope, jsii.String(fmt.Sprintf("%s-bastion-profile", id)), &awsiam.CfnInstanceProfileProps{
        Roles: &[]*string{role.RoleName()},
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
        KeyName:         jsii.String(fmt.Sprintf("%s-bastion-key", prefix)),
        DetailedMonitoring: jsii.Bool(true),
    })

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(bastion).Add(jsii.String(key), value, nil)
    }

    return bastion
}
```

**internal/constructs/compute/lambda.go**

```go
package compute

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

func NewLambdaFunction(scope constructs.Construct, id string, vpc awsec2.IVpc, securityGroup awsec2.ISecurityGroup, role awsiam.IRole, prefix string, tags map[string]*string) awslambda.Function {
    // Create log group with retention
    logGroup := awslogs.NewLogGroup(scope, jsii.String(fmt.Sprintf("%s-lambda-logs", id)), &awslogs.LogGroupProps{
        LogGroupName:  jsii.String(fmt.Sprintf("/aws/lambda/%s-background-job", prefix)),
        RetentionDays: awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Create Lambda function
    lambdaFunction := awslambda.NewFunction(scope, jsii.String(fmt.Sprintf("%s-lambda", id)), &awslambda.FunctionProps{
        Runtime: awslambda.Runtime_PYTHON_3_9(),
        Handler: jsii.String("index.handler"),
        Code: awslambda.Code_FromInline(jsii.String(`
import json
import boto3
import os

def handler(event, context):
    print(f"Processing event: {json.dumps(event)}")

    # Example: Process background job
    # Your actual business logic here

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Background job completed successfully',
            'requestId': context.aws_request_id
        })
    }
        `)),
        Role:        role,
        Timeout:     awscdk.Duration_Minutes(jsii.Number(5)),
        MemorySize:  jsii.Number(256),
        Vpc:         vpc,
        VpcSubnets:  &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
        SecurityGroups: &[]awsec2.ISecurityGroup{securityGroup},
        Environment: &map[string]*string{
            "ENVIRONMENT": jsii.String(prefix),
            "LOG_LEVEL":   jsii.String("INFO"),
        },
        LogGroup: logGroup,
    })

    // Apply tags
    for key, value := range tags {
        awscdk.Tags_Of(lambdaFunction).Add(jsii.String(key), value, nil)
    }

    return lambdaFunction
}
```

## Fix 5: Stack Implementation

**internal/stacks/base.go**

```go
package stacks

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"

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
    stack := awscdk.NewStack(scope, &id, &props.StackProps)

    // Apply common tags to the entire stack
    for key, value := range props.Config.CommonTags {
        awscdk.Tags_Of(stack).Add(&key, value, nil)
    }

    return &BaseStack{
        Stack:  stack,
        Config: props.Config,
    }
}
```

**internal/stacks/network.go**

```go
package stacks

import (
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/network"
)

type NetworkStack struct {
    *BaseStack
    VPCConstruct    *network.VPCConstruct
    SecurityGroups  *network.SecurityGroups
}

func NewNetworkStack(scope constructs.Construct, id string, props *BaseStackProps) *NetworkStack {
    baseStack := NewBaseStack(scope, id, props)

    // Create VPC
    vpcConstruct := network.NewVPCConstruct(
        baseStack.Stack,
        jsii.String("VPC"),
        baseStack.Config,
        baseStack.Config.CommonTags,
    )

    // Create Security Groups
    securityGroups := network.NewSecurityGroups(
        baseStack.Stack,
        jsii.String("SecurityGroups"),
        vpcConstruct.VPC,
        baseStack.Config.AllowedSSHCidrs,
    )

    return &NetworkStack{
        BaseStack:       baseStack,
        VPCConstruct:    vpcConstruct,
        SecurityGroups:  securityGroups,
    }
}
```

**internal/stacks/security.go**

```go
package stacks

import (
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/security"
)

type SecurityStack struct {
    *BaseStack
    KMSKeys *security.KMSKeys
    IAMRoles *security.IAMRoles
    WebACL   security.CfnWebACL
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

    // Create WAF Web ACL
    webACL := security.NewWebACL(
        baseStack.Stack,
        jsii.String("WAF"),
        baseStack.Config.Prefix,
    )

    return &SecurityStack{
        BaseStack: baseStack,
        KMSKeys:   kmsKeys,
        IAMRoles:  iamRoles,
        WebACL:    webACL,
    }
}
```

**internal/stacks/storage.go**

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

    // Create S3 buckets
    s3Buckets := storage.NewS3Buckets(
        baseStack.Stack,
        jsii.String("S3"),
        securityStack.KMSKeys.S3Key,
        baseStack.Config.Prefix,
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

**internal/stacks/compute.go**

```go
package stacks

import (
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/constructs/compute"
)

type ComputeStack struct {
    *BaseStack
    BastionHost    awsec2.Instance
    LambdaFunction awslambda.Function
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

## Fix 6: Main Application

**cmd/deploy/main.go**

```go
package main

import (
    "os"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"

    "secure-infrastructure/internal/config"
    "secure-infrastructure/internal/stacks"
)

func main() {
    defer jsii.Close()

    app := awscdk.NewApp(nil)

    // Get environment from context or default to "dev"
    env := "dev"
    if envContext := app.Node().TryGetContext(jsii.String("environment")); envContext != nil {
        if env
```
