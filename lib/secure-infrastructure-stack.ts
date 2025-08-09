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

    // Storage Infrastructure
    new StorageConstruct(this, 'StorageConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // Patch Manager for automated patching
    new PatchManagerConstruct(this, 'PatchManagerConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // CloudTrail for comprehensive logging
    const cloudTrailConstruct = new CloudTrailConstruct(
      this,
      'CloudTrailConstruct',
      {
        environment,
      }
    );

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
      value: cloudTrailConstruct.trail.trailArn,
      description: 'CloudTrail ARN',
    });
  }
}
