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
      }
    );

    // Re-export outputs from the nested stack to make them available at the parent level
    // Use placeholder values during synthesis to avoid cross-stack reference issues
    if (isSynthesis) {
      // During synthesis/testing, use placeholder values
      new cdk.CfnOutput(this, 'AlbDnsName', {
        value: 'mock-alb-dns-name',
        description: 'ALB DNS Name',
        exportName: 'AlbDnsName',
      });

      new cdk.CfnOutput(this, 'ClusterName', {
        value: 'mock-cluster-name',
        description: 'ECS Cluster Name',
        exportName: 'ClusterName',
      });
    } else {
      // During deployment, use actual values from nested stack
      new cdk.CfnOutput(this, 'AlbDnsName', {
        value: microservicesStack.albDnsName,
        description: 'ALB DNS Name',
        exportName: 'AlbDnsName',
      });

      new cdk.CfnOutput(this, 'ClusterName', {
        value: microservicesStack.clusterName,
        description: 'ECS Cluster Name',
        exportName: 'ClusterName',
      });

      // Only output mesh name if mesh was created
      if (microservicesStack.meshName) {
        new cdk.CfnOutput(this, 'MeshName', {
          value: microservicesStack.meshName,
          description: 'App Mesh Name',
          exportName: 'MeshName',
        });
      }
    }
  }
}
