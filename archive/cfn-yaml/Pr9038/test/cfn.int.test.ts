import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation JSON Infrastructure Integration Tests', () => {
  describe('Aurora Global Database Infrastructure', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should validate CloudFormation template exists and is valid JSON', () => {
      const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
      expect(fs.existsSync(templatePath)).toBe(true);

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(() => JSON.parse(templateContent)).not.toThrow();
    });

    test('should have correct template structure with all required sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have Aurora Global Database cluster configured', () => {
      const resources = template.Resources || {};

      // Check for Global Database Cluster
      const globalCluster = Object.keys(resources).find(key =>
        resources[key].Type === 'AWS::RDS::GlobalCluster'
      );
      expect(globalCluster).toBeDefined();

      // Check for Primary DB Cluster
      const primaryCluster = Object.keys(resources).find(key =>
        resources[key].Type === 'AWS::RDS::DBCluster'
      );
      expect(primaryCluster).toBeDefined();

      if (primaryCluster) {
        const clusterProps = resources[primaryCluster].Properties;
        expect(clusterProps.Engine).toMatch(/aurora/);
        expect(clusterProps.StorageEncrypted).toBe(true);
        expect(clusterProps.BackupRetentionPeriod).toBeGreaterThan(0);
      }
    });

    test('should have high availability with multiple DB instances', () => {
      const resources = template.Resources || {};

      // Count DB instances
      const dbInstances = Object.keys(resources).filter(key =>
        resources[key].Type === 'AWS::RDS::DBInstance'
      );

      expect(dbInstances.length).toBeGreaterThanOrEqual(2);

      // Verify instances are in different AZs
      const azs = dbInstances.map(instance =>
        resources[instance].Properties?.AvailabilityZone
      ).filter(Boolean);

      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(Math.min(2, azs.length));
    });

    test('should have comprehensive monitoring with CloudWatch alarms', () => {
      const resources = template.Resources || {};

      // Check for CloudWatch alarms
      const alarms = Object.keys(resources).filter(key =>
        resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      expect(alarms.length).toBeGreaterThan(0);

      // Verify critical metrics are monitored
      const alarmMetrics = alarms.map(alarm =>
        resources[alarm].Properties?.MetricName
      ).filter(Boolean);

      const criticalMetrics = ['CPUUtilization', 'DatabaseConnections', 'FreeableMemory'];
      const hasCriticalMetrics = criticalMetrics.some(metric =>
        alarmMetrics.some(am => am.includes(metric) || am === metric)
      );

      expect(hasCriticalMetrics).toBe(true);
    });

    test('should have security configurations with encryption and security groups', () => {
      const resources = template.Resources || {};

      // Check for KMS key
      const kmsKey = Object.keys(resources).find(key =>
        resources[key].Type === 'AWS::KMS::Key'
      );
      expect(kmsKey).toBeDefined();

      // Check for security groups
      const securityGroups = Object.keys(resources).filter(key =>
        resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThan(0);

      // Verify database encryption
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      if (dbCluster) {
        expect(dbCluster.Properties?.StorageEncrypted).toBe(true);
        expect(dbCluster.Properties?.KmsKeyId).toBeDefined();
      }
    });

    test('should have VPC networking properly configured', () => {
      const resources = template.Resources || {};

      // Check for VPC
      const vpc = Object.keys(resources).find(key =>
        resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpc).toBeDefined();

      // Check for subnets
      const subnets = Object.keys(resources).filter(key =>
        resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBeGreaterThanOrEqual(2);

      // Check for DB subnet group
      const dbSubnetGroup = Object.keys(resources).find(key =>
        resources[key].Type === 'AWS::RDS::DBSubnetGroup'
      );
      expect(dbSubnetGroup).toBeDefined();
    });

    test('should have proper parameter configuration for flexibility', () => {
      const parameters = template.Parameters || {};
      const paramKeys = Object.keys(parameters);

      expect(paramKeys.length).toBeGreaterThan(0);

      // Check for essential parameters - using actual parameter names
      const essentialParams = ['MasterUsername', 'MasterPassword'];
      essentialParams.forEach(param => {
        const hasParam = paramKeys.some(key =>
          key.includes(param) || key === param
        );
        expect(hasParam).toBe(true);
      });

      // Verify parameter types
      paramKeys.forEach(key => {
        expect(parameters[key]).toHaveProperty('Type');
        expect(parameters[key]).toHaveProperty('Description');
      });
    });

    test('should have outputs for stack references and endpoints', () => {
      const outputs = template.Outputs || {};
      const outputKeys = Object.keys(outputs);

      expect(outputKeys.length).toBeGreaterThan(0);

      // Check for critical outputs - using actual output names
      const criticalOutputs = ['PrimaryClusterEndpoint', 'PrimaryClusterReaderEndpoint', 'GlobalClusterIdentifier'];
      criticalOutputs.forEach(output => {
        const hasOutput = outputKeys.some(key =>
          key.includes(output) || key === output
        );
        expect(hasOutput).toBe(true);
      });

      // Verify output structure
      outputKeys.forEach(key => {
        expect(outputs[key]).toHaveProperty('Value');
        expect(outputs[key]).toHaveProperty('Description');
      });
    });
  });
});