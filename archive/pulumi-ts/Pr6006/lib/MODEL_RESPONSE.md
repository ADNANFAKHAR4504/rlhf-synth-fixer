# Multi-AZ Failover for Payment Processing API - Initial Implementation

This implementation provides a multi-AZ failover solution for a payment processing API using Pulumi with TypeScript.

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
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly primaryRoute53Record: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get default VPC
    const defaultVpc = aws.ec2.getVpc({ default: true });

    // Get all subnets in the VPC
    const subnets = defaultVpc.then(vpc =>
      aws.ec2.getSubnets({
        filters: [{ name: "vpc-id", values: [vpc.id] }]
      })
    );

    // Security Group for ALB - ISSUE: Missing environmentSuffix
    const albSg = new aws.ec2.SecurityGroup(`payment-alb-sg`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: "Security group for payment ALB",
      ingress: [{
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
      }],
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: { ...tags, Name: `payment-alb-sg` },
    }, { parent: this });

    // Security Group for EC2 instances - ISSUE: Not restricting health checks to AWS IP ranges
    const instanceSg = new aws.ec2.SecurityGroup(`payment-instance-sg`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: "Security group for payment instances",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          securityGroups: [albSg.id],
        },
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSg.id],
        }
      ],
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: { ...tags, Name: `payment-instance-sg` },
    }, { parent: this });

    // KMS Key for EBS encryption - ISSUE: Missing environmentSuffix
    const kmsKey = new aws.kms.Key(`payment-ebs-key`, {
      description: "KMS key for EBS encryption",
      enableKeyRotation: true,
      tags: { ...tags, Name: `payment-ebs-key` },
    }, { parent: this });

    // S3 Bucket for ALB logs - ISSUE: Missing lifecycle policy
    const logsBucket = new aws.s3.Bucket(`payment-alb-logs`, {
      bucket: `payment-alb-logs-${environmentSuffix}`,
      forceDestroy: true,
      tags: { ...tags, Name: `payment-alb-logs` },
    }, { parent: this });

    // ALB - ISSUE: Missing environmentSuffix in name
    const alb = new aws.lb.LoadBalancer(`payment-alb`, {
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSg.id],
      subnets: subnets.then(s => s.ids),
      enableCrossZoneLoadBalancing: true,
      accessLogs: {
        bucket: logsBucket.bucket,
        enabled: true,
      },
      tags: { ...tags, Name: `payment-alb` },
    }, { parent: this });

    // Target Group - ISSUE: deregistrationDelay is 30 seconds, should be 20
    const targetGroup = new aws.lb.TargetGroup(`payment-tg`, {
      port: 443,
      protocol: "HTTPS",
      vpcId: defaultVpc.then(vpc => vpc.id),
      deregistrationDelay: 30,
      healthCheck: {
        enabled: true,
        interval: 10,
        path: "/health",
        protocol: "HTTPS",
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: { ...tags, Name: `payment-tg` },
    }, { parent: this });

    // ALB Listener - ISSUE: No SSL certificate configured
    const listener = new aws.lb.Listener(`payment-listener`, {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: "HTTPS",
      defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
      }],
    }, { parent: this });

    // Launch Template - ISSUE: Hardcoded AMI, no user data, wrong KMS key reference
    const launchTemplate = new aws.ec2.LaunchTemplate(`payment-lt`, {
      imageId: "ami-0c55b159cbfafe1f0",
      instanceType: "t3.medium",
      keyName: "payment-key",
      blockDeviceMappings: [{
        deviceName: "/dev/xvda",
        ebs: {
          volumeSize: 20,
          volumeType: "gp3",
          encrypted: "true",
          kmsKeyId: kmsKey.arn,
        },
      }],
      networkInterfaces: [{
        associatePublicIpAddress: "true",
        securityGroups: [instanceSg.id],
      }],
      tagSpecifications: [{
        resourceType: "instance",
        tags: {
          ...tags,
          Name: `payment-instance`,
          Environment: environmentSuffix,
          CostCenter: "payments",
          FailoverPriority: "high",
        },
      }],
    }, { parent: this });

    // Auto Scaling Groups for each AZ - ISSUE: No proper subnet selection per AZ
    const azs = ["us-east-1a", "us-east-1b", "us-east-1c"];
    const asgs = azs.map((az, idx) => {
      const asg = new aws.autoscaling.Group(`payment-asg-${idx}`, {
        availabilityZones: [az],
        desiredCapacity: 2,
        maxSize: 2,
        minSize: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: "$Latest",
        },
        targetGroupArns: [targetGroup.arn],
        healthCheckType: "ELB",
        healthCheckGracePeriod: 90,
        tags: [{
          key: "Name",
          value: `payment-asg-${az}`,
          propagateAtLaunch: true,
        }],
      }, { parent: this });

      return asg;
    });

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(`payment-failover-topic`, {
      displayName: "Payment Failover Notifications",
      tags: { ...tags, Name: `payment-failover-topic` },
    }, { parent: this });

    // SNS Email Subscription
    const snsSubscription = new aws.sns.TopicSubscription(`payment-sns-sub`, {
      topic: snsTopic.arn,
      protocol: "email",
      endpoint: "admin@example.com",
    }, { parent: this });

    // CloudWatch Alarm - ISSUE: Threshold calculation wrong (should be percentage)
    const alarm = new aws.cloudwatch.MetricAlarm(`payment-unhealthy-alarm`, {
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "UnHealthyHostCount",
      namespace: "AWS/ApplicationELB",
      period: 60,
      statistic: "Average",
      threshold: 3,
      alarmDescription: "Alert when unhealthy targets exceed threshold",
      alarmActions: [snsTopic.arn],
      dimensions: {
        LoadBalancer: alb.arnSuffix,
        TargetGroup: targetGroup.arnSuffix,
      },
    }, { parent: this });

    // Route 53 Health Check - ISSUE: Missing TCP connectivity check
    const healthCheck = new aws.route53.HealthCheck(`payment-health-check`, {
      type: "HTTPS",
      resourcePath: "/health",
      fqdn: alb.dnsName,
      port: 443,
      requestInterval: 10,
      failureThreshold: 3,
      tags: { ...tags, Name: `payment-health-check` },
    }, { parent: this });

    // Route 53 Hosted Zone (assuming it exists)
    const zone = aws.route53.getZone({ name: "example.com" });

    // Primary Route 53 Record - ISSUE: No secondary failover record created
    const primaryRecord = new aws.route53.Record(`payment-primary`, {
      zoneId: zone.then(z => z.zoneId),
      name: "api",
      type: "A",
      setIdentifier: "primary",
      failoverRoutingPolicies: [{
        type: "PRIMARY",
      }],
      aliases: [{
        name: alb.dnsName,
        zoneId: alb.zoneId,
        evaluateTargetHealth: true,
      }],
      healthCheckId: healthCheck.id,
    }, { parent: this });

    this.albDnsName = alb.dnsName;
    this.primaryRoute53Record = primaryRecord.fqdn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      primaryRoute53Record: this.primaryRoute53Record,
      targetGroupArn: targetGroup.arn,
      snsTopicArn: snsTopic.arn,
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

const stack = new TapStack('payment-processing-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'PaymentProcessing',
    ManagedBy: 'Pulumi',
  },
});

export const albDnsName = stack.albDnsName;
export const primaryRoute53Record = stack.primaryRoute53Record;
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install @pulumi/pulumi @pulumi/aws
   ```

2. Configure AWS region:
   ```bash
   pulumi config set aws:region us-east-1
   ```

3. Deploy the stack:
   ```bash
   pulumi up
   ```

4. Monitor the deployment and verify all resources are created successfully.

## Notes

- The implementation uses the default VPC for simplicity
- Route 53 requires an existing hosted zone
- Email subscription needs manual confirmation
- Health checks monitor the ALB endpoint
- All instances are encrypted with customer-managed KMS keys