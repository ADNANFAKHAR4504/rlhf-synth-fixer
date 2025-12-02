// Batch Processor Lambda Function
// Runtime: Node.js 18.x
// Purpose: Process large batches of data with extended timeout

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, BATCH_SIZE, LOG_LEVEL } = process.env;

  try {
    console.log(JSON.stringify({
      level: "INFO",
      message: "Starting batch processing",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
      batchSize: BATCH_SIZE,
    }));

    // Extract records from event
    const records = event.Records || [];

    console.log(JSON.stringify({
      level: "INFO",
      message: "Processing batch records",
      requestId: context.requestId,
      recordCount: records.length,
    }));

    // Simulate batch processing
    const processedRecords = records.map((record, index) => ({
      id: record.messageId || `record-${index}`,
      status: "processed",
      timestamp: new Date().toISOString(),
    }));

    console.log(JSON.stringify({
      level: "INFO",
      message: "Batch processing completed",
      requestId: context.requestId,
      processedCount: processedRecords.length,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch processed successfully",
        processedCount: processedRecords.length,
        requestId: context.requestId,
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Batch processing failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
