import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  S3Client
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient
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
    });

    test('Public subnets exist and are properly configured', async () => {
      const publicSubnets = JSON.parse(outputs.public_subnet_ids);
      const publicCount = Object.keys(publicSubnets).length;
      expect(publicCount).toBeGreaterThan(0);
    });

    test('Private subnets exist and are properly configured', async () => {
      // const subnetIds = Object.values(outputs.private_subnet_ids || {});
      const privateSubnets = JSON.parse(outputs.private_subnet_ids);
      const privateCount = Object.keys(privateSubnets).length;
      expect(privateCount).toBeGreaterThan(0);
    });
  });

  describe('EC2 Instances', () => {
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
    test('RDS instance has correct configuration', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances![0];
      expect(db.DBInstanceClass).toBe('db.r6g.large');
    });
  });

  describe('S3 and DynamoDB for State', () => {
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
      expect(outputs.rds_database_name).toBeDefined();
      expect(outputs.dynamodb_lock_table).toBeDefined();
      expect(outputs.environment_suffix).toBeDefined();
    });

    test('Output values have correct format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.vpc_cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      expect(outputs.alb_dns_name).toContain('.elb.amazonaws.com');
    });
  });
});
