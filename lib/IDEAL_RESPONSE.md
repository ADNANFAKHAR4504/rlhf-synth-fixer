# Pulumi TypeScript Infrastructure Code - Production-Ready Solution

## Overview
Complete Pulumi TypeScript infrastructure for a media company's web application supporting 4,000 daily viewers in us-east-2 region.

## lib/tap-stack.ts

```typescript
/**
 * Main Pulumi stack for TAP (Test Automation Platform) infrastructure.
 * Orchestrates all sub-stacks and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { AlbStack } from './alb-stack';
import { Ec2Stack } from './ec2-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC and networking resources
    const vpcStack = new VpcStack('tap-vpc', {
      environmentSuffix: environmentSuffix,
      vpcCidr: '10.5.0.0/16',
      tags: tags,
    }, { parent: this });

    // Create S3 bucket for static assets
    const s3Stack = new S3Stack('tap-s3', {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create EC2 Auto Scaling resources
    const ec2Stack = new Ec2Stack('tap-ec2', {
      environmentSuffix: environmentSuffix,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      tags: tags,
    }, { parent: this });

    // Create Application Load Balancer
    const albStack = new AlbStack('tap-alb', {
      environmentSuffix: environmentSuffix,
      vpcId: vpcStack.vpcId,
      publicSubnetIds: vpcStack.publicSubnetIds,
      targetGroupArn: ec2Stack.targetGroupArn,
      tags: tags,
    }, { parent: this });

    // Create CloudWatch monitoring
    const cloudWatchStack = new CloudWatchStack('tap-monitoring', {
      environmentSuffix: environmentSuffix,
      autoScalingGroupName: ec2Stack.autoScalingGroupName,
      targetGroupArn: ec2Stack.targetGroupArn,
      albArn: albStack.albArn,
      tags: tags,
    }, { parent: this });

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.albDns = albStack.albDns;
    this.bucketName = s3Stack.bucketName;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDns: this.albDns,
      bucketName: this.bucketName,
    });
  }
}
```

## Key Infrastructure Components

### 1. VPC Configuration (vpc-stack.ts)
- VPC with CIDR block 10.5.0.0/16
- Public and private subnets across 2 availability zones
- NAT Gateways for private subnet internet access
- VPC Flow Logs for security monitoring
- Proper route table configuration

### 2. EC2 Auto Scaling (ec2-stack.ts)
- Auto Scaling Group with min 2, max 6 instances
- t3.micro instances for cost optimization
- Launch template with user data for nginx setup
- IAM roles with SSM and CloudWatch permissions
- Security groups restricting access appropriately
- Target group with health checks

### 3. Application Load Balancer (alb-stack.ts)
- Internet-facing ALB in public subnets
- HTTP listener on port 80
- Security group allowing HTTP traffic
- Access logs stored in S3
- Cross-zone load balancing enabled
- HTTP/2 support enabled

### 4. S3 Static Assets (s3-stack.ts)
- S3 bucket with versioning enabled
- Lifecycle policies for cost optimization
- Server-side encryption with AES256
- Public access blocked
- Bucket policy for CloudFront/ALB access
- CORS configuration for web access

### 5. CloudWatch Monitoring (cloudwatch-stack.ts)
- CPU utilization alarms (threshold: 80%)
- Target health monitoring
- ALB request count and latency alarms
- SNS topic for alarm notifications
- CloudWatch dashboard for visualization
- All metrics configured for us-east-2

## Production-Ready Features

### Security
- Least privilege IAM roles
- Security groups with minimal access
- VPC flow logs enabled
- S3 encryption at rest
- Public access blocked on S3
- SSH restricted to corporate network

### High Availability
- Multi-AZ deployment
- Auto Scaling for traffic fluctuations
- Health checks at multiple levels
- NAT Gateway redundancy

### Monitoring & Observability
- CloudWatch dashboards
- Multiple alarm types
- SNS notifications
- CloudWatch agent on EC2
- ALB access logs

### Cost Optimization
- t3.micro instances
- S3 lifecycle policies
- Appropriate retention periods
- Auto Scaling to match demand

### Operational Excellence
- Infrastructure as Code
- Proper tagging strategy
- Environment suffix for multi-env support
- Force destroy flags for clean teardown
- Component-based architecture

## Deployment Notes

All resources include:
- Environment suffix to prevent conflicts
- Proper tagging for cost allocation
- Delete before replace policies where needed
- Dependency management between stacks
- Output values for integration testing