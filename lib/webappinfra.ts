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
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;

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
    this.rdsEndpoint = stack.outputs.rdsEndpoint;
    this.lambdaFunctionArn = stack.outputs.lambdaFunctionArn;
    this.albDnsName = stack.outputs.albDnsName;
    this.cloudFrontDomainName = stack.outputs.cloudFrontDomainName;
    this.ec2InstanceId = stack.outputs.ec2InstanceId;
    this.dynamoTableName = stack.outputs.dynamoTableName;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3BucketName: this.s3BucketName,
      rdsEndpoint: this.rdsEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      albDnsName: this.albDnsName,
      cloudFrontDomainName: this.cloudFrontDomainName,
      ec2InstanceId: this.ec2InstanceId,
      dynamoTableName: this.dynamoTableName,
    });
  }
}
