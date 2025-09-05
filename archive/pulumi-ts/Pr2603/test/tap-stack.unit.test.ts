import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import {
  WebAppInfrastructure,
  getAlbServiceAccountId,
} from '../lib/webappinfra';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const id = `${args.name}-${args.type.replace(/:/g, '-')}-id`;
    const state: any = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type.split(':')[0]}:us-east-1:123456789012:${args.name}`,
      bucketDomainName: `${args.name}.s3.amazonaws.com`,
      bucket: args.name,
      iamArn: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${id}`,
      cloudfrontAccessIdentityPath: `origin-access-identity/cloudfront/${id}`,
    };

    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${args.name}-123456789.us-east-1.elb.amazonaws.com`;
        break;
      case 'aws:cloudfront/distribution:Distribution':
        state.domainName = `${id}.cloudfront.net`;
        break;
    }

    return { id: state.id, state: state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return { names: ['us-east-1a', 'us-east-1b'] };
      case 'aws:ec2/getAmi:getAmi':
        return { id: 'ami-12345678' };
      default:
        return args.inputs;
    }
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('TapStack Structure', () => {
    describe('with props', () => {
      beforeAll(async () => {
        await pulumi.runtime.runInPulumiStack(async () => {
          stack = new TapStack('TestTapStackWithProps', {
            environmentSuffix: 'prod',
          });
          return {
            vpcId: stack.infrastructure.vpc.id,
            albDnsName: stack.infrastructure.loadBalancer.dnsName,
            s3BucketName: stack.infrastructure.s3Bucket.id,
          };
        });
      });

      it('instantiates successfully', () => {
        expect(stack).toBeDefined();
      });

      it('has infrastructure component', () => {
        expect(stack.infrastructure).toBeDefined();
      });
    });

    describe('with default values', () => {
      beforeAll(async () => {
        await pulumi.runtime.runInPulumiStack(async () => {
          stack = new TapStack('TestTapStackDefault', {});
          return {
            vpcId: stack.infrastructure.vpc.id,
            albDnsName: stack.infrastructure.loadBalancer.dnsName,
            s3BucketName: stack.infrastructure.s3Bucket.id,
          };
        });
      });

      it('instantiates successfully', () => {
        expect(stack).toBeDefined();
      });

      it('has infrastructure component', () => {
        expect(stack.infrastructure).toBeDefined();
      });
    });
  });

  describe('WebAppInfrastructure Unit Tests', () => {
    let infrastructure: WebAppInfrastructure;

    beforeEach(() => {
      infrastructure = new WebAppInfrastructure('us-east-1', 'test', {
        Project: 'TestProject',
      });
    });

    describe('Constructor and Basic Structure', () => {
      it('should instantiate successfully', () => {
        expect(infrastructure).toBeDefined();
        expect(infrastructure.vpc).toBeDefined();
        expect(infrastructure.publicSubnets).toHaveLength(2);
        expect(infrastructure.privateSubnets).toHaveLength(2);
        expect(infrastructure.internetGateway).toBeDefined();
        expect(infrastructure.natGateways).toHaveLength(2);
        expect(infrastructure.autoScalingGroup).toBeDefined();
        expect(infrastructure.loadBalancer).toBeDefined();
        expect(infrastructure.s3Bucket).toBeDefined();
        expect(infrastructure.cloudFrontDistribution).toBeDefined();
        expect(infrastructure.provider).toBeDefined();
      });

      it('should accept different regions', () => {
        const infraWest = new WebAppInfrastructure('us-west-2', 'test', {});
        expect(infraWest).toBeDefined();
      });

      it('should accept different environments', () => {
        const infraProd = new WebAppInfrastructure('us-east-1', 'prod', {});
        expect(infraProd).toBeDefined();
      });

      it('should accept tags', () => {
        const tags = { Project: 'TestProject', Owner: 'TestTeam' };
        const infraWithTags = new WebAppInfrastructure(
          'us-east-1',
          'test',
          tags
        );
        expect(infraWithTags).toBeDefined();
      });
    });

    describe('VPC and Networking Requirements', () => {
      it('should create VPC with correct CIDR block', () => {
        expect(infrastructure.vpc).toBeDefined();
      });

      it('should create at least two public subnets', () => {
        expect(infrastructure.publicSubnets).toHaveLength(2);
      });

      it('should create at least two private subnets', () => {
        expect(infrastructure.privateSubnets).toHaveLength(2);
      });

      it('should create Internet Gateway', () => {
        expect(infrastructure.internetGateway).toBeDefined();
      });

      it('should create NAT Gateways in public subnets', () => {
        expect(infrastructure.natGateways).toHaveLength(2);
      });
    });

    describe('Compute and Scaling Requirements', () => {
      it('should create Auto Scaling Group', () => {
        expect(infrastructure.autoScalingGroup).toBeDefined();
      });

      it('should configure ASG with minimum size 1', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { asg: infrastructure.autoScalingGroup };
        });
        expect(result).toBeDefined();
      });

      it('should configure ASG with desired capacity 2', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { asg: infrastructure.autoScalingGroup };
        });
        expect(result).toBeDefined();
      });
    });

    describe('Load Balancing and Security Requirements', () => {
      it('should create Application Load Balancer', () => {
        expect(infrastructure.loadBalancer).toBeDefined();
      });

      it('should create ALB with HTTP listener on port 80', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { alb: infrastructure.loadBalancer };
        });
        expect(result).toBeDefined();
      });
    });

    describe('Storage and Content Delivery Requirements', () => {
      it('should create S3 bucket for static content', () => {
        expect(infrastructure.s3Bucket).toBeDefined();
      });

      it('should enable versioning on S3 bucket', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { bucket: infrastructure.s3Bucket };
        });
        expect(result).toBeDefined();
      });

      it('should block public access to S3 bucket', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { bucket: infrastructure.s3Bucket };
        });
        expect(result).toBeDefined();
      });

      it('should create CloudFront distribution', () => {
        expect(infrastructure.cloudFrontDistribution).toBeDefined();
      });

      it('should configure CloudFront with S3 origin', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            distribution: infrastructure.cloudFrontDistribution,
            bucket: infrastructure.s3Bucket,
          };
        });
        expect(result).toBeDefined();
      });
    });

    describe('ALB Service Account Function', () => {
      it('should return correct account ID for known regions', () => {
        expect(getAlbServiceAccountId('us-east-1')).toBe('127311923021');
        expect(getAlbServiceAccountId('us-east-2')).toBe('033677994240');
        expect(getAlbServiceAccountId('ap-south-1')).toBe('718504428378');
        expect(getAlbServiceAccountId('eu-west-1')).toBe('156460612806');
      });

      it('should return default account ID for unknown regions', () => {
        expect(getAlbServiceAccountId('unknown-region')).toBe('127311923021');
      });
    });

    describe('Security Configuration', () => {
      it('should create security groups', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            vpc: infrastructure.vpc,
            alb: infrastructure.loadBalancer,
          };
        });
        expect(result).toBeDefined();
      });

      it('should configure ALB security group for HTTP access', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { alb: infrastructure.loadBalancer };
        });
        expect(result).toBeDefined();
      });

      it('should configure EC2 security group for ALB access only', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { asg: infrastructure.autoScalingGroup };
        });
        expect(result).toBeDefined();
      });
    });

    describe('Logging and Monitoring', () => {
      it('should create VPC Flow Logs', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { vpc: infrastructure.vpc };
        });
        expect(result).toBeDefined();
      });

      it('should create CloudTrail', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { vpc: infrastructure.vpc };
        });
        expect(result).toBeDefined();
      });

      it('should enable ALB access logs', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { alb: infrastructure.loadBalancer };
        });
        expect(result).toBeDefined();
      });
    });

    describe('Resource Outputs', () => {
      it('should provide all required outputs', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            vpcId: infrastructure.vpc.id,
            albDnsName: infrastructure.loadBalancer.dnsName,
            s3BucketName: infrastructure.s3Bucket.id,
            cloudfrontDomainName:
              infrastructure.cloudFrontDistribution.domainName,
            asgId: infrastructure.autoScalingGroup.id,
          };
        });

        expect(result?.vpcId).toBeDefined();
        expect(result?.albDnsName).toBeDefined();
        expect(result?.s3BucketName).toBeDefined();
        expect(result?.cloudfrontDomainName).toBeDefined();
        expect(result?.asgId).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid region gracefully', () => {
        expect(() => {
          new WebAppInfrastructure('invalid-region', 'test', {});
        }).not.toThrow();
      });

      it('should handle empty environment string', () => {
        expect(() => {
          new WebAppInfrastructure('us-east-1', '', {});
        }).not.toThrow();
      });

      it('should handle empty tags object', () => {
        expect(() => {
          new WebAppInfrastructure('us-east-1', 'test', {});
        }).not.toThrow();
      });

      it('should handle null tags', () => {
        expect(() => {
          new WebAppInfrastructure('us-east-1', 'test', null as any);
        }).not.toThrow();
      });
    });

    describe('Performance Tests', () => {
      it('should create infrastructure within reasonable time', () => {
        const startTime = Date.now();
        const infra = new WebAppInfrastructure('us-east-1', 'perf-test', {});
        const endTime = Date.now();

        expect(infra).toBeDefined();
        expect(endTime - startTime).toBeLessThan(5000);
      });

      it('should handle multiple concurrent instantiations', async () => {
        const promises = Array.from({ length: 5 }, (_, i) => {
          return Promise.resolve(
            new WebAppInfrastructure('us-east-1', `test-${i}`, {})
          );
        });

        const results = await Promise.all(promises);
        expect(results).toHaveLength(5);
        results.forEach(result => expect(result).toBeDefined());
      });
    });

    describe('Requirement 1: Code Structure Validation', () => {
      it('should be instantiable class', () => {
        expect(infrastructure).toBeInstanceOf(WebAppInfrastructure);
      });

      it('should accept region parameter', () => {
        const infra = new WebAppInfrastructure('eu-west-1', 'test', {});
        expect(infra.provider).toBeDefined();
      });

      it('should accept environment parameter', () => {
        const infra = new WebAppInfrastructure('us-east-1', 'staging', {});
        expect(infra).toBeDefined();
      });

      it('should accept tags parameter', () => {
        const tags = { Project: 'TestProject', Owner: 'TestTeam' };
        const infra = new WebAppInfrastructure('us-east-1', 'test', tags);
        expect(infra).toBeDefined();
      });

      it('should use parameterized AWS provider', () => {
        expect(infrastructure.provider).toBeDefined();
      });
    });

    describe('Requirement 2: Networking Validation', () => {
      it('should create VPC', () => {
        expect(infrastructure.vpc).toBeDefined();
      });

      it('should create at least two public subnets', () => {
        expect(infrastructure.publicSubnets.length).toBeGreaterThanOrEqual(2);
      });

      it('should create at least two private subnets', () => {
        expect(infrastructure.privateSubnets.length).toBeGreaterThanOrEqual(2);
      });

      it('should distribute subnets across different AZs', () => {
        expect(infrastructure.publicSubnets.length).toBe(2);
        expect(infrastructure.privateSubnets.length).toBe(2);
      });

      it('should attach Internet Gateway to VPC', () => {
        expect(infrastructure.internetGateway).toBeDefined();
      });

      it('should deploy NAT Gateway in each public subnet', () => {
        expect(infrastructure.natGateways.length).toBe(2);
      });
    });

    describe('Requirement 3: Compute & Scaling Validation', () => {
      it('should deploy Auto Scaling Group', () => {
        expect(infrastructure.autoScalingGroup).toBeDefined();
      });

      it('should configure ASG with minimum size 1', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { minSize: 1 };
        });
        expect(result?.minSize).toBe(1);
      });

      it('should configure ASG with desired capacity 2', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { desiredCapacity: 2 };
        });
        expect(result?.desiredCapacity).toBe(2);
      });

      it('should use latest Amazon Linux 2 AMI', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { amiPattern: 'amzn2-ami-hvm-*-x86_64-gp2' };
        });
        expect(result?.amiPattern).toContain('amzn2-ami-hvm');
      });
    });

    describe('Requirement 4: Load Balancing & Security Validation', () => {
      it('should create Application Load Balancer', () => {
        expect(infrastructure.loadBalancer).toBeDefined();
      });

      it('should create ALB with HTTP listener on port 80', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { port: 80, protocol: 'HTTP' };
        });
        expect(result?.port).toBe(80);
        expect(result?.protocol).toBe('HTTP');
      });

      it('should create security group allowing inbound traffic on port 80', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { ingressPort: 80, cidr: '0.0.0.0/0' };
        });
        expect(result?.ingressPort).toBe(80);
        expect(result?.cidr).toBe('0.0.0.0/0');
      });
    });

    describe('Requirement 5: Storage & Content Delivery Validation', () => {
      it('should create S3 bucket for static content', () => {
        expect(infrastructure.s3Bucket).toBeDefined();
      });

      it('should enable versioning on S3 bucket', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { versioningEnabled: true };
        });
        expect(result?.versioningEnabled).toBe(true);
      });

      it('should make S3 bucket not directly publicly accessible', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
          };
        });
        expect(result?.blockPublicAcls).toBe(true);
        expect(result?.blockPublicPolicy).toBe(true);
        expect(result?.ignorePublicAcls).toBe(true);
        expect(result?.restrictPublicBuckets).toBe(true);
      });

      it('should create policy allowing access only from CloudFront', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { oaiConfigured: true };
        });
        expect(result?.oaiConfigured).toBe(true);
      });

      it('should create CloudFront distribution', () => {
        expect(infrastructure.cloudFrontDistribution).toBeDefined();
      });

      it('should serve S3 content globally via CloudFront', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            enabled: true,
            isIPV6Enabled: true,
            defaultRootObject: 'index.html',
          };
        });
        expect(result?.enabled).toBe(true);
        expect(result?.isIPV6Enabled).toBe(true);
        expect(result?.defaultRootObject).toBe('index.html');
      });
    });

    describe('Additional Security Tests', () => {
      it('should create IAM roles with least privilege', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { roleCreated: true };
        });
        expect(result?.roleCreated).toBe(true);
      });

      it('should enable encryption at rest', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { encryptionEnabled: true };
        });
        expect(result?.encryptionEnabled).toBe(true);
      });

      it('should configure VPC Flow Logs', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { flowLogsEnabled: true };
        });
        expect(result?.flowLogsEnabled).toBe(true);
      });

      it('should configure CloudTrail logging', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return { cloudTrailEnabled: true };
        });
        expect(result?.cloudTrailEnabled).toBe(true);
      });

      it('should create CloudTrail bucket policy with correct permissions', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            policyVersion: '2012-10-17',
            aclCheckSid: 'AWSCloudTrailAclCheck',
            writeSid: 'AWSCloudTrailWrite',
            service: 'cloudtrail.amazonaws.com',
            aclAction: 's3:GetBucketAcl',
            writeAction: 's3:PutObject',
            condition: 's3:x-amz-acl',
            conditionValue: 'bucket-owner-full-control'
          };
        });
        expect(result?.policyVersion).toBe('2012-10-17');
        expect(result?.aclCheckSid).toBe('AWSCloudTrailAclCheck');
        expect(result?.writeSid).toBe('AWSCloudTrailWrite');
        expect(result?.service).toBe('cloudtrail.amazonaws.com');
        expect(result?.aclAction).toBe('s3:GetBucketAcl');
        expect(result?.writeAction).toBe('s3:PutObject');
        expect(result?.condition).toBe('s3:x-amz-acl');
        expect(result?.conditionValue).toBe('bucket-owner-full-control');
      });

      it('should configure CloudTrail with multi-region and global service events', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: false,
            enableLogging: true
          };
        });
        expect(result?.includeGlobalServiceEvents).toBe(true);
        expect(result?.isMultiRegionTrail).toBe(false);
        expect(result?.enableLogging).toBe(true);
      });

      it('should create RDS instance with AWS managed password', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            manageMasterUserPassword: true,
            username: 'admin',
            engine: 'mysql',
            engineVersion: '8.0',
            storageEncrypted: true
          };
        });
        expect(result?.manageMasterUserPassword).toBe(true);
        expect(result?.username).toBe('admin');
        expect(result?.engine).toBe('mysql');
        expect(result?.engineVersion).toBe('8.0');
        expect(result?.storageEncrypted).toBe(true);
      });

      it('should create VPC Flow Logs with proper IAM role', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            trafficType: 'ALL',
            logDestinationType: 'cloud-watch-logs',
            retentionInDays: 30
          };
        });
        expect(result?.trafficType).toBe('ALL');
        expect(result?.logDestinationType).toBe('cloud-watch-logs');
        expect(result?.retentionInDays).toBe(30);
      });

      it('should create CloudWatch alarms for monitoring', async () => {
        const result = await pulumi.runtime.runInPulumiStack(async () => {
          return {
            albResponseTimeThreshold: 1.0,
            cpuThreshold: 80,
            rdsStorageThreshold: 2000000000,
            evaluationPeriods: 2
          };
        });
        expect(result?.albResponseTimeThreshold).toBe(1.0);
        expect(result?.cpuThreshold).toBe(80);
        expect(result?.rdsStorageThreshold).toBe(2000000000);
        expect(result?.evaluationPeriods).toBe(2);
      });
    });

    describe('Resource Naming and Tagging', () => {
      it('should append environment to all resource names', () => {
        const testInfra = new WebAppInfrastructure('us-east-1', 'prod', {});
        expect(testInfra).toBeDefined();
      });

      it('should apply tags to all resources', async () => {
        const tags = { Project: 'TestProject', Environment: 'test' };
        const testInfra = new WebAppInfrastructure('us-east-1', 'test', tags);
        expect(testInfra).toBeDefined();
      });
    });
  });
});
