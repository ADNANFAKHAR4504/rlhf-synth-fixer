const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const ssm = new SSMClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const API_RATE_LIMIT_PARAM = process.env.API_RATE_LIMIT_PARAM;

let rateLimit = 1000;
let paramLastFetched = 0;

async function getParameter(paramName) {
  const now = Date.now();
  
  if (now - paramLastFetched > 300000) {
    try {
      const command = new GetParameterCommand({
        Name: paramName,
        WithDecryption: true,
      });
      
      const response = await ssm.send(command);
      
      if (response.Parameter && response.Parameter.Value) {
        rateLimit = parseInt(response.Parameter.Value, 10);
        paramLastFetched = now;
      }
    } catch (error) {
      console.error('Error fetching parameter:', error);
    }
  }
  
  return rateLimit;
}

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  await getParameter(API_RATE_LIMIT_PARAM);
  
  try {
    const httpMethod = event.httpMethod;
    const path = event.path;
    
    if (path.startsWith('/workouts')) {
      if (httpMethod === 'GET' && event.pathParameters && event.pathParameters.workoutId) {
        return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'GET') {
        return await listWorkouts(event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'POST') {
        const workoutData = JSON.parse(event.body);
        return await createWorkout(workoutData, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'PUT' && event.pathParameters && event.pathParameters.workoutId) {
        const workoutData = JSON.parse(event.body);
        return await updateWorkout(event.pathParameters.workoutId, workoutData, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'DELETE' && event.pathParameters && event.pathParameters.workoutId) {
        return await deleteWorkout(event.pathParameters.workoutId, event.requestContext.identity.sourceIp);
      }
    }
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Not found' })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function getWorkout(workoutId, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  const result = await dynamoDB.send(command);
  
  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Workout not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Item)
  };
}

async function listWorkouts(sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    Limit: 100
  });
  
  const result = await dynamoDB.send(command);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Items)
  };
}

async function createWorkout(workoutData, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  const timestamp = new Date().toISOString();
  
  const item = {
    userId: userId,
    workoutTimestamp: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...workoutData
  };
  
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(workoutTimestamp)'
  });
  
  await dynamoDB.send(command);
  
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  };
}

async function updateWorkout(workoutId, workoutData, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  const timestamp = new Date().toISOString();
  
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  const existingWorkout = await dynamoDB.send(getCommand);
  
  if (!existingWorkout.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Workout not found' })
    };
  }
  
  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues = {
    ':updatedAt': timestamp
  };
  const expressionAttributeNames = {};
  
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      updateExpression += `, #field${index} = :value${index}`;
      expressionAttributeValues[`:value${index}`] = workoutData[key];
      expressionAttributeNames[`#field${index}`] = key;
    }
  });
  
  const updateCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ReturnValues: 'ALL_NEW'
  });
  
  const result = await dynamoDB.send(updateCommand);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteWorkout(workoutId, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  await dynamoDB.send(command);
  
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  };
}

function getUserIdFromIp(sourceIp) {
  if (!sourceIp) {
    return 'anonymous';
  }
  
  return sourceIp.replace(/\./g, '-').replace(/:/g, '-');
}
