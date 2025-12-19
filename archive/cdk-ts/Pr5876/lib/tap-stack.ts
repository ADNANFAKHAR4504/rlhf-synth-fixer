import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import all constructs
import { ComputeConstruct } from '../lib/constructs/compute-construct';
import { DatabaseConstruct } from '../lib/constructs/database-construct';
import { DnsConstruct } from '../lib/constructs/dns-construct';
import { IamConstruct } from '../lib/constructs/iam-construct';
import { MonitoringConstruct } from '../lib/constructs/monitoring-construct';
import { ServerlessConstruct } from '../lib/constructs/serverless-construct';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { AppConfig } from './interfaces/config-interfaces';
import { NamingUtil, TimestampUtil } from './utils/naming';

interface TapStackProps extends cdk.StackProps {
  environment: string;
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environment, environmentSuffix } = props;

    // Create app configuration
    const config: AppConfig = {
      environment,
      environmentSuffix,
      region: this.region,
      account: this.account,
      timestamp: TimestampUtil.generateShortTimestamp(),
      tags: {
        'iac-rlhf-amazon': 'true',
        Environment: environment,
        ManagedBy: 'CDK',
        Application: 'tap-stack',
      },
    };

    // Create VPC and networking
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      config,
    });

    // Create IAM roles (cross-account compatible)
    new IamConstruct(this, 'IamConstruct', {
      config,
    });

    // Create database infrastructure
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      config,
      vpc: vpcConstruct.vpc,
    });

    // Create compute infrastructure
    const computeConstruct = new ComputeConstruct(this, 'ComputeConstruct', {
      config,
      vpc: vpcConstruct.vpc,
      databaseSecret: databaseConstruct.databaseSecret,
    });

    // Create serverless infrastructure
    const serverlessConstruct = new ServerlessConstruct(
      this,
      'ServerlessConstruct',
      {
        config,
        vpc: vpcConstruct.vpc,
      }
    );

    // Create monitoring infrastructure
    const monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      {
        config,
        asgName: computeConstruct.asgName,
        albArn: computeConstruct.albArn,
      }
    );

    // Create DNS and CloudFront infrastructure
    const dnsConstruct = new DnsConstruct(this, 'DnsConstruct', {
      config,
      albDnsName: computeConstruct.albDnsName,
      vpc: vpcConstruct.vpc,
    });

    // Output key resources for flat-outputs.json discovery
    new cdk.CfnOutput(this, NamingUtil.generateOutputKey(config, 'VpcId'), {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${config.environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(
      this,
      NamingUtil.generateOutputKey(config, 'AlbDnsName'),
      {
        value: computeConstruct.albDnsName,
        description: 'Application Load Balancer DNS Name',
        exportName: `${config.environmentSuffix}-alb-dns-name`,
      }
    );

    new cdk.CfnOutput(
      this,
      NamingUtil.generateOutputKey(config, 'DatabaseEndpoint'),
      {
        value: databaseConstruct.databaseEndpoint,
        description: 'Database Endpoint',
        exportName: `${config.environmentSuffix}-database-endpoint`,
      }
    );

    new cdk.CfnOutput(
      this,
      NamingUtil.generateOutputKey(config, 'BucketName'),
      {
        value: serverlessConstruct.bucketName,
        description: 'S3 Bucket Name',
        exportName: `${config.environmentSuffix}-bucket-name`,
      }
    );

    new cdk.CfnOutput(this, NamingUtil.generateOutputKey(config, 'LambdaArn'), {
      value: serverlessConstruct.lambdaArn,
      description: 'Lambda Function ARN',
      exportName: `${config.environmentSuffix}-lambda-arn`,
    });

    new cdk.CfnOutput(
      this,
      NamingUtil.generateOutputKey(config, 'CloudFrontDomain'),
      {
        value: dnsConstruct.distributionDomain,
        description: 'CloudFront Distribution Domain',
        exportName: `${config.environmentSuffix}-cloudfront-domain`,
      }
    );

    new cdk.CfnOutput(this, NamingUtil.generateOutputKey(config, 'SnsTopic'), {
      value: monitoringConstruct.alarmTopicArn,
      description: 'SNS Topic ARN for Alarms',
      exportName: `${config.environmentSuffix}-sns-topic-arn`,
    });
  }
}
