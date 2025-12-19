import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
  DescribeTagsCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  IAMClient,
  GetRoleCommand,
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
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS Service clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const iam = new IAMClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const route53 = new Route53Client({ region });
const ssm = new SSMClient({ region });
const secretsmanager = new SecretsManagerClient({ region });
const sns = new SNSClient({ region });
const autoscaling = new AutoScalingClient({ region });

// Resource naming helper
const company = 'fintech';
const service = 'payment';
const naming = (resourceType: string) =>
  `${company}-${service}-${environmentSuffix}-${resourceType}`;

describe('TapStack Integration Tests', () => {
  const testTimeout = 60000; // 60 seconds for AWS API calls

  describe('Stack Outputs Validation', () => {
    test(
      'all required stack outputs are present',
      async () => {
        expect(outputs.VPCId).toBeDefined();
        expect(outputs.DatabaseArn).toBeDefined();
        expect(outputs.ALBDnsName).toBeDefined();
        expect(outputs.S3BucketName).toBeDefined();
      },
      testTimeout
    );
  });

  describe('VPC Resources', () => {
    test(
      'VPC exists and is configured correctly',
      async () => {
        const vpcId = outputs.VPCId;
        expect(vpcId).toBeDefined();

        const response = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        const vpc = response.Vpcs?.[0];

        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe('10.1.0.0/16');

        // Check DNS settings
        const dnsHostnamesResponse = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );

        const dnsSupportResponse = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      },
      testTimeout
    );

    test(
      'VPC has public, private, and isolated subnets',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const subnets = response.Subnets || [];
        expect(subnets.length).toBeGreaterThanOrEqual(6);

        const publicSubnets = subnets.filter((s: any) => s.MapPublicIpOnLaunch);
        const privateSubnets = subnets.filter(
          (s: any) => !s.MapPublicIpOnLaunch && s.SubnetId
        );

        expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
        expect(privateSubnets.length).toBeGreaterThanOrEqual(6); // Private + Isolated
      },
      testTimeout
    );

    test(
      'NAT Gateways exist for private subnets',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'state', Values: ['available'] },
            ],
          })
        );

        const natGateways = response.NatGateways || [];
        expect(natGateways.length).toBeGreaterThanOrEqual(2);
      },
      testTimeout
    );

    test(
      'VPC flow logs are enabled',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeFlowLogsCommand({
            Filter: [{ Name: 'resource-id', Values: [vpcId] }],
          })
        );

        const flowLogs = response.FlowLogs || [];
        expect(flowLogs.length).toBeGreaterThan(0);

        const activeFlowLog = flowLogs.find((fl: any) => fl.FlowLogStatus === 'ACTIVE');
        expect(activeFlowLog).toBeDefined();
        expect(activeFlowLog?.TrafficType).toBe('ALL');
      },
      testTimeout
    );
  });

  describe('Security Groups', () => {
    test(
      'ALB security group has correct ingress rules',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: [naming('alb-sg')] },
            ],
          })
        );

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];
        const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
        const httpRule = ingressRules.find((r: any) => r.FromPort === 80);

        expect(httpsRule).toBeDefined();
        expect(httpRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'EC2 security group allows traffic from ALB',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: [naming('ec2-sg')] },
            ],
          })
        );

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];
        const albRule = ingressRules.find((r: any) => r.FromPort === 8080);
        expect(albRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'RDS security group allows traffic from EC2',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: [naming('rds-sg')] },
            ],
          })
        );

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];
        const dbRule = ingressRules.find((r: any) => r.FromPort === 5432);
        expect(dbRule).toBeDefined();
      },
      testTimeout
    );
  });

  describe('S3 Storage', () => {
    test(
      'S3 bucket exists and is accessible',
      async () => {
        const bucketName = outputs.S3BucketName;
        expect(bucketName).toBeDefined();

        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      },
      testTimeout
    );

    test(
      'S3 bucket has encryption enabled',
      async () => {
        const bucketName = outputs.S3BucketName;

        const response = await s3.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        const rules =
          response.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);
      },
      testTimeout
    );

    test(
      'S3 bucket has versioning enabled',
      async () => {
        const bucketName = outputs.S3BucketName;

        const response = await s3.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );

        expect(response.Status).toBe('Enabled');
      },
      testTimeout
    );

    test(
      'S3 bucket blocks public access',
      async () => {
        const bucketName = outputs.S3BucketName;

        const response = await s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      },
      testTimeout
    );

    test(
      'S3 bucket has lifecycle configuration',
      async () => {
        const bucketName = outputs.S3BucketName;

        const response = await s3.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
        );

        const rules = response.Rules || [];
        expect(rules.length).toBeGreaterThan(0);
        // Check for expiration rule - AWS SDK returns Expiration as object with Days or Date
        const hasExpirationRule = rules.some((r: any) => {
          // Expiration is an object with Days or Date property
          const hasExpiration = r.Expiration && (
            r.Expiration.Days !== undefined ||
            r.Expiration.Date !== undefined
          );
          // Status can be 'Enabled' or missing (defaults to Enabled)
          const isEnabled = !r.Status || r.Status === 'Enabled';
          return hasExpiration && isEnabled;
        });
        expect(hasExpirationRule).toBe(true);
      },
      testTimeout
    );
  });

  describe('RDS Database', () => {
    test(
      'RDS instance exists and is available',
      async () => {
        const dbArn = outputs.DatabaseArn;
        expect(dbArn).toBeDefined();

        // Extract instance identifier from ARN
        const dbIdentifier = dbArn.split(':').pop();
        expect(dbIdentifier).toBe(`fintech-payment-${environmentSuffix}-rds`);

        const response = await rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const dbInstance = response.DBInstances?.[0];
        expect(dbInstance).toBeDefined();
        expect(dbInstance?.DBInstanceStatus).toBe('available');
        expect(dbInstance?.Engine).toBe('postgres');
        expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      },
      testTimeout
    );

    test(
      'RDS instance has correct configuration',
      async () => {
        const dbArn = outputs.DatabaseArn;
        const dbIdentifier = dbArn.split(':').pop()!;

        const response = await rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const dbInstance = response.DBInstances?.[0];
        expect(dbInstance?.PubliclyAccessible).toBe(false);
        expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
        expect(dbInstance?.MultiAZ).toBeDefined();
      },
      testTimeout
    );

    test(
      'RDS instance is in isolated subnets',
      async () => {
        const dbArn = outputs.DatabaseArn;
        const dbIdentifier = dbArn.split(':').pop()!;

        const response = await rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const dbInstance = response.DBInstances?.[0];
        const subnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;

        const subnetGroupResponse = await rds.send(
          new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: subnetGroupName,
          })
        );

        const subnetGroup = subnetGroupResponse.DBSubnetGroups?.[0];
        expect(subnetGroup).toBeDefined();
        expect(subnetGroup?.DBSubnetGroupName).toContain('db-subnet-group');
      },
      testTimeout
    );
  });

  describe('EC2 and Auto Scaling', () => {
    test(
      'Launch template exists with correct configuration',
      async () => {
        const response = await ec2.send(
          new DescribeLaunchTemplatesCommand({
            LaunchTemplateNames: [naming('launch-template')],
          })
        );

        const launchTemplate = response.LaunchTemplates?.[0];
        expect(launchTemplate).toBeDefined();
        expect(launchTemplate?.LaunchTemplateName).toBe(naming('launch-template'));
      },
      testTimeout
    );

    test(
      'Auto Scaling Group exists and is configured',
      async () => {
        const response = await autoscaling.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [naming('asg')],
          })
        );

        const asg = response.AutoScalingGroups?.[0];
        expect(asg).toBeDefined();
        expect(asg?.AutoScalingGroupName).toBe(naming('asg'));
        expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg?.MaxSize).toBeGreaterThanOrEqual(1);
      },
      testTimeout
    );
  });

  describe('Application Load Balancer', () => {
    test(
      'ALB exists and is accessible',
      async () => {
        const albDns = outputs.ALBDnsName;
        expect(albDns).toBeDefined();

        const response = await elbv2.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = response.LoadBalancers?.find(
          (lb: any) => lb.DNSName === albDns
        );
        expect(alb).toBeDefined();
        expect(alb?.Scheme).toBe('internet-facing');
        expect(alb?.Type).toBe('application');
      },
      testTimeout
    );

    test(
      'ALB has target group configured',
      async () => {
        const albDns = outputs.ALBDnsName;

        const lbResponse = await elbv2.send(
          new DescribeLoadBalancersCommand({})
        );
        const alb = lbResponse.LoadBalancers?.find(
          (lb: any) => lb.DNSName === albDns
        );
        expect(alb).toBeDefined();

        const tgResponse = await elbv2.send(
          new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb?.LoadBalancerArn,
          })
        );

        const targetGroups = tgResponse.TargetGroups || [];
        expect(targetGroups.length).toBeGreaterThan(0);

        const targetGroup = targetGroups.find(
          (tg: any) => tg.TargetGroupName === naming('tg')
        );
        expect(targetGroup).toBeDefined();
        expect(targetGroup?.Port).toBe(8080);
        expect(targetGroup?.Protocol).toBe('HTTP');
      },
      testTimeout
    );

    test(
      'ALB has HTTP listener on port 80',
      async () => {
        const albDns = outputs.ALBDnsName;

        const lbResponse = await elbv2.send(
          new DescribeLoadBalancersCommand({})
        );
        const alb = lbResponse.LoadBalancers?.find(
          (lb: any) => lb.DNSName === albDns
        );
        expect(alb).toBeDefined();

        const listenerResponse = await elbv2.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb?.LoadBalancerArn,
          })
        );

        const listeners = listenerResponse.Listeners || [];
        const httpListener = listeners.find((l: any) => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
      },
      testTimeout
    );
  });

  describe('Route53 DNS', () => {
    test(
      'Hosted zone exists for payment domain',
      async () => {
        const zoneName = `payment-${environmentSuffix}.company.com.`;

        const response = await route53.send(
          new ListHostedZonesByNameCommand({ DNSName: zoneName })
        );

        const hostedZone = response.HostedZones?.find(
          (zone: any) => zone.Name === zoneName
        );
        expect(hostedZone).toBeDefined();
      },
      testTimeout
    );

    test(
      'A record exists pointing to ALB',
      async () => {
        const zoneName = `payment-${environmentSuffix}.company.com.`;

        const zoneResponse = await route53.send(
          new ListHostedZonesByNameCommand({ DNSName: zoneName })
        );
        const hostedZone = zoneResponse.HostedZones?.find(
          (zone: any) => zone.Name === zoneName
        );
        expect(hostedZone).toBeDefined();

        const recordsResponse = await route53.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: hostedZone?.Id?.replace('/hostedzone/', ''),
          })
        );

        const aRecord = recordsResponse.ResourceRecordSets?.find(
          (r: any) =>
            r.Type === 'A' && r.Name === `api.${zoneName}`
        );
        expect(aRecord).toBeDefined();
      },
      testTimeout
    );
  });

  describe('CloudWatch Monitoring', () => {
    test(
      'VPC flow logs log group exists',
      async () => {
        const logGroupName = `/aws/vpc/${naming('flowlogs')}`;

        const response = await logs.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        const logGroup = response.logGroups?.find(
          (lg: any) => lg.logGroupName === logGroupName
        );
        expect(logGroup).toBeDefined();
      },
      testTimeout
    );

    test(
      'Application log group exists',
      async () => {
        const logGroupName = `/aws/payment/${environmentSuffix}/application`;

        const response = await logs.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        const logGroup = response.logGroups?.find(
          (lg: any) => lg.logGroupName === logGroupName
        );
        expect(logGroup).toBeDefined();
      },
      testTimeout
    );

    test(
      'CloudWatch alarms exist for CPU monitoring',
      async () => {
        const response = await cloudwatch.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: naming('cpu-alarm'),
          })
        );

        const alarms = response.MetricAlarms || [];
        expect(alarms.length).toBeGreaterThan(0);

        const cpuAlarm = alarms.find((a: any) =>
          a.AlarmName.includes('cpu-alarm')
        );
        expect(cpuAlarm).toBeDefined();
      },
      testTimeout
    );

    test(
      'SNS topic exists for alarms',
      async () => {
        const response = await sns.send(new ListTopicsCommand({}));

        const topics = response.Topics || [];
        const alarmTopic = topics.find((t: any) =>
          t.TopicArn?.includes(naming('alarms'))
        );
        expect(alarmTopic).toBeDefined();
      },
      testTimeout
    );
  });

  describe('SSM Parameter Store', () => {
    test(
      'DB endpoint parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/db-endpoint`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Name).toBe(paramName);
      },
      testTimeout
    );

    test(
      'DB port parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/db-port`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Name).toBe(paramName);
      },
      testTimeout
    );

    test(
      'DB secret ARN parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/db-secret-arn`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Name).toBe(paramName);
      },
      testTimeout
    );

    test(
      'S3 bucket parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/s3-bucket`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Value).toBe(outputs.S3BucketName);
      },
      testTimeout
    );

    test(
      'ALB DNS parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/alb-dns`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Value).toBe(outputs.ALBDnsName);
      },
      testTimeout
    );

    test(
      'Environment parameter exists',
      async () => {
        const paramName = `/${environmentSuffix}/${service}/environment`;

        const response = await ssm.send(
          new GetParameterCommand({ Name: paramName })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Value).toBe(environmentSuffix);
      },
      testTimeout
    );
  });

  describe('Secrets Manager', () => {
    test(
      'Database secret exists',
      async () => {
        const secretName = naming('db-secret');

        const response = await secretsmanager.send(
          new DescribeSecretCommand({ SecretId: secretName })
        );

        expect(response).toBeDefined();
        expect(response.Name).toBe(secretName);
      },
      testTimeout
    );
  });

  describe('IAM Roles', () => {
    test(
      'EC2 role exists with managed policies',
      async () => {
        const roleName = naming('ec2-role');

        const roleResponse = await iam.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();

        const policiesResponse = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );

        const policies = policiesResponse.AttachedPolicies || [];
        const policyNames = policies.map((p: any) => p.PolicyName);
        expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
        expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      },
      testTimeout
    );

    test(
      'RDS monitoring role exists',
      async () => {
        const roleName = naming('rds-monitoring-role');

        const response = await iam.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(response.Role).toBeDefined();
      },
      testTimeout
    );
  });

  describe('Resource Tagging', () => {
    test(
      'VPC has correct tags',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeTagsCommand({
            Filters: [{ Name: 'resource-id', Values: [vpcId] }],
          })
        );

        const tags = response.Tags || [];
        const tagMap = tags.reduce(
          (acc: any, tag: any) => {
            acc[tag.Key!] = tag.Value!;
            return acc;
          },
          {} as Record<string, string>
        );

        expect(tagMap['Environment']).toBe(environmentSuffix);
        expect(tagMap['Team']).toBe('PaymentProcessing');
        expect(tagMap['CostCenter']).toBe('Engineering');
      },
      testTimeout
    );
  });
});
