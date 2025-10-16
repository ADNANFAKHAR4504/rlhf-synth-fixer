## lib/modules.ts

```typescript
import { Construct } from "constructs";
import {
  vpc,
  ec2,
  iam,
  rds,
  autoscaling,
  elb,
  s3,
  cloudwatch,
  sns,
  ssm,
  kms,
} from "@cdktf/provider-aws";

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
  public readonly vpc: vpc.Vpc;
  public readonly publicSubnets: vpc.Subnet[];
  public readonly privateSubnets: vpc.Subnet[];
  public readonly internetGateway: vpc.InternetGateway;
  public readonly natGateways: vpc.NatGateway[];
  public readonly publicRouteTable: vpc.RouteTable;
  public readonly privateRouteTables: vpc.RouteTable[];

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new vpc.Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-vpc`,
      },
    });

    // Internet Gateway
    this.internetGateway = new vpc.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-igw`,
      },
    });

    // Public Route Table
    this.publicRouteTable = new vpc.RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-rt`,
      },
    });

    new vpc.Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Create Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      const subnet = new vpc.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-public-${index + 1}`,
          Type: "public",
        },
      });

      new vpc.RouteTableAssociation(this, `public-rta-${index}`, {
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
    const elasticIps: vpc.Eip[] = [];

    for (let i = 0; i < natGatewayCount; i++) {
      const eip = new vpc.Eip(this, `nat-eip-${i}`, {
        domain: "vpc",
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-nat-eip-${i + 1}`,
        },
      });
      elasticIps.push(eip);

      const natGw = new vpc.NatGateway(this, `nat-gateway-${i}`, {
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
      const subnet = new vpc.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-${index + 1}`,
          Type: "private",
        },
      });
      this.privateSubnets.push(subnet);

      // Create route table for each private subnet
      const routeTable = new vpc.RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-rt-${index + 1}`,
        },
      });
      this.privateRouteTables.push(routeTable);

      // Associate subnet with route table
      new vpc.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      // Add route to NAT Gateway
      const natGatewayIndex = config.enableNatGatewayPerAz ? index : 0;
      new vpc.Route(this, `private-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: "0.0.0.0/0",
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
  public readonly albSecurityGroup: vpc.SecurityGroup;
  public readonly ec2SecurityGroup: vpc.SecurityGroup;
  public readonly rdsSecurityGroup: vpc.SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupsConfig) {
    super(scope, id);

    const albAllowedCidr = config.albAllowedCidr || "0.0.0.0/0";
    const applicationPort = config.applicationPort || 8080;
    const databasePort = config.databasePort || 5432;

    // ALB Security Group
    this.albSecurityGroup = new vpc.SecurityGroup(this, "alb-sg", {
      name: `${config.projectName}-${config.environment}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-alb-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new vpc.SecurityGroupRule(this, "alb-ingress-http", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: [albAllowedCidr],
      securityGroupId: this.albSecurityGroup.id,
      description: "Allow HTTP from internet",
    });

    new vpc.SecurityGroupRule(this, "alb-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
      description: "Allow all outbound traffic",
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new vpc.SecurityGroup(this, "ec2-sg", {
      name: `${config.projectName}-${config.environment}-ec2-sg`,
      description: "Security group for EC2 instances",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-ec2-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new vpc.SecurityGroupRule(this, "ec2-ingress-alb", {
      type: "ingress",
      fromPort: applicationPort,
      toPort: applicationPort,
      protocol: "tcp",
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: "Allow traffic from ALB",
    });

    new vpc.SecurityGroupRule(this, "ec2-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.ec2SecurityGroup.id,
      description: "Allow all outbound traffic",
    });

    // RDS Security Group
    this.rdsSecurityGroup = new vpc.SecurityGroup(this, "rds-sg", {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: "Security group for RDS database",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-rds-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new vpc.SecurityGroupRule(this, "rds-ingress-ec2", {
      type: "ingress",
      fromPort: databasePort,
      toPort: databasePort,
      protocol: "tcp",
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: "Allow PostgreSQL from EC2 instances",
    });

    new vpc.SecurityGroupRule(this, "rds-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.rdsSecurityGroup.id,
      description: "Allow all outbound traffic",
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
  accessLogsBucket?: s3.S3Bucket;
  tags: { [key: string]: string };
}

export class AlbModule extends Construct {
  public readonly alb: elb.Lb;
  public readonly targetGroup: elb.LbTargetGroup;
  public readonly listener: elb.LbListener;

  constructor(scope: Construct, id: string, config: AlbModuleConfig) {
    super(scope, id);

    const targetType = config.targetType || "instance";
    const healthCheckPath = config.healthCheckPath || "/";
    const applicationPort = config.applicationPort || 8080;

    // Application Load Balancer
    this.alb = new elb.Lb(this, "alb", {
      name: `${config.projectName}-${config.environment}-alb`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [config.securityGroupId],
      subnets: config.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      ipAddressType: "ipv4",
      tags: config.tags,
    });

    // Enable access logs if bucket is provided
    if (config.enableAccessLogs && config.accessLogsBucket) {
      new elb.LbAccessLogs(this, "alb-access-logs", {
        loadBalancerArn: this.alb.arn,
        bucket: config.accessLogsBucket.id,
        prefix: `alb-logs/${config.projectName}-${config.environment}`,
        enabled: true,
      });
    }

    // Target Group
    this.targetGroup = new elb.LbTargetGroup(this, "tg", {
      name: `${config.projectName}-${config.environment}-tg`,
      port: applicationPort,
      protocol: "HTTP",
      vpcId: config.vpcId,
      targetType: targetType,
      healthCheck: {
        enabled: true,
        path: healthCheckPath,
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200",
      },
      deregistrationDelay: 30,
      tags: config.tags,
    });

    // HTTP Listener
    this.listener = new elb.LbListener(this, "http-listener", {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
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
  public readonly instanceRole: iam.IamRole;
  public readonly instanceProfile: iam.IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 Instance Role
    this.instanceRole = new iam.IamRole(this, "instance-role", {
      name: `${config.projectName}-${config.environment}-ec2-role`,
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
      tags: config.tags,
    });

    // SSM Session Manager Policy
    if (config.enableSsmAccess !== false) {
      new iam.IamRolePolicyAttachment(this, "ssm-managed-policy", {
        role: this.instanceRole.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      });

      // Additional policy for CloudWatch Logs
      new iam.IamRolePolicy(this, "cloudwatch-logs-policy", {
        name: "CloudWatchLogsPolicy",
        role: this.instanceRole.id,
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
              Resource: [
                `arn:aws:logs:*:*:log-group:/aws/ec2/${config.projectName}-${config.environment}/*`,
              ],
            },
          ],
        }),
      });

      // SSM Parameter Store Read Access
      new iam.IamRolePolicy(this, "ssm-parameter-policy", {
        name: "SSMParameterReadPolicy",
        role: this.instanceRole.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath",
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
        new iam.IamRolePolicyAttachment(this, `additional-policy-${index}`, {
          role: this.instanceRole.name,
          policyArn: policyArn,
        });
      });
    }

    // Instance Profile
    this.instanceProfile = new iam.IamInstanceProfile(this, "instance-profile", {
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
  public readonly launchTemplate: ec2.LaunchTemplate;
  public readonly autoScalingGroup: autoscaling.AutoscalingGroup;

  constructor(scope: Construct, id: string, config: AsgModuleConfig) {
    super(scope, id);

    // Launch Template
    this.launchTemplate = new ec2.LaunchTemplate(this, "launch-template", {
      name: `${config.projectName}-${config.environment}-lt`,
      imageId: config.customAmiId,
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: {
        arn: config.instanceProfileArn,
      },
      userData: config.userData ? Buffer.from(config.userData).toString("base64") : undefined,
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            ...config.tags,
            Name: `${config.projectName}-${config.environment}-instance`,
          },
        },
        {
          resourceType: "volume",
          tags: {
            ...config.tags,
            Name: `${config.projectName}-${config.environment}-volume`,
          },
        },
      ],
      metadataOptions: {
        httpTokens: "required",
        httpPutResponseHopLimit: 1,
      },
      tags: config.tags,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoscalingGroup(this, "asg", {
      name: `${config.projectName}-${config.environment}-asg`,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: config.targetGroupArns,
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      enabledMetrics: [
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances",
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
  engineVersion?: string;
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
  public readonly dbSubnetGroup: rds.DbSubnetGroup;
  public readonly dbParameterGroup: rds.DbParameterGroup;
  public readonly dbInstance: rds.DbInstance;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    const engine = config.engine || "postgres";
    const engineVersion = config.engineVersion || "15.4";
    const storageType = config.storageType || "gp3";
    const parameterGroupFamily = config.parameterGroupFamily || "postgres15";

    // DB Subnet Group
    this.dbSubnetGroup = new rds.DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.projectName}-${config.environment}-db-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-db-subnet-group`,
      },
    });

    // DB Parameter Group
    this.dbParameterGroup = new rds.DbParameterGroup(this, "db-parameter-group", {
      name: `${config.projectName}-${config.environment}-db-params`,
      family: parameterGroupFamily,
      parameter: [
        {
          name: "shared_preload_libraries",
          value: "pg_stat_statements",
        },
        {
          name: "log_statement",
          value: "all",
        },
      ],
      tags: config.tags,
    });

    // Generate a unique password if not provided
    const masterPassword = config.masterPassword || this.generatePassword();

    // RDS Instance
    this.dbInstance = new rds.DbInstance(this, "db-instance", {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: engine,
      engineVersion: engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: storageType,
      storageEncrypted: config.storageEncrypted !== false,
      kmsKeyId: config.kmsKeyId,
      dbName: config.dbName,
      username: config.masterUsername,
      password: masterPassword,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      parameterGroupName: this.dbParameterGroup.name,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: config.backupWindow || "03:00-04:00",
      maintenanceWindow: config.maintenanceWindow || "sun:04:00-sun:05:00",
      multiAz: config.multiAz,
      deletionProtection: config.deletionProtection,
      applyImmediately: config.applyImmediately || false,
      skipFinalSnapshot: !config.deletionProtection,
      finalSnapshotIdentifier: config.deletionProtection 
        ? `${config.projectName}-${config.environment}-final-snapshot-${Date.now()}`
        : undefined,
      enabledCloudwatchLogsExports: ["postgresql"],
      tags: config.tags,
    });

    // Store password in SSM Parameter Store
    new ssm.SsmParameter(this, "db-password-param", {
      name: `/${config.projectName}/${config.environment}/rds/master-password`,
      type: "SecureString",
      value: masterPassword,
      tags: config.tags,
    });
  }

  private generatePassword(): string {
    // In production, use AWS Secrets Manager or external secret management
    // This is a placeholder implementation
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
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
  public readonly applicationLogGroup: cloudwatch.CloudwatchLogGroup;
  public readonly albLogGroup: cloudwatch.CloudwatchLogGroup;
  public readonly snsTopic: sns.SnsTopic;
  public readonly cpuAlarm?: cloudwatch.CloudwatchMetricAlarm;
  public readonly rdsStorageAlarm?: cloudwatch.CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // Application Log Group
    this.applicationLogGroup = new cloudwatch.CloudwatchLogGroup(this, "app-log-group", {
      name: `/aws/ec2/${config.projectName}-${config.environment}/application`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    // ALB Log Group
    this.albLogGroup = new cloudwatch.CloudwatchLogGroup(this, "alb-log-group", {
      name: `/aws/alb/${config.projectName}-${config.environment}`,
      retentionInDays: config.logRetentionDays,
      tags: config.tags,
    });

    // SNS Topic for Alarms
    this.snsTopic = new sns.SnsTopic(this, "alarm-topic", {
      name: `${config.projectName}-${config.environment}-alarms`,
      displayName: `${config.projectName} ${config.environment} Alarms`,
      tags: config.tags,
    });

    // Email subscription if provided
    if (config.alarmEmail) {
      new sns.SnsTopicSubscription(this, "alarm-email-subscription", {
        topicArn: this.snsTopic.arn,
        protocol: "email",
        endpoint: config.alarmEmail,
      });
    }

    // EC2 CPU Alarm
    if (config.asgName) {
      this.cpuAlarm = new cloudwatch.CloudwatchMetricAlarm(this, "cpu-alarm", {
        alarmName: `${config.projectName}-${config.environment}-high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Alarm when CPU exceeds 80%",
        dimensions: {
          AutoScalingGroupName: config.asgName,
        },
        alarmActions: [this.snsTopic.arn],
        tags: config.tags,
      });
    }

    // RDS Free Storage Alarm
    if (config.dbInstanceId) {
      this.rdsStorageAlarm = new cloudwatch.CloudwatchMetricAlarm(this, "rds-storage-alarm", {
        alarmName: `${config.projectName}-${config.environment}-low-db-storage`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 1,
        metricName: "FreeStorageSpace",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 1073741824, // 1 GB in bytes
        alarmDescription: "Alarm when free storage is less than 1GB",
        dimensions: {
          DBInstanceIdentifier: config.dbInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: config.tags,
      });
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
  public readonly parameters: { [key: string]: ssm.SsmParameter } = {};

  constructor(scope: Construct, id: string, config: SsmParameterModuleConfig) {
    super(scope, id);

    Object.entries(config.parameters).forEach(([key, value]) => {
      const parameterName = `/${config.projectName}/${config.environment}/${key}`;
      this.parameters[key] = new ssm.SsmParameter(this, `param-${key}`, {
        name: parameterName,
        type: "String",
        value: value,
        tags: config.tags,
      });
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { dataAwsAvailabilityZones } from "@cdktf/provider-aws";
import * as modules from "./modules";

interface TapStackConfig {
  projectName: string;
  environment?: string;
  owner: string;
  region?: string;
  vpcCidr?: string;
  publicSubnetCidrs?: string[];
  privateSubnetCidrs?: string[];
  customAmiId: string;
  instanceType?: string;
  asgMin?: number;
  asgMax?: number;
  asgDesiredCapacity?: number;
  rdsInstanceClass?: string;
  rdsAllocatedStorageGb?: number;
  rdsBackupRetentionDays?: number;
  enableRdsDeletionProtection?: boolean;
  logRetentionDays?: number;
  enableNatGatewayPerAz?: boolean;
  albAllowedCidr?: string;
  applicationPort?: number;
  alarmEmail?: string;
  customKmsKeyId?: string;
  keyPairName?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    // Validate required configuration
    if (!config.customAmiId) {
      throw new Error("customAmiId is required");
    }
    if (!config.owner) {
      throw new Error("owner is required");
    }
    if (!config.projectName) {
      throw new Error("projectName is required");
    }

    // Set defaults
    const environment = config.environment || "production";
    const region = config.region || "us-east-1";
    const vpcCidr = config.vpcCidr || "10.0.0.0/16";
    const publicSubnetCidrs = config.publicSubnetCidrs || ["10.0.1.0/24", "10.0.2.0/24"];
    const privateSubnetCidrs = config.privateSubnetCidrs || ["10.0.11.0/24", "10.0.12.0/24"];
    const instanceType = config.instanceType || "t3.micro";
    const asgMin = config.asgMin ?? 2;
    const asgMax = config.asgMax ?? 5;
    const asgDesiredCapacity = config.asgDesiredCapacity ?? 2;
    const rdsInstanceClass = config.rdsInstanceClass || "db.t3.medium";
    const rdsAllocatedStorageGb = config.rdsAllocatedStorageGb || 20;
    const rdsBackupRetentionDays = config.rdsBackupRetentionDays ?? 7;
    const enableRdsDeletionProtection = config.enableRdsDeletionProtection ?? true;
    const logRetentionDays = config.logRetentionDays || 30;
    const enableNatGatewayPerAz = config.enableNatGatewayPerAz ?? false;
    const applicationPort = config.applicationPort || 8080;
    const albAllowedCidr = config.albAllowedCidr || "0.0.0.0/0";

    // Common tags for all resources
    const commonTags = {
      Project: config.projectName,
      Environment: environment,
      Owner: config.owner,
      ManagedBy: "CDKTF",
    };

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: region,
      defaultTags: {
        tags: commonTags,
      },
    });

    // Get availability zones
    const azs = new dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // VPC Module
    const vpcModule = new modules.VpcModule(this, "vpc", {
      projectName: config.projectName,
      environment: environment,
      vpcCidr: vpcCidr,
      publicSubnetCidrs: publicSubnetCidrs,
      privateSubnetCidrs: privateSubnetCidrs,
      availabilityZones: azs.names.slice(0, 2),
      enableNatGatewayPerAz: enableNatGatewayPerAz,
      tags: commonTags,
    });

    // Security Groups Module
    const securityGroups = new modules.SecurityGroupsModule(this, "security-groups", {
      projectName: config.projectName,
      environment: environment,
      vpcId: vpcModule.vpc.id,
      albAllowedCidr: albAllowedCidr,
      applicationPort: applicationPort,
      databasePort: 5432,
      tags: commonTags,
    });

    // IAM Module
    const iamModule = new modules.IamModule(this, "iam", {
      projectName: config.projectName,
      environment: environment,
      enableSsmAccess: true,
      tags: commonTags,
    });

    // CloudWatch Module
    const cloudWatchModule = new modules.CloudWatchModule(this, "cloudwatch", {
      projectName: config.projectName,
      environment: environment,
      logRetentionDays: logRetentionDays,
      alarmEmail: config.alarmEmail,
      tags: commonTags,
    });

    // ALB Module
    const albModule = new modules.AlbModule(this, "alb", {
      projectName: config.projectName,
      environment: environment,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      securityGroupId: securityGroups.albSecurityGroup.id,
      healthCheckPath: "/health",
      applicationPort: applicationPort,
      enableAccessLogs: false, // Set to true and provide S3 bucket for access logs
      tags: commonTags,
    });

    // User Data Script for EC2 instances
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/application/*.log",
            "log_group_name": "/aws/ec2/${config.projectName}-${environment}/application",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Enable SSM Session Manager
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Note: Your application startup script should be added here
# Example: systemctl start myapp
`;

    // Auto Scaling Group Module
    const asgModule = new modules.AsgModule(this, "asg", {
      projectName: config.projectName,
      environment: environment,
      customAmiId: config.customAmiId,
      instanceType: instanceType,
      keyName: config.keyPairName,
      instanceProfileArn: iamModule.instanceProfile.arn,
      securityGroupIds: [securityGroups.ec2SecurityGroup.id],
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      targetGroupArns: [albModule.targetGroup.arn],
      minSize: asgMin,
      maxSize: asgMax,
      desiredCapacity: asgDesiredCapacity,
      userData: userData,
      tags: commonTags,
    });

    // Update CloudWatch alarms with ASG name
    cloudWatchModule.cpuAlarm = new modules.CloudWatchModule(this, "cloudwatch-alarms", {
      projectName: config.projectName,
      environment: environment,
      logRetentionDays: logRetentionDays,
      alarmEmail: config.alarmEmail,
      asgName: asgModule.autoScalingGroup.name,
      tags: commonTags,
    }).cpuAlarm;

    // RDS Module
    const rdsModule = new modules.RdsModule(this, "rds", {
      projectName: config.projectName,
      environment: environment,
      instanceClass: rdsInstanceClass,
      allocatedStorage: rdsAllocatedStorageGb,
      storageEncrypted: true,
      kmsKeyId: config.customKmsKeyId,
      dbName: "appdb",
      masterUsername: "dbadmin",
      backupRetentionPeriod: rdsBackupRetentionDays,
      multiAz: true,
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [securityGroups.rdsSecurityGroup.id],
      deletionProtection: enableRdsDeletionProtection,
      applyImmediately: false,
      tags: commonTags,
    });

    // Update CloudWatch RDS storage alarm
    cloudWatchModule.rdsStorageAlarm = new modules.CloudWatchModule(this, "cloudwatch-rds-alarm", {
      projectName: config.projectName,
      environment: environment,
      logRetentionDays: logRetentionDays,
      dbInstanceId: rdsModule.dbInstance.identifier,
      tags: commonTags,
    }).rdsStorageAlarm;

    // SSM Parameters for configuration
    const ssmParams = new modules.SsmParameterModule(this, "ssm-parameters", {
      projectName: config.projectName,
      environment: environment,
      parameters: {
        "alb/dns-name": albModule.alb.dnsName,
        "rds/endpoint": rdsModule.dbInstance.endpoint,
        "rds/port": rdsModule.dbInstance.port.toString(),
        "rds/database": rdsModule.dbInstance.dbName,
        "rds/username": rdsModule.dbInstance.username,
        "app/port": applicationPort.toString(),
      },
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      value: vpcModule.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public-subnet-ids", {
      value: vpcModule.publicSubnets.map(s => s.id).join(","),
      description: "Public subnet IDs (comma-separated)",
    });

    new TerraformOutput(this, "private-subnet-ids", {
      value: vpcModule.privateSubnets.map(s => s.id).join(","),
      description: "Private subnet IDs (comma-separated)",
    });

    new TerraformOutput(this, "alb-dns-name", {
      value: albModule.alb.dnsName,
      description: "ALB DNS name - use this to access the application",
    });

    new TerraformOutput(this, "alb-security-group-id", {
      value: securityGroups.albSecurityGroup.id,
      description: "ALB security group ID",
    });

    new TerraformOutput(this, "asg-name", {
      value: asgModule.autoScalingGroup.name,
      description: "Auto Scaling Group name",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rdsModule.dbInstance.endpoint,
      description: "RDS instance endpoint",
    });

    new TerraformOutput(this, "rds-port", {
      value: rdsModule.dbInstance.port,
      description: "RDS instance port",
    });

    new TerraformOutput(this, "ec2-iam-role-arn", {
      value: iamModule.instanceRole.arn,
      description: "EC2 instance IAM role ARN",
    });

    new TerraformOutput(this, "ec2-instance-profile-arn", {
      value: iamModule.instanceProfile.arn,
      description: "EC2 instance profile ARN",
    });

    new TerraformOutput(this, "ssm-parameter-names", {
      value: Object.keys(ssmParams.parameters).map(k => ssmParams.parameters[k].name).join(","),
      description: "SSM parameter names (comma-separated)",
    });

    new TerraformOutput(this, "cloudwatch-app-log-group", {
      value: cloudWatchModule.applicationLogGroup.name,
      description: "CloudWatch application log group name",
    });

    new TerraformOutput(this, "cloudwatch-alb-log-group", {
      value: cloudWatchModule.albLogGroup.name,
      description: "CloudWatch ALB log group name",
    });

    new TerraformOutput(this, "sns-alarm-topic-arn", {
      value: cloudWatchModule.snsTopic.arn,
      description: "SNS topic ARN for alarms",
    });

    /**
     * OPERATIONAL NOTES:
     * 
     * 1. AMI Selection:
     *    - The customAmiId parameter must be a valid AMI ID in the target region
     *    - Recommended: Use Amazon Linux 2 or Ubuntu Server LTS
     *    - Ensure the AMI includes your application and all dependencies
     *    - Consider using AWS Systems Manager to build AMIs with EC2 Image Builder
     * 
     * 2. Access Management:
     *    - SSH access is not configured by default for security
     *    - Use AWS Systems Manager Session Manager for secure instance access:
     *      aws ssm start-session --target <instance-id>
     *    - Session Manager provides audit trails and doesn't require SSH keys or bastion hosts
     * 
     * 3. Application Configuration:
     *    - Application configuration is stored in SSM Parameter Store
     *    - Access parameters from instances using AWS CLI or SDKs:
     *      aws ssm get-parameter --name "/<projectName>/<environment>/app/port"
     *    - The RDS password is stored as a SecureString parameter
     * 
     * 4. Monitoring:
     *    - CloudWatch agent is installed via user data script
     *    - Configure application to write logs to /var/log/application/
     *    - Metrics and logs are automatically sent to CloudWatch
     *    - CPU and RDS storage alarms are configured; add more as needed
     * 
     * 5. Security Considerations:
     *    - Security groups follow least-privilege principle
     *    - RDS is not publicly accessible
     *    - EC2 instances are in private subnets without public IPs
     *    - Enable AWS Config and GuardDuty for compliance and threat detection
     * 
     * 6. High Availability:
     *    - Resources span multiple availability zones
     *    - RDS Multi-AZ is enabled for automatic failover
     *    - ALB distributes traffic across healthy instances
     *    - Consider enabling cross-region replication for disaster recovery
     * 
     * 7. Cost Optimization:
     *    - Single NAT Gateway by default; enable per-AZ for higher availability
     *    - Use Reserved Instances or Savings Plans for predictable workloads
     *    - Enable S3 lifecycle policies for ALB access logs if enabled
     *    - Consider using Aurora Serverless for variable database workloads
     * 
     * 8. Deployment:
     *    - Run 'cdktf synth' to generate Terraform configuration
     *    - Run 'cdktf diff' to preview changes
     *    - Run 'cdktf deploy' to apply changes
     *    - Use 'cdktf destroy' with caution - deletion protection is enabled for RDS
     */
  }
}
```