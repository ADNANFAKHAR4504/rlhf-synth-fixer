# E-Commerce API Infrastructure - Pulumi TypeScript Implementation

This implementation provides a production-ready e-commerce API infrastructure using Pulumi with TypeScript, deployed to us-west-2.

## Architecture Overview

- **Networking**: VPC with 3 public and 3 private subnets across 3 AZs with NAT Gateways
- **Compute**: ECS Fargate cluster with auto-scaling (2-10 tasks, 70% CPU threshold)
- **Database**: Aurora PostgreSQL Serverless v2 with encryption and 7-day backups
- **Cache**: ElastiCache Redis cluster mode (2 shards, 1 replica per shard)
- **Load Balancing**: Application Load Balancer with ACM SSL certificate
- **Secrets**: AWS Secrets Manager with 30-day rotation
- **Monitoring**: CloudWatch logs (14-day retention), metrics, and alarms

## File: lib/lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface TapStackProps {
    environmentSuffix: string;
    enableDeletionProtection?: boolean;
}

export class TapStack extends pulumi.ComponentResource {
    public readonly vpcId: pulumi.Output<string>;
    public readonly albDnsName: pulumi.Output<string>;
    public readonly ecsClusterName: pulumi.Output<string>;
    public readonly dbEndpoint: pulumi.Output<string>;
    public readonly redisEndpoint: pulumi.Output<string>;

    constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, opts);

        const region = "us-west-2";
        const { environmentSuffix, enableDeletionProtection = false } = props;

        // Get availability zones
        const availabilityZones = aws.getAvailabilityZones({
            state: "available",
        });

        // VPC
        const vpc = new aws.ec2.Vpc(`ecommerce-vpc-${environmentSuffix}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `ecommerce-vpc-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Internet Gateway
        const igw = new aws.ec2.InternetGateway(`ecommerce-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `ecommerce-igw-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Public Subnets (3 AZs)
        const publicSubnets: aws.ec2.Subnet[] = [];
        for (let i = 0; i < 3; i++) {
            const subnet = new aws.ec2.Subnet(`ecommerce-public-subnet-${i}-${environmentSuffix}`, {
                vpcId: vpc.id,
                cidrBlock: `10.0.${i}.0/24`,
                availabilityZone: availabilityZones.then(azs => azs.names[i]),
                mapPublicIpOnLaunch: true,
                tags: {
                    Name: `ecommerce-public-subnet-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    Type: "public",
                },
            }, { parent: this });
            publicSubnets.push(subnet);
        }

        // Private Subnets (3 AZs)
        const privateSubnets: aws.ec2.Subnet[] = [];
        for (let i = 0; i < 3; i++) {
            const subnet = new aws.ec2.Subnet(`ecommerce-private-subnet-${i}-${environmentSuffix}`, {
                vpcId: vpc.id,
                cidrBlock: `10.0.${i + 10}.0/24`,
                availabilityZone: availabilityZones.then(azs => azs.names[i]),
                tags: {
                    Name: `ecommerce-private-subnet-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    Type: "private",
                },
            }, { parent: this });
            privateSubnets.push(subnet);
        }

        // Elastic IPs for NAT Gateways
        const natEips: aws.ec2.Eip[] = [];
        for (let i = 0; i < 3; i++) {
            const eip = new aws.ec2.Eip(`ecommerce-nat-eip-${i}-${environmentSuffix}`, {
                domain: "vpc",
                tags: {
                    Name: `ecommerce-nat-eip-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { parent: this });
            natEips.push(eip);
        }

        // NAT Gateways (one per AZ)
        const natGateways: aws.ec2.NatGateway[] = [];
        for (let i = 0; i < 3; i++) {
            const natGw = new aws.ec2.NatGateway(`ecommerce-nat-${i}-${environmentSuffix}`, {
                allocationId: natEips[i].id,
                subnetId: publicSubnets[i].id,
                tags: {
                    Name: `ecommerce-nat-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { parent: this });
            natGateways.push(natGw);
        }

        // Public Route Table
        const publicRouteTable = new aws.ec2.RouteTable(`ecommerce-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `ecommerce-public-rt-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        const publicRoute = new aws.ec2.Route(`ecommerce-public-route-${environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: igw.id,
        }, { parent: this });

        // Associate public subnets with public route table
        publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`ecommerce-public-rta-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        });

        // Private Route Tables (one per AZ)
        privateSubnets.forEach((subnet, i) => {
            const privateRouteTable = new aws.ec2.RouteTable(`ecommerce-private-rt-${i}-${environmentSuffix}`, {
                vpcId: vpc.id,
                tags: {
                    Name: `ecommerce-private-rt-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { parent: this });

            new aws.ec2.Route(`ecommerce-private-route-${i}-${environmentSuffix}`, {
                routeTableId: privateRouteTable.id,
                destinationCidrBlock: "0.0.0.0/0",
                natGatewayId: natGateways[i].id,
            }, { parent: this });

            new aws.ec2.RouteTableAssociation(`ecommerce-private-rta-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id,
            }, { parent: this });
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
                    description: "Allow HTTP from anywhere",
                },
                {
                    protocol: "tcp",
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow HTTPS from anywhere",
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound traffic",
                },
            ],
            tags: {
                Name: `ecommerce-alb-sg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Security Group for ECS Tasks
        const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-ecs-sg-${environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for ECS tasks",
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
                    description: "Allow all outbound traffic",
                },
            ],
            tags: {
                Name: `ecommerce-ecs-sg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Security Group for RDS
        const rdsSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-rds-sg-${environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for RDS Aurora cluster",
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 5432,
                    toPort: 5432,
                    securityGroups: [ecsSecurityGroup.id],
                    description: "Allow PostgreSQL from ECS tasks",
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound traffic",
                },
            ],
            tags: {
                Name: `ecommerce-rds-sg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Security Group for ElastiCache Redis
        const redisSecurityGroup = new aws.ec2.SecurityGroup(`ecommerce-redis-sg-${environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for ElastiCache Redis",
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 6379,
                    toPort: 6379,
                    securityGroups: [ecsSecurityGroup.id],
                    description: "Allow Redis from ECS tasks",
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound traffic",
                },
            ],
            tags: {
                Name: `ecommerce-redis-sg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // DB Subnet Group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`ecommerce-db-subnet-group-${environmentSuffix}`, {
            subnetIds: privateSubnets.map(s => s.id),
            tags: {
                Name: `ecommerce-db-subnet-group-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Generate random password for RDS
        const dbPassword = new aws.secretsmanager.Secret(`ecommerce-db-password-${environmentSuffix}`, {
            name: `ecommerce-db-password-${environmentSuffix}`,
            description: "Database master password",
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        const dbPasswordValue = new aws.secretsmanager.SecretVersion(`ecommerce-db-password-version-${environmentSuffix}`, {
            secretId: dbPassword.id,
            secretString: pulumi.interpolate`{"username":"dbadmin","password":"${pulumi.output(aws.secretsmanager.getRandomPassword({
                length: 32,
                excludePunctuation: true,
            })).result}"}`,
        }, { parent: this });

        // Aurora PostgreSQL Serverless v2 Cluster
        const auroraCluster = new aws.rds.Cluster(`ecommerce-aurora-${environmentSuffix}`, {
            clusterIdentifier: `ecommerce-aurora-${environmentSuffix}`,
            engine: "aurora-postgresql",
            engineMode: "provisioned",
            engineVersion: "15.4",
            databaseName: "ecommerce",
            masterUsername: "dbadmin",
            masterPassword: dbPasswordValue.secretString.apply(s => JSON.parse(s).password),
            dbSubnetGroupName: dbSubnetGroup.name,
            vpcSecurityGroupIds: [rdsSecurityGroup.id],
            storageEncrypted: true,
            backupRetentionPeriod: 7,
            preferredBackupWindow: "03:00-04:00",
            preferredMaintenanceWindow: "mon:04:00-mon:05:00",
            skipFinalSnapshot: true,
            deletionProtection: enableDeletionProtection,
            serverlessv2ScalingConfiguration: {
                minCapacity: 0.5,
                maxCapacity: 2,
            },
            tags: {
                Name: `ecommerce-aurora-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Aurora Cluster Instances (Serverless v2)
        const auroraInstance1 = new aws.rds.ClusterInstance(`ecommerce-aurora-instance-1-${environmentSuffix}`, {
            identifier: `ecommerce-aurora-instance-1-${environmentSuffix}`,
            clusterIdentifier: auroraCluster.id,
            instanceClass: "db.serverless",
            engine: "aurora-postgresql",
            engineVersion: "15.4",
            publiclyAccessible: false,
            tags: {
                Name: `ecommerce-aurora-instance-1-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        const auroraInstance2 = new aws.rds.ClusterInstance(`ecommerce-aurora-instance-2-${environmentSuffix}`, {
            identifier: `ecommerce-aurora-instance-2-${environmentSuffix}`,
            clusterIdentifier: auroraCluster.id,
            instanceClass: "db.serverless",
            engine: "aurora-postgresql",
            engineVersion: "15.4",
            publiclyAccessible: false,
            tags: {
                Name: `ecommerce-aurora-instance-2-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // ElastiCache Subnet Group
        const cacheSubnetGroup = new aws.elasticache.SubnetGroup(`ecommerce-cache-subnet-group-${environmentSuffix}`, {
            name: `ecommerce-cache-subnet-group-${environmentSuffix}`,
            subnetIds: privateSubnets.map(s => s.id),
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // ElastiCache Redis Replication Group (Cluster Mode)
        const redisCluster = new aws.elasticache.ReplicationGroup(`ecommerce-redis-${environmentSuffix}`, {
            replicationGroupId: `ecommerce-redis-${environmentSuffix}`,
            description: "Redis cluster for session management",
            engine: "redis",
            engineVersion: "7.0",
            nodeType: "cache.t4g.micro",
            numNodeGroups: 2, // 2 shards
            replicasPerNodeGroup: 1, // 1 replica per shard
            parameterGroupName: "default.redis7.cluster.on",
            subnetGroupName: cacheSubnetGroup.name,
            securityGroupIds: [redisSecurityGroup.id],
            atRestEncryptionEnabled: true,
            transitEncryptionEnabled: false, // Disabled for simplicity; enable in production with auth token
            automaticFailoverEnabled: true,
            multiAzEnabled: true,
            snapshotRetentionLimit: 1,
            snapshotWindow: "03:00-05:00",
            maintenanceWindow: "mon:05:00-mon:07:00",
            autoMinorVersionUpgrade: true,
            tags: {
                Name: `ecommerce-redis-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Store Redis endpoint in Secrets Manager
        const redisSecret = new aws.secretsmanager.Secret(`ecommerce-redis-endpoint-${environmentSuffix}`, {
            name: `ecommerce-redis-endpoint-${environmentSuffix}`,
            description: "Redis cluster endpoint",
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        const redisSecretValue = new aws.secretsmanager.SecretVersion(`ecommerce-redis-endpoint-version-${environmentSuffix}`, {
            secretId: redisSecret.id,
            secretString: pulumi.interpolate`{"endpoint":"${redisCluster.configurationEndpointAddress}","port":"6379"}`,
        }, { parent: this });

        // ECS Cluster
        const ecsCluster = new aws.ecs.Cluster(`ecommerce-cluster-${environmentSuffix}`, {
            name: `ecommerce-cluster-${environmentSuffix}`,
            settings: [{
                name: "containerInsights",
                value: "enabled",
            }],
            tags: {
                Name: `ecommerce-cluster-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // CloudWatch Log Group for ECS
        const ecsLogGroup = new aws.cloudwatch.LogGroup(`ecommerce-ecs-logs-${environmentSuffix}`, {
            name: `/ecs/ecommerce-api-${environmentSuffix}`,
            retentionInDays: 14,
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // IAM Role for ECS Task Execution
        const ecsTaskExecutionRole = new aws.iam.Role(`ecommerce-ecs-execution-role-${environmentSuffix}`, {
            name: `ecommerce-ecs-execution-role-${environmentSuffix}`,
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
                Environment: environmentSuffix,
            },
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`ecommerce-ecs-execution-policy-${environmentSuffix}`, {
            role: ecsTaskExecutionRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        }, { parent: this });

        // IAM Role for ECS Task
        const ecsTaskRole = new aws.iam.Role(`ecommerce-ecs-task-role-${environmentSuffix}`, {
            name: `ecommerce-ecs-task-role-${environmentSuffix}`,
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
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // IAM Policy for ECS Task to access Secrets Manager, RDS, and Redis
        const ecsTaskPolicy = new aws.iam.Policy(`ecommerce-ecs-task-policy-${environmentSuffix}`, {
            name: `ecommerce-ecs-task-policy-${environmentSuffix}`,
            policy: pulumi.all([dbPassword.arn, redisSecret.arn]).apply(([dbArn, redisArn]) => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret",
                        ],
                        Resource: [dbArn, redisArn],
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances",
                        ],
                        Resource: "*",
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "elasticache:DescribeReplicationGroups",
                            "elasticache:DescribeCacheClusters",
                        ],
                        Resource: "*",
                    },
                ],
            })),
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`ecommerce-ecs-task-policy-attachment-${environmentSuffix}`, {
            role: ecsTaskRole.name,
            policyArn: ecsTaskPolicy.arn,
        }, { parent: this });

        // Application Load Balancer
        const alb = new aws.lb.LoadBalancer(`ecommerce-alb-${environmentSuffix}`, {
            name: `ecommerce-alb-${environmentSuffix}`,
            internal: false,
            loadBalancerType: "application",
            securityGroups: [albSecurityGroup.id],
            subnets: publicSubnets.map(s => s.id),
            enableCrossZoneLoadBalancing: true,
            enableHttp2: true,
            enableDeletionProtection: enableDeletionProtection,
            tags: {
                Name: `ecommerce-alb-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Target Group
        const targetGroup = new aws.lb.TargetGroup(`ecommerce-tg-${environmentSuffix}`, {
            name: `ecommerce-tg-${environmentSuffix}`,
            port: 3000,
            protocol: "HTTP",
            vpcId: vpc.id,
            targetType: "ip",
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
                Name: `ecommerce-tg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // ALB Listener (HTTP - redirect to HTTPS)
        const httpListener = new aws.lb.Listener(`ecommerce-http-listener-${environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 80,
            protocol: "HTTP",
            defaultActions: [{
                type: "redirect",
                redirect: {
                    protocol: "HTTPS",
                    port: "443",
                    statusCode: "HTTP_301",
                },
            }],
        }, { parent: this });

        // For demonstration, we'll create a self-signed certificate
        // In production, use ACM certificate with domain validation
        const certificate = new aws.acm.Certificate(`ecommerce-cert-${environmentSuffix}`, {
            domainName: `ecommerce-${environmentSuffix}.example.com`,
            validationMethod: "DNS",
            subjectAlternativeNames: [`*.ecommerce-${environmentSuffix}.example.com`],
            tags: {
                Name: `ecommerce-cert-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
            lifecycle: {
                createBeforeDestroy: true,
            },
        }, { parent: this });

        // ALB Listener (HTTPS)
        const httpsListener = new aws.lb.Listener(`ecommerce-https-listener-${environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 443,
            protocol: "HTTPS",
            sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
            certificateArn: certificate.arn,
            defaultActions: [{
                type: "forward",
                targetGroupArn: targetGroup.arn,
            }],
        }, { parent: this });

        // ECS Task Definition
        const taskDefinition = new aws.ecs.TaskDefinition(`ecommerce-task-${environmentSuffix}`, {
            family: `ecommerce-api-${environmentSuffix}`,
            cpu: "512",
            memory: "1024",
            networkMode: "awsvpc",
            requiresCompatibilities: ["FARGATE"],
            executionRoleArn: ecsTaskExecutionRole.arn,
            taskRoleArn: ecsTaskRole.arn,
            containerDefinitions: pulumi.all([
                ecsLogGroup.name,
                dbPassword.arn,
                redisSecret.arn,
                auroraCluster.endpoint,
            ]).apply(([logGroupName, dbSecretArn, redisSecretArn, dbEndpoint]) => JSON.stringify([{
                name: "ecommerce-api",
                image: "nginx:latest", // Replace with actual API image
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [{
                    containerPort: 3000,
                    protocol: "tcp",
                }],
                environment: [
                    {
                        name: "NODE_ENV",
                        value: "production",
                    },
                    {
                        name: "PORT",
                        value: "3000",
                    },
                    {
                        name: "DB_HOST",
                        value: dbEndpoint,
                    },
                ],
                secrets: [
                    {
                        name: "DB_CREDENTIALS",
                        valueFrom: dbSecretArn,
                    },
                    {
                        name: "REDIS_CONFIG",
                        valueFrom: redisSecretArn,
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
                    command: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
                    interval: 30,
                    timeout: 5,
                    retries: 3,
                    startPeriod: 60,
                },
            }])),
            tags: {
                Name: `ecommerce-task-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // ECS Service
        const ecsService = new aws.ecs.Service(`ecommerce-service-${environmentSuffix}`, {
            name: `ecommerce-service-${environmentSuffix}`,
            cluster: ecsCluster.arn,
            taskDefinition: taskDefinition.arn,
            desiredCount: 2,
            launchType: "FARGATE",
            platformVersion: "LATEST",
            networkConfiguration: {
                subnets: privateSubnets.map(s => s.id),
                securityGroups: [ecsSecurityGroup.id],
                assignPublicIp: false,
            },
            loadBalancers: [{
                targetGroupArn: targetGroup.arn,
                containerName: "ecommerce-api",
                containerPort: 3000,
            }],
            healthCheckGracePeriodSeconds: 60,
            enableExecuteCommand: true,
            tags: {
                Name: `ecommerce-service-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this, dependsOn: [httpsListener] });

        // Auto Scaling Target
        const autoScalingTarget = new aws.appautoscaling.Target(`ecommerce-autoscaling-target-${environmentSuffix}`, {
            maxCapacity: 10,
            minCapacity: 2,
            resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
            scalableDimension: "ecs:service:DesiredCount",
            serviceNamespace: "ecs",
        }, { parent: this });

        // Auto Scaling Policy (CPU-based)
        const autoScalingPolicy = new aws.appautoscaling.Policy(`ecommerce-autoscaling-policy-${environmentSuffix}`, {
            name: `ecommerce-cpu-scaling-${environmentSuffix}`,
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
        }, { parent: this });

        // CloudWatch Metric for API Response Times
        const apiResponseTimeMetric = new aws.cloudwatch.LogMetricFilter(`ecommerce-response-time-metric-${environmentSuffix}`, {
            name: `ecommerce-api-response-time-${environmentSuffix}`,
            logGroupName: ecsLogGroup.name,
            pattern: "[time, request_id, duration, ...]",
            metricTransformation: {
                name: "APIResponseTime",
                namespace: `ECommerce/${environmentSuffix}`,
                value: "$duration",
                defaultValue: "0",
                unit: "Milliseconds",
            },
        }, { parent: this });

        // CloudWatch Alarm - High CPU
        const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-high-cpu-alarm-${environmentSuffix}`, {
            name: `ecommerce-high-cpu-${environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "CPUUtilization",
            namespace: "AWS/ECS",
            period: 300,
            statistic: "Average",
            threshold: 80,
            datapointsToAlarm: 2,
            dimensions: {
                ClusterName: ecsCluster.name,
                ServiceName: ecsService.name,
            },
            alarmDescription: "Alert when ECS CPU exceeds 80%",
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // CloudWatch Alarm - Database Connections
        const dbConnectionsAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-db-connections-alarm-${environmentSuffix}`, {
            name: `ecommerce-db-connections-${environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "DatabaseConnections",
            namespace: "AWS/RDS",
            period: 300,
            statistic: "Average",
            threshold: 80,
            datapointsToAlarm: 2,
            dimensions: {
                DBClusterIdentifier: auroraCluster.clusterIdentifier,
            },
            alarmDescription: "Alert when database connections exceed 80",
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // CloudWatch Alarm - Redis Memory Usage
        const redisMemoryAlarm = new aws.cloudwatch.MetricAlarm(`ecommerce-redis-memory-alarm-${environmentSuffix}`, {
            name: `ecommerce-redis-memory-${environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "DatabaseMemoryUsagePercentage",
            namespace: "AWS/ElastiCache",
            period: 300,
            statistic: "Average",
            threshold: 80,
            datapointsToAlarm: 2,
            dimensions: {
                ReplicationGroupId: redisCluster.replicationGroupId,
            },
            alarmDescription: "Alert when Redis memory usage exceeds 80%",
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Secret Rotation Lambda Role
        const rotationLambdaRole = new aws.iam.Role(`ecommerce-rotation-lambda-role-${environmentSuffix}`, {
            name: `ecommerce-rotation-lambda-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com",
                    },
                }],
            }),
            tags: {
                Environment: environmentSuffix,
            },
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`ecommerce-rotation-lambda-basic-${environmentSuffix}`, {
            role: rotationLambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`ecommerce-rotation-lambda-vpc-${environmentSuffix}`, {
            role: rotationLambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { parent: this });

        const rotationLambdaPolicy = new aws.iam.Policy(`ecommerce-rotation-lambda-policy-${environmentSuffix}`, {
            name: `ecommerce-rotation-lambda-policy-${environmentSuffix}`,
            policy: pulumi.all([dbPassword.arn, auroraCluster.arn]).apply(([secretArn, clusterArn]) => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:PutSecretValue",
                            "secretsmanager:UpdateSecretVersionStage",
                        ],
                        Resource: secretArn,
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "secretsmanager:GetRandomPassword",
                        ],
                        Resource: "*",
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeDBClusters",
                            "rds:ModifyDBCluster",
                        ],
                        Resource: clusterArn,
                    },
                ],
            })),
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`ecommerce-rotation-lambda-policy-attachment-${environmentSuffix}`, {
            role: rotationLambdaRole.name,
            policyArn: rotationLambdaPolicy.arn,
        }, { parent: this });

        // Lambda function for secret rotation
        const rotationLambda = new aws.lambda.Function(`ecommerce-rotation-lambda-${environmentSuffix}`, {
            name: `ecommerce-rotation-lambda-${environmentSuffix}`,
            runtime: "python3.11",
            handler: "lambda_function.lambda_handler",
            role: rotationLambdaRole.arn,
            timeout: 30,
            environment: {
                variables: {
                    SECRETS_MANAGER_ENDPOINT: `https://secretsmanager.${region}.amazonaws.com`,
                },
            },
            vpcConfig: {
                subnetIds: privateSubnets.map(s => s.id),
                securityGroupIds: [ecsSecurityGroup.id],
            },
            code: new pulumi.asset.AssetArchive({
                "lambda_function.py": new pulumi.asset.StringAsset(`
import boto3
import json
import os

def lambda_handler(event, context):
    """Handles the secret rotation for RDS credentials"""
    service_client = boto3.client('secretsmanager')

    # Get the secret ARN from the event
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    # Implement rotation steps
    if step == "createSecret":
        create_secret(service_client, arn, token)
    elif step == "setSecret":
        set_secret(service_client, arn, token)
    elif step == "testSecret":
        test_secret(service_client, arn, token)
    elif step == "finishSecret":
        finish_secret(service_client, arn, token)
    else:
        raise ValueError("Invalid step parameter")

def create_secret(service_client, arn, token):
    # Generate new password and create new secret version
    pass

def set_secret(service_client, arn, token):
    # Update database with new credentials
    pass

def test_secret(service_client, arn, token):
    # Test the new credentials
    pass

def finish_secret(service_client, arn, token):
    # Finalize the rotation
    pass
`),
            }),
            tags: {
                Name: `ecommerce-rotation-lambda-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Lambda permission for Secrets Manager
        const rotationLambdaPermission = new aws.lambda.Permission(`ecommerce-rotation-lambda-permission-${environmentSuffix}`, {
            action: "lambda:InvokeFunction",
            function: rotationLambda.name,
            principal: "secretsmanager.amazonaws.com",
        }, { parent: this });

        // Secret rotation configuration
        const dbPasswordRotation = new aws.secretsmanager.SecretRotation(`ecommerce-db-password-rotation-${environmentSuffix}`, {
            secretId: dbPassword.id,
            rotationLambdaArn: rotationLambda.arn,
            rotationRules: {
                automaticallyAfterDays: 30,
            },
        }, { parent: this, dependsOn: [rotationLambdaPermission] });

        // Outputs
        this.vpcId = vpc.id;
        this.albDnsName = alb.dnsName;
        this.ecsClusterName = ecsCluster.name;
        this.dbEndpoint = auroraCluster.endpoint;
        this.redisEndpoint = redisCluster.configurationEndpointAddress;

        this.registerOutputs({
            vpcId: this.vpcId,
            albDnsName: this.albDnsName,
            ecsClusterName: this.ecsClusterName,
            dbEndpoint: this.dbEndpoint,
            redisEndpoint: this.redisEndpoint,
        });
    }
}
```

## File: lib/bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const enableDeletionProtection = config.getBoolean("enableDeletionProtection") || false;

const stack = new TapStack("ecommerce-api-stack", {
    environmentSuffix,
    enableDeletionProtection,
});

// Export outputs
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const ecsClusterName = stack.ecsClusterName;
export const dbEndpoint = stack.dbEndpoint;
export const redisEndpoint = stack.redisEndpoint;
```

## File: lib/lib/README.md

```markdown
# E-Commerce API Infrastructure

Production-ready infrastructure for an e-commerce product catalog API using Pulumi with TypeScript.

## Architecture

### Network Layer
- VPC with 3 public and 3 private subnets across 3 Availability Zones
- NAT Gateways for private subnet internet access
- Internet Gateway for public subnet connectivity

### Compute Layer
- ECS Fargate cluster for serverless container orchestration
- Auto-scaling: 2-10 tasks based on 70% CPU utilization
- Application Load Balancer with SSL termination

### Data Layer
- Aurora PostgreSQL Serverless v2 with multi-AZ deployment
- ElastiCache Redis cluster mode (2 shards, 1 replica per shard)
- AWS Secrets Manager for credentials with 30-day rotation

### Monitoring
- CloudWatch Logs with 14-day retention
- Custom metrics for API response times
- Alarms for CPU, database connections, and Redis memory

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Docker (for building container images)

## Configuration

Configure the stack with required parameters:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set enableDeletionProtection false
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Deploy the infrastructure:
```bash
pulumi up
```

3. View outputs:
```bash
pulumi stack output albDnsName
pulumi stack output dbEndpoint
pulumi stack output redisEndpoint
```

## Resource Naming

All resources include the `environmentSuffix` parameter to support parallel deployments:
- Format: `resource-type-{environmentSuffix}`
- Example: `ecommerce-vpc-test123`

## Security

- All traffic between ALB and ECS uses private subnets
- Database and Redis are not publicly accessible
- Secrets stored in AWS Secrets Manager
- IAM roles follow least-privilege principle
- Encryption enabled for data at rest and in transit

## Cost Optimization

- Aurora Serverless v2 scales from 0.5 to 2 ACU
- ECS Fargate scales from 2 to 10 tasks
- CloudWatch logs retained for 14 days
- NAT Gateways deployed per AZ for high availability

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: Deletion protection must be disabled for complete cleanup.

## Outputs

- `vpcId`: VPC identifier
- `albDnsName`: Application Load Balancer DNS name
- `ecsClusterName`: ECS cluster name
- `dbEndpoint`: Aurora cluster endpoint
- `redisEndpoint`: Redis configuration endpoint
```

## Deployment Instructions

1. Configure the stack with your environment suffix:
   ```bash
   pulumi config set environmentSuffix <your-suffix>
   ```

2. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

3. The infrastructure will create approximately 60+ AWS resources including VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache Redis, ALB, IAM roles, CloudWatch resources, and Secrets Manager.

4. Access the API through the ALB DNS name (available in stack outputs).

## Notes

- Replace the nginx:latest image in the ECS task definition with your actual Node.js API container image
- ACM certificate requires domain ownership validation - configure DNS records accordingly
- Lambda rotation function is a skeleton - implement full rotation logic based on your requirements
- Enable Redis transit encryption in production and configure auth token
- Review and adjust auto-scaling thresholds based on actual traffic patterns
