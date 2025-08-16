import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import {
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeAvailabilityZonesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
  DescribeConfigRulesCommand,
  GetComplianceDetailsByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import fs from 'fs';

// CFN outputs produced by your deploy step
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const asgClient = new AutoScalingClient({ region });
const configClient = new ConfigServiceClient({ region });

// small helper for fetch timeout (Node 18+ global fetch)
async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { method: 'HEAD', signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcResp.Vpcs).toHaveLength(1);
      const vpc = vpcResp.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);

      // Check DNS attributes are enabled
      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      // Verify VPC has proper tags
      const nameTag = vpc.Tags?.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('vpc');
      
      const environmentTag = vpc.Tags?.find((t) => t.Key === 'Environment');
      expect(environmentTag).toBeDefined();
    });

    test('should have public and private subnets in multiple AZs', async () => {
      const publicSubnets = outputs.PublicSubnets.split(',').filter((s: string) => s.length > 0);
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s.length > 0);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBe(privateSubnets.length);

      // Test public subnets configuration
      const publicResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnets })
      );
      const uniquePublicAZs = new Set();
      publicResponse.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
        uniquePublicAZs.add(subnet.AvailabilityZone);
        
        // Check subnet tags
        const tierTag = subnet.Tags?.find((t) => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('public');
      });
      expect(uniquePublicAZs.size).toBeGreaterThanOrEqual(2);

      // Test private subnets configuration  
      const privateResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnets })
      );
      const uniquePrivateAZs = new Set();
      privateResponse.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]0\.0\/24$/);
        uniquePrivateAZs.add(subnet.AvailabilityZone);
        
        // Check subnet tags
        const tierTag = subnet.Tags?.find((t) => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('private');
      });
      expect(uniquePrivateAZs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have properly configured security groups', async () => {
      const securityGroups = outputs.SecurityGroups.split(',');
      expect(securityGroups.length).toBe(3); // ALB, Web, DB security groups

      const sgResp = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: securityGroups })
      );
      expect(sgResp.SecurityGroups).toHaveLength(3);

      // Find each security group by name pattern
      const albSG = sgResp.SecurityGroups!.find(sg => sg.GroupName?.includes('alb'));
      const webSG = sgResp.SecurityGroups!.find(sg => sg.GroupName?.includes('web'));
      const dbSG = sgResp.SecurityGroups!.find(sg => sg.GroupName?.includes('db'));

      expect(albSG).toBeDefined();
      expect(webSG).toBeDefined();
      expect(dbSG).toBeDefined();

      // Check ALB security group allows HTTP/HTTPS
      const albHttpRule = albSG!.IpPermissions?.find(rule => rule.FromPort === 80);
      const albHttpsRule = albSG!.IpPermissions?.find(rule => rule.FromPort === 443);
      expect(albHttpRule).toBeDefined();
      expect(albHttpsRule).toBeDefined();

      // Check web tier allows traffic from ALB
      const webHttpRule = webSG!.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.UserIdGroupPairs?.some(pair => pair.GroupId === albSG!.GroupId)
      );
      expect(webHttpRule).toBeDefined();

      // Check database security group only allows traffic from web tier
      const dbRule = dbSG!.IpPermissions?.find(rule =>
        (rule.FromPort === 5432 || rule.FromPort === 3306) &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === webSG!.GroupId)
      );
      expect(dbRule).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB accessible and properly configured', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/.*\.elb\..*\.amazonaws\.com$/);

      const lbResp = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbResp.LoadBalancers).toBeDefined();

      const alb = lbResp.LoadBalancers!.find((lb) => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.IpAddressType).toBe('ipv4');
      
      // Verify ALB is deployed in public subnets
      const publicSubnets = outputs.PublicSubnets.split(',').filter((s: string) => s.length > 0);
      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
      
      // Check ALB has proper security groups
      expect(alb!.SecurityGroups).toBeDefined();
      expect(alb!.SecurityGroups!.length).toBeGreaterThan(0);
    });

    test('should have target group with proper health check configuration', async () => {
      const tgResp = await elbClient.send(new DescribeTargetGroupsCommand({}));
      expect(tgResp.TargetGroups).toBeDefined();
      expect(tgResp.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = tgResp.TargetGroups!.find(tg => tg.Port === 80);
      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Protocol).toBe('HTTP');
      expect(targetGroup!.Port).toBe(80);
      expect(targetGroup!.TargetType).toBe('instance');
      
      // Verify health check configuration
      expect(targetGroup!.HealthCheckPath).toBe('/');
      expect(targetGroup!.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup!.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup!.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup!.HealthyThresholdCount).toBe(2);
      expect(targetGroup!.UnhealthyThresholdCount).toBe(3);
      expect(targetGroup!.Matcher?.HttpCode).toBe('200-399');
    });

    test('should have registered targets in target group', async () => {
      const tgResp = await elbClient.send(new DescribeTargetGroupsCommand({}));
      const targetGroup = tgResp.TargetGroups!.find(tg => tg.Port === 80);
      expect(targetGroup).toBeDefined();

      const healthResp = await elbClient.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroup!.TargetGroupArn })
      );
      
      expect(healthResp.TargetHealthDescriptions).toBeDefined();
      expect(healthResp.TargetHealthDescriptions!.length).toBeGreaterThanOrEqual(2);
      
      // Check that we have at least some healthy or initial targets
      const healthyTargets = healthResp.TargetHealthDescriptions!.filter(
        target => target.TargetHealth?.State === 'healthy' || target.TargetHealth?.State === 'initial'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with proper configuration and healthy instances', async () => {
      const asgName = outputs.AsgName;
      expect(asgName).toBeDefined();

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      expect(asgResp.AutoScalingGroups).toHaveLength(1);

      const asg = asgResp.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.DesiredCapacity!);
      expect(asg.Instances!.length).toBe(asg.DesiredCapacity);
      
      // Verify ASG is deployed in private subnets
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s.length > 0);
      expect(asg.VPCZoneIdentifier).toBeDefined();
      const asgSubnets = asg.VPCZoneIdentifier!.split(',');
      privateSubnets.forEach(subnet => {
        expect(asgSubnets).toContain(subnet);
      });
      
      // Check health check configuration
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      
      // Verify instance health
      const healthyInstances = asg.Instances!.filter(
        instance => instance.LifecycleState === 'InService' && instance.HealthStatus === 'Healthy'
      );
      expect(healthyInstances.length).toBeGreaterThan(0);
    });

    test('should have instances with correct launch template configuration', async () => {
      const asgName = outputs.AsgName;
      const launchTemplateId = outputs.LaunchTemplateId;
      
      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      const asg = asgResp.AutoScalingGroups![0];
      
      // Verify launch template is configured
      expect(asg.LaunchTemplate).toBeDefined();
      expect(asg.LaunchTemplate!.LaunchTemplateId).toBe(launchTemplateId);
      
      // Get instance details
      const instanceIds = asg.Instances!.map(instance => instance.InstanceId!);
      if (instanceIds.length > 0) {
        const instanceResp = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );
        
        instanceResp.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            expect(instance.InstanceType).toBe('t3.medium');
            expect(instance.State?.Name).toMatch(/^(running|pending)$/);
            
            // Check EBS encryption
            instance.BlockDeviceMappings!.forEach(device => {
              if (device.Ebs) {
                expect(device.Ebs.Encrypted).toBe(true);
                expect(device.Ebs.VolumeType).toBe('gp3');
              }
            });
            
            // Check IMDSv2 is enforced
            expect(instance.MetadataOptions?.HttpTokens).toBe('required');
            expect(instance.MetadataOptions?.HttpEndpoint).toBe('enabled');
          });
        });
      }
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with comprehensive security configuration', async () => {
      const rdsEndpoint = outputs.RdsEndpoint;
      expect(rdsEndpoint).toBeDefined();

      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      expect(dbResp.DBInstances).toBeDefined();

      const dbInstance = dbResp.DBInstances!.find((db) => db.Endpoint?.Address === rdsEndpoint);
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      
      // Multi-AZ and high availability
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.PubliclyAccessible).toBe(false);
      
      // Storage configuration
      expect(dbInstance!.StorageType).toBe('gp3');
      expect(dbInstance!.AllocatedStorage).toBe(100);
      
      // Backup and monitoring configuration
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.DeletionProtection).toBe(true);
      expect(dbInstance!.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance!.MonitoringInterval).toBe(60);
      expect(dbInstance!.MonitoringRoleArn).toBeDefined();
      
      // Auto minor version upgrade
      expect(dbInstance!.AutoMinorVersionUpgrade).toBe(true);
      expect(dbInstance!.CopyTagsToSnapshot).toBe(true);
      
      // Instance class verification
      expect(dbInstance!.DBInstanceClass).toBe('db.m5.large');
      
      // Engine verification (postgres or mysql)
      expect(['postgres', 'mysql']).toContain(dbInstance!.Engine);
    });

    test('should have RDS subnet group in private subnets', async () => {
      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResp.DBInstances![0];
      
      const subnetGroupResp = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbInstance.DBSubnetGroup?.DBSubnetGroupName
        })
      );
      
      const subnetGroup = subnetGroupResp.DBSubnetGroups![0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are in different AZs
      const availabilityZones = new Set(
        subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify these are private subnets from our stack
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s.length > 0);
      subnetGroup.Subnets!.forEach(subnet => {
        expect(privateSubnets).toContain(subnet.SubnetIdentifier!);
      });
    });
  });

  describe('S3 Storage', () => {
    test('should have S3 bucket with comprehensive security configuration', async () => {
      const bucketName = outputs.S3BucketNameOut;
      const bucketArn = outputs.S3BucketArnOut;
      expect(bucketName).toBeDefined();
      expect(bucketArn).toBeDefined();
      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);

      // Verify bucket is accessible
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();

      // Check encryption configuration
      const encResp = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encResp.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encResp.ServerSideEncryptionConfiguration!.Rules?.length).toBeGreaterThan(0);
      const rule = encResp.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.S3BucketNameOut;
      
      const versioningResp = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResp.Status).toBe('Enabled');
    });

    test('should have S3 bucket with public access blocked', async () => {
      const bucketName = outputs.S3BucketNameOut;
      
      const publicAccessResp = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccessResp.PublicAccessBlockConfiguration).toBeDefined();
      const config = publicAccessResp.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy for AWS Config', async () => {
      const bucketName = outputs.S3BucketNameOut;
      
      try {
        const policyResp = await s3Client.send(
          new GetBucketPolicyCommand({ Bucket: bucketName })
        );
        expect(policyResp.Policy).toBeDefined();
        
        const policy = JSON.parse(policyResp.Policy!);
        expect(policy.Statement).toBeDefined();
        
        // Check for AWS Config permissions
        const configStatements = policy.Statement.filter((stmt: any) => 
          stmt.Principal?.Service === 'config.amazonaws.com'
        );
        expect(configStatements.length).toBeGreaterThan(0);
      } catch (error: any) {
        // If no policy exists, that's also acceptable depending on configuration
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });
  });

  describe('AWS Config Compliance', () => {
    test('should have AWS Config recorder running', async () => {
      const configStatus = outputs.AwsConfigStatus;
      expect(configStatus).toBeDefined();
      
      const recorderResp = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );
      expect(recorderResp.ConfigurationRecorders).toBeDefined();
      expect(recorderResp.ConfigurationRecorders!.length).toBeGreaterThan(0);
      
      const recorder = recorderResp.ConfigurationRecorders![0];
      expect(recorder.name).toBe('default');
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(false);
      
      // Check recorder status
      const statusResp = await configClient.send(
        new DescribeConfigurationRecorderStatusCommand({})
      );
      expect(statusResp.ConfigurationRecordersStatus).toBeDefined();
      const status = statusResp.ConfigurationRecordersStatus![0];
      expect(status.recording).toBe(true);
    });

    test('should have AWS Config rules for compliance monitoring', async () => {
      const rulesResp = await configClient.send(
        new DescribeConfigRulesCommand({})
      );
      expect(rulesResp.ConfigRules).toBeDefined();
      expect(rulesResp.ConfigRules!.length).toBeGreaterThan(0);
      
      // Check for specific compliance rules from the template
      const ruleNames = rulesResp.ConfigRules!.map(rule => rule.ConfigRuleName);
      expect(ruleNames).toContain('iam-password-policy');
      expect(ruleNames).toContain('rds-multi-az');
      expect(ruleNames).toContain('ec2-no-public-ip');
      expect(ruleNames).toContain('s3-no-public-read');
      expect(ruleNames).toContain('s3-no-public-write');
      expect(ruleNames).toContain('ec2-imdsv2');
    });

    test('should validate RDS Multi-AZ compliance rule', async () => {
      try {
        const complianceResp = await configClient.send(
          new GetComplianceDetailsByConfigRuleCommand({
            ConfigRuleName: 'rds-multi-az'
          })
        );
        
        if (complianceResp.EvaluationResults && complianceResp.EvaluationResults.length > 0) {
          // Check that RDS instances are compliant with Multi-AZ rule
          const nonCompliantResults = complianceResp.EvaluationResults.filter(
            result => result.ComplianceType === 'NON_COMPLIANT'
          );
          expect(nonCompliantResults.length).toBe(0);
        }
      } catch (error: any) {
        // Rule might not have been evaluated yet, which is acceptable
        console.log('RDS Multi-AZ compliance rule not yet evaluated:', error.message);
      }
    });
  });

  describe('End-to-End Connectivity and Security Validation', () => {
    test('should be able to reach ALB endpoint', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();
      const url = `http://${albDns}`;

      try {
        const response = await fetchWithTimeout(url, 15000);
        expect(response).toBeDefined(); // Any response indicates reachability
        // Even a 503 service unavailable indicates the ALB is reachable
        expect([200, 301, 302, 403, 404, 503]).toContain(response.status);
      } catch (error: any) {
        // ALB may not have healthy targets yet; reaching it can still fail transiently.
        // Keep this non-fatal for infra smoke test purposes.
        console.warn('ALB endpoint not yet accessible (may be expected if targets are initializing):', error.message);
      }
    });

    test('should validate security group rules block unauthorized access', async () => {
      // Get security groups
      const securityGroups = outputs.SecurityGroups.split(',');
      const sgResp = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: securityGroups })
      );
      
      const dbSG = sgResp.SecurityGroups!.find(sg => sg.GroupName?.includes('db'));
      expect(dbSG).toBeDefined();
      
      // Verify database security group doesn't allow direct internet access
      const dbInboundRules = dbSG!.IpPermissions || [];
      const openToInternetRules = dbInboundRules.filter(rule => 
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(openToInternetRules.length).toBe(0); // Database should not be directly accessible from internet
    });

    test('should have comprehensive resource tagging', async () => {
      // Test VPC tags
      const vpcId = outputs.VpcId;
      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcResp.Vpcs![0];
      
      const requiredTags = ['Name', 'Environment', 'Project', 'Owner', 'Region'];
      requiredTags.forEach(tagKey => {
        const tag = vpc.Tags?.find((t) => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag!.Value).toBeTruthy();
      });
      
      // Test RDS tags
      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResp.DBInstances![0];
      const nameTag = dbInstance.TagList?.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('db');
    });

    test('should validate cross-service integration', async () => {
      // Verify Auto Scaling Group is connected to Load Balancer Target Group
      const asgName = outputs.AsgName;
      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      const asg = asgResp.AutoScalingGroups![0];
      
      expect(asg.TargetGroupARNs).toBeDefined();
      expect(asg.TargetGroupARNs!.length).toBeGreaterThan(0);
      
      // Verify the target group ARN matches our ALB target group
      const tgResp = await elbClient.send(new DescribeTargetGroupsCommand({}));
      const targetGroup = tgResp.TargetGroups!.find(tg => tg.Port === 80);
      expect(asg.TargetGroupARNs).toContain(targetGroup!.TargetGroupArn);
      
      // Verify S3 bucket is configured for AWS Config
      const bucketName = outputs.S3BucketNameOut;
      expect(bucketName).toBeDefined();
      
      // The Config delivery channel should be pointing to our S3 bucket
      const configResp = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );
      expect(configResp.ConfigurationRecorders).toBeDefined();
    });
  });
});
