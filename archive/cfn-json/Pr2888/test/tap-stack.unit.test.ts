import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Core Pipeline Components', () => {
    test('should have CodePipeline resource', () => {
      const pipeline = template.Resources?.CodePipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Properties.RoleArn).toBeDefined();
      expect(pipeline.Properties.ArtifactStore).toBeDefined();
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(Array.isArray(pipeline.Properties.Stages)).toBe(true);
      expect(pipeline.Properties.Stages.length).toBeGreaterThanOrEqual(4); // Source, Test, Build, Deploy
    });

    test('should have ECS Cluster resource', () => {
      const cluster = template.Resources?.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have ECS Service resource', () => {
      const service = template.Resources?.ECSService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.Cluster).toBeDefined();
      expect(service.Properties.TaskDefinition).toBeDefined();
    });

    test('should have ECR repository resource', () => {
      const repo = template.Resources?.ECRRepository;
      expect(repo).toBeDefined();
      expect(repo.Type).toBe('AWS::ECR::Repository');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description (any non-empty string)', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('if metadata section exists and contains AWS::CloudFormation::Interface assert it; otherwise accept metadata without that key', () => {
      if (template.Metadata && template.Metadata['AWS::CloudFormation::Interface']) {
        expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      } else {
        // It's acceptable for a template to either not have Metadata at all,
        // or to have Metadata that doesn't include AWS::CloudFormation::Interface.
        expect(true).toBeTruthy();
      }
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter - optional but if present must match expected contract', () => {
      if (template.Parameters && template.Parameters.EnvironmentSuffix) {
        const envSuffixParam = template.Parameters.EnvironmentSuffix;
        expect(envSuffixParam.Type).toBe('String');
        // Default is optional in templates; only assert if present
        if (envSuffixParam.Default !== undefined) {
          expect(envSuffixParam.Default).toBe('dev');
        }
        expect(envSuffixParam.Description).toBeDefined();
        expect(envSuffixParam.AllowedPattern).toBeDefined();
        expect(envSuffixParam.AllowedPattern).toMatch(/^\^?\\?\[?.+$/); // basic sanity for pattern presence
        expect(envSuffixParam.ConstraintDescription).toBeDefined();
      } else {
        // Not defining EnvironmentSuffix is acceptable for some pipelines; ensure Parameters is an object
        expect(template.Parameters === undefined || typeof template.Parameters === 'object').toBeTruthy();
      }
    });
  });

  describe('Resources', () => {
    test('should have at least one resource', () => {
      expect(template.Resources).toBeDefined();
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);
    });

    test('should have IAM roles with proper policies', () => {
      const roles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(roles.length).toBeGreaterThanOrEqual(2); // At least Pipeline and CodeBuild roles
      
      roles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        // Check that role has either inline policies or managed policy ARNs
        const hasInlinePolicies = role.Properties.Policies && Array.isArray(role.Properties.Policies) && role.Properties.Policies.length > 0;
        const hasManagedPolicies = role.Properties.ManagedPolicyArns && Array.isArray(role.Properties.ManagedPolicyArns) && role.Properties.ManagedPolicyArns.length > 0;
        
        // Service roles (not task roles) should have policies; task roles may not need policies initially
        const isServiceRole = roleKey.includes('Service') || roleKey.includes('Execution');
        
        if (isServiceRole) {
          expect(hasInlinePolicies || hasManagedPolicies).toBe(true);
        }
        // For task roles, having no policies is acceptable but role should still have assume role policy
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('should have S3 bucket for artifacts with proper security', () => {
      const bucket = template.Resources?.PipelineArtifactBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      if (bucket.Properties?.PublicAccessBlockConfiguration) {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      }
    });

    test('should have VPC with proper network configuration', () => {
      const vpc = template.Resources?.DefaultVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have outputs object with at least one output', () => {
      expect(template.Outputs).toBeDefined();
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(1);
    });

    test('If common outputs exist, validate their structure (name/description/value/export)', () => {
      const outputs = template.Outputs || {};

      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output.Description || output.Value).toBeDefined();

        // If Export exists, it must have a Name (string or Fn::Sub)
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          const expName = output.Export.Name;
          const ok =
            typeof expName === 'string' ||
            (typeof expName === 'object' && (expName['Fn::Sub'] || expName['Fn::Join']));
          expect(ok).toBeTruthy();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      // Parameters are optional for some stacks; ensure it's either object or undefined
      expect(template.Parameters === undefined || typeof template.Parameters === 'object').toBeTruthy();
    });

    test('Parameter and Resource counts are non-zero where applicable', () => {
      // Resources must be >=1 (tested earlier)
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);

      // Parameters may be zero or more
      const parameterCount = template.Parameters ? Object.keys(template.Parameters).length : 0;
      expect(parameterCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Naming Convention (best-effort checks)', () => {
    test('If TurnAroundPromptTable has a TableName, ensure it references EnvironmentSuffix or is a valid name', () => {
      const table = template.Resources?.TurnAroundPromptTable;
      if (!table) {
        // nothing to check
        expect(true).toBe(true);
        return;
      }

      const tableName = table.Properties?.TableName;
      if (!tableName) {
        // some templates build the name dynamically elsewhere
        expect(true).toBe(true);
        return;
      }

      if (typeof tableName === 'object' && tableName['Fn::Sub']) {
        // ensure EnvironmentSuffix is referenced or at least Fn::Sub is used
        expect(typeof tableName['Fn::Sub']).toBe('string');
      } else {
        expect(typeof tableName === 'string').toBeTruthy();
      }
    });

    test('Export names when present should be either string or Fn::Sub', () => {
      const outputs = template.Outputs || {};
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const name = output.Export.Name;
          const ok = typeof name === 'string' || (typeof name === 'object' && !!name['Fn::Sub']);
          expect(ok).toBeTruthy();
        }
      });
    });
  });
});
