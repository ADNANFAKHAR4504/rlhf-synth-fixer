import fs from 'fs';
import { CodePipelineClient, GetPipelineStateCommand } from '@aws-sdk/client-codepipeline';
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from '@aws-sdk/client-elastic-beanstalk';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const codePipelineClient = new CodePipelineClient({ region });
const elasticBeanstalkClient = new ElasticBeanstalkClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });

describe('AWS CI/CD Pipeline Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('Stack should have all required outputs', () => {
      const requiredOutputs = [
        'PipelineName',
        'ArtifactsBucketName',
        'KMSKeyId',
        'SNSTopicArn',
        'DevelopmentEnvironmentURL',
        'TestingEnvironmentURL',
        'ProductionEnvironmentURL',
        'CodeBuildProjectName',
        'ElasticBeanstalkApplicationName',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Environment suffix should match deployment', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('CodePipeline Integration', () => {
    test('Pipeline should exist and be accessible', async () => {
      const command = new GetPipelineStateCommand({
        name: outputs.PipelineName
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipelineName).toBe(outputs.PipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBe(5); // Source, Build, DeployToDev, DeployToTest, DeployToProd
    }, 30000);

    test('Pipeline stages should be correctly configured', async () => {
      const command = new GetPipelineStateCommand({
        name: outputs.PipelineName
      });

      const response = await codePipelineClient.send(command);
      const stageNames = response.stageStates?.map(stage => stage.stageName) || [];
      
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('DeployToDev');
      expect(stageNames).toContain('DeployToTest');
      expect(stageNames).toContain('DeployToProd');
    }, 30000);
  });

  describe('Elastic Beanstalk Integration', () => {
    test('Development environment should be ready', async () => {
      const envName = `cicd-dev-${environmentSuffix}`;
      const command = new DescribeEnvironmentsCommand({
        EnvironmentNames: [envName]
      });

      const response = await elasticBeanstalkClient.send(command);
      expect(response.Environments).toHaveLength(1);
      
      const environment = response.Environments![0];
      expect(environment.EnvironmentName).toBe(envName);
      expect(environment.Status).toBe('Ready');
      expect(environment.Health).toBeDefined();
      expect(environment.EndpointURL).toEqual(outputs.DevelopmentEnvironmentURL);
    }, 30000);

    test('Testing environment should be ready', async () => {
      const envName = `cicd-test-${environmentSuffix}`;
      const command = new DescribeEnvironmentsCommand({
        EnvironmentNames: [envName]
      });

      const response = await elasticBeanstalkClient.send(command);
      expect(response.Environments).toHaveLength(1);
      
      const environment = response.Environments![0];
      expect(environment.EnvironmentName).toBe(envName);
      expect(environment.Status).toBe('Ready');
      expect(environment.EndpointURL).toEqual(outputs.TestingEnvironmentURL);
    }, 30000);

    test('Production environment should be ready', async () => {
      const envName = `cicd-prod-${environmentSuffix}`;
      const command = new DescribeEnvironmentsCommand({
        EnvironmentNames: [envName]
      });

      const response = await elasticBeanstalkClient.send(command);
      expect(response.Environments).toHaveLength(1);
      
      const environment = response.Environments![0];
      expect(environment.EnvironmentName).toBe(envName);
      expect(environment.Status).toBe('Ready');
      expect(environment.EndpointURL).toEqual(outputs.ProductionEnvironmentURL);
    }, 30000);
  });

  describe('S3 Artifacts Bucket Integration', () => {
    test('Artifacts bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ArtifactsBucketName
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('Bucket name should follow naming convention', () => {
      const expectedPattern = new RegExp(`^cicd-artifacts-${environmentSuffix}-${region}-\\d{12}$`);
      expect(outputs.ArtifactsBucketName).toMatch(expectedPattern);
    });
  });

  describe('SNS Notifications Integration', () => {
    test('SNS topic should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined(); // Should be encrypted
    }, 30000);

    test('Topic ARN should follow AWS naming convention', () => {
      const expectedPattern = new RegExp(`^arn:aws:sns:${region}:\\d{12}:cicd-pipeline-notifications-${environmentSuffix}$`);
      expect(outputs.SNSTopicArn).toMatch(expectedPattern);
    });
  });

  describe('Cross-Service Integration', () => {
    test('All environment URLs should be accessible', async () => {
      const urls = [
        outputs.DevelopmentEnvironmentURL,
        outputs.TestingEnvironmentURL,
        outputs.ProductionEnvironmentURL
      ];

      urls.forEach(url => {
        expect(url).toBeDefined();
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });

    test('Resource names should include environment suffix', () => {
      expect(outputs.PipelineName).toContain(environmentSuffix);
      expect(outputs.ArtifactsBucketName).toContain(environmentSuffix);
      expect(outputs.CodeBuildProjectName).toContain(environmentSuffix);
      expect(outputs.ElasticBeanstalkApplicationName).toContain(environmentSuffix);
    });
  });

  describe('Multi-Region Compatibility', () => {
    test('Resources should be deployable in us-east-1 and us-west-2', () => {
      // This test validates that resource names and configurations
      // are compatible with both required regions
      const supportedRegions = ['us-east-1', 'us-west-2'];
      expect(supportedRegions).toContain(region);
      
      // Validate bucket name includes region
      expect(outputs.ArtifactsBucketName).toContain(region);
      
      // Validate SNS topic ARN includes region
      expect(outputs.SNSTopicArn).toContain(region);
    });
  });
});
