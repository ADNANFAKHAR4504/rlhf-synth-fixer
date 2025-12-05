import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Code Structure Tests', () => {
  const libPath = path.join(__dirname, '../../lib');

  describe('Project Files', () => {
    it('should have index.ts file', () => {
      const indexPath = path.join(libPath, 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have PROMPT.md file', () => {
      const promptPath = path.join(libPath, 'PROMPT.md');
      expect(fs.existsSync(promptPath)).toBe(true);
    });

    it('should have MODEL_FAILURES.md file', () => {
      const failuresPath = path.join(libPath, 'MODEL_FAILURES.md');
      expect(fs.existsSync(failuresPath)).toBe(true);
    });

    it('should have IDEAL_RESPONSE.md file', () => {
      const idealPath = path.join(libPath, 'IDEAL_RESPONSE.md');
      expect(fs.existsSync(idealPath)).toBe(true);
    });

    it('should have lambda directory', () => {
      const lambdaPath = path.join(libPath, 'lambda');
      expect(fs.existsSync(lambdaPath)).toBe(true);
      expect(fs.statSync(lambdaPath).isDirectory()).toBe(true);
    });

    it('should have lambda index.js', () => {
      const lambdaIndexPath = path.join(libPath, 'lambda/index.js');
      expect(fs.existsSync(lambdaIndexPath)).toBe(true);
    });

    it('should have lambda package.json', () => {
      const lambdaPackagePath = path.join(libPath, 'lambda/package.json');
      expect(fs.existsSync(lambdaPackagePath)).toBe(true);
    });

    it('should have Pulumi.yaml in root', () => {
      const pulumiYamlPath = path.join(__dirname, '../../Pulumi.yaml');
      expect(fs.existsSync(pulumiYamlPath)).toBe(true);
    });

    it('should have package.json in root', () => {
      const packagePath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have metadata.json in root', () => {
      const metadataPath = path.join(__dirname, '../../metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);
    });
  });

  describe('Infrastructure Code Content', () => {
    let indexContent: string;

    beforeAll(() => {
      const indexPath = path.join(libPath, 'index.ts');
      indexContent = fs.readFileSync(indexPath, 'utf-8');
    });

    it('should import pulumi packages', () => {
      expect(indexContent).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(indexContent).toContain("import * as aws from '@pulumi/aws'");
    });

    it('should create S3 bucket for compliance results', () => {
      expect(indexContent).toContain('aws.s3.Bucket');
      expect(indexContent).toContain('compliance-results');
    });

    it('should create SNS topic for alerts', () => {
      expect(indexContent).toContain('aws.sns.Topic');
      expect(indexContent).toContain('compliance-alerts');
    });

    it('should create Lambda function', () => {
      expect(indexContent).toContain('aws.lambda.Function');
      expect(indexContent).toContain('compliance-scanner');
    });

    it('should create IAM role and policy', () => {
      expect(indexContent).toContain('aws.iam.Role');
      expect(indexContent).toContain('aws.iam.RolePolicy');
    });

    it('should create EventBridge rule', () => {
      expect(indexContent).toContain('aws.cloudwatch.EventRule');
      expect(indexContent).toContain('rate(6 hours)');
    });

    it('should create CloudWatch dashboard', () => {
      expect(indexContent).toContain('aws.cloudwatch.Dashboard');
      expect(indexContent).toContain('compliance-dashboard');
    });

    it('should create CloudWatch alarm', () => {
      expect(indexContent).toContain('aws.cloudwatch.MetricAlarm');
      expect(indexContent).toContain('compliance-threshold-alarm');
    });

    it('should create CloudWatch log group', () => {
      expect(indexContent).toContain('aws.cloudwatch.LogGroup');
      expect(indexContent).toContain('/aws/lambda/compliance-scanner');
    });

    it('should export all required outputs', () => {
      expect(indexContent).toContain('export const bucketName');
      expect(indexContent).toContain('export const topicArn');
      expect(indexContent).toContain('export const lambdaFunctionName');
      expect(indexContent).toContain('export const lambdaFunctionArn');
      expect(indexContent).toContain('export const dashboardName');
      expect(indexContent).toContain('export const alarmName');
      expect(indexContent).toContain('export const eventRuleName');
      expect(indexContent).toContain('export const logGroupName');
    });

    it('should use environmentSuffix configuration', () => {
      expect(indexContent).toContain('environmentSuffix');
      expect(indexContent).toContain("process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix')");
    });

    it('should use nodejs20.x runtime', () => {
      expect(indexContent).toContain("runtime: 'nodejs20.x'");
    });

    it('should set Lambda timeout to 300 seconds', () => {
      expect(indexContent).toContain('timeout: 300');
    });

    it('should set Lambda memory to 256 MB', () => {
      expect(indexContent).toContain('memorySize: 256');
    });

    it('should NOT set AWS_REGION environment variable (reserved)', () => {
      const envVarMatch = indexContent.match(/AWS_REGION.*:/);
      expect(envVarMatch).toBeNull();
    });

    it('should use FileArchive for lambda code', () => {
      expect(indexContent).toContain('FileArchive');
      expect(indexContent).toContain('./lambda');
    });
  });

  describe('Lambda Code Content', () => {
    let lambdaContent: string;

    beforeAll(() => {
      const lambdaPath = path.join(libPath, 'lambda/index.js');
      lambdaContent = fs.readFileSync(lambdaPath, 'utf-8');
    });

    it('should import AWS SDK clients', () => {
      expect(lambdaContent).toContain('@aws-sdk/client-ec2');
      expect(lambdaContent).toContain('@aws-sdk/client-s3');
      expect(lambdaContent).toContain('@aws-sdk/client-cloudwatch');
      expect(lambdaContent).toContain('@aws-sdk/client-sns');
    });

    it('should export handler function', () => {
      expect(lambdaContent).toContain('exports.handler');
    });

    it('should use environment variables', () => {
      expect(lambdaContent).toContain('process.env.REQUIRED_TAGS');
      expect(lambdaContent).toContain('process.env.BUCKET_NAME');
      expect(lambdaContent).toContain('process.env.TOPIC_ARN');
    });

    it('should implement getAllInstances function', () => {
      expect(lambdaContent).toContain('async function getAllInstances()');
      expect(lambdaContent).toContain('DescribeInstancesCommand');
    });

    it('should implement checkInstanceCompliance function', () => {
      expect(lambdaContent).toContain('function checkInstanceCompliance(instance)');
    });

    it('should implement storeResults function', () => {
      expect(lambdaContent).toContain('async function storeResults(scanResult, timestamp)');
      expect(lambdaContent).toContain('PutObjectCommand');
    });

    it('should implement publishMetrics function', () => {
      expect(lambdaContent).toContain('async function publishMetrics');
      expect(lambdaContent).toContain('PutMetricDataCommand');
    });

    it('should implement sendAlert function', () => {
      expect(lambdaContent).toContain('async function sendAlert(scanResult)');
      expect(lambdaContent).toContain('PublishCommand');
    });

    it('should NOT hardcode AWS region (use SDK auto-detection)', () => {
      const clientRegionMatch = lambdaContent.match(/new EC2Client\(\{ *region:/);
      expect(clientRegionMatch).toBeNull();
    });
  });

  describe('Configuration Files', () => {
    it('should have valid Pulumi.yaml', () => {
      const pulumiYamlPath = path.join(__dirname, '../../Pulumi.yaml');
      const content = fs.readFileSync(pulumiYamlPath, 'utf-8');
      expect(content).toContain('name: TapStack');
      expect(content).toContain('runtime: nodejs');
      expect(content).toContain('environmentSuffix');
    });

    it('should have valid metadata.json', () => {
      const metadataPath = path.join(__dirname, '../../metadata.json');
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      expect(metadata.po_id).toBeDefined();
      expect(metadata.platform).toBe('pulumi');
      expect(metadata.language).toBe('ts');
    });

    it('should have valid lambda package.json', () => {
      const lambdaPackagePath = path.join(libPath, 'lambda/package.json');
      const content = fs.readFileSync(lambdaPackagePath, 'utf-8');
      const packageJson = JSON.parse(content);
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@aws-sdk/client-ec2']).toBeDefined();
    });
  });

  describe('Documentation Files', () => {
    it('should have non-empty PROMPT.md', () => {
      const promptPath = path.join(libPath, 'PROMPT.md');
      const content = fs.readFileSync(promptPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('compliance');
    });

    it('should have non-empty MODEL_FAILURES.md', () => {
      const failuresPath = path.join(libPath, 'MODEL_FAILURES.md');
      const content = fs.readFileSync(failuresPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('AWS_REGION');
    });

    it('should have non-empty IDEAL_RESPONSE.md', () => {
      const idealPath = path.join(libPath, 'IDEAL_RESPONSE.md');
      const content = fs.readFileSync(idealPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('Pulumi');
    });
  });
});
