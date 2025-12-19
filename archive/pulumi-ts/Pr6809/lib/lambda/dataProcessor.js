const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const dynamoClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event) => {
  console.log("DataProcessor triggered", JSON.stringify(event));

  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log("Processing message:", message);

      // Update DynamoDB state
      const updateParams = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          symbol: { S: message.symbol },
          timestamp: { N: message.timestamp.toString() },
        },
        UpdateExpression: "SET #status = :processed, processedAt = :time",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":processed": { S: "processed" },
          ":time": { N: Date.now().toString() },
        },
      };

      await dynamoClient.send(new UpdateItemCommand(updateParams));
      console.log("DynamoDB updated");

      // Emit custom event to EventBridge
      const eventParams = {
        Entries: [
          {
            Source: "market.data.processor",
            DetailType: "MarketDataProcessed",
            Detail: JSON.stringify({
              symbol: message.symbol,
              timestamp: message.timestamp,
              status: "processed",
            }),
            EventBusName: process.env.EVENT_BUS_NAME || "default",
          },
        ],
      };

      await eventBridgeClient.send(new PutEventsCommand(eventParams));
      console.log("Event emitted to EventBridge");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Processing successful" }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
