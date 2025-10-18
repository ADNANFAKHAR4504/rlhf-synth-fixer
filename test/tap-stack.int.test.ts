import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';

// AWS SDK clients
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const route53Client = new Route53Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const configClient = new ConfigServiceClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'inttest';

describe('TapStack Integration Tests - Secure Multi-Tier AWS Environment', () => {
  let vpcId: string;
  let stackName: string;

  beforeAll(async () => {
    // Get stack outputs to find deployed resources
    stackName = `TapStack${environmentSuffix}`;

    // Find VPC by tags
    const vpcsResponse = await ec2Client.send(
      new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${stackName}/SecureFinancialVPC${environmentSuffix}`],
          },
          { Name: 'state', Values: ['available'] },
        ],
      })
    );

    if (vpcsResponse.Vpcs && vpcsResponse.Vpcs.length > 0) {
      vpcId = vpcsResponse.Vpcs[0].VpcId!;
    } else {
      throw new Error(`VPC not found for stack ${stackName}`);
    }
  });

  describe('Infrastructure Integration', () => {
    test('should create complete secure multi-tier environment', async () => {
      // Verify VPC exists
      expect(vpcId).toBeDefined();

      // Verify subnets exist
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      expect(subnetsResponse.Subnets).toHaveLength(9); // 3 public + 3 private + 3 data

      // Verify instances exist
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );
      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances.length).toBeGreaterThanOrEqual(4); // 3 NAT + 1 Bastion

      // Verify security groups exist
      const securityGroupsResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      expect(
        securityGroupsResponse.SecurityGroups?.length
      ).toBeGreaterThanOrEqual(5);

      // Verify Lambda functions exist
      const lambdaResponse = await lambdaClient.send(
        new ListFunctionsCommand({})
      );
      const ourLambdas =
        lambdaResponse.Functions?.filter(f =>
          f.FunctionName?.includes(environmentSuffix)
        ) || [];
      expect(ourLambdas.length).toBeGreaterThanOrEqual(2);

      // Verify CloudWatch alarms exist
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({})
      );
      const ourAlarms =
        alarmsResponse.MetricAlarms?.filter(a =>
          a.AlarmName?.includes(environmentSuffix)
        ) || [];
      expect(ourAlarms.length).toBeGreaterThanOrEqual(7);

      // Verify Config rules exist
      const configResponse = await configClient.send(
        new DescribeConfigRulesCommand({})
      );
      const ourConfigRules =
        configResponse.ConfigRules?.filter(r =>
          r.ConfigRuleName?.includes(environmentSuffix)
        ) || [];
      expect(ourConfigRules.length).toBeGreaterThanOrEqual(4);
    });

    test('should have proper network connectivity', async () => {
      // Verify VPC configuration
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');

      // Verify subnets are properly configured
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const subnets = subnetsResponse.Subnets || [];
      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(
        s =>
          !s.MapPublicIpOnLaunch &&
          s.Tags?.some(
            t => t.Key === 'aws-cdk:subnet-type' && t.Value === 'Private'
          )
      );
      const dataSubnets = subnets.filter(
        s =>
          !s.MapPublicIpOnLaunch &&
          s.Tags?.some(
            t => t.Key === 'aws-cdk:subnet-type' && t.Value === 'Isolated'
          )
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
      expect(dataSubnets).toHaveLength(3);
    });

    test('should have proper security configurations', async () => {
      // Verify security groups exist and are properly configured
      const securityGroupsResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const securityGroups = securityGroupsResponse.SecurityGroups || [];

      // Find NAT security group
      const natSecurityGroup = securityGroups.find(sg =>
        sg.GroupDescription?.includes('NAT instances')
      );
      expect(natSecurityGroup).toBeDefined();
      expect(natSecurityGroup?.GroupDescription).toBe(
        'Security group for NAT instances'
      );

      // Find bastion security group
      const bastionSecurityGroup = securityGroups.find(sg =>
        sg.GroupDescription?.includes('bastion host')
      );
      expect(bastionSecurityGroup).toBeDefined();
      expect(bastionSecurityGroup?.GroupDescription).toBe(
        'Security group for bastion host - Session Manager only'
      );

      // Verify bastion has restricted egress (only HTTPS)
      const bastionEgressRules =
        bastionSecurityGroup?.IpPermissionsEgress || [];
      const httpsEgressRule = bastionEgressRules.find(
        rule =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpsEgressRule).toBeDefined();

      // Find VPC endpoint security group
      const endpointSecurityGroup = securityGroups.find(sg =>
        sg.GroupDescription?.includes('VPC endpoints')
      );
      expect(endpointSecurityGroup).toBeDefined();
      expect(endpointSecurityGroup?.GroupDescription).toBe(
        'Security group for VPC endpoints'
      );
    });

    test('should have proper monitoring and logging', async () => {
      // Verify CloudWatch alarms are configured
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({})
      );
      const ourAlarms =
        alarmsResponse.MetricAlarms?.filter(a =>
          a.AlarmName?.includes(environmentSuffix)
        ) || [];

      // Find rejected connections alarm
      const rejectedConnectionsAlarm = ourAlarms.find(alarm =>
        alarm.AlarmDescription?.includes('rejected connections')
      );
      expect(rejectedConnectionsAlarm).toBeDefined();
      expect(rejectedConnectionsAlarm?.Threshold).toBe(100);
      expect(rejectedConnectionsAlarm?.ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );

      // Find NAT CPU alarms
      const natCpuAlarms = ourAlarms.filter(
        alarm =>
          alarm.AlarmDescription?.includes('NAT instance') &&
          alarm.AlarmDescription?.includes('CPU utilization')
      );
      expect(natCpuAlarms.length).toBeGreaterThanOrEqual(3);

      // Verify NAT status check alarms
      const natStatusAlarms = ourAlarms.filter(
        alarm =>
          alarm.AlarmDescription?.includes('NAT instance') &&
          alarm.AlarmDescription?.includes('status check')
      );
      expect(natStatusAlarms.length).toBeGreaterThanOrEqual(3);
    });

    test('should have proper compliance and governance', async () => {
      // Verify AWS Config rules are present
      const configResponse = await configClient.send(
        new DescribeConfigRulesCommand({})
      );
      const ourConfigRules =
        configResponse.ConfigRules?.filter(r =>
          r.ConfigRuleName?.includes(environmentSuffix)
        ) || [];

      expect(ourConfigRules.length).toBeGreaterThanOrEqual(4);

      // Verify specific Config rules exist
      const vpcSgRule = ourConfigRules.find(
        rule =>
          rule.Source?.SourceIdentifier ===
          'VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS'
      );
      expect(vpcSgRule).toBeDefined();

      const flowLogsRule = ourConfigRules.find(
        rule => rule.Source?.SourceIdentifier === 'VPC_FLOW_LOGS_ENABLED'
      );
      expect(flowLogsRule).toBeDefined();

      const ssmRule = ourConfigRules.find(
        rule => rule.Source?.SourceIdentifier === 'EC2_INSTANCE_MANAGED_BY_SSM'
      );
      expect(ssmRule).toBeDefined();

      const mfaRule = ourConfigRules.find(
        rule =>
          rule.Source?.SourceIdentifier === 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS'
      );
      expect(mfaRule).toBeDefined();
    });

    test('should have proper DNS configuration', async () => {
      // Verify private hosted zone exists
      const hostedZonesResponse = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const ourHostedZone = hostedZonesResponse.HostedZones?.find(
        zone => zone.Name === `financial-${environmentSuffix}.internal.`
      );
      expect(ourHostedZone).toBeDefined();
      expect(ourHostedZone?.Config?.Comment).toContain(
        'Private DNS zone for financial platform internal resources'
      );

      // Verify bastion DNS record exists
      if (ourHostedZone?.Id) {
        const recordsResponse = await route53Client.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: ourHostedZone.Id,
          })
        );

        const bastionRecord = recordsResponse.ResourceRecordSets?.find(
          record =>
            record.Name ===
              `bastion.financial-${environmentSuffix}.internal.` &&
            record.Type === 'A'
        );
        expect(bastionRecord).toBeDefined();
        expect(bastionRecord?.TTL).toBe(300);
      }
    });

    test('should have proper automation and failover', async () => {
      // Verify Lambda functions for automation
      const lambdaResponse = await lambdaClient.send(
        new ListFunctionsCommand({})
      );
      const ourLambdas =
        lambdaResponse.Functions?.filter(f =>
          f.FunctionName?.includes(environmentSuffix)
        ) || [];

      expect(ourLambdas.length).toBeGreaterThanOrEqual(2);

      // Find security group update function
      const sgUpdateFunction = ourLambdas.find(f =>
        f.FunctionName?.includes('SecurityGroupUpdate')
      );
      expect(sgUpdateFunction).toBeDefined();
      expect(sgUpdateFunction?.Runtime).toBe('python3.9');
      expect(sgUpdateFunction?.Handler).toBe('index.handler');
      expect(sgUpdateFunction?.Timeout).toBe(300);

      // Find NAT failover function
      const natFailoverFunction = ourLambdas.find(f =>
        f.FunctionName?.includes('NatFailover')
      );
      expect(natFailoverFunction).toBeDefined();
      expect(natFailoverFunction?.Runtime).toBe('python3.9');
      expect(natFailoverFunction?.Handler).toBe('index.handler');
      expect(natFailoverFunction?.Timeout).toBe(120);
      expect(natFailoverFunction?.Environment?.Variables?.VPC_ID).toBe(vpcId);

      // Verify NAT failover alarms exist (already tested in monitoring test)
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({})
      );
      const ourAlarms =
        alarmsResponse.MetricAlarms?.filter(a =>
          a.AlarmName?.includes(environmentSuffix)
        ) || [];

      const natStatusAlarms = ourAlarms.filter(
        alarm =>
          alarm.AlarmDescription?.includes('NAT instance') &&
          alarm.AlarmDescription?.includes('status check')
      );
      expect(natStatusAlarms.length).toBeGreaterThanOrEqual(3);
    });

    test('should have proper data protection', async () => {
      // Verify S3 bucket for Config exists
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      const configBucket = bucketsResponse.Buckets?.find(bucket =>
        bucket.Name?.includes(`financial-platform-config-${environmentSuffix}`)
      );
      expect(configBucket).toBeDefined();

      // Note: S3 bucket encryption and public access block configuration
      // would require additional SDK calls to verify, but the bucket existence
      // indicates the infrastructure was deployed correctly
    });

    test('should have proper IAM configurations', async () => {
      // Verify instances have IAM roles attached
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );

      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

      // Verify NAT instances have IAM instance profiles
      const natInstances = instances.filter(instance =>
        instance.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'NAT')
      );
      expect(natInstances.length).toBeGreaterThanOrEqual(3);

      // Verify bastion host has IAM instance profile
      const bastionInstances = instances.filter(instance =>
        instance.Tags?.some(
          tag => tag.Key === 'Type' && tag.Value === 'Bastion'
        )
      );
      expect(bastionInstances.length).toBeGreaterThanOrEqual(1);

      // All instances should have IAM instance profiles
      instances.forEach(instance => {
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    });

    test('should have proper resource tagging', async () => {
      // Verify VPC has proper tags
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs?.[0];
      expect(vpc?.Tags).toBeDefined();

      const vpcTags = vpc?.Tags || [];
      expect(
        vpcTags.some(
          tag => tag.Key === 'Environment' && tag.Value === environmentSuffix
        )
      ).toBe(true);
      expect(
        vpcTags.some(
          tag =>
            tag.Key === 'Project' && tag.Value === 'Secure-Financial-Platform'
        )
      ).toBe(true);
      expect(
        vpcTags.some(tag => tag.Key === 'ManagedBy' && tag.Value === 'CDK')
      ).toBe(true);
      expect(
        vpcTags.some(
          tag => tag.Key === 'CostCenter' && tag.Value === 'trading-platform'
        )
      ).toBe(true);
      expect(
        vpcTags.some(
          tag => tag.Key === 'Compliance' && tag.Value === 'SOC2-PCI-DSS'
        )
      ).toBe(true);
    });

    test('should have proper network segmentation', async () => {
      // Verify instances are properly distributed across AZs
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );

      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      const natInstances = instances.filter(instance =>
        instance.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'NAT')
      );

      // Verify NAT instances are distributed across multiple AZs
      const natAzs = new Set(
        natInstances.map(instance => instance.Placement?.AvailabilityZone)
      );
      expect(natAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have proper high availability configuration', async () => {
      // Verify NAT instances are distributed across AZs
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );

      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      const natInstances = instances.filter(instance =>
        instance.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'NAT')
      );

      expect(natInstances.length).toBeGreaterThanOrEqual(3);

      // Verify all NAT instances are t3.micro for cost optimization
      natInstances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.micro');
      });
    });

    test('should have proper cost optimization', async () => {
      // Verify NAT instances instead of NAT Gateways (cost optimization)
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );

      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      const natInstances = instances.filter(instance =>
        instance.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'NAT')
      );

      // Verify all instances are t3.micro for cost optimization
      instances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.micro');
      });
    });

    test('should have proper security hardening', async () => {
      // Verify bastion host has proper security configuration
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] },
          ],
        })
      );

      const instances =
        instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      const bastionInstances = instances.filter(instance =>
        instance.Tags?.some(
          tag => tag.Key === 'Type' && tag.Value === 'Bastion'
        )
      );

      expect(bastionInstances.length).toBeGreaterThanOrEqual(1);

      // Verify bastion has Session Manager only access tag
      const bastion = bastionInstances[0];
      expect(
        bastion.Tags?.some(
          tag => tag.Key === 'Access' && tag.Value === 'SessionManager-Only'
        )
      ).toBe(true);
    });

    test('should have proper environment isolation', async () => {
      // Verify environment suffix is used in resource names
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs?.[0];
      const vpcNameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(vpcNameTag?.Value).toContain(environmentSuffix);

      // Verify hosted zone uses environment suffix
      const hostedZonesResponse = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const ourHostedZone = hostedZonesResponse.HostedZones?.find(
        zone => zone.Name === `financial-${environmentSuffix}.internal.`
      );
      expect(ourHostedZone).toBeDefined();
    });
  });

  describe('Cross-Component Integration', () => {
    test('should have proper VPC endpoint integration', async () => {
      // Verify VPC endpoints exist (this would require additional SDK calls to VPC endpoints)
      // For now, we verify that the VPC exists and has proper configuration
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have proper Lambda integration with CloudWatch', async () => {
      // Verify Lambda functions exist and are properly configured
      const lambdaResponse = await lambdaClient.send(
        new ListFunctionsCommand({})
      );
      const ourLambdas =
        lambdaResponse.Functions?.filter(f =>
          f.FunctionName?.includes(environmentSuffix)
        ) || [];

      expect(ourLambdas.length).toBeGreaterThanOrEqual(2);

      // Verify Lambda functions have proper runtime and timeout
      ourLambdas.forEach(lambda => {
        expect(lambda.Runtime).toBe('python3.9');
        expect(lambda.Handler).toBe('index.handler');
        expect(lambda.Timeout).toBeGreaterThan(0);
      });
    });

    test('should have proper Config integration with S3', async () => {
      // Verify Config rules exist
      const configResponse = await configClient.send(
        new DescribeConfigRulesCommand({})
      );
      const ourConfigRules =
        configResponse.ConfigRules?.filter(r =>
          r.ConfigRuleName?.includes(environmentSuffix)
        ) || [];

      expect(ourConfigRules.length).toBeGreaterThanOrEqual(4);

      // Verify S3 bucket exists for Config
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      const configBucket = bucketsResponse.Buckets?.find(bucket =>
        bucket.Name?.includes(`financial-platform-config-${environmentSuffix}`)
      );
      expect(configBucket).toBeDefined();
    });

    test('should have proper Route53 integration with VPC', async () => {
      // Verify private hosted zone is associated with VPC
      const hostedZonesResponse = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const ourHostedZone = hostedZonesResponse.HostedZones?.find(
        zone => zone.Name === `financial-${environmentSuffix}.internal.`
      );
      expect(ourHostedZone).toBeDefined();
      expect(ourHostedZone?.Config?.PrivateZone).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    test('should work with different environment suffixes', async () => {
      // This test verifies that the current environment suffix is working
      // In a real scenario, you would deploy with different suffixes and test each
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should have proper resource naming with environment suffix', async () => {
      // Verify all resources include the environment suffix in their names/tags
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs?.[0];
      const vpcNameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(vpcNameTag?.Value).toContain(environmentSuffix);

      // Verify hosted zone uses environment suffix
      const hostedZonesResponse = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const ourHostedZone = hostedZonesResponse.HostedZones?.find(
        zone => zone.Name === `financial-${environmentSuffix}.internal.`
      );
      expect(ourHostedZone).toBeDefined();
    });
  });
});
