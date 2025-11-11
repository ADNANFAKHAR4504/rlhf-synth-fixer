import fs from 'fs';
import path from 'path';

type CloudFormationTemplate = {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Conditions: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
};

describe('TapStack CloudFormation Template', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');

    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template file not found at ${templatePath}. If your YAML is the source, run 'pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json' first.`,
      );
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  const getResource = (logicalId: string) => {
    const resource = template.Resources[logicalId];
    if (!resource) {
      throw new Error(`Resource ${logicalId} not found in template`);
    }
    return resource;
  };

  describe('Template metadata', () => {
    test('has the expected format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Production-ready Fintech Microservices on ECS Fargate with High Availability',
      );
    });

    test('defines all primary sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters and conditions', () => {
    test('EnvironmentName parameter defaults to fintech-prod', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('fintech-prod');
    });

    test('CreateSSMPlaceholders parameter constrains allowed values', () => {
      const param = template.Parameters.CreateSSMPlaceholders;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('certificate-related conditions are present', () => {
      // The current template defines a HasRealCertificate condition and
      // a CreateSSMPlaceholdersCondition. Older tests expected a
      // NoCertificate condition — the template uses the inverse of
      // HasRealCertificate instead, so only assert the currently
      // present conditions here.
      expect(template.Conditions.HasRealCertificate).toBeDefined();
      expect(template.Conditions.CreateSSMPlaceholdersCondition).toBeDefined();
    });
  });

  describe('ECS cluster and services', () => {
    test('ECSCluster enables container insights and capacity providers', () => {
      const cluster = getResource('ECSCluster');
      expect(cluster.Type).toBe('AWS::ECS::Cluster');

      const settings = cluster.Properties.ClusterSettings;
      expect(settings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Name: 'containerInsights',
            Value: 'enabled',
          }),
        ]),
      );

      expect(cluster.Properties.CapacityProviders).toEqual(
        expect.arrayContaining(['FARGATE', 'FARGATE_SPOT']),
      );

      expect(cluster.Properties.DefaultCapacityProviderStrategy).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            CapacityProvider: 'FARGATE',
            Weight: 80,
          }),
          expect.objectContaining({
            CapacityProvider: 'FARGATE_SPOT',
            Weight: 20,
          }),
        ]),
      );
    });

    test('ApiService runs in private subnets with awsvpc networking', () => {
      const service = getResource('ApiService');
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.DesiredCount).toBe(2);
      expect(service.Properties.LaunchType).toBe('FARGATE');

      const network = service.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(network.AssignPublicIp).toBe('DISABLED');
      expect(network.SecurityGroups).toEqual([
        { Ref: 'ECSTaskSecurityGroup' },
      ]);
      expect(network.Subnets).toEqual(
        expect.arrayContaining([
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' },
          { Ref: 'PrivateSubnet3' },
        ]),
      );

      expect(service.Properties.HealthCheckGracePeriodSeconds).toBe(300);
      expect(service.Properties.DeploymentConfiguration.MinimumHealthyPercent).toBe(0);
    });

    test('SchedulerService allows extended warm-up time', () => {
      const service = getResource('SchedulerService');
      expect(service.Properties.HealthCheckGracePeriodSeconds).toBe(600);
    });
  });

  describe('ECS task definitions', () => {
    test('ApiTaskDefinition exposes port 80 with awslogs enabled', () => {
      const task = getResource('ApiTaskDefinition');
      expect(task.Type).toBe('AWS::ECS::TaskDefinition');

      expect(task.Properties.RequiresCompatibilities).toEqual(['FARGATE']);
      expect(task.Properties.NetworkMode).toBe('awsvpc');
      expect(task.Properties.Cpu).toBe('1024');
      expect(task.Properties.Memory).toBe('2048');

      const container = task.Properties.ContainerDefinitions[0];
      expect(container.Name).toBe('api-container');
      expect(container.PortMappings).toEqual([
        expect.objectContaining({ ContainerPort: 80 }),
      ]);
      expect(container.HealthCheck.Command[1]).toContain('http://localhost:80/');
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');

      const awslogsOptions = container.LogConfiguration.Options || {};
      const awslogsGroup = awslogsOptions['awslogs-group'];

      if (awslogsGroup && awslogsGroup.Ref) {
        expect(awslogsGroup).toEqual({ Ref: 'ApiLogGroup' });
      } else {
        expect(awslogsGroup).toEqual({
          'Fn::If': [
            'CreateLogGroups',
            { Ref: 'ApiLogGroup' },
            { Ref: 'ExistingApiLogGroupName' },
          ],
        });
      }

      expect(awslogsOptions['awslogs-region']).toEqual({ Ref: 'AWS::Region' });
      expect(awslogsOptions['awslogs-stream-prefix']).toBe('api');

      expect(container.Secrets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Name: 'DATABASE_URL' }),
          expect.objectContaining({ Name: 'API_KEY' }),
        ]),
      );
    });

    test('Worker and scheduler task definitions also publish port 80', () => {
      const worker = getResource('WorkerTaskDefinition').Properties.ContainerDefinitions[0];
      const scheduler = getResource('SchedulerTaskDefinition').Properties.ContainerDefinitions[0];

      expect(worker.PortMappings[0].ContainerPort).toBe(80);
      expect(scheduler.PortMappings[0].ContainerPort).toBe(80);
    });
  });

  describe('Load balancer configuration', () => {
    test('Target groups use / health checks with 200-399 matcher', () => {
      const apiTargetGroup = getResource('ApiTargetGroup');
      const workerTargetGroup = getResource('WorkerTargetGroup');
      const schedulerTargetGroup = getResource('SchedulerTargetGroup');

      [apiTargetGroup, workerTargetGroup, schedulerTargetGroup].forEach(targetGroup => {
        expect(targetGroup.Properties.Port).toBe(80);
        expect(targetGroup.Properties.HealthCheckPath).toBe('/');
        expect(targetGroup.Properties.Matcher.HttpCode).toBe('200-399');
      });
    });

    test('Listener rules route to the expected paths', () => {
      const apiRule = getResource('ApiListenerRuleHTTP');
      const workerRule = getResource('WorkerListenerRuleHTTP');
      const schedulerRule = getResource('SchedulerListenerRuleHTTP');

      expect(apiRule.Properties.Conditions[0].PathPatternConfig.Values).toEqual(['/api/*']);
      expect(workerRule.Properties.Conditions[0].PathPatternConfig.Values).toEqual(['/admin/*']);
      expect(schedulerRule.Properties.Conditions[0].PathPatternConfig.Values).toEqual(['/webhooks/*']);
    });
  });

  describe('Auto scaling targets', () => {
    test('ApiScalingTarget resource ID uses service name placeholders', () => {
      const scalingTarget = getResource('ApiScalingTarget');
      const resourceId = scalingTarget.Properties.ResourceId['Fn::Sub'];
      expect(Array.isArray(resourceId)).toBe(true);
      const [pattern, variables] = resourceId as [string, Record<string, any>];
      expect(pattern).toBe('service/${ClusterName}/${ServiceName}');
      expect(variables.ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(variables.ServiceName).toEqual({ 'Fn::GetAtt': ['ApiService', 'Name'] });
    });

    test('WorkerScalingTarget mirrors the same pattern', () => {
      const scalingTarget = getResource('WorkerScalingTarget');
      const resourceId = scalingTarget.Properties.ResourceId['Fn::Sub'];
      const [pattern, variables] = resourceId as [string, Record<string, any>];
      expect(pattern).toBe('service/${ClusterName}/${ServiceName}');
      expect(variables.ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(variables.ServiceName).toEqual({ 'Fn::GetAtt': ['WorkerService', 'Name'] });
    });
  });

  describe('SSM placeholder parameters', () => {
    test('placeholder parameters are conditionally created', () => {
      const apiKeyParam = getResource('SSMApiKeyParameter');
      const workerTokenParam = getResource('SSMWorkerTokenParameter');

      [apiKeyParam, workerTokenParam].forEach(param => {
        expect(param.Condition).toBe('CreateSSMPlaceholdersCondition');
        expect(param.Type).toBe('AWS::SSM::Parameter');
      });
    });
  });

  describe('Outputs', () => {
    test('exports key identifiers for downstream stacks', () => {
      const expectedOutputs = [
        'VPCID',
        'ALBDNSName',
        'ECSClusterName',
        'ApiServiceArn',
        'WorkerServiceArn',
        'SchedulerServiceArn',
        'ServiceDiscoveryNamespace',
      ];

      expectedOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Export).toEqual(
          expect.objectContaining({
            Name: { 'Fn::Sub': expect.any(String) },
          }),
        );
      });
    });
  });
});
