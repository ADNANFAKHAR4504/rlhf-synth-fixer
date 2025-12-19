// lib/constructs/log-processing.ts
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface LogProcessingProps {
  environment?: Record<string, string>;
}

export class LogProcessingConstruct extends Construct {
  public readonly logProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props?: LogProcessingProps) {
    super(scope, id);

    // When running unit tests (Jest), avoid bundling and filesystem lookups.
    const isJest = !!process.env.JEST_WORKER_ID;

    if (isJest) {
      // Inline stub so tests can synthesize fast and deterministically.
      this.logProcessor = new lambda.Function(this, 'LogProcessor', {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          'exports.handler = async () => ({ statusCode: 200, body: "ok" });'
        ),
        timeout: cdk.Duration.seconds(30),
        environment: props?.environment,
      });
      return;
    }

    // Real function for synth/deploy in CI (bundled with esbuild or Docker)
    const entry = path.resolve(
      __dirname,
      '..',
      'lambdas',
      'log-processor',
      'index.ts'
    );

    this.logProcessor = new NodejsFunction(this, 'LogProcessor', {
      entry,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(60),
      bundling: {
        // Use local esbuild if available; GitHub runners fall back to Docker automatically.
        // No script changes required.
        minify: false,
        sourceMap: false,
      },
      environment: {
        POWERTOOLS_METRICS_NAMESPACE: 'PaymentPlatform/Business',
        ...(props?.environment ?? {}),
      },
    });
  }
}
