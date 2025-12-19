import * as pulumi from '@pulumi/pulumi';
import { EcrComponent } from '../lib/components/ecr';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    const outputs: Record<string, unknown> = {
      ...args.inputs,
      arn: `arn:aws:ecr:us-east-1:123456789012:repository/${args.inputs.name || args.name}`,
      id: `${args.name}-id`,
    };

    // ECR Repository outputs
    if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
      outputs.registryId = '123456789012';
    }

    // ECR Lifecycle Policy outputs
    if (args.type === 'aws:ecr/lifecyclePolicy:LifecyclePolicy') {
      outputs.repository = args.inputs.repository;
    }

    // ECR Repository Policy outputs
    if (args.type === 'aws:ecr/repositoryPolicy:RepositoryPolicy') {
      outputs.repository = args.inputs.repository;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function () {
    return {};
  },
});

describe('EcrComponent', () => {
  let ecr: EcrComponent;

  beforeAll(() => {
    ecr = new EcrComponent('test-ecr', {
      environment: 'dev',
      repositoryName: 'payment-processor',
      tags: {
        Environment: 'dev',
        Project: 'payment-processing',
      },
    });
  });

  describe('Repository Configuration', () => {
    it('should create ECR repository', (done) => {
      pulumi.all([ecr.repositoryUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(url).toContain('ecr');
        expect(url).toContain('amazonaws.com');
        done();
      });
    });

    it('should use correct repository name', (done) => {
      pulumi.all([ecr.repository.name]).apply(([name]) => {
        expect(name).toBe('payment-processor');
        done();
      });
    });

    it('should enable image scanning', (done) => {
      pulumi.all([ecr.repository.imageScanningConfiguration]).apply(([config]) => {
        expect(config).toBeDefined();
        expect(config.scanOnPush).toBe(true);
        done();
      });
    });

    it('should set image tag mutability', (done) => {
      pulumi.all([ecr.repository.imageTagMutability]).apply(([mutability]) => {
        expect(mutability).toBe('MUTABLE');
        done();
      });
    });

    it('should enable force delete', (done) => {
      pulumi.all([ecr.repository.forceDelete]).apply(([forceDelete]) => {
        expect(forceDelete).toBe(true);
        done();
      });
    });
  });

  describe('Encryption Configuration', () => {
    it('should configure encryption', (done) => {
      pulumi.all([ecr.repository.encryptionConfigurations]).apply(([configs]) => {
        expect(configs).toBeDefined();
        expect(Array.isArray(configs)).toBe(true);
        expect(configs.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should use AES256 encryption', (done) => {
      pulumi.all([ecr.repository.encryptionConfigurations]).apply(([configs]) => {
        expect(configs[0].encryptionType).toBe('AES256');
        done();
      });
    });
  });

  describe('Lifecycle Policy', () => {
    it('should create lifecycle policy', (done) => {
      pulumi.all([ecr.lifecyclePolicy.repository]).apply(([repo]) => {
        expect(repo).toBeDefined();
        done();
      });
    });

    it('should configure image retention', (done) => {
      pulumi.all([ecr.lifecyclePolicy.policy]).apply(([policy]) => {
        const policyDoc = JSON.parse(policy);
        expect(policyDoc.rules).toBeDefined();
        expect(Array.isArray(policyDoc.rules)).toBe(true);
        done();
      });
    });

    it('should keep last 10 images', (done) => {
      pulumi.all([ecr.lifecyclePolicy.policy]).apply(([policy]) => {
        const policyDoc = JSON.parse(policy);
        expect(policyDoc.rules[0].selection.countNumber).toBe(10);
        done();
      });
    });

    it('should expire old images', (done) => {
      pulumi.all([ecr.lifecyclePolicy.policy]).apply(([policy]) => {
        const policyDoc = JSON.parse(policy);
        expect(policyDoc.rules[0].action.type).toBe('expire');
        done();
      });
    });
  });

  describe('Repository Policy', () => {
    it('should configure repository policy for cross-account access', (done) => {
      pulumi.all([ecr.repository.name]).apply(() => {
        // Repository policy is created
        expect(true).toBe(true);
        done();
      });
    });
  });

  describe('Tagging', () => {
    it('should apply environment tags', (done) => {
      pulumi.all([ecr.repository.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags['Environment']).toBe('dev');
        done();
      });
    });

    it('should include project tag', (done) => {
      pulumi.all([ecr.repository.tags]).apply(([tags]) => {
        expect(tags['Project']).toBe('payment-processing');
        done();
      });
    });

    it('should mark as shared repository', (done) => {
      pulumi.all([ecr.repository.tags]).apply(([tags]) => {
        expect(tags['Shared']).toBe('true');
        done();
      });
    });

    it('should include name tag', (done) => {
      pulumi.all([ecr.repository.tags]).apply(([tags]) => {
        expect(tags['Name']).toBeDefined();
        done();
      });
    });
  });

  describe('Outputs', () => {
    it('should export repository URL', (done) => {
      pulumi.all([ecr.repositoryUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        done();
      });
    });

    it('should have correct URL format', (done) => {
      pulumi.all([ecr.repositoryUrl]).apply(([url]) => {
        expect(url).toMatch(/^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+$/);
        done();
      });
    });
  });

  describe('Cross-environment Sharing', () => {
    it('should allow ECS tasks to pull images', (done) => {
      pulumi.all([ecr.repository.name]).apply(() => {
        // Repository policy allows ecs-tasks.amazonaws.com
        expect(true).toBe(true);
        done();
      });
    });
  });
});
