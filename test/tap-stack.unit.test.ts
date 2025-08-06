import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Custom schema to handle CloudFormation tags
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ 'Ref': data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!Join', { kind: 'sequence', construct: (data) => ({ 'Fn::Join': data }) }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => ({ 'Fn::If': data }) }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => ({ 'Fn::Equals': data }) }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => ({ 'Fn::Not': data }) }),
  new yaml.Type('!FindInMap', { kind: 'sequence', construct: (data) => ({ 'Fn::FindInMap': data }) }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: (data) => ({ 'Fn::ImportValue': data }) }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) }),
  new yaml.Type('!Split', { kind: 'sequence', construct: (data) => ({ 'Fn::Split': data }) }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: (data) => ({ 'Fn::Base64': data }) }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: (data) => ({ 'Condition': data }) }),
]);

// CloudFormation template types
interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Metadata?: any;
  Parameters?: Record<string, Parameter>;
  Conditions?: Record<string, any>;
  Resources: Record<string, Resource>;
  Outputs?: Record<string, Output>;
}

interface Parameter {
  Type: string;
  Description?: string;
  Default?: any;
  AllowedValues?: any[];
  AllowedPattern?: string;
  MinLength?: number;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  ConstraintDescription?: string;
}

interface Resource {
  Type: string;
  Properties?: Record<string, any>;
  Condition?: string;
  DeletionPolicy?: string;
  UpdateReplacePolicy?: string;
  Metadata?: any;
}

interface Output {
  Description: string;
  Value: any;
  Export?: {
    Name: any;
  };
  Condition?: string;
}

describe('TapStack Unit Tests', () => {
  let template: CloudFormationTemplate;
  let templateString: string;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    templateString = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateString, { schema: CF_SCHEMA }) as CloudFormationTemplate;
  });

  describe('Template Structure Validation', () => {
    it('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have descriptive template description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'Secure financial application infrastructure'
      );
      expect(template.Description.length).toBeGreaterThan(10);
    });

    it('should have comprehensive metadata', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['SecurityCompliance']).toBeDefined();
      expect(template.Metadata.SecurityCompliance.Standards).toContain(
        'PCI-DSS'
      );
      expect(template.Metadata.SecurityCompliance.Standards).toContain('SOX');
      expect(template.Metadata.SecurityCompliance.Standards).toContain('GDPR');
    });

    it('should define all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    it('should have Environment parameter with allowed values', () => {
      const envParam = template.Parameters?.['Environment'];
      expect(envParam).toBeDefined();
      expect(envParam?.Type).toBe('String');
      expect(envParam?.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam?.Default).toBe('dev');
    });

    it('should have BucketNameSuffix parameter with validation', () => {
      const bucketParam = template.Parameters?.['BucketNameSuffix'];
      expect(bucketParam).toBeDefined();
      expect(bucketParam?.Type).toBe('String');
      expect(bucketParam?.MinLength).toBe(3);
      expect(bucketParam?.MaxLength).toBe(20);
      expect(bucketParam?.AllowedPattern).toBe('^[a-z0-9-]*$');
      expect(bucketParam?.ConstraintDescription).toContain('lowercase');
    });

    it('should have RetentionDays parameter with compliance defaults', () => {
      const retentionParam = template.Parameters?.['RetentionDays'];
      expect(retentionParam).toBeDefined();
      expect(retentionParam?.Type).toBe('Number');
      expect(retentionParam?.Default).toBe(2557); // 7 years
      expect(retentionParam?.MinValue).toBe(365); // Minimum 1 year
      expect(retentionParam?.MaxValue).toBe(3650); // Maximum 10 years
    });

    it('should have EnableMfaDelete parameter', () => {
      const mfaParam = template.Parameters?.['EnableMfaDelete'];
      expect(mfaParam).toBeDefined();
      expect(mfaParam?.Type).toBe('String');
      expect(mfaParam?.AllowedValues).toEqual(['true', 'false']);
      expect(mfaParam?.Default).toBe('true');
    });
  });

  describe('Conditions Validation', () => {
    it('should define IsProduction condition', () => {
      const isProduction = template.Conditions?.['IsProduction'];
      expect(isProduction).toBeDefined();
      expect(isProduction['Fn::Equals']).toEqual([
        { Ref: 'Environment' },
        'prod',
      ]);
    });

    it('should define EnableMfa condition', () => {
      const enableMfa = template.Conditions?.['EnableMfa'];
      expect(enableMfa).toBeDefined();
      expect(enableMfa['Fn::Equals']).toEqual([
        { Ref: 'EnableMfaDelete' },
        'true',
      ]);
    });
  });

  describe('S3 Bucket Resource Validation', () => {
    let s3Bucket: Resource;

    beforeAll(() => {
      s3Bucket = template.Resources['FinAppSecureDocuments'];
    });

    it('should define S3 bucket with correct type', () => {
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    it('should have dynamic bucket naming', () => {
      const bucketName = s3Bucket.Properties?.BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName['Fn::Sub']).toMatch(
        /finapp-documents-.*-\${AWS::AccountId}/
      );
    });

    it('should have encryption configuration', () => {
      const encryption = s3Bucket.Properties?.BucketEncryption;
      expect(encryption).toBeDefined();

      const sseConfig = encryption.ServerSideEncryptionConfiguration;
      expect(sseConfig).toBeDefined();
      expect(sseConfig[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(sseConfig[0].BucketKeyEnabled).toBe(true);
    });

    it('should block all public access', () => {
      const publicAccessBlock =
        s3Bucket.Properties?.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    it('should have versioning enabled', () => {
      const versioning = s3Bucket.Properties?.VersioningConfiguration;
      expect(versioning).toBeDefined();
      expect(versioning.Status).toBe('Enabled');
    });

    it('should have lifecycle configuration for compliance', () => {
      const lifecycle = s3Bucket.Properties?.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();

      // Find retention rule
      const retentionRule = lifecycle.Rules.find(
        (rule: any) => rule.Id === 'FinancialDocumentRetention'
      );
      expect(retentionRule).toBeDefined();
      expect(retentionRule.Status).toBe('Enabled');
      expect(retentionRule.ExpirationInDays).toEqual({ Ref: 'RetentionDays' });

      // Find storage transition rule
      const transitionRule = lifecycle.Rules.find(
        (rule: any) => rule.Id === 'StorageClassTransition'
      );
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions).toBeDefined();
      expect(transitionRule.Transitions.length).toBeGreaterThan(0);
    });

    it('should have proper resource tags', () => {
      const tags = s3Bucket.Properties?.Tags;
      expect(tags).toBeDefined();

      const tagMap = tags.reduce(
        (acc: Record<string, any>, tag: any) => ({
          ...acc,
          [tag.Key]: tag.Value,
        }),
        {}
      );

      expect(tagMap.Application).toBe('FinApp');
      expect(tagMap.DataClassification).toBe('Confidential');
      expect(tagMap.Compliance).toBe('Financial');
      expect(tagMap.BackupRequired).toBe('true');
    });

    it('should have retention policy', () => {
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('S3 Bucket Policy Validation', () => {
    let bucketPolicy: Resource;

    beforeAll(() => {
      bucketPolicy = template.Resources['FinAppBucketPolicy'];
    });

    it('should define bucket policy with correct type', () => {
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    it('should reference the correct bucket', () => {
      expect(bucketPolicy.Properties?.Bucket).toEqual({
        Ref: 'FinAppSecureDocuments',
      });
    });

    it('should have security statements', () => {
      const policyDocument = bucketPolicy.Properties?.PolicyDocument;
      expect(policyDocument).toBeDefined();
      expect(policyDocument.Version).toBe('2012-10-17');
      expect(policyDocument.Statement).toBeDefined();

      const statements = policyDocument.Statement;

      // Check HTTPS enforcement statement
      const httpsStatement = statements.find(
        (stmt: any) => stmt.Sid === 'DenyHTTPRequests'
      );
      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe(
        'false'
      );

      // Check encryption enforcement statement
      const encryptionStatement = statements.find(
        (stmt: any) => stmt.Sid === 'DenyUnencryptedUploads'
      );
      expect(encryptionStatement).toBeDefined();
      expect(encryptionStatement.Effect).toBe('Deny');
      expect(encryptionStatement.Action).toBe('s3:PutObject');

      // Check public ACL denial statement
      const aclStatement = statements.find(
        (stmt: any) => stmt.Sid === 'DenyPublicACLs'
      );
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Effect).toBe('Deny');
      expect(aclStatement.Action).toContain('s3:PutBucketAcl');
    });
  });

  describe('IAM Role Resource Validation', () => {
    let iamRole: Resource;

    beforeAll(() => {
      iamRole = template.Resources['FinAppS3AccessRole'];
    });

    it('should define IAM role with correct type', () => {
      expect(iamRole).toBeDefined();
      expect(iamRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have dynamic role naming', () => {
      const roleName = iamRole.Properties?.RoleName;
      expect(roleName).toBeDefined();
      expect(roleName['Fn::Sub']).toMatch(/FinApp-S3Access-.*-\${AWS::Region}/);
    });

    it('should have trust policy for EC2 and Lambda', () => {
      const assumeRolePolicy = iamRole.Properties?.AssumeRolePolicyDocument;
      expect(assumeRolePolicy).toBeDefined();
      expect(assumeRolePolicy.Version).toBe('2012-10-17');

      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('sts:AssumeRole');
      expect(statement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    it('should have least-privilege inline policies', () => {
      const policies = iamRole.Properties?.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBe(1);

      const policy = policies[0];
      expect(policy.PolicyName).toBe('S3DocumentAccessPolicy');

      const policyDocument = policy.PolicyDocument;
      expect(policyDocument.Version).toBe('2012-10-17');

      const statements = policyDocument.Statement;

      // Check bucket listing permissions
      const listingStatement = statements.find(
        (stmt: any) => stmt.Sid === 'AllowBucketListing'
      );
      expect(listingStatement).toBeDefined();
      expect(listingStatement.Effect).toBe('Allow');
      expect(listingStatement.Action).toContain('s3:ListBucket');

      // Check object operations
      const objectStatement = statements.find(
        (stmt: any) => stmt.Sid === 'AllowObjectOperations'
      );
      expect(objectStatement).toBeDefined();
      expect(objectStatement.Effect).toBe('Allow');
      expect(objectStatement.Action).toContain('s3:GetObject');
      expect(objectStatement.Action).toContain('s3:PutObject');

      // Check explicit denies
      const denyStatement = statements.find(
        (stmt: any) => stmt.Sid === 'DenyDangerousOperations'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('s3:DeleteBucket*');
    });

    it('should have proper resource tags', () => {
      const tags = iamRole.Properties?.Tags;
      expect(tags).toBeDefined();

      const tagMap = tags.reduce(
        (acc: Record<string, any>, tag: any) => ({
          ...acc,
          [tag.Key]: tag.Value,
        }),
        {}
      );

      expect(tagMap.Application).toBe('FinApp');
      expect(tagMap.Purpose).toBe('S3DocumentAccess');
      expect(tagMap.SecurityLevel).toBe('LeastPrivilege');
    });
  });

  describe('Instance Profile Resource Validation', () => {
    let instanceProfile: Resource;

    beforeAll(() => {
      instanceProfile = template.Resources['FinAppInstanceProfile'];
    });

    it('should define instance profile with correct type', () => {
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    it('should reference the IAM role', () => {
      expect(instanceProfile.Properties?.Roles).toEqual([
        { Ref: 'FinAppS3AccessRole' },
      ]);
    });

    it('should have dynamic naming', () => {
      const profileName = instanceProfile.Properties?.InstanceProfileName;
      expect(profileName).toBeDefined();
      expect(profileName['Fn::Sub']).toMatch(/FinApp-InstanceProfile-.*/);
    });
  });

  describe('CloudTrail Resource Validation', () => {
    let cloudTrail: Resource;

    beforeAll(() => {
      cloudTrail = template.Resources['FinAppCloudTrail'];
    });

    it('should define CloudTrail with production condition', () => {
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Condition).toBe('IsProduction');
    });

    it('should have proper trail configuration', () => {
      const properties = cloudTrail.Properties;
      expect(properties?.IncludeGlobalServiceEvents).toBe(true);
      expect(properties?.IsLogging).toBe(true);
      expect(properties?.IsMultiRegionTrail).toBe(true);
      expect(properties?.EnableLogFileValidation).toBe(true);
    });

    it('should have S3-focused event selectors', () => {
      const eventSelectors = cloudTrail.Properties?.EventSelectors;
      expect(eventSelectors).toBeDefined();
      expect(eventSelectors[0].ReadWriteType).toBe('All');
      expect(eventSelectors[0].IncludeManagementEvents).toBe(true);

      const dataResources = eventSelectors[0].DataResources;
      expect(dataResources).toBeDefined();
      expect(dataResources.length).toBe(1);

      // Check S3 object events
      const objectResource = dataResources.find(
        (resource: any) => resource.Type === 'AWS::S3::Object'
      );
      expect(objectResource).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    it('should have comprehensive S3 outputs', () => {
      const outputs = template.Outputs!;

      expect(outputs['S3BucketName']).toBeDefined();
      expect(outputs['S3BucketName'].Export?.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-S3Bucket'
      );

      expect(outputs['S3BucketArn']).toBeDefined();
      expect(outputs['S3BucketDomainName']).toBeDefined();
      expect(outputs['S3BucketEndpoint']).toBeDefined();
    });

    it('should have IAM role outputs', () => {
      const outputs = template.Outputs!;

      expect(outputs['IAMRoleName']).toBeDefined();
      expect(outputs['IAMRoleArn']).toBeDefined();
      expect(outputs['InstanceProfileArn']).toBeDefined();
    });

    it('should have security configuration outputs', () => {
      const outputs = template.Outputs!;

      expect(outputs['EncryptionMethod']).toBeDefined();
      expect(outputs['EncryptionMethod'].Value).toBe('SSE-S3 (AES-256)');

      expect(outputs['PublicAccessBlocked']).toBeDefined();
      expect(outputs['PublicAccessBlocked'].Value).toBe(
        'All public access blocked'
      );
    });

    it('should have compliance outputs', () => {
      const outputs = template.Outputs!;

      expect(outputs['RetentionPeriod']).toBeDefined();
      expect(outputs['ComplianceStandards']).toBeDefined();
      expect(outputs['ComplianceStandards'].Value).toBe('PCI-DSS, SOX, GDPR');
    });

    it('should export key resources for cross-stack references', () => {
      const outputs = template.Outputs!;

      // Check that critical resources are exported
      expect(outputs['S3BucketName'].Export).toBeDefined();
      expect(outputs['S3BucketArn'].Export).toBeDefined();
      expect(outputs['IAMRoleArn'].Export).toBeDefined();
    });
  });

  describe('Security Best Practices Validation', () => {
    it('should not contain hardcoded secrets or credentials', () => {
      const templateContent = templateString.toLowerCase();

      // Check for common patterns that might indicate hardcoded credentials
      expect(templateContent).not.toMatch(/password.*:/);
      expect(templateContent).not.toMatch(/secret.*:/);
      expect(templateContent).not.toMatch(/api.*key.*:/);
      expect(templateContent).not.toMatch(/access.*key.*:/);
      expect(templateContent).not.toMatch(/akia[a-z0-9]{16}/i); // AWS access key pattern
    });

    it('should use intrinsic functions for dynamic values', () => {
      const resources = template.Resources;

      // Check that resource names use dynamic references
      const s3Bucket = resources['FinAppSecureDocuments'];
      expect(s3Bucket.Properties?.BucketName).toHaveProperty('Fn::Sub');

      const iamRole = resources['FinAppS3AccessRole'];
      expect(iamRole.Properties?.RoleName).toHaveProperty('Fn::Sub');
    });

    it('should use conditions for environment-specific resources', () => {
      const cloudTrail = template.Resources['FinAppCloudTrail'];
      expect(cloudTrail.Condition).toBe('IsProduction');

      const auditLogsBucket = template.Resources['FinAppAuditLogsBucket'];
      expect(auditLogsBucket.Condition).toBe('IsProduction');
    });

    it('should have appropriate deletion policies for data resources', () => {
      const s3Bucket = template.Resources['FinAppSecureDocuments'];
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('Template Size and Complexity', () => {
    it('should be within CloudFormation size limits', () => {
      const templateSize = Buffer.byteLength(templateString, 'utf8');
      expect(templateSize).toBeLessThan(1024 * 1024); // 1MB limit
    });

    it('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(3); // At least S3, IAM role, bucket policy
      expect(resourceCount).toBeLessThan(200); // CloudFormation limit
    });

    it('should have well-documented parameters', () => {
      const parameters = template.Parameters!;

      Object.values(parameters).forEach(param => {
        expect(param.Description).toBeDefined();
        expect(param.Description!.length).toBeGreaterThan(10);
      });
    });

    it('should have descriptive outputs', () => {
      const outputs = template.Outputs!;

      Object.values(outputs).forEach(output => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Naming Convention Validation', () => {
    it('should follow FinApp naming convention for resources', () => {
      const resourceNames = Object.keys(template.Resources);

      resourceNames.forEach(resourceName => {
        expect(resourceName).toMatch(/^FinApp/);
      });
    });

    it('should use consistent naming patterns', () => {
      const resourceNames = Object.keys(template.Resources);

      // Check for consistent CamelCase pattern
      resourceNames.forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
        expect(resourceName).not.toMatch(/[-_]/); // No hyphens or underscores in logical IDs
      });
    });

    it('should use descriptive resource logical IDs', () => {
      const resources = template.Resources;

      expect(resources['FinAppSecureDocuments']).toBeDefined();
      expect(resources['FinAppBucketPolicy']).toBeDefined();
      expect(resources['FinAppS3AccessRole']).toBeDefined();
      expect(resources['FinAppInstanceProfile']).toBeDefined();
    });
  });

  describe('Edge Case Validation', () => {
    it('should handle empty or invalid parameter values gracefully', () => {
      // The template should have proper validation constraints
      const bucketParam = template.Parameters!['BucketNameSuffix'];
      expect(bucketParam.MinLength).toBe(3); // Prevents empty values
      expect(bucketParam.AllowedPattern).toBeDefined(); // Validates format

      const retentionParam = template.Parameters!['RetentionDays'];
      expect(retentionParam.MinValue).toBe(365); // Ensures compliance minimum
    });

    it('should use proper IAM resource referencing', () => {
      const bucketPolicy = template.Resources['FinAppBucketPolicy'];
      const policyStatements =
        bucketPolicy.Properties?.PolicyDocument.Statement;

      // Check that bucket ARN is properly constructed
      policyStatements.forEach((statement: any) => {
        if (statement.Resource) {
          const resources = Array.isArray(statement.Resource)
            ? statement.Resource
            : [statement.Resource];
          resources.forEach((resource: any) => {
            if (typeof resource === 'object' && resource['Fn::Sub']) {
              expect(resource['Fn::Sub']).toMatch(/\${FinAppSecureDocuments}/);
            }
          });
        }
      });
    });

    it('should handle conditional resource dependencies', () => {
      const conditionalResources = Object.entries(template.Resources)
        .filter(([_, resource]) => resource.Condition)
        .map(([name, resource]) => ({ name, condition: resource.Condition }));

      // Verify conditional resources exist and have valid conditions
      expect(conditionalResources.length).toBeGreaterThan(0);
      conditionalResources.forEach(({ condition }) => {
        expect(template.Conditions![condition!]).toBeDefined();
      });
    });
  });
});
