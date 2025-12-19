import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls';
import { S3BucketReplicationConfigurationA as S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';

// Helper interface for regional infrastructure outputs
interface RegionalInfrastructure {
  alb: Lb;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // Multi-Region Provider Configuration
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: 'us-east-1',
      alias: 'us-east-1',
      defaultTags: [
        { tags: { environment: 'production', region: 'us-east-1' } },
      ],
    });

    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: 'eu-west-1',
      alias: 'eu-west-1',
      defaultTags: [
        { tags: { environment: 'production', region: 'eu-west-1' } },
      ],
    });

    const callerIdentity = new DataAwsCallerIdentity(this, 'caller-identity', {
      provider: primaryProvider,
    });

    // Cross-Region IAM Role for S3 Replication
    const s3ReplicationRole = new IamRole(this, 's3-replication-role', {
      provider: primaryProvider,
      name: `s3-replication-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
          },
        ],
      }),
    });

    // Cross-Region S3 Buckets with Replication
    const primaryBucket = new S3Bucket(this, 'primary-bucket', {
      provider: primaryProvider,
      bucket: `primary-app-data-${randomSuffix}`,
    });
    new S3BucketVersioningA(this, 'primary-bucket-versioning', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    const secondaryBucket = new S3Bucket(this, 'secondary-bucket', {
      provider: secondaryProvider,
      bucket: `secondary-app-data-${randomSuffix}`,
    });

    const secondaryBucketVersioning = new S3BucketVersioningA(
      this,
      'secondary-bucket-versioning',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      }
    );

    const secondaryBucketOwnership = new S3BucketOwnershipControls(
      this,
      'secondary-bucket-ownership',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      }
    );

    const s3ReplicationPolicy = new IamPolicy(this, 's3-replication-policy', {
      provider: primaryProvider,
      name: `s3-replication-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: primaryBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: `${primaryBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: `${secondaryBucket.arn}/*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 's3-replication-attachment', {
      provider: primaryProvider,
      role: s3ReplicationRole.name,
      policyArn: s3ReplicationPolicy.arn,
    });

    new S3BucketReplicationConfiguration(this, 'replication-config', {
      provider: primaryProvider,
      dependsOn: [
        secondaryBucket,
        secondaryBucketVersioning,
        secondaryBucketOwnership,
      ],
      bucket: primaryBucket.id,
      role: s3ReplicationRole.arn,
      rule: [
        {
          id: 'primary-to-secondary',
          status: 'Enabled',
          destination: { bucket: secondaryBucket.arn },
        },
      ],
    });

    [primaryBucket, secondaryBucket].forEach((bucket, index) => {
      const provider = index === 0 ? primaryProvider : secondaryProvider;
      new S3BucketPolicy(this, `bucket-policy-${index}`, {
        provider,
        bucket: bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyIncorrectEncryptionHeader',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:PutObject',
              Resource: `${bucket.arn}/*`,
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'AES256',
                },
              },
            },
            {
              Sid: 'DenyUnEncryptedObjectUploads',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:PutObject',
              Resource: `${bucket.arn}/*`,
              Condition: {
                Null: { 's3:x-amz-server-side-encryption': 'true' },
              },
            },
            {
              Sid: 'DenyPublicRead',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `${bucket.arn}/*`,
              Condition: { Bool: { 'aws:SecureTransport': 'false' } },
            },
          ],
        }),
      });
    });

    // Regional Infrastructure Deployment
    const primaryInfra = this.createRegionalInfrastructure(
      'primary',
      primaryProvider,
      'us-east-1',
      '10.1.0.0/16',
      randomSuffix,
      callerIdentity.accountId
    );
    const secondaryInfra = this.createRegionalInfrastructure(
      'secondary',
      secondaryProvider,
      'eu-west-1',
      '10.2.0.0/16',
      randomSuffix,
      callerIdentity.accountId
    );

    // Global Failover with Route 53
    const zone = new Route53Zone(this, 'dns-zone', {
      provider: primaryProvider,
      name: `my-resilient-app-${randomSuffix}.com`,
    });

    const healthCheck = new Route53HealthCheck(this, 'primary-health-check', {
      provider: primaryProvider,
      fqdn: primaryInfra.alb.dnsName,
      port: 80,
      type: 'HTTP',
      failureThreshold: 3,
      requestInterval: 30,
    });

    new Route53Record(this, 'primary-record', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: 'A',
      alias: {
        name: primaryInfra.alb.dnsName,
        zoneId: primaryInfra.alb.zoneId,
        evaluateTargetHealth: true,
      },
      failoverRoutingPolicy: { type: 'PRIMARY' },
      setIdentifier: 'primary-site',
      healthCheckId: healthCheck.id,
    });

    new Route53Record(this, 'secondary-record', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: 'A',
      alias: {
        name: secondaryInfra.alb.dnsName,
        zoneId: secondaryInfra.alb.zoneId,
        evaluateTargetHealth: false,
      },
      failoverRoutingPolicy: { type: 'SECONDARY' },
      setIdentifier: 'secondary-site',
    });

    // SNS Notifications for Alarms
    const alarmTopic = new SnsTopic(this, 'alarm-topic', {
      provider: primaryProvider,
      name: `app-alarms-${randomSuffix}`,
    });

    new CloudwatchMetricAlarm(this, 'primary-alb-latency-alarm', {
      provider: primaryProvider,
      alarmName: `primary-alb-high-latency-${randomSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      dimensions: { LoadBalancer: primaryInfra.alb.arnSuffix },
      alarmActions: [alarmTopic.arn],
    });
  }

  private createRegionalInfrastructure(
    prefix: string,
    provider: AwsProvider,
    region: string,
    vpcCidr: string,
    randomSuffix: string,
    accountId: string
  ): RegionalInfrastructure {
    const availabilityZones = [`${region}a`, `${region}b`];

    // Regional Parameter Store
    new SsmParameter(this, `${prefix}-db-password`, {
      provider,
      // FIX: Add random suffix to parameter name
      name: `/prod/${randomSuffix}/db_password`,
      type: 'SecureString',
      value: 'MustBeChangedInSecretsManager',
    });

    // VPC and Networking
    const vpc = new Vpc(this, `${prefix}-vpc`, {
      provider,
      cidrBlock: vpcCidr,
    });
    const igw = new InternetGateway(this, `${prefix}-igw`, {
      provider,
      vpcId: vpc.id,
    });
    const publicSubnets = availabilityZones.map(
      (zone, i) =>
        new Subnet(this, `${prefix}-public-subnet-${i}`, {
          provider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, i),
          availabilityZone: zone,
        })
    );
    const privateSubnets = availabilityZones.map(
      (zone, i) =>
        new Subnet(this, `${prefix}-private-subnet-${i}`, {
          provider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, i + 100),
          availabilityZone: zone,
        })
    );
    const publicRouteTable = new RouteTable(this, `${prefix}-public-rt`, {
      provider,
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });
    publicSubnets.forEach(
      (subnet, i) =>
        new RouteTableAssociation(this, `${prefix}-public-rta-${i}`, {
          provider,
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        })
    );
    privateSubnets.forEach((subnet, i) => {
      const eip = new Eip(this, `${prefix}-nat-eip-${i}`, {
        provider,
        domain: 'vpc',
      });
      const nat = new NatGateway(this, `${prefix}-nat-gw-${i}`, {
        provider,
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
      });
      const privateRt = new RouteTable(this, `${prefix}-private-rt-${i}`, {
        provider,
        vpcId: vpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: nat.id }],
      });
      new RouteTableAssociation(this, `${prefix}-private-rta-${i}`, {
        provider,
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });
    });

    const albSg = new SecurityGroup(this, `${prefix}-alb-sg`, {
      provider,
      name: `alb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });
    const ec2Sg = new SecurityGroup(this, `${prefix}-ec2-sg`, {
      provider,
      name: `ec2-sg-${randomSuffix}`,
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 8080,
          toPort: 8080,
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    const appLogGroup = new CloudwatchLogGroup(
      this,
      `${prefix}-app-log-group`,
      { provider, name: `/app/web-logs-${randomSuffix}`, retentionInDays: 30 }
    );

    const ec2Role = new IamRole(this, `${prefix}-ec2-role`, {
      provider,
      name: `ec2-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });

    const ec2Policy = new IamPolicy(this, `${prefix}-ec2-policy`, {
      provider,
      name: `ec2-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: `${appLogGroup.arn}:*`,
          },
          {
            Action: 'ssm:GetParameter',
            Effect: 'Allow',
            // FIX: Update policy to match unique parameter path
            Resource: `arn:aws:ssm:${region}:${accountId}:parameter/prod/${randomSuffix}/*`,
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, `${prefix}-ec2-policy-attachment`, {
      provider,
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });
    const instanceProfile = new IamInstanceProfile(
      this,
      `${prefix}-ec2-instance-profile`,
      {
        provider,
        name: `ec2-instance-profile-${randomSuffix}`,
        role: ec2Role.name,
      }
    );

    const alb = new Lb(this, `${prefix}-alb`, {
      provider,
      name: `app-lb-${randomSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: publicSubnets.map(s => s.id),
    });
    const targetGroup = new LbTargetGroup(this, `${prefix}-target-group`, {
      provider,
      name: `app-tg-${randomSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
    });
    new LbListener(this, `${prefix}-listener`, {
      provider,
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
    });

    const ami = new DataAwsAmi(this, `${prefix}-amazon-linux-2`, {
      provider,
      mostRecent: true,
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
      owners: ['amazon'],
    });
    const launchTemplate = new LaunchTemplate(
      this,
      `${prefix}-launch-template`,
      {
        provider,
        name: `app-lt-${randomSuffix}`,
        imageId: ami.id,
        instanceType: 't3.micro',
        iamInstanceProfile: { name: instanceProfile.name },
        vpcSecurityGroupIds: [ec2Sg.id],
      }
    );
    const asg = new AutoscalingGroup(this, `${prefix}-asg`, {
      provider,
      name: `app-asg-${randomSuffix}`,
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      minSize: 2,
      maxSize: 5,
      vpcZoneIdentifier: privateSubnets.map(s => s.id),
      targetGroupArns: [targetGroup.arn],
    });
    new AutoscalingPolicy(this, `${prefix}-scaling-policy`, {
      provider,
      name: `cpu-scaling-policy-${randomSuffix}`,
      autoscalingGroupName: asg.name,
      policyType: 'TargetTrackingScaling',
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
        targetValue: 50.0,
      },
    });

    return { alb };
  }
}
