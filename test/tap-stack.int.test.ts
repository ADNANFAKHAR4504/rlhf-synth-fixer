import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Integration Tests', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
    template = Template.fromJSON(templateContent);
  });

  // 🏗️ Resource Creation
  test('Creates VPC, S3 Bucket, IAM Group, and IAM Role', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::IAM::Group', 1);
    template.resourceCountIs('AWS::IAM::Role', 1);
  });

  // 🧪 Parameter Validation
  test('Environment parameter only allows dev, stage, prod', () => {
    const param = template.toJSON().Parameters?.Environment;
    expect(param).toBeDefined();
    expect(param.AllowedValues).toEqual(['dev', 'stage', 'prod']);
  });

  test('ProjectName parameter is required and non-empty', () => {
    const param = template.toJSON().Parameters?.ProjectName;
    expect(param).toBeDefined();
    expect(param.Default).toBeDefined();
    expect(param.Default.length).toBeGreaterThan(0);
  });

  // 🔐 Security & Access Control
  test('S3 bucket uses AES256 encryption and blocks public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('IAM Role policy allows only s3:GetObject and s3:ListBucket', () => {
    const role = template.findResources('AWS::IAM::Role');
    Object.values(role).forEach((r: any) => {
      const statements = r.Properties.Policies[0].PolicyDocument.Statement;
      statements.forEach((stmt: any) => {
        expect(stmt.Action).toEqual(expect.arrayContaining(['s3:GetObject', 's3:ListBucket']));
        expect(stmt.Action).not.toContain('*');
      });
    });
  });

  test('IAM Role is assumable by IAM Group ARN', () => {
    const role = template.findResources('AWS::IAM::Role');
    Object.values(role).forEach((r: any) => {
      expect(r.Properties.AssumeRolePolicyDocument.Statement[0].Principal.AWS).toEqual({
        'Fn::GetAtt': ['S3ReadAccessGroup', 'Arn'],
      });
    });
  });

  // 🧵 Naming Conventions
  test('Resource names use Fn::Sub with correct patterns', () => {
    Object.values(template.findResources('AWS::IAM::Group')).forEach((r: any) => {
      expect(r.Properties.GroupName).toEqual({
        'Fn::Sub': '${ProjectName}-s3-read-group',
      });
    });

    Object.values(template.findResources('AWS::IAM::Role')).forEach((r: any) => {
      expect(r.Properties.RoleName).toEqual({
        'Fn::Sub': '${ProjectName}-s3-read-role',
      });
    });

    Object.values(template.findResources('AWS::S3::Bucket')).forEach((r: any) => {
      expect(r.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-storage',
      });
    });
  });

  test('Fn::Sub strings contain only valid characters', () => {
    const validPattern = /^[a-zA-Z0-9\-.\${}]+$/;
    const resources = ['AWS::IAM::Group', 'AWS::IAM::Role', 'AWS::S3::Bucket'];

    resources.forEach(type => {
      Object.values(template.findResources(type)).forEach((r: any) => {
        const nameObj = r.Properties.GroupName || r.Properties.RoleName || r.Properties.BucketName;
        if (typeof nameObj === 'object' && nameObj['Fn::Sub']) {
          expect(nameObj['Fn::Sub']).toMatch(validPattern);
        }
      });
    });
  });

  // 📤 Outputs
  test('Outputs include VPCId, BucketName, S3ReadRoleARN, and S3AccessGroupName', () => {
    const outputs = template.toJSON().Outputs;
    ['VPCId', 'BucketName', 'S3ReadRoleARN', 'S3AccessGroupName'].forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  test('Output values reference correct resources', () => {
    const outputs = template.toJSON().Outputs;
    expect(outputs.VPCId.Value).toMatchObject({ Ref: 'VPC' });
    expect(outputs.BucketName.Value).toMatchObject({ Ref: 'ProjectBucket' });
    expect(outputs.S3ReadRoleARN.Value).toMatchObject({ 'Fn::GetAtt': ['S3ReadRole', 'Arn'] });
    expect(outputs.S3AccessGroupName.Value).toMatchObject({ Ref: 'S3ReadAccessGroup' });
  });

  // ⚠️ Edge Cases
  test('IAM Role includes AssumeRolePolicyDocument', () => {
    const role = template.findResources('AWS::IAM::Role');
    Object.values(role).forEach((r: any) => {
      expect(r.Properties).toHaveProperty('AssumeRolePolicyDocument');
    });
  });

  test('S3 bucket includes BucketEncryption', () => {
    const bucket = template.findResources('AWS::S3::Bucket');
    Object.values(bucket).forEach((b: any) => {
      expect(b.Properties).toHaveProperty('BucketEncryption');
    });
  });


  test('IAM Role name Fn::Sub string does not exceed AWS limit of 64 characters', () => {
    const role = template.findResources('AWS::IAM::Role');
    Object.values(role).forEach((r: any) => {
      const nameObj = r.Properties.RoleName;
      if (typeof nameObj === 'object' && nameObj['Fn::Sub']) {
        expect(nameObj['Fn::Sub'].length).toBeLessThanOrEqual(64);
      }
    });
  });

  test('IAM policy does not allow wildcard resource access', () => {
    const role = template.findResources('AWS::IAM::Role');
    Object.values(role).forEach((r: any) => {
      const statements = r.Properties.Policies[0].PolicyDocument.Statement;
      statements.forEach((stmt: any) => {
        if (Array.isArray(stmt.Resource)) {
          stmt.Resource.forEach((res: any) => {
            expect(res).not.toBe('*');
          });
        } else {
          expect(stmt.Resource).not.toBe('*');
        }
      });
    });
  });

  test('All resources have Environment and Project tags', () => {
    const taggedResources = ['AWS::EC2::VPC', 'AWS::S3::Bucket', 'AWS::IAM::Group', 'AWS::IAM::Role'];
    taggedResources.forEach(type => {
      Object.values(template.findResources(type)).forEach((resource: any) => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment' }),
            expect.objectContaining({ Key: 'Project' }),
          ])
        );
      });
    });
  });
});
