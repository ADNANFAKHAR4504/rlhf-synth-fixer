import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const mockOutputs = { ...args.inputs };

    // Add mock outputs for AWS resources that have computed properties
    switch (args.type) {
      case 'aws:lb/loadBalancer:LoadBalancer':
        mockOutputs.dnsName = `${args.name}-123456789.ap-southeast-1.elb.amazonaws.com`;
        mockOutputs.arn = `arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:loadbalancer/app/${args.name}/abc123`;
        break;
      case 'aws:rds/cluster:Cluster':
        mockOutputs.endpoint = `${args.name}.cluster-xyz.ap-southeast-1.rds.amazonaws.com`;
        mockOutputs.arn = `arn:aws:rds:ap-southeast-1:123456789012:cluster:${args.name}`;
        break;
      case 'aws:ecs/cluster:Cluster':
        mockOutputs.arn = `arn:aws:ecs:ap-southeast-1:123456789012:cluster/${args.name}`;
        break;
      case 'aws:secretsmanager/secret:Secret':
        mockOutputs.arn = `arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:${args.name}`;
        break;
      case 'aws:apigateway/stage:Stage':
        mockOutputs.invokeUrl = `https://abc123.execute-api.ap-southeast-1.amazonaws.com/${args.inputs.stageName}`;
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        mockOutputs.arn = `arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/${args.name}/xyz789`;
        break;
      case 'aws:ecs/service:Service':
        mockOutputs.id = `arn:aws:ecs:ap-southeast-1:123456789012:service/${args.name}`;
        break;
    }

    return {
      id: `${args.name}_id`,
      state: mockOutputs,
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

  it('should have albDnsName output', async () => {
    const name = await new Promise<string>((resolve) => {
      stack.albDnsName.apply((v) => resolve(v));
    });
    expect(name).toBeDefined();
  });

  it('should have apiGatewayUrl output', async () => {
    const url = await new Promise<string>((resolve) => {
      stack.apiGatewayUrl.apply((v) => resolve(v));
    });
    expect(url).toBeDefined();
  });

  it('should have dashboardUrl output', async () => {
    const url = await new Promise<string>((resolve) => {
      stack.dashboardUrl.apply((v) => resolve(v));
    });
    expect(url).toBeDefined();
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

  it('should have vpcId output', async () => {
    const id = await new Promise<string>((resolve) => {
      vpcStack.vpcId.apply((v) => resolve(v));
    });
    expect(id).toBeDefined();
  });

  it('should have 3 public subnets', async () => {
    const ids = await new Promise<string[]>((resolve) => {
      vpcStack.publicSubnetIds.apply((v) => resolve(v));
    });
    expect(ids).toHaveLength(3);
  });

  it('should have 3 private subnets', async () => {
    const ids = await new Promise<string[]>((resolve) => {
      vpcStack.privateSubnetIds.apply((v) => resolve(v));
    });
    expect(ids).toHaveLength(3);
  });

  it('should have 3 database subnets', async () => {
    const ids = await new Promise<string[]>((resolve) => {
      vpcStack.databaseSubnetIds.apply((v) => resolve(v));
    });
    expect(ids).toHaveLength(3);
  });

  it('should have private subnet CIDRs', async () => {
    const cidrs = await new Promise<string[]>((resolve) => {
      vpcStack.privateSubnetCidrs.apply((v) => resolve(v));
    });
    expect(cidrs).toBeDefined();
    expect(cidrs.length).toBeGreaterThan(0);
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

  it('should have cluster endpoint', async () => {
    const endpoint = await new Promise<string>((resolve) => {
      databaseStack.clusterEndpoint.apply((v) => resolve(v));
    });
    expect(endpoint).toBeDefined();
  });

  it('should have cluster ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      databaseStack.clusterArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
  });

  it('should have database secret ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      databaseStack.databaseSecretArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
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

  it('should have cluster ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      ecsStack.clusterArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
  });

  it('should have service ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      ecsStack.serviceArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
  });

  it('should have blue target group ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      ecsStack.blueTargetGroupArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
  });

  it('should have green target group ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      ecsStack.greenTargetGroupArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
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

  it('should have ALB DNS name', async () => {
    const dns = await new Promise<string>((resolve) => {
      albStack.albDnsName.apply((v) => resolve(v));
    });
    expect(dns).toBeDefined();
  });

  it('should have ALB ARN', async () => {
    const arn = await new Promise<string>((resolve) => {
      albStack.albArn.apply((v) => resolve(v));
    });
    expect(arn).toBeDefined();
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

  it('should have API URL output', async () => {
    const url = await new Promise<string>((resolve) => {
      apiStack.apiUrl.apply((v) => resolve(v));
    });
    expect(url).toBeDefined();
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

  it('should have dashboard URL', async () => {
    const url = await new Promise<string>((resolve) => {
      monitoringStack.dashboardUrl.apply((v) => resolve(v));
    });
    expect(url).toBeDefined();
    expect(url).toContain('cloudwatch');
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
