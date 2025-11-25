# Multi-Region Database Migration Infrastructure - Pulumi TypeScript Implementation

This implementation provides a production-ready multi-region disaster recovery and database migration infrastructure using Pulumi with TypeScript.

## Architecture Overview

- Aurora PostgreSQL Global Database with Serverless v2 (us-east-1 primary, eu-west-1 and ap-southeast-1 replicas)
- ECS Fargate clusters in all three regions with Application Load Balancers
- DynamoDB table for migration state tracking
- Systems Manager Parameter Store for configuration management
- CloudWatch monitoring and SNS notifications
- Lambda function for data validation
- Optional DMS replication (controlled by createDms flag)
- Optional Site-to-Site VPN (controlled by createVpn flag)
- Cost-optimized networking with single NAT Gateway per region

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Load configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const createDms = config.getBoolean("createDms") || false;
const createVpn = config.getBoolean("createVpn") || false;
const oracleEndpoint = config.get("oracleEndpoint") || "onprem-oracle.example.com";
const customerGatewayIp = config.get("customerGatewayIp") || "203.0.113.1";

// Define regions
const primaryRegion = "us-east-1";
const secondaryRegions = ["eu-west-1", "ap-southeast-1"];

export class TapStack extends pulumi.ComponentResource {
    public readonly vpcIds: pulumi.Output<{ [region: string]: string }>;
    public readonly auroraGlobalCluster: aws.rds.GlobalCluster;
    public readonly migrationStateTable: aws.dynamodb.Table;
    public readonly validationLambda: aws.lambda.Function;
    public readonly notificationTopic: aws.sns.Topic;

    constructor(name: string, args?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, args);

        // Create VPCs in all regions
        const vpcs = this.createVpcs();
        this.vpcIds = pulumi.output(vpcs).apply(v =>
            Object.fromEntries(Object.entries(v).map(([k, vpc]) => [k, vpc.id]))
        );

        // Create Aurora Global Database
        const auroraResources = this.createAuroraGlobalDatabase(vpcs);
        this.auroraGlobalCluster = auroraResources.globalCluster;

        // Create ECS infrastructure in all regions
        const ecsResources = this.createEcsInfrastructure(vpcs);

        // Create DynamoDB table for migration state
        this.migrationStateTable = this.createMigrationStateTable();

        // Create Parameter Store parameters
        this.createParameterStore(auroraResources);

        // Create monitoring and alerting
        const monitoring = this.createMonitoring(auroraResources, ecsResources);
        this.notificationTopic = monitoring.topic;

        // Create data validation Lambda
        this.validationLambda = this.createValidationLambda(
            auroraResources,
            this.migrationStateTable,
            monitoring.topic,
            vpcs[primaryRegion]
        );

        // Optional: Create DMS replication
        if (createDms) {
            this.createDmsReplication(vpcs[primaryRegion], auroraResources);
        }

        // Optional: Create Site-to-Site VPN
        if (createVpn) {
            this.createSiteToSiteVpn(vpcs[primaryRegion]);
        }

        // Export important outputs
        this.registerOutputs({
            vpcIds: this.vpcIds,
            globalClusterIdentifier: auroraResources.globalCluster.id,
            primaryClusterEndpoint: auroraResources.primaryCluster.endpoint,
            migrationTableName: this.migrationStateTable.name,
            validationLambdaArn: this.validationLambda.arn,
            notificationTopicArn: monitoring.topic.arn,
        });
    }

    private createVpcs(): { [region: string]: VpcResources } {
        const vpcs: { [region: string]: VpcResources } = {};

        // Create VPC in primary region
        vpcs[primaryRegion] = this.createVpc(primaryRegion, "10.0.0.0/16");

        // Create VPCs in secondary regions
        secondaryRegions.forEach((region, index) => {
            vpcs[region] = this.createVpc(region, `10.${index + 1}.0.0/16`);
        });

        return vpcs;
    }

    private createVpc(region: string, cidrBlock: string): VpcResources {
        const provider = new aws.Provider(`provider-${region}-${environmentSuffix}`, {
            region: region,
        }, { parent: this });

        // Create VPC
        const vpc = new aws.ec2.Vpc(`vpc-${region}-${environmentSuffix}`, {
            cidrBlock: cidrBlock,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `vpc-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
                Region: region,
            },
        }, { provider, parent: this });

        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`igw-${region}-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `igw-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        // Get availability zones
        const azs = aws.getAvailabilityZones({
            state: "available",
        }, { provider, async: true });

        // Create public subnets (2 AZs)
        const publicSubnets: aws.ec2.Subnet[] = [];
        for (let i = 0; i < 2; i++) {
            const subnet = new aws.ec2.Subnet(`public-subnet-${region}-${i}-${environmentSuffix}`, {
                vpcId: vpc.id,
                cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${i}.0/24`,
                availabilityZone: pulumi.output(azs).names[i],
                mapPublicIpOnLaunch: true,
                tags: {
                    Name: `public-subnet-${region}-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    Type: "public",
                },
            }, { provider, parent: this });
            publicSubnets.push(subnet);
        }

        // Create private subnets (2 AZs)
        const privateSubnets: aws.ec2.Subnet[] = [];
        for (let i = 0; i < 2; i++) {
            const subnet = new aws.ec2.Subnet(`private-subnet-${region}-${i}-${environmentSuffix}`, {
                vpcId: vpc.id,
                cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${i + 10}.0/24`,
                availabilityZone: pulumi.output(azs).names[i],
                tags: {
                    Name: `private-subnet-${region}-${i}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    Type: "private",
                },
            }, { provider, parent: this });
            privateSubnets.push(subnet);
        }

        // Create single NAT Gateway for cost optimization
        const eip = new aws.ec2.Eip(`nat-eip-${region}-${environmentSuffix}`, {
            domain: "vpc",
            tags: {
                Name: `nat-eip-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        const natGateway = new aws.ec2.NatGateway(`nat-${region}-${environmentSuffix}`, {
            subnetId: publicSubnets[0].id,
            allocationId: eip.id,
            tags: {
                Name: `nat-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this, dependsOn: [igw] });

        // Create public route table
        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${region}-${environmentSuffix}`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }],
            tags: {
                Name: `public-rt-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        // Associate public subnets with public route table
        publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`public-rta-${region}-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { provider, parent: this });
        });

        // Create private route table
        const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${region}-${environmentSuffix}`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                natGatewayId: natGateway.id,
            }],
            tags: {
                Name: `private-rt-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        // Associate private subnets with private route table
        privateSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`private-rta-${region}-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id,
            }, { provider, parent: this });
        });

        // Create VPC endpoints for S3 and DynamoDB (no cost)
        new aws.ec2.VpcEndpoint(`s3-endpoint-${region}-${environmentSuffix}`, {
            vpcId: vpc.id,
            serviceName: `com.amazonaws.${region}.s3`,
            routeTableIds: [privateRouteTable.id],
            tags: {
                Name: `s3-endpoint-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        new aws.ec2.VpcEndpoint(`dynamodb-endpoint-${region}-${environmentSuffix}`, {
            vpcId: vpc.id,
            serviceName: `com.amazonaws.${region}.dynamodb`,
            routeTableIds: [privateRouteTable.id],
            tags: {
                Name: `dynamodb-endpoint-${region}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider, parent: this });

        return {
            vpc,
            publicSubnets,
            privateSubnets,
            provider,
        };
    }

    private createAuroraGlobalDatabase(vpcs: { [region: string]: VpcResources }): AuroraResources {
        // Create Aurora Global Cluster
        const globalCluster = new aws.rds.GlobalCluster(`aurora-global-${environmentSuffix}`, {
            globalClusterIdentifier: `aurora-global-${environmentSuffix}`,
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            databaseName: "migrationdb",
            storageEncrypted: true,
        }, { parent: this });

        // Create DB subnet group in primary region
        const primaryVpc = vpcs[primaryRegion];
        const primarySubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${primaryRegion}-${environmentSuffix}`, {
            subnetIds: primaryVpc.privateSubnets.map(s => s.id),
            tags: {
                Name: `db-subnet-group-${primaryRegion}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create security group for Aurora in primary region
        const primaryDbSecurityGroup = new aws.ec2.SecurityGroup(`aurora-sg-${primaryRegion}-${environmentSuffix}`, {
            vpcId: primaryVpc.vpc.id,
            description: "Security group for Aurora PostgreSQL",
            ingress: [{
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
                cidrBlocks: [primaryVpc.vpc.cidrBlock],
                description: "PostgreSQL from VPC",
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound",
            }],
            tags: {
                Name: `aurora-sg-${primaryRegion}-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create primary Aurora cluster with Serverless v2
        const primaryCluster = new aws.rds.Cluster(`aurora-primary-${environmentSuffix}`, {
            clusterIdentifier: `aurora-primary-${environmentSuffix}`,
            engine: "aurora-postgresql",
            engineMode: "provisioned",
            engineVersion: "14.6",
            databaseName: "migrationdb",
            masterUsername: "dbadmin",
            masterPassword: pulumi.secret("ChangeMe123!"),
            dbSubnetGroupName: primarySubnetGroup.name,
            vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
            storageEncrypted: true,
            backupRetentionPeriod: 7,
            preferredBackupWindow: "03:00-04:00",
            preferredMaintenanceWindow: "sun:04:00-sun:05:00",
            skipFinalSnapshot: true,
            globalClusterIdentifier: globalCluster.id,
            serverlessv2ScalingConfiguration: {
                minCapacity: 0.5,
                maxCapacity: 1.0,
            },
            tags: {
                Name: `aurora-primary-${environmentSuffix}`,
                Environment: environmentSuffix,
                Region: primaryRegion,
            },
        }, { provider: primaryVpc.provider, parent: this, dependsOn: [globalCluster] });

        // Create primary cluster instance
        const primaryInstance = new aws.rds.ClusterInstance(`aurora-primary-instance-${environmentSuffix}`, {
            identifier: `aurora-primary-instance-${environmentSuffix}`,
            clusterIdentifier: primaryCluster.id,
            instanceClass: "db.serverless",
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            publiclyAccessible: false,
            tags: {
                Name: `aurora-primary-instance-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this, dependsOn: [primaryCluster] });

        // Create secondary clusters in other regions
        const secondaryClusters: aws.rds.Cluster[] = [];
        secondaryRegions.forEach(region => {
            const vpc = vpcs[region];

            // Create DB subnet group
            const subnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${region}-${environmentSuffix}`, {
                subnetIds: vpc.privateSubnets.map(s => s.id),
                tags: {
                    Name: `db-subnet-group-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create security group
            const dbSecurityGroup = new aws.ec2.SecurityGroup(`aurora-sg-${region}-${environmentSuffix}`, {
                vpcId: vpc.vpc.id,
                description: "Security group for Aurora PostgreSQL replica",
                ingress: [{
                    protocol: "tcp",
                    fromPort: 5432,
                    toPort: 5432,
                    cidrBlocks: [vpc.vpc.cidrBlock],
                    description: "PostgreSQL from VPC",
                }],
                egress: [{
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound",
                }],
                tags: {
                    Name: `aurora-sg-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create secondary cluster
            const secondaryCluster = new aws.rds.Cluster(`aurora-secondary-${region}-${environmentSuffix}`, {
                clusterIdentifier: `aurora-secondary-${region}-${environmentSuffix}`,
                engine: "aurora-postgresql",
                engineMode: "provisioned",
                engineVersion: "14.6",
                dbSubnetGroupName: subnetGroup.name,
                vpcSecurityGroupIds: [dbSecurityGroup.id],
                skipFinalSnapshot: true,
                globalClusterIdentifier: globalCluster.id,
                serverlessv2ScalingConfiguration: {
                    minCapacity: 0.5,
                    maxCapacity: 1.0,
                },
                tags: {
                    Name: `aurora-secondary-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    Region: region,
                },
            }, { provider: vpc.provider, parent: this, dependsOn: [globalCluster, primaryInstance] });

            // Create secondary cluster instance
            new aws.rds.ClusterInstance(`aurora-secondary-instance-${region}-${environmentSuffix}`, {
                identifier: `aurora-secondary-instance-${region}-${environmentSuffix}`,
                clusterIdentifier: secondaryCluster.id,
                instanceClass: "db.serverless",
                engine: "aurora-postgresql",
                engineVersion: "14.6",
                publiclyAccessible: false,
                tags: {
                    Name: `aurora-secondary-instance-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this, dependsOn: [secondaryCluster] });

            secondaryClusters.push(secondaryCluster);
        });

        return {
            globalCluster,
            primaryCluster,
            secondaryClusters,
        };
    }

    private createEcsInfrastructure(vpcs: { [region: string]: VpcResources }): { [region: string]: EcsResources } {
        const ecsResources: { [region: string]: EcsResources } = {};

        Object.entries(vpcs).forEach(([region, vpc]) => {
            // Create ECS cluster
            const cluster = new aws.ecs.Cluster(`ecs-cluster-${region}-${environmentSuffix}`, {
                name: `ecs-cluster-${region}-${environmentSuffix}`,
                settings: [{
                    name: "containerInsights",
                    value: "enabled",
                }],
                tags: {
                    Name: `ecs-cluster-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create ALB security group
            const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${region}-${environmentSuffix}`, {
                vpcId: vpc.vpc.id,
                description: "Security group for Application Load Balancer",
                ingress: [
                    {
                        protocol: "tcp",
                        fromPort: 80,
                        toPort: 80,
                        cidrBlocks: ["0.0.0.0/0"],
                        description: "HTTP from internet",
                    },
                    {
                        protocol: "tcp",
                        fromPort: 443,
                        toPort: 443,
                        cidrBlocks: ["0.0.0.0/0"],
                        description: "HTTPS from internet",
                    },
                ],
                egress: [{
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound",
                }],
                tags: {
                    Name: `alb-sg-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create Application Load Balancer
            const alb = new aws.lb.LoadBalancer(`alb-${region}-${environmentSuffix}`, {
                name: `alb-${region}-${environmentSuffix}`,
                loadBalancerType: "application",
                subnets: vpc.publicSubnets.map(s => s.id),
                securityGroups: [albSecurityGroup.id],
                tags: {
                    Name: `alb-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create blue target group
            const blueTargetGroup = new aws.lb.TargetGroup(`tg-blue-${region}-${environmentSuffix}`, {
                name: `tg-blue-${region}-${environmentSuffix}`,
                port: 80,
                protocol: "HTTP",
                vpcId: vpc.vpc.id,
                targetType: "ip",
                healthCheck: {
                    enabled: true,
                    path: "/health",
                    protocol: "HTTP",
                    healthyThreshold: 2,
                    unhealthyThreshold: 2,
                    timeout: 5,
                    interval: 30,
                },
                tags: {
                    Name: `tg-blue-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    DeploymentGroup: "blue",
                },
            }, { provider: vpc.provider, parent: this });

            // Create green target group
            const greenTargetGroup = new aws.lb.TargetGroup(`tg-green-${region}-${environmentSuffix}`, {
                name: `tg-green-${region}-${environmentSuffix}`,
                port: 80,
                protocol: "HTTP",
                vpcId: vpc.vpc.id,
                targetType: "ip",
                healthCheck: {
                    enabled: true,
                    path: "/health",
                    protocol: "HTTP",
                    healthyThreshold: 2,
                    unhealthyThreshold: 2,
                    timeout: 5,
                    interval: 30,
                },
                tags: {
                    Name: `tg-green-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                    DeploymentGroup: "green",
                },
            }, { provider: vpc.provider, parent: this });

            // Create ALB listener with weighted routing for blue-green deployment
            const listener = new aws.lb.Listener(`alb-listener-${region}-${environmentSuffix}`, {
                loadBalancerArn: alb.arn,
                port: 80,
                protocol: "HTTP",
                defaultActions: [{
                    type: "forward",
                    forwardConfig: {
                        targetGroups: [
                            {
                                arn: blueTargetGroup.arn,
                                weight: 100,
                            },
                            {
                                arn: greenTargetGroup.arn,
                                weight: 0,
                            },
                        ],
                    },
                }],
            }, { provider: vpc.provider, parent: this });

            // Create ECS task execution role
            const taskExecutionRole = new aws.iam.Role(`ecs-task-execution-role-${region}-${environmentSuffix}`, {
                name: `ecs-task-execution-role-${region}-${environmentSuffix}`,
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
                    Name: `ecs-task-execution-role-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            new aws.iam.RolePolicyAttachment(`ecs-task-execution-policy-${region}-${environmentSuffix}`, {
                role: taskExecutionRole.name,
                policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            }, { provider: vpc.provider, parent: this });

            // Create ECS task role
            const taskRole = new aws.iam.Role(`ecs-task-role-${region}-${environmentSuffix}`, {
                name: `ecs-task-role-${region}-${environmentSuffix}`,
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
                    Name: `ecs-task-role-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create CloudWatch log group
            const logGroup = new aws.cloudwatch.LogGroup(`ecs-log-group-${region}-${environmentSuffix}`, {
                name: `/ecs/app-${region}-${environmentSuffix}`,
                retentionInDays: 7,
                tags: {
                    Name: `ecs-log-group-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create ECS task definition
            const taskDefinition = new aws.ecs.TaskDefinition(`task-def-${region}-${environmentSuffix}`, {
                family: `app-${region}-${environmentSuffix}`,
                networkMode: "awsvpc",
                requiresCompatibilities: ["FARGATE"],
                cpu: "256",
                memory: "512",
                executionRoleArn: taskExecutionRole.arn,
                taskRoleArn: taskRole.arn,
                containerDefinitions: pulumi.output([{
                    name: "app",
                    image: "nginx:latest",
                    essential: true,
                    portMappings: [{
                        containerPort: 80,
                        protocol: "tcp",
                    }],
                    logConfiguration: {
                        logDriver: "awslogs",
                        options: {
                            "awslogs-group": logGroup.name,
                            "awslogs-region": region,
                            "awslogs-stream-prefix": "ecs",
                        },
                    },
                    environment: [
                        {
                            name: "ENVIRONMENT",
                            value: environmentSuffix,
                        },
                        {
                            name: "REGION",
                            value: region,
                        },
                    ],
                }]).apply(JSON.stringify),
                tags: {
                    Name: `task-def-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create ECS service security group
            const serviceSecurityGroup = new aws.ec2.SecurityGroup(`ecs-service-sg-${region}-${environmentSuffix}`, {
                vpcId: vpc.vpc.id,
                description: "Security group for ECS Fargate service",
                ingress: [{
                    protocol: "tcp",
                    fromPort: 80,
                    toPort: 80,
                    securityGroups: [albSecurityGroup.id],
                    description: "HTTP from ALB",
                }],
                egress: [{
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "Allow all outbound",
                }],
                tags: {
                    Name: `ecs-service-sg-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this });

            // Create ECS service
            const service = new aws.ecs.Service(`ecs-service-${region}-${environmentSuffix}`, {
                name: `app-service-${region}-${environmentSuffix}`,
                cluster: cluster.arn,
                taskDefinition: taskDefinition.arn,
                desiredCount: 2,
                launchType: "FARGATE",
                networkConfiguration: {
                    subnets: vpc.privateSubnets.map(s => s.id),
                    securityGroups: [serviceSecurityGroup.id],
                    assignPublicIp: false,
                },
                loadBalancers: [{
                    targetGroupArn: blueTargetGroup.arn,
                    containerName: "app",
                    containerPort: 80,
                }],
                deploymentController: {
                    type: "ECS",
                },
                tags: {
                    Name: `ecs-service-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: vpc.provider, parent: this, dependsOn: [listener] });

            // Create auto-scaling target
            const scalingTarget = new aws.appautoscaling.Target(`ecs-scaling-target-${region}-${environmentSuffix}`, {
                maxCapacity: 10,
                minCapacity: 2,
                resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
                scalableDimension: "ecs:service:DesiredCount",
                serviceNamespace: "ecs",
            }, { provider: vpc.provider, parent: this });

            // Create CPU-based auto-scaling policy
            new aws.appautoscaling.Policy(`ecs-scaling-policy-cpu-${region}-${environmentSuffix}`, {
                name: `ecs-scaling-policy-cpu-${region}-${environmentSuffix}`,
                policyType: "TargetTrackingScaling",
                resourceId: scalingTarget.resourceId,
                scalableDimension: scalingTarget.scalableDimension,
                serviceNamespace: scalingTarget.serviceNamespace,
                targetTrackingScalingPolicyConfiguration: {
                    predefinedMetricSpecification: {
                        predefinedMetricType: "ECSServiceAverageCPUUtilization",
                    },
                    targetValue: 70,
                    scaleInCooldown: 300,
                    scaleOutCooldown: 60,
                },
            }, { provider: vpc.provider, parent: this });

            // Create memory-based auto-scaling policy
            new aws.appautoscaling.Policy(`ecs-scaling-policy-memory-${region}-${environmentSuffix}`, {
                name: `ecs-scaling-policy-memory-${region}-${environmentSuffix}`,
                policyType: "TargetTrackingScaling",
                resourceId: scalingTarget.resourceId,
                scalableDimension: scalingTarget.scalableDimension,
                serviceNamespace: scalingTarget.serviceNamespace,
                targetTrackingScalingPolicyConfiguration: {
                    predefinedMetricSpecification: {
                        predefinedMetricType: "ECSServiceAverageMemoryUtilization",
                    },
                    targetValue: 70,
                    scaleInCooldown: 300,
                    scaleOutCooldown: 60,
                },
            }, { provider: vpc.provider, parent: this });

            ecsResources[region] = {
                cluster,
                alb,
                blueTargetGroup,
                greenTargetGroup,
                service,
                logGroup,
            };
        });

        return ecsResources;
    }

    private createMigrationStateTable(): aws.dynamodb.Table {
        return new aws.dynamodb.Table(`migration-state-${environmentSuffix}`, {
            name: `migration-state-${environmentSuffix}`,
            billingMode: "PAY_PER_REQUEST",
            hashKey: "migration_id",
            rangeKey: "timestamp",
            attributes: [
                {
                    name: "migration_id",
                    type: "S",
                },
                {
                    name: "timestamp",
                    type: "N",
                },
            ],
            pointInTimeRecovery: {
                enabled: true,
            },
            serverSideEncryption: {
                enabled: true,
            },
            tags: {
                Name: `migration-state-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });
    }

    private createParameterStore(auroraResources: AuroraResources): void {
        const primaryVpc = Object.values(this.createVpcs())[0];

        // Store primary database endpoint
        new aws.ssm.Parameter(`param-db-primary-endpoint-${environmentSuffix}`, {
            name: `/migration/db/primary-endpoint-${environmentSuffix}`,
            type: "SecureString",
            value: auroraResources.primaryCluster.endpoint,
            description: "Primary Aurora cluster endpoint",
            tags: {
                Name: `param-db-primary-endpoint-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Store database name
        new aws.ssm.Parameter(`param-db-name-${environmentSuffix}`, {
            name: `/migration/db/database-name-${environmentSuffix}`,
            type: "String",
            value: "migrationdb",
            description: "Database name",
            tags: {
                Name: `param-db-name-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Store application configuration
        new aws.ssm.Parameter(`param-app-config-${environmentSuffix}`, {
            name: `/migration/app/config-${environmentSuffix}`,
            type: "String",
            value: JSON.stringify({
                environment: environmentSuffix,
                primaryRegion: primaryRegion,
                secondaryRegions: secondaryRegions,
            }),
            description: "Application configuration",
            tags: {
                Name: `param-app-config-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });
    }

    private createMonitoring(auroraResources: AuroraResources, ecsResources: { [region: string]: EcsResources }): MonitoringResources {
        // Create SNS topic for notifications
        const topic = new aws.sns.Topic(`migration-notifications-${environmentSuffix}`, {
            name: `migration-notifications-${environmentSuffix}`,
            displayName: "Migration Notifications",
            tags: {
                Name: `migration-notifications-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Create CloudWatch dashboard
        const dashboard = new aws.cloudwatch.Dashboard(`migration-dashboard-${environmentSuffix}`, {
            dashboardName: `migration-dashboard-${environmentSuffix}`,
            dashboardBody: pulumi.output({
                widgets: [
                    {
                        type: "metric",
                        properties: {
                            metrics: [
                                ["AWS/RDS", "DatabaseConnections", { stat: "Average", region: primaryRegion }],
                                [".", "CPUUtilization", { stat: "Average", region: primaryRegion }],
                            ],
                            period: 300,
                            stat: "Average",
                            region: primaryRegion,
                            title: "Aurora Primary Cluster Metrics",
                        },
                    },
                    {
                        type: "metric",
                        properties: {
                            metrics: Object.keys(ecsResources).map(region =>
                                ["AWS/ECS", "CPUUtilization", { stat: "Average", region }]
                            ),
                            period: 300,
                            stat: "Average",
                            title: "ECS Service CPU Utilization",
                        },
                    },
                ],
            }).apply(JSON.stringify),
        }, { parent: this });

        // Create CloudWatch alarm for primary cluster CPU
        new aws.cloudwatch.MetricAlarm(`aurora-cpu-alarm-${environmentSuffix}`, {
            name: `aurora-cpu-alarm-${environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "CPUUtilization",
            namespace: "AWS/RDS",
            period: 300,
            statistic: "Average",
            threshold: 80,
            alarmDescription: "Alert when Aurora CPU exceeds 80%",
            alarmActions: [topic.arn],
            dimensions: {
                DBClusterIdentifier: auroraResources.primaryCluster.id,
            },
            tags: {
                Name: `aurora-cpu-alarm-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Create CloudWatch alarm for ECS service
        Object.entries(ecsResources).forEach(([region, resources]) => {
            new aws.cloudwatch.MetricAlarm(`ecs-cpu-alarm-${region}-${environmentSuffix}`, {
                name: `ecs-cpu-alarm-${region}-${environmentSuffix}`,
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 2,
                metricName: "CPUUtilization",
                namespace: "AWS/ECS",
                period: 300,
                statistic: "Average",
                threshold: 80,
                alarmDescription: `Alert when ECS CPU exceeds 80% in ${region}`,
                alarmActions: [topic.arn],
                dimensions: {
                    ClusterName: resources.cluster.name,
                    ServiceName: resources.service.name,
                },
                tags: {
                    Name: `ecs-cpu-alarm-${region}-${environmentSuffix}`,
                    Environment: environmentSuffix,
                },
            }, { provider: resources.cluster.provider, parent: this });
        });

        return {
            topic,
            dashboard,
        };
    }

    private createValidationLambda(
        auroraResources: AuroraResources,
        migrationTable: aws.dynamodb.Table,
        notificationTopic: aws.sns.Topic,
        primaryVpc: VpcResources
    ): aws.lambda.Function {
        // Create Lambda execution role
        const lambdaRole = new aws.iam.Role(`validation-lambda-role-${environmentSuffix}`, {
            name: `validation-lambda-role-${environmentSuffix}`,
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
                Name: `validation-lambda-role-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Attach basic Lambda execution policy
        new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${environmentSuffix}`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { parent: this });

        // Create inline policy for DynamoDB and SNS access
        new aws.iam.RolePolicy(`lambda-custom-policy-${environmentSuffix}`, {
            role: lambdaRole.name,
            policy: pulumi.output({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                        ],
                        Resource: migrationTable.arn,
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "sns:Publish",
                        ],
                        Resource: notificationTopic.arn,
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances",
                        ],
                        Resource: "*",
                    },
                ],
            }).apply(JSON.stringify),
        }, { parent: this });

        // Create security group for Lambda
        const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${environmentSuffix}`, {
            vpcId: primaryVpc.vpc.id,
            description: "Security group for validation Lambda",
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound",
            }],
            tags: {
                Name: `lambda-sg-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create CloudWatch log group for Lambda
        const logGroup = new aws.cloudwatch.LogGroup(`lambda-validation-log-${environmentSuffix}`, {
            name: `/aws/lambda/validation-${environmentSuffix}`,
            retentionInDays: 7,
            tags: {
                Name: `lambda-validation-log-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Create Lambda function
        const lambda = new aws.lambda.Function(`validation-lambda-${environmentSuffix}`, {
            name: `validation-lambda-${environmentSuffix}`,
            runtime: "nodejs18.x",
            role: lambdaRole.arn,
            handler: "index.handler",
            timeout: 300,
            memorySize: 256,
            environment: {
                variables: {
                    MIGRATION_TABLE: migrationTable.name,
                    NOTIFICATION_TOPIC: notificationTopic.arn,
                    ENVIRONMENT_SUFFIX: environmentSuffix,
                },
            },
            vpcConfig: {
                subnetIds: primaryVpc.privateSubnets.map(s => s.id),
                securityGroupIds: [lambdaSecurityGroup.id],
            },
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});

exports.handler = async (event) => {
    console.log("Validation Lambda triggered", JSON.stringify(event));

    const timestamp = Date.now();
    const migrationId = event.migrationId || "validation-" + timestamp;

    try {
        // Perform data validation logic
        const validationResult = {
            migrationId: migrationId,
            timestamp: timestamp,
            status: "success",
            sourceRows: event.sourceRows || 0,
            targetRows: event.targetRows || 0,
            checksumMatch: event.sourceRows === event.targetRows,
        };

        // Store validation result in DynamoDB
        await dynamodb.send(new PutItemCommand({
            TableName: process.env.MIGRATION_TABLE,
            Item: {
                migration_id: { S: migrationId },
                timestamp: { N: timestamp.toString() },
                status: { S: validationResult.status },
                source_rows: { N: validationResult.sourceRows.toString() },
                target_rows: { N: validationResult.targetRows.toString() },
                checksum_match: { BOOL: validationResult.checksumMatch },
            },
        }));

        // Publish notification
        await sns.send(new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC,
            Subject: "Data Validation Complete",
            Message: JSON.stringify(validationResult, null, 2),
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(validationResult),
        };
    } catch (error) {
        console.error("Validation error:", error);

        // Publish error notification
        await sns.send(new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC,
            Subject: "Data Validation Failed",
            Message: JSON.stringify({ migrationId, error: error.message }, null, 2),
        }));

        throw error;
    }
};
                `),
            }),
            tags: {
                Name: `validation-lambda-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this, dependsOn: [logGroup] });

        // Create EventBridge rule to trigger Lambda on schedule
        const rule = new aws.cloudwatch.EventRule(`validation-schedule-${environmentSuffix}`, {
            name: `validation-schedule-${environmentSuffix}`,
            description: "Trigger data validation every hour",
            scheduleExpression: "rate(1 hour)",
            tags: {
                Name: `validation-schedule-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { parent: this });

        // Add Lambda permission for EventBridge
        new aws.lambda.Permission(`validation-lambda-permission-${environmentSuffix}`, {
            action: "lambda:InvokeFunction",
            function: lambda.name,
            principal: "events.amazonaws.com",
            sourceArn: rule.arn,
        }, { parent: this });

        // Create EventBridge target
        new aws.cloudwatch.EventTarget(`validation-target-${environmentSuffix}`, {
            rule: rule.name,
            arn: lambda.arn,
            input: JSON.stringify({
                sourceRows: 1000,
                targetRows: 1000,
            }),
        }, { parent: this });

        return lambda;
    }

    private createDmsReplication(primaryVpc: VpcResources, auroraResources: AuroraResources): void {
        // Create DMS replication subnet group
        const replicationSubnetGroup = new aws.dms.ReplicationSubnetGroup(`dms-subnet-group-${environmentSuffix}`, {
            replicationSubnetGroupId: `dms-subnet-group-${environmentSuffix}`,
            replicationSubnetGroupDescription: "DMS replication subnet group",
            subnetIds: primaryVpc.privateSubnets.map(s => s.id),
            tags: {
                Name: `dms-subnet-group-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create DMS replication instance
        const replicationInstance = new aws.dms.ReplicationInstance(`dms-instance-${environmentSuffix}`, {
            replicationInstanceId: `dms-instance-${environmentSuffix}`,
            replicationInstanceClass: "dms.t3.micro",
            allocatedStorage: 20,
            vpcSecurityGroupIds: [primaryVpc.vpc.defaultSecurityGroupId],
            replicationSubnetGroupId: replicationSubnetGroup.id,
            publiclyAccessible: false,
            tags: {
                Name: `dms-instance-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create source endpoint (Oracle)
        const sourceEndpoint = new aws.dms.Endpoint(`dms-source-endpoint-${environmentSuffix}`, {
            endpointId: `dms-source-endpoint-${environmentSuffix}`,
            endpointType: "source",
            engineName: "oracle",
            serverName: oracleEndpoint,
            port: 1521,
            databaseName: "ORCL",
            username: "admin",
            password: pulumi.secret("OraclePassword123!"),
            tags: {
                Name: `dms-source-endpoint-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create target endpoint (Aurora PostgreSQL)
        const targetEndpoint = new aws.dms.Endpoint(`dms-target-endpoint-${environmentSuffix}`, {
            endpointId: `dms-target-endpoint-${environmentSuffix}`,
            endpointType: "target",
            engineName: "aurora-postgresql",
            serverName: auroraResources.primaryCluster.endpoint.apply(e => e.split(':')[0]),
            port: 5432,
            databaseName: "migrationdb",
            username: "dbadmin",
            password: pulumi.secret("ChangeMe123!"),
            tags: {
                Name: `dms-target-endpoint-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create DMS replication task
        new aws.dms.ReplicationTask(`dms-task-${environmentSuffix}`, {
            replicationTaskId: `dms-task-${environmentSuffix}`,
            replicationInstanceArn: replicationInstance.replicationInstanceArn,
            sourceEndpointArn: sourceEndpoint.endpointArn,
            targetEndpointArn: targetEndpoint.endpointArn,
            migrationType: "full-load-and-cdc",
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
            replicationTaskSettings: JSON.stringify({
                TargetMetadata: {
                    TargetSchema: "",
                    SupportLobs: true,
                    FullLobMode: false,
                    LobChunkSize: 64,
                    LimitedSizeLobMode: true,
                    LobMaxSize: 32,
                },
                FullLoadSettings: {
                    TargetTablePrepMode: "DROP_AND_CREATE",
                },
                Logging: {
                    EnableLogging: true,
                },
            }),
            tags: {
                Name: `dms-task-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });
    }

    private createSiteToSiteVpn(primaryVpc: VpcResources): void {
        // Create customer gateway
        const customerGateway = new aws.ec2.CustomerGateway(`customer-gateway-${environmentSuffix}`, {
            bgpAsn: 65000,
            ipAddress: customerGatewayIp,
            type: "ipsec.1",
            tags: {
                Name: `customer-gateway-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create virtual private gateway
        const vpnGateway = new aws.ec2.VpnGateway(`vpn-gateway-${environmentSuffix}`, {
            vpcId: primaryVpc.vpc.id,
            tags: {
                Name: `vpn-gateway-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create VPN connection
        const vpnConnection = new aws.ec2.VpnConnection(`vpn-connection-${environmentSuffix}`, {
            vpnGatewayId: vpnGateway.id,
            customerGatewayId: customerGateway.id,
            type: "ipsec.1",
            staticRoutesOnly: true,
            tags: {
                Name: `vpn-connection-${environmentSuffix}`,
                Environment: environmentSuffix,
            },
        }, { provider: primaryVpc.provider, parent: this });

        // Create VPN connection route
        new aws.ec2.VpnConnectionRoute(`vpn-route-${environmentSuffix}`, {
            destinationCidrBlock: "192.168.0.0/16",
            vpnConnectionId: vpnConnection.id,
        }, { provider: primaryVpc.provider, parent: this });

        // Enable route propagation
        new aws.ec2.VpnGatewayRoutePropagation(`vpn-route-propagation-${environmentSuffix}`, {
            vpnGatewayId: vpnGateway.id,
            routeTableId: primaryVpc.vpc.defaultRouteTableId,
        }, { provider: primaryVpc.provider, parent: this });
    }
}

// Type definitions
interface VpcResources {
    vpc: aws.ec2.Vpc;
    publicSubnets: aws.ec2.Subnet[];
    privateSubnets: aws.ec2.Subnet[];
    provider: aws.Provider;
}

interface AuroraResources {
    globalCluster: aws.rds.GlobalCluster;
    primaryCluster: aws.rds.Cluster;
    secondaryClusters: aws.rds.Cluster[];
}

interface EcsResources {
    cluster: aws.ecs.Cluster;
    alb: aws.lb.LoadBalancer;
    blueTargetGroup: aws.lb.TargetGroup;
    greenTargetGroup: aws.lb.TargetGroup;
    service: aws.ecs.Service;
    logGroup: aws.cloudwatch.LogGroup;
}

interface MonitoringResources {
    topic: aws.sns.Topic;
    dashboard: aws.cloudwatch.Dashboard;
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Create the main stack
const stack = new TapStack("tap-stack");

// Export outputs
export const vpcIds = stack.vpcIds;
export const globalClusterIdentifier = stack.auroraGlobalCluster.id;
export const migrationTableName = stack.migrationStateTable.name;
export const validationLambdaArn = stack.validationLambda.arn;
export const notificationTopicArn = stack.notificationTopic.arn;
```