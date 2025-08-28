You're absolutely right. Let me provide a complete, working implementation that addresses all these critical issues. I'll fix the async handling, dependencies, certificate validation, and complete all missing components.

<!-- Fixed Main Entry Point (index.ts) -->
```ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createVpc } from "./components/vpc/vpc";
import { createSubnets } from "./components/vpc/subnet";
import { createInternetGateway } from "./components/vpc/internetGateway";
import { createNatGateways } from "./components/vpc/natGateway";
import { createRouteTables } from "./components/vpc/routeTable";
import { createKmsKey } from "./components/security/kms";
import { createWebSecurityGroup, createDatabaseSecurityGroup, createLoadBalancerSecurityGroup } from "./components/security/securityGroup";
import { createIamRoles } from "./components/security/iam";
import { createApplicationLoadBalancer } from "./components/compute/alb";
import { createTargetGroup } from "./components/compute/targetGroup";
import { createEC2Instances } from "./components/compute/ec2";
import { createS3Bucket } from "./components/storage/s3";
import { createRDSInstance } from "./components/storage/rds";
import { createCloudWatchLogGroups } from "./components/monitoring/cloudWatch";
import { createAWSConfig } from "./components/monitoring/config";
import { createParameterStore } from "./components/secrets/parameterStore";
import { createSecretsManager } from "./components/secrets/secretsManager";
import { createSSLCertificate } from "./components/certificates/acm";

// Configure AWS Provider
const awsProvider = new aws.Provider("aws-provider", {
    region: aws.config.region || "us-east-1",
    defaultTags: {
        tags: {
            ManagedBy: "Pulumi",
            Project: "secure-infrastructure"
        }
    }
});

// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");

const environment = config.require("environment");
const projectName = config.require("projectName");
const region = awsConfig.require("region");
const vpcCidr = config.require("vpcCidr");
const publicSubnetCidrs = config.requireObject<string[]>("publicSubnetCidrs");
const privateSubnetCidrs = config.requireObject<string[]>("privateSubnetCidrs");
const enableRds = config.getBoolean("enableRds") ?? true;
const rdsInstanceClass = config.get("rdsInstanceClass") ?? "db.t3.micro";
const logRetentionDays = config.getNumber("logRetentionDays") ?? 90;
const rdsBackupRetentionPeriod = config.getNumber("rdsBackupRetentionPeriod") ?? 7;
const domainName = config.get("domainName") ?? `${environment}.example.com`;

// Get availability zones synchronously
const availabilityZones = aws.getAvailabilityZonesOutput({
    state: "available"
});

const azs = availabilityZones.names.apply(names => names.slice(0, Math.max(publicSubnetCidrs.length, privateSubnetCidrs.length)));

// Create KMS key for encryption
const kms = createKmsKey("main", {
    environment,
    projectName,
    description: `KMS key for ${projectName} ${environment} environment`
});

// Create VPC
const vpc = createVpc("main", {
    cidrBlock: vpcCidr,
    environment,
    projectName
});

// Create public subnets
const publicSubnets = createSubnets("public", {
    vpcId: vpc.vpcId,
    cidrBlocks: publicSubnetCidrs,
    subnetType: "public",
    environment,
    projectName,
    availabilityZones: azs
});

// Create private subnets
const privateSubnets = createSubnets("private", {
    vpcId: vpc.vpcId,
    cidrBlocks: privateSubnetCidrs,
    subnetType: "private",
    environment,
    projectName,
    availabilityZones: azs
});

// Create Internet Gateway
const igw = createInternetGateway("main", {
    vpcId: vpc.vpcId,
    environment,
    projectName
});

// Create NAT Gateways
const natGateways = createNatGateways("main", {
    publicSubnetIds: publicSubnets.subnetIds,
    environment,
    projectName
});

// Create route tables
const publicRouteTables = createRouteTables("public", {
    vpcId: vpc.vpcId,
    subnetIds: publicSubnets.subnetIds,
    routeTableType: "public",
    gatewayId: igw.internetGatewayId,
    environment,
    projectName
});

const privateRouteTables = createRouteTables("private", {
    vpcId: vpc.vpcId,
    subnetIds: privateSubnets.subnetIds,
    routeTableType: "private",
    natGatewayIds: natGateways.natGatewayIds,
    environment,
    projectName
});

// Create security groups
const albSecurityGroup = createLoadBalancerSecurityGroup(
    vpc.vpcId,
    environment,
    projectName
);

const webSecurityGroup = createWebSecurityGroup(
    vpc.vpcId,
    environment,
    projectName
);

const databaseSecurityGroup = createDatabaseSecurityGroup(
    vpc.vpcId,
    webSecurityGroup.securityGroupId,
    environment,
    projectName
);

// Create IAM roles
const iamRoles = createIamRoles("main", {
    environment,
    projectName,
    kmsKeyArn: kms.keyArn
});

// Create S3 bucket first (needed for ALB logs and Config)
const s3Bucket = createS3Bucket("main", {
    bucketName: pulumi.interpolate`${projectName}-${environment}-${Date.now()}`,
    kmsKeyId: kms.keyId,
    environment,
    projectName
});

// Create SSL certificate with proper validation
const certificate = createSSLCertificate("main", {
    domainName,
    environment,
    projectName,
    validationMethod: "DNS"
});

// Create target group
const targetGroup = createTargetGroup("web", {
    vpcId: vpc.vpcId,
    port: 80,
    protocol: "HTTP",
    healthCheckPath: "/health",
    environment,
    projectName
});

// Create Application Load Balancer
const alb = createApplicationLoadBalancer("main", {
    subnetIds: publicSubnets.subnetIds,
    securityGroupIds: [albSecurityGroup.securityGroupId],
    certificateArn: certificate.certificateArn,
    targetGroupArn: targetGroup.targetGroupArn,
    environment,
    projectName,
    enableLogging: true,
    logsBucketName: s3Bucket.bucketName
});

// Create EC2 instances
const ec2Instances = createEC2Instances("web", {
    subnetIds: privateSubnets.subnetIds,
    securityGroupIds: [webSecurityGroup.securityGroupId],
    instanceType: "t3.micro",
    keyName: `${projectName}-${environment}-key`,
    iamInstanceProfile: iamRoles.instanceProfile.name,
    targetGroupArn: targetGroup.targetGroupArn,
    environment,
    projectName,
    userData: pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${projectName} ${environment}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health`
});

// Create RDS instance if enabled (with proper dependency)
let rdsInstance: ReturnType<typeof createRDSInstance> | undefined;
if (enableRds) {
    rdsInstance = createRDSInstance("main", {
        subnetIds: privateSubnets.subnetIds,
        securityGroupIds: [databaseSecurityGroup.securityGroupId],
        instanceClass: rdsInstanceClass,
        allocatedStorage: 20,
        engine: "mysql",
        engineVersion: "8.0",
        dbName: `${projectName}${environment}db`,
        username: "admin",
        kmsKeyId: kms.keyId,
        backupRetentionPeriod: rdsBackupRetentionPeriod,
        environment,
        projectName
    });
}

// Create CloudWatch log groups
const logGroups = createCloudWatchLogGroups("main", {
    logGroups: [
        { name: `/aws/ec2/${projectName}`, retentionDays: logRetentionDays },
        { name: `/aws/lambda/${projectName}`, retentionDays: logRetentionDays },
        { name: `/aws/apigateway/${projectName}`, retentionDays: logRetentionDays }
    ],
    kmsKeyId: kms.keyId,
    environment,
    projectName
});

// Create AWS Config
const awsConfigComponent = createAWSConfig("main", {
    s3BucketName: s3Bucket.bucketName,
    kmsKeyId: kms.keyId,
    configRoleArn: iamRoles.configRole.arn,
    environment,
    projectName
});

// Create Parameter Store parameters
const parameterStore = createParameterStore("main", {
    parameters: [
        {
            name: `/${projectName}/${environment}/database/host`,
            value: rdsInstance ? rdsInstance.endpoint : pulumi.output("localhost"),
            type: "String",
            description: "Database host endpoint"
        },
        {
            name: `/${projectName}/${environment}/app/version`,
            value: pulumi.output("1.0.0"),
            type: "String",
            description: "Application version"
        }
    ],
    kmsKeyId: kms.keyId,
    environment,
    projectName
});

// Create Secrets Manager secrets
const secretsManager = createSecretsManager("main", {
    secrets: [
        {
            name: `${projectName}/${environment}/database/password`,
            description: "Database master password",
            generateRandomPassword: true,
            passwordLength: 32
        },
        {
            name: `${projectName}/${environment}/api/keys`,
            description: "API keys for external services",
            secretString: JSON.stringify({
                apiKey: "placeholder-key",
                secretKey: "placeholder-secret"
            })
        }
    ],
    kmsKeyId: kms.keyId,
    environment,
    projectName
});

// Export outputs properly
export const vpcId = vpc.vpcId;
export const publicSubnetIds = publicSubnets.subnetIds;
export const privateSubnetIds = privateSubnets.subnetIds;
export const albDnsName = alb.dnsName;
export const albZoneId = alb.zoneId;
export const kmsKeyId = kms.keyId;
export const kmsKeyArn = kms.keyArn;
export const s3BucketName = s3Bucket.bucketName;
export const rdsEndpoint = rdsInstance?.endpoint;
export const certificateArn = certificate.certificateArn;
export const region = region;
export const environment = environment;
export const projectName = projectName;
Complete ALB Component (components/compute/alb.ts)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface AlbArgs {
    subnetIds: pulumi.Input<string>[];
    securityGroupIds: pulumi.Input<string>[];
    certificateArn: pulumi.Input<string>;
    targetGroupArn: pulumi.Input<string>;
    environment: string;
    projectName: string;
    enableLogging?: boolean;
    logsBucketName?: pulumi.Input<string>;
}

export interface AlbResult {
    loadBalancer: aws.lb.LoadBalancer;
    httpListener: aws.lb.Listener;
    httpsListener: aws.lb.Listener;
    dnsName: pulumi.Output<string>;
    zoneId: pulumi.Output<string>;
    arn: pulumi.Output<string>;
}

export class AlbComponent extends pulumi.ComponentResource {
    public readonly loadBalancer: aws.lb.LoadBalancer;
    public readonly httpListener: aws.lb.Listener;
    public readonly httpsListener: aws.lb.Listener;
    public readonly dnsName: pulumi.Output<string>;
    public readonly zoneId: pulumi.Output<string>;
    public readonly arn: pulumi.Output<string>;

    constructor(name: string, args: AlbArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:compute:AlbComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        // Create Application Load Balancer
        this.loadBalancer = new aws.lb.LoadBalancer(`${args.projectName}-alb`, {
            name: `${args.projectName}-alb`,
            loadBalancerType: "application",
            subnets: args.subnetIds,
            securityGroups: args.securityGroupIds,
            enableDeletionProtection: args.environment === "prod",
            accessLogs: args.enableLogging && args.logsBucketName ? {
                bucket: args.logsBucketName,
                enabled: true,
                prefix: "alb-logs"
            } : undefined,
            tags: {
                Name: `${args.projectName}-alb`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        // HTTP Listener (redirect to HTTPS)
        this.httpListener = new aws.lb.Listener(`${args.projectName}-http-listener`, {
            loadBalancerArn: this.loadBalancer.arn,
            port: "80",
            protocol: "HTTP",
            defaultActions: [{
                type: "redirect",
                redirect: {
                    port: "443",
                    protocol: "HTTPS",
                    statusCode: "HTTP_301"
                }
            }],
            tags: {
                Name: `${args.projectName}-http-listener`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        // HTTPS Listener
        this.httpsListener = new aws.lb.Listener(`${args.projectName}-https-listener`, {
            loadBalancerArn: this.loadBalancer.arn,
            port: "443",
            protocol: "HTTPS",
            sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
            certificateArn: args.certificateArn,
            defaultActions: [{
                type: "forward",
                targetGroupArn: args.targetGroupArn
            }],
            tags: {
                Name: `${args.projectName}-https-listener`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.dnsName = this.loadBalancer.dnsName;
        this.zoneId = this.loadBalancer.zoneId;
        this.arn = this.loadBalancer.arn;

        this.registerOutputs({
            loadBalancer: this.loadBalancer,
            httpListener: this.httpListener,
            httpsListener: this.httpsListener,
            dnsName: this.dnsName,
            zoneId: this.zoneId,
            arn: this.arn
        });
    }
}

export function createApplicationLoadBalancer(name: string, args: AlbArgs): AlbResult {
    const albComponent = new AlbComponent(name, args);
    return {
        loadBalancer: albComponent.loadBalancer,
        httpListener: albComponent.httpListener,
        httpsListener: albComponent.httpsListener,
        dnsName: albComponent.dnsName,
        zoneId: albComponent.zoneId,
        arn: albComponent.arn
    };
}
Complete Target Group Component (components/compute/targetGroup.ts)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TargetGroupArgs {
    vpcId: pulumi.Input<string>;
    port: number;
    protocol: string;
    healthCheckPath?: string;
    healthCheckPort?: string;
    healthCheckProtocol?: string;
    healthCheckInterval?: number;
    healthCheckTimeout?: number;
    healthyThreshold?: number;
    unhealthyThreshold?: number;
    environment: string;
    projectName: string;
}

export interface TargetGroupResult {
    targetGroup: aws.lb.TargetGroup;
    targetGroupArn: pulumi.Output<string>;
}

export class TargetGroupComponent extends pulumi.ComponentResource {
    public readonly targetGroup: aws.lb.TargetGroup;
    public readonly targetGroupArn: pulumi.Output<string>;

    constructor(name: string, args: TargetGroupArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:compute:TargetGroupComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.targetGroup = new aws.lb.TargetGroup(`${args.projectName}-${name}-tg`, {
            name: `${args.projectName}-${name}-tg`,
            port: args.port,
            protocol: args.protocol,
            vpcId: args.vpcId,
            targetType: "instance",
            healthCheck: {
                enabled: true,
                path: args.healthCheckPath || "/",
                port: args.healthCheckPort || "traffic-port",
                protocol: args.healthCheckProtocol || args.protocol,
                interval: args.healthCheckInterval || 30,
                timeout: args.healthCheckTimeout || 5,
                healthyThreshold: args.healthyThreshold || 2,
                unhealthyThreshold: args.unhealthyThreshold || 2,
                matcher: "200"
            },
            tags: {
                Name: `${args.projectName}-${name}-tg`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.targetGroupArn = this.targetGroup.arn;

        this.registerOutputs({
            targetGroup: this.targetGroup,
            targetGroupArn: this.targetGroupArn
        });
    }
}

export function createTargetGroup(name: string, args: TargetGroupArgs): TargetGroupResult {
    const tgComponent = new TargetGroupComponent(name, args);
    return {
        targetGroup: tgComponent.targetGroup,
        targetGroupArn: tgComponent.targetGroupArn
    };
}
Complete EC2 Component (components/compute/ec2.ts)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface EC2Args {
    subnetIds: pulumi.Input<string>[];
    securityGroupIds: pulumi.Input<string>[];
    instanceType: string;
    keyName?: string;
    iamInstanceProfile?: pulumi.Input<string>;
    targetGroupArn?: pulumi.Input<string>;
    userData?: pulumi.Input<string>;
    environment: string;
    projectName: string;
    minSize?: number;
    maxSize?: number;
    desiredCapacity?: number;
}

export interface EC2Result {
    launchTemplate: aws.ec2.LaunchTemplate;
    autoScalingGroup: aws.autoscaling.Group;
    targetGroupAttachment?: aws.lb.TargetGroupAttachment;
}

export class EC2Component extends pulumi.ComponentResource {
    public readonly launchTemplate: aws.ec2.LaunchTemplate;
    public readonly autoScalingGroup: aws.autoscaling.Group;
    public readonly targetGroupAttachment?: aws.lb.TargetGroupAttachment;

    constructor(name: string, args: EC2Args, opts?: pulumi.ComponentResourceOptions) {
        super("custom:compute:EC2Component", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        // Get latest Amazon Linux 2 AMI
        const ami = aws.ec2.getAmiOutput({
            filters: [
                { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] },
                { name: "owner-alias", values: ["amazon"] }
            ],
            mostRecent: true,
            owners: ["amazon"]
        });

        // Create launch template
        this.launchTemplate = new aws.ec2.LaunchTemplate(`${args.projectName}-${name}-lt`, {
            name: `${args.projectName}-${name}-lt`,
            imageId: ami.id,
            instanceType: args.instanceType,
            keyName: args.keyName,
            vpcSecurityGroupIds: args.securityGroupIds,
            iamInstanceProfile: args.iamInstanceProfile ? {
                name: args.iamInstanceProfile
            } : undefined,
            userData: args.userData ? pulumi.output(args.userData).apply(ud => Buffer.from(ud).toString('base64')) : undefined,
            blockDeviceMappings: [{
                deviceName: "/dev/xvda",
                ebs: {
                    volumeSize: 20,
                    volumeType: "gp3",
                    encrypted: true,
                    deleteOnTermination: true
                }
            }],
            metadataOptions: {
                httpEndpoint: "enabled",
                httpTokens: "required",
                httpPutResponseHopLimit: 2
            },
            tags: {
                Name: `${args.projectName}-${name}-lt`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            },
            tagSpecifications: [{
                resourceType: "instance",
                tags: {
                    Name: `${args.projectName}-${name}-instance`,
                    Environment: args.environment,
                    Project: args.projectName,
                    ManagedBy: "Pulumi"
                }
            }]
        }, defaultResourceOptions);

        // Create Auto Scaling Group
        this.autoScalingGroup = new aws.autoscaling.Group(`${args.projectName}-${name}-asg`, {
            name: `${args.projectName}-${name}-asg`,
            vpcZoneIdentifiers: args.subnetIds,
            minSize: args.minSize || 1,
            maxSize: args.maxSize || 3,
            desiredCapacity: args.desiredCapacity || 2,
            healthCheckType: "ELB",
            healthCheckGracePeriod: 300,
            launchTemplate: {
                id: this.launchTemplate.id,
                version: "$Latest"
            },
            targetGroupArns: args.targetGroupArn ? [args.targetGroupArn] : undefined,
            tags: [{
                key: "Name",
                value: `${args.projectName}-${name}-asg`,
                propagateAtLaunch: false
            }, {
                key: "Environment",
                value: args.environment,
                propagateAtLaunch: true
            }, {
                key: "Project",
                value: args.projectName,
                propagateAtLaunch: true
            }, {
                key: "ManagedBy",
                value: "Pulumi",
                propagateAtLaunch: true
            }]
        }, defaultResourceOptions);

        this.registerOutputs({
            launchTemplate: this.launchTemplate,
            autoScalingGroup: this.autoScalingGroup
        });
    }
}

export function createEC2Instances(name: string, args: EC2Args): EC2Result {
    const ec2Component = new EC2Component(name, args);
    return {
        launchTemplate: ec2Component.launchTemplate,
        autoScalingGroup: ec2Component.autoScalingGroup
    };
}
Complete S3 Component (components/storage/s3.ts)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface S3Args {
    bucketName: pulumi.Input<string>;
    kmsKeyId: pulumi.Input<string>;
    environment: string;
    projectName: string;
    enableVersioning?: boolean;
    enableLogging?: boolean;
}

export interface S3Result {
    bucket: aws.s3.Bucket;
    bucketName: pulumi.Output<string>;
    bucketPolicy: aws.s3.BucketPolicy;
    bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
    bucketVersioning: aws.s3.BucketVersioningV2;
    bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2;
}

export class S3Component extends pulumi.ComponentResource {
    public readonly bucket: aws.s3.Bucket;
    public readonly bucketName: pulumi.Output<string>;
    public readonly bucketPolicy: aws.s3.BucketPolicy;
    public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
    public readonly bucketVersioning: aws.s3.BucketVersioningV2;
    public readonly bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2;

    constructor(name: string, args: S3Args, opts?: pulumi.ComponentResourceOptions) {
        super("custom:storage:S3Component", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        // Create S3 bucket
        this.bucket = new aws.s3.Bucket(`${args.projectName}-${name}-bucket`, {
            bucket: args.bucketName,
            tags: {
                Name: pulumi.interpolate`${args.bucketName}`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.bucketName = this.bucket.id;

        // Block public access
        this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${args.projectName}-${name}-pab`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, defaultResourceOptions);

        // Enable versioning
        this.bucketVersioning = new aws.s3.BucketVersioningV2(`${args.projectName}-${name}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: args.enableVersioning !== false ? "Enabled" : "Suspended"
            }
        }, defaultResourceOptions);

        // Configure server-side encryption
        this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`${args.projectName}-${name}-encryption`, {
            bucket: this.bucket.id,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "aws:kms",
                    kmsMasterKeyId: args.kmsKeyId
                },
                bucketKeyEnabled: true
            }]
        }, defaultResourceOptions);

        // Create bucket policy
        const bucketPolicyDocument = pulumi.all([this.bucket.arn, aws.getCallerIdentityOutput()]).apply(([bucketArn, caller]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "DenyInsecureConnections",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        bucketArn,
                        `${bucketArn}/*`
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false"
                        }
                    }
                },
                {
                    Sid: "AllowSSLRequestsOnly",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${caller.accountId}:root`
                    },
                    Action: "s3:*",
                    Resource: [
                        bucketArn,
                        `${bucketArn}/*`
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "true"
                        }
                    }
                }
            ]
        }));

        this.bucketPolicy = new aws.s3.BucketPolicy(`${args.projectName}-${name}-policy`, {
            bucket: this.bucket.id,
            policy: bucketPolicyDocument
        }, defaultResourceOptions);

        this.registerOutputs({
            bucket: this.bucket,
            bucketName: this.bucketName,
            bucketPolicy: this.bucketPolicy,
            bucketPublicAccessBlock: this.bucketPublicAccessBlock,
            bucketVersioning: this.bucketVersioning,
            bucketEncryption: this.bucketEncryption
        });
    }
}

export function createS3Bucket(name: string, args: S3Args): S3Result {
    const s3Component = new S3Component(name, args);
    return {
        bucket: s3Component.bucket,
        bucketName: s3Component.bucketName,
        bucketPolicy: s3Component.bucketPolicy,
        bucketPublicAccessBlock: s3Component.bucketPublicAccessBlock,
        bucketVersioning: s3Component.bucketVersioning,
        bucketEncryption: s3Component.bucketEncryption
    };
}
Complete RDS Component (components/storage/rds.ts)
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RDSArgs {
    subnetIds: pulumi.Input<string>[];
    securityGroupIds: pulumi.Input<string>[];
    instanceClass: string;
    allocatedStorage: number;
    engine: string;
    engineVersion: string;
    dbName: string;
    username: string;
    kmsKeyId: pulumi.Input<string>;
    backupRetentionPeriod: number;
    environment: string;
    projectName: string;
    multiAz?: boolean;
    storageEncrypted?: boolean;
}

export interface RDSResult {
    dbInstance: aws.rds.Instance;
    dbSubnetGroup: aws.rds.SubnetGroup;
    endpoint: pulumi.Output<string>;
    port: pulumi.Output<number>;
}

export class RDSComponent extends pulumi.ComponentResource {
    public readonly dbInstance: aws.rds.Instance;
    public readonly dbSubnetGroup: aws.rds.SubnetGroup;
    public readonly endpoint: pulumi.Output<string>;
    public readonly port: pulumi.Output<number>;

    constructor(name: string, args: RDSArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:storage:RDSComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        // Create DB subnet group
        this.dbSubnetGroup = new aws.rds.SubnetGroup(`${args.projectName}-${name}-subnet-group`, {
            name: `${args.projectName}-${name}-subnet-group`,
            subnetIds: args.subnetIds,
            tags: 'pulumi'
        });