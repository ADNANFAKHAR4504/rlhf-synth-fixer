// lib/tap-stack.ts
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// A reusable construct for regional infrastructure
class RegionalInfra extends Construct {
  public readonly albDnsName: string;
  public readonly albZoneId: string;
  public readonly albArn: string;
  public readonly vpc: Vpc;
  public readonly dbCluster?: RdsCluster;
  public readonly healthCheck: Route53HealthCheck;
  public readonly asgName: string;

  constructor(
    scope: Construct,
    id: string,
    props: {
      providerAlias: AwsProvider;
      region: string;
      vpcCidr: string;
      environmentSuffix: string;
      createDatabase: boolean;
      kmsKey?: KmsKey;
      dbUsername: string;
      dbPassword?: string;
      tags: { [k: string]: string };
    }
  ) {
    super(scope, id);

    const {
      providerAlias,
      region,
      vpcCidr,
      environmentSuffix,
      createDatabase,
      kmsKey,
      dbUsername,
      dbPassword,
      tags,
    } = props;

    // Availability zones
    const azs = new DataAwsAvailabilityZones(this, `${id}-azs`, {
      provider: providerAlias,
    });

    // VPC
    this.vpc = new Vpc(this, `${id}-vpc`, {
      provider: providerAlias,
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `vpc-${region}-${environmentSuffix}` },
    });

    // Public subnets (for ALB and NAT GW)
    const subnetPubA = new Subnet(this, `${id}-subnet-pub-a`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 1),
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `pub-a-${region}-${environmentSuffix}` },
    });
    const subnetPubB = new Subnet(this, `${id}-subnet-pub-b`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 2),
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `pub-b-${region}-${environmentSuffix}` },
    });

    // Private subnets (for ASG and DB)
    const subnetPrivA = new Subnet(this, `${id}-subnet-priv-a`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 3),
      availabilityZone: Fn.element(azs.names, 0),
      tags: { ...tags, Name: `priv-a-${region}-${environmentSuffix}` },
    });
    const subnetPrivB = new Subnet(this, `${id}-subnet-priv-b`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 4),
      availabilityZone: Fn.element(azs.names, 1),
      tags: { ...tags, Name: `priv-b-${region}-${environmentSuffix}` },
    });

    // ... (igw, natGw, route tables are unchanged) ...
    // Internet gateway
    const igw = new InternetGateway(this, `${id}-igw`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      tags: { ...tags },
    });

    // NAT Gateway
    const eip = new Eip(this, `${id}-eip`, { provider: providerAlias, tags });
    const natGw = new NatGateway(this, `${id}-nat-gw`, {
      provider: providerAlias,
      allocationId: eip.id,
      subnetId: subnetPubA.id,
      tags: { ...tags },
      dependsOn: [igw],
    });

    // Public Route Table
    const rtPub = new RouteTable(this, `${id}-rt-pub`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...tags },
    });
    new RouteTableAssociation(this, `${id}-rta-pub-a`, {
      provider: providerAlias,
      subnetId: subnetPubA.id,
      routeTableId: rtPub.id,
    });
    new RouteTableAssociation(this, `${id}-rta-pub-b`, {
      provider: providerAlias,
      subnetId: subnetPubB.id,
      routeTableId: rtPub.id,
    });

    // Private Route Table
    const rtPriv = new RouteTable(this, `${id}-rt-priv`, {
      provider: providerAlias,
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGw.id }],
      tags: { ...tags },
    });
    new RouteTableAssociation(this, `${id}-rta-priv-a`, {
      provider: providerAlias,
      subnetId: subnetPrivA.id,
      routeTableId: rtPriv.id,
    });
    new RouteTableAssociation(this, `${id}-rta-priv-b`, {
      provider: providerAlias,
      subnetId: subnetPrivB.id,
      routeTableId: rtPriv.id,
    });

    // Security Groups
    const albSg = new SecurityGroup(this, `${id}-alb-sg`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `alb-sg-${environmentSuffix}-${region}`,
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags },
    });
    const asgSg = new SecurityGroup(this, `${id}-asg-sg`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `asg-sg-${environmentSuffix}-${region}`,
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags },
    });

    // ... (ami unchanged) ...
    // Simple AMI selection
    const ami = new DataAwsAmi(this, `${id}-ami`, {
      provider: providerAlias,
      mostRecent: true,
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
      owners: ['amazon'],
    });

    // Simple Launch Template + ASG (for demonstration — t3.micro)
    const role = new IamRole(this, `${id}-ec2-role`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `${id}-ec2-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: { ...tags },
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      `${id}-instance-profile`,
      {
        provider: providerAlias,
        // --- FIX: Use environmentSuffix ---
        name: `${id}-instance-profile-${environmentSuffix}`,
        role: role.name,
      }
    );

    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl enable httpd
systemctl start httpd
echo 'OK from ${region}' > /var/www/html/index.html
`;

    const lt = new LaunchTemplate(this, `${id}-lt`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `${id}-lt-${environmentSuffix}`,
      imageId: ami.id,
      instanceType: 't3.micro',
      userData: Fn.base64encode(userData),
      iamInstanceProfile: { name: instanceProfile.name },
      networkInterfaces: [
        { securityGroups: [asgSg.id], associatePublicIpAddress: 'false' },
      ], // No public IP
      tags: { ...tags },
    });

    const asg = new AutoscalingGroup(this, `${id}-asg`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `${id}-asg-${environmentSuffix}`,
      minSize: 1,
      maxSize: 2,
      desiredCapacity: 1,
      vpcZoneIdentifier: [subnetPrivA.id, subnetPrivB.id], // Use private subnets
      launchTemplate: { id: lt.id },
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: 'Name',
          // --- FIX: Use environmentSuffix ---
          value: `${id}-asg-${environmentSuffix}`,
          propagateAtLaunch: true,
        },
        ...Object.keys(tags).map(k => ({
          key: k,
          value: tags[k],
          propagateAtLaunch: true,
        })),
      ],
    });

    // ALB + target group + listener
    const alb = new Lb(this, `${id}-alb`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `${id}-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [subnetPubA.id, subnetPubB.id], // ALB stays in public subnets
      tags: { ...tags },
    });
    const tg = new LbTargetGroup(this, `${id}-tg`, {
      provider: providerAlias,
      // --- FIX: Use environmentSuffix ---
      name: `${id}-tg-${environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'instance',
    });
    // Attach ASG to target group
    asg.targetGroupArns = [tg.arn];

    new LbListener(this, `${id}-listener`, {
      provider: providerAlias,
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: tg.arn }],
    });

    this.albDnsName = alb.dnsName;
    this.albZoneId = alb.zoneId;
    this.albArn = alb.arn;
    this.asgName = asg.name;

    // Database (optional)
    if (createDatabase) {
      // DB Security Group
      const dbSg = new SecurityGroup(this, `${id}-db-sg`, {
        provider: providerAlias,
        // --- FIX: Use environmentSuffix ---
        name: `db-sg-${environmentSuffix}-${region}`,
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [asgSg.id],
          },
        ], // Access from ASG
        tags: { ...tags },
      });

      // DB subnet group
      const dbSubnetGroup = new DbSubnetGroup(this, `${id}-db-subnet-group`, {
        provider: providerAlias,
        // --- FIX: Use environmentSuffix ---
        name: `${id.toLowerCase()}-db-subnet-${environmentSuffix}`,
        subnetIds: [subnetPrivA.id, subnetPrivB.id], // Use private subnets
        tags: { ...tags },
      });

      this.dbCluster = new RdsCluster(this, `${id}-rds-cluster`, {
        provider: providerAlias,
        // --- FIX: Use environmentSuffix ---
        clusterIdentifier: `${id.toLowerCase()}-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '13.9',
        databaseName: 'appdb',
        masterUsername: dbUsername,
        masterPassword: dbPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey?.arn, // Correctly use ARN
        skipFinalSnapshot: true,
        tags: { ...tags },
      });

      new RdsClusterInstance(this, `${id}-rds-instance`, {
        provider: providerAlias,
        clusterIdentifier: this.dbCluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
      });
    }

    // Health check (must be in us-east-1 for Route53 failover)
    this.healthCheck = new Route53HealthCheck(this, `${id}-hc`, {
      provider: scope.node.findChild('primary') as AwsProvider,
      fqdn: this.albDnsName,
      port: 80,
      type: 'HTTP',
      resourcePath: '/',
      failureThreshold: 3,
      requestInterval: 10,
    });
  }
}

// --- FIX: Add props interface ---
export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends TerraformStack {
  // --- FIX: Add props to constructor ---
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    // --- FIX: Use environmentSuffix from props instead of random ---
    const environmentSuffix = props.environmentSuffix;
    const tags = { Project: 'iac-rlhf-amazon' };
    const dbUser = 'dbadmin';

    // Providers for primary + DR
    const primaryProvider = new AwsProvider(this, 'primary', {
      region: 'us-east-1',
      alias: 'primary',
    });
    const drProvider = new AwsProvider(this, 'dr', {
      region: 'us-west-2',
      alias: 'dr',
    });

    // Random & password providers
    new RandomProvider(this, 'random');
    // --- THIS IS THE FIX: Specify allowed special characters ---
    const dbPassword = new Password(this, 'db_password', {
      length: 16,
      special: true,
      overrideSpecial: '_%+-', // Only allow these special characters
    });

    // KMS keys for encryption in both regions
    const primaryKms = new KmsKey(this, 'primary_kms', {
      provider: primaryProvider,
      // --- FIX: Use environmentSuffix ---
      description: `primary-kms-${environmentSuffix}`,
      enableKeyRotation: true,
      tags,
    });
    const drKms = new KmsKey(this, 'dr_kms', {
      provider: drProvider,
      // --- FIX: Use environmentSuffix ---
      description: `dr-kms-${environmentSuffix}`,
      enableKeyRotation: true,
      tags,
    });

    // Secrets in primary region (stores username/password JSON)
    const secret = new SecretsmanagerSecret(this, 'db_secret', {
      provider: primaryProvider,
      // --- FIX: Use environmentSuffix ---
      name: `db-secret-${environmentSuffix}`,
      kmsKeyId: primaryKms.id,
      tags,
    });
    new SecretsmanagerSecretVersion(this, 'db_secret_version', {
      provider: primaryProvider,
      secretId: secret.id,
      secretString: Fn.jsonencode({
        username: dbUser,
        password: dbPassword.result,
      }),
    });

    // Create regional infra objects: primary (create DB), DR (no DB created).
    const primaryInfra = new RegionalInfra(this, 'Primary', {
      providerAlias: primaryProvider,
      region: 'us-east-1',
      vpcCidr: '10.10.0.0/16',
      // --- FIX: Pass environmentSuffix ---
      environmentSuffix: environmentSuffix,
      createDatabase: true,
      kmsKey: primaryKms,
      dbUsername: dbUser,
      dbPassword: dbPassword.result,
      tags,
    });

    const drInfra = new RegionalInfra(this, 'DR', {
      providerAlias: drProvider,
      region: 'us-west-2',
      vpcCidr: '10.20.0.0/16',
      // --- FIX: Pass environmentSuffix ---
      environmentSuffix: environmentSuffix,
      createDatabase: true,
      kmsKey: drKms,
      dbUsername: dbUser,
      dbPassword: dbPassword.result,
      tags,
    });

    // Route53 global DNS zone
    // --- FIX: Use environmentSuffix ---
    const domainName = `trading-${environmentSuffix}.internal-test.com`;
    const zone = new Route53Zone(this, 'zone', {
      provider: primaryProvider,
      name: domainName,
      tags,
    });

    // Create primary & secondary failover records with health checks
    new Route53Record(this, 'primary_record', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: `app.${domainName}`,
      type: 'A',
      setIdentifier: 'primary',
      failoverRoutingPolicy: { type: 'PRIMARY' },
      healthCheckId: primaryInfra.healthCheck.id,
      alias: {
        name: primaryInfra.albDnsName,
        zoneId: primaryInfra.albZoneId,
        evaluateTargetHealth: true,
      },
    });

    new Route53Record(this, 'dr_record', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: `app.${domainName}`,
      type: 'A',
      setIdentifier: 'secondary',
      failoverRoutingPolicy: { type: 'SECONDARY' },
      healthCheckId: drInfra.healthCheck.id,
      alias: {
        name: drInfra.albDnsName,
        zoneId: drInfra.albZoneId,
        evaluateTargetHealth: true,
      },
    });

    // CloudWatch alarm watching the Route53 healthcheck metric as an example (placeholder)
    new CloudwatchMetricAlarm(this, 'primary_hc_alarm', {
      provider: primaryProvider,
      // --- FIX: Use environmentSuffix ---
      alarmName: `primary-healthcheck-alarm-${environmentSuffix}`,
      alarmDescription:
        'Primary region healthcheck alarm — can trigger DR orchestration',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      dimensions: { HealthCheckId: primaryInfra.healthCheck.id },
      treatMissingData: 'breaching',
      tags,
    });

    // Outputs
    new TerraformOutput(this, 'PrimaryALBEndpoint', {
      value: primaryInfra.albDnsName,
    });
    new TerraformOutput(this, 'DrALBEndpoint', { value: drInfra.albDnsName });
    new TerraformOutput(this, 'Route53FailoverDNS', {
      value: `app.${domainName}`,
    });
    new TerraformOutput(this, 'PrimaryDBClusterEndpoint', {
      value: primaryInfra.dbCluster!.endpoint,
    });
    new TerraformOutput(this, 'ReplicaDBClusterEndpoint', {
      value: drInfra.dbCluster!.endpoint,
    });

    // Outputs for Integration Tests
    new TerraformOutput(this, 'PrimaryDBClusterIdentifier', {
      value: primaryInfra.dbCluster!.clusterIdentifier,
    });
    new TerraformOutput(this, 'ReplicaDBClusterIdentifier', {
      value: drInfra.dbCluster!.clusterIdentifier,
    });
    new TerraformOutput(this, 'PrimaryASGName', {
      value: primaryInfra.asgName,
    });
    new TerraformOutput(this, 'DrASGName', { value: drInfra.asgName });
    new TerraformOutput(this, 'PrimaryALBArn', { value: primaryInfra.albArn });
    new TerraformOutput(this, 'DrALBArn', { value: drInfra.albArn });
    new TerraformOutput(this, 'HostedZoneId', { value: zone.zoneId });
  }
}
