import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Environment Database Replication System Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs defined', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have DevAuroraClusterEndpoint output', () => {
      expect(outputs.DevAuroraClusterEndpoint).toBeDefined();
      expect(typeof outputs.DevAuroraClusterEndpoint).toBe('string');
      expect(outputs.DevAuroraClusterEndpoint).toMatch(/\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('should have StagingAuroraClusterEndpoint output', () => {
      expect(outputs.StagingAuroraClusterEndpoint).toBeDefined();
      expect(typeof outputs.StagingAuroraClusterEndpoint).toBe('string');
      expect(outputs.StagingAuroraClusterEndpoint).toMatch(/\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('should have ProdAuroraClusterEndpoint output', () => {
      expect(outputs.ProdAuroraClusterEndpoint).toBeDefined();
      expect(typeof outputs.ProdAuroraClusterEndpoint).toBe('string');
      expect(outputs.ProdAuroraClusterEndpoint).toMatch(/\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('should have SchemaReplicationFunctionArn output', () => {
      expect(outputs.SchemaReplicationFunctionArn).toBeDefined();
      expect(typeof outputs.SchemaReplicationFunctionArn).toBe('string');
      expect(outputs.SchemaReplicationFunctionArn).toMatch(/^arn:aws:lambda:us-east-1:\d+:function:db-sync-schema-replication-/);
    });

    test('should have DataReplicationFunctionArn output', () => {
      expect(outputs.DataReplicationFunctionArn).toBeDefined();
      expect(typeof outputs.DataReplicationFunctionArn).toBe('string');
      expect(outputs.DataReplicationFunctionArn).toMatch(/^arn:aws:lambda:us-east-1:\d+:function:db-sync-data-replication-/);
    });

    test('should have MigrationScriptsBucketName output', () => {
      expect(outputs.MigrationScriptsBucketName).toBeDefined();
      expect(typeof outputs.MigrationScriptsBucketName).toBe('string');
      expect(outputs.MigrationScriptsBucketName).toMatch(/^migration-scripts-/);
    });
  });

  describe('Aurora Cluster Endpoints', () => {
    test('DevAuroraClusterEndpoint should contain environment suffix', () => {
      expect(outputs.DevAuroraClusterEndpoint).toContain('dev-aurora-cluster');
      expect(outputs.DevAuroraClusterEndpoint).toContain(environmentSuffix);
    });

    test('StagingAuroraClusterEndpoint should contain environment suffix', () => {
      expect(outputs.StagingAuroraClusterEndpoint).toContain('staging-aurora-cluster');
      expect(outputs.StagingAuroraClusterEndpoint).toContain(environmentSuffix);
    });

    test('ProdAuroraClusterEndpoint should contain environment suffix', () => {
      expect(outputs.ProdAuroraClusterEndpoint).toContain('prod-aurora-cluster');
      expect(outputs.ProdAuroraClusterEndpoint).toContain(environmentSuffix);
    });

    test('all Aurora endpoints should be unique', () => {
      const endpoints = [
        outputs.DevAuroraClusterEndpoint,
        outputs.StagingAuroraClusterEndpoint,
        outputs.ProdAuroraClusterEndpoint
      ];
      const uniqueEndpoints = new Set(endpoints);
      expect(uniqueEndpoints.size).toBe(3);
    });

    test('Aurora endpoints should follow AWS RDS naming pattern', () => {
      const rdsPattern = /^[a-z0-9-]+\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/;
      expect(outputs.DevAuroraClusterEndpoint).toMatch(rdsPattern);
      expect(outputs.StagingAuroraClusterEndpoint).toMatch(rdsPattern);
      expect(outputs.ProdAuroraClusterEndpoint).toMatch(rdsPattern);
    });
  });

  describe('Lambda Function ARNs', () => {
    test('SchemaReplicationFunctionArn should be valid ARN', () => {
      const arnPattern = /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/;
      expect(outputs.SchemaReplicationFunctionArn).toMatch(arnPattern);
    });

    test('DataReplicationFunctionArn should be valid ARN', () => {
      const arnPattern = /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/;
      expect(outputs.DataReplicationFunctionArn).toMatch(arnPattern);
    });

    test('Lambda function ARNs should contain environment suffix', () => {
      expect(outputs.SchemaReplicationFunctionArn).toContain(environmentSuffix);
      expect(outputs.DataReplicationFunctionArn).toContain(environmentSuffix);
    });

    test('Lambda functions should have correct naming convention', () => {
      expect(outputs.SchemaReplicationFunctionArn).toContain('db-sync-schema-replication');
      expect(outputs.DataReplicationFunctionArn).toContain('db-sync-data-replication');
    });

    test('Lambda function ARNs should be in us-east-1 region', () => {
      expect(outputs.SchemaReplicationFunctionArn).toContain(':us-east-1:');
      expect(outputs.DataReplicationFunctionArn).toContain(':us-east-1:');
    });
  });

  describe('S3 Bucket Name', () => {
    test('should have correct naming prefix', () => {
      expect(outputs.MigrationScriptsBucketName).toMatch(/^migration-scripts-/);
    });

    test('should contain environment suffix', () => {
      expect(outputs.MigrationScriptsBucketName).toContain(environmentSuffix);
    });

    test('should contain AWS account ID', () => {
      expect(outputs.MigrationScriptsBucketName).toMatch(/migration-scripts-\w+-\d+$/);
    });

    test('should follow S3 naming conventions', () => {
      expect(outputs.MigrationScriptsBucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(outputs.MigrationScriptsBucketName.length).toBeGreaterThan(3);
      expect(outputs.MigrationScriptsBucketName.length).toBeLessThan(64);
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources should use the same environment suffix', () => {
      const devEndpoint = outputs.DevAuroraClusterEndpoint;
      const stagingEndpoint = outputs.StagingAuroraClusterEndpoint;
      const prodEndpoint = outputs.ProdAuroraClusterEndpoint;
      const schemaFunctionArn = outputs.SchemaReplicationFunctionArn;
      const dataFunctionArn = outputs.DataReplicationFunctionArn;
      const bucketName = outputs.MigrationScriptsBucketName;

      expect(devEndpoint).toContain(environmentSuffix);
      expect(stagingEndpoint).toContain(environmentSuffix);
      expect(prodEndpoint).toContain(environmentSuffix);
      expect(schemaFunctionArn).toContain(environmentSuffix);
      expect(dataFunctionArn).toContain(environmentSuffix);
      expect(bucketName).toContain(environmentSuffix);
    });

    test('environment-specific resources should have correct prefixes', () => {
      expect(outputs.DevAuroraClusterEndpoint).toMatch(/^dev-aurora-cluster/);
      expect(outputs.StagingAuroraClusterEndpoint).toMatch(/^staging-aurora-cluster/);
      expect(outputs.ProdAuroraClusterEndpoint).toMatch(/^prod-aurora-cluster/);
    });
  });

  describe('Deployment Validation', () => {
    test('should have exactly 6 outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys).toHaveLength(6);
    });

    test('all output values should be non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      });
    });

    test('outputs should match expected keys', () => {
      const expectedKeys = [
        'DevAuroraClusterEndpoint',
        'StagingAuroraClusterEndpoint',
        'ProdAuroraClusterEndpoint',
        'SchemaReplicationFunctionArn',
        'DataReplicationFunctionArn',
        'MigrationScriptsBucketName'
      ];

      const actualKeys = Object.keys(outputs).sort();
      expect(actualKeys).toEqual(expectedKeys.sort());
    });
  });

  describe('Multi-Environment Architecture', () => {
    test('should have three separate Aurora clusters', () => {
      const clusters = [
        outputs.DevAuroraClusterEndpoint,
        outputs.StagingAuroraClusterEndpoint,
        outputs.ProdAuroraClusterEndpoint
      ];

      clusters.forEach(cluster => {
        expect(cluster).toBeDefined();
        expect(cluster).toMatch(/\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
      });

      const uniqueClusters = new Set(clusters);
      expect(uniqueClusters.size).toBe(3);
    });

    test('should have two Lambda replication functions', () => {
      expect(outputs.SchemaReplicationFunctionArn).toBeDefined();
      expect(outputs.DataReplicationFunctionArn).toBeDefined();
      expect(outputs.SchemaReplicationFunctionArn).not.toBe(outputs.DataReplicationFunctionArn);
    });

    test('should have one shared S3 bucket for migration scripts', () => {
      expect(outputs.MigrationScriptsBucketName).toBeDefined();
      expect(outputs.MigrationScriptsBucketName).toMatch(/^migration-scripts-/);
    });
  });

  describe('AWS Resource Validation', () => {
    test('Aurora cluster endpoints should be resolvable DNS names', () => {
      const dnsPattern = /^[a-z0-9][a-z0-9-]*\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/;
      expect(outputs.DevAuroraClusterEndpoint).toMatch(dnsPattern);
      expect(outputs.StagingAuroraClusterEndpoint).toMatch(dnsPattern);
      expect(outputs.ProdAuroraClusterEndpoint).toMatch(dnsPattern);
    });

    test('Lambda ARNs should contain valid AWS account ID', () => {
      const accountIdPattern = /:\d{12}:/;
      expect(outputs.SchemaReplicationFunctionArn).toMatch(accountIdPattern);
      expect(outputs.DataReplicationFunctionArn).toMatch(accountIdPattern);

      const schemaAccountId = outputs.SchemaReplicationFunctionArn.match(/:(\d{12}):/)?.[1];
      const dataAccountId = outputs.DataReplicationFunctionArn.match(/:(\d{12}):/)?.[1];
      expect(schemaAccountId).toBe(dataAccountId);
    });

    test('S3 bucket name should not contain uppercase or special characters', () => {
      expect(outputs.MigrationScriptsBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.MigrationScriptsBucketName).not.toMatch(/[A-Z]/);
      expect(outputs.MigrationScriptsBucketName).not.toMatch(/[^a-z0-9-]/);
    });
  });
});
