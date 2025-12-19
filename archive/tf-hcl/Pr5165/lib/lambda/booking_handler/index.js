const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENABLE_OPTIMISTIC_LOCKING =
  process.env.ENABLE_OPTIMISTIC_LOCKING === 'true';

/**
 * Booking Handler Lambda
 * Handles booking requests with optimistic locking to prevent double-booking
 * SLA Target: <400ms P95 response time
 */
exports.handler = async event => {
  console.log('Booking request received:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { propertyId, roomId, date, units = 1, guestInfo } = body;

    // Validate required fields
    if (!propertyId || !roomId || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: propertyId, roomId, date',
        }),
      };
    }

    const bookingKey = `${propertyId}#${roomId}#${date}`;

    // Step 1: Get current inventory state
    const currentItem = await dynamoClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { booking_key: bookingKey },
      })
    );

    if (!currentItem.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Inventory not found for the requested date',
        }),
      };
    }

    const currentVersion = currentItem.Item.version || 0;
    const availableUnits = currentItem.Item.available_units || 0;

    // Check availability
    if (availableUnits < units) {
      console.log(
        `Insufficient inventory: requested=${units}, available=${availableUnits}`
      );
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'Insufficient availability',
          available: availableUnits,
          requested: units,
        }),
      };
    }

    // Step 2: Attempt booking with optimistic locking
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { booking_key: bookingKey },
      UpdateExpression:
        'SET available_units = available_units - :units, #version = #version + :inc, last_booking_id = :bookingId, last_booking_time = :timestamp',
      ExpressionAttributeNames: {
        '#version': 'version',
      },
      ExpressionAttributeValues: {
        ':units': units,
        ':inc': 1,
        ':bookingId': bookingId,
        ':timestamp': new Date().toISOString(),
        ':expectedVersion': currentVersion,
        ':minUnits': units,
      },
      ReturnValues: 'ALL_NEW',
    };

    // Add optimistic locking condition
    if (ENABLE_OPTIMISTIC_LOCKING) {
      updateParams.ConditionExpression =
        '#version = :expectedVersion AND available_units >= :minUnits';
    } else {
      updateParams.ConditionExpression = 'available_units >= :minUnits';
    }

    let result;
    try {
      result = await dynamoClient.send(new UpdateCommand(updateParams));
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.error(
          'Booking failed due to concurrent modification or insufficient inventory'
        );
        return {
          statusCode: 409,
          body: JSON.stringify({
            error:
              'Booking conflict - inventory changed during booking process',
            message: 'Please retry your booking',
          }),
        };
      }
      throw error;
    }

    // Step 3: Publish booking event to SNS
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            eventType: 'BOOKING_CONFIRMED',
            bookingId,
            propertyId,
            roomId,
            date,
            units,
            timestamp: new Date().toISOString(),
            newAvailableUnits: result.Attributes.available_units,
          }),
          MessageAttributes: {
            property_id: { DataType: 'String', StringValue: propertyId },
            event_type: {
              DataType: 'String',
              StringValue: 'BOOKING_CONFIRMED',
            },
          },
        })
      );
    } catch (snsError) {
      console.error('Failed to publish SNS event:', snsError);
      // Don't fail the booking if SNS fails - it's async notification
    }

    // Success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        bookingId,
        propertyId,
        roomId,
        date,
        unitsBooked: units,
        remainingAvailability: result.Attributes.available_units,
        message: 'Booking confirmed successfully',
      }),
    };
  } catch (error) {
    console.error('Booking handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
