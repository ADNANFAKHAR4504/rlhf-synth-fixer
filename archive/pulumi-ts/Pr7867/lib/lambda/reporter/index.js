const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// SDK client auto-detects region from Lambda environment
const s3Client = new S3Client({});

const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
  console.log('Starting daily compliance report generation...');

  try {
    // Get the date 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    console.log(`Generating report for date: ${dateStr}`);

    // List all scan results from the last 24 hours
    const scans = await getScanResults(dateStr);

    if (scans.length === 0) {
      console.log('No scan results found for the last 24 hours');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No scans to report' }),
      };
    }

    console.log(`Found ${scans.length} scan(s) to analyze`);

    // Aggregate the scan results
    const report = aggregateScans(scans, dateStr);

    // Store the daily report
    await storeReport(report);

    console.log('Daily compliance report generated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily report generated',
        date: dateStr,
        scansAnalyzed: scans.length,
        averageCompliance: report.averageCompliancePercentage,
      }),
    };
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
};

async function getScanResults(dateStr) {
  const scans = [];
  let continuationToken = undefined;

  // List all objects in the scans/{date}/ prefix
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `scans/${dateStr}/`,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents) {
      // Fetch each scan result
      for (const obj of listResponse.Contents) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: obj.Key,
          });

          const getResponse = await s3Client.send(getCommand);
          const scanData = await streamToString(getResponse.Body);
          scans.push(JSON.parse(scanData));
        } catch (error) {
          console.error(`Error fetching scan ${obj.Key}:`, error);
        }
      }
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  return scans;
}

function aggregateScans(scans, dateStr) {
  // Calculate aggregate statistics
  let totalInstances = 0;
  let totalCompliant = 0;
  let totalNonCompliant = 0;
  const compliancePercentages = [];
  const allViolations = [];
  const instanceViolations = new Map();

  for (const scan of scans) {
    totalInstances += scan.totalInstances || 0;
    totalCompliant += scan.compliantInstances || 0;
    totalNonCompliant += scan.nonCompliantInstances || 0;
    compliancePercentages.push(parseFloat(scan.compliancePercentage || 0));

    // Track violations per instance
    if (scan.results) {
      for (const result of scan.results) {
        if (!result.compliant) {
          const instanceId = result.instanceId;
          if (!instanceViolations.has(instanceId)) {
            instanceViolations.set(instanceId, {
              instanceId,
              violations: result.allViolations || [`Missing tags: ${result.missingTags?.join(', ') || 'unknown'}`],
              occurrences: 1,
            });
          } else {
            instanceViolations.get(instanceId).occurrences++;
          }
        }
      }
    }
  }

  // Calculate averages
  const avgCompliance =
    compliancePercentages.length > 0
      ? compliancePercentages.reduce((a, b) => a + b, 0) / compliancePercentages.length
      : 0;

  // Find most common violations
  const violationCounts = new Map();
  for (const [, data] of instanceViolations) {
    for (const violation of data.violations) {
      violationCounts.set(violation, (violationCounts.get(violation) || 0) + 1);
    }
  }

  const topViolations = Array.from(violationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([violation, count]) => ({ violation, count }));

  return {
    reportDate: dateStr,
    generatedAt: new Date().toISOString(),
    scanCount: scans.length,
    summary: {
      totalInstances,
      totalCompliant,
      totalNonCompliant,
      averageCompliancePercentage: avgCompliance.toFixed(2),
    },
    complianceTrend: compliancePercentages.map((pct, idx) => ({
      scanNumber: idx + 1,
      compliancePercentage: pct.toFixed(2),
      timestamp: scans[idx].timestamp,
    })),
    topViolations,
    persistentViolators: Array.from(instanceViolations.values())
      .filter(v => v.occurrences > 1)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 20),
    allNonCompliantInstances: Array.from(instanceViolations.values()),
  };
}

async function storeReport(report) {
  const key = `reports/daily/${report.reportDate}.json`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Stored daily report to s3://${BUCKET_NAME}/${key}`);
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
