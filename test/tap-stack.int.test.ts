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
  const elasticIp = outputs[`ElasticIPAddress${environmentSuffix}`];

  describe('Load Balancer / Web Application', () => {
    test('should respond with HTTP 200 on / (root) path', async () => {
      expect(lbDns).toBeDefined();

      const url = `http://${lbDns}/`;
      const response = await axios.get(url, { timeout: 5000 });

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });

    test('should return a consistent static EIP from DNS', async () => {
      expect(lbDns).toMatch(/\.elb\.amazonaws\.com$/);

      const ipAddress = await resolveDNS(lbDns);
      expect(ipAddress).toMatch(/(\d{1,3}\.){3}\d{1,3}/);

      expect(elasticIp).toBeDefined();
      expect(ipAddress).toBe(elasticIp);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('alarm should exist and be in OK state', async () => {
      const cloudwatch = await import('@aws-sdk/client-cloudwatch');
      const { CloudWatchClient, DescribeAlarmsCommand } = cloudwatch;

      const cwClient = new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const result = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [cloudWatchAlarmName],
        })
      );

      expect(result).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK'); // Could also test for "ALARM" if appropriate
    });
  });

  describe('RDS Endpoint Check', () => {
    test('should resolve DNS for RDS endpoint', async () => {
      expect(rdsEndpoint).toBeDefined();

      const ip = await resolveDNS(rdsEndpoint);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/); // Basic IPv4 format
    });
  });
});

// Utility: DNS Resolver
async function resolveDNS(hostname: string): Promise<string> {
  const { lookup } = await import('node:dns/promises');
  const result = await lookup(hostname);
  return result.address;
}
