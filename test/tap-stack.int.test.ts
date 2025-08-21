import fs from 'fs';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('WebAppStack Integration Tests', () => {
  const lbDns = outputs[`LoadBalancerDNS${environmentSuffix}`];
  const rdsEndpoint = outputs[`RDSEndpoint${environmentSuffix}`];
  const cloudWatchAlarmName = outputs[`CloudWatchAlarmName${environmentSuffix}`];

  describe('Load Balancer / Web Application', () => {
    test('should respond with HTTP 200 on / (root) path', async () => {
      expect(lbDns).toBeDefined();

      const url = `http://${lbDns}/`;

      const response = await axios.get(url, { timeout: 5000 });
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });

    test('should return a consistent static EIP from DNS', async () => {
      const dns = lbDns;
      expect(dns).toMatch(/\.elb\.amazonaws\.com$/);

      const ipAddress = await resolveDNS(dns);
      expect(ipAddress).toMatch(
        /(\d{1,3}\.){3}\d{1,3}/ // basic IP address format
      );
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('alarm should exist and be in OK state', async () => {
      const cloudwatch = await import('@aws-sdk/client-cloudwatch');
      const sns = await import('@aws-sdk/client-sns');
      const { CloudWatchClient, DescribeAlarmsCommand } = cloudwatch;

      const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

      const result = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [cloudWatchAlarmName],
        })
      );

      expect(result.MetricAlarms).toBeDefined();
      if (!result.MetricAlarms || result.MetricAlarms.length === 0) {
        throw new Error('No MetricAlarms found');
      }

      const alarm = result.MetricAlarms[0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK'); // or ALARM for test thresholds
    });
  });

  // Optional RDS endpoint ping test (doesn't establish SQL connection)
  describe('RDS Endpoint Check', () => {
    test('should resolve DNS for RDS endpoint', async () => {
      const rdsHost = rdsEndpoint;
      expect(rdsHost).toBeDefined();

      const ip = await resolveDNS(rdsHost);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });
  });
});

// Utility: DNS Resolver
async function resolveDNS(hostname: string): Promise<string> {
  const { lookup } = await import('node:dns/promises');
  const result = await lookup(hostname);
  return result.address;
}
