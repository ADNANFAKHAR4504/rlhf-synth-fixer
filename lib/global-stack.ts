import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface GlobalStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
}

export class GlobalStack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;
  public readonly crossRegionRole: iam.Role;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create hosted zone for DNS management
    this.hostedZone = new route53.PublicHostedZone(
      this,
      `HostedZone-${environmentSuffix}`,
      {
        zoneName: `trading-platform-${environmentSuffix}.example.com`,
      }
    );

    // Cross-region IAM role for failover operations
    this.crossRegionRole = new iam.Role(
      this,
      `CrossRegionRole-${environmentSuffix}`,
      {
        roleName: `trading-platform-cross-region-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Add permissions for cross-region operations
    this.crossRegionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:FailoverGlobalCluster',
          'rds:DescribeGlobalClusters',
          'rds:ModifyDBCluster',
          'route53:ChangeResourceRecordSets',
          'route53:GetHealthCheckStatus',
          'route53:UpdateHealthCheck',
          'dynamodb:DescribeGlobalTable',
          'dynamodb:UpdateGlobalTable',
          'ssm:GetParameter',
          'ssm:PutParameter',
          's3:ReplicateObject',
          'events:PutEvents',
        ],
        resources: ['*'],
      })
    );

    // CloudWatch Logs for cross-region activities
    new logs.LogGroup(this, `GlobalLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/global/trading-platform-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      exportName: `HostedZoneId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CrossRegionRoleArn', {
      value: this.crossRegionRole.roleArn,
      exportName: `CrossRegionRoleArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: this.hostedZone.zoneName,
      exportName: `DomainName-${environmentSuffix}`,
    });

    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'Global');
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
  }
}
