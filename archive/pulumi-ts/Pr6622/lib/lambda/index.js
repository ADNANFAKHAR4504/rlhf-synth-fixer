const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Processing payment request:", JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const transactionId = body.transactionId || Date.now().toString();

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: transactionId,
        amount: body.amount,
        currency: body.currency,
        timestamp: new Date().toISOString(),
        status: "processed",
        region: process.env.REGION,
      },
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Payment processed successfully",
        transactionId: transactionId,
        region: process.env.REGION,
      }),
    };
  } catch (error) {
    console.error("Error processing payment:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Payment processing failed",
        error: error.message,
      }),
    };
  }
};
