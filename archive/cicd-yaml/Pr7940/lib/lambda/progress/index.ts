import {
  DynamoDBClient,
  UpdateItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});

const COURSE_PROGRESS_TABLE = process.env.COURSE_PROGRESS_TABLE!;
const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN!;

interface ProgressUpdateRequest {
  userId: string;
  courseId: string;
  completionPercentage: number;
  lastCompletedModule?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    'Progress update request received:',
    JSON.stringify(event, null, 2)
  );

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is required' }),
      };
    }

    const request: ProgressUpdateRequest = JSON.parse(event.body);

    const { userId, courseId, completionPercentage, lastCompletedModule } =
      request;

    if (!userId || !courseId || completionPercentage === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'userId, courseId, and completionPercentage are required',
        }),
      };
    }

    if (completionPercentage < 0 || completionPercentage > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'completionPercentage must be between 0 and 100',
        }),
      };
    }

    const updateExpression = lastCompletedModule
      ? 'SET completionPercentage = :percentage, lastUpdated = :updated, lastCompletedModule = :module'
      : 'SET completionPercentage = :percentage, lastUpdated = :updated';

    const expressionAttributeValues: Record<string, AttributeValue> = {
      ':percentage': { N: completionPercentage.toString() },
      ':updated': { S: new Date().toISOString() },
    };

    if (lastCompletedModule) {
      expressionAttributeValues[':module'] = { S: lastCompletedModule };
    }

    await dynamodb.send(
      new UpdateItemCommand({
        TableName: COURSE_PROGRESS_TABLE,
        Key: {
          userId: { S: userId },
          courseId: { S: courseId },
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    if (completionPercentage === 100) {
      await sns.send(
        new PublishCommand({
          TopicArn: ALERT_TOPIC_ARN,
          Subject: 'Course Completion',
          Message: `User ${userId} completed course ${courseId}`,
        })
      );
    }

    console.log(
      `Progress updated for user ${userId} in course ${courseId}: ${completionPercentage}%`
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Progress updated successfully',
        userId,
        courseId,
        completionPercentage,
      }),
    };
  } catch (error) {
    console.error('Error updating progress:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
