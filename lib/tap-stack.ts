import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { EcsMicroservicesStack } from './stacks/ecs-microservices-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    // Clean up the id if it contains shell variable syntax
    let cleanId = id;
    if (cleanId && cleanId.includes('${') && cleanId.includes(':-')) {
      cleanId = cleanId.replace(/\$\{[^}]+\}/g, '-dev');
    }

    // Also clean up the stackName in props if it exists
    let cleanProps = { ...props };

    // Handle environment configuration
    // Support multiple environment variable names for GitHub Actions compatibility
    // GitHub Actions typically provides: AWS_ACCOUNT_ID, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    let account =
      cleanProps.env?.account ||
      process.env.CDK_DEFAULT_ACCOUNT ||
      process.env.AWS_ACCOUNT_ID;
    let region =
      cleanProps.env?.region ||
      process.env.CDK_DEFAULT_REGION ||
      process.env.AWS_REGION ||
      'us-east-1';

    // Detect LocalStack environment
    const isLocalStack =
      process.env.USE_LOCALSTACK === 'true' ||
      !!process.env.LOCALSTACK_API_KEY ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localstack');

    if (isLocalStack) {
      // Use LocalStack defaults for local development
      account = account || '000000000000';
      region = region || 'us-east-1';

      // Set LocalStack endpoint if not already set
      if (!process.env.AWS_ENDPOINT_URL) {
        process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      }
    }

    // For synthesis (not deployment), use fallback account if needed
    // CDK needs account/region to generate CloudFormation templates
    // In GitHub Actions, account will be provided, so this is only for local synthesis
    const isSynthesis = !process.argv.includes('deploy');
    if (isSynthesis && !account) {
      account = '123456789012'; // Fallback account for synthesis only
    }

    region = region || 'us-east-1';

    cleanProps.env = {
      account,
      region,
    };

    if (
      cleanProps.stackName &&
      typeof cleanProps.stackName === 'string' &&
      cleanProps.stackName.includes('${') &&
      cleanProps.stackName.includes(':-')
    ) {
      cleanProps.stackName = cleanProps.stackName.replace(
        /\$\{[^}]+\}/g,
        '-dev'
      );
    }

    super(scope, cleanId, cleanProps);

    // Get environment suffix from props, context, or use 'dev' as default
    let environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Handle case where shell variable syntax is passed literally
    if (
      environmentSuffix &&
      environmentSuffix.includes('${') &&
      environmentSuffix.includes(':-')
    ) {
      environmentSuffix = 'dev'; // Default to 'dev' if shell syntax is not resolved
    }

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.
    new EcsMicroservicesStack(this, 'EcsMicroservicesStack', {
      ...props,
      stackName: `tap-ecs-microservices-${environmentSuffix}`,
      isLocalStack,
    });
  }
}
