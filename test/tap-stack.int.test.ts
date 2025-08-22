import fs from 'fs';
import net from 'net';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('WebAppStack Integration Tests', () => {
  const lbDns = outputs[`LoadBalancerDNS${environmentSuffix}`];
  const rdsEndpoint = outputs[`RDSEndpoint${environmentSuffix}`];
  const cloudWatchAlarmName = outputs[`CloudWatchAlarmName${environmentSuffix}`];
  const elasticIP1 = outputs[`ElasticIP1${environmentSuffix}`];
  const elasticIP2 = outputs[`ElasticIP2${environmentSuffix}`];

  function checkTcpPort(host: string, port: number, timeout = 3000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isConnected = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        isConnected = true;
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', () => {
        // ignore errors
      });

      socket.on('close', () => {
        resolve(isConnected);
      });

      socket.connect(port, host);
    });
  }

  async function resolveDNS(hostname: string): Promise<string> {
    const { lookup } = await import('node:dns/promises');
    const result = await lookup(hostname);
    return result.address;
  }

  describe('Load Balancer / Web Application', () => {
    test('should have Load Balancer DNS defined', () => {
      expect(lbDns).toBeDefined();
    });

    test('should respond with TCP port 80 open on Load Balancer DNS', async () => {
      if (!lbDns) {
        console.warn('⚠️ LoadBalancerDNS output missing. Skipping TCP port test.');
        return;
      }
      const isOpen = await checkTcpPort(lbDns, 80, 5000);
      expect(isOpen).toBe(true);
    });

    test('should resolve Load Balancer DNS to a valid IP address', async () => {
      if (!lbDns) {
        console.warn('⚠️ LoadBalancerDNS output missing. Skipping DNS resolution test.');
        return;
      }
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
      if (!cloudWatchAlarmName) {
        console.warn('⚠️ CloudWatchAlarmName output missing. Skipping alarm test.');
        return;
      }

      const cloudwatch = await import('@aws-sdk/client-cloudwatch');
      const { CloudWatchClient, DescribeAlarmsCommand } = cloudwatch;

      const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

      const result = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [cloudWatchAlarmName],
        })
      );

      // TypeScript safe check
      if (!result.MetricAlarms || result.MetricAlarms.length === 0) {
        throw new Error('No MetricAlarms found');
      }

      const alarm = result.MetricAlarms[0];
      expect(alarm.AlarmName).toBe(cloudWatchAlarmName);
      expect(alarm.StateValue).toBe('OK');
    });
  });

  describe('RDS Endpoint Check', () => {
    test('should resolve DNS for RDS endpoint', async () => {
      if (!rdsEndpoint) {
        console.warn('⚠️ RDSEndpoint output missing. Skipping RDS DNS test.');
        return;
      }
      const ip = await resolveDNS(rdsEndpoint);
      expect(ip).toMatch(/(\d{1,3}\.){3}\d{1,3}/);
    });
  });
});
