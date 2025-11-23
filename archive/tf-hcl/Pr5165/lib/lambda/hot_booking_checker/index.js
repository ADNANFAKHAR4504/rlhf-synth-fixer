const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambdaClient = new LambdaClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const OVERBOOKING_RESOLVER_ARN = process.env.OVERBOOKING_RESOLVER_ARN;

/**
 * Hot Booking Checker Lambda
 * Fast-path conflict detection within 30s of booking
 * SLA Target: Hot bookings checked within 30 seconds
 */
exports.handler = async event => {
  console.log('Hot booking check triggered:', JSON.stringify(event, null, 2));

  const conflictsDetected = [];

  try {
    for (const record of event.Records) {
      const { eventName, dynamodb } = record;

      if (eventName !== 'INSERT' && eventName !== 'MODIFY') {
        continue;
      }

      const newImage = dynamodb.NewImage;
      if (!newImage || !newImage.booking_key || !newImage.booking_key.S) {
        continue;
      }

      const bookingKey = newImage.booking_key.S;
      const availableUnits = newImage.available_units
        ? parseInt(newImage.available_units.N, 10)
        : 0;
      const version = newImage.version ? parseInt(newImage.version.N, 10) : 0;

      console.log(
        `Checking booking: ${bookingKey}, available=${availableUnits}, version=${version}`
      );

      // Critical check: Detect negative or zero availability (potential overbooking)
      if (availableUnits < 0) {
        console.error(
          `OVERBOOKING DETECTED: ${bookingKey} has negative availability: ${availableUnits}`
        );

        conflictsDetected.push({
          bookingKey,
          availableUnits,
          version,
          severity: 'CRITICAL',
          reason: 'NEGATIVE_AVAILABILITY',
        });

        // Publish CloudWatch metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'OverbookingDetected',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [{ Name: 'BookingKey', Value: bookingKey }],
              },
            ],
          })
        );
      }

      // Check for suspicious rapid version changes (possible race condition)
      if (eventName === 'MODIFY' && dynamodb.OldImage) {
        const oldVersion = dynamodb.OldImage.version
          ? parseInt(dynamodb.OldImage.version.N, 10)
          : 0;
        const versionJump = version - oldVersion;

        if (versionJump > 5) {
          console.warn(
            `Rapid version change detected: ${bookingKey}, jump=${versionJump}`
          );

          conflictsDetected.push({
            bookingKey,
            availableUnits,
            version,
            oldVersion,
            severity: 'WARNING',
            reason: 'RAPID_VERSION_CHANGE',
          });
        }
      }

      // If critical conflict detected, invoke overbooking resolver immediately
      if (availableUnits < 0) {
        try {
          const resolverPayload = {
            conflicts: [
              {
                bookingKey,
                availableUnits,
                version,
                detectedAt: new Date().toISOString(),
                source: 'hot_booking_checker',
              },
            ],
          };

          await lambdaClient.send(
            new InvokeCommand({
              FunctionName: OVERBOOKING_RESOLVER_ARN,
              InvocationType: 'Event', // Async invocation
              Payload: JSON.stringify(resolverPayload),
            })
          );

          console.log(`Overbooking resolver invoked for ${bookingKey}`);
        } catch (invokeError) {
          console.error('Failed to invoke overbooking resolver:', invokeError);
        }
      }
    }

    // Publish summary metric
    if (conflictsDetected.length > 0) {
      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'Custom/Booking',
          MetricData: [
            {
              MetricName: 'HotConflictsDetected',
              Value: conflictsDetected.length,
              Unit: 'Count',
              Timestamp: new Date(),
            },
          ],
        })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: event.Records.length,
        conflictsDetected: conflictsDetected.length,
        conflicts: conflictsDetected,
      }),
    };
  } catch (error) {
    console.error('Hot booking checker error:', error);
    throw error;
  }
};
