/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource for the web application infrastructure.
 * Orchestrates all components including VPC, ALB, Auto Scaling, S3, and CloudWatch.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack.mjs';
import { ComputeStack } from './compute-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args = {}, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create networking infrastructure (VPC, subnets, security groups, ALB)
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create compute infrastructure (Auto Scaling Group, Launch Template, EC2 instances)
    const compute = new ComputeStack(
      'compute',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        vpc: networking.vpc,
        privateSubnets: networking.privateSubnets,
        publicSubnets: networking.publicSubnets,
        albSecurityGroup: networking.albSecurityGroup,
        instanceSecurityGroup: networking.instanceSecurityGroup,
        targetGroup: networking.targetGroup,
      },
      { parent: this }
    );

    // Create storage infrastructure (S3 bucket for static content)
    const storage = new StorageStack(
      'storage',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create monitoring infrastructure (CloudWatch alarms)
    const monitoring = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        autoScalingGroup: compute.autoScalingGroup,
      },
      { parent: this }
    );

    // Expose important outputs
    this.vpcId = networking.vpc.id;
    this.albDnsName = networking.alb.dnsName;
    this.bucketName = storage.bucket.id;
    this.autoScalingGroupName = compute.autoScalingGroup.name;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      bucketName: this.bucketName,
      autoScalingGroupName: this.autoScalingGroupName,
    });
  }
}

