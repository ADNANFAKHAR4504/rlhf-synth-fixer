exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log('Processing invalid transaction for review:', message);

      // In a real implementation, this would:
      // 1. Send to a manual review system
      // 2. Apply fraud detection algorithms
      // 3. Store in a review queue database
      // 4. Notify compliance team

      console.log(`Transaction ${message.transactionId} queued for manual review. Reason: ${message.reason}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({message: 'Review items processed'}),
    };
  } catch (error) {
    console.error('Error processing review items:', error);
    throw error; // Let SQS handle the retry logic
  }
};
