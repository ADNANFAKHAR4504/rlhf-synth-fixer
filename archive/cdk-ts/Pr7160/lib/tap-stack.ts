import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiEnvironmentInfrastructureStack } from './multi-environment-infra-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply the required global tag for all resources created by stacks
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    const timestamp = Date.now().toString().slice(-6);

    // Only deploy dev environment to avoid production deployment issues
    // Force dev-only deployment regardless of context
    const environments = ['dev'];

    // Determine which regions to create stacks in. If CDK_DEFAULT_REGION is set
    // in the environment (recommended for CI), honor it and create stacks only
    // in that single region. Otherwise fall back to the `regions` context (multi-region).
    const contextRegions = this.node.tryGetContext('regions') || [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
    ];
    const envRegion = process.env.CDK_DEFAULT_REGION;
    const regions = envRegion ? [envRegion] : contextRegions;

    const domainName =
      this.node.tryGetContext('domainName') ||
      this.node.tryGetContext('domain') ||
      undefined;
    const certificateArn =
      this.node.tryGetContext('cloudFrontCertificateArn') || undefined;

    for (const env of environments) {
      for (const region of regions) {
        const constructId = `multi-infra-${env}-${region}-${environmentSuffix}-${timestamp}`;
        new MultiEnvironmentInfrastructureStack(this, constructId, {
          environment: env,
          region: region,
          environmentSuffix,
          timestamp,
          domainName,
          certificateArn,
        });
      }
    }
  }
}
