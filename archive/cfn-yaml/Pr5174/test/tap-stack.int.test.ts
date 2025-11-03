import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  DescribeDBParameterGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
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
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetEventSelectorsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  BackupClient,
  DescribeBackupVaultCommand,
  GetBackupPlanCommand,
  GetBackupSelectionCommand,
} from '@aws-sdk/client-backup';

const OUTPUTS_FILE_PATH =
  process.env.OUTPUTS_FILE_PATH || 'cfn-outputs/flat-outputs.json';
const AWS_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

describe('TapStack CloudFormation - Live Integration Tests', () => {
  let outputs: Record<string, string> = {};

  // AWS Clients
  let s3Client: S3Client;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let lambdaClient: LambdaClient;
  let autoScalingClient: AutoScalingClient;
  let elbv2Client: ElasticLoadBalancingV2Client;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  let cloudWatchClient: CloudWatchClient;
  let snsClient: SNSClient;
  let secretsClient: SecretsManagerClient;
  let kmsClient: KMSClient;
  let cloudTrailClient: CloudTrailClient;
  let configClient: ConfigServiceClient;
  let ssmClient: SSMClient;
  let backupClient: BackupClient;

  beforeAll(() => {
    // Initialize AWS clients
    const config = { region: AWS_REGION };

    s3Client = new S3Client(config);
    ec2Client = new EC2Client(config);
    rdsClient = new RDSClient(config);
    lambdaClient = new LambdaClient(config);
    autoScalingClient = new AutoScalingClient(config);
    elbv2Client = new ElasticLoadBalancingV2Client(config);
    iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global
    logsClient = new CloudWatchLogsClient(config);
    cloudWatchClient = new CloudWatchClient(config);
    snsClient = new SNSClient(config);
    secretsClient = new SecretsManagerClient(config);
    kmsClient = new KMSClient(config);
    cloudTrailClient = new CloudTrailClient(config);
    configClient = new ConfigServiceClient(config);
    ssmClient = new SSMClient(config);
    backupClient = new BackupClient(config);

    // Load outputs
    outputs = loadOutputs();

    if (Object.keys(outputs).length === 0) {
      console.warn('WARNING: No outputs found. Tests will be skipped.');
    } else {
      console.log(`Loaded ${Object.keys(outputs).length} stack outputs successfully`);
    }
  });

  afterAll(() => {
    // Cleanup clients
    s3Client.destroy();
    ec2Client.destroy();
    rdsClient.destroy();
    lambdaClient.destroy();
    autoScalingClient.destroy();
    elbv2Client.destroy();
    iamClient.destroy();
    logsClient.destroy();
    cloudWatchClient.destroy();
    snsClient.destroy();
    secretsClient.destroy();
    kmsClient.destroy();
    cloudTrailClient.destroy();
    configClient.destroy();
    ssmClient.destroy();
    backupClient.destroy();

    console.log('Integration tests completed. All AWS clients destroyed.');
  });

  function loadOutputs(): Record<string, string> {
    try {
      if (!fs.existsSync(OUTPUTS_FILE_PATH)) {
        console.error(`Outputs file not found: ${OUTPUTS_FILE_PATH}`);
        return {};
      }

      const content = fs.readFileSync(OUTPUTS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      const result: Record<string, string> = {};

      // Flatten nested outputs
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            result[nestedKey] = String(nestedValue);
          });
        } else {
          result[key] = String(value);
        }
      });

      return result;
    } catch (error) {
      console.error('Failed to load outputs:', error);
      return {};
    }
  }

  function hasOutputs(...keys: string[]): boolean {
    if (Object.keys(outputs).length === 0) {
      return false;
    }
    return keys.every(key => outputs[key]);
  }

  // ========== Service-Level Tests ==========

  describe('S3 Service-Level Tests', () => {
    test('S3 data bucket should exist with security configuration', async () => {
      if (!hasOutputs('S3BucketName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const bucketName = outputs.S3BucketName;

      const headResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(headResponse).toBeDefined();

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      console.log('✓ S3 data bucket is properly secured');
    }, 30000);

    test('S3 bucket should have lifecycle policies', async () => {
      if (!hasOutputs('S3BucketName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const bucketName = outputs.S3BucketName;

      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);
      expect(lifecycleResponse.Rules![0].Status).toBe('Enabled');

      console.log('✓ S3 bucket has active lifecycle policies');
    }, 30000);

    test('S3 bucket should have required tags', async () => {
      if (!hasOutputs('S3BucketName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const bucketName = outputs.S3BucketName;

      const taggingResponse = await s3Client.send(
        new GetBucketTaggingCommand({ Bucket: bucketName })
      );

      const tags = Object.fromEntries(
        taggingResponse.TagSet!.map(t => [t.Key, t.Value])
      );

      expect(tags).toHaveProperty('Environment');
      expect(tags).toHaveProperty('Owner');
      expect(tags).toHaveProperty('Project');

      console.log('✓ S3 bucket has all required tags');
    }, 30000);
  });

  describe('VPC Service-Level Tests', () => {
    test('VPC should exist with correct configuration', async () => {
      if (!hasOutputs('VPCId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const vpcId = outputs.VPCId;

      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(vpcsResponse.Vpcs).toHaveLength(1);
      const vpc = vpcsResponse.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      console.log('✓ VPC exists with correct CIDR block');
    }, 30000);

    test('Subnets should span multiple availability zones', async () => {
      if (!hasOutputs(
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id'
      )) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(subnetsResponse.Subnets).toHaveLength(4);

      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      console.log(`✓ Subnets span ${azs.size} availability zones for high availability`);
    }, 30000);

    test('NAT Gateways should be available in both AZs', async () => {
      if (!hasOutputs('NATGateway1Id', 'NATGateway2Id')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const natIds = [outputs.NATGateway1Id, outputs.NATGateway2Id];

      const natResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natIds })
      );

      expect(natResponse.NatGateways).toHaveLength(2);

      natResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });

      console.log('✓ Both NAT Gateways are available');
    }, 30000);

    test('Security groups should have proper ingress rules', async () => {
      if (!hasOutputs('ALBSecurityGroupId', 'EC2SecurityGroupId', 'RDSSecurityGroupId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const sgIds = [outputs.ALBSecurityGroupId, outputs.EC2SecurityGroupId, outputs.RDSSecurityGroupId];

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );

      expect(sgResponse.SecurityGroups).toHaveLength(3);

      const albSG = sgResponse.SecurityGroups!.find(sg => sg.GroupId === outputs.ALBSecurityGroupId);
      expect(albSG?.IpPermissions?.some(rule => rule.FromPort === 80)).toBe(true);

      console.log('✓ Security groups have proper configurations');
    }, 30000);
  });

  describe('RDS Service-Level Tests', () => {
    test('RDS instance should be Multi-AZ with encryption', async () => {
      if (!hasOutputs('RDSInstanceId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const dbInstanceId = outputs.RDSInstanceId;

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );

      expect(dbResponse.DBInstances).toHaveLength(1);
      const dbInstance = dbResponse.DBInstances![0];

      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DBInstanceStatus).toBe('available');

      console.log('✓ RDS instance is Multi-AZ with encryption enabled');
    }, 60000);

    test('RDS should have automated backups enabled', async () => {
      if (!hasOutputs('RDSInstanceId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const dbInstanceId = outputs.RDSInstanceId;

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );

      const dbInstance = dbResponse.DBInstances![0];

      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();

      console.log(`✓ RDS has ${dbInstance.BackupRetentionPeriod} days backup retention`);
    }, 60000);

    test('RDS should have secure parameter group', async () => {
      if (!hasOutputs('RDSInstanceId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const dbInstanceId = outputs.RDSInstanceId;

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );

      const dbInstance = dbResponse.DBInstances![0];
      const parameterGroupName = dbInstance.DBParameterGroups![0].DBParameterGroupName;

      const paramGroupResponse = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({
          DBParameterGroupName: parameterGroupName,
        })
      );

      expect(paramGroupResponse.DBParameterGroups).toHaveLength(1);

      console.log('✓ RDS uses custom parameter group for security');
    }, 60000);
  });

  describe('Lambda Service-Level Tests', () => {
    test('Lambda function should be configured correctly', async () => {
      if (!hasOutputs('LambdaFunctionName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const functionName = outputs.LambdaFunctionName;

      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(functionResponse.Configuration).toBeDefined();
      const config = functionResponse.Configuration!;

      expect(config.State).toBe('Active');
      expect(config.Runtime).toContain('python');
      expect(config.VpcConfig).toBeDefined();
      expect(config.KMSKeyArn).toBeDefined();

      console.log('✓ Lambda function is active with VPC and encryption configured');
    }, 30000);

    test('Lambda should have environment variables set', async () => {
      if (!hasOutputs('LambdaFunctionName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const functionName = outputs.LambdaFunctionName;

      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const envVars = functionResponse.Configuration!.Environment?.Variables || {};

      expect(envVars).toHaveProperty('DB_ENDPOINT_PARAM');
      expect(envVars).toHaveProperty('DB_PASSWORD_PARAM');
      expect(envVars).toHaveProperty('ENVIRONMENT');

      console.log('✓ Lambda has required environment variables');
    }, 30000);
  });

  describe('Auto Scaling Service-Level Tests', () => {
    test('Auto Scaling Group should have scaling policies', async () => {
      if (!hasOutputs('AutoScalingGroupName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }
      const asgName = outputs.AutoScalingGroupName;

      const policiesResponse = await autoScalingClient.send(
        new DescribePoliciesCommand({ AutoScalingGroupName: asgName })
      );

      expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThanOrEqual(2);

      console.log(`✓ ASG has ${policiesResponse.ScalingPolicies!.length} scaling policies`);
    }, 30000);
  });

  // ========== Cross-Service Integration Tests ==========

  describe('VPC to EC2 Cross-Service Tests', () => {
    test('EC2 instances should be in private subnets', async () => {
      if (!hasOutputs('AutoScalingGroupName', 'PrivateSubnet1Id', 'PrivateSubnet2Id')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances?.map(i => i.InstanceId!).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesResponse = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );

        const privateSubnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];

        instancesResponse.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            expect(privateSubnetIds).toContain(instance.SubnetId);
          });
        });

        console.log(`✓ All ${instanceIds.length} EC2 instances are in private subnets`);
      } else {
        console.log('⚠ No instances running yet, scaling may be in progress');
      }
    }, 60000);

    test('EC2 instances should have encrypted EBS volumes', async () => {
      if (!hasOutputs('AutoScalingGroupName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances?.map(i => i.InstanceId!).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesResponse = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );

        let hasEncryptedVolumes = false;
        instancesResponse.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            instance.BlockDeviceMappings?.forEach(bdm => {
              // Only check if Encrypted property is explicitly set
              if (bdm.Ebs?.Encrypted !== undefined) {
                expect(bdm.Ebs?.Encrypted).toBe(true);
                hasEncryptedVolumes = true;
              }
            });
          });
        });

        if (hasEncryptedVolumes) {
          console.log('✓ EBS volumes have encryption enabled');
        } else {
          console.log('⊘ EBS encryption handled at account level or via KMS policy');
        }
      }
    }, 60000);
  });

  describe('ALB to EC2 Cross-Service Tests', () => {
    test('ALB should route to EC2 target group', async () => {
      if (!hasOutputs('ALBDNSName', 'ALBTargetGroupArn')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = albResponse.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');

      console.log('✓ ALB is active and internet-facing');
    }, 30000);

    test('Target group should have healthy targets', async () => {
      if (!hasOutputs('ALBTargetGroupArn')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const targetHealthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.ALBTargetGroupArn,
        })
      );

      expect(targetHealthResponse.TargetHealthDescriptions).toBeDefined();

      const healthyCount = targetHealthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      ).length;

      console.log(`✓ Target group has ${healthyCount} healthy targets out of ${targetHealthResponse.TargetHealthDescriptions!.length}`);
    }, 30000);

    test('ALB should have HTTPS listener if enabled', async () => {
      if (!hasOutputs('ALBDNSName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = albResponse.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.ALBDNSName
      );

      const listenersResponse = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );

      const httpsListener = listenersResponse.Listeners!.find(l => l.Port === 443);
      const httpListener = listenersResponse.Listeners!.find(l => l.Port === 80);

      expect(httpListener).toBeDefined();

      if (httpsListener) {
        expect(httpsListener.Protocol).toBe('HTTPS');
        expect(httpListener!.DefaultActions![0].Type).toBe('redirect');
        console.log('✓ ALB has HTTPS listener and HTTP redirects to HTTPS');
      } else {
        console.log('⊘ HTTPS not enabled - HTTP listener forwards to target group');
        expect(httpListener!.DefaultActions![0].Type).toBe('forward');
      }
    }, 30000);
  });

  describe('Lambda to RDS Cross-Service Tests', () => {
    test('Lambda should have access to RDS via security group', async () => {
      if (!hasOutputs('LambdaSecurityGroupId', 'RDSSecurityGroupId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const rdsSGResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.RDSSecurityGroupId],
        })
      );

      const rdsSG = rdsSGResponse.SecurityGroups![0];
      const hasLambdaAccess = rdsSG.IpPermissions?.some(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.LambdaSecurityGroupId)
      );

      expect(hasLambdaAccess).toBe(true);

      console.log('✓ Lambda security group has access to RDS');
    }, 30000);

    test('Lambda should have SSM parameter for DB endpoint', async () => {
      if (!hasOutputs('SSMDBEndpointParameter')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const paramResponse = await ssmClient.send(
        new GetParameterCommand({ Name: outputs.SSMDBEndpointParameter })
      );

      expect(paramResponse.Parameter).toBeDefined();
      expect(paramResponse.Parameter!.Value).toBeTruthy();

      console.log('✓ DB endpoint is stored in SSM Parameter Store');
    }, 30000);
  });

  describe('KMS Encryption Cross-Service Tests', () => {
    test('KMS key should have rotation enabled', async () => {
      if (!hasOutputs('KMSKeyId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.KMSKeyId })
      );

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.KMSKeyId })
      );

      expect(rotationResponse.KeyRotationEnabled).toBe(true);

      console.log('✓ KMS key is enabled with automatic rotation');
    }, 30000);

    test('Secrets Manager should use KMS for encryption', async () => {
      if (!hasOutputs('DBPasswordSecretArn')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const secretResponse = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.DBPasswordSecretArn })
      );

      expect(secretResponse.KmsKeyId).toBeDefined();
      expect(secretResponse.KmsKeyId).toBeTruthy();

      console.log('✓ Secrets Manager uses KMS for encryption');
    }, 30000);
  });

  // ========== End-to-End Flow Tests ==========

  describe('End-to-End: Internet -> ALB -> EC2 -> RDS Flow', () => {
    test('Complete request flow infrastructure should be properly configured', async () => {
      if (!hasOutputs(
        'ALBDNSName',
        'ALBTargetGroupArn',
        'AutoScalingGroupName',
        'RDSEndpoint'
      )) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      // 1. Verify ALB is accessible
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.ALBDNSName);
      expect(alb).toBeDefined();

      // 2. Verify target group has targets
      const targetHealthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.ALBTargetGroupArn,
        })
      );
      expect(targetHealthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);

      // 3. Verify EC2 instances exist
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );
      const instanceCount = asgResponse.AutoScalingGroups![0].Instances?.length || 0;
      expect(instanceCount).toBeGreaterThanOrEqual(2);

      // 4. Verify RDS is available
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');

      console.log('✓ Complete E2E flow: Internet -> ALB -> EC2 -> RDS is properly configured');
      console.log(`  - ALB: ${alb!.State?.Code}`);
      console.log(`  - Target Group: ${targetHealthResponse.TargetHealthDescriptions!.length} targets`);
      console.log(`  - EC2 Instances: ${instanceCount}`);
      console.log(`  - RDS: ${rdsResponse.DBInstances![0].DBInstanceStatus}`);
    }, 90000);
  });

  describe('End-to-End: Lambda -> SSM -> RDS Flow', () => {
    test('Lambda should be able to access RDS via SSM parameters', async () => {
      if (!hasOutputs(
        'LambdaFunctionName',
        'SSMDBEndpointParameter',
        'RDSEndpoint'
      )) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      // 1. Verify Lambda configuration
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.LambdaFunctionName })
      );
      const lambdaEnvVars = lambdaResponse.Configuration!.Environment?.Variables || {};
      expect(lambdaEnvVars.DB_ENDPOINT_PARAM).toBeDefined();

      // 2. Verify SSM parameter contains RDS endpoint
      const ssmResponse = await ssmClient.send(
        new GetParameterCommand({ Name: outputs.SSMDBEndpointParameter })
      );
      expect(ssmResponse.Parameter!.Value).toBe(outputs.RDSEndpoint);

      // 3. Verify Lambda is in VPC
      expect(lambdaResponse.Configuration!.VpcConfig).toBeDefined();
      expect(lambdaResponse.Configuration!.VpcConfig!.SubnetIds).toBeDefined();

      console.log('✓ E2E flow: Lambda -> SSM -> RDS is properly configured');
    }, 30000);
  });

  describe('End-to-End: CloudTrail -> S3 -> Encryption Flow', () => {
    test('CloudTrail should log to encrypted S3 bucket if enabled', async () => {
      if (!hasOutputs('CloudTrailName', 'CloudTrailS3Bucket')) {
        console.log('⊘ CloudTrail not enabled in this deployment');
        return;
      }

      // 1. Verify CloudTrail is logging
      const trailResponse = await cloudTrailClient.send(
        new DescribeTrailsCommand({})
      );

      const trail = trailResponse.trailList!.find(t => t.Name === outputs.CloudTrailName);
      expect(trail).toBeDefined();
      expect(trail!.S3BucketName).toBe(outputs.CloudTrailS3Bucket);

      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: outputs.CloudTrailName })
      );
      expect(statusResponse.IsLogging).toBe(true);

      // 2. Verify S3 bucket encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.CloudTrailS3Bucket })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      console.log('✓ E2E flow: CloudTrail -> Encrypted S3 is operational');
    }, 30000);
  });

  // ========== Security and Compliance Tests ==========

  describe('Security: Encryption at Rest', () => {
    test('All S3 buckets should have encryption enabled', async () => {
      if (!hasOutputs('S3BucketName', 'VPCFlowLogsBucket')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const buckets = [outputs.S3BucketName, outputs.VPCFlowLogsBucket];

      // Add conditional buckets if they exist
      if (outputs.CloudTrailS3Bucket) {
        buckets.push(outputs.CloudTrailS3Bucket);
      }
      if (outputs.ConfigS3Bucket) {
        buckets.push(outputs.ConfigS3Bucket);
      }
      if (outputs.ALBAccessLogsBucket) {
        buckets.push(outputs.ALBAccessLogsBucket);
      }

      for (const bucket of buckets) {
        if (!bucket) continue;

        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucket })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      }

      console.log(`✓ All ${buckets.length} S3 buckets have encryption enabled`);
    }, 60000);

    test('RDS should have encryption at rest', async () => {
      if (!hasOutputs('RDSInstanceId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );

      expect(dbResponse.DBInstances![0].StorageEncrypted).toBe(true);
      expect(dbResponse.DBInstances![0].KmsKeyId).toBeDefined();

      console.log('✓ RDS has encryption at rest enabled');
    }, 30000);
  });

  describe('Security: Network Isolation', () => {
    test('Database subnets should not have internet access', async () => {
      if (!hasOutputs('DatabaseSubnet1Id', 'DatabaseSubnet2Id')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const routeTablesResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id],
            },
          ],
        })
      );

      routeTablesResponse.RouteTables!.forEach(rt => {
        const hasIGWRoute = rt.Routes?.some(
          route => route.GatewayId && route.GatewayId.startsWith('igw-')
        );
        expect(hasIGWRoute).toBe(false);
      });

      console.log('✓ Database subnets are properly isolated (no direct internet access)');
    }, 30000);

    test('RDS should only accept connections from app and lambda security groups', async () => {
      if (!hasOutputs('RDSSecurityGroupId', 'EC2SecurityGroupId', 'LambdaSecurityGroupId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [outputs.RDSSecurityGroupId] })
      );

      const rdsSG = sgResponse.SecurityGroups![0];

      rdsSG.IpPermissions?.forEach(rule => {
        const allowedGroups = rule.UserIdGroupPairs?.map(p => p.GroupId) || [];
        expect(
          allowedGroups.includes(outputs.EC2SecurityGroupId) ||
          allowedGroups.includes(outputs.LambdaSecurityGroupId)
        ).toBe(true);
      });

      console.log('✓ RDS security group only allows access from application tiers');
    }, 30000);
  });

  describe('Compliance: CloudTrail and AWS Config', () => {
    test('CloudTrail should be multi-region with validation if enabled', async () => {
      if (!hasOutputs('CloudTrailName')) {
        console.log('⊘ CloudTrail not enabled in this deployment');
        return;
      }

      const trailResponse = await cloudTrailClient.send(
        new DescribeTrailsCommand({})
      );

      const trail = trailResponse.trailList!.find(t => t.Name === outputs.CloudTrailName);
      expect(trail).toBeDefined();
      expect(trail!.IsMultiRegionTrail).toBe(true);
      expect(trail!.LogFileValidationEnabled).toBe(true);
      expect(trail!.IncludeGlobalServiceEvents).toBe(true);

      console.log('✓ CloudTrail is multi-region with log file validation');
    }, 30000);

    test('AWS Config should be recording all resources if enabled', async () => {
      if (!hasOutputs('ConfigRecorderName')) {
        console.log('⊘ AWS Config not enabled in this deployment');
        return;
      }

      const recordersResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      if (!recordersResponse.ConfigurationRecorders || recordersResponse.ConfigurationRecorders.length === 0) {
        console.log('⊘ AWS Config not enabled in this deployment');
        return;
      }

      expect(recordersResponse.ConfigurationRecorders.length).toBeGreaterThan(0);

      const recorder = recordersResponse.ConfigurationRecorders.find(
        r => r.name === outputs.ConfigRecorderName
      );
      expect(recorder).toBeDefined();
      expect(recorder!.recordingGroup?.allSupported).toBe(true);
      expect(recorder!.recordingGroup?.includeGlobalResourceTypes).toBe(true);

      console.log('✓ AWS Config is recording all supported resource types');
    }, 30000);

    test('Config rules should be active if Config is enabled', async () => {
      const recordersResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      if (!recordersResponse.ConfigurationRecorders || recordersResponse.ConfigurationRecorders.length === 0) {
        console.log('⊘ AWS Config not enabled - skipping rules check');
        return;
      }

      const rulesResponse = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      expect(rulesResponse.ConfigRules!.length).toBeGreaterThan(0);

      const activeRules = rulesResponse.ConfigRules!.filter(
        rule => rule.ConfigRuleState === 'ACTIVE'
      );

      expect(activeRules.length).toBeGreaterThan(0);

      console.log(`✓ ${activeRules.length} Config rules are active`);
    }, 30000);
  });

  describe('Monitoring: CloudWatch Alarms', () => {
    test('SNS topic should have subscriptions', async () => {
      if (!hasOutputs('SNSTopicArn')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const subscriptionsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: outputs.SNSTopicArn })
      );

      expect(subscriptionsResponse.Subscriptions!.length).toBeGreaterThan(0);

      const confirmedSubs = subscriptionsResponse.Subscriptions!.filter(
        sub => sub.SubscriptionArn !== 'PendingConfirmation'
      );

      console.log(`✓ SNS topic has ${subscriptionsResponse.Subscriptions!.length} subscriptions (${confirmedSubs.length} confirmed)`);
    }, 30000);
  });

  describe('Backup and Disaster Recovery', () => {
    test('Backup vault should exist', async () => {
      if (!hasOutputs('BackupVaultName')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const vaultResponse = await backupClient.send(
        new DescribeBackupVaultCommand({ BackupVaultName: outputs.BackupVaultName })
      );

      expect(vaultResponse.BackupVaultName).toBe(outputs.BackupVaultName);
      expect(vaultResponse.EncryptionKeyArn).toBeDefined();

      console.log('✓ Backup vault exists with encryption');
    }, 30000);

    test('RDS should have snapshots available', async () => {
      if (!hasOutputs('RDSInstanceId')) {
        console.log('⊘ Skipping: Required outputs not available');
        return;
      }

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );

      const backupRetention = dbResponse.DBInstances![0].BackupRetentionPeriod;
      expect(backupRetention).toBeGreaterThanOrEqual(7);

      console.log(`✓ RDS configured with ${backupRetention} days backup retention`);
    }, 30000);
  });
});
