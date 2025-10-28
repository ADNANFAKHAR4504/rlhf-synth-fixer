import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComplianceStack } from './compliance-stack';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Tag all resources created by stacks instantiated here with the required tag
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Instantiate the ComplianceStack as a child of TapStack
    // The ComplianceStack will create the compliance scanning resources.
    // Primary regional stack (same region as this stack/app by default)
    new ComplianceStack(this, `ComplianceStack-${environmentSuffix}`, {
      stackName: `ComplianceStack-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });

    // Optionally create regional replicas for DR/multi-region deployments.
    // This reads a list of regions from context `replicateRegions` (array) or
    // the environment variable `REPLICATE_REGIONS` (comma-separated). If none
    // provided, we default to creating a replica in `us-east-2`.
    const replicateRegionsFromContext =
      this.node.tryGetContext('replicateRegions');
    const replicateRegionsEnv = process.env.REPLICATE_REGIONS;
    const replicateRegions: string[] = Array.isArray(
      replicateRegionsFromContext
    )
      ? replicateRegionsFromContext
      : replicateRegionsEnv
        ? replicateRegionsEnv
            .split(',')
            .map(r => r.trim())
            .filter(Boolean)
        : []; // No hardcoded default regions: only replicate if explicitly configured

    // Ensure we have access to the app root so we can create separate stacks
    // targeted at different regions (each stack must be created with the app as scope).
    const app = this.node.root as cdk.App;

    for (const region of replicateRegions) {
      // Skip creating a replica for the current stack region
      const currentRegion =
        props?.env?.region || process.env.CDK_DEFAULT_REGION;
      if (!region || region === currentRegion) continue;

      // Use the same account as provided, or fallback to the CDK_DEFAULT_ACCOUNT env
      const account = props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT;

      new ComplianceStack(
        app,
        `ComplianceStack-${environmentSuffix}-${region}`,
        {
          stackName: `ComplianceStack-${environmentSuffix}-${region}`,
          environmentSuffix: environmentSuffix,
          env: { account: account, region: region },
        }
      );
    }
  }
}
