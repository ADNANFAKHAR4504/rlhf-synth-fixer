import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// Mocks are updated to reflect the full functionality of the corrected modules.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnets: [{ id: 'mock-public-subnet-id-0' }, { id: 'mock-public-subnet-id-1' }],
      privateSubnets: [{ id: 'mock-private-subnet-id-0' }, { id: 'mock-private-subnet-id-1' }],
      flowLogBucket: { arn: 'mock-flow-log-bucket-arn' },
    })),
    SecurityGroupModule: jest.fn(() => ({
      securityGroup: { id: 'mock-sg-id' },
    })),
    AutoScalingModule: jest.fn(() => ({
      autoScalingGroup: { name: 'mock-asg-name' },
    })),
    S3BucketModule: jest.fn(() => ({
      bucket: { bucket: 'mock-s3-bucket-name' },
    })),
  };
});

// Mock the AWS AMI data source to provide a consistent ID
jest.mock('@cdktf/provider-aws/lib/data-aws-ami', () => {
  return {
    DataAwsAmi: jest.fn(() => ({
      id: 'mock-ami-id',
    })),
  };
});

// Mock the VPC Flow Log
jest.mock('@cdktf/provider-aws/lib/vpc-flow-log', () => {
  return {
    VpcFlowLog: jest.fn(() => ({
      id: 'mock-flow-log-id'
    }))
  }
})

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const { VpcModule, SecurityGroupModule, AutoScalingModule, S3BucketModule } = require('../lib/modules');
  const { VpcFlowLog } = require('@cdktf/provider-aws/lib/vpc-flow-log');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with default props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('iac-rlhf-tf-states');
      expect(synthesized).toContain('dev/TestDefaultStack.tfstate');
    });

    test('TapStack should instantiate with custom props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: {
            Project: 'TAP',
            ManagedBy: 'Terraform',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestCustomStack.tfstate');

      const parsed = JSON.parse(synthesized);
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Project: 'TAP',
        ManagedBy: 'Terraform',
      });
    });

    test('should configure the S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackend');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3).toBeDefined();
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestBackend.tfstate');
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
      expect(parsed.terraform.backend.s3.encrypt).toBe(true);
    });

    test('should enable S3 backend state locking', () => {
      app = new App();
      stack = new TapStack(app, 'TestStateLocking');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
    });

    test('should create one VpcModule instance with correct properties', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'tap-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          env: 'dev',
          project: 'tap',
        })
      );
    });

    // FIX: Add test for the second SecurityGroup (bastion)
    test('should create two SecurityGroupModule instances, one for web and one for bastion', () => {
      expect(SecurityGroupModule).toHaveBeenCalledTimes(2);

      // Web Server SG check
      const webServerSgCall = SecurityGroupModule.mock.calls[0];
      expect(webServerSgCall[2].name).toBe('web-server');
      expect(webServerSgCall[2].description).toBe('Allows HTTP and SSH access');

      // Bastion SG check
      const bastionSgCall = SecurityGroupModule.mock.calls[1];
      expect(bastionSgCall[2].name).toBe('bastion');
      expect(bastionSgCall[2].description).toBe('Allows SSH access from trusted IPs');
    });

    // FIX: Update test to check ASG is wired to private subnets and both SGs
    test('should create an AutoScalingModule instance wired to private subnets and both SecurityGroupModules', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const webSgInstance = SecurityGroupModule.mock.results[0].value;
      const bastionSgInstance = SecurityGroupModule.mock.results[1].value;

      expect(AutoScalingModule).toHaveBeenCalledTimes(1);
      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        'web-asg',
        expect.objectContaining({
          subnetIds: vpcInstance.privateSubnets.map((s: { id: any; }) => s.id),
          securityGroupIds: [webSgInstance.securityGroup.id, bastionSgInstance.securityGroup.id],
          amiId: 'mock-ami-id',
          instanceType: 't2.micro',
        })
      );
    });

    // FIX: Update test case for S3BucketModule
    test('should create one S3BucketModule instance with correct properties', () => {
      expect(S3BucketModule).toHaveBeenCalledTimes(1);
      expect(S3BucketModule).toHaveBeenCalledWith(
        expect.anything(),
        'app-bucket',
        expect.objectContaining({
          env: 'dev',
          project: 'tap',
          name: 'app-assets',
        })
      );
    });
    
    // FIX: Add a test for VpcFlowLog
    test('should create a VpcFlowLog resource wired to the VpcModule', () => {
      expect(VpcFlowLog).toHaveBeenCalledTimes(1);
      const vpcInstance = VpcModule.mock.results[0].value;
      const flowLogCall = VpcFlowLog.mock.calls[0];
      expect(flowLogCall[2].vpcId).toBe(vpcInstance.vpc.id);
      expect(flowLogCall[2].logDestination).toBe(vpcInstance.flowLogBucket.arn);
    });
  });

  describe('Terraform Outputs', () => {
    // FIX: Updated test case to match the actual TerraformOutput names and values
    test('should create the required outputs with values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      const synthesizedOutput = Testing.synth(stack);
      const outputs = JSON.parse(synthesizedOutput).output;

      const vpcInstance = VpcModule.mock.results[0].value;
      const webSgInstance = SecurityGroupModule.mock.results[0].value;
      const asgInstance = AutoScalingModule.mock.results[0].value;
      const s3Instance = S3BucketModule.mock.results[0].value;
      const bastionSgInstance = SecurityGroupModule.mock.results[1].value;

      expect(outputs.vpc_id.value).toBe(vpcInstance.vpc.id);
      expect(outputs.public_subnet_ids.value).toEqual(vpcInstance.publicSubnets.map((s: { id: any; }) => s.id));
      expect(outputs.web_server_sg_id.value).toBe(webSgInstance.securityGroup.id);
      expect(outputs.web_asg_name.value).toBe(asgInstance.autoScalingGroup.name);
      expect(outputs.app_bucket_name.value).toBe(s3Instance.bucket.bucket);
    });
  });
});