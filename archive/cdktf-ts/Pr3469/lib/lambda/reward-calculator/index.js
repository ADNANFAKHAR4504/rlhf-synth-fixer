const { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Reward tiers
const REWARD_TIERS = {
  1: 10,    // First referral: $10
  5: 15,    // 5 referrals: $15 per referral
  10: 20,   // 10 referrals: $20 per referral
  25: 25,   // 25 referrals: $25 per referral
};

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { userId, referralCode, email } = body;

    if (!userId || !referralCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const timestamp = Date.now();

    // Get referrer details
    const getReferrerParams = {
      TableName: REFERRAL_TABLE,
      Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
    };

    const referrerData = await dynamodb.send(new GetItemCommand(getReferrerParams));

    if (!referrerData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Invalid referral code" }),
      };
    }

    const referrer = unmarshall(referrerData.Item);
    const currentReferralCount = (referrer.referral_count || 0) + 1;

    // Determine reward amount based on tier
    let rewardAmount = REWARD_TIERS[1];
    for (const [tier, amount] of Object.entries(REWARD_TIERS).sort((a, b) => b[0] - a[0])) {
      if (currentReferralCount >= parseInt(tier)) {
        rewardAmount = amount;
        break;
      }
    }

    // Prepare transaction items
    const transactItems = [
      {
        Put: {
          TableName: REFERRAL_TABLE,
          Item: marshall({
            user_id: userId,
            referral_timestamp: timestamp,
            referrer_id: referralCode,
            email: email || "",
            signup_date: new Date().toISOString(),
            reward_amount: rewardAmount,
            status: "pending",
          }),
        },
      },
      {
        Update: {
          TableName: REFERRAL_TABLE,
          Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
          UpdateExpression: "SET referral_count = referral_count + :inc, total_rewards = total_rewards + :reward",
          ExpressionAttributeValues: marshall({
            ":inc": 1,
            ":reward": rewardAmount,
          }),
        },
      },
    ];

    // Execute transaction
    await dynamodb.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));

    // Send notification
    const message = `New referral signup! User ${userId} signed up with referral code ${referralCode}. Reward: $${rewardAmount}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "New Referral Signup",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Signup successful",
        rewardAmount: rewardAmount,
        referralCount: currentReferralCount,
      }),
    };

  } catch (error) {
    console.error("Error processing signup:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};