/**
 * Main TapStack component that orchestrates all infrastructure components
 * for the SecureApp project with enterprise-level security practices.
 */
import * as pulumi from '@pulumi/pulumi';
import { VPCStack } from './vpc-stack.mjs';
import { S3Stack } from './s3-stack.mjs';
import { RDSStack } from './rds-stack.mjs';
import { EC2Stack } from './ec2-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';
import { SecurityStack } from './security-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args || {}, opts);

    const environmentSuffix = (args && args.environmentSuffix) || 'dev';
    const tags = (args && args.tags) || {};

    // Common tags for all resources
    const commonTags = {
      ...tags,
      Project: 'SecureApp',
      ManagedBy: 'Pulumi',
      Environment: environmentSuffix,
    };

    // 1. Create VPC and networking infrastructure
    const vpcStack = new VPCStack(
      'secureapp-vpc',
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this }
    );

    // 2. Create security and monitoring infrastructure
    const securityStack = new SecurityStack(
      'secureapp-security',
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this }
    );

    // 3. Create S3 bucket with encryption and security features
    const s3Stack = new S3Stack(
      'secureapp-s3',
      {
        environmentSuffix,
        tags: commonTags,
        cloudTrailArn: securityStack.cloudTrailArn,
      },
      { parent: this }
    );

    // 4. Create RDS instance with encryption
    const rdsStack = new RDSStack(
      'secureapp-rds',
      {
        environmentSuffix,
        tags: commonTags,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        vpcSecurityGroupId: vpcStack.defaultSecurityGroupId,
      },
      { parent: this }
    );

    // 5. Create EC2 instances with IAM roles
    const ec2Stack = new EC2Stack(
      'secureapp-ec2',
      {
        environmentSuffix,
        tags: commonTags,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        s3BucketArn: s3Stack.bucketArn,
        rdsEndpoint: rdsStack.rdsEndpoint,
      },
      { parent: this }
    );

    // 6. Create CloudWatch monitoring and alarms
    const monitoringStack = new MonitoringStack(
      'secureapp-monitoring',
      {
        environmentSuffix,
        tags: commonTags,
        ec2InstanceIds: ec2Stack.instanceIds,
        rdsInstanceId: rdsStack.rdsInstanceId,
        s3BucketName: s3Stack.bucketName,
      },
      { parent: this }
    );

    // Export important outputs
    this.vpcId = vpcStack.vpcId;
    this.bucketName = s3Stack.bucketName;
    this.rdsEndpoint = rdsStack.rdsEndpoint;
    this.ec2InstanceIds = ec2Stack.instanceIds;

    this.registerOutputs({
      vpcId: this.vpcId,
      bucketName: this.bucketName,
      rdsEndpoint: this.rdsEndpoint,
      instanceIds: this.ec2InstanceIds,
    });
  }
}
