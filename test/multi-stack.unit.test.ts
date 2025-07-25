import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { MultiEnvEcsStack, EnvironmentConfig } from '../lib/multienv-ecs-stack';

const imageName = process.env.IMAGE_NAME || 'nginx';
const imageTag = process.env.IMAGE_TAG || '1.25.3';
const port = Number(process.env.PORT) || 80;
const cpu = Number(process.env.CPU_VALUE) || 256;
const memoryLimit = Number(process.env.MEMORY_Limit) || 512;

export const envConfig: EnvironmentConfig = {
  envName: 'dev',
  vpcCidr: '10.0.0.0/16',
  hostedZoneName: 'dummy.local',
  domainName: 'api.dummy.local',
  imageName,
  imageTag,
  port,
  cpu,
  memoryLimit,
};

describe('MultiEnvEcsStack', () => {
  let app: cdk.App;
  let stack: MultiEnvEcsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MultiEnvEcsStack(app, 'MultiEnvEcsStack', envConfig, {
      env: { account: '12345678', region: 'us-east-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a MultiEnvEcsStack instance', () => {
      expect(stack).toBeInstanceOf(MultiEnvEcsStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack).toBeDefined();
    });
  });
  describe('ECS and StringParameter', () => {
    test('Check that ECS clusters were created', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });
    test('StringParameter is created', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/config',
        Type: 'String',
      });
    });
    test('ECS TaskDefinition uses Secure StringParameter', () => {
      template.hasResourceProperties(
        'AWS::ECS::TaskDefinition',
        Match.objectLike({
          Cpu: '256',
          Memory: '512',
          NetworkMode: 'awsvpc',
          RequiresCompatibilities: ['FARGATE'],
        })
      );
    });
    test('ElasticLoadBalancingV2 exists', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });
  });
});
