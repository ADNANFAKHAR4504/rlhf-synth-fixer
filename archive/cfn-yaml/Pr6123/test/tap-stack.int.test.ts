import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

type FlatOutputs = Record<string, string>;

type AwsCliArgs = string[];

type AwsCliResult<T = any> = T;

const outputsPath =
  process.env.CFN_OUTPUTS_PATH ||
  path.join(__dirname, '../cfn-outputs/flat-outputs.json');

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Outputs file not found at ${outputsPath}. Run ./scripts/get-outputs.sh after deploying the stack.`,
  );
}

const outputs: FlatOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentName ='fintech-prod';

const clusterName = outputs.ECSClusterName;

const serviceArns = [
  outputs.ApiServiceArn,
  outputs.WorkerServiceArn,
  outputs.SchedulerServiceArn,
].filter(Boolean) as string[];

const serviceNames = serviceArns.map(arn => arn.split('/').pop() || '').filter(Boolean);

const region =
  serviceArns[0]?.split(':')[3] ||
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'us-east-1';

if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = region;
}

const resourceIds = serviceNames.map(name => `service/${clusterName}/${name}`);

const ssmPrefix = outputs.SSMParameterPrefix || '/fintech/prod';

function runAwsCli<T = any>(args: AwsCliArgs, inputRegion: string): AwsCliResult<T> {
  const commandArgs = [...args];
  if (!commandArgs.includes('--region')) {
    commandArgs.push('--region', inputRegion);
  }
  commandArgs.push('--output', 'json');

  try {
    const output = execFileSync('aws', commandArgs, { encoding: 'utf8' });
    return JSON.parse(output) as T;
  } catch (error: any) {
    const stderr = error?.stderr?.toString() || '';
    const stdout = error?.stdout?.toString() || '';
    throw new Error(
      `AWS CLI command failed: aws ${commandArgs.join(' ')}\nstdout: ${stdout}\nstderr: ${stderr}\n` +
      'Ensure AWS CLI is installed, credentials are configured, and the resources exist.',
    );
  }
}

describe('TapStack CloudFormation integration (AWS CLI)', () => {
  describe('Deployment outputs', () => {
    const expectedKeys = [
      'ALBDNSName',
      'ServiceDiscoveryNamespace',
      'SchedulerServiceArn',
      'VPCID',
      'ECSClusterName',
      'WorkerServiceArn',
      'ApiServiceDiscoveryEndpoint',
      'ApiServiceArn',
      'WorkerServiceDiscoveryEndpoint',
      'SchedulerServiceDiscoveryEndpoint',
    ];

    test('includes required keys with values', () => {
      expectedKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    test('DNS name appears to be an AWS ALB', () => {
      expect(outputs.ALBDNSName).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
    });

    test('VPC identifier matches format', () => {
      expect(outputs.VPCID).toMatch(/^vpc-[0-9a-f]+$/);
    });

    test('Service discovery namespace matches environment', () => {
      expect(outputs.ServiceDiscoveryNamespace).toBe(`${environmentName}.local`);
    });
  });

  describe('ECS services', () => {
    let ecsResponse: any;

    beforeAll(() => {
      ecsResponse = runAwsCli<any>(
        ['ecs', 'describe-services', '--cluster', clusterName, '--services', ...serviceNames],
        region,
      );
    });

    test.each(serviceNames)(
      '%s is active with running tasks',
      service => {
        const details = ecsResponse.services?.find((svc: any) => svc.serviceName === service);
        expect(details).toBeDefined();
        expect(details.status).toBe('ACTIVE');
        expect(details.launchType).toBe('FARGATE');
        expect(details.runningCount).toBeGreaterThan(0);
        expect(details.desiredCount).toBeGreaterThan(0);
      },
    );
  });

  describe('Application Auto Scaling', () => {
    let scalingResponse: any;

    beforeAll(() => {
      scalingResponse = runAwsCli<any>(
        [
          'application-autoscaling',
          'describe-scalable-targets',
          '--service-namespace',
          'ecs',
          '--resource-ids',
          ...resourceIds,
        ],
        region,
      );
    });

    test.each(resourceIds)(
      '%s is registered as a scalable target',
      resourceId => {
        const target = scalingResponse.ScalableTargets?.find((entry: any) => entry.ResourceId === resourceId);
        expect(target).toBeDefined();
        expect(target.ScalableDimension).toBe('ecs:service:DesiredCount');
        expect(target.ServiceNamespace).toBe('ecs');
      },
    );
  });

  describe('Application Load Balancer', () => {
    let loadBalancerArn: string;

    test('ALB exists and is internet-facing', () => {
      const name = `${environmentName}-alb`;
      let response: any;

      try {
        response = runAwsCli<any>(
          ['elbv2', 'describe-load-balancers', '--names', name],
          region,
        );
      } catch (error) {
        response = runAwsCli<any>(
          ['elbv2', 'describe-load-balancers'],
          region,
        );
      }

      const lb = response.LoadBalancers?.find((entry: any) => entry.DNSName === outputs.ALBDNSName) || response.LoadBalancers?.[0];
      expect(lb).toBeDefined();
      expect(lb.Scheme).toBe('internet-facing');
      expect(lb.Type).toBe('application');
      expect(lb.State?.Code).toBe('active');
      expect((lb.AvailabilityZones || []).length).toBeGreaterThanOrEqual(2);
      loadBalancerArn = lb.LoadBalancerArn;
    });

    test('HTTP listener has expected rules', () => {
      const listeners = runAwsCli<any>(
        ['elbv2', 'describe-listeners', '--load-balancer-arn', loadBalancerArn],
        region,
      );

      const httpListener = listeners.Listeners?.find((entry: any) => entry.Port === 80 && entry.Protocol === 'HTTP');
      expect(httpListener).toBeDefined();

      const rules = runAwsCli<any>(
        ['elbv2', 'describe-rules', '--listener-arn', httpListener.ListenerArn],
        region,
      );

      const pathPatterns = new Set<string>();
      rules.Rules?.forEach((rule: any) => {
        rule.Conditions?.forEach((condition: any) => {
          condition.PathPatternConfig?.Values?.forEach((value: string) => pathPatterns.add(value));
        });
      });

      ['/api/*', '/admin/*', '/webhooks/*'].forEach(pattern => {
        expect(pathPatterns.has(pattern)).toBe(true);
      });
    });

    test('Target groups report healthy targets', () => {
      const targetGroupNames = [
        `${environmentName}-api-tg`,
        `${environmentName}-worker-tg`,
        `${environmentName}-scheduler-tg`,
      ];

      const targetGroups = runAwsCli<any>(
        ['elbv2', 'describe-target-groups', '--names', ...targetGroupNames],
        region,
      );

      targetGroupNames.forEach(name => {
        const group = targetGroups.TargetGroups?.find((entry: any) => entry.TargetGroupName === name);
        expect(group).toBeDefined();
        expect(group.Port).toBe(80);
        expect(group.HealthCheckPath).toBe('/');
        expect(group.Matcher?.HttpCode).toBe('200-399');

        const health = runAwsCli<any>(
          ['elbv2', 'describe-target-health', '--target-group-arn', group.TargetGroupArn],
          region,
        );

        const healthy = (health.TargetHealthDescriptions || []).filter(
          (entry: any) => entry.TargetHealth?.State === 'healthy',
        );
        expect(healthy.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AWS Cloud Map', () => {
    let namespaceId: string | undefined;

    beforeAll(() => {
      const namespaces = runAwsCli<any>(
        ['servicediscovery', 'list-namespaces'],
        region,
      );

      namespaceId = namespaces.Namespaces?.find(
        (entry: any) => entry.Name === outputs.ServiceDiscoveryNamespace,
      )?.Id;
    });

    test('namespace exists', () => {
      expect(namespaceId).toBeDefined();
    });

    test.each(['api', 'worker', 'scheduler'])(
      '%s service is registered',
      serviceName => {
        const response = runAwsCli<any>(
          [
            'servicediscovery',
            'list-services',
            '--filters',
            `Name=NAMESPACE_ID,Values=${namespaceId},Condition=EQ`,
          ],
          region,
        );

        const match = response.Services?.find((entry: any) => entry.Name === serviceName);
        expect(match).toBeDefined();
      },
    );
  });

  describe('CloudWatch Logs', () => {
    test('ECS log groups exist for each service', () => {
      const prefix = `/ecs/${environmentName}/`;
      const response = runAwsCli<any>(
        ['logs', 'describe-log-groups', '--log-group-name-prefix', prefix],
        region,
      );

      const logGroupNames = new Set((response.logGroups || []).map((group: any) => group.logGroupName));
      [`/ecs/${environmentName}/api-service`, `/ecs/${environmentName}/worker-service`, `/ecs/${environmentName}/scheduler-service`].forEach(
        name => {
          expect(logGroupNames.has(name)).toBe(true);
        },
      );
    });
  });

  describe('SSM parameters', () => {
    const parameterNames = [
      `${ssmPrefix}/api-key`,
      `${ssmPrefix}/worker-token`,
      `${ssmPrefix}/scheduler-token`,
      `${ssmPrefix}/database-url`,
    ];

    test('placeholder parameters exist in SSM', () => {
      const response = runAwsCli<any>(
        ['ssm', 'get-parameters', '--names', ...parameterNames, '--with-decryption'],
        region,
      );

      const found = new Set((response.Parameters || []).map((param: any) => param.Name));
      parameterNames.forEach(name => {
        expect(found.has(name)).toBe(true);
      });
    });
  });
});
