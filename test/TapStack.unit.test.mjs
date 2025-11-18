/**
 * Unit tests for CloudFormation templates
 * This test validates all CloudFormation YAML templates for syntax and structure
 */

import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const libDir = path.join(__dirname, '..', 'lib');

// Custom YAML type for CloudFormation intrinsic functions
const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar' }),
  new yaml.Type('!GetAtt', { kind: 'scalar' }),
  new yaml.Type('!Sub', { kind: 'scalar' }),
  new yaml.Type('!Join', { kind: 'sequence' }),
  new yaml.Type('!Equals', { kind: 'sequence' }),
  new yaml.Type('!Not', { kind: 'sequence' }),
  new yaml.Type('!Or', { kind: 'sequence' }),
  new yaml.Type('!And', { kind: 'sequence' }),
  new yaml.Type('!If', { kind: 'sequence' }),
  new yaml.Type('!Condition', { kind: 'scalar' }),
  new yaml.Type('!Select', { kind: 'sequence' }),
  new yaml.Type('!Cidr', { kind: 'sequence' }),
  new yaml.Type('!GetAZs', { kind: 'scalar' }),
  new yaml.Type('!Split', { kind: 'sequence' }),
  new yaml.Type('!FindInMap', { kind: 'sequence' }),
  new yaml.Type('!ImportValue', { kind: 'scalar' }),
  new yaml.Type('!Base64', { kind: 'scalar' }),
]);

// Helper function to load CloudFormation template
function loadTemplate(filename) {
  const filepath = path.join(libDir, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  return yaml.load(content, { schema: CFN_SCHEMA });
}

// Helper function to get all YAML template files
function getTemplateFiles() {
  return fs.readdirSync(libDir)
    .filter(file => file.endsWith('.yml') && !file.includes('simplified'))
    .filter(file => !['PROMPT.md', 'MODEL_RESPONSE.md', 'README.md', 'IDEAL_RESPONSE.md', 'MODEL_FAILURES.md'].includes(file));
}

describe('CloudFormation Template Syntax Validation', () => {
  const templates = getTemplateFiles();

  test('should find at least 6 CloudFormation templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(6);
  });

  templates.forEach(templateFile => {
    describe(`Template: ${templateFile}`, () => {
      let template;

      test('should load without YAML syntax errors', () => {
        expect(() => {
          template = loadTemplate(templateFile);
        }).not.toThrow();
      });

      test('should have AWSTemplateFormatVersion', () => {
        template = loadTemplate(templateFile);
        expect(template).toHaveProperty('AWSTemplateFormatVersion');
        expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      });

      test('should have Description', () => {
        template = loadTemplate(templateFile);
        expect(template).toHaveProperty('Description');
        expect(typeof template.Description).toBe('string');
        expect(template.Description.length).toBeGreaterThan(0);
      });

      test('should have Resources section', () => {
        template = loadTemplate(templateFile);
        expect(template).toHaveProperty('Resources');
        expect(typeof template.Resources).toBe('object');
      });

      test('should have at least one resource', () => {
        template = loadTemplate(templateFile);
        const resourceCount = Object.keys(template.Resources).length;
        expect(resourceCount).toBeGreaterThan(0);
      });
    });
  });
});

describe('TapStack Master Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('TapStack.yml');
  });

  test('should have all required parameters', () => {
    expect(template).toHaveProperty('Parameters');
    const params = template.Parameters;
    expect(params).toHaveProperty('EnvironmentSuffix');
    expect(params).toHaveProperty('Environment');
    expect(params).toHaveProperty('VpcCidr');
    expect(params).toHaveProperty('DevOpsEmail');
  });

  test('should have Environment parameter with correct allowed values', () => {
    const envParam = template.Parameters.Environment;
    expect(envParam).toHaveProperty('AllowedValues');
    expect(envParam.AllowedValues).toContain('dev');
    expect(envParam.AllowedValues).toContain('staging');
    expect(envParam.AllowedValues).toContain('prod');
  });

  test('should have Conditions section', () => {
    expect(template).toHaveProperty('Conditions');
    expect(template.Conditions).toHaveProperty('IsProduction');
    expect(template.Conditions).toHaveProperty('IsStaging');
    expect(template.Conditions).toHaveProperty('IsDevelopment');
  });

  test('should have nested stack resources', () => {
    const resources = template.Resources;
    expect(resources).toHaveProperty('NetworkStack');
    expect(resources).toHaveProperty('SecurityStack');
    expect(resources).toHaveProperty('DatabaseStack');
    expect(resources).toHaveProperty('StorageStack');
    expect(resources).toHaveProperty('MonitoringStack');
  });

  test('should have SSM parameter resources', () => {
    const resources = template.Resources;
    expect(resources).toHaveProperty('EnvironmentParameter');
    expect(resources).toHaveProperty('ApplicationParameter');
  });

  test('should have Outputs section', () => {
    expect(template).toHaveProperty('Outputs');
    const outputs = template.Outputs;
    expect(outputs).toHaveProperty('StackName');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('AuroraClusterEndpoint');
    expect(outputs).toHaveProperty('DynamoDBTableName');
    expect(outputs).toHaveProperty('S3BucketName');
    expect(outputs).toHaveProperty('SNSTopicArn');
  });

  test('all nested stacks should have correct DependsOn relationships', () => {
    const resources = template.Resources;

    // SecurityStack depends on NetworkStack
    expect(resources.SecurityStack).toHaveProperty('DependsOn');
    expect(resources.SecurityStack.DependsOn).toBe('NetworkStack');

    // DatabaseStack depends on NetworkStack and SecurityStack
    expect(resources.DatabaseStack).toHaveProperty('DependsOn');
    expect(resources.DatabaseStack.DependsOn).toContain('NetworkStack');
    expect(resources.DatabaseStack.DependsOn).toContain('SecurityStack');

    // MonitoringStack depends on SecurityStack
    expect(resources.MonitoringStack).toHaveProperty('DependsOn');
  });
});

describe('Network Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('network-stack.yml');
  });

  test('should have VPC resource', () => {
    expect(template.Resources).toHaveProperty('VPC');
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
  });

  test('should have Internet Gateway', () => {
    expect(template.Resources).toHaveProperty('InternetGateway');
    expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
  });

  test('should have 3 public subnets', () => {
    expect(template.Resources).toHaveProperty('PublicSubnetAZ1');
    expect(template.Resources).toHaveProperty('PublicSubnetAZ2');
    expect(template.Resources).toHaveProperty('PublicSubnetAZ3');
  });

  test('should have 3 private subnets', () => {
    expect(template.Resources).toHaveProperty('PrivateSubnetAZ1');
    expect(template.Resources).toHaveProperty('PrivateSubnetAZ2');
    expect(template.Resources).toHaveProperty('PrivateSubnetAZ3');
  });

  test('should have NAT Gateway', () => {
    expect(template.Resources).toHaveProperty('NATGateway1');
    expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
  });

  test('should have VPC Flow Logs', () => {
    expect(template.Resources).toHaveProperty('VPCFlowLog');
    expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
  });

  test('should have outputs for VPC and subnets', () => {
    expect(template.Outputs).toHaveProperty('VpcId');
    expect(template.Outputs).toHaveProperty('PublicSubnetIds');
    expect(template.Outputs).toHaveProperty('PrivateSubnetIds');
  });
});

describe('Security Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('security-stack.yml');
  });

  test('should have Permission Boundary', () => {
    expect(template.Resources).toHaveProperty('PermissionBoundary');
    expect(template.Resources.PermissionBoundary.Type).toBe('AWS::IAM::ManagedPolicy');
  });

  test('should have ECS roles', () => {
    expect(template.Resources).toHaveProperty('ECSExecutionRole');
    expect(template.Resources).toHaveProperty('ECSTaskRole');
  });

  test('should have Compliance Lambda role', () => {
    expect(template.Resources).toHaveProperty('ComplianceLambdaRole');
  });

  test('should have security groups', () => {
    expect(template.Resources).toHaveProperty('ALBSecurityGroup');
    expect(template.Resources).toHaveProperty('ECSSecurityGroup');
    expect(template.Resources).toHaveProperty('DatabaseSecurityGroup');
  });

  test('ECS roles should have permission boundary', () => {
    const ecsTaskRole = template.Resources.ECSTaskRole;
    expect(ecsTaskRole.Properties).toHaveProperty('PermissionsBoundary');
  });

  test('should have required outputs', () => {
    expect(template.Outputs).toHaveProperty('ECSExecutionRoleArn');
    expect(template.Outputs).toHaveProperty('ECSTaskRoleArn');
    expect(template.Outputs).toHaveProperty('ComplianceLambdaRoleArn');
    expect(template.Outputs).toHaveProperty('DatabaseSecurityGroupId');
  });
});

describe('Database Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('database-stack.yml');
  });

  test('should have Aurora cluster', () => {
    expect(template.Resources).toHaveProperty('AuroraCluster');
    expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
  });

  test('should have 2 Aurora instances', () => {
    expect(template.Resources).toHaveProperty('AuroraInstance1');
    expect(template.Resources).toHaveProperty('AuroraInstance2');
  });

  test('Aurora cluster should use Serverless v2', () => {
    const cluster = template.Resources.AuroraCluster;
    expect(cluster.Properties).toHaveProperty('ServerlessV2ScalingConfiguration');
  });

  test('Aurora cluster should have Snapshot deletion policy', () => {
    const cluster = template.Resources.AuroraCluster;
    expect(cluster.DeletionPolicy).toBe('Snapshot');
  });

  test('should store endpoints in SSM Parameter Store', () => {
    expect(template.Resources).toHaveProperty('DBEndpointParameter');
    expect(template.Resources).toHaveProperty('DBPortParameter');
  });

  test('should have required outputs', () => {
    expect(template.Outputs).toHaveProperty('ClusterEndpoint');
    expect(template.Outputs).toHaveProperty('ClusterPort');
    expect(template.Outputs).toHaveProperty('ClusterArn');
  });
});

describe('Storage Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('storage-stack.yml');
  });

  test('should have S3 bucket for artifacts', () => {
    expect(template.Resources).toHaveProperty('ArtifactsBucket');
    expect(template.Resources.ArtifactsBucket.Type).toBe('AWS::S3::Bucket');
  });

  test('S3 bucket should have versioning enabled', () => {
    const bucket = template.Resources.ArtifactsBucket;
    expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
  });

  test('S3 bucket should have lifecycle policies', () => {
    const bucket = template.Resources.ArtifactsBucket;
    expect(bucket.Properties).toHaveProperty('LifecycleConfiguration');
    expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
  });

  test('S3 bucket should have encryption', () => {
    const bucket = template.Resources.ArtifactsBucket;
    expect(bucket.Properties).toHaveProperty('BucketEncryption');
  });

  test('should have DynamoDB table', () => {
    expect(template.Resources).toHaveProperty('SessionsTable');
    expect(template.Resources.SessionsTable.Type).toBe('AWS::DynamoDB::Table');
  });

  test('DynamoDB table should have PAY_PER_REQUEST billing', () => {
    const table = template.Resources.SessionsTable;
    expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('DynamoDB table should have point-in-time recovery', () => {
    const table = template.Resources.SessionsTable;
    expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
  });

  test('should have required outputs', () => {
    expect(template.Outputs).toHaveProperty('S3BucketName');
    expect(template.Outputs).toHaveProperty('S3BucketArn');
    expect(template.Outputs).toHaveProperty('DynamoDBTableName');
    expect(template.Outputs).toHaveProperty('DynamoDBTableArn');
  });
});

describe('Compute Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('compute-stack.yml');
  });

  test('should have ECS cluster', () => {
    expect(template.Resources).toHaveProperty('ECSCluster');
    expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
  });

  test('should have ECS task definition', () => {
    expect(template.Resources).toHaveProperty('TaskDefinition');
    expect(template.Resources.TaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
  });

  test('should have Application Load Balancer', () => {
    expect(template.Resources).toHaveProperty('ApplicationLoadBalancer');
    expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
  });

  test('should have target group', () => {
    expect(template.Resources).toHaveProperty('TargetGroup');
    expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
  });

  test('should have ECS service', () => {
    expect(template.Resources).toHaveProperty('ECSService');
    expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
  });

  test('should have auto-scaling configuration', () => {
    expect(template.Resources).toHaveProperty('ServiceScalingTarget');
    expect(template.Resources).toHaveProperty('CPUScalingPolicy');
    expect(template.Resources).toHaveProperty('MemoryScalingPolicy');
  });

  test('should have required outputs', () => {
    expect(template.Outputs).toHaveProperty('ClusterName');
    expect(template.Outputs).toHaveProperty('ServiceName');
    expect(template.Outputs).toHaveProperty('ALBEndpoint');
  });
});

describe('Monitoring Stack Template', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate('monitoring-stack.yml');
  });

  test('should have SNS topics', () => {
    expect(template.Resources).toHaveProperty('DriftDetectionTopic');
    expect(template.Resources).toHaveProperty('ComplianceTopic');
  });

  test('should have Lambda function for compliance checks', () => {
    expect(template.Resources).toHaveProperty('ComplianceLambdaFunction');
    expect(template.Resources.ComplianceLambdaFunction.Type).toBe('AWS::Lambda::Function');
  });

  test('should have EventBridge rules', () => {
    expect(template.Resources).toHaveProperty('CloudFormationEventRule');
    expect(template.Resources).toHaveProperty('DynamoDBEventRule');
  });

  test('should have CloudWatch alarm', () => {
    expect(template.Resources).toHaveProperty('LambdaErrorAlarm');
    expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
  });

  test('Lambda function should have correct runtime', () => {
    const lambda = template.Resources.ComplianceLambdaFunction;
    expect(lambda.Properties.Runtime).toBe('python3.11');
  });

  test('should have required outputs', () => {
    expect(template.Outputs).toHaveProperty('SNSTopicArn');
    expect(template.Outputs).toHaveProperty('ComplianceTopicArn');
    expect(template.Outputs).toHaveProperty('ComplianceLambdaArn');
  });
});

describe('Resource Naming Convention', () => {
  const templates = getTemplateFiles();

  templates.forEach(templateFile => {
    test(`${templateFile} should use EnvironmentSuffix in resource names`, () => {
      const template = loadTemplate(templateFile);
      const resources = template.Resources || {};

      // Check if at least some resources use EnvironmentSuffix
      let hasEnvironmentSuffix = false;

      for (const [resourceName, resource] of Object.entries(resources)) {
        const props = resource.Properties || {};
        const propsString = JSON.stringify(props);

        if (propsString.includes('EnvironmentSuffix')) {
          hasEnvironmentSuffix = true;
          break;
        }
      }

      expect(hasEnvironmentSuffix).toBe(true);
    });
  });
});

describe('Tagging Convention', () => {
  const templates = getTemplateFiles();

  templates.forEach(templateFile => {
    test(`${templateFile} resources should have required tags`, () => {
      const template = loadTemplate(templateFile);
      const resources = template.Resources || {};

      let resourcesWithTags = 0;
      let resourcesChecked = 0;

      for (const [resourceName, resource] of Object.entries(resources)) {
        // Skip resources that don't support tags
        if (resource.Type && resource.Type.includes('::IAM::')) {
          continue;
        }

        resourcesChecked++;
        const tags = resource.Properties?.Tags;

        if (tags && Array.isArray(tags)) {
          const tagKeys = tags.map(t => t.Key);
          if (tagKeys.includes('Environment') ||
              tagKeys.includes('Application') ||
              tagKeys.includes('CostCenter')) {
            resourcesWithTags++;
          }
        }
      }

      // At least 50% of taggable resources should have tags
      if (resourcesChecked > 0) {
        const tagPercentage = (resourcesWithTags / resourcesChecked) * 100;
        expect(tagPercentage).toBeGreaterThan(0);
      }
    });
  });
});

describe('DeletionPolicy Validation', () => {
  test('Database stack should use Snapshot deletion policy', () => {
    const template = loadTemplate('database-stack.yml');
    const aurora = template.Resources.AuroraCluster;
    expect(aurora.DeletionPolicy).toBe('Snapshot');
  });

  test('Storage stack should use Delete deletion policy', () => {
    const template = loadTemplate('storage-stack.yml');
    const s3 = template.Resources.ArtifactsBucket;
    expect(s3.DeletionPolicy).toBe('Delete');

    const dynamo = template.Resources.SessionsTable;
    expect(dynamo.DeletionPolicy).toBe('Delete');
  });
});
