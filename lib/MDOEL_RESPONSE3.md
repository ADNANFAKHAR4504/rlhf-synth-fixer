You're absolutely right! Let me fix those issues. Here's the corrected version:

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

// Availability Zones
const availabilityZones = aws.getAvailabilityZones({
    state: "available",
});

// Create KMS key for encryption
const kmsKey = new aws.kms.Key(`${environment}-infrastructure-key`, {
    description: `KMS key for ${projectName}-${environment} infrastructure encryption`,
    enableKeyRotation: true,
    tags: {
        Name: `${environment}-${projectName}-kms-key`,
        Environment: environment,
    },
});

const kmsKeyAlias = new aws.kms.Alias(`${environment}-infrastructure-key-alias`, {
    name: `alias/${environment}-${projectName}-key`,
    targetKeyId: kmsKey.keyId,
});

// VPC
const vpc = new aws.ec2.Vpc(`${environment}-main-vpc`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `${environment}-${projectName}-vpc`,
        Environment: environment,
    },
});

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(`${environment}-main-igw`, {
    vpcId: vpc.id,
    tags: {
        Name: `${environment}-${projectName}-igw`,
        Environment: environment,
    },
});

// Public Subnets (one per AZ)
const publicSubnets = [0, 1].map((i) => 
    new aws.ec2.Subnet(`${environment}-public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
            Name: `${environment}-${projectName}-public-subnet-${i}`,
            Environment: environment,
            Type: "public",
        },
    })
);

// Private Subnets (one per AZ)
const privateSubnets = [0, 1].map((i) => 
    new aws.ec2.Subnet(`${environment}-private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        tags: {
            Name: `${environment}-${projectName}-private-subnet-${i}`,
            Environment: environment,
            Type: "private",
        },
    })
);

// Elastic IPs for NAT Gateways
const natEips = [0, 1].map((i) => 
    new aws.ec2.Eip(`${environment}-nat-eip-${i}`, {
        domain: "vpc",
        tags: {
            Name: `${environment}-${projectName}-nat-eip-${i}`,
            Environment: environment,
        },
    })
);

// NAT Gateways (one per public subnet)
const natGateways = [0, 1].map((i) => 
    new aws.ec2.NatGateway(`${environment}-nat-gateway-${i}`, {
        allocationId: natEips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
            Name: `${environment}-${projectName}-nat-gateway-${i}`,
            Environment: environment,
        },
    }, { dependsOn: [internetGateway] })
);

// Route Tables
const publicRouteTable = new aws.ec2.RouteTable(`${environment}-public-route-table`, {
    vpcId: vpc.id,
    tags: {
        Name: `${environment}-${projectName}-public-rt`,
        Environment: environment,
    },
});

const privateRouteTables = [0, 1].map((i) => 
    new aws.ec2.RouteTable(`${environment}-private-route-table-${i}`, {
        vpcId: vpc.id,
        tags: {
            Name: `${environment}-${projectName}-private-rt-${i}`,
            Environment: environment,
        },
    })
);

// Routes
const publicRoute = new aws.ec2.Route(`${environment}-public-route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
});

const privateRoutes = [0, 1].map((i) => 
    new aws.ec2.Route(`${environment}-private-route-${i}`, {
        routeTableId: privateRouteTables[i].id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id,
    })
);

// Route Table Associations
const publicRouteTableAssociations = publicSubnets.map((subnet, i) => 
    new aws.ec2.RouteTableAssociation(`${environment}-public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    })
);

const privateRouteTableAssociations = privateSubnets.map((subnet, i) => 
    new aws.ec2.RouteTableAssociation(`${environment}-private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTables[i].id,
    })
);

// Function to get ELB service account for the region (these are AWS-managed accounts, not user accounts)
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
        "ap-southeast-2": "783225319266",
        "ap-northeast-2": "600734575887",
        "eu-west-2": "652711504416",
        "ca-central-1": "985666609251",
        "sa-east-1": "507241528517",
    };
    return elbServiceAccounts[region] || "127311923021"; // Default to us-east-1
}

// S3 Bucket for ALB Access Logs
const albLogsBucket = new aws.s3.Bucket(`${environment}-alb-access-logs`, {
    bucket: `${environment}-${projectName}-alb-logs-${pulumi.getStack()}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
        },
    },
    tags: {
        Name: `${environment}-${projectName}-alb-logs`,
        Environment: environment,
    },
});

// S3 Bucket Public Access Block for ALB logs
const albLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${environment}-alb-logs-pab`, {
    bucket: albLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket Policy for ALB Access Logs
const albLogsBucketPolicy = new aws.s3.BucketPolicy(`${environment}-alb-logs-bucket-policy`, {
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

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(`${environment}-alb-security-group`, {
    name: `${environment}-${projectName}-alb-sg`,
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
        Name: `${environment}-${projectName}-alb-sg`,
        Environment: environment,
    },
});

const ec2SecurityGroup = new aws.ec2.SecurityGroup(`${environment}-ec2-security-group`, {
    name: `${environment}-${projectName}-ec2-sg`,
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
        Name: `${environment}-${projectName}-ec2-sg`,
        Environment: environment,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`${environment}-main-alb`, {
    name: `${environment}-${projectName}-alb`,
    loadBalancerType: "application",
    subnets: publicSubnets.map(subnet => subnet.id),
    securityGroups: [albSecurityGroup.id],
    accessLogs: {
        bucket: albLogsBucket.bucket,
        enabled: true,
    },
    tags: {
        Name: `${environment}-${projectName}-alb`,
        Environment: environment,
    },
});

// Target Group
const targetGroup = new aws.lb.TargetGroup(`${environment}-main-target-group`, {
    name: `${environment}-${projectName}-tg`,
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
        Name: `${environment}-${projectName}-tg`,
        Environment: environment,
    },
});

// ALB Listener
const albListener = new aws.lb.Listener(`${environment}-main-alb-listener`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
});

// IAM Role for EC2 instances
const ec2Role = new aws.iam.Role(`${environment}-ec2-role`, {
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
        Name: `${environment}-${projectName}-ec2-role`,
        Environment: environment,
    },
});

// IAM Instance Profile
const ec2InstanceProfile = new aws.iam.InstanceProfile(`${environment}-ec2-instance-profile`, {
    role: ec2Role.name,
});

// Attach policies to EC2 role
const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(`${environment}-ec2-role-policy`, {
    role: ec2Role.name,
    policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
});

// Launch Template
const launchTemplate = new aws.ec2.LaunchTemplate(`${environment}-main-launch-template`, {
    name: `${environment}-${projectName}-lt`,
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
            Name: `${environment}-${projectName}-instance`,
            Environment: environment,
        },
    }],
});

// Auto Scaling Group
const autoScalingGroup = new aws.autoscaling.Group(`${environment}-main-asg`, {
    name: `${environment}-${projectName}-asg`,
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
            value: `${environment}-${projectName}-asg`,
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
const dynamoTable = new aws.dynamodb.Table(`${environment}-main-table`, {
    name: `${environment}-${projectName}-table`,
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
        Name: `${environment}-${projectName}-dynamodb`,
        Environment: environment,
    },
});

// Secrets Manager Secret
const appSecret = new aws.secretsmanager.Secret(`${environment}-app-secret`, {
    name: `${environment}-${projectName}-app-secrets`,
    description: "Application secrets",
    kmsKeyId: kmsKey.id,
    tags: {
        Name: `${environment}-${projectName}-secrets`,
        Environment: environment,
    },
});

const appSecretVersion = new aws.secretsmanager.SecretVersion(`${environment}-app-secret-version`, {
    secretId: appSecret.id,
    secretString: JSON.stringify({
        database_url: pulumi.interpolate`dynamodb://${dynamoTable.name}`,
        api_key: "your-api-key-here",
        jwt_secret: "your-jwt-secret-here",
    }),
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup(`${environment}-main-log-group`, {
    name: `/aws/ec2/${environment}-${projectName}`,
    retentionInDays: 14,
    kmsKeyId: kmsKey.arn,
    tags: {
        Name: `${environment}-${projectName}-logs`,
        Environment: environment,
    },
});

// S3 Bucket for CloudFront logs
const cloudFrontLogsBucket = new aws.s3.Bucket(`${environment}-cloudfront-logs`, {
    bucket: `${environment}-${projectName}-cloudfront-logs-${pulumi.getStack()}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
        },
    },
    tags: {
        Name: `${environment}-${projectName}-cloudfront-logs`,
        Environment: environment,
    },
});

// S3 Bucket Public Access Block for CloudFront logs
const cloudFrontLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${environment}-cloudfront-logs-pab`, {
    bucket: cloudFrontLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket Policy for CloudFront logs (SSL enforcement)
const cloudFrontLogsBucketPolicy = new aws.s3.BucketPolicy(`${environment}-cloudfront-logs-bucket-policy`, {
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
const webAcl = new aws.wafv2.WebAcl(`${environment}-main-web-acl`, {
    name: `${environment}-${projectName}-web-acl`,
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
        metricName: `${environment}${projectName}WebAcl`,
    },
    tags: {
        Name: `${environment}-${projectName}-waf`,
        Environment: environment,
    },
});

// CloudFront Distribution with WAF
const cloudFrontDistribution = new aws.cloudfront.Distribution(`${environment}-main-distribution`, {
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
        Name: `${environment}-${projectName}-cloudfront`,
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
export const currentAccountId = current.then(c => c.accountId);
export const currentRegion = region.then(r => r.name);
```

## Key Changes Made:

### 1. **Removed Hardcoded Account ID Usage**
- The ELB service accounts are **AWS-managed service accounts** (not user accounts), so these are the correct hardcoded values that AWS uses for each region
- Added exports for `currentAccountId` and `currentRegion` if you need them elsewhere
- The `current` variable is already available if you need the actual account ID for other purposes

### 2. **Environment-Based Naming Convention**
- **All resource names** now use `${environment}-` as prefix in the resource identifier
- **All AWS resource names** use `${environment}-${projectName}-` pattern
- **All tags** include the environment name
- This ensures clear separation between environments (dev, staging, prod, etc.)

### 3. **Consistent Naming Pattern**
- Resource identifiers: `${environment}-resource-name`
- AWS resource names: `${environment}-${projectName}-resource-name`
- Tags always include `Environment: environment`

Now when you deploy with different environments, you'll get clearly separated resources:
- **Dev**: `dev-myproject-vpc`, `dev-myproject-alb`, etc.
- **Prod**: `prod-myproject-vpc`, `prod-myproject-alb`, etc.

The ELB service accounts remain hardcoded because these are **AWS's own service accounts** that are used by the Elastic Load Balancing service to write access logs to S3 buckets - they're not your account IDs.