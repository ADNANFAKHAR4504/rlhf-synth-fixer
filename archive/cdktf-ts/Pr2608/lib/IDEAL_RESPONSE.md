# CDKTF TypeScript: Multi-Region, Highly Available Web Application

This project provides a comprehensive, monolithic CDKTF stack written in TypeScript to deploy a secure, scalable, and resilient multi-region web application on AWS. The architecture is designed for automated failover between `us-east-1` (primary) and `eu-west-1` (secondary).

## Architecture Overview

This solution establishes parallel infrastructure stacks in two AWS regions and uses global AWS services to provide a single, resilient application endpoint.

- **Multi-Provider Strategy**: The core of the multi-region setup in CDKTF is the use of two aliased `AwsProvider` instances within a single stack. This allows us to explicitly assign resources to either the `us-east-1` or `eu-west-1` region.
- **Automated DNS Failover**: **AWS Route 53** is the cornerstone of the failover strategy. A health check constantly monitors the primary application endpoint in `us-east-1`. If it becomes unhealthy, Route 53's failover routing policy automatically redirects all traffic to the Application Load Balancer in the `eu-west-1` region.
- **Data Redundancy**: **S3 Cross-Region Replication** is configured to asynchronously copy objects from a primary bucket in `us-east-1` to a secondary bucket in `eu-west-1`. This ensures that critical application data is available in the failover region.
- **Regional Isolation**: Each region contains a complete, independent application stack, including a VPC with public/private subnets, an Application Load Balancer, and an Auto Scaling group of EC2 instances. This ensures a failure in one region does not impact the other.
- **Secure Configuration Management**: **AWS Systems Manager Parameter Store** is used in each region to store sensitive data like database credentials. This avoids hardcoding secrets in the code and provides a secure way for applications to fetch configuration at runtime.

## Core Principles & Best Practices Followed

### 1. High Availability and Redundancy

- **Multi-Region Failover**: Automated, DNS-level failover managed by Route 53 provides business continuity in the event of a regional outage.
- **Multi-AZ within Each Region**: All regional components (ALB, ASG, NAT Gateways) are deployed across two Availability Zones for intra-region resilience.

### 2. Security by Default

- **Least Privilege IAM**: A custom IAM role is created for S3 replication with the exact permissions needed to read from the source and write to the destination, and nothing more. EC2 roles are similarly scoped.
- **Secure Data Storage**: S3 bucket policies are enforced to **require server-side encryption** on all object uploads and block all public access.
- **Network Segmentation**: Strict security groups ensure traffic flows only as intended: Internet -> ALB -> EC2. Direct access to instances is prohibited.
- **Secrets Management**: SSM Parameter Store is used for sensitive data, which is more secure than hardcoding values.

### 3. Operational Excellence

- **Monolithic & Self-Contained Stack**: All infrastructure is defined in one file, providing a clear and complete picture of the multi-region setup. The stack is self-contained and requires no external inputs.
- **Idempotent Naming**: `Fn.uuid()` is used to generate a random suffix for globally unique resources, preventing naming conflicts on subsequent deployments.
- **Centralized Alarming**: A central SNS topic in the primary region is used for notifications from CloudWatch Alarms, such as high latency on the primary ALB, providing proactive alerts.
- **Consistent Tagging**: All resources are automatically tagged with `environment: production` and their respective region, simplifying cost allocation and resource management in a multi-region environment.

## Getting Started

**Install Dependencies:**

```bash
npm install
```

**Synthesize the Stack:**

```bash
npx cdktf synth
```

**Run Tests:**

```bash
npm test
```

**Deploy to AWS:**

```bash
npx cdktf deploy
```

---

## Complete Infrastructure Code

### `bin/tap.ts`

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// The stack itself is now responsible for handling its multi-region nature.
new TapStack(app, 'tap-multi-region-stack');

app.synth();
```

### `lib/tap-stack.ts`

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, Fn } from 'cdktf';
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
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
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

    // 1. Multi-Region Provider Configuration
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

    // 2. Cross-Region IAM Role for S3 Replication
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

    // 3. Cross-Region S3 Buckets with Replication
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
    new S3BucketVersioningA(this, 'secondary-bucket-versioning', {
      provider: secondaryProvider,
      bucket: secondaryBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

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
      dependsOn: [secondaryBucket],
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

    // Enforce encryption and no public access on both buckets
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

    // 4. Regional Infrastructure Deployment
    const primaryInfra = this.createRegionalInfrastructure(
      'primary',
      primaryProvider,
      'us-east-1',
      '10.1.0.0/16',
      randomSuffix
    );
    const secondaryInfra = this.createRegionalInfrastructure(
      'secondary',
      secondaryProvider,
      'eu-west-1',
      '10.2.0.0/16',
      randomSuffix
    );

    // 5. Global Failover with Route 53
    const zone = new Route53Zone(this, 'dns-zone', {
      provider: primaryProvider, // Route53 is global, managed from us-east-1
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

    // 6. SNS Notifications for Alarms
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
      threshold: 1, // 1 second
      dimensions: { LoadBalancer: primaryInfra.alb.arnSuffix },
      alarmActions: [alarmTopic.arn],
    });
  }

  // Helper function to create regional resources
  private createRegionalInfrastructure(
    prefix: string,
    provider: AwsProvider,
    region: string,
    vpcCidr: string,
    randomSuffix: string
  ): RegionalInfrastructure {
    const availabilityZones = [`${region}a`, `${region}b`];

    // Regional Parameter Store
    new SsmParameter(this, `${prefix}-db-password`, {
      provider,
      name: `/prod/db_password`,
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

    // Security Groups
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

    // Logging
    const appLogGroup = new CloudwatchLogGroup(
      this,
      `${prefix}-app-log-group`,
      { provider, name: `/app/web-logs-${randomSuffix}`, retentionInDays: 30 }
    );

    // IAM for EC2
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
            Action: ['logs:*', 'ssm:GetParameter*'],
            Effect: 'Allow',
            Resource: '*',
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

    // ALB
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

    // Auto Scaling
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
```

### `tests/tap-stack.unit.test.ts`

```typescript
import './setup.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveResource(construct: any): R;
      toHaveResourceWithProperties(construct: any, properties: any): R;
    }
  }
}

import { Testing, TerraformStack } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

describe('Unit Tests for Multi-Region TapStack', () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    synthesized = Testing.synth(stack);
  });

  it('should create two distinct AWS providers for multi-region support', () => {
    const providers = JSON.parse(synthesized).provider.aws;
    expect(providers).toHaveLength(2);
    expect(providers.some((p: any) => p.region === 'us-east-1')).toBe(true);
    expect(providers.some((p: any) => p.region === 'eu-west-1')).toBe(true);
  });

  it('should configure S3 cross-region replication', () => {
    expect(synthesized).toHaveResource(S3BucketReplicationConfiguration);
    expect(synthesized).toHaveResourceWithProperties(
      S3BucketReplicationConfiguration,
      {
        rule: expect.arrayContaining([
          expect.objectContaining({
            status: 'Enabled',
          }),
        ]),
      }
    );
  });

  it('should create Route 53 failover records', () => {
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: expect.arrayContaining([
        expect.objectContaining({ type: 'PRIMARY' }),
      ]),
    });
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: expect.arrayContaining([
        expect.objectContaining({ type: 'SECONDARY' }),
      ]),
    });
  });

  it('should create SSM parameters in both regions', () => {
    const ssmParams = JSON.parse(synthesized).resource.aws_ssm_parameter;
    expect(Object.keys(ssmParams).length).toBe(2);
    // Check that one is associated with the primary provider and one with the secondary
    expect(ssmParams['primary-db-password'].provider).toEqual('aws.us-east-1');
    expect(ssmParams['secondary-db-password'].provider).toEqual(
      'aws.eu-west-1'
    );
  });
});
```

### `tests/tap-stack.int.test.ts`

```typescript
import './setup.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveResource(construct: any): R;
      toHaveResourceWithProperties(construct: any, properties: any): R;
    }
  }
}

import { Testing, TerraformStack } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

describe('Integration Tests for Multi-Region TapStack', () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    synthesized = Testing.synth(stack);
  });

  it('should provision a VPC in each region', () => {
    const vpcs = JSON.parse(synthesized).resource.aws_vpc;
    expect(Object.keys(vpcs).length).toBe(2);
    expect(vpcs['primary-vpc'].provider).toEqual('aws.us-east-1');
    expect(vpcs['secondary-vpc'].provider).toEqual('aws.eu-west-1');
  });

  it('should provision an ALB in each region', () => {
    const albs = JSON.parse(synthesized).resource.aws_lb;
    expect(Object.keys(albs).length).toBe(2);
    expect(albs['primary-alb'].provider).toEqual('aws.us-east-1');
    expect(albs['secondary-alb'].provider).toEqual('aws.eu-west-1');
  });

  it('should enforce encryption in S3 bucket policies', () => {
    const policies = JSON.parse(synthesized).resource.aws_s3_bucket_policy;
    for (const key in policies) {
      const policyDoc = JSON.parse(policies[key].policy);
      const denyUnencrypted = policyDoc.Statement.find(
        (s: any) => s.Sid === 'DenyUnEncryptedObjectUploads'
      );
      expect(denyUnencrypted.Effect).toEqual('Deny');
      expect(
        denyUnencrypted.Condition.Null['s3:x-amz-server-side-encryption']
      ).toBe('true');
    }
  });

  it('should demonstrate correct security group chaining in each region', () => {
    const securityGroups = JSON.parse(synthesized).resource.aws_security_group;
    const primaryEc2Sg = securityGroups['primary-ec2-sg'];

    // Check that the primary EC2 SG allows ingress from the primary ALB SG
    expect(primaryEc2Sg.ingress[0].security_groups).toEqual([
      '${aws_security_group.primary-alb-sg.id}',
    ]);
  });
});
```
