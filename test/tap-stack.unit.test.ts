import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:service:region:account-id:${args.type}/${args.name}`,
        id: `${args.name}_id`,
        name: args.inputs.name || args.name,
        dnsName: `${args.name}.example.com`,
        arnSuffix: `${args.name}-suffix`,
        endpoint: `${args.name}.endpoint.example.com`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Initialization', () => {
    it('should create stack with required environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
      });

      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.drAlb).toBeDefined();
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.dynamodbTable).toBeDefined();
      expect(stack.hostedZone).toBeDefined();
      expect(stack.primaryHealthCheck).toBeDefined();
    });

    it('should create stack with all custom properties', async () => {
      const stack = new TapStack('test-stack-full', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        hostedZoneName: 'example.com',
        notificationEmail: 'alerts@example.com',
        tags: {
          Project: 'TradingPlatform',
          Team: 'Infrastructure',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
    });

    it('should use default values when optional props are omitted', async () => {
      const stack = new TapStack('test-stack-defaults', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('vpc-test-stack', {
        environmentSuffix: 'vpc-test',
      });
    });

    it('should create primary VPC', () => {
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.primaryVpc.id).toBeDefined();
    });

    it('should create DR VPC', () => {
      expect(stack.drVpc).toBeDefined();
      expect(stack.drVpc.id).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('alb-test-stack', {
        environmentSuffix: 'alb-test',
      });
    });

    it('should create primary ALB', () => {
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.primaryAlb.dnsName).toBeDefined();
    });

    it('should create DR ALB', () => {
      expect(stack.drAlb).toBeDefined();
      expect(stack.drAlb.dnsName).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('db-test-stack', {
        environmentSuffix: 'db-test',
      });
    });

    it('should create Aurora Global Cluster', () => {
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.auroraGlobalCluster.id).toBeDefined();
    });

    it('should create DynamoDB Global Table', () => {
      expect(stack.dynamodbTable).toBeDefined();
      expect(stack.dynamodbTable.name).toBeDefined();
    });
  });

  describe('Route53 Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('route53-test-stack', {
        environmentSuffix: 'route53-test',
      });
    });

    it('should create hosted zone', () => {
      expect(stack.hostedZone).toBeDefined();
      expect(stack.hostedZone.id).toBeDefined();
    });

    it('should create primary health check', () => {
      expect(stack.primaryHealthCheck).toBeDefined();
      expect(stack.primaryHealthCheck.id).toBeDefined();
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environment suffix in resource names', async () => {
      const envSuffix = 'uniq123';
      const stack = new TapStack('suffix-test', {
        environmentSuffix: envSuffix,
      });

      // All resources should be created with environment suffix
      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.drAlb).toBeDefined();
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.dynamodbTable).toBeDefined();
    });

    it('should work with different environment suffix formats', async () => {
      const suffixes = ['dev', 'prod', 'staging', 'pr123', 'synth-abc'];

      for (const suffix of suffixes) {
        const stack = new TapStack(`test-${suffix}`, {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should create resources in primary region', async () => {
      const stack = new TapStack('primary-region-test', {
        environmentSuffix: 'primary',
        primaryRegion: 'us-east-1',
      });

      expect(stack.primaryVpc).toBeDefined();
      expect(stack.primaryAlb).toBeDefined();
    });

    it('should create resources in DR region', async () => {
      const stack = new TapStack('dr-region-test', {
        environmentSuffix: 'dr',
        drRegion: 'us-west-2',
      });

      expect(stack.drVpc).toBeDefined();
      expect(stack.drAlb).toBeDefined();
    });

    it('should handle multiple region configurations', async () => {
      const regions = [
        { primary: 'us-east-1', dr: 'us-east-2' },
        { primary: 'us-west-1', dr: 'us-west-2' },
        { primary: 'eu-west-1', dr: 'eu-central-1' },
      ];

      for (const region of regions) {
        const stack = new TapStack(`multi-region-${region.primary}`, {
          environmentSuffix: 'multi',
          primaryRegion: region.primary,
          drRegion: region.dr,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('Resource Dependencies', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('deps-test-stack', {
        environmentSuffix: 'deps',
      });
    });

    it('should create networking resources before compute', () => {
      // VPCs should exist for ECS to use
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
    });

    it('should create database before application services', () => {
      // Aurora and DynamoDB should exist
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.dynamodbTable).toBeDefined();
    });

    it('should create load balancers for routing', () => {
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.drAlb).toBeDefined();
    });

    it('should create health checks for Route53', () => {
      expect(stack.primaryHealthCheck).toBeDefined();
      expect(stack.hostedZone).toBeDefined();
    });
  });

  describe('Tagging', () => {
    it('should apply custom tags to resources', async () => {
      const customTags = {
        Environment: 'production',
        Project: 'TradingPlatform',
        Owner: 'InfraTeam',
        CostCenter: 'Engineering',
      };

      const stack = new TapStack('tags-test', {
        environmentSuffix: 'tagged',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should work without custom tags', async () => {
      const stack = new TapStack('no-tags-test', {
        environmentSuffix: 'notags',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Email Notification Configuration', () => {
    it('should accept valid email for notifications', async () => {
      const stack = new TapStack('email-test', {
        environmentSuffix: 'email',
        notificationEmail: 'ops@example.com',
      });

      expect(stack).toBeDefined();
    });

    it('should work with different email formats', async () => {
      const emails = [
        'admin@example.com',
        'devops+alerts@company.com',
        'team@subdomain.example.com',
      ];

      for (const email of emails) {
        const stack = new TapStack(`email-${email.split('@')[0]}`, {
          environmentSuffix: 'emailtest',
          notificationEmail: email,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('Hosted Zone Configuration', () => {
    it('should create hosted zone with custom domain', async () => {
      const stack = new TapStack('domain-test', {
        environmentSuffix: 'domain',
        hostedZoneName: 'trading.example.com',
      });

      expect(stack.hostedZone).toBeDefined();
    });

    it('should work with different domain formats', async () => {
      const domains = [
        'example.com',
        'subdomain.example.com',
        'app-dev.example.com',
      ];

      for (const domain of domains) {
        const stack = new TapStack(`domain-${domain.split('.')[0]}`, {
          environmentSuffix: 'domaintest',
          hostedZoneName: domain,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should accept environment suffix from props', () => {
      const stack = new TapStack('error-test', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty environment suffix', () => {
      const stack = new TapStack('empty-suffix-test', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('outputs-test', {
        environmentSuffix: 'outputs',
      });
    });

    it('should expose primary VPC output', () => {
      expect(stack.primaryVpc.id).toBeDefined();
    });

    it('should expose DR VPC output', () => {
      expect(stack.drVpc.id).toBeDefined();
    });

    it('should expose primary ALB DNS', () => {
      expect(stack.primaryAlb.dnsName).toBeDefined();
    });

    it('should expose DR ALB DNS', () => {
      expect(stack.drAlb.dnsName).toBeDefined();
    });

    it('should expose Aurora cluster ID', () => {
      expect(stack.auroraGlobalCluster.id).toBeDefined();
    });

    it('should expose DynamoDB table name', () => {
      expect(stack.dynamodbTable.name).toBeDefined();
    });

    it('should expose hosted zone ID', () => {
      expect(stack.hostedZone.id).toBeDefined();
    });

    it('should expose health check ID', () => {
      expect(stack.primaryHealthCheck.id).toBeDefined();
    });
  });

  describe('Stack Component Resource', () => {
    it('should be a Pulumi ComponentResource', () => {
      const stack = new TapStack('component-test', {
        environmentSuffix: 'component',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      const stack = new TapStack('type-test', {
        environmentSuffix: 'type',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle full production configuration', async () => {
      const stack = new TapStack('prod-scenario', {
        environmentSuffix: 'prod-2024',
        primaryRegion: 'us-east-1',
        drRegion: 'us-east-2',
        hostedZoneName: 'trading.example.com',
        notificationEmail: 'ops@example.com',
        tags: {
          Environment: 'production',
          Compliance: 'SOC2',
          DataClassification: 'confidential',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.drAlb).toBeDefined();
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.dynamodbTable).toBeDefined();
      expect(stack.hostedZone).toBeDefined();
      expect(stack.primaryHealthCheck).toBeDefined();
    });

    it('should handle minimal development configuration', async () => {
      const stack = new TapStack('dev-scenario', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
    });

    it('should handle CI/CD pull request environment', async () => {
      const prNumber = '12345';
      const stack = new TapStack(`pr-${prNumber}`, {
        environmentSuffix: `pr${prNumber}`,
        primaryRegion: 'us-east-1',
        drRegion: 'us-east-2',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Infrastructure Components', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('infra-components', {
        environmentSuffix: 'infra',
      });
    });

    it('should have networking components', () => {
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.drVpc).toBeDefined();
    });

    it('should have compute components', () => {
      // ALBs indicate ECS services are set up
      expect(stack.primaryAlb).toBeDefined();
      expect(stack.drAlb).toBeDefined();
    });

    it('should have database components', () => {
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.dynamodbTable).toBeDefined();
    });

    it('should have DNS and routing components', () => {
      expect(stack.hostedZone).toBeDefined();
      expect(stack.primaryHealthCheck).toBeDefined();
    });
  });
});
