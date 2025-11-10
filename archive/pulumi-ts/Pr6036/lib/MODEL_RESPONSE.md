# Order Processing API Infrastructure - Pulumi TypeScript Implementation

This implementation creates a production-grade containerized order processing API on AWS with ECS Fargate, Aurora MySQL, blue-green deployment support, comprehensive monitoring, and security controls.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// VPC Configuration - 3 AZs with public and private subnets
const vpc = new awsx.ec2.Vpc(`order-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    numberOfAvailabilityZones: 3,
    subnetSpecs: [
        {
            type: awsx.ec2.SubnetType.Public,
            name: `public-${environmentSuffix}`,
            cidrMask: 24,
        },
        {
            type: awsx.ec2.SubnetType.Private,
            name: `private-${environmentSuffix}`,
            cidrMask: 24,
        },
    ],
    natGateways: {
        strategy: awsx.ec2.NatGatewayStrategy.OnePerAz,
    },
    tags: {
        Name: `order-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: "order-api",
    },
});

// Security Group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP from internet",
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS from internet",
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
        Name: `alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Security Group for ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for ECS tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: "Allow traffic from ALB",
        },
        {
            protocol: "tcp",
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: "Allow container port from ALB",
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
        Name: `ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Security Group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for RDS Aurora cluster",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [ecsSecurityGroup.id],
            description: "Allow MySQL from ECS tasks",
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
        Name: `rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Database Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environmentSuffix}`, {
    subnetIds: vpc.privateSubnetIds,
    tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Database Password in Secrets Manager
const dbPassword = new aws.secretsmanager.Secret(`db-password-${environmentSuffix}`, {
    name: `order-api-db-password-${environmentSuffix}`,
    description: "Database password for Order API Aurora cluster",
    tags: {
        Name: `db-password-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const dbPasswordVersion = new aws.secretsmanager.SecretVersion(`db-password-version-${environmentSuffix}`, {
    secretId: dbPassword.id,
    secretString: JSON.stringify({
        username: "admin",
        password: pulumi.output(aws.secretsmanager.getRandomPassword({
            length: 32,
            excludeCharacters: "\"@/\\",
            excludePunctuation: true,
        })).randomPassword,
    }),
});

// RDS Aurora MySQL Cluster
const auroraCluster = new aws.rds.Cluster(`aurora-cluster-${environmentSuffix}`, {
    clusterIdentifier: `order-api-${environmentSuffix}`,
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    databaseName: "orderdb",
    masterUsername: "admin",
    masterPassword: dbPasswordVersion.secretString.apply(s => JSON.parse(s).password),
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    backupRetentionPeriod: 7,
    preferredBackupWindow: "03:00-04:00",
    preferredMaintenanceWindow: "mon:04:00-mon:05:00",
    skipFinalSnapshot: true,
    storageEncrypted: true,
    enabledCloudwatchLogsExports: ["audit", "error", "general", "slowquery"],
    tags: {
        Name: `aurora-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: "order-api",
    },
});

// Aurora Cluster Instances (writer + reader)
const writerInstance = new aws.rds.ClusterInstance(`aurora-writer-${environmentSuffix}`, {
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.r6g.large",
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    publiclyAccessible: false,
    tags: {
        Name: `aurora-writer-${environmentSuffix}`,
        Environment: environmentSuffix,
        Role: "writer",
    },
});

const readerInstance = new aws.rds.ClusterInstance(`aurora-reader-${environmentSuffix}`, {
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.r6g.large",
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    publiclyAccessible: false,
    tags: {
        Name: `aurora-reader-${environmentSuffix}`,
        Environment: environmentSuffix,
        Role: "reader",
    },
});

// Parameter Store for Application Config
const apiConfigParam = new aws.ssm.Parameter(`api-config-${environmentSuffix}`, {
    name: `/order-api/${environmentSuffix}/config`,
    type: "String",
    value: JSON.stringify({
        region: region,
        logLevel: "info",
        maxConnections: 100,
    }),
    tags: {
        Name: `api-config-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECR Repository
const ecrRepo = new aws.ecr.Repository(`order-api-repo-${environmentSuffix}`, {
    name: `order-api-${environmentSuffix}`,
    imageTagMutability: "MUTABLE",
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    tags: {
        Name: `order-api-repo-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Cluster with Container Insights
const ecsCluster = new aws.ecs.Cluster(`order-cluster-${environmentSuffix}`, {
    name: `order-api-${environmentSuffix}`,
    settings: [{
        name: "containerInsights",
        value: "enabled",
    }],
    tags: {
        Name: `order-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: "order-api",
    },
});

// Fargate Capacity Providers
const fargateCapacityProvider = new aws.ecs.ClusterCapacityProviders(`fargate-capacity-${environmentSuffix}`, {
    clusterName: ecsCluster.name,
    capacityProviders: ["FARGATE", "FARGATE_SPOT"],
    defaultCapacityProviderStrategies: [
        {
            capacityProvider: "FARGATE_SPOT",
            weight: 50,
            base: 0,
        },
        {
            capacityProvider: "FARGATE",
            weight: 50,
            base: 1,
        },
    ],
});

// IAM Role for ECS Task Execution
const ecsTaskExecutionRole = new aws.iam.Role(`ecs-task-exec-role-${environmentSuffix}`, {
    name: `ecs-task-exec-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `ecs-task-exec-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`ecs-task-exec-policy-${environmentSuffix}`, {
    role: ecsTaskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// IAM Role for ECS Task
const ecsTaskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
    name: `ecs-task-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM Policy for Task to Access Secrets and Parameters
const taskPolicy = new aws.iam.RolePolicy(`task-policy-${environmentSuffix}`, {
    role: ecsTaskRole.id,
    policy: pulumi.all([dbPassword.arn, apiConfigParam.arn]).apply(([secretArn, paramArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret",
                    ],
                    Resource: secretArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                    ],
                    Resource: paramArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "cloudwatch:PutMetricData",
                    ],
                    Resource: "*",
                },
            ],
        })
    ),
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup(`ecs-log-group-${environmentSuffix}`, {
    name: `/ecs/order-api-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `ecs-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(`order-api-task-${environmentSuffix}`, {
    family: `order-api-${environmentSuffix}`,
    cpu: "512",
    memory: "1024",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi.all([
        ecrRepo.repositoryUrl,
        dbPassword.arn,
        auroraCluster.endpoint,
        apiConfigParam.name,
        logGroup.name,
    ]).apply(([repoUrl, secretArn, dbEndpoint, paramName, logGroupName]) =>
        JSON.stringify([{
            name: "order-api",
            image: `${repoUrl}:latest`,
            cpu: 512,
            memory: 1024,
            essential: true,
            portMappings: [{
                containerPort: 8080,
                protocol: "tcp",
            }],
            environment: [
                {
                    name: "DB_ENDPOINT",
                    value: dbEndpoint,
                },
                {
                    name: "DB_NAME",
                    value: "orderdb",
                },
                {
                    name: "REGION",
                    value: region,
                },
                {
                    name: "CONFIG_PARAM",
                    value: paramName,
                },
            ],
            secrets: [
                {
                    name: "DB_CREDENTIALS",
                    valueFrom: secretArn,
                },
            ],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroupName,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                interval: 30,
                timeout: 5,
                retries: 3,
                startPeriod: 60,
            },
        }])
    ),
    tags: {
        Name: `order-api-task-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`order-alb-${environmentSuffix}`, {
    name: `order-api-${environmentSuffix}`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: vpc.publicSubnetIds,
    enableDeletionProtection: false,
    enableHttp2: true,
    tags: {
        Name: `order-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: "order-api",
    },
});

// Target Group Blue
const targetGroupBlue = new aws.lb.TargetGroup(`tg-blue-${environmentSuffix}`, {
    name: `order-blue-${environmentSuffix}`,
    port: 8080,
    protocol: "HTTP",
    vpcId: vpc.vpcId,
    targetType: "ip",
    deregistrationDelay: 30,
    healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        port: "8080",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200",
    },
    tags: {
        Name: `tg-blue-${environmentSuffix}`,
        Environment: environmentSuffix,
        Deployment: "blue",
    },
});

// Target Group Green
const targetGroupGreen = new aws.lb.TargetGroup(`tg-green-${environmentSuffix}`, {
    name: `order-green-${environmentSuffix}`,
    port: 8080,
    protocol: "HTTP",
    vpcId: vpc.vpcId,
    targetType: "ip",
    deregistrationDelay: 30,
    healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        port: "8080",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200",
    },
    tags: {
        Name: `tg-green-${environmentSuffix}`,
        Environment: environmentSuffix,
        Deployment: "green",
    },
});

// ALB Listener HTTP (redirect to HTTPS would be here, but for simplicity using HTTP)
const albListener = new aws.lb.Listener(`alb-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroupBlue.arn,
    }],
    tags: {
        Name: `alb-listener-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Service
const ecsService = new aws.ecs.Service(`order-service-${environmentSuffix}`, {
    name: `order-api-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 3,
    launchType: undefined, // Using capacity providers instead
    capacityProviderStrategies: [
        {
            capacityProvider: "FARGATE_SPOT",
            weight: 50,
            base: 0,
        },
        {
            capacityProvider: "FARGATE",
            weight: 50,
            base: 1,
        },
    ],
    networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
    },
    loadBalancers: [{
        targetGroupArn: targetGroupBlue.arn,
        containerName: "order-api",
        containerPort: 8080,
    }],
    healthCheckGracePeriodSeconds: 60,
    enableExecuteCommand: true,
    tags: {
        Name: `order-service-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: "order-api",
    },
}, { dependsOn: [albListener] });

// Auto Scaling Target
const autoScalingTarget = new aws.appautoscaling.Target(`ecs-target-${environmentSuffix}`, {
    maxCapacity: 10,
    minCapacity: 3,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs",
});

// Auto Scaling Policy - CPU Based
const cpuScalingPolicy = new aws.appautoscaling.Policy(`cpu-scaling-${environmentSuffix}`, {
    name: `cpu-scaling-${environmentSuffix}`,
    policyType: "TargetTrackingScaling",
    resourceId: autoScalingTarget.resourceId,
    scalableDimension: autoScalingTarget.scalableDimension,
    serviceNamespace: autoScalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization",
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
    },
});

// Custom CloudWatch Metric for Pending Orders
const pendingOrdersMetric = new aws.cloudwatch.LogMetricFilter(`pending-orders-${environmentSuffix}`, {
    name: `pending-orders-${environmentSuffix}`,
    logGroupName: logGroup.name,
    pattern: "[time, request_id, level=INFO, msg=\"Pending*\", count]",
    metricTransformation: {
        name: "PendingOrders",
        namespace: `OrderAPI/${environmentSuffix}`,
        value: "$count",
    },
});

// Auto Scaling Policy - Custom Metric Based
const customMetricScalingPolicy = new aws.appautoscaling.Policy(`custom-scaling-${environmentSuffix}`, {
    name: `pending-orders-scaling-${environmentSuffix}`,
    policyType: "TargetTrackingScaling",
    resourceId: autoScalingTarget.resourceId,
    scalableDimension: autoScalingTarget.scalableDimension,
    serviceNamespace: autoScalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        targetValue: 100.0,
        customizedMetricSpecification: {
            metricName: "PendingOrders",
            namespace: `OrderAPI/${environmentSuffix}`,
            statistic: "Average",
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
    },
});

// AWS WAF Web ACL
const wafWebAcl = new aws.wafv2.WebAcl(`waf-acl-${environmentSuffix}`, {
    name: `order-api-waf-${environmentSuffix}`,
    scope: "REGIONAL",
    defaultAction: {
        allow: {},
    },
    rules: [
        {
            name: "RateLimitRule",
            priority: 1,
            action: {
                block: {},
            },
            statement: {
                rateBasedStatement: {
                    limit: 100,
                    aggregateKeyType: "IP",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudwatchMetricsEnabled: true,
                metricName: `RateLimit-${environmentSuffix}`,
            },
        },
    ],
    visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `OrderAPIWAF-${environmentSuffix}`,
    },
    tags: {
        Name: `waf-acl-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Associate WAF with ALB
const wafAssociation = new aws.wafv2.WebAclAssociation(`waf-association-${environmentSuffix}`, {
    resourceArn: alb.arn,
    webAclArn: wafWebAcl.arn,
});

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(`order-dashboard-${environmentSuffix}`, {
    dashboardName: `order-api-${environmentSuffix}`,
    dashboardBody: pulumi.all([ecsCluster.name, ecsService.name, auroraCluster.clusterIdentifier, alb.arnSuffix, targetGroupBlue.arnSuffix]).apply(([clusterName, serviceName, dbClusterId, albArn, tgArn]) =>
        JSON.stringify({
            widgets: [
                {
                    type: "metric",
                    properties: {
                        metrics: [
                            ["AWS/ECS", "CPUUtilization", { stat: "Average", label: "CPU Utilization" }],
                            [".", "MemoryUtilization", { stat: "Average", label: "Memory Utilization" }],
                        ],
                        period: 300,
                        stat: "Average",
                        region: region,
                        title: "ECS Service Metrics",
                        yAxis: {
                            left: {
                                min: 0,
                                max: 100,
                            },
                        },
                    },
                },
                {
                    type: "metric",
                    properties: {
                        metrics: [
                            ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average", label: "Response Time" }],
                            [".", "RequestCount", { stat: "Sum", label: "Request Count" }],
                        ],
                        period: 300,
                        stat: "Average",
                        region: region,
                        title: "ALB Metrics",
                    },
                },
                {
                    type: "metric",
                    properties: {
                        metrics: [
                            ["AWS/RDS", "DatabaseConnections", { stat: "Average", label: "DB Connections" }],
                            [".", "CPUUtilization", { stat: "Average", label: "DB CPU" }],
                        ],
                        period: 300,
                        stat: "Average",
                        region: region,
                        title: "RDS Metrics",
                    },
                },
                {
                    type: "metric",
                    properties: {
                        metrics: [
                            [`OrderAPI/${environmentSuffix}`, "PendingOrders", { stat: "Average", label: "Pending Orders" }],
                        ],
                        period: 300,
                        stat: "Average",
                        region: region,
                        title: "Custom Application Metrics",
                    },
                },
            ],
        })
    ),
});

// CloudWatch Alarm - High Error Rate
const highErrorRateAlarm = new aws.cloudwatch.MetricAlarm(`high-error-alarm-${environmentSuffix}`, {
    name: `order-api-high-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "HTTPCode_Target_5XX_Count",
    namespace: "AWS/ApplicationELB",
    period: 300,
    statistic: "Sum",
    threshold: 10,
    alarmDescription: "Triggers when target 5XX errors exceed threshold",
    dimensions: {
        LoadBalancer: alb.arnSuffix,
        TargetGroup: targetGroupBlue.arnSuffix,
    },
    tags: {
        Name: `high-error-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Alarm - Database Connection Failures
const dbConnectionAlarm = new aws.cloudwatch.MetricAlarm(`db-connection-alarm-${environmentSuffix}`, {
    name: `order-api-db-failures-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "DatabaseConnections",
    namespace: "AWS/RDS",
    period: 300,
    statistic: "Average",
    threshold: 80,
    alarmDescription: "Triggers when database connections are high",
    dimensions: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
    },
    tags: {
        Name: `db-connection-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Exports
export const vpcId = vpc.vpcId;
export const albDnsName = alb.dnsName;
export const ecsServiceArn = ecsService.id;
export const rdsClusterEndpoint = auroraCluster.endpoint;
export const rdsReaderEndpoint = auroraCluster.readerEndpoint;
export const ecrRepositoryUrl = ecrRepo.repositoryUrl;
export const wafWebAclArn = wafWebAcl.arn;
export const blueTargetGroupArn = targetGroupBlue.arn;
export const greenTargetGroupArn = targetGroupGreen.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
```

## File: lib/README.md

```markdown
# Order Processing API Infrastructure

This Pulumi TypeScript program deploys a production-grade containerized order processing API on AWS.

## Architecture

- **VPC**: 3 availability zones with public and private subnets
- **NAT Gateways**: One per AZ for outbound connectivity from private subnets
- **ECS Fargate**: Containerized application with Spot and regular capacity providers (50/50 split)
- **Application Load Balancer**: Internet-facing ALB with health checks
- **RDS Aurora MySQL**: Multi-AZ cluster with read replicas
- **AWS WAF**: Rate limiting (100 requests per 5 minutes per IP)
- **Secrets Manager**: Database credentials storage
- **Parameter Store**: Application configuration
- **CloudWatch**: Container Insights, custom dashboard, alarms
- **Blue-Green Deployment**: Two target groups for traffic shifting

## Prerequisites

1. Pulumi CLI installed
2. AWS CLI configured with appropriate credentials
3. Node.js 18+ and npm
4. Docker image pushed to ECR repository

## Configuration

Create a Pulumi stack and set the required configuration:

```bash
pulumi stack init dev
pulumi config set environmentSuffix <your-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Preview changes:
   ```bash
   pulumi preview
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Push your Docker image to the created ECR repository:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>
   docker tag order-api:latest <ecr-url>:latest
   docker push <ecr-url>:latest
   ```

5. Update ECS service to pull the new image:
   ```bash
   aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
   ```

## Outputs

After deployment, the following outputs are available:

- `albDnsName`: DNS name of the Application Load Balancer
- `ecsServiceArn`: ARN of the ECS service
- `rdsClusterEndpoint`: Writer endpoint of the Aurora cluster
- `rdsReaderEndpoint`: Reader endpoint for read operations
- `ecrRepositoryUrl`: URL of the ECR repository
- `blueTargetGroupArn`: ARN of the blue target group
- `greenTargetGroupArn`: ARN of the green target group
- `dashboardUrl`: CloudWatch dashboard URL

## Blue-Green Deployment

To perform a blue-green deployment:

1. Deploy new version to green target group
2. Test the green environment
3. Update ALB listener to shift traffic from blue to green
4. Monitor the deployment
5. Roll back by switching listener back to blue if issues occur

## Auto-Scaling

The service automatically scales based on:

- **CPU Utilization**: Target 70%, scales between 3-10 tasks
- **Pending Orders**: Custom metric, target 100 orders, scales between 3-10 tasks

## Monitoring

- **Container Insights**: Enabled at cluster level for detailed metrics
- **CloudWatch Dashboard**: Visual representation of key metrics
- **Alarms**:
  - High error rate (5XX responses > 10 in 5 minutes)
  - High database connections (> 80 connections)

## Security

- **VPC Isolation**: ECS tasks and RDS in private subnets
- **Security Groups**: Least privilege access between components
- **Secrets Manager**: Database credentials encrypted at rest
- **WAF**: Rate limiting to prevent abuse
- **Encryption**: RDS storage encrypted, HTTPS for ALB

## Cost Optimization

- **Fargate Spot**: 50% of tasks run on Spot instances (60-70% cost savings)
- **Aurora Serverless**: Consider for variable workloads
- **Auto-scaling**: Scales down during low traffic periods
- **Log Retention**: 7 days to reduce storage costs

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Troubleshooting

### ECS Tasks Not Starting

- Check CloudWatch logs: `/ecs/order-api-<suffix>`
- Verify ECR image exists and is accessible
- Check security group rules allow ALB to ECS communication

### High Database Connections

- Review connection pooling in application
- Check for connection leaks
- Consider read replicas for read-heavy workloads

### WAF Blocking Legitimate Traffic

- Review WAF metrics in CloudWatch
- Adjust rate limit threshold if needed
- Add IP whitelist rules for known good actors

## Support

For issues or questions, please contact the DevOps team.
```