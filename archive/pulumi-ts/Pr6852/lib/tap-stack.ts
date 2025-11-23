/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import * as pulumi from '@pulumi/pulumi';
import { EnvironmentComponent } from './environment-component';
import { ConfigComparisonResource } from './comparison-provider';
import { DriftDetection } from './drift-detection';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main TapStack component for multi-environment infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly environment: EnvironmentComponent;
  public readonly configComparison: ConfigComparisonResource;
  public readonly driftDetection: DriftDetection;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Determine the base environment for configuration
    // PR environments (pr*, synth-*) use dev configuration
    let baseEnvironment: 'dev' | 'staging' | 'prod' = 'dev';
    if (environmentSuffix === 'prod') {
      baseEnvironment = 'prod';
    } else if (environmentSuffix === 'staging') {
      baseEnvironment = 'staging';
    } else if (environmentSuffix.startsWith('pr') || environmentSuffix.startsWith('synth-')) {
      // PR and synthetic environments use dev configuration
      baseEnvironment = 'dev';
    } else if (['dev', 'development'].includes(environmentSuffix)) {
      baseEnvironment = 'dev';
    } else {
      // Default to dev for any other environment
      baseEnvironment = 'dev';
    }

    // Create environment infrastructure
    this.environment = new EnvironmentComponent(
      `env-${environmentSuffix}`,
      {
        environmentSuffix,
        baseEnvironment,
      },
      { parent: this }
    );

    // Create configuration comparison report
    this.configComparison = new ConfigComparisonResource('config-comparison', {
      parent: this,
    });

    // Create drift detection
    this.driftDetection = new DriftDetection(
      'drift-detection',
      environmentSuffix,
      { parent: this }
    );

    // Register outputs
    this.registerOutputs({
      environment: environmentSuffix,
      vpcId: this.environment.vpc.vpc.id,
      dbEndpoint: this.environment.rds.dbInstance.endpoint,
      lambdaFunctionArn: this.environment.lambda.lambdaFunction.arn,
      apiUrl: this.environment.apiGateway.stage.invokeUrl,
      dynamoTableName: this.environment.dynamodb.table.name,
      s3BucketName: this.environment.s3.bucket.id,
      dashboardName: this.environment.cloudwatch.dashboard.dashboardName,
      configComparison: this.configComparison.report,
      driftReport: this.driftDetection.driftReport,
    });
  }
}
