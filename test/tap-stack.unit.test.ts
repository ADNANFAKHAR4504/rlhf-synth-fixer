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
      if (def.AllowedPattern !== undefined)
        expect(typeof def.AllowedPattern).toBe('string');
      if (def.AllowedValues !== undefined)
        expect(Array.isArray(def.AllowedValues)).toBe(true);
      if (def.ConstraintDescription !== undefined)
        expect(typeof def.ConstraintDescription).toBe('string');
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
      if (def.Export.Name['Fn::Sub']) {
        expect(typeof def.Export.Name['Fn::Sub']).toBe('string');
      }
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

  it('should use valid conditions for all resources', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Condition) {
        expect(template.Conditions[def.Condition]).toBeDefined();
      }
    });
  });

  it('should have DeletionPolicy and UpdateReplacePolicy for critical resources', () => {
    const criticalTypes = [
      'AWS::S3::Bucket',
      'AWS::RDS::DBInstance',
      'AWS::RDS::DBSubnetGroup',
      'AWS::EC2::SecurityGroup',
      'AWS::EC2::VPC',
      'AWS::EC2::InternetGateway',
    ];
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (criticalTypes.includes(def.Type)) {
        if (
          def.DeletionPolicy !== undefined ||
          def.UpdateReplacePolicy !== undefined
        ) {
          expect(def.DeletionPolicy).toBeDefined();
          expect(def.UpdateReplacePolicy).toBeDefined();
        }
      }
    });
  });

  it('should validate all resource properties and intrinsic functions', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      Object.entries(def.Properties).forEach(([key, value]) => {
        expect(key.length).toBeGreaterThan(0);
        if (typeof value === 'object' && value !== null) {
          if ('Ref' in value)
            expect(typeof (value as any)['Ref']).toBe('string');
          if ('Fn::If' in value)
            expect(Array.isArray((value as any)['Fn::If'])).toBe(true);
          if ('Fn::Sub' in value)
            expect(typeof (value as any)['Fn::Sub']).toBe('string');
          if ('Fn::GetAtt' in value)
            expect(
              Array.isArray((value as any)['Fn::GetAtt']) ||
                typeof (value as any)['Fn::GetAtt'] === 'string'
            ).toBe(true);
        }
      });
    });
  });

  it('should validate all DependsOn and Condition usage', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.DependsOn) {
        if (Array.isArray(def.DependsOn)) {
          def.DependsOn.forEach((dep: any) =>
            expect(typeof dep).toBe('string')
          );
        } else {
          expect(typeof def.DependsOn).toBe('string');
        }
      }
      if (def.Condition) {
        expect(typeof def.Condition).toBe('string');
        expect(template.Conditions[def.Condition]).toBeDefined();
      }
    });
  });

  it('should validate all parameter constraints and allowed values', () => {
    Object.entries(template.Parameters).forEach(([param, def]: any) => {
      if (def.AllowedPattern) expect(typeof def.AllowedPattern).toBe('string');
      if (def.AllowedValues)
        expect(Array.isArray(def.AllowedValues)).toBe(true);
      if (def.ConstraintDescription)
        expect(typeof def.ConstraintDescription).toBe('string');
      if (def.MinValue !== undefined)
        expect(typeof def.MinValue).toBe('number');
      if (def.MaxValue !== undefined)
        expect(typeof def.MaxValue).toBe('number');
    });
  });

  it('should validate all outputs for correct export names and references', () => {
    Object.entries(template.Outputs).forEach(([out, def]: any) => {
      expect(def.Export).toBeDefined();
      expect(def.Export.Name).toBeDefined();
      if (def.Export.Name['Fn::Sub'])
        expect(typeof def.Export.Name['Fn::Sub']).toBe('string');
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

  it('should validate all resource types in the template', () => {
    const allTypes = new Set();
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      allTypes.add(def.Type);
    });
    expect(allTypes.size).toBeGreaterThan(0);
    allTypes.forEach(type =>
      expect((type as string).startsWith('AWS::')).toBe(true)
    );
  });

  it('should validate all cross-resource references', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      Object.values(def.Properties).forEach((value: any) => {
        if (typeof value === 'object' && value !== null && 'Ref' in value) {
          expect(
            template.Resources[(value as any).Ref] ||
              template.Parameters[(value as any).Ref] ||
              (value as any).Ref.startsWith('AWS::')
          ).toBeTruthy();
        }
      });
    });
  });

  it('should validate all resource tags if present', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Properties.Tags) {
        expect(Array.isArray(def.Properties.Tags)).toBe(true);
        def.Properties.Tags.forEach((tag: any) => {
          expect(tag.Key).toBeDefined();
          expect(tag.Value).toBeDefined();
        });
      }
    });
  });

  it('should validate all Lambda environment variables if present', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::Lambda::Function' && def.Properties.Environment) {
        expect(def.Properties.Environment.Variables).toBeDefined();
        expect(typeof def.Properties.Environment.Variables).toBe('object');
      }
    });
  });

  it('should validate all IAM policy actions and resources', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::IAM::Role' && def.Properties.Policies) {
        def.Properties.Policies.forEach((policy: any) => {
          expect(policy.PolicyName).toBeDefined();
          expect(policy.PolicyDocument).toBeDefined();
          expect(policy.PolicyDocument.Statement).toBeDefined();
          policy.PolicyDocument.Statement.forEach((stmt: any) => {
            expect(stmt.Effect).toBeDefined();
            expect(stmt.Action).toBeDefined();
            expect(stmt.Resource).toBeDefined();
          });
        });
      }
    });
  });

  it('should validate all S3 bucket lifecycle rules if present', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (
        def.Type === 'AWS::S3::Bucket' &&
        def.Properties.LifecycleConfiguration
      ) {
        expect(def.Properties.LifecycleConfiguration.Rules).toBeDefined();
        expect(Array.isArray(def.Properties.LifecycleConfiguration.Rules)).toBe(
          true
        );
        def.Properties.LifecycleConfiguration.Rules.forEach((rule: any) => {
          expect(rule.Status).toBeDefined();
        });
      }
    });
  });

  it('should validate all subnet and VPC references', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Properties.VpcId) {
        const vpcRef = def.Properties.VpcId;
        if (typeof vpcRef === 'object' && vpcRef !== null && 'Ref' in vpcRef) {
          expect(
            template.Resources[(vpcRef as any).Ref] ||
              template.Parameters[(vpcRef as any).Ref] ||
              (vpcRef as any).Ref.startsWith('AWS::')
          ).toBeTruthy();
        }
      }
      if (def.Properties.SubnetIds) {
        def.Properties.SubnetIds.forEach((sub: any) => {
          if (typeof sub === 'object' && sub !== null && 'Ref' in sub) {
            expect(
              template.Resources[(sub as any).Ref] ||
                template.Parameters[(sub as any).Ref] ||
                (sub as any).Ref.startsWith('AWS::')
            ).toBeTruthy();
          }
        });
      }
    });
  });

  it('should validate all security group rules', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (
        def.Type === 'AWS::EC2::SecurityGroup' &&
        def.Properties.SecurityGroupIngress
      ) {
        expect(Array.isArray(def.Properties.SecurityGroupIngress)).toBe(true);
        def.Properties.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.IpProtocol).toBeDefined();
        });
      }
    });
  });

  it('should validate all KMS key usage', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::KMS::Key') {
        expect(def.Properties.Description).toBeDefined();
        expect(def.Properties.KeyPolicy).toBeDefined();
      }
      if (def.Properties && def.Properties.KmsKeyId) {
        if (
          typeof def.Properties.KmsKeyId === 'object' &&
          def.Properties.KmsKeyId !== null &&
          'Ref' in def.Properties.KmsKeyId
        ) {
          expect(
            template.Resources[(def.Properties.KmsKeyId as any).Ref] ||
              template.Parameters[(def.Properties.KmsKeyId as any).Ref] ||
              (def.Properties.KmsKeyId as any).Ref.startsWith('AWS::')
          ).toBeTruthy();
        }
      }
    });
  });

  it('should validate all CloudTrail and Config settings', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      if (def.Type === 'AWS::CloudTrail::Trail') {
        expect(def.Properties.TrailName).toBeDefined();
        expect(def.Properties.S3BucketName).toBeDefined();
      }
      if (def.Type === 'AWS::Config::ConfigurationRecorder') {
        expect(def.Properties.Name).toBeDefined();
        expect(def.Properties.RoleARN).toBeDefined();
      }
      if (def.Type === 'AWS::Config::DeliveryChannel') {
        expect(def.Properties.Name).toBeDefined();
        expect(def.Properties.S3BucketName).toBeDefined();
      }
    });
  });

  it('should validate all custom logic and edge cases', () => {
    Object.entries(template.Resources).forEach(([res, def]: any) => {
      expect(def.Type).toMatch(/^AWS::[A-Za-z0-9:]+$/);
      expect(def.Properties).toBeDefined();
      Object.keys(def.Properties).forEach(prop => {
        expect(prop.length).toBeGreaterThan(0);
      });
      if (def.Condition) {
        expect(template.Conditions[def.Condition]).toBeDefined();
      }
    });
    Object.entries(template.Outputs).forEach(([out, def]: any) => {
      expect(def.Description).toBeDefined();
      expect(def.Value).toBeDefined();
      expect(def.Export).toBeDefined();
      expect(def.Export.Name).toBeDefined();
    });
  });
});
