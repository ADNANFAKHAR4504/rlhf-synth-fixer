import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { MultiEnvEcsStack } from '../lib/multienv-ecs-stack';

interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName: string;
  domainName: string;
}

const envConfig: EnvironmentConfig = {
  envName: 'dev',
  vpcCidr: '10.0.0.0/16',
  hostedZoneName: 'dummy.local',
  domainName: 'api.dummy.local',
};

describe.only('MultiEnvEcsStack', () => {
  let app: cdk.App;
  let stack: MultiEnvEcsStack;
  let template: Template;

  beforeEach(() => {

    app = new cdk.App();
    stack = new MultiEnvEcsStack(app, 'MultiEnvEcsStack', envConfig, { env: { account: '12345678', region: 'us-east-2' } });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a MultiEnvEcsStack instance', () => {
      expect(stack).toBeInstanceOf(MultiEnvEcsStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack).toBeDefined()
    });
    describe('ECS and Secret', () => {
      test('Check that ECS clusters were created', () => {
        template.resourceCountIs('AWS::ECS::Cluster', 1)
      });
      test('Check if SecretsManager Secret is created', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: '/dev/config',
        });
      });
      test('ECS TaskDefinition uses SecretsManager secret', () => {
        template.hasResourceProperties('AWS::ECS::TaskDefinition', Match.objectLike({
          Cpu: '256',
          Memory: '512',
          NetworkMode: "awsvpc",
          RequiresCompatibilities: ["FARGATE"],
        })
        );
      });
      test('ElasticLoadBalancingV2 exists', () => {
        template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      });
    });
  });
});
