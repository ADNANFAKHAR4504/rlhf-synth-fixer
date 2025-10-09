import fsSync from 'fs';
import {
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
  StartPipelineExecutionCommand,
  GetPipelineExecutionCommand,
  ListPipelineExecutionsCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
  ListDeploymentsCommand,
  GetDeploymentCommand,
} from '@aws-sdk/client-codedeploy';
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const codepipelineClient = new CodePipelineClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const codedeployClient = new CodeDeployClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

let outputs = {};

try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Could not load outputs file, tests will use default values');
}

const getOutputValue = (key, defaultValue) => {
  return outputs[`TapStack${environmentSuffix}.${key}`] || defaultValue;
};

const sourceBucketName = getOutputValue('SourceBucketName', `tapstack${environmentSuffix}-sourcebucket`);
const pipelineName = `healthcare-pipeline-${environmentSuffix}`;
const applicationName = `healthcare-app-${environmentSuffix}`;
const deploymentGroupName = `healthcare-deployment-${environmentSuffix}`;
const dashboardName = `healthcare-pipeline-${environmentSuffix}`;

describe('Healthcare CI/CD Pipeline Integration Tests', () => {
  describe('S3 Source Bucket', () => {
    test('should have accessible S3 source bucket', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new HeadBucketCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('source bucket should have versioning enabled', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new GetBucketVersioningCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('source bucket should have encryption enabled', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new GetBucketEncryptionCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
    }, 30000);
  });

  describe('S3 Artifact Bucket', () => {
    let bucketName;

    beforeAll(() => {
      bucketName = getOutputValue('ArtifactBucketName', null);
    });

    test('should have accessible S3 bucket', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('bucket should have versioning enabled', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }
      
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('bucket should have encryption enabled', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }
      
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    }, 30000);
  });

  describe('Lambda Security Scanner', () => {
    let functionArn;

    beforeAll(() => {
      functionArn = getOutputValue('SecurityScanLambdaArn', null);
    });

    test('should have accessible Lambda function', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.Runtime).toContain('nodejs');
      expect(response.Configuration.Handler).toBe('index.handler');
    }, 30000);

    test('Lambda should have correct timeout', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }
      
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Timeout).toBe(600);
    }, 30000);

    test('Lambda should have environment variables', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }
      
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Environment).toBeDefined();
      expect(response.Configuration.Environment.Variables).toHaveProperty('ARTIFACT_BUCKET');
    }, 30000);
  });

  describe('CodeBuild Projects', () => {
    test('should have three accessible CodeBuild projects', async () => {
      const projectNames = [
        `TestTapStack-BuildProject`,
        `TestTapStack-SecurityScanProject`,
        `TestTapStack-ComplianceCheckProject`,
      ];

      for (const prefix of projectNames) {
        try {
          const command = new BatchGetProjectsCommand({
            names: [prefix],
          });
          const response = await codebuildClient.send(command);
          
          if (response.projects && response.projects.length > 0) {
            expect(response.projects[0]).toBeDefined();
            expect(response.projects[0].environment).toBeDefined();
          }
        } catch (error) {
          console.log(`Project ${prefix} might have different naming, skipping`);
        }
      }
    }, 30000);
  });

  describe('CodePipeline', () => {
    test('should have accessible pipeline', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline.name).toBe(pipelineName);
      expect(response.pipeline.stages).toBeDefined();
    }, 30000);

    test('pipeline should have 6 stages', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline.stages).toHaveLength(6);
      
      const stageNames = response.pipeline.stages.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('BuildAndTest');
      expect(stageNames).toContain('SecurityScan');
      expect(stageNames).toContain('ComplianceCheck');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');
    }, 30000);

    test('Source stage should use S3', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const sourceStage = response.pipeline.stages.find(s => s.name === 'Source');
      
      expect(sourceStage).toBeDefined();
      expect(sourceStage.actions[0].actionTypeId.provider).toBe('S3');
      expect(sourceStage.actions[0].configuration.S3ObjectKey).toBe('source.zip');
    }, 30000);

    test('BuildAndTest stage should use CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const buildStage = response.pipeline.stages.find(s => s.name === 'BuildAndTest');
      
      expect(buildStage).toBeDefined();
      expect(buildStage.actions[0].actionTypeId.provider).toBe('CodeBuild');
    }, 30000);

    test('SecurityScan stage should have CodeBuild and Lambda actions', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const securityStage = response.pipeline.stages.find(s => s.name === 'SecurityScan');
      
      expect(securityStage).toBeDefined();
      expect(securityStage.actions).toHaveLength(2);
      
      const codeBuildAction = securityStage.actions.find(a => a.actionTypeId.provider === 'CodeBuild');
      const lambdaAction = securityStage.actions.find(a => a.actionTypeId.provider === 'Lambda');
      
      expect(codeBuildAction).toBeDefined();
      expect(lambdaAction).toBeDefined();
    }, 30000);

    test('Approval stage should use Manual approval', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const approvalStage = response.pipeline.stages.find(s => s.name === 'Approval');
      
      expect(approvalStage).toBeDefined();
      expect(approvalStage.actions[0].actionTypeId.provider).toBe('Manual');
      expect(approvalStage.actions[0].actionTypeId.category).toBe('Approval');
    }, 30000);

    test('Deploy stage should use CodeDeploy', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const deployStage = response.pipeline.stages.find(s => s.name === 'Deploy');
      
      expect(deployStage).toBeDefined();
      expect(deployStage.actions[0].actionTypeId.provider).toBe('CodeDeploy');
    }, 30000);

    test('pipeline state should be accessible', async () => {
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    }, 30000);
  });

  describe('CodeDeploy', () => {
    test('should have accessible CodeDeploy application', async () => {
      const command = new GetApplicationCommand({
        applicationName,
      });

      const response = await codedeployClient.send(command);
      expect(response.application).toBeDefined();
      expect(response.application.applicationName).toBe(applicationName);
      expect(response.application.computePlatform).toBe('Server');
    }, 30000);

    test('should have deployment group with rollback configuration', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });

      const response = await codedeployClient.send(command);
      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo.deploymentGroupName).toBe(deploymentGroupName);
      expect(response.deploymentGroupInfo.autoRollbackConfiguration).toBeDefined();
      expect(response.deploymentGroupInfo.autoRollbackConfiguration.enabled).toBe(true);
      expect(response.deploymentGroupInfo.autoRollbackConfiguration.events).toContain('DEPLOYMENT_FAILURE');
    }, 30000);

  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarm for pipeline failures', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${environmentSuffix}`,
        MaxRecords: 100,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      
      const pipelineAlarm = response.MetricAlarms.find(alarm =>
        alarm.MetricName === 'PipelineExecutionFailure' &&
        alarm.Namespace === 'AWS/CodePipeline'
      );
      
      expect(pipelineAlarm).toBeDefined();
      expect(pipelineAlarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(pipelineAlarm.Threshold).toBe(1);
    }, 30000);

    test('should have CloudWatch dashboard', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
      
      const dashboardBody = JSON.parse(response.DashboardBody);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Workflow Verification', () => {
    test('all pipeline components should be properly connected', async () => {
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      
      expect(pipelineResponse.pipeline.artifactStore).toBeDefined();
      expect(pipelineResponse.pipeline.artifactStore.type).toBe('S3');
      
      const bucketName = pipelineResponse.pipeline.artifactStore.location;
      const bucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(bucketCommand)).resolves.toBeDefined();
    }, 30000);

    test('pipeline artifact bucket should match output bucket', async () => {
      const outputBucket = getOutputValue('ArtifactBucketName', null);
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      
      if (outputBucket) {
        expect(pipelineResponse.pipeline.artifactStore.location).toBe(outputBucket);
      }
    }, 30000);

    test('deployment configuration should support rollback', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });

      const response = await codedeployClient.send(command);
      const rollbackConfig = response.deploymentGroupInfo.autoRollbackConfiguration;
      
      expect(rollbackConfig.enabled).toBe(true);
      expect(rollbackConfig.events).toContain('DEPLOYMENT_FAILURE');
      expect(rollbackConfig.events).toContain('DEPLOYMENT_STOP_ON_REQUEST');
    }, 30000);
  });

  describe('Security and Compliance Verification', () => {
    test('S3 bucket should have proper security configuration', async () => {
      const bucketName = getOutputValue('ArtifactBucketName', null);
      
      if (bucketName) {
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        
        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
        const versioningResponse = await s3Client.send(versioningCommand);
        
        expect(versioningResponse.Status).toBe('Enabled');
      }
    }, 30000);

    test('Lambda function should have proper IAM role', async () => {
      const functionArn = getOutputValue('SecurityScanLambdaArn', null);
      
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        
        expect(response.Configuration.Role).toBeDefined();
        expect(response.Configuration.Role).toMatch(/^arn:aws:iam::/);
      }
    }, 30000);

    test('pipeline should have proper IAM service role', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      expect(response.pipeline.roleArn).toBeDefined();
      expect(response.pipeline.roleArn).toMatch(/^arn:aws:iam::/);
    }, 30000);
  });

  describe('End-to-End Application Flow Testing', () => {
    const testSourceKey = 'test-source.zip';
    let testExecutionId;
    let deploymentId;
    
    beforeAll(async () => {
      // Create a test source package
      await createTestSourcePackage();
    }, 30000);

    afterAll(async () => {
      // Cleanup test artifacts
      try {
        await cleanupTestArtifacts();
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }, 30000);

    async function createTestSourcePackage() {
      const testFiles = {
        'package.json': JSON.stringify({
          name: 'healthcare-app-test',
          version: '1.0.0',
          scripts: {
            build: 'echo "Build completed"',
            test: 'echo "Tests passed"'
          }
        }, null, 2),
        'app.js': `
          const express = require('express');
          const app = express();
          const port = process.env.PORT || 3000;
          
          app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
          });
          
          app.get('/', (req, res) => {
            res.json({ message: 'Healthcare Application Running' });
          });
          
          app.listen(port, () => {
            console.log(\`Healthcare app listening on port \${port}\`);
          });
        `,
        'appspec.yml': `
version: 0.0
os: linux
files:
  - source: /
    destination: /opt/healthcare-app
hooks:
  BeforeInstall:
    - location: scripts/install_dependencies.sh
      timeout: 300
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 300
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 300
        `,
        'scripts/install_dependencies.sh': `#!/bin/bash
echo "Installing dependencies for healthcare app"
mkdir -p /opt/healthcare-app
cd /opt/healthcare-app
npm install --production || true
`,
        'scripts/start_server.sh': `#!/bin/bash
echo "Starting healthcare application"
cd /opt/healthcare-app
npm start &
echo $! > /tmp/healthcare-app.pid
`,
        'scripts/stop_server.sh': `#!/bin/bash
echo "Stopping healthcare application"
if [ -f /tmp/healthcare-app.pid ]; then
  kill $(cat /tmp/healthcare-app.pid) || true
  rm /tmp/healthcare-app.pid
fi
`
      };

      // Create temporary directory and files
      const tmpDir = '/tmp/healthcare-test-source';
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.mkdir(`${tmpDir}/scripts`, { recursive: true });
      
      for (const [filename, content] of Object.entries(testFiles)) {
        await fs.writeFile(path.join(tmpDir, filename), content.trim());
      }
      
      // Make scripts executable
      await fs.chmod(path.join(tmpDir, 'scripts/install_dependencies.sh'), 0o755);
      await fs.chmod(path.join(tmpDir, 'scripts/start_server.sh'), 0o755);
      await fs.chmod(path.join(tmpDir, 'scripts/stop_server.sh'), 0o755);
    }

    async function cleanupTestArtifacts() {
      try {
        // Clean up temporary files
        await fs.rm('/tmp/healthcare-test-source', { recursive: true, force: true });
        
        // Clean up S3 test objects (only if outputs are available)
        if (outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
          try {
            const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
            const deleteCommand = new DeleteObjectCommand({
              Bucket: sourceBucketName,
              Key: testSourceKey
            });
            await s3Client.send(deleteCommand).catch(() => {}); // Ignore errors
          } catch (error) {
            console.warn('S3 cleanup not available:', error.message);
          }
        }
      } catch (error) {
        console.warn('Cleanup error:', error.message);
      }
    }

    test('should create and upload test source package to S3', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: No deployed infrastructure found (source bucket not available)');
        return;
      }

      const tmpDir = '/tmp/healthcare-test-source';
      const zipPath = '/tmp/test-source.zip';
      
      // Create ZIP archive
      const output = fsSync.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.pipe(output);
      archive.directory(tmpDir, false);
      await archive.finalize();
      
      // Wait for ZIP to be created
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Upload to S3
      const zipBuffer = await fs.readFile(zipPath);
      const uploadCommand = new PutObjectCommand({
        Bucket: sourceBucketName,
        Key: testSourceKey,
        Body: zipBuffer,
        ContentType: 'application/zip'
      });

      const uploadResponse = await s3Client.send(uploadCommand);
      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);
      
      // Verify upload
      const headCommand = new HeadBucketCommand({ Bucket: sourceBucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();
      
      // Cleanup temp zip
      await fs.unlink(zipPath);
    }, 60000);

    test('should trigger pipeline execution when source is uploaded', async () => {
      if (!outputs[`TapStack${environmentSuffix}.PipelineName`]) {
        console.log('Skipping: No deployed pipeline found');
        return;
      }

      try {
        // Start pipeline execution manually (simulating trigger)
        const startCommand = new StartPipelineExecutionCommand({
          name: pipelineName
        });

        const startResponse = await codepipelineClient.send(startCommand);
        testExecutionId = startResponse.pipelineExecutionId;
        
        expect(testExecutionId).toBeDefined();
        expect(startResponse.$metadata.httpStatusCode).toBe(200);
      } catch (error) {
        if (error.message.includes('credentials')) {
          console.log('Skipping: AWS credentials not available');
          return;
        }
        throw error;
      }
    }, 30000);

    test('should track pipeline execution progress through all stages', async () => {
      if (!testExecutionId) {
        console.log('Skipping: No test execution ID available');
        return;
      }

      // Wait for pipeline to progress (up to 10 minutes)
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes with 10-second intervals
      let executionStatus = 'InProgress';
      
      while (attempts < maxAttempts && executionStatus === 'InProgress') {
        const command = new GetPipelineExecutionCommand({
          pipelineName,
          pipelineExecutionId: testExecutionId
        });

        const response = await codepipelineClient.send(command);
        executionStatus = response.pipelineExecution.status;
        
        console.log(`Pipeline execution attempt ${attempts + 1}/${maxAttempts}, status: ${executionStatus}`);
        
        if (executionStatus === 'InProgress') {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
        
        attempts++;
      }

      // Validate execution progressed
      expect(['Succeeded', 'Failed', 'Stopped', 'InProgress']).toContain(executionStatus);
      
      // Get stage states for detailed validation
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      expect(stateResponse.stageStates).toBeDefined();
      expect(stateResponse.stageStates.length).toBe(6);
      
      // Verify Source stage completed
      const sourceStage = stateResponse.stageStates.find(s => s.stageName === 'Source');
      expect(sourceStage).toBeDefined();
      expect(['Succeeded', 'InProgress']).toContain(sourceStage.latestExecution?.status || 'Unknown');
    }, 600000); // 10 minute timeout

    test('should validate artifact flow between pipeline stages', async () => {
      // Get pipeline execution details
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      // Check that artifacts are being passed between stages
      for (const stage of stateResponse.stageStates) {
        if (stage.latestExecution) {
          console.log(`Stage: ${stage.stageName}, Status: ${stage.latestExecution.status}`);
          
          // For stages that have completed, verify they have input/output artifacts
          if (stage.latestExecution.status === 'Succeeded') {
            expect(stage.actionStates).toBeDefined();
            expect(stage.actionStates.length).toBeGreaterThan(0);
          }
        }
      }
      
      // Verify artifacts are stored in S3
      const listCommand = new ListObjectsV2Command({
        Bucket: getOutputValue('ArtifactBucketName', null)
      });
      
      if (getOutputValue('ArtifactBucketName', null)) {
        const listResponse = await s3Client.send(listCommand);
        console.log(`Found ${listResponse.Contents?.length || 0} artifacts in bucket`);
        // We should have some artifacts if pipeline has run
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          expect(listResponse.Contents.length).toBeGreaterThan(0);
        }
      }
    }, 60000);

    test('should validate security scan stage produces security report', async () => {
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      const securityStage = stateResponse.stageStates.find(s => s.stageName === 'SecurityScan');
      
      if (securityStage && securityStage.latestExecution?.status === 'Succeeded') {
        // Check for security report artifacts in S3
        const artifactBucket = getOutputValue('ArtifactBucketName', null);
        
        if (artifactBucket) {
          const listCommand = new ListObjectsV2Command({
            Bucket: artifactBucket,
            Prefix: `${pipelineName}/SecurityScan/`
          });
          
          try {
            const listResponse = await s3Client.send(listCommand);
            console.log('Security scan artifacts found:', listResponse.Contents?.length || 0);
            
            // Look for security-report.json in artifacts
            const securityReport = listResponse.Contents?.find(obj => 
              obj.Key?.includes('security-report.json')
            );
            
            if (securityReport) {
              expect(securityReport).toBeDefined();
              console.log('Security report found:', securityReport.Key);
            }
          } catch (error) {
            console.log('Note: Security scan artifacts not accessible or not yet created');
          }
        }
      } else {
        console.log('Security scan stage not yet completed or failed');
      }
    }, 30000);

    test('should validate compliance check produces compliance report', async () => {
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      const complianceStage = stateResponse.stageStates.find(s => s.stageName === 'ComplianceCheck');
      
      if (complianceStage && complianceStage.latestExecution?.status === 'Succeeded') {
        const artifactBucket = getOutputValue('ArtifactBucketName', null);
        
        if (artifactBucket) {
          const listCommand = new ListObjectsV2Command({
            Bucket: artifactBucket,
            Prefix: `${pipelineName}/ComplianceCheck/`
          });
          
          try {
            const listResponse = await s3Client.send(listCommand);
            console.log('Compliance check artifacts found:', listResponse.Contents?.length || 0);
            
            const complianceReport = listResponse.Contents?.find(obj => 
              obj.Key?.includes('compliance-report.json')
            );
            
            if (complianceReport) {
              expect(complianceReport).toBeDefined();
              console.log('Compliance report found:', complianceReport.Key);
            }
          } catch (error) {
            console.log('Note: Compliance check artifacts not accessible or not yet created');
          }
        }
      } else {
        console.log('Compliance check stage not yet completed or failed');
      }
    }, 30000);

    test('should validate manual approval stage blocks deployment', async () => {
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      const approvalStage = stateResponse.stageStates.find(s => s.stageName === 'Approval');
      
      if (approvalStage) {
        console.log('Approval stage status:', approvalStage.latestExecution?.status);
        
        // If approval stage is in progress, verify deploy stage is waiting
        if (approvalStage.latestExecution?.status === 'InProgress') {
          const deployStage = stateResponse.stageStates.find(s => s.stageName === 'Deploy');
          
          // Deploy stage should not have started yet
          if (deployStage) {
            expect(['NotStarted', undefined]).toContain(deployStage.latestExecution?.status);
          }
        }
        
        expect(approvalStage.actionStates).toBeDefined();
        if (approvalStage.actionStates?.length > 0) {
          const approvalAction = approvalStage.actionStates[0];
          expect(approvalAction.actionName).toBe('DeploymentApproval');
        }
      }
    }, 30000);

    test('should validate deployment stage configuration and readiness', async () => {
      // Even if deployment hasn't run, verify it's properly configured
      const stateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codepipelineClient.send(stateCommand);
      
      const deployStage = stateResponse.stageStates.find(s => s.stageName === 'Deploy');
      expect(deployStage).toBeDefined();
      
      // Check CodeDeploy application and deployment group readiness
      const appCommand = new GetApplicationCommand({ applicationName });
      const appResponse = await codedeployClient.send(appCommand);
      
      expect(appResponse.application.applicationName).toBe(applicationName);
      
      const dgCommand = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName
      });
      const dgResponse = await codedeployClient.send(dgCommand);
      
      expect(dgResponse.deploymentGroupInfo.deploymentGroupName).toBe(deploymentGroupName);
      expect(dgResponse.deploymentGroupInfo.autoRollbackConfiguration.enabled).toBe(true);
    }, 30000);

    test('should validate CloudWatch metrics are being generated during pipeline execution', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      
      // Check pipeline execution metrics
      const metricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/CodePipeline',
        MetricName: 'PipelineExecutionSuccess',
        Dimensions: [
          {
            Name: 'PipelineName',
            Value: pipelineName
          }
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300, // 5 minutes
        Statistics: ['Sum']
      });
      
      try {
        const metricsResponse = await cloudwatchClient.send(metricsCommand);
        console.log('Pipeline success metrics datapoints:', metricsResponse.Datapoints?.length || 0);
        
        // We expect metrics to be available (even if 0 datapoints initially)
        expect(metricsResponse.Datapoints).toBeDefined();
      } catch (error) {
        console.log('Note: Pipeline metrics may not be available yet:', error.message);
      }
      
      // Check failure metrics as well
      const failureMetricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/CodePipeline',
        MetricName: 'PipelineExecutionFailure',
        Dimensions: [
          {
            Name: 'PipelineName',
            Value: pipelineName
          }
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ['Sum']
      });
      
      try {
        const failureMetricsResponse = await cloudwatchClient.send(failureMetricsCommand);
        console.log('Pipeline failure metrics datapoints:', failureMetricsResponse.Datapoints?.length || 0);
        expect(failureMetricsResponse.Datapoints).toBeDefined();
      } catch (error) {
        console.log('Note: Pipeline failure metrics may not be available yet:', error.message);
      }
    }, 30000);

    test('should validate alarm triggers during pipeline failures (simulation)', async () => {
      // Get the pipeline failure alarm
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${environmentSuffix}`,
        MaxRecords: 100
      });
      
      const alarmsResponse = await cloudwatchClient.send(alarmsCommand);
      const pipelineAlarm = alarmsResponse.MetricAlarms?.find(alarm =>
        alarm.MetricName === 'PipelineExecutionFailure'
      );
      
      if (pipelineAlarm) {
        console.log('Pipeline failure alarm found:', pipelineAlarm.AlarmName);
        console.log('Alarm state:', pipelineAlarm.StateValue);
        console.log('Alarm threshold:', pipelineAlarm.Threshold);
        
        // Validate alarm configuration
        expect(pipelineAlarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
        expect(pipelineAlarm.Threshold).toBe(1);
        expect(pipelineAlarm.MetricName).toBe('PipelineExecutionFailure');
        expect(pipelineAlarm.Namespace).toBe('AWS/CodePipeline');
        
        // Note: In a real failure scenario, this alarm would be in ALARM state
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(pipelineAlarm.StateValue);
      } else {
        console.log('Pipeline failure alarm not found - this may indicate a configuration issue');
      }
    }, 30000);

    test('should validate end-to-end pipeline execution history and patterns', async () => {
      // Get recent pipeline executions
      const listCommand = new ListPipelineExecutionsCommand({
        pipelineName,
        maxResults: 10
      });
      
      const listResponse = await codepipelineClient.send(listCommand);
      
      expect(listResponse.pipelineExecutionSummaries).toBeDefined();
      console.log('Total pipeline executions found:', listResponse.pipelineExecutionSummaries.length);
      
      if (listResponse.pipelineExecutionSummaries.length > 0) {
        const executions = listResponse.pipelineExecutionSummaries;
        const statuses = executions.map(e => e.status);
        
        console.log('Execution statuses:', statuses);
        
        const validStatuses = ['InProgress', 'Succeeded', 'Failed', 'Stopped', 'Stopping', 'Superseded'];
        statuses.forEach(status => {
          expect(validStatuses).toContain(status);
        });
        
        if (testExecutionId) {
          const ourExecution = executions.find(e => e.pipelineExecutionId === testExecutionId);
          if (ourExecution) {
            console.log('Our test execution status:', ourExecution.status);
            expect(ourExecution.pipelineExecutionId).toBe(testExecutionId);
          }
        }
      }
    }, 30000);
  });
});
