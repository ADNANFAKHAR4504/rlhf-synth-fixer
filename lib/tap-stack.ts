import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseMigrationStack } from './database-migration-stack';

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

    // Instantiate the Database Migration Stack as a construct (not nested stack)
    new DatabaseMigrationStack(this, 'DatabaseMigration', {
      environmentSuffix: environmentSuffix,
      // Optional: Override these with actual values if known
      // developmentVpcId: 'vpc-xxxxx',
      // productionVpcId: 'vpc-yyyyy',
      // sourceRdsEndpoint: 'source-rds.xxxxxx.ap-southeast-1.rds.amazonaws.com',
      // sourceRdsPort: 3306,
      // sourceDbName: 'migrationdb',
      // sourceSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:...',
    });
  }
}
