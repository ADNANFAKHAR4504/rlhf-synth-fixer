const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

exports.handler = async (event) => {
  console.log("DataAggregator triggered", JSON.stringify(event));

  try {
    // Scan DynamoDB for processed records
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "#status = :processed",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":processed": { S: "processed" },
      },
    };

    const result = await dynamoClient.send(new ScanCommand(scanParams));
    console.log(`Found ${result.Items.length} processed records`);

    // Aggregate data by symbol
    const symbolCounts = {};
    result.Items.forEach((item) => {
      const symbol = item.symbol.S;
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    console.log("Symbol aggregation:", symbolCounts);

    // Send aggregated metrics to CloudWatch
    const metricData = Object.entries(symbolCounts).map(([symbol, count]) => ({
      MetricName: "ProcessedRecords",
      Dimensions: [
        {
          Name: "Symbol",
          Value: symbol,
        },
      ],
      Value: count,
      Unit: "Count",
      Timestamp: new Date(),
    }));

    if (metricData.length > 0) {
      const metricsParams = {
        Namespace: "MarketAnalytics",
        MetricData: metricData,
      };

      await cloudwatchClient.send(new PutMetricDataCommand(metricsParams));
      console.log("Metrics sent to CloudWatch");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Aggregation successful",
        totalRecords: result.Items.length,
        symbols: Object.keys(symbolCounts).length,
      }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
