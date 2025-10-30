const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const ssm = new AWS.SSM();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();

const REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter', 'DataClassification'];
const RESULTS_BUCKET = process.env.RESULTS_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const CROSS_REGION_TOPIC_ARN = process.env.CROSS_REGION_TOPIC_ARN; // optional
const SSM_PARAMETER_NAME = process.env.SSM_PARAMETER_NAME; // '/compliance/approved-amis'

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (error) {
      lastError = error;
      if (error && (error.code === 'Throttling' || error.code === 'RequestLimitExceeded')) {
        await sleep(Math.pow(2, i) * 1000);
      } else { throw error; }
    }
  }
  throw lastError;
}

async function checkResourceTags(tags, resourceId, resourceType) {
  const violations = [];
  const tagMap = {};
  if (tags) tags.forEach(t => { tagMap[t.Key] = t.Value; });
  for (const requiredTag of REQUIRED_TAGS) {
    if (!tagMap[requiredTag]) {
      violations.push({ resourceId, resourceType, violationType: 'MISSING_TAG', details: `Missing required tag: ${requiredTag}`, severity: 'HIGH'});
    }
  }
  return violations;
}

async function publishMetric(metricName, value, unit, dimensions) {
  const params = { Namespace: 'ComplianceScanner', MetricData: [{ MetricName: metricName, Value: value, Unit: unit, Dimensions: dimensions, Timestamp: new Date() }] };
  await withRetry(() => cloudwatch.putMetricData(params).promise());
}

async function sendNotification(violations) {
  if (!violations || violations.length === 0) return;
  const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
  if (criticalViolations.length > 0 && SNS_TOPIC_ARN) {
    const message = { default: `Found ${criticalViolations.length} critical compliance violations`, violations: criticalViolations };
    await withRetry(() => sns.publish({ TopicArn: SNS_TOPIC_ARN, Message: JSON.stringify(message), Subject: 'Critical Compliance Violations Detected' }).promise());
    if (CROSS_REGION_TOPIC_ARN) {
      await withRetry(() => sns.publish({ TopicArn: CROSS_REGION_TOPIC_ARN, Message: JSON.stringify(message), Subject: 'Critical Compliance Violations Detected (DR)' }).promise());
    }
  }
}

async function saveResults(scanType, results) {
  if (!RESULTS_BUCKET) return;
  const timestamp = new Date().toISOString();
  const key = `${scanType}/${timestamp}.json`;
  await withRetry(() => s3.putObject({ Bucket: RESULTS_BUCKET, Key: key, Body: JSON.stringify(results, null, 2), ContentType: 'application/json' }).promise());
}

exports.scanEC2Handler = async (event) => {
  const violations = []; let totalInstances = 0; let compliantInstances = 0;
  try {
    let approvedAMIs = [];
    if (SSM_PARAMETER_NAME) {
      try {
        const param = await withRetry(() => ssm.getParameter({ Name: SSM_PARAMETER_NAME }).promise());
        approvedAMIs = JSON.parse(param.Parameter.Value || '[]');
      } catch (e) { console.warn('Approved AMIs parameter missing or unreadable, continuing without AMI validation'); }
    }
    let nextToken = null;
    do {
      const params = { MaxResults: 100, NextToken: nextToken };
      const response = await withRetry(() => ec2.describeInstances(params).promise());
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          totalInstances++; const instanceViolations = [];
          instanceViolations.push(...await checkResourceTags(instance.Tags, instance.InstanceId, 'EC2_INSTANCE'));
          if (approvedAMIs.length > 0 && !approvedAMIs.includes(instance.ImageId)) {
            instanceViolations.push({ resourceId: instance.InstanceId, resourceType: 'EC2_INSTANCE', violationType: 'UNAPPROVED_AMI', details: `Instance using unapproved AMI: ${instance.ImageId}`, severity: 'HIGH' });
          }
          violations.push(...instanceViolations);
          if (instanceViolations.length === 0) compliantInstances++;
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);

    await publishMetric('EC2ComplianceScore', totalInstances > 0 ? (compliantInstances/totalInstances)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'EC2' }]);
    await publishMetric('EC2Violations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'EC2' }]);
    await saveResults('ec2', { violations, totalInstances, compliantInstances });
    await sendNotification(violations);
    return { statusCode: 200, body: JSON.stringify({ totalInstances, compliantInstances, violations: violations.length }) };
  } catch (error) { console.error('EC2 scan error:', error); throw error; }
};

exports.scanRDSHandler = async (event) => {
  const violations = []; let totalInstances = 0; let compliantInstances = 0;
  try {
    let marker = null;
    do {
      const params = { MaxRecords: 100, Marker: marker };
      const response = await withRetry(() => rds.describeDBInstances(params).promise());
      for (const dbInstance of response.DBInstances || []) {
        totalInstances++; const instanceViolations = [];
        try {
          const tagsResponse = await withRetry(() => rds.listTagsForResource({ ResourceName: dbInstance.DBInstanceArn }).promise());
          instanceViolations.push(...await checkResourceTags(tagsResponse.TagList, dbInstance.DBInstanceIdentifier, 'RDS_INSTANCE'));
        } catch (e) { console.warn('RDS tag read failed', e); }
        if (!dbInstance.StorageEncrypted) {
          instanceViolations.push({ resourceId: dbInstance.DBInstanceIdentifier, resourceType: 'RDS_INSTANCE', violationType: 'ENCRYPTION_DISABLED', details: 'RDS instance does not have encryption enabled', severity: 'CRITICAL' });
        }
        if (dbInstance.BackupRetentionPeriod === 0) {
          instanceViolations.push({ resourceId: dbInstance.DBInstanceIdentifier, resourceType: 'RDS_INSTANCE', violationType: 'BACKUP_DISABLED', details: 'RDS instance does not have automated backups configured', severity: 'HIGH' });
        }
        violations.push(...instanceViolations);
        if (instanceViolations.length === 0) compliantInstances++;
      }
      marker = response.Marker;
    } while (marker);
    await publishMetric('RDSComplianceScore', totalInstances > 0 ? (compliantInstances/totalInstances)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'RDS' }]);
    await publishMetric('RDSViolations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'RDS' }]);
    await saveResults('rds', { violations, totalInstances, compliantInstances });
    await sendNotification(violations);
    return { statusCode: 200, body: JSON.stringify({ totalInstances, compliantInstances, violations: violations.length }) };
  } catch (error) { console.error('RDS scan error:', error); throw error; }
};

exports.scanS3Handler = async (event) => {
  const violations = []; let totalBuckets = 0; let compliantBuckets = 0;
  try {
    const bucketsResponse = await withRetry(() => s3.listBuckets().promise());
    for (const bucket of bucketsResponse.Buckets || []) {
      totalBuckets++; const bucketViolations = [];
      try {
        const tagsResponse = await withRetry(() => s3.getBucketTagging({ Bucket: bucket.Name }).promise().catch(err => { if (err.code === 'NoSuchTagSet') return { TagSet: [] }; throw err; }));
        bucketViolations.push(...await checkResourceTags(tagsResponse.TagSet.map(t => ({ Key: t.Key, Value: t.Value })), bucket.Name, 'S3_BUCKET'));
        const versioningResponse = await withRetry(() => s3.getBucketVersioning({ Bucket: bucket.Name }).promise());
        if (versioningResponse.Status !== 'Enabled') {
          bucketViolations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'VERSIONING_DISABLED', details: 'S3 bucket does not have versioning enabled', severity: 'HIGH' });
        }
        try { await withRetry(() => s3.getBucketLifecycleConfiguration({ Bucket: bucket.Name }).promise()); } catch (err) { if (err.code === 'NoSuchLifecycleConfiguration') { bucketViolations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'NO_LIFECYCLE_POLICY', details: 'S3 bucket does not have lifecycle policies defined', severity: 'MEDIUM' }); } }
        violations.push(...bucketViolations);
        if (bucketViolations.length === 0) compliantBuckets++;
      } catch (error) { console.error(`Error scanning bucket ${bucket.Name}:`, error); violations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'SCAN_ERROR', details: `Failed to scan bucket: ${error.message}`, severity: 'MEDIUM' }); }
    }
    await publishMetric('S3ComplianceScore', totalBuckets > 0 ? (compliantBuckets/totalBuckets)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'S3' }]);
    await publishMetric('S3Violations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'S3' }]);
    await saveResults('s3', { violations, totalBuckets, compliantBuckets });
    await sendNotification(violations);
    return { statusCode: 200, body: JSON.stringify({ totalBuckets, compliantBuckets, violations: violations.length }) };
  } catch (error) { console.error('S3 scan error:', error); throw error; }
};
