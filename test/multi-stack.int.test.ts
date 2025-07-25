// Configuration - These are coming from cdk.out after cdk deploy
import fs from 'fs';
import path from 'path';
import { Template } from 'aws-cdk-lib/assertions';
import { envConfig } from './multi-stack.unit.test';

const devTemplatePath = path.join(
  __dirname,
  '../cdk.out/TapStackdevDevStack61761F1B.template.json'
);
const devTemplate = Template.fromJSON(
  JSON.parse(fs.readFileSync(devTemplatePath, 'utf8'))
);

const prodTemplatePath = path.join(
  __dirname,
  '../cdk.out/TapStackdevProdStack5264F15D.template.json'
);
const prodTemplate = Template.fromJSON(
  JSON.parse(fs.readFileSync(prodTemplatePath, 'utf8'))
);

describe('DevStack Integration Tests', () => {
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
      CidrBlock: '10.0.0.0/16',
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

/**
 *
 */

describe('ProdStack Integration Tests', () => {
  test('ECS Cluster exists', () => {
    prodTemplate.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  test('ECS is configured for Fargate with awsvpc networking', () => {
    prodTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
      RequiresCompatibilities: ['FARGATE'],
      NetworkMode: 'awsvpc',
    });
  });

  test('ECS TaskDefinition uses correct image', () => {
    const taskDefs = prodTemplate.findResources('AWS::ECS::TaskDefinition');
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
    prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.1.0.0/16',
    });
  });
  test('Auto Scaling policy is configured', () => {
    prodTemplate.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalableTarget',
      {
        MaxCapacity: 10,
        MinCapacity: 2,
      }
    );
    prodTemplate.hasResourceProperties(
      'AWS::ApplicationAutoScaling::ScalingPolicy',
      {
        PolicyType: 'TargetTrackingScaling',
      }
    );
  });
  test('Alarm is configured for high CPU usage', () => {
    prodTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
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
    prodTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      MetricName: 'MemoryUtilization',
      EvaluationPeriods: 2,
      Namespace: 'AWS/ECS',
      Period: 300,
      Statistic: 'Average',
      Threshold: 80,
    });
  });
});
