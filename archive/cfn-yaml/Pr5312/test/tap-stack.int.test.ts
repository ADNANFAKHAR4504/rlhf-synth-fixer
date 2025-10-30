import fs from 'fs';
import http from 'http';
import path from 'path';

// Optional: allow CI to override outputs path, default to local flat-outputs.json
const outputsPath = process.env.CFN_OUTPUTS_PATH || path.join(__dirname, '../cfn-outputs/flat-outputs.json');

function readFlatOutputs(): Record<string, any> | null {
  try {
    if (!fs.existsSync(outputsPath)) {
        console.error(`Outputs file not found at: ${outputsPath}`);
        return null;
    }
    const raw = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to read or parse outputs file: ${e}`);
    return null;
  }
}

function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Request timeout')));
  });
}

// Read once for all tests
const flat = readFlatOutputs();

(flat ? describe : describe.skip)('TapStack Integration Tests (Financial Services)', () => {
  // Increase timeout for network calls
  beforeAll(() => {
    // 60 seconds, as ALB connection can be slow to establish
    jest.setTimeout(60000); 
  });

  const albDns = (flat!['ApplicationLoadBalancerDNS'] || '').toString();
  const rdsEndpoint = (flat!['DBEndpoint'] || '').toString();
  const s3BucketName = (flat!['ApplicationDataBucketName'] || '').toString();

  test('verify required outputs are present and non-empty', () => {
    const required = [
      'VPCId',
      'ApplicationLoadBalancerDNS',
      'ApplicationDataBucketName',
      'KMSKeyId',
      'DBEndpoint',
      'CloudTrailName',
      'AlarmTopicArn'
    ];
    
    let missing: string[] = [];
    required.forEach(key => {
      const val = (flat![key] || '').toString();
      if (!val || val.length === 0) {
        missing.push(key);
      }
      expect(flat![key]).toBeDefined();
      expect(val.length).toBeGreaterThan(0);
    });
    if(missing.length > 0) {
        console.error(`Missing required outputs: ${missing.join(', ')}`);
    }
  });

  describe('ALB -> ASG -> Services E2E', () => {
    let healthStatus = 0;
    let healthJson: any = null;

    beforeAll(async () => {
      if (!albDns) {
        console.log('ALB DNS not found, skipping E2E tests.');
        return;
      }
      try {
        const { status, body } = await httpGet(`http://${albDns}/health`);
        healthStatus = status;
        try {
          healthJson = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse JSON from /health response:', body);
          healthJson = {};
        }
      } catch (e: any) {
         console.error(`HTTP request to /health failed: ${e.message}`);
      }
    });

    test('ALB -> TargetGroup -> ASG -> EC2 path (GET /health returns 200)', () => {
      expect(healthStatus).toBe(200);
      console.log('\n— E2E Path Verification —');
      console.log('Network path: Client -> ALB -> Target Group -> Auto Scaling Group -> EC2: OK');
      console.log('ALB DNS:', albDns);
      console.log('Overall application health (from /health):', healthJson?.status);
    });

    test('EC2 -> RDS connectivity', () => {
      // This checks for the 'success' string from our new Python script
      expect(healthJson?.rds).toBe('success');
      console.log('\n— EC2 -> RDS —');
      console.log('RDS endpoint =', rdsEndpoint || 'N/A', '| status =', healthJson?.rds);
    });

    test('EC2 -> S3 connectivity', () => {
      // This checks for the 'success' string from our new Python script
      expect(healthJson?.s3).toBe('success');
      console.log('\n— EC2 -> S3 —');
      console.log('S3 bucket =', s3BucketName || 'N/A', '| status =', healthJson?.s3);
    });

    test('Application root path via ALB -> ASG -> EC2 (GET /)', async () => {
      if (!albDns) {
        // Skip if ALB DNS is not available (already checked in beforeAll)
        return;
      }
      const { status, body } = await httpGet(`http://${albDns}/`);
      expect(status).toBe(200);
      expect(body).toContain('Financial Services Application - OK');

      // Verbose context for CI output
      console.log('\n— Application Page Verification —');
      console.log('Page served via: ALB -> Target Group -> ASG -> EC2: OK');
      console.log('Verified root path / serves plain text welcome message.');
    });
  });
});

// If outputs file missing, provide a helpful skipped test
if (!flat) {
  describe.skip('TapStack Integration Tests (Financial Services)', () => {
    test('flat-outputs.json not found - skipping', () => { /* no-op */ });
  });
}
