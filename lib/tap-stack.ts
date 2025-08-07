import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { SecretsStack } from './secrets-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const projectName = 'secure-vpc-project';
    const costCenter = 'infrastructure';

    // Apply common tags
    const commonTags = {
      Environment: environmentSuffix,
      ProjectName: projectName,
      CostCenter: costCenter,
    };

    // Primary region (us-east-1) infrastructure
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    new SecretsStack(this, 'SecretsStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      env: props?.env,
    });

    new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      dbSecurityGroup: securityStack.dbSecurityGroup,
      env: props?.env,
    });

    new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      commonTags,
      env: props?.env,
    });

    new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      commonTags,
      vpc: networkingStack.vpc,
      env: props?.env,
    });

    // Cross-region replication stack for us-west-2 - disabled for initial deployment
    // if (props?.env?.region === 'us-east-1') {
    //   new StorageStack(this, 'StorageStackWest', {
    //     environmentSuffix,
    //     commonTags,
    //     regionSuffix: '-west2',
    //     env: { ...props?.env, region: 'us-west-2' },
    //   });
    // }
  }
}
