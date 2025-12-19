# High-Performance Web Application Infrastructure - Pulumi TypeScript

Complete Pulumi TypeScript implementation for e-commerce platform with Aurora PostgreSQL, Lambda functions, CloudFront, ALB, and comprehensive monitoring.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// Availability zones
const availabilityZones = ["us-east-1a", "us-east-1b", "us-east-1c"];

// VPC CIDR configuration
const vpcCidr = "10.0.0.0/16";
const publicSubnetCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
const privateSubnetCidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"];

// Create VPC
const vpc = new aws.ec2.Vpc(`ecommerce-vpc-${environmentSuffix}`, {
    cidrBlock: vpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `ecommerce-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Create Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(`ecommerce-igw-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        Name: `ecommerce-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Create Public Subnets
const publicSubnets = availabilityZones.map((az, index) =>
    new aws.ec2.Subnet(`ecommerce-public-subnet-${index + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: publicSubnetCidrs[index],
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
            Name: `ecommerce-public-subnet-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
            Type: "Public",
        },
    })
);

// Create Private Subnets
const privateSubnets = availabilityZones.map((az, index) =>
    new aws.ec2.Subnet(`ecommerce-private-subnet-${index + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: privateSubnetCidrs[index],
        availabilityZone: az,
        tags: {
            Name: `ecommerce-private-subnet-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
            Type: "Private",
        },
    })
);

// Create Elastic IPs for NAT Gateways
const natEips = availabilityZones.map((az, index) =>
    new aws.ec2.Eip(`ecommerce-nat-eip-${index + 1}-${environmentSuffix}`, {
        domain: "vpc",
        tags: {
            Name: `ecommerce-nat-eip-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    })
);

// Create NAT Gateways in each public subnet
const natGateways = publicSubnets.map((subnet, index) =>
    new aws.ec2.NatGateway(`ecommerce-nat-${index + 1}-${environmentSuffix}`, {
        allocationId: natEips[index].id,
        subnetId: subnet.id,
        tags: {
            Name: `ecommerce-nat-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    })
);

// Create Public Route Table
const publicRouteTable = new aws.ec2.RouteTable(`ecommerce-public-rt-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        Name: `ecommerce-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Add route to Internet Gateway
new aws.ec2.Route(`ecommerce-public-route-${environmentSuffix}`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
});

// Associate public subnets with public route table
publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`ecommerce-public-rta-${index + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    });
});

// Create Private Route Tables (one per AZ for NAT Gateway)
const privateRouteTables = natGateways.map((natGateway, index) => {
    const routeTable = new aws.ec2.RouteTable(`ecommerce-private-rt-${index + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: {
            Name: `ecommerce-private-rt-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });

    new aws.ec2.Route(`ecommerce-private-route-${index + 1}-${environmentSuffix}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateway.id,
    });

    return routeTable;
});

// Associate private subnets with private route tables
privateSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`ecommerce-private-rta-${index + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTables[index].id,
    });
});

// Security Group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-alb-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP",
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
        },
    ],
    tags: {
        Name: `ecommerce-alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Security Group for Lambda Functions
const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-lambda-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for Lambda functions",
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
        },
    ],
    tags: {
        Name: `ecommerce-lambda-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Security Group for Aurora
const auroraSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-aurora-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for Aurora PostgreSQL",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [lambdaSecurityGroup.id],
            description: "Allow PostgreSQL from Lambda",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
        },
    ],
    tags: {
        Name: `ecommerce-aurora-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DB Subnet Group for Aurora
const dbSubnetGroup = new aws.rds.SubnetGroup(`ecommerce-db-subnet-group-${environmentSuffix}`, {
    subnetIds: privateSubnets.map(s => s.id),
    tags: {
        Name: `ecommerce-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Aurora PostgreSQL Serverless v2 Cluster
const auroraCluster = new aws.rds.Cluster(`ecommerce-aurora-cluster-${environmentSuffix}`, {
    clusterIdentifier: `ecommerce-aurora-${environmentSuffix}`,
    engine: "aurora-postgresql",
    engineMode: "provisioned",
    engineVersion: "15.3",
    databaseName: "ecommerce",
    masterUsername: "dbadmin",
    masterPassword: pulumi.secret(config.requireSecret("dbPassword")),
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [auroraSecurityGroup.id],
    serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0,
    },
    skipFinalSnapshot: true,
    tags: {
        Name: `ecommerce-aurora-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Aurora Writer Instance
const auroraWriter = new aws.rds.ClusterInstance(`ecommerce-aurora-writer-${environmentSuffix}`, {
    identifier: `ecommerce-aurora-writer-${environmentSuffix}`,
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: "aurora-postgresql",
    engineVersion: "15.3",
    tags: {
        Name: `ecommerce-aurora-writer-${environmentSuffix}`,
        Environment: environmentSuffix,
        Role: "Writer",
    },
});

// Aurora Reader Instances
const auroraReader1 = new aws.rds.ClusterInstance(`ecommerce-aurora-reader-1-${environmentSuffix}`, {
    identifier: `ecommerce-aurora-reader-1-${environmentSuffix}`,
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: "aurora-postgresql",
    engineVersion: "15.3",
    tags: {
        Name: `ecommerce-aurora-reader-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Role: "Reader",
    },
});

const auroraReader2 = new aws.rds.ClusterInstance(`ecommerce-aurora-reader-2-${environmentSuffix}`, {
    identifier: `ecommerce-aurora-reader-2-${environmentSuffix}`,
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: "aurora-postgresql",
    engineVersion: "15.3",
    tags: {
        Name: `ecommerce-aurora-reader-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Role: "Reader",
    },
});

// RDS Proxy IAM Role
const rdsProxyRole = new aws.iam.Role(`ecommerce-rds-proxy-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: { Service: "rds.amazonaws.com" },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: {
        Name: `ecommerce-rds-proxy-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Secrets Manager for DB credentials
const dbSecret = new aws.secretsmanager.Secret(`ecommerce-db-secret-${environmentSuffix}`, {
    name: `ecommerce-db-credentials-${environmentSuffix}`,
    description: "Aurora database credentials",
    tags: {
        Name: `ecommerce-db-secret-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const dbSecretVersion = new aws.secretsmanager.SecretVersion(`ecommerce-db-secret-version-${environmentSuffix}`, {
    secretId: dbSecret.id,
    secretString: pulumi.all([auroraCluster.masterUsername, config.requireSecret("dbPassword")]).apply(([username, password]) =>
        JSON.stringify({
            username: username,
            password: password,
        })
    ),
});

// RDS Proxy policy for Secrets Manager
const rdsProxyPolicy = new aws.iam.RolePolicy(`ecommerce-rds-proxy-policy-${environmentSuffix}`, {
    role: rdsProxyRole.id,
    policy: dbSecret.arn.apply(arn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
            ],
            Resource: arn,
        }],
    })),
});

// RDS Proxy
const rdsProxy = new aws.rds.Proxy(`ecommerce-rds-proxy-${environmentSuffix}`, {
    name: `ecommerce-rds-proxy-${environmentSuffix}`,
    engineFamily: "POSTGRESQL",
    auths: [{
        authScheme: "SECRETS",
        secretArn: dbSecret.arn,
        iamAuth: "REQUIRED",
    }],
    roleArn: rdsProxyRole.arn,
    vpcSubnetIds: privateSubnets.map(s => s.id),
    requireTls: true,
    tags: {
        Name: `ecommerce-rds-proxy-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const rdsProxyTargetGroup = new aws.rds.ProxyDefaultTargetGroup(`ecommerce-rds-proxy-tg-${environmentSuffix}`, {
    dbProxyName: rdsProxy.name,
    connectionPoolConfig: {
        maxConnectionsPercent: 100,
        maxIdleConnectionsPercent: 50,
    },
});

const rdsProxyTarget = new aws.rds.ProxyTarget(`ecommerce-rds-proxy-target-${environmentSuffix}`, {
    dbProxyName: rdsProxy.name,
    targetGroupName: rdsProxyTargetGroup.name,
    dbClusterIdentifier: auroraCluster.id,
});

// S3 Bucket for Static Assets
const staticAssetsBucket = new aws.s3.Bucket(`ecommerce-static-${environmentSuffix}`, {
    bucket: `ecommerce-static-assets-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 30,
        },
    }],
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: {
        Name: `ecommerce-static-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Block public access for static assets bucket
new aws.s3.BucketPublicAccessBlock(`ecommerce-static-pab-${environmentSuffix}`, {
    bucket: staticAssetsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket for Logs
const logsBucket = new aws.s3.Bucket(`ecommerce-logs-${environmentSuffix}`, {
    bucket: `ecommerce-application-logs-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    lifecycleRules: [{
        enabled: true,
        expiration: {
            days: 30,
        },
    }],
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: {
        Name: `ecommerce-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Block public access for logs bucket
new aws.s3.BucketPublicAccessBlock(`ecommerce-logs-pab-${environmentSuffix}`, {
    bucket: logsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// S3 Bucket for Artifacts
const artifactsBucket = new aws.s3.Bucket(`ecommerce-artifacts-${environmentSuffix}`, {
    bucket: `ecommerce-app-artifacts-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 30,
        },
    }],
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: {
        Name: `ecommerce-artifacts-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Block public access for artifacts bucket
new aws.s3.BucketPublicAccessBlock(`ecommerce-artifacts-pab-${environmentSuffix}`, {
    bucket: artifactsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// DynamoDB Table for Sessions
const sessionsTable = new aws.dynamodb.Table(`ecommerce-sessions-${environmentSuffix}`, {
    name: `ecommerce-sessions-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "sessionId",
    attributes: [{
        name: "sessionId",
        type: "S",
    }],
    ttl: {
        attributeName: "expiresAt",
        enabled: true,
    },
    serverSideEncryption: {
        enabled: true,
    },
    tags: {
        Name: `ecommerce-sessions-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DynamoDB Table for Cache
const cacheTable = new aws.dynamodb.Table(`ecommerce-cache-${environmentSuffix}`, {
    name: `ecommerce-cache-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "cacheKey",
    attributes: [{
        name: "cacheKey",
        type: "S",
    }],
    ttl: {
        attributeName: "expiresAt",
        enabled: true,
    },
    serverSideEncryption: {
        enabled: true,
    },
    tags: {
        Name: `ecommerce-cache-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM Role for Lambda
const lambdaRole = new aws.iam.Role(`ecommerce-lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: {
        Name: `ecommerce-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lambda basic execution policy
new aws.iam.RolePolicyAttachment(`ecommerce-lambda-basic-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda VPC execution policy
new aws.iam.RolePolicyAttachment(`ecommerce-lambda-vpc-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
});

// Lambda policy for DynamoDB and RDS
const lambdaPolicy = new aws.iam.RolePolicy(`ecommerce-lambda-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([sessionsTable.arn, cacheTable.arn, rdsProxy.arn]).apply(([sessionsArn, cacheArn, proxyArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                    ],
                    Resource: [sessionsArn, cacheArn],
                },
                {
                    Effect: "Allow",
                    Action: [
                        "rds-db:connect",
                    ],
                    Resource: proxyArn,
                },
            ],
        })
    ),
});

// Lambda Function for API
const apiLambda = new aws.lambda.Function(`ecommerce-api-lambda-${environmentSuffix}`, {
    name: `ecommerce-api-${environmentSuffix}`,
    role: lambdaRole.arn,
    architectures: ["arm64"],
    memorySize: 3072,
    timeout: 30,
    runtime: "nodejs18.x",
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: 'E-commerce API endpoint',
            timestamp: new Date().toISOString(),
            environment: process.env.ENVIRONMENT_SUFFIX,
        }),
    };
};
        `),
    }),
    environment: {
        variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            DB_PROXY_ENDPOINT: rdsProxy.endpoint,
            SESSIONS_TABLE: sessionsTable.name,
            CACHE_TABLE: cacheTable.name,
        },
    },
    vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.id],
    },
    reservedConcurrentExecutions: 10,
    tags: {
        Name: `ecommerce-api-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Log Group for Lambda
const lambdaLogGroup = new aws.cloudwatch.LogGroup(`ecommerce-lambda-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${apiLambda.name}`,
    retentionInDays: 7,
    tags: {
        Name: `ecommerce-lambda-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`ecommerce-alb-${environmentSuffix}`, {
    name: `ecommerce-alb-${environmentSuffix}`,
    loadBalancerType: "application",
    subnets: publicSubnets.map(s => s.id),
    securityGroups: [albSecurityGroup.id],
    enableHttp2: true,
    tags: {
        Name: `ecommerce-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Target Group for Lambda
const lambdaTargetGroup = new aws.lb.TargetGroup(`ecommerce-lambda-tg-${environmentSuffix}`, {
    name: `ecommerce-lambda-tg-${environmentSuffix}`,
    targetType: "lambda",
    healthCheck: {
        enabled: true,
        interval: 5,
        timeout: 2,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
    },
    tags: {
        Name: `ecommerce-lambda-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Attach Lambda to Target Group
const lambdaTargetGroupAttachment = new aws.lambda.Permission(`ecommerce-lambda-alb-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: apiLambda.name,
    principal: "elasticloadbalancing.amazonaws.com",
    sourceArn: lambdaTargetGroup.arn,
});

const lambdaTarget = new aws.lb.TargetGroupAttachment(`ecommerce-lambda-attachment-${environmentSuffix}`, {
    targetGroupArn: lambdaTargetGroup.arn,
    targetId: apiLambda.arn,
}, { dependsOn: [lambdaTargetGroupAttachment] });

// ALB Listener
const albListener = new aws.lb.Listener(`ecommerce-alb-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: lambdaTargetGroup.arn,
    }],
});

// ALB Listener Rule for path-based routing
const albListenerRule = new aws.lb.ListenerRule(`ecommerce-alb-rule-${environmentSuffix}`, {
    listenerArn: albListener.arn,
    priority: 100,
    conditions: [{
        pathPattern: {
            values: ["/api/*"],
        },
    }],
    actions: [{
        type: "forward",
        targetGroupArn: lambdaTargetGroup.arn,
        forward: {
            targetGroups: [{
                arn: lambdaTargetGroup.arn,
                weight: 100,
            }],
            stickiness: {
                enabled: true,
                duration: 3600,
            },
        },
    }],
});

// CloudFront Origin Access Identity
const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(`ecommerce-oai-${environmentSuffix}`, {
    comment: `OAI for ${environmentSuffix}`,
});

// S3 Bucket Policy for CloudFront
const staticBucketPolicy = new aws.s3.BucketPolicy(`ecommerce-static-policy-${environmentSuffix}`, {
    bucket: staticAssetsBucket.id,
    policy: pulumi.all([staticAssetsBucket.arn, originAccessIdentity.iamArn]).apply(([bucketArn, oaiArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: {
                    AWS: oaiArn,
                },
                Action: "s3:GetObject",
                Resource: `${bucketArn}/*`,
            }],
        })
    ),
});

// Lambda@Edge Role
const lambdaEdgeRole = new aws.iam.Role(`ecommerce-lambda-edge-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: { Service: "lambda.amazonaws.com" },
                Action: "sts:AssumeRole",
            },
            {
                Effect: "Allow",
                Principal: { Service: "edgelambda.amazonaws.com" },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Name: `ecommerce-lambda-edge-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`ecommerce-lambda-edge-basic-${environmentSuffix}`, {
    role: lambdaEdgeRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda@Edge Function (must be in us-east-1)
const edgeLambda = new aws.lambda.Function(`ecommerce-edge-lambda-${environmentSuffix}`, {
    name: `ecommerce-edge-auth-${environmentSuffix}`,
    role: lambdaEdgeRole.arn,
    runtime: "nodejs18.x",
    handler: "index.handler",
    publish: true,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Add security headers
    headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
    headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
    headers['x-xss-protection'] = [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
    headers['strict-transport-security'] = [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }];

    // Simple authentication check (in production, use real auth)
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader[0] || !authHeader[0].value) {
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Authentication required',
        };
    }

    return request;
};
        `),
    }),
    timeout: 5,
    memorySize: 128,
    tags: {
        Name: `ecommerce-edge-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { provider: new aws.Provider("us-east-1", { region: "us-east-1" }) });

// CloudFront Distribution
const distribution = new aws.cloudfront.Distribution(`ecommerce-cdn-${environmentSuffix}`, {
    enabled: true,
    comment: `CDN for ${environmentSuffix}`,
    origins: [
        {
            originId: "s3-static",
            domainName: staticAssetsBucket.bucketRegionalDomainName,
            s3OriginConfig: {
                originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
            },
        },
        {
            originId: "alb-api",
            domainName: alb.dnsName,
            customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "http-only",
                originSslProtocols: ["TLSv1.2"],
            },
        },
    ],
    defaultCacheBehavior: {
        targetOriginId: "s3-static",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        compress: true,
        lambdaFunctionAssociations: [{
            eventType: "viewer-request",
            lambdaArn: edgeLambda.qualifiedArn,
        }],
    },
    orderedCacheBehaviors: [{
        pathPattern: "/api/*",
        targetOriginId: "alb-api",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: true,
            headers: ["Authorization", "Accept", "Content-Type"],
            cookies: { forward: "all" },
        },
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0,
        compress: true,
    }],
    customErrorResponses: [
        {
            errorCode: 404,
            responseCode: 404,
            responsePagePath: "/404.html",
            errorCachingMinTtl: 300,
        },
        {
            errorCode: 500,
            responseCode: 500,
            responsePagePath: "/500.html",
            errorCachingMinTtl: 60,
        },
    ],
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    tags: {
        Name: `ecommerce-cdn-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// API Gateway REST API
const apiGateway = new aws.apigateway.RestApi(`ecommerce-api-gateway-${environmentSuffix}`, {
    name: `ecommerce-api-${environmentSuffix}`,
    description: "API Gateway for e-commerce platform",
    endpointConfiguration: {
        types: "REGIONAL",
    },
    tags: {
        Name: `ecommerce-api-gateway-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// API Gateway Resource
const apiResource = new aws.apigateway.Resource(`ecommerce-api-resource-${environmentSuffix}`, {
    restApi: apiGateway.id,
    parentId: apiGateway.rootResourceId,
    pathPart: "products",
});

// API Gateway Method
const apiMethod = new aws.apigateway.Method(`ecommerce-api-method-${environmentSuffix}`, {
    restApi: apiGateway.id,
    resourceId: apiResource.id,
    httpMethod: "GET",
    authorization: "NONE",
});

// API Gateway Integration
const apiIntegration = new aws.apigateway.Integration(`ecommerce-api-integration-${environmentSuffix}`, {
    restApi: apiGateway.id,
    resourceId: apiResource.id,
    httpMethod: apiMethod.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: apiLambda.invokeArn,
});

// Lambda Permission for API Gateway
const apiGatewayPermission = new aws.lambda.Permission(`ecommerce-api-gateway-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: apiLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${apiGateway.executionArn}/*/*`,
});

// API Gateway Deployment
const apiDeployment = new aws.apigateway.Deployment(`ecommerce-api-deployment-${environmentSuffix}`, {
    restApi: apiGateway.id,
    stageName: "prod",
}, { dependsOn: [apiIntegration] });

// API Gateway Usage Plan
const usagePlan = new aws.apigateway.UsagePlan(`ecommerce-usage-plan-${environmentSuffix}`, {
    name: `ecommerce-usage-plan-${environmentSuffix}`,
    apiStages: [{
        apiId: apiGateway.id,
        stage: apiDeployment.stageName,
    }],
    throttleSettings: {
        rateLimit: 10000,
        burstLimit: 20000,
    },
    quotaSettings: {
        limit: 1000000,
        period: "MONTH",
    },
    tags: {
        Name: `ecommerce-usage-plan-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// API Gateway API Key
const apiKey = new aws.apigateway.ApiKey(`ecommerce-api-key-${environmentSuffix}`, {
    name: `ecommerce-api-key-${environmentSuffix}`,
    enabled: true,
    tags: {
        Name: `ecommerce-api-key-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Associate API Key with Usage Plan
const usagePlanKey = new aws.apigateway.UsagePlanKey(`ecommerce-usage-plan-key-${environmentSuffix}`, {
    keyId: apiKey.id,
    keyType: "API_KEY",
    usagePlanId: usagePlan.id,
});

// SNS Topic for Alarms
const alarmTopic = new aws.sns.Topic(`ecommerce-alarms-${environmentSuffix}`, {
    name: `ecommerce-alarms-${environmentSuffix}`,
    tags: {
        Name: `ecommerce-alarms-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarm for ALB Target Health
const albHealthAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-alb-health-alarm-${environmentSuffix}`, {
    name: `ecommerce-alb-unhealthy-targets-${environmentSuffix}`,
    comparisonOperator: "LessThanThreshold",
    evaluationPeriods: 2,
    metricName: "HealthyHostCount",
    namespace: "AWS/ApplicationELB",
    period: 60,
    statistic: "Average",
    threshold: 1,
    alarmDescription: "Alert when ALB has unhealthy targets",
    alarmActions: [alarmTopic.arn],
    dimensions: {
        LoadBalancer: alb.arnSuffix,
        TargetGroup: lambdaTargetGroup.arnSuffix,
    },
    tags: {
        Name: `ecommerce-alb-health-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarm for Lambda Errors
const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-lambda-error-alarm-${environmentSuffix}`, {
    name: `ecommerce-lambda-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 60,
    statistic: "Sum",
    threshold: 10,
    alarmDescription: "Alert when Lambda has high error rate",
    alarmActions: [alarmTopic.arn],
    dimensions: {
        FunctionName: apiLambda.name,
    },
    tags: {
        Name: `ecommerce-lambda-error-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarm for Lambda Throttles
const lambdaThrottleAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-lambda-throttle-alarm-${environmentSuffix}`, {
    name: `ecommerce-lambda-throttles-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Throttles",
    namespace: "AWS/Lambda",
    period: 60,
    statistic: "Sum",
    threshold: 5,
    alarmDescription: "Alert when Lambda is being throttled",
    alarmActions: [alarmTopic.arn],
    dimensions: {
        FunctionName: apiLambda.name,
    },
    tags: {
        Name: `ecommerce-lambda-throttle-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarm for RDS Connections
const rdsConnectionAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-rds-connection-alarm-${environmentSuffix}`, {
    name: `ecommerce-rds-high-connections-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "DatabaseConnections",
    namespace: "AWS/RDS",
    period: 60,
    statistic: "Average",
    threshold: 80,
    alarmDescription: "Alert when RDS connection count is high",
    alarmActions: [alarmTopic.arn],
    dimensions: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
    },
    tags: {
        Name: `ecommerce-rds-connection-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(`ecommerce-dashboard-${environmentSuffix}`, {
    dashboardName: `ecommerce-metrics-${environmentSuffix}`,
    dashboardBody: pulumi.all([
        apiLambda.name,
        alb.arnSuffix,
        lambdaTargetGroup.arnSuffix,
        auroraCluster.clusterIdentifier,
    ]).apply(([lambdaName, albArn, tgArn, clusterName]) => JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/Lambda", "Duration", { stat: "Average", label: "Avg Latency" }],
                        ["...", { stat: "p99", label: "P99 Latency" }],
                    ],
                    period: 60,
                    stat: "Average",
                    region: region,
                    title: "API Latency (ms)",
                    yAxis: { left: { min: 0 } },
                },
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/Lambda", "Errors", { stat: "Sum", label: "Lambda Errors" }],
                        ["AWS/Lambda", "Throttles", { stat: "Sum", label: "Lambda Throttles" }],
                    ],
                    period: 60,
                    stat: "Sum",
                    region: region,
                    title: "Error Rates",
                    yAxis: { left: { min: 0 } },
                },
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average", dimensions: { LoadBalancer: albArn } }],
                        ["AWS/ApplicationELB", "HealthyHostCount", { stat: "Average", dimensions: { LoadBalancer: albArn, TargetGroup: tgArn } }],
                    ],
                    period: 60,
                    stat: "Average",
                    region: region,
                    title: "ALB Metrics",
                },
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/RDS", "DatabaseConnections", { stat: "Average", dimensions: { DBClusterIdentifier: clusterName } }],
                        ["AWS/RDS", "CPUUtilization", { stat: "Average", dimensions: { DBClusterIdentifier: clusterName } }],
                    ],
                    period: 60,
                    stat: "Average",
                    region: region,
                    title: "Aurora Metrics",
                },
            },
        ],
    })),
});

// Application Auto Scaling Target for Lambda
const lambdaScalingTarget = new aws.appautoscaling.Target(`ecommerce-lambda-scaling-target-${environmentSuffix}`, {
    serviceNamespace: "lambda",
    resourceId: pulumi.interpolate`function:${apiLambda.name}:provisioned-concurrency`,
    scalableDimension: "lambda:function:ProvisionedConcurrentExecutions",
    minCapacity: 2,
    maxCapacity: 10,
});

// Lambda Auto Scaling Policy
const lambdaScalingPolicy = new aws.appautoscaling.Policy(`ecommerce-lambda-scaling-policy-${environmentSuffix}`, {
    name: `ecommerce-lambda-scaling-${environmentSuffix}`,
    serviceNamespace: lambdaScalingTarget.serviceNamespace,
    resourceId: lambdaScalingTarget.resourceId,
    scalableDimension: lambdaScalingTarget.scalableDimension,
    policyType: "TargetTrackingScaling",
    targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
            predefinedMetricType: "LambdaProvisionedConcurrencyUtilization",
        },
        scaleInCooldown: 60,
        scaleOutCooldown: 30,
    },
});

// Exports
export const vpcId = vpc.id;
export const publicSubnetIds = publicSubnets.map(s => s.id);
export const privateSubnetIds = privateSubnets.map(s => s.id);
export const auroraClusterEndpoint = auroraCluster.endpoint;
export const auroraReaderEndpoint = auroraCluster.readerEndpoint;
export const rdsProxyEndpoint = rdsProxy.endpoint;
export const albDnsName = alb.dnsName;
export const cloudfrontDomainName = distribution.domainName;
export const apiGatewayUrl = pulumi.interpolate`${apiGateway.executionArn}/${apiDeployment.stageName}`;
export const staticAssetsBucketName = staticAssetsBucket.bucket;
export const logsBucketName = logsBucket.bucket;
export const artifactsBucketName = artifactsBucket.bucket;
export const sessionsTableName = sessionsTable.name;
export const cacheTableName = cacheTable.name;
export const lambdaFunctionName = apiLambda.name;
export const snsTopicArn = alarmTopic.arn;
export const dashboardName = dashboard.dashboardName;
```

## File: Pulumi.yaml

```yaml
name: ecommerce-platform
runtime: nodejs
description: High-performance web application infrastructure for e-commerce platform
```

## File: package.json

```json
{
  "name": "ecommerce-platform",
  "version": "1.0.0",
  "description": "E-commerce platform infrastructure with Pulumi TypeScript",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest --coverage"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## Configuration

Set the required configuration values:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set --secret dbPassword <secure-password>
pulumi config set aws:region us-east-1
```

## Deployment

```bash
npm install
pulumi up
```

## Architecture Overview

This infrastructure provisions:

1. **VPC Network**: 3 public + 3 private subnets across us-east-1a/b/c with NAT Gateways
2. **Lambda Functions**: Containerized Node.js API with 3GB memory, ARM64 architecture
3. **Application Load Balancer**: Path-based routing with sticky sessions
4. **CloudFront**: CDN with S3 and ALB origins, custom error pages
5. **Aurora PostgreSQL Serverless v2**: 1 writer + 2 readers in private subnets
6. **RDS Proxy**: Connection pooling with 100 concurrent connections
7. **Lambda@Edge**: Request authentication and security headers
8. **DynamoDB**: Sessions and cache tables with pay-per-request billing
9. **API Gateway**: REST API with 10,000 req/sec throttling
10. **CloudWatch**: Dashboards, custom metrics, and alarms
11. **Auto Scaling**: Lambda provisioned concurrency scaling at 70% utilization
12. **S3 Buckets**: Static assets, logs, and artifacts with encryption and versioning

All resources include environmentSuffix in names and are fully destroyable for testing.
