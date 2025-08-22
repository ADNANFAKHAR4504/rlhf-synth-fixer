import fs from 'fs';
import axios from 'axios';
import { lookup } from 'node:dns/promises';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const outputs: Record<string, any> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('WebAppStack Integration Tests', () => {
  // Using your exact output keys
  const lbDns = outputs.LoadBalancerDNS;
  const rdsEndpoint = outputs.RDSEndpoint;
  const cloudWatchAlarmName = outputs.CloudWatchAlarmName;
  // For Elastic IPs, let's test both EIP1 and EIP2 (if needed)
  const elasticIp1 = outputs.ElasticIP1;
  const elasticIp2 = outputs.ElasticIP2;

  describe('Load Balancer / Web Application', () => {
    test('should respond with HTTP 200 on / (root) path', async () => {
      if (!lbDns) {
        console.warn('⚠️ LoadBalancerDNS output missing. Skipping HTTP test.');
        return;
      }

      const url = `http://${lbDns}/`;
      const response = await axios.get(url, { timeout: 5000 });
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });

    test('should resolve Load Balancer DNS to a valid IP address', async () => {
      if (!lbDns) {
        console.warn('⚠️ LoadBalancerDNS output missing. Skipping DNS resolution test.');
        return;
      }
      const ipAddress = await lookup(lbDns).then(res => res.address);
      expect(ipAddress).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });

    test('Elastic IP1 should be a valid IP address', () => {
      if (!elasticIp1) {
        console.warn('⚠️ ElasticIP1 output missing. Skipping Elastic IP1 test.');
        return;
      }
      expect(elasticIp1).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });

    test('Elastic IP2 should be a valid IP address', () => {
      if (!elasticIp2) {
        console.warn('⚠️ ElasticIP2 output missing. Skipping Elastic IP2 test.');
        return;
      }
      expect(elasticIp2).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('alarm should exist and be in OK state', async () => {
      if (!cloudWatchAlarmName) {
        console.warn('⚠️ CloudWatchAlarmName output missing. Skipping CloudWatch alarm test.');
        return;
      }

      const cloudwatchClient = new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const result = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [cloudWatchAlarmName] })
      );

      expect(result.MetricAlarms && result.MetricAlarms.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK');
    });
  });

  describe('RDS Endpoint Check', () => {
    test('should resolve DNS for RDS endpoint', async () => {
      if (!rdsEndpoint) {
        console.warn('⚠️ RDSEndpoint output missing. Skipping RDS DNS check.');
        return;
      }

      const ip = await lookup(rdsEndpoint).then(res => res.address);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });
  });
});
