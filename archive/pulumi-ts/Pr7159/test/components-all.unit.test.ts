import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi AWS S3 resources explicitly to avoid constructor errors
jest.mock('@pulumi/aws', () => {
  const actual = jest.requireActual('@pulumi/aws');
  
  return {
    ...actual,
    s3: {
      ...actual.s3,
      // Keep the actual Bucket constructor as it's needed for the component
      Bucket: actual.s3.Bucket,
      // Mock the configuration resources using jest.fn(function) pattern for proper constructors
      BucketVersioningV2: jest.fn(function (this: any, name: string, args: any, opts?: any) {
        this.id = pulumi.output(`versioning-${name}`);
        return this;
      }),
      BucketServerSideEncryptionConfiguration: jest.fn(function (
        this: any,
        name: string,
        args: any,
        opts?: any
      ) {
        this.id = pulumi.output(`sse-${name}`);
        this.rules = args?.rules || [];
        return this;
      }),
      BucketLifecycleConfiguration: jest.fn(function (
        this: any,
        name: string,
        args: any,
        opts?: any
      ) {
        this.id = pulumi.output(`lifecycle-${name}`);
        this.rules = args?.rules || [];
        return this;
      }),
      BucketPublicAccessBlock: jest.fn(function (
        this: any,
        name: string,
        args: any,
        opts?: any
      ) {
        this.id = pulumi.output(`pab-${name}`);
        this.blockPublicAcls = args?.blockPublicAcls;
        this.blockPublicPolicy = args?.blockPublicPolicy;
        this.ignorePublicAcls = args?.ignorePublicAcls;
        this.restrictPublicBuckets = args?.restrictPublicBuckets;
        return this;
      }),
    },
  };
});

import { SecurityGroupsComponent } from '../lib/components/security-groups';
import { RdsComponent } from '../lib/components/rds';
import { EcsComponent } from '../lib/components/ecs';
import { AlbComponent } from '../lib/components/alb';
import { S3Component } from '../lib/components/s3';
import { CloudWatchComponent } from '../lib/components/cloudwatch';

// Mock Pulumi
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.name,
        arn: `arn:aws:${args.type}:::${args.name}`,
        endpoint: 'mock-endpoint.aws.com',
        dnsName: 'mock-dns.elb.amazonaws.com',
        dashboardName: 'mock-dashboard',
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('SecurityGroupsComponent', () => {
  let securityGroups: SecurityGroupsComponent;

  beforeAll(() => {
    securityGroups = new SecurityGroupsComponent('test-sg', {
      vpcId: pulumi.output('vpc-12345'),
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create security groups component', () => {
    expect(securityGroups).toBeInstanceOf(SecurityGroupsComponent);
  });

  it('should export albSecurityGroup', (done) => {
    pulumi.output(securityGroups.albSecurityGroup).apply((sg) => {
      expect(sg).toBeDefined();
      expect(sg.id).toBeDefined();
      done();
    });
  });

  it('should export ecsSecurityGroup', (done) => {
    pulumi.output(securityGroups.ecsSecurityGroup).apply((sg) => {
      expect(sg).toBeDefined();
      expect(sg.id).toBeDefined();
      done();
    });
  });

  it('should export rdsSecurityGroup', (done) => {
    pulumi.output(securityGroups.rdsSecurityGroup).apply((sg) => {
      expect(sg).toBeDefined();
      expect(sg.id).toBeDefined();
      done();
    });
  });
});

describe('RdsComponent', () => {
  let rds: RdsComponent;

  beforeAll(() => {
    rds = new RdsComponent('test-rds', {
      subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      securityGroupId: pulumi.output('sg-12345'),
      instanceClass: 'db.t3.medium',
      engineMode: 'provisioned',
      backupRetentionDays: 7,
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create RDS component', () => {
    expect(rds).toBeInstanceOf(RdsComponent);
  });

  it('should export cluster', (done) => {
    pulumi.output(rds.cluster).apply((cluster) => {
      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      done();
    });
  });

  it('should export endpoint', (done) => {
    pulumi.output(rds.endpoint).apply((endpoint) => {
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      done();
    });
  });

  describe('without engineMode', () => {
    it('should create RDS without explicit engine mode', () => {
      const rdsNoEngineMode = new RdsComponent('test-rds-no-mode', {
        subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
        securityGroupId: pulumi.output('sg-12345'),
        instanceClass: 'db.t3.small',
        backupRetentionDays: 5,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(rdsNoEngineMode).toBeInstanceOf(RdsComponent);
    });
  });
});

describe('EcsComponent', () => {
  let ecs: EcsComponent;

  beforeAll(() => {
    ecs = new EcsComponent('test-ecs', {
      vpcId: pulumi.output('vpc-12345'),
      subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      securityGroupId: pulumi.output('sg-12345'),
      taskCount: 2,
      taskCpu: '512',
      taskMemory: '1024',
      enableAutoScaling: false,
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create ECS component', () => {
    expect(ecs).toBeInstanceOf(EcsComponent);
  });

  it('should export cluster', (done) => {
    pulumi.output(ecs.cluster).apply((cluster) => {
      expect(cluster).toBeDefined();
      expect(cluster.id).toBeDefined();
      done();
    });
  });

  it('should export service', (done) => {
    pulumi.output(ecs.service).apply((service) => {
      expect(service).toBeDefined();
      expect(service.id).toBeDefined();
      done();
    });
  });

  it('should export targetGroup', (done) => {
    pulumi.output(ecs.targetGroup).apply((tg) => {
      expect(tg).toBeDefined();
      expect(tg.arn).toBeDefined();
      done();
    });
  });

  describe('with auto-scaling enabled', () => {
    it('should create ECS with auto-scaling', () => {
      const ecsWithAutoScaling = new EcsComponent('test-ecs-as', {
        vpcId: pulumi.output('vpc-12345'),
        subnetIds: pulumi.output(['subnet-1']),
        securityGroupId: pulumi.output('sg-12345'),
        taskCount: 1,
        taskCpu: '256',
        taskMemory: '512',
        enableAutoScaling: true,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(ecsWithAutoScaling).toBeInstanceOf(EcsComponent);
    });
  });
});

describe('AlbComponent', () => {
  let alb: AlbComponent;

  beforeAll(() => {
    alb = new AlbComponent('test-alb', {
      vpcId: pulumi.output('vpc-12345'),
      subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      securityGroupId: pulumi.output('sg-12345'),
      targetGroupArn: pulumi.output('arn:aws:elasticloadbalancing:::targetgroup/test'),
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create ALB component', () => {
    expect(alb).toBeInstanceOf(AlbComponent);
  });

  it('should export alb', (done) => {
    pulumi.output(alb.alb).apply((loadBalancer) => {
      expect(loadBalancer).toBeDefined();
      expect(loadBalancer.id).toBeDefined();
      done();
    });
  });

  it('should export dnsName', (done) => {
    pulumi.output(alb.dnsName).apply((dns) => {
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
      done();
    });
  });

  describe('with SSL certificate', () => {
    it('should create ALB with HTTPS listener', () => {
      const albWithSsl = new AlbComponent('test-alb-ssl', {
        vpcId: pulumi.output('vpc-12345'),
        subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
        securityGroupId: pulumi.output('sg-12345'),
        targetGroupArn: pulumi.output('arn:aws:elasticloadbalancing:::targetgroup/test'),
        sslCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(albWithSsl).toBeInstanceOf(AlbComponent);
    });
  });
});

describe('S3Component', () => {
  let s3: S3Component;

  beforeAll(() => {
    s3 = new S3Component('test-s3', {
      lifecycleRules: {
        enabled: true,
        transitionDays: 90,
        expirationDays: 365,
      },
      enableVersioning: true,
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create S3 component', () => {
    expect(s3).toBeInstanceOf(S3Component);
  });

  it('should export bucket', (done) => {
    pulumi.output(s3.bucket).apply((bucket) => {
      expect(bucket).toBeDefined();
      expect(bucket.id).toBeDefined();
      done();
    });
  });

  it('should export bucketName', (done) => {
    pulumi.output(s3.bucketName).apply((name) => {
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      done();
    });
  });

  describe('without versioning', () => {
    it('should create S3 bucket without versioning', () => {
      const s3NoVersioning = new S3Component('test-s3-no-version', {
        lifecycleRules: {
          enabled: false,
        },
        enableVersioning: false,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(s3NoVersioning).toBeInstanceOf(S3Component);
    });
  });

  describe('with lifecycle rules disabled', () => {
    it('should create S3 bucket without lifecycle rules', () => {
      const s3NoLifecycle = new S3Component('test-s3-no-lifecycle', {
        lifecycleRules: {
          enabled: false,
        },
        enableVersioning: false,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(s3NoLifecycle).toBeInstanceOf(S3Component);
    });
  });

  describe('with only transition rules', () => {
    it('should create S3 bucket with only transition', () => {
      const s3TransitionOnly = new S3Component('test-s3-transition', {
        lifecycleRules: {
          enabled: true,
          transitionDays: 30,
        },
        enableVersioning: false,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(s3TransitionOnly).toBeInstanceOf(S3Component);
    });
  });

  describe('with only expiration rules', () => {
    it('should create S3 bucket with only expiration', () => {
      const s3ExpirationOnly = new S3Component('test-s3-expiration', {
        lifecycleRules: {
          enabled: true,
          expirationDays: 180,
        },
        enableVersioning: false,
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(s3ExpirationOnly).toBeInstanceOf(S3Component);
    });
  });
});

describe('CloudWatchComponent', () => {
  let cloudwatch: CloudWatchComponent;

  beforeAll(() => {
    cloudwatch = new CloudWatchComponent('test-cw', {
      ecsClusterName: pulumi.output('ecs-cluster-test'),
      ecsServiceName: pulumi.output('ecs-service-test'),
      rdsClusterId: pulumi.output('aurora-cluster-test'),
      albArn: pulumi.output('arn:aws:elasticloadbalancing:::loadbalancer/test'),
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create CloudWatch component', () => {
    expect(cloudwatch).toBeInstanceOf(CloudWatchComponent);
  });

  it('should export dashboard', (done) => {
    pulumi.output(cloudwatch.dashboard).apply((dashboard) => {
      expect(dashboard).toBeDefined();
      expect(dashboard.dashboardName).toBeDefined();
      done();
    });
  });
});
