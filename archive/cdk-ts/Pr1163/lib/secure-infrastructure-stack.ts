import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudTrailConstruct } from './constructs/cloudtrail-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { PatchManagerConstruct } from './constructs/patch-manager-construct';
import { SecurityConstruct } from './constructs/security-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { VpcConstruct } from './constructs/vpc-construct';
import { WafConstruct } from './constructs/waf-construct';

export interface SecureInfrastructureStackProps extends cdk.StackProps {
  environment: string;
  alertEmail?: string; // Add configurable alert email
}

export class SecureInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SecureInfrastructureStackProps
  ) {
    super(scope, id, props);

    const { environment } = props;

    // VPC Infrastructure
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environment,
    });

    // Security Infrastructure
    const securityConstruct = new SecurityConstruct(this, 'SecurityConstruct', {
      environment,
      vpc: vpcConstruct.vpc,
    });

    // Monitoring and Alerting
    const monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      {
        environment,
        alertEmail: props.alertEmail, // Pass configurable email
      }
    );

    // Storage Infrastructure (create first to get S3 bucket)
    const storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // CloudTrail for comprehensive logging (with S3 bucket monitoring)
    const cloudTrailConstruct = new CloudTrailConstruct(
      this,
      'CloudTrailConstruct',
      {
        environment,
        s3BucketsToMonitor: [storageConstruct.secureS3Bucket],
      }
    );

    // Database Infrastructure
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      environment,
      vpc: vpcConstruct.vpc,
      securityGroup: securityConstruct.databaseSecurityGroup,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // WAF Protection
    const wafConstruct = new WafConstruct(this, 'WafConstruct', {
      environment,
    });

    // Patch Manager for automated patching
    new PatchManagerConstruct(this, 'PatchManagerConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseConstruct.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'WafAclArn', {
      value: wafConstruct.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value:
        cloudTrailConstruct.trail?.trailArn ||
        'CloudTrail not created for this environment',
      description: 'CloudTrail ARN',
    });
  }
}
