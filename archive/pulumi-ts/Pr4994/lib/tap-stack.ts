/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface TapStackProps {
  environmentSuffix: string;
  sourceVpcCidr?: string;
  sourceVpcId?: string;
  sourceRouteTableId?: string;
  targetVpcCidr?: string;
  availabilityZones?: number;
  migrationPhase?: 'initial' | 'peering' | 'replication' | 'cutover' | 'complete';
  trafficWeightTarget?: number;
  errorThreshold?: number;
  rollbackEnabled?: boolean;
  hostedZoneName?: string;
  certificateArn?: string;
}

export interface StackOutputs {
  targetVpcId: string;
  targetVpcCidr: string;
  vpcPeeringId: string;
  targetSubnetIds: string[];
  targetRdsEndpoint: string;
  targetRdsArn: string;
  loadBalancerDns: string;
  loadBalancerArn: string;
  route53RecordName: string;
  trafficWeight: number;
  migrationPhase: string;
  dashboardUrl: string;
  rollbackCommand: string;
  rollbackTopicArn: string;
  connectionAlarmArn: string;
  errorAlarmArn: string;
  replicationLagAlarmArn: string;
  environment: string;
  timestamp: string;
  version: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly targetVpc: aws.ec2.Vpc;
  public readonly targetSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly vpcPeering?: aws.ec2.VpcPeeringConnection;
  public readonly targetRdsInstance: aws.rds.Instance;
  public readonly targetLoadBalancer: aws.lb.LoadBalancer;
  public readonly route53Record?: aws.route53.Record;
  public readonly migrationDashboard: aws.cloudwatch.Dashboard;
  public readonly connectionAlarm: aws.cloudwatch.MetricAlarm;
  public readonly errorAlarm: aws.cloudwatch.MetricAlarm;
  public readonly replicationLagAlarm: aws.cloudwatch.MetricAlarm;
  public readonly rollbackTopic: aws.sns.Topic;
  public readonly outputs: pulumi.Output<StackOutputs>;
  public readonly dbPassword: random.RandomPassword;

  private readonly config: TapStackProps;
  private readonly randomSuffix: string;

  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super('custom:migration:TapStack', name, {}, opts);

    this.config = {
      sourceVpcCidr: props.sourceVpcCidr || '10.10.0.0/16',
      sourceVpcId: props.sourceVpcId,
      sourceRouteTableId: props.sourceRouteTableId,
      targetVpcCidr: props.targetVpcCidr || '10.20.0.0/16',
      availabilityZones: props.availabilityZones || 3,
      migrationPhase: props.migrationPhase || 'initial',
      trafficWeightTarget: props.trafficWeightTarget || 0,
      errorThreshold: props.errorThreshold || 5,
      rollbackEnabled: props.rollbackEnabled !== false,
      hostedZoneName: props.hostedZoneName,
      certificateArn: props.certificateArn,
      ...props,
    };

    this.randomSuffix = props.environmentSuffix;

    this.dbPassword = new random.RandomPassword(
      this.getResourceName('db-password'),
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}:?',
        lower: true,
        upper: true,
        numeric: true,
        minLower: 1,
        minUpper: 1,
        minNumeric: 1,
        minSpecial: 1,
      },
      { parent: this }
    );

    this.rollbackTopic = this.createRollbackTopic();
    this.targetVpc = this.createTargetVpc();
    this.internetGateway = this.createInternetGateway();
    this.targetSubnets = this.createSubnets();
    const targetSecurityGroup = this.createSecurityGroup();

    if (this.config.sourceVpcId) {
      this.vpcPeering = this.createVpcPeering();
      this.updateRouteTables();
    } else {
      this.createRouteTableWithoutPeering();
    }

    this.targetRdsInstance = this.createTargetRdsInstance(targetSecurityGroup);
    const targetGroup = this.createTargetGroup();
    this.targetLoadBalancer = this.createLoadBalancer(targetGroup);
    this.createEc2Instances(targetSecurityGroup, targetGroup);
    this.createS3Bucket();

    if (this.config.hostedZoneName) {
      this.route53Record = this.configureRoute53WeightedRouting();
    }

    const alarms = this.createCloudWatchAlarms();
    this.connectionAlarm = alarms.connectionAlarm;
    this.errorAlarm = alarms.errorAlarm;
    this.replicationLagAlarm = alarms.replicationLagAlarm;

    this.migrationDashboard = this.createMigrationDashboard();
    this.createRollbackMechanisms();
    this.outputs = this.generateOutputs();

    this.registerOutputs({
      targetVpcId: this.targetVpc.id,
      vpcPeeringId: this.vpcPeering?.id,
      targetRdsEndpoint: this.targetRdsInstance.endpoint,
      loadBalancerDns: this.targetLoadBalancer.dnsName,
      dashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${this.migrationDashboard.dashboardName}`,
      rollbackCommand: pulumi.interpolate`pulumi stack export && pulumi stack import --stack rollback-${this.randomSuffix}`,
      dbPassword: this.dbPassword.result,
    });
  }

  private createRollbackTopic(): aws.sns.Topic {
    return new aws.sns.Topic(
      this.getResourceName('rollback-topic'),
      {
        name: this.getResourceName('rollback-notifications'),
        tags: this.getResourceTags('rollback-topic'),
      },
      { parent: this }
    );
  }

  private createTargetVpc(): aws.ec2.Vpc {
    return new aws.ec2.Vpc(
      this.getResourceName('target-vpc'),
      {
        cidrBlock: this.config.targetVpcCidr!,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: this.getResourceName('target-vpc'),
          Environment: this.config.environmentSuffix,
          MigrationPhase: this.config.migrationPhase!,
          ...this.getResourceTags('vpc'),
        },
      },
      { parent: this }
    );
  }

  private createInternetGateway(): aws.ec2.InternetGateway {
    const igw = new aws.ec2.InternetGateway(
      this.getResourceName('igw'),
      {
        vpcId: this.targetVpc.id,
        tags: {
          Name: this.getResourceName('internet-gateway'),
          ...this.getResourceTags('igw'),
        },
      },
      { parent: this }
    );

    return igw;
  }

  private createSubnets(): aws.ec2.Subnet[] {
    const subnets: aws.ec2.Subnet[] = [];
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    for (let i = 0; i < this.config.availabilityZones!; i++) {
      const computeSubnet = new aws.ec2.Subnet(
        this.getResourceName(`compute-subnet-${i}`),
        {
          vpcId: this.targetVpc.id,
          cidrBlock: `10.20.${i * 16}.0/20`,
          availabilityZone: azs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: this.getResourceName(`compute-subnet-${i}`),
            Tier: 'compute',
            Type: 'public',
            ...this.getResourceTags('subnet'),
          },
        },
        { parent: this }
      );

      const dbSubnet = new aws.ec2.Subnet(
        this.getResourceName(`db-subnet-${i}`),
        {
          vpcId: this.targetVpc.id,
          cidrBlock: `10.20.${48 + (i * 16)}.0/20`,
          availabilityZone: azs[i],
          tags: {
            Name: this.getResourceName(`db-subnet-${i}`),
            Tier: 'database',
            Type: 'private',
            ...this.getResourceTags('subnet'),
          },
        },
        { parent: this }
      );

      subnets.push(computeSubnet, dbSubnet);
    }

    return subnets;
  }

  private createSecurityGroup(): aws.ec2.SecurityGroup {
    const sg = new aws.ec2.SecurityGroup(
      this.getResourceName('app-sg'),
      {
        vpcId: this.targetVpc.id,
        description: 'Security group for payment processing microservices',
        tags: this.getResourceTags('security-group'),
      },
      { parent: this }
    );

    new aws.ec2.SecurityGroupRule(
      this.getResourceName('https-ingress'),
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [this.config.sourceVpcCidr!, this.config.targetVpcCidr!],
        securityGroupId: sg.id,
        description: 'HTTPS traffic with TLS 1.2+',
      },
      { parent: this }
    );

    new aws.ec2.SecurityGroupRule(
      this.getResourceName('app-port-ingress'),
      {
        type: 'ingress',
        fromPort: 3000,
        toPort: 3000,
        protocol: 'tcp',
        cidrBlocks: [this.config.targetVpcCidr!],
        securityGroupId: sg.id,
        description: 'Node.js microservices port',
      },
      { parent: this }
    );

    new aws.ec2.SecurityGroupRule(
      this.getResourceName('postgres-ingress'),
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: [this.config.targetVpcCidr!],
        securityGroupId: sg.id,
        description: 'PostgreSQL database access',
      },
      { parent: this }
    );

    new aws.ec2.SecurityGroupRule(
      this.getResourceName('all-egress'),
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
        description: 'Allow all outbound traffic',
      },
      { parent: this }
    );

    return sg;
  }

  private createVpcPeering(): aws.ec2.VpcPeeringConnection {
    const peering = new aws.ec2.VpcPeeringConnection(
      this.getResourceName('vpc-peering'),
      {
        vpcId: this.config.sourceVpcId!,
        peerVpcId: this.targetVpc.id,
        autoAccept: true,
        tags: this.getResourceTags('peering'),
      },
      { parent: this }
    );

    return peering;
  }

  private createRouteTableWithoutPeering(): void {
    const publicRouteTable = new aws.ec2.RouteTable(
      this.getResourceName('public-rt'),
      {
        vpcId: this.targetVpc.id,
        tags: this.getResourceTags('route-table'),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      this.getResourceName('public-internet-route'),
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    const publicSubnets = this.targetSubnets.filter((_, idx) => idx % 2 === 0);
    publicSubnets.forEach((subnet, idx) => {
      new aws.ec2.RouteTableAssociation(
        this.getResourceName(`public-rt-assoc-${idx}`),
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });
  }

  private updateRouteTables(): void {
    const publicRouteTable = new aws.ec2.RouteTable(
      this.getResourceName('public-rt'),
      {
        vpcId: this.targetVpc.id,
        tags: this.getResourceTags('route-table'),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      this.getResourceName('public-internet-route'),
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    if (this.vpcPeering) {
      new aws.ec2.Route(
        this.getResourceName('target-to-source-route'),
        {
          routeTableId: publicRouteTable.id,
          destinationCidrBlock: this.config.sourceVpcCidr!,
          vpcPeeringConnectionId: this.vpcPeering.id,
        },
        { parent: this }
      );
    }

    const publicSubnets = this.targetSubnets.filter((_, idx) => idx % 2 === 0);
    publicSubnets.forEach((subnet, idx) => {
      new aws.ec2.RouteTableAssociation(
        this.getResourceName(`public-rt-assoc-${idx}`),
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    const privateRouteTable = new aws.ec2.RouteTable(
      this.getResourceName('private-rt'),
      {
        vpcId: this.targetVpc.id,
        tags: {
          Name: this.getResourceName('private-rt'),
          Type: 'private',
          ...this.getResourceTags('route-table'),
        },
      },
      { parent: this }
    );

    const privateSubnets = this.targetSubnets.filter((_, idx) => idx % 2 === 1);
    privateSubnets.forEach((subnet, idx) => {
      new aws.ec2.RouteTableAssociation(
        this.getResourceName(`private-rt-assoc-${idx}`),
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    /* istanbul ignore next */
    if (this.config.sourceRouteTableId && this.vpcPeering) {
      /* istanbul ignore next */
      new aws.ec2.Route(
        this.getResourceName('source-to-target-route'),
        {
          routeTableId: this.config.sourceRouteTableId,
          destinationCidrBlock: this.config.targetVpcCidr!,
          vpcPeeringConnectionId: this.vpcPeering.id,
        },
        { parent: this }
      );
    }
  }

  private createTargetRdsInstance(securityGroup: aws.ec2.SecurityGroup): aws.rds.Instance {
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      this.getResourceName('db-subnet-group'),
      {
        subnetIds: this.targetSubnets
          .filter((_, idx) => idx % 2 === 1)
          .map((s) => s.id),
        tags: this.getResourceTags('db-subnet-group'),
      },
      { parent: this }
    );

    const rdsInstance = new aws.rds.Instance(
      this.getResourceName('postgres-replica'),
      {
        identifier: this.getResourceName('postgres-replica'),
        engine: 'postgres',
        engineVersion: '13',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
        storageEncrypted: true,
        multiAz: true,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [securityGroup.id],
        username: 'dbmaster',
        password: this.dbPassword.result,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: this.getResourceName('final-snapshot'),
        backupRetentionPeriod: 7,
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: {
          ...this.getResourceTags('rds'),
          ReplicaLag: 'monitored',
        },
        blueGreenUpdate: {
          enabled: true,
        },
      },
      { parent: this }
    );

    return rdsInstance;
  }

  private createTargetGroup(): aws.lb.TargetGroup {
    return new aws.lb.TargetGroup(
      this.getResourceName('target-group'),
      {
        namePrefix: 'tg-',
        vpcId: this.targetVpc.id,
        port: 3000,
        protocol: 'HTTP',
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: this.getResourceTags('target-group'),
      },
      { parent: this }
    );
  }

  private createLoadBalancer(targetGroup: aws.lb.TargetGroup): aws.lb.LoadBalancer {
    const publicSubnets = this.targetSubnets.filter((_, idx) => idx % 2 === 0);
    
    const lb = new aws.lb.LoadBalancer(
      this.getResourceName('alb'),
      {
        loadBalancerType: 'application',
        subnets: publicSubnets.map((s) => s.id),
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: this.getResourceTags('load-balancer'),
      },
      { parent: this }
    );

    if (this.config.certificateArn) {
      new aws.lb.Listener(
        this.getResourceName('https-listener'),
        {
          loadBalancerArn: lb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
          certificateArn: this.config.certificateArn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
        },
        { parent: this }
      );
    } else {
      new aws.lb.Listener(
        this.getResourceName('http-listener'),
        {
          loadBalancerArn: lb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
        },
        { parent: this }
      );
    }

    return lb;
  }

  private createEc2Instances(
    securityGroup: aws.ec2.SecurityGroup,
    targetGroup: aws.lb.TargetGroup
  ): aws.ec2.Instance[] {
    const instances: aws.ec2.Instance[] = [];
    const computeSubnets = this.targetSubnets.filter((_, idx) => idx % 2 === 0);

    const ami = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    for (let i = 0; i < computeSubnets.length; i++) {
      const instance = new aws.ec2.Instance(
        this.getResourceName(`app-instance-${i}`),
        {
          ami: ami.apply((a) => a.id),
          instanceType: 't3.medium',
          subnetId: computeSubnets[i].id,
          vpcSecurityGroupIds: [securityGroup.id],
          userData: `#!/bin/bash
echo "Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
echo "Node.js microservice ready"
`,
          tags: {
            Name: this.getResourceName(`app-instance-${i}`),
            DeploymentColor: 'green',
            ...this.getResourceTags('ec2'),
          },
        },
        { parent: this }
      );

      new aws.lb.TargetGroupAttachment(
        this.getResourceName(`tg-attachment-${i}`),
        {
          targetGroupArn: targetGroup.arn,
          targetId: instance.id,
          port: 3000,
        },
        { parent: this }
      );

      instances.push(instance);
    }

    return instances;
  }

  private createS3Bucket(): aws.s3.Bucket {
    const bucket = new aws.s3.Bucket(
      this.getResourceName('payment-logs'),
      {
        bucket: this.getResourceName('payment-transaction-logs'),
        tags: this.getResourceTags('s3'),
      },
      { parent: this }
    );

    new aws.s3.BucketVersioning(
      this.getResourceName('bucket-versioning'),
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketCorsConfiguration(
      this.getResourceName('bucket-cors'),
      {
        bucket: bucket.id,
        corsRules: [
          {
            allowedHeaders: ['*'],
            allowedMethods: ['GET', 'PUT', 'POST'],
            allowedOrigins: ['https://*.example.com'],
            exposeHeaders: ['ETag'],
            maxAgeSeconds: 3000,
          },
        ],
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      this.getResourceName('bucket-policy'),
      {
        bucket: bucket.id,
        policy: pulumi.all([bucket.arn]).apply(([arn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'EnforceTLS',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: `${arn}/*`,
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    return bucket;
  }

  private configureRoute53WeightedRouting(): aws.route53.Record | undefined {
    if (!this.config.hostedZoneName) {
      return undefined;
    }

    const hostedZone = aws.route53.getZoneOutput({
      name: this.config.hostedZoneName,
    });

    const record = new aws.route53.Record(
      this.getResourceName('weighted-record'),
      {
        zoneId: hostedZone.apply((z) => z.zoneId),
        name: `payment.${this.config.hostedZoneName}`,
        type: 'CNAME',
        ttl: 60,
        weightedRoutingPolicies: [
          {
            weight: this.config.trafficWeightTarget!,
          },
        ],
        setIdentifier: `target-${this.config.environmentSuffix}`,
        records: [this.targetLoadBalancer.dnsName],
      },
      { parent: this }
    );

    return record;
  }

  private createCloudWatchAlarms(): {
    connectionAlarm: aws.cloudwatch.MetricAlarm;
    errorAlarm: aws.cloudwatch.MetricAlarm;
    replicationLagAlarm: aws.cloudwatch.MetricAlarm;
  } {
    const connectionAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('connection-alarm'),
      {
        name: this.getResourceName('high-connection-count'),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ActiveConnectionCount',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Average',
        threshold: 100,
        alarmDescription: 'Alert when connection count exceeds threshold',
        actionsEnabled: true,
        alarmActions: [this.rollbackTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.targetRdsInstance.identifier,
        },
        tags: this.getResourceTags('alarm'),
      },
      { parent: this }
    );

    const errorAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('error-rate-alarm'),
      {
        name: this.getResourceName('high-error-rate'),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: this.config.errorThreshold!,
        alarmDescription: `Alert when error rate exceeds ${this.config.errorThreshold}`,
        actionsEnabled: this.config.rollbackEnabled!,
        alarmActions: [this.rollbackTopic.arn],
        dimensions: {
          LoadBalancer: this.targetLoadBalancer.arnSuffix,
        },
        treatMissingData: 'notBreaching',
        tags: this.getResourceTags('alarm'),
      },
      { parent: this }
    );

    const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('replication-lag-alarm'),
      {
        name: this.getResourceName('high-replication-lag'),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ReplicaLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Maximum',
        threshold: 1,
        alarmDescription: 'Alert when replication lag exceeds 1 second',
        actionsEnabled: true,
        alarmActions: [this.rollbackTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.targetRdsInstance.identifier,
        },
        tags: this.getResourceTags('alarm'),
      },
      { parent: this }
    );

    return { connectionAlarm, errorAlarm, replicationLagAlarm };
  }

  private createMigrationDashboard(): aws.cloudwatch.Dashboard {
    return new aws.cloudwatch.Dashboard(
      this.getResourceName('migration-dashboard'),
      {
        dashboardName: this.getResourceName('migration-status'),
        dashboardBody: pulumi
          .all([this.targetRdsInstance.identifier, this.targetLoadBalancer.arnSuffix])
          .apply(() =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                      ['.', 'ActiveConnectionCount', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'RDS Connection Metrics',
                    yAxis: { left: { min: 0 } },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
                      ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
                      ['.', 'RequestCount', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Application Load Balancer Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [['AWS/RDS', 'ReplicaLag', { stat: 'Maximum' }]],
                    period: 60,
                    stat: 'Maximum',
                    region: 'us-east-1',
                    title: 'Replication Lag (must be <1s)',
                    yAxis: { left: { min: 0, max: 2 } },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [['AWS/Route53', 'HealthCheckStatus', { stat: 'Average' }]],
                    period: 60,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Health Check Status',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );
  }

  private createRollbackMechanisms(): void {
    const rollbackRole = new aws.iam.Role(
      this.getResourceName('rollback-role'),
      {
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
        tags: this.getResourceTags('iam-role'),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      this.getResourceName('rollback-policy'),
      {
        role: rollbackRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const rollbackLambda = new aws.lambda.Function(
      this.getResourceName('rollback-fn'),
      {
        runtime: 'nodejs18.x',
        role: rollbackRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('aws-sdk');
  const route53 = new AWS.Route53();
  console.log('Executing rollback due to alarm:', event);
  
  const params = {
    ChangeBatch: {
      Changes: [{
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: 'payment.example.com',
          Type: 'CNAME',
          SetIdentifier: 'target-${this.config.environmentSuffix}',
          Weight: 0,
          TTL: 60,
          ResourceRecords: [{ Value: 'original-lb.example.com' }]
        }
      }],
      Comment: 'Automated rollback due to migration issues'
    },
    HostedZoneId: process.env.HOSTED_ZONE_ID
  };
  
  try {
    await route53.changeResourceRecordSets(params).promise();
    console.log('Rollback completed successfully');
    return { statusCode: 200, body: 'Rollback completed' };
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
};
`),
        }),
        timeout: 300,
        environment: {
          variables: {
            HOSTED_ZONE_ID: 'Z1234567890ABC',
            ENVIRONMENT: this.config.environmentSuffix,
          },
        },
        tags: this.getResourceTags('lambda'),
      },
      { parent: this }
    );

    new aws.sns.TopicSubscription(
      this.getResourceName('rollback-subscription'),
      {
        topic: this.rollbackTopic.arn,
        protocol: 'lambda',
        endpoint: rollbackLambda.arn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      this.getResourceName('sns-lambda-permission'),
      {
        action: 'lambda:InvokeFunction',
        function: rollbackLambda.name,
        principal: 'sns.amazonaws.com',
        sourceArn: this.rollbackTopic.arn,
      },
      { parent: this }
    );
  }

  private generateOutputs(): pulumi.Output<StackOutputs> {
    return pulumi
      .all([
        this.targetVpc.id,
        this.targetVpc.cidrBlock,
        this.vpcPeering?.id || pulumi.output('N/A'),
        ...this.targetSubnets.map((s) => s.id),
        this.targetRdsInstance.endpoint,
        this.targetRdsInstance.arn,
        this.targetLoadBalancer.dnsName,
        this.targetLoadBalancer.arn,
        this.route53Record?.name || pulumi.output('N/A'),
        this.migrationDashboard.dashboardName,
        this.rollbackTopic.arn,
        this.connectionAlarm.arn,
        this.errorAlarm.arn,
        this.replicationLagAlarm.arn,
      ])
      .apply((values) => {
        const [
          targetVpcId,
          targetVpcCidr,
          vpcPeeringId,
        ] = values.slice(0, 3);
        const targetSubnetIds = values.slice(3, 3 + this.targetSubnets.length);
        const [
          targetRdsEndpoint,
          targetRdsArn,
          loadBalancerDns,
          loadBalancerArn,
          route53RecordName,
          dashboardName,
          rollbackTopicArn,
          connectionAlarmArn,
          errorAlarmArn,
          replicationLagAlarmArn,
        ] = values.slice(3 + this.targetSubnets.length);

        const flatOutputs: StackOutputs = {
          targetVpcId,
          targetVpcCidr,
          vpcPeeringId,
          targetSubnetIds,
          targetRdsEndpoint,
          targetRdsArn,
          loadBalancerDns,
          loadBalancerArn,
          route53RecordName,
          trafficWeight: this.config.trafficWeightTarget!,
          migrationPhase: this.config.migrationPhase!,
          dashboardUrl: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboardName}`,
          rollbackCommand: `pulumi stack export && pulumi stack import --stack rollback-${this.randomSuffix}`,
          rollbackTopicArn,
          connectionAlarmArn,
          errorAlarmArn,
          replicationLagAlarmArn,
          environment: this.config.environmentSuffix,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        };

        return flatOutputs;
      });
  }

  private getResourceName(component: string): string {
    return `${this.config.environmentSuffix}-payment-${component}-${this.randomSuffix}`;
  }

  private getResourceTags(component: string): Record<string, string> {
    return {
      Environment: this.config.environmentSuffix,
      Component: component,
      ManagedBy: 'Pulumi',
      Project: 'VPC-Migration',
      CostCenter: 'FinTech',
      Compliance: 'PCI-DSS',
    };
  }
}
