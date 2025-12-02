/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of Lambda ETL infrastructure components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { LambdaEtlStack } from './index';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of Lambda ETL infrastructure
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiHandlerFunctionArn: pulumi.Output<string>;
  public readonly batchProcessorFunctionArn: pulumi.Output<string>;
  public readonly transformFunctionArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const environment = process.env.ENVIRONMENT || 'dev';

    // Instantiate Lambda ETL Stack
    const lambdaEtlStack = new LambdaEtlStack(
      'lambda-etl',
      {
        environmentSuffix: environmentSuffix,
        environment: environment,
      },
      { parent: this }
    );

    // Expose outputs from Lambda ETL Stack
    this.apiHandlerFunctionArn = lambdaEtlStack.apiHandlerFunctionArn;
    this.batchProcessorFunctionArn = lambdaEtlStack.batchProcessorFunctionArn;
    this.transformFunctionArn = lambdaEtlStack.transformFunctionArn;
    this.dlqUrl = lambdaEtlStack.dlqUrl;
    this.layerArn = lambdaEtlStack.layerArn;

    // Register the outputs of this component.
    this.registerOutputs({
      apiHandlerFunctionArn: this.apiHandlerFunctionArn,
      batchProcessorFunctionArn: this.batchProcessorFunctionArn,
      transformFunctionArn: this.transformFunctionArn,
      dlqUrl: this.dlqUrl,
      layerArn: this.layerArn,
    });
  }
}
