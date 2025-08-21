import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have a description', () => {
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const required = ['ProjectName', 'NotificationEmail'];
      required.forEach(param =>
        expect(template.Parameters[param]).toBeDefined()
      );
    });
    test('should have correct ProjectName parameter', () => {
      const p = template.Parameters.ProjectName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('nodejs-cicd');
    });
    test('should have correct NotificationEmail parameter', () => {
      const p = template.Parameters.NotificationEmail;
      expect(p.Type).toBe('String');
      expect(p.AllowedPattern).toBe(
        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
    });
  });

  describe('Resources', () => {
    test('should create S3 buckets with encryption and no public access', () => {
      const buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      expect(buckets.length).toBeGreaterThanOrEqual(2);
      for (const bucket of buckets as any[]) {
        expect((bucket as any).Properties.BucketEncryption).toBeDefined();
        expect(
          (bucket as any).Properties.PublicAccessBlockConfiguration
        ).toBeDefined();
        expect(
          (bucket as any).Properties.PublicAccessBlockConfiguration
            .BlockPublicAcls
        ).toBe(true);
        expect(
          (bucket as any).Properties.PublicAccessBlockConfiguration
            .BlockPublicPolicy
        ).toBe(true);
        expect(
          (bucket as any).Properties.PublicAccessBlockConfiguration
            .IgnorePublicAcls
        ).toBe(true);
        expect(
          (bucket as any).Properties.PublicAccessBlockConfiguration
            .RestrictPublicBuckets
        ).toBe(true);
      }
    });

    test('should create an SNS topic for notifications', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::SNS::Topic'
        )
      ).toBe(true);
    });

    test('should create IAM roles for CodePipeline, CodeBuild, and Lambda', () => {
      const roles = [
        'CodePipelineServiceRole',
        'CodeBuildServiceRole',
        'LambdaExecutionRole',
      ];
      roles.forEach(role => expect(template.Resources[role]).toBeDefined());
      expect(template.Resources.CodePipelineServiceRole.Type).toBe(
        'AWS::IAM::Role'
      );
      expect(template.Resources.CodeBuildServiceRole.Type).toBe(
        'AWS::IAM::Role'
      );
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should create a Lambda function for custom testing', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::Lambda::Function'
        )
      ).toBe(true);
    });

    test('should create a CodePipeline with required stages', () => {
      const pipeline = Object.values(template.Resources).find(
        (r: any) => r.Type === 'AWS::CodePipeline::Pipeline'
      );
      expect(pipeline).toBeDefined();
      if (pipeline) {
        const stages = (pipeline as any).Properties.Stages.map(
          (s: any) => s.Name
        );
        expect(stages).toEqual(
          expect.arrayContaining([
            'Source',
            'Build',
            'Test',
            'ManualApproval',
            'Deploy',
          ])
        );
      }
    });

    test('should create a CodeBuild project', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::CodeBuild::Project'
        )
      ).toBe(true);
    });

    test('should create an SNS subscription for notifications', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::SNS::Subscription'
        )
      ).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'PipelineName',
        'ArtifactStoreBucket',
        'SourceCodeBucket',
        'NotificationTopic',
        'TestLambdaFunction',
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
    test('should have correct output descriptions and export names', () => {
      const outputs = template.Outputs;
      expect(outputs.PipelineName.Description).toMatch(/CodePipeline/i);
      expect(outputs.ArtifactStoreBucket.Description).toMatch(/artifacts/i);
      expect(outputs.SourceCodeBucket.Description).toMatch(/source code/i);
      expect(outputs.NotificationTopic.Description).toMatch(/SNS topic/i);
      expect(outputs.TestLambdaFunction.Description).toMatch(
        /Lambda function/i
      );
      // Export.Name is an object with Fn::Sub
      expect(outputs.PipelineName.Export.Name['Fn::Sub']).toMatch(
        /\${AWS::StackName}-PipelineName/
      );
      expect(outputs.ArtifactStoreBucket.Export.Name['Fn::Sub']).toMatch(
        /\${AWS::StackName}-ArtifactStore/
      );
      expect(outputs.SourceCodeBucket.Export.Name['Fn::Sub']).toMatch(
        /\${AWS::StackName}-SourceCodeBucket/
      );
      expect(outputs.NotificationTopic.Export.Name['Fn::Sub']).toMatch(
        /\${AWS::StackName}-NotificationTopic/
      );
      expect(outputs.TestLambdaFunction.Export.Name['Fn::Sub']).toMatch(
        /\${AWS::StackName}-TestLambdaFunction/
      );
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(typeof template).toBe('object');
      expect(template).toBeDefined();
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 2 parameters', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(2);
    });
    test('should have at least 5 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow naming conventions for outputs', () => {
      // All outputs should have Export.Name as Fn::Sub with ${AWS::StackName}- prefix
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-/);
      });
    });
    test('should use Fn::Sub for resource names where appropriate', () => {
      // Check S3 buckets and Lambda function use Fn::Sub for names
      const s3Buckets = ['ArtifactStore', 'SourceCodeBucket'];
      s3Buckets.forEach(bucket => {
        expect(
          template.Resources[bucket].Properties.BucketName['Fn::Sub']
        ).toBeDefined();
      });
      expect(
        template.Resources.TestLambdaFunction.Properties.FunctionName['Fn::Sub']
      ).toBeDefined();
    });
  });
});
