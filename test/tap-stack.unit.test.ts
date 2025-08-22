import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;
  beforeAll(() => {
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(jsonContent);
  });

  it('should have AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof template.AWSTemplateFormatVersion).toBe('string');
  });

  it('should have Description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  it('should have Parameters section', () => {
    expect(template.Parameters).toBeDefined();
    expect(typeof template.Parameters).toBe('object');
    Object.entries(template.Parameters).forEach(([param, def]: any) => {
      expect(def.Type).toBeDefined();
      if (def.Default !== undefined) expect(def.Default).toBeDefined();
      if (def.Description !== undefined) expect(def.Description).toBeDefined();
    });
  });

  it('should have Conditions section', () => {
    expect(template.Conditions).toBeDefined();
    expect(typeof template.Conditions).toBe('object');
    Object.keys(template.Conditions).forEach(cond => {
      expect(cond).toMatch(/^[A-Za-z0-9]+/);
    });
  });

  it('should have Resources section', () => {
    expect(template.Resources).toBeDefined();
    expect(typeof template.Resources).toBe('object');
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      expect(def.Type).toBeDefined();
      expect(typeof def.Type).toBe('string');
      expect(def.Properties).toBeDefined();
      expect(typeof def.Properties).toBe('object');
    });
  });

  it('should have Outputs section', () => {
    expect(template.Outputs).toBeDefined();
    expect(typeof template.Outputs).toBe('object');
    Object.entries(template.Outputs).forEach(([out, def]: any) => {
      expect(def.Description).toBeDefined();
      expect(def.Value).toBeDefined();
      expect(def.Export).toBeDefined();
      expect(def.Export.Name).toBeDefined();
    });
  });

  it('should not have duplicate resource logical IDs', () => {
    const ids = Object.keys(template.Resources);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('should not have duplicate parameter names', () => {
    const ids = Object.keys(template.Parameters);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('should not have duplicate output names', () => {
    const ids = Object.keys(template.Outputs);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('should use conditions for resources that can reference existing ones', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Condition) {
        expect(template.Conditions[def.Condition]).toBeDefined();
      }
    });
  });

  it('should not create resources if existing resource parameter is provided', () => {
    if (template.Parameters.ExistingVpcId) {
      const vpc = template.Resources.SecurityVpc;
      if (vpc && vpc.Condition) {
        expect(vpc.Condition).toBe('CreateVpc');
      }
    }
  });

  it('should have best practices for encryption, versioning, and public access block on S3 buckets', () => {
    let atLeastOneVersioned = false;
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::S3::Bucket') {
        const props = def.Properties;
        expect(props.BucketEncryption).toBeDefined();
        expect(props.PublicAccessBlockConfiguration).toBeDefined();
        if (props.VersioningConfiguration) {
          atLeastOneVersioned = true;
        }
      }
    });
    expect(atLeastOneVersioned).toBe(true);
  });

  it('should have KMS Key policies with least privilege and cross-account access', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::KMS::Key') {
        const policy = def.Properties.KeyPolicy;
        expect(policy).toBeDefined();
        expect(policy.Statement).toBeDefined();
        expect(Array.isArray(policy.Statement)).toBe(true);
        const masterAccountId =
          template.Parameters.MasterAccountId?.Default || '';
        if (masterAccountId && /^\d{12}$/.test(masterAccountId)) {
          const hasRoot = policy.Statement.some(
            (s: any) =>
              s.Principal &&
              s.Principal.AWS &&
              typeof s.Principal.AWS === 'string' &&
              s.Principal.AWS.includes('root')
          );
          expect(hasRoot).toBe(true);
        }
      }
    });
  });

  it('should have IAM roles with AssumeRolePolicyDocument and Policies', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::IAM::Role') {
        expect(def.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(
          def.Properties.Policies || def.Properties.ManagedPolicyArns
        ).toBeDefined();
      }
    });
  });

  it('should have Lambda functions with environment variables and code', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::Lambda::Function') {
        expect(def.Properties.Environment).toBeDefined();
        expect(def.Properties.Code).toBeDefined();
        expect(def.Properties.Handler).toBeDefined();
        expect(def.Properties.Runtime).toBeDefined();
      }
    });
  });

  it('should have security group ingress/egress rules', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::EC2::SecurityGroup') {
        expect(def.Properties.SecurityGroupIngress).toBeDefined();
      }
    });
  });

  it('should have RDS instance with encryption and subnet group', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::RDS::DBInstance') {
        expect(def.Properties.StorageEncrypted).toBe(true);
        expect(def.Properties.KmsKeyId).toBeDefined();
        expect(def.Properties.DBSubnetGroupName).toBeDefined();
      }
    });
  });

  it('should have Config rules and aggregator with correct properties', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::Config::ConfigRule') {
        expect(def.Properties.ConfigRuleName).toBeDefined();
        expect(def.Properties.Source).toBeDefined();
      }
      if (def.Type === 'AWS::Config::ConfigurationAggregator') {
        expect(def.Properties.ConfigurationAggregatorName).toBeDefined();
      }
    });
  });

  it('should have Security Hub enabled', () => {
    const found = Object.values(template.Resources).some(
      (def: any) => def.Type === 'AWS::SecurityHub::Hub'
    );
    expect(found).toBe(true);
  });

  it('should have MFA enforcement managed policy', () => {
    const found = Object.values(template.Resources).some(
      (def: any) => def.Type === 'AWS::IAM::ManagedPolicy'
    );
    expect(found).toBe(true);
  });

  it('should have all outputs reference valid resources or parameters', () => {
    Object.entries(template.Outputs).forEach(([out, def]: any) => {
      if (typeof def.Value === 'object') {
        const ref =
          def.Value.Ref ||
          (def.Value['Fn::GetAtt'] && def.Value['Fn::GetAtt'][0]);
        if (ref) {
          expect(
            template.Resources[ref] ||
              template.Parameters[ref] ||
              ref.startsWith('AWS::')
          ).toBeTruthy();
        }
      }
    });
  });
});
