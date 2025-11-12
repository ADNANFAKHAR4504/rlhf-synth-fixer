import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

const REGION = process.env.AWS_REGION || 'ap-southeast-1';
const OUTPUTS_FILE = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let s3Client: S3Client;
  let dynamoClient: DynamoDBClient;
  let secretsClient: SecretsManagerClient;

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(OUTPUTS_FILE)) {
      outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf8'));
    } else {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}. Run deployment first.`);
    }

    // Initialize AWS clients
    ec2Client = new EC2Client({ region: REGION });
    elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
    rdsClient = new RDSClient({ region: REGION });
    s3Client = new S3Client({ region: REGION });
    dynamoClient = new DynamoDBClient({ region: REGION });
    secretsClient = new SecretsManagerClient({ region: REGION });
  });

  afterAll(() => {
    ec2Client.destroy();
    elbClient.destroy();
    rdsClient.destroy();
    s3Client.destroy();
    dynamoClient.destroy();
    secretsClient.destroy();
  });

  describe('VPC and Networking', () => {
    test('VPC exists and is properly configured', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe(outputs.vpc_cidr || '10.0.0.0/16');
      expect(vpc.EnableDnsHostnames?.Value).toBe(true);
      expect(vpc.EnableDnsSupport?.Value).toBe(true);
    });

    test('Public subnets exist and are properly configured', async () => {
      const subnetIds = Object.values(outputs.public_subnet_ids || {});
      expect(subnetIds.length).toBeGreaterThan(0);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds as string[],
        })
      );

      expect(response.Subnets).toHaveLength(subnetIds.length);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('Private subnets exist and are properly configured', async () => {
      const subnetIds = Object.values(outputs.private_subnet_ids || {});
      expect(subnetIds.length).toBeGreaterThan(0);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds as string[],
        })
      );

      expect(response.Subnets).toHaveLength(subnetIds.length);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances exist and are running', async () => {
      const instanceIds = Object.values(outputs.ec2_instance_ids || {});
      expect(instanceIds.length).toBeGreaterThan(0);

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        })
      );

      expect(response.Reservations).toBeDefined();
      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      expect(instances.length).toBe(instanceIds.length);

      instances.forEach(instance => {
        expect(instance.State?.Name).toMatch(/^(pending|running)$/);
        expect(instance.VpcId).toBe(outputs.vpc_id);
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.Monitoring?.State).toBe('enabled');
      });
    });

    test('EC2 instances have correct IMDSv2 configuration', async () => {
      const instanceIds = Object.values(outputs.ec2_instance_ids || {});

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        })
      );

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      instances.forEach(instance => {
        expect(instance.MetadataOptions?.HttpTokens).toBe('required');
        expect(instance.MetadataOptions?.HttpPutResponseHopLimit).toBe(1);
      });
    });

    test('EC2 instances have encrypted root volumes', async () => {
      const instanceIds = Object.values(outputs.ec2_instance_ids || {});

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        })
      );

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      instances.forEach(instance => {
        const rootVolume = instance.BlockDeviceMappings?.find(
          bdm => bdm.DeviceName === instance.RootDeviceName
        );
        expect(rootVolume?.Ebs?.Encrypted).toBe(true);
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.VpcId).toBe(outputs.vpc_id);
    });

    test('ALB has correct DNS name', () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).toMatch(/^[a-z0-9-]+\.ap-southeast-1\.elb\.amazonaws\.com$/);
    });

    test('Target group exists and is configured', async () => {
      const tgArn = outputs.target_group_arn;
      expect(tgArn).toBeDefined();

      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [tgArn],
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.VpcId).toBe(outputs.vpc_id);
      expect(tg.HealthCheckEnabled).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toMatch(/^(available|backing-up|creating)$/);
      expect(db.Engine).toBe('mysql');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.DeletionProtection).toBe(false);
    });

    test('RDS instance has correct configuration', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances![0];
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.AllocatedStorage).toBe(20);
      expect(db.StorageType).toBe('gp3');
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.MultiAZ).toBe(false);
    });

    test('RDS endpoint is accessible', () => {
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.rds_endpoint).toMatch(/^[a-z0-9-]+\..*\.rds\.amazonaws\.com:\d+$/);
      expect(outputs.rds_database_name).toBe('appdb');
    });
  });

  describe('S3 and DynamoDB for State', () => {
    test('S3 state bucket exists', async () => {
      const bucketName = outputs.s3_state_bucket;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('S3 bucket versioning is enabled', async () => {
      const bucketName = outputs.s3_state_bucket;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('DynamoDB lock table exists', async () => {
      const tableName = outputs.dynamodb_lock_table;
      expect(tableName).toBeDefined();

      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table?.TableStatus).toMatch(/^(ACTIVE|CREATING)$/);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.KeySchema).toContainEqual({
        AttributeName: 'LockID',
        KeyType: 'HASH',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have required tags', async () => {
      const environmentSuffix = outputs.environment_suffix;
      expect(environmentSuffix).toBeDefined();

      // Check EC2 tags
      const instanceIds = Object.values(outputs.ec2_instance_ids || {});
      if (instanceIds.length > 0) {
        const ec2Response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: instanceIds as string[],
          })
        );

        const instances = ec2Response.Reservations!.flatMap(r => r.Instances || []);
        instances.forEach(instance => {
          const tags = instance.Tags || [];
          const tagMap = Object.fromEntries(tags.map(t => [t.Key, t.Value]));

          expect(tagMap['Environment']).toBe(environmentSuffix);
          expect(tagMap['ManagedBy']).toBe('Terraform');
          expect(tagMap['Project']).toBeDefined();
          expect(tagMap['CostCenter']).toBeDefined();
        });
      }
    });
  });

  describe('Security Configuration', () => {
    test('All resources use encryption', async () => {
      // RDS encryption
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      if (dbIdentifier) {
        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );
        expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);
      }

      // EC2 volume encryption
      const instanceIds = Object.values(outputs.ec2_instance_ids || {});
      if (instanceIds.length > 0) {
        const ec2Response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: instanceIds as string[],
          })
        );

        const instances = ec2Response.Reservations!.flatMap(r => r.Instances || []);
        instances.forEach(instance => {
          const rootVolume = instance.BlockDeviceMappings?.find(
            bdm => bdm.DeviceName === instance.RootDeviceName
          );
          expect(rootVolume?.Ebs?.Encrypted).toBe(true);
        });
      }
    });
  });

  describe('Outputs Validation', () => {
    test('All required outputs are present', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_cidr).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_arn).toBeDefined();
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.rds_database_name).toBeDefined();
      expect(outputs.ec2_instance_ids).toBeDefined();
      expect(outputs.s3_state_bucket).toBeDefined();
      expect(outputs.dynamodb_lock_table).toBeDefined();
      expect(outputs.environment_suffix).toBeDefined();
    });

    test('Output values have correct format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.vpc_cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      expect(outputs.alb_dns_name).toContain('.elb.amazonaws.com');
      expect(outputs.rds_endpoint).toContain('.rds.amazonaws.com');
    });
  });
});
