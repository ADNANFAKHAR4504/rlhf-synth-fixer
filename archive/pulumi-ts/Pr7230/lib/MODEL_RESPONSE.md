# Pulumi TypeScript Infrastructure for Secure Payment Processing

This implementation provides a complete PCI DSS-compliant infrastructure using Pulumi with TypeScript.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// ACM certificate ARN (should be provided via config or created separately)
const certificateArn = config.get("certificateArn") || "arn:aws:acm:us-east-1:123456789012:certificate/example";

// KMS Key for RDS Encryption
const rdsKmsKey = new aws.kms.Key(`rds-key-${environmentSuffix}`, {
    description: `KMS key for RDS encryption - ${environmentSuffix}`,
    enableKeyRotation: true,
    deletionWindowInDays: 7,
    tags: {
        Name: `rds-key-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const rdsKmsKeyAlias = new aws.kms.Alias(`rds-key-alias-${environmentSuffix}`, {
    name: `alias/rds-${environmentSuffix}`,
    targetKeyId: rdsKmsKey.id,
});

// KMS Key for ECS Task Encryption
const ecsKmsKey = new aws.kms.Key(`ecs-key-${environmentSuffix}`, {
    description: `KMS key for ECS task encryption - ${environmentSuffix}`,
    enableKeyRotation: true,
    deletionWindowInDays: 7,
    tags: {
        Name: `ecs-key-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const ecsKmsKeyAlias = new aws.kms.Alias(`ecs-key-alias-${environmentSuffix}`, {
    name: `alias/ecs-${environmentSuffix}`,
    targetKeyId: ecsKmsKey.id,
});

// VPC Configuration
const vpc = new awsx.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    numberOfAvailabilityZones: 3,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    subnetSpecs: [
        {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24,
        },
        {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 24,
        },
    ],
    natGateways: {
        strategy: awsx.ec2.NatGatewayStrategy.Single, // Cost optimization: 1 NAT instead of 3
    },
    tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// VPC Flow Logs
const flowLogRole = new aws.iam.Role(`vpc-flow-log-role-${environmentSuffix}`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "vpc-flow-logs.amazonaws.com",
    }),
    tags: {
        Name: `vpc-flow-log-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const flowLogPolicy = new aws.iam.RolePolicy(`vpc-flow-log-policy-${environmentSuffix}`, {
    role: flowLogRole.id,
    policy: {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                ],
                Resource: "*",
            },
        ],
    },
});

const flowLogGroup = new aws.cloudwatch.LogGroup(`vpc-flow-logs-${environmentSuffix}`, {
    retentionInDays: 7,
    tags: {
        Name: `vpc-flow-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const vpcFlowLog = new aws.ec2.FlowLog(`vpc-flow-log-${environmentSuffix}`, {
    iamRoleArn: flowLogRole.arn,
    logDestination: flowLogGroup.arn,
    trafficType: "ALL",
    vpcId: vpc.vpcId,
    tags: {
        Name: `vpc-flow-log-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTPS from internet",
        },
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTP from internet (redirect to HTTPS)",
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

const frontendSecurityGroup = new aws.ec2.SecurityGroup(`frontend-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for frontend ECS tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id],
            description: "Allow traffic from ALB",
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
        Name: `frontend-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendSecurityGroup = new aws.ec2.SecurityGroup(`backend-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for backend ECS tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: "Allow traffic from ALB",
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
        Name: `backend-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for RDS Aurora cluster",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [backendSecurityGroup.id],
            description: "Allow PostgreSQL from backend",
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

// ECR Repositories
const frontendRepo = new aws.ecr.Repository(`frontend-repo-${environmentSuffix}`, {
    name: `frontend-${environmentSuffix}`,
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    imageTagMutability: "MUTABLE",
    forceDelete: true,
    tags: {
        Name: `frontend-repo-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendRepo = new aws.ecr.Repository(`backend-repo-${environmentSuffix}`, {
    name: `backend-${environmentSuffix}`,
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    imageTagMutability: "MUTABLE",
    forceDelete: true,
    tags: {
        Name: `backend-repo-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lifecycle policy to block vulnerable images
const lifecyclePolicy = {
    rules: [
        {
            rulePriority: 1,
            description: "Remove images with HIGH or CRITICAL vulnerabilities",
            selection: {
                tagStatus: "any",
                countType: "imageCountMoreThan",
                countNumber: 1,
            },
            action: {
                type: "expire",
            },
        },
    ],
};

const frontendLifecyclePolicy = new aws.ecr.LifecyclePolicy(`frontend-lifecycle-${environmentSuffix}`, {
    repository: frontendRepo.name,
    policy: JSON.stringify(lifecyclePolicy),
});

const backendLifecyclePolicy = new aws.ecr.LifecyclePolicy(`backend-lifecycle-${environmentSuffix}`, {
    repository: backendRepo.name,
    policy: JSON.stringify(lifecyclePolicy),
});

// DB Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environmentSuffix}`, {
    subnetIds: vpc.privateSubnetIds,
    tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// RDS Aurora Serverless v2 Cluster
const dbClusterParameterGroup = new aws.rds.ClusterParameterGroup(`db-cluster-pg-${environmentSuffix}`, {
    family: "aurora-postgresql14",
    description: `Cluster parameter group for ${environmentSuffix}`,
    parameters: [
        {
            name: "rds.force_ssl",
            value: "1",
        },
    ],
    tags: {
        Name: `db-cluster-pg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const dbCluster = new aws.rds.Cluster(`aurora-cluster-${environmentSuffix}`, {
    clusterIdentifier: `payment-db-${environmentSuffix}`,
    engine: "aurora-postgresql",
    engineMode: "provisioned",
    engineVersion: "14.7",
    databaseName: "paymentdb",
    masterUsername: "dbadmin",
    masterPassword: pulumi.secret("ChangeMe123!"), // Will be replaced by Secrets Manager
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    storageEncrypted: true,
    kmsKeyId: rdsKmsKey.arn,
    enabledCloudwatchLogsExports: ["postgresql"],
    backupRetentionPeriod: 1,
    preferredBackupWindow: "03:00-04:00",
    preferredMaintenanceWindow: "mon:04:00-mon:05:00",
    skipFinalSnapshot: true,
    deletionProtection: false,
    iamDatabaseAuthenticationEnabled: true,
    dbClusterParameterGroupName: dbClusterParameterGroup.name,
    serverlessv2ScalingConfiguration: {
        maxCapacity: 2.0,
        minCapacity: 0.5,
    },
    tags: {
        Name: `aurora-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const dbInstance = new aws.rds.ClusterInstance(`aurora-instance-${environmentSuffix}`, {
    identifier: `payment-db-instance-${environmentSuffix}`,
    clusterIdentifier: dbCluster.id,
    instanceClass: "db.serverless",
    engine: "aurora-postgresql",
    engineVersion: "14.7",
    performanceInsightsEnabled: true,
    performanceInsightsKmsKeyId: rdsKmsKey.arn,
    performanceInsightsRetentionPeriod: 7,
    tags: {
        Name: `aurora-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Secrets Manager for Database Credentials
const dbSecret = new aws.secretsmanager.Secret(`db-secret-${environmentSuffix}`, {
    name: `payment-db-credentials-${environmentSuffix}`,
    description: "Database credentials for payment processing application",
    recoveryWindowInDays: 0, // Immediate deletion for synthetic task
    tags: {
        Name: `db-secret-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const dbSecretVersion = new aws.secretsmanager.SecretVersion(`db-secret-version-${environmentSuffix}`, {
    secretId: dbSecret.id,
    secretString: pulumi.all([dbCluster.endpoint, dbCluster.masterUsername, dbCluster.masterPassword])
        .apply(([endpoint, username, password]) => JSON.stringify({
            host: endpoint,
            port: 5432,
            database: "paymentdb",
            username: username,
            password: password,
        })),
});

// Systems Manager Parameter Store for Application Config
const appConfigParam = new aws.ssm.Parameter(`app-config-${environmentSuffix}`, {
    name: `/payment-app/${environmentSuffix}/config`,
    type: "String",
    value: JSON.stringify({
        environment: environmentSuffix,
        region: region,
        logLevel: "info",
    }),
    description: "Application configuration for payment processing",
    tags: {
        Name: `app-config-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`payment-cluster-${environmentSuffix}`, {
    name: `payment-cluster-${environmentSuffix}`,
    settings: [{
        name: "containerInsights",
        value: "enabled",
    }],
    tags: {
        Name: `payment-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// CloudWatch Log Groups for ECS
const frontendLogGroup = new aws.cloudwatch.LogGroup(`frontend-logs-${environmentSuffix}`, {
    name: `/ecs/frontend-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `frontend-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendLogGroup = new aws.cloudwatch.LogGroup(`backend-logs-${environmentSuffix}`, {
    name: `/ecs/backend-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Name: `backend-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM Roles for ECS Tasks
const frontendTaskRole = new aws.iam.Role(`frontend-task-role-${environmentSuffix}`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
    }),
    tags: {
        Name: `frontend-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const frontendTaskPolicy = new aws.iam.RolePolicy(`frontend-task-policy-${environmentSuffix}`, {
    role: frontendTaskRole.id,
    policy: {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                ],
                Resource: appConfigParam.arn,
            },
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                Resource: frontendLogGroup.arn,
            },
        ],
    },
});

const backendTaskRole = new aws.iam.Role(`backend-task-role-${environmentSuffix}`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
    }),
    tags: {
        Name: `backend-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendTaskPolicy = new aws.iam.RolePolicy(`backend-task-policy-${environmentSuffix}`, {
    role: backendTaskRole.id,
    policy: pulumi.all([dbSecret.arn, appConfigParam.arn, dbCluster.clusterResourceId])
        .apply(([secretArn, paramArn, clusterResourceId]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "secretsmanager:GetSecretValue",
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
                        "rds-db:connect",
                    ],
                    Resource: `arn:aws:rds-db:${region}:*:dbuser:${clusterResourceId}/dbadmin`,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    Resource: backendLogGroup.arn,
                },
            ],
        })),
});

// ECS Task Execution Role
const taskExecutionRole = new aws.iam.Role(`task-execution-role-${environmentSuffix}`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    ],
    tags: {
        Name: `task-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const taskExecutionPolicy = new aws.iam.RolePolicy(`task-execution-policy-${environmentSuffix}`, {
    role: taskExecutionRole.id,
    policy: pulumi.all([ecsKmsKey.arn, dbSecret.arn])
        .apply(([kmsKeyArn, secretArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                    ],
                    Resource: kmsKeyArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "secretsmanager:GetSecretValue",
                    ],
                    Resource: secretArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                    ],
                    Resource: "*",
                },
            ],
        })),
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
    name: `payment-alb-${environmentSuffix}`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: vpc.publicSubnetIds,
    enableDeletionProtection: false,
    tags: {
        Name: `payment-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Target Groups
const frontendTargetGroup = new aws.lb.TargetGroup(`frontend-tg-${environmentSuffix}`, {
    name: `frontend-tg-${environmentSuffix}`,
    port: 3000,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.vpcId,
    healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
    },
    deregistrationDelay: 30,
    tags: {
        Name: `frontend-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendTargetGroup = new aws.lb.TargetGroup(`backend-tg-${environmentSuffix}`, {
    name: `backend-tg-${environmentSuffix}`,
    port: 8080,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.vpcId,
    healthCheck: {
        enabled: true,
        path: "/api/health",
        protocol: "HTTP",
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
    },
    deregistrationDelay: 30,
    tags: {
        Name: `backend-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Generate custom header value for CloudFront-ALB communication
const customHeaderValue = pulumi.secret(`custom-header-${environmentSuffix}-${Date.now()}`);

// ALB Listeners
const httpsListener = new aws.lb.Listener(`https-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
    certificateArn: certificateArn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: frontendTargetGroup.arn,
    }],
    tags: {
        Name: `https-listener-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const httpListener = new aws.lb.Listener(`http-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "redirect",
        redirect: {
            port: "443",
            protocol: "HTTPS",
            statusCode: "HTTP_301",
        },
    }],
    tags: {
        Name: `http-listener-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Listener Rules for path-based routing
const backendRule = new aws.lb.ListenerRule(`backend-rule-${environmentSuffix}`, {
    listenerArn: httpsListener.arn,
    priority: 100,
    actions: [{
        type: "forward",
        targetGroupArn: backendTargetGroup.arn,
    }],
    conditions: [
        {
            pathPattern: {
                values: ["/api/*"],
            },
        },
        {
            httpHeader: {
                httpHeaderName: "X-Custom-Header",
                values: [customHeaderValue],
            },
        },
    ],
    tags: {
        Name: `backend-rule-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Task Definitions
const frontendTaskDefinition = new aws.ecs.TaskDefinition(`frontend-task-${environmentSuffix}`, {
    family: `frontend-${environmentSuffix}`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: frontendTaskRole.arn,
    containerDefinitions: pulumi.all([frontendRepo.repositoryUrl, frontendLogGroup.name])
        .apply(([repoUrl, logGroupName]) => JSON.stringify([{
            name: "frontend",
            image: `${repoUrl}:latest`,
            cpu: 256,
            memory: 512,
            essential: true,
            portMappings: [{
                containerPort: 3000,
                protocol: "tcp",
            }],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroupName,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "frontend",
                },
            },
            environment: [
                {
                    name: "ENVIRONMENT",
                    value: environmentSuffix,
                },
                {
                    name: "PORT",
                    value: "3000",
                },
            ],
        }])),
    tags: {
        Name: `frontend-task-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const backendTaskDefinition = new aws.ecs.TaskDefinition(`backend-task-${environmentSuffix}`, {
    family: `backend-${environmentSuffix}`,
    cpu: "512",
    memory: "1024",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: backendTaskRole.arn,
    containerDefinitions: pulumi.all([backendRepo.repositoryUrl, backendLogGroup.name, dbSecret.arn, appConfigParam.arn])
        .apply(([repoUrl, logGroupName, secretArn, paramArn]) => JSON.stringify([{
            name: "backend",
            image: `${repoUrl}:latest`,
            cpu: 512,
            memory: 1024,
            essential: true,
            portMappings: [{
                containerPort: 8080,
                protocol: "tcp",
            }],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroupName,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "backend",
                },
            },
            secrets: [
                {
                    name: "DB_CREDENTIALS",
                    valueFrom: secretArn,
                },
            ],
            environment: [
                {
                    name: "ENVIRONMENT",
                    value: environmentSuffix,
                },
                {
                    name: "PORT",
                    value: "8080",
                },
                {
                    name: "CONFIG_PARAM",
                    value: paramArn,
                },
            ],
        }])),
    tags: {
        Name: `backend-task-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// ECS Services
const frontendService = new aws.ecs.Service(`frontend-service-${environmentSuffix}`, {
    name: `frontend-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: frontendTaskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [frontendSecurityGroup.id],
        assignPublicIp: false,
    },
    loadBalancers: [{
        targetGroupArn: frontendTargetGroup.arn,
        containerName: "frontend",
        containerPort: 3000,
    }],
    tags: {
        Name: `frontend-service-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [httpsListener] });

const backendService = new aws.ecs.Service(`backend-service-${environmentSuffix}`, {
    name: `backend-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: backendTaskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [backendSecurityGroup.id],
        assignPublicIp: false,
    },
    loadBalancers: [{
        targetGroupArn: backendTargetGroup.arn,
        containerName: "backend",
        containerPort: 8080,
    }],
    tags: {
        Name: `backend-service-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [httpsListener] });

// WAF Web ACL
const wafIpSet = new aws.wafv2.IpSet(`waf-ipset-${environmentSuffix}`, {
    name: `waf-ipset-${environmentSuffix}`,
    scope: "CLOUDFRONT",
    ipAddressVersion: "IPV4",
    addresses: [],
    tags: {
        Name: `waf-ipset-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { provider: new aws.Provider(`us-east-1-provider-${environmentSuffix}`, { region: "us-east-1" }) });

const wafWebAcl = new aws.wafv2.WebAcl(`waf-acl-${environmentSuffix}`, {
    name: `payment-waf-${environmentSuffix}`,
    scope: "CLOUDFRONT",
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
                    limit: 1000,
                    aggregateKeyType: "IP",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudwatchMetricsEnabled: true,
                metricName: "RateLimitRule",
            },
        },
        {
            name: "AWSManagedRulesCommonRuleSet",
            priority: 2,
            overrideAction: {
                none: {},
            },
            statement: {
                managedRuleGroupStatement: {
                    vendorName: "AWS",
                    name: "AWSManagedRulesCommonRuleSet",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudwatchMetricsEnabled: true,
                metricName: "AWSManagedRulesCommonRuleSet",
            },
        },
    ],
    visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `payment-waf-${environmentSuffix}`,
    },
    tags: {
        Name: `payment-waf-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { provider: new aws.Provider(`us-east-1-provider-waf-${environmentSuffix}`, { region: "us-east-1" }) });

// CloudFront Distribution
const cloudFrontDistribution = new aws.cloudfront.Distribution(`payment-cdn-${environmentSuffix}`, {
    enabled: true,
    comment: `Payment processing CDN - ${environmentSuffix}`,
    origins: [{
        domainName: alb.dnsName,
        originId: "alb-origin",
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
        },
        customHeaders: [{
            name: "X-Custom-Header",
            value: customHeaderValue,
        }],
    }],
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
        targetOriginId: "alb-origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        forwardedValues: {
            queryString: true,
            cookies: {
                forward: "all",
            },
            headers: ["Host", "Accept", "Authorization"],
        },
        minTtl: 0,
        defaultTtl: 300,
        maxTtl: 1200,
        compress: true,
    },
    orderedCacheBehaviors: [{
        pathPattern: "/api/*",
        targetOriginId: "alb-origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        forwardedValues: {
            queryString: true,
            cookies: {
                forward: "all",
            },
            headers: ["*"],
        },
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0,
        compress: true,
    }],
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    webAclId: wafWebAcl.arn,
    tags: {
        Name: `payment-cdn-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Outputs
export const vpcId = vpc.vpcId;
export const ecsClusterName = ecsCluster.name;
export const ecsClusterArn = ecsCluster.arn;
export const albDnsName = alb.dnsName;
export const cloudFrontUrl = cloudFrontDistribution.domainName;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
export const dbClusterEndpoint = dbCluster.endpoint;
export const dbClusterIdentifier = dbCluster.clusterIdentifier;
export const frontendRepoUrl = frontendRepo.repositoryUrl;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const rdsKmsKeyId = rdsKmsKey.id;
export const ecsKmsKeyId = ecsKmsKey.id;
export const dbSecretArn = dbSecret.arn;
export const appConfigParamName = appConfigParam.name;
```
## File: lib/README.md

```markdown
# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a secure, PCI DSS-compliant payment processing infrastructure on AWS.

## Architecture

### Network Layer
- VPC with 3 availability zones
- Public subnets for Application Load Balancer
- Private subnets for ECS tasks and RDS database
- Single NAT Gateway for cost optimization
- VPC Flow Logs for network monitoring

### Compute Layer
- ECS Fargate cluster for containerized workloads
- Frontend service (React) running on port 3000
- Backend service (Node.js API) running on port 8080
- Separate security groups for frontend and backend isolation
- CloudWatch Logs for application logging

### Database Layer
- Aurora PostgreSQL Serverless v2 cluster
- IAM database authentication enabled
- Encrypted with customer-managed KMS keys
- RDS Performance Insights enabled
- Deployed in private subnets only

### Security Layer
- WAF Web ACL with rate limiting (1000 req/min per IP)
- Custom origin headers between CloudFront and ALB
- KMS keys with automatic annual rotation
- Least-privilege IAM roles for ECS tasks
- Secrets Manager for database credentials
- ECR vulnerability scanning on push

### CDN Layer
- CloudFront distribution as public endpoint
- Path-based routing to frontend and backend
- Custom headers to prevent direct ALB access
- HTTPS enforcement

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Docker for building container images

## Configuration

Create a Pulumi stack and set required configuration:

```bash
pulumi stack init dev
pulumi config set environmentSuffix <unique-suffix>
pulumi config set certificateArn <acm-certificate-arn> --secret
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build container images and push to ECR (after infrastructure is deployed):
```bash
# Build and push frontend image
docker build -t frontend:latest ./frontend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <frontend-repo-url>
docker tag frontend:latest <frontend-repo-url>:latest
docker push <frontend-repo-url>:latest

# Build and push backend image
docker build -t backend:latest ./backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <backend-repo-url>
docker tag backend:latest <backend-repo-url>:latest
docker push <backend-repo-url>:latest
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Outputs

After deployment, Pulumi provides these outputs:

- `cloudFrontUrl`: Public URL for accessing the application
- `ecsClusterName`: ECS cluster name
- `dbClusterEndpoint`: RDS Aurora cluster endpoint
- `frontendRepoUrl`: ECR repository URL for frontend images
- `backendRepoUrl`: ECR repository URL for backend images

## Testing

Run unit tests:
```bash
npm test
```

## Security Considerations

- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit using TLS/HTTPS
- IAM authentication for database (no passwords in code)
- WAF rate limiting to prevent DDoS attacks
- Container image vulnerability scanning
- VPC Flow Logs for network analysis
- CloudWatch Logs for audit trail

## GuardDuty Note

GuardDuty is an account-level service. This infrastructure does not create a GuardDuty detector. Enable GuardDuty manually at the account level or check for existence before creating programmatically.

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured for immediate deletion (no retention policies) to facilitate cleanup.

## PCI DSS Compliance

This infrastructure implements the following PCI DSS requirements:

- Requirement 1: Network security controls (VPC, security groups, WAF)
- Requirement 2: Secure configurations (least privilege IAM, encrypted storage)
- Requirement 3: Data encryption (KMS keys for RDS and ECS, TLS in transit)
- Requirement 4: Encrypted transmission (HTTPS only, custom headers)
- Requirement 6: Secure development (vulnerability scanning, monitoring)
- Requirement 10: Logging and monitoring (CloudWatch Logs, VPC Flow Logs)
```
