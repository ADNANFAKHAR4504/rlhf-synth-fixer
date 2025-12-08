import {
  CloudFormationClient,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourceDriftsCommand,
  DetectStackDriftCommand,
  ListStacksCommand,
  StackDriftDetectionStatus,
  StackDriftStatus,
  StackStatus,
} from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const snsClient = new SNSClient({ region });

const DRIFT_TABLE_NAME = process.env.DRIFT_TABLE_NAME!;
const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN!;

interface DriftResult {
  stackName: string;
  driftStatus: StackDriftStatus;
  driftedResourcesCount: number;
  detectionTimestamp: number;
  driftedResources: Array<{
    logicalResourceId: string;
    resourceType: string;
    driftStatus: string;
  }>;
}

export const handler = async (event: unknown): Promise<void> => {
  console.log('Starting drift detection process', JSON.stringify(event));

  try {
    // Get all CloudFormation stacks
    const stacks = await listAllStacks();
    console.log(`Found ${stacks.length} stacks to analyze`);

    // Filter out test and sandbox stacks
    const filteredStacks = stacks.filter(
      stackName =>
        !stackName.toLowerCase().includes('test') &&
        !stackName.toLowerCase().includes('sandbox')
    );
    console.log(`Analyzing ${filteredStacks.length} stacks after filtering`);

    // Detect drift for each stack
    const driftResults: DriftResult[] = [];
    for (const stackName of filteredStacks) {
      try {
        const result = await detectStackDrift(stackName);
        driftResults.push(result);
      } catch (error) {
        console.error(`Error detecting drift for stack ${stackName}:`, error);
      }
    }

    // Store results in DynamoDB
    await Promise.all(driftResults.map(result => storeDriftResult(result)));

    // Send alerts for stacks with drift
    const driftedStacks = driftResults.filter(
      result => result.driftStatus === StackDriftStatus.DRIFTED
    );

    if (driftedStacks.length > 0) {
      await sendDriftAlert(driftedStacks);
    }

    console.log(
      `Drift detection complete. ${driftedStacks.length} stack(s) with drift detected`
    );
  } catch (error) {
    console.error('Error in drift detection process:', error);
    throw error;
  }
};

async function listAllStacks(): Promise<string[]> {
  const stacks: string[] = [];
  let nextToken: string | undefined;

  do {
    const command = new ListStacksCommand({
      NextToken: nextToken,
      StackStatusFilter: [
        StackStatus.CREATE_COMPLETE,
        StackStatus.UPDATE_COMPLETE,
        StackStatus.UPDATE_ROLLBACK_COMPLETE,
        StackStatus.IMPORT_COMPLETE,
      ],
    });

    const response = await cfnClient.send(command);

    if (response.StackSummaries) {
      stacks.push(
        ...response.StackSummaries.map(s => s.StackName!).filter(Boolean)
      );
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return stacks;
}

async function detectStackDrift(stackName: string): Promise<DriftResult> {
  console.log(`Detecting drift for stack: ${stackName}`);

  // Initiate drift detection
  const detectCommand = new DetectStackDriftCommand({
    StackName: stackName,
  });
  const detectResponse = await cfnClient.send(detectCommand);
  const driftDetectionId = detectResponse.StackDriftDetectionId!;

  // Wait for drift detection to complete
  let detectionStatus: StackDriftDetectionStatus | undefined =
    StackDriftDetectionStatus.DETECTION_IN_PROGRESS;
  let driftStatus: StackDriftStatus = StackDriftStatus.NOT_CHECKED;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

  while (
    detectionStatus === StackDriftDetectionStatus.DETECTION_IN_PROGRESS &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusCommand = new DescribeStackDriftDetectionStatusCommand({
      StackDriftDetectionId: driftDetectionId,
    });
    const statusResponse = await cfnClient.send(statusCommand);

    detectionStatus = statusResponse.DetectionStatus;
    driftStatus =
      statusResponse.StackDriftStatus || StackDriftStatus.NOT_CHECKED;
    attempts++;
  }

  if (detectionStatus !== StackDriftDetectionStatus.DETECTION_COMPLETE) {
    throw new Error(
      `Drift detection did not complete for stack ${stackName}. Status: ${detectionStatus}`
    );
  }

  // Get drifted resources if drift detected
  let driftedResources: Array<{
    logicalResourceId: string;
    resourceType: string;
    driftStatus: string;
  }> = [];
  let driftedResourcesCount = 0;

  if (driftStatus === StackDriftStatus.DRIFTED) {
    const driftsCommand = new DescribeStackResourceDriftsCommand({
      StackName: stackName,
      StackResourceDriftStatusFilters: ['MODIFIED', 'DELETED'],
    });

    try {
      const driftsResponse = await cfnClient.send(driftsCommand);
      if (driftsResponse.StackResourceDrifts) {
        driftedResourcesCount = driftsResponse.StackResourceDrifts.length;
        driftedResources = driftsResponse.StackResourceDrifts.map(drift => ({
          logicalResourceId: drift.LogicalResourceId!,
          resourceType: drift.ResourceType!,
          driftStatus: drift.StackResourceDriftStatus!,
        }));
      }
    } catch (error) {
      console.error(`Error getting drifted resources for ${stackName}:`, error);
    }
  }

  return {
    stackName,
    driftStatus,
    driftedResourcesCount,
    detectionTimestamp: Date.now(),
    driftedResources,
  };
}

async function storeDriftResult(result: DriftResult): Promise<void> {
  const command = new PutItemCommand({
    TableName: DRIFT_TABLE_NAME,
    Item: {
      stackName: { S: result.stackName },
      timestamp: { N: result.detectionTimestamp.toString() },
      driftStatus: { S: result.driftStatus },
      driftedResourcesCount: { N: result.driftedResourcesCount.toString() },
      driftedResources: {
        S: JSON.stringify(result.driftedResources),
      },
    },
  });

  await dynamoClient.send(command);
  console.log(`Stored drift result for stack: ${result.stackName}`);
}

async function sendDriftAlert(driftedStacks: DriftResult[]): Promise<void> {
  const stackDetails = driftedStacks
    .map(
      stack =>
        `
Stack Name: ${stack.stackName}
Drift Status: ${stack.driftStatus}
Drifted Resources: ${stack.driftedResourcesCount}
Detection Time: ${new Date(stack.detectionTimestamp).toISOString()}

Drifted Resources Details:
${stack.driftedResources.map(r => `  - ${r.logicalResourceId} (${r.resourceType}): ${r.driftStatus}`).join('\n')}
`
    )
    .join('\n---\n');

  const message = `
Infrastructure Drift Detected

${driftedStacks.length} CloudFormation stack(s) have configuration drift:

${stackDetails}

Please review and remediate the drifted resources to maintain infrastructure consistency.
  `.trim();

  const command = new PublishCommand({
    TopicArn: ALERT_TOPIC_ARN,
    Subject: `Infrastructure Drift Alert - ${driftedStacks.length} Stack(s) Affected`,
    Message: message,
  });

  await snsClient.send(command);
  console.log(`Sent drift alert for ${driftedStacks.length} stack(s)`);
}
