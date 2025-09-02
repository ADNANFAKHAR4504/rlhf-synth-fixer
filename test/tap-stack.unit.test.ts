import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';
import { ProductionInfrastructure } from '../lib/production-infrastructure';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi runtime mocks for unit tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:ap-south-1:123456789012:${name}`,
        dnsName: type.includes('LoadBalancer') ? `${name}.ap-south-1.elb.amazonaws.com` : undefined,
        endpoint: type.includes('rds') ? `${name}.cluster-xyz.ap-south-1.rds.amazonaws.com` : undefined,
        bucket: type.includes('s3') ? `${name}-bucket` : undefined,
        publicIp: type.includes('Eip') ? '203.0.113.1' : undefined,
        masterUserSecrets: inputs.manageMasterUserPassword ? [{ secretArn: `arn:aws:secretsmanager:ap-south-1:123456789012:secret:${name}-secret` }] : [],
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return Promise.resolve({ names: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'] });
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return Promise.resolve({ accountId: '123456789012' });
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return Promise.resolve({ id: 'ami-12345678' });
    }
    if (args.token === 'aws:elb/getServiceAccount:getServiceAccount') {
      return Promise.resolve({ arn: '123456789012' });
    }
    return Promise.resolve(args.inputs || {});
  },
});

describe('Unit Tests - TAP Stack', () => {

  describe('TapStack Class', () => {
    let stack: TapStack;

    it('TapStack class is defined', () => {
      expect(TapStack).toBeDefined();
      expect(typeof TapStack).toBe('function');
    });

    it('instantiates with custom props', () => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          ManagedBy: 'Pulumi',
        },
      });
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.natGatewayIp).toBeDefined();
    });

    it('instantiates with default environment suffix', () => {
      stack = new TapStack('TestTapStackDefault', {});
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.natGatewayIp).toBeDefined();
    });

    it('creates infrastructure with environment suffix', () => {
      stack = new TapStack('TestTapStackEnv', { environmentSuffix: 'staging' });
      expect(stack).toBeDefined();
    });

    it('applies tags correctly', () => {
      const tags = { Environment: 'test', Project: 'tap' };
      stack = new TapStack('TestTapStackTags', { tags });
      expect(stack).toBeDefined();
    });
  });

  describe('ProductionInfrastructure Class', () => {
    it('ProductionInfrastructure class is defined', () => {
      expect(ProductionInfrastructure).toBeDefined();
      expect(typeof ProductionInfrastructure.create).toBe('function');
    });

    it('creates infrastructure with environment suffix', () => {
      const infrastructure = ProductionInfrastructure.create('test');
      expect(infrastructure).toBeDefined();
      expect(typeof infrastructure.getOutputs).toBe('function');
    });

    it('creates infrastructure with different environment', () => {
      const infrastructure = ProductionInfrastructure.create('staging');
      expect(infrastructure).toBeDefined();
      expect(typeof infrastructure.getOutputs).toBe('function');
    });

    it('getOutputs returns expected structure', () => {
      const infrastructure = ProductionInfrastructure.create('test');
      const outputs = infrastructure.getOutputs();

      expect(outputs).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.natGatewayIp).toBeDefined();
      expect(outputs.albArn).toBeDefined();
      expect(outputs.targetGroupArn).toBeDefined();
      expect(outputs.autoScalingGroupName).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.ec2SecurityGroupId).toBeDefined();
      expect(outputs.rdsSecurityGroupId).toBeDefined();
      expect(outputs.albSecurityGroupId).toBeDefined();
      expect(outputs.rdsInstanceId).toBeDefined();
      expect(outputs.launchTemplateId).toBeDefined();
      expect(outputs.vpcFlowLogGroupName).toBeDefined();
      expect(outputs.webAclId).toBeDefined();
      expect(outputs.webAclArn).toBeDefined();
      expect(outputs.cloudFrontDomainName).toBeDefined();
      expect(outputs.cloudFrontDistributionId).toBeDefined();
      expect(outputs.internetGatewayId).toBeDefined();
      expect(outputs.publicRouteTableId).toBeDefined();
      expect(outputs.privateRouteTableId).toBeDefined();
    });
  });

  describe('Unit Tests - ProductionInfrastructure', () => {
    let infrastructure: ProductionInfrastructure;

    beforeAll(() => {
      infrastructure = ProductionInfrastructure.create('test');
    });

    it('creates infrastructure successfully', () => {
      expect(infrastructure).toBeDefined();
    });

    it('has networking components', () => {
      expect(infrastructure.vpc).toBeDefined();
      expect(infrastructure.publicSubnets).toBeDefined();
      expect(infrastructure.privateSubnets).toBeDefined();
      expect(infrastructure.internetGateway).toBeDefined();
      expect(infrastructure.natGateway).toBeDefined();
    });

    it('has security components', () => {
      expect(infrastructure.ec2SecurityGroup).toBeDefined();
      expect(infrastructure.rdsSecurityGroup).toBeDefined();
      expect(infrastructure.albSecurityGroup).toBeDefined();
    });

    it('has storage components', () => {
      expect(infrastructure.kmsKey).toBeDefined();
      expect(infrastructure.s3Bucket).toBeDefined();
    });

    it('has database components', () => {
      expect(infrastructure.rdsSubnetGroup).toBeDefined();
      expect(infrastructure.rdsInstance).toBeDefined();
    });

    it('has compute components', () => {
      expect(infrastructure.ec2Role).toBeDefined();
      expect(infrastructure.launchTemplate).toBeDefined();
      expect(infrastructure.targetGroup).toBeDefined();
      expect(infrastructure.applicationLoadBalancer).toBeDefined();
      expect(infrastructure.autoScalingGroup).toBeDefined();
    });

    it('has monitoring components', () => {
      expect(infrastructure.cpuAlarmHigh).toBeDefined();
      expect(infrastructure.cpuAlarmLow).toBeDefined();
      expect(infrastructure.rdsConnectionsAlarm).toBeDefined();
      expect(infrastructure.rdsCpuAlarm).toBeDefined();
      expect(infrastructure.vpcFlowLogGroup).toBeDefined();
      expect(infrastructure.appLogGroup).toBeDefined();
    });

    it('has CloudFront and WAF components', () => {
      expect(infrastructure.webAcl).toBeDefined();
      expect(infrastructure.cloudFrontDistribution).toBeDefined();
    });

    it('has VPC Flow Logs configured', () => {
      expect(infrastructure.vpcFlowLog).toBeDefined();
      expect(infrastructure.vpcFlowLogRole).toBeDefined();
    });

    it('returns correct outputs', () => {
      const outputs = infrastructure.getOutputs();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.natGatewayIp).toBeDefined();
    });
  });

  describe('Unit Tests - requirements Validation', () => {
    let promptContent: string;

    beforeAll(() => {
      const promptPath = path.join(__dirname, '..', 'lib', 'PROMPT.md');
      if (fs.existsSync(promptPath)) {
        promptContent = fs.readFileSync(promptPath, 'utf-8');
      }
    });

    it('PROMPT.md file exists', () => {
      expect(promptContent).toBeDefined();
    });

    it('contains required infrastructure components', () => {
      expect(promptContent).toContain('VPC');
      expect(promptContent).toContain('EC2');
      expect(promptContent).toContain('RDS');
      expect(promptContent).toContain('S3');
      expect(promptContent).toContain('Auto Scaling');
      expect(promptContent).toContain('ALB');
    });

    it('specifies ap-south-1 region', () => {
      expect(promptContent).toContain('ap-south-1');
    });

    it('mentions security requirements', () => {
      expect(promptContent).toContain('KMS');
      expect(promptContent).toContain('encryption');
      expect(promptContent).toContain('IAM');
    });

    it('includes networking requirements', () => {
      expect(promptContent).toContain('10.0.0.0/16');
      expect(promptContent).toContain('public subnets');
      expect(promptContent).toContain('private subnets');
      expect(promptContent).toContain('NAT Gateway');
    });
  });

  describe('Unit Tests - bin/tap.ts', () => {
    it('bin/tap module can be imported', () => {
      const tapModule = require('../bin/tap');
      expect(tapModule).toBeDefined();
    });

    it('handles environment variables', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'test';

      delete require.cache[require.resolve('../bin/tap')];
      const tapModule = require('../bin/tap');
      expect(tapModule).toBeDefined();

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });

    it('uses default environment when not set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      delete require.cache[require.resolve('../bin/tap')];
      const tapModule = require('../bin/tap');
      expect(tapModule).toBeDefined();

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });
  });

});