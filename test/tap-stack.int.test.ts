import fs from 'fs';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('High Availability Web App Integration Tests', () => {
  const lbDNS = outputs['LoadBalancerDNS'];
  const logBucket = outputs['LogBucketName'];
  const asgName = outputs['AutoScalingGroupName'];

  if (!lbDNS) {
    throw new Error(`LoadBalancerDNS not found in outputs`);
  }

  const baseUrl = `http://${lbDNS}`;

  test('Load balancer should respond with HTTP 200', async () => {
    const response = await axios.get(baseUrl);
    expect(response.status).toBe(200);
  });

  test('Web server should return welcome message', async () => {
    const response = await axios.get(baseUrl);
    expect(response.data).toContain('Welcome to the High Availability Web App');
  });

  test('S3 bucket name should match expected naming convention', () => {
    expect(logBucket).toMatch(/^app-logs-[a-z0-9-]+-[0-9]{12}$/);
  });

  test('Auto Scaling Group name should be a non-empty string', () => {
    expect(typeof asgName).toBe('string');
    expect(asgName.length).toBeGreaterThan(0);
  });
});
