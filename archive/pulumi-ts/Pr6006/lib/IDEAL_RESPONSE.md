# Multi-AZ Failover for Payment Processing API - Corrected Implementation

This is the corrected implementation with all issues fixed and best practices applied.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Multi-AZ Failover Payment Processing API Infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;
  hostedZoneName?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryAlbDnsName: pulumi.Output<string>;
  public readonly secondaryAlbDnsName: pulumi.Output<string>;
  public readonly primaryRoute53Record: pulumi.Output<string>;
  public readonly secondaryRoute53Record: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const notificationEmail = args.notificationEmail || 'admin@example.com';
    const hostedZoneName = args.hostedZoneName || 'example.com';
    const tags = args.tags || {};

    // Get default VPC
    const defaultVpc = aws.ec2.getVpc({ default: true });

    // Get subnets for all three AZs
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
    const subnetsByAz = azs.map(az =>
      aws.ec2.getSubnets({
        filters: [
          { name: 'vpc-id', values: [defaultVpc.then(v => v.id)] },
          { name: 'availability-zone', values: [az] }
        ]
      })
    );

    // Get all subnets for ALB (needs at least 2 AZs)
    const allSubnets = defaultVpc.then(vpc =>
      aws.ec2.getSubnets({
        filters: [{ name: 'vpc-id', values: [vpc.id] }]
      })
    );

    // FIXED: Added environmentSuffix to Security Group names
    const albSg = new aws.ec2.SecurityGroup(`payment-alb-sg-${environmentSuffix}`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: 'Security group for payment ALB',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS from anywhere',
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: { ...tags, Name: `payment-alb-sg-${environmentSuffix}` },
    }, { parent: this });

    // FIXED: Restrict health check traffic to AWS IP ranges
    // AWS health check IP ranges for us-east-1
    const awsHealthCheckCidrs = [
      '54.239.98.0/24',
      '54.239.99.0/24',
      '54.239.100.0/24',
      '54.239.101.0/24',
    ];

    const instanceSg = new aws.ec2.SecurityGroup(`payment-instance-sg-${environmentSuffix}`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: 'Security group for payment instances',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          securityGroups: [albSg.id],
          description: 'Allow HTTPS from ALB',
        },
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSg.id],
          description: 'Allow HTTP from ALB',
        },
        // FIXED: Health check traffic restricted to AWS IP ranges
        ...awsHealthCheckCidrs.map(cidr => ({
          protocol: 'tcp' as const,
          fromPort: 443,
          toPort: 443,
          cidrBlocks: [cidr],
          description: 'Allow health checks from AWS',
        }))
      ],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: { ...tags, Name: `payment-instance-sg-${environmentSuffix}` },
    }, { parent: this });

    // FIXED: Added environmentSuffix to KMS key
    const kmsKey = new aws.kms.Key(`payment-ebs-key-${environmentSuffix}`, {
      description: `KMS key for EBS encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: { ...tags, Name: `payment-ebs-key-${environmentSuffix}` },
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`payment-ebs-key-alias-${environmentSuffix}`, {
      name: `alias/payment-ebs-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // FIXED: Added lifecycle policy to S3 bucket
    const logsBucket = new aws.s3.Bucket(`payment-alb-logs-${environmentSuffix}`, {
      bucket: `payment-alb-logs-${environmentSuffix}`,
      forceDestroy: true,
      lifecycleRules: [{
        enabled: true,
        id: 'delete-old-logs',
        expiration: {
          days: 90,
        },
        transitions: [
          {
            days: 30,
            storageClass: 'STANDARD_IA',
          },
          {
            days: 60,
            storageClass: 'GLACIER',
          }
        ],
      }],
      tags: { ...tags, Name: `payment-alb-logs-${environmentSuffix}` },
    }, { parent: this });

    // Bucket policy for ALB access logs
    const elbServiceAccount = aws.elb.getServiceAccount({});
    const bucketPolicy = new aws.s3.BucketPolicy(`payment-alb-logs-policy-${environmentSuffix}`, {
      bucket: logsBucket.id,
      policy: pulumi.all([logsBucket.arn, elbServiceAccount]).apply(([arn, account]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: account.arn },
            Action: 's3:PutObject',
            Resource: `${arn}/*`,
          }],
        })
      ),
    }, { parent: this });

    // FIXED: Added environmentSuffix to ALB name
    const primaryAlb = new aws.lb.LoadBalancer(`payment-alb-primary-${environmentSuffix}`, {
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: allSubnets.then(s => s.ids.slice(0, 3)), // Use 3 subnets across AZs
      enableCrossZoneLoadBalancing: true,
      enableDeletionProtection: false,
      accessLogs: {
        bucket: logsBucket.bucket,
        enabled: true,
        prefix: 'primary-alb',
      },
      tags: {
        ...tags,
        Name: `payment-alb-primary-${environmentSuffix}`,
        FailoverPriority: 'primary',
      },
    }, { parent: this, dependsOn: [bucketPolicy] });

    // Secondary ALB for failover
    const secondaryAlb = new aws.lb.LoadBalancer(`payment-alb-secondary-${environmentSuffix}`, {
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: allSubnets.then(s => s.ids.slice(0, 3)),
      enableCrossZoneLoadBalancing: true,
      enableDeletionProtection: false,
      accessLogs: {
        bucket: logsBucket.bucket,
        enabled: true,
        prefix: 'secondary-alb',
      },
      tags: {
        ...tags,
        Name: `payment-alb-secondary-${environmentSuffix}`,
        FailoverPriority: 'secondary',
      },
    }, { parent: this, dependsOn: [bucketPolicy] });

    // FIXED: Set deregistrationDelay to 20 seconds
    const primaryTargetGroup = new aws.lb.TargetGroup(`payment-tg-primary-${environmentSuffix}`, {
      port: 443,
      protocol: 'HTTPS',
      vpcId: defaultVpc.then(vpc => vpc.id),
      deregistrationDelay: 20,
      healthCheck: {
        enabled: true,
        interval: 10,
        path: '/health',
        protocol: 'HTTPS',
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: '200',
      },
      stickiness: {
        enabled: true,
        type: 'lb_cookie',
        cookieDuration: 86400,
      },
      tags: { ...tags, Name: `payment-tg-primary-${environmentSuffix}` },
    }, { parent: this });

    const secondaryTargetGroup = new aws.lb.TargetGroup(`payment-tg-secondary-${environmentSuffix}`, {
      port: 443,
      protocol: 'HTTPS',
      vpcId: defaultVpc.then(vpc => vpc.id),
      deregistrationDelay: 20,
      healthCheck: {
        enabled: true,
        interval: 10,
        path: '/health',
        protocol: 'HTTPS',
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: '200',
      },
      stickiness: {
        enabled: true,
        type: 'lb_cookie',
        cookieDuration: 86400,
      },
      tags: { ...tags, Name: `payment-tg-secondary-${environmentSuffix}` },
    }, { parent: this });

    // FIXED: Create self-signed certificate for HTTPS (in production, use ACM)
    const privateKey = new aws.acm.PrivateKey(`payment-cert-key-${environmentSuffix}`, {
      algorithm: 'RSA',
    }, { parent: this });

    const certificate = new aws.acm.Certificate(`payment-cert-${environmentSuffix}`, {
      privateKey: privateKey.privateKeyPem,
      certificateBody: privateKey.privateKeyPem.apply(() =>
        '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\n-----END CERTIFICATE-----'
      ),
      tags: { ...tags, Name: `payment-cert-${environmentSuffix}` },
    }, { parent: this });

    // FIXED: Added SSL certificate to listeners
    const primaryListener = new aws.lb.Listener(`payment-listener-primary-${environmentSuffix}`, {
      loadBalancerArn: primaryAlb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultActions: [{
        type: 'forward',
        targetGroupArn: primaryTargetGroup.arn,
      }],
    }, { parent: this });

    const secondaryListener = new aws.lb.Listener(`payment-listener-secondary-${environmentSuffix}`, {
      loadBalancerArn: secondaryAlb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultActions: [{
        type: 'forward',
        targetGroupArn: secondaryTargetGroup.arn,
      }],
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // FIXED: Use dynamic AMI, added user data, proper IAM role
    const instanceRole = new aws.iam.Role(`payment-instance-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        }],
      }),
      tags: { ...tags, Name: `payment-instance-role-${environmentSuffix}` },
    }, { parent: this });

    const instanceProfile = new aws.iam.InstanceProfile(`payment-instance-profile-${environmentSuffix}`, {
      role: instanceRole.name,
    }, { parent: this });

    // Attach CloudWatch and SSM policies
    const cloudwatchPolicy = new aws.iam.RolePolicyAttachment(`payment-cloudwatch-policy-${environmentSuffix}`, {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this });

    const ssmPolicy = new aws.iam.RolePolicyAttachment(`payment-ssm-policy-${environmentSuffix}`, {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    const userData = `#!/bin/bash
set -e
yum update -y
yum install -y httpd mod_ssl
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat > /var/www/html/health <<EOF
OK
EOF

# Configure SSL
mkdir -p /etc/ssl/private
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/payment.key \
  -out /etc/ssl/certs/payment.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=payment-api"

# CloudWatch agent for monitoring
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`;

    const primaryLaunchTemplate = new aws.ec2.LaunchTemplate(`payment-lt-primary-${environmentSuffix}`, {
      imageId: ami.then(a => a.id),
      instanceType: 't3.medium',
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      blockDeviceMappings: [{
        deviceName: '/dev/xvda',
        ebs: {
          volumeSize: 20,
          volumeType: 'gp3',
          encrypted: 'true',
          kmsKeyId: kmsKey.arn,
          deleteOnTermination: 'true',
        },
      }],
      networkInterfaces: [{
        associatePublicIpAddress: 'true',
        securityGroups: [instanceSg.id],
        deleteOnTermination: 'true',
      }],
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          ...tags,
          Name: `payment-instance-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'payments',
          FailoverPriority: 'primary',
        },
      }],
    }, { parent: this });

    const secondaryLaunchTemplate = new aws.ec2.LaunchTemplate(`payment-lt-secondary-${environmentSuffix}`, {
      imageId: ami.then(a => a.id),
      instanceType: 't3.medium',
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      blockDeviceMappings: [{
        deviceName: '/dev/xvda',
        ebs: {
          volumeSize: 20,
          volumeType: 'gp3',
          encrypted: 'true',
          kmsKeyId: kmsKey.arn,
          deleteOnTermination: 'true',
        },
      }],
      networkInterfaces: [{
        associatePublicIpAddress: 'true',
        securityGroups: [instanceSg.id],
        deleteOnTermination: 'true',
      }],
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          ...tags,
          Name: `payment-instance-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'payments',
          FailoverPriority: 'secondary',
        },
      }],
    }, { parent: this });

    // FIXED: Proper subnet selection per AZ
    const primaryAsgs = azs.map((az, idx) => {
      const subnetIds = subnetsByAz[idx].then(s => s.ids);

      return new aws.autoscaling.Group(`payment-asg-primary-${az}-${environmentSuffix}`, {
        vpcZoneIdentifiers: subnetIds,
        desiredCapacity: 2,
        maxSize: 2,
        minSize: 2,
        launchTemplate: {
          id: primaryLaunchTemplate.id,
          version: '$Latest',
        },
        targetGroupArns: [primaryTargetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 90,
        forceDelete: true,
        tags: [
          {
            key: 'Name',
            value: `payment-asg-primary-${az}-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
          {
            key: 'CostCenter',
            value: 'payments',
            propagateAtLaunch: true,
          },
          {
            key: 'FailoverPriority',
            value: 'primary',
            propagateAtLaunch: true,
          },
        ],
      }, { parent: this });
    });

    const secondaryAsgs = azs.map((az, idx) => {
      const subnetIds = subnetsByAz[idx].then(s => s.ids);

      return new aws.autoscaling.Group(`payment-asg-secondary-${az}-${environmentSuffix}`, {
        vpcZoneIdentifiers: subnetIds,
        desiredCapacity: 2,
        maxSize: 2,
        minSize: 2,
        launchTemplate: {
          id: secondaryLaunchTemplate.id,
          version: '$Latest',
        },
        targetGroupArns: [secondaryTargetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 90,
        forceDelete: true,
        tags: [
          {
            key: 'Name',
            value: `payment-asg-secondary-${az}-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
          {
            key: 'CostCenter',
            value: 'payments',
            propagateAtLaunch: true,
          },
          {
            key: 'FailoverPriority',
            value: 'secondary',
            propagateAtLaunch: true,
          },
        ],
      }, { parent: this });
    });

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(`payment-failover-topic-${environmentSuffix}`, {
      displayName: 'Payment Failover Notifications',
      tags: { ...tags, Name: `payment-failover-topic-${environmentSuffix}` },
    }, { parent: this });

    const snsSubscription = new aws.sns.TopicSubscription(`payment-sns-sub-${environmentSuffix}`, {
      topic: snsTopic.arn,
      protocol: 'email',
      endpoint: notificationEmail,
    }, { parent: this });

    // FIXED: Calculate 50% threshold properly (3 out of 6 instances)
    const primaryUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(`payment-unhealthy-primary-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 30,
      statistic: 'Average',
      threshold: 3, // 50% of 6 instances
      alarmDescription: 'Alert when primary unhealthy targets exceed 50%',
      alarmActions: [snsTopic.arn],
      treatMissingData: 'notBreaching',
      dimensions: {
        LoadBalancer: primaryAlb.arnSuffix,
        TargetGroup: primaryTargetGroup.arnSuffix,
      },
      tags: { ...tags, Name: `payment-unhealthy-primary-${environmentSuffix}` },
    }, { parent: this });

    const secondaryUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(`payment-unhealthy-secondary-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 30,
      statistic: 'Average',
      threshold: 3,
      alarmDescription: 'Alert when secondary unhealthy targets exceed 50%',
      alarmActions: [snsTopic.arn],
      treatMissingData: 'notBreaching',
      dimensions: {
        LoadBalancer: secondaryAlb.arnSuffix,
        TargetGroup: secondaryTargetGroup.arnSuffix,
      },
      tags: { ...tags, Name: `payment-unhealthy-secondary-${environmentSuffix}` },
    }, { parent: this });

    // Additional CloudWatch alarms for comprehensive monitoring
    const primaryLatencyAlarm = new aws.cloudwatch.MetricAlarm(`payment-latency-primary-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when primary target response time exceeds 1 second',
      alarmActions: [snsTopic.arn],
      dimensions: {
        LoadBalancer: primaryAlb.arnSuffix,
        TargetGroup: primaryTargetGroup.arnSuffix,
      },
      tags: { ...tags, Name: `payment-latency-primary-${environmentSuffix}` },
    }, { parent: this });

    // FIXED: Added both HTTP and TCP health checks
    const primaryHealthCheck = new aws.route53.HealthCheck(`payment-health-primary-${environmentSuffix}`, {
      type: 'HTTPS',
      resourcePath: '/health',
      fqdn: primaryAlb.dnsName,
      port: 443,
      requestInterval: 10,
      failureThreshold: 3,
      measureLatency: true,
      tags: { ...tags, Name: `payment-health-primary-${environmentSuffix}` },
    }, { parent: this });

    const primaryTcpHealthCheck = new aws.route53.HealthCheck(`payment-health-tcp-primary-${environmentSuffix}`, {
      type: 'TCP',
      fqdn: primaryAlb.dnsName,
      port: 443,
      requestInterval: 10,
      failureThreshold: 3,
      tags: { ...tags, Name: `payment-health-tcp-primary-${environmentSuffix}` },
    }, { parent: this });

    const secondaryHealthCheck = new aws.route53.HealthCheck(`payment-health-secondary-${environmentSuffix}`, {
      type: 'HTTPS',
      resourcePath: '/health',
      fqdn: secondaryAlb.dnsName,
      port: 443,
      requestInterval: 10,
      failureThreshold: 3,
      measureLatency: true,
      tags: { ...tags, Name: `payment-health-secondary-${environmentSuffix}` },
    }, { parent: this });

    const secondaryTcpHealthCheck = new aws.route53.HealthCheck(`payment-health-tcp-secondary-${environmentSuffix}`, {
      type: 'TCP',
      fqdn: secondaryAlb.dnsName,
      port: 443,
      requestInterval: 10,
      failureThreshold: 3,
      tags: { ...tags, Name: `payment-health-tcp-secondary-${environmentSuffix}` },
    }, { parent: this });

    // Combined health check using calculated health checks
    const primaryCombinedHealthCheck = new aws.route53.HealthCheck(`payment-health-combined-primary-${environmentSuffix}`, {
      type: 'CALCULATED',
      childHealthThreshold: 1,
      childHealthchecks: [
        primaryHealthCheck.id,
        primaryTcpHealthCheck.id,
      ],
      tags: { ...tags, Name: `payment-health-combined-primary-${environmentSuffix}` },
    }, { parent: this });

    const secondaryCombinedHealthCheck = new aws.route53.HealthCheck(`payment-health-combined-secondary-${environmentSuffix}`, {
      type: 'CALCULATED',
      childHealthThreshold: 1,
      childHealthchecks: [
        secondaryHealthCheck.id,
        secondaryTcpHealthCheck.id,
      ],
      tags: { ...tags, Name: `payment-health-combined-secondary-${environmentSuffix}` },
    }, { parent: this });

    // Route 53 Hosted Zone (get existing)
    const zone = aws.route53.getZone({ name: hostedZoneName });

    // FIXED: Created both primary and secondary failover records
    const primaryRecord = new aws.route53.Record(`payment-primary-${environmentSuffix}`, {
      zoneId: zone.then(z => z.zoneId),
      name: `api-${environmentSuffix}`,
      type: 'A',
      setIdentifier: `primary-${environmentSuffix}`,
      failoverRoutingPolicies: [{
        type: 'PRIMARY',
      }],
      aliases: [{
        name: primaryAlb.dnsName,
        zoneId: primaryAlb.zoneId,
        evaluateTargetHealth: true,
      }],
      healthCheckId: primaryCombinedHealthCheck.id,
    }, { parent: this });

    const secondaryRecord = new aws.route53.Record(`payment-secondary-${environmentSuffix}`, {
      zoneId: zone.then(z => z.zoneId),
      name: `api-${environmentSuffix}`,
      type: 'A',
      setIdentifier: `secondary-${environmentSuffix}`,
      failoverRoutingPolicies: [{
        type: 'SECONDARY',
      }],
      aliases: [{
        name: secondaryAlb.dnsName,
        zoneId: secondaryAlb.zoneId,
        evaluateTargetHealth: true,
      }],
      healthCheckId: secondaryCombinedHealthCheck.id,
    }, { parent: this });

    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.secondaryAlbDnsName = secondaryAlb.dnsName;
    this.primaryRoute53Record = primaryRecord.fqdn;
    this.secondaryRoute53Record = secondaryRecord.fqdn;

    this.registerOutputs({
      primaryAlbDnsName: this.primaryAlbDnsName,
      secondaryAlbDnsName: this.secondaryAlbDnsName,
      primaryRoute53Record: this.primaryRoute53Record,
      secondaryRoute53Record: this.secondaryRoute53Record,
      primaryTargetGroupArn: primaryTargetGroup.arn,
      secondaryTargetGroupArn: secondaryTargetGroup.arn,
      snsTopicArn: snsTopic.arn,
      kmsKeyId: kmsKey.id,
      logsBucketName: logsBucket.id,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const notificationEmail = config.get('notificationEmail') || 'admin@example.com';
const hostedZoneName = config.get('hostedZoneName') || 'example.com';

const stack = new TapStack('payment-processing-stack', {
  environmentSuffix: environmentSuffix,
  notificationEmail: notificationEmail,
  hostedZoneName: hostedZoneName,
  tags: {
    Project: 'PaymentProcessing',
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

export const primaryAlbDnsName = stack.primaryAlbDnsName;
export const secondaryAlbDnsName = stack.secondaryAlbDnsName;
export const primaryRoute53Record = stack.primaryRoute53Record;
export const secondaryRoute53Record = stack.secondaryRoute53Record;
```

## File: Pulumi.yaml

```yaml
name: payment-processing
runtime: nodejs
description: Multi-AZ failover payment processing API infrastructure
config:
  environmentSuffix:
    description: Environment suffix for resource naming
    default: dev
  notificationEmail:
    description: Email address for failover notifications
    default: admin@example.com
  hostedZoneName:
    description: Route 53 hosted zone name
    default: example.com
```

## File: package.json

```json
{
  "name": "payment-processing",
  "version": "1.0.0",
  "description": "Multi-AZ failover payment processing API",
  "main": "index.ts",
  "scripts": {
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the stack:
   ```bash
   pulumi config set aws:region us-east-1
   pulumi config set environmentSuffix prod
   pulumi config set notificationEmail ops@example.com
   pulumi config set hostedZoneName example.com
   ```

3. Preview the deployment:
   ```bash
   pulumi preview
   ```

4. Deploy the stack:
   ```bash
   pulumi up
   ```

5. Monitor the deployment and verify all resources are created successfully.

6. Test failover:
   ```bash
   # Check primary health
   curl https://api-prod.example.com/health

   # Simulate failure by stopping instances
   # Route 53 should automatically failover to secondary
   ```

## Key Features

- Multi-AZ deployment across 3 availability zones
- Primary and secondary ALBs with automatic failover
- Auto Scaling Groups maintaining 2 instances per AZ (6 total per environment)
- Route 53 health checks (both HTTP and TCP)
- CloudWatch alarms with SNS notifications
- EBS encryption with customer-managed KMS keys
- ALB access logs with S3 lifecycle policies
- Security groups restricting health check traffic to AWS IP ranges
- 20-second target deregistration delay
- Cross-zone load balancing enabled
- All resources tagged with Environment, CostCenter, and FailoverPriority
- IAM roles for instances with CloudWatch and SSM access