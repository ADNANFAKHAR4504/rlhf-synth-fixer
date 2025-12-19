### Reasoning Trace

---

The error indicates that Route 53 is trying to look up a hosted zone for "example.com" but can't find one. This is happening because in the code I provided, we're using `route53.HostedZone.fromLookup()` to find an existing hosted zone, but "example.com" doesn't exist in the user's AWS account (it's just a placeholder domain).

There are a few ways to fix this:

1. Remove the Route 53 configuration entirely if they don't have a domain
2. Create the hosted zone in the stack instead of looking it up
3. Make the Route 53 configuration optional
4. Provide better instructions on how to set up with a real domain

I think the best approach is to make the Route 53 configuration optional and provide clear instructions on how to use it with a real domain.

### Answer

---

The error occurs because the code is trying to look up a Route 53 hosted zone for "example.com" which doesn't exist in your AWS account. Here are several ways to fix this:

## Solution 1: Make Route 53 Optional (Recommended)

Update **lib/secure-cloud-stack.ts** to make Route 53 configuration optional:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

interface SecureCloudStackProps extends cdk.StackProps {
  allowedIpRanges: string[];
  domainName?: string; // Make optional
  createHostedZone?: boolean; // Add option to create hosted zone
}

export class SecureCloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureCloudStackProps) {
    super(scope, id, props);

    const { allowedIpRanges, domainName, createHostedZone = false } = props;

    // ... (keep all the existing code until the Route 53 section)

    // Add listener to ALB
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Route 53 configuration (optional)
    if (domainName) {
      try {
        let hostedZone: route53.IHostedZone;

        if (createHostedZone) {
          // Create a new hosted zone
          hostedZone = new route53.HostedZone(this, 'HostedZone', {
            zoneName: domainName,
          });

          new cdk.CfnOutput(this, 'NameServers', {
            value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers!),
            description:
              'Name servers for the hosted zone - update your domain registrar',
          });
        } else {
          // Look up existing hosted zone
          const rootDomain = domainName.split('.').slice(-2).join('.'); // Get root domain
          hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: rootDomain,
          });
        }

        // Create A record pointing to the ALB
        new route53.ARecord(this, 'ALBARecord', {
          zone: hostedZone,
          recordName: domainName,
          target: route53.RecordTarget.fromAlias(
            new route53targets.LoadBalancerTarget(alb)
          ),
        });

        new cdk.CfnOutput(this, 'ApplicationURL', {
          value: `http://${domainName}`,
          description: 'Application URL',
        });
      } catch (error) {
        console.warn(
          `Could not configure Route 53 for domain ${domainName}: ${error}`
        );
        new cdk.CfnOutput(this, 'ApplicationURL', {
          value: `http://${alb.loadBalancerDnsName}`,
          description: 'Application URL (using ALB DNS name)',
        });
      }
    } else {
      new cdk.CfnOutput(this, 'ApplicationURL', {
        value: `http://${alb.loadBalancerDnsName}`,
        description: 'Application URL (using ALB DNS name)',
      });
    }

    // Apply tags to all resources
    const commonTags = props.tags || {};
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Endpoint',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
    });
  }
}
```

## Solution 2: Update the App Entry Point

Update **bin/app.ts** to handle the domain configuration better:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureCloudStack } from '../lib/secure-cloud-stack';

const app = new cdk.App();

// Get configuration from context or environment
const region =
  app.node.tryGetContext('region') || process.env.AWS_REGION || 'us-west-2';
const allowedIpRanges = app.node.tryGetContext('allowedIpRanges') || [
  '10.0.0.0/8',
];
const domainName = app.node.tryGetContext('domainName'); // Don't provide default
const createHostedZone = app.node.tryGetContext('createHostedZone') === 'true';

new SecureCloudStack(app, 'SecureCloudStack', {
  env: {
    region: region,
  },
  allowedIpRanges,
  domainName, // Will be undefined if not provided
  createHostedZone,
  tags: {
    Environment: 'Development',
    Project: 'SecureCloudEnv',
    Owner: 'DevTeam',
    CostCenter: 'Engineering',
  },
});
```

## Solution 3: Update the Test File

Update **test/secure-cloud-stack.test.ts** to handle optional Route 53:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureCloudStack } from '../lib/secure-cloud-stack';

describe('SecureCloudStack', () => {
  let template: Template;
  let templateWithDomain: Template;

  beforeAll(() => {
    const app = new cdk.App();

    // Test stack without domain
    const stack = new SecureCloudStack(app, 'TestStack', {
      allowedIpRanges: ['10.0.0.0/8'],
      tags: {
        Environment: 'Test',
      },
    });
    template = Template.fromStack(stack);

    // Test stack with domain (creates hosted zone)
    const stackWithDomain = new SecureCloudStack(app, 'TestStackWithDomain', {
      allowedIpRanges: ['10.0.0.0/8'],
      domainName: 'test.example.com',
      createHostedZone: true,
      tags: {
        Environment: 'Test',
      },
    });
    templateWithDomain = Template.fromStack(stackWithDomain);
  });

  // ... (keep existing tests)

  test('Route 53 A record is created when domain is provided', () => {
    templateWithDomain.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'test.example.com.',
      Type: 'A',
    });
  });

  test('Route 53 hosted zone is created when createHostedZone is true', () => {
    templateWithDomain.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'test.example.com.',
    });
  });

  test('No Route 53 resources when domain is not provided', () => {
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
    template.resourceCountIs('AWS::Route53::HostedZone', 0);
  });

  // ... (keep other existing tests)
});
```

## Deployment Options

Now you can deploy in several ways:

### Option 1: Deploy without custom domain (simplest)

```bash
cdk deploy --context allowedIpRanges="10.0.0.0/8"
```

### Option 2: Deploy with existing domain (you must own the domain in Route 53)

```bash
cdk deploy --context allowedIpRanges="10.0.0.0/8" --context domainName="yourdomain.com"
```

### Option 3: Deploy and create a new hosted zone

```bash
cdk deploy --context allowedIpRanges="10.0.0.0/8" --context domainName="yourdomain.com" --context createHostedZone="true"
```

## Updated README Section

Add this to your **README.md**:

````markdown
## Domain Configuration

### Without Custom Domain (Default)

The stack will work without a custom domain, using the ALB's DNS name:

```bash
cdk deploy
```
````

### With Existing Route 53 Domain

If you have a domain already configured in Route 53:

```bash
cdk deploy --context domainName="yourdomain.com"
```

### Create New Hosted Zone

To create a new hosted zone for your domain:

```bash
cdk deploy --context domainName="yourdomain.com" --context createHostedZone="true"
```

After deployment with `createHostedZone=true`, update your domain registrar's name servers with the ones shown in the stack outputs.

```

This solution makes the Route 53 configuration optional and provides flexibility for different deployment scenarios. The stack will work without a domain and use the ALB's DNS name for access.
```
