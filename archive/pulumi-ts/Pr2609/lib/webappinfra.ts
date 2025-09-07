import * as pulumi from '@pulumi/pulumi';
import { EnvironmentMigrationStack } from './environmentMigrationStack';

export interface WebAppInfraArgs {
  region: string;
  environment: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class WebAppInfra extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly cloudFrontDistributionId: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly ec2PublicIp: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: WebAppInfraArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:webappinfra:WebAppInfra', name, args, opts);

    const stack = new EnvironmentMigrationStack(
      args.region,
      args.environment,
      args.tags
    );

    this.vpcId = stack.outputs.vpcId;
    this.publicSubnetIds = stack.outputs.publicSubnetIds;
    this.privateSubnetIds = stack.outputs.privateSubnetIds;
    this.s3BucketName = stack.outputs.s3BucketName;
    this.s3BucketArn = stack.outputs.s3BucketArn;
    this.rdsEndpoint = stack.outputs.rdsEndpoint;
    this.lambdaFunctionArn = stack.outputs.lambdaFunctionArn;
    this.lambdaFunctionName = stack.outputs.lambdaFunctionName;
    this.albDnsName = stack.outputs.albDnsName;
    this.albArn = stack.outputs.albArn;
    this.cloudFrontDomainName = stack.outputs.cloudFrontDomainName;
    this.cloudFrontDistributionId = stack.outputs.cloudFrontDistributionId;
    this.ec2InstanceId = stack.outputs.ec2InstanceId;
    this.ec2PublicIp = stack.outputs.ec2PublicIp;
    this.dynamoTableName = stack.outputs.dynamoTableName;
    this.dynamoTableArn = stack.outputs.dynamoTableArn;
    this.kmsKeyId = stack.outputs.kmsKeyId;
    this.kmsKeyArn = stack.outputs.kmsKeyArn;
    this.secretArn = stack.outputs.secretArn;
    this.targetGroupArn = stack.outputs.targetGroupArn;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3BucketName: this.s3BucketName,
      s3BucketArn: this.s3BucketArn,
      rdsEndpoint: this.rdsEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      lambdaFunctionName: this.lambdaFunctionName,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      cloudFrontDomainName: this.cloudFrontDomainName,
      cloudFrontDistributionId: this.cloudFrontDistributionId,
      ec2InstanceId: this.ec2InstanceId,
      ec2PublicIp: this.ec2PublicIp,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      secretArn: this.secretArn,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
