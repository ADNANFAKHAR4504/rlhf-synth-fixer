const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand, GetComplianceDetailsByConfigRuleCommand } = require('@aws-sdk/client-config-service');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Starting compliance analysis...');

    // Get compliance summary
    const complianceCommand = new DescribeComplianceByConfigRuleCommand({});
    const complianceData = await configClient.send(complianceCommand);

    let totalRules = 0;
    let compliantRules = 0;
    let nonCompliantResources = 0;

    if (complianceData.ComplianceByConfigRules) {
      for (const rule of complianceData.ComplianceByConfigRules) {
        totalRules++;

        if (rule.Compliance && rule.Compliance.ComplianceType === 'COMPLIANT') {
          compliantRules++;
        } else if (rule.Compliance && rule.Compliance.ComplianceType === 'NON_COMPLIANT') {
          // Get details of non-compliant resources
          const detailsCommand = new GetComplianceDetailsByConfigRuleCommand({
            ConfigRuleName: rule.ConfigRuleName,
            ComplianceTypes: ['NON_COMPLIANT']
          });

          const details = await configClient.send(detailsCommand);
          if (details.EvaluationResults) {
            nonCompliantResources += details.EvaluationResults.length;
          }
        }
      }
    }

    const compliancePercentage = totalRules > 0 ? (compliantRules / totalRules) * 100 : 100;

    // Put metrics to CloudWatch
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ComplianceMetrics',
      MetricData: [
        {
          MetricName: 'CompliancePercentage',
          Value: compliancePercentage,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'NonCompliantResources',
          Value: nonCompliantResources,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }));

    // Send alerts if compliance is low
    if (compliancePercentage < 80) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.CRITICAL_TOPIC_ARN,
        Subject: 'CRITICAL: Compliance Below 80%',
        Message: `Compliance percentage: ${compliancePercentage.toFixed(2)}%\nNon-compliant resources: ${nonCompliantResources}`
      }));
    } else if (compliancePercentage < 95) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.WARNING_TOPIC_ARN,
        Subject: 'WARNING: Compliance Below 95%',
        Message: `Compliance percentage: ${compliancePercentage.toFixed(2)}%\nNon-compliant resources: ${nonCompliantResources}`
      }));
    }

    console.log(`Compliance analysis complete. Percentage: ${compliancePercentage.toFixed(2)}%`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        compliancePercentage,
        nonCompliantResources,
        totalRules,
        compliantRules
      })
    };
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    throw error;
  }
};
