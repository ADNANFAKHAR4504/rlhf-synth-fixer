import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT || '111111111111',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  };

  test('Creates DevStack with correct configuration', () => {
    const app = new App();
    const tapStack = new TapStack(app, 'TestDevStack', {
      environmentSuffix: 'dev',
      env,
    });

    const devStack = tapStack.node.tryFindChild('DevStack') as cdk.Stack;
    expect(devStack).toBeDefined();

    const devTemplate = Template.fromStack(devStack);
    devTemplate.resourceCountIs('AWS::ECS::Cluster', 1);
    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('Creates ProdStack with correct configuration', () => {
    process.env.MEMORY_LIMIT = '1024'; // required for config fallback
    const app = new App();
    const tapStack = new TapStack(app, 'TestProdStack', {
      environmentSuffix: 'prod',
      env,
    });

    const prodStack = tapStack.node.tryFindChild('ProdStack') as cdk.Stack;
    expect(prodStack).toBeDefined();

    const prodTemplate = Template.fromStack(prodStack);
    prodTemplate.resourceCountIs('AWS::ECS::Cluster', 1);
    prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.1.0.0/16',
    });
  });

  test('Defaults to dev environmentSuffix when not provided', () => {
    const app = new App();
    const stack = new TapStack(app, 'DefaultEnvStack', { env });

    const devStack = stack.node.tryFindChild('DevStack');
    expect(devStack).toBeDefined();
  });
});
