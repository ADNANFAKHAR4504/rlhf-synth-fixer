import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  LambdaClient,
  GetFunctionCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const lambdaClient = new LambdaClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('VPC and Networking Integration Tests', () => {
  test('VPC should have two public subnets in different availability zones', async () => {
    const vpcId = outputs.VPCId;

    const subnetsResponse = await ec2Client.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );

    const subnets = subnetsResponse.Subnets || [];
    expect(subnets).toHaveLength(2);

    // Check different AZs
    const azs = subnets.map(subnet => subnet.AvailabilityZone);
    expect(new Set(azs).size).toBe(2);

    // Check CIDR blocks
    const cidrBlocks = subnets.map(subnet => subnet.CidrBlock).sort();
    expect(cidrBlocks).toContain('10.0.1.0/24');
    expect(cidrBlocks).toContain('10.0.2.0/24');

    // Check MapPublicIpOnLaunch
    subnets.forEach(subnet => {
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    });
  });

  test('Route table should have route to Internet Gateway for both subnets', async () => {
    const vpcId = outputs.VPCId;

    const routeTablesResponse = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );

    const routeTables = routeTablesResponse.RouteTables || [];
    const publicRouteTable = routeTables.find(
      rt =>
        rt.Routes?.some(
          route => route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
        )
    );

    expect(publicRouteTable).toBeDefined();

    // Check both subnets are associated
    const associations = publicRouteTable?.Associations || [];
    const subnetAssociations = associations.filter(assoc => assoc.SubnetId);
    expect(subnetAssociations).toHaveLength(2);

    // Verify route to IGW
    const igwRoute = publicRouteTable?.Routes?.find(
      route => route.DestinationCidrBlock === '0.0.0.0/0'
    );
    expect(igwRoute).toBeDefined();
    expect(igwRoute?.GatewayId).toMatch(/^igw-/);
    expect(igwRoute?.State).toBe('active');
  });

  test('VPC Flow Logs should be enabled and delivering to CloudWatch Logs', async () => {
    const vpcId = outputs.VPCId;

    const flowLogsResponse = await ec2Client.send(
      new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      })
    );

    const flowLogs = flowLogsResponse.FlowLogs || [];
    expect(flowLogs.length).toBeGreaterThan(0);

    const flowLog = flowLogs[0];
    expect(flowLog.TrafficType).toBe('ALL');
    expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    expect(flowLog.FlowLogStatus).toBe('ACTIVE');
  });
});

describe('EC2 and Security Group Integration Tests', () => {
  test('EC2 instances should be accessible via security group rules', async () => {
    const sgId = outputs.WebSecurityGroupId;

    const sgResponse = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      })
    );

    const sg = sgResponse.SecurityGroups?.[0];
    expect(sg).toBeDefined();

    // Check ingress rules
    const ingressRules = sg?.IpPermissions || [];
    expect(ingressRules).toHaveLength(3);

    // Verify HTTP rule
    const httpRule = ingressRules.find(
      rule => rule.FromPort === 80 && rule.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

    // Verify HTTPS rule
    const httpsRule = ingressRules.find(
      rule => rule.FromPort === 443 && rule.ToPort === 443
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

    // Verify SSH rule
    const sshRule = ingressRules.find(
      rule => rule.FromPort === 22 && rule.ToPort === 22
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
  });

  test('EC2 instances should be running in correct subnets with security group attached', async () => {
    const instance1Id = outputs.EC2Instance1Id;
    const instance2Id = outputs.EC2Instance2Id;
    const subnet1Id = outputs.PublicSubnet1Id;
    const subnet2Id = outputs.PublicSubnet2Id;
    const sgId = outputs.WebSecurityGroupId;

    const instancesResponse = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id],
      })
    );

    const instances =
      instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
    expect(instances).toHaveLength(2);

    // Check Instance 1
    const instance1 = instances.find(i => i.InstanceId === instance1Id);
    expect(instance1?.SubnetId).toBe(subnet1Id);
    expect(instance1?.SecurityGroups?.[0].GroupId).toBe(sgId);
    expect(instance1?.PublicIpAddress).toBeDefined();

    // Check Instance 2
    const instance2 = instances.find(i => i.InstanceId === instance2Id);
    expect(instance2?.SubnetId).toBe(subnet2Id);
    expect(instance2?.SecurityGroups?.[0].GroupId).toBe(sgId);
    expect(instance2?.PublicIpAddress).toBeDefined();

    // Verify monitoring enabled
    expect(instance1?.Monitoring?.State).toBe('enabled');
    expect(instance2?.Monitoring?.State).toBe('enabled');
  });

  test('EC2 instances should have IAM instance profile attached', async () => {
    const instance1Id = outputs.EC2Instance1Id;
    const instance2Id = outputs.EC2Instance2Id;

    const instancesResponse = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id],
      })
    );

    const instances =
      instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

    instances.forEach(instance => {
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toMatch(/instance-profile/);
    });

    // Verify instance profile exists and has role
    const instanceProfileName = `EC2InstanceProfile-${environmentSuffix}`;
    const profileResponse = await iamClient.send(
      new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      })
    );

    expect(profileResponse.InstanceProfile).toBeDefined();
    expect(profileResponse.InstanceProfile?.Roles).toHaveLength(1);
    expect(profileResponse.InstanceProfile?.Roles?.[0].RoleName).toBe(
      `EC2InstanceRole-${environmentSuffix}`
    );
  });
});

describe('Lambda and EventBridge Integration Tests', () => {
  test('Lambda functions should have permissions to start/stop EC2 instances', async () => {
    const startFunctionArn = outputs.StartEC2InstancesFunctionArn;
    const functionName = startFunctionArn.split(':').pop();

    const functionResponse = await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: functionName,
      })
    );

    expect(functionResponse.Configuration?.Runtime).toBe('python3.13');
    expect(functionResponse.Configuration?.Timeout).toBe(60);
    expect(functionResponse.Configuration?.Handler).toBe('index.lambda_handler');

    // Verify IAM role
    const roleArn = functionResponse.Configuration?.Role;
    expect(roleArn).toBeDefined();
    expect(roleArn).toContain(`LambdaEC2ControlRole-${environmentSuffix}`);

    // Verify role has attached policies
    const roleName = `LambdaEC2ControlRole-${environmentSuffix}`;
    const roleResponse = await iamClient.send(
      new GetRoleCommand({
        RoleName: roleName,
      })
    );

    expect(roleResponse.Role).toBeDefined();

    // List attached managed policies
    const attachedPoliciesResponse = await iamClient.send(
      new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      })
    );

    const attachedPolicies = attachedPoliciesResponse.AttachedPolicies || [];
    const hasLambdaBasicExecution = attachedPolicies.some(
      policy => policy.PolicyName === 'AWSLambdaBasicExecutionRole'
    );
    expect(hasLambdaBasicExecution).toBe(true);
  });

  test('EventBridge rules should target Lambda functions with correct schedule', async () => {
    const startRuleName = `StartInstancesSchedule-${environmentSuffix}`;
    const stopRuleName = `StopInstancesSchedule-${environmentSuffix}`;

    // Check Start rule
    const startRuleResponse = await eventBridgeClient.send(
      new DescribeRuleCommand({
        Name: startRuleName,
      })
    );

    expect(startRuleResponse.State).toBe('ENABLED');
    expect(startRuleResponse.ScheduleExpression).toMatch(/^cron\(/);

    // Check Start rule targets
    const startTargetsResponse = await eventBridgeClient.send(
      new ListTargetsByRuleCommand({
        Rule: startRuleName,
      })
    );

    const startTargets = startTargetsResponse.Targets || [];
    expect(startTargets).toHaveLength(1);
    expect(startTargets[0].Arn).toContain('StartEC2Instances');

    // Check Stop rule
    const stopRuleResponse = await eventBridgeClient.send(
      new DescribeRuleCommand({
        Name: stopRuleName,
      })
    );

    expect(stopRuleResponse.State).toBe('ENABLED');
    expect(stopRuleResponse.ScheduleExpression).toMatch(/^cron\(/);

    // Check Stop rule targets
    const stopTargetsResponse = await eventBridgeClient.send(
      new ListTargetsByRuleCommand({
        Rule: stopRuleName,
      })
    );

    const stopTargets = stopTargetsResponse.Targets || [];
    expect(stopTargets).toHaveLength(1);
    expect(stopTargets[0].Arn).toContain('StopEC2Instances');
  });
});

describe('CloudWatch Alarms and EC2 Integration Tests', () => {
  test('CloudWatch alarms should be configured to monitor EC2 instances CPU', async () => {
    const instance1Id = outputs.EC2Instance1Id;
    const instance2Id = outputs.EC2Instance2Id;

    const alarmsResponse = await cloudWatchClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: 'HighCPUAlarm',
      })
    );

    const alarms = alarmsResponse.MetricAlarms || [];
    expect(alarms.length).toBeGreaterThanOrEqual(2);

    // Check High CPU Alarm for Instance 1
    const highAlarm1 = alarms.find(
      alarm =>
        alarm.AlarmName === `HighCPUAlarm-Instance1-${environmentSuffix}`
    );
    expect(highAlarm1).toBeDefined();
    expect(highAlarm1?.MetricName).toBe('CPUUtilization');
    expect(highAlarm1?.Namespace).toBe('AWS/EC2');
    expect(highAlarm1?.Threshold).toBe(70);
    expect(highAlarm1?.ComparisonOperator).toBe('GreaterThanThreshold');
    expect(highAlarm1?.Period).toBe(60);
    expect(highAlarm1?.EvaluationPeriods).toBe(2);

    const dimension1 = highAlarm1?.Dimensions?.find(
      d => d.Name === 'InstanceId'
    );
    expect(dimension1?.Value).toBe(instance1Id);

    // Check High CPU Alarm for Instance 2
    const highAlarm2 = alarms.find(
      alarm =>
        alarm.AlarmName === `HighCPUAlarm-Instance2-${environmentSuffix}`
    );
    expect(highAlarm2).toBeDefined();

    const dimension2 = highAlarm2?.Dimensions?.find(
      d => d.Name === 'InstanceId'
    );
    expect(dimension2?.Value).toBe(instance2Id);
  });

  test('Low CPU alarms should be configured for idle instance detection', async () => {
    const alarmsResponse = await cloudWatchClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: 'LowCPUAlarm',
      })
    );

    const alarms = alarmsResponse.MetricAlarms || [];
    expect(alarms.length).toBeGreaterThanOrEqual(2);

    alarms.forEach(alarm => {
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(10);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(3);
    });
  });
});

describe('Multi-AZ High Availability Integration Tests', () => {
  test('EC2 instances should be distributed across different availability zones', async () => {
    const instance1Id = outputs.EC2Instance1Id;
    const instance2Id = outputs.EC2Instance2Id;

    const instancesResponse = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id],
      })
    );

    const instances =
      instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

    const azs = instances.map(i => i.Placement?.AvailabilityZone);
    expect(azs).toHaveLength(2);
    expect(new Set(azs).size).toBe(2); // Ensure different AZs

    // Verify subnets are in correct AZs
    const subnet1Id = outputs.PublicSubnet1Id;
    const subnet2Id = outputs.PublicSubnet2Id;

    const subnetsResponse = await ec2Client.send(
      new DescribeSubnetsCommand({
        SubnetIds: [subnet1Id, subnet2Id],
      })
    );

    const subnets = subnetsResponse.Subnets || [];
    const subnetAzs = subnets.map(s => s.AvailabilityZone);

    expect(azs).toEqual(expect.arrayContaining(subnetAzs));
  });
});
