import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkConstruct } from './constructs/network-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { DmsConstruct } from './constructs/dms-construct';

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

    // Create network infrastructure
    const network = new NetworkConstruct(this, 'Network', {
      environmentSuffix,
    });

    // Create Aurora PostgreSQL database
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.databaseSecurityGroup,
    });

    // Source database configuration (placeholder values for on-premises database)
    // In production, these should come from SSM Parameter Store or Secrets Manager
    const sourceHost =
      this.node.tryGetContext('sourceHost') || 'onprem-db.example.com';
    const sourcePort = this.node.tryGetContext('sourcePort') || 5432;
    const sourceDatabase =
      this.node.tryGetContext('sourceDatabase') || 'postgres';
    const sourceUsername =
      this.node.tryGetContext('sourceUsername') || 'postgres';
    const sourcePassword =
      this.node.tryGetContext('sourcePassword') || 'changeme';

    // Create DMS infrastructure
    const dms = new DmsConstruct(this, 'DMS', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.applicationSecurityGroup,
      targetEndpoint: database.clusterEndpoint,
      targetEndpointHostname: database.clusterEndpointHostname,
      targetEndpointPort: database.clusterEndpointPort,
      targetSecret: database.secret,
      sourceHost,
      sourcePort,
      sourceDatabase,
      sourceUsername,
      sourcePassword,
    });

    // Ensure DMS is created after database is ready
    dms.node.addDependency(database);

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      description: 'Aurora PostgreSQL cluster endpoint',
      value: database.clusterEndpoint,
      exportName: `aurora-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuroraReaderEndpoint', {
      description: 'Aurora PostgreSQL reader endpoint',
      value: database.readerEndpoint,
      exportName: `aurora-reader-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      description: 'ARN of the database credentials secret',
      value: database.secret.secretArn,
      exportName: `database-secret-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DMSTaskArn', {
      description: 'ARN of the DMS migration task',
      value: dms.taskArn,
      exportName: `dms-task-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      description: 'VPC ID',
      value: network.vpc.vpcId,
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      description: 'Database security group ID',
      value: network.databaseSecurityGroup.securityGroupId,
      exportName: `database-sg-id-${environmentSuffix}`,
    });
  }
}
