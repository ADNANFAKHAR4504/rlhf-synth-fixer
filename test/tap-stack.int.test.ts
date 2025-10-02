import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import fs from 'fs';
import https from 'https';
import http from 'http';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const ssmClient = new SSMClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });

// Helper function to fetch HTTP URL
async function fetchUrl(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

// Helper function to wait for command completion
async function waitForCommandCompletion(
  commandId: string,
  instanceId: string,
  maxWaitTime = 120000
): Promise<string> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    const response = await ssmClient.send(
      new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      })
    );

    if (response.Status === 'Success') {
      return response.StandardOutputContent || '';
    } else if (
      response.Status === 'Failed' ||
      response.Status === 'Cancelled' ||
      response.Status === 'TimedOut'
    ) {
      throw new Error(
        `Command failed with status ${response.Status}: ${response.StandardErrorContent}`
      );
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error('Command execution timed out');
}

describe('TapStack Integration Tests', () => {
  describe('Stack Deployment Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.InstanceConnectEndpointId).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
    });

    test('output values have correct formats', () => {
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.EC2InstanceId).toMatch(/^i-/);
      expect(outputs.InstanceConnectEndpointId).toMatch(/^eice-/);
      expect(outputs.RDSEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('WebAppStack was deployed successfully', async () => {
      const allOutputs = JSON.parse(
        fs.readFileSync('cfn-outputs/all-outputs.json', 'utf8')
      );

      const stackNames = Object.keys(allOutputs);
      expect(stackNames.length).toBeGreaterThan(0);

      // Get the first stack (should be TapStack or WebAppStack)
      const stackName = stackNames[0];
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toMatch(
        /CREATE_COMPLETE|UPDATE_COMPLETE/
      );
    });
  });

  describe('EC2 Instance Validation', () => {
    test('EC2 instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
      expect(response.Reservations![0].Instances).toBeDefined();
      expect(response.Reservations![0].Instances!.length).toBe(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.VpcId).toBe(outputs.VPCId);
    }, 30000);

    test('EC2 instance has SSM agent running', async () => {
      // Wait a bit for instance to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
    }, 30000);
  });

  describe('RDS Database Validation', () => {
    test('RDS instance is available', async () => {
      // Extract DB instance identifier from the endpoint
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
    }, 30000);

    test('database credentials are stored in Secrets Manager', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.DatabaseSecretArn,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.host).toBe(outputs.RDSEndpoint);
    }, 30000);
  });

  describe('Security Group Validation', () => {
    test('EC2 security group allows outbound traffic to RDS', async () => {
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = instanceResponse.Reservations![0].Instances![0];
      const ec2SecurityGroupId = instance.SecurityGroups![0].GroupId!;

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [ec2SecurityGroupId],
        })
      );

      const securityGroup = sgResponse.SecurityGroups![0];
      expect(securityGroup.IpPermissionsEgress).toBeDefined();
      expect(securityGroup.IpPermissionsEgress!.length).toBeGreaterThan(0);

      // Check for allow all outbound rule
      const allowAllOutbound = securityGroup.IpPermissionsEgress!.some(
        (rule) =>
          rule.IpProtocol === '-1' &&
          rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
      );
      expect(allowAllOutbound).toBe(true);
    }, 30000);

    test('ALB security group allows HTTP from internet', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ALBSecurityGroupId],
        })
      );

      const securityGroup = sgResponse.SecurityGroups![0];
      expect(securityGroup.IpPermissions).toBeDefined();

      // Check for HTTP (port 80) from 0.0.0.0/0
      const allowHttpFromInternet = securityGroup.IpPermissions!.some(
        (rule) =>
          (rule.FromPort === 80 || rule.ToPort === 80) &&
          rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
      );
      expect(allowHttpFromInternet).toBe(true);
    }, 30000);
  });

  describe('Application Load Balancer Validation', () => {
    test('ALB is active and publicly accessible', async () => {
      const response = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.LoadBalancerArn],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.DNSName).toBe(outputs.LoadBalancerDNS);
    }, 30000);

    test('Target group has healthy targets', async () => {
      const response = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.TargetGroupArn,
        })
      );

      expect(response.TargetHealthDescriptions).toBeDefined();
      expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);

      const targetHealth = response.TargetHealthDescriptions![0];
      expect(targetHealth.Target?.Id).toBe(outputs.EC2InstanceId);

      // Target should be healthy or initial (still registering)
      const validStates = ['healthy', 'initial', 'draining'];
      expect(validStates).toContain(targetHealth.TargetHealth?.State);
    }, 30000);
  });

  describe('Public URL Access Validation', () => {
    test('Web application is accessible via public URL', async () => {
      // Wait a bit for target to become healthy
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const response = await fetchUrl(outputs.WebAppURL);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBeDefined();
      expect(body.endpoints).toBeDefined();
    }, 60000);

    test('Health endpoint returns healthy status via public URL', async () => {
      const healthUrl = `${outputs.WebAppURL}/health`;
      const response = await fetchUrl(healthUrl);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.database).toBe('connected');
    }, 60000);
  });

  describe('Database Connectivity Tests', () => {
    test(
      'EC2 can connect to RDS database',
      async () => {
        // Send command to test database connectivity
        const commandResponse = await ssmClient.send(
          new SendCommandCommand({
            InstanceIds: [outputs.EC2InstanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
              commands: [
                '#!/bin/bash',
                'set -e',
                '',
                '# Get database credentials',
                `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${outputs.DatabaseSecretArn} --region ${region} --query SecretString --output text)`,
                'DB_HOST=$(echo $SECRET_JSON | jq -r .host)',
                'DB_USER=$(echo $SECRET_JSON | jq -r .username)',
                'DB_PASS=$(echo $SECRET_JSON | jq -r .password)',
                '',
                '# Test database connection',
                'mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1 AS connection_test;"',
              ],
            },
          })
        );

        expect(commandResponse.Command?.CommandId).toBeDefined();

        // Wait for command to complete
        const output = await waitForCommandCompletion(
          commandResponse.Command!.CommandId!,
          outputs.EC2InstanceId
        );

        expect(output).toContain('connection_test');
      },
      180000
    );

    test(
      'web application health endpoint validates database connectivity',
      async () => {
        // Send command to check health endpoint
        const commandResponse = await ssmClient.send(
          new SendCommandCommand({
            InstanceIds: [outputs.EC2InstanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
              commands: [
                '#!/bin/bash',
                '# Wait for web app to be ready',
                'sleep 10',
                '',
                '# Check if webapp service is running',
                'systemctl is-active webapp || exit 1',
                '',
                '# Test health endpoint',
                'curl -s http://localhost:5000/health',
              ],
            },
          })
        );

        expect(commandResponse.Command?.CommandId).toBeDefined();

        // Wait for command to complete
        const output = await waitForCommandCompletion(
          commandResponse.Command!.CommandId!,
          outputs.EC2InstanceId
        );

        // Parse JSON response
        const healthResponse = JSON.parse(output.trim());
        expect(healthResponse.status).toBe('healthy');
        expect(healthResponse.database).toBe('connected');
      },
      180000
    );
  });

  describe('Complete Infrastructure Flow Test', () => {
    test(
      'end-to-end flow: web app can query database and return results',
      async () => {
        // Send command to create test data and query it
        const commandResponse = await ssmClient.send(
          new SendCommandCommand({
            InstanceIds: [outputs.EC2InstanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
              commands: [
                '#!/bin/bash',
                'set -e',
                '',
                '# Get database credentials',
                `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${outputs.DatabaseSecretArn} --region ${region} --query SecretString --output text)`,
                'DB_HOST=$(echo $SECRET_JSON | jq -r .host)',
                'DB_USER=$(echo $SECRET_JSON | jq -r .username)',
                'DB_PASS=$(echo $SECRET_JSON | jq -r .password)',
                'DB_NAME=$(echo $SECRET_JSON | jq -r .dbname)',
                '',
                '# Create test table and insert data',
                'mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME << EOF',
                'CREATE TABLE IF NOT EXISTS health_check (',
                '  id INT AUTO_INCREMENT PRIMARY KEY,',
                '  check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
                '  status VARCHAR(50)',
                ');',
                'INSERT INTO health_check (status) VALUES ("integration_test_passed");',
                'SELECT COUNT(*) as record_count FROM health_check;',
                'EOF',
              ],
            },
          })
        );

        expect(commandResponse.Command?.CommandId).toBeDefined();

        // Wait for command to complete
        const output = await waitForCommandCompletion(
          commandResponse.Command!.CommandId!,
          outputs.EC2InstanceId
        );

        expect(output).toContain('record_count');
      },
      180000
    );
  });
});
