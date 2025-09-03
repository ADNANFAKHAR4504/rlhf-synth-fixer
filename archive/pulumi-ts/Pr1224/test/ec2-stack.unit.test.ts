// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  ec2: {
    getAmi: jest.fn().mockResolvedValue({
      id: 'ami-12345678',
      name: 'amzn2-ami-hvm-2.0.20230101-x86_64-gp2',
    }),
    Instance: jest.fn().mockImplementation((name, args) => ({
      id: `mock-instance-${name}`,
      arn: `arn:aws:ec2:us-east-1:123456789012:instance/mock-instance-${name}`,
      privateIp: '10.0.1.100',
      publicIp: '',
    })),
  },
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
  output: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
}));

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { Ec2Stack } from '../lib/stacks/ec2-stack';

describe('Ec2Stack Unit Tests', () => {
  let ec2Stack: Ec2Stack;
  const mockPrivateSubnetIds = ['subnet-12345', 'subnet-67890'];
  const mockWebSecurityGroupId = 'sg-web123456';
  const mockInstanceProfileName = 'tap-ec2-profile-test';
  const mockKmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/mock-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create EC2 stack with required parameters', () => {
      ec2Stack = new Ec2Stack('test-ec2', {
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });
      expect(ec2Stack).toBeDefined();
    });

    it('should create EC2 stack with custom parameters', () => {
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'prod',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
        instanceType: 't3.large',
        enableKeyPairs: true,
        tags: { Environment: 'prod' },
      });
      expect(ec2Stack).toBeDefined();
    });
  });

  describe('AMI Selection', () => {
    beforeEach(() => {
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should fetch latest Amazon Linux 2023 AMI', () => {
      expect(aws.ec2.getAmi).toHaveBeenCalledWith({
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['al2023-ami-*-x86_64'],
          },
          {
            name: 'architecture',
            values: ['x86_64'],
          },
          {
            name: 'virtualization-type',
            values: ['hvm'],
          },
          {
            name: 'state',
            values: ['available'],
          },
        ],
      });
    });
  });

  describe('EC2 Instance Creation', () => {
    beforeEach(() => {
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
        instanceType: 't3.small',
      });
    });

    it('should create EC2 instance with correct basic configuration', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        'tap-web-server-test',
        expect.objectContaining({
          instanceType: 't3.small',
          vpcSecurityGroupIds: [mockWebSecurityGroupId],
          iamInstanceProfile: mockInstanceProfileName,
          associatePublicIpAddress: false,
          monitoring: true,
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create EC2 instance with secure metadata options', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadataOptions: expect.objectContaining({
            httpEndpoint: 'enabled',
            httpTokens: 'required',
            httpPutResponseHopLimit: 1,
            instanceMetadataTags: 'enabled',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create EC2 instance with encrypted root volume', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rootBlockDevice: expect.objectContaining({
            volumeType: 'gp3',
            volumeSize: 30,
            encrypted: true,
            kmsKeyId: mockKmsKeyArn,
            deleteOnTermination: true,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create EC2 instance with proper tags', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tap-web-server-test',
            Purpose: 'SecureWebServer',
            Environment: 'test',
            AutoStartStop: 'true',
            BackupRequired: 'true',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create EC2 instance with user data script', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userDataBase64: expect.any(String),
        }),
        expect.any(Object)
      );
    });

    it('should use default instance type when not provided', () => {
      ec2Stack = new Ec2Stack('test-ec2-default', {
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          instanceType: 't3.micro',
        }),
        expect.any(Object)
      );
    });

    it('should not assign key pair by default', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          keyName: undefined,
        }),
        expect.any(Object)
      );
    });

    it('should assign key pair when enabled', () => {
      ec2Stack = new Ec2Stack('test-ec2-keypair', {
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
        enableKeyPairs: true,
      });

      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          keyName: 'my-key-pair',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in instance name', () => {
      const environmentSuffix = 'staging';
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix,
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        `tap-web-server-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix,
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-web-server-${environmentSuffix}`,
            Environment: environmentSuffix,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should include environment suffix in user data', () => {
      const environmentSuffix = 'test';
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix,
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      const instanceCall = (aws.ec2.Instance as unknown as jest.Mock).mock.calls[0];
      const userData = Buffer.from(instanceCall[1].userDataBase64, 'base64').toString();
      expect(userData).toContain(`TAP Secure Web Server - ${environmentSuffix}`);
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should disable public IP assignment', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          associatePublicIpAddress: false,
        }),
        expect.any(Object)
      );
    });

    it('should enforce IMDSv2', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadataOptions: expect.objectContaining({
            httpTokens: 'required',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should enable detailed monitoring', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          monitoring: true,
        }),
        expect.any(Object)
      );
    });

    it('should encrypt root volume with KMS', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rootBlockDevice: expect.objectContaining({
            encrypted: true,
            kmsKeyId: mockKmsKeyArn,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should enable termination protection for production', () => {
      ec2Stack = new Ec2Stack('test-ec2-prod', {
        environmentSuffix: 'prod',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          disableApiTermination: true,
        }),
        expect.any(Object)
      );
    });

    it('should not enable termination protection for non-production', () => {
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          disableApiTermination: false,
        }),
        expect.any(Object)
      );
    });
  });

  describe('User Data Script', () => {
    beforeEach(() => {
      ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        webSecurityGroupId: mockWebSecurityGroupId,
        ec2InstanceProfileName: mockInstanceProfileName,
        mainKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should include CloudWatch agent installation', () => {
      const instanceCall = (aws.ec2.Instance as unknown as jest.Mock).mock.calls[0];
      const userData = Buffer.from(instanceCall[1].userDataBase64, 'base64').toString();
      
      expect(userData).toContain('yum install -y amazon-cloudwatch-agent');
      expect(userData).toContain('amazon-cloudwatch-agent-ctl');
    });

    it('should include security hardening commands', () => {
      const instanceCall = (aws.ec2.Instance as unknown as jest.Mock).mock.calls[0];
      const userData = Buffer.from(instanceCall[1].userDataBase64, 'base64').toString();
      
      expect(userData).toContain('net.ipv4.conf.all.send_redirects = 0');
      expect(userData).toContain('net.ipv4.conf.all.accept_source_route = 0');
      expect(userData).toContain('sysctl -p');
    });

    it('should include web server setup', () => {
      const instanceCall = (aws.ec2.Instance as unknown as jest.Mock).mock.calls[0];
      const userData = Buffer.from(instanceCall[1].userDataBase64, 'base64').toString();
      
      expect(userData).toContain('yum install -y httpd');
      expect(userData).toContain('systemctl enable httpd');
      expect(userData).toContain('systemctl start httpd');
    });
  });
});
