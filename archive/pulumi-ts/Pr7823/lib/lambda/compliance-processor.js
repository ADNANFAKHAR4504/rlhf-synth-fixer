/**
 * compliance-processor.js
 *
 * Lambda function for processing AWS Config compliance results.
 * FIX: Migrated to AWS SDK v3
 * FIX: Added comprehensive error handling
 */
const { ConfigServiceClient, DescribeConfigRulesCommand, GetComplianceDetailsByConfigRuleCommand } = require('@aws-sdk/client-config-service');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('Starting compliance report generation', JSON.stringify(event));

  const bucketName = process.env.BUCKET_NAME;
  const timestamp = new Date().toISOString();

  try {
    // Get all Config rules
    const describeRulesCommand = new DescribeConfigRulesCommand({});
    const rulesResponse = await configClient.send(describeRulesCommand);
    const configRules = rulesResponse.ConfigRules || [];

    console.log(`Found ${configRules.length} Config rules`);

    // Collect compliance details for each rule
    const complianceReport = {
      timestamp,
      rules: [],
      summary: {
        totalRules: configRules.length,
        compliantResources: 0,
        nonCompliantResources: 0,
        notApplicableResources: 0,
      },
    };

    for (const rule of configRules) {
      const ruleName = rule.ConfigRuleName;
      console.log(`Processing rule: ${ruleName}`);

      try {
        const complianceCommand = new GetComplianceDetailsByConfigRuleCommand({
          ConfigRuleName: ruleName,
          Limit: 100,
        });
        const complianceResponse = await configClient.send(complianceCommand);
        const evaluations = complianceResponse.EvaluationResults || [];

        const ruleCompliance = {
          ruleName,
          description: rule.Description || 'No description',
          compliant: 0,
          nonCompliant: 0,
          notApplicable: 0,
          resources: [],
        };

        evaluations.forEach((evaluation) => {
          const complianceType = evaluation.ComplianceType;
          const resourceId = evaluation.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceId || 'Unknown';
          const resourceType = evaluation.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceType || 'Unknown';

          ruleCompliance.resources.push({
            resourceId,
            resourceType,
            complianceType,
          });

          if (complianceType === 'COMPLIANT') {
            ruleCompliance.compliant++;
            complianceReport.summary.compliantResources++;
          } else if (complianceType === 'NON_COMPLIANT') {
            ruleCompliance.nonCompliant++;
            complianceReport.summary.nonCompliantResources++;
          } else {
            ruleCompliance.notApplicable++;
            complianceReport.summary.notApplicableResources++;
          }
        });

        complianceReport.rules.push(ruleCompliance);
      } catch (error) {
        console.error(`Error processing rule ${ruleName}:`, error);
        complianceReport.rules.push({
          ruleName,
          error: error.message,
        });
      }
    }

    // Generate report summary
    const reportSummary = generateReportSummary(complianceReport);
    console.log('Report summary:', reportSummary);

    // Save detailed report to S3
    const reportKey = `compliance-reports/${timestamp.split('T')[0]}/report-${timestamp}.json`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: reportKey,
      Body: JSON.stringify(complianceReport, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);
    console.log(`Report saved to s3://${bucketName}/${reportKey}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance report generated successfully',
        reportLocation: `s3://${bucketName}/${reportKey}`,
        summary: complianceReport.summary,
      }),
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
};

function generateReportSummary(report) {
  const { summary } = report;
  const total = summary.compliantResources + summary.nonCompliantResources;
  const compliancePercentage = total > 0 ? ((summary.compliantResources / total) * 100).toFixed(2) : 0;

  return {
    timestamp: report.timestamp,
    totalRules: summary.totalRules,
    totalResources: total,
    compliantResources: summary.compliantResources,
    nonCompliantResources: summary.nonCompliantResources,
    compliancePercentage: `${compliancePercentage}%`,
  };
}
