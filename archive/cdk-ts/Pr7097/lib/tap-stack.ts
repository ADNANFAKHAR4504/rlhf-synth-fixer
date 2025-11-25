import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { AlbAsgConstruct } from '../lib/constructs/alb-asg-construct';
import { CloudFrontConstruct } from '../lib/constructs/cloudfront-construct';
import { ComplianceConstruct } from '../lib/constructs/compliance-construct';
import { CrossAccountConstruct } from '../lib/constructs/cross-account-construct';
import { LambdaConstruct } from '../lib/constructs/lambda-construct';
import { MonitoringConstruct } from '../lib/constructs/monitoring-construct';
import { RdsConstruct } from '../lib/constructs/rds-construct';
import { Route53Construct } from '../lib/constructs/route53-construct';
import { S3Construct } from '../lib/constructs/s3-construct';
import { VpcConstruct } from '../lib/constructs/vpc-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
  region: string;
  suffix: string;
  ec2InstanceCountPerRegion: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      environment,
      region,
      suffix,
      ec2InstanceCountPerRegion,
    } = props;

    // Generate timestamp for unique resource names if needed
    const timestamp = Date.now().toString().slice(-6);
    const uniqueSuffix = `${suffix}-${timestamp}`;

    // Get CIDR mappings from context with non-overlapping ranges
    const cidrMappings = this.node.tryGetContext('cidrMappings') || {
      'dev-us-east-2': '10.0.0.0/16',
      'dev-us-east-1': '10.1.0.0/16',
      'prod-us-east-2': '10.2.0.0/16',
      'prod-us-east-1': '10.3.0.0/16',
      'staging-us-east-2': '10.4.0.0/16',
      'staging-us-east-1': '10.5.0.0/16',
    };

    // 1. VPC with non-overlapping CIDR ranges
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      cidrMappings,
    });

    // 9. S3 Bucket with robust HTTPS-only enforcement
    const s3Construct = new S3Construct(this, 'S3Construct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // 2 & 11. Lambda with real-world cost monitoring use case
    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
      s3Bucket: s3Construct.bucket,
    });

    // 3 & 11. RDS with proper encryption and secrets
    const rdsConstruct = new RdsConstruct(this, 'RdsConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
    });

    // 14 & 15. ALB and Auto Scaling Group with proper security
    const albAsgConstruct = new AlbAsgConstruct(this, 'AlbAsgConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
      instanceCount: ec2InstanceCountPerRegion,
      dbSecret: rdsConstruct.dbSecret,
      dbEndpoint: rdsConstruct.dbEndpoint,
    });

    // 5. Route 53 with proper failover configuration
    const route53Construct = new Route53Construct(this, 'Route53Construct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      alb: albAsgConstruct.alb,
    });

    // 10. CloudFront with multi-region origin groups
    const cloudfrontConstruct = new CloudFrontConstruct(
      this,
      'CloudFrontConstruct',
      {
        environment,
        region,
        suffix: uniqueSuffix,
        environmentSuffix,
        alb: albAsgConstruct.alb,
        route53: route53Construct,
      }
    );

    // 8 & 12. Monitoring with cross-environment SNS
    const monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      {
        environment,
        region,
        suffix: uniqueSuffix,
        environmentSuffix,
        autoScalingGroup: albAsgConstruct.autoScalingGroup,
        lambdaFunction: lambdaConstruct.lambdaFunction,
        alb: albAsgConstruct.alb,
      }
    );

    // 13. Compliance with proper Config rules (Config rules commented out - no admin access)
    new ComplianceConstruct(this, 'ComplianceConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // 6. Cross-account IAM with configurable accounts
    new CrossAccountConstruct(this, 'CrossAccountConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // API Gateway with Lambda integration
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${environment}-${region}-api-${uniqueSuffix}`,
      description: 'API Gateway for integration testing',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(
      lambdaConstruct.lambdaFunction
    );
    api.root.addMethod('GET', lambdaIntegration);
    api.root.addMethod('POST', lambdaIntegration);

    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration);
    apiResource.addMethod('POST', lambdaIntegration);

    // SQS Queue
    const queue = new sqs.Queue(this, 'SqsQueue', {
      queueName: `${environment}-${region}-queue-${uniqueSuffix}`,
    });

    // Comprehensive outputs for flat-outputs.json discovery
    this.createOutputs(
      environmentSuffix,
      region,
      vpcConstruct,
      s3Construct,
      lambdaConstruct,
      rdsConstruct,
      albAsgConstruct,
      route53Construct,
      cloudfrontConstruct,
      monitoringConstruct,
      api,
      queue
    );
  }

  private createOutputs(
    environmentSuffix: string,
    region: string,
    vpcConstruct: VpcConstruct,
    s3Construct: S3Construct,
    lambdaConstruct: LambdaConstruct,
    rdsConstruct: RdsConstruct,
    albAsgConstruct: AlbAsgConstruct,
    route53Construct: Route53Construct,
    cloudfrontConstruct: CloudFrontConstruct,
    monitoringConstruct: MonitoringConstruct,
    api: apigateway.RestApi,
    queue: sqs.Queue
  ) {
    // VPC Outputs
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}${region}`, {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}-${region}`,
    });

    // S3 Outputs
    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}${region}`, {
      value: s3Construct.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `S3BucketName-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `S3BucketArn${environmentSuffix}${region}`, {
      value: s3Construct.bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: `S3BucketArn-${environmentSuffix}-${region}`,
    });

    // Lambda Outputs
    new cdk.CfnOutput(this, `LambdaFunctionArn${environmentSuffix}${region}`, {
      value: lambdaConstruct.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `LambdaFunctionArn-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `LambdaFunctionName${environmentSuffix}${region}`, {
      value: lambdaConstruct.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `LambdaFunctionName-${environmentSuffix}-${region}`,
    });

    // RDS Outputs
    new cdk.CfnOutput(this, `RdsEndpoint${environmentSuffix}${region}`, {
      value: rdsConstruct.dbEndpoint,
      description: 'RDS Endpoint',
      exportName: `RdsEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DbSecretArn${environmentSuffix}${region}`, {
      value: rdsConstruct.dbSecret.secretArn,
      description: 'Database Secret ARN',
      exportName: `DbSecretArn-${environmentSuffix}-${region}`,
    });

    // ALB Outputs
    new cdk.CfnOutput(this, `AlbEndpoint${environmentSuffix}${region}`, {
      value: `http://${albAsgConstruct.alb.loadBalancerDnsName}`,
      description: 'ALB HTTP Endpoint (for testing)',
      exportName: `AlbEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `AlbArn${environmentSuffix}${region}`, {
      value: albAsgConstruct.alb.loadBalancerArn,
      description: 'ALB ARN',
      exportName: `AlbArn-${environmentSuffix}-${region}`,
    });

    // Route 53 Outputs
    new cdk.CfnOutput(this, `HostedZoneId${environmentSuffix}${region}`, {
      value: route53Construct.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `HostedZoneId-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DomainName${environmentSuffix}${region}`, {
      value: route53Construct.domainName,
      description: 'Domain Name',
      exportName: `DomainName-${environmentSuffix}-${region}`,
    });

    // CloudFront Outputs
    new cdk.CfnOutput(this, `CloudFrontDomain${environmentSuffix}${region}`, {
      value: cloudfrontConstruct.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain',
      exportName: `CloudFrontDomain-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(
      this,
      `CloudFrontDistributionId${environmentSuffix}${region}`,
      {
        value: cloudfrontConstruct.distribution.distributionId,
        description: 'CloudFront Distribution ID',
        exportName: `CloudFrontDistributionId-${environmentSuffix}-${region}`,
      }
    );

    // Monitoring Outputs
    new cdk.CfnOutput(this, `ErrorTopicArn${environmentSuffix}${region}`, {
      value: monitoringConstruct.errorTopic.topicArn,
      description: 'Error Notification Topic ARN',
      exportName: `ErrorTopicArn-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DashboardUrl${environmentSuffix}${region}`, {
      value: `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${monitoringConstruct.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${environmentSuffix}-${region}`,
    });

    // Auto Scaling Group Output
    new cdk.CfnOutput(
      this,
      `AutoScalingGroupName${environmentSuffix}${region}`,
      {
        value: albAsgConstruct.autoScalingGroup.autoScalingGroupName,
        description: 'Auto Scaling Group Name',
        exportName: `AutoScalingGroupName-${environmentSuffix}-${region}`,
      }
    );

    // API Gateway Output
    new cdk.CfnOutput(this, `ApiGatewayUrl${environmentSuffix}${region}`, {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiGatewayUrl-${environmentSuffix}-${region}`,
    });

    // SQS Queue Output
    new cdk.CfnOutput(this, `SqsQueueUrl${environmentSuffix}${region}`, {
      value: queue.queueUrl,
      description: 'SQS Queue URL',
      exportName: `SqsQueueUrl-${environmentSuffix}-${region}`,
    });
  }
}
