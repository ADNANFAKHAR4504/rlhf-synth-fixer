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

    it('should have scanner lambda index.js', () => {
      const lambdaIndexPath = path.join(libPath, 'lambda/scanner/index.js');
      expect(fs.existsSync(lambdaIndexPath)).toBe(true);
    });

    it('should have scanner lambda package.json', () => {
      const lambdaPackagePath = path.join(
        libPath,
        'lambda/scanner/package.json'
      );
      expect(fs.existsSync(lambdaPackagePath)).toBe(true);
    });

    it('should have reporter lambda index.js', () => {
      const lambdaIndexPath = path.join(libPath, 'lambda/reporter/index.js');
      expect(fs.existsSync(lambdaIndexPath)).toBe(true);
    });

    it('should have reporter lambda package.json', () => {
      const lambdaPackagePath = path.join(
        libPath,
        'lambda/reporter/package.json'
      );
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
      expect(indexContent).toContain(
        "import * as pulumi from '@pulumi/pulumi'"
      );
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
      expect(indexContent).toContain('scanner-failure-alarm');
      expect(indexContent).toContain('reporter-failure-alarm');
    });

    it('should create CloudWatch log group', () => {
      expect(indexContent).toContain('aws.cloudwatch.LogGroup');
      expect(indexContent).toContain('/aws/lambda/compliance-scanner');
    });

    it('should export all required outputs', () => {
      expect(indexContent).toContain('export const bucketName');
      expect(indexContent).toContain('export const topicArn');
      expect(indexContent).toContain('export const scannerFunctionName');
      expect(indexContent).toContain('export const scannerFunctionArn');
      expect(indexContent).toContain('export const reporterFunctionName');
      expect(indexContent).toContain('export const reporterFunctionArn');
      expect(indexContent).toContain('export const dashboardName');
      expect(indexContent).toContain('export const scannerLogGroupName');
      expect(indexContent).toContain('export const reporterLogGroupName');
    });

    it('should use environmentSuffix configuration', () => {
      expect(indexContent).toContain('environmentSuffix');
      expect(indexContent).toContain("config.require('environmentSuffix')");
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
    let scannerContent: string;
    let reporterContent: string;

    beforeAll(() => {
      const scannerPath = path.join(libPath, 'lambda/scanner/index.js');
      const reporterPath = path.join(libPath, 'lambda/reporter/index.js');
      scannerContent = fs.readFileSync(scannerPath, 'utf-8');
      reporterContent = fs.readFileSync(reporterPath, 'utf-8');
    });

    it('scanner should import AWS SDK clients', () => {
      expect(scannerContent).toContain('@aws-sdk/client-ec2');
      expect(scannerContent).toContain('@aws-sdk/client-s3');
      expect(scannerContent).toContain('@aws-sdk/client-cloudwatch');
      expect(scannerContent).toContain('@aws-sdk/client-sns');
    });

    it('reporter should import AWS SDK clients', () => {
      expect(reporterContent).toContain('@aws-sdk/client-s3');
    });

    it('scanner should export handler function', () => {
      expect(scannerContent).toContain('exports.handler');
    });

    it('reporter should export handler function', () => {
      expect(reporterContent).toContain('exports.handler');
    });

    it('scanner should use environment variables', () => {
      expect(scannerContent).toContain('process.env');
    });

    it('reporter should use environment variables', () => {
      expect(reporterContent).toContain('process.env');
    });

    it('scanner should implement instance scanning logic', () => {
      expect(scannerContent).toContain('DescribeInstancesCommand');
    });

    it('reporter should implement report generation logic', () => {
      expect(reporterContent).toContain('PutObjectCommand');
    });

    it('scanner should NOT hardcode AWS region (use SDK auto-detection)', () => {
      const clientRegionMatch = scannerContent.match(
        /new EC2Client\(\{ *region:/
      );
      expect(clientRegionMatch).toBeNull();
    });

    it('reporter should NOT hardcode AWS region (use SDK auto-detection)', () => {
      const clientRegionMatch = reporterContent.match(
        /new S3Client\(\{ *region:/
      );
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

    it('should have valid scanner lambda package.json', () => {
      const lambdaPackagePath = path.join(
        libPath,
        'lambda/scanner/package.json'
      );
      const content = fs.readFileSync(lambdaPackagePath, 'utf-8');
      const packageJson = JSON.parse(content);
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@aws-sdk/client-ec2']).toBeDefined();
      expect(packageJson.dependencies['@aws-sdk/client-s3']).toBeDefined();
    });

    it('should have valid reporter lambda package.json', () => {
      const lambdaPackagePath = path.join(
        libPath,
        'lambda/reporter/package.json'
      );
      const content = fs.readFileSync(lambdaPackagePath, 'utf-8');
      const packageJson = JSON.parse(content);
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@aws-sdk/client-s3']).toBeDefined();
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
