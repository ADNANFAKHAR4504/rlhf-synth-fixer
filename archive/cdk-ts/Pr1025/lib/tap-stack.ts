import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeConstruct } from './compute-construct';
import { DatabaseConstruct } from './database-construct';
import { MonitoringConstruct } from './monitoring-construct';
import { NetworkingConstruct } from './networking-construct';
import { SecurityConstruct } from './security-construct';
import { StorageConstruct } from './storage-construct';

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

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // Create security infrastructure
    const security = new SecurityConstruct(this, 'Security', {
      vpc: networking.vpc,
      environmentSuffix,
    });

    // Create compute infrastructure
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      environmentSuffix,
      securityGroup: security.webSecurityGroup,
    });

    // Create database infrastructure
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      environmentSuffix,
      securityGroup: security.dbSecurityGroup,
    });

    // Create storage infrastructure
    const storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
    });

    // Create monitoring infrastructure
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      instances: compute.instances,
      database: database.database,
    });

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storage.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: security.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `${this.stackName}-WAFWebAclArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
