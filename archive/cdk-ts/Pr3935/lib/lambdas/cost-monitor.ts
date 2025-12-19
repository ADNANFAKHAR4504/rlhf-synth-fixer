// eslint-disable-next-line import/no-extraneous-dependencies
import { CostExplorer, SNS } from 'aws-sdk';

const ce = new CostExplorer();
const sns = new SNS();

export const handler = async (): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const thresholdPercentage = parseInt(
    process.env.THRESHOLD_PERCENTAGE || '20'
  );

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  try {
    // Get current week costs
    const currentWeekResponse = await ce
      .getCostAndUsage({
        TimePeriod: {
          Start: lastWeek.toISOString().split('T')[0],
          End: today.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      })
      .promise();

    // Get previous week costs for comparison
    const previousWeekResponse = await ce
      .getCostAndUsage({
        TimePeriod: {
          Start: twoWeeksAgo.toISOString().split('T')[0],
          End: lastWeek.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      })
      .promise();

    // Calculate totals
    let currentWeekTotal = 0;
    let previousWeekTotal = 0;
    const serviceBreakdown: Record<
      string,
      { current: number; previous: number }
    > = {};

    // Process current week
    currentWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        currentWeekTotal += amount;

        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].current += amount;
      });
    });

    // Process previous week
    previousWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        previousWeekTotal += amount;

        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].previous += amount;
      });
    });

    // Calculate percentage increase
    const percentageIncrease =
      previousWeekTotal > 0
        ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : 0;

    // Alert if costs increased beyond threshold
    if (percentageIncrease > thresholdPercentage) {
      // Find services with significant increases
      const significantIncreases = Object.entries(serviceBreakdown)
        .filter(([_, costs]) => {
          const serviceIncrease =
            costs.previous > 0
              ? ((costs.current - costs.previous) / costs.previous) * 100
              : 0;
          return serviceIncrease > thresholdPercentage;
        })
        .map(([service, costs]) => ({
          service,
          currentCost: costs.current.toFixed(2),
          previousCost: costs.previous.toFixed(2),
          increase:
            (((costs.current - costs.previous) / costs.previous) * 100).toFixed(
              2
            ) + '%',
        }));

      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: `Cost Alert: ${percentageIncrease.toFixed(2)}% Increase Detected`,
          Message: JSON.stringify(
            {
              severity: 'WARNING',
              message: `Weekly costs increased by ${percentageIncrease.toFixed(2)}%`,
              currentWeekTotal: currentWeekTotal.toFixed(2),
              previousWeekTotal: previousWeekTotal.toFixed(2),
              servicesWithSignificantIncreases: significantIncreases,
            },
            null,
            2
          ),
        })
        .promise();
    } else {
      // Send informational update
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Cost Update: Weekly Summary',
          Message: JSON.stringify(
            {
              severity: 'INFO',
              message: 'Weekly cost summary',
              currentWeekTotal: currentWeekTotal.toFixed(2),
              previousWeekTotal: previousWeekTotal.toFixed(2),
              change: percentageIncrease.toFixed(2) + '%',
            },
            null,
            2
          ),
        })
        .promise();
    }
  } catch (error) {
    console.error('Error in cost monitoring:', error);

    await sns
      .publish({
        TopicArn: snsTopicArn,
        Subject: 'Error: Cost Monitoring Failed',
        Message: JSON.stringify(
          {
            severity: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          null,
          2
        ),
      })
      .promise();

    throw error;
  }
};
