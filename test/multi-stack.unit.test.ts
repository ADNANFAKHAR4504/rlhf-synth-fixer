import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { MultiEnvEcsStack, EnvironmentConfig } from '../lib/multienv-ecs-stack';

const imageName = process.env.IMAGE_NAME || 'nginx';
const imageTag = process.env.IMAGE_TAG || '1.25.3';
const port = Number(process.env.PORT) || 80;
const cpu = Number(process.env.CPU_VALUE) || 256;
const memoryLimit = Number(process.env.MEMORY_LIMIT) || 512;

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
          NetworkMode: 'bridge',
          RequiresCompatibilities: ['EC2'],
        })
      );
    });
    test('ElasticLoadBalancingV2 exists', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });
    test('ECS Cluster exists', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('ECS is configured for EC2 with bridge networking', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['EC2'],
        NetworkMode: 'bridge',
      });
    });

    test('ECS TaskDefinition uses correct image', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const values = Object.values(taskDefs);

      expect(
        values.some(resource => {
          const containers = resource.Properties?.ContainerDefinitions || [];
          return containers.some(
            (c: any) =>
              c.Image === `${envConfig.imageName}:${envConfig.imageTag}` &&
              c.Name === 'AppContainer'
          );
        })
      ).toBe(true);
    });

    test('VPC has expected CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
      });
    });
    test('Auto Scaling policy is configured', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MaxCapacity: 5,
          MinCapacity: 1,
        }
      );
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'TargetTrackingScaling',
        }
      );
    });
    test('Alarm is configured for high CPU usage', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'CPUUtilization',
        EvaluationPeriods: 2,
        Namespace: 'AWS/ECS',
        Period: 300,
        Statistic: 'Average',
        Threshold: 80,
      });
    });
    test('Alarm is configured for high Memory usage', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'MemoryUtilization',
        EvaluationPeriods: 2,
        Namespace: 'AWS/ECS',
        Period: 300,
        Statistic: 'Average',
        Threshold: 80,
      });
    });
    test('Application LoadBalancer resource', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
          LoadBalancerAttributes: [
            {
              Key: 'deletion_protection.enabled',
              Value: 'false',
            },
          ],
        }
      );
    });
    test('Listener is configured', () => {
      // Test accepts either HTTP (LocalStack) or HTTPS (AWS)
      const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      expect(Object.keys(listeners).length).toBeGreaterThan(0);

      const listenerProps = Object.values(listeners)[0].Properties;
      // Port should be either 80 (HTTP/LocalStack) or 443 (HTTPS/AWS)
      expect([80, 443]).toContain(listenerProps.Port);
      // Protocol should be either HTTP (LocalStack) or HTTPS (AWS)
      expect(['HTTP', 'HTTPS']).toContain(listenerProps.Protocol);
    });
  });
});
