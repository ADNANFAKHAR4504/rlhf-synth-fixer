// Transform Lambda Function
// Runtime: Node.js 18.x
// Purpose: Transform data records

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, LOG_LEVEL } = process.env;

  try {
    console.log(JSON.stringify({
      level: "INFO",
      message: "Starting data transformation",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
    }));

    // Extract data from event
    const inputData = event.data || event.body || {};

    // Simulate transformation
    const transformedData = {
      ...inputData,
      transformed: true,
      transformedAt: new Date().toISOString(),
      requestId: context.requestId,
    };

    console.log(JSON.stringify({
      level: "INFO",
      message: "Data transformation completed",
      requestId: context.requestId,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Data transformed successfully",
        data: transformedData,
        requestId: context.requestId,
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Data transformation failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
