import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Blue-Green');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have Environment Suffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have KMS Key', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Database Secret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have Backup Vault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have KMS outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });
  });
});

describe('Master Stack Validation', () => {
  let masterTemplate: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/master-stack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    masterTemplate = JSON.parse(templateContent);
  });

  test('should have 11 nested stacks', () => {
    const resources = Object.keys(masterTemplate.Resources);
    expect(resources.length).toBe(11);
    resources.forEach(resource => {
      expect(masterTemplate.Resources[resource].Type).toBe('AWS::CloudFormation::Stack');
    });
  });

  test('should have required parameters', () => {
    expect(masterTemplate.Parameters.EnvironmentSuffix).toBeDefined();
    expect(masterTemplate.Parameters.Project).toBeDefined();
    expect(masterTemplate.Parameters.CostCenter).toBeDefined();
    expect(masterTemplate.Parameters.VpcCidr).toBeDefined();
    expect(masterTemplate.Parameters.DatabaseMasterUsername).toBeDefined();
    expect(masterTemplate.Parameters.ECSTaskImage).toBeDefined();
    expect(masterTemplate.Parameters.HostedZoneId).toBeDefined();
    expect(masterTemplate.Parameters.DomainName).toBeDefined();
  });

  test('should have outputs for key components', () => {
    expect(masterTemplate.Outputs.VpcId).toBeDefined();
    expect(masterTemplate.Outputs.BlueDBEndpoint).toBeDefined();
    expect(masterTemplate.Outputs.GreenDBEndpoint).toBeDefined();
    expect(masterTemplate.Outputs.ALBDNSName).toBeDefined();
    expect(masterTemplate.Outputs.ApplicationURL).toBeDefined();
  });
});

describe('Nested Stacks Validation', () => {
  test('Database stack should have Aurora clusters', () => {
    const dbTemplatePath = path.join(__dirname, '../lib/nested-stacks/database-stack.json');
    const dbTemplate = JSON.parse(fs.readFileSync(dbTemplatePath, 'utf8'));
    expect(dbTemplate.Resources.BlueDBCluster).toBeDefined();
    expect(dbTemplate.Resources.GreenDBCluster).toBeDefined();
    expect(dbTemplate.Resources.BlueDBCluster.Type).toBe('AWS::RDS::DBCluster');
  });

  test('ECS stack should have services and target groups', () => {
    const ecsTemplatePath = path.join(__dirname, '../lib/nested-stacks/ecs-stack.json');
    const ecsTemplate = JSON.parse(fs.readFileSync(ecsTemplatePath, 'utf8'));
    expect(ecsTemplate.Resources.BlueService).toBeDefined();
    expect(ecsTemplate.Resources.GreenService).toBeDefined();
    expect(ecsTemplate.Parameters.BlueTargetGroup).toBeDefined();
    expect(ecsTemplate.Parameters.GreenTargetGroup).toBeDefined();
  });
});
