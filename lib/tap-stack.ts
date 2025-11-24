// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsMicroservicesStack } from './stacks/ecs-microservices-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    let cleanId = id;
    if (cleanId && cleanId.includes('${') && cleanId.includes(':-')) {
      cleanId = cleanId.replace(/\$\{[^}]+\}/g, '-dev');
    }

    let account =
      props?.env?.account ||
      process.env.CDK_DEFAULT_ACCOUNT ||
      process.env.AWS_ACCOUNT_ID;
    let region =
      props?.env?.region ||
      process.env.CDK_DEFAULT_REGION ||
      process.env.AWS_REGION ||
      'us-east-1';

    const isLocalStack =
      process.env.USE_LOCALSTACK === 'true' ||
      !!process.env.LOCALSTACK_API_KEY ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localstack');

    if (isLocalStack) {
      account = account || '000000000000';
      region = region || 'us-east-1';
      if (!process.env.AWS_ENDPOINT_URL) {
        process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      }
    }

    const isSynthesis = !process.argv.includes('deploy');
    if (isSynthesis && !account) {
      account = '123456789012';
    }

    // Create clean props without modifying the original
    let cleanProps: TapStackProps & cdk.StackProps = {
      ...(props || {}),
      env: { account, region },
    };

    if (
      cleanProps.stackName &&
      typeof cleanProps.stackName === 'string' &&
      cleanProps.stackName.includes('${') &&
      cleanProps.stackName.includes(':-')
    ) {
      cleanProps = {
        ...cleanProps,
        stackName: cleanProps.stackName.replace(/\$\{[^}]+\}/g, '-dev'),
      };
    }

    super(scope, cleanId, cleanProps);

    let environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    if (
      environmentSuffix &&
      environmentSuffix.includes('${') &&
      environmentSuffix.includes(':-')
    ) {
      environmentSuffix = 'dev';
    }

    const microservicesStack = new EcsMicroservicesStack(
      this,
      'EcsMicroservicesStack',
      {
        ...props,
        stackName: `tap-ecs-microservices-${environmentSuffix}`,
        isLocalStack,
        environmentSuffix,
      }
    );

    // Re-export outputs from the nested stack to make them available at the parent level
    // Use placeholder values during synthesis to avoid cross-stack reference issues
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: isSynthesis ? 'mock-alb-dns-name' : microservicesStack.albDnsName,
      description: 'ALB DNS Name',
      exportName: `AlbDnsName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: isSynthesis ? 'mock-cluster-name' : microservicesStack.clusterName,
      description: 'ECS Cluster Name',
      exportName: `ClusterName-${environmentSuffix}`,
    });

    // Always output mesh name for integration tests
    // Use placeholder when mesh is not created (e.g., in CI/CD mode)
    new cdk.CfnOutput(this, 'MeshName', {
      value: isSynthesis
        ? 'mock-mesh-name'
        : microservicesStack.meshName || 'not-deployed-cicd-mode',
      description: 'App Mesh Name (or placeholder if not deployed)',
      exportName: `MeshName-${environmentSuffix}`,
    });
  }
}
