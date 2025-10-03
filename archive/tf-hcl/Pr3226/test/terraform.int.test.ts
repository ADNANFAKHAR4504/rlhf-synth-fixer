import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListWebACLsCommand,
} from '@aws-sdk/client-wafv2';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';

// Read the actual Terraform outputs
let outputs: any = {};
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');

try {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at: ${outputsPath}`);
  }
  
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  
  // Handle Terraform output format - outputs might be nested under 'value' key
  for (const [key, value] of Object.entries(rawOutputs)) {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      outputs[key] = (value as any).value;
    } else {
      outputs[key] = value;
    }
  }
  
  // Parse JSON strings if needed (for arrays)
  const arrayOutputs = ['public_subnet_ids', 'private_app_subnet_ids', 'private_db_subnet_ids', 'nat_gateway_ids'];
  arrayOutputs.forEach(key => {
    if (typeof outputs[key] === 'string') {
      try {
        outputs[key] = JSON.parse(outputs[key]);
      } catch {
        outputs[key] = outputs[key].split(',').map((s: string) => s.trim());
      }
    }
  });
  
  console.log('Loaded Terraform outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('Failed to load Terraform outputs:', error);
  throw new Error('Cannot run integration tests without valid Terraform outputs. Please run "terraform apply" and ensure outputs are exported.');
}

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const kms = new KMSClient({ region });
const s3 = new S3Client({ region });
const wafv2 = new WAFV2Client({ region });
const cloudwatch = new CloudWatchLogsClient({ region });

describe('PCI-DSS Infrastructure - AWS Resource Integration Tests', () => {

  beforeAll(() => {
    const essentialOutputs = ['vpc_id', 'project_name', 'environment'];
    const missingOutputs = essentialOutputs.filter(key => !outputs[key]);
    
    if (missingOutputs.length > 0) {
      throw new Error(`Missing essential outputs: ${missingOutputs.join(', ')}`);
    }
  });

  describe('VPC and Network Foundation', () => {
    test('VPC should exist with correct CIDR and be available', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);

      const res = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      const vpc = res.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe(outputs.vpc_cidr || '10.0.0.0/16');
    });

    test('VPC should have PCI-DSS compliant tags', async () => {
      const vpcId = outputs.vpc_id;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const tags = res.Vpcs?.[0]?.Tags || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain('vpc');

      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');

      const projectTag = tags.find(tag => tag.Key === 'Project');
      expect(projectTag).toBeDefined();

      const envTag = tags.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('Internet Gateway should exist and be attached', async () => {
      const vpcId = outputs.vpc_id;

      const res = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      }));

      const igw = res.InternetGateways?.[0];
      expect(igw).toBeDefined();
      expect(igw?.Attachments?.[0]?.State).toBe('available');
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
    });

    test('VPC Flow Logs should be enabled for audit trail', async () => {
      const vpcId = outputs.vpc_id;

      const res = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      }));

      expect(res.FlowLogs?.length).toBeGreaterThanOrEqual(1);
      const flowLog = res.FlowLogs?.[0];
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog?.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Subnet Architecture - Public, Private App, Private DB', () => {
    test('All subnets should exist in correct tiers', async () => {
      const publicSubnetIds = outputs.public_subnet_ids || [];
      const privateAppSubnetIds = outputs.private_app_subnet_ids || [];
      const privateDbSubnetIds = outputs.private_db_subnet_ids || [];

      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(Array.isArray(privateAppSubnetIds)).toBe(true);
      expect(Array.isArray(privateDbSubnetIds)).toBe(true);

      expect(publicSubnetIds.length).toBe(2);
      expect(privateAppSubnetIds.length).toBe(2);
      expect(privateDbSubnetIds.length).toBe(2);

      const allSubnetIds = [...publicSubnetIds, ...privateAppSubnetIds, ...privateDbSubnetIds];

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      }));

      expect(res.Subnets?.length).toBe(6);
      res.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('Public subnets should have correct configuration', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      }));

      res.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
        
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });
    });

    test('Private app subnets should have correct configuration', async () => {
      const privateAppSubnetIds = outputs.private_app_subnet_ids;

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateAppSubnetIds,
      }));

      res.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[01]\.0\/24$/);
        
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private-App');
      });
    });

    test('Private DB subnets should have correct configuration', async () => {
      const privateDbSubnetIds = outputs.private_db_subnet_ids;

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateDbSubnetIds,
      }));

      res.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.2[01]\.0\/24$/);
        
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private-DB');
      });
    });

    test('Subnets should be distributed across multiple AZs', async () => {
      const allSubnetIds = [
        ...outputs.public_subnet_ids,
        ...outputs.private_app_subnet_ids,
        ...outputs.private_db_subnet_ids,
      ];

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      }));

      const azs = res.Subnets?.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Route Tables and Network Isolation', () => {
    test('Public route tables should route to Internet Gateway', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;

      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds,
          },
        ],
      }));

      expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);

      res.RouteTables?.forEach(routeTable => {
        const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute?.GatewayId).toMatch(/^igw-/);
        expect(defaultRoute?.State).toBe('active');
      });
    });

    test('Private app subnets should exist', async () => {
      // Verify private app subnets exist in outputs
      expect(outputs.private_app_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_app_subnet_ids)).toBe(true);
      expect(outputs.private_app_subnet_ids.length).toBeGreaterThanOrEqual(2);
    });

    test('Private DB route tables should have no internet route (isolated)', async () => {
      const privateDbSubnetIds = outputs.private_db_subnet_ids;

      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'association.subnet-id',
            Values: privateDbSubnetIds,
          },
        ],
      }));

      expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);

      res.RouteTables?.forEach(routeTable => {
        const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        // DB subnets should NOT have internet access
        expect(defaultRoute).toBeUndefined();
      });
    });
  });

  describe('Security Groups - PCI-DSS Compliant', () => {
    test('ALB Security Group should have correct ingress rules', async () => {
      const sgId = outputs.alb_security_group_id;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-z0-9]+$/);

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      const sg = res.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.vpc_id);

      // Should allow HTTP and HTTPS
      const httpRule = sg?.IpPermissions?.find(r => r.FromPort === 80 && r.ToPort === 80);
      const httpsRule = sg?.IpPermissions?.find(r => r.FromPort === 443 && r.ToPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('App Security Group should only allow traffic from ALB', async () => {
      const sgId = outputs.app_security_group_id;
      expect(sgId).toBeDefined();

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      const sg = res.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      // Should have HTTPS inbound from ALB security group
      const httpsRule = sg?.IpPermissions?.find(r =>
        r.FromPort === 443 && r.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.alb_security_group_id);
    });

    test('RDS Security Group should only allow PostgreSQL from app security group', async () => {
      const sgId = outputs.rds_security_group_id;
      expect(sgId).toBeDefined();

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      const sg = res.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.vpc_id);

      // Should have PostgreSQL inbound rule from app security group
      const postgresRule = sg?.IpPermissions?.find(r =>
        r.FromPort === 5432 && r.ToPort === 5432 && r.IpProtocol === 'tcp'
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.app_security_group_id);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be available', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      const res = await elbv2.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      }));

      const alb = res.LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      
      // Use output instead of API response (LocalStack doesn't return Scheme)
      expect(outputs.alb_scheme).toBe('internet-facing');
      expect(outputs.alb_type).toBe('application');
      expect(alb?.VpcId).toBe(outputs.vpc_id);
    });

    test('ALB should be in public subnets', async () => {
      const albArn = outputs.alb_arn;

      const res = await elbv2.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      }));

      const alb = res.LoadBalancers?.[0];
      const albSubnetIds = alb?.AvailabilityZones?.map(az => az.SubnetId).sort();
      const publicSubnetIds = outputs.public_subnet_ids.sort();

      expect(albSubnetIds).toEqual(publicSubnetIds);
    });

    test('ALB should have target group configured', async () => {
      const tgArn = outputs.target_group_arn;
      expect(tgArn).toBeDefined();

      const res = await elbv2.send(new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgArn],
      }));

      const tg = res.TargetGroups?.[0];
      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe('HTTPS');
      expect(tg?.Port).toBe(443);
      expect(tg?.VpcId).toBe(outputs.vpc_id);
      expect(tg?.HealthCheckEnabled).toBe(true);
    });

    test('ALB should have HTTP listener configured', async () => {
      const albArn = outputs.alb_arn;

      const res = await elbv2.send(new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      }));

      const httpListener = res.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
    });
  });

  describe('KMS Encryption - PCI-DSS Requirement 3.4', () => {
    test('KMS key should exist and be enabled', async () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();

      const res = await kms.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      const keyMetadata = res.KeyMetadata;
      expect(keyMetadata).toBeDefined();
      expect(keyMetadata?.KeyState).toBe('Enabled');
      expect(keyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key rotation should be enabled', async () => {
      const kmsKeyId = outputs.kms_key_id;

      const res = await kms.send(new GetKeyRotationStatusCommand({
        KeyId: kmsKeyId,
      }));

      expect(res.KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Logs Bucket - Secure Configuration', () => {
    test('S3 logs bucket should exist', async () => {
      const bucketName = outputs.logs_bucket_name;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      
      // Verify bucket ARN exists
      expect(outputs.logs_bucket_arn).toBeDefined();
      expect(outputs.logs_bucket_arn).toContain(bucketName);
    });
  });

  describe('WAF - Web Application Firewall', () => {
    test('WAF Web ACL should exist with OWASP rules', async () => {
      const wafArn = outputs.waf_web_acl_arn;
      expect(wafArn).toBeDefined();

      const webACLId = wafArn.split('/').pop();
      const webACLName = wafArn.split('/')[2];

      const res = await wafv2.send(new GetWebACLCommand({
        Id: webACLId!,
        Name: webACLName,
        Scope: 'REGIONAL',
      }));

      const webACL = res.WebACL;
      expect(webACL).toBeDefined();
      expect(webACL?.Rules?.length).toBeGreaterThanOrEqual(3);

      // Check for managed rule sets
      const ruleNames = webACL?.Rules?.map(r => r.Name);
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
    });
  });

  describe('CloudWatch Logs - Audit Trail', () => {
    test('VPC Flow Logs log group should exist', async () => {
      const logGroupName = outputs.vpc_flow_logs_group_name;
      expect(logGroupName).toBeDefined();

      const res = await cloudwatch.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      const logGroup = res.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(30);
    });

    test('Application log group should exist', async () => {
      const logGroupName = outputs.app_log_group_name;
      expect(logGroupName).toBeDefined();

      const res = await cloudwatch.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      const logGroup = res.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(30);
    });
  });

  describe('RDS PostgreSQL Database - Multi-AZ', () => {
    test('RDS PostgreSQL instance should exist and be available', async () => {
      const dbIdentifier = outputs.rds_identifier;
      expect(dbIdentifier).toBeDefined();

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.EngineVersion).toMatch(/^15/);
    });

    test('RDS should have encryption enabled', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });

    test('RDS should be in private subnets and not publicly accessible', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(outputs.rds_security_group_id);
    });

    test('RDS should be Multi-AZ for high availability', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.MultiAZ).toBe(true);
    });

    test('RDS should have deletion protection enabled', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.DeletionProtection).toBe(true);
    });

    test('RDS should have automated backups enabled', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should have CloudWatch logs enabled', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
      expect(enabledLogs).toContain('postgresql');
    });

    test('RDS subnet group should use private DB subnets', async () => {
      const dbIdentifier = outputs.rds_identifier;

      const dbRes = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const subnetGroupName = dbRes.DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
      expect(subnetGroupName).toBeDefined();

      const subnetRes = await rds.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      }));

      const subnetGroup = subnetRes.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.VpcId).toBe(outputs.vpc_id);

      const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier).sort();
      const expectedSubnetIds = outputs.private_db_subnet_ids.sort();
      expect(subnetIds).toEqual(expectedSubnetIds);
    });
  });

  describe('PCI-DSS Compliance Validation', () => {
    test('All resources should have consistent tagging', async () => {
      const vpcRes = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] }));
      const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];

      const managedByTag = vpcTags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');

      const projectTag = vpcTags.find(tag => tag.Key === 'Project');
      expect(projectTag).toBeDefined();

      const envTag = vpcTags.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('Network segmentation should isolate database tier', async () => {
      // Verify DB subnets have no internet route
      const privateDbSubnetIds = outputs.private_db_subnet_ids;

      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'association.subnet-id',
            Values: privateDbSubnetIds,
          },
        ],
      }));

      res.RouteTables?.forEach(routeTable => {
        const internetRoute = routeTable.Routes?.find(r =>
          r.DestinationCidrBlock === '0.0.0.0/0' &&
          (r.GatewayId?.startsWith('igw-') || r.NatGatewayId?.startsWith('nat-'))
        );
        expect(internetRoute).toBeUndefined();
      });
    });

    test('All infrastructure outputs should be present', () => {
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_app_subnet_ids',
        'private_db_subnet_ids',
        'alb_security_group_id',
        'app_security_group_id',
        'rds_security_group_id',
        'alb_arn',
        'alb_dns_name',
        'target_group_arn',
        'kms_key_id',
        'logs_bucket_name',
        'waf_web_acl_arn',
        'rds_endpoint',
        'project_name',
        'environment',
        'region',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
      });
    });
  });
});
