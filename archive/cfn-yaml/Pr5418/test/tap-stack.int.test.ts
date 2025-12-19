import { spawn } from 'child_process';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-2';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));
const environmentSuffix = 'pr5418'; // Extracted from deployed stack

// Helper function to run AWS CLI commands
async function runAwsCommand(command: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('aws', [...command, '--region', region, '--output', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    // Set a timeout for the AWS CLI command
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`AWS CLI command timed out: aws ${command.join(' ')}`));
    }, 20000); // 20 second timeout

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(`AWS CLI command failed: ${stderr}`));
      }
    });
  });
}

describe('Migration Infrastructure - AWS Resource Integration Tests', () => {

  describe('VPC and Network Infrastructure', () => {
    test('should have a functional VPC with correct configuration', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpcs', '--vpc-ids', outputs.VPCId]);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');

      console.log(`✅ VPC ${outputs.VPCId} is active with CIDR 10.0.0.0/16`);
    }, 25000);

    test('should have public and private subnets in different AZs', async () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      const response = await runAwsCommand(['ec2', 'describe-subnets', '--subnet-ids',
        outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]);

      expect(response.Subnets).toHaveLength(4);
      const azs = response.Subnets.map((subnet: any) => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // All subnets in 2 AZs

      console.log(`✅ Subnets deployed across AZs: ${Array.from(new Set(azs)).join(', ')}`);
    }, 25000);
  });

  describe('VPN Infrastructure', () => {
    test('should have a configured VPN gateway', async () => {
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.VPNGatewayId).toMatch(/^vgw-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpn-gateways', '--vpn-gateway-ids', outputs.VPNGatewayId]);
      expect(response.VpnGateways).toHaveLength(1);
      expect(response.VpnGateways[0].State).toBe('available');

      console.log(`✅ VPN Gateway ${outputs.VPNGatewayId} is operational`);
    }, 25000);

    test('should have a configured customer gateway', async () => {
      expect(outputs.CustomerGatewayId).toBeDefined();
      expect(outputs.CustomerGatewayId).toMatch(/^cgw-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-customer-gateways', '--customer-gateway-ids', outputs.CustomerGatewayId]);
      expect(response.CustomerGateways).toHaveLength(1);
      expect(response.CustomerGateways[0].State).toBe('available');

      console.log(`✅ Customer Gateway ${outputs.CustomerGatewayId} is available`);
    }, 25000);

    test('should have a VPN connection linking gateways', async () => {
      expect(outputs.VPNConnectionId).toBeDefined();
      expect(outputs.VPNConnectionId).toMatch(/^vpn-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpn-connections', '--vpn-connection-ids', outputs.VPNConnectionId]);
      expect(response.VpnConnections).toHaveLength(1);
      expect(response.VpnConnections[0].State).toBe('available');
      expect(response.VpnConnections[0].VpnGatewayId).toBe(outputs.VPNGatewayId);
      expect(response.VpnConnections[0].CustomerGatewayId).toBe(outputs.CustomerGatewayId);

      console.log(`✅ VPN Connection ${outputs.VPNConnectionId} is active`);
    }, 25000);
  });

  describe('Aurora Database Infrastructure', () => {
    test('should have an operational Aurora cluster', async () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();

      // Extract cluster identifier from the endpoint
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split('.')[0];
      expect(clusterIdentifier).toContain('migration-aurora-cluster');

      const response = await runAwsCommand(['rds', 'describe-db-clusters', '--db-cluster-identifier', clusterIdentifier]);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters[0].Status).toBe('available');
      expect(response.DBClusters[0].Endpoint).toBe(outputs.AuroraClusterEndpoint);
      expect(response.DBClusters[0].Engine).toBe('aurora-mysql');

      console.log(`✅ Aurora cluster ${clusterIdentifier} is active`);
    }, 25000);

    test('should have accessible Aurora secrets', async () => {
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.AuroraDBSecretArn).toMatch(/^arn:aws:secretsmanager:/);

      const response = await runAwsCommand(['secretsmanager', 'describe-secret', '--secret-id', outputs.AuroraDBSecretArn]);
      expect(response.ARN).toBe(outputs.AuroraDBSecretArn);
      expect(response.Name).toContain(environmentSuffix);

      console.log(`✅ Aurora secrets ${outputs.AuroraDBSecretArn} are configured`);
    }, 25000);
  });

  describe('Data Migration Service (DMS) Infrastructure', () => {
    test('should have operational DMS replication instances', async () => {
      const response = await runAwsCommand(['dms', 'describe-replication-instances']);
      const dmsInstances = response.ReplicationInstances?.filter(
        (instance: any) => instance.ReplicationInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dmsInstances).toBeDefined();
      expect(dmsInstances.length).toBeGreaterThan(0);

      dmsInstances.forEach((instance: any) => {
        expect(instance.ReplicationInstanceStatus).toBe('available');
        console.log(`✅ DMS instance ${instance.ReplicationInstanceIdentifier} is available`);
      });
    }, 20000);

    test('should have configured DMS replication tasks', async () => {
      const response = await runAwsCommand(['dms', 'describe-replication-tasks']);
      const dmsTasks = response.ReplicationTasks?.filter(
        (task: any) => task.ReplicationTaskIdentifier?.includes(environmentSuffix)
      );

      expect(dmsTasks).toBeDefined();
      expect(dmsTasks.length).toBeGreaterThan(0);

      dmsTasks.forEach((task: any) => {
        expect(['ready', 'running', 'stopped'].includes(task.Status)).toBeTruthy();
        console.log(`✅ DMS task ${task.ReplicationTaskIdentifier} is ${task.Status}`);
      });
    }, 20000);
  });

  describe('Application Load Balancer Infrastructure', () => {
    test('should have an operational Application Load Balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      const response = await runAwsCommand(['elbv2', 'describe-load-balancers', '--load-balancer-arns', outputs.ApplicationLoadBalancerArn]);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Type).toBe('application');

      console.log(`✅ ALB ${outputs.ApplicationLoadBalancerArn} is active`);
    }, 25000);

    test('should have configured target groups for load balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();

      const response = await runAwsCommand(['elbv2', 'describe-target-groups', '--load-balancer-arn', outputs.ApplicationLoadBalancerArn]);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups.length).toBeGreaterThan(0);

      response.TargetGroups.forEach((tg: any) => {
        expect(tg.TargetType).toBeDefined();
        console.log(`✅ Target group ${tg.TargetGroupName} configured for ${tg.TargetType} targets`);
      });
    }, 25000);
  });

  describe('Migration Infrastructure Validation', () => {
    test('should have all critical migration components', () => {
      const criticalOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'VPNGatewayId', 'CustomerGatewayId', 'VPNConnectionId',
        'AuroraClusterEndpoint', 'AuroraClusterReadEndpoint',
        'DMSReplicationInstanceArn', 'DMSReplicationTaskArn',
        'ApplicationLoadBalancerDNS', 'ALBTargetGroupArn',
        'AuroraDBSecretArn', 'OnPremisesDBSecretArn'
      ];

      criticalOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });

      console.log(`✅ All ${criticalOutputs.length} critical infrastructure components validated`);
    });

    test('should have correct resource naming format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.VPNGatewayId).toMatch(/^vgw-[a-f0-9]+$/);
      expect(outputs.CustomerGatewayId).toMatch(/^cgw-[a-f0-9]+$/);
      expect(outputs.VPNConnectionId).toMatch(/^vpn-[a-f0-9]+$/);
      expect(outputs.ApplicationLoadBalancerDNS).toMatch(/.*\.elb\.amazonaws\.com$/);

      console.log(`✅ All resource naming follows AWS conventions`);
    });
  });
});
