import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MigrationVpcStack } from './migration-vpc-stack';
import { MigrationStorageStack } from './migration-storage-stack';
import { MigrationComputeStack } from './migration-compute-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC infrastructure stack
    const vpcStack = new MigrationVpcStack(this, 'MigrationVpcStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create storage infrastructure stack
    const storageStack = new MigrationStorageStack(
      this,
      'MigrationStorageStack',
      {
        environmentSuffix,
        env: props?.env,
      }
    );

    // Create compute infrastructure stack (depends on VPC)
    const computeStack = new MigrationComputeStack(
      this,
      'MigrationComputeStack',
      {
        vpc: vpcStack.vpc,
        sshSecurityGroup: vpcStack.sshSecurityGroup,
        environmentSuffix,
        env: props?.env,
      }
    );

    // Add dependencies
    storageStack.addDependency(vpcStack);
    computeStack.addDependency(vpcStack);

    // Apply global tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');

    // Export all outputs from nested stacks at the parent level for easy access
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcStack.vpc.vpcId,
      description: 'VPC ID for migration infrastructure',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpcStack.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: vpcStack.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: storageStack.backupBucket.bucketName,
      description: 'S3 bucket name for migration backups',
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: storageStack.backupBucket.bucketArn,
      description: 'S3 bucket ARN for migration backups',
    });

    // Note: CacheEndpoint will be available after deployment
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });
  }
}
