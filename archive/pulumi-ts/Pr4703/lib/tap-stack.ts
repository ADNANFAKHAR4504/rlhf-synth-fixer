/* eslint-disable prettier/prettier */

/**
 * tap-stack.ts
 * 
 * Production-grade infrastructure for fintech trading analytics platform.
 * Includes auto-generated secure database password.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  region?: string;
  vpcCidr?: string;
  domainName?: string;
}

export interface TapStackOutputs {
  vpcId: string;
  vpcCidr: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  databaseSubnetIds: string[];
  albSecurityGroupId: string;
  ecsSecurityGroupId: string;
  rdsSecurityGroupId: string;
  albDnsName: string;
  albArn: string;
  albZoneId: string;
  targetGroupBlueArn: string;
  targetGroupGreenArn: string;
  ecsClusterName: string;
  ecsClusterArn: string;
  apiServiceName: string;
  frontendServiceName: string;
  auroraClusterEndpoint: string;
  auroraClusterReaderEndpoint: string;
  auroraClusterArn: string;
  auroraClusterId: string;
  dbSecretArn: string;
  ecrApiRepositoryUrl: string;
  ecrFrontendRepositoryUrl: string;
  apiLogGroupName: string;
  frontendLogGroupName: string;
  ecsTaskExecutionRoleArn: string;
  ecsTaskRoleArn: string;
}

export class TapStack extends pulumi.ComponentResource {
  // Network resources
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly databaseSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];

  // Security resources
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  // IAM resources
  public readonly ecsTaskExecutionRole: aws.iam.Role;
  public readonly ecsTaskRole: aws.iam.Role;
  public readonly autoScalingRole: aws.iam.Role;

  // Container resources
  public readonly ecrApiRepository: aws.ecr.Repository;
  public readonly ecrFrontendRepository: aws.ecr.Repository;
  public readonly ecsCluster: aws.ecs.Cluster;

  // Load balancer resources
  public readonly alb: aws.lb.LoadBalancer;
  public readonly albTargetGroupBlue: aws.lb.TargetGroup;
  public readonly albTargetGroupGreen: aws.lb.TargetGroup;
  public readonly albHttpListener: aws.lb.Listener;
  public readonly albHttpsListener?: aws.lb.Listener;

  // Database resources
  public readonly auroraSubnetGroup: aws.rds.SubnetGroup;
  public readonly auroraParameterGroup: aws.rds.ClusterParameterGroup;
  public readonly auroraCluster: aws.rds.Cluster;
  public readonly auroraWriterInstance: aws.rds.ClusterInstance;
  public readonly auroraReaderInstance: aws.rds.ClusterInstance;
  public readonly dbSecret: aws.secretsmanager.Secret;

  // ECS Services
  public readonly apiService: aws.ecs.Service;
  public readonly frontendService: aws.ecs.Service;

  // Auto-scaling
  public readonly apiAutoScalingTarget: aws.appautoscaling.Target;
  public readonly frontendAutoScalingTarget: aws.appautoscaling.Target;
  public readonly apiCpuScalingPolicy: aws.appautoscaling.Policy;
  public readonly apiRequestScalingPolicy: aws.appautoscaling.Policy;

  // CloudWatch resources
  public readonly apiLogGroup: aws.cloudwatch.LogGroup;
  public readonly frontendLogGroup: aws.cloudwatch.LogGroup;
  public readonly cpuAlarm: aws.cloudwatch.MetricAlarm;
  public readonly memoryAlarm: aws.cloudwatch.MetricAlarm;
  public readonly http5xxAlarm: aws.cloudwatch.MetricAlarm;

  // DNS resources (optional)
  public readonly hostedZone?: aws.route53.Zone;
  public readonly albRecord?: aws.route53.Record;
  public readonly certificate?: aws.acm.Certificate;

  public readonly outputs: pulumi.Output<TapStackOutputs>;

  private readonly albTargetGroupFrontend: aws.lb.TargetGroup;
  private readonly config: pulumi.Config;
  private readonly environmentSuffix: string;
  private readonly defaultTags: { [key: string]: string };
  private readonly availabilityZones: string[];

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    this.config = new pulumi.Config();
    this.environmentSuffix = args.environmentSuffix || 'dev';
    this.availabilityZones = ['us-east-2a', 'us-east-2b'];

    this.defaultTags = {
      Environment: this.environmentSuffix,
      Project: 'TradingAnalyticsPlatform',
      ManagedBy: 'Pulumi',
      ...(args.tags as Record<string, string> || {})
    };

    // PHASE 1: NETWORK FOUNDATION
    const networkResources = this.createNetworkInfrastructure();
    this.vpc = networkResources.vpc;
    this.publicSubnets = networkResources.publicSubnets;
    this.privateSubnets = networkResources.privateSubnets;
    this.databaseSubnets = networkResources.databaseSubnets;
    this.internetGateway = networkResources.internetGateway;
    this.natGateways = networkResources.natGateways;

    // PHASE 2: SECURITY LAYER
    const securityResources = this.createSecurityGroups();
    this.albSecurityGroup = securityResources.albSecurityGroup;
    this.ecsSecurityGroup = securityResources.ecsSecurityGroup;
    this.rdsSecurityGroup = securityResources.rdsSecurityGroup;

    // PHASE 3: DATABASE (MOVED BEFORE IAM)
    const databaseResources = this.createDatabaseResources();
    this.auroraSubnetGroup = databaseResources.auroraSubnetGroup;
    this.auroraParameterGroup = databaseResources.auroraParameterGroup;
    this.auroraCluster = databaseResources.auroraCluster;
    this.auroraWriterInstance = databaseResources.auroraWriterInstance;
    this.auroraReaderInstance = databaseResources.auroraReaderInstance;
    this.dbSecret = databaseResources.dbSecret;

    // PHASE 4: IAM ROLES (NOW AFTER DATABASE)
    const iamResources = this.createIAMRoles();
    this.ecsTaskExecutionRole = iamResources.ecsTaskExecutionRole;
    this.ecsTaskRole = iamResources.ecsTaskRole;
    this.autoScalingRole = iamResources.autoScalingRole;

    // PHASE 5: DATA & STORAGE
    const storageResources = this.createStorageResources();
    this.ecrApiRepository = storageResources.ecrApiRepository;
    this.ecrFrontendRepository = storageResources.ecrFrontendRepository;

    // PHASE 6: LOAD BALANCING
    const lbResources = this.createLoadBalancer();
    this.alb = lbResources.alb;
    this.albTargetGroupBlue = lbResources.albTargetGroupBlue;
    this.albTargetGroupGreen = lbResources.albTargetGroupGreen;
    this.albHttpListener = lbResources.albHttpListener;
    this.albTargetGroupFrontend = lbResources.albTargetGroupFrontend;

    // PHASE 7: DNS & CERTIFICATES
    const dnsResources = this.createDNSResources(args.domainName);
    if (dnsResources) {
      this.hostedZone = dnsResources.hostedZone;
      this.certificate = dnsResources.certificate;
      this.albHttpsListener = dnsResources.httpsListener;
      this.albRecord = dnsResources.albRecord;
    }

    // PHASE 8: CONTAINER ORCHESTRATION
    const containerResources = this.createContainerResources();
    this.ecsCluster = containerResources.ecsCluster;
    this.apiLogGroup = containerResources.apiLogGroup;
    this.frontendLogGroup = containerResources.frontendLogGroup;
    this.apiService = containerResources.apiService;
    this.frontendService = containerResources.frontendService;

    // PHASE 9: AUTO-SCALING
    const autoScalingResources = this.createAutoScaling();
    this.apiAutoScalingTarget = autoScalingResources.apiAutoScalingTarget;
    this.frontendAutoScalingTarget = autoScalingResources.frontendAutoScalingTarget;
    this.apiCpuScalingPolicy = autoScalingResources.apiCpuScalingPolicy;
    this.apiRequestScalingPolicy = autoScalingResources.apiRequestScalingPolicy;

    // PHASE 10: MONITORING & ALARMS
    const monitoringResources = this.createMonitoring();
    this.cpuAlarm = monitoringResources.cpuAlarm;
    this.memoryAlarm = monitoringResources.memoryAlarm;
    this.http5xxAlarm = monitoringResources.http5xxAlarm;

    // EXPORT OUTPUTS
    this.outputs = this.exportOutputs();

    this.registerOutputs({
      vpcId: this.vpc.id,
      albDns: this.alb.dnsName,
      ecsClusterName: this.ecsCluster.name,
      auroraEndpoint: this.auroraCluster.endpoint,
      dbSecretArn: this.dbSecret.arn,
    });
  }

  private createNetworkInfrastructure() {
    const vpcCidr = '10.18.0.0/16';

    const vpc = new aws.ec2.Vpc(`tap-vpc-${this.environmentSuffix}`, {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...this.defaultTags, Name: `tap-vpc-${this.environmentSuffix}` },
    }, { parent: this });

    const internetGateway = new aws.ec2.InternetGateway(`tap-igw-${this.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...this.defaultTags, Name: `tap-igw-${this.environmentSuffix}` },
    }, { parent: this });

    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];
    const databaseSubnets: aws.ec2.Subnet[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    this.availabilityZones.forEach((az, index) => {
      const publicSubnet = new aws.ec2.Subnet(`tap-public-subnet-${index}-${this.environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.18.${index}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { ...this.defaultTags, Name: `tap-public-${az}`, Type: 'public' },
      }, { parent: this });
      publicSubnets.push(publicSubnet);

      const eip = new aws.ec2.Eip(`tap-nat-eip-${index}-${this.environmentSuffix}`, {
        domain: 'vpc',
        tags: { ...this.defaultTags, Name: `tap-nat-eip-${az}` },
      }, { parent: this });

      const natGateway = new aws.ec2.NatGateway(`tap-nat-${index}-${this.environmentSuffix}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { ...this.defaultTags, Name: `tap-nat-${az}` },
      }, { parent: this, dependsOn: [internetGateway] });
      natGateways.push(natGateway);

      const privateSubnet = new aws.ec2.Subnet(`tap-private-subnet-${index}-${this.environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.18.${10 + index}.0/24`,
        availabilityZone: az,
        tags: { ...this.defaultTags, Name: `tap-private-${az}`, Type: 'private' },
      }, { parent: this });
      privateSubnets.push(privateSubnet);

      const databaseSubnet = new aws.ec2.Subnet(`tap-database-subnet-${index}-${this.environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.18.${20 + index}.0/24`,
        availabilityZone: az,
        tags: { ...this.defaultTags, Name: `tap-database-${az}`, Type: 'database' },
      }, { parent: this });
      databaseSubnets.push(databaseSubnet);
    });

    const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${this.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...this.defaultTags, Name: 'tap-public-rt' },
    }, { parent: this });

    new aws.ec2.Route(`tap-public-route-${this.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    }, { parent: this });

    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`tap-public-rta-${index}-${this.environmentSuffix}`, {
        routeTableId: publicRouteTable.id,
        subnetId: subnet.id,
      }, { parent: this });
    });

    natGateways.forEach((natGateway, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(`tap-private-rt-${index}-${this.environmentSuffix}`, {
        vpcId: vpc.id,
        tags: { ...this.defaultTags, Name: `tap-private-rt-${this.availabilityZones[index]}` },
      }, { parent: this });

      new aws.ec2.Route(`tap-private-route-${index}-${this.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`tap-private-rta-${index}-${this.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        subnetId: privateSubnets[index].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`tap-database-rta-${index}-${this.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        subnetId: databaseSubnets[index].id,
      }, { parent: this });
    });

    return { vpc, publicSubnets, privateSubnets, databaseSubnets, internetGateway, natGateways };
  }

  private createSecurityGroups() {
    const albSecurityGroup = new aws.ec2.SecurityGroup(`tap-alb-sg-${this.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: 'Security group for Application Load Balancer',
      ingress: [
        { protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlocks: ['0.0.0.0/0'], description: 'HTTP from internet' },
        { protocol: 'tcp', fromPort: 443, toPort: 443, cidrBlocks: ['0.0.0.0/0'], description: 'HTTPS from internet' },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'], description: 'All outbound traffic' },
      ],
      tags: { ...this.defaultTags, Name: 'tap-alb-sg' },
    }, { parent: this });

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`tap-ecs-sg-${this.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: 'Security group for ECS tasks',
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'], description: 'All outbound traffic' },
      ],
      tags: { ...this.defaultTags, Name: 'tap-ecs-sg' },
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`tap-alb-to-ecs-${this.environmentSuffix}`, {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      securityGroupId: ecsSecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
      description: 'Allow traffic from ALB',
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`tap-alb-to-ecs-3000-${this.environmentSuffix}`, {
      type: 'ingress',
      fromPort: 3000,
      toPort: 3000,
      protocol: 'tcp',
      securityGroupId: ecsSecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
      description: 'Allow traffic from ALB to frontend',
    }, { parent: this });

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`tap-rds-sg-${this.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: 'Security group for RDS Aurora PostgreSQL',
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'], description: 'All outbound traffic' },
      ],
      tags: { ...this.defaultTags, Name: 'tap-rds-sg' },
    }, { parent: this });

    new aws.ec2.SecurityGroupRule(`tap-ecs-to-rds-${this.environmentSuffix}`, {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: rdsSecurityGroup.id,
      sourceSecurityGroupId: ecsSecurityGroup.id,
      description: 'PostgreSQL from ECS tasks',
    }, { parent: this });

    return { albSecurityGroup, ecsSecurityGroup, rdsSecurityGroup };
  }

  private createDatabaseResources() {
    const auroraSubnetGroup = new aws.rds.SubnetGroup(`tap-aurora-subnet-group-${this.environmentSuffix}`, {
      subnetIds: this.databaseSubnets.map(s => s.id),
      description: 'Subnet group for Aurora PostgreSQL',
      tags: { ...this.defaultTags, Name: 'tap-aurora-subnet-group' },
    }, { parent: this });

    const auroraParameterGroup = new aws.rds.ClusterParameterGroup(`tap-aurora-params-${this.environmentSuffix}`, {
      family: 'aurora-postgresql14',
      description: 'Parameter group for trading analytics Aurora PostgreSQL',
      parameters: [
        { name: 'shared_preload_libraries', value: 'pg_stat_statements', applyMethod: 'pending-reboot' },
        { name: 'log_statement', value: 'all', applyMethod: 'immediate' },
        { name: 'log_connections', value: '1', applyMethod: 'immediate' },
        { name: 'log_disconnections', value: '1', applyMethod: 'immediate' },
        { name: 'max_connections', value: '1000', applyMethod: 'pending-reboot' },
        { name: 'statement_timeout', value: '30000', applyMethod: 'immediate' },
      ],
      tags: { ...this.defaultTags, Name: 'tap-aurora-params' },
    }, { parent: this });

    const dbPassword = new random.RandomPassword(`tap-db-password-${this.environmentSuffix}`, {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      minLower: 1,
      minUpper: 1,
      minNumeric: 1,
      minSpecial: 1,
    }, { parent: this });

    const dbSecret = new aws.secretsmanager.Secret(`tap-db-secret-${this.environmentSuffix}`, {
      name: `tap-aurora-password-${this.environmentSuffix}`,
      description: 'Aurora PostgreSQL master password',
      tags: { ...this.defaultTags, Name: 'tap-db-secret' },
    }, { parent: this });

    new aws.secretsmanager.SecretVersion(`tap-db-secret-version-${this.environmentSuffix}`, {
      secretId: dbSecret.id,
      secretString: pulumi.jsonStringify({
        username: 'dbadmin',
        password: dbPassword.result,
        engine: 'postgres',
        host: this.auroraCluster?.endpoint || '',
        port: 5432,
        dbname: 'tradinganalytics',
      }),
    }, { parent: this });

    const auroraCluster = new aws.rds.Cluster(`tap-aurora-cluster-${this.environmentSuffix}`, {
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'tradinganalytics',
      masterUsername: 'dbadmin',
      masterPassword: dbPassword.result,
      dbSubnetGroupName: auroraSubnetGroup.name,
      dbClusterParameterGroupName: auroraParameterGroup.name,
      vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
      storageEncrypted: true,
      backupRetentionPeriod: 30,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      iamDatabaseAuthenticationEnabled: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      tags: { ...this.defaultTags, Name: 'tap-aurora-cluster' },
    }, { parent: this });

    const auroraWriterInstance = new aws.rds.ClusterInstance(`tap-aurora-writer-${this.environmentSuffix}`, {
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...this.defaultTags, Name: 'tap-aurora-writer', Role: 'writer' },
    }, { parent: this });

    const auroraReaderInstance = new aws.rds.ClusterInstance(`tap-aurora-reader-${this.environmentSuffix}`, {
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...this.defaultTags, Name: 'tap-aurora-reader', Role: 'reader' },
    }, { parent: this });

    return { auroraSubnetGroup, auroraParameterGroup, auroraCluster, auroraWriterInstance, auroraReaderInstance, dbSecret };
  }

  private createIAMRoles() {
    const ecsTaskExecutionRole = new aws.iam.Role(`tap-ecs-task-execution-role-${this.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'sts:AssumeRole',
          'Effect': 'Allow',
          'Principal': { 'Service': 'ecs-tasks.amazonaws.com' },
        }],
      }),
      tags: { ...this.defaultTags, Name: 'tap-ecs-task-execution-role' },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`tap-ecs-task-execution-policy-${this.environmentSuffix}`, {
      role: ecsTaskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    new aws.iam.RolePolicy(`tap-ecr-access-policy-${this.environmentSuffix}`, {
      role: ecsTaskExecutionRole.id,
      policy: JSON.stringify({
        'Version': '2012-10-17',
        'Statement': [{
          'Effect': 'Allow',
          'Action': [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          'Resource': '*',
        }],
      }),
    }, { parent: this });

    const ecsTaskRole = new aws.iam.Role(`tap-ecs-task-role-${this.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'sts:AssumeRole',
          'Effect': 'Allow',
          'Principal': { 'Service': 'ecs-tasks.amazonaws.com' },
        }],
      }),
      tags: { ...this.defaultTags, Name: 'tap-ecs-task-role' },
    }, { parent: this });

    new aws.iam.RolePolicy(`tap-task-app-policy-${this.environmentSuffix}`, {
      role: ecsTaskRole.id,
      policy: pulumi.all([this.auroraCluster.arn, this.dbSecret.arn]).apply(([clusterArn, secretArn]) => JSON.stringify({
        'Version': '2012-10-17',
        'Statement': [
          {
            'Effect': 'Allow',
            'Action': ['rds-db:connect'],
            'Resource': [`${clusterArn}:dbuser/*`],
          },
          {
            'Effect': 'Allow',
            'Action': [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret'
            ],
            'Resource': [secretArn],
          },
          {
            'Effect': 'Allow',
            'Action': [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            'Resource': '*',
          },
          {
            'Effect': 'Allow',
            'Action': ['cloudwatch:PutMetricData'],
            'Resource': '*',
          },
        ],
      })),
    }, { parent: this });

    const autoScalingRole = new aws.iam.Role(`tap-autoscaling-role-${this.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'sts:AssumeRole',
          'Effect': 'Allow',
          'Principal': { 'Service': 'application-autoscaling.amazonaws.com' },
        }],
      }),
      tags: { ...this.defaultTags, Name: 'tap-autoscaling-role' },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`tap-autoscaling-policy-${this.environmentSuffix}`, {
      role: autoScalingRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole',
    }, { parent: this });

    return { ecsTaskExecutionRole, ecsTaskRole, autoScalingRole };
  }

  private createStorageResources() {
    const ecrApiRepository = new aws.ecr.Repository(`tap-api-repo-${this.environmentSuffix}`, {
      name: `tap-api-${this.environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: { ...this.defaultTags, Name: 'tap-api-repo', Service: 'api' },
    }, { parent: this });

    new aws.ecr.LifecyclePolicy(`tap-api-lifecycle-${this.environmentSuffix}`, {
      repository: ecrApiRepository.name,
      policy: JSON.stringify({
        'rules': [
          {
            'rulePriority': 1,
            'description': 'Keep last 10 images',
            'selection': {
              'tagStatus': 'any',
              'countType': 'imageCountMoreThan',
              'countNumber': 10,
            },
            'action': {
              'type': 'expire',
            },
          },
        ],
      }),
    }, { parent: this });

    const ecrFrontendRepository = new aws.ecr.Repository(`tap-frontend-repo-${this.environmentSuffix}`, {
      name: `tap-frontend-${this.environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: { ...this.defaultTags, Name: 'tap-frontend-repo', Service: 'frontend' },
    }, { parent: this });

    new aws.ecr.LifecyclePolicy(`tap-frontend-lifecycle-${this.environmentSuffix}`, {
      repository: ecrFrontendRepository.name,
      policy: JSON.stringify({
        'rules': [
          {
            'rulePriority': 1,
            'description': 'Keep last 10 images',
            'selection': {
              'tagStatus': 'any',
              'countType': 'imageCountMoreThan',
              'countNumber': 10,
            },
            'action': {
              'type': 'expire',
            },
          },
        ],
      }),
    }, { parent: this });

    return { ecrApiRepository, ecrFrontendRepository };
  }

  private createLoadBalancer() {
    const alb = new aws.lb.LoadBalancer(`tap-alb-${this.environmentSuffix}`, {
      name: `tap-alb-${this.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [this.albSecurityGroup.id],
      subnets: this.publicSubnets.map(s => s.id),
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: { ...this.defaultTags, Name: 'tap-alb' },
    }, { parent: this });

    const albTargetGroupBlue = new aws.lb.TargetGroup(`tap-api-tg-blue-${this.environmentSuffix}`, {
      name: `tap-api-tg-blue-${this.environmentSuffix}`.substring(0, 32),
      port: 8080,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'ip',
      deregistrationDelay: 30,
      healthCheck: {
        enabled: true,
        path: '/api/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: { ...this.defaultTags, Name: 'tap-api-tg-blue', Deployment: 'blue' },
    }, { parent: this });

    const albTargetGroupGreen = new aws.lb.TargetGroup(`tap-api-tg-green-${this.environmentSuffix}`, {
      name: `tap-api-tg-green-${this.environmentSuffix}`.substring(0, 32),
      port: 8080,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'ip',
      deregistrationDelay: 30,
      healthCheck: {
        enabled: true,
        path: '/api/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: { ...this.defaultTags, Name: 'tap-api-tg-green', Deployment: 'green' },
    }, { parent: this });

    const albTargetGroupFrontend = new aws.lb.TargetGroup(`tap-frontend-tg-${this.environmentSuffix}`, {
      name: `tap-fe-tg-${this.environmentSuffix}`.substring(0, 32),
      port: 3000,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'ip',
      deregistrationDelay: 30,
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: { ...this.defaultTags, Name: 'tap-frontend-tg' },
    }, { parent: this });

    const albHttpListener = new aws.lb.Listener(`tap-alb-http-listener-${this.environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'fixed-response',
        fixedResponse: {
          contentType: 'text/plain',
          messageBody: 'Service Available',
          statusCode: '200',
        },
      }],
      tags: { ...this.defaultTags },
    }, { parent: this });

    new aws.lb.ListenerRule(`tap-api-routing-rule-${this.environmentSuffix}`, {
      listenerArn: albHttpListener.arn,
      priority: 100,
      conditions: [{
        pathPattern: {
          values: ['/api/*'],
        },
      }],
      actions: [{
        type: 'forward',
        targetGroupArn: albTargetGroupBlue.arn,
      }],
      tags: { ...this.defaultTags },
    }, { parent: this });

    new aws.lb.ListenerRule(`tap-frontend-routing-rule-${this.environmentSuffix}`, {
      listenerArn: albHttpListener.arn,
      priority: 200,
      conditions: [{
        pathPattern: {
          values: ['/*'],
        },
      }],
      actions: [{
        type: 'forward',
        targetGroupArn: albTargetGroupFrontend.arn,
      }],
      tags: { ...this.defaultTags },
    }, { parent: this });

    return { alb, albTargetGroupBlue, albTargetGroupGreen, albHttpListener, albTargetGroupFrontend };
  }

  private createDNSResources(domainName?: string) {
    if (!domainName) {
      return null;
    }

    const hostedZone = new aws.route53.Zone(`tap-hosted-zone-${this.environmentSuffix}`, {
      name: domainName,
      tags: { ...this.defaultTags, Name: 'tap-hosted-zone' },
    }, { parent: this });

    const certificate = new aws.acm.Certificate(`tap-certificate-${this.environmentSuffix}`, {
      domainName: domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validationMethod: 'DNS',
      tags: { ...this.defaultTags, Name: 'tap-certificate' },
    }, { parent: this });

    const certificateValidationDomain = new aws.route53.Record(`tap-cert-validation-${this.environmentSuffix}`, {
      name: certificate.domainValidationOptions[0].resourceRecordName,
      zoneId: hostedZone.zoneId,
      type: certificate.domainValidationOptions[0].resourceRecordType,
      records: [certificate.domainValidationOptions[0].resourceRecordValue],
      ttl: 60,
    }, { parent: this });

    const certificateValidation = new aws.acm.CertificateValidation(`tap-cert-validation-complete-${this.environmentSuffix}`, {
      certificateArn: certificate.arn,
      validationRecordFqdns: [certificateValidationDomain.fqdn],
    }, { parent: this });

    const httpsListener = new aws.lb.Listener(`tap-alb-https-listener-${this.environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultActions: [{
        type: 'fixed-response',
        fixedResponse: {
          contentType: 'text/plain',
          messageBody: 'Service Available',
          statusCode: '200',
        },
      }],
      tags: { ...this.defaultTags },
    }, { parent: this, dependsOn: [certificateValidation] });

    const albRecord = new aws.route53.Record(`tap-alb-record-${this.environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: domainName,
      type: 'A',
      aliases: [{
        name: this.alb.dnsName,
        zoneId: this.alb.zoneId,
        evaluateTargetHealth: true,
      }],
    }, { parent: this });

    return { hostedZone, certificate, httpsListener, albRecord };
  }

  private createContainerResources() {
    const ecsCluster = new aws.ecs.Cluster(`tap-ecs-cluster-${this.environmentSuffix}`, {
      name: `tap-ecs-cluster-${this.environmentSuffix}`,
      settings: [{
        name: 'containerInsights',
        value: 'enabled',
      }],
      tags: { ...this.defaultTags, Name: 'tap-ecs-cluster' },
    }, { parent: this });

    const fargateSpotCapacityProvider = new aws.ecs.ClusterCapacityProviders(`tap-capacity-providers-${this.environmentSuffix}`, {
      clusterName: ecsCluster.name,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
      defaultCapacityProviderStrategies: [
        { capacityProvider: 'FARGATE_SPOT', weight: 2, base: 0 },
        { capacityProvider: 'FARGATE', weight: 1, base: 1 },
      ],
    }, { parent: this });

    const apiLogGroup = new aws.cloudwatch.LogGroup(`tap-api-logs-${this.environmentSuffix}`, {
      name: `/ecs/tap-api-${this.environmentSuffix}`,
      retentionInDays: 30,
      tags: { ...this.defaultTags, Name: 'tap-api-logs' },
    }, { parent: this });

    const frontendLogGroup = new aws.cloudwatch.LogGroup(`tap-frontend-logs-${this.environmentSuffix}`, {
      name: `/ecs/tap-frontend-${this.environmentSuffix}`,
      retentionInDays: 30,
      tags: { ...this.defaultTags, Name: 'tap-frontend-logs' },
    }, { parent: this });

    const apiTaskDefinition = new aws.ecs.TaskDefinition(`tap-api-task-${this.environmentSuffix}`, {
      family: `tap-api-${this.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '1024',
      memory: '2048',
      executionRoleArn: this.ecsTaskExecutionRole.arn,
      taskRoleArn: this.ecsTaskRole.arn,
      containerDefinitions: pulumi.all([this.ecrApiRepository.repositoryUrl, this.auroraCluster.endpoint, apiLogGroup.name, this.dbSecret.arn])
        .apply(([repoUrl, dbEndpoint, logGroupName, secretArn]) => JSON.stringify([{
          'name': 'api',
          'image': `${repoUrl}:latest`,
          'essential': true,
          'portMappings': [{ 'containerPort': 8080, 'protocol': 'tcp' }],
          'environment': [
            { 'name': 'NODE_ENV', 'value': 'production' },
            { 'name': 'DB_HOST', 'value': dbEndpoint },
            { 'name': 'DB_PORT', 'value': '5432' },
            { 'name': 'DB_NAME', 'value': 'tradinganalytics' },
            { 'name': 'DB_USER', 'value': 'dbadmin' },
            { 'name': 'DB_SECRET_ARN', 'value': secretArn },
            { 'name': 'USE_IAM_AUTH', 'value': 'true' },
            { 'name': 'CIRCUIT_BREAKER_TIMEOUT', 'value': '30000' },
            { 'name': 'CIRCUIT_BREAKER_MAX_RETRIES', 'value': '3' },
          ],
          'logConfiguration': {
            'logDriver': 'awslogs',
            'options': { 'awslogs-group': logGroupName, 'awslogs-region': 'us-east-2', 'awslogs-stream-prefix': 'api' },
          },
          'healthCheck': {
            'command': ['CMD-SHELL', 'curl -f http://localhost:8080/api/health || exit 1'],
            'interval': 30,
            'timeout': 5,
            'retries': 3,
            'startPeriod': 60,
          },
        }])),
      tags: { ...this.defaultTags, Name: 'tap-api-task' },
    }, { parent: this });

    const frontendTaskDefinition = new aws.ecs.TaskDefinition(`tap-frontend-task-${this.environmentSuffix}`, {
      family: `tap-frontend-${this.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: this.ecsTaskExecutionRole.arn,
      taskRoleArn: this.ecsTaskRole.arn,
      containerDefinitions: pulumi.all([this.ecrFrontendRepository.repositoryUrl, this.alb.dnsName, frontendLogGroup.name])
        .apply(([repoUrl, albDns, logGroupName]) => JSON.stringify([{
          'name': 'frontend',
          'image': `${repoUrl}:latest`,
          'essential': true,
          'portMappings': [{ 'containerPort': 3000, 'protocol': 'tcp' }],
          'environment': [
            { 'name': 'NODE_ENV', 'value': 'production' },
            { 'name': 'API_URL', 'value': `http://${albDns}/api` },
          ],
          'logConfiguration': {
            'logDriver': 'awslogs',
            'options': { 'awslogs-group': logGroupName, 'awslogs-region': 'us-east-2', 'awslogs-stream-prefix': 'frontend' },
          },
          'healthCheck': {
            'command': ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
            'interval': 30,
            'timeout': 5,
            'retries': 3,
            'startPeriod': 60,
          },
        }])),
      tags: { ...this.defaultTags, Name: 'tap-frontend-task' },
    }, { parent: this });

    const apiService = new aws.ecs.Service(`tap-api-service-${this.environmentSuffix}`, {
      name: `tap-api-service-${this.environmentSuffix}`,
      cluster: ecsCluster.arn,
      taskDefinition: apiTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      networkConfiguration: {
        assignPublicIp: false,
        subnets: this.privateSubnets.map(s => s.id),
        securityGroups: [this.ecsSecurityGroup.id],
      },
      loadBalancers: [{
        targetGroupArn: this.albTargetGroupBlue.arn,
        containerName: 'api',
        containerPort: 8080,
      }],
      deploymentController: { type: 'ECS' },
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: { ...this.defaultTags, Name: 'tap-api-service' },
    }, { parent: this, dependsOn: [fargateSpotCapacityProvider] });

    const frontendService = new aws.ecs.Service(`tap-frontend-service-${this.environmentSuffix}`, {
      name: `tap-frontend-service-${this.environmentSuffix}`,
      cluster: ecsCluster.arn,
      taskDefinition: frontendTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      networkConfiguration: {
        assignPublicIp: false,
        subnets: this.privateSubnets.map(s => s.id),
        securityGroups: [this.ecsSecurityGroup.id],
      },
      loadBalancers: [{
        targetGroupArn: this.albTargetGroupFrontend.arn,
        containerName: 'frontend',
        containerPort: 3000,
      }],
      deploymentController: { type: 'ECS' },
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: { ...this.defaultTags, Name: 'tap-frontend-service' },
    }, { parent: this, dependsOn: [fargateSpotCapacityProvider] });

    return { ecsCluster, apiLogGroup, frontendLogGroup, apiService, frontendService };
  }

  private createAutoScaling() {
    const apiAutoScalingTarget = new aws.appautoscaling.Target(`tap-api-autoscaling-target-${this.environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${this.ecsCluster.name}/${this.apiService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
      roleArn: this.autoScalingRole.arn,
    }, { parent: this });

    const apiCpuScalingPolicy = new aws.appautoscaling.Policy(`tap-api-cpu-scaling-${this.environmentSuffix}`, {
      name: `tap-api-cpu-scaling-${this.environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: apiAutoScalingTarget.resourceId,
      scalableDimension: apiAutoScalingTarget.scalableDimension,
      serviceNamespace: apiAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: { predefinedMetricType: 'ECSServiceAverageCPUUtilization' },
        targetValue: 70.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    const apiRequestScalingPolicy = new aws.appautoscaling.Policy(`tap-api-request-scaling-${this.environmentSuffix}`, {
      name: `tap-api-request-scaling-${this.environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: apiAutoScalingTarget.resourceId,
      scalableDimension: apiAutoScalingTarget.scalableDimension,
      serviceNamespace: apiAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ALBRequestCountPerTarget',
          resourceLabel: pulumi.interpolate`${this.alb.arnSuffix}/${this.albTargetGroupBlue.arnSuffix}`,
        },
        targetValue: 1000.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    const frontendAutoScalingTarget = new aws.appautoscaling.Target(`tap-frontend-autoscaling-target-${this.environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${this.ecsCluster.name}/${this.frontendService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
      roleArn: this.autoScalingRole.arn,
    }, { parent: this });

    new aws.appautoscaling.Policy(`tap-frontend-cpu-scaling-${this.environmentSuffix}`, {
      name: `tap-frontend-cpu-scaling-${this.environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: frontendAutoScalingTarget.resourceId,
      scalableDimension: frontendAutoScalingTarget.scalableDimension,
      serviceNamespace: frontendAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: { predefinedMetricType: 'ECSServiceAverageCPUUtilization' },
        targetValue: 70.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    return { apiAutoScalingTarget, frontendAutoScalingTarget, apiCpuScalingPolicy, apiRequestScalingPolicy };
  }

  private createMonitoring() {
    const alarmTopic = new aws.sns.Topic(`tap-alarms-${this.environmentSuffix}`, {
      name: `tap-alarms-${this.environmentSuffix}`,
      tags: { ...this.defaultTags, Name: 'tap-alarms' },
    }, { parent: this });

    const cpuAlarm = new aws.cloudwatch.MetricAlarm(`tap-cpu-alarm-${this.environmentSuffix}`, {
      name: `tap-high-cpu-${this.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when CPU exceeds 80%',
      alarmActions: [alarmTopic.arn],
      dimensions: { ClusterName: this.ecsCluster.name, ServiceName: this.apiService.name },
      tags: { ...this.defaultTags },
    }, { parent: this });

    const memoryAlarm = new aws.cloudwatch.MetricAlarm(`tap-memory-alarm-${this.environmentSuffix}`, {
      name: `tap-high-memory-${this.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'MemoryUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when memory exceeds 80%',
      alarmActions: [alarmTopic.arn],
      dimensions: { ClusterName: this.ecsCluster.name, ServiceName: this.apiService.name },
      tags: { ...this.defaultTags },
    }, { parent: this });

    const http5xxAlarm = new aws.cloudwatch.MetricAlarm(`tap-http5xx-alarm-${this.environmentSuffix}`, {
      name: `tap-high-5xx-errors-${this.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'HTTPCode_Target_5XX_Count',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when 5xx errors exceed 10 per minute',
      alarmActions: [alarmTopic.arn],
      dimensions: { LoadBalancer: this.alb.arnSuffix, TargetGroup: this.albTargetGroupBlue.arnSuffix },
      tags: { ...this.defaultTags },
    }, { parent: this });

    return { cpuAlarm, memoryAlarm, http5xxAlarm };
  }

  private exportOutputs(): pulumi.Output<TapStackOutputs> {
    const outputs = pulumi.output({
      vpcId: this.vpc.id,
      vpcCidr: this.vpc.cidrBlock,
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
      databaseSubnetIds: pulumi.all(this.databaseSubnets.map(s => s.id)),
      albSecurityGroupId: this.albSecurityGroup.id,
      ecsSecurityGroupId: this.ecsSecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
      albDnsName: this.alb.dnsName,
      albArn: this.alb.arn,
      albZoneId: this.alb.zoneId,
      targetGroupBlueArn: this.albTargetGroupBlue.arn,
      targetGroupGreenArn: this.albTargetGroupGreen.arn,
      ecsClusterName: this.ecsCluster.name,
      ecsClusterArn: this.ecsCluster.arn,
      apiServiceName: this.apiService.name,
      frontendServiceName: this.frontendService.name,
      auroraClusterEndpoint: this.auroraCluster.endpoint,
      auroraClusterReaderEndpoint: this.auroraCluster.readerEndpoint,
      auroraClusterArn: this.auroraCluster.arn,
      auroraClusterId: this.auroraCluster.id,
      dbSecretArn: this.dbSecret.arn,
      ecrApiRepositoryUrl: this.ecrApiRepository.repositoryUrl,
      ecrFrontendRepositoryUrl: this.ecrFrontendRepository.repositoryUrl,
      apiLogGroupName: this.apiLogGroup.name,
      frontendLogGroupName: this.frontendLogGroup.name,
      ecsTaskExecutionRoleArn: this.ecsTaskExecutionRole.arn,
      ecsTaskRoleArn: this.ecsTaskRole.arn,
    });

    // Only write outputs file in non-test environment and non-dry-run
    if (process.env.NODE_ENV !== 'test' && !pulumi.runtime.isDryRun()) {
      outputs.apply(o => {
        const outputDir = 'cfn-outputs';
        const outputFile = path.join(outputDir, 'flat-outputs.json');

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputFile, JSON.stringify(o, null, 2));
        console.log('Outputs written to ' + outputFile);
      });
    }

    return outputs;
  }
}
