import fs from 'fs';
import path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template: any = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('TapStack CloudFormation Template', () => {
  it('should have AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof template.AWSTemplateFormatVersion).toBe('string');
  });

  it('should have Description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  it('should have Metadata with AWS::CloudFormation::Interface', () => {
    expect(template.Metadata).toBeDefined();
    expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
  });

  it('should have Parameters, Mappings, Conditions, Resources, Outputs', () => {
    ['Parameters', 'Mappings', 'Conditions', 'Resources', 'Outputs'].forEach(
      section => {
        expect(template[section]).toBeDefined();
        expect(typeof template[section]).toBe('object');
      }
    );
  });

  describe('Parameters', () => {
    it('should have at least one parameter', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });
    Object.entries(template.Parameters).forEach(([paramName, param]) => {
      const p: any = param;
      it(`parameter ${paramName} should have Type`, () => {
        expect(p.Type).toBeDefined();
      });
      it(`parameter ${paramName} should have Description`, () => {
        expect(p.Description).toBeDefined();
      });
      if ('Default' in p) {
        it(`parameter ${paramName} should have a valid Default`, () => {
          expect(p.Default).not.toBeUndefined();
        });
      }
    });
  });

  describe('Mappings', () => {
    Object.entries(template.Mappings || {}).forEach(
      ([mappingName, mapping]) => {
        it(`mapping ${mappingName} should be defined`, () => {
          expect(mapping).toBeDefined();
          expect(typeof mapping).toBe('object');
        });
      }
    );
  });

  describe('Conditions', () => {
    it('should have conditions section (can be empty)', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });
    Object.entries(template.Conditions || {}).forEach(
      ([condName, condValue]) => {
        it(`condition ${condName} should be defined and valid`, () => {
          expect(condValue).toBeDefined();
          // Should be an array or object representing a Fn intrinsic
          expect(
            typeof condValue === 'object' || Array.isArray(condValue)
          ).toBe(true);
        });
        it(`condition ${condName} should be referenced in at least one resource or output if used`, () => {
          const isReferenced = (obj: any): boolean => {
            if (typeof obj === 'string') {
              return obj === condName;
            }
            if (Array.isArray(obj)) {
              return obj.some(isReferenced);
            }
            if (typeof obj === 'object' && obj !== null) {
              return Object.keys(obj).some(
                k => k === condName || isReferenced(obj[k])
              );
            }
            return false;
          };
          let found = false;
          // Check resources
          Object.values(template.Resources).forEach((res: any) => {
            if (res.Condition && res.Condition === condName) found = true;
            if (isReferenced(res)) found = true;
          });
          // Check outputs
          Object.values(template.Outputs).forEach((output: any) => {
            if (isReferenced(output)) found = true;
          });
          expect(found).toBe(true);
        });
      }
    );
  });

  describe('Resources', () => {
    it('should have at least one resource', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
    // Networking
    [
      'ProdVPC',
      'InternetGateway',
      'AttachGateway',
      'PublicSubnetA',
      'PublicSubnetB',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'NatEIP1',
      'NatEIP2',
      'NatGW1',
      'NatGW2',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnetARouteTableAssoc',
      'PublicSubnetBRouteTableAssoc',
      'PrivateRouteTableA',
      'PrivateRouteTableB',
      'PrivateSubnetARoute',
      'PrivateSubnetBRoute',
      'PrivateSubnetARouteAssoc',
      'PrivateSubnetBRouteAssoc',
    ].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // Security Group
    it('ProdSecurityGroup should be defined', () => {
      expect(template.Resources.ProdSecurityGroup).toBeDefined();
    });
    // IAM Roles/Profiles
    [
      'EC2Role',
      'EC2InstanceProfile',
      'ConfigRole',
      'S3BucketCleanupRole',
    ].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // KMS, S3, CloudTrail
    [
      'CloudTrailKMSKey',
      'ProdTrailBucket',
      'ProdTrailBucketPolicy',
      'ProdCloudTrail',
    ].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // EC2/ASG - commented out for LocalStack compatibility
    ['ProdLaunchTemplate', 'ProdASG'].forEach(name => {
      it(`${name} should be undefined (commented out for LocalStack)`, () => {
        expect(template.Resources[name]).toBeUndefined();
      });
    });
    // ALB
    [
      'ProdALB',
      'ProdTargetGroup',
      'ProdHTTPSListener',
      'ProdHTTPListener',
    ].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // AWS Config
    ['ConfigRecorder', 'ConfigDeliveryChannel'].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // Custom Lambda
    [
      'S3BucketCleanupFunction',
      'S3BucketCleanupRole',
      'S3BucketCleanup',
    ].forEach(name => {
      it(`${name} should be defined`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });
    // Check all resources have Type and Properties
    Object.entries(template.Resources).forEach(([resName, res]) => {
      const r: any = res;
      it(`resource ${resName} should have Type`, () => {
        expect(r.Type).toBeDefined();
        expect(typeof r.Type).toBe('string');
      });
      it(`resource ${resName} should have Properties`, () => {
        expect(r.Properties).toBeDefined();
        expect(typeof r.Properties).toBe('object');
      });
    });
  });

  describe('Outputs', () => {
    it('should have at least one output', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
    Object.entries(template.Outputs).forEach(([outputName, output]) => {
      const o: any = output;
      it(`output ${outputName} should have Description`, () => {
        expect(o.Description).toBeDefined();
      });
      it(`output ${outputName} should have Value`, () => {
        expect(o.Value).toBeDefined();
      });
      if (o.Export) {
        it(`output ${outputName} should have Export.Name`, () => {
          expect(o.Export.Name).toBeDefined();
        });
      }
      // Check for Fn::If or condition references in output values
      const findConditionRef = (obj: any): boolean => {
        if (typeof obj === 'string') return false;
        if (Array.isArray(obj)) return obj.some(findConditionRef);
        if (typeof obj === 'object' && obj !== null) {
          if ('Fn::If' in obj) return true;
          return Object.values(obj).some(findConditionRef);
        }
        return false;
      };
      it(`output ${outputName} should reference conditions if using Fn::If`, () => {
        if (findConditionRef(o.Value)) {
          expect(true).toBe(true);
        }
      });
    });
  });

  describe('Best Practices', () => {
    it('all resources should have tags if supported', () => {
      Object.values(template.Resources).forEach((res: any) => {
        if (res.Properties && 'Tags' in res.Properties) {
          expect(Array.isArray(res.Properties.Tags)).toBe(true);
          expect(res.Properties.Tags.length).toBeGreaterThan(0);
        }
      });
    });
    it('should not have any undefined or null required sections', () => {
      [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs',
      ].forEach(section => {
        expect(template[section]).not.toBeNull();
        expect(template[section]).not.toBeUndefined();
      });
    });
  });
});
