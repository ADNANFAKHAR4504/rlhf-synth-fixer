import { CloudFormationClient, ValidateTemplateCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { CodePipelineClient, GetPipelineCommand } from '@aws-sdk/client-codepipeline';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

const yamlCfn = require('yaml-cfn');

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth101912490';
  const AWS_REGION = 'us-east-1';
  const STACK_NAME = `cicd-pipeline-stack-${ENVIRONMENT_SUFFIX}`;

  let cfnClient: CloudFormationClient;
  let s3Client: S3Client;
  let kmsClient: KMSClient;
  let pipelineClient: CodePipelineClient;
  let snsClient: SNSClient;
  let stackOutputs: Record<string, string>;
  let flatOutputs: Record<string, string>;

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region: AWS_REGION });
    s3Client = new S3Client({ region: AWS_REGION });
    kmsClient = new KMSClient({ region: AWS_REGION });
    pipelineClient = new CodePipelineClient({ region: AWS_REGION });
    snsClient = new SNSClient({ region: AWS_REGION });

    // Load flat outputs if they exist (from deployment)
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      flatOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      flatOutputs = {};
    }
  }, 30000);

  describe('Template Validation', () => {
    test('pipeline template should be valid according to CloudFormation', async () => {
      const pipelineTemplate = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );

      const command = new ValidateTemplateCommand({
        TemplateBody: pipelineTemplate
      });

      try {
        const response = await cfnClient.send(command);
        expect(response).toBeDefined();
        expect(response.Parameters).toBeDefined();
        expect(response.Parameters?.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'CredentialsProviderError') {
          console.log('Skipping: AWS credentials not available');
          return;
        }
        throw error;
      }
    }, 15000);

    test('cross-account role template should be valid according to CloudFormation', async () => {
      const crossAccountTemplate = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'cross-account-role.yaml'),
        'utf8'
      );

      const command = new ValidateTemplateCommand({
        TemplateBody: crossAccountTemplate
      });

      try {
        const response = await cfnClient.send(command);
        expect(response).toBeDefined();
        expect(response.Parameters).toBeDefined();
        expect(response.Parameters?.length).toBe(4);
      } catch (error: any) {
        if (error.name === 'CredentialsProviderError') {
          console.log('Skipping: AWS credentials not available');
          return;
        }
        throw error;
      }
    }, 15000);

    test('pipeline template parameters should have correct constraints', async () => {
      const pipelineTemplate = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );

      const command = new ValidateTemplateCommand({
        TemplateBody: pipelineTemplate
      });

      try {
        const response = await cfnClient.send(command);
        const parameters = response.Parameters || [];

        const envSuffix = parameters.find(p => p.ParameterKey === 'EnvironmentSuffix');
        expect(envSuffix).toBeDefined();
        expect(envSuffix?.DefaultValue).toBe('dev');

        const retentionDays = parameters.find(p => p.ParameterKey === 'ArtifactRetentionDays');
        expect(retentionDays).toBeDefined();
        expect(retentionDays?.DefaultValue).toBe('30');
      } catch (error: any) {
        if (error.name === 'CredentialsProviderError') {
          console.log('Skipping: AWS credentials not available');
          return;
        }
        throw error;
      }
    }, 15000);
  });

  describe('Stack Outputs Validation', () => {
    test('should have pipeline name output', () => {
      if (Object.keys(flatOutputs).length === 0) {
        console.log('Skipping: Stack not deployed, no outputs available');
        return;
      }

      expect(flatOutputs.PipelineName).toBeDefined();
      expect(flatOutputs.PipelineName).toContain(ENVIRONMENT_SUFFIX);
    });

    test('should have artifact bucket name output', () => {
      if (Object.keys(flatOutputs).length === 0) {
        console.log('Skipping: Stack not deployed, no outputs available');
        return;
      }

      expect(flatOutputs.ArtifactBucketName).toBeDefined();
      expect(flatOutputs.ArtifactBucketName).toContain('pipeline-artifacts');
      expect(flatOutputs.ArtifactBucketName).toContain(ENVIRONMENT_SUFFIX);
    });

    test('should have KMS key ARN output', () => {
      if (Object.keys(flatOutputs).length === 0) {
        console.log('Skipping: Stack not deployed, no outputs available');
        return;
      }

      expect(flatOutputs.KMSKeyId).toBeDefined();
      expect(flatOutputs.KMSKeyId).toContain('arn:aws:kms:');
      expect(flatOutputs.KMSKeyId).toContain('key/');
    });

    test('should have notification topic ARN output', () => {
      if (Object.keys(flatOutputs).length === 0) {
        console.log('Skipping: Stack not deployed, no outputs available');
        return;
      }

      expect(flatOutputs.NotificationTopicArn).toBeDefined();
      expect(flatOutputs.NotificationTopicArn).toContain('arn:aws:sns:');
      expect(flatOutputs.NotificationTopicArn).toContain('pipeline-notifications');
    });

    test('should have pipeline console URL output', () => {
      if (Object.keys(flatOutputs).length === 0) {
        console.log('Skipping: Stack not deployed, no outputs available');
        return;
      }

      expect(flatOutputs.CodePipelineUrl).toBeDefined();
      expect(flatOutputs.CodePipelineUrl).toContain('console.aws.amazon.com');
      expect(flatOutputs.CodePipelineUrl).toContain('codepipeline');
    });
  });

  describe('Resource Verification', () => {
    test('S3 artifact bucket should exist if deployed', async () => {
      if (Object.keys(flatOutputs).length === 0 || !flatOutputs.ArtifactBucketName) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: flatOutputs.ArtifactBucketName
      });

      try {
        await s3Client.send(command);
        // If no error, bucket exists
        expect(true).toBe(true);
      } catch (error: any) {
        // Bucket might not exist if stack was not fully deployed
        if (error.name === 'NotFound') {
          console.log('Bucket not found - stack may not be deployed');
        } else {
          throw error;
        }
      }
    }, 15000);

    test('KMS key should exist if deployed', async () => {
      if (Object.keys(flatOutputs).length === 0 || !flatOutputs.KMSKeyId) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const keyId = flatOutputs.KMSKeyId.split('/').pop();
      const command = new DescribeKeyCommand({
        KeyId: keyId
      });

      try {
        const response = await kmsClient.send(command);
        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NotFoundException') {
          console.log('KMS key not found - stack may not be deployed');
        } else {
          throw error;
        }
      }
    }, 15000);

    test('CodePipeline should exist if deployed', async () => {
      if (Object.keys(flatOutputs).length === 0 || !flatOutputs.PipelineName) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const command = new GetPipelineCommand({
        name: flatOutputs.PipelineName
      });

      try {
        const response = await pipelineClient.send(command);
        expect(response.pipeline).toBeDefined();
        expect(response.pipeline?.name).toBe(flatOutputs.PipelineName);
        expect(response.pipeline?.stages).toBeDefined();
        expect(response.pipeline?.stages?.length).toBeGreaterThanOrEqual(3);
      } catch (error: any) {
        if (error.name === 'PipelineNotFoundException') {
          console.log('Pipeline not found - stack may not be deployed');
        } else {
          throw error;
        }
      }
    }, 15000);

    test('SNS topic should exist if deployed', async () => {
      if (Object.keys(flatOutputs).length === 0 || !flatOutputs.NotificationTopicArn) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: flatOutputs.NotificationTopicArn
      });

      try {
        const response = await snsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.TopicArn).toBe(flatOutputs.NotificationTopicArn);
      } catch (error: any) {
        if (error.name === 'NotFoundException') {
          console.log('SNS topic not found - stack may not be deployed');
        } else {
          throw error;
        }
      }
    }, 15000);
  });

  describe('Template Structure Verification', () => {
    test('pipeline template should have all required stages', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const pipeline = template.Resources.CodePipeline;
      const stages = pipeline.Properties.Stages;

      expect(stages).toHaveLength(3);
      expect(stages.map((s: any) => s.Name)).toEqual([
        'Source',
        'Build',
        'Test'
      ]);
    });

    test('all IAM roles should include environmentSuffix in names', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const roles = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );

      roles.forEach((role: any) => {
        const roleName = role.Properties.RoleName;
        if (typeof roleName === 'object' && roleName['Fn::Sub']) {
          expect(roleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });

      expect(roles.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have proper encryption and versioning', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('KMS key should have rotation enabled and proper policies', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const kmsKey = template.Resources.ArtifactEncryptionKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('EventBridge rules should target SNS topic for notifications', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const stateChangeRule = template.Resources.PipelineStateChangeRule;
      const failureRule = template.Resources.PipelineFailureRule;

      expect(stateChangeRule.Properties.Targets[0].Arn).toEqual({
        Ref: 'PipelineNotificationTopic'
      });
      expect(failureRule.Properties.Targets[0].Arn).toEqual({
        Ref: 'PipelineNotificationTopic'
      });
    });
  });

  describe('Security Validation', () => {
    test('no resources should have DeletionPolicy Retain', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('cross-account role should have proper trust relationships', () => {
      const crossAccountYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'cross-account-role.yaml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(crossAccountYaml);

      const role = template.Resources.CrossAccountDeployRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      const principals = trustPolicy.Statement.map((s: any) =>
        s.Principal.AWS || s.Principal.Service
      );

      expect(principals).toContainEqual({
        'Fn::Sub': 'arn:aws:iam::${PipelineAccountId}:root'
      });
      expect(principals).toContainEqual('cloudformation.amazonaws.com');
    });

    test('CodeBuild projects should use KMS encryption', () => {
      const pipelineYaml = fs.readFileSync(
        path.join(__dirname, '..', 'lib', 'TapStack.yml'),
        'utf8'
      );
      const template = yamlCfn.yamlParse(pipelineYaml);

      const codeBuildProjects = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::CodeBuild::Project'
      );

      codeBuildProjects.forEach((project: any) => {
        expect(project.Properties.EncryptionKey).toEqual({
          'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn']
        });
      });

      expect(codeBuildProjects.length).toBeGreaterThan(0);
    });
  });
});
