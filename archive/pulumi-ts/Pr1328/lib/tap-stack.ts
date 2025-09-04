/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Stack } from './s3-stack';
import { VpcStack } from './vpc-stack';
import { RdsStack } from './rds-stack';
import { IamStack } from './iam-stack';
import { LambdaStack } from './lambda-stack';
import { ParameterStack } from './parameter-stack';
import { EventBridgeStack } from './eventbridge-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly eventBusArn: pulumi.Output<string>;
  public readonly parameterStorePrefix: string;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create S3 infrastructure
    const s3Stack = new S3Stack(
      'tap-s3',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create VPC infrastructure
    const vpcStack = new VpcStack(
      'tap-vpc',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create RDS infrastructure
    const rdsStack = new RdsStack(
      'tap-rds',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        vpcStack: vpcStack,
      },
      { parent: this }
    );

    // Create EventBridge infrastructure
    const eventBridgeStack = new EventBridgeStack(
      'tap-eventbridge',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create Parameter Store infrastructure
    const parameterStack = new ParameterStack(
      'tap-parameters',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        rdsStack: rdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      },
      { parent: this }
    );

    // Create IAM infrastructure
    const iamStack = new IamStack(
      'tap-iam',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        bucketArn: s3Stack.bucket.arn,
        eventBusArn: eventBridgeStack.customEventBusArn,
      },
      { parent: this }
    );

    // Create Lambda infrastructure
    const lambdaStack = new LambdaStack(
      'tap-lambda',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        bucketName: s3Stack.bucketName,
        lambdaRoleArn: iamStack.lambdaRoleArn,
        lambdaCodeObject: s3Stack.lambdaCodeObject,
        parameterStack: parameterStack,
        eventBridgeStack: eventBridgeStack,
      },
      { parent: this }
    );

    // Export the outputs as required
    this.bucketName = s3Stack.bucketName;
    this.dbEndpoint = rdsStack.dbEndpoint;
    this.lambdaFunctionArn = lambdaStack.lambdaFunction.arn;
    this.vpcId = vpcStack.vpc.id;
    this.eventBusArn = eventBridgeStack.customEventBusArn;
    this.parameterStorePrefix = `/tap/${environmentSuffix}/`;

    // Register the outputs of this component
    this.registerOutputs({
      bucketName: this.bucketName,
      dbEndpoint: this.dbEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      vpcId: this.vpcId,
      eventBusArn: this.eventBusArn,
      parameterStorePrefix: this.parameterStorePrefix,
      dbInstanceId: rdsStack.dbInstance.id,
      lambdaFunctionName: lambdaStack.lambdaFunction.name,
      eventBusName: eventBridgeStack.customEventBus.name,
      monitoringLogGroupName: eventBridgeStack.monitoringLogGroup.name,
    });
  }
}
