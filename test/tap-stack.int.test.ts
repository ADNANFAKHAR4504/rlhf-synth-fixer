import fs from 'fs';
import AWS from 'aws-sdk';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS SDK clients
const codepipeline = new AWS.CodePipeline();
const codebuild = new AWS.CodeBuild();
const codedeploy = new AWS.CodeDeploy();
const sns = new AWS.SNS();

describe('CI/CD Pipeline Integration Tests', () => {

  // Test that the CodePipeline exists and has a valid status
  test('CodePipeline should exist and have a valid status', async () => {
    const pipelineName = outputs.PipelineName;
    try {
      const result = await codepipeline.getPipeline({ name: pipelineName }).promise();
      expect(result.pipeline).toBeDefined();
      expect(result.pipeline.stages.length).toBe(4);
    } catch (error) {
      console.error(`Error: CodePipeline "${pipelineName}" not found.`, error);
      expect(false).toBe(true); // Intentionally fail the test
    }
  });

  // Test that the CodeBuild project exists and is active
  test('CodeBuild project should exist and be active', async () => {
    const projectName = outputs.CodeBuildProjectName;
    try {
      const result = await codebuild.batchGetProjects({ names: [projectName] }).promise();
      const project = result.projects[0];
      expect(project).toBeDefined();
      expect(project.name).toBe(projectName);
      expect(project.artifacts.type).toBe('CODEPIPELINE');
    } catch (error) {
      console.error(`Error: CodeBuild project "${projectName}" not found.`, error);
      expect(false).toBe(true);
    }
  });

  // Test that the CodeDeploy application exists
  test('CodeDeploy application should exist', async () => {
    const applicationName = outputs.CodeDeployApplicationName;
    try {
      const result = await codedeploy.getApplication({ applicationName: applicationName }).promise();
      expect(result.application).toBeDefined();
    } catch (error) {
      console.error(`Error: CodeDeploy application "${applicationName}" not found.`, error);
      expect(false).toBe(true);
    }
  });

  // Test that the CodeDeploy deployment group exists and is correctly configured
  test('CodeDeploy deployment group should exist and be linked to the application', async () => {
    const applicationName = outputs.CodeDeployApplicationName;
    const deploymentGroupName = outputs.DeploymentGroupName;
    try {
      const result = await codedeploy.getDeploymentGroup({
        applicationName: applicationName,
        deploymentGroupName: deploymentGroupName,
      }).promise();
      expect(result.deploymentGroupInfo).toBeDefined();
      expect(result.deploymentGroupInfo.applicationName).toBe(applicationName);
      expect(result.deploymentGroupInfo.serviceRoleArn).toContain('PipelineRole');
    } catch (error) {
      console.error(`Error: CodeDeploy deployment group "${deploymentGroupName}" not found.`, error);
      expect(false).toBe(true);
    }
  });

  // Test that the SNS Topic exists
  test('SNS Topic should exist', async () => {
    const topicArn = outputs.SNSTopicARN;
    try {
      const result = await sns.listTopics({}).promise();
      const topicExists = result.Topics.some(topic => topic.TopicArn === topicArn);
      expect(topicExists).toBe(true);
    } catch (error) {
      console.error(`Error: SNS Topic "${topicArn}" not found.`, error);
      expect(false).toBe(true);
    }
  });
});