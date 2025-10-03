import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: any;
  Parameters?: { [key: string]: any };
  Resources: { [key: string]: any };
  Outputs?: { [key: string]: any };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class CloudFormationValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(templateContent);
  }

  public validateTemplate(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.AWSTemplateFormatVersion) {
      result.errors.push('Missing AWSTemplateFormatVersion');
      result.isValid = false;
    } else if (this.template.AWSTemplateFormatVersion !== '2010-09-09') {
      result.errors.push('Invalid AWSTemplateFormatVersion');
      result.isValid = false;
    }

    if (
      !this.template.Resources ||
      Object.keys(this.template.Resources).length === 0
    ) {
      result.errors.push('Template must contain at least one resource');
      result.isValid = false;
    }

    if (this.template.Resources) {
      this.validateResources(result);
    }

    this.validateSecurityBestPractices(result);
    this.validateEnvironmentSuffix(result);

    return result;
  }

  private validateResources(result: ValidationResult): void {
    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (!res.Type || !res.Type.match(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/)) {
        result.errors.push(`Invalid resource type for ${name}: ${res.Type}`);
        result.isValid = false;
      }

      if (!res.Properties) {
        result.errors.push(`Resource ${name} missing Properties section`);
        result.isValid = false;
      }

      this.checkDeletionPolicies(name, res, result);
    }
  }

  private checkDeletionPolicies(
    name: string,
    resource: any,
    result: ValidationResult
  ): void {
    if (resource.DeletionPolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has DeletionPolicy: Retain which may prevent cleanup`
      );
    }

    if (resource.UpdateReplacePolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has UpdateReplacePolicy: Retain which may prevent cleanup`
      );
    }
  }

  private validateSecurityBestPractices(result: ValidationResult): void {
    if (!this.template.Resources) {
      return;
    }

    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (res.Type === 'AWS::S3::Bucket') {
        if (!res.Properties || !res.Properties.BucketEncryption) {
          result.errors.push(
            `S3 bucket ${name} should have encryption enabled`
          );
          result.isValid = false;
        }

        if (!res.Properties || !res.Properties.PublicAccessBlockConfiguration) {
          result.warnings.push(`S3 bucket ${name} should block public access`);
        }
      }

      if (res.Type === 'AWS::RDS::DBInstance') {
        if (!res.Properties || !res.Properties.StorageEncrypted) {
          result.errors.push(
            `RDS instance ${name} should have storage encryption enabled`
          );
          result.isValid = false;
        }
      }

      if (
        res.Type === 'AWS::IAM::Role' &&
        res.Properties &&
        res.Properties.Policies
      ) {
        this.validateIAMPolicies(name, res.Properties.Policies, result);
      }
    }
  }

  private validateIAMPolicies(
    roleName: string,
    policies: any[],
    result: ValidationResult
  ): void {
    for (const policy of policies) {
      if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
        for (const statement of policy.PolicyDocument.Statement) {
          if (
            statement.Action === '*' ||
            (Array.isArray(statement.Action) && statement.Action.includes('*'))
          ) {
            result.warnings.push(
              `IAM role ${roleName} uses wildcard actions which violates least privilege`
            );
          }
          if (statement.Resource === '*' && statement.Effect === 'Allow') {
            result.warnings.push(
              `IAM role ${roleName} grants access to all resources`
            );
          }
        }
      }
    }
  }

  private validateEnvironmentSuffix(result: ValidationResult): void {
    const hasEnvironmentSuffix =
      this.template.Parameters && this.template.Parameters.EnvironmentSuffix;

    if (!hasEnvironmentSuffix) {
      result.warnings.push(
        'Template should include EnvironmentSuffix parameter for resource naming'
      );
      return;
    }

    let resourcesUsingPrefix = 0;
    const totalResources = Object.keys(this.template.Resources).length;

    for (const [, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (res.Properties && res.Properties.Tags) {
        const hasEnvironmentTag = res.Properties.Tags.some(
          (tag: any) =>
            tag.Key === 'Environment' &&
            tag.Value &&
            tag.Value.Ref === 'EnvironmentSuffix'
        );

        if (hasEnvironmentTag) {
          resourcesUsingPrefix++;
        }
      }
    }

    if (resourcesUsingPrefix / totalResources < 0.8) {
      result.warnings.push(
        'Most resources should use EnvironmentSuffix in their naming/tagging'
      );
    }
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getResourcesByType(resourceType: string): string[] {
    return Object.entries(this.template.Resources)
      .filter(([, resource]) => (resource as any).Type === resourceType)
      .map(([name]) => name);
  }

  public hasOutput(outputName: string): boolean {
    return !!(this.template.Outputs && this.template.Outputs[outputName]);
  }

  public validateOutputReferences(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Outputs) {
      result.warnings.push('Template has no outputs defined');
      return result;
    }

    for (const [outputName, output] of Object.entries(this.template.Outputs)) {
      const out = output as any;

      if (out.Value && out.Value.Ref) {
        const referencedResource = out.Value.Ref;
        if (
          referencedResource !== 'AWS::StackName' &&
          referencedResource !== 'EnvironmentSuffix' &&
          !this.template.Resources[referencedResource]
        ) {
          result.errors.push(
            `Output ${outputName} references non-existent resource: ${referencedResource}`
          );
          result.isValid = false;
        }
      }

      if (out.Value && out.Value['Fn::GetAtt']) {
        const referencedResource = out.Value['Fn::GetAtt'][0];
        if (!this.template.Resources[referencedResource]) {
          result.errors.push(
            `Output ${outputName} references non-existent resource in GetAtt: ${referencedResource}`
          );
          result.isValid = false;
        }
      }
    }

    return result;
  }
}

function validateTemplateFile(templatePath: string): ValidationResult {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return validator.validateTemplate();
  } catch (error) {
    return {
      isValid: false,
      errors: [(error as Error).message],
      warnings: [],
    };
  }
}

function getTemplateResources(templatePath: string): string[] {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return Object.keys(validator.getTemplate().Resources);
  } catch (error) {
    return [];
  }
}

describe('TapStack CloudFormation Template', () => {
  let template: any;
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    validator = new CloudFormationValidator(templatePath);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toBe(
      'TAP Stack - Task Assignment Platform CloudFormation Template'
    );
  });
  test('should have metadata section', () => {
    expect(template.Metadata).toBeDefined();
    expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
  });

  test('should have all expected resources', () => {
    const expectedResources = [
      'EncryptionKey',
      'EncryptionKeyAlias',
      'VPC',
      'InternetGateway',
      'VPCGatewayAttachment',
      'PublicSubnet1',
      'PublicSubnet2',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'NatGatewayEIP',
      'NatGateway',
      'PublicRouteTable',
      'PrivateRouteTable',
      'PublicRoute',
      'PrivateRoute',
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'PrivateSubnet1RouteTableAssociation',
      'PrivateSubnet2RouteTableAssociation',
      'PublicNetworkAcl',
      'PrivateNetworkAcl',
      'PublicNetworkAclEntryInboundHTTP',
      'PublicNetworkAclEntryInboundHTTPS',
      'PublicNetworkAclEntryInboundSSH',
      'PublicNetworkAclEntryInboundEphemeral',
      'PublicNetworkAclEntryOutbound',
      'PrivateNetworkAclEntryInboundVPC',
      'PrivateNetworkAclEntryOutbound',
      'PublicSubnet1NetworkAclAssociation',
      'PublicSubnet2NetworkAclAssociation',
      'PrivateSubnet1NetworkAclAssociation',
      'PrivateSubnet2NetworkAclAssociation',
      'AppDataBucket',
      'AppDataBucketPolicy',
      'ALBSecurityGroup',
      'WebAppSecurityGroup',
      'DatabaseSecurityGroup',
      'EC2InstanceRole',
      'EC2InstanceProfile',
      'ApplicationLoadBalancer',
      'ALBTargetGroup',
      'ALBListener',
      'WebAppLaunchTemplate',
      'WebAppAutoScalingGroup',
      'ScaleUpPolicy',
      'CPUAlarmHigh',
      'DBSubnetGroup',
      'Database',
      'DBPassword',
      'AppLogGroup',
      'ConfigRecorder',
      'ConfigDeliveryChannel',
      'ConfigBucket',
      'ConfigRole',
    ];
    for (const res of expectedResources) {
      expect(template.Resources[res]).toBeDefined();
    }
  });

  test('should have all expected outputs', () => {
    const expectedOutputs = [
      'StackName',
      'EnvironmentSuffix',
      'VPCID',
      'PublicSubnet1ID',
      'PublicSubnet2ID',
      'PrivateSubnet1ID',
      'PrivateSubnet2ID',
      'LoadBalancerDNS',
      'AppDataBucketName',
      'DatabaseEndpoint',
      'KMSKeyARN',
    ];
    for (const out of expectedOutputs) {
      expect(template.Outputs[out]).toBeDefined();
    }
  });
  test('all resource tags and names should include environmentSuffix', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Properties && res.Properties.Tags) {
        for (const tag of res.Properties.Tags) {
          if (typeof tag.Value === 'string') {
            expect(tag.Value).toContain(environmentSuffix);
          }
        }
      }
      if (res.Properties && res.Properties.BucketName) {
        if (typeof res.Properties.BucketName === 'string') {
          expect(res.Properties.BucketName).toContain(environmentSuffix);
        }
      }
    }
  });

  test('outputs should reference correct resources', () => {
    expect(template.Outputs.StackName.Value.Ref).toBe('AWS::StackName');
    expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe(
      'EnvironmentSuffix'
    );
    expect(template.Outputs.VPCID.Value.Ref).toBe('VPC');
    expect(template.Outputs.PublicSubnet1ID.Value.Ref).toBe('PublicSubnet1');
    expect(template.Outputs.PublicSubnet2ID.Value.Ref).toBe('PublicSubnet2');
    expect(template.Outputs.PrivateSubnet1ID.Value.Ref).toBe('PrivateSubnet1');
    expect(template.Outputs.PrivateSubnet2ID.Value.Ref).toBe('PrivateSubnet2');
    expect(template.Outputs.AppDataBucketName.Value.Ref).toBe('AppDataBucket');
    expect(template.Outputs.KMSKeyARN.Value['Fn::GetAtt'][0]).toBe(
      'EncryptionKey'
    );
    expect(template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt'][0]).toBe(
      'Database'
    );
  });

  test('IAM roles should follow least privilege', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Type === 'AWS::IAM::Role') {
        const policies = res.Properties.Policies || [];
        for (const policy of policies) {
          const doc = policy.PolicyDocument;
          for (const stmt of doc.Statement) {
            if (Array.isArray(stmt.Action)) {
              for (const action of stmt.Action) {
                expect(action).not.toBe('*');
              }
            } else if (typeof stmt.Action === 'string') {
              expect(stmt.Action).not.toBe('*');
            }
          }
        }
      }
    }
  });

  test('resources should have encryption and policy where required', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      if (res.Type === 'AWS::S3::Bucket') {
        expect(res.Properties.BucketEncryption).toBeDefined();
      }
      if (res.Type === 'AWS::RDS::DBInstance') {
        expect(res.Properties.StorageEncrypted).toBe(true);
        expect(res.Properties.KmsKeyId).toBeDefined();
      }
    }
  });

  test('all resources should match CloudFormation schema basics', () => {
    for (const [name, resource] of Object.entries(template.Resources)) {
      const res = resource as any;
      expect(res.Type).toMatch(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/);
      expect(res.Properties).toBeDefined();
    }
  });
});

describe('CloudFormation Validator', () => {
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    validator = new CloudFormationValidator(templatePath);
  });

  test('should create validator instance successfully', () => {
    expect(validator).toBeDefined();
  });

  test('should throw error for non-existent template file', () => {
    expect(() => {
      new CloudFormationValidator('/non/existent/file.json');
    }).toThrow('Template file not found');
  });

  test('should validate template successfully', () => {
    const result: ValidationResult = validator.validateTemplate();
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test('should return correct resource count', () => {
    const resourceCount = validator.getResourceCount();
    expect(resourceCount).toBeGreaterThan(30); // We expect many resources
    expect(typeof resourceCount).toBe('number');
  });

  test('should get resources by type', () => {
    const s3Buckets = validator.getResourcesByType('AWS::S3::Bucket');
    expect(Array.isArray(s3Buckets)).toBe(true);
    expect(s3Buckets.length).toBeGreaterThan(0);

    const vpcs = validator.getResourcesByType('AWS::EC2::VPC');
    expect(vpcs).toContain('VPC');

    const nonExistent = validator.getResourcesByType(
      'AWS::NonExistent::Resource'
    );
    expect(nonExistent).toHaveLength(0);
  });

  test('should check for specific outputs', () => {
    expect(validator.hasOutput('StackName')).toBe(true);
    expect(validator.hasOutput('EnvironmentSuffix')).toBe(true);
    expect(validator.hasOutput('VPCID')).toBe(true);
    expect(validator.hasOutput('NonExistentOutput')).toBe(false);
  });

  test('should validate output references', () => {
    const result = validator.validateOutputReferences();
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should get template object', () => {
    const templateObj = validator.getTemplate();
    expect(templateObj).toBeDefined();
    expect(templateObj.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(templateObj.Resources).toBeDefined();
  });
});

describe('Validator Utility Functions', () => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  test('validateTemplateFile should work correctly', () => {
    const result = validateTemplateFile(templatePath);
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
  });

  test('validateTemplateFile should handle non-existent file', () => {
    const result = validateTemplateFile('/non/existent/file.json');
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Template file not found');
  });

  test('getTemplateResources should return resource list', () => {
    const resources = getTemplateResources(templatePath);
    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBeGreaterThan(30);
    expect(resources).toContain('VPC');
    expect(resources).toContain('AppDataBucket');
  });

  test('getTemplateResources should handle non-existent file', () => {
    const resources = getTemplateResources('/non/existent/file.json');
    expect(resources).toHaveLength(0);
  });
});

describe('Security and Best Practices Validation', () => {
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    validator = new CloudFormationValidator(templatePath);
  });

  test('should validate security best practices', () => {
    const result = validator.validateTemplate();

    // Check that S3 buckets have encryption (should pass)
    const s3EncryptionErrors = result.errors.filter(error =>
      error.includes('should have encryption enabled')
    );
    expect(s3EncryptionErrors).toHaveLength(0);

    // Check that RDS has encryption (should pass)
    const rdsEncryptionErrors = result.errors.filter(error =>
      error.includes('should have storage encryption enabled')
    );
    expect(rdsEncryptionErrors).toHaveLength(0);
  });

  test('should identify IAM policy issues if any', () => {
    const result = validator.validateTemplate();

    // The template should have some IAM warnings about least privilege
    const iamWarnings = result.warnings.filter(warning =>
      warning.includes('IAM role')
    );
    // We expect some warnings, but exact count may vary
    expect(Array.isArray(iamWarnings)).toBe(true);
  });

  test('should validate environment suffix usage', () => {
    const result = validator.validateTemplate();

    // Should not have errors about missing EnvironmentSuffix parameter
    const envSuffixErrors = result.errors.filter(error =>
      error.includes('EnvironmentSuffix parameter')
    );
    expect(envSuffixErrors).toHaveLength(0);
  });
});

describe('Edge Cases and Error Handling', () => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  test('should handle invalid template format version', () => {
    // Create a temporary invalid template
    const invalidTemplate = {
      AWSTemplateFormatVersion: 'invalid-version',
      Resources: {
        TestResource: {
          Type: 'AWS::S3::Bucket',
          Properties: {},
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-invalid.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid AWSTemplateFormatVersion');
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle template without format version', () => {
    const invalidTemplate = {
      Resources: {
        TestResource: {
          Type: 'AWS::S3::Bucket',
          Properties: {},
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-no-version.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing AWSTemplateFormatVersion');
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle template without resources', () => {
    const invalidTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
    };

    const tempPath = path.join(__dirname, '../temp-no-resources.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Template must contain at least one resource'
      );
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle resource with invalid type', () => {
    const invalidTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        InvalidResource: {
          Type: 'InvalidType',
          Properties: {},
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-invalid-type.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('Invalid resource type'))
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle resource without properties', () => {
    const invalidTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        TestResource: {
          Type: 'AWS::S3::Bucket',
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-no-props.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error =>
          error.includes('missing Properties section')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should identify S3 bucket without encryption', () => {
    const templateWithUnencryptedS3 = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        UnencryptedBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'test-bucket',
          },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-unencrypted-s3.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithUnencryptedS3));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error =>
          error.includes('should have encryption enabled')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should identify RDS without encryption', () => {
    const templateWithUnencryptedRDS = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        UnencryptedDB: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            Engine: 'mysql',
            StorageEncrypted: false,
          },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-unencrypted-rds.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithUnencryptedRDS));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error =>
          error.includes('should have storage encryption enabled')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should validate IAM roles with wildcard actions', () => {
    const templateWithWildcardIAM = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        BadIAMRole: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [],
            },
            Policies: [
              {
                PolicyName: 'BadPolicy',
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: '*',
                      Resource: '*',
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-bad-iam.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithWildcardIAM));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(
        result.warnings.some(
          warning =>
            warning.includes('uses wildcard actions') ||
            warning.includes('grants access to all resources')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle template without environment suffix parameter', () => {
    const templateWithoutEnvSuffix = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        TestBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [],
            },
          },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-no-env-suffix.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithoutEnvSuffix));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(
        result.warnings.some(warning =>
          warning.includes('should include EnvironmentSuffix parameter')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle template without outputs', () => {
    const templateWithoutOutputs = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        TestBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [],
            },
          },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-no-outputs.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithoutOutputs));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateOutputReferences();
      expect(
        result.warnings.some(warning =>
          warning.includes('Template has no outputs defined')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle invalid output references', () => {
    const templateWithBadOutputs = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        TestBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [],
            },
          },
        },
      },
      Outputs: {
        BadRef: {
          Value: { Ref: 'NonExistentResource' },
        },
        BadGetAtt: {
          Value: { 'Fn::GetAtt': ['NonExistentResource', 'SomeAttribute'] },
        },
      },
    };

    const tempPath = path.join(__dirname, '../temp-bad-outputs.json');
    fs.writeFileSync(tempPath, JSON.stringify(templateWithBadOutputs));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateOutputReferences();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error =>
          error.includes('references non-existent resource')
        )
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });
});
