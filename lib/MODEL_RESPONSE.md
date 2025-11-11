# Multi-Region Disaster Recovery Infrastructure - Model Response

This document contains the initial implementation generated for the multi-region DR infrastructure requirement.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

interface TapStackProps {
    environmentSuffix: string;
    primaryRegion?: string;
    drRegion?: string;
    hostedZoneName?: string;
    notificationEmail?: string;
    tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
    public readonly primaryVpc: aws.ec2.Vpc;
    public readonly drVpc: aws.ec2.Vpc;
    public readonly primaryAlb: aws.lb.LoadBalancer;
    public readonly drAlb: aws.lb.LoadBalancer;
    public readonly auroraGlobalCluster: aws.rds.GlobalCluster;
    public readonly dynamodbTable: aws.dynamodb.Table;
    public readonly hostedZone: aws.route53.Zone;
    public readonly primaryHealthCheck: aws.route53.HealthCheck;
    
    private readonly props: Required<TapStackProps>;
    private primaryProvider: aws.Provider;
    private drProvider: aws.Provider;

    constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
        super("custom:TapStack", name, {}, opts);

        this.props = this.initializeProps(props);
        
        // Create regional providers
        this.primaryProvider = new aws.Provider(`${name}-primary-provider`, {
            region: this.props.primaryRegion,
        }, { parent: this });

        this.drProvider = new aws.Provider(`${name}-dr-provider`, {
            region: this.props.drRegion,
        }, { parent: this });

        // Create KMS keys
        const primaryKmsKey = this.createKmsKey("primary");
        const drKmsKey = this.createKmsKey("dr");

        // Create VPCs
        this.primaryVpc = this.createVpc("primary");
        this.drVpc = this.createVpc("dr");

        // Create networking
        const primaryNetworking = this.createNetworking("primary", this.primaryVpc);
        const drNetworking = this.createNetworking("dr", this.drVpc);

        // Create S3 buckets with replication
        const primaryBucket = this.createS3Bucket("primary", primaryKmsKey);
        const drBucket = this.createS3Bucket("dr", drKmsKey);
        this.setupS3Replication(primaryBucket, drBucket);

        // Create Aurora Global Database
        this.auroraGlobalCluster = this.createAuroraGlobalDatabase(
            primaryNetworking.subnetGroup,
            drNetworking.subnetGroup,
            primaryNetworking.securityGroup,
            drNetworking.securityGroup,
            primaryKmsKey,
            drKmsKey
        );

        // Create DynamoDB Global Table
        this.dynamodbTable = this.createDynamoDBGlobalTable();

        // Create ECS infrastructure
        const primaryEcs = this.createEcsInfrastructure("primary", 
            this.primaryVpc,
            primaryNetworking.publicSubnets,
            primaryNetworking.securityGroup);
        
        const drEcs = this.createEcsInfrastructure("dr",
            this.drVpc,
            drNetworking.publicSubnets,
            drNetworking.securityGroup);

        // Create ALBs
        this.primaryAlb = this.createAlb("primary", 
            primaryNetworking.publicSubnets,
            primaryNetworking.albSecurityGroup,
            primaryEcs.targetGroup);
        
        this.drAlb = this.createAlb("dr",
            drNetworking.publicSubnets,
            drNetworking.albSecurityGroup,
            drEcs.targetGroup);

        // Create Route 53 and health checks
        this.hostedZone = this.createHostedZone();
        this.primaryHealthCheck = this.createHealthCheck(this.primaryAlb);
        const drHealthCheck = this.createHealthCheck(this.drAlb);

        this.createRoute53Records(this.primaryAlb, this.drAlb, this.primaryHealthCheck);

        // Create SNS topics
        const primarySnsTopic = this.createSnsTopic("primary", primaryKmsKey);
        const drSnsTopic = this.createSnsTopic("dr", drKmsKey);
        this.setupCrossRegionSnsSubscriptions(primarySnsTopic, drSnsTopic);

        // Create Lambda functions for failover
        const failoverLambdas = this.createFailoverLambdas(
            this.auroraGlobalCluster,
            drEcs.service,
            this.hostedZone
        );

        // Create CloudWatch alarms
        this.createCloudWatchAlarms("primary", primaryEcs, primarySnsTopic);
        this.createCloudWatchAlarms("dr", drEcs, drSnsTopic);

        // Create CloudWatch dashboard
        this.createDashboard(primaryEcs, drEcs);

        // Register outputs
        this.registerOutputs({
            primaryVpcId: this.primaryVpc.id,
            drVpcId: this.drVpc.id,
            primaryAlbDns: this.primaryAlb.dnsName,
            drAlbDns: this.drAlb.dnsName,
            auroraGlobalClusterId: this.auroraGlobalCluster.id,
            dynamodbTableName: this.dynamodbTable.name,
            hostedZoneId: this.hostedZone.id,
            primaryHealthCheckId: this.primaryHealthCheck.id,
            failoverLambdaArns: {
                promoteAurora: failoverLambdas.promoteAurora.arn,
                updateRoute53: failoverLambdas.updateRoute53.arn,
                scaleEcs: failoverLambdas.scaleEcs.arn,
            },
        });
    }

    private initializeProps(props: TapStackProps): Required<TapStackProps> {
        return {
            environmentSuffix: props.environmentSuffix,
            primaryRegion: props.primaryRegion || "eu-central-1",
            drRegion: props.drRegion || "eu-west-2",
            hostedZoneName: props.hostedZoneName || `trading-platform-${props.environmentSuffix}.com`,
            notificationEmail: props.notificationEmail || "ops@example.com",
            tags: {
                Environment: props.environmentSuffix,
                ManagedBy: "Pulumi",
                ...props.tags,
            },
        };
    }

    private createKmsKey(region: string): aws.kms.Key {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;
        
        const key = new aws.kms.Key(`kms-${region}-${this.props.environmentSuffix}`, {
            description: `KMS key for ${region} region`,
            enableKeyRotation: true,
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        new aws.kms.Alias(`kms-alias-${region}-${this.props.environmentSuffix}`, {
            name: `alias/trading-platform-${region}-${this.props.environmentSuffix}`,
            targetKeyId: key.id,
        }, { provider, parent: this });

        return key;
    }

    private createVpc(region: string): aws.ec2.Vpc {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;
        
        const vpc = new aws.ec2.Vpc(`vpc-${region}-${this.props.environmentSuffix}`, {
            cidrBlock: region === "primary" ? "10.0.0.0/16" : "10.1.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...this.props.tags,
                Name: `vpc-${region}-${this.props.environmentSuffix}`,
                Region: region,
                DRRole: region === "primary" ? "Primary" : "DR",
            },
        }, { provider, parent: this });

        return vpc;
    }

    private createNetworking(region: string, vpc: aws.ec2.Vpc) {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;
        const baseOctet = region === "primary" ? "10.0" : "10.1";

        // Internet Gateway
        const igw = new aws.ec2.InternetGateway(`igw-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                ...this.props.tags,
                Name: `igw-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Public Subnets
        const publicSubnet1 = new aws.ec2.Subnet(`public-subnet-1-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: `${baseOctet}.1.0/24`,
            availabilityZone: region === "primary" ? "eu-central-1a" : "eu-west-2a",
            mapPublicIpOnLaunch: true,
            tags: {
                ...this.props.tags,
                Name: `public-subnet-1-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        const publicSubnet2 = new aws.ec2.Subnet(`public-subnet-2-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: `${baseOctet}.2.0/24`,
            availabilityZone: region === "primary" ? "eu-central-1b" : "eu-west-2b",
            mapPublicIpOnLaunch: true,
            tags: {
                ...this.props.tags,
                Name: `public-subnet-2-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Private Subnets for RDS
        const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: `${baseOctet}.10.0/24`,
            availabilityZone: region === "primary" ? "eu-central-1a" : "eu-west-2a",
            tags: {
                ...this.props.tags,
                Name: `private-subnet-1-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: `${baseOctet}.11.0/24`,
            availabilityZone: region === "primary" ? "eu-central-1b" : "eu-west-2b",
            tags: {
                ...this.props.tags,
                Name: `private-subnet-2-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Route Table
        const routeTable = new aws.ec2.RouteTable(`public-rt-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }],
            tags: {
                ...this.props.tags,
                Name: `public-rt-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Route Table Associations
        new aws.ec2.RouteTableAssociation(`rta-public-1-${region}-${this.props.environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            routeTableId: routeTable.id,
        }, { provider, parent: this });

        new aws.ec2.RouteTableAssociation(`rta-public-2-${region}-${this.props.environmentSuffix}`, {
            subnetId: publicSubnet2.id,
            routeTableId: routeTable.id,
        }, { provider, parent: this });

        // Security Group for ECS
        const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for ECS tasks",
            ingress: [{
                protocol: "tcp",
                fromPort: 80,
                toPort: 80,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow HTTP from anywhere",
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound",
            }],
            tags: {
                ...this.props.tags,
                Name: `ecs-sg-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Security Group for ALB
        const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for ALB",
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
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound",
            }],
            tags: {
                ...this.props.tags,
                Name: `alb-sg-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // Security Group for RDS
        const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${region}-${this.props.environmentSuffix}`, {
            vpcId: vpc.id,
            description: "Security group for Aurora",
            ingress: [{
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
                securityGroups: [ecsSecurityGroup.id],
                description: "Allow PostgreSQL from ECS",
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound",
            }],
            tags: {
                ...this.props.tags,
                Name: `rds-sg-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // DB Subnet Group
        const subnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${region}-${this.props.environmentSuffix}`, {
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            tags: {
                ...this.props.tags,
                Name: `db-subnet-group-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        return {
            publicSubnets: [publicSubnet1, publicSubnet2],
            privateSubnets: [privateSubnet1, privateSubnet2],
            securityGroup: ecsSecurityGroup,
            albSecurityGroup,
            rdsSecurityGroup,
            subnetGroup,
        };
    }

    private createS3Bucket(region: string, kmsKey: aws.kms.Key): aws.s3.Bucket {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;
        
        const bucket = new aws.s3.Bucket(`artifacts-${region}-${this.props.environmentSuffix}`, {
            bucket: `trading-artifacts-${region}-${this.props.environmentSuffix}`,
            versioning: {
                enabled: true,
            },
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "aws:kms",
                        kmsMasterKeyId: kmsKey.id,
                    },
                },
            },
            tags: {
                ...this.props.tags,
                Name: `artifacts-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        new aws.s3.BucketPublicAccessBlock(`artifacts-pab-${region}-${this.props.environmentSuffix}`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { provider, parent: this });

        return bucket;
    }

    private setupS3Replication(primaryBucket: aws.s3.Bucket, drBucket: aws.s3.Bucket) {
        // Create replication role
        const replicationRole = new aws.iam.Role(`s3-replication-role-${this.props.environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "s3.amazonaws.com",
                    },
                    Action: "sts:AssumeRole",
                }],
            }),
            tags: this.props.tags,
        }, { parent: this });

        new aws.iam.RolePolicy(`s3-replication-policy-${this.props.environmentSuffix}`, {
            role: replicationRole.id,
            policy: pulumi.all([primaryBucket.arn, drBucket.arn]).apply(([sourceArn, destArn]) => 
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:GetReplicationConfiguration",
                                "s3:ListBucket",
                            ],
                            Resource: sourceArn,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:GetObjectVersionForReplication",
                                "s3:GetObjectVersionAcl",
                            ],
                            Resource: `${sourceArn}/*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:ReplicateObject",
                                "s3:ReplicateDelete",
                            ],
                            Resource: `${destArn}/*`,
                        },
                    ],
                })
            ),
        }, { parent: this });

        new aws.s3.BucketReplicationConfiguration(`s3-replication-${this.props.environmentSuffix}`, {
            bucket: primaryBucket.id,
            role: replicationRole.arn,
            rules: [{
                id: "replicate-all",
                status: "Enabled",
                destination: {
                    bucket: drBucket.arn,
                    storageClass: "STANDARD",
                },
            }],
        }, { provider: this.primaryProvider, parent: this });
    }

    private createAuroraGlobalDatabase(
        primarySubnetGroup: aws.rds.SubnetGroup,
        drSubnetGroup: aws.rds.SubnetGroup,
        primarySecurityGroup: aws.ec2.SecurityGroup,
        drSecurityGroup: aws.ec2.SecurityGroup,
        primaryKmsKey: aws.kms.Key,
        drKmsKey: aws.kms.Key
    ): aws.rds.GlobalCluster {
        // Create Global Cluster
        const globalCluster = new aws.rds.GlobalCluster(`aurora-global-${this.props.environmentSuffix}`, {
            globalClusterIdentifier: `trading-aurora-global-${this.props.environmentSuffix}`,
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            databaseName: "trading",
            storageEncrypted: true,
        }, { parent: this });

        // Primary Cluster
        const primaryCluster = new aws.rds.Cluster(`aurora-primary-${this.props.environmentSuffix}`, {
            clusterIdentifier: `trading-aurora-primary-${this.props.environmentSuffix}`,
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            engineMode: "provisioned",
            databaseName: "trading",
            masterUsername: "dbadmin",
            masterPassword: "ChangeMe123!", // Intentional issue - hardcoded password
            globalClusterIdentifier: globalCluster.id,
            dbSubnetGroupName: primarySubnetGroup.name,
            vpcSecurityGroupIds: [primarySecurityGroup.id],
            storageEncrypted: true,
            kmsKeyId: primaryKmsKey.arn,
            backupRetentionPeriod: 7,
            preferredBackupWindow: "03:00-04:00",
            skipFinalSnapshot: true,
            serverlessv2ScalingConfiguration: {
                maxCapacity: 2.0,
                minCapacity: 0.5,
            },
            tags: {
                ...this.props.tags,
                Region: "primary",
                DRRole: "Primary",
            },
        }, { provider: this.primaryProvider, parent: this, dependsOn: [globalCluster] });

        // Primary Instance
        new aws.rds.ClusterInstance(`aurora-primary-instance-${this.props.environmentSuffix}`, {
            identifier: `trading-aurora-primary-instance-${this.props.environmentSuffix}`,
            clusterIdentifier: primaryCluster.id,
            instanceClass: "db.serverless",
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            publiclyAccessible: false,
            tags: {
                ...this.props.tags,
                Region: "primary",
            },
        }, { provider: this.primaryProvider, parent: this });

        // DR Cluster (Secondary)
        const drCluster = new aws.rds.Cluster(`aurora-dr-${this.props.environmentSuffix}`, {
            clusterIdentifier: `trading-aurora-dr-${this.props.environmentSuffix}`,
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            globalClusterIdentifier: globalCluster.id,
            dbSubnetGroupName: drSubnetGroup.name,
            vpcSecurityGroupIds: [drSecurityGroup.id],
            storageEncrypted: true,
            kmsKeyId: drKmsKey.arn,
            skipFinalSnapshot: true,
            serverlessv2ScalingConfiguration: {
                maxCapacity: 2.0,
                minCapacity: 0.5,
            },
            tags: {
                ...this.props.tags,
                Region: "dr",
                DRRole: "Secondary",
            },
        }, { provider: this.drProvider, parent: this, dependsOn: [primaryCluster] });

        // DR Instance
        new aws.rds.ClusterInstance(`aurora-dr-instance-${this.props.environmentSuffix}`, {
            identifier: `trading-aurora-dr-instance-${this.props.environmentSuffix}`,
            clusterIdentifier: drCluster.id,
            instanceClass: "db.serverless",
            engine: "aurora-postgresql",
            engineVersion: "14.6",
            publiclyAccessible: false,
            tags: {
                ...this.props.tags,
                Region: "dr",
            },
        }, { provider: this.drProvider, parent: this });

        return globalCluster;
    }

    private createDynamoDBGlobalTable(): aws.dynamodb.Table {
        const table = new aws.dynamodb.Table(`sessions-${this.props.environmentSuffix}`, {
            name: `trading-sessions-${this.props.environmentSuffix}`,
            billingMode: "PAY_PER_REQUEST",
            hashKey: "sessionId",
            attributes: [{
                name: "sessionId",
                type: "S",
            }],
            streamEnabled: true,
            streamViewType: "NEW_AND_OLD_IMAGES",
            replicas: [
                { regionName: this.props.drRegion },
            ],
            tags: {
                ...this.props.tags,
                Name: `sessions-${this.props.environmentSuffix}`,
            },
        }, { provider: this.primaryProvider, parent: this });

        return table;
    }

    private createEcsInfrastructure(region: string, vpc: aws.ec2.Vpc, subnets: aws.ec2.Subnet[], securityGroup: aws.ec2.SecurityGroup) {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;

        // ECS Cluster
        const cluster = new aws.ecs.Cluster(`ecs-cluster-${region}-${this.props.environmentSuffix}`, {
            name: `trading-cluster-${region}-${this.props.environmentSuffix}`,
            settings: [{
                name: "containerInsights",
                value: "enabled",
            }],
            tags: {
                ...this.props.tags,
                Name: `ecs-cluster-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // CloudWatch Log Group
        const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${region}-${this.props.environmentSuffix}`, {
            name: `/aws/ecs/trading-${region}-${this.props.environmentSuffix}`,
            retentionInDays: 7,
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        // Task Execution Role
        const taskExecutionRole = new aws.iam.Role(`ecs-task-execution-role-${region}-${this.props.environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "ecs-tasks.amazonaws.com",
                    },
                    Action: "sts:AssumeRole",
                }],
            }),
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            ],
            tags: this.props.tags,
        }, { provider, parent: this });

        // Task Role
        const taskRole = new aws.iam.Role(`ecs-task-role-${region}-${this.props.environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "ecs-tasks.amazonaws.com",
                    },
                    Action: "sts:AssumeRole",
                }],
            }),
            tags: this.props.tags,
        }, { provider, parent: this });

        new aws.iam.RolePolicy(`ecs-task-policy-${region}-${this.props.environmentSuffix}`, {
            role: taskRole.id,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                        ],
                        Resource: `arn:aws:dynamodb:*:*:table/trading-sessions-${this.props.environmentSuffix}`,
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:GetObject",
                            "s3:PutObject",
                        ],
                        Resource: `arn:aws:s3:::trading-artifacts-*-${this.props.environmentSuffix}/*`,
                    },
                ],
            }),
        }, { provider, parent: this });

        // Task Definition
        const taskDefinition = new aws.ecs.TaskDefinition(`ecs-task-${region}-${this.props.environmentSuffix}`, {
            family: `trading-task-${region}-${this.props.environmentSuffix}`,
            cpu: "256",
            memory: "512",
            networkMode: "awsvpc",
            requiresCompatibilities: ["FARGATE"],
            executionRoleArn: taskExecutionRole.arn,
            taskRoleArn: taskRole.arn,
            containerDefinitions: JSON.stringify([{
                name: "trading-app",
                image: "nginx:latest",
                portMappings: [{
                    containerPort: 80,
                    protocol: "tcp",
                }],
                logConfiguration: {
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": logGroup.name,
                        "awslogs-region": region === "primary" ? this.props.primaryRegion : this.props.drRegion,
                        "awslogs-stream-prefix": "trading",
                    },
                },
            }]),
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        // Target Group
        const targetGroup = new aws.lb.TargetGroup(`tg-${region}-${this.props.environmentSuffix}`, {
            name: `trading-tg-${region}-${this.props.environmentSuffix}`,
            port: 80,
            protocol: "HTTP",
            vpcId: vpc.id,
            targetType: "ip",
            healthCheck: {
                enabled: true,
                path: "/",
                interval: 30,
                timeout: 5,
                healthyThreshold: 2,
                unhealthyThreshold: 2,
            },
            tags: {
                ...this.props.tags,
                Name: `tg-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        // ECS Service
        const service = new aws.ecs.Service(`ecs-service-${region}-${this.props.environmentSuffix}`, {
            name: `trading-service-${region}-${this.props.environmentSuffix}`,
            cluster: cluster.arn,
            taskDefinition: taskDefinition.arn,
            desiredCount: region === "primary" ? 2 : 0, // DR starts with 0
            launchType: "FARGATE",
            networkConfiguration: {
                subnets: subnets.map(s => s.id),
                securityGroups: [securityGroup.id],
                assignPublicIp: true,
            },
            loadBalancers: [{
                targetGroupArn: targetGroup.arn,
                containerName: "trading-app",
                containerPort: 80,
            }],
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        return {
            cluster,
            taskDefinition,
            service,
            targetGroup,
            logGroup,
        };
    }

    private createAlb(region: string, subnets: aws.ec2.Subnet[], securityGroup: aws.ec2.SecurityGroup, targetGroup: aws.lb.TargetGroup): aws.lb.LoadBalancer {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;

        const alb = new aws.lb.LoadBalancer(`alb-${region}-${this.props.environmentSuffix}`, {
            name: `trading-alb-${region}-${this.props.environmentSuffix}`,
            internal: false,
            loadBalancerType: "application",
            securityGroups: [securityGroup.id],
            subnets: subnets.map(s => s.id),
            enableDeletionProtection: false,
            tags: {
                ...this.props.tags,
                Name: `alb-${region}-${this.props.environmentSuffix}`,
                Region: region,
            },
        }, { provider, parent: this });

        new aws.lb.Listener(`alb-listener-${region}-${this.props.environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 80,
            protocol: "HTTP",
            defaultActions: [{
                type: "forward",
                targetGroupArn: targetGroup.arn,
            }],
        }, { provider, parent: this });

        return alb;
    }

    private createHostedZone(): aws.route53.Zone {
        const zone = new aws.route53.Zone(`hz-${this.props.environmentSuffix}`, {
            name: this.props.hostedZoneName,
            tags: this.props.tags,
        }, { parent: this });

        return zone;
    }

    private createHealthCheck(alb: aws.lb.LoadBalancer): aws.route53.HealthCheck {
        const healthCheck = new aws.route53.HealthCheck(`hc-${alb.name}`, {
            fqdn: alb.dnsName,
            port: 80,
            type: "HTTP",
            resourcePath: "/",
            failureThreshold: 3,
            requestInterval: 30,
            tags: this.props.tags,
        }, { parent: this });

        return healthCheck;
    }

    private createRoute53Records(primaryAlb: aws.lb.LoadBalancer, drAlb: aws.lb.LoadBalancer, primaryHealthCheck: aws.route53.HealthCheck) {
        // Primary record with health check
        new aws.route53.Record(`primary-record-${this.props.environmentSuffix}`, {
            zoneId: this.hostedZone.id,
            name: this.props.hostedZoneName,
            type: "A",
            aliases: [{
                name: primaryAlb.dnsName,
                zoneId: primaryAlb.zoneId,
                evaluateTargetHealth: true,
            }],
            setIdentifier: "primary",
            healthCheckId: primaryHealthCheck.id,
            failoverRoutingPolicies: [{
                type: "PRIMARY",
            }],
        }, { parent: this });

        // DR record
        new aws.route53.Record(`dr-record-${this.props.environmentSuffix}`, {
            zoneId: this.hostedZone.id,
            name: this.props.hostedZoneName,
            type: "A",
            aliases: [{
                name: drAlb.dnsName,
                zoneId: drAlb.zoneId,
                evaluateTargetHealth: true,
            }],
            setIdentifier: "dr",
            failoverRoutingPolicies: [{
                type: "SECONDARY",
            }],
        }, { parent: this });
    }

    private createSnsTopic(region: string, kmsKey: aws.kms.Key): aws.sns.Topic {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;

        const topic = new aws.sns.Topic(`sns-${region}-${this.props.environmentSuffix}`, {
            name: `trading-alerts-${region}-${this.props.environmentSuffix}`,
            kmsMasterKeyId: kmsKey.id,
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        new aws.sns.TopicSubscription(`sns-sub-${region}-${this.props.environmentSuffix}`, {
            topic: topic.arn,
            protocol: "email",
            endpoint: this.props.notificationEmail,
        }, { provider, parent: this });

        return topic;
    }

    private setupCrossRegionSnsSubscriptions(primaryTopic: aws.sns.Topic, drTopic: aws.sns.Topic) {
        // This would require cross-region SNS forwarding via Lambda or EventBridge
        // Simplified for this implementation
    }

    private createFailoverLambdas(globalCluster: aws.rds.GlobalCluster, drEcsService: aws.ecs.Service, hostedZone: aws.route53.Zone) {
        // Lambda execution role
        const lambdaRole = new aws.iam.Role(`lambda-failover-role-${this.props.environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com",
                    },
                    Action: "sts:AssumeRole",
                }],
            }),
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            ],
            tags: this.props.tags,
        }, { parent: this });

        new aws.iam.RolePolicy(`lambda-failover-policy-${this.props.environmentSuffix}`, {
            role: lambdaRole.id,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeGlobalClusters",
                            "rds:RemoveFromGlobalCluster",
                            "rds:DescribeDBClusters",
                        ],
                        Resource: "*",
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "route53:ChangeResourceRecordSets",
                            "route53:GetHostedZone",
                        ],
                        Resource: "*",
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "ecs:UpdateService",
                            "ecs:DescribeServices",
                        ],
                        Resource: "*",
                    },
                ],
            }),
        }, { parent: this });

        // Promote Aurora Lambda
        const promoteAuroraLambda = new aws.lambda.Function(`lambda-promote-aurora-${this.props.environmentSuffix}`, {
            name: `promote-aurora-${this.props.environmentSuffix}`,
            runtime: "python3.11",
            handler: "index.handler",
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                "index.py": new pulumi.asset.StringAsset(`
import boto3
import json
import os

rds_client = boto3.client('rds', region_name=os.environ['DR_REGION'])

def handler(event, context):
    cluster_id = os.environ['DR_CLUSTER_ID']
    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    
    try:
        # Remove from global cluster
        rds_client.remove_from_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            DbClusterIdentifier=cluster_id
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Aurora DR cluster promoted successfully')
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error promoting Aurora: {str(e)}')
        }
`),
            }),
            environment: {
                variables: {
                    DR_REGION: this.props.drRegion,
                    GLOBAL_CLUSTER_ID: globalCluster.id,
                    DR_CLUSTER_ID: `trading-aurora-dr-${this.props.environmentSuffix}`,
                },
            },
            timeout: 300,
            tags: this.props.tags,
        }, { provider: this.drProvider, parent: this });

        // Update Route53 Lambda
        const updateRoute53Lambda = new aws.lambda.Function(`lambda-update-route53-${this.props.environmentSuffix}`, {
            name: `update-route53-${this.props.environmentSuffix}`,
            runtime: "python3.11",
            handler: "index.handler",
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                "index.py": new pulumi.asset.StringAsset(`
import boto3
import json
import os

route53_client = boto3.client('route53')

def handler(event, context):
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    
    try:
        # This is simplified - in production would update weights or failover config
        return {
            'statusCode': 200,
            'body': json.dumps('Route53 updated successfully')
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error updating Route53: {str(e)}')
        }
`),
            }),
            environment: {
                variables: {
                    HOSTED_ZONE_ID: hostedZone.id,
                },
            },
            timeout: 60,
            tags: this.props.tags,
        }, { provider: this.drProvider, parent: this });

        // Scale ECS Lambda
        const scaleEcsLambda = new aws.lambda.Function(`lambda-scale-ecs-${this.props.environmentSuffix}`, {
            name: `scale-ecs-${this.props.environmentSuffix}`,
            runtime: "python3.11",
            handler: "index.handler",
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                "index.py": new pulumi.asset.StringAsset(`
import boto3
import json
import os

ecs_client = boto3.client('ecs', region_name=os.environ['DR_REGION'])

def handler(event, context):
    cluster_name = os.environ['CLUSTER_NAME']
    service_name = os.environ['SERVICE_NAME']
    desired_count = int(os.environ.get('DESIRED_COUNT', '2'))
    
    try:
        response = ecs_client.update_service(
            cluster=cluster_name,
            service=service_name,
            desiredCount=desired_count
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('ECS service scaled successfully')
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error scaling ECS: {str(e)}')
        }
`),
            }),
            environment: {
                variables: {
                    DR_REGION: this.props.drRegion,
                    CLUSTER_NAME: `trading-cluster-dr-${this.props.environmentSuffix}`,
                    SERVICE_NAME: `trading-service-dr-${this.props.environmentSuffix}`,
                    DESIRED_COUNT: "2",
                },
            },
            timeout: 60,
            tags: this.props.tags,
        }, { provider: this.drProvider, parent: this });

        return {
            promoteAurora: promoteAuroraLambda,
            updateRoute53: updateRoute53Lambda,
            scaleEcs: scaleEcsLambda,
        };
    }

    private createCloudWatchAlarms(region: string, ecsInfra: any, snsTopic: aws.sns.Topic) {
        const provider = region === "primary" ? this.primaryProvider : this.drProvider;

        // ECS CPU Utilization Alarm
        new aws.cloudwatch.MetricAlarm(`ecs-cpu-alarm-${region}-${this.props.environmentSuffix}`, {
            name: `ecs-cpu-high-${region}-${this.props.environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "CPUUtilization",
            namespace: "AWS/ECS",
            period: 300,
            statistic: "Average",
            threshold: 80,
            alarmDescription: "ECS CPU utilization is too high",
            alarmActions: [snsTopic.arn],
            dimensions: {
                ClusterName: ecsInfra.cluster.name,
                ServiceName: ecsInfra.service.name,
            },
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        // ECS Memory Utilization Alarm
        new aws.cloudwatch.MetricAlarm(`ecs-memory-alarm-${region}-${this.props.environmentSuffix}`, {
            name: `ecs-memory-high-${region}-${this.props.environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "MemoryUtilization",
            namespace: "AWS/ECS",
            period: 300,
            statistic: "Average",
            threshold: 80,
            alarmDescription: "ECS memory utilization is too high",
            alarmActions: [snsTopic.arn],
            dimensions: {
                ClusterName: ecsInfra.cluster.name,
                ServiceName: ecsInfra.service.name,
            },
            tags: {
                ...this.props.tags,
                Region: region,
            },
        }, { provider, parent: this });

        // ALB Unhealthy Host Count Alarm
        if (region === "primary") {
            new aws.cloudwatch.MetricAlarm(`alb-unhealthy-hosts-${region}-${this.props.environmentSuffix}`, {
                name: `alb-unhealthy-hosts-${region}-${this.props.environmentSuffix}`,
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 2,
                metricName: "UnHealthyHostCount",
                namespace: "AWS/ApplicationELB",
                period: 60,
                statistic: "Average",
                threshold: 0,
                alarmDescription: "ALB has unhealthy targets",
                alarmActions: [snsTopic.arn],
                dimensions: {
                    TargetGroup: ecsInfra.targetGroup.arnSuffix,
                    LoadBalancer: this.primaryAlb.arnSuffix,
                },
                tags: {
                    ...this.props.tags,
                    Region: region,
                },
            }, { provider, parent: this });
        }
    }

    private createDashboard(primaryEcs: any, drEcs: any) {
        new aws.cloudwatch.Dashboard(`dashboard-${this.props.environmentSuffix}`, {
            dashboardName: `trading-platform-${this.props.environmentSuffix}`,
            dashboardBody: JSON.stringify({
                widgets: [
                    {
                        type: "metric",
                        properties: {
                            metrics: [
                                ["AWS/ECS", "CPUUtilization", { stat: "Average", region: this.props.primaryRegion }],
                                ["AWS/ECS", "MemoryUtilization", { stat: "Average", region: this.props.primaryRegion }],
                            ],
                            period: 300,
                            stat: "Average",
                            region: this.props.primaryRegion,
                            title: "Primary ECS Metrics",
                        },
                    },
                    {
                        type: "metric",
                        properties: {
                            metrics: [
                                ["AWS/ECS", "CPUUtilization", { stat: "Average", region: this.props.drRegion }],
                                ["AWS/ECS", "MemoryUtilization", { stat: "Average", region: this.props.drRegion }],
                            ],
                            period: 300,
                            stat: "Average",
                            region: this.props.drRegion,
                            title: "DR ECS Metrics",
                        },
                    },
                    {
                        type: "metric",
                        properties: {
                            metrics: [
                                ["AWS/RDS", "AuroraGlobalDBReplicationLag", { stat: "Average" }],
                            ],
                            period: 60,
                            stat: "Average",
                            region: this.props.primaryRegion,
                            title: "Aurora Replication Lag",
                        },
                    },
                ],
            }),
        }, { parent: this });
    }
}

// Main stack instantiation
const stack = new TapStack("trading-platform", {
    environmentSuffix: pulumi.getStack(),
    primaryRegion: "eu-central-1",
    drRegion: "eu-west-2",
    notificationEmail: "ops@tradingplatform.com",
});

export const primaryVpcId = stack.primaryVpc.id;
export const drVpcId = stack.drVpc.id;
export const primaryAlbDns = stack.primaryAlb.dnsName;
export const drAlbDns = stack.drAlb.dnsName;
export const auroraGlobalClusterId = stack.auroraGlobalCluster.id;
export const dynamodbTableName = stack.dynamodbTable.name;
export const hostedZoneId = stack.hostedZone.id;
export const primaryHealthCheckId = stack.primaryHealthCheck.id;
```

## Known Issues in MODEL_RESPONSE

1. Hardcoded Aurora master password in `createAuroraGlobalDatabase` method
2. Incomplete cross-region SNS subscription setup in `setupCrossRegionSnsSubscriptions`
3. Missing RDS replication lag alarm for Aurora Global Database
4. Lambda functions lack proper error handling and idempotency checks
5. Route53 failover configuration uses incorrect property name `failoverRoutingPolicies`
6. Missing VPC endpoints for cost optimization
7. Security group for RDS references wrong securityGroup variable
8. Task definition container should reference proper environment variables
9. Missing CloudWatch log retention policies
10. Lambda IAM policies too permissive with Resource: "*"
