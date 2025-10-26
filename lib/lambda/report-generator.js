const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const crypto = require('crypto');

exports.handler = async event => {
  const reportId = `incident-report-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const reportContent = {
    reportId,
    incidentType: 'UNAUTHORIZED_PHI_ACCESS',
    detectionTime: new Date().toISOString(),
    incidentDetails: {
      userId: event.userId,
      accessedResource: event.objectKey,
      accessTime: event.timestamp,
      authorizationFailureReason: event.authorizationFailureReason,
    },
    investigationResults: {
      athenaQueryResults: event[0]?.athenaQueryResults || 'Pending',
      macieClassification: event[1]?.macieJobId || 'Pending',
    },
    remediationActions: {
      userLockout: event.remediationResult?.Payload || 'Completed',
      alertsSent: true,
    },
    reportGeneratedAt: new Date().toISOString(),
    reportHash: '',
  };

  // Generate hash for tamper detection
  const reportString = JSON.stringify(reportContent);
  reportContent.reportHash = crypto
    .createHash('sha256')
    .update(reportString)
    .digest('hex');

  // Upload to S3 with object lock
  const params = {
    Bucket: process.env.ARCHIVE_BUCKET,
    Key: `incident-reports/${new Date().getFullYear()}/${reportId}.json`,
    Body: JSON.stringify(reportContent, null, 2),
    ContentType: 'application/json',
    ObjectLockMode: 'GOVERNANCE',
    ObjectLockRetainUntilDate: new Date(
      Date.now() + 7 * 365 * 24 * 60 * 60 * 1000
    ), // 7 years
  };

  await s3.putObject(params).promise();

  return {
    success: true,
    reportId,
    reportLocation: `s3://${process.env.ARCHIVE_BUCKET}/incident-reports/${new Date().getFullYear()}/${reportId}.json`,
  };
};
