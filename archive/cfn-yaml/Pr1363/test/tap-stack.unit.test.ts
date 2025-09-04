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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
      const appNameParam = template.Parameters.ApplicationName;
      expect(appNameParam.Type).toBe('String');
      expect(appNameParam.Default).toBeDefined();
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.AllowedPattern).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have source code bucket', () => {
      const bucketResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      expect(bucketResources.length).toBeGreaterThan(0);
    });

    test('source code bucket should have versioning enabled', () => {
      const sourceBucket = template.Resources.SourceCodeBucket;
      expect(sourceBucket).toBeDefined();
      expect(sourceBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });

    test('source code bucket should have encryption configured', () => {
      const sourceBucket = template.Resources.SourceCodeBucket;
      expect(sourceBucket.Properties.BucketEncryption).toBeDefined();
      expect(
        sourceBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration
      ).toBeDefined();
    });
  });

  describe('CodePipeline Resources', () => {
    test('should have CodePipeline', () => {
      const pipelineResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CodePipeline::Pipeline'
      );
      expect(pipelineResources.length).toBeGreaterThan(0);
    });

    test('pipeline should have required stages', () => {
      const pipeline = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::CodePipeline::Pipeline'
      ) as any;

      expect(pipeline).toBeDefined();
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(Array.isArray(pipeline.Properties.Stages)).toBe(true);

      const stageNames = pipeline.Properties.Stages.map(
        (stage: any) => stage.Name
      );
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });
  });

  describe('CodeBuild Resources', () => {
    test('should have CodeBuild project', () => {
      const buildResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CodeBuild::Project'
      );
      expect(buildResources.length).toBeGreaterThan(0);
    });

    test('CodeBuild project should have environment configuration', () => {
      const buildProject = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::CodeBuild::Project'
      ) as any;

      expect(buildProject).toBeDefined();
      expect(buildProject.Properties.Environment).toBeDefined();
      expect(buildProject.Properties.Environment.Type).toBeDefined();
    });
  });

  describe('CodeDeploy Resources', () => {
    test('should have CodeDeploy application', () => {
      const deployResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CodeDeploy::Application'
      );
      expect(deployResources.length).toBeGreaterThan(0);
    });

    test('should have CodeDeploy deployment group', () => {
      const deployGroupResources = Object.keys(template.Resources).filter(
        key =>
          template.Resources[key].Type === 'AWS::CodeDeploy::DeploymentGroup'
      );
      expect(deployGroupResources.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM roles for services', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(iamRoles.length).toBeGreaterThan(0);
    });

    test('IAM roles should have trust policies', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('should have policies attached to roles', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(
          role.Properties.Policies || role.Properties.ManagedPolicyArns
        ).toBeDefined();
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda validation function', () => {
      const lambdaResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      expect(lambdaResources.length).toBeGreaterThan(0);
    });

    test('Lambda function should have proper runtime configuration', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      ) as any;

      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Properties.Runtime).toBeDefined();
      expect(lambdaFunction.Properties.Handler).toBeDefined();
      expect(lambdaFunction.Properties.Code).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch alarm for pipeline failures', () => {
      const alarmResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarmResources.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch log groups', () => {
      const logGroupResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::Logs::LogGroup'
      );
      expect(logGroupResources.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic for notifications', () => {
      const snsResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::SNS::Topic'
      );
      expect(snsResources.length).toBeGreaterThan(0);
    });
  });

  describe('Security Validation', () => {
    test('S3 buckets should not allow public access', () => {
      const s3Buckets = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket.Properties.PublicAccessBlockConfiguration) {
          expect(
            bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
          ).toBe(true);
          expect(
            bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
          ).toBe(true);
          expect(
            bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
          ).toBe(true);
          expect(
            bucket.Properties.PublicAccessBlockConfiguration
              .RestrictPublicBuckets
          ).toBe(true);
        }
      });
    });

    test('IAM policies should not use wildcard permissions on sensitive actions', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
              policy.PolicyDocument.Statement.forEach((statement: any) => {
                if (statement.Effect === 'Allow' && statement.Action) {
                  // Check for overly permissive actions
                  const actions = Array.isArray(statement.Action)
                    ? statement.Action
                    : [statement.Action];
                  actions.forEach((action: string) => {
                    if (action === '*') {
                      // Only allow * action if resource is also restricted
                      expect(statement.Resource).not.toBe('*');
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Template Size and Complexity', () => {
    test('template should be under reasonable size limit', () => {
      const templateString = JSON.stringify(template);
      const templateSizeKB = Buffer.byteLength(templateString, 'utf8') / 1024;
      expect(templateSizeKB).toBeLessThan(460); // CloudFormation limit is 460KB
    });

    test('should not exceed CloudFormation resource limits', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeLessThan(200); // CloudFormation limit is 200 resources
    });
  });

  describe('Output Validation', () => {
    test('should have meaningful outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
      });
    });
  });
});
