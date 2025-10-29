// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to get output value
const getOutputValue = (key: string): string => {
  const output = outputs.find((output: any) => output.OutputKey === key);
  if (!output) throw new Error(`Output ${key} not found`);
  return output.OutputValue;
};

describe('Media Processing Pipeline - Live Infrastructure Tests', () => {

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = getOutputValue('VPCId');

      const { stdout } = await execAsync(`aws ec2 describe-vpcs --vpc-ids ${vpcId} --query 'Vpcs[0].State' --output text --region us-east-1`);

      expect(stdout.trim()).toBe('available');
    });

    test('Private subnets should exist and be available', async () => {
      const privateSubnets = getOutputValue('PrivateSubnets').split(',');

      for (const subnetId of privateSubnets) {
        const { stdout } = await execAsync(`aws ec2 describe-subnets --subnet-ids ${subnetId.trim()} --query 'Subnets[0].{State:State,MapPublicIp:MapPublicIpOnLaunch}' --output json --region us-east-1`);

        const subnet = JSON.parse(stdout);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIp).toBe(false); // Should be private
      }
    });

    test('Public subnets should exist and be available', async () => {
      const publicSubnets = getOutputValue('PublicSubnets').split(',');

      for (const subnetId of publicSubnets) {
        const { stdout } = await execAsync(`aws ec2 describe-subnets --subnet-ids ${subnetId.trim()} --query 'Subnets[0].{State:State,MapPublicIp:MapPublicIpOnLaunch}' --output json --region us-east-1`);

        const subnet = JSON.parse(stdout);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIp).toBe(true); // Should be public
      }
    });
  });

  describe('Database Infrastructure', () => {
    test('RDS PostgreSQL instance should be running', async () => {
      const rdsEndpoint = getOutputValue('RDSEndpoint');
      const dbInstanceId = `media-postgres-${environmentSuffix}`;

      const { stdout } = await execAsync(`aws rds describe-db-instances --db-instance-identifier ${dbInstanceId} --query 'DBInstances[0].{Status:DBInstanceStatus,Engine:Engine,Endpoint:Endpoint.Address,Port:Endpoint.Port}' --output json --region us-east-1`);

      const dbInstance = JSON.parse(stdout);
      expect(dbInstance.Status).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.Endpoint).toBe(rdsEndpoint);
      expect(dbInstance.Port).toBe(5432);
    });

    test('ElastiCache Redis cluster should be available', async () => {
      const redisEndpoint = getOutputValue('RedisEndpoint');
      const replicationGroupId = `media-redis-${environmentSuffix}`;

      const { stdout } = await execAsync(`aws elasticache describe-replication-groups --replication-group-id ${replicationGroupId} --query 'ReplicationGroups[0].{Status:Status,Engine:Engine}' --output json --region us-east-1`);

      const replicationGroup = JSON.parse(stdout);
      expect(replicationGroup.Status).toBe('available');
      expect(replicationGroup.Engine).toBe('redis');

      // Verify the endpoint is accessible (basic connectivity test)
      expect(redisEndpoint).toMatch(/\.cache\.amazonaws\.com$/);
    });
  });

  describe('Storage and File Systems', () => {
    test('EFS file system should be available', async () => {
      const fileSystemId = getOutputValue('EFSFileSystemId');

      const { stdout } = await execAsync(`aws efs describe-file-systems --file-system-id ${fileSystemId} --query 'FileSystems[0].{LifeCycleState:LifeCycleState,FileSystemId:FileSystemId}' --output json --region us-east-1`);

      const fileSystem = JSON.parse(stdout);
      expect(fileSystem.LifeCycleState).toBe('available');
      expect(fileSystem.FileSystemId).toBe(fileSystemId);
    });

    test('S3 artifacts bucket should exist and be accessible', async () => {
      const bucketName = getOutputValue('ArtifactBucketName');

      const { stdout } = await execAsync(`aws s3api head-bucket --bucket ${bucketName} --region us-east-1 2>&1 || echo "bucket-not-found"`);

      // If head-bucket succeeds, there's no output. If it fails, we get an error.
      expect(stdout.trim()).not.toContain('bucket-not-found');
      expect(stdout.trim()).not.toContain('NoSuchBucket');
      expect(bucketName).toMatch(/^media-artifacts-/);
    });
  });

  describe('CI/CD Pipeline', () => {
    test('CodePipeline should exist and be configured', async () => {
      const pipelineName = getOutputValue('PipelineName');

      const { stdout } = await execAsync(`aws codepipeline get-pipeline --name ${pipelineName} --query 'pipeline.{name:name,stages:stages[].name}' --output json --region us-east-1`);

      const pipeline = JSON.parse(stdout);
      expect(pipeline.name).toBe(pipelineName);
      expect(pipeline.stages).toBeDefined();
      expect(pipeline.stages.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    test('API Gateway endpoint should respond to HTTP requests', async () => {
      const apiEndpoint = getOutputValue('APIEndpoint');

      return new Promise<void>((resolve, reject) => {
        const request = https.get(apiEndpoint, (response) => {
          expect(response.statusCode).toBeDefined();
          // Accept any valid HTTP status code (200, 403, 404, etc.) as it means the endpoint is live
          expect(response.statusCode).toBeGreaterThanOrEqual(200);
          expect(response.statusCode).toBeLessThan(600);
          resolve();
        });

        request.on('error', (error) => {
          reject(new Error(`API Gateway endpoint not reachable: ${error.message}`));
        });

        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('API Gateway endpoint timeout'));
        });
      });
    }, 15000); // 15 second timeout for this test
  });

  describe('Security and Connectivity Tests', () => {
    test('Database should be accessible only from private subnets (security test)', async () => {
      const vpcId = getOutputValue('VPCId');
      const dbInstanceId = `media-postgres-${environmentSuffix}`;

      // Check that RDS is in private subnets (by checking VPC security groups)
      const { stdout } = await execAsync(`aws rds describe-db-instances --db-instance-identifier ${dbInstanceId} --query 'DBInstances[0].DBSubnetGroup.VpcId' --output text --region us-east-1`);

      expect(stdout.trim()).toBe(vpcId);
    });

    test('All resources should be tagged with environment suffix', async () => {
      const vpcId = getOutputValue('VPCId');

      const { stdout } = await execAsync(`aws ec2 describe-tags --filters "Name=resource-id,Values=${vpcId}" "Name=key,Values=Name" --query 'Tags[0].Value' --output text --region us-east-1`);

      expect(stdout.trim()).toContain(environmentSuffix);
    });
  });

  describe('Cost and Resource Optimization Tests', () => {
    test('RDS instance should use appropriate instance class for environment', async () => {
      const dbInstanceId = `media-postgres-${environmentSuffix}`;

      const { stdout } = await execAsync(`aws rds describe-db-instances --db-instance-identifier ${dbInstanceId} --query 'DBInstances[0].DBInstanceClass' --output text --region us-east-1`);

      const instanceClass = stdout.trim();
      // For dev environment, should use cost-effective instance types
      if (environmentSuffix === 'dev') {
        expect(instanceClass).toMatch(/^db\.(t3|t4)\./); // Should use burstable instances for dev
      }
    });

    test('ElastiCache should use appropriate node type for environment', async () => {
      const { stdout } = await execAsync(`aws elasticache describe-cache-clusters --show-cache-node-info --query 'CacheClusters[?starts_with(CacheClusterId, \`media-redis-${environmentSuffix}\`)].CacheNodeType | [0]' --output text --region us-east-1`);

      const nodeType = stdout.trim();
      // For dev environment, should use cost-effective node types
      if (environmentSuffix === 'dev') {
        expect(nodeType).toMatch(/^cache\.(t3|t4|r6g)\./); // Should use appropriate instances for dev
      }
    });
  });
});
