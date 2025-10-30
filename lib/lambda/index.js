const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DDB_TABLE_NAME;

exports.handler = async (event) => {
  const method = event?.requestContext?.http?.method || 'GET';
  const path = event?.requestContext?.http?.path || '/';

  try {
    if (method === 'POST' && path === '/v1/transactions') {
      const body = parseJson(event.body);
      if (!body || !body.userId) return json(400, { message: 'userId required' });
      const id = body.id || randomId();
      const now = Date.now();
      const item = {
        pk: `USER#${body.userId}`,
        sk: `TXN#${now}#${id}`,
        id,
        userId: body.userId,
        createdAt: now,
        updatedAt: now,
        amount: body.amount ?? 0,
        status: body.status ?? 'PENDING',
        payload: body.payload ?? {},
      };
      await ddb.put({ TableName: tableName, Item: item, ConditionExpression: 'attribute_not_exists(id)' }).promise();
      return json(201, { id, createdAt: now });
    }

    if (method === 'GET' && path.startsWith('/v1/transactions/')) {
      const id = path.split('/').pop();
      const scan = await ddb
        .scan({ TableName: tableName, FilterExpression: '#id = :id', ExpressionAttributeNames: { '#id': 'id' }, ExpressionAttributeValues: { ':id': id } })
        .promise();
      const item = scan.Items && scan.Items[0];
      if (!item) return json(404, { message: 'Not Found', id });
      return json(200, item);
    }

    if (method === 'GET' && /\/v1\/users\/.+\/transactions$/.test(path)) {
      const parts = path.split('/');
      const userId = parts[3];
      const res = await ddb
        .query({
          TableName: tableName,
          KeyConditionExpression: '#pk = :pk',
          ExpressionAttributeNames: { '#pk': 'pk' },
          ExpressionAttributeValues: { ':pk': `USER#${userId}` },
          ScanIndexForward: false,
          Limit: 50,
        })
        .promise();
      return json(200, { items: res.Items ?? [] });
    }

    if (method === 'PUT' && path.startsWith('/v1/transactions/')) {
      const id = path.split('/').pop();
      const body = parseJson(event.body) || {};
      const found = await ddb
        .scan({ TableName: tableName, FilterExpression: '#id = :id', ExpressionAttributeNames: { '#id': 'id' }, ExpressionAttributeValues: { ':id': id } })
        .promise();
      const item = found.Items && found.Items[0];
      if (!item) return json(404, { message: 'Not Found', id });
      const now = Date.now();
      await ddb
        .update({
          TableName: tableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: 'SET #status = :status, #amount = :amount, #payload = :payload, #updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status', '#amount': 'amount', '#payload': 'payload', '#updatedAt': 'updatedAt' },
          ExpressionAttributeValues: {
            ':status': body.status ?? item.status,
            ':amount': body.amount ?? item.amount,
            ':payload': body.payload ?? item.payload,
            ':updatedAt': now,
          },
          ReturnValues: 'ALL_NEW',
        })
        .promise();
      return json(200, { id, updatedAt: now });
    }

    if (method === 'DELETE' && path.startsWith('/v1/transactions/')) {
      const id = path.split('/').pop();
      const found = await ddb
        .scan({ TableName: tableName, FilterExpression: '#id = :id', ExpressionAttributeNames: { '#id': 'id' }, ExpressionAttributeValues: { ':id': id } })
        .promise();
      const item = found.Items && found.Items[0];
      if (!item) return json(404, { message: 'Not Found', id });
      await ddb.delete({ TableName: tableName, Key: { pk: item.pk, sk: item.sk } }).promise();
      return json(200, { id, deleted: true });
    }

    return json(404, { message: 'Not Found', path, method });
  } catch (err) {
    console.error('handler error', err);
    return json(500, { message: 'Internal Server Error' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function parseJson(body) {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
