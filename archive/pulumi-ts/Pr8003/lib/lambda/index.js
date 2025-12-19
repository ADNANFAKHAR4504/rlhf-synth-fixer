
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const secretsClient = new SecretsManagerClient({ region: "us-east-1" });

let cachedSecrets = null;

async function getSecrets() {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN,
    });
    const response = await secretsClient.send(command);
    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets;
  } catch (error) {
    console.error("Error fetching secrets:", error);
    throw error;
  }
}

async function validateWebhook(body, provider) {
  // Placeholder validation logic
  // In production, this would verify signatures from payment providers
  return body && body.transactionId;
}

exports.handler = async (event) => {
  console.log("Received webhook:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || "{}");
    const provider = body.provider || "unknown";

    // Validate webhook
    const isValid = await validateWebhook(body, provider);
    if (!isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid webhook payload" }),
      };
    }

    // Get secrets for authentication (if needed)
    const secrets = await getSecrets();
    console.log("Secrets loaded successfully");

    // Store transaction in DynamoDB
    const timestamp = Date.now();
    const command = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: body.transactionId || `txn-${timestamp}` },
        timestamp: { N: timestamp.toString() },
        provider: { S: provider },
        amount: { N: (body.amount || 0).toString() },
        currency: { S: body.currency || "USD" },
        status: { S: body.status || "pending" },
        payload: { S: JSON.stringify(body) },
        processedAt: { S: new Date().toISOString() },
      },
    });

    await dynamoClient.send(command);
    console.log("Transaction stored successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Webhook processed successfully",
        transactionId: body.transactionId,
      }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
