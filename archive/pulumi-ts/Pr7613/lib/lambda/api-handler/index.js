// API Handler Lambda Function
// Runtime: Node.js 18.x
// Purpose: Handle API requests with low latency

exports.handler = async (event, context) => {
  // Enable X-Ray tracing
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, LOG_LEVEL } = process.env;

  try {
    // Structured logging for better observability
    console.log(JSON.stringify({
      level: "INFO",
      message: "Processing API request",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
    }));

    // Simulate API processing
    const result = {
      statusCode: 200,
      body: JSON.stringify({
        message: "API request processed successfully",
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
      }),
    };

    console.log(JSON.stringify({
      level: "INFO",
      message: "API request completed",
      requestId: context.requestId,
      statusCode: result.statusCode,
    }));

    return result;
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "API request failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
