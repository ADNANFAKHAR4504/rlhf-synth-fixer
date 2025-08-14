import * as fs from 'fs';
import * as path from 'path';
import { 
  S3Client, 
  GetBucketVersioningCommand, 
  GetBucketLifecycleConfigurationCommand,
  GetBucketEncryptionCommand 
} from '@aws-sdk/client-s3';
import { 
  CodeBuildClient, 
  BatchGetProjectsCommand 
} from '@aws-sdk/client-codebuild';
import { 
  CodePipelineClient, 
  GetPipelineCommand 
} from '@aws-sdk/client-codepipeline';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';
import { 
  IAMClient, 
  GetRoleCommand 
} from '@aws-sdk/client-iam';

const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

describe('CI/CD Pipeline Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let codeBuildClient: CodeBuildClient;
  let codePipelineClient: CodePipelineClient;
  let logsClient: CloudWatchLogsClient;
  let iamClient: IAMClient;
  
  const region = process.env.AWS_REGION || 'us-east-1';
  const projectName = 'trainr241';

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      console.log('No deployment outputs found, tests will use environment variables');
      outputs = {
        ArtifactsBucketName: process.env.ARTIFACTS_BUCKET_NAME,
        EnvironmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'test',
        stagingPipelineName: process.env.STAGING_PIPELINE_NAME,
        productionPipelineName: process.env.PRODUCTION_PIPELINE_NAME,
        TestProjectName: process.env.TEST_PROJECT_NAME
      };
    }

    // Initialize AWS clients
    s3Client = new S3Client({ region });
    codeBuildClient = new CodeBuildClient({ region });
    codePipelineClient = new CodePipelineClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe('Deployment Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.ArtifactsBucketName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.CodeBuildProjects).toBeDefined();
      expect(outputs.TestProjectName).toBeDefined();
      expect(outputs.stagingPipelineName).toBeDefined();
      expect(outputs.productionPipelineName).toBeDefined();
    });
  });

  describe('S3 Bucket Validation', () => {
    test('artifacts bucket should exist and be configured correctly', async () => {
      if (!outputs.ArtifactsBucketName) {
        console.log('Skipping S3 test - no bucket name in outputs');
        return;
      }

      try {
        // Check versioning
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({ 
            Bucket: outputs.ArtifactsBucketName 
          })
        );
        expect(versioningResponse.Status).toBe('Enabled');

        // Check lifecycle configuration
        const lifecycleResponse = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ 
            Bucket: outputs.ArtifactsBucketName 
          })
        );
        expect(lifecycleResponse.Rules).toBeDefined();
        expect(lifecycleResponse.Rules?.length).toBeGreaterThan(0);
        
        const deleteOldVersionsRule = lifecycleResponse.Rules?.find(
          rule => rule.ID === 'delete-old-versions'
        );
        expect(deleteOldVersionsRule).toBeDefined();
        expect(deleteOldVersionsRule?.Status).toBe('Enabled');
        expect(deleteOldVersionsRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);

        // Check encryption
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ 
            Bucket: outputs.ArtifactsBucketName 
          })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      } catch (error) {
        console.error('S3 validation error:', error);
        throw error;
      }
    }, 30000);
  });

  describe('CodeBuild Projects Validation', () => {
    test('build projects should exist and be configured correctly', async () => {
      if (!outputs.CodeBuildProjects) {
        console.log('Skipping CodeBuild test - no project names in outputs');
        return;
      }

      const projectNames = outputs.CodeBuildProjects.split(', ');
      expect(projectNames.length).toBeGreaterThan(0);

      try {
        const response = await codeBuildClient.send(
          new BatchGetProjectsCommand({ 
            names: projectNames 
          })
        );

        expect(response.projects).toBeDefined();
        expect(response.projects?.length).toBe(projectNames.length);

        // Validate each project
        response.projects?.forEach((project: any) => {
          expect(project.name).toBeDefined();
          expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
          expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
          expect(project.environment?.type).toBe('LINUX_CONTAINER');
          expect(project.cache?.type).toBe('LOCAL');
          expect(project.timeoutInMinutes).toBeDefined();
          
          // Check for environment-specific projects
          if (project.name?.includes('staging') || project.name?.includes('production')) {
            expect(project.timeoutInMinutes).toBe(30);
            const envVars = project.environment?.environmentVariables;
            expect(envVars).toBeDefined();
            
            const envVar = envVars?.find((v: any) => v.name === 'ENVIRONMENT');
            expect(envVar).toBeDefined();
            
            const projectVar = envVars?.find((v: any) => v.name === 'PROJECT_NAME');
            expect(projectVar).toBeDefined();
            expect(projectVar?.value).toBe(projectName);
          }
          
          // Check for test project
          if (project.name?.includes('test')) {
            expect(project.timeoutInMinutes).toBe(15);
          }
        });
      } catch (error) {
        console.error('CodeBuild validation error:', error);
        throw error;
      }
    }, 30000);

    test('test project should exist', async () => {
      if (!outputs.TestProjectName) {
        console.log('Skipping test project validation - no test project name in outputs');
        return;
      }

      try {
        const response = await codeBuildClient.send(
          new BatchGetProjectsCommand({ 
            names: [outputs.TestProjectName] 
          })
        );

        expect(response.projects).toBeDefined();
        expect(response.projects?.length).toBe(1);
        
        const testProject = response.projects?.[0];
        expect(testProject?.name).toBe(outputs.TestProjectName);
        expect(testProject?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
        expect(testProject?.timeoutInMinutes).toBe(15);
      } catch (error) {
        console.error('Test project validation error:', error);
        throw error;
      }
    }, 30000);
  });

  describe('CodePipeline Validation', () => {
    test('staging pipeline should exist and have correct configuration', async () => {
      if (!outputs.stagingPipelineName) {
        console.log('Skipping staging pipeline test - no pipeline name in outputs');
        return;
      }

      try {
        const response = await codePipelineClient.send(
          new GetPipelineCommand({ 
            name: outputs.stagingPipelineName 
          })
        );

        expect(response.pipeline).toBeDefined();
        expect(response.pipeline?.name).toBe(outputs.stagingPipelineName);
        expect(response.pipeline?.stages).toBeDefined();
        expect(response.pipeline?.stages?.length).toBe(4);

        // Validate stage names
        const stageNames = response.pipeline?.stages?.map((s: any) => s.name);
        expect(stageNames).toContain('Source');
        expect(stageNames).toContain('Test');
        expect(stageNames).toContain('Build');
        expect(stageNames).toContain('Deploy');

        // Validate artifact store
        expect(response.pipeline?.artifactStore?.type).toBe('S3');
        expect(response.pipeline?.artifactStore?.location).toBe(outputs.ArtifactsBucketName);
      } catch (error) {
        console.error('Staging pipeline validation error:', error);
        throw error;
      }
    }, 30000);

    test('production pipeline should exist and have correct configuration', async () => {
      if (!outputs.productionPipelineName) {
        console.log('Skipping production pipeline test - no pipeline name in outputs');
        return;
      }

      try {
        const response = await codePipelineClient.send(
          new GetPipelineCommand({ 
            name: outputs.productionPipelineName 
          })
        );

        expect(response.pipeline).toBeDefined();
        expect(response.pipeline?.name).toBe(outputs.productionPipelineName);
        expect(response.pipeline?.stages).toBeDefined();
        expect(response.pipeline?.stages?.length).toBe(4);

        // Validate stage names
        const stageNames = response.pipeline?.stages?.map((s: any) => s.name);
        expect(stageNames).toContain('Source');
        expect(stageNames).toContain('Test');
        expect(stageNames).toContain('Build');
        expect(stageNames).toContain('Deploy');

        // Validate artifact store
        expect(response.pipeline?.artifactStore?.type).toBe('S3');
        expect(response.pipeline?.artifactStore?.location).toBe(outputs.ArtifactsBucketName);
      } catch (error) {
        console.error('Production pipeline validation error:', error);
        throw error;
      }
    }, 30000);
  });

  describe('CloudWatch Logs Validation', () => {
    test('log groups should exist for build projects', async () => {
      const environmentSuffix = outputs.EnvironmentSuffix;
      if (!environmentSuffix) {
        console.log('Skipping log groups test - no environment suffix in outputs');
        return;
      }

      const expectedLogGroups = [
        `/aws/codebuild/${projectName}-${environmentSuffix}-staging-build`,
        `/aws/codebuild/${projectName}-${environmentSuffix}-production-build`
      ];

      try {
        for (const logGroupName of expectedLogGroups) {
          const response = await logsClient.send(
            new DescribeLogGroupsCommand({ 
              logGroupNamePrefix: logGroupName,
              limit: 1
            })
          );

          expect(response.logGroups).toBeDefined();
          expect(response.logGroups?.length).toBeGreaterThan(0);
          
          const logGroup = response.logGroups?.[0];
          expect(logGroup?.logGroupName).toBe(logGroupName);
          expect(logGroup?.retentionInDays).toBe(14);
        }
      } catch (error) {
        console.error('CloudWatch Logs validation error:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow the naming pattern', () => {
      const environmentSuffix = outputs.EnvironmentSuffix;
      if (!environmentSuffix) {
        console.log('Skipping naming convention test - no environment suffix');
        return;
      }

      // Check S3 bucket naming
      if (outputs.ArtifactsBucketName) {
        expect(outputs.ArtifactsBucketName).toMatch(
          new RegExp(`^${projectName}-${environmentSuffix}-`)
        );
      }

      // Check CodeBuild project naming
      if (outputs.CodeBuildProjects) {
        const projects = outputs.CodeBuildProjects.split(', ');
        projects.forEach((project: string) => {
          expect(project).toMatch(
            new RegExp(`^${projectName}-${environmentSuffix}-`)
          );
        });
      }

      // Check pipeline naming
      if (outputs.stagingPipelineName) {
        expect(outputs.stagingPipelineName).toMatch(
          new RegExp(`^${projectName}-${environmentSuffix}-.*-pipeline$`)
        );
      }
      if (outputs.productionPipelineName) {
        expect(outputs.productionPipelineName).toMatch(
          new RegExp(`^${projectName}-${environmentSuffix}-.*-pipeline$`)
        );
      }
    });
  });

  describe('Multi-Environment Support', () => {
    test('should have separate resources for staging and production', () => {
      // Check that we have both staging and production pipelines
      expect(outputs.stagingPipelineName).toBeDefined();
      expect(outputs.productionPipelineName).toBeDefined();
      expect(outputs.stagingPipelineName).not.toBe(outputs.productionPipelineName);

      // Check that we have build projects for both environments
      if (outputs.CodeBuildProjects) {
        const projects = outputs.CodeBuildProjects.split(', ');
        const stagingProject = projects.find((p: string) => p.includes('staging'));
        const productionProject = projects.find((p: string) => p.includes('production'));
        
        expect(stagingProject).toBeDefined();
        expect(productionProject).toBeDefined();
        expect(stagingProject).not.toBe(productionProject);
      }
    });
  });

  describe('End-to-End Pipeline Flow', () => {
    test('pipeline stages should be properly connected', async () => {
      const pipelineNames = [outputs.stagingPipelineName, outputs.productionPipelineName];
      
      for (const pipelineName of pipelineNames) {
        if (!pipelineName) continue;

        try {
          const response = await codePipelineClient.send(
            new GetPipelineCommand({ name: pipelineName })
          );

          const pipeline = response.pipeline;
          expect(pipeline).toBeDefined();

          // Check Source stage
          const sourceStage = pipeline?.stages?.find((s: any) => s.name === 'Source');
          expect(sourceStage).toBeDefined();
          expect(sourceStage?.actions).toBeDefined();
          expect(sourceStage?.actions?.length).toBeGreaterThan(0);

          // Check Test stage
          const testStage = pipeline?.stages?.find((s: any) => s.name === 'Test');
          expect(testStage).toBeDefined();
          expect(testStage?.actions).toBeDefined();
          expect(testStage?.actions?.length).toBeGreaterThan(0);
          
          // Test stage should use test project
          const testAction = testStage?.actions?.[0];
          expect(testAction?.actionTypeId?.provider).toBe('CodeBuild');

          // Check Build stage
          const buildStage = pipeline?.stages?.find((s: any) => s.name === 'Build');
          expect(buildStage).toBeDefined();
          expect(buildStage?.actions).toBeDefined();
          expect(buildStage?.actions?.length).toBeGreaterThan(0);
          
          // Build stage should use environment-specific project
          const buildAction = buildStage?.actions?.[0];
          expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');

          // Check Deploy stage
          const deployStage = pipeline?.stages?.find((s: any) => s.name === 'Deploy');
          expect(deployStage).toBeDefined();
          expect(deployStage?.actions).toBeDefined();
          expect(deployStage?.actions?.length).toBeGreaterThan(0);
          
          // Deploy stage should use S3
          const deployAction = deployStage?.actions?.[0];
          expect(deployAction?.actionTypeId?.provider).toBe('S3');
        } catch (error) {
          console.error(`Pipeline flow validation error for ${pipelineName}:`, error);
          throw error;
        }
      }
    }, 60000);
  });
});