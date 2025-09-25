// Import necessary modules
import fs from 'fs';
import AWS from 'aws-sdk';
import { expect } from '@jest/globals';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS SDK clients
const codepipeline = new AWS.CodePipeline();
const codebuild = new AWS.CodeBuild();
const codedeploy = new AWS.CodeDeploy();
const sns = new AWS.SNS();
const s3 = new AWS.S3();

/**
 * Checks for the existence of an AWS resource based on its type and name.
 * @param resourceName The name of the resource from outputs.
 * @param resourceType The type of the resource (e.g., 'CodePipeline', 'S3Bucket').
 */
async function checkResourceExistence(resourceName: string, resourceType: string): Promise<boolean> {
  let exists = false;
  try {
    if (resourceType === 'CodePipeline') {
      await codepipeline.getPipeline({ name: resourceName }).promise();
      exists = true;
    } else if (resourceType === 'CodeBuildProject') {
      const buildResult = await codebuild.batchGetProjects({ names: [resourceName] }).promise();
      exists = (buildResult.projects?.length ?? 0) > 0;
    } else if (resourceType === 'CodeDeployApplication') {
      await codedeploy.getApplication({ applicationName: resourceName }).promise();
      exists = true;
    } else if (resourceType === 'SNSTopic') {
      const snsResult = await sns.listTopics().promise();
      exists = snsResult.Topics?.some(topic => topic.TopicArn === resourceName) || false;
    } else if (resourceType === 'ArtifactBucket') {
      await s3.headBucket({ Bucket: resourceName }).promise();
      exists = true;
    } else {
      console.warn(`Warning: No existence check implemented for resource type: ${resourceType}`);
      exists = true; 
    }
  } catch (error: unknown) {
    const awsError = error as { code?: string, message?: string };
    if (awsError.code === 'NoSuchBucket' || awsError.code === 'ResourceNotFoundException' || awsError.code === 'PipelineNotFoundException') {
      exists = false;
    } else {
      console.error(`Error checking resource ${resourceName}:`, awsError.message);
      exists = false;
    }
  }
  return exists;
}

// Jest Integration Test Suite
describe('CloudFormation Stack Resources Existence Check', () => {
  test('All resources in outputs should exist', async () => {
    const outputKeys = Object.keys(outputs);
    for (const key of outputKeys) {
      const resourceName = outputs[key];
      let resourceType;
      
      if (key.includes('PipelineName')) {
        resourceType = 'CodePipeline';
      } else if (key.includes('CodeBuildProjectName')) {
        resourceType = 'CodeBuildProject';
      } else if (key.includes('CodeDeployApplicationName')) {
        resourceType = 'CodeDeployApplication';
      } else if (key.includes('SNSTopicARN')) {
        resourceType = 'SNSTopic';
      } else if (key.includes('ArtifactBucketName')) {
        resourceType = 'ArtifactBucket';
      }
      
      if (resourceType) {
        const exists = await checkResourceExistence(resourceName, resourceType);
        expect(exists).toBe(true);
      }
    }
  });
});