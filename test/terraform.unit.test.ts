// test/terraform.unit.test.ts
import { App } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocks ---

// Mock TerraformOutput & S3Backend to avoid constructing real outputs/backends
jest.mock('cdktf', () => {
  const actual = jest.requireActual('cdktf');
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS provider to assert region/tags config
jest.mock('@cdktf/provider-aws/lib/provider', () => ({
  AwsProvider: jest.fn(),
}));

// Mock Random provider + Id
jest.mock('@cdktf/provider-random/lib/provider', () => ({
  RandomProvider: jest.fn(),
}));
jest.mock('@cdktf/provider-random/lib/id', () => ({
  Id: jest.fn((_, __, cfg) => ({
    // stable hex so we can assert bucket suffix deterministically
    hex: 'abcd',
    byteLength: cfg?.byteLength ?? 2,
  })),
}));

// Mock your modules (./modules)
jest.mock('../lib/modules', () => {
  return {
    // Networking returns VPC, subnets, GW/RT ids etc.
    NetworkingModule: jest.fn((_, id, config) => ({
      vpc: { id: 'vpc-123' },
      publicSubnets: [{ id: 'subnet-public-1' }, { id: 'subnet-public-2' }],
      privateSubnets: [{ id: 'subnet-private-1' }, { id: 'subnet-private-2' }],
      internetGateway: { id: 'igw-123' },
      natGateway: { id: 'nat-123' },
      publicRouteTable: { id: 'rtb-public' },
      privateRouteTable: { id: 'rtb-private' },
      config,
    })),

    // Security returns the EC2 SG id
    SecurityModule: jest.fn((_, id, config) => ({
      ec2SecurityGroup: { id: 'sg-ec2' },
      config,
    })),

    // Storage returns S3 bucket meta
    StorageModule: jest.fn((_, id, config) => ({
      s3Bucket: {
        id: 'bucket-id',
        arn: 'arn:aws:s3:::tap-dev-app-data-abcd',
        bucket: `tap-dev-app-data-${config.bucketSuffix}`,
      },
      config,
    })),

    // Compute returns instance + role meta
    ComputeModule: jest.fn((_, id, config) => ({
      ec2Instance: {
        id: 'i-0123456789abcdef0',
        publicIp: '54.0.0.1',
        privateIp: '10.0.0.10',
      },
      iamRole: { arn: 'arn:aws:iam::123456789012:role/tap-dev-EC2Role-xyz' },
      config,
    })),

    // Re-exports used by older code paths (unused here but harmless)
    VpcModule: undefined,
    S3Module: undefined,
    Ec2Module: undefined,
    SecurityGroupModule: undefined,
    KmsModule: undefined,
    RdsModule: undefined,
    IamModule: undefined,
    CloudTrailModule: undefined,
  };
});

// Pull mocks we want to assert on
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput } from 'cdktf';
import {
  NetworkingModule,
  SecurityModule,
  StorageModule,
  ComputeModule,
} from '../lib/modules';

describe('TapStack (current wiring) – unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates provider with default region and tags', () => {
    const app = new App();
    new TapStack(app, 'TestStack');
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ region: 'us-west-2', defaultTags: [] })
    );
  });

  test('resolves region with testing override present', () => {
    const app = new App();
    new TapStack(app, 'StackOverride', {
      _regionOverrideForTesting: 'eu-west-1',
    });
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ region: 'eu-west-1' })
    );
  });

  test('falls back to props.awsRegion when override present but null', () => {
    const app = new App();
    new TapStack(app, 'StackPropsRegion', {
      _regionOverrideForTesting: null,
      awsRegion: 'us-east-1',
    });
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ region: 'us-east-1' })
    );
  });

  test('configures S3 backend correctly', () => {
    const app = new App();
    new TapStack(app, 'BackendStack', {
      environmentSuffix: 'stage',
      stateBucket: 'tf-state-bucket',
      stateBucketRegion: 'us-west-1',
    });
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'tf-state-bucket',
        key: 'stage/BackendStack.tfstate',
        region: 'us-west-1',
        encrypt: true,
      })
    );
  });

  test('wires Networking/Security/Storage/Compute with expected props', () => {
    const app = new App();
    new TapStack(app, 'WiringStack', {
      existingFlowLogsRoleArn: 'arn:aws:iam::123:role/existing-flow-role',
      existingFlowLogsLogGroupArn: 'arn:aws:logs:us-west-2:123:log-group:/aws/vpc/flowlogs/existing',
    });

    // Networking
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      'networking',
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        projectName: 'tap-dev',
        existingFlowLogsRoleArn: 'arn:aws:iam::123:role/existing-flow-role',
        existingFlowLogsLogGroupArn:
          'arn:aws:logs:us-west-2:123:log-group:/aws/vpc/flowlogs/existing',
      })
    );

    // Security
    expect(SecurityModule).toHaveBeenCalledWith(
      expect.anything(),
      'security',
      expect.objectContaining({
        vpcId: 'vpc-123',
        projectName: 'tap-dev',
      })
    );

    // Storage (bucketSuffix from RandomId hex)
    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      'storage',
      expect.objectContaining({
        projectName: 'tap-dev',
        bucketSuffix: 'abcd',
      })
    );

    // Compute
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      'compute',
      expect.objectContaining({
        subnetId: 'subnet-public-1',
        securityGroupIds: ['sg-ec2'],
        s3BucketArn: 'arn:aws:s3:::tap-dev-app-data-abcd',
        projectName: 'tap-dev',
      })
    );
  });

  test('creates expected Terraform outputs (12) and uses module values', () => {
    const app = new App();
    new TapStack(app, 'OutputsStack');

    // number of outputs
    expect(TerraformOutput).toHaveBeenCalledTimes(12);

    // spot-check a couple of outputs are fed from modules
    const calls = (TerraformOutput as jest.Mock).mock.calls.map(([_, id, cfg]) => ({
      id,
      cfg,
    }));

    // vpc-id
    expect(calls.find(c => c.id === 'vpc-id')?.cfg.value).toBe('vpc-123');

    // public-subnet-ids
    expect(calls.find(c => c.id === 'public-subnet-ids')?.cfg.value).toEqual(
      ['subnet-public-1', 'subnet-public-2']
    );

    // nat-gateway-id
    expect(calls.find(c => c.id === 'nat-gateway-id')?.cfg.value).toBe('nat-123');

    // s3-bucket-name
    expect(calls.find(c => c.id === 's3-bucket-name')?.cfg.value).toBe(
      'tap-dev-app-data-abcd'
    );

    // ec2-iam-role-arn
    expect(calls.find(c => c.id === 'ec2-iam-role-arn')?.cfg.value).toBe(
      'arn:aws:iam::123456789012:role/tap-dev-EC2Role-xyz'
    );
  });
});
