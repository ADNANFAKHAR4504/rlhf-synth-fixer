const { DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const s3 = new S3Client({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const IDEMPOTENCY_TABLE = process.env.IDEMPOTENCY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const REPORTS_BUCKET = process.env.REPORTS_BUCKET_NAME;

exports.handler = async (event) => {
  console.log("Starting monthly payout processing");

  const payoutDate = new Date();
  const payoutMonth = payoutDate.toISOString().slice(0, 7);
  const idempotencyKey = `payout-${payoutMonth}`;

  try {
    // Check idempotency
    const idempotencyCheck = await dynamodb.send(new GetItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Key: marshall({ idempotency_key: idempotencyKey }),
    }));

    if (idempotencyCheck.Item) {
      console.log("Payout already processed for this month");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Payout already processed" }),
      };
    }

    // Mark as processing
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "processing",
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90, // 90 days TTL
      }),
    }));

    // Query all pending rewards
    const queryParams = {
      TableName: REFERRAL_TABLE,
      IndexName: "referrer-index",
      FilterExpression: "#status = :pending",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":pending": "pending",
      }),
    };

    const pendingRewards = [];
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamodb.send(new QueryCommand(queryParams));

      if (result.Items) {
        pendingRewards.push(...result.Items.map(item => unmarshall(item)));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Group rewards by referrer
    const payoutsByReferrer = {};
    for (const reward of pendingRewards) {
      const referrerId = reward.referrer_id;
      if (!payoutsByReferrer[referrerId]) {
        payoutsByReferrer[referrerId] = {
          total: 0,
          count: 0,
          details: [],
        };
      }
      payoutsByReferrer[referrerId].total += reward.reward_amount;
      payoutsByReferrer[referrerId].count += 1;
      payoutsByReferrer[referrerId].details.push({
        userId: reward.user_id,
        amount: reward.reward_amount,
        date: reward.signup_date,
      });
    }

    // Generate CSV report
    let csvContent = "Referrer ID,Total Amount,Referral Count,Payment Status\n";
    const payoutSummary = [];

    for (const [referrerId, data] of Object.entries(payoutsByReferrer)) {
      csvContent += `${referrerId},${data.total},${data.count},Processed\n`;
      payoutSummary.push({
        referrerId,
        amount: data.total,
        count: data.count,
      });
    }

    // Save report to S3
    const reportKey = `payouts/${payoutMonth}/payout-report-${payoutDate.toISOString()}.csv`;
    await s3.send(new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: reportKey,
      Body: csvContent,
      ContentType: "text/csv",
    }));

    // Update reward statuses in batches
    const updateBatches = [];
    let currentBatch = [];

    for (const reward of pendingRewards) {
      currentBatch.push({
        PutRequest: {
          Item: marshall({
            ...reward,
            status: "paid",
            payout_date: payoutDate.toISOString(),
          }),
        },
      });

      if (currentBatch.length === 25) {
        updateBatches.push([...currentBatch]);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      updateBatches.push(currentBatch);
    }

    // Process updates
    for (const batch of updateBatches) {
      await dynamodb.send(new BatchWriteItemCommand({
        RequestItems: {
          [REFERRAL_TABLE]: batch,
        },
      }));
    }

    // Update idempotency record
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "completed",
        timestamp: payoutDate.toISOString(),
        report_location: reportKey,
        total_payouts: Object.keys(payoutsByReferrer).length,
        total_amount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
      }),
    }));

    // Send notification
    const message = `Monthly payout processing completed. Total referrers: ${Object.keys(payoutsByReferrer).length}. Total amount: $${Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0)}. Report saved to: ${reportKey}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "Monthly Payout Processing Completed",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payout processing completed",
        totalReferrers: Object.keys(payoutsByReferrer).length,
        totalAmount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        reportLocation: reportKey,
      }),
    };

  } catch (error) {
    console.error("Error processing payouts:", error);

    // Mark as failed in idempotency table
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "failed",
        error: error.message,
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 30,
      }),
    }));

    throw error;
  }
};