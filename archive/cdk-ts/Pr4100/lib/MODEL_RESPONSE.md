### Reasoning Trace
---

This is a complex enterprise-level AWS CDK application request. Let me break down the requirements and design a comprehensive solution:

## Architecture Overview:

1. **Multi-Region Setup**: Primary and secondary regions for HA/DR
2. **Networking**: Using existing VPCs and subnets
3. **Compute**: Auto-scaling EC2 instances behind ALB
4. **Storage**: RDS for database, S3 for static content
5. **Security**: TLS 1.2, encryption at rest, least-privilege IAM
6. **CI/CD**: CodePipeline with CodeBuild
7. **Monitoring**: CloudWatch alarms, CloudTrail for auditing
8. **DNS**: Route 53 with custom domain

## Key Design Decisions:

- Use Application Load Balancer (ALB) for HTTPS termination
- Auto Scaling Group for EC2 instances with health checks
- Multi-AZ RDS deployment with automated backups
- S3 with versioning for static content
- CloudFront for global content delivery
- Cross-region replication for disaster recovery
- Separate stacks for different concerns (networking, compute, storage, CI/CD)

Let me create a comprehensive CDK application structure:

1. `main.ts` - Entry point
2. `lib/stacks/networking-stack.ts` - VPC references
3. `lib/stacks/compute-stack.ts` - EC2, ALB, ASG
4. `lib/stacks/storage-stack.ts` - RDS, S3
5. `lib/stacks/cicd-stack.ts` - Pipeline
6. `lib/stacks/monitoring-stack.ts` - CloudWatch, Alarms
7. `lib/constructs/` - Reusable constructs
8. `test/` - Unit tests
### Answer 
---

## 🏗️ Architecture Overview & Design Rationale

Before implementing the CDK code, let me explain the architectural decisions for this enterprise-level multi-region deployment:

### **Core Architecture Principles:**
1. **High Availability**: Multi-AZ deployments with cross-region failover
2. **Security-First**: End-to-end encryption, least-privilege IAM, network isolation
3. **Cost Optimization**: Right-sized instances, auto-scaling, spot instances where applicable
4. **Observability**: Comprehensive monitoring, logging, and alerting

### **Component Architecture:**
- **Primary Region**: Full application stack (ALB → ASG → EC2 → RDS)
- **Secondary Region**: Standby infrastructure with read replicas
- **Global Services**: Route 53 (DNS), CloudFront (CDN), S3 (cross-region replication)
- **CI/CD**: Cross-region pipeline with automated testing and deployment

---

## 📦 Complete CDK TypeScript Application

### **Project Structure:**
```
enterprise-app/
├── bin/
│   └── main.ts
├── lib/
│   ├── stacks/
│   │   ├── networking-stack.ts
│   │   ├── compute-stack.ts
│   │   ├── storage-stack.ts
│   │   ├── monitoring-stack.ts
│   │   └── cicd-stack.ts
│   ├── constructs/
│   │   ├── secure-bucket.ts
│   │   └── secure-database.ts
│   └── config/
│       └── environment-config.ts
├── test/
│   └── stacks.test.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

### **1. Entry Point - `bin/main.ts`**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from '../lib/stacks/networking-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { CiCdStack } from '../lib/stacks/cicd-stack';
import { EnvironmentConfig } from '../lib/config/environment-config';

/**
 * Main CDK Application Entry Point
 * Orchestrates multi-region deployment with cross-stack dependencies
 */
const app = new cdk.App();

// Environment configuration for multi-region deployment
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-west-2';
const accountId = app.node.tryGetContext('accountId') || process.env.CDK_DEFAULT_ACCOUNT;

const envPrimary = { account: accountId, region: primaryRegion };
const envSecondary = { account: accountId, region: secondaryRegion };

// Retrieve existing VPC configurations from context
const existingVpcConfig = {
  primary: {
    vpcId: app.node.tryGetContext('primaryVpcId'),
    privateSubnetIds: app.node.tryGetContext('primaryPrivateSubnetIds'),
    publicSubnetIds: app.node.tryGetContext('primaryPublicSubnetIds'),
  },
  secondary: {
    vpcId: app.node.tryGetContext('secondaryVpcId'),
    privateSubnetIds: app.node.tryGetContext('secondaryPrivateSubnetIds'),
    publicSubnetIds: app.node.tryGetContext('secondaryPublicSubnetIds'),
  }
};

// === PRIMARY REGION STACKS ===
const primaryNetworkingStack = new NetworkingStack(app, 'PrimaryNetworkingStack', {
  env: envPrimary,
  vpcConfig: existingVpcConfig.primary,
  isPrimary: true,
});

const primaryStorageStack = new StorageStack(app, 'PrimaryStorageStack', {
  env: envPrimary,
  vpc: primaryNetworkingStack.vpc,
  isPrimary: true,
});

const primaryComputeStack = new ComputeStack(app, 'PrimaryComputeStack', {
  env: envPrimary,
  vpc: primaryNetworkingStack.vpc,
  database: primaryStorageStack.database,
  staticBucket: primaryStorageStack.staticBucket,
  domainName: app.node.tryGetContext('domainName') || 'example.com',
  certificateArn: app.node.tryGetContext('certificateArn'),
});

const primaryMonitoringStack = new MonitoringStack(app, 'PrimaryMonitoringStack', {
  env: envPrimary,
  autoScalingGroup: primaryComputeStack.autoScalingGroup,
  loadBalancer: primaryComputeStack.loadBalancer,
  database: primaryStorageStack.database,
});

// === SECONDARY REGION STACKS (Disaster Recovery) ===
const secondaryNetworkingStack = new NetworkingStack(app, 'SecondaryNetworkingStack', {
  env: envSecondary,
  vpcConfig: existingVpcConfig.secondary,
  isPrimary: false,
});

const secondaryStorageStack = new StorageStack(app, 'SecondaryStorageStack', {
  env: envSecondary,
  vpc: secondaryNetworkingStack.vpc,
  isPrimary: false,
  primaryBucket: primaryStorageStack.staticBucket,
});

// === GLOBAL CI/CD PIPELINE ===
const cicdStack = new CiCdStack(app, 'CiCdStack', {
  env: envPrimary,
  primaryRegion,
  secondaryRegion,
  artifactBucket: primaryStorageStack.artifactBucket,
});

// Add tags for cost tracking and compliance
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Project', 'EnterpriseWebApp');
cdk.Tags.of(app).add('CostCenter', 'Engineering');

app.synth();
```

### **2. Networking Stack - `lib/stacks/networking-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface NetworkingStackProps extends cdk.StackProps {
  vpcConfig: {
    vpcId: string;
    privateSubnetIds: string[];
    publicSubnetIds: string[];
  };
  isPrimary: boolean;
}

/**
 * Networking Stack - References existing VPCs and creates security groups
 * Implements network isolation and security best practices
 */
export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Import existing VPC - using existing infrastructure as required
    this.vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVpc', {
      vpcId: props.vpcConfig.vpcId,
      availabilityZones: cdk.Stack.of(this).availabilityZones,
      privateSubnetIds: props.vpcConfig.privateSubnetIds,
      publicSubnetIds: props.vpcConfig.publicSubnetIds,
    });

    // ALB Security Group - Only allows HTTPS (TLS 1.2)
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer - HTTPS only',
      allowAllOutbound: false, // Explicit outbound rules for security
    });

    // Allow HTTPS inbound from internet
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Application Security Group - EC2 instances
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application instances',
      allowAllOutbound: false, // Least privilege principle
    });

    // Allow traffic from ALB to app instances
    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // Allow HTTPS outbound for external API calls
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for external APIs'
    );

    // Database Security Group
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false, // No outbound needed for DB
    });

    // Allow connection from app instances to database
    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL connection from app instances'
    );

    // ALB outbound rule to app instances
    this.albSecurityGroup.addEgressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB to reach app instances'
    );

    // App outbound rule to database
    this.appSecurityGroup.addEgressRule(
      this.dbSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow app to reach database'
    );

    // Export values for cross-stack reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}-VpcId`,
    });
  }
}
```

### **3. Compute Stack - `lib/stacks/compute-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  staticBucket: s3.Bucket;
  domainName: string;
  certificateArn?: string;
}

/**
 * Compute Stack - Manages EC2 instances, Auto Scaling, and Load Balancing
 * Implements high availability with health checks and auto-replacement
 */
export class ComputeStack extends cdk.Stack {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Import networking resources
    const networkingStack = cdk.Stack.of(scope).node.findChild('PrimaryNetworkingStack') as NetworkingStack;
    
    // IAM Role for EC2 instances - Least privilege principle
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'), // For Systems Manager
      ],
    });

    // Grant read access to static content bucket
    props.staticBucket.grantRead(instanceRole);

    // Grant access to Parameter Store for secure configuration
    instanceRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath',
      ],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/app/*`],
    }));

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y nodejs npm',
      
      // Install and configure application
      'mkdir -p /opt/app',
      'cd /opt/app',
      
      // CloudWatch agent configuration for enhanced monitoring
      'cat << EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
      JSON.stringify({
        metrics: {
          namespace: 'EnterpriseApp',
          metrics_collected: {
            cpu: {
              measurement: [{ name: 'cpu_usage_idle', rename: 'CPU_IDLE', unit: 'Percent' }],
              totalcpu: false,
            },
            mem: {
              measurement: [{ name: 'mem_used_percent', rename: 'MEM_USED', unit: 'Percent' }],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start',
      
      // Application health check endpoint
      'echo "const express = require(\'express\'); const app = express(); app.get(\'/health\', (req, res) => res.status(200).send(\'OK\')); app.listen(8080);" > server.js',
      'npm install express',
      'nohup node server.js &',
    );

    // Launch Template for consistent instance configuration
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      role: instanceRole,
      securityGroup: networkingStack.appSecurityGroup,
      
      // Enable detailed monitoring for better observability
      detailedMonitoring: true,
      
      // Enable Instance Metadata Service v2 for enhanced security
      requireImdsv2: true,
      
      // EBS encryption at rest with AES-256
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(30, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
          deleteOnTermination: true,
        }),
      }],
    });

    // Auto Scaling Group with health checks and replacement policy
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc: props.vpc,
      launchTemplate,
      minCapacity: 2, // Minimum for HA
      maxCapacity: 10, // Maximum for cost control
      desiredCapacity: 4, // Initial capacity across AZs
      
      // Spread across multiple AZs for high availability
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      
      // Health check configuration with auto-replacement
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      
      // Replace unhealthy instances automatically
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 2,
        minInstancesInService: 2,
        suspendProcesses: [
          autoscaling.ScalingProcess.HEALTH_CHECK,
          autoscaling.ScalingProcess.REPLACE_UNHEALTHY,
        ],
      }),
      
      // Termination policies for cost optimization
      terminationPolicies: [
        autoscaling.TerminationPolicy.OLDEST_INSTANCE,
      ],
    });

    // CPU-based auto-scaling policy
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70, // Scale when CPU exceeds 70%
      cooldown: cdk.Duration.minutes(5),
      estimatedInstanceWarmup: cdk.Duration.minutes(5),
    });

    // Memory-based auto-scaling using custom metric
    this.autoScalingGroup.scaleOnMetric('MemoryScaling', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'EnterpriseApp',
        metricName: 'MEM_USED',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 60, change: -1 }, // Scale in when memory < 60%
        { lower: 80, change: +1 }, // Scale out when memory > 80%
        { lower: 90, change: +2 }, // Aggressive scale out when memory > 90%
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: networkingStack.albSecurityGroup,
      
      // Enable access logs for audit compliance
      logAccessLogs: true,
      
      // Enable deletion protection for production
      deletionProtection: true,
      
      // Drop invalid header fields for security
      dropInvalidHeaderFields: true,
    });

    // TLS Certificate for HTTPS
    let certificate: acm.ICertificate;
    if (props.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
    } else {
      // Create new certificate if not provided
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.domainName,
      });
      
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: props.domainName,
        subjectAlternativeNames: [`*.${props.domainName}`],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

    // HTTPS Listener with TLS 1.2 only
    const httpsListener = this.loadBalancer.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.TLS12_EXT, // TLS 1.2+ only as required
    });

    // Target Group with health checks
    const targetGroup = httpsListener.addTargets('TargetGroup', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],
      
      // Health check configuration
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyHttpCodes: '200',
      },
      
      // Deregistration delay for graceful shutdown
      deregistrationDelay: cdk.Duration.seconds(30),
      
      // Stickiness for session affinity
      stickinessCookieDuration: cdk.Duration.hours(1),
      stickinessCookieName: 'AWSALBAPP',
    });

    // Route 53 DNS configuration
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domainName,
    });

    // Primary A record for the domain
    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(this.loadBalancer)),
      recordName: props.domainName,
    });

    // Health check for multi-region failover
    const healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: props.domainName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    });

    // Outputs for monitoring and debugging
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'ApplicationURL', {
      value: `https://${props.domainName}`,
      description: 'Application URL',
    });
  }
}
```

### **4. Storage Stack - `lib/stacks/storage-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';

export interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  isPrimary: boolean;
  primaryBucket?: s3.Bucket;
}

/**
 * Storage Stack - Manages RDS database and S3 buckets
 * Implements encryption at rest, versioning, and automated backups
 */
export class StorageStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly staticBucket: s3.Bucket;
  public readonly artifactBucket: s3.Bucket;
  public readonly auditBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Import networking resources
    const networkingStack = cdk.Stack.of(scope).node.findChild(
      props.isPrimary ? 'PrimaryNetworkingStack' : 'SecondaryNetworkingStack'
    ) as NetworkingStack;

    // KMS key for encryption at rest (AES-256)
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting storage resources at rest',
      enableKeyRotation: true, // Annual key rotation for security
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
      alias: `alias/${this.stackName}-storage`,
    });

    // S3 Bucket for static content with versioning
    this.staticBucket = new s3.Bucket(this, 'StaticContentBucket', {
      bucketName: `${this.stackName.toLowerCase()}-static-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true, // Enable versioning as required
      
      // Lifecycle rules for cost optimization
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
        transitions: [{
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        }],
      }],
      
      // Security configurations
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true, // Enforce HTTPS/TLS
      serverAccessLogsPrefix: 'access-logs/',
      
      // Intelligent tiering for cost optimization
      intelligentTieringConfigurations: [{
        name: 'optimize-storage',
        archiveAccessTierTime: cdk.Duration.days(90),
        deepArchiveAccessTierTime: cdk.Duration.days(180),
      }],
      
      // CORS configuration for web access
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: [`https://${props.isPrimary ? 'example.com' : 'dr.example.com'}`],
        allowedHeaders: ['*'],
        maxAge: 3600,
      }],
    });

    // S3 Bucket for CI/CD artifacts
    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${this.stackName.toLowerCase()}-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      
      // Auto-delete old artifacts
      lifecycleRules: [{
        id: 'DeleteOldArtifacts',
        expiration: cdk.Duration.days(30),
      }],
    });

    // S3 Bucket for CloudTrail audit logs
    this.auditBucket = new s3.Bucket(this, 'AuditBucket', {
      bucketName: `${this.stackName.toLowerCase()}-audit-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      
      // Object lock for compliance
      objectLockEnabled: true,
      objectLockDefaultRetention: s3.ObjectLockRetention.compliance({
        duration: cdk.Duration.days(2555), // 7 years for compliance
      }),
    });

    // CloudTrail for API audit logging
    const trail = new cloudtrail.Trail(this, 'AuditTrail', {
      bucket: this.auditBucket,
      encryptionKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true, // Ensure log integrity
      
      // Log data events for S3 and Lambda
      includeAllS3DataEvents: true,
    });

    // Cross-region replication for disaster recovery (if secondary region)
    if (!props.isPrimary && props.primaryBucket) {
      const replicationRole = new cdk.aws_iam.Role(this, 'ReplicationRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('s3.amazonaws.com'),
      });

      props.primaryBucket.grantRead(replicationRole);
      this.staticBucket.grantWrite(replicationRole);

      // Configure replication rule
      new s3.CfnBucket(props.primaryBucket.node.defaultChild as s3.CfnBucket, {
        replicationConfiguration: {
          role: replicationRole.roleArn,
          rules: [{
            id: 'ReplicateAll',
            status: 'Enabled',
            priority: 1,
            destination: {
              bucket: this.staticBucket.bucketArn,
              replicationTime: {
                status: 'Enabled',
                time: { minutes: 15 },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: { minutes: 15 },
              },
            },
          }],
        },
      });
    }

    // Database configuration (Primary region only for now)
    if (props.isPrimary) {
      // Database credentials in Secrets Manager
      const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
        description: 'RDS database master credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 32,
        },
      });

      // RDS Database Instance with Multi-AZ for HA
      this.database = new rds.DatabaseInstance(this, 'Database', {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_35,
        }),
        
        // Instance configuration
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [networkingStack.dbSecurityGroup],
        
        // Storage configuration with encryption
        allocatedStorage: 100,
        storageType: rds.StorageType.GP3,
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        
        // Enable automated backups with 7-day retention
        backupRetention: cdk.Duration.days(7),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        
        // Multi-AZ deployment for high availability
        multiAz: true,
        
        // Credentials from Secrets Manager
        credentials: rds.Credentials.fromSecret(dbCredentials),
        
        // Enable performance insights for monitoring
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_1,
        performanceInsightEncryptionKey: encryptionKey,
        
        // CloudWatch logs export
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
        cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
        
        // Deletion protection for production
        deletionProtection: true,
        
        // Auto minor version upgrade for security patches
        autoMinorVersionUpgrade: true,
        
        // Database name
        databaseName: 'enterpriseapp',
      });

      // Read replica for scaling read operations
      const readReplica = new rds.DatabaseInstanceReadReplica(this, 'ReadReplica', {
        sourceDatabaseInstance: this.database,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [networkingStack.dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        enablePerformanceInsights: true,
      });

      // Database proxy for connection pooling
      const dbProxy = new rds.DatabaseProxy(this, 'DbProxy', {
        proxyTarget: rds.ProxyTarget.fromInstance(this.database),
        secrets: [dbCredentials],
        vpc: props.vpc,
        requireTLS: true, // Enforce TLS for security
        maxConnectionsPercent: 100,
        maxIdleConnectionsPercent: 50,
        borrowTimeout: cdk.Duration.seconds(30),
        securityGroups: [networkingStack.dbSecurityGroup],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'StaticBucketName', {
      value: this.staticBucket.bucketName,
      description: 'Static content S3 bucket name',
    });

    if (props.isPrimary) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: this.database.dbInstanceEndpointAddress,
        description: 'RDS database endpoint',
      });
    }
  }
}
```

### **5. CI/CD Stack - `lib/stacks/cicd-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface CiCdStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  artifactBucket: s3.Bucket;
}

/**
 * CI/CD Stack - Implements continuous integration and deployment pipeline
 * Multi-region deployment with automated testing and approval gates
 */
export class CiCdStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: CiCdStackProps) {
    super(scope, id, props);

    // SNS Topic for pipeline notifications
    const pipelineTopic = new sns.Topic(this, 'PipelineNotifications', {
      displayName: 'CI/CD Pipeline Notifications',
    });

    // Add email subscription (replace with actual email)
    pipelineTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('devops@example.com')
    );

    // IAM Role for CodeBuild with least privilege
    const buildRole = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for CodeBuild projects with least privilege access',
    });

    // Grant necessary permissions
    props.artifactBucket.grantReadWrite(buildRole);

    // Build project for application
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${this.stackName}-build`,
      role: buildRole,
      
      // Build environment configuration
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker builds
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
        },
      },
      
      // Build specification
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo Building application...',
              'npm run build',
              'npm run test',
              'npm run lint',
              
              // Security scanning
              'echo Running security scan...',
              'npm audit --audit-level=moderate',
              
              // Build Docker image
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              
              // Generate deployment artifacts
              'echo Creating deployment artifacts...',
              'printf \'{"version":"1.0","Resources":[{"TargetService":{"Type":"AWS::ECS::Service","Properties":{"TaskDefinition":"<TASK_DEFINITION>","LoadBalancerInfo":{"ContainerName":"app","ContainerPort":8080}}}]}}\' > appspec.json',
            ],
          },
        },
        artifacts: {
          files: [
            'appspec.json',
            'task-definition.json',
            '**/*',
          ],
        },
        cache: {
          paths: [
            'node_modules/**/*',
            '.npm/**/*',
          ],
        },
      }),
      
      // Build caching for performance
      cache: codebuild.Cache.s3({
        bucket: props.artifactBucket,
        prefix: 'build-cache',
      }),
      
      // Timeout configuration
      timeout: cdk.Duration.minutes(30),
    });

    // Test project for automated testing
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `${this.stackName}-test`,
      role: buildRole,
      
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm ci'],
          },
          pre_build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
              
              'echo Running E2E tests...',
              'npm run test:e2e',
              
              'echo Generating test reports...',
              'npm run test:coverage',
            ],
          },
        },
        reports: {
          coverage: {
            files: ['coverage/lcov.info'],
            'file-format': 'CLOVERXML',
          },
          tests: {
            files: ['test-results/**/*.xml'],
            'file-format': 'JUNITXML',
          },
        },
        artifacts: {
          files: ['coverage/**/*', 'test-results/**/*'],
        },
      }),
      
      timeout: cdk.Duration.minutes(20),
    });

    // Security scan project
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      projectName: `${this.stackName}-security-scan`,
      role: buildRole,
      
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              python: '3.11',
            },
            commands: [
              'pip install safety bandit',
              'npm install -g snyk',
            ],
          },
          build: {
            commands: [
              'echo Running dependency vulnerability scan...',
              'safety check',
              
              'echo Running static code analysis...',
              'bandit -r . -f json -o bandit-report.json',
              
              'echo Running Snyk security scan...',
              'snyk test --severity-threshold=high',
              
              'echo Running container scan...',
              'aws ecr start-image-scan --repository-name $IMAGE_REPO_NAME --image-id imageTag=$IMAGE_TAG',
            ],
          },
        },
        artifacts: {
          files: ['*-report.json'],
        },
      }),
    });

    // Source artifact
    const sourceArtifact = new codepipeline.Artifact('Source');
    const buildArtifact = new codepipeline.Artifact('Build');
    const testArtifact = new codepipeline.Artifact('Test');

    // Pipeline definition
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${this.stackName}-pipeline`,
      artifactBucket: props.artifactBucket,
      restartExecutionOnUpdate: true,
      
      // Enable pipeline execution history
      enableKeyRotation: true,
      
      stages: [
        // Source stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'Source',
              bucket: props.artifactBucket,
              bucketKey: 'source.zip',
              output: sourceArtifact,
              trigger: codepipeline_actions.S3Trigger.EVENTS, // Trigger on S3 events
            }),
          ],
        },
        
        // Build stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceArtifact,
              outputs: [buildArtifact],
              runOrder: 1,
            }),
          ],
        },
        
        // Test stage with parallel execution
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'UnitTests',
              project: testProject,
              input: buildArtifact,
              outputs: [testArtifact],
              runOrder: 1,
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'SecurityScan',
              project: securityScanProject,
              input: buildArtifact,
              runOrder: 1, // Run in parallel with unit tests
            }),
          ],
        },
        
        // Manual approval for production deployment
        {
          stageName: 'Approval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ManualApproval',
              notificationTopic: pipelineTopic,
              additionalInformation: 'Please review test results and approve production deployment',
              runOrder: 1,
            }),
          ],
        },
        
        // Deploy to primary region
        {
          stageName: 'DeployPrimary',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'DeployPrimaryStack',
              stackName: 'EnterpriseApp-Primary',
              templatePath: buildArtifact.atPath('template.yaml'),
              adminPermissions: false,
              capabilities: [
                cdk.CfnCapabilities.NAMED_IAM,
                cdk.CfnCapabilities.AUTO_EXPAND,
              ],
              region: props.primaryRegion,
              runOrder: 1,
            }),
          ],
        },
        
        // Deploy to secondary region (DR)
        {
          stageName: 'DeploySecondary',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'DeploySecondaryStack',
              stackName: 'EnterpriseApp-Secondary',
              templatePath: buildArtifact.atPath('template.yaml'),
              adminPermissions: false,
              capabilities: [
                cdk.CfnCapabilities.NAMED_IAM,
                cdk.CfnCapabilities.AUTO_EXPAND,
              ],
              region: props.secondaryRegion,
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // Pipeline failure notification
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(pipelineTopic),
      description: 'Notify on pipeline state changes',
      eventPattern: {
        detail: {
          state: ['FAILED', 'SUCCEEDED'],
        },
      },
    });

    // Output pipeline URL
    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
      description: 'Pipeline console URL',
    });
  }
}
```

### **6. Monitoring Stack - `lib/stacks/monitoring-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  autoScalingGroup: autoscaling.AutoScalingGroup;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  database: rds.DatabaseInstance;
}

/**
 * Monitoring Stack - CloudWatch alarms, dashboards, and log aggregation
 * Implements comprehensive observability for all infrastructure components
 */
export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alarm notifications
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'Infrastructure Alarms',
    });

    // Add email subscription for critical alerts
    alarmTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('ops-team@example.com')
    );

    // Central log group for application logs
    const appLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: `/aws/enterprise-app/application`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Metric filter for error tracking
    const errorMetricFilter = new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'error'),
      metricNamespace: 'EnterpriseApp',
      metricName: 'ApplicationErrors',
      metricValue: '1',
      defaultValue: 0,
    });

    // === EC2 Instance Alarms ===
    
    // High CPU utilization alarm
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'CPU utilization exceeds 80% for 10 minutes',
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // High memory utilization alarm
    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'EnterpriseApp',
        metricName: 'MEM_USED',
        dimensionsMap: {
          AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 85,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Memory utilization exceeds 85% for 10 minutes',
    });
    memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // === Load Balancer Alarms ===
    
    // Unhealthy target alarm
    const unhealthyTargetsAlarm = new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          LoadBalancer: props.loadBalancer.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'One or more targets are unhealthy',
    });
    unhealthyTargetsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // High latency alarm
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          LoadBalancer: props.loadBalancer.loadBalancerFullName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'Average response time exceeds 1 second',
    });
    highLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // HTTP 5xx errors alarm
    const http5xxAlarm = new cloudwatch.Alarm(this, 'Http5xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: props.loadBalancer.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'More than 10 5xx errors in 5 minutes',
    });
    http5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // === Database Alarms ===
    
    // High database CPU alarm
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: props.database.metricCPUUtilization({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 75,
      evaluationPeriods: 2,
      alarmDescription: 'Database CPU exceeds 75%',
    });
    dbCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Database connection count alarm
    const dbConnectionAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionAlarm', {
      metric: props.database.metricDatabaseConnections({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80, // Assuming max connections is ~100
      evaluationPeriods: 2,
      alarmDescription: 'Database connections exceed 80',
    });
    dbConnectionAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Low free storage space alarm
    const dbStorageAlarm = new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      metric: props.database.metricFreeStorageSpace({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
      alarmDescription: 'Database free storage below 10GB',
    });
    dbStorageAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // === Application Error Alarms ===
    
    // High error rate alarm
    const errorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorMetricFilter.metric({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 1,
      alarmDescription: 'More than 50 errors in 5 minutes',
    });
    errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // === CloudWatch Dashboard ===
    
    const dashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      dashboardName: `${this.stackName}-dashboard`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // EC2 Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 Instance Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'EnterpriseApp',
            metricName: 'MEM_USED',
            dimensionsMap: {
              AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
      }),
      
      // Load Balancer Metrics Widget
      new cloudwatch.GraphWidget({
        title: 'Load Balancer Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.loadBalancer.loadBalancerFullName,
            },
            statistic: 'Average',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: props.loadBalancer.loadBalancerFullName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      }),
    );

    // Database Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Performance',
        left: [
          props.database.metricCPUUtilization(),
          props.database.metricDatabaseConnections(),
        ],
        width: 12,
      }),
      
      // Error Metrics Widget
      new cloudwatch.GraphWidget({
        title: 'Application Errors',
        left: [
          errorMetricFilter.metric(),
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_5XX_Count',
            dimensionsMap: {
              LoadBalancer: props.loadBalancer.loadBalancerFullName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      }),
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic for alarm notifications',
    });
  }
}
```

### **7. Package Configuration - `package.json`**

```json
{
  "name": "enterprise-cdk-app",
  "version": "1.0.0",
  "description": "Enterprise-grade AWS CDK application with multi-region deployment",
  "bin": {
    "app": "bin/main.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy --all --require-approval never",
    "destroy": "cdk destroy --all",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"**/*.ts\""
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.8.0",
    "@typescript-eslint/eslint-plugin": "^6.7.5",
    "@typescript-eslint/parser": "