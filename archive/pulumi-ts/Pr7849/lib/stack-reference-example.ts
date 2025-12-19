/**
 * Example of using StackReference to consume repository information from another stack
 */
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

// Reference the CodeCommit stack
const codecommitStack = new pulumi.StackReference(
  `codecommit-repos-${environmentSuffix}`
);

// Access exported values from the other stack
export const referencedRepositoryArns =
  codecommitStack.getOutput('repositoryArns');
export const referencedContributorRoleArn =
  codecommitStack.getOutput('contributorRoleArn');
export const referencedCloneUrls = codecommitStack.getOutput(
  'repositoryCloneUrls'
);

// Example: Use these values in your infrastructure
// const myLambda = new aws.lambda.Function('myFunction', {
//   role: referencedContributorRoleArn,
//   // ... other config
// });
