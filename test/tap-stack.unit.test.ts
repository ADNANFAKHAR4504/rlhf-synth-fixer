import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        architecture: 'x86_64',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Create stack with test configuration
    stack = new TapStack('test-stack', {
      environmentSuffix: 'dev',
      tags: {
        Environment: 'dev',
        Project: 'test',
      },
    });
  });

  describe('VPC and Networking', () => {
    it('should create VPC with correct outputs', done => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should create 3 public subnets', done => {
      pulumi.all(stack.publicSubnetIds).apply(subnetIds => {
        expect(subnetIds).toHaveLength(3);
        subnetIds.forEach(id => {
          expect(typeof id).toBe('string');
          expect(id).toBeDefined();
        });
        done();
      });
    });

    it('should create 3 private subnets', done => {
      pulumi.all(stack.privateSubnetIds).apply(subnetIds => {
        expect(subnetIds).toHaveLength(3);
        subnetIds.forEach(id => {
          expect(typeof id).toBe('string');
          expect(id).toBeDefined();
        });
        done();
      });
    });
  });

  describe('Compute Resources', () => {
    it('should create ECS cluster', done => {
      pulumi.all([stack.ecsClusterId]).apply(([clusterId]) => {
        expect(clusterId).toBeDefined();
        expect(typeof clusterId).toBe('string');
        done();
      });
    });
  });

  describe('Database Resources', () => {
    it('should create RDS instance with endpoint', done => {
      pulumi.all([stack.rdsEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });
  });

  describe('Storage Resources', () => {
    it('should create S3 app bucket', done => {
      pulumi.all([stack.appBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        done();
      });
    });
  });

  describe('Load Balancing', () => {
    it('should create ALB with DNS name', done => {
      pulumi.all([stack.albDnsName]).apply(([dnsName]) => {
        expect(dnsName).toBeDefined();
        expect(typeof dnsName).toBe('string');
        done();
      });
    });
  });

  describe('Content Delivery', () => {
    it('should create CloudFront distribution', done => {
      pulumi.all([stack.cloudfrontDomainName]).apply(([domainName]) => {
        expect(domainName).toBeDefined();
        expect(typeof domainName).toBe('string');
        done();
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should accept environment suffix', () => {
      const testStack = new TapStack('config-test', {
        environmentSuffix: 'staging',
      });
      expect(testStack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const testStack = new TapStack('tags-test', {
        environmentSuffix: 'prod',
        tags: {
          CostCenter: 'finance',
          Owner: 'admin',
        },
      });
      expect(testStack).toBeDefined();
    });

    it('should work with default configuration', () => {
      const testStack = new TapStack('default-test');
      expect(testStack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create all required outputs', done => {
      pulumi
        .all([
          stack.vpcId,
          stack.ecsClusterId,
          stack.rdsEndpoint,
          stack.albDnsName,
          stack.cloudfrontDomainName,
          stack.appBucketName,
        ])
        .apply(([vpcId, ecsId, rdsEnd, albDns, cfDomain, bucketName]) => {
          expect(vpcId).toBeDefined();
          expect(ecsId).toBeDefined();
          expect(rdsEnd).toBeDefined();
          expect(albDns).toBeDefined();
          expect(cfDomain).toBeDefined();
          expect(bucketName).toBeDefined();
          done();
        });
    });
  });

  describe('Multi-environment Support', () => {
    it('should create dev environment resources', () => {
      const devStack = new TapStack('multi-env-dev', {
        environmentSuffix: 'dev',
      });
      expect(devStack).toBeDefined();
    });

    it('should create staging environment resources', () => {
      const stagingStack = new TapStack('multi-env-staging', {
        environmentSuffix: 'staging',
      });
      expect(stagingStack).toBeDefined();
    });

    it('should create prod environment resources', () => {
      const prodStack = new TapStack('multi-env-prod', {
        environmentSuffix: 'prod',
      });
      expect(prodStack).toBeDefined();
    });
  });
});
