I see the issues. Let me fix them:

1. **S3 bucket naming** - The bucket names are invalid (contain uppercase and special characters)
2. **KMS key permissions** - CloudWatch Logs needs specific permissions to use the KMS key
3. **S3 server-side encryption** - Using deprecated inline configuration

Here's the corrected code:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Get current AWS region and account ID
const current = aws.getCallerIdentity({});
const region = aws.getRegion({});

// Configuration
const config = new pulumi.Config();
const projectName = pulumi.getProject();
const stackName = pulumi.getStack();
const environment = config.get("environment") || stackName;

// Create a sanitized name for resources (lowercase, no special chars)
const sanitizedName = `${projectName}-${environment}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

// Availability Zones
const availabilityZones = aws.getAvailabilityZones({
    state: "available",
});

// Create KMS key for encryption
const kmsKey = new aws.kms.Key("infrastructure-key", {
    description: `KMS key for ${projectName}-${environment} infrastructure encryption`,
    enableKeyRotation: true,
    policy: pulumi.all([current, region]).apply(([currentAccount, currentRegion]) => 
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${currentAccount.accountId}:root`
                    },
                    Action: "kms:*",
                    Resource: "*"
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: `logs.${currentRegion.name}.amazonaws.com`
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    Resource: "*",
                    Condition: {
                        ArnEquals: {
                            "kms:EncryptionContext:aws:logs:arn": `arn:aws:logs:${currentRegion.name}:${currentAccount.accountId}:log-group:/aws/ec2/${sanitizedName}`
                        }
                    }
                }
            ]
        })
    ),
    tags: {
        Name: `${sanitizedName}-kms-key`,
        Environment: environment,
    },
});

const kmsKeyAlias = new aws.kms.Alias("infrastructure-key-alias", {
    name: `alias/${sanitizedName}-key`,
    targetKeyId: kmsKey.keyId,
});

// VPC
const vpc = new aws.ec2.Vpc("main-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `${sanitizedName}-vpc`,
        Environment: environment,
    },
});

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("main-igw", {
    vpcId: vpc.id,
    tags: {
        Name: `${sanitizedName}-igw`,
        Environment: environment,
    },
});

// Public Subnets (one per AZ)
const publicSubnets = [0, 1].map((i) => 
    new aws.ec2.Subnet(`public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
            Name: `${sanitizedName}-public-subnet-${i}`,
            Environment: environment,
            Type: "public",
        },
    })
);

// Private Subnets (one per AZ)
const privateSubnets = [0, 1].map((i) => 
    new aws.ec2.Subnet(`private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        tags: {
            Name: `${sanitizedName}-private-subnet-${i}`,
            Environment: environment,
            Type: "private",
        },
    })
);

// Elastic IPs for NAT Gateways
const natEips = [0, 1].map((i) => 
    new aws.ec2.Eip(`nat-eip-${i}`, {
        domain: "vpc",
        tags: {
            Name: `${sanitizedName}-nat-eip-${i}`,
            Environment: environment,
        },
    })
);

// NAT Gateways (one per public subnet)
const natGateways = [0, 1].map((i) => 
    new aws.ec2.NatGateway(`nat-gateway-${i}`, {
        allocationId: natEips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
            Name: `${sanitizedName}-nat-gateway-${i}`,
            Environment: environment,
        },
    }, { dependsOn: [internetGateway] })
);

// Route Tables
const publicRouteTable = new aws.ec2.RouteTable("public-route-table", {
    vpcId: vpc.id,
    tags: {
        Name: `${sanitizedName}-public-rt`,
        Environment: environment,
    },
});

const privateRouteTables = [0, 1].map((i) => 
    new aws.ec2.RouteTable(`private-route-table-${i}`, {
        vpcId: vpc.id,
        tags: {
            Name: `${sanitizedName}-private-rt-${i}`,
            Environment: environment,
        },
    })
);

// Routes
const publicRoute = new aws.ec2.Route("public-route", {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
});

const privateRoutes = [0, 1].map((i) => 
    new aws.ec2.Route(`private-route-${i}`, {
        routeTableId: privateRouteTables[i].id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id,
    })
);

// Route Table Associations
const publicRouteTableAssociations = publicSubnets.map((subnet, i) => 
    new aws.ec2.RouteTableAssociation(`public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    })
);

const privateRouteTableAssociations = privateSubnets.map((subnet, i) => 
    new aws.ec2.RouteTableAssociation(`private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTables[i].id,
    })
);

// Generate unique bucket names
const timestamp = Date.now().toString();
const albBucketName = `${sanitizedName}-alb-logs-${timestamp}`;
const cloudFrontBucketName = `${sanitizedName}-cf-logs-${timestamp}`;

// S3 Bucket for ALB Access Logs
const albLogsBucket = new aws.s3.Bucket("alb-access-logs", {
    bucket: albBucketName,
    forceDestroy: true,
    tags: {
        Name: `${sanitizedName}-alb-logs`,
        Environment: environment,
    },
});

// S3 Bucket Server Side Encryption for ALB logs
const albLogsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration("alb-logs-encryption", {
    bucket: albLogsBucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKey.arn,
        },
        bucketKeyEnabled: true,
    }],
});

// S3 Bucket Public Access Block for ALB logs
const albLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("alb-logs-pab", {
    bucket: albLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket Policy for ALB Access Logs
const albLogsBucketPolicy = new aws.s3.BucketPolicy("alb-logs-bucket-policy", {
    bucket: albLogsBucket.id,
    policy: pulumi.all([albLogsBucket.arn, region]).apply(([bucketArn, currentRegion]) => 
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [bucketArn, `${bucketArn}/*`],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false"
                        }
                    }
                },
                {
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${getELBServiceAccount(currentRegion.name)}:root`
                    },
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/*`
                }
            ]
        })
    )
});

// Function to get ELB service account for the region
function getELBServiceAccount(region: string): string {
    const elbServiceAccounts: { [key: string]: string } = {
        "us-east-1": "127311923021",
        "us-east-2": "033677994240",
        "us-west-1": "027434742980",
        "us-west-2": "797873946194",
        "eu-west-1": "156460612806",
        "eu-central-1": "054676820928",
        "ap-southeast-1": "114774131450",
        "ap-northeast-1": "582318560864",
    };
    return elbServiceAccounts[region] || "127311923021"; // Default to us-east-1
}

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup("alb-security-group", {
    name: `${sanitizedName}-alb-sg`,
    description: "Security group for Application Load Balancer",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    tags: {
        Name: `${sanitizedName}-alb-sg`,
        Environment: environment,
    },
});

const ec2SecurityGroup = new aws.ec2.SecurityGroup("ec2-security-group", {
    name: `${sanitizedName}-ec2-sg`,
    description: "Security group for EC2 instances",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            securityGroups: [albSecurityGroup.id],
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    tags: {
        Name: `${sanitizedName}-ec2-sg`,
        Environment: environment,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer("main-alb", {
    name: `${sanitizedName}-alb`,
    loadBalancerType: "application",
    subnets: publicSubnets.map(subnet => subnet.id),
    securityGroups: [albSecurityGroup.id],
    accessLogs: {
        bucket: albLogsBucket.bucket,
        enabled: true,
    },
    tags: {
        Name: `${sanitizedName}-alb`,
        Environment: environment,
    },
});

// Target Group
const targetGroup = new aws.lb.TargetGroup("main-target-group", {
    name: `${sanitizedName}-tg`,
    port: 80,
    protocol: "HTTP",
    vpcId: vpc.id,
    healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/health",
        matcher: "200",
    },
    tags: {
        Name: `${sanitizedName}-tg`,
        Environment: environment,
    },
});

// ALB Listener
const albListener = new aws.lb.Listener("main-alb-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
});

// IAM Role for EC2 instances
const ec2Role = new aws.iam.Role("ec2-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com"
            }
        }]
    }),
    tags: {
        Name: `${sanitizedName}-ec2-role`,
        Environment: environment,
    },
});

// IAM Instance Profile
const ec2InstanceProfile = new aws.iam.InstanceProfile("ec2-instance-profile", {
    role: ec2Role.name,
});

// Attach policies to EC2 role
const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment("ec2-role-policy", {
    role: ec2Role.name,
    policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
});

// Launch Template
const launchTemplate = new aws.ec2.LaunchTemplate("main-launch-template", {
    name: `${sanitizedName}-lt`,
    imageId: aws.ec2.getAmi({
        mostRecent: true,
        owners: ["amazon"],
        filters: [
            {
                name: "name",
                values: ["amzn2-ami-hvm-*-x86_64-gp2"],
            },
        ],
    }).then(ami => ami.id),
    instanceType: "t3.micro",
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: {
        name: ec2InstanceProfile.name,
    },
    userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
        echo "OK" > /var/www/html/health
    `).toString('base64'),
    tagSpecifications: [{
        resourceType: "instance",
        tags: {
            Name: `${sanitizedName}-instance`,
            Environment: environment,
        },
    }],
});

// Auto Scaling Group
const autoScalingGroup = new aws.autoscaling.Group("main-asg", {
    name: `${sanitizedName}-asg`,
    vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
    targetGroupArns: [targetGroup.arn],
    healthCheckType: "ELB",
    healthCheckGracePeriod: 300,
    minSize: 2,
    maxSize: 6,
    desiredCapacity: 2,
    launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
    },
    tags: [
        {
            key: "Name",
            value: `${sanitizedName}-asg`,
            propagateAtLaunch: false,
        },
        {
            key: "Environment",
            value: environment,
            propagateAtLaunch: true,
        },
    ],
});

// DynamoDB Table
const dynamoTable = new aws.dynamodb.Table("main-table", {
    name: `${sanitizedName}-table`,
    billingMode: "PROVISIONED",
    readCapacity: 5,
    writeCapacity: 5,
    hashKey: "id",
    attributes: [{
        name: "id",
        type: "S",
    }],
    serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
    },
    pointInTimeRecovery: {
        enabled: true,
    },
    tags: {
        Name: `${sanitizedName}-dynamodb`,
        Environment: environment,
    },
});

// Secrets Manager Secret
const appSecret = new aws.secretsmanager.Secret("app-secret", {
    name: `${sanitizedName}-app-secrets`,
    description: "Application secrets",
    kmsKeyId: kmsKey.id,
    tags: {
        Name: `${sanitizedName}-secrets`,
        Environment: environment,
    },
});

const appSecretVersion = new aws.secretsmanager.SecretVersion("app-secret-version", {
    secretId: appSecret.id,
    secretString: JSON.stringify({
        database_url: pulumi.interpolate`dynamodb://${dynamoTable.name}`,
        api_key: "your-api-key-here",
        jwt_secret: "your-jwt-secret-here",
    }),
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup("main-log-group", {
    name: `/aws/ec2/${sanitizedName}`,
    retentionInDays: 14,
    kmsKeyId: kmsKey.arn,
    tags: {
        Name: `${sanitizedName}-logs`,
        Environment: environment,
    },
}, { dependsOn: [kmsKey] });

// S3 Bucket for CloudFront logs
const cloudFrontLogsBucket = new aws.s3.Bucket("cloudfront-logs", {
    bucket: cloudFrontBucketName,
    forceDestroy: true,
    tags: {
        Name: `${sanitizedName}-cloudfront-logs`,
        Environment: environment,
    },
});

// S3 Bucket Server Side Encryption for CloudFront logs
const cloudFrontLogsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration("cloudfront-logs-encryption", {
    bucket: cloudFrontLogsBucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKey.arn,
        },
        bucketKeyEnabled: true,
    }],
});

// S3 Bucket Public Access Block for CloudFront logs
const cloudFrontLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("cloudfront-logs-pab", {
    bucket: cloudFrontLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket Policy for CloudFront logs (SSL enforcement)
const cloudFrontLogsBucketPolicy = new aws.s3.BucketPolicy("cloudfront-logs-bucket-policy", {
    bucket: cloudFrontLogsBucket.id,
    policy: cloudFrontLogsBucket.arn.apply(bucketArn => 
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [bucketArn, `${bucketArn}/*`],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        })
    )
});

// WAF Web ACL
const webAcl = new aws.wafv2.WebAcl("main-web-acl", {
    name: `${sanitizedName}-web-acl`,
    description: "Web ACL for DDoS protection",
    scope: "CLOUDFRONT",
    defaultAction: {
        allow: {},
    },
    rules: [
        {
            name: "AWSManagedRulesCommonRuleSet",
            priority: 1,
            overrideAction: {
                none: {},
            },
            statement: {
                managedRuleGroupStatement: {
                    name: "AWSManagedRulesCommonRuleSet",
                    vendorName: "AWS",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudwatchMetricsEnabled: true,
                metricName: "CommonRuleSetMetric",
            },
        },
        {
            name: "AWSManagedRulesKnownBadInputsRuleSet",
            priority: 2,
            overrideAction: {
                none: {},
            },
            statement: {
                managedRuleGroupStatement: {
                    name: "AWSManagedRulesKnownBadInputsRuleSet",
                    vendorName: "AWS",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudwatchMetricsEnabled: true,
                metricName: "KnownBadInputsRuleSetMetric",
            },
        },
    ],
    visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `${sanitizedName.replace(/-/g, "")}WebAcl`,
    },
    tags: {
        Name: `${sanitizedName}-waf`,
        Environment: environment,
    },
});

// CloudFront Distribution with WAF
const cloudFrontDistribution = new aws.cloudfront.Distribution("main-distribution", {
    origins: [{
        domainName: alb.dnsName,
        originId: "ALB",
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "http-only",
            originSslProtocols: ["TLSv1.2"],
        },
    }],
    enabled: true,
    defaultCacheBehavior: {
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: "ALB",
        compress: true,
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    loggingConfig: {
        bucket: cloudFrontLogsBucket.bucketDomainName,
        includeCookies: false,
        prefix: "cloudfront-logs/",
    },
    webAclId: webAcl.arn,
    tags: {
        Name: `${sanitizedName}-cloudfront`,
        Environment: environment,
    },
});

// Exports
export const vpcId = vpc.id;
export const publicSubnetIds = publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = privateSubnets.map(subnet => subnet.id);
export const albDnsName = alb.dnsName;
export const albZoneId = alb.zoneId;
export const cloudFrontDomainName = cloudFrontDistribution.domainName;
export const dynamoTableName = dynamoTable.name;
export const secretArn = appSecret.arn;
export const kmsKeyId = kmsKey.keyId;
export const kmsKeyArn = kmsKey.arn;
export const webAclArn = webAcl.arn;
export const logGroupName = logGroup.name;
export const albLogsBucketName = albLogsBucket.bucket;
export const cloudFrontLogsBucketName = cloudFrontLogsBucket.bucket;
```

## Key Fixes:

1. **Fixed S3 bucket naming** - Using sanitized names with timestamps for uniqueness
2. **Added KMS key policy** - Explicit permissions for CloudWatch Logs service
3. **Separated S3 encryption** - Using `aws.s3.BucketServerSideEncryptionConfiguration` instead of deprecated inline config
4. **Added dependencies** - CloudWatch Log Group depends on KMS key creation
5. **Sanitized all resource names** - Lowercase, no special characters for AWS compliance

The infrastructure now follows AWS naming conventions and should deploy successfully!
