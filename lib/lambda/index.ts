import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ComplianceScanner } from './compliance-scanner';

interface LambdaEvent {
  [key: string]: unknown;
}

export const handler = async (event: LambdaEvent) => {
  console.log('Compliance scanner Lambda triggered', { event });

  const region = process.env.AWS_REGION_NAME || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const reportBucket = process.env.REPORT_BUCKET;
  const approvedAmisStr = process.env.APPROVED_AMIS || '[]';

  let approvedAmis: string[];
  try {
    approvedAmis = JSON.parse(approvedAmisStr);
  } catch (error) {
    console.error('Failed to parse APPROVED_AMIS:', error);
    approvedAmis = [];
  }

  if (!reportBucket) {
    throw new Error('REPORT_BUCKET environment variable is required');
  }

  const scanner = new ComplianceScanner(
    region,
    environmentSuffix,
    approvedAmis
  );

  const report = await scanner.runAllChecks();

  // Upload report to S3
  const s3Client = new S3Client({ region });
  const reportKey = `compliance-reports/${new Date().toISOString()}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: reportBucket,
      Key: reportKey,
      Body: JSON.stringify(report, null, 2),
      ContentType: 'application/json',
    })
  );

  console.log('Compliance report generated:', report.summary);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Compliance scan completed',
      summary: report.summary,
      reportLocation: `s3://${reportBucket}/${reportKey}`,
    }),
  };
};
