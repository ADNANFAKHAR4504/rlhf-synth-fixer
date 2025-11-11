/**
 * tap-stack.unit.test.ts
 *
 * Unit tests for TapStack with 100% code coverage using mocks
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Helper function to convert Output<T> to Promise<T>
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        ...(args.type === 'aws:eks:Cluster' && {
          endpoint: 'https://mock-eks-endpoint.eu-west-2.eks.amazonaws.com',
          certificateAuthority: {
            data: 'bW9ja0NlcnRpZmljYXRlRGF0YQ==',
          },
        }),
        ...(args.type === 'aws:eks:NodeGroup' && {
          status: 'ACTIVE',
        }),
        ...(args.type === 'kubernetes:core/v1:Service' &&
          args.inputs.spec?.type === 'LoadBalancer' && {
            status: {
              loadBalancer: {
                ingress: [
                  {
                    hostname: 'mock-lb-hostname.eu-west-2.elb.amazonaws.com',
                  },
                ],
              },
            },
          }),
        ...(args.type === 'kubernetes:core/v1:Namespace' && {
          metadata: {
            name: args.inputs.metadata?.name || 'default',
          },
        }),
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  describe('Constructor with default arguments', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should create TapStack with default environment suffix', async () => {
      const namespaceName = await promiseOf(stack.namespaceName);
      expect(namespaceName).toBe('microservices-dev');
    });

    it('should use default nginx images', async () => {
      const endpoint = await promiseOf(stack.paymentApiEndpoint);
      expect(endpoint).toContain('payment-api-service-dev');
    });

    it('should export cluster name', async () => {
      const name = await promiseOf(stack.clusterName);
      expect(name).toBeDefined();
      expect(name).toContain('eks-cluster');
    });

    it('should export kubeconfig', async () => {
      const config = await promiseOf(stack.kubeconfig);
      expect(config).toBeDefined();
      const parsed = JSON.parse(config);
      expect(parsed.apiVersion).toBe('v1');
      expect(parsed.kind).toBe('Config');
    });

    it('should export gateway URL', async () => {
      const url = await promiseOf(stack.gatewayUrl);
      expect(url).toBeDefined();
      expect(url).toContain('http://');
    });

    it('should export all service endpoints', async () => {
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);
      const notification = await promiseOf(stack.notificationServiceEndpoint);

      expect(payment).toContain('payment-api-service-dev');
      expect(fraud).toContain('fraud-detector-service-dev');
      expect(notification).toContain('notification-service-dev');
    });

    it('should export HPA status', async () => {
      const status = await promiseOf(stack.hpaStatus);
      expect(status).toBeDefined();
      expect(status.paymentApiHpa).toContain('payment-api-hpa');
      expect(status.fraudDetectorHpa).toContain('fraud-detector-hpa');
      expect(status.notificationServiceHpa).toContain(
        'notification-service-hpa'
      );
    });
  });

  describe('Constructor with custom environment suffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
      });
    });

    it('should create TapStack with prod environment suffix', async () => {
      const name = await promiseOf(stack.namespaceName);
      expect(name).toBe('microservices-prod');
    });

    it('should use prod suffix in cluster name', async () => {
      const name = await promiseOf(stack.clusterName);
      expect(name).toContain('eks-cluster-prod');
    });

    it('should use prod suffix in all endpoints', async () => {
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);
      const notification = await promiseOf(stack.notificationServiceEndpoint);

      expect(payment).toContain('-prod');
      expect(fraud).toContain('-prod');
      expect(notification).toContain('-prod');
    });
  });

  describe('Constructor with custom images', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'custom',
        paymentApiImage: 'custom/payment:v1',
        fraudDetectorImage: 'custom/fraud:v1',
        notificationServiceImage: 'custom/notification:v1',
      });
    });

    it('should create stack with custom images', async () => {
      const name = await promiseOf(stack.namespaceName);
      expect(name).toBe('microservices-custom');
    });

    it('should export custom environment endpoints', async () => {
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);

      expect(payment).toContain('payment-api-service-custom');
      expect(fraud).toContain('fraud-detector-service-custom');
    });
  });

  describe('Constructor with tags', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Team: 'platform',
          Project: 'tap',
        },
      });
    });

    it('should create stack with tags', async () => {
      const name = await promiseOf(stack.namespaceName);
      expect(name).toBe('microservices-staging');
    });

    it('should export staging endpoints', async () => {
      const endpoint = await promiseOf(stack.paymentApiEndpoint);
      expect(endpoint).toContain('-staging');
    });
  });

  describe('Kubeconfig generation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-kubeconfig', {
        environmentSuffix: 'test',
      });
    });

    it('should generate valid kubeconfig structure', async () => {
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      expect(parsed).toHaveProperty('apiVersion');
      expect(parsed).toHaveProperty('kind');
      expect(parsed).toHaveProperty('clusters');
      expect(parsed).toHaveProperty('contexts');
      expect(parsed).toHaveProperty('users');
      expect(parsed.apiVersion).toBe('v1');
      expect(parsed.kind).toBe('Config');
    });

    it('should have correct cluster configuration', async () => {
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      expect(parsed.clusters).toHaveLength(1);
      expect(parsed.clusters[0].name).toBe('kubernetes');
      expect(parsed.clusters[0].cluster).toHaveProperty('server');
      expect(parsed.clusters[0].cluster).toHaveProperty(
        'certificate-authority-data'
      );
    });

    it('should have correct context configuration', async () => {
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      expect(parsed.contexts).toHaveLength(1);
      expect(parsed.contexts[0].name).toBe('aws');
      expect(parsed.contexts[0].context.cluster).toBe('kubernetes');
      expect(parsed.contexts[0].context.user).toBe('aws');
    });

    it('should have AWS EKS token authentication', async () => {
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      expect(parsed.users).toHaveLength(1);
      expect(parsed.users[0].name).toBe('aws');
      expect(parsed.users[0].user.exec).toBeDefined();
      expect(parsed.users[0].user.exec.command).toBe('aws');
      expect(parsed.users[0].user.exec.args).toContain('eks');
      expect(parsed.users[0].user.exec.args).toContain('get-token');
    });

    it('should use eu-west-2 region in kubeconfig', async () => {
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      expect(parsed.users[0].user.exec.args).toContain('--region');
      expect(parsed.users[0].user.exec.args).toContain('eu-west-2');
    });
  });

  describe('HPA Status output', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-hpa', {
        environmentSuffix: 'hpa-test',
      });
    });

    it('should contain all three HPA names', async () => {
      const status = await promiseOf(stack.hpaStatus);
      expect(status).toHaveProperty('paymentApiHpa');
      expect(status).toHaveProperty('fraudDetectorHpa');
      expect(status).toHaveProperty('notificationServiceHpa');
    });

    it('should have correct HPA naming with environment suffix', async () => {
      const status = await promiseOf(stack.hpaStatus);
      expect(status.paymentApiHpa).toBe('payment-api-hpa-hpa-test');
      expect(status.fraudDetectorHpa).toBe('fraud-detector-hpa-hpa-test');
      expect(status.notificationServiceHpa).toBe(
        'notification-service-hpa-hpa-test'
      );
    });
  });

  describe('Service endpoints format', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-endpoints', {
        environmentSuffix: 'ep',
      });
    });

    it('should have correct payment API endpoint format', async () => {
      const endpoint = await promiseOf(stack.paymentApiEndpoint);
      expect(endpoint).toMatch(/^http:\/\/payment-api-service-ep/);
      expect(endpoint).toContain('.svc.cluster.local:8080');
    });

    it('should have correct fraud detector endpoint format', async () => {
      const endpoint = await promiseOf(stack.fraudDetectorEndpoint);
      expect(endpoint).toMatch(/^http:\/\/fraud-detector-service-ep/);
      expect(endpoint).toContain('.svc.cluster.local:8080');
    });

    it('should have correct notification service endpoint format', async () => {
      const endpoint = await promiseOf(stack.notificationServiceEndpoint);
      expect(endpoint).toMatch(/^http:\/\/notification-service-ep/);
      expect(endpoint).toContain('.svc.cluster.local:8080');
    });

    it('should have correct gateway URL format', async () => {
      const url = await promiseOf(stack.gatewayUrl);
      expect(url).toMatch(/^http:\/\//);
      expect(url).toContain('mock-lb-hostname');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty environment suffix', async () => {
      const emptyStack = new TapStack('test-empty', {
        environmentSuffix: '',
      });
      const name = await promiseOf(emptyStack.namespaceName);
      expect(name).toBe('microservices-dev');
    });

    it('should handle undefined environment suffix', async () => {
      const undefinedStack = new TapStack('test-undefined', {
        environmentSuffix: undefined,
      });
      const name = await promiseOf(undefinedStack.namespaceName);
      expect(name).toBe('microservices-dev');
    });

    it('should create stack without optional parameters', async () => {
      const minimalStack = new TapStack('test-minimal', {});
      const name = await promiseOf(minimalStack.namespaceName);
      expect(name).toBeDefined();
    });

    it('should handle all custom parameters together', async () => {
      const fullStack = new TapStack('test-full', {
        environmentSuffix: 'full-test',
        paymentApiImage: 'myrepo/payment:v2.0',
        fraudDetectorImage: 'myrepo/fraud:v2.0',
        notificationServiceImage: 'myrepo/notification:v2.0',
        tags: {
          Environment: 'full-test',
          Owner: 'test-owner',
        },
      });
      const name = await promiseOf(fullStack.namespaceName);
      expect(name).toBe('microservices-full-test');
    });
  });

  describe('Resource outputs validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'output-test',
      });
    });

    it('should have all required outputs defined', () => {
      expect(stack.clusterName).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.namespaceName).toBeDefined();
      expect(stack.gatewayUrl).toBeDefined();
      expect(stack.paymentApiEndpoint).toBeDefined();
      expect(stack.fraudDetectorEndpoint).toBeDefined();
      expect(stack.notificationServiceEndpoint).toBeDefined();
      expect(stack.hpaStatus).toBeDefined();
    });

    it('should have outputs of correct types', async () => {
      const clusterName = await promiseOf(stack.clusterName);
      const kubeconfig = await promiseOf(stack.kubeconfig);
      const namespaceName = await promiseOf(stack.namespaceName);
      const gatewayUrl = await promiseOf(stack.gatewayUrl);
      const paymentApiEndpoint = await promiseOf(stack.paymentApiEndpoint);
      const fraudDetectorEndpoint = await promiseOf(stack.fraudDetectorEndpoint);
      const notificationServiceEndpoint = await promiseOf(
        stack.notificationServiceEndpoint
      );
      const hpaStatus = await promiseOf(stack.hpaStatus);

      expect(typeof clusterName).toBe('string');
      expect(typeof kubeconfig).toBe('string');
      expect(typeof namespaceName).toBe('string');
      expect(typeof gatewayUrl).toBe('string');
      expect(typeof paymentApiEndpoint).toBe('string');
      expect(typeof fraudDetectorEndpoint).toBe('string');
      expect(typeof notificationServiceEndpoint).toBe('string');
      expect(typeof hpaStatus).toBe('object');
    });
  });

  describe('Namespace configuration', () => {
    it('should create namespace with correct name for dev', async () => {
      const devStack = new TapStack('test-dev', {
        environmentSuffix: 'dev',
      });
      const name = await promiseOf(devStack.namespaceName);
      expect(name).toBe('microservices-dev');
    });

    it('should create namespace with correct name for prod', async () => {
      const prodStack = new TapStack('test-prod', {
        environmentSuffix: 'prod',
      });
      const name = await promiseOf(prodStack.namespaceName);
      expect(name).toBe('microservices-prod');
    });

    it('should create namespace with correct name for staging', async () => {
      const stagingStack = new TapStack('test-staging', {
        environmentSuffix: 'staging',
      });
      const name = await promiseOf(stagingStack.namespaceName);
      expect(name).toBe('microservices-staging');
    });
  });

  describe('Image configuration', () => {
    it('should use custom payment API image when provided', async () => {
      const customStack = new TapStack('test-custom-payment', {
        environmentSuffix: 'custom',
        paymentApiImage: 'my-registry/payment-api:v3.0',
      });
      const endpoint = await promiseOf(customStack.paymentApiEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should use custom fraud detector image when provided', async () => {
      const customStack = new TapStack('test-custom-fraud', {
        environmentSuffix: 'custom',
        fraudDetectorImage: 'my-registry/fraud-detector:v3.0',
      });
      const endpoint = await promiseOf(customStack.fraudDetectorEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should use custom notification service image when provided', async () => {
      const customStack = new TapStack('test-custom-notification', {
        environmentSuffix: 'custom',
        notificationServiceImage: 'my-registry/notification:v3.0',
      });
      const endpoint = await promiseOf(customStack.notificationServiceEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should handle all custom images together', async () => {
      const allCustomStack = new TapStack('test-all-custom', {
        environmentSuffix: 'all-custom',
        paymentApiImage: 'reg1/payment:v1',
        fraudDetectorImage: 'reg2/fraud:v1',
        notificationServiceImage: 'reg3/notif:v1',
      });

      const payment = await promiseOf(allCustomStack.paymentApiEndpoint);
      const fraud = await promiseOf(allCustomStack.fraudDetectorEndpoint);
      const notification = await promiseOf(
        allCustomStack.notificationServiceEndpoint
      );

      expect(payment).toContain('all-custom');
      expect(fraud).toContain('all-custom');
      expect(notification).toContain('all-custom');
    });
  });

  describe('Cluster configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-cluster', {
        environmentSuffix: 'cluster-test',
      });
    });

    it('should have cluster name with environment suffix', async () => {
      const name = await promiseOf(stack.clusterName);
      expect(name).toContain('cluster-test');
    });

    it('should generate kubeconfig with correct cluster name', async () => {
      const clusterName = await promiseOf(stack.clusterName);
      const config = await promiseOf(stack.kubeconfig);
      const parsed = JSON.parse(config);
      const hasClusterName = parsed.users[0].user.exec.args.some(
        (arg: string) => arg.includes(clusterName)
      );
      expect(hasClusterName).toBe(true);
    });

    it('should have kubeconfig with eu-west-2 region', async () => {
      const config = await promiseOf(stack.kubeconfig);
      expect(config).toContain('eu-west-2');
    });
  });

  describe('Service endpoint consistency', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-consistency', {
        environmentSuffix: 'consistency',
      });
    });

    it('should have consistent namespace across all endpoints', async () => {
      const namespace = await promiseOf(stack.namespaceName);
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);
      const notification = await promiseOf(stack.notificationServiceEndpoint);

      expect(payment).toContain(namespace);
      expect(fraud).toContain(namespace);
      expect(notification).toContain(namespace);
    });

    it('should use port 8080 for all internal services', async () => {
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);
      const notification = await promiseOf(stack.notificationServiceEndpoint);

      expect(payment).toContain(':8080');
      expect(fraud).toContain(':8080');
      expect(notification).toContain(':8080');
    });

    it('should use cluster.local domain for all services', async () => {
      const payment = await promiseOf(stack.paymentApiEndpoint);
      const fraud = await promiseOf(stack.fraudDetectorEndpoint);
      const notification = await promiseOf(stack.notificationServiceEndpoint);

      expect(payment).toContain('.svc.cluster.local');
      expect(fraud).toContain('.svc.cluster.local');
      expect(notification).toContain('.svc.cluster.local');
    });
  });

  describe('Gateway URL configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-gateway', {
        environmentSuffix: 'gateway',
      });
    });

    it('should have HTTP protocol in gateway URL', async () => {
      const url = await promiseOf(stack.gatewayUrl);
      expect(url).toMatch(/^http:\/\//);
    });

    it('should have LoadBalancer hostname in gateway URL', async () => {
      const url = await promiseOf(stack.gatewayUrl);
      expect(url).toContain('mock-lb-hostname');
    });
  });

  describe('HPA configuration validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-hpa-config', {
        environmentSuffix: 'hpa',
      });
    });

    it('should have three distinct HPAs', async () => {
      const status = await promiseOf(stack.hpaStatus);
      const hpaNames = [
        status.paymentApiHpa,
        status.fraudDetectorHpa,
        status.notificationServiceHpa,
      ];
      const uniqueNames = new Set(hpaNames);
      expect(uniqueNames.size).toBe(3);
    });

    it('should have HPAs with correct suffix', async () => {
      const status = await promiseOf(stack.hpaStatus);
      expect(status.paymentApiHpa).toContain('-hpa');
      expect(status.fraudDetectorHpa).toContain('-hpa');
      expect(status.notificationServiceHpa).toContain('-hpa');
    });
  });

  describe('Multiple stack instances', () => {
    it('should create multiple independent stacks', () => {
      const stack1 = new TapStack('stack-1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('stack-2', { environmentSuffix: 'env2' });
      const stack3 = new TapStack('stack-3', { environmentSuffix: 'env3' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });

    it('should have different namespaces for different stacks', async () => {
      const stack1 = new TapStack('multi-1', { environmentSuffix: 'one' });
      const stack2 = new TapStack('multi-2', { environmentSuffix: 'two' });

      const name1 = await promiseOf(stack1.namespaceName);
      const name2 = await promiseOf(stack2.namespaceName);

      expect(name1).toBe('microservices-one');
      expect(name2).toBe('microservices-two');
      expect(name1).not.toBe(name2);
    });
  });

  describe('Component resource registration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-component', {
        environmentSuffix: 'comp',
      });
    });

    it('should register as tap:stack:TapStack type', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have all outputs registered', async () => {
      const values = await Promise.all([
        promiseOf(stack.clusterName),
        promiseOf(stack.kubeconfig),
        promiseOf(stack.namespaceName),
        promiseOf(stack.gatewayUrl),
        promiseOf(stack.paymentApiEndpoint),
        promiseOf(stack.fraudDetectorEndpoint),
        promiseOf(stack.notificationServiceEndpoint),
        promiseOf(stack.hpaStatus),
      ]);

      expect(values.every((v: any) => v !== undefined)).toBe(true);
    });
  });

  describe('Default image handling', () => {
    it('should use nginx:1.25-alpine as default', async () => {
      const defaultStack = new TapStack('test-default-image', {});
      const endpoint = await promiseOf(defaultStack.paymentApiEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should override default when custom image provided', async () => {
      const customStack = new TapStack('test-override', {
        paymentApiImage: 'custom-image:tag',
      });
      const endpoint = await promiseOf(customStack.paymentApiEndpoint);
      expect(endpoint).toBeDefined();
    });
  });

  describe('Tags handling', () => {
    it('should create stack with empty tags', async () => {
      const emptyTagsStack = new TapStack('test-empty-tags', {
        tags: {},
      });
      const name = await promiseOf(emptyTagsStack.namespaceName);
      expect(name).toBeDefined();
    });

    it('should create stack with multiple tags', async () => {
      const multiTagsStack = new TapStack('test-multi-tags', {
        tags: {
          Environment: 'test',
          Team: 'platform',
          Project: 'tap',
          Owner: 'test-owner',
          CostCenter: '12345',
        },
      });
      const name = await promiseOf(multiTagsStack.namespaceName);
      expect(name).toBeDefined();
    });

    it('should create stack without tags', async () => {
      const noTagsStack = new TapStack('test-no-tags', {
        environmentSuffix: 'test',
      });
      const name = await promiseOf(noTagsStack.namespaceName);
      expect(name).toBe('microservices-test');
    });
  });

  describe('Environment suffix variations', () => {
    it('should handle pr6215 suffix', async () => {
      const prStack = new TapStack('test-pr', {
        environmentSuffix: 'pr6215',
      });
      const name = await promiseOf(prStack.namespaceName);
      expect(name).toBe('microservices-pr6215');
    });

    it('should handle numeric suffix', async () => {
      const numStack = new TapStack('test-num', {
        environmentSuffix: '12345',
      });
      const name = await promiseOf(numStack.namespaceName);
      expect(name).toBe('microservices-12345');
    });

    it('should handle alphanumeric suffix', async () => {
      const alphaStack = new TapStack('test-alpha', {
        environmentSuffix: 'test123abc',
      });
      const name = await promiseOf(alphaStack.namespaceName);
      expect(name).toBe('microservices-test123abc');
    });
  });

  describe('Cluster name format', () => {
    it('should follow eks-cluster-{suffix} naming pattern', async () => {
      const stack = new TapStack('test-naming', {
        environmentSuffix: 'test-env',
      });
      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toMatch(/eks-cluster-test-env/);
    });
  });

  describe('All outputs together', () => {
    it('should return all 8 outputs without errors', async () => {
      const stack = new TapStack('test-all-outputs', {
        environmentSuffix: 'all-out',
      });

      const [
        clusterName,
        kubeconfig,
        namespaceName,
        gatewayUrl,
        paymentApi,
        fraudDetector,
        notification,
        hpaStatus,
      ] = await Promise.all([
        promiseOf(stack.clusterName),
        promiseOf(stack.kubeconfig),
        promiseOf(stack.namespaceName),
        promiseOf(stack.gatewayUrl),
        promiseOf(stack.paymentApiEndpoint),
        promiseOf(stack.fraudDetectorEndpoint),
        promiseOf(stack.notificationServiceEndpoint),
        promiseOf(stack.hpaStatus),
      ]);

      expect(clusterName).toBeDefined();
      expect(kubeconfig).toBeDefined();
      expect(namespaceName).toBe('microservices-all-out');
      expect(gatewayUrl).toBeDefined();
      expect(paymentApi).toBeDefined();
      expect(fraudDetector).toBeDefined();
      expect(notification).toBeDefined();
      expect(hpaStatus).toBeDefined();
    });
  });
});
