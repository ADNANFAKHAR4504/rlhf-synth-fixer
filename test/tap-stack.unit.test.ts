import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
    test('DevStack and ProdStack are created with correct configuration', () => {
    const app = new App();
    const tapStack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'dev',
    });

    const devStack = tapStack.node.tryFindChild('DevStack') as cdk.Stack;
    const prodStack = tapStack.node.tryFindChild('ProdStack') as cdk.Stack;

    const devTemplate = Template.fromStack(devStack);
    const prodTemplate = Template.fromStack(prodStack);


    devTemplate.resourceCountIs('AWS::ECS::Cluster', 1);
    prodTemplate.resourceCountIs('AWS::ECS::Cluster', 1);

    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.1.0.0/16',
    });
  });

  test('Defaults to dev environmentSuffix when not provided', () => {
    const app = new App();

    // No environmentSuffix passed
    const stack = new TapStack(app, 'DefaultEnvStack');

    // You can access internal nodes like child stacks
    const devStack = stack.node.tryFindChild('DevStack');
    expect(devStack).toBeDefined();

    const prodStack = stack.node.tryFindChild('ProdStack');
    expect(prodStack).toBeDefined();
  });
});
