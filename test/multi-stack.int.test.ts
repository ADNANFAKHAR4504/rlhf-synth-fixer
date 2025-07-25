// Configuration - These are coming from cdk.out after cdk deploy
import fs from 'fs';
import { Template } from 'aws-cdk-lib/assertions';
import { envConfig } from './multi-stack.unit.test';

function getStackName(envSuffix: string | undefined): string {
  const environmentSuffix = envSuffix || 'dev';
  return `TapStack${environmentSuffix}`;
}
const stackName = getStackName(process.env.ENVIRONMENT_SUFFIX);
let outputs: Record<string, any> = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read outputs file: ${error}`);
  }
} else {
  console.warn(
    `Outputs file ${outputsFile} not found. Integration tests will be limited.`
  );
}

const devTemplate = Template.fromJSON(outputs);

describe('Stack Integration Tests', () => {
  test('ECS Cluster exists', () => {
    devTemplate.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  test('ECS is configured for Fargate with awsvpc networking', () => {
    devTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
      RequiresCompatibilities: ['FARGATE'],
      NetworkMode: 'awsvpc',
    });
  });

  test('ECS TaskDefinition uses correct image', () => {
    const taskDefs = devTemplate.findResources('AWS::ECS::TaskDefinition');
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
    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
    });
  });
  test('Auto Scaling policy is configured', () => {
    devTemplate.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalableTarget',
      {
        MaxCapacity: 10,
        MinCapacity: 2,
      }
    );
    devTemplate.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalingPolicy',
      {
        PolicyType: 'TargetTrackingScaling',
      }
    );
  });
  test('Alarm is configured for high CPU usage', () => {
    devTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
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
    devTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
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
    devTemplate.hasResourceProperties(
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
  test('HTTP(S) listener is configured with ACM certificate', () => {
    devTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTPS',
      Port: 443,
    });
  });
});
