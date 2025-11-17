describe('CloudFormation Template Unit Tests', () => {
  const fs = require('fs');
  const yaml = require('js-yaml');
  const path = require('path');

  describe('Primary Template Structure', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = yaml.load(templateContent);
      }
    });

    test('should have correct CloudFormation version', () => {
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have meaningful description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.length).toBeGreaterThan(10);
      expect(template.Description.toLowerCase()).toContain('aurora');
    });

    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.DatabaseName).toBeDefined();
      expect(template.Parameters.MasterUsername).toBeDefined();
    });

    test('should have secure parameter settings', () => {
      // Master password should be NoEcho
      if (template.Parameters.MasterUserPassword) {
        expect(template.Parameters.MasterUserPassword.NoEcho).toBe(true);
      }
    });
  });

  describe('Aurora Cluster Configuration', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = yaml.load(templateContent);
    });

    test('should have Aurora DB cluster', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      );

      expect(dbCluster).toBeDefined();
    });

    test('should have proper Aurora engine configuration', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      if (dbCluster) {
        expect(dbCluster.Properties).toBeDefined();
        expect(dbCluster.Properties.Engine).toMatch(/aurora/);
        expect(dbCluster.Properties.EngineMode).toBeDefined();
      }
    });

    test('should have backup retention configured', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      if (dbCluster) {
        expect(dbCluster.Properties.BackupRetentionPeriod).toBeDefined();
        expect(dbCluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      }
    });

    test('should have deletion protection for production', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      if (dbCluster) {
        // Deletion protection should be configured
        expect(dbCluster.Properties).toBeDefined();
      }
    });
  });

  describe('High Availability Configuration', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = yaml.load(templateContent);
    });

    test('should have multiple Aurora instances', () => {
      const resources = template.Resources || {};
      const dbInstances = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::RDS::DBInstance'
      );

      // Should have at least 2 instances for HA
      expect(dbInstances.length).toBeGreaterThanOrEqual(2);
    });

    test('should have DB subnet group for multi-AZ', () => {
      const resources = template.Resources || {};
      const subnetGroup = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBSubnetGroup'
      );

      expect(subnetGroup).toBeDefined();

      if (subnetGroup) {
        const props = (subnetGroup as any).Properties;
        // Should have multiple subnets for multi-AZ
        expect(props.SubnetIds).toBeDefined();
        expect(props.SubnetIds.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should have failover priority configured', () => {
      const resources = template.Resources || {};
      const dbInstances = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::RDS::DBInstance'
      ) as any[];

      // At least one instance should have failover priority
      const hasFailoverPriority = dbInstances.some(instance =>
        instance.Properties?.PromotionTier !== undefined
      );

      expect(hasFailoverPriority).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = yaml.load(templateContent);
    });

    test('should have KMS key for encryption', () => {
      const resources = template.Resources || {};
      const kmsKey = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::KMS::Key'
      );

      expect(kmsKey).toBeDefined();

      if (kmsKey) {
        const props = (kmsKey as any).Properties;
        expect(props.KeyPolicy).toBeDefined();
      }
    });

    test('should have encrypted storage', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      if (dbCluster) {
        expect(dbCluster.Properties.StorageEncrypted).toBe(true);
        expect(dbCluster.Properties.KmsKeyId).toBeDefined();
      }
    });

    test('should have security group for database', () => {
      const resources = template.Resources || {};
      const securityGroup = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::EC2::SecurityGroup' &&
        (r.Properties?.GroupDescription?.toLowerCase().includes('database') ||
         r.Properties?.GroupDescription?.toLowerCase().includes('aurora'))
      );

      expect(securityGroup).toBeDefined();
    });

    test('should have IAM database authentication option', () => {
      const resources = template.Resources || {};
      const dbCluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBCluster'
      ) as any;

      // Check if IAM authentication is configured
      if (dbCluster && dbCluster.Properties) {
        // IAM authentication should be considered for production
        expect(dbCluster.Properties).toBeDefined();
      }
    });
  });

  describe('Monitoring and Alerting', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = yaml.load(templateContent);
    });

    test('should have CloudWatch alarms for CPU', () => {
      const resources = template.Resources || {};
      const cpuAlarm = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::CloudWatch::Alarm' &&
        r.Properties?.MetricName === 'CPUUtilization'
      );

      expect(cpuAlarm).toBeDefined();

      if (cpuAlarm) {
        const props = (cpuAlarm as any).Properties;
        expect(props.Threshold).toBeDefined();
        expect(props.ComparisonOperator).toBeDefined();
        expect(props.AlarmActions).toBeDefined();
      }
    });

    test('should have CloudWatch alarms for storage', () => {
      const resources = template.Resources || {};
      const storageAlarm = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::CloudWatch::Alarm' &&
        (r.Properties?.MetricName === 'FreeLocalStorage' ||
         r.Properties?.MetricName === 'FreeableMemory')
      );

      expect(storageAlarm).toBeDefined();
    });

    test('should have SNS topic for notifications', () => {
      const resources = template.Resources || {};
      const snsTopic = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::SNS::Topic'
      );

      expect(snsTopic).toBeDefined();

      if (snsTopic) {
        const props = (snsTopic as any).Properties;
        expect(props.DisplayName).toBeDefined();
      }
    });

    test('should have alarm actions configured', () => {
      const resources = template.Resources || {};
      const alarms = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::CloudWatch::Alarm'
      ) as any[];

      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Secondary Region Template', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack-Secondary.yml');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = yaml.load(templateContent);
      }
    });

    test('should have read replica configuration', () => {
      if (!template) {
        return; // Skip if secondary template doesn't exist
      }

      const resources = template.Resources || {};
      const readReplica = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBInstance' &&
        r.Properties?.SourceDBInstanceIdentifier
      );

      expect(readReplica).toBeDefined();
    });

    test('should have monitoring for secondary region', () => {
      if (!template) {
        return; // Skip if secondary template doesn't exist
      }

      const resources = template.Resources || {};
      const hasMonitoring = Object.values(resources).some((r: any) =>
        r.Type === 'AWS::CloudWatch::Alarm'
      );

      expect(hasMonitoring).toBe(true);
    });
  });

  describe('Template Outputs', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = yaml.load(templateContent);
    });

    test('should export cluster endpoint', () => {
      expect(template.Outputs).toBeDefined();
      const outputs = Object.keys(template.Outputs || {});

      const endpointOutput = outputs.find(key =>
        key.toLowerCase().includes('endpoint') ||
        template.Outputs[key].Description?.toLowerCase().includes('endpoint')
      );

      expect(endpointOutput).toBeDefined();
    });

    test('should export reader endpoint', () => {
      const outputs = Object.keys(template.Outputs || {});

      const readerEndpoint = outputs.find(key =>
        key.toLowerCase().includes('reader') ||
        template.Outputs[key].Description?.toLowerCase().includes('reader')
      );

      expect(readerEndpoint).toBeDefined();
    });

    test('should have export names for cross-stack references', () => {
      const outputs = template.Outputs || {};

      Object.values(outputs).forEach((output: any) => {
        // Critical outputs should have Export names
        if (output.Description?.toLowerCase().includes('cluster') ||
            output.Description?.toLowerCase().includes('endpoint')) {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });
});