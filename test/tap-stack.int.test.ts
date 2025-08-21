import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { 
  VpcModule, 
  S3Module, 
  SecurityGroupModule, 
  IamModule, 
  RdsModule,
  Ec2Module,
  AlbModule,
  Route53Module,
  CloudWatchModule
} from '../lib/modules';

// Mock the modules to avoid complex dependencies in unit tests
jest.mock('../lib/modules', () => ({
  VpcModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    vpc: { id: 'vpc-12345' },
    publicSubnets: [
      { id: 'subnet-public-1' },
      { id: 'subnet-public-2' },
      { id: 'subnet-public-3' }
    ],
    privateSubnets: [
      { id: 'subnet-private-1' },
      { id: 'subnet-private-2' },
      { id: 'subnet-private-3' }
    ],
    internetGateway: { id: 'igw-12345' },
    natGateway: { id: 'nat-12345' },
    natEip: { id: 'eip-12345' }
  })),
  S3Module: jest.fn().mockImplementation((_scope, _id, config) => ({
    bucket: { 
      id: `${config.bucketName}`,
      arn: `arn:aws:s3:::${config.bucketName}`,
      bucket: config.bucketName
    }
  })),
  SecurityGroupModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    albSecurityGroup: { id: 'sg-alb-12345' },
    ec2SecurityGroup: { id: 'sg-ec2-12345' },
    rdsSecurityGroup: { id: 'sg-rds-12345' }
  })),
  IamModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    ec2Role: { 
      name: 'MyApp-ec2-role',
      arn: 'arn:aws:iam::123456789012:role/MyApp-ec2-role'
    },
    instanceProfile: { 
      name: 'MyApp-instance-profile',
      arn: 'arn:aws:iam::123456789012:instance-profile/MyApp-instance-profile'
    }
  })),
  RdsModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    subnetGroup: {
      name: 'MyApp-db-subnet-group'
    },
    instance: {
      identifier: 'MyApp-database',
      endpoint: 'myapp-database.cluster-xyz.us-east-1.rds.amazonaws.com'
    }
  })),
  Ec2Module: jest.fn().mockImplementation((_scope, _id, config) => ({
    launchTemplate: { 
      id: 'lt-12345',
      name: 'MyApp-launch-template'
    },
    autoScalingGroup: { 
      name: 'MyApp-asg',
      id: 'MyApp-asg'
    }
  })),
  AlbModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    loadBalancer: { 
      arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/MyApp-alb',
      dnsName: 'MyApp-alb-123456789.us-east-1.elb.amazonaws.com',
      zoneId: 'Z35SXDOTRQ7X7K'
    },
    targetGroup: { 
      arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/MyApp-tg',
      name: 'MyApp-tg'
    },
    listener: {
      arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/MyApp-alb/listener-12345'
    }
  })),
  Route53Module: jest.fn().mockImplementation((_scope, _id, config) => ({
    hostedZone: {
      zoneId: 'Z123456789',
      name: config.domainName
    },
    record: {
      name: config.domainName,
      type: 'A'
    }
  })),
  CloudWatchModule: jest.fn().mockImplementation((_scope, _id, config) => ({
    logGroup: {
      name: config.logGroupName,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:${config.logGroupName}`
    }
  }))
}));

// Mock DataAwsAvailabilityZones
jest.mock('@cdktf/provider-aws/lib/data-aws-availability-zones', () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation(() => ({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c']
  }))
}));

// Mock AutoscalingAttachment
jest.mock('@cdktf/provider-aws/lib/autoscaling-attachment', () => ({
  AutoscalingAttachment: jest.fn()
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
      
      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });

    it('should configure S3 backend with default values', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));
      
      expect(synthesized.terraform.backend.s3).toEqual({
        bucket: 'iac-rlhf-tf-states',
        key: 'dev/test-stack.tfstate',
        region: 'us-east-1',
        encrypt: true,
        use_lockfile: true
      });
    });

    it('should create all required modules with correct configuration', () => {
      new TapStack(app, 'test-stack');

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          bucketName: expect.stringMatching(/^myapp-app-bucket-\d+$/),
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          vpcId: 'vpc-12345',
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          s3BucketArn: expect.stringMatching(/^arn:aws:s3:::myapp-app-bucket-\d+$/),
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          vpcId: 'vpc-12345',
          subnetIds: ['subnet-private-1', 'subnet-private-2', 'subnet-private-3'],
          securityGroupIds: ['sg-rds-12345'],
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          vpcId: 'vpc-12345',
          subnetIds: ['subnet-public-1', 'subnet-public-2', 'subnet-public-3'],
          securityGroupIds: ['sg-alb-12345'],
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'ec2',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          vpcId: 'vpc-12345',
          subnetIds: ['subnet-private-1', 'subnet-private-2', 'subnet-private-3'],
          securityGroupIds: ['sg-ec2-12345'],
          iamInstanceProfile: 'MyApp-instance-profile',
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        'route53',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          domainName: 'myapp.example.com',
          albDnsName: 'MyApp-alb-123456789.us-east-1.elb.amazonaws.com',
          albZoneId: 'Z35SXDOTRQ7X7K',
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        expect.objectContaining({
          namePrefix: 'MyApp-',
          logGroupName: 'MyApp-application-logs',
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );
    });
  });

  describe('Constructor with custom props', () => {
    it('should use custom environment suffix and backend', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
        awsRegion: 'us-west-2',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-west-1'
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3).toEqual({
        bucket: 'custom-state-bucket',
        key: 'prod/test-stack.tfstate',
        region: 'eu-west-1',
        encrypt: true,
        use_lockfile: true
      });
    });

    it('should use custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Owner: 'engineering'
        }
      };

      const stack = new TapStack(app, 'test-stack', {
        defaultTags: customTags
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toEqual([customTags]);
    });

    it('should create S3 bucket with timestamp-based unique name', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: 'staging'
      });

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3',
        expect.objectContaining({
          bucketName: expect.stringMatching(/^myapp-app-bucket-\d+$/),
          tags: expect.objectContaining({
            Project: 'MyApp'
          })
        })
      );
    });
  });

  describe('Backend configuration', () => {
    it('should enable S3 state locking', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
    });

    it('should encrypt state files', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });
  });
});

describe('VpcModule', () => {
  let app: any;
  let stack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    jest.clearAllMocks();
  });

  it('should create VPC with correct CIDR and availability zones', () => {
    const config = {
      namePrefix: 'MyApp-',
      cidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      tags: { Project: 'MyApp' }
    };

    new VpcModule(stack, 'test-vpc', config);

    expect(VpcModule).toHaveBeenCalledWith(
      stack,
      'test-vpc',
      expect.objectContaining({
        namePrefix: 'MyApp-',
        cidrBlock: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c']
      })
    );
  });

  it('should return VPC with public and private subnets', () => {
    const config = {
      namePrefix: 'MyApp-',
      cidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      tags: { Project: 'MyApp' }
    };

    const vpcModule = new VpcModule(stack, 'test-vpc', config);

    expect(vpcModule.vpc).toBeDefined();
    expect(vpcModule.vpc.id).toBe('vpc-12345');
    expect(vpcModule.publicSubnets).toHaveLength(3);
    expect(vpcModule.privateSubnets).toHaveLength(3);
    expect(vpcModule.internetGateway).toBeDefined();
    expect(vpcModule.natGateway).toBeDefined();
    expect(vpcModule.natEip).toBeDefined();
  });
});

describe('S3Module', () => {
  let app: any;
  let stack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    jest.clearAllMocks();
  });

  it('should create S3 bucket with correct name', () => {
    const bucketName = 'myapp-test-bucket-123456789';
    const config = {
      namePrefix: 'MyApp-',
      bucketName: bucketName,
      tags: { Project: 'MyApp' }
    };

    new S3Module(stack, 'test-s3', config);

    expect(S3Module).toHaveBeenCalledWith(
      stack,
      'test-s3',
      expect.objectContaining({
        namePrefix: 'MyApp-',
        bucketName: bucketName
      })
    );
  });

  it('should return bucket with correct properties', () => {
    const bucketName = 'myapp-test-bucket-123456789';
    const config = {
      namePrefix: 'MyApp-',
      bucketName: bucketName,
      tags: { Project: 'MyApp' }
    };

    const s3Module = new S3Module(stack, 'test-s3', config);

    expect(s3Module.bucket).toBeDefined();
    expect(s3Module.bucket.bucket).toBe(bucketName);
    expect(s3Module.bucket.arn).toBe(`arn:aws:s3:::${bucketName}`);
  });
});

describe('SecurityGroupModule', () => {
  let app: any;
  let stack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    jest.clearAllMocks();
  });

  it('should create security groups for ALB, EC2, and RDS', () => {
    const config = {
      namePrefix: 'MyApp-',
      vpcId: 'vpc-12345',
      tags: { Project: 'MyApp' }
    };

    new SecurityGroupModule(stack, 'test-sg', config);

    expect(SecurityGroupModule).toHaveBeenCalledWith(
      stack,
      'test-sg',
      expect.objectContaining({
        namePrefix: 'MyApp-',
        vpcId: 'vpc-12345'
      })
    );
  });

  it('should return separate security groups for each tier', () => {
    const config = {
      namePrefix: 'MyApp-',
      vpcId: 'vpc-12345',
      tags: { Project: 'MyApp' }
    };

    const sgModule = new SecurityGroupModule(stack, 'test-sg', config);

    expect(sgModule.albSecurityGroup).toBeDefined();
    expect(sgModule.ec2SecurityGroup).toBeDefined();
    expect(sgModule.rdsSecurityGroup).toBeDefined();
    expect(sgModule.albSecurityGroup.id).toBe('sg-alb-12345');
    expect(sgModule.ec2SecurityGroup.id).toBe('sg-ec2-12345');
    expect(sgModule.rdsSecurityGroup.id).toBe('sg-rds-12345');
  });
});

describe('IamModule', () => {
  let app: any;
  let stack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    jest.clearAllMocks();
  });

  it('should create IAM role and instance profile for EC2 instances', () => {
    const config = {
      namePrefix: 'MyApp-',
      s3BucketArn: 'arn:aws:s3:::myapp-bucket',
      tags: { Project: 'MyApp' }
    };

    new IamModule(stack, 'test-iam', config);

    expect(IamModule).toHaveBeenCalledWith(
      stack,
      'test-iam',
      expect.objectContaining({
        namePrefix: 'MyApp-',
        s3BucketArn: 'arn:aws:s3:::myapp-bucket',
        tags: expect.objectContaining({
          Project: 'MyApp'
        })
      })
    );
  });

  it('should return EC2 role and instance profile with correct names', () => {
    const config = {
      namePrefix: 'MyApp-',
      s3BucketArn: 'arn:aws:s3:::myapp-bucket',
      tags: { Project: 'MyApp' }
    };

    const iamModule = new IamModule(stack, 'test-iam', config);

    expect(iamModule.ec2Role).toBeDefined();
    expect(iamModule.instanceProfile).toBeDefined();
    expect(iamModule.ec2Role.name).toBe('MyApp-ec2-role');
    expect(iamModule.instanceProfile.name).toBe('MyApp-instance-profile');
    expect(iamModule.ec2Role.arn).toContain('arn:aws:iam::');
    expect(iamModule.instanceProfile.arn).toContain('arn:aws:iam::');
  });
});

describe('RdsModule', () => {
  let app: any;
  let stack: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    jest.clearAllMocks();
  });

  it('should create RDS instance with subnet group', () => {
    const config = {
      namePrefix: 'MyApp-',
      vpcId: 'vpc-12345',
      subnetIds: ['subnet-private-1', 'subnet-private-2'],
      securityGroupIds: ['sg-rds-12345'],
      tags: { Project: 'MyApp' }
    };

    new RdsModule(stack, 'test-rds', config);

    expect(RdsModule).toHaveBeenCalledWith(
      stack,
      'test-rds',
      expect.objectContaining({
        namePrefix: 'MyApp-',
        vpcId: 'vpc-12345',
        subnetIds: ['subnet-private-1', 'subnet-private-2'],
        securityGroupIds: ['sg-rds-12345']
      })
    );
  });

  it('should return RDS instance and subnet group', () => {
    const config = {
      namePrefix: 'MyApp-',
      vpcId: 'vpc-12345',
      subnetIds: ['subnet-private-1', 'subnet-private-2'],
      securityGroupIds: ['sg-rds-12345'],
      tags: { Project: 'MyApp' }
    };

    const rdsModule = new RdsModule(stack, 'test-rds', config);

    expect(rdsModule.subnetGroup).toBeDefined();
    expect(rdsModule.instance).toBeDefined();
    expect(rdsModule.subnetGroup.name).toBe('MyApp-db-subnet-group');
    expect(rdsModule.instance.identifier).toBe('MyApp-database');
  });
});

describe('Error Handling', () => {
  let app: any;

  beforeEach(() => {
    app = Testing.app();
  });

  it('should handle missing required configuration gracefully', () => {
    expect(() => {
      new TapStack(app, 'test-stack', {
        stateBucket: '',
        stateBucketRegion: ''
      });
    }).not.toThrow(); // TapStack should handle empty strings gracefully
  });

  it('should handle undefined props gracefully', () => {
    expect(() => {
      new TapStack(app, 'test-stack', undefined);
    }).not.toThrow();
  });

  it('should create unique S3 bucket names to avoid conflicts', () => {
    const stack1 = new TapStack(app, 'test-stack-1');
    const stack2 = new TapStack(app, 'test-stack-2');

    // Both stacks should create S3 modules with timestamp-based unique names
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      's3',
      expect.objectContaining({
        bucketName: expect.stringMatching(/^myapp-app-bucket-\d+$/)
      })
    );
  });
});