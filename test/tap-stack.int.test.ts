import fs from 'fs';
import path from 'path';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeTagsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  EC2Client,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

type FlatOutputs = Record<string, string>;

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    'cfn-outputs/flat-outputs.json not found. Run the stack and export outputs before executing integration tests.'
  );
}

const outputs: FlatOutputs = JSON.parse(
  fs.readFileSync(outputsPath, 'utf8')
);
const region = process.env.AWS_REGION || outputs.StackRegion;

const elbClient = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

const roleNameFromArn = (arn: string) => arn.split('/').pop() ?? arn;

let cachedEnvironmentName: string | undefined;
const resolveEnvironmentName = async (): Promise<string> => {
  if (cachedEnvironmentName) {
    return cachedEnvironmentName;
  }
  const tagResponse = await elbClient.send(
    new DescribeTagsCommand({
      ResourceArns: [outputs.ApplicationLoadBalancerArn],
    })
  );
  const envTag = tagResponse.TagDescriptions?.[0]?.Tags?.find(
    tag => tag.Key === 'Environment'
  );
  if (!envTag?.Value) {
    throw new Error('Unable to resolve Environment tag from ALB.');
  }
  cachedEnvironmentName = envTag.Value;
  return cachedEnvironmentName;
};

const decodePolicy = (document: string) =>
  JSON.parse(decodeURIComponent(document));

describe('TapStack end-to-end infrastructure', () => {
  test('routes internet traffic through a public ALB', async () => {
    // Arrange
    const command = new DescribeLoadBalancersCommand({
      LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
    });
    // Act
    const { LoadBalancers } = await elbClient.send(command);
    const loadBalancer = LoadBalancers?.[0];
    // Assert
    expect(loadBalancer).toBeDefined();
    expect(loadBalancer?.Scheme).toBe('internet-facing');
    const subnetIds =
      loadBalancer?.AvailabilityZones?.map(zone => zone.SubnetId) ?? [];
    expect(subnetIds).toEqual(
      expect.arrayContaining([
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ])
    );
    expect(loadBalancer?.SecurityGroups).toContain(outputs.ALBSecurityGroupId);
  });

  test('registers healthy EC2 capacity behind the ALB and ASG', async () => {
    // Arrange
    const targetGroupsResponse = await elbClient.send(
      new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.ApplicationLoadBalancerArn,
      })
    );
    const targetGroupArn =
      targetGroupsResponse.TargetGroups?.[0]?.TargetGroupArn;
    expect(targetGroupArn).toBeDefined();
    // Act
    const targetHealth = await elbClient.send(
      new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      })
    );
    const healthyTargets =
      targetHealth.TargetHealthDescriptions?.filter(
        desc => desc.TargetHealth?.State === 'healthy'
      ) ?? [];
    const asgResponse = await autoScalingClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );
    const asg = asgResponse.AutoScalingGroups?.[0];
    // Assert
    expect(healthyTargets.length).toBeGreaterThan(0);
    expect(asg).toBeDefined();
    expect(asg?.TargetGroupARNs).toContain(targetGroupArn);
    const subnetList = asg?.VPCZoneIdentifier?.split(',') ?? [];
    expect(subnetList).toEqual(
      expect.arrayContaining([
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ])
    );
    expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
    expect(asg?.MaxSize).toBeGreaterThanOrEqual(asg.MinSize ?? 0);
  });

  test('security groups enforce layered trust boundaries', async () => {
    // Arrange
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.ALBSecurityGroupId,
          outputs.WebServerSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
        ],
      })
    );
    const albSg = SecurityGroups?.find(
      sg => sg.GroupId === outputs.ALBSecurityGroupId
    );
    const webSg = SecurityGroups?.find(
      sg => sg.GroupId === outputs.WebServerSecurityGroupId
    );
    const dbSg = SecurityGroups?.find(
      sg => sg.GroupId === outputs.DatabaseSecurityGroupId
    );
    // Act & Assert
    expect(albSg?.IpPermissions).toEqual([
      expect.objectContaining({
        FromPort: 80,
        IpRanges: expect.arrayContaining([
          expect.objectContaining({ CidrIp: '0.0.0.0/0' }),
        ]),
      }),
    ]);
    expect(webSg?.IpPermissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          FromPort: 80,
          UserIdGroupPairs: expect.arrayContaining([
            expect.objectContaining({
              GroupId: outputs.ALBSecurityGroupId,
            }),
          ]),
        }),
        expect.objectContaining({
          FromPort: 22,
          IpRanges: expect.arrayContaining([
            expect.objectContaining({ CidrIp: '0.0.0.0/0' }),
          ]),
        }),
      ])
    );
    expect(dbSg?.IpPermissions).toEqual([
      expect.objectContaining({
        FromPort: 3306,
        UserIdGroupPairs: expect.arrayContaining([
          expect.objectContaining({
            GroupId: outputs.WebServerSecurityGroupId,
          }),
        ]),
      }),
    ]);
  });

  test('private subnets retain egress via redundant NAT gateways', async () => {
    // Arrange
    const natResponse = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'state', Values: ['available'] },
        ],
      })
    );
    const routeResponse = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
          },
        ],
      })
    );
    // Act
    const natSubnetIds =
      natResponse.NatGateways?.map(gw => gw.SubnetId ?? '') ?? [];
    const privateRoutes = routeResponse.RouteTables ?? [];
    // Assert
    expect(natSubnetIds).toEqual(
      expect.arrayContaining([
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ])
    );
    privateRoutes.forEach(table => {
      const defaultRoute = table.Routes?.find(
        route => route.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute?.NatGatewayId).toBeDefined();
    });
  });

  test('RDS database remains private, encrypted, and Multi-AZ', async () => {
    // Arrange
    const dbResponse = await rdsClient.send(
      new DescribeDBInstancesCommand({})
    );
    const dbInstance = dbResponse.DBInstances?.find(
      db => db.Endpoint?.Address === outputs.DatabaseEndpoint
    );
    // Act
    const securityGroupIds =
      dbInstance?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) ?? [];
    const subnetIds =
      dbInstance?.DBSubnetGroup?.Subnets?.map(sub => sub.SubnetIdentifier) ??
      [];
    // Assert
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(securityGroupIds).toContain(outputs.DatabaseSecurityGroupId);
    expect(subnetIds).toEqual(
      expect.arrayContaining([
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ])
    );
  });

  test('template storage bucket enforces encryption and public access blocks', async () => {
    // Arrange
    const bucketName = outputs.TemplateBucketName;
    const encryption = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName })
    );
    const publicAccess = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName })
    );
    const policy = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: bucketName })
    );
    const policyDocument = JSON.parse(policy.Policy ?? '{}');
    // Assert
    expect(
      encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe('AES256');
    expect(publicAccess.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
    const statements = policyDocument.Statement ?? [];
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Sid: 'DenyInsecureConnections' }),
        expect.objectContaining({ Sid: 'DenyUnencryptedObjectUploads' }),
      ])
    );
  });

  test('EC2 IAM role exposes least-privilege policies', async () => {
    // Arrange
    const roleName = roleNameFromArn(outputs.EC2RoleArn);
    const role = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );
    const assumeDoc = decodePolicy(role.Role.AssumeRolePolicyDocument!);
    const attachedPolicies = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    const inlinePolicies = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );
    const s3Policy = await iamClient.send(
      new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyAccess',
      })
    );
    const s3PolicyDoc = decodePolicy(s3Policy.PolicyDocument!);
    // Assert
    const assumeStmt = assumeDoc.Statement?.find(
      (stmt: any) => stmt.Principal?.Service?.includes('ec2.amazonaws.com')
    );
    expect(assumeStmt).toBeDefined();
    expect(
      attachedPolicies.AttachedPolicies?.map(policy => policy.PolicyName)
    ).toEqual(
      expect.arrayContaining([
        'CloudWatchAgentServerPolicy',
        'AmazonSSMManagedInstanceCore',
      ])
    );
    expect(inlinePolicies.PolicyNames).toEqual(
      expect.arrayContaining(['S3ReadOnlyAccess', 'EC2DescribeAccess'])
    );
    const s3Actions =
      s3PolicyDoc.Statement?.[0]?.Action ??
      s3PolicyDoc.Statement?.[0]?.Actions ??
      [];
    expect(s3Actions).toEqual(
      expect.arrayContaining([
        's3:GetObject',
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:GetBucketVersioning',
      ])
    );
  });

  test('observability stack (logs, alarms, SNS) is provisioned end-to-end', async () => {
    // Arrange
    const environmentName = await resolveEnvironmentName();
    const accessLogGroup = `/aws/ec2/${environmentName}/apache/access`;
    const errorLogGroup = `/aws/ec2/${environmentName}/apache/error`;
    const logGroups = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/ec2/${environmentName}/apache`,
      })
    );
    const alarmNames = [
      `${environmentName}-HighCPU-ASG`,
      `${environmentName}-LowCPU-ASG`,
      `${environmentName}-Database-HighCPU`,
      `${environmentName}-Database-LowStorage`,
      `${environmentName}-ALB-UnhealthyTargets`,
    ];
    const alarms = await cloudWatchClient.send(
      new DescribeAlarmsCommand({ AlarmNames: alarmNames })
    );
    const topicAttributes = await snsClient.send(
      new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn,
      })
    );
    // Assert
    const logGroupNames = logGroups.logGroups?.map(group => group.logGroupName);
    expect(logGroupNames).toEqual(
      expect.arrayContaining([accessLogGroup, errorLogGroup])
    );
    expect(alarms.MetricAlarms?.map(alarm => alarm.AlarmName)).toEqual(
      expect.arrayContaining(alarmNames)
    );
    expect(topicAttributes.Attributes?.TopicArn).toBe(outputs.AlarmTopicArn);
    expect(topicAttributes.Attributes?.DisplayName).toContain(
      environmentName
    );
  });
});
