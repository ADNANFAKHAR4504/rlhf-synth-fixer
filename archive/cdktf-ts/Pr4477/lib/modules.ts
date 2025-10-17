import { Construct } from 'constructs';

// VPC
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { DataAwsSecretsmanagerRandomPassword } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-random-password';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// Load Balancer
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// EC2
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';

// Auto Scaling
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';

// RDS
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

// SSM
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// CloudWatch
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// SNS
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

interface VpcModuleConfig {
  projectName: string;
  environment: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  enableNatGatewayPerAz?: boolean;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTables: RouteTable[];

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-vpc`,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-igw`,
      },
    });

    // Public Route Table
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Create Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-public-${index + 1}`,
          Type: 'public',
        },
      });

      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });

      return subnet;
    });

    // NAT Gateways
    const natGatewayCount = config.enableNatGatewayPerAz
      ? config.publicSubnetCidrs.length
      : 1;

    this.natGateways = [];
    const elasticIps: Eip[] = [];

    for (let i = 0; i < natGatewayCount; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-nat-eip-${i + 1}`,
        },
      });
      elasticIps.push(eip);

      const natGw = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[i].id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-nat-${i + 1}`,
        },
      });
      this.natGateways.push(natGw);
    }

    // Private Subnets and Route Tables
    this.privateSubnets = [];
    this.privateRouteTables = [];

    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-${index + 1}`,
          Type: 'private',
        },
      });
      this.privateSubnets.push(subnet);

      // Create route table for each private subnet
      const routeTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-rt-${index + 1}`,
        },
      });
      this.privateRouteTables.push(routeTable);

      // Associate subnet with route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      // Add route to NAT Gateway
      const natGatewayIndex = config.enableNatGatewayPerAz ? index : 0;
      new Route(this, `private-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[natGatewayIndex].id,
      });
    });
  }
}

interface SecurityGroupsConfig {
  projectName: string;
  environment: string;
  vpcId: string;
  albAllowedCidr?: string;
  applicationPort?: number;
  databasePort?: number;
  tags: { [key: string]: string };
}

export class SecurityGroupsModule extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupsConfig) {
    super(scope, id);

    const albAllowedCidr = config.albAllowedCidr || '0.0.0.0/0';
    const applicationPort = config.applicationPort || 8080;
    const databasePort = config.databasePort || 5432;

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${config.projectName}-${config.environment}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-alb-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [albAllowedCidr],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTP from internet',
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${config.projectName}-${config.environment}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-ec2-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'ec2-ingress-alb', {
      type: 'ingress',
      fromPort: applicationPort,
      toPort: applicationPort,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-rds-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'rds-ingress-ec2', {
      type: 'ingress',
      fromPort: databasePort,
      toPort: databasePort,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow PostgreSQL from EC2 instances',
    });

    new SecurityGroupRule(this, 'rds-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });
  }
}

interface AlbModuleConfig {
  projectName: string;
  environment: string;
  vpcId: string;
  publicSubnetIds: string[];
  securityGroupId: string;
  targetType?: string;
  healthCheckPath?: string;
  applicationPort?: number;
  enableAccessLogs?: boolean;
  accessLogsBucket?: S3Bucket;
  tags: { [key: string]: string };
}

export class AlbModule extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, config: AlbModuleConfig) {
    super(scope, id);

    const targetType = config.targetType || 'instance';
    const healthCheckPath = config.healthCheckPath || '/';
    const applicationPort = config.applicationPort || 8080;

    // Application Load Balancer
    this.alb = new Lb(this, 'alb', {
      name: `${config.projectName}-${config.environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [config.securityGroupId],
      subnets: config.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      ipAddressType: 'ipv4',
      tags: config.tags,
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, 'tg', {
      name: `${config.projectName}-${config.environment}-tg`,
      port: applicationPort,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: targetType,
      healthCheck: {
        enabled: true,
        path: healthCheckPath,
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      tags: config.tags,
    });

    // HTTP Listener
    this.listener = new LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: config.tags,
    });
  }
}

interface IamModuleConfig {
  projectName: string;
  environment: string;
  enableSsmAccess?: boolean;
  additionalPolicies?: string[];
  tags: { [key: string]: string };
}

export class IamModule extends Construct {
  public readonly instanceRole: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 Instance Role
    this.instanceRole = new IamRole(this, 'instance-role', {
      name: `${config.projectName}-${config.environment}-ec2-role`,
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
      tags: config.tags,
    });

    // SSM Session Manager Policy
    if (config.enableSsmAccess !== false) {
      new IamRolePolicyAttachment(this, 'ssm-managed-policy', {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      });

      // Additional policy for CloudWatch Logs
      new IamRolePolicy(this, 'cloudwatch-logs-policy', {
        name: 'CloudWatchLogsPolicy',
        role: this.instanceRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: [
                `arn:aws:logs:*:*:log-group:/aws/ec2/${config.projectName}-${config.environment}/*`,
              ],
            },
          ],
        }),
      });

      // SSM Parameter Store Read Access
      new IamRolePolicy(this, 'ssm-parameter-policy', {
        name: 'SSMParameterReadPolicy',
        role: this.instanceRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              Resource: [
                `arn:aws:ssm:*:*:parameter/${config.projectName}/${config.environment}/*`,
              ],
            },
          ],
        }),
      });
    }

    // Attach additional managed policies if provided
    if (config.additionalPolicies) {
      config.additionalPolicies.forEach((policyArn, index) => {
        new IamRolePolicyAttachment(this, `additional-policy-${index}`, {
          role: this.instanceRole.name,
          policyArn: policyArn,
        });
      });
    }

    // Instance Profile
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${config.projectName}-${config.environment}-ec2-profile`,
      role: this.instanceRole.name,
      tags: config.tags,
    });
  }
}

interface AsgModuleConfig {
  projectName: string;
  environment: string;
  customAmiId: string;
  instanceType: string;
  keyName?: string;
  instanceProfileArn: string;
  securityGroupIds: string[];
  subnetIds: string[];
  targetGroupArns: string[];
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  userData?: string;
  tags: { [key: string]: string };
}

export class AsgModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, config: AsgModuleConfig) {
    super(scope, id);

    // Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.projectName}-${config.environment}-lt`,
      imageId: config.customAmiId,
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: {
        arn: config.instanceProfileArn,
      },
      userData: config.userData
        ? Buffer.from(config.userData).toString('base64')
        : undefined,
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...config.tags,
            Name: `${config.projectName}-${config.environment}-instance`,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...config.tags,
            Name: `${config.projectName}-${config.environment}-volume`,
          },
        },
      ],
      metadataOptions: {
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
      },
      tags: config.tags,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${config.projectName}-${config.environment}-asg`,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: config.targetGroupArns,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });
  }
}

interface RdsModuleConfig {
  projectName: string;
  environment: string;
  instanceClass: string;
  allocatedStorage: number;
  storageType?: string;
  storageEncrypted?: boolean;
  kmsKeyId?: string;
  engine?: string;
  dbName: string;
  masterUsername: string;
  masterPassword?: string;
  parameterGroupFamily?: string;
  backupRetentionPeriod: number;
  backupWindow?: string;
  maintenanceWindow?: string;
  multiAz: boolean;
  subnetIds: string[];
  securityGroupIds: string[];
  deletionProtection: boolean;
  applyImmediately?: boolean;
  tags: { [key: string]: string };
}

export class RdsModule extends Construct {
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbParameterGroup: DbParameterGroup;
  public readonly dbInstance: DbInstance;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    const engine = config.engine || 'postgres';
    const storageType = config.storageType || 'gp3';
    const parameterGroupFamily = config.parameterGroupFamily || 'postgres15';

    // In your RdsModule constructor:
    const randomPassword = new DataAwsSecretsmanagerRandomPassword(
      this,
      'db-password',
      {
        passwordLength: 32,
        excludeCharacters: '/@" ', // Exclude forbidden characters
      }
    );

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.projectName}-${config.environment}-db-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-db-subnet-group`,
      },
    });

    // DB Parameter Group
    this.dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      name: `${config.projectName}-${config.environment}-db-params`,
      family: parameterGroupFamily,
      parameter: [
        {
          name: 'shared_preload_libraries',
          value: 'pg_stat_statements',
          applyMethod: 'pending-reboot', // Add this line
        },
        {
          name: 'log_statement',
          value: 'all',
          applyMethod: 'immediate', // Add this line for dynamic parameters
        },
      ],
      lifecycle: {
        createBeforeDestroy: true, // Create new parameter group before destroying old one
      },
      tags: config.tags,
    });

    // Generate a unique password if not provided
    const masterPassword = config.masterPassword || this.generatePassword();

    // RDS Instance
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: engine,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: storageType,
      storageEncrypted: config.storageEncrypted !== false,
      kmsKeyId: config.kmsKeyId,
      dbName: config.dbName,
      username: config.masterUsername,
      password: config.masterPassword || randomPassword.randomPassword,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      parameterGroupName: this.dbParameterGroup.name,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: config.backupWindow || '03:00-04:00',
      maintenanceWindow: config.maintenanceWindow || 'sun:04:00-sun:05:00',
      multiAz: config.multiAz,
      deletionProtection: config.deletionProtection,
      applyImmediately: config.applyImmediately || false,
      skipFinalSnapshot: !config.deletionProtection,
      finalSnapshotIdentifier: config.deletionProtection
        ? `${config.projectName}-${config.environment}-final-snapshot-${Date.now()}`
        : undefined,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: config.tags,
    });

    // Store password in SSM Parameter Store
    new SsmParameter(this, 'db-password-param', {
      name: `/${config.projectName}/${config.environment}/rds/master-password`,
      type: 'SecureString',
      value: masterPassword,
      tags: config.tags,
    });
  }

  private generatePassword(): string {
    // In production, use AWS Secrets Manager or external secret management
    // This is a placeholder implementation
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

interface CloudWatchModuleConfig {
  projectName: string;
  environment: string;
  logRetentionDays: number;
  alarmEmail?: string;
  asgName?: string;
  dbInstanceId?: string;
  tags: { [key: string]: string };
}

export class CloudWatchModule extends Construct {
  public readonly applicationLogGroup: CloudwatchLogGroup;
  public readonly albLogGroup: CloudwatchLogGroup;
  public readonly snsTopic: SnsTopic;
  public readonly cpuAlarm?: CloudwatchMetricAlarm;
  public readonly rdsStorageAlarm?: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // Application Log Group
    this.applicationLogGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/ec2/${config.projectName}-${config.environment}/application`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    // ALB Log Group
    this.albLogGroup = new CloudwatchLogGroup(this, 'alb-log-group', {
      name: `/aws/alb/${config.projectName}-${config.environment}`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    // SNS Topic for Alarms
    this.snsTopic = new SnsTopic(this, 'alarm-topic', {
      name: `${config.projectName}-${config.environment}-alarms`,
      displayName: `${config.projectName} ${config.environment} Alarms`,
      tags: config.tags,
    });

    // Email subscription if provided
    if (config.alarmEmail) {
      new SnsTopicSubscription(this, 'alarm-email-subscription', {
        topicArn: this.snsTopic.arn,
        protocol: 'email',
        endpoint: config.alarmEmail,
      });
    }

    // EC2 CPU Alarm
    if (config.asgName) {
      this.cpuAlarm = new CloudwatchMetricAlarm(this, 'cpu-alarm', {
        alarmName: `${config.projectName}-${config.environment}-high-cpu`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alarm when CPU exceeds 80%',
        dimensions: {
          AutoScalingGroupName: config.asgName,
        },
        alarmActions: [this.snsTopic.arn],
        tags: config.tags,
      });
    }

    // RDS Free Storage Alarm
    if (config.dbInstanceId) {
      this.rdsStorageAlarm = new CloudwatchMetricAlarm(
        this,
        'rds-storage-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-low-db-storage`,
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 1,
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 1073741824, // 1 GB in bytes
          alarmDescription: 'Alarm when free storage is less than 1GB',
          dimensions: {
            DBInstanceIdentifier: config.dbInstanceId,
          },
          alarmActions: [this.snsTopic.arn],
          tags: config.tags,
        }
      );
    }
  }
}

interface SsmParameterModuleConfig {
  projectName: string;
  environment: string;
  parameters: { [key: string]: string };
  tags: { [key: string]: string };
}

export class SsmParameterModule extends Construct {
  public readonly parameters: { [key: string]: SsmParameter } = {};

  constructor(scope: Construct, id: string, config: SsmParameterModuleConfig) {
    super(scope, id);

    Object.entries(config.parameters).forEach(([key, value]) => {
      const parameterName = `/${config.projectName}/${config.environment}/${key}`;
      this.parameters[key] = new SsmParameter(this, `param-${key}`, {
        name: parameterName,
        type: 'String',
        value: value,
        tags: config.tags,
      });
    });
  }
}
