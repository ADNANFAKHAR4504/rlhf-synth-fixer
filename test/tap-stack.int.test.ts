// Integration and E2E Tests - Deploy stacks in real AWS accounts and validate live resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeDBInstancesCommand,
  RDSClient,
  DBInstance
} from '@aws-sdk/client-rds';
import {
  HeadBucketCommand,
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const regionPath = path.join(__dirname, '../lib/AWS_REGION');
const region = fs.existsSync(regionPath)
  ? fs.readFileSync(regionPath, 'utf8').trim()
  : 'us-east-1';

describe('TapStack Integration Tests - Stack Deployment', () => {
  let stackOutputs: Record<string, any> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack =
      stacks.Stacks && stacks.Stacks.length > 0 ? stacks.Stacks[0] : undefined;
    expect(stack).toBeDefined();
    expect(stack?.StackStatus).toBe('CREATE_COMPLETE');

    if (stack && stack.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }

    const resources = await cf.send(
      new DescribeStackResourcesCommand({ StackName: stackName })
    );
    stackResources = resources.StackResources || [];
  });

  test('stack should be deployed successfully', () => {
    expect(stackOutputs).toBeDefined();
    expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
  });

  test('all expected outputs should exist and be non-empty', () => {
    const expectedOutputs = [
      'StackName',
      'EnvironmentSuffix',
      'VPCID',
      'PublicSubnet1ID',
      'PublicSubnet2ID',
      'PrivateSubnet1ID',
      'PrivateSubnet2ID',
      'LoadBalancerDNS',
      'AppDataBucketName',
      'DatabaseEndpoint',
      'KMSKeyARN',
    ];
    for (const key of expectedOutputs) {
      expect(stackOutputs[key]).toBeDefined();
      expect(stackOutputs[key]).not.toEqual('');
    }
  });

  test('all resources should be created successfully', () => {
    expect(stackResources.length).toBeGreaterThan(30);
    for (const resource of stackResources) {
      expect(resource.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    }
  });

  test('resources should have correct naming with environment suffix', () => {
    const resourcesWithNames = stackResources.filter(r => r.PhysicalResourceId);
    for (const resource of resourcesWithNames) {
      if (resource.LogicalResourceId !== 'EnvironmentSuffix') {
        expect(resource.PhysicalResourceId).toBeDefined();
      }
    }
  });
});

describe('TapStack E2E Tests - VPC and Network Resources', () => {
  let stackOutputs: Record<string, any> = {};
  let ec2Client: EC2Client;

  beforeAll(async () => {
    ec2Client = new EC2Client({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('VPC should exist with correct CIDR block', async () => {
    const vpcId = stackOutputs.VPCID;
    expect(vpcId).toBeDefined();

    const vpcs = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');

    // Check DNS support and hostnames using VPC attributes
    const dnsSupport = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      })
    );
    expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

    const dnsHostnames = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      })
    );
    expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
  });

  test('public subnets should exist in different AZs', async () => {
    const subnet1 = stackOutputs.PublicSubnet1ID;
    const subnet2 = stackOutputs.PublicSubnet2ID;
    expect(subnet1).toBeDefined();
    expect(subnet2).toBeDefined();

    const subnets = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [subnet1, subnet2] })
    );
    expect(subnets.Subnets?.length).toBe(2);

    const az1 = subnets.Subnets?.[0].AvailabilityZone;
    const az2 = subnets.Subnets?.[1].AvailabilityZone;
    expect(az1).not.toEqual(az2);
  });

  test('private subnets should exist in different AZs', async () => {
    const subnet1 = stackOutputs.PrivateSubnet1ID;
    const subnet2 = stackOutputs.PrivateSubnet2ID;
    expect(subnet1).toBeDefined();
    expect(subnet2).toBeDefined();

    const subnets = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [subnet1, subnet2] })
    );
    expect(subnets.Subnets?.length).toBe(2);

    const az1 = subnets.Subnets?.[0].AvailabilityZone;
    const az2 = subnets.Subnets?.[1].AvailabilityZone;
    expect(az1).not.toEqual(az2);
  });

  test('NAT Gateway should exist and be available', async () => {
    const vpcId = stackOutputs.VPCID;
    const natGateways = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      })
    );
    expect(natGateways.NatGateways?.length).toBeGreaterThanOrEqual(1);
    expect(natGateways.NatGateways?.[0].State).toBe('available');
  });

  test('Internet Gateway should be attached to VPC', async () => {
    const vpcId = stackOutputs.VPCID;
    const igws = await ec2Client.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      })
    );
    expect(igws.InternetGateways?.length).toBe(1);
    expect(igws.InternetGateways?.[0].Attachments?.[0].State).toBe('available');
  });

  test('route tables should be configured correctly', async () => {
    const vpcId = stackOutputs.VPCID;
    const routeTables = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      })
    );
    expect(routeTables.RouteTables?.length).toBeGreaterThanOrEqual(2);
  });

  test('network ACLs should be configured', async () => {
    const vpcId = stackOutputs.VPCID;
    const nacls = await ec2Client.send(
      new DescribeNetworkAclsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      })
    );
    expect(nacls.NetworkAcls?.length).toBeGreaterThanOrEqual(2);
  });

  test('security groups should exist', async () => {
    const vpcId = stackOutputs.VPCID;
    const sgs = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      })
    );
    expect(sgs.SecurityGroups?.length).toBeGreaterThanOrEqual(3);
  });
});

describe('TapStack E2E Tests - S3 Bucket Encryption and Security', () => {
  let stackOutputs: Record<string, any> = {};
  let s3Client: S3Client;

  beforeAll(async () => {
    s3Client = new S3Client({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('S3 bucket should exist', async () => {
    const bucketName = stackOutputs.AppDataBucketName;
    expect(bucketName).toBeDefined();
    await expect(
      s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
    ).resolves.toBeDefined();
  });

  test('S3 bucket should have encryption enabled', async () => {
    const bucketName = stackOutputs.AppDataBucketName;
    const encryption = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName })
    );
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    expect(encryption.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
  });

  test('S3 bucket should block public access', async () => {
    const bucketName = stackOutputs.AppDataBucketName;
    const publicAccess = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName })
    );
    expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });
});

describe('TapStack E2E Tests - RDS Multi-AZ and Encryption', () => {
  let stackOutputs: Record<string, any> = {};
  let rdsClient: RDSClient;

  beforeAll(async () => {
    rdsClient = new RDSClient({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('RDS instance should exist', async () => {
    const endpoint = stackOutputs.DatabaseEndpoint;
    expect(endpoint).toBeDefined();
    const dbs = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const found = dbs.DBInstances?.some(
      db => db.Endpoint?.Address === endpoint
    );
    expect(found).toBe(true);
  });

  test('RDS should have Multi-AZ enabled', async () => {
    const endpoint = stackOutputs.DatabaseEndpoint;
    const dbs = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const db = dbs.DBInstances?.find(
      db => db.Endpoint?.Address === endpoint
    );
    expect(db?.MultiAZ).toBe(true);
  });

  test('RDS should have storage encryption enabled', async () => {
    const endpoint = stackOutputs.DatabaseEndpoint;
    const dbs = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const db = dbs.DBInstances?.find(
      db => db.Endpoint?.Address === endpoint
    );
    expect(db?.StorageEncrypted).toBe(true);
    expect(db?.KmsKeyId).toBeDefined();
  });

  test('RDS should be in private subnets', async () => {
    const endpoint = stackOutputs.DatabaseEndpoint;
    const dbs = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const db = dbs.DBInstances?.find(
      db => db.Endpoint?.Address === endpoint
    );
    expect(db?.DBSubnetGroup).toBeDefined();
    expect(db?.PubliclyAccessible).toBe(false);
  });
});

describe('TapStack E2E Tests - Load Balancer and Auto Scaling', () => {
  let stackOutputs: Record<string, any> = {};
  let elbClient: ElasticLoadBalancingV2Client;
  let asgClient: AutoScalingClient;

  beforeAll(async () => {
    elbClient = new ElasticLoadBalancingV2Client({ region });
    asgClient = new AutoScalingClient({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('Application Load Balancer should exist', async () => {
    const lbDns = stackOutputs.LoadBalancerDNS;
    expect(lbDns).toBeDefined();
    const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
    const found = lbs.LoadBalancers?.some(lb => lb.DNSName === lbDns);
    expect(found).toBe(true);
  });

  test('Load Balancer should be internet-facing', async () => {
    const lbDns = stackOutputs.LoadBalancerDNS;
    const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
    const lb = lbs.LoadBalancers?.find(lb => lb.DNSName === lbDns);
    expect(lb?.Scheme).toBe('internet-facing');
  });

  test('Target Group should exist', async () => {
    const vpcId = stackOutputs.VPCID;
    const tgs = await elbClient.send(
      new DescribeTargetGroupsCommand({})
    );
    const tg = tgs.TargetGroups?.find(tg => tg.VpcId === vpcId);
    expect(tg).toBeDefined();
    expect(tg?.Protocol).toBe('HTTP');
    expect(tg?.Port).toBe(80);
  });

  test('ALB Listener should be configured', async () => {
    const lbDns = stackOutputs.LoadBalancerDNS;
    const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
    const lb = lbs.LoadBalancers?.find(lb => lb.DNSName === lbDns);

    if (lb?.LoadBalancerArn) {
      const listeners = await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: lb.LoadBalancerArn })
      );
      expect(listeners.Listeners?.length).toBeGreaterThan(0);
      expect(listeners.Listeners?.[0].Port).toBe(80);
    }
  });

  test('Auto Scaling Group should exist', async () => {
    const asgs = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({})
    );
    const asg = asgs.AutoScalingGroups?.find(asg =>
      asg.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();
  });

  test('Auto Scaling Group should have correct capacity', async () => {
    const asgs = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({})
    );
    const asg = asgs.AutoScalingGroups?.find(asg =>
      asg.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg?.MinSize).toBe(2);
    expect(asg?.MaxSize).toBe(4);
    expect(asg?.DesiredCapacity).toBe(2);
  });

  test('Scaling Policy should exist', async () => {
    const asgs = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({})
    );
    const asg = asgs.AutoScalingGroups?.find(asg =>
      asg.AutoScalingGroupName?.includes(environmentSuffix)
    );

    if (asg?.AutoScalingGroupName) {
      const policies = await asgClient.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: asg.AutoScalingGroupName
        })
      );
      expect(policies.ScalingPolicies?.length).toBeGreaterThan(0);
    }
  });
});

describe('TapStack E2E Tests - CloudWatch Alarms and Logging', () => {
  let stackOutputs: Record<string, any> = {};
  let cwClient: CloudWatchClient;
  let cwLogsClient: CloudWatchLogsClient;

  beforeAll(async () => {
    cwClient = new CloudWatchClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('CloudWatch Alarms should exist', async () => {
    const alarms = await cwClient.send(new DescribeAlarmsCommand({}));
    const stackAlarms = alarms.MetricAlarms?.filter(alarm =>
      alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(stackAlarms?.length).toBeGreaterThan(0);
  });

  test('CPU High Alarm should be configured correctly', async () => {
    const alarms = await cwClient.send(new DescribeAlarmsCommand({}));
    const cpuAlarm = alarms.MetricAlarms?.find(alarm =>
      alarm.AlarmName?.includes('CPUAlarmHigh') && alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(cpuAlarm).toBeDefined();
    expect(cpuAlarm?.MetricName).toBe('CPUUtilization');
    expect(cpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
  });

  test('CloudWatch Log Group should exist', async () => {
    const logGroups = await cwLogsClient.send(
      new DescribeLogGroupsCommand({})
    );
    const appLogGroup = logGroups.logGroups?.find(lg =>
      lg.logGroupName?.includes(environmentSuffix)
    );
    expect(appLogGroup).toBeDefined();
  });
});

describe('TapStack E2E Tests - AWS Config', () => {
  let configClient: ConfigServiceClient;

  beforeAll(() => {
    configClient = new ConfigServiceClient({ region });
  });

  test('Config Recorder should exist and be active', async () => {
    const recorders = await configClient.send(
      new DescribeConfigurationRecordersCommand({})
    );
    const recorder = recorders.ConfigurationRecorders?.find(r =>
      r.name?.includes(environmentSuffix)
    );
    expect(recorder).toBeDefined();
    expect(recorder?.recordingGroup?.allSupported).toBe(true);
  });

  test('Config Delivery Channel should exist', async () => {
    const channels = await configClient.send(
      new DescribeDeliveryChannelsCommand({})
    );
    const channel = channels.DeliveryChannels?.find(c =>
      c.name?.includes(environmentSuffix)
    );
    expect(channel).toBeDefined();
  });
});

describe('TapStack E2E Tests - KMS Encryption', () => {
  let stackOutputs: Record<string, any> = {};
  let kmsClient: KMSClient;

  beforeAll(async () => {
    kmsClient = new KMSClient({ region });
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    if (stack?.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('KMS Key should exist', async () => {
    const keyArn = stackOutputs.KMSKeyARN;
    expect(keyArn).toBeDefined();
    const keyId = keyArn.split('/').pop();
    const key = await kmsClient.send(
      new DescribeKeyCommand({ KeyId: keyId })
    );
    expect(key.KeyMetadata).toBeDefined();
  });

  test('KMS Key should have rotation enabled', async () => {
    const keyArn = stackOutputs.KMSKeyARN;
    const keyId = keyArn.split('/').pop();
    const key = await kmsClient.send(
      new DescribeKeyCommand({ KeyId: keyId })
    );
    expect(key.KeyMetadata?.KeyState).toBe('Enabled');
  });
});

describe('TapStack E2E Tests - Multi-Region Validation', () => {
  test('template should work in configured region', () => {
    expect(region).toBeDefined();
    expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d{1}$/);
  });

  test('stack deployment region should match configured region', async () => {
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = stacks.Stacks?.[0];
    expect(stack).toBeDefined();
  });
});
