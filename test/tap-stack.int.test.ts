import { App, Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';
import 'cdktf/lib/testing/adapters/jest'; // Includes jest matchers
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

describe('WebApp Infrastructure Pre-Deployment Checks', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const testEnvironments: EnvironmentConfig[] = [
    {
      envName: 'dev',
      awsRegion: 'us-east-1',
      instanceType: 't3.micro',
      vpcCidr: '10.10.0.0/16',
      tags: { Environment: 'Development', Project: 'WebApp' },
    },
    {
      envName: 'staging',
      awsRegion: 'us-east-1',
      instanceType: 't3.small',
      vpcCidr: '10.20.0.0/16',
      tags: { Environment: 'Staging', Project: 'WebApp' },
    },
    {
      envName: 'prod',
      awsRegion: 'us-east-1',
      instanceType: 't3.medium',
      vpcCidr: '10.30.0.0/16',
      tags: { Environment: 'Production', Project: 'WebApp' },
    },
  ];

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'unified-webapp-stack-test', {
      environments: testEnvironments,
    });
    synthesized = Testing.synth(stack);
  });

  test('should create a VPC for each environment', () => {
    Testing.toHaveResourceWithProperties(synthesized, Vpc.tfResourceType, {
      cidr_block: '10.10.0.0/16',
      tags: { Environment: 'Development', Project: 'WebApp' },
    });
    Testing.toHaveResourceWithProperties(synthesized, Vpc.tfResourceType, {
      cidr_block: '10.20.0.0/16',
      tags: { Environment: 'Staging', Project: 'WebApp' },
    });
    Testing.toHaveResourceWithProperties(synthesized, Vpc.tfResourceType, {
      cidr_block: '10.30.0.0/16',
      tags: { Environment: 'Production', Project: 'WebApp' },
    });
  });

  test('should configure correct instance types for each environment', () => {
    Testing.toHaveResourceWithProperties(synthesized, Instance.tfResourceType, {
      instance_type: 't3.micro',
      tags: { Environment: 'Development' },
    });
    Testing.toHaveResourceWithProperties(synthesized, Instance.tfResourceType, {
      instance_type: 't3.small',
      tags: { Environment: 'Staging' },
    });
    Testing.toHaveResourceWithProperties(synthesized, Instance.tfResourceType, {
      instance_type: 't3.medium',
      tags: { Environment: 'Production' },
    });
  });

  test('should create a CloudWatch Log Group for each environment', () => {
    Testing.toHaveResourceWithProperties(
      synthesized,
      CloudwatchLogGroup.tfResourceType,
      {
        retention_in_days: 14,
        tags: { Environment: 'Development' },
      }
    );
    Testing.toHaveResourceWithProperties(
      synthesized,
      CloudwatchLogGroup.tfResourceType,
      {
        retention_in_days: 14,
        tags: { Environment: 'Staging' },
      }
    );
    Testing.toHaveResourceWithProperties(
      synthesized,
      CloudwatchLogGroup.tfResourceType,
      {
        retention_in_days: 14,
        tags: { Environment: 'Production' },
      }
    );
  });

  // Route53 Health Check removed for LocalStack compatibility (Pro-only feature)
});
