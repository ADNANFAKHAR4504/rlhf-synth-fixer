import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand
} from '@aws-sdk/client-ec2';
import { 
  ELBv2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  S3Client, 
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { 
  CloudTrailClient, 
  DescribeTrailsCommand 
} from '@aws-sdk/client-cloudtrail';
import { 
  WAFv2Client, 
  GetWebACLCommand 
} from '@aws-sdk/client-wafv2';
import { 
  SNSClient, 
  GetTopicAttributesCommand 
} from '@aws-sdk/client-sns';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from '@aws-sdk/client-cloudwatch';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from '@aws-sdk/client-auto-scaling';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand
} from '@aws-sdk/client-config-service';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const elbv2Client = new ELBv2Client({ region });
const s3Client = new S3Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const wafClient = new WAFv2Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const configClient = new ConfigServiceClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  
  describe('VPC Infrastructure', () => {
    test('should have deployed VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have four subnets in different AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      expect(subnetIds.every(id => id)).toBe(true);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets).toHaveLength(4);
      
      const publicSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      const availabilityZones = [...new Set(response.Subnets!.map(s => s.AvailabilityZone))];
      expect(availabilityZones.length).toBe(2);
    });

    test('should have NAT Gateways in public subnets', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(response.NatGateways).toHaveLength(2);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    test('should have Internet Gateway attached', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should only allow HTTPS', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['*alb*'] }
        ]
      }));

      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      const albSg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('alb'));
      expect(albSg).toBeDefined();

      const httpsRules = albSg!.IpPermissions!.filter(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRules).toHaveLength(1);
      expect(httpsRules[0].IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 security group should only accept traffic from ALB', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['*ec2*'] }
        ]
      }));

      const ec2Sg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('ec2'));
      expect(ec2Sg).toBeDefined();

      const httpRules = ec2Sg!.IpPermissions!.filter(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRules).toHaveLength(1);
      expect(httpRules[0].UserIdGroupPairs).toHaveLength(1);
    });
  });

  describe('Load Balancer', () => {
    test('should have deployed Application Load Balancer', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0]]
      }));

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.IpAddressType).toBe('ipv4');
      expect(alb.AvailabilityZones).toHaveLength(2);
    });

    test('should have target group with health checks', async () => {
      const albArn = (await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]]
      }))).LoadBalancers![0].LoadBalancerArn!;

      const targetGroupsResponse = await elbv2Client.send(new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn
      }));

      expect(targetGroupsResponse.TargetGroups).toHaveLength(1);
      const targetGroup = targetGroupsResponse.TargetGroups![0];
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe('/');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have HTTPS listener configured', async () => {
      const albArn = (await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]]
      }))).LoadBalancers![0].LoadBalancerArn!;

      const listenersResponse = await elbv2Client.send(new DescribeListenersCommand({
        LoadBalancerArn: albArn
      }));

      expect(listenersResponse.Listeners).toHaveLength(1);
      const listener = listenersResponse.Listeners![0];
      expect(listener.Port).toBe(443);
      expect(listener.Protocol).toBe('HTTPS');
      expect(listener.Certificates).toHaveLength(1);
      expect(listener.DefaultActions![0].Type).toBe('forward');
    });
  });

  describe('S3 Buckets', () => {
    const bucketTests = [
      { key: 'AccessLogsBucketName', purpose: 'ALB access logs' },
      { key: 'CloudTrailBucket', purpose: 'CloudTrail logs' },
      { key: 'CentralLogsBucketName', purpose: 'Central logging' }
    ];

    bucketTests.forEach(({ key, purpose }) => {
      test(`${purpose} bucket should exist and be configured securely`, async () => {
        const bucketName = outputs[key];
        expect(bucketName).toBeDefined();

        await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
          .resolves.not.toThrow();

        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');

        const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({
          Bucket: bucketName
        }));
        const config = publicAccessResponse.PublicAccessBlockConfiguration!;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);

        if (key !== 'AccessLogsBucketName') {
          const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
            Bucket: bucketName
          }));
          expect(versioningResponse.Status).toBe('Enabled');
        }
      });
    });
  });

  describe('WAF Protection', () => {
    test('should have WAF Web ACL protecting ALB', async () => {
      const wafArn = outputs.WAFWebACLArn;
      expect(wafArn).toBeDefined();

      const webAclId = wafArn.split('/').pop()!;
      const response = await wafClient.send(new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: webAclId
      }));

      expect(response.WebACL).toBeDefined();
      const webAcl = response.WebACL!;
      expect(webAcl.DefaultAction!.Allow).toBeDefined();
      expect(webAcl.Rules).toHaveLength(3);

      const rateRule = webAcl.Rules!.find(rule => rule.Name === 'RateLimitRule');
      expect(rateRule).toBeDefined();
      expect(rateRule!.Statement!.RateBasedStatement!.Limit).toBe(2000);

      const commonRules = webAcl.Rules!.find(rule => rule.Name === 'AWSManagedRulesCommonRuleSet');
      expect(commonRules).toBeDefined();

      const sqlRules = webAcl.Rules!.find(rule => rule.Name === 'AWSManagedRulesSQLiRuleSet');
      expect(sqlRules).toBeDefined();
    });
  });

  describe('CloudTrail Logging', () => {
    test('should have CloudTrail enabled with proper configuration', async () => {
      const cloudTrailBucket = outputs.CloudTrailBucket;
      
      const response = await cloudTrailClient.send(new DescribeTrailsCommand({}));
      const trail = response.trailList!.find(t => t.S3BucketName === cloudTrailBucket);
      
      expect(trail).toBeDefined();
      expect(trail!.IsLogging).toBe(true);
      expect(trail!.IsMultiRegionTrail).toBe(true);
      expect(trail!.LogFileValidationEnabled).toBe(true);
      expect(trail!.IncludeGlobalServiceEvents).toBe(true);
      expect(trail!.CloudWatchLogsLogGroupArn).toBeDefined();
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for alerts', async () => {
      const alertTopicArn = outputs.AlertTopicArn;
      expect(alertTopicArn).toBeDefined();

      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: alertTopicArn
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(alertTopicArn);
      expect(response.Attributes!.SubscriptionsConfirmed).toBeDefined();
    });

    test('should have CloudWatch alarms configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'secure-webapp-'
      }));

      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      const unauthorizedAlarm = response.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes('unauthorized-api-calls')
      );
      expect(unauthorizedAlarm).toBeDefined();
      expect(unauthorizedAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(unauthorizedAlarm!.Threshold).toBe(5);

      const bruteForceAlarm = response.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes('brute-force-report')
      );
      expect(bruteForceAlarm).toBeDefined();
      expect(bruteForceAlarm!.Threshold).toBe(10);
    });
  });

  describe('Auto Scaling', () => {
    test('should have Auto Scaling Group with proper configuration', async () => {
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`secure-webapp-prod-asg-ec2`]
      }));

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.VPCZoneIdentifier).toBeDefined();
      
      const subnetIds = asg.VPCZoneIdentifier!.split(',');
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    });
  });

  describe('AWS Config Compliance', () => {
    test('should have Config rules for security compliance', async () => {
      const response = await configClient.send(new DescribeConfigRulesCommand({}));
      
      const sshRule = response.ConfigRules!.find(rule => 
        rule.ConfigRuleName?.includes('unrestricted-ssh')
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.Source!.SourceIdentifier).toBe('INCOMING_SSH_DISABLED');
      expect(sshRule!.Scope!.ComplianceResourceTypes).toContain('AWS::EC2::SecurityGroup');
    });
  });

  describe('End-to-End Connectivity', () => {
    test('ALB should be accessible via HTTPS', async () => {
      const albUrl = outputs.ALBUrl;
      expect(albUrl).toBeDefined();
      expect(albUrl).toMatch(/^https:\/\//);
      
      const response = await fetch(albUrl, { method: 'HEAD' });
      expect([200, 503, 502]).toContain(response.status);
    });

    test('should verify cross-stack exports are properly configured', () => {
      const requiredOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 
        'PrivateSubnet2Id', 'ALBDNSName', 'WAFWebACLArn', 'AlertTopicArn'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('Security Posture Validation', () => {
    test('should validate no resources are publicly accessible except ALB', async () => {
      const vpcId = outputs.VPCId;
      
      const securityGroupsResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const publiclyAccessibleSGs = securityGroupsResponse.SecurityGroups!.filter(sg => 
        sg.IpPermissions!.some(rule => 
          rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        )
      );

      expect(publiclyAccessibleSGs.length).toBe(1);
      expect(publiclyAccessibleSGs[0].GroupName).toMatch(/alb/i);
    });

    test('should validate encryption is enabled on all storage services', async () => {
      const buckets = [
        outputs.CloudTrailBucket,
        outputs.AccessLogsBucketName,
        outputs.CentralLogsBucketName
      ];

      for (const bucketName of buckets) {
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      }
    });
  });
});
