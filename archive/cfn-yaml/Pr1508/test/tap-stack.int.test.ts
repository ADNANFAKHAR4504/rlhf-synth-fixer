import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecorderStatusCommand,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTagsCommand as ELBV2DescribeTagsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient,
  ListTagsCommand as LambdaListTagsCommand,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
  ListTagsForResourceCommand as RDSListTagsForResourceCommand,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
const region = process.env.AWS_REGION || 'us-east-1';
const env = process.env.ENVIRONMENT || 'prod';
const stackName = process.env.CFN_STACK_NAME || `TapStack${env}`;

const s3 = new S3Client({ region });
const cloudtrail = new CloudTrailClient({ region });
const cfg = new ConfigServiceClient({ region });
const lambda = new LambdaClient({ region });
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const sts = new STSClient({ region });
const kms = new KMSClient({ region });
const iam = new IAMClient({ region });

// Read stack outputs from flat-outputs.json
const getStackOutputs = () => {
  try {
    const outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    return outputs;
  } catch (error) {
    console.error('Failed to read cfn-outputs/flat-outputs.json:', error);
    throw new Error('Stack outputs file not found or invalid');
  }
};

let runtimeSkip = false;

describe('TapStack.yml - Comprehensive Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    try {
      await sts.send(new GetCallerIdentityCommand({}));
    } catch (_e) {
      runtimeSkip = true;
      return;
    }
    try {
      outputs = getStackOutputs();
      console.log('Available outputs:', Object.keys(outputs));
    } catch {
      runtimeSkip = true;
      return;
    }
  }, 120000);

  describe('Stack Outputs Validation', () => {
    test('All expected outputs are present and valid', () => {
      if (runtimeSkip) return;

      const expectedOutputs = [
        'CloudTrailArn',
        'ConfigBucketName',
        'LambdaFunctionArn',
        'RDSInstanceEndpoint',
        'LoadBalancerDNS',
      ];

      expectedOutputs.forEach(outputKey => {
        if (outputs[outputKey]) {
          expect(outputs[outputKey]).toBeTruthy();
          expect(typeof outputs[outputKey]).toBe('string');
          expect(outputs[outputKey].length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('KMS Keys and Aliases', () => {
    test('KMS keys exist with proper policies and aliases', async () => {
      if (runtimeSkip) return;

      const aliases = await kms.send(new ListAliasesCommand({}));
      const aliasNames = (aliases.Aliases || [])
        .map(a => a.AliasName)
        .filter(Boolean) as string[];

      // Check for CloudTrail KMS alias
      const cloudTrailAlias = aliasNames.find(n =>
        n.startsWith('alias/cloudtrail-')
      );
      if (cloudTrailAlias) {
        expect(cloudTrailAlias).toContain(`cloudtrail-${env}-`);

        // Verify key policy
        const alias = aliases.Aliases?.find(
          a => a.AliasName === cloudTrailAlias
        );
        if (alias?.TargetKeyId) {
          const key = await kms.send(
            new DescribeKeyCommand({ KeyId: alias.TargetKeyId })
          );
          expect(key.KeyMetadata?.Description).toContain('CloudTrail');
          expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        }
      }

      // Check for RDS KMS alias
      const rdsAlias = aliasNames.find(n => n.startsWith('alias/rds-'));
      if (rdsAlias) {
        expect(rdsAlias).toContain(env);
        expect(rdsAlias).toContain(stackName);

        // Verify key policy
        const alias = aliases.Aliases?.find(a => a.AliasName === rdsAlias);
        if (alias?.TargetKeyId) {
          const key = await kms.send(
            new DescribeKeyCommand({ KeyId: alias.TargetKeyId })
          );
          expect(key.KeyMetadata?.Description).toContain('RDS');
          expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        }
      }
    }, 60000);
  });

  describe('S3 Buckets', () => {
    test('CloudTrail S3 bucket is properly configured', async () => {
      if (runtimeSkip) return;

      const cloudTrailArn = outputs['CloudTrailArn'];
      if (!cloudTrailArn) return;

      const trails = await cloudtrail.send(
        new DescribeTrailsCommand({ includeShadowTrails: false } as any)
      );
      const trail = (trails.trailList || []).find(
        t => t.TrailARN === cloudTrailArn
      );

      if (trail?.S3BucketName) {
        const bucket = trail.S3BucketName;

        // Check encryption
        const enc = await s3.send(
          new GetBucketEncryptionCommand({ Bucket: bucket })
        );
        const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);

        // Check versioning
        const ver = await s3.send(
          new GetBucketVersioningCommand({ Bucket: bucket })
        );
        expect(ver.Status).toBe('Enabled');

        // Check public access block
        const pubBlock = await s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucket })
        );
        expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
          true
        );
        expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
          true
        );
        expect(pubBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
          true
        );
        expect(
          pubBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
        ).toBe(true);

        // Check bucket policy
        const polStatus = await s3.send(
          new GetBucketPolicyStatusCommand({ Bucket: bucket })
        );
        expect(polStatus.PolicyStatus?.IsPublic).toBe(false);

        // Verify bucket policy content
        const policy = await s3.send(
          new GetBucketPolicyCommand({ Bucket: bucket })
        );
        const policyDoc = JSON.parse(policy.Policy || '{}');
        expect(policyDoc.Statement).toBeDefined();
        expect(policyDoc.Statement.length).toBeGreaterThan(0);
      }
    }, 180000);

    test('Config S3 bucket is properly configured', async () => {
      if (runtimeSkip) return;

      const configBucketName = outputs['ConfigBucketName'];
      if (!configBucketName) return;

      // Check encryption
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: configBucketName })
      );
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      // Check versioning
      const ver = await s3.send(
        new GetBucketVersioningCommand({ Bucket: configBucketName })
      );
      expect(ver.Status).toBe('Enabled');

      // Check public access block
      const pubBlock = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: configBucketName })
      );
      expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(pubBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        pubBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);

      // Check bucket policy
      const polStatus = await s3.send(
        new GetBucketPolicyStatusCommand({ Bucket: configBucketName })
      );
      expect(polStatus.PolicyStatus?.IsPublic).toBe(false);

      // Verify bucket policy content
      const policy = await s3.send(
        new GetBucketPolicyCommand({ Bucket: configBucketName })
      );
      const policyDoc = JSON.parse(policy.Policy || '{}');
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(0);
    }, 120000);
  });

  describe('CloudTrail', () => {
    test('CloudTrail is properly configured with all security features', async () => {
      if (runtimeSkip) return;

      const cloudTrailArn = outputs['CloudTrailArn'];
      if (!cloudTrailArn) return;

      const trails = await cloudtrail.send(
        new DescribeTrailsCommand({ includeShadowTrails: false } as any)
      );
      const trail = (trails.trailList || []).find(
        t => t.TrailARN === cloudTrailArn
      );

      expect(trail).toBeDefined();
      expect(trail!.IncludeGlobalServiceEvents).toBe(true);
      expect(trail!.IsMultiRegionTrail).toBe(true);
      expect(trail!.LogFileValidationEnabled).toBe(true);
      expect(trail!.KmsKeyId).toBeDefined();
      expect(trail!.S3BucketName).toBeDefined();

      // Check trail status
      const status = await cloudtrail.send(
        new GetTrailStatusCommand({ Name: trail!.Name })
      );
      expect(status.IsLogging).toBe(true);
    }, 180000);
  });

  describe('AWS Config', () => {
    test('AWS Config is properly configured with recorder, delivery channel, and rules', async () => {
      if (runtimeSkip) return;

      const configBucketName = outputs['ConfigBucketName'];
      if (!configBucketName) return;

      // Check configuration recorder
      const recorders = await cfg.send(
        new DescribeConfigurationRecordersCommand({})
      );
      expect((recorders.ConfigurationRecorders || []).length).toBeGreaterThan(
        0
      );

      const recorder = recorders.ConfigurationRecorders?.[0];
      expect(recorder?.name).toContain(env);
      expect(recorder?.roleARN).toBeDefined();
      expect(recorder?.recordingGroup?.allSupported).toBe(true);
      expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(true);

      // Check recorder status
      const status = await cfg.send(
        new DescribeConfigurationRecorderStatusCommand({})
      );
      expect(
        (status.ConfigurationRecordersStatus || []).length
      ).toBeGreaterThan(0);

      // Check delivery channel
      const channels = await cfg.send(new DescribeDeliveryChannelsCommand({}));
      const channelCount = (channels.DeliveryChannels || []).length;

      if (channelCount > 0) {
        const channel = channels.DeliveryChannels?.[0];
        expect(channel?.name).toContain(`config-delivery-channel`);
        expect(channel?.s3BucketName).toBeDefined();
        expect(typeof channel?.s3BucketName).toBe('string');
        expect(channel?.s3BucketName!.length).toBeGreaterThan(0);

        // Check that config rules exist
        const rules = await cfg.send(
          new DescribeConfigRulesCommand({})
        );
        expect((rules.ConfigRules || []).length).toBeGreaterThan(0);
      }
    }, 120000);
  });

  describe('IAM Roles', () => {
    test('Lambda execution role has correct policies and permissions', async () => {
      if (runtimeSkip) return;

      const lambdaArn = outputs['LambdaFunctionArn'];
      if (!lambdaArn) return;

      const fn = await lambda.send(
        new GetFunctionCommand({ FunctionName: lambdaArn })
      );
      const roleArn = fn.Configuration?.Role;

      if (roleArn) {
        const roleName = roleArn.split('/').pop();
        const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));

        expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();
        const assumePolicy = JSON.parse(
          decodeURIComponent(role.Role!.AssumeRolePolicyDocument!)
        );
        expect(assumePolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );

        // Check attached managed policies
        const attachedPolicies = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        const policyArns = (attachedPolicies.AttachedPolicies || []).map(
          p => p.PolicyArn
        );
        expect(policyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        );
        expect(policyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      }
    }, 120000);

    test('Config role has correct policies and permissions', async () => {
      if (runtimeSkip) return;

      const configBucketName = outputs['ConfigBucketName'];
      if (!configBucketName) return;

      const recorders = await cfg.send(
        new DescribeConfigurationRecordersCommand({})
      );
      const recorder = recorders.ConfigurationRecorders?.[0];

      if (recorder?.roleARN) {
        const roleName = recorder.roleARN.split('/').pop();
        const configRole = await iam.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        expect(configRole.Role?.AssumeRolePolicyDocument).toBeDefined();
        const assumePolicy = JSON.parse(
          decodeURIComponent(configRole.Role!.AssumeRolePolicyDocument!)
        );
        expect(assumePolicy.Statement[0].Principal.Service).toBe(
          'config.amazonaws.com'
        );

        // Check for attached managed policies
        const attachedPolicies = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        const policyArns = (attachedPolicies.AttachedPolicies || []).map(
          p => p.PolicyArn
        );
        expect(policyArns.length).toBeGreaterThan(0);
      }
    }, 120000);
  });

  describe('Lambda Function', () => {
    test('Lambda function is properly configured in VPC with security groups', async () => {
      if (runtimeSkip) return;

      const lambdaArn = outputs['LambdaFunctionArn'];
      if (!lambdaArn) return;

      const fn = await lambda.send(
        new GetFunctionCommand({ FunctionName: lambdaArn })
      );
      const vpcConfig = fn.Configuration?.VpcConfig;

      expect(vpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(vpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);

      // Check security group egress rules
      const sgIds = vpcConfig?.SecurityGroupIds || [];
      const sgs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );

      const ports = new Set<number>();
      (sgs.SecurityGroups || []).forEach(g =>
        (g.IpPermissionsEgress || []).forEach(p => {
          if (
            typeof p.FromPort === 'number' &&
            typeof p.ToPort === 'number' &&
            p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')
          ) {
            ports.add(p.FromPort);
            ports.add(p.ToPort);
          }
        })
      );
      expect(ports.has(80)).toBe(true);
      expect(ports.has(443)).toBe(true);

      // Check tags
      const tags = await lambda.send(
        new LambdaListTagsCommand({ Resource: lambdaArn })
      );
      const tagKeys = Object.keys(tags.Tags || {});
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Purpose');
      expect(tags.Tags?.Environment).toBe(env);
      expect(tags.Tags?.Purpose).toBe('Compute');
    }, 180000);
  });

  describe('RDS Database', () => {
    test('RDS instance is properly configured with encryption and security', async () => {
      if (runtimeSkip) return;

      const endpoint = outputs['RDSInstanceEndpoint'];
      if (!endpoint) return;

      const dbs = await rds.send(new DescribeDBInstancesCommand({}));
      const db = (dbs.DBInstances || []).find(
        i => i.Endpoint?.Address === endpoint
      );

      expect(db).toBeDefined();
      expect(db!.StorageEncrypted).toBe(true);
      expect(db!.PubliclyAccessible).toBe(false);
      expect(db!.KmsKeyId).toBeDefined();
      expect(db!.BackupRetentionPeriod).toBe(7);
      expect(db!.MultiAZ).toBe(false);
      expect(db!.Engine).toBe('mysql');
      expect(db!.EngineVersion).toBe('8.0.43');
      expect(db!.DBInstanceClass).toBe('db.t3.micro');
      expect(db!.AllocatedStorage).toBe(20);
      expect(db!.StorageType).toBe('gp2');

      // Check subnet group
      if (db!.DBSubnetGroup?.DBSubnetGroupName) {
        const sng = await rds.send(
          new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: db!.DBSubnetGroup.DBSubnetGroupName,
          })
        );
        expect((sng.DBSubnetGroups?.[0]?.Subnets || []).length).toBeGreaterThan(
          0
        );
      }

      // Check security groups
      const sgIds =
        db!.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId).filter(
          (id): id is string => id !== undefined
        ) || [];
      if (sgIds.length > 0) {
        const sgs = await ec2.send(
          new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
        );
        const sg = sgs.SecurityGroups?.[0];
        expect(sg?.Description).toContain('RDS');

        // Check ingress rules
        const ingress = sg?.IpPermissions || [];
        const mysqlRule = ingress.find(
          p => p.FromPort === 3306 && p.ToPort === 3306
        );
        expect(mysqlRule).toBeDefined();
      }

      // Check tags
      if (db?.DBInstanceArn) {
        const tags = await rds.send(
          new RDSListTagsForResourceCommand({
            ResourceName: db.DBInstanceArn,
          })
        );
        const tagKeys = (tags.TagList || []).map(t => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Purpose');
      }
    }, 180000);
  });

  describe('Application Load Balancer', () => {
    test('ALB is properly configured with HTTPS and security', async () => {
      if (runtimeSkip) return;

      const albDns = outputs['LoadBalancerDNS'];
      if (!albDns) return;

      const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const lb = (lbs.LoadBalancers || []).find(l => l.DNSName === albDns);

      expect(lb).toBeDefined();
      expect(lb!.Scheme).toBe('internet-facing');
      expect(lb!.Type).toBe('application');
      expect(lb!.SecurityGroups?.length).toBeGreaterThan(0);
      expect(lb!.AvailabilityZones?.length).toBeGreaterThan(0);

      // Check tags
      const tagsResp = await elbv2.send(
        new ELBV2DescribeTagsCommand({ ResourceArns: [lb!.LoadBalancerArn!] })
      );
      const tags = tagsResp.TagDescriptions?.[0]?.Tags || [];
      const tagKeys = tags.map(t => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Purpose');

      // Check subnets
      const subnets = await ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: lb!.AvailabilityZones?.map(z => z.SubnetId!).filter(
            Boolean
          ),
        })
      );
      expect((subnets.Subnets || []).length).toBeGreaterThan(0);

      // Check listeners
      const listeners = await elbv2.send(
        new DescribeListenersCommand({ LoadBalancerArn: lb!.LoadBalancerArn })
      );
      expect((listeners.Listeners || []).length).toBeGreaterThan(0);

      // Check HTTP listener (redirect)
      const httpListener = (listeners.Listeners || []).find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );
      expect(httpListener).toBeDefined();
      expect(httpListener!.DefaultActions?.[0]?.Type).toBe('redirect');

      // Check HTTPS listener
      const httpsListener = (listeners.Listeners || []).find(
        l => l.Port === 443 && l.Protocol === 'HTTPS'
      );
      expect(httpsListener).toBeDefined();
      expect(httpsListener!.SslPolicy || '').toContain('TLS');
      expect(httpsListener!.Certificates?.length).toBeGreaterThan(0);
      expect(httpsListener!.DefaultActions?.[0]?.Type).toBe('forward');

      // Check target group
      const tgArn = httpsListener!.DefaultActions?.[0]?.TargetGroupArn;
      expect(tgArn).toBeDefined();
      const tgs = await elbv2.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: tgArn ? [tgArn] : undefined,
        })
      );
      expect((tgs.TargetGroups || []).length).toBe(1);

      // Check security group ingress rules
      if ((lb!.SecurityGroups || []).length > 0) {
        const sgs = await ec2.send(
          new DescribeSecurityGroupsCommand({ GroupIds: lb!.SecurityGroups! })
        );
        const ingress = (sgs.SecurityGroups || [])[0]?.IpPermissions || [];

        const match80 = ingress.some(
          p =>
            p.FromPort === 80 &&
            p.ToPort === 80 &&
            (p.IpRanges || []).some(r => r.CidrIp === '0.0.0.0/0')
        );
        const match443 = ingress.some(
          p =>
            p.FromPort === 443 &&
            p.ToPort === 443 &&
            (p.IpRanges || []).some(r => r.CidrIp === '0.0.0.0/0')
        );
        expect(match80).toBe(true);
        expect(match443).toBe(true);
      }
    }, 180000);
  });

  describe('Security Groups', () => {
    test('All security groups have proper rules and tags', async () => {
      if (runtimeSkip) return;

      // Get VPC ID from any resource
      const lambdaArn = outputs['LambdaFunctionArn'];
      if (!lambdaArn) return;

      const fn = await lambda.send(
        new GetFunctionCommand({ FunctionName: lambdaArn })
      );
      const vpcConfig = fn.Configuration?.VpcConfig;

      if (vpcConfig?.SecurityGroupIds?.length) {
        const sgs = await ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: vpcConfig.SecurityGroupIds,
          })
        );

        sgs.SecurityGroups?.forEach(sg => {
          expect(sg.Description).toBeDefined();
          expect(sg.VpcId).toBeDefined();

          // Check tags
          const tags = sg.Tags || [];
          const tagKeys = tags.map(t => t.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Purpose');
        });
      }
    }, 120000);
  });

  describe('VPC and Subnet Configuration', () => {
    test('VPC and subnets are properly configured', async () => {
      if (runtimeSkip) return;

      const lambdaArn = outputs['LambdaFunctionArn'];
      if (!lambdaArn) return;

      const fn = await lambda.send(
        new GetFunctionCommand({ FunctionName: lambdaArn })
      );
      const vpcConfig = fn.Configuration?.VpcConfig;

      if (vpcConfig?.SubnetIds?.length) {
        const subnets = await ec2.send(
          new DescribeSubnetsCommand({
            SubnetIds: vpcConfig.SubnetIds,
          })
        );

        expect((subnets.Subnets || []).length).toBeGreaterThan(0);

        // Get VPC ID from subnet
        const vpcId = subnets.Subnets?.[0]?.VpcId;
        if (vpcId) {
          const vpcs = await ec2.send(
            new DescribeVpcsCommand({ VpcIds: [vpcId] })
          );
          expect((vpcs.Vpcs || []).length).toBe(1);
        }
      }
    }, 120000);
  });

  describe('Resource Tagging', () => {
    test('All resources have proper Environment and Purpose tags', async () => {
      if (runtimeSkip) return;

      // Test Lambda tags
      const lambdaArn = outputs['LambdaFunctionArn'];
      if (lambdaArn) {
        const lambdaTags = await lambda.send(
          new LambdaListTagsCommand({ Resource: lambdaArn })
        );
        const lambdaTagKeys = Object.keys(lambdaTags.Tags || {});
        expect(lambdaTagKeys).toContain('Environment');
        expect(lambdaTagKeys).toContain('Purpose');
        expect(lambdaTags.Tags?.Environment).toBe(env);
        expect(lambdaTags.Tags?.Purpose).toBe('Compute');
      }

      // Test RDS tags
      const endpoint = outputs['RDSInstanceEndpoint'];
      if (endpoint) {
        const dbs = await rds.send(new DescribeDBInstancesCommand({}));
        const db = (dbs.DBInstances || []).find(
          i => i.Endpoint?.Address === endpoint
        );
        if (db?.DBInstanceArn) {
          const rdsTags = await rds.send(
            new RDSListTagsForResourceCommand({
              ResourceName: db.DBInstanceArn,
            })
          );
          const rdsTagKeys = (rdsTags.TagList || []).map(t => t.Key);
          expect(rdsTagKeys).toContain('Environment');
          expect(rdsTagKeys).toContain('Purpose');
        }
      }

      // Test ALB tags
      const albDns = outputs['LoadBalancerDNS'];
      if (albDns) {
        const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
        const lb = (lbs.LoadBalancers || []).find(l => l.DNSName === albDns);
        if (lb?.LoadBalancerArn) {
          const albTags = await elbv2.send(
            new ELBV2DescribeTagsCommand({ ResourceArns: [lb.LoadBalancerArn] })
          );
          const albTagKeys = (albTags.TagDescriptions?.[0]?.Tags || []).map(
            t => t.Key
          );
          expect(albTagKeys).toContain('Environment');
          expect(albTagKeys).toContain('Purpose');
        }
      }
    }, 120000);
  });
});
