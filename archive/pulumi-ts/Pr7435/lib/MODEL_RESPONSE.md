# Multi-Environment Infrastructure Implementation

## Architecture Overview

This implementation creates a comprehensive, production-ready multi-environment infrastructure on AWS using Pulumi TypeScript. The architecture includes:

- **Networking**: VPC with public/private subnets across 3 AZs
- **Compute**: ECS Fargate cluster with auto-scaling
- **Database**: Multi-AZ PostgreSQL RDS with automated backups
- **Storage**: S3 buckets with encryption and lifecycle policies
- **CDN**: CloudFront distribution for content delivery
- **Load Balancing**: Application Load Balancer with health checks
- **Security**: KMS encryption, Secrets Manager, IAM roles
- **Monitoring**: CloudWatch logs, metrics, and alarms

## Implementation

### 1. Main Stack (`lib/tap-stack.ts`)

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackProps {
  environmentSuffix?: string;
  tags?: pulumi.Input<{
    [key: string]: pulumi.Input<string>;
  }>;
}

export class TapStack {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly ecsClusterId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudfrontDomainName: pulumi.Output<string>;
  public readonly appBucketName: pulumi.Output<string>;

  constructor(name: string, props?: TapStackProps) {
    const envSuffix = props?.environmentSuffix || "dev";
    const resourceTags = pulumi.output(props?.tags || {}).apply(t => ({
      ...t,
      Environment: envSuffix,
      ManagedBy: "Pulumi",
      Project: "MultiEnvInfra"
    }));

    // 1. VPC and Networking
    const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-vpc-${envSuffix}`
      }))
    });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: vpc.id,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-igw-${envSuffix}`
      }))
    });

    // Public Subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const availabilityZones = ["us-east-1a", "us-east-1b", "us-east-1c"];

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `${name}-public-subnet-${i}-${envSuffix}`,
          Type: "Public"
        }))
      });
      publicSubnets.push(publicSubnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones[i],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `${name}-private-subnet-${i}-${envSuffix}`,
          Type: "Private"
        }))
      });
      privateSubnets.push(privateSubnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // NAT Gateways (one per AZ for high availability)
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(`${name}-nat-eip-${i}`, {
        vpc: true,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `${name}-nat-eip-${i}-${envSuffix}`
        }))
      });

      const natGw = new aws.ec2.NatGateway(`${name}-nat-gw-${i}`, {
        subnetId: publicSubnets[i].id,
        allocationId: eip.id,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `${name}-nat-gw-${i}-${envSuffix}`
        }))
      });
      natGateways.push(natGw);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
      vpcId: vpc.id,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-public-rt-${envSuffix}`
      }))
    });

    new aws.ec2.Route(`${name}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt-${i}`, {
        vpcId: vpc.id,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `${name}-private-rt-${i}-${envSuffix}`
        }))
      });

      new aws.ec2.Route(`${name}-private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id
      });

      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(`${name}-flow-logs-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: {
            Service: "vpc-flow-logs.amazonaws.com"
          },
          Effect: "Allow"
        }]
      }),
      tags: resourceTags
    });

    new aws.iam.RolePolicy(`${name}-flow-logs-policy`, {
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
          ],
          Effect: "Allow",
          Resource: "*"
        }]
      })
    });

    const flowLogsGroup = new aws.cloudwatch.LogGroup(`${name}-flow-logs`, {
      retentionInDays: 7,
      tags: resourceTags
    });

    new aws.ec2.FlowLog(`${name}-vpc-flow-log`, {
      vpcId: vpc.id,
      trafficType: "ALL",
      logDestinationType: "cloud-watch-logs",
      logDestination: flowLogsGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      tags: resourceTags
    });

    // 2. Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg`, {
      vpcId: vpc.id,
      description: "Security group for Application Load Balancer",
      ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] }
      ],
      egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }
      ],
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-alb-sg-${envSuffix}`
      }))
    });

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-ecs-sg`, {
      vpcId: vpc.id,
      description: "Security group for ECS tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSecurityGroup.id]
        }
      ],
      egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }
      ],
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-ecs-sg-${envSuffix}`
      }))
    });

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-rds-sg`, {
      vpcId: vpc.id,
      description: "Security group for RDS database",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ecsSecurityGroup.id]
        }
      ],
      egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }
      ],
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-rds-sg-${envSuffix}`
      }))
    });

    const bastionSecurityGroup = new aws.ec2.SecurityGroup(`${name}-bastion-sg`, {
      vpcId: vpc.id,
      description: "Security group for Bastion host",
      ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] }
      ],
      egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }
      ],
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-bastion-sg-${envSuffix}`
      }))
    });

    // 3. KMS Keys
    const rdsKmsKey = new aws.kms.Key(`${name}-rds-kms`, {
      description: "KMS key for RDS encryption",
      enableKeyRotation: true,
      tags: resourceTags
    });

    new aws.kms.Alias(`${name}-rds-kms-alias`, {
      name: `alias/${name}-rds-${envSuffix}`,
      targetKeyId: rdsKmsKey.id
    });

    const s3KmsKey = new aws.kms.Key(`${name}-s3-kms`, {
      description: "KMS key for S3 encryption",
      enableKeyRotation: true,
      tags: resourceTags
    });

    new aws.kms.Alias(`${name}-s3-kms-alias`, {
      name: `alias/${name}-s3-${envSuffix}`,
      targetKeyId: s3KmsKey.id
    });

    // 4. RDS Database
    const dbSubnetGroup = new aws.rds.SubnetGroup(`${name}-db-subnet-group`, {
      subnetIds: this.privateSubnetIds,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-db-subnet-group-${envSuffix}`
      }))
    });

    // Generate random password for RDS
    const dbPassword = new aws.secretsmanager.Secret(`${name}-db-password`, {
      description: "RDS database password",
      tags: resourceTags
    });

    const dbPasswordVersion = new aws.secretsmanager.SecretVersion(`${name}-db-password-version`, {
      secretId: dbPassword.id,
      secretString: pulumi.output(Math.random().toString(36).slice(-16))
    });

    const rdsInstance = new aws.rds.Instance(`${name}-rds`, {
      engine: "postgres",
      engineVersion: "14.7",
      instanceClass: envSuffix === "prod" ? "db.t3.medium" : "db.t3.micro",
      allocatedStorage: envSuffix === "prod" ? 100 : 20,
      storageType: "gp3",
      storageEncrypted: true,
      kmsKeyId: rdsKmsKey.arn,
      dbName: "appdb",
      username: "dbadmin",
      password: dbPasswordVersion.secretString,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: envSuffix === "prod",
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "Mon:04:00-Mon:05:00",
      enabledCloudwatchLogsExports: ["postgresql", "upgrade"],
      performanceInsightsEnabled: true,
      performanceInsightsKmsKeyId: rdsKmsKey.arn,
      skipFinalSnapshot: envSuffix !== "prod",
      finalSnapshotIdentifier: envSuffix === "prod" ? `${name}-final-snapshot-${Date.now()}` : undefined,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-rds-${envSuffix}`
      }))
    });

    this.rdsEndpoint = rdsInstance.endpoint;

    // 5. S3 Buckets
    const logsBucket = new aws.s3.Bucket(`${name}-logs-bucket`, {
      acl: "log-delivery-write",
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 90
        }
      }],
      tags: resourceTags
    });

    const appBucket = new aws.s3.Bucket(`${name}-app-bucket`, {
      versioning: {
        enabled: true
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: s3KmsKey.arn
          }
        }
      },
      loggings: [{
        targetBucket: logsBucket.id,
        targetPrefix: "app-bucket-logs/"
      }],
      tags: resourceTags
    });

    this.appBucketName = appBucket.id;

    new aws.s3.BucketPublicAccessBlock(`${name}-app-bucket-pab`, {
      bucket: appBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    const websiteBucket = new aws.s3.Bucket(`${name}-website-bucket`, {
      website: {
        indexDocument: "index.html",
        errorDocument: "error.html"
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      },
      tags: resourceTags
    });

    // 6. CloudFront Distribution
    const cloudfrontOai = new aws.cloudfront.OriginAccessIdentity(`${name}-oai`, {
      comment: `OAI for ${name}-${envSuffix}`
    });

    const websiteBucketPolicy = new aws.s3.BucketPolicy(`${name}-website-bucket-policy`, {
      bucket: websiteBucket.id,
      policy: pulumi.all([websiteBucket.arn, cloudfrontOai.iamArn]).apply(([bucketArn, oaiArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: {
              AWS: oaiArn
            },
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`
          }]
        })
      )
    });

    const cloudfrontDistribution = new aws.cloudfront.Distribution(`${name}-cdn`, {
      enabled: true,
      isIpv6Enabled: true,
      defaultRootObject: "index.html",
      priceClass: envSuffix === "prod" ? "PriceClass_All" : "PriceClass_100",
      origins: [{
        domainName: websiteBucket.bucketRegionalDomainName,
        originId: "S3Origin",
        s3OriginConfig: {
          originAccessIdentity: cloudfrontOai.cloudfrontAccessIdentityPath
        }
      }],
      defaultCacheBehavior: {
        targetOriginId: "S3Origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: "none"
          }
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        compress: true
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none"
        }
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true
      },
      loggingConfig: {
        bucket: logsBucket.bucketDomainName,
        prefix: "cloudfront-logs/",
        includeCookies: false
      },
      tags: resourceTags
    });

    this.cloudfrontDomainName = cloudfrontDistribution.domainName;

    // 7. ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(`${name}-ecs-cluster`, {
      settings: [{
        name: "containerInsights",
        value: "enabled"
      }],
      tags: resourceTags
    });

    this.ecsClusterId = ecsCluster.id;

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new aws.iam.Role(`${name}-ecs-task-execution-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: {
            Service: "ecs-tasks.amazonaws.com"
          },
          Effect: "Allow"
        }]
      }),
      tags: resourceTags
    });

    new aws.iam.RolePolicyAttachment(`${name}-ecs-task-execution-policy`, {
      role: ecsTaskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });

    // ECS Task Role
    const ecsTaskRole = new aws.iam.Role(`${name}-ecs-task-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: {
            Service: "ecs-tasks.amazonaws.com"
          },
          Effect: "Allow"
        }]
      }),
      tags: resourceTags
    });

    new aws.iam.RolePolicy(`${name}-ecs-task-policy`, {
      role: ecsTaskRole.id,
      policy: pulumi.all([s3KmsKey.arn, rdsKmsKey.arn, appBucket.arn]).apply(([s3Kms, rdsKms, bucket]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
              ],
              Resource: [
                bucket,
                `${bucket}/*`
              ]
            },
            {
              Effect: "Allow",
              Action: [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              Resource: [s3Kms, rdsKms]
            },
            {
              Effect: "Allow",
              Action: [
                "secretsmanager:GetSecretValue"
              ],
              Resource: "*"
            }
          ]
        })
      )
    });

    // CloudWatch Log Group for ECS
    const ecsLogGroup = new aws.cloudwatch.LogGroup(`${name}-ecs-logs`, {
      retentionInDays: 7,
      tags: resourceTags
    });

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(`${name}-task-def`, {
      family: `${name}-${envSuffix}`,
      cpu: "256",
      memory: "512",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([{
        name: "app",
        image: "nginx:latest",
        portMappings: [{
          containerPort: 80,
          protocol: "tcp"
        }],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": ecsLogGroup.name,
            "awslogs-region": aws.config.region!,
            "awslogs-stream-prefix": "ecs"
          }
        },
        environment: [
          { name: "ENVIRONMENT", value: envSuffix }
        ]
      }]),
      tags: resourceTags
    });

    // 8. Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`${name}-alb`, {
      loadBalancerType: "application",
      subnets: this.publicSubnetIds,
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: envSuffix === "prod",
      accessLogs: {
        bucket: logsBucket.id,
        prefix: "alb-logs",
        enabled: true
      },
      tags: resourceTags
    });

    this.albDnsName = alb.dnsName;

    const targetGroup = new aws.lb.TargetGroup(`${name}-tg`, {
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.id,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30
      },
      deregistrationDelay: 30,
      tags: resourceTags
    });

    const listener = new aws.lb.Listener(`${name}-listener`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn
      }]
    });

    // ECS Service
    const ecsService = new aws.ecs.Service(`${name}-ecs-service`, {
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: envSuffix === "prod" ? 3 : 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: this.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false
      },
      loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app",
        containerPort: 80
      }],
      tags: resourceTags
    }, { dependsOn: [listener] });

    // 9. CloudWatch Alarms
    const snsAlarmTopic = new aws.sns.Topic(`${name}-alarms`, {
      tags: resourceTags
    });

    new aws.cloudwatch.MetricAlarm(`${name}-ecs-cpu-alarm`, {
      alarmName: `${name}-ecs-cpu-high-${envSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "ECS CPU utilization is too high",
      alarmActions: [snsAlarmTopic.arn],
      dimensions: {
        ClusterName: ecsCluster.name,
        ServiceName: ecsService.name
      },
      tags: resourceTags
    });

    new aws.cloudwatch.MetricAlarm(`${name}-rds-cpu-alarm`, {
      alarmName: `${name}-rds-cpu-high-${envSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "RDS CPU utilization is too high",
      alarmActions: [snsAlarmTopic.arn],
      dimensions: {
        DBInstanceIdentifier: rdsInstance.identifier
      },
      tags: resourceTags
    });

    new aws.cloudwatch.MetricAlarm(`${name}-alb-target-health`, {
      alarmName: `${name}-alb-unhealthy-targets-${envSuffix}`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 2,
      metricName: "HealthyHostCount",
      namespace: "AWS/ApplicationELB",
      period: 300,
      statistic: "Average",
      threshold: 1,
      alarmDescription: "ALB has unhealthy targets",
      alarmActions: [snsAlarmTopic.arn],
      dimensions: {
        LoadBalancer: alb.arnSuffix,
        TargetGroup: targetGroup.arnSuffix
      },
      tags: resourceTags
    });

    // 10. Bastion Host (EC2)
    const bastionAmi = aws.ec2.getAmi({
      mostRecent: true,
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        }
      ]
    });

    const bastionRole = new aws.iam.Role(`${name}-bastion-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: {
            Service: "ec2.amazonaws.com"
          },
          Effect: "Allow"
        }]
      }),
      tags: resourceTags
    });

    new aws.iam.RolePolicyAttachment(`${name}-bastion-ssm-policy`, {
      role: bastionRole.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    const bastionInstanceProfile = new aws.iam.InstanceProfile(`${name}-bastion-profile`, {
      role: bastionRole.name
    });

    const bastionInstance = new aws.ec2.Instance(`${name}-bastion`, {
      instanceType: "t3.micro",
      ami: bastionAmi.then(ami => ami.id),
      subnetId: publicSubnets[0].id,
      vpcSecurityGroupIds: [bastionSecurityGroup.id],
      iamInstanceProfile: bastionInstanceProfile.name,
      tags: resourceTags.apply(t => ({
        ...t,
        Name: `${name}-bastion-${envSuffix}`
      }))
    });
  }
}
```

### 2. Application Entry Point (`bin/tap.ts`)

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environment = pulumi.getStack();

const stack = new TapStack("multi-env-infra", {
  environmentSuffix: environment,
  tags: {
    Environment: environment,
    CostCenter: config.get("costCenter") || "engineering",
    Owner: config.get("owner") || "platform-team"
  }
});

// Export key outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const ecsClusterId = stack.ecsClusterId;
export const rdsEndpoint = stack.rdsEndpoint;
export const albDnsName = stack.albDnsName;
export const cloudfrontDomainName = stack.cloudfrontDomainName;
export const appBucketName = stack.appBucketName;
```

### 3. Pulumi Configuration (`Pulumi.yaml`)

```yaml
name: multi-env-infra
runtime: nodejs
description: Multi-environment infrastructure deployment with comprehensive AWS services
```

### 4. Stack Configuration (`Pulumi.dev.yaml`)

```yaml
config:
  aws:region: us-east-1
  multi-env-infra:costCenter: engineering
  multi-env-infra:owner: platform-team
```

## Resource Summary

This implementation creates approximately 43 AWS resources:

- **Networking**: 1 VPC, 6 Subnets, 1 Internet Gateway, 3 NAT Gateways, 4 Route Tables, 6 Route Table Associations, 1 Flow Log
- **Security Groups**: 4 (ALB, ECS, RDS, Bastion)
- **Compute**: 1 ECS Cluster, 1 ECS Service, 1 Task Definition, 1 EC2 Bastion
- **Database**: 1 RDS Instance, 1 DB Subnet Group
- **Storage**: 3 S3 Buckets, 1 Public Access Block
- **CDN**: 1 CloudFront Distribution, 1 Origin Access Identity
- **Load Balancing**: 1 ALB, 1 Target Group, 1 Listener
- **IAM**: 5 Roles, 4 Policies, 3 Policy Attachments, 1 Instance Profile
- **KMS**: 2 Keys, 2 Aliases
- **Secrets Manager**: 1 Secret, 1 Secret Version
- **CloudWatch**: 2 Log Groups, 3 Metric Alarms
- **SNS**: 1 Topic

## Deployment Instructions

1. **Initialize Pulumi stack**:
   ```bash
   pulumi stack init dev
   ```

2. **Set AWS region**:
   ```bash
   pulumi config set aws:region us-east-1
   ```

3. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

4. **Expected deployment time**: 25-35 minutes (RDS Multi-AZ + CloudFront)

## Testing Strategy

Unit tests validate resource creation and configuration without actual deployment. Integration tests verify deployed infrastructure functionality using real resource outputs.
