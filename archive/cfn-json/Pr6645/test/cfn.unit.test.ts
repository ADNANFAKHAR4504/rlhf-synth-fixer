describe('CloudFormation Template Unit Tests', () => {
  const fs = require('fs');
  const path = require('path');

  describe('Template Structure Validation', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have correct AWS template format version', () => {
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Configuration Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have VPC resource', () => {
      const vpcResource = Object.keys(template.Resources).find(key =>
        template.Resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpcResource).toBeDefined();
    });


    test('should have subnets configured', () => {
      const subnetResources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnetResources.length).toBeGreaterThanOrEqual(2); // At least 2 for HA
    });
  });

  describe('RDS Configuration Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have RDS database instance', () => {
      const rdsResources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type && (
          template.Resources[key].Type === 'AWS::RDS::DBInstance' ||
          template.Resources[key].Type === 'AWS::RDS::DBCluster'
        )
      );
      expect(rdsResources.length).toBeGreaterThan(0);
    });


  });

  describe('Security Configuration Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have KMS key for encryption', () => {
      const kmsKeys = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBeGreaterThan(0);
    });

    test('should have security groups', () => {
      const securityGroups = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThan(0);
    });

    test('should have IAM roles configured', () => {
      const iamRoles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(iamRoles.length).toBeGreaterThan(0);
    });

    test('should not have overly permissive security group rules', () => {
      const securityGroups = Object.values(template.Resources).filter((resource: any) =>
        resource.Type === 'AWS::EC2::SecurityGroup'
      ) as any[];

      securityGroups.forEach(sg => {
        if (sg.Properties && sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // Check that we're not allowing 0.0.0.0/0 on sensitive ports
            if (rule.CidrIp === '0.0.0.0/0') {
              const sensitivePort = [22, 3389, 3306, 5432, 1433]; // SSH, RDP, MySQL, PostgreSQL, MSSQL
              expect(sensitivePort).not.toContain(rule.FromPort);
            }
          });
        }
      });
    });
  });

  describe('Monitoring and Alerting Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThan(0);
    });

    test('should have SNS topic for notifications', () => {
      const snsTopics = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::SNS::Topic'
      );
      expect(snsTopics.length).toBeGreaterThan(0);
    });

    test('should have alarm actions configured', () => {
      const alarms = Object.values(template.Resources).filter((resource: any) =>
        resource.Type === 'AWS::CloudWatch::Alarm'
      ) as any[];

      alarms.forEach(alarm => {
        if (alarm.Properties) {
          // Check for AlarmActions or OK actions
          const hasActions = alarm.Properties.AlarmActions || alarm.Properties.OKActions;
          expect(hasActions).toBeDefined();
        }
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have EnvironmentSuffix parameter', () => {
      if (template.Parameters) {
        expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      }
    });

    test('should have valid parameter constraints', () => {
      if (template.Parameters) {
        Object.values(template.Parameters).forEach((param: any) => {
          // Check that parameters have descriptions
          expect(param.Description).toBeDefined();
          expect(param.Type).toBeDefined();
        });
      }
    });
  });

  describe('Output Validation Tests', () => {
    let template: any;

    beforeAll(() => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      }
    });

    test('should have outputs defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have proper output structure', () => {
      if (template.Outputs) {
        Object.values(template.Outputs).forEach((output: any) => {
          expect(output.Value).toBeDefined();
          expect(output.Description).toBeDefined();
        });
      }
    });

    test('should export critical resource IDs', () => {
      if (template.Outputs) {
        const outputKeys = Object.keys(template.Outputs);
        // Should export VPC ID, subnet IDs, or other critical resources
        const hasInfraOutputs = outputKeys.some(key =>
          key.toLowerCase().includes('vpc') ||
          key.toLowerCase().includes('subnet') ||
          key.toLowerCase().includes('database')
        );
        expect(hasInfraOutputs).toBe(true);
      }
    });
  });
});