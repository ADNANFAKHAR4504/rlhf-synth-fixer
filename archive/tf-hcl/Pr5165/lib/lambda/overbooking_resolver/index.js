const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Overbooking Resolver Lambda
 * Attempts to resolve overbooking conflicts automatically
 * SLA Targets:
 * - Conflicts detected within 5 seconds of collision
 * - Auto-reassign (if possible) within 60 seconds
 * - Push correction to PMS within 2 minutes
 * - Otherwise publish UnresolvedOverbookings metric for human ops
 */
exports.handler = async event => {
  console.log('Overbooking resolver invoked:', JSON.stringify(event, null, 2));

  const conflicts = event.conflicts || [];
  const resolutionResults = [];
  let unresolvedCount = 0;

  try {
    for (const conflict of conflicts) {
      const { bookingKey, availableUnits, version, detectedAt } = conflict;
      const [propertyId, roomId, date] = bookingKey.split('#');

      console.log(
        `Resolving overbooking: ${bookingKey}, units=${availableUnits}`
      );

      // Step 1: Get current state
      const current = await dynamoClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: bookingKey },
        })
      );

      if (!current.Item) {
        console.error(`Booking key ${bookingKey} not found`);
        continue;
      }

      const currentAvailable = current.Item.available_units || 0;
      const currentVersion = current.Item.version || 0;

      // If problem resolved itself, skip
      if (currentAvailable >= 0) {
        console.log(`Overbooking already resolved for ${bookingKey}`);
        resolutionResults.push({
          bookingKey,
          resolution: 'AUTO_RESOLVED',
          success: true,
        });
        continue;
      }

      // Step 2: Try to find alternative rooms at the same property for the same date
      const alternativeRooms = await findAlternativeRooms(
        propertyId,
        date,
        roomId
      );

      if (alternativeRooms.length > 0) {
        console.log(
          `Found ${alternativeRooms.length} alternative rooms for ${bookingKey}`
        );

        // Strategy: Reallocate the overbooking to alternative rooms
        const reallocationSuccess = await reallocateBooking(
          bookingKey,
          alternativeRooms,
          Math.abs(currentAvailable) // Number of units we need to reallocate
        );

        if (reallocationSuccess) {
          // Reset the original room to 0 availability
          await dynamoClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { booking_key: bookingKey },
              UpdateExpression:
                'SET available_units = :zero, #version = #version + :inc, resolved_at = :timestamp, resolution_type = :type',
              ExpressionAttributeNames: {
                '#version': 'version',
              },
              ExpressionAttributeValues: {
                ':zero': 0,
                ':inc': 1,
                ':timestamp': new Date().toISOString(),
                ':type': 'AUTO_REALLOCATED',
              },
            })
          );

          resolutionResults.push({
            bookingKey,
            resolution: 'REALLOCATED',
            success: true,
            alternativeRooms: alternativeRooms.map(r => r.booking_key),
          });

          // Notify via SNS
          await snsClient.send(
            new PublishCommand({
              TopicArn: SNS_TOPIC_ARN,
              Message: JSON.stringify({
                eventType: 'OVERBOOKING_RESOLVED',
                bookingKey,
                resolution: 'REALLOCATED',
                timestamp: new Date().toISOString(),
              }),
              MessageAttributes: {
                property_id: { DataType: 'String', StringValue: propertyId },
                event_type: {
                  DataType: 'String',
                  StringValue: 'OVERBOOKING_RESOLVED',
                },
              },
            })
          );

          continue;
        }
      }

      // Step 3: If auto-resolution failed, mark as unresolved and alert ops
      unresolvedCount++;

      await dynamoClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: bookingKey },
          UpdateExpression:
            'SET resolution_status = :status, escalated_at = :timestamp',
          ExpressionAttributeValues: {
            ':status': 'UNRESOLVED',
            ':timestamp': new Date().toISOString(),
          },
        })
      );

      resolutionResults.push({
        bookingKey,
        resolution: 'UNRESOLVED',
        success: false,
        reason: 'NO_ALTERNATIVE_ROOMS',
      });

      // Publish unresolved metric for alerting
      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'Custom/Booking',
          MetricData: [
            {
              MetricName: 'UnresolvedOverbookings',
              Value: 1,
              Unit: 'Count',
              Timestamp: new Date(),
              Dimensions: [
                { Name: 'PropertyId', Value: propertyId },
                { Name: 'BookingKey', Value: bookingKey },
              ],
            },
          ],
        })
      );

      // Send high-priority SNS notification
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: 'URGENT: Unresolved Overbooking',
          Message: JSON.stringify({
            eventType: 'OVERBOOKING_UNRESOLVED',
            bookingKey,
            propertyId,
            roomId,
            date,
            availableUnits: currentAvailable,
            detectedAt,
            requiresManualIntervention: true,
            priority: 'CRITICAL',
          }),
          MessageAttributes: {
            property_id: { DataType: 'String', StringValue: propertyId },
            event_type: {
              DataType: 'String',
              StringValue: 'OVERBOOKING_UNRESOLVED',
            },
            priority: { DataType: 'String', StringValue: 'CRITICAL' },
          },
        })
      );

      console.error(`Overbooking ${bookingKey} requires manual intervention`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        conflictsProcessed: conflicts.length,
        resolutionResults,
        unresolvedCount,
      }),
    };
  } catch (error) {
    console.error('Overbooking resolver error:', error);
    throw error;
  }
};

/**
 * Find alternative rooms at the same property for reallocation
 */
async function findAlternativeRooms(propertyId, date, excludeRoomId) {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'PropertyIndex',
        KeyConditionExpression: 'property_id = :propertyId',
        FilterExpression:
          '#date = :date AND available_units > :zero AND room_id <> :excludeRoom',
        ExpressionAttributeNames: {
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':propertyId': propertyId,
          ':date': date,
          ':zero': 0,
          ':excludeRoom': excludeRoomId,
        },
        Limit: 10,
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error('Error finding alternative rooms:', error);
    return [];
  }
}

/**
 * Reallocate overbooking to alternative rooms
 */
async function reallocateBooking(
  originalBookingKey,
  alternativeRooms,
  unitsNeeded
) {
  try {
    let unitsReallocated = 0;

    for (const room of alternativeRooms) {
      if (unitsReallocated >= unitsNeeded) break;

      const unitsToTake = Math.min(
        room.available_units,
        unitsNeeded - unitsReallocated
      );

      // Reserve units in the alternative room
      await dynamoClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { booking_key: room.booking_key },
          UpdateExpression:
            'SET available_units = available_units - :units, #version = #version + :inc, reallocated_from = :original',
          ExpressionAttributeNames: {
            '#version': 'version',
          },
          ExpressionAttributeValues: {
            ':units': unitsToTake,
            ':inc': 1,
            ':original': originalBookingKey,
          },
          ConditionExpression: 'available_units >= :units',
        })
      );

      unitsReallocated += unitsToTake;
      console.log(`Reallocated ${unitsToTake} units to ${room.booking_key}`);
    }

    return unitsReallocated >= unitsNeeded;
  } catch (error) {
    console.error('Reallocation failed:', error);
    return false;
  }
}
