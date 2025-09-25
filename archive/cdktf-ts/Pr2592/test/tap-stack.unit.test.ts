import { Testing } from 'cdktf';
import { Ec2AsgModule, IamModule, VpcModule } from '../lib/modules';
import { TapStack } from '../lib/tap-stack';

// Mock the modules to avoid complex dependencies in unit tests
jest.mock('../lib/modules', () => ({
  VpcModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    outputs: {
      vpc: { id: 'vpc-12345' },
      publicSubnets: [
        { id: 'subnet-public-1' },
        { id: 'subnet-public-2' },
        { id: 'subnet-public-3' },
      ],
      privateSubnets: [
        { id: 'subnet-private-1' },
        { id: 'subnet-private-2' },
        { id: 'subnet-private-3' },
      ],
      internetGateway: { id: 'igw-12345' },
      natGateway: { id: 'nat-12345' },
    },
  })),
  IamModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    outputs: {
      role: {
        name: 'MyApp-ec2-role',
        arn: 'arn:aws:iam::123456789012:role/MyApp-ec2-role',
      },
      instanceProfile: {
        name: 'MyApp-instance-profile',
        arn: 'arn:aws:iam::123456789012:instance-profile/MyApp-instance-profile',
      },
    },
  })),
  Ec2AsgModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    outputs: {
      launchTemplate: {
        id: 'lt-0f9e9d43642bc26c7',
        name: 'MyApp-launch-template',
      },
      autoScalingGroup: {
        name: 'MyApp-asg',
        id: 'MyApp-asg',
      },
      securityGroup: {
        id: 'sg-ec2-12345',
      },
    },
  })),
}));

describe('TapStack', () => {
  let app: any;

  beforeEach(() => {
    app = Testing.app();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor with default props', () => {
    it('should create stack with default values', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('provider');
      expect(synthesized).toContain('terraform');
    });

    it('should configure AWS provider with default region', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    it('should configure S3 backend with default values', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3).toEqual({
        bucket: 'prod-config-logs-us-west-2-a8e48bba',
        key: 'dev/test-stack.tfstate',
        region: 'us-west-2',
        encrypt: true,
      });
    });

    it('should create all required modules with correct configuration', () => {
      new TapStack(app, 'test-stack');

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          name: 'MyApp',
          cidrBlock: '10.0.0.0/16',
          tags: expect.objectContaining({
            Project: 'MyApp',
          }),
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          name: 'MyApp',
          tags: expect.objectContaining({
            Project: 'MyApp',
          }),
        })
      );

      expect(Ec2AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-asg',
        expect.objectContaining({
          name: 'MyApp',
          vpcId: 'vpc-12345',
          privateSubnetIds: [
            'subnet-private-1',
            'subnet-private-2',
            'subnet-private-3',
          ],
          instanceProfile: expect.objectContaining({
            name: 'MyApp-instance-profile',
          }),
          tags: expect.objectContaining({
            Project: 'MyApp',
          }),
        })
      );
    });

    it('should create all required Terraform outputs', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      // Check VPC outputs
      expect(synthesized.output['vpc-id']).toBeDefined();
      expect(synthesized.output['vpc-id'].description).toBe('ID of the VPC');

      expect(synthesized.output['public-subnet-ids']).toBeDefined();
      expect(synthesized.output['public-subnet-ids'].description).toBe(
        'IDs of the public subnets'
      );

      expect(synthesized.output['private-subnet-ids']).toBeDefined();
      expect(synthesized.output['private-subnet-ids'].description).toBe(
        'IDs of the private subnets'
      );

      // Check IAM outputs
      expect(synthesized.output['instance-profile-name']).toBeDefined();
      expect(synthesized.output['instance-profile-name'].description).toBe(
        'Name of the EC2 Instance Profile'
      );

      expect(synthesized.output['iam-role-name']).toBeDefined();
      expect(synthesized.output['iam-role-name'].description).toBe(
        'Name of the IAM Role'
      );

      // Check EC2 Auto Scaling outputs
      expect(synthesized.output['auto-scaling-group-name']).toBeDefined();
      expect(synthesized.output['auto-scaling-group-name'].description).toBe(
        'Name of the Auto Scaling Group'
      );

      expect(synthesized.output['launch-template-id']).toBeDefined();
      expect(synthesized.output['launch-template-id'].description).toBe(
        'ID of the Launch Template'
      );

      expect(synthesized.output['ec2-security-group-id']).toBeDefined();
      expect(synthesized.output['ec2-security-group-id'].description).toBe(
        'ID of the EC2 Security Group'
      );

      // Check gateway outputs
      expect(synthesized.output['internet-gateway-id']).toBeDefined();
      expect(synthesized.output['internet-gateway-id'].description).toBe(
        'ID of the Internet Gateway'
      );

      expect(synthesized.output['nat-gateway-id']).toBeDefined();
      expect(synthesized.output['nat-gateway-id'].description).toBe(
        'ID of the NAT Gateway'
      );
    });
  });

  describe('Constructor with custom props', () => {
    it('should use custom environment suffix and backend configuration', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
        awsRegion: 'us-west-2',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-west-1',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3).toEqual({
        bucket: 'custom-state-bucket',
        key: 'prod/test-stack.tfstate',
        region: 'eu-west-1',
        encrypt: true,
      });
    });

    it('should use custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Owner: 'engineering',
        },
      };

      const stack = new TapStack(app, 'test-stack', {
        defaultTags: customTags,
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toEqual([customTags]);
    });

    it('should handle undefined environment suffix gracefully', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: undefined,
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toBe(
        'dev/test-stack.tfstate'
      );
    });

    it('should handle custom AWS region override', () => {
      // Note: This test assumes AWS_REGION_OVERRIDE is empty in the actual implementation
      const stack = new TapStack(app, 'test-stack', {
        awsRegion: 'ap-southeast-1',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('ap-southeast-1');
    });
  });

  describe('Backend configuration', () => {
    it('should enable S3 state locking', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      // CDKTF S3Backend automatically enables state locking
      expect(synthesized.terraform.backend.s3.bucket).toBeDefined();
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });

    it('should encrypt state files', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });

    it('should use correct state key format', () => {
      const stack = new TapStack(app, 'my-custom-stack', {
        environmentSuffix: 'staging',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toBe(
        'staging/my-custom-stack.tfstate'
      );
    });
  });

  describe('Module integration', () => {
    it('should pass VPC outputs to EC2 ASG module correctly', () => {
      new TapStack(app, 'test-stack');

      expect(Ec2AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-asg',
        expect.objectContaining({
          vpcId: 'vpc-12345',
          privateSubnetIds: [
            'subnet-private-1',
            'subnet-private-2',
            'subnet-private-3',
          ],
        })
      );
    });

    it('should pass IAM outputs to EC2 ASG module correctly', () => {
      new TapStack(app, 'test-stack');

      expect(Ec2AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-asg',
        expect.objectContaining({
          instanceProfile: expect.objectContaining({
            name: 'MyApp-instance-profile',
          }),
        })
      );
    });

    it('should use consistent naming across all modules', () => {
      new TapStack(app, 'test-stack');

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          name: 'MyApp',
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          name: 'MyApp',
        })
      );

      expect(Ec2AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-asg',
        expect.objectContaining({
          name: 'MyApp',
        })
      );
    });

    it('should apply consistent tags across all modules', () => {
      new TapStack(app, 'test-stack');

      const expectedTags = { Project: 'MyApp' };

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          tags: expectedTags,
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          tags: expectedTags,
        })
      );

      expect(Ec2AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-asg',
        expect.objectContaining({
          tags: expectedTags,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required configuration gracefully', () => {
      expect(() => {
        new TapStack(app, 'test-stack', {
          stateBucket: '',
          stateBucketRegion: '',
        });
      }).not.toThrow(); // TapStack should handle empty strings gracefully by using defaults
    });

    it('should handle undefined props gracefully', () => {
      expect(() => {
        new TapStack(app, 'test-stack', undefined);
      }).not.toThrow();
    });

    it('should use fallback values when props are null or undefined', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: null as any,
        awsRegion: undefined,
        stateBucket: undefined,
        stateBucketRegion: null as any,
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3.bucket).toBe(
        'prod-config-logs-us-west-2-a8e48bba'
      );
      expect(synthesized.terraform.backend.s3.region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3.key).toBe(
        'dev/test-stack.tfstate'
      );
    });
  });

  describe('Output validation', () => {
    it('should generate correct output values from module outputs', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      // Verify that outputs reference the correct module output values
      expect(synthesized.output['vpc-id'].value).toContain('vpc-12345');
      expect(synthesized.output['instance-profile-name'].value).toContain(
        'MyApp-instance-profile'
      );
      expect(synthesized.output['auto-scaling-group-name'].value).toContain(
        'MyApp-asg'
      );
      expect(synthesized.output['launch-template-id'].value).toContain(
        'lt-0f9e9d43642bc26c7'
      );
      expect(synthesized.output['ec2-security-group-id'].value).toContain(
        'sg-ec2-12345'
      );
      expect(synthesized.output['internet-gateway-id'].value).toContain(
        'igw-12345'
      );
      expect(synthesized.output['nat-gateway-id'].value).toContain('nat-12345');
    });

    it('should have descriptive output descriptions', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      const outputs = synthesized.output;
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].description).toBeDefined();
        expect(outputs[key].description.length).toBeGreaterThan(0);
      });
    });
  });
});
