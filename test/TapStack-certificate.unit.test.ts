import * as pulumi from '@pulumi/pulumi';

// Set Pulumi project name for tests
process.env.PULUMI_NODEJS_PROJECT = 'payment-app';

class MyMocks implements pulumi.runtime.Mocks {
  newResource(args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const outputs: Record<string, any> = { ...args.inputs };

    switch (args.type) {
      case 'aws:acm/certificate:Certificate':
        outputs.arn = `arn:aws:acm:us-east-1:123456789012:certificate/mock-cert`;
        outputs.id = 'mock-cert-id';
        break;
      case 'aws:lb/listener:Listener':
        outputs.id = args.name + '-listener';
        outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/${args.name}`;
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        outputs.dnsName = 'mock-alb.elb.amazonaws.com';
        outputs.arn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock/123';
        outputs.arnSuffix = 'app/mock/123';
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}`;
        outputs.id = args.name;
        break;
      case 'awsx:ec2:Vpc':
        outputs.vpcId = 'vpc-mock-' + args.name;
        outputs.publicSubnetIds = ['subnet-pub-1', 'subnet-pub-2'];
        outputs.privateSubnetIds = ['subnet-priv-1', 'subnet-priv-2'];
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.id = 'sg-mock-' + args.name;
        break;
      case 'aws:kms/key:Key':
        outputs.keyId = 'mock-kms-key-id';
        outputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id';
        outputs.id = 'mock-kms-key-id';
        break;
      case 'aws:kms/alias:Alias':
        outputs.id = 'alias/mock';
        break;
      case 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection':
        outputs.id = 'pcx-mock-peering';
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.bucket = args.name;
        outputs.arn = `arn:aws:s3:::${args.name}`;
        outputs.id = args.name;
        break;
      case 'aws:s3/bucketPolicy:BucketPolicy':
        outputs.id = args.name + '-policy';
        break;
      case 'aws:rds/subnetGroup:SubnetGroup':
        outputs.name = args.name;
        outputs.id = args.name;
        break;
      case 'aws:secretsmanager/secret:Secret':
        outputs.arn = `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.name}`;
        outputs.id = args.name;
        break;
      case 'aws:secretsmanager/secretVersion:SecretVersion':
        outputs.id = args.name + '-version';
        outputs.secretString = args.inputs.secretString;
        break;
      case 'aws:iam/role:Role':
        outputs.name = args.name;
        outputs.id = args.name;
        outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        break;
      case 'aws:iam/rolePolicyAttachment:RolePolicyAttachment':
        outputs.id = args.name + '-attachment';
        break;
      case 'aws:iam/rolePolicy:RolePolicy':
        outputs.id = args.name + '-policy';
        break;
      case 'aws:iam/instanceProfile:InstanceProfile':
        outputs.name = args.name;
        outputs.arn = `arn:aws:iam::123456789012:instance-profile/${args.name}`;
        break;
      case 'aws:rds/cluster:Cluster':
        outputs.endpoint = 'mock-cluster.rds.amazonaws.com';
        outputs.readerEndpoint = 'mock-cluster-ro.rds.amazonaws.com';
        outputs.arn = 'arn:aws:rds:us-east-1:123456789012:cluster:mock';
        outputs.id = 'mock-cluster-id';
        outputs.databaseName = args.inputs.databaseName || 'paymentdb';
        outputs.port = 5432;
        break;
      case 'aws:rds/clusterInstance:ClusterInstance':
        outputs.id = 'mock-instance-id';
        break;
      case 'aws:autoscaling/group:Group':
        outputs.name = args.name;
        outputs.id = args.name;
        break;
      case 'aws:ec2/launchTemplate:LaunchTemplate':
        outputs.id = args.name + '-lt';
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.name = args.name;
        outputs.id = args.name;
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        outputs.dashboardName = args.inputs.dashboardName || args.name;
        outputs.id = args.name;
        break;
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        outputs.id = args.name;
        outputs.name = args.inputs.name || args.name;
        break;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  }

  call(args: pulumi.runtime.MockCallArgs): Record<string, any> {
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return { id: 'ami-12345678', imageId: 'ami-12345678' };
    }
    if (args.token === 'aws:secretsmanager/getRandomPassword:getRandomPassword') {
      return { randomPassword: 'MockPassword123456789012345678901234' };
    }
    return {};
  }
}

pulumi.runtime.setMocks(new MyMocks());
pulumi.runtime.setConfig('payment-app:environmentSuffix', 'test');
pulumi.runtime.setConfig('payment-app:environment', 'test');
pulumi.runtime.setConfig('payment-app:domainName', 'example.com');

describe('Payment App Infrastructure Stack - With Certificate', () => {
  let exports: any;

  beforeAll(async () => {
    exports = require('../lib/index');
  });

  describe('HTTPS Configuration', () => {
    it('creates certificate when domain is provided', async () => {
      const certArn = await exports.certificateArn;
      expect(certArn).toBeDefined();
    });

    it('certificate ARN is not placeholder when domain configured', async () => {
      const certArn = await exports.certificateArn;
      const arn = await certArn;
      expect(arn).not.toBe('N/A - HTTP-only mode');
    });

    it('exports ALB ARN', async () => {
      const arn = await exports.albArn;
      expect(arn).toBeDefined();
    });

    it('exports ALB DNS name', async () => {
      const dns = await exports.albDnsName;
      expect(dns).toBeDefined();
    });
  });
});
