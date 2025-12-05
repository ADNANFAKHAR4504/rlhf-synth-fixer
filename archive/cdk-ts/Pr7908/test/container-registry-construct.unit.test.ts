import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ContainerRegistryConstruct } from '../lib/container-registry-construct';

describe('ContainerRegistryConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let registry: ContainerRegistryConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    registry = new ContainerRegistryConstruct(stack, 'TestRegistry', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Construct is created successfully', () => {
    expect(registry).toBeDefined();
    expect(registry.repository).toBeDefined();
  });

  test('ECR Repository is created with correct name', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'cicd-app-test',
    });
  });

  test('Image scanning is enabled on push', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: {
        ScanOnPush: true,
      },
    });
  });

  test('Image tag mutability is IMMUTABLE', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageTagMutability: 'IMMUTABLE',
    });
  });

  test('Repository has removal policy DESTROY', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      EmptyOnDelete: true,
    });
  });

  test('Lifecycle policy removes untagged images after 1 day', () => {
    const resources = template.findResources('AWS::ECR::Repository');
    const repository = Object.values(resources)[0];
    const lifecyclePolicy = JSON.parse(
      repository.Properties.LifecyclePolicy.LifecyclePolicyText
    );

    const untaggedRule = lifecyclePolicy.rules.find(
      (r: any) => r.selection.tagStatus === 'untagged'
    );
    expect(untaggedRule).toBeDefined();
    expect(untaggedRule.selection.countNumber).toBe(1);
  });

  test('Lifecycle policy keeps only last 10 images', () => {
    const resources = template.findResources('AWS::ECR::Repository');
    const repository = Object.values(resources)[0];
    const lifecyclePolicy = JSON.parse(
      repository.Properties.LifecyclePolicy.LifecyclePolicyText
    );

    const anyRule = lifecyclePolicy.rules.find(
      (r: any) => r.selection.tagStatus === 'any'
    );
    expect(anyRule).toBeDefined();
    expect(anyRule.selection.countNumber).toBe(10);
  });

  test('Lifecycle rules have correct priorities', () => {
    const resources = template.findResources('AWS::ECR::Repository');
    const repository = Object.values(resources)[0];
    const lifecyclePolicy = JSON.parse(
      repository.Properties.LifecyclePolicy.LifecyclePolicyText
    );

    expect(lifecyclePolicy.rules).toHaveLength(2);

    // Rule 1: Untagged images (priority 1)
    expect(lifecyclePolicy.rules[0].rulePriority).toBe(1);
    expect(lifecyclePolicy.rules[0].selection.tagStatus).toBe('untagged');

    // Rule 2: Any tag (priority 2, highest for Any)
    expect(lifecyclePolicy.rules[1].rulePriority).toBe(2);
    expect(lifecyclePolicy.rules[1].selection.tagStatus).toBe('any');
    expect(lifecyclePolicy.rules[1].selection.countNumber).toBe(10);
  });

  test('Repository count is 1', () => {
    template.resourceCountIs('AWS::ECR::Repository', 1);
  });
});
