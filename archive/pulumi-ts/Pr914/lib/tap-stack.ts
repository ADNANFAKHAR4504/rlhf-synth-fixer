/**
 * tap-stack.ts
 *
 * Simplified version of the TapStack that uses AWS managed keys for S3 encryption
 * and removes the complexity of customer-managed KMS keys.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ApiGatewayStack } from './api-gateway-stack';
import { CloudWatchStack } from './cloudwatch-stack';
import { LambdaStack } from './lambda-stack';
import { NetworkingStack } from './networking-stack';
import { S3Stack } from './s3-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  // Networking outputs
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly vpcSecurityGroupId: pulumi.Output<string>;
  public readonly s3VpcEndpointId: pulumi.Output<string>;
  public readonly vpcCidrBlock: pulumi.Output<string>;
  // Lambda outputs
  public readonly lambdaFunctionUrl: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly lambdaRoleArn: pulumi.Output<string>;
  public readonly lambdaRoleName: pulumi.Output<string>;
  // S3 outputs
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly s3AccessLogsBucketName: pulumi.Output<string>;
  public readonly s3AccessLogsBucketArn: pulumi.Output<string>;
  // CloudWatch outputs
  public readonly lambdaLogGroupName: pulumi.Output<string>;
  public readonly lambdaLogGroupArn: pulumi.Output<string>;
  public readonly apiGatewayLogGroupName: pulumi.Output<string>;
  public readonly apiGatewayLogGroupArn: pulumi.Output<string>;
  // API Gateway outputs
  public readonly apiGatewayId: pulumi.Output<string>;
  public readonly apiGatewayStageId: pulumi.Output<string>;
  public readonly apiGatewayStageName: pulumi.Output<string>;
  public readonly apiGatewayIntegrationId: pulumi.Output<string>;
  public readonly apiGatewayMethodId: pulumi.Output<string>;
  public readonly apiGatewayResourceId: pulumi.Output<string>;
  // Environment and configuration
  public readonly region: string;
  public readonly environmentSuffix: string;
  public readonly tags: pulumi.Output<{ [key: string]: string }>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: environmentSuffix,
      Project: 'SecureDocumentAPI',
      ManagedBy: 'Pulumi',
      ...args.tags,
    };

    // Force AWS region to us-east-1 as per requirements
    const awsProvider = new aws.Provider('aws-us-east-1', {
      region: 'us-east-1',
    });

    // 1. Networking infrastructure
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 2. CloudWatch logging
    const cloudWatch = new CloudWatchStack(
      'cloudwatch',
      {
        environmentSuffix,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 3. S3 bucket
    const s3 = new S3Stack(
      's3',
      {
        environmentSuffix,
        tags,
      },
      { parent: this, provider: awsProvider }
    );

    // 4. Lambda function with S3 bucket details
    const lambda = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        bucketArn: s3.bucket.arn,
        bucketName: s3.bucket.id,
        privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
        vpcSecurityGroupId: networking.vpcSecurityGroup.id,
        logGroupArn: cloudWatch.lambdaLogGroup.arn,
        tags,
      },
      {
        parent: this,
        dependsOn: [s3.bucket, cloudWatch.lambdaLogGroup],
        provider: awsProvider,
      }
    );

    // 5. Update S3 bucket policy with real Lambda role
    s3.updateBucketPolicy(lambda.role.arn);

    // 6. API Gateway
    const apiGateway = new ApiGatewayStack(
      'api-gateway',
      {
        environmentSuffix,
        lambdaFunctionArn: lambda.function.arn,
        lambdaFunctionName: lambda.function.name,
        tags,
      },
      { parent: this, dependsOn: [lambda.function], provider: awsProvider }
    );

    // Expose outputs
    this.vpcId = networking.vpc.id;
    this.apiUrl = apiGateway.apiUrl;
    this.bucketName = s3.bucket.id;
    this.lambdaFunctionName = lambda.function.name;

    // Networking outputs
    this.privateSubnetIds = pulumi.all(
      networking.privateSubnets.map(subnet => subnet.id)
    );
    this.publicSubnetIds = pulumi.all(
      networking.publicSubnets.map(subnet => subnet.id)
    );
    this.vpcSecurityGroupId = networking.vpcSecurityGroup.id;
    this.s3VpcEndpointId = networking.s3VpcEndpoint.id;
    this.vpcCidrBlock = networking.vpc.cidrBlock;
    // Lambda outputs
    this.lambdaFunctionUrl = lambda.functionUrl.functionUrl;
    this.lambdaFunctionArn = lambda.function.arn;
    this.lambdaRoleArn = lambda.role.arn;
    this.lambdaRoleName = lambda.role.name;
    // S3 outputs
    this.s3BucketArn = s3.bucket.arn;
    this.s3AccessLogsBucketName = s3.accessLogsBucket.id;
    this.s3AccessLogsBucketArn = s3.accessLogsBucket.arn;
    // CloudWatch outputs
    this.lambdaLogGroupName = cloudWatch.lambdaLogGroup.name;
    this.lambdaLogGroupArn = cloudWatch.lambdaLogGroup.arn;
    this.apiGatewayLogGroupName = cloudWatch.apiGatewayLogGroup.name;
    this.apiGatewayLogGroupArn = cloudWatch.apiGatewayLogGroup.arn;
    // API Gateway outputs
    this.apiGatewayId = apiGateway.api.id;
    this.apiGatewayStageId = apiGateway.stage.id;
    this.apiGatewayStageName = apiGateway.stage.stageName;
    this.apiGatewayIntegrationId = apiGateway.integration.id;
    this.apiGatewayMethodId = apiGateway.method.id;
    this.apiGatewayResourceId = apiGateway.resource.id;
    // Environment and configuration
    this.region = 'us-east-1';
    this.environmentSuffix = environmentSuffix;
    this.tags = pulumi.output(tags);

    this.registerOutputs({
      // Core infrastructure outputs
      vpcId: this.vpcId,
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      lambdaFunctionName: this.lambdaFunctionName,
      // Networking outputs
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      vpcSecurityGroupId: this.vpcSecurityGroupId,
      s3VpcEndpointId: this.s3VpcEndpointId,
      vpcCidrBlock: this.vpcCidrBlock,
      // Lambda outputs
      lambdaFunctionUrl: this.lambdaFunctionUrl,
      lambdaFunctionArn: this.lambdaFunctionArn,
      lambdaRoleArn: this.lambdaRoleArn,
      lambdaRoleName: this.lambdaRoleName,
      // S3 outputs
      s3BucketArn: this.s3BucketArn,
      s3AccessLogsBucketName: this.s3AccessLogsBucketName,
      s3AccessLogsBucketArn: this.s3AccessLogsBucketArn,
      // CloudWatch outputs
      lambdaLogGroupName: this.lambdaLogGroupName,
      lambdaLogGroupArn: this.lambdaLogGroupArn,
      apiGatewayLogGroupName: this.apiGatewayLogGroupName,
      apiGatewayLogGroupArn: this.apiGatewayLogGroupArn,
      // API Gateway outputs
      apiGatewayId: this.apiGatewayId,
      apiGatewayStageId: this.apiGatewayStageId,
      apiGatewayStageName: this.apiGatewayStageName,
      apiGatewayIntegrationId: this.apiGatewayIntegrationId,
      apiGatewayMethodId: this.apiGatewayMethodId,
      apiGatewayResourceId: this.apiGatewayResourceId,
      // Environment and configuration
      region: this.region,
      environmentSuffix: this.environmentSuffix,
      // Tags for resource identification
      tags: this.tags,
    });
  }
}
