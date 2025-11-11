import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
      };
    }
    return args.inputs;
  },
});

// Import after mocks are set
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcsStack } from '../lib/ecs-stack';
import { AlbStack } from '../lib/alb-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { BackupVerificationStack } from '../lib/backup-verification-stack';

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-payment-stack', {
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should instantiate successfully', () => {
    expect(stack).toBeDefined();
  });

  it('should have albDnsName output', done => {
    stack.albDnsName.apply(name => {
      expect(name).toBeDefined();
      done();
    });
  });

  it('should have apiGatewayUrl output', done => {
    stack.apiGatewayUrl.apply(url => {
      expect(url).toBeDefined();
      done();
    });
  });

  it('should have dashboardUrl output', done => {
    stack.dashboardUrl.apply(url => {
      expect(url).toBeDefined();
      done();
    });
  });
});

describe('VpcStack', () => {
  let vpcStack: VpcStack;

  beforeAll(() => {
    vpcStack = new VpcStack('test-vpc', {
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });
  });

  it('should create VPC', () => {
    expect(vpcStack).toBeDefined();
  });

  it('should have vpcId output', done => {
    vpcStack.vpcId.apply(id => {
      expect(id).toBeDefined();
      done();
    });
  });

  it('should have 3 public subnets', done => {
    vpcStack.publicSubnetIds.apply(ids => {
      expect(ids).toHaveLength(3);
      done();
    });
  });

  it('should have 3 private subnets', done => {
    vpcStack.privateSubnetIds.apply(ids => {
      expect(ids).toHaveLength(3);
      done();
    });
  });

  it('should have 3 database subnets', done => {
    vpcStack.databaseSubnetIds.apply(ids => {
      expect(ids).toHaveLength(3);
      done();
    });
  });

  it('should have private subnet CIDRs', done => {
    vpcStack.privateSubnetCidrs.apply(cidrs => {
      expect(cidrs).toBeDefined();
      expect(cidrs.length).toBeGreaterThan(0);
      done();
    });
  });
});

describe('DatabaseStack', () => {
  let databaseStack: DatabaseStack;
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string[]>;
  let mockCidrs: pulumi.Output<string[]>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-12345');
    mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2', 'subnet-3']);
    mockCidrs = pulumi.output(['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24']);

    databaseStack = new DatabaseStack('test-db', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      databaseSubnetIds: mockSubnetIds,
      privateSubnetCidrs: mockCidrs,
      tags: { Environment: 'test' },
    });
  });

  it('should create database stack', () => {
    expect(databaseStack).toBeDefined();
  });

  it('should have cluster endpoint', done => {
    databaseStack.clusterEndpoint.apply(endpoint => {
      expect(endpoint).toBeDefined();
      done();
    });
  });

  it('should have cluster ARN', done => {
    databaseStack.clusterArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should have database secret ARN', done => {
    databaseStack.databaseSecretArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });
});

describe('EcsStack', () => {
  let ecsStack: EcsStack;
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string[]>;
  let mockDbEndpoint: pulumi.Output<string>;
  let mockSecretArn: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-12345');
    mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2', 'subnet-3']);
    mockDbEndpoint = pulumi.output('db.cluster.example.com');
    mockSecretArn = pulumi.output('arn:aws:secretsmanager:region:account:secret:id');

    ecsStack = new EcsStack('test-ecs', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      privateSubnetIds: mockSubnetIds,
      databaseEndpoint: mockDbEndpoint,
      databaseSecretArn: mockSecretArn,
      tags: { Environment: 'test' },
    });
  });

  it('should create ECS stack', () => {
    expect(ecsStack).toBeDefined();
  });

  it('should have cluster ARN', done => {
    ecsStack.clusterArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should have service ARN', done => {
    ecsStack.serviceArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should have blue target group ARN', done => {
    ecsStack.blueTargetGroupArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should have green target group ARN', done => {
    ecsStack.greenTargetGroupArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });
});

describe('AlbStack', () => {
  let albStack: AlbStack;
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string[]>;
  let mockServiceArn: pulumi.Output<string>;
  let mockTgArn: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-12345');
    mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2', 'subnet-3']);
    mockServiceArn = pulumi.output('arn:aws:ecs:region:account:service/id');
    mockTgArn = pulumi.output('arn:aws:elasticloadbalancing:region:account:targetgroup/id');

    albStack = new AlbStack('test-alb', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      publicSubnetIds: mockSubnetIds,
      ecsServiceArn: mockServiceArn,
      targetGroupArn: mockTgArn,
      blueTargetGroupArn: mockTgArn,
      greenTargetGroupArn: mockTgArn,
      tags: { Environment: 'test' },
    });
  });

  it('should create ALB stack', () => {
    expect(albStack).toBeDefined();
  });

  it('should have ALB DNS name', done => {
    albStack.albDnsName.apply(dns => {
      expect(dns).toBeDefined();
      done();
    });
  });

  it('should have ALB ARN', done => {
    albStack.albArn.apply(arn => {
      expect(arn).toBeDefined();
      done();
    });
  });
});

describe('ApiGatewayStack', () => {
  let apiStack: ApiGatewayStack;
  let mockAlbDns: pulumi.Output<string>;

  beforeAll(() => {
    mockAlbDns = pulumi.output('alb-12345.ap-southeast-1.elb.amazonaws.com');

    apiStack = new ApiGatewayStack('test-api', {
      environmentSuffix: 'test',
      albDnsName: mockAlbDns,
      tags: { Environment: 'test' },
    });
  });

  it('should create API Gateway stack', () => {
    expect(apiStack).toBeDefined();
  });

  it('should have API URL output', done => {
    apiStack.apiUrl.apply(url => {
      expect(url).toBeDefined();
      done();
    });
  });
});

describe('MonitoringStack', () => {
  let monitoringStack: MonitoringStack;
  let mockAlbArn: pulumi.Output<string>;
  let mockClusterName: pulumi.Output<string>;
  let mockServiceName: pulumi.Output<string>;
  let mockDbClusterId: pulumi.Output<string>;
  let mockRegion: pulumi.Output<string>;

  beforeAll(() => {
    mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:region:account:loadbalancer/app/id');
    mockClusterName = pulumi.output('payment-cluster-test');
    mockServiceName = pulumi.output('payment-service-test');
    mockDbClusterId = pulumi.output('payment-aurora-cluster-test_id');
    mockRegion = pulumi.output('ap-southeast-1');

    monitoringStack = new MonitoringStack('test-monitoring', {
      environmentSuffix: 'test',
      albArn: mockAlbArn,
      ecsClusterName: mockClusterName,
      ecsServiceName: mockServiceName,
      databaseClusterId: mockDbClusterId,
      region: mockRegion,
      tags: { Environment: 'test' },
    });
  });

  it('should create monitoring stack', () => {
    expect(monitoringStack).toBeDefined();
  });

  it('should have dashboard URL', done => {
    monitoringStack.dashboardUrl.apply(url => {
      expect(url).toBeDefined();
      expect(url).toContain('cloudwatch');
      done();
    });
  });
});

describe('BackupVerificationStack', () => {
  let backupStack: BackupVerificationStack;
  let mockClusterArn: pulumi.Output<string>;

  beforeAll(() => {
    mockClusterArn = pulumi.output('arn:aws:rds:region:account:cluster:id');

    backupStack = new BackupVerificationStack('test-backup', {
      environmentSuffix: 'test',
      databaseClusterArn: mockClusterArn,
      tags: { Environment: 'test' },
    });
  });

  it('should create backup verification stack', () => {
    expect(backupStack).toBeDefined();
  });
});
