import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Code Structure Tests', () => {
  const libPath = path.join(__dirname, '../lib');
  const rootPath = path.join(__dirname, '..');

  describe('Project Files', () => {
    it('should have index.ts file', () => {
      const indexPath = path.join(libPath, 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have tap-stack.ts file', () => {
      const tapStackPath = path.join(libPath, 'tap-stack.ts');
      expect(fs.existsSync(tapStackPath)).toBe(true);
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

    it('should have analyse.py file', () => {
      const analysePath = path.join(libPath, 'analyse.py');
      expect(fs.existsSync(analysePath)).toBe(true);
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
      const pulumiYamlPath = path.join(rootPath, 'Pulumi.yaml');
      expect(fs.existsSync(pulumiYamlPath)).toBe(true);
    });

    it('should have package.json in root', () => {
      const packagePath = path.join(rootPath, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have metadata.json in root', () => {
      const metadataPath = path.join(rootPath, 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);
    });

    it('should have bin/tap.ts entry point', () => {
      const binPath = path.join(rootPath, 'bin/tap.ts');
      expect(fs.existsSync(binPath)).toBe(true);
    });
  });

  describe('Infrastructure Code Content - index.ts', () => {
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

  describe('Infrastructure Code Content - tap-stack.ts', () => {
    let tapStackContent: string;

    beforeAll(() => {
      const tapStackPath = path.join(libPath, 'tap-stack.ts');
      tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
    });

    it('should export TapStack class', () => {
      expect(tapStackContent).toContain('export class TapStack');
    });

    it('should export TapStackArgs interface', () => {
      expect(tapStackContent).toContain('export interface TapStackArgs');
    });

    it('should extend pulumi.ComponentResource', () => {
      expect(tapStackContent).toContain('extends pulumi.ComponentResource');
    });

    it('should define all required outputs', () => {
      expect(tapStackContent).toContain('public readonly bucketName');
      expect(tapStackContent).toContain('public readonly topicArn');
      expect(tapStackContent).toContain('public readonly scannerFunctionName');
      expect(tapStackContent).toContain('public readonly reporterFunctionName');
      expect(tapStackContent).toContain('public readonly dashboardName');
    });

    it('should create S3 bucket with versioning', () => {
      expect(tapStackContent).toContain('aws.s3.BucketV2');
      expect(tapStackContent).toContain('aws.s3.BucketVersioningV2');
    });

    it('should create lifecycle configuration for Glacier transition', () => {
      expect(tapStackContent).toContain('aws.s3.BucketLifecycleConfigurationV2');
      expect(tapStackContent).toContain('GLACIER');
      expect(tapStackContent).toContain('days: 90');
    });

    it('should create Lambda functions with 30-day log retention', () => {
      expect(tapStackContent).toContain('retentionInDays: 30');
    });

    it('should create four CloudWatch alarms', () => {
      expect(tapStackContent).toContain('scanner-failure-alarm');
      expect(tapStackContent).toContain('scanner-duration-alarm');
      expect(tapStackContent).toContain('reporter-failure-alarm');
      expect(tapStackContent).toContain('reporter-duration-alarm');
    });

    it('should set duration alarm threshold to 5 minutes (300000ms)', () => {
      expect(tapStackContent).toContain('threshold: 300000');
    });

    it('should register outputs', () => {
      expect(tapStackContent).toContain('this.registerOutputs');
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

    it('scanner should check security groups', () => {
      expect(scannerContent).toContain('DescribeSecurityGroupsCommand');
    });

    it('reporter should implement report generation logic', () => {
      expect(reporterContent).toContain('PutObjectCommand');
    });

    it('reporter should aggregate scan results', () => {
      expect(reporterContent).toContain('ListObjectsV2Command');
      expect(reporterContent).toContain('GetObjectCommand');
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
      const pulumiYamlPath = path.join(rootPath, 'Pulumi.yaml');
      const content = fs.readFileSync(pulumiYamlPath, 'utf-8');
      expect(content).toContain('name: TapStack');
      expect(content).toContain('runtime: nodejs');
      expect(content).toContain('environmentSuffix');
    });

    it('should have valid metadata.json', () => {
      const metadataPath = path.join(rootPath, 'metadata.json');
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      expect(metadata.po_id).toBeDefined();
      expect(metadata.platform).toBe('pulumi');
      expect(metadata.language).toBe('ts');
      expect(metadata.subtask).toBe('Infrastructure QA and Management');
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
    });

    it('should have non-empty IDEAL_RESPONSE.md', () => {
      const idealPath = path.join(libPath, 'IDEAL_RESPONSE.md');
      const content = fs.readFileSync(idealPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('Pulumi');
    });
  });

  describe('Analysis Script', () => {
    let analyseContent: string;

    beforeAll(() => {
      const analysePath = path.join(libPath, 'analyse.py');
      analyseContent = fs.readFileSync(analysePath, 'utf-8');
    });

    it('should import boto3', () => {
      expect(analyseContent).toContain('import boto3');
    });

    it('should define ComplianceMonitoringAnalyzer class', () => {
      expect(analyseContent).toContain('class ComplianceMonitoringAnalyzer');
    });

    it('should have analyze_lambda_functions method', () => {
      expect(analyseContent).toContain('def analyze_lambda_functions');
    });

    it('should have analyze_cloudwatch_resources method', () => {
      expect(analyseContent).toContain('def analyze_cloudwatch_resources');
    });

    it('should have analyze_sns_topics method', () => {
      expect(analyseContent).toContain('def analyze_sns_topics');
    });

    it('should have analyze_s3_buckets method', () => {
      expect(analyseContent).toContain('def analyze_s3_buckets');
    });

    it('should have analyze_eventbridge_rules method', () => {
      expect(analyseContent).toContain('def analyze_eventbridge_rules');
    });

    it('should have generate_report method', () => {
      expect(analyseContent).toContain('def generate_report');
    });

    it('should have main function', () => {
      expect(analyseContent).toContain('def main():');
    });
  });

  describe('Bin Entry Point', () => {
    let binContent: string;

    beforeAll(() => {
      const binPath = path.join(rootPath, 'bin/tap.ts');
      binContent = fs.readFileSync(binPath, 'utf-8');
    });

    it('should import TapStack from lib', () => {
      expect(binContent).toContain("import { TapStack } from '../lib/tap-stack'");
    });

    it('should require environmentSuffix config', () => {
      expect(binContent).toContain("config.require('environmentSuffix')");
    });

    it('should create TapStack instance', () => {
      expect(binContent).toContain('new TapStack');
    });

    it('should export all stack outputs', () => {
      expect(binContent).toContain('export const bucketName');
      expect(binContent).toContain('export const topicArn');
      expect(binContent).toContain('export const scannerFunctionName');
      expect(binContent).toContain('export const reporterFunctionName');
    });
  });
});
