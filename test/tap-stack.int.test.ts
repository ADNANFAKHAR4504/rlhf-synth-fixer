import fs from 'fs';
import net from 'net';
import axios from 'axios';
import { lookup } from 'dns/promises';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Use non-suffixed keys based on your CloudFormation output structure
const lbDns = outputs.LoadBalancerDNS;
const rdsEndpoint = outputs.RDSEndpoint;
const cloudWatchAlarmName = outputs.CloudWatchAlarmName;
const elasticIP1 = outputs.ElasticIP1;
const elasticIP2 = outputs.ElasticIP2;

function checkTcpPort(host: string, port: number, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
    });
    socket.once('timeout', () => socket.destroy());
    socket.once('error', () => socket.destroy());
    socket.once('close', () => resolve(isConnected));

    socket.connect(port, host);
  });
}

async function resolveDNS(hostname: string): Promise<string> {
  const result = await lookup(hostname);
  return result.address;
}

describe('WebAppStack Integration Tests', () => {
  describe('Load Balancer / Web Application', () => {
    test('should have Load Balancer DNS defined', () => {
      expect(lbDns).toBeDefined();
    });

    test('should respond with HTTP 200 on / (root) path', async () => {
      expect(lbDns).toBeDefined();
      const url = `http://${lbDns}/`;

      try {
        const response = await axios.get(url, { timeout: 5000 });
        expect(response.status).toBe(200);
        expect(typeof response.data).toBe('string');
      } catch (err: any) {
        console.error(`❌ HTTP request to ${url} failed:`, err.message);
        throw err;
      }
    });

    test('should respond with TCP port 80 open on Load Balancer DNS', async () => {
      expect(lbDns).toBeDefined();
      const isOpen = await checkTcpPort(lbDns, 80, 5000);
      expect(isOpen).toBe(true);
    });

    test('should resolve Load Balancer DNS to a valid IP address', async () => {
      expect(lbDns).toBeDefined();
      const ip = await resolveDNS(lbDns);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });

    test('Elastic IP1 should be a valid IP address', () => {
      expect(elasticIP1).toBeDefined();
      expect(elasticIP1).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });

    test('Elastic IP2 should be a valid IP address', () => {
      expect(elasticIP2).toBeDefined();
      expect(elasticIP2).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
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

      const alarms = result.MetricAlarms ?? [];
      expect(alarms.length).toBeGreaterThan(0);

      const alarm = alarms[0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK'); // Could also be 'ALARM' depending on expected test state
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
