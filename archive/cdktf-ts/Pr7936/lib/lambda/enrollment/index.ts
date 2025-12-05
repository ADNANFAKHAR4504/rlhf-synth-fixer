import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamodb = new DynamoDBClient({});

// Reserved for future profile management features
// const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE!;
const COURSE_PROGRESS_TABLE = process.env.COURSE_PROGRESS_TABLE!;

interface EnrollmentRequest {
  userId: string;
  courseId: string;
  courseName: string;
  enrollmentDate?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Enrollment request received:', JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is required' }),
      };
    }

    const request: EnrollmentRequest = JSON.parse(event.body);

    const { userId, courseId, courseName, enrollmentDate } = request;

    if (!userId || !courseId || !courseName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'userId, courseId, and courseName are required',
        }),
      };
    }

    await dynamodb.send(
      new PutItemCommand({
        TableName: COURSE_PROGRESS_TABLE,
        Item: {
          userId: { S: userId },
          courseId: { S: courseId },
          courseName: { S: courseName },
          completionPercentage: { N: '0' },
          enrollmentDate: { S: enrollmentDate || new Date().toISOString() },
          lastUpdated: { S: new Date().toISOString() },
        },
      })
    );

    console.log(`Successfully enrolled user ${userId} in course ${courseId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Enrollment successful',
        userId,
        courseId,
      }),
    };
  } catch (error) {
    console.error('Error enrolling user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
