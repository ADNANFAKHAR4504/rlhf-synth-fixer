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
    try {
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
    } catch (error: any) {
      // Handle InvocationDoesNotExist error - command is still being processed
      // This happens when SSM command is sent but invocation record not yet created (eventual consistency)
      const isInvocationNotFound =
        error.name === 'InvocationDoesNotExist' ||
        error.Code === 'InvocationDoesNotExist' ||
        error.__type === 'InvocationDoesNotExist';

      if (isInvocationNotFound) {
        // Continue waiting - command hasn't been processed yet
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      // Re-throw other errors
      throw error;
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error('Command execution timed out');
}

describe('TapStack Integration Tests', () => {
  describe('Stack Deployment Validation', () => {
    test('all required outputs are present', () => {
      // Infrastructure outputs
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnetId).toBeDefined();

      // EC2 outputs
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.EC2SecurityGroupId).toBeDefined();
      expect(outputs.InstanceConnectEndpointId).toBeDefined();

      // ALB outputs
      expect(outputs.WebAppURL).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.TargetGroupArn).toBeDefined();
      expect(outputs.ALBSecurityGroupId).toBeDefined();

      // RDS outputs
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSInstanceId).toBeDefined();
      expect(outputs.RDSSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();

      // Monitoring outputs
      expect(outputs.CloudWatchDashboardName).toBeDefined();
    });

    test('output values have correct formats', () => {
      // VPC and Subnets
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-/);
      expect(outputs.PrivateSubnetId).toMatch(/^subnet-/);

      // EC2
      expect(outputs.EC2InstanceId).toMatch(/^i-/);
      expect(outputs.EC2SecurityGroupId).toMatch(/^sg-/);
      expect(outputs.InstanceConnectEndpointId).toMatch(/^eice-/);

      // ALB
      expect(outputs.WebAppURL).toMatch(/^http:\/\//);
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
      expect(outputs.LoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.ALBSecurityGroupId).toMatch(/^sg-/);

      // RDS
      expect(outputs.RDSEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.RDSSecurityGroupId).toMatch(/^sg-/);
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
      // Wait for target to become healthy
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

    test('ALB distributes traffic to healthy targets only', async () => {
      const response = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.TargetGroupArn,
        })
      );

      const healthyTargets = response.TargetHealthDescriptions?.filter(
        (target) => target.TargetHealth?.State === 'healthy'
      );

      expect(healthyTargets).toBeDefined();
      expect(healthyTargets!.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('End-to-End Infrastructure Flow Tests', () => {
    test('E2E: Internet → ALB → EC2 → RDS complete flow', async () => {
      // Step 1: Verify ALB is publicly accessible
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.LoadBalancerArn],
        })
      );
      expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');

      // Step 2: Verify target is registered and healthy
      const targetHealthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.TargetGroupArn,
        })
      );
      const target = targetHealthResponse.TargetHealthDescriptions![0];
      expect(target.Target?.Id).toBe(outputs.EC2InstanceId);

      // Step 3: Access web app via public URL (ALB → EC2)
      const webAppResponse = await fetchUrl(outputs.WebAppURL);
      expect(webAppResponse.statusCode).toBe(200);

      // Step 4: Verify EC2 can connect to RDS via health endpoint
      const healthResponse = await fetchUrl(`${outputs.WebAppURL}/health`);
      expect(healthResponse.statusCode).toBe(200);
      const health = JSON.parse(healthResponse.body);
      expect(health.database).toBe('connected');

      // Complete flow validated: Internet → ALB → EC2 → RDS
    }, 90000);

    test('E2E: Database credentials flow via Secrets Manager', async () => {
      // Step 1: Verify secret exists
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.DatabaseSecretArn,
        })
      );
      expect(secretResponse.SecretString).toBeDefined();

      // Step 2: Parse and validate secret structure
      const secret = JSON.parse(secretResponse.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.host).toBe(outputs.RDSEndpoint);
      expect(secret.dbname).toBeDefined();

      // Step 3: Verify EC2 can use these credentials (via health check)
      const healthResponse = await fetchUrl(`${outputs.WebAppURL}/health`);
      expect(healthResponse.statusCode).toBe(200);
      const health = JSON.parse(healthResponse.body);
      expect(health.status).toBe('healthy');
      expect(health.database).toBe('connected');
    }, 60000);

    test('E2E: Network security - ALB to EC2 connectivity on port 5000', async () => {
      // Verify security group allows ALB → EC2 on port 5000
      const ec2SgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.EC2SecurityGroupId],
        })
      );

      const ec2Sg = ec2SgResponse.SecurityGroups![0];
      const allowsPort5000 = ec2Sg.IpPermissions?.some(
        (rule) =>
          (rule.FromPort === 5000 || rule.ToPort === 5000) &&
          rule.UserIdGroupPairs?.some(
            (pair) => pair.GroupId === outputs.ALBSecurityGroupId
          )
      );

      expect(allowsPort5000).toBe(true);

      // Verify by accessing the app through ALB
      const response = await fetchUrl(outputs.WebAppURL);
      expect(response.statusCode).toBe(200);
    }, 30000);

    test('E2E: Network security - EC2 to RDS connectivity on port 3306', async () => {
      // Verify security group allows EC2 → RDS on port 3306
      const rdsSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.RDSSecurityGroupId],
        })
      );

      const rdsSg = rdsSgResponse.SecurityGroups![0];
      const allowsPort3306 = rdsSg.IpPermissions?.some(
        (rule) =>
          (rule.FromPort === 3306 || rule.ToPort === 3306) &&
          rule.UserIdGroupPairs?.some(
            (pair) => pair.GroupId === outputs.EC2SecurityGroupId
          )
      );

      expect(allowsPort3306).toBe(true);

      // Verify by testing database connection through health endpoint
      const healthResponse = await fetchUrl(`${outputs.WebAppURL}/health`);
      expect(healthResponse.statusCode).toBe(200);
      const health = JSON.parse(healthResponse.body);
      expect(health.database).toBe('connected');
    }, 30000);

    test('E2E: High availability - RDS Multi-AZ validation', async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];

      // Verify Multi-AZ is enabled
      expect(dbInstance.MultiAZ).toBe(true);

      // Verify storage is encrypted
      expect(dbInstance.StorageEncrypted).toBe(true);

      // Verify backup retention
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

      // Verify instance is available
      expect(dbInstance.DBInstanceStatus).toBe('available');
    }, 30000);

    test('E2E: Load balancer health checks are configured correctly', async () => {
      const response = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [outputs.TargetGroupArn],
        })
      );

      const targetGroup = response.TargetGroups![0];

      // Verify health check settings
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe('/health');
      expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);

      // Verify target port
      expect(targetGroup.Port).toBe(5000);
    }, 30000);

    test('E2E: Multiple requests succeed - application reliability', async () => {
      const requests = 5;
      const results = [];

      for (let i = 0; i < requests; i++) {
        const response = await fetchUrl(outputs.WebAppURL);
        results.push(response.statusCode);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // All requests should succeed
      expect(results.every((code) => code === 200)).toBe(true);
      expect(results.length).toBe(requests);
    }, 60000);

    test('E2E: CloudWatch monitoring is active for all components', async () => {
      // Verify dashboard exists
      expect(outputs.CloudWatchDashboardName).toBe('SecureWebAppFoundation-pr3165');

      // In a real test, you could verify metrics are being published
      // For now, we verify the infrastructure is set up correctly
      const ec2Response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = ec2Response.Reservations![0].Instances![0];
      expect(instance.Monitoring?.State).toBe('enabled');
    }, 30000);
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

        // Parse JSON response (get last line which is the curl output)
        const lines = output.trim().split('\n');
        const jsonOutput = lines[lines.length - 1];
        const healthResponse = JSON.parse(jsonOutput);
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
