I'll help you build a secure, production-ready infrastructure using CDK with Go. Let me break this down into a well-organized project structure with all the security components you need.

## Project Structure

First, let's set up a clean project structure:

```
secure-infrastructure/
├── cmd/
│   └── deploy/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── constructs/
│   │   ├── compute/
│   │   │   ├── bastion.go
│   │   │   ├── lambda.go
│   │   │   └── ec2.go
│   │   ├── network/
│   │   │   ├── vpc.go
│   │   │   └── security_groups.go
│   │   ├── storage/
│   │   │   ├── s3.go
│   │   │   └── cloudfront.go
│   │   ├── security/
│   │   │   ├── kms.go
│   │   │   ├── iam.go
│   │   │   └── waf.go
│   │   └── monitoring/
│   │       ├── config.go
│   │       ├── cloudwatch.go
│   │       └── sns.go
│   └── stacks/
│       ├── base.go
│       ├── network.go
│       ├── security.go
│       ├── compute.go
│       ├── storage.go
│       └── monitoring.go
├── go.mod
├── go.sum
├── cdk.json
└── README.md
```

## Core Configuration

Let's start with the configuration structure:

**internal/config/config.go**

```go
package config

import (
    "fmt"
)

type Config struct {
    Environment string
    Region      string
    AZs         []string
    Prefix      string

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
    prefix := fmt.Sprintf("prod-%s", env)

    return &Config{
        Environment: env,
        Region:      "us-east-1",
        AZs:         []string{"us-east-1a", "us-east-1b"},
        Prefix:      prefix,

        VPCCidr:            "10.0.0.0/16",
        PublicSubnetCidrs:  []string{"10.0.1.0/24", "10.0.2.0/24"},
        PrivateSubnetCidrs: []string{"10.0.10.0/24", "10.0.20.0/24"},

        AllowedSSHCidrs: []string{"10.0.0.0/16"}, // Only from VPC

        LogRetentionDays: 30,

        CommonTags: map[string]*string{
            "Environment": &env,
            "Project":     stringPtr("secure-infrastructure"),
            "ManagedBy":   stringPtr("cdk"),
        },
    }
}

func stringPtr(s string) *string {
    return &s
}
```

## Security Components

**internal/constructs/security/kms.go**

```go
package security

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awskms"
    "github.com/aws/constructs-go/constructs/v10"
)

type KMSKeys struct {
    S3Key      awskms.Key
    LogsKey    awskms.Key
    SecretsKey awskms.Key
}

func NewKMSKeys(scope constructs.Construct, id string, accountId string, tags map[string]*string) *KMSKeys {
    // S3 encryption key
    s3Key := awskms.NewKey(scope, jsii.String(fmt.Sprintf("%s-s3-key", id)), &awskms.KeyProps{
        Description: jsii.String("KMS key for S3 bucket encryption"),
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
                awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                    Effect: awsiam.Effect_ALLOW,
                    Principals: &[]awsiam.IPrincipal{
                        awsiam.NewServicePrincipal(jsii.String("s3.amazonaws.com"), nil),
                        awsiam.NewServicePrincipal(jsii.String("cloudfront.amazonaws.com"), nil),
                    },
                    Actions: &[]*string{
                        jsii.String("kms:Decrypt"),
                        jsii.String("kms:GenerateDataKey"),
                    },
                    Resources: &[]*string{
                        jsii.String("*"),
                    },
                }),
            },
        }),
        EnableKeyRotation: jsii.Bool(true),
    })

    // CloudWatch Logs encryption key
    logsKey := awskms.NewKey(scope, jsii.String(fmt.Sprintf("%s-logs-key", id)), &awskms.KeyProps{
        Description: jsii.String("KMS key for CloudWatch Logs encryption"),
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
                awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                    Effect: awsiam.Effect_ALLOW,
                    Principals: &[]awsiam.IPrincipal{
                        awsiam.NewServicePrincipal(jsii.String(fmt.Sprintf("logs.%s.amazonaws.com", "us-east-1")), nil),
                    },
                    Actions: &[]*string{
                        jsii.String("kms:Encrypt"),
                        jsii.String("kms:Decrypt"),
                        jsii.String("kms:ReEncrypt*"),
                        jsii.String("kms:GenerateDataKey*"),
                        jsii.String("kms:DescribeKey"),
                    },
                    Resources: &[]*string{
                        jsii.String("*"),
                    },
                }),
            },
        }),
        EnableKeyRotation: jsii.Bool(true),
    })

    // Secrets Manager encryption key
    secretsKey := awskms.NewKey(scope, jsii.String(fmt.Sprintf("%s-secrets-key", id)), &awskms.KeyProps{
        Description: jsii.String("KMS key for Secrets Manager encryption"),
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
        EnableKeyRotation: jsii.Bool(true),
    })

    // Add tags to all keys
    for key, value := range tags {
        awscdk.Tags_Of(s3Key).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(logsKey).Add(jsii.String(key), value, nil)
        awscdk.Tags_Of(secretsKey).Add(jsii.String(key), value, nil)
    }

    return &KMSKeys{
        S3Key:      s3Key,
        LogsKey:    logsKey,
        SecretsKey: secretsKey,
    }
}
```

**internal/constructs/security/iam.go**

```go
package security

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/constructs-go/constructs/v10"
)

type IAMRoles struct {
    LambdaExecutionRole awsiam.Role
    EC2InstanceRole     awsiam.Role
    BastionRole         awsiam.Role
}

func NewIAMRoles(scope constructs.Construct, id string, s3BucketArn string, kmsKeyArn string) *IAMRoles {
    // Lambda execution role with least privilege
    lambdaRole := awsiam.NewRole(scope, jsii.String(fmt.Sprintf("%s-lambda-role", id)), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "S3Access": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            jsii.String("s3:GetObject"),
                            jsii.String("s3:PutObject"),
                        },
                        Resources: &[]*string{
                            jsii.String(fmt.Sprintf("%s/*", s3BucketArn)),
                        },
                    }),
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            jsii.String("kms:Decrypt"),
                            jsii.String("kms:GenerateDataKey"),
                        },
                        Resources: &[]*string{
                            jsii.String(kmsKeyArn),
                        },
                    }),
                },
            }),
            "ParameterStoreAccess": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            jsii.String("ssm:GetParameter"),
                            jsii.String("ssm:GetParameters"),
                        },
                        Resources: &[]*string{
                            jsii.String(fmt.Sprintf("arn:aws:ssm:us-east-1:*:parameter/%s/*", id)),
                        },
                    }),
                },
            }),
        },
    })

    // EC2 instance role
    ec2Role := awsiam.NewRole(scope, jsii.String(fmt.Sprintf("%s-ec2-role", id)), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "CloudWatchLogs": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            jsii.String("logs:CreateLogGroup"),
                            jsii.String("logs:CreateLogStream"),
                            jsii.String("logs:PutLogEvents"),
                        },
                        Resources: &[]*string{
                            jsii.String(fmt.Sprintf("arn:aws:logs:us-east-1:*:log-group:/aws/ec2/%s/*", id)),
                        },
                    }),
                },
            }),
        },
    })

    // Bastion host role (minimal permissions)
    bastionRole := awsiam.NewRole(scope, jsii.String(fmt.Sprintf("%s-bastion-role", id)), &awsiam.RoleProps{
        AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
        ManagedPolicies: &[]awsiam.IManagedPolicy{
            awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
        },
        InlinePolicies: &map[string]awsiam.PolicyDocument{
            "BastionLogs": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
                Statements: &[]awsiam.PolicyStatement{
                    awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
                        Effect: awsiam.Effect_ALLOW,
                        Actions: &[]*string{
                            jsii.String("logs:CreateLogGroup"),
                            jsii.String("logs:CreateLogStream"),
                            jsii.String("logs:PutLogEvents"),
                        },
                        Resources: &[]*string{
                            jsii.String(fmt.Sprintf("arn:aws:logs:us-east-1:*:log-group:/aws/bastion/%s/*", id)),
                        },
                    }),
                },
            }),
        },
    })

    return &IAMRoles{
        LambdaExecutionRole: lambdaRole,
        EC2InstanceRole:     ec2Role,
        BastionRole:         bastionRole,
    }
}
```

## Network Infrastructure

**internal/constructs/network/vpc.go**

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
)

type VPCConstruct struct {
    VPC             awsec2.Vpc
    PublicSubnets   []awsec2.ISubnet
    PrivateSubnets  []awsec2.ISubnet
    FlowLogsBucket  awss3.Bucket
}

func NewVPCConstruct(scope constructs.Construct, id string, config *Config, tags map[string]*string) *VPCConstruct {
    // Create S3 bucket for VPC Flow Logs
    flowLogsBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-vpc-flow-logs", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-vpc-flow-logs", config.Prefix)),
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
        IpAddresses: awsec2.IpAddresses_Cidr(jsii.String(config.VPCCidr)),
        MaxAzs:      jsii.Number(len(config.AZs)),
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
        LogGroupName:  jsii.String(fmt.Sprintf("/aws/vpc/flowlogs/%s", config.Prefix)),
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

**internal/constructs/network/security_groups.go**

```go
package network

import (
    "fmt"

    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type SecurityGroups struct {
    BastionSG   awsec2.SecurityGroup
    WebSG       awsec2.SecurityGroup
    AppSG       awsec2.SecurityGroup
    DatabaseSG  awsec2.SecurityGroup
    LambdaSG    awsec2.SecurityGroup
}

func NewSecurityGroups(scope constructs.Construct, id string, vpc awsec2.IVpc, allowedCidrs []string) *SecurityGroups {
    // Bastion security group - SSH access from specific CIDRs only
    bastionSG := awsec2.NewSecurityGroup(scope, jsii.String(fmt.Sprintf("%s-bastion-sg", id)), &awsec2.SecurityGroupProps{
        Vpc:               vpc,
        Description:       jsii.String("Security group for bastion host"),
        AllowAllOutbound: jsii.Bool(true),
    })

    for _, cidr := range allowedCidrs {
        bastionSG.AddIngressRule(
            awsec2.Peer_Ipv4(jsii.String(cidr)),
            awsec2.Port_Tcp(jsii.Number(22)),
            jsii.String("SSH access from allowed CIDRs"),
            jsii.Bool(false),
        )
    }

    // Web tier security group
    webSG := awsec2.NewSecurityGroup(scope, jsii.String(fmt.Sprintf("%s-web-sg", id)), &awsec2.SecurityGroupProps{
        Vpc:               vpc,
        Description:       jsii.String("Security group for web tier"),
        AllowAllOutbound: jsii.Bool(true),
    })

    webSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("HTTP access"),
        jsii.Bool(false),
    )

    webSG.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(443)),
        jsii.String("HTTPS access"),
        jsii.Bool(false),
    )

    // SSH access from bastion
    webSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(bastionSG.SecurityGroupId()),
        awsec2.Port_Tcp(jsii.Number(22)),
        jsii.String("SSH from bastion"),
        jsii.Bool(false),
    )

    // Application tier security group
    appSG := awsec2.NewSecurityGroup(scope, jsii.String(fmt.Sprintf("%s-app-sg", id)), &awsec2.SecurityGroupProps{
        Vpc:               vpc,
        Description:       jsii.String("Security group for application tier"),
        AllowAllOutbound: jsii.Bool(true),
    })

    // Allow access from web tier
    appSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(webSG.SecurityGroupId()),
        awsec2.Port_Tcp(jsii.Number(8080)),
        jsii.String("App access from web tier"),
        jsii.Bool(false),
    )

    // SSH access from bastion
    appSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(bastionSG.SecurityGroupId()),
        awsec2.Port_Tcp(jsii.Number(22)),
        jsii.String("SSH from bastion"),
        jsii.Bool(false),
    )

    // Database security group
    databaseSG := awsec2.NewSecurityGroup(scope, jsii.String(fmt.Sprintf("%s-database-sg", id)), &awsec2.SecurityGroupProps{
        Vpc:               vpc,
        Description:       jsii.String("Security group for database tier"),
        AllowAllOutbound: jsii.Bool(false),
    })

    // Allow database access from app tier only
    databaseSG.AddIngressRule(
        awsec2.Peer_SecurityGroupId(appSG.SecurityGroupId()),
        awsec2.Port_Tcp(jsii.Number(5432)), // PostgreSQL
        jsii.String("Database access from app tier"),
        jsii.Bool(false),
    )

    // Lambda security group
    lambdaSG := awsec2.NewSecurityGroup(scope, jsii.String(fmt.Sprintf("%s-lambda-sg", id)), &awsec2.SecurityGroupProps{
        Vpc:               vpc,
        Description:       jsii.String("Security group for Lambda functions"),
        AllowAllOutbound: jsii.Bool(true),
    })

    return &SecurityGroups{
        BastionSG:   bastionSG,
        WebSG:       webSG,
        AppSG:       appSG,
        DatabaseSG:  databaseSG,
        LambdaSG:    lambdaSG,
    }
}
```

## Storage and CDN

**internal/constructs/storage/s3.go**

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

func NewS3Buckets(scope constructs.Construct, id string, kmsKey awskms.IKey, prefix string, tags map[string]*string) *S3Buckets {
    // Logging bucket (must be created first)
    logsBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-logs-bucket", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-access-logs", prefix)),
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

    // Main content bucket with encryption
    contentBucket := awss3.NewBucket(scope, jsii.String(fmt.Sprintf("%s-content-bucket", id)), &awss3.BucketProps{
        BucketName:        jsii.String(fmt.Sprintf("%s-content", prefix)),
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

**internal/constructs/storage/cloudfront.go**

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

func NewCloudFrontConstruct(scope constructs.Construct, id string, bucket awss3.IBucket, logsBucket awss3.IBucket, prefix string, tags map[string]*string) *CloudFrontConstruct {
    // Create Origin Access Identity
    oai := awscloudfront.NewOriginAccessIdentity(scope, jsii.String(fmt.Sprintf("%s-oai", id)), &awscloudfront.OriginAccessIdentityProps{
        Comment: jsii.String(fmt.Sprintf("OA
```
