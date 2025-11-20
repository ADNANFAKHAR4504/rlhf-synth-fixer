// index.js - Lambda function for drift detection (Requirement 4 & 10)

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const s3Client = new S3Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Drift detection Lambda invoked:', JSON.stringify(event));

  const timestamp = new Date().toISOString();
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const driftReportsBucket = process.env.DRIFT_REPORTS_BUCKET;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;

  try {
    // Simulate drift detection analysis
    // In production, this would execute: terraform plan -detailed-exitcode
    const driftAnalysis = await performDriftAnalysis();

    // Generate structured JSON report (Requirement 10)
    const driftReport = {
      timestamp: timestamp,
      environment: environmentSuffix,
      region: process.env.AWS_REGION || 'us-east-1',
      drift_detected: driftAnalysis.drifted,
      severity: driftAnalysis.severity,
      resources: driftAnalysis.resources,
      summary: {
        total_resources: driftAnalysis.totalResources,
        drifted_resources: driftAnalysis.driftedCount,
        drift_percentage: driftAnalysis.driftPercentage
      },
      remediation_suggestions: driftAnalysis.remediationSuggestions
    };

    // Store report in S3 (Requirement 1, 10)
    const reportKey = `drift-reports/${timestamp.split('T')[0]}/${environmentSuffix}-${Date.now()}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: driftReportsBucket,
      Key: reportKey,
      Body: JSON.stringify(driftReport, null, 2),
      ContentType: 'application/json'
    }));

    console.log(`Drift report stored: s3://${driftReportsBucket}/${reportKey}`);

    // Send SNS notification if critical drift detected (Requirement 6)
    if (driftAnalysis.severity === 'critical') {
      const message = `
CRITICAL DRIFT DETECTED

Environment: ${environmentSuffix}
Region: ${process.env.AWS_REGION || 'us-east-1'}
Timestamp: ${timestamp}

Summary:
- Total Resources: ${driftAnalysis.totalResources}
- Drifted Resources: ${driftAnalysis.driftedCount}
- Drift Percentage: ${driftAnalysis.driftPercentage}%

Affected Resources:
${driftAnalysis.resources.map(r => `- ${r.type}: ${r.name} (${r.change})`).join('\n')}

Report Location: s3://${driftReportsBucket}/${reportKey}

Action Required: Review and remediate drift immediately.
`;

      await snsClient.send(new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: `Critical Infrastructure Drift Detected - ${environmentSuffix}`,
        Message: message
      }));

      console.log('Critical drift notification sent to SNS');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Drift detection completed',
        driftDetected: driftAnalysis.drifted,
        severity: driftAnalysis.severity,
        reportLocation: `s3://${driftReportsBucket}/${reportKey}`
      })
    };

  } catch (error) {
    console.error('Error during drift detection:', error);

    // Send error notification
    await snsClient.send(new PublishCommand({
      TopicArn: snsTopicArn,
      Subject: `Drift Detection Failed - ${environmentSuffix}`,
      Message: `Drift detection failed at ${timestamp}\n\nError: ${error.message}\n\nEnvironment: ${environmentSuffix}`
    }));

    throw error;
  }
};

// Simulate drift detection (in production, execute terraform plan)
async function performDriftAnalysis() {
  // This simulates parsing terraform plan output
  // In production, you would execute: terraform plan -detailed-exitcode
  // Exit code 0 = no changes, 1 = error, 2 = changes detected

  const simulatedDrift = Math.random() > 0.5;
  const resources = [];

  if (simulatedDrift) {
    resources.push({
      type: 'aws_s3_bucket',
      name: 'data-bucket',
      change: 'configuration modified',
      attribute: 'versioning',
      expected: 'Enabled',
      actual: 'Disabled'
    });
    resources.push({
      type: 'aws_security_group',
      name: 'app-sg',
      change: 'rule added',
      attribute: 'ingress',
      expected: '2 rules',
      actual: '3 rules'
    });
  }

  const severity = resources.length >= 2 ? 'critical' : resources.length === 1 ? 'warning' : 'info';

  return {
    drifted: simulatedDrift,
    severity: severity,
    totalResources: 25,
    driftedCount: resources.length,
    driftPercentage: (resources.length / 25 * 100).toFixed(2),
    resources: resources,
    remediationSuggestions: resources.map(r => ({
      resource: `${r.type}.${r.name}`,
      suggestion: `Update ${r.attribute} from '${r.actual}' back to '${r.expected}'`,
      command: `terraform apply -target=${r.type}.${r.name}`
    }))
  };
}
