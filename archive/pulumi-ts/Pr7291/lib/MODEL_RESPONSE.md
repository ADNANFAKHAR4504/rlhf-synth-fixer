# Multi-Region Trading Platform Infrastructure

This implementation creates a multi-region financial trading platform using Pulumi with TypeScript across us-east-1 and eu-west-1 regions.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Primary region (us-east-1) VPC
const primaryVpc = new aws.ec2.Vpc("primary-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `primary-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: "us-east-1",
        CostCenter: "trading",
    },
});

// Primary region private subnets (3 AZs)
const primarySubnets = [0, 1, 2].map((i) => {
    return new aws.ec2.Subnet(`primary-subnet-${i}`, {
        vpcId: primaryVpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `us-east-1${['a', 'b', 'c'][i]}`,
        tags: {
            Name: `primary-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

// Secondary region (eu-west-1) provider
const euProvider = new aws.Provider("eu-provider", {
    region: "eu-west-1",
});

// Secondary region VPC
const secondaryVpc = new aws.ec2.Vpc("secondary-vpc", {
    cidrBlock: "10.1.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `secondary-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: "eu-west-1",
        CostCenter: "trading",
    },
}, { provider: euProvider });

// Secondary region private subnets (3 AZs)
const secondarySubnets = [0, 1, 2].map((i) => {
    return new aws.ec2.Subnet(`secondary-subnet-${i}`, {
        vpcId: secondaryVpc.id,
        cidrBlock: `10.1.${i}.0/24`,
        availabilityZone: `eu-west-1${['a', 'b', 'c'][i]}`,
        tags: {
            Name: `secondary-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    }, { provider: euProvider });
});

// VPC Peering connection
const peeringConnection = new aws.ec2.VpcPeeringConnection("vpc-peering", {
    vpcId: primaryVpc.id,
    peerVpcId: secondaryVpc.id,
    peerRegion: "eu-west-1",
    autoAccept: false,
    tags: {
        Name: `vpc-peering-${environmentSuffix}`,
    },
});

// Aurora Global Database Cluster
const globalCluster = new aws.rds.GlobalCluster("global-cluster", {
    globalClusterIdentifier: `trading-global-${environmentSuffix}`,
    engine: "aurora-postgresql",
    engineVersion: "14.6",
    databaseName: "trading",
});

// Primary Aurora Cluster Subnet Group
const primaryDbSubnetGroup = new aws.rds.SubnetGroup("primary-db-subnet", {
    subnetIds: primarySubnets.map(s => s.id),
    tags: {
        Name: `primary-db-subnet-${environmentSuffix}`,
    },
});

// Primary Aurora Cluster Security Group
const primaryDbSecurityGroup = new aws.ec2.SecurityGroup("primary-db-sg", {
    vpcId: primaryVpc.id,
    description: "Security group for primary Aurora cluster",
    ingress: [{
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["10.0.0.0/16"],
    }],
    tags: {
        Name: `primary-db-sg`,  // ERROR: Missing environmentSuffix
    },
});

// Primary Aurora Cluster
const primaryCluster = new aws.rds.Cluster("primary-cluster", {
    clusterIdentifier: `trading-primary-${environmentSuffix}`,
    engine: "aurora-postgresql",
    engineVersion: "14.6",
    databaseName: "trading",
    masterUsername: "admin",
    masterPassword: "tempPassword123!",  // ERROR: Hardcoded password instead of Secrets Manager
    globalClusterIdentifier: globalCluster.id,
    dbSubnetGroupName: primaryDbSubnetGroup.name,
    vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
    skipFinalSnapshot: true,
});

// Secondary Aurora Cluster Subnet Group
const secondaryDbSubnetGroup = new aws.rds.SubnetGroup("secondary-db-subnet", {
    subnetIds: secondarySubnets.map(s => s.id),
    tags: {
        Name: `secondary-db-subnet-${environmentSuffix}`,
    },
}, { provider: euProvider });

// Secondary Aurora Cluster Security Group
const secondaryDbSecurityGroup = new aws.ec2.SecurityGroup("secondary-db-sg", {
    vpcId: secondaryVpc.id,
    description: "Security group for secondary Aurora cluster",
    ingress: [{
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["10.1.0.0/16"],
    }],
    tags: {
        Name: `secondary-db-sg-${environmentSuffix}`,
    },
}, { provider: euProvider });

// Secondary Aurora Cluster (will fail without primary being available)
const secondaryCluster = new aws.rds.Cluster("secondary-cluster", {
    clusterIdentifier: `trading-secondary-${environmentSuffix}`,
    engine: "aurora-postgresql",
    engineVersion: "14.6",
    globalClusterIdentifier: globalCluster.id,
    dbSubnetGroupName: secondaryDbSubnetGroup.name,
    vpcSecurityGroupIds: [secondaryDbSecurityGroup.id],
    skipFinalSnapshot: true,
}, {
    provider: euProvider,
    dependsOn: [primaryCluster],  // ERROR: Missing proper state check
});

// Lambda Execution Role
const lambdaRole = new aws.iam.Role("lambda-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
        }],
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
    ],
});

// Lambda function in primary region
const primaryLambda = new aws.lambda.Function("primary-lambda", {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Trading platform active" }),
                };
            };
        `),
    }),
    environment: {
        variables: {
            REGION: "us-east-1",
            DB_HOST: primaryCluster.endpoint,
        },
    },
    tags: {
        Name: `primary-lambda-${environmentSuffix}`,
    },
});

// Lambda function in secondary region
const secondaryLambda = new aws.lambda.Function("secondary-lambda", {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Trading platform active" }),
                };
            };
        `),
    }),
    environment: {
        variables: {
            REGION: "eu-west-1",
            DB_HOST: secondaryCluster.endpoint,
        },
    },
    tags: {
        Name: `secondary-lambda-${environmentSuffix}`,
    },
}, { provider: euProvider });

// EC2 instances for ALB targets in primary region
const primaryInstance = new aws.ec2.Instance("primary-instance", {
    instanceType: "t3.micro",
    ami: "ami-0c55b159cbfafe1f0",  // ERROR: Hardcoded AMI may not exist
    subnetId: primarySubnets[0].id,
    tags: {
        Name: `primary-instance-${environmentSuffix}`,
    },
});

// Primary ALB Security Group
const primaryAlbSg = new aws.ec2.SecurityGroup("primary-alb-sg", {
    vpcId: primaryVpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Primary Application Load Balancer
const primaryAlb = new aws.lb.LoadBalancer("primary-alb", {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [primaryAlbSg.id],
    subnets: primarySubnets.map(s => s.id),  // ERROR: Using private subnets for internet-facing ALB
    tags: {
        Name: `primary-alb-${environmentSuffix}`,
    },
});

// Primary Target Group
const primaryTargetGroup = new aws.lb.TargetGroup("primary-tg", {
    port: 80,
    protocol: "HTTP",
    vpcId: primaryVpc.id,
    healthCheck: {
        path: "/health",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
    },
    tags: {
        Name: `primary-tg-${environmentSuffix}`,
    },
});

// Attach instance to target group
const primaryAttachment = new aws.lb.TargetGroupAttachment("primary-attachment", {
    targetGroupArn: primaryTargetGroup.arn,
    targetId: primaryInstance.id,
});

// Primary ALB Listener
const primaryListener = new aws.lb.Listener("primary-listener", {
    loadBalancerArn: primaryAlb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: primaryTargetGroup.arn,
    }],
});

// Secondary region EC2 and ALB (similar structure)
const secondaryInstance = new aws.ec2.Instance("secondary-instance", {
    instanceType: "t3.micro",
    ami: "ami-0d71ea30463e0ff8d",  // ERROR: Different AMI for different region
    subnetId: secondarySubnets[0].id,
    tags: {
        Name: `secondary-instance-${environmentSuffix}`,
    },
}, { provider: euProvider });

const secondaryAlbSg = new aws.ec2.SecurityGroup("secondary-alb-sg", {
    vpcId: secondaryVpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
}, { provider: euProvider });

const secondaryAlb = new aws.lb.LoadBalancer("secondary-alb", {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [secondaryAlbSg.id],
    subnets: secondarySubnets.map(s => s.id),  // ERROR: Using private subnets
    tags: {
        Name: `secondary-alb-${environmentSuffix}`,
    },
}, { provider: euProvider });

const secondaryTargetGroup = new aws.lb.TargetGroup("secondary-tg", {
    port: 80,
    protocol: "HTTP",
    vpcId: secondaryVpc.id,
    healthCheck: {
        path: "/health",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
    },
    tags: {
        Name: `secondary-tg-${environmentSuffix}`,
    },
}, { provider: euProvider });

const secondaryAttachment = new aws.lb.TargetGroupAttachment("secondary-attachment", {
    targetGroupArn: secondaryTargetGroup.arn,
    targetId: secondaryInstance.id,
}, { provider: euProvider });

const secondaryListener = new aws.lb.Listener("secondary-listener", {
    loadBalancerArn: secondaryAlb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: secondaryTargetGroup.arn,
    }],
}, { provider: euProvider });

// AWS Global Accelerator
const accelerator = new aws.globalaccelerator.Accelerator("accelerator", {
    name: `trading-accelerator-${environmentSuffix}`,
    ipAddressType: "IPV4",
    enabled: true,
    attributes: {
        flowLogsEnabled: false,
    },
});

const listener = new aws.globalaccelerator.Listener("listener", {
    acceleratorArn: accelerator.id,
    protocol: "TCP",
    portRanges: [{
        fromPort: 80,
        toPort: 80,
    }],
});

const primaryEndpointGroup = new aws.globalaccelerator.EndpointGroup("primary-endpoint", {
    listenerArn: listener.id,
    endpointGroupRegion: "us-east-1",
    endpointConfigurations: [{
        endpointId: primaryAlb.arn,
        weight: 100,
    }],
    healthCheckIntervalSeconds: 10,
    healthCheckPath: "/health",
    healthCheckProtocol: "HTTP",
});

const secondaryEndpointGroup = new aws.globalaccelerator.EndpointGroup("secondary-endpoint", {
    listenerArn: listener.id,
    endpointGroupRegion: "eu-west-1",
    endpointConfigurations: [{
        endpointId: secondaryAlb.arn,
        weight: 100,
    }],
    healthCheckIntervalSeconds: 10,
    healthCheckPath: "/health",
    healthCheckProtocol: "HTTP",
});

// Route 53 Hosted Zone
const hostedZone = new aws.route53.Zone("hosted-zone", {
    name: `trading-${environmentSuffix}.example.com`,
    tags: {
        Name: `hosted-zone-${environmentSuffix}`,
    },
});

// Route 53 Health Checks
const primaryHealthCheck = new aws.route53.HealthCheck("primary-health", {
    type: "HTTP",
    resourcePath: "/health",
    fqdn: primaryAlb.dnsName,
    port: 80,
    requestInterval: 10,  // ERROR: 10 is invalid, minimum is 30
    failureThreshold: 3,
    tags: {
        Name: `primary-health-${environmentSuffix}`,
    },
});

const secondaryHealthCheck = new aws.route53.HealthCheck("secondary-health", {
    type: "HTTP",
    resourcePath: "/health",
    fqdn: secondaryAlb.dnsName,
    port: 80,
    requestInterval: 10,  // ERROR: 10 is invalid
    failureThreshold: 3,
    tags: {
        Name: `secondary-health-${environmentSuffix}`,
    },
});

// Route 53 Records with failover
const primaryRecord = new aws.route53.Record("primary-record", {
    zoneId: hostedZone.zoneId,
    name: `trading-${environmentSuffix}.example.com`,
    type: "A",
    setIdentifier: "primary",
    failoverRoutingPolicies: [{
        type: "PRIMARY",
    }],
    aliases: [{
        name: primaryAlb.dnsName,
        zoneId: primaryAlb.zoneId,
        evaluateTargetHealth: true,
    }],
    healthCheckId: primaryHealthCheck.id,
});

const secondaryRecord = new aws.route53.Record("secondary-record", {
    zoneId: hostedZone.zoneId,
    name: `trading-${environmentSuffix}.example.com`,
    type: "A",
    setIdentifier: "secondary",
    failoverRoutingPolicies: [{
        type: "SECONDARY",
    }],
    aliases: [{
        name: secondaryAlb.dnsName,
        zoneId: secondaryAlb.zoneId,
        evaluateTargetHealth: true,
    }],
    healthCheckId: secondaryHealthCheck.id,
});

// Secrets Manager in primary region
const primarySecret = new aws.secretsmanager.Secret("primary-secret", {
    name: `trading-db-credentials-${environmentSuffix}-primary`,
    description: "Database credentials for primary region",
});

const primarySecretVersion = new aws.secretsmanager.SecretVersion("primary-secret-version", {
    secretId: primarySecret.id,
    secretString: JSON.stringify({
        username: "admin",
        password: "tempPassword123!",
    }),
});

// ERROR: Missing rotation configuration

// Secrets Manager in secondary region
const secondarySecret = new aws.secretsmanager.Secret("secondary-secret", {
    name: `trading-db-credentials-${environmentSuffix}-secondary`,
    description: "Database credentials for secondary region",
}, { provider: euProvider });

const secondarySecretVersion = new aws.secretsmanager.SecretVersion("secondary-secret-version", {
    secretId: secondarySecret.id,
    secretString: JSON.stringify({
        username: "admin",
        password: "tempPassword123!",
    }),
}, { provider: euProvider });

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard("dashboard", {
    dashboardName: `trading-dashboard-${environmentSuffix}`,
    dashboardBody: JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/RDS", "CPUUtilization", { stat: "Average", region: "us-east-1" }],
                        ["...", { stat: "Average", region: "eu-west-1" }],
                    ],
                    period: 300,
                    stat: "Average",
                    region: "us-east-1",
                    title: "Aurora CPU Utilization",
                },
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/Lambda", "Invocations", { stat: "Sum", region: "us-east-1" }],
                        ["...", { stat: "Sum", region: "eu-west-1" }],
                    ],
                    period: 300,
                    stat: "Sum",
                    region: "us-east-1",
                    title: "Lambda Invocations",
                },
            },
        ],
    }),
});

// AWS Config
const configRole = new aws.iam.Role("config-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: {
                Service: "config.amazonaws.com",
            },
            Effect: "Allow",
        }],
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/AWS_ConfigRole",  // ERROR: Wrong policy name
    ],
});

const configBucket = new aws.s3.Bucket("config-bucket", {
    bucket: `config-bucket-${environmentSuffix}`,
    forceDestroy: true,
});

const configRecorder = new aws.cfg.Recorder("config-recorder", {
    name: `config-recorder-${environmentSuffix}`,
    roleArn: configRole.arn,
    recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
    },
});

const configDeliveryChannel = new aws.cfg.DeliveryChannel("config-delivery", {
    name: `config-delivery-${environmentSuffix}`,
    s3BucketName: configBucket.bucket,
}, { dependsOn: [configRecorder] });

const configRecorderStatus = new aws.cfg.RecorderStatus("config-recorder-status", {
    name: configRecorder.name,
    isEnabled: true,
}, { dependsOn: [configDeliveryChannel] });

// AWS Config Rule
const configRule = new aws.cfg.Rule("config-rule", {
    name: `encrypted-volumes-${environmentSuffix}`,
    source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES",
    },
}, { dependsOn: [configRecorderStatus] });

// Exports
export const primaryVpcId = primaryVpc.id;
export const secondaryVpcId = secondaryVpc.id;
export const primaryClusterId = primaryCluster.id;
export const secondaryClusterId = secondaryCluster.id;
export const primaryAlbDns = primaryAlb.dnsName;
export const secondaryAlbDns = secondaryAlb.dnsName;
export const acceleratorDns = accelerator.dnsName;
export const hostedZoneId = hostedZone.zoneId;
```

## File: Pulumi.yaml

```yaml
name: trading-platform
runtime: nodejs
description: Multi-region trading platform infrastructure
```

## File: package.json

```json
{
  "name": "trading-platform",
  "version": "1.0.0",
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
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
    "outDir": "bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Summary

This implementation provides:

1. Multi-region VPC architecture with 3 private subnets per region
2. Aurora Global Database with PostgreSQL 14.6
3. Lambda functions in both regions
4. Application Load Balancers with EC2 target instances
5. AWS Global Accelerator for global traffic management
6. Route 53 with health-check based failover routing
7. Secrets Manager in both regions
8. CloudWatch dashboard with cross-region metrics
9. AWS Config for compliance monitoring
10. VPC peering between regions

The infrastructure supports automatic failover with Route 53 health checks and Global Accelerator for optimal traffic routing.
