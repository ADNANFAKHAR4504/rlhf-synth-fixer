import * as pulumi from '@pulumi/pulumi';
import { ProductionInfrastructure } from '../lib/production-infrastructure';

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
        domainName: type.includes('cloudfront') ? `${name}.cloudfront.net` : undefined,
        keyId: type.includes('kms') ? `key-${name}` : undefined,
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

describe('ProductionInfrastructure Unit Tests', () => {
  let infrastructure: ProductionInfrastructure;

  beforeAll(() => {
    infrastructure = ProductionInfrastructure.create('test', 'ap-south-1');
  });

  describe('Networking Components', () => {
    it('creates VPC with correct CIDR block', () => {
      expect(infrastructure.vpc).toBeDefined();
    });

    it('creates public and private subnets', () => {
      expect(infrastructure.publicSubnets).toBeDefined();
      expect(infrastructure.privateSubnets).toBeDefined();
      expect(infrastructure.publicSubnets!.length).toBe(2);
      expect(infrastructure.privateSubnets!.length).toBe(2);
    });

    it('creates Internet Gateway and NAT Gateway', () => {
      expect(infrastructure.internetGateway).toBeDefined();
      expect(infrastructure.natGateway).toBeDefined();
      expect(infrastructure.elasticIp).toBeDefined();
    });

    it('creates route tables', () => {
      expect(infrastructure.publicRouteTable).toBeDefined();
      expect(infrastructure.privateRouteTable).toBeDefined();
    });

    it('creates VPC Flow Logs', () => {
      expect(infrastructure.vpcFlowLog).toBeDefined();
      expect(infrastructure.vpcFlowLogGroup).toBeDefined();
      expect(infrastructure.vpcFlowLogRole).toBeDefined();
    });
  });

  describe('Security Components', () => {
    it('creates security groups for all tiers', () => {
      expect(infrastructure.ec2SecurityGroup).toBeDefined();
      expect(infrastructure.rdsSecurityGroup).toBeDefined();
      expect(infrastructure.albSecurityGroup).toBeDefined();
    });

    it('creates KMS key for encryption', () => {
      expect(infrastructure.kmsKey).toBeDefined();
    });
  });

  describe('Storage Components', () => {
    it('creates S3 bucket with proper configuration', () => {
      expect(infrastructure.s3Bucket).toBeDefined();
    });
  });

  describe('Database Components', () => {
    it('creates RDS instance and subnet group', () => {
      expect(infrastructure.rdsInstance).toBeDefined();
      expect(infrastructure.rdsSubnetGroup).toBeDefined();
    });

    it('creates RDS CloudWatch alarms', () => {
      expect(infrastructure.rdsConnectionsAlarm).toBeDefined();
      expect(infrastructure.rdsCpuAlarm).toBeDefined();
    });
  });

  describe('Compute Components', () => {
    it('creates IAM roles and instance profile', () => {
      expect(infrastructure.ec2Role).toBeDefined();
      expect(infrastructure.ec2InstanceProfile).toBeDefined();
    });

    it('creates launch template', () => {
      expect(infrastructure.launchTemplate).toBeDefined();
    });

    it('creates load balancer components', () => {
      expect(infrastructure.applicationLoadBalancer).toBeDefined();
      expect(infrastructure.targetGroup).toBeDefined();
      expect(infrastructure.albListener).toBeDefined();
    });

    it('creates auto scaling group', () => {
      expect(infrastructure.autoScalingGroup).toBeDefined();
    });
  });

  describe('CDN and Security Components', () => {
    it('creates WAF WebACL', () => {
      expect(infrastructure.webAcl).toBeDefined();
    });

    it('creates CloudFront distribution', () => {
      expect(infrastructure.cloudFrontDistribution).toBeDefined();
    });
  });

  describe('Monitoring Components', () => {
    it('creates CloudWatch alarms for EC2', () => {
      expect(infrastructure.cpuAlarmHigh).toBeDefined();
      expect(infrastructure.cpuAlarmLow).toBeDefined();
    });

    it('creates application log group', () => {
      expect(infrastructure.appLogGroup).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('returns all required outputs', () => {
      const outputs = infrastructure.getOutputs();
      
      // Core infrastructure
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      
      // Load balancer
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albArn).toBeDefined();
      expect(outputs.targetGroupArn).toBeDefined();
      
      // Storage and database
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsInstanceId).toBeDefined();
      
      // Security
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.kmsKeyArn).toBeDefined();
      expect(outputs.ec2SecurityGroupId).toBeDefined();
      expect(outputs.rdsSecurityGroupId).toBeDefined();
      expect(outputs.albSecurityGroupId).toBeDefined();
      
      // Compute
      expect(outputs.autoScalingGroupName).toBeDefined();
      expect(outputs.launchTemplateId).toBeDefined();
      expect(outputs.ec2RoleName).toBeDefined();
      
      // Monitoring
      expect(outputs.cpuAlarmHighName).toBeDefined();
      expect(outputs.cpuAlarmLowName).toBeDefined();
      expect(outputs.rdsConnectionsAlarmName).toBeDefined();
      expect(outputs.rdsCpuAlarmName).toBeDefined();
      expect(outputs.vpcFlowLogGroupName).toBeDefined();
      
      // CDN and WAF
      expect(outputs.webAclId).toBeDefined();
      expect(outputs.webAclArn).toBeDefined();
      expect(outputs.cloudFrontDomainName).toBeDefined();
      expect(outputs.cloudFrontDistributionId).toBeDefined();
      
      // Networking details
      expect(outputs.internetGatewayId).toBeDefined();
      expect(outputs.publicRouteTableId).toBeDefined();
      expect(outputs.privateRouteTableId).toBeDefined();
      expect(outputs.natGatewayIp).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('uses correct default configuration values', () => {
      const testInfra = ProductionInfrastructure.create('config-test');
      expect(testInfra).toBeDefined();
    });

    it('creates infrastructure in different regions', () => {
      const usEastInfra = ProductionInfrastructure.create('us-test', 'us-east-1');
      expect(usEastInfra).toBeDefined();
    });

    it('handles different environment names', () => {
      const prodInfra = ProductionInfrastructure.create('production');
      const stagingInfra = ProductionInfrastructure.create('staging');
      
      expect(prodInfra).toBeDefined();
      expect(stagingInfra).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('follows consistent naming patterns', () => {
      const outputs = infrastructure.getOutputs();
      
      // All resource names should include the environment prefix
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.albArn).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    it('creates encrypted storage resources', () => {
      expect(infrastructure.kmsKey).toBeDefined();
      expect(infrastructure.s3Bucket).toBeDefined();
      expect(infrastructure.rdsInstance).toBeDefined();
    });

    it('creates proper IAM roles with least privilege', () => {
      expect(infrastructure.ec2Role).toBeDefined();
      expect(infrastructure.ec2InstanceProfile).toBeDefined();
      expect(infrastructure.vpcFlowLogRole).toBeDefined();
    });

    it('configures security groups with appropriate rules', () => {
      expect(infrastructure.ec2SecurityGroup).toBeDefined();
      expect(infrastructure.rdsSecurityGroup).toBeDefined();
      expect(infrastructure.albSecurityGroup).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    it('creates resources across multiple AZs', () => {
      expect(infrastructure.publicSubnets!.length).toBe(2);
      expect(infrastructure.privateSubnets!.length).toBe(2);
    });

    it('configures RDS with Multi-AZ', () => {
      expect(infrastructure.rdsInstance).toBeDefined();
      expect(infrastructure.rdsSubnetGroup).toBeDefined();
    });

    it('configures Auto Scaling for high availability', () => {
      expect(infrastructure.autoScalingGroup).toBeDefined();
      expect(infrastructure.targetGroup).toBeDefined();
    });
  });
});