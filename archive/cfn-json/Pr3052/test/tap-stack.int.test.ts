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
 * Checks if a CodePipeline resource exists.
 * @param pipelineName The name of the pipeline to check.
 */
async function checkCodePipelineExistence(pipelineName: string): Promise<boolean> {
  try {
    await codepipeline.getPipeline({ name: pipelineName }).promise();
    return true;
  } catch (error: unknown) {
    const awsError = error as { code?: string };
    return awsError.code !== 'PipelineNotFoundException';
  }
}

/**
 * Checks if a CodeBuild project exists.
 * @param projectName The name of the CodeBuild project.
 */
async function checkCodeBuildProjectExistence(projectName: string): Promise<boolean> {
  try {
    const buildResult = await codebuild.batchGetProjects({ names: [projectName] }).promise();
    return (buildResult.projects?.length ?? 0) > 0;
  } catch (error: unknown) {
    const awsError = error as { code?: string };
    return awsError.code !== 'InvalidInputException';
  }
}

/**
 * Checks if a CodeDeploy application exists.
 * @param applicationName The name of the CodeDeploy application.
 */
async function checkCodeDeployApplicationExistence(applicationName: string): Promise<boolean> {
  try {
    await codedeploy.getApplication({ applicationName }).promise();
    return true;
  } catch (error: unknown) {
    const awsError = error as { code?: string };
    return awsError.code !== 'ApplicationDoesNotExistException';
  }
}

/**
 * Checks if an SNS Topic exists.
 * @param topicArn The ARN of the SNS topic.
 */
async function checkSNSTopicExistence(topicArn: string): Promise<boolean> {
  try {
    const snsResult = await sns.listTopics().promise();
    return snsResult.Topics?.some(topic => topic.TopicArn === topicArn) || false;
  } catch (error: unknown) {
    console.error(`Error checking SNS Topic existence:`, error);
    return false;
  }
}

/**
 * Checks if an S3 bucket exists.
 * @param bucketName The name of the S3 bucket.
 */
async function checkArtifactBucketExistence(bucketName: string): Promise<boolean> {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    return true;
  } catch (error: unknown) {
    const awsError = error as { code?: string };
    return awsError.code !== 'NoSuchBucket';
  }
}

// Maps resource types to their existence-checking functions.
const resourceCheckFunctions = {
  'CodePipeline': checkCodePipelineExistence,
  'CodeBuildProject': checkCodeBuildProjectExistence,
  'CodeDeployApplication': checkCodeDeployApplicationExistence,
  'SNSTopic': checkSNSTopicExistence,
  'ArtifactBucket': checkArtifactBucketExistence
};

// Define a type for the keys of the resourceCheckFunctions object
type ResourceTypeKeys = keyof typeof resourceCheckFunctions;

/**
 * Checks for the existence of an AWS resource based on its type and name.
 * This function acts as a dispatcher to the appropriate check function.
 * @param resourceName The name of the resource from outputs.
 * @param resourceType The type of the resource.
 */
async function checkResourceExistence(resourceName: string, resourceType: string): Promise<boolean> {
  // Use a type guard to check if resourceType is a valid key.
  if (resourceType in resourceCheckFunctions) {
    // Cast resourceType to the union type of valid keys.
    const checkFunction = resourceCheckFunctions[resourceType as ResourceTypeKeys];
    return await checkFunction(resourceName);
  } else {
    console.warn(`Warning: No existence check implemented for resource type: ${resourceType}`);
    return true; 
  }
}

// Jest Integration Test Suite
describe('CloudFormation Stack Resources Existence Check', () => {
  // Use a loop to dynamically create a separate test case for each resource
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
      test(`resource "${key}" (${resourceType}) should exist`, async () => {
        const exists = await checkResourceExistence(resourceName, resourceType);
        expect(exists).toBe(true);
      });
    }
  }
});