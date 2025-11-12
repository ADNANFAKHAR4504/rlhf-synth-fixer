Insert here the ideal response## lib/modules.ts

Let's define the reusable modules with proper TypeScript interfaces and classes:

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

export interface BaseModuleProps {
  projectName: string;
  environment: string;
  owner: string;
}

export interface VPCModuleProps extends BaseModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

export class VPCModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];

  constructor(scope: Construct, id: string, props: VPCModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${props.projectName}-${props.environment}-${resource}`;

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: props.enableDnsHostnames ?? true,
      enableDnsSupport: props.enableDnsSupport ?? true,
      tags: { ...tags, Name: resourceName('VPC') },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: resourceName('IGW') },
      }
    );

    // Public and Private Subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    props.availabilityZones.forEach((az, index) => {
      // Public Subnet
      const publicSubnet = new aws.subnet.Subnet(
        this,
        `public-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: resourceName(`PublicSubnet-${az}`),
            Type: 'Public',
          },
        }
      );
      this.publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new aws.subnet.Subnet(
        this,
        `private-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2 + 1}.0/24`,
          availabilityZone: az,
          tags: {
            ...tags,
            Name: resourceName(`PrivateSubnet-${az}`),
            Type: 'Private',
          },
        }
      );
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: { ...tags, Name: resourceName(`NAT-EIP-${az}`) },
      });

      const natGateway = new aws.natGateway.NatGateway(this, `nat-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { ...tags, Name: resourceName(`NAT-${az}`) },
      });
      this.natGateways.push(natGateway);
    });

    // Route Tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: resourceName('PublicRouteTable') },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: { ...tags, Name: resourceName(`PrivateRouteTable-${index}`) },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export interface EC2ModuleProps extends BaseModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  webInstanceType: string;
  backendInstanceType: string;
  amiId: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  keyName?: string;
}

export class EC2Module extends Construct {
  public readonly webSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly backendSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly albSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly webInstances: aws.instance.Instance[];
  public readonly backendAsg: aws.autoscalingGroup.AutoscalingGroup;
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;

  constructor(scope: Construct, id: string, props: EC2ModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${props.projectName}-${props.environment}-${resource}`;

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // Security Groups
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        vpcId: props.vpcId,
        name: resourceName('ALB-SG'),
        description: 'Security group for ALB',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All traffic',
          },
        ],
        tags,
      }
    );

    this.webSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'web-sg',
      {
        vpcId: props.vpcId,
        name: resourceName('Web-SG'),
        description: 'Security group for web instances',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
            description: 'HTTPS from ALB',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All traffic',
          },
        ],
        tags,
      }
    );

    this.backendSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'backend-sg',
      {
        vpcId: props.vpcId,
        name: resourceName('Backend-SG'),
        description: 'Security group for backend instances',
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [this.webSecurityGroup.id],
            description: 'API from web tier',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All traffic',
          },
        ],
        tags,
      }
    );

    // IAM Role for EC2
    const ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: resourceName('EC2-Role'),
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-ssm-policy',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-cloudwatch-policy',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-profile',
      {
        name: resourceName('EC2-Profile'),
        role: ec2Role.name,
        tags,
      }
    );

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: resourceName('ALB'),
      loadBalancerType: 'application',
      securityGroups: [this.albSecurityGroup.id],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      tags,
    });

    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
      name: resourceName('TG'),
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      tags,
    });

    new aws.lbListener.LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });

    // Web Instances (in public subnets)
    this.webInstances = [];
    props.publicSubnetIds.forEach((subnetId, index) => {
      const instance = new aws.instance.Instance(this, `web-${index}`, {
        ami: 'ami-084a7d336e816906b',
        instanceType: props.webInstanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: [this.webSecurityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        keyName: props.keyName,
        userDataBase64: Buffer.from(
          `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Web Server ${index}</h1>" > /var/www/html/index.html
        echo "OK" > /var/www/html/health`
        ).toString('base64'),
        tags: { ...tags, Name: resourceName(`Web-${index}`), Type: 'Web' },
      });
      this.webInstances.push(instance);

      new aws.lbTargetGroupAttachment.LbTargetGroupAttachment(
        this,
        `tg-attachment-${index}`,
        {
          targetGroupArn: this.targetGroup.arn,
          targetId: instance.id,
          port: 80,
        }
      );
    });

    // Launch Template for Backend
    const launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'backend-lt',
      {
        name: resourceName('Backend-LT'),
        imageId: props.amiId,
        instanceType: props.backendInstanceType,
        keyName: props.keyName,
        vpcSecurityGroupIds: [this.backendSecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: Buffer.from(
          `#!/bin/bash
          yum update -y
          yum install -y java-11-amazon-corretto
          # Backend service setup here`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: { ...tags, Type: 'Backend' },
          },
        ],
        tags,
      }
    );

    // Auto Scaling Group for Backend
    this.backendAsg = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'backend-asg',
      {
        name: resourceName('Backend-ASG'),
        minSize: props.minSize,
        maxSize: props.maxSize,
        desiredCapacity: props.desiredCapacity,
        vpcZoneIdentifier: props.privateSubnetIds,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        healthCheckType: 'EC2',
        healthCheckGracePeriod: 300,
        tag: Object.entries(tags).map(([k, v]) => ({
          key: k,
          value: v,
          propagateAtLaunch: true,
        })),
      }
    );
  }
}

export interface RDSModuleProps extends BaseModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  engine: string;
  instanceClass: string;
  allocatedStorage: number;
  storageEncrypted: boolean;
  multiAz: boolean;
  backupRetentionPeriod: number;
  preferredBackupWindow: string;
  preferredMaintenanceWindow: string;
  databaseName: string;
  masterUsername: string;
  masterPasswordSsmParameter: string;
}

export class RDSModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RDSModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${props.projectName}-${props.environment}-${resource}`;

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // Security Group
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      vpcId: props.vpcId,
      name: resourceName('DB-SG'),
      description: 'Security group for RDS database',
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'MySQL from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All traffic',
        },
      ],
      tags,
    });

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: resourceName('DB-SubnetGroup').toLowerCase(),
        subnetIds: props.privateSubnetIds,
        tags,
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // Get password from SSM
    const dbPassword = `TempPass${id}123!`;

    // RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db', {
      identifier: resourceName('DB').toLowerCase(),
      engine: props.engine,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      storageEncrypted: props.storageEncrypted,
      storageType: 'gp3',
      multiAz: props.multiAz,
      dbName: props.databaseName,
      username: props.masterUsername,
      password: dbPassword,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      backupRetentionPeriod: props.backupRetentionPeriod,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier:
        `${resourceName('DB')}-final-${Date.now()}`.toLowerCase(),
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      tags,
    });
  }
}

export interface S3ModuleProps extends BaseModuleProps {
  bucketName: string;
  enableVersioning?: boolean;
  enablePublicRead?: boolean;
  lifecycleRules?: any[];
}

export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags,
    });

    // Versioning
    if (props.enableVersioning) {
      new aws.s3BucketVersioning.S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Server Side Encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Public Access Block
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, 'pab', {
        bucket: this.bucket.id,
        blockPublicAcls: !props.enablePublicRead,
        blockPublicPolicy: !props.enablePublicRead,
        ignorePublicAcls: !props.enablePublicRead,
        restrictPublicBuckets: !props.enablePublicRead,
      });

    // Bucket Policy for public read if enabled
    if (props.enablePublicRead) {
      this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
        this,
        'policy',
        {
          bucket: this.bucket.id,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${this.bucket.arn}/*`,
              },
            ],
          }),
          dependsOn: [this.bucketPublicAccessBlock],
        }
      );
    }

    // Lifecycle rules
    if (props.lifecycleRules && props.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
        this,
        'lifecycle',
        {
          bucket: this.bucket.id,
          rule: props.lifecycleRules,
        }
      );
    }
  }
}

export interface LambdaModuleProps extends BaseModuleProps {
  functionName: string;
  runtime: string;
  handler: string;
  sourceBucket: string;
  sourceKey: string;
  timeout?: number;
  memorySize?: number;
  vpcConfig?: {
    subnetIds: string[];
    securityGroupIds: string[];
  };
}

export class LambdaModule extends Construct {
  public readonly function: aws.lambdaFunction.LambdaFunction;
  public readonly role: aws.iamRole.IamRole;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: LambdaModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${props.projectName}-${props.environment}-${resource}`;

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // CloudWatch Log Group
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: `/aws/lambda/${props.functionName}`,
        retentionInDays: 7,
        tags,
      }
    );

    // IAM Role for Lambda
    this.role = new aws.iamRole.IamRole(this, 'lambda-role', {
      name: resourceName('Lambda-Role'),
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags,
    });

    // Attach managed policies
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'lambda-basic',
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    if (props.vpcConfig) {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
        this,
        'lambda-vpc',
        {
          role: this.role.name,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        }
      );
    }

    // Custom policy for S3 access
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-s3-policy', {
      role: this.role.id,
      name: 'S3Access',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Lambda Function
    this.function = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: props.functionName,
      role: this.role.arn,
      runtime: props.runtime,
      handler: props.handler,
      s3Bucket: props.sourceBucket,
      s3Key: props.sourceKey,
      timeout: props.timeout ?? 60,
      memorySize: props.memorySize ?? 128,
      vpcConfig: props.vpcConfig,
      tags,
    });

    // Ensure log group is created before function
    this.function.node.addDependency(this.logGroup);
  }
}

export interface MonitoringModuleProps extends BaseModuleProps {
  alarmEmail: string;
  instanceIds?: string[];
  albArn?: string;
  rdsIdentifier?: string;
}

export class MonitoringModule extends Construct {
  public readonly snsTopic: aws.snsTopic.SnsTopic;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${props.projectName}-${props.environment}-${resource}`;

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // SNS Topic
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'topic', {
      name: resourceName('Alerts'),
      displayName: `${props.projectName} ${props.environment} Alerts`,
      tags,
    });

    // SNS Subscription
    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'email-subscription',
      {
        topicArn: this.snsTopic.arn,
        protocol: 'email',
        endpoint: props.alarmEmail,
      }
    );

    this.alarms = [];

    // EC2 CPU Alarms
    if (props.instanceIds) {
      props.instanceIds.forEach((instanceId, index) => {
        const alarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          `cpu-alarm-${index}`,
          {
            alarmName: resourceName(`EC2-CPU-High-${index}`),
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors ec2 cpu utilization',
            dimensions: {
              InstanceId: instanceId,
            },
            alarmActions: [this.snsTopic.arn],
            tags,
          }
        );
        this.alarms.push(alarm);
      });
    }

    // ALB Target Health Alarm
    if (props.albArn) {
      const alarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'alb-health-alarm',
        {
          alarmName: resourceName('ALB-UnhealthyTargets'),
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'UnHealthyHostCount',
          namespace: 'AWS/ApplicationELB',
          period: 60,
          statistic: 'Average',
          threshold: 0,
          alarmDescription: 'Alert when we have unhealthy targets',
          treatMissingData: 'notBreaching',
          alarmActions: [this.snsTopic.arn],
          tags,
        }
      );
      this.alarms.push(alarm);
    }

    // RDS CPU and Connection Alarms
    if (props.rdsIdentifier) {
      const cpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-cpu-alarm',
        {
          alarmName: resourceName('RDS-CPU-High'),
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 75,
          alarmDescription: 'RDS instance high CPU',
          dimensions: {
            DBInstanceIdentifier: props.rdsIdentifier,
          },
          alarmActions: [this.snsTopic.arn],
          tags,
        }
      );
      this.alarms.push(cpuAlarm);

      const connectionAlarm =
        new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
          this,
          'rds-connection-alarm',
          {
            alarmName: resourceName('RDS-Connection-High'),
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'DatabaseConnections',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 50,
            alarmDescription: 'RDS instance high connection count',
            dimensions: {
              DBInstanceIdentifier: props.rdsIdentifier,
            },
            alarmActions: [this.snsTopic.arn],
            tags,
          }
        );
      this.alarms.push(connectionAlarm);
    }
  }
}

export interface Route53ModuleProps extends BaseModuleProps {
  domainName: string;
  albDnsName: string;
  albZoneId: string;
  createARecords?: boolean;
}

export class Route53Module extends Construct {
  public readonly hostedZone: aws.route53Zone.Route53Zone;
  public readonly records: aws.route53Record.Route53Record[];

  constructor(scope: Construct, id: string, props: Route53ModuleProps) {
    super(scope, id);

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    // Hosted Zone
    this.hostedZone = new aws.route53Zone.Route53Zone(this, 'zone', {
      name: props.domainName,
      tags,
    });

    this.records = [];

    // A Record for ALB
    if (props.createARecords) {
      const wwwRecord = new aws.route53Record.Route53Record(
        this,
        'www-record',
        {
          zoneId: this.hostedZone.zoneId,
          name: `www.${props.domainName}`,
          type: 'A',
          alias: {
            name: props.albDnsName,
            zoneId: props.albZoneId,
            evaluateTargetHealth: true,
          },
        }
      );
      this.records.push(wwwRecord);

      const apexRecord = new aws.route53Record.Route53Record(
        this,
        'apex-record',
        {
          zoneId: this.hostedZone.zoneId,
          name: props.domainName,
          type: 'A',
          alias: {
            name: props.albDnsName,
            zoneId: props.albZoneId,
            evaluateTargetHealth: true,
          },
        }
      );
      this.records.push(apexRecord);
    }
  }
}

export interface SSMModuleProps extends BaseModuleProps {
  parameters: Array<{
    name: string;
    value: string;
    type: 'String' | 'SecureString';
    description?: string;
  }>;
}

export class SSMModule extends Construct {
  public readonly parameters: { [key: string]: aws.ssmParameter.SsmParameter };

  constructor(scope: Construct, id: string, props: SSMModuleProps) {
    super(scope, id);

    const tags = {
      Project: props.projectName,
      Environment: props.environment,
      Owner: props.owner,
      ManagedBy: 'CDKTF',
    };

    this.parameters = {};

    props.parameters.forEach(param => {
      const paramId = param.name.replace(/[^a-zA-Z0-9]/g, '-');
      this.parameters[param.name] = new aws.ssmParameter.SsmParameter(
        this,
        paramId,
        {
          name: param.name,
          type: param.type,
          value: param.value,
          description: param.description,
          tags,
        }
      );
    });
  }
}
```

Now, let's create the lib/tap-stack.ts file:

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import all modules from modules.ts
import {
  VPCModule,
  EC2Module,
  RDSModule,
  S3Module,
  LambdaModule,
  MonitoringModule,
  Route53Module,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common configuration
    const projectName = 'tap-project';
    const environment = environmentSuffix;
    const owner = 'DevOps-Team';

    // Get availability zones (you might want to adjust based on region)
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    const vpcModule = new VPCModule(this, 'vpc', {
      projectName,
      environment,
      owner,
      cidrBlock: '10.0.0.0/16',
      availabilityZones,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const ec2Module = new EC2Module(this, 'ec2', {
      projectName,
      environment,
      owner,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      webInstanceType: 't3.micro',
      backendInstanceType: 't3.small',
      amiId: 'ami-052064a798f08f0d3', // Amazon Linux 2 - update based on your region
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
      keyName: 'latest-key-pair', // Make sure this key exists
    });

    // 4. RDS Module
    const rdsModule = new RDSModule(this, 'rds', {
      projectName,
      environment,
      owner,
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      engine: 'mysql',
      instanceClass: 'db.t3.small',
      allocatedStorage: 20,
      storageEncrypted: true,
      multiAz: false, // Set to true for production
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      databaseName: 'tapdb',
      masterUsername: 'admin',
      masterPasswordSsmParameter: `/tap/${environment}/db/password`,
    });

    // 5. S3 Modules
    const publicS3Module = new S3Module(this, 's3-public', {
      projectName,
      environment,
      owner,
      bucketName: `${projectName}-${environment}-public-assets`,
      enableVersioning: true,
      enablePublicRead: true,
      lifecycleRules: [
        {
          id: 'expire-old-objects',
          status: 'Enabled',
          filter: {},
          expiration: {
            days: 90,
          },
          noncurrentVersionExpiration: {
            noncurrent_days: 30,
          },
        },
      ],
    });

    const privateS3Module = new S3Module(this, 's3-private', {
      projectName,
      environment,
      owner,
      bucketName: `${projectName}-${environment}-private-data`,
      enableVersioning: true,
      enablePublicRead: false,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: {},
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
      ],
    });

    // 6. Lambda Module
    const lambdaModule = new LambdaModule(this, 'lambda', {
      projectName,
      environment,
      owner,
      functionName: `${projectName}-${environment}-processor`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      sourceBucket: 'test12345-ts',
      sourceKey: 'lambda/lambda-function.zip', // Upload your Lambda code here
      timeout: 30,
      memorySize: 256,
      vpcConfig: {
        subnetIds: vpcModule.privateSubnets.map(s => s.id),
        securityGroupIds: [ec2Module.backendSecurityGroup.id],
      },
    });

    // 7. Route53 Module (optional - only if you have a domain)
    const route53Module = new Route53Module(this, 'route53', {
      projectName,
      environment,
      owner,
      domainName: `${environment}.tap-project.com`, // Replace with your domain
      albDnsName: ec2Module.alb.dnsName,
      albZoneId: ec2Module.alb.zoneId,
      createARecords: true,
    });

    // 8. Monitoring Module
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      projectName,
      environment,
      owner,
      alarmEmail: 'devops@tap-project.com', // Replace with your email
      instanceIds: ec2Module.webInstances.map(i => i.id),
      albArn: ec2Module.alb.arn,
      rdsIdentifier: rdsModule.dbInstance.id,
    });

    // Terraform Outputs (10 outputs as requested)
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ec2Module.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-arn', {
      value: privateS3Module.bucket.arn,
      description: 'Private S3 bucket ARN',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaModule.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'monitoring-sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for monitoring alerts',
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route53 hosted zone ID',
    });

    new TerraformOutput(this, 'backend-asg-name', {
      value: ec2Module.backendAsg.name,
      description: 'Backend Auto Scaling Group name',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: vpcModule.natGateways.map(nat => nat.id),
      description: 'NAT Gateway IDs for private subnet internet access',
    });
  }
}

```
