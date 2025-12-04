/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { LambdaOptimizerStack } from './lambda-optimizer-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly lambdaName: pulumi.Output<string>;
  public readonly roleArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Instantiate Lambda Optimizer Stack
    const lambdaStack = new LambdaOptimizerStack(
      'lambda-optimizer',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.lambdaArn = lambdaStack.lambdaArn;
    this.lambdaName = lambdaStack.lambdaName;
    this.roleArn = lambdaStack.roleArn;
    this.logGroupName = lambdaStack.logGroupName;
    this.dlqUrl = lambdaStack.dlqUrl;
    this.layerArn = lambdaStack.layerArn;

    this.registerOutputs({
      lambdaArn: this.lambdaArn,
      lambdaName: this.lambdaName,
      roleArn: this.roleArn,
      logGroupName: this.logGroupName,
      dlqUrl: this.dlqUrl,
      layerArn: this.layerArn,
    });
  }
}
