import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-stack';
import { SecurityConstruct } from './security-stack';
import { DatabaseConstruct } from './database-stack';
import { StorageConstruct } from './storage-stack';
import { MonitoringConstruct } from './monitoring-stack';
import { SecretsConstruct } from './secrets-stack';

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

    // Primary region (us-east-1) infrastructure - now using Constructs instead of NestedStacks
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      commonTags,
    });

    new SecretsConstruct(this, 'Secrets', {
      environmentSuffix,
      commonTags,
    });

    const security = new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      commonTags,
      vpc: networking.vpc,
    });

    new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      commonTags,
      vpc: networking.vpc,
      dbSecurityGroup: security.dbSecurityGroup,
    });

    new StorageConstruct(this, 'Storage', {
      environmentSuffix,
      commonTags,
    });

    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      commonTags,
      vpc: networking.vpc,
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

    // Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${projectName}-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'VpcArn', {
      value: networking.vpc.vpcArn,
      description: 'VPC ARN',
      exportName: `${projectName}-${environmentSuffix}-vpc-arn`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Deployment Region',
    });
  }
}
