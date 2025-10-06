## lib/modules.ts

```typescript
import { Construct } from "constructs";
import {
  DataAwsAvailabilityZones,
  DataAwsVpc,
  DataAwsSubnets,
  SecurityGroup,
  SecurityGroupRule,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  LaunchTemplate,
  AutoscalingGroup,
  AutoscalingPolicy,
  Lb,
  LbTargetGroup,
  LbListener,
  CloudwatchMetricAlarm,
  DbInstance,
  DbSubnetGroup,
  S3Bucket,
  S3BucketVersioning,
  S3BucketPublicAccessBlock,
  SnsTopicSubscription,
  SnsTopic,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
  KeyPair,
  DataAwsAmi,
} from "@cdktf/provider-aws";

export interface StandardTags {
  Environment: string;
  [key: string]: string;
}

export interface NetworkingModuleProps {
  region: string;
  standardTags: StandardTags;
}

export class NetworkingModule extends Construct {
  public readonly vpc: DataAwsVpc;
  public readonly availabilityZones: DataAwsAvailabilityZones;
  public readonly publicSubnets: DataAwsSubnets;
  public readonly privateSubnets: DataAwsSubnets;

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    // Get default VPC
    this.vpc = new DataAwsVpc(this, "default-vpc", {
      default: true,
    });

    // Get availability zones
    this.availabilityZones = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // Get public subnets in default VPC
    this.publicSubnets = new DataAwsSubnets(this, "public-subnets", {
      filter: [
        {
          name: "vpc-id",
          values: [this.vpc.id],
        },
        {
          name: "default-for-az",
          values: ["true"],
        },
      ],
    });

    // Get private subnets (if any exist, otherwise use public)
    this.privateSubnets = new DataAwsSubnets(this, "private-subnets", {
      filter: [
        {
          name: "vpc-id",
          values: [this.vpc.id],
        },
        {
          name: "default-for-az",
          values: ["true"],
        },
      ],
    });
  }
}

export interface SecurityGroupsModuleProps {
  vpcId: string;
  standardTags: StandardTags;
}

export class SecurityGroupsModule extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsModuleProps) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, "alb-sg", {
      name: "tap-alb-security-group",
      description: "Security group for Application Load Balancer",
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: "tap-alb-security-group",
      },
    });

    new SecurityGroupRule(this, "alb-ingress-http", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, "alb-ingress-https", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, "alb-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, "ec2-sg", {
      name: "tap-ec2-security-group",
      description: "Security group for EC2 instances",
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: "tap-ec2-security-group",
      },
    });

    new SecurityGroupRule(this, "ec2-ingress-alb", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, "ec2-ingress-ssh", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/8"],
      securityGroupId: this.ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, "ec2-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.ec2SecurityGroup.id,
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: "tap-rds-security-group",
      description: "Security group for RDS instance",
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: "tap-rds-security-group",
      },
    });

    new SecurityGroupRule(this, "rds-ingress-ec2", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
    });
  }
}

export interface IamModuleProps {
  standardTags: StandardTags;
}

export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // EC2 IAM Role
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: "tap-ec2-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: props.standardTags,
    });

    // EC2 IAM Role Policy
    new IamRolePolicy(this, "ec2-policy", {
      name: "tap-ec2-policy",
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: "arn:aws:logs:*:*:*",
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
            ],
            Resource: "arn:aws:s3:::tap-logs-bucket/*",
          },
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue",
            ],
            Resource: "arn:aws:secretsmanager:*:*:secret:tap-rds-credentials-*",
          },
        ],
      }),
    });

    // Instance Profile
    this.instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "tap-ec2-instance-profile",
      role: this.ec2Role.name,
    });
  }
}

export interface AutoScalingModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  instanceProfileName: string;
  targetGroupArn: string;
  standardTags: StandardTags;
}

export class AutoScalingModule extends Construct {
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;

  constructor(scope: Construct, id: string, props: AutoScalingModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, "launch-template", {
      name: "tap-launch-template",
      imageId: ami.id,
      instanceType: "t3.micro",
      keyName: "tap-key-pair",
      vpcSecurityGroupIds: [props.securityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>TAP Application Server</h1>" > /var/www/html/index.html
        
        # Install CloudWatch agent
        yum install -y amazon-cloudwatch-agent
        
        # Configure detailed monitoring
        /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      `).toString('base64'),
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            ...props.standardTags,
            Name: "tap-web-server",
          },
        },
      ],
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, "asg", {
      name: "tap-auto-scaling-group",
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
      },
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifier: props.subnetIds,
      targetGroupArns: [props.targetGroupArn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      enabledMetrics: [
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances",
      ],
      tag: Object.entries(props.standardTags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Scale Up Policy
    this.scaleUpPolicy = new AutoscalingPolicy(this, "scale-up-policy", {
      name: "tap-scale-up-policy",
      scalingAdjustment: 1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: "SimpleScaling",
    });

    // Scale Down Policy
    this.scaleDownPolicy = new AutoscalingPolicy(this, "scale-down-policy", {
      name: "tap-scale-down-policy",
      scalingAdjustment: -1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: "SimpleScaling",
    });
  }
}

export interface LoadBalancerModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  vpcId: string;
  standardTags: StandardTags;
}

export class LoadBalancerModule extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;

  constructor(scope: Construct, id: string, props: LoadBalancerModuleProps) {
    super(scope, id);

    // Application Load Balancer
    this.loadBalancer = new Lb(this, "alb", {
      name: "tap-application-load-balancer",
      loadBalancerType: "application",
      subnets: props.subnetIds,
      securityGroups: [props.securityGroupId],
      enableDeletionProtection: false,
      tags: {
        ...props.standardTags,
        Name: "tap-application-load-balancer",
      },
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, "target-group", {
      name: "tap-target-group",
      port: 80,
      protocol: "HTTP",
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: "/",
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: "200",
      },
      tags: props.standardTags,
    });

    // Listener
    new LbListener(this, "listener", {
      loadBalancerArn: this.loadBalancer.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

export interface CloudWatchModuleProps {
  autoScalingGroupName: string;
  scaleUpPolicyArn: string;
  scaleDownPolicyArn: string;
  snsTopicArn: string;
  standardTags: StandardTags;
}

export class CloudWatchModule extends Construct {
  constructor(scope: Construct, id: string, props: CloudWatchModuleProps) {
    super(scope, id);

    // High CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, "high-cpu-alarm", {
      alarmName: "tap-high-cpu-utilization",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/AutoScaling",
      period: 120,
      statistic: "Average",
      threshold: 70,
      alarmDescription: "This metric monitors EC2 cpu utilization",
      alarmActions: [
        props.scaleUpPolicyArn,
        props.snsTopicArn,
      ],
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
      tags: props.standardTags,
    });

    // Low CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, "low-cpu-alarm", {
      alarmName: "tap-low-cpu-utilization",
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/AutoScaling",
      period: 120,
      statistic: "Average",
      threshold: 20,
      alarmDescription: "This metric monitors EC2 cpu utilization for scale down",
      alarmActions: [
        props.scaleDownPolicyArn,
        props.snsTopicArn,
      ],
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
      tags: props.standardTags,
    });
  }
}

export interface RdsModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  standardTags: StandardTags;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly secret: SecretsmanagerSecret;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: "tap-db-subnet-group",
      subnetIds: props.subnetIds,
      description: "Database subnet group for TAP",
      tags: props.standardTags,
    });

    // Secrets Manager Secret for RDS credentials
    this.secret = new SecretsmanagerSecret(this, "rds-secret", {
      name: "tap-rds-credentials",
      description: "RDS database credentials for TAP application",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "admin" }),
        generateStringKey: "password",
        excludeCharacters: "\"@/\\",
        passwordLength: 16,
      },
      tags: props.standardTags,
    });

    // RDS Instance
    this.dbInstance = new DbInstance(this, "rds-instance", {
      identifier: "tap-database",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: "gp2",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      dbName: "tapdb",
      username: "admin",
      manageUserPassword: true,
      userPasswordSecretKmsKeyId: "alias/aws/secretsmanager",
      vpcSecurityGroupIds: [props.securityGroupId],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      multiAz: true,
      storageEncrypted: true,
      monitoringInterval: 60,
      performanceInsightsEnabled: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      tags: {
        ...props.standardTags,
        Name: "tap-database",
      },
    });
  }
}

export interface S3ModuleProps {
  standardTags: StandardTags;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // S3 Bucket for logs
    this.bucket = new S3Bucket(this, "logs-bucket", {
      bucket: "tap-logs-bucket-${random_id}",
      tags: {
        ...props.standardTags,
        Name: "tap-logs-bucket",
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, "bucket-versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, "bucket-pab", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

export interface SnsModuleProps {
  email: string;
  standardTags: StandardTags;
}

export class SnsModule extends Construct {
  public readonly topic: SnsTopic;

  constructor(scope: Construct, id: string, props: SnsModuleProps) {
    super(scope, id);

    // SNS Topic
    this.topic = new SnsTopic(this, "alerts-topic", {
      name: "tap-cloudwatch-alerts",
      displayName: "TAP CloudWatch Alerts",
      tags: props.standardTags,
    });

    // SNS Topic Subscription
    new SnsTopicSubscription(this, "email-subscription", {
      topicArn: this.topic.arn,
      protocol: "email",
      endpoint: props.email,
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  NetworkingModule,
  SecurityGroupsModule,
  IamModule,
  AutoScalingModule,
  LoadBalancerModule,
  CloudWatchModule,
  RdsModule,
  S3Module,
  SnsModule,
  StandardTags,
} from "./modules";

export interface TapStackProps {
  region: string;
  operationsEmail: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: props.region,
      defaultTags: {
        tags: {
          Environment: "Production",
          Project: "TAP",
          ManagedBy: "CDKTF",
        },
      },
    });

    // Standard tags
    const standardTags: StandardTags = {
      Environment: "Production",
      Project: "TAP",
      ManagedBy: "CDKTF",
    };

    // Networking Module
    const networking = new NetworkingModule(this, "networking", {
      region: props.region,
      standardTags,
    });

    // Security Groups Module
    const securityGroups = new SecurityGroupsModule(this, "security-groups", {
      vpcId: networking.vpc.id,
      standardTags,
    });

    // IAM Module
    const iam = new IamModule(this, "iam", {
      standardTags,
    });

    // Load Balancer Module
    const loadBalancer = new LoadBalancerModule(this, "load-balancer", {
      subnetIds: networking.publicSubnets.ids,
      securityGroupId: securityGroups.albSecurityGroup.id,
      vpcId: networking.vpc.id,
      standardTags,
    });

    // Auto Scaling Module
    const autoScaling = new AutoScalingModule(this, "auto-scaling", {
      subnetIds: networking.publicSubnets.ids,
      securityGroupId: securityGroups.ec2SecurityGroup.id,
      instanceProfileName: iam.instanceProfile.name,
      targetGroupArn: loadBalancer.targetGroup.arn,
      standardTags,
    });

    // SNS Module
    const sns = new SnsModule(this, "sns", {
      email: props.operationsEmail,
      standardTags,
    });

    // CloudWatch Module
    new CloudWatchModule(this, "cloudwatch", {
      autoScalingGroupName: autoScaling.autoScalingGroup.name,
      scaleUpPolicyArn: autoScaling.scaleUpPolicy.arn,
      scaleDownPolicyArn: autoScaling.scaleDownPolicy.arn,
      snsTopicArn: sns.topic.arn,
      standardTags,
    });

    // RDS Module
    const rds = new RdsModule(this, "rds", {
      subnetIds: networking.publicSubnets.ids,
      securityGroupId: securityGroups.rdsSecurityGroup.id,
      standardTags,
    });

    // S3 Module
    const s3 = new S3Module(this, "s3", {
      standardTags,
    });

    // Outputs
    new TerraformOutput(this, "load-balancer-dns", {
      value: loadBalancer.loadBalancer.dnsName,
      description: "DNS name of the Application Load Balancer",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rds.dbInstance.endpoint,
      description: "RDS instance endpoint",
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3.bucket.bucket,
      description: "S3 bucket name for logs",
    });

    new TerraformOutput(this, "sns-topic-arn", {
      value: sns.topic.arn,
      description: "SNS topic ARN for alerts",
    });

    new TerraformOutput(this, "auto-scaling-group-name", {
      value: autoScaling.autoScalingGroup.name,
      description: "Auto Scaling Group name",
    });
  }
}
```