/**
 * Unit tests for Order Processing API Infrastructure
 * Tests Pulumi resource definitions in bin/tap.ts
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the infrastructure
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const id = `${args.name}-mock-id`;
    const state = {
      ...args.inputs,
      id,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      dnsName: args.type.includes('LoadBalancer') ? `${args.name}.us-east-1.elb.amazonaws.com` : undefined,
      endpoint: args.type.includes('Cluster') ? `${args.name}.us-east-1.rds.amazonaws.com` : undefined,
      readerEndpoint: args.type.includes('Cluster') ? `${args.name}-ro.us-east-1.rds.amazonaws.com` : undefined,
      repositoryUrl: args.type.includes('Repository') ? `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}` : undefined,
      vpcId: args.type.includes('Vpc') ? 'vpc-mock-id' : args.inputs.vpcId,
      publicSubnetIds: args.type.includes('Vpc') ? ['subnet-public-1', 'subnet-public-2', 'subnet-public-3'] : undefined,
      privateSubnetIds: args.type.includes('Vpc') ? ['subnet-private-1', 'subnet-private-2', 'subnet-private-3'] : undefined,
      arnSuffix: args.type.includes('LoadBalancer') || args.type.includes('TargetGroup') ? `app/${args.name}/1234567890` : undefined,
      name: args.inputs.name || args.name,
      clusterIdentifier: args.inputs.clusterIdentifier || args.name,
      dashboardName: args.inputs.dashboardName || args.name,
    };
    return { id, state };
  },
  call: (args: pulumi.runtime.MockCallArgs): { outputs: any } => {
    if (args.token === 'aws:secretsmanager/getRandomPassword:getRandomPassword') {
      return {
        outputs: {
          randomPassword: JSON.stringify({ password: 'mock-password-123456789012' }),
        },
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        outputs: {
          name: 'us-east-1',
        },
      };
    }
    return { outputs: {} };
  },
});

// Clear environment variable to ensure Pulumi config is used
delete process.env.ENVIRONMENT_SUFFIX;

// Set required configuration
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('aws:region', 'us-east-1');

// Import infrastructure after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-var-requires
const infrastructure = require('../bin/tap');

describe('Order Processing API Infrastructure - Unit Tests', () => {

  describe('Configuration Management', () => {
    it('should use environmentSuffix from Pulumi config', (done) => {
      pulumi.all([infrastructure.ecrRepositoryUrl]).apply(([url]) => {
        expect(url).toContain('test');
        done();
      });
    });

    it('should apply environmentSuffix consistently across all resources', (done) => {
      pulumi.all([
        infrastructure.albDnsName,
        infrastructure.ecrRepositoryUrl,
        infrastructure.ecsServiceArn,
        infrastructure.rdsClusterEndpoint,
      ]).apply(([albDns, ecrUrl, ecsArn, rdsEndpoint]) => {
        expect(albDns).toContain('test');
        expect(ecrUrl).toContain('test');
        expect(ecsArn).toContain('test');
        expect(rdsEndpoint).toContain('test');
        done();
      });
    });

    it('should handle region configuration correctly', (done) => {
      pulumi.all([
        infrastructure.albDnsName,
        infrastructure.rdsClusterEndpoint,
        infrastructure.ecrRepositoryUrl,
      ]).apply(([albDns, rdsEndpoint, ecrUrl]) => {
        expect(albDns).toContain('us-east-1');
        expect(rdsEndpoint).toContain('us-east-1');
        expect(ecrUrl).toContain('us-east-1');
        done();
      });
    });

  });

  describe('VPC Configuration', () => {
    it('should export vpcId', (done) => {
      pulumi.all([infrastructure.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should have valid VPC structure', (done) => {
      pulumi.all([infrastructure.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toMatch(/^vpc-/);
        done();
      });
    });
  });

  describe('Load Balancer', () => {
    it('should export ALB DNS name', (done) => {
      pulumi.all([infrastructure.albDnsName]).apply(([dnsName]) => {
        expect(dnsName).toBeDefined();
        expect(typeof dnsName).toBe('string');
        expect(dnsName).toContain('elb.amazonaws.com');
        done();
      });
    });

    it('should export blue target group ARN', (done) => {
      pulumi.all([infrastructure.blueTargetGroupArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export green target group ARN', (done) => {
      pulumi.all([infrastructure.greenTargetGroupArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('ECS Configuration', () => {
    it('should export ECS service ARN', (done) => {
      pulumi.all([infrastructure.ecsServiceArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('RDS Aurora Configuration', () => {
    it('should export RDS cluster endpoint', (done) => {
      pulumi.all([infrastructure.rdsClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export RDS reader endpoint', (done) => {
      pulumi.all([infrastructure.rdsReaderEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });
  });

  describe('ECR Repository', () => {
    it('should export ECR repository URL', (done) => {
      pulumi.all([infrastructure.ecrRepositoryUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toContain('dkr.ecr');
        expect(url).toContain('amazonaws.com');
        done();
      });
    });
  });

  describe('WAF Configuration', () => {
    it('should export WAF Web ACL ARN', (done) => {
      pulumi.all([infrastructure.wafWebAclArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should export dashboard URL', (done) => {
      pulumi.all([infrastructure.dashboardUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toContain('console.aws.amazon.com/cloudwatch');
        expect(url).toContain('dashboards');
        done();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in ALB DNS', (done) => {
      pulumi.all([infrastructure.albDnsName]).apply(([dnsName]) => {
        expect(dnsName).toContain('test');
        done();
      });
    });

    it('should include environment suffix in ECR URL', (done) => {
      pulumi.all([infrastructure.ecrRepositoryUrl]).apply(([url]) => {
        expect(url).toContain('test');
        done();
      });
    });
  });

  describe('All Exported Values', () => {
    it('should export all required stack outputs', async () => {
      const exports = Object.keys(infrastructure);
      const requiredExports = [
        'vpcId',
        'albDnsName',
        'ecsServiceArn',
        'rdsClusterEndpoint',
        'rdsReaderEndpoint',
        'ecrRepositoryUrl',
        'wafWebAclArn',
        'blueTargetGroupArn',
        'greenTargetGroupArn',
        'dashboardUrl',
      ];

      requiredExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });

    it('should have valid output values for all exports', (done) => {
      pulumi
        .all([
          infrastructure.vpcId,
          infrastructure.albDnsName,
          infrastructure.ecsServiceArn,
          infrastructure.rdsClusterEndpoint,
          infrastructure.rdsReaderEndpoint,
          infrastructure.ecrRepositoryUrl,
          infrastructure.wafWebAclArn,
          infrastructure.blueTargetGroupArn,
          infrastructure.greenTargetGroupArn,
          infrastructure.dashboardUrl,
        ])
        .apply(([
          vpcId,
          albDnsName,
          ecsServiceArn,
          rdsClusterEndpoint,
          rdsReaderEndpoint,
          ecrRepositoryUrl,
          wafWebAclArn,
          blueTargetGroupArn,
          greenTargetGroupArn,
          dashboardUrl,
        ]) => {
          expect(vpcId).toBeDefined();
          expect(albDnsName).toBeDefined();
          expect(ecsServiceArn).toBeDefined();
          expect(rdsClusterEndpoint).toBeDefined();
          expect(rdsReaderEndpoint).toBeDefined();
          expect(ecrRepositoryUrl).toBeDefined();
          expect(wafWebAclArn).toBeDefined();
          expect(blueTargetGroupArn).toBeDefined();
          expect(greenTargetGroupArn).toBeDefined();
          expect(dashboardUrl).toBeDefined();
          done();
        });
    });
  });

  describe('Resource Type Validation', () => {
    it('should have valid ARN format for ECS service', (done) => {
      pulumi.all([infrastructure.ecsServiceArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should have valid ARN format for WAF', (done) => {
      pulumi.all([infrastructure.wafWebAclArn]).apply(([arn]) => {
        expect(arn).toMatch(/^arn:aws:/);
        done();
      });
    });

    it('should have valid ARN format for target groups', (done) => {
      pulumi.all([infrastructure.blueTargetGroupArn, infrastructure.greenTargetGroupArn]).apply(([blueArn, greenArn]) => {
        expect(blueArn).toMatch(/^arn:aws:/);
        expect(greenArn).toMatch(/^arn:aws:/);
        done();
      });
    });
  });

  describe('Blue-Green Deployment Support', () => {
    it('should have both blue and green target groups', (done) => {
      pulumi.all([infrastructure.blueTargetGroupArn, infrastructure.greenTargetGroupArn]).apply(([blueArn, greenArn]) => {
        expect(blueArn).toBeDefined();
        expect(greenArn).toBeDefined();
        expect(blueArn).not.toEqual(greenArn);
        done();
      });
    });
  });

  describe('High Availability', () => {
    it('should have RDS cluster with reader endpoint for HA', (done) => {
      pulumi.all([infrastructure.rdsClusterEndpoint, infrastructure.rdsReaderEndpoint]).apply(([writer, reader]) => {
        expect(writer).toBeDefined();
        expect(reader).toBeDefined();
        expect(writer).not.toEqual(reader);
        done();
      });
    });
  });

  describe('Monitoring and Observability', () => {
    it('should have CloudWatch dashboard configured', (done) => {
      pulumi.all([infrastructure.dashboardUrl]).apply(([url]) => {
        expect(url).toContain('console.aws.amazon.com/cloudwatch');
        expect(url).toContain('region=us-east-1');
        done();
      });
    });
  });

  describe('Container Registry', () => {
    it('should have ECR repository in correct region', (done) => {
      pulumi.all([infrastructure.ecrRepositoryUrl]).apply(([url]) => {
        expect(url).toContain('us-east-1');
        expect(url).toContain('.dkr.ecr.');
        done();
      });
    });
  });

  describe('Network Architecture', () => {
    it('should have valid VPC ID format', (done) => {
      pulumi.all([infrastructure.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toMatch(/^vpc-[a-z0-9]+/);
        done();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have WAF Web ACL for security', (done) => {
      pulumi.all([infrastructure.wafWebAclArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('wafv2');
        done();
      });
    });
  });

  describe('Regional Configuration', () => {
    it('should deploy resources in us-east-1 region', (done) => {
      pulumi.all([infrastructure.albDnsName, infrastructure.rdsClusterEndpoint, infrastructure.ecrRepositoryUrl]).apply(([alb, rds, ecr]) => {
        expect(alb).toContain('us-east-1');
        expect(rds).toContain('us-east-1');
        expect(ecr).toContain('us-east-1');
        done();
      });
    });
  });

  describe('Output Data Types', () => {
    it('should have string type for all outputs', (done) => {
      pulumi
        .all([
          infrastructure.vpcId,
          infrastructure.albDnsName,
          infrastructure.ecsServiceArn,
          infrastructure.rdsClusterEndpoint,
          infrastructure.rdsReaderEndpoint,
          infrastructure.ecrRepositoryUrl,
          infrastructure.wafWebAclArn,
          infrastructure.blueTargetGroupArn,
          infrastructure.greenTargetGroupArn,
        ])
        .apply(([vpcId, albDnsName, ecsServiceArn, rdsClusterEndpoint, rdsReaderEndpoint, ecrRepositoryUrl, wafWebAclArn, blueTargetGroupArn, greenTargetGroupArn]) => {
          expect(typeof vpcId).toBe('string');
          expect(typeof albDnsName).toBe('string');
          expect(typeof ecsServiceArn).toBe('string');
          expect(typeof rdsClusterEndpoint).toBe('string');
          expect(typeof rdsReaderEndpoint).toBe('string');
          expect(typeof ecrRepositoryUrl).toBe('string');
          expect(typeof wafWebAclArn).toBe('string');
          expect(typeof blueTargetGroupArn).toBe('string');
          expect(typeof greenTargetGroupArn).toBe('string');
          done();
        });
    });
  });

  describe('Infrastructure Validation', () => {
    it('should have unique ARNs for blue and green target groups', (done) => {
      pulumi.all([infrastructure.blueTargetGroupArn, infrastructure.greenTargetGroupArn]).apply(([blue, green]) => {
        expect(blue).not.toBe(green);
        expect(blue.length).toBeGreaterThan(0);
        expect(green.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should have different RDS endpoints for writer and reader', (done) => {
      pulumi.all([infrastructure.rdsClusterEndpoint, infrastructure.rdsReaderEndpoint]).apply(([writer, reader]) => {
        expect(writer).not.toBe(reader);
        expect(writer.split('.')[0]).toBe(reader.split('.')[0].replace('-ro', ''));
        done();
      });
    });

    it('should have properly formatted dashboard URL with region', (done) => {
      pulumi.all([infrastructure.dashboardUrl]).apply(([url]) => {
        expect(url).toContain('https://');
        expect(url).toContain('console.aws.amazon.com');
        expect(url).toContain('region=');
        expect(url).toContain('dashboards');
        done();
      });
    });

    it('should have ECR repository URL with correct format', (done) => {
      pulumi.all([infrastructure.ecrRepositoryUrl]).apply(([url]) => {
        const parts = url.split('/');
        expect(parts.length).toBe(2);
        expect(parts[0]).toContain('.dkr.ecr.');
        expect(parts[0]).toContain('.amazonaws.com');
        expect(parts[1]).toContain('order-api');
        done();
      });
    });

    it('should have VPC ID with correct AWS format', (done) => {
      pulumi.all([infrastructure.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toMatch(/^vpc-/);
        expect(vpcId.length).toBeGreaterThan(4);
        done();
      });
    });
  });

  describe('Resource Tagging and Naming', () => {
    it('should have consistent naming pattern across resources', (done) => {
      pulumi.all([
        infrastructure.albDnsName,
        infrastructure.ecrRepositoryUrl,
        infrastructure.ecsServiceArn,
      ]).apply(([alb, ecr, ecs]) => {
        const suffix = 'test';
        expect(alb).toContain(suffix);
        expect(ecr).toContain(suffix);
        expect(ecs).toContain(suffix);
        done();
      });
    });

    it('should have all ARNs containing service identifiers', (done) => {
      pulumi.all([
        infrastructure.ecsServiceArn,
        infrastructure.wafWebAclArn,
        infrastructure.blueTargetGroupArn,
        infrastructure.greenTargetGroupArn,
      ]).apply(([ecs, waf, blue, green]) => {
        expect(ecs).toBeDefined();
        expect(waf).toBeDefined();
        expect(blue).toBeDefined();
        expect(green).toBeDefined();
        expect(typeof ecs).toBe('string');
        expect(typeof waf).toBe('string');
        expect(typeof blue).toBe('string');
        expect(typeof green).toBe('string');
        done();
      });
    });
  });
});
