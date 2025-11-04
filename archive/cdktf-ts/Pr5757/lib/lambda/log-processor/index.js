/**
 * Lambda function to process CloudWatch log events
 * Filters ERROR and CRITICAL severity levels
 */

const zlib = require('zlib');

exports.handler = async (event) => {
  console.log('Log processor invoked');

  try {
    // Decode and decompress CloudWatch Logs data
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = zlib.gunzipSync(payload);
    const logData = JSON.parse(decompressed.toString('utf8'));

    console.log('Processing log group:', logData.logGroup);
    console.log('Processing log stream:', logData.logStream);

    let errorCount = 0;
    let criticalCount = 0;

    // Process each log event
    for (const logEvent of logData.logEvents) {
      const message = logEvent.message;

      // Check for ERROR or CRITICAL severity levels
      if (message.includes('ERROR') || message.includes('Error')) {
        errorCount++;
        console.log('ERROR detected:', message.substring(0, 200));
      }

      if (message.includes('CRITICAL') || message.includes('Critical')) {
        criticalCount++;
        console.log('CRITICAL detected:', message.substring(0, 200));
      }
    }

    // Log summary
    console.log(`Processed ${logData.logEvents.length} log events`);
    console.log(`Found ${errorCount} ERROR messages`);
    console.log(`Found ${criticalCount} CRITICAL messages`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: logData.logEvents.length,
        errors: errorCount,
        critical: criticalCount,
      }),
    };

  } catch (error) {
    console.error('Error processing log events:', error);
    throw error;
  }
};
