import fs from 'fs';
import axios from 'axios';
import { lookup } from 'node:dns/promises';

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('WebAppStack Integration Tests', () => {
  const lbDns = outputs.LoadBalancerDNS;
  const rdsEndpoint = outputs.RDSEndpoint;
  const cloudWatchAlarmName = outputs.CloudWatchAlarmName;
  const elasticIp = outputs.ElasticIPAddress;

  describe('Load Balancer / Web Application', () => {
    test('should respond with HTTP 200 on / (root) path', async () => {
      expect(lbDns).toBeDefined();

      const url = `http://${lbDns}/`;
      const response = await axios.get(url, { timeout: 5000 });

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });

    test('should return a consistent static EIP from DNS', async () => {
      expect(lbDns).toBeDefined();
      expect(lbDns).toMatch(/\.elb\.amazonaws\.com$/);

      const ipAddress = await resolveDNS(lbDns);
      expect(ipAddress).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
      expect(ipAddress).toBe(elasticIp);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('alarm should exist and be in OK state', async () => {
      expect(cloudWatchAlarmName).toBeDefined();

      const cwClient = new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const result = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [cloudWatchAlarmName],
        })
      );

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms[0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK');
    });
  });

  describe('RDS Endpoint Check', () => {
    test('should resolve DNS for RDS endpoint', async () => {
      expect(rdsEndpoint).toBeDefined();

      const ip = await resolveDNS(rdsEndpoint);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });
  });
});

// Utility function
async function resolveDNS(hostname: string): Promise<string> {
  const result = await lookup(hostname);
  return result.address;
}
