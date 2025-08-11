import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

// Custom YAML schema to handle CloudFormation intrinsic functions
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: function(data) {
      return { Ref: data };
    }
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: function(data) {
      return { 'Fn::GetAtt': data.split('.') };
    }
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: function(data) {
      return { 'Fn::Sub': data };
    }
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: function(data) {
      return { 'Fn::Join': data };
    }
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: function(data) {
      return { 'Fn::Select': data };
    }
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: function(data) {
      return { 'Fn::GetAZs': data };
    }
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: function(data) {
      return { 'Fn::Equals': data };
    }
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: function(data) {
      return { 'Fn::If': data };
    }
  })
]);

export interface TemplateResource {
  Type: string;
  Properties?: Record<string, any>;
  DeletionPolicy?: string;
  UpdateReplacePolicy?: string;
  DependsOn?: string | string[];
  Metadata?: Record<string, any>;
  Condition?: string;
}

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, TemplateResource>;
  Outputs?: Record<string, any>;
  Metadata?: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;
  private templatePath: string;

  constructor(templatePath: string) {
    this.templatePath = templatePath;
    const content = fs.readFileSync(templatePath, 'utf8');
    this.template = yaml.load(content, { schema: CF_SCHEMA }) as CloudFormationTemplate;
  }

  getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  validateHIPAACompliance(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check KMS encryption on all relevant resources
    const kmsResources = this.getResourcesByType('AWS::S3::Bucket');
    kmsResources.forEach((name, resource) => {
      const encryption = resource.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0];
      if (!encryption || encryption.ServerSideEncryptionByDefault?.SSEAlgorithm !== 'aws:kms') {
        errors.push(`S3 bucket ${name} missing KMS encryption`);
      }
    });

    // Check RDS encryption
    const rdsResources = this.getResourcesByType('AWS::RDS::DBInstance');
    rdsResources.forEach((name, resource) => {
      if (resource.Properties?.StorageEncrypted !== true) {
        errors.push(`RDS instance ${name} missing storage encryption`);
      }
    });

    // Check Secrets Manager usage
    const secretsCount = Array.from(this.getResourcesByType('AWS::SecretsManager::Secret')).length;
    if (secretsCount < 2) {
      errors.push('Expected at least 2 Secrets Manager secrets for credentials');
    }

    // Check CloudWatch Logs encryption
    const logGroups = this.getResourcesByType('AWS::Logs::LogGroup');
    logGroups.forEach((name, resource) => {
      if (!resource.Properties?.KmsKeyId) {
        errors.push(`CloudWatch Log Group ${name} missing KMS encryption`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validateNoRetainPolicies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    Object.entries(this.template.Resources).forEach(([name, resource]) => {
      if (resource.DeletionPolicy === 'Retain') {
        errors.push(`Resource ${name} has Retain DeletionPolicy (not allowed)`);
      }
      if (resource.UpdateReplacePolicy === 'Retain') {
        errors.push(`Resource ${name} has Retain UpdateReplacePolicy (not allowed)`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validateRequiredTags(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredTags = { Project: 'HealthApp', Environment: 'Production' };

    Object.entries(this.template.Resources).forEach(([name, resource]) => {
      const tags = resource.Properties?.Tags;
      if (tags && Array.isArray(tags)) {
        const tagMap = new Map(tags.map((t: any) => [t.Key, t.Value]));
        
        Object.entries(requiredTags).forEach(([key, value]) => {
          const actualValue = tagMap.get(key);
          if (!actualValue) {
            errors.push(`Resource ${name} missing required tag ${key}`);
          } else if (actualValue !== value && key === 'Environment') {
            // Environment should be 'Production', not a reference
            if (typeof actualValue === 'object' && actualValue['Ref']) {
              errors.push(`Resource ${name} has Environment tag referencing parameter instead of 'Production'`);
            }
          }
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validateEnvironmentSuffix(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check S3 bucket names
    const s3Buckets = this.getResourcesByType('AWS::S3::Bucket');
    s3Buckets.forEach((name, resource) => {
      const bucketName = resource.Properties?.BucketName;
      if (bucketName && typeof bucketName === 'object') {
        const subValue = bucketName['Fn::Sub'] || bucketName['!Sub'];
        if (!subValue || !subValue.includes('${EnvironmentSuffix}')) {
          errors.push(`S3 bucket ${name} missing EnvironmentSuffix in name`);
        }
      }
    });

    // Check RDS instance identifier
    const rdsInstances = this.getResourcesByType('AWS::RDS::DBInstance');
    rdsInstances.forEach((name, resource) => {
      const identifier = resource.Properties?.DBInstanceIdentifier;
      if (identifier && typeof identifier === 'object') {
        const subValue = identifier['Fn::Sub'] || identifier['!Sub'];
        if (!subValue || !subValue.includes('${EnvironmentSuffix}')) {
          errors.push(`RDS instance ${name} missing EnvironmentSuffix in identifier`);
        }
      }
    });

    // Check IAM role names
    const iamRoles = this.getResourcesByType('AWS::IAM::Role');
    iamRoles.forEach((name, resource) => {
      const roleName = resource.Properties?.RoleName;
      if (roleName && typeof roleName === 'object') {
        const subValue = roleName['Fn::Sub'] || roleName['!Sub'];
        if (!subValue || !subValue.includes('${EnvironmentSuffix}')) {
          errors.push(`IAM role ${name} missing EnvironmentSuffix in name`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validatePublicAccessBlock(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const s3Buckets = this.getResourcesByType('AWS::S3::Bucket');
    s3Buckets.forEach((name, resource) => {
      const pab = resource.Properties?.PublicAccessBlockConfiguration;
      if (!pab) {
        errors.push(`S3 bucket ${name} missing PublicAccessBlockConfiguration`);
      } else {
        if (pab.BlockPublicAcls !== true) errors.push(`S3 bucket ${name} BlockPublicAcls not true`);
        if (pab.BlockPublicPolicy !== true) errors.push(`S3 bucket ${name} BlockPublicPolicy not true`);
        if (pab.IgnorePublicAcls !== true) errors.push(`S3 bucket ${name} IgnorePublicAcls not true`);
        if (pab.RestrictPublicBuckets !== true) errors.push(`S3 bucket ${name} RestrictPublicBuckets not true`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validateOutputs(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredOutputs = [
      'VPCId',
      'PrivateSubnetIds',
      'PublicSubnetIds',
      'DatabaseEndpoint',
      'KMSKeyId',
      'PatientDataBucket',
      'LogsBucket',
      'DatabaseSecretArn',
      'ApplicationAPISecretArn',
      'ApplicationRoleArn',
      'ApplicationSecurityGroupId',
      'LoadBalancerSecurityGroupId'
    ];

    requiredOutputs.forEach(output => {
      if (!this.template.Outputs || !this.template.Outputs[output]) {
        errors.push(`Missing required output: ${output}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  private getResourcesByType(type: string): Map<string, TemplateResource> {
    const resources = new Map<string, TemplateResource>();
    
    Object.entries(this.template.Resources).forEach(([name, resource]) => {
      if (resource.Type === type) {
        resources.set(name, resource);
      }
    });

    return resources;
  }

  validateAll(): { valid: boolean; results: Record<string, { valid: boolean; errors: string[] }> } {
    const results = {
      hipaaCompliance: this.validateHIPAACompliance(),
      noRetainPolicies: this.validateNoRetainPolicies(),
      requiredTags: this.validateRequiredTags(),
      environmentSuffix: this.validateEnvironmentSuffix(),
      publicAccessBlock: this.validatePublicAccessBlock(),
      outputs: this.validateOutputs()
    };

    const valid = Object.values(results).every(r => r.valid);
    return { valid, results };
  }
}

export default TemplateValidator;