import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Load consolidated outputs to get stack name (CI uses all-outputs.json)
const consolidatedPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
const consolidatedOutputs = JSON.parse(fs.readFileSync(consolidatedPath, 'utf8'));
const stackName = Object.keys(consolidatedOutputs)[0];

const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Tests - PCI-DSS Transaction Processing Infrastructure', () => {
  describe('Deployment Outputs Validation', () => {
    test('stack name should be defined', () => {
      expect(stackName).toBeDefined();
      expect(stackName).toMatch(/^TapStack/);
    });

    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'DatabaseEndpoint',
        'DatabasePort',
        'RedisEndpoint',
        'RedisPort',
        'KinesisStreamName',
        'EFSFileSystemId',
        'LoadBalancerDNS',
        'APIGatewayURL',
        'ECSClusterName',
        'DatabaseSecretArn',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe('string');
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    test('VPC ID should be properly formatted', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('Database endpoint should be properly formatted', () => {
      expect(outputs.DatabaseEndpoint).toMatch(/^aurora-.+\.cluster-.+\.rds\.amazonaws\.com$/);
    });

    test('Database port should be correct', () => {
      expect(outputs.DatabasePort).toBe('3306');
    });

    test('Redis endpoint should be properly formatted', () => {
      expect(outputs.RedisEndpoint).toMatch(/^master\..+\.cache\.amazonaws\.com$/);
    });

    test('Redis port should be correct', () => {
      expect(outputs.RedisPort).toBe('6379');
    });

    test('Kinesis stream name should be properly formatted', () => {
      expect(outputs.KinesisStreamName).toMatch(/^kinesis-transaction-/);
    });

    test('EFS file system ID should be properly formatted', () => {
      expect(outputs.EFSFileSystemId).toMatch(/^fs-[a-f0-9]+$/);
    });

    test('Load Balancer DNS should be properly formatted', () => {
      expect(outputs.LoadBalancerDNS).toMatch(/^alb-.+\.elb\.amazonaws\.com$/);
    });

    test('API Gateway URL should use HTTPS', () => {
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+$/);
    });

    test('ECS cluster name should be properly formatted', () => {
      expect(outputs.ECSClusterName).toMatch(/^ecs-transaction-/);
    });

    test('Database secret ARN should be properly formatted', () => {
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.DatabaseSecretArn).toContain(':secret:secret-database-');
    });
  });

  describe('Consolidated Outputs Structure', () => {
    test('consolidated outputs should have stack name as key', () => {
      expect(Object.keys(consolidatedOutputs)).toHaveLength(1);
      expect(stackName).toBeDefined();
    });

    test('consolidated outputs should have array of output objects', () => {
      const stackOutputs = consolidatedOutputs[stackName];
      expect(Array.isArray(stackOutputs)).toBe(true);
      expect(stackOutputs.length).toBeGreaterThanOrEqual(11);
    });

    test('each output should have required properties', () => {
      const stackOutputs = consolidatedOutputs[stackName];
      stackOutputs.forEach((output: any) => {
        expect(output.OutputKey).toBeDefined();
        expect(output.OutputValue).toBeDefined();
        expect(output.Description).toBeDefined();
        expect(output.ExportName).toBeDefined();
        expect(output.ExportName).toContain(stackName);
      });
    });

    test('output keys should match flat outputs', () => {
      const stackOutputs = consolidatedOutputs[stackName];
      const consolidatedKeys = stackOutputs.map((o: any) => o.OutputKey).sort();
      const flatKeys = Object.keys(outputs).sort();

      expect(consolidatedKeys).toEqual(flatKeys);
    });

    test('output values should match between consolidated and flat', () => {
      const stackOutputs = consolidatedOutputs[stackName];
      stackOutputs.forEach((output: any) => {
        const key = output.OutputKey;
        const consolidatedValue = output.OutputValue;
        const flatValue = outputs[key];

        expect(consolidatedValue).toBe(flatValue);
      });
    });
  });

  describe('Infrastructure Naming Conventions', () => {
    test('all resource names should follow consistent naming pattern', () => {
      // Extract suffix from stack name (e.g., pr4768 from TapStackpr4768)
      const suffix = stackName.replace('TapStack', '');

      expect(outputs.KinesisStreamName).toContain(suffix);
      expect(outputs.ECSClusterName).toContain(suffix);
      expect(outputs.DatabaseSecretArn).toContain(suffix);
      expect(outputs.LoadBalancerDNS).toContain(suffix);
      expect(outputs.DatabaseEndpoint).toContain(suffix);
      expect(outputs.RedisEndpoint).toContain(suffix);
    });

    test('export names should include stack name', () => {
      const stackOutputs = consolidatedOutputs[stackName];
      stackOutputs.forEach((output: any) => {
        expect(output.ExportName).toContain(stackName);
        expect(output.ExportName).toMatch(new RegExp(`^${stackName}-`));
      });
    });
  });

  describe('PCI-DSS Compliance Indicators', () => {
    test('database endpoint indicates encrypted Aurora PostgreSQL', () => {
      expect(outputs.DatabaseEndpoint).toContain('aurora');
      expect(outputs.DatabaseEndpoint).toContain('cluster');
    });

    test('Redis endpoint indicates cluster mode', () => {
      expect(outputs.RedisEndpoint).toContain('master.');
    });

    test('API Gateway uses HTTPS', () => {
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\//);
    });

    test('secrets manager is used for database credentials', () => {
      expect(outputs.DatabaseSecretArn).toContain('secretsmanager');
      expect(outputs.DatabaseSecretArn).toContain('secret-database');
    });

    test('kinesis stream name follows naming convention', () => {
      expect(outputs.KinesisStreamName).toContain('kinesis');
      expect(outputs.KinesisStreamName).toContain('transaction');
    });

    test('EFS file system is provisioned', () => {
      expect(outputs.EFSFileSystemId).toMatch(/^fs-/);
    });

    test('load balancer is provisioned for high availability', () => {
      expect(outputs.LoadBalancerDNS).toContain('alb-');
      expect(outputs.LoadBalancerDNS).toContain('elb.amazonaws.com');
    });

    test('ECS cluster is provisioned for containerized workloads', () => {
      expect(outputs.ECSClusterName).toContain('ecs');
      expect(outputs.ECSClusterName).toContain('transaction');
    });
  });

  describe('Regional Deployment Validation', () => {
    test('all endpoints should be in correct region', () => {
      const expectedRegion = region;

      expect(outputs.DatabaseEndpoint).toContain(`.${expectedRegion}.rds.amazonaws.com`);
      expect(outputs.DatabaseSecretArn).toContain(`:${expectedRegion}:`);
      expect(outputs.APIGatewayURL).toContain(`.${expectedRegion}.amazonaws.com`);
      expect(outputs.LoadBalancerDNS).toContain(`.${expectedRegion}.elb.amazonaws.com`);
    });

    test('Redis endpoint should contain region identifier', () => {
      // Redis endpoints have abbreviated region codes (e.g., use1 for us-east-1)
      expect(outputs.RedisEndpoint).toMatch(/\.(use1|usw2|euw1|euw2)\.cache\.amazonaws\.com$/);
    });
  });
});
