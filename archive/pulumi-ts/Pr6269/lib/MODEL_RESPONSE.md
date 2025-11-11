# Environment Migration Infrastructure - Initial Implementation

This document contains the initial code generated for the environment migration infrastructure. This implementation has several critical issues that need to be addressed.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get("env") || "dev";
const region = "us-east-1";

// VPC Configuration
const vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        Name: `igw-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// VPN Gateway - with type error
const vpnGateway = new aws.ec2.VpnGateway(`vpn-${environmentSuffix}`, {
    vpcId: vpc.id,
    amazonSideAsn: "64512",  // ERROR: Should be number, not string
    tags: {
        Name: `vpn-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Availability Zones
const availabilityZones = aws.getAvailabilityZonesOutput({
    state: "available",
});

// Public Subnets (3 AZs)
const publicSubnets = [0, 1, 2].map((i) => {
    return new aws.ec2.Subnet(`public-subnet-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: availabilityZones.names[i],
        mapPublicIpOnLaunch: true,
        tags: {
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

// Private Subnets (3 AZs)
const privateSubnets = [0, 1, 2].map((i) => {
    return new aws.ec2.Subnet(`private-subnet-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${10 + i}.0/24`,
        availabilityZone: availabilityZones.names[i],
        tags: {
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

// ISSUE: Creating 3 NAT Gateways (expensive, should be 1)
const eips = [0, 1, 2].map((i) => {
    return new aws.ec2.Eip(`nat-eip-${i}-${environmentSuffix}`, {
        vpc: true,
        tags: {
            Name: `nat-eip-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

const natGateways = [0, 1, 2].map((i) => {
    return new aws.ec2.NatGateway(`nat-gw-${i}-${environmentSuffix}`, {
        subnetId: publicSubnets[i].id,
        allocationId: eips[i].id,
        tags: {
            Name: `nat-gw-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

// Public Route Table
const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        },
    ],
    tags: {
        Name: `public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

publicSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`public-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    });
});

// Private Route Tables
const privateRouteTables = natGateways.map((natGateway, i) => {
    return new aws.ec2.RouteTable(`private-rt-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        routes: [
            {
                cidrBlock: "0.0.0.0/0",
                natGatewayId: natGateway.id,
            },
        ],
        tags: {
            Name: `private-rt-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
        },
    });
});

privateSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`private-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTables[i].id,
    });
});

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for Application Load Balancer",
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
        Name: `alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for ECS tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 8080,
            toPort: 8080,
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
        Name: `ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for RDS Aurora",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ecsSecurityGroup.id],
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
        Name: `rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// RDS Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environmentSuffix}`, {
    subnetIds: privateSubnets.map(subnet => subnet.id),
    tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// RDS Aurora PostgreSQL Cluster
const auroraCluster = new aws.rds.Cluster(`aurora-cluster-${environmentSuffix}`, {
    engine: "aurora-postgresql",
    engineMode: "provisioned",
    engineVersion: "15.3",
    databaseName: "migrationdb",
    masterUsername: "admin",
    masterPassword: config.requireSecret("dbPassword"),
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    skipFinalSnapshot: true,
    serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0,
    },
    tags: {
        Name: `aurora-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const auroraInstance = new aws.rds.ClusterInstance(`aurora-instance-${environmentSuffix}`, {
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: "aurora-postgresql",
    engineVersion: "15.3",
    tags: {
        Name: `aurora-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DMS Subnet Group
const dmsSubnetGroup = new aws.dms.ReplicationSubnetGroup(`dms-subnet-group-${environmentSuffix}`, {
    replicationSubnetGroupDescription: "DMS subnet group",
    replicationSubnetGroupId: `dms-subnet-group-${environmentSuffix}`,
    subnetIds: privateSubnets.map(subnet => subnet.id),
    tags: {
        Name: `dms-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DMS Replication Instance
const dmsReplicationInstance = new aws.dms.ReplicationInstance(`dms-instance-${environmentSuffix}`, {
    replicationInstanceId: `dms-instance-${environmentSuffix}`,
    replicationInstanceClass: "dms.t3.micro",
    allocatedStorage: 20,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    replicationSubnetGroupId: dmsSubnetGroup.id,
    publiclyAccessible: false,
    tags: {
        Name: `dms-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DMS Target Endpoint (Aurora)
const dmsTargetEndpoint = new aws.dms.Endpoint(`dms-target-${environmentSuffix}`, {
    endpointId: `dms-target-${environmentSuffix}`,
    endpointType: "target",
    engineName: "aurora-postgresql",
    serverName: auroraCluster.endpoint,
    port: 5432,
    databaseName: "migrationdb",
    username: "admin",
    password: config.requireSecret("dbPassword"),
    tags: {
        Name: `dms-target-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DMS Source Endpoint (On-premises)
const dmsSourceEndpoint = new aws.dms.Endpoint(`dms-source-${environmentSuffix}`, {
    endpointId: `dms-source-${environmentSuffix}`,
    endpointType: "source",
    engineName: "postgres",
    serverName: config.require("sourceDbHost"),
    port: 5432,
    databaseName: config.require("sourceDbName"),
    username: config.require("sourceDbUser"),
    password: config.requireSecret("sourceDbPassword"),
    tags: {
        Name: `dms-source-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// DMS Replication Task
const dmsReplicationTask = new aws.dms.ReplicationTask(`dms-task-${environmentSuffix}`, {
    replicationTaskId: `dms-task-${environmentSuffix}`,
    migrationType: "full-load-and-cdc",
    replicationInstanceArn: dmsReplicationInstance.replicationInstanceArn,
    sourceEndpointArn: dmsSourceEndpoint.endpointArn,
    targetEndpointArn: dmsTargetEndpoint.endpointArn,
    tableMappings: JSON.stringify({
        rules: [
            {
                "rule-type": "selection",
                "rule-id": "1",
                "rule-name": "1",
                "object-locator": {
                    "schema-name": "%",
                    "table-name": "%",
                },
                "rule-action": "include",
            },
        ],
    }),
    tags: {
        Name: `dms-task-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// MISSING: ECR Repository with vulnerability scanning

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`ecs-cluster-${environmentSuffix}`, {
    tags: {
        Name: `ecs-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`alb-${environmentSuffix}`, {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: publicSubnets.map(subnet => subnet.id),
    tags: {
        Name: `alb-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ISSUE: Only 1 target group (need 2 for blue-green)
const targetGroup = new aws.lb.TargetGroup(`tg-${environmentSuffix}`, {
    port: 8080,
    protocol: "HTTP",
    vpcId: vpc.id,
    targetType: "ip",
    healthCheck: {
        enabled: true,
        path: "/health",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
    },
    tags: {
        Name: `tg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const albListener = new aws.lb.Listener(`alb-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [
        {
            type: "forward",
            targetGroupArn: targetGroup.arn,
        },
    ],
});

// ECS Task Execution Role
const ecsTaskExecutionRole = new aws.iam.Role(`ecs-task-execution-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Name: `ecs-task-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`ecs-task-execution-policy-${environmentSuffix}`, {
    role: ecsTaskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// ECS Task Role
const ecsTaskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(`task-def-${environmentSuffix}`, {
    family: `app-${environmentSuffix}`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: JSON.stringify([
        {
            name: "app",
            image: "nginx:latest",  // ISSUE: Should use ECR image
            portMappings: [
                {
                    containerPort: 8080,
                    protocol: "tcp",
                },
            ],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": `/ecs/app-${environmentSuffix}`,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
        },
    ]),
    tags: {
        Name: `task-def-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Log Group for ECS
const ecsLogGroup = new aws.cloudwatch.LogGroup(`ecs-log-group-${environmentSuffix}`, {
    name: `/ecs/app-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `ecs-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ISSUE: ECS Service without CODE_DEPLOY deployment controller
const ecsService = new aws.ecs.Service(`ecs-service-${environmentSuffix}`, {
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: privateSubnets.map(subnet => subnet.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
    },
    loadBalancers: [
        {
            targetGroupArn: targetGroup.arn,
            containerName: "app",
            containerPort: 8080,
        },
    ],
    tags: {
        Name: `ecs-service-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [albListener] });

// MISSING: CodeDeploy Application and Deployment Group for blue-green

// DynamoDB Table
const dynamoTable = new aws.dynamodb.Table(`dynamo-table-${environmentSuffix}`, {
    attributes: [
        {
            name: "id",
            type: "S",
        },
    ],
    hashKey: "id",
    billingMode: "PAY_PER_REQUEST",
    tags: {
        Name: `dynamo-table-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// S3 Bucket
const s3Bucket = new aws.s3.Bucket(`app-bucket-${environmentSuffix}`, {
    forceDestroy: true,
    tags: {
        Name: `app-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lambda Execution Role
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: {
        Name: `lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`lambda-policy-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda for Migration Validation
const validationLambda = new aws.lambda.Function(`validation-lambda-${environmentSuffix}`, {
    runtime: "python3.11",
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.py": new pulumi.asset.StringAsset(`
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Validation check passed'
    }
`),
    }),
    timeout: 30,
    memorySize: 256,
    tags: {
        Name: `validation-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lambda for Health Check
const healthCheckLambda = new aws.lambda.Function(`health-lambda-${environmentSuffix}`, {
    runtime: "python3.11",
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.py": new pulumi.asset.StringAsset(`
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Health check passed'
    }
`),
    }),
    timeout: 30,
    memorySize: 256,
    tags: {
        Name: `health-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Log Groups for Lambda
const validationLambdaLogGroup = new aws.cloudwatch.LogGroup(`validation-lambda-log-${environmentSuffix}`, {
    name: `/aws/lambda/${validationLambda.name}`,
    retentionInDays: 7,
    tags: {
        Name: `validation-lambda-log-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const healthLambdaLogGroup = new aws.cloudwatch.LogGroup(`health-lambda-log-${environmentSuffix}`, {
    name: `/aws/lambda/${healthCheckLambda.name}`,
    retentionInDays: 7,
    tags: {
        Name: `health-lambda-log-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarms
const cpuAlarm = new aws.cloudwatch.MetricAlarm(`cpu-alarm-${environmentSuffix}`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/ECS",
    period: 300,
    statistic: "Average",
    threshold: 80,
    dimensions: {
        ClusterName: ecsCluster.name,
        ServiceName: ecsService.name,
    },
    alarmDescription: "CPU utilization too high",
    tags: {
        Name: `cpu-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// MISSING: Route53 Hosted Zone and Weighted Routing Policies

// Exports
export const vpcId = vpc.id;
export const albDnsName = alb.dnsName;
export const auroraEndpoint = auroraCluster.endpoint;
export const ecsClusterName = ecsCluster.name;
export const dynamoTableName = dynamoTable.name;
export const s3BucketName = s3Bucket.id;
```

## File: package.json

```json
{
    "name": "environment-migration",
    "version": "1.0.0",
    "description": "Environment migration infrastructure",
    "main": "index.ts",
    "scripts": {
        "build": "tsc",
        "test": "jest"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    },
    "dependencies": {
        "@pulumi/pulumi": "^3.0.0",
        "@pulumi/aws": "^6.0.0"
    }
}
```

## File: Pulumi.yaml

```yaml
name: environment-migration
runtime: nodejs
description: Environment migration infrastructure with database and container deployment
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
    "include": ["**/*.ts"],
    "exclude": ["node_modules"]
}
```
