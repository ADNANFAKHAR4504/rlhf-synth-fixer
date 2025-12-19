import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FailureRecoveryInfrastructure } from './failure-recovery-infrastructure';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add iac-rlhf-amazon tag to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate the failure recovery infrastructure construct
    new FailureRecoveryInfrastructure(this, 'FailureRecoveryInfrastructure', {
      environmentSuffix: environmentSuffix,
      vpcCidr: this.node.tryGetContext('vpcCidr') || '10.0.0.0/16',
      domainName: this.node.tryGetContext('domainName') || 'example.com',
      alertEmail: this.node.tryGetContext('alertEmail') || 'alerts@example.com',
      adminCidr: this.node.tryGetContext('adminCidr') || '10.0.0.0/8',
      instanceType: this.node.tryGetContext('instanceType') || 't3.medium',
      dbInstanceType:
        this.node.tryGetContext('dbInstanceType') || 'db.t3.small',
      logRetentionDays: this.node.tryGetContext('logRetentionDays') || 30,
      enableRoute53: this.node.tryGetContext('enableRoute53') || false,
      createHostedZone: this.node.tryGetContext('createHostedZone') || false,
      primaryRegion: this.node.tryGetContext('primaryRegion') || 'us-east-1',
      applicationSubdomain:
        this.node.tryGetContext('applicationSubdomain') || 'app',
    });
  }
}
