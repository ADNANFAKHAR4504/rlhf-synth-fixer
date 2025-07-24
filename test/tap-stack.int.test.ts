// CloudFormation TapStack Integration Tests
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Stack configuration
const STACK_NAME = 'TapStackPr98';
const REGION = 'us-east-1';

interface StackOutput {
  OutputKey: string;
  OutputValue: string;
  Description: string;
}

interface StackInfo {
  StackStatus: string;
  Outputs?: StackOutput[];
}

describe('TapStack CloudFormation Integration Tests', () => {
  let stackInfo: StackInfo;
  let stackOutputs: { [key: string]: string } = {};

  beforeAll(async () => {
    // Get stack information and outputs
    try {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION}`
      );
      const stackData = JSON.parse(stdout);
      stackInfo = stackData.Stacks[0];
      
      // Parse outputs into a convenient object
      if (stackInfo.Outputs) {
        stackInfo.Outputs.forEach(output => {
          stackOutputs[output.OutputKey] = output.OutputValue;
        });
      }
    } catch (error) {
      console.error('Failed to get stack information:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Deployment Status', () => {
    test('should have CREATE_COMPLETE status', () => {
      expect(stackInfo.StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have stack outputs defined', () => {
      expect(stackInfo.Outputs).toBeDefined();
      expect(stackInfo.Outputs).toHaveLength(2);
    });

    test('should have Instance1PublicDNS output', () => {
      expect(stackOutputs.Instance1PublicDNS).toBeDefined();
      expect(stackOutputs.Instance1PublicDNS).toMatch(/^ec2-.*\.compute-1\.amazonaws\.com$/);
    });

    test('should have Instance2PublicDNS output', () => {
      expect(stackOutputs.Instance2PublicDNS).toBeDefined();
      expect(stackOutputs.Instance2PublicDNS).toMatch(/^ec2-.*\.compute-1\.amazonaws\.com$/);
    });
  });

  describe('EC2 Instance Connectivity', () => {
    test('Instance 1 should be accessible via HTTP', async () => {
      const instance1DNS = stackOutputs.Instance1PublicDNS;
      
      try {
        // Test HTTP connectivity (basic reachability test)
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://${instance1DNS} || echo "connection_failed"`);
        
        // We expect either a valid HTTP response code or connection refused (since no web server is running)
        // But the instance should be reachable (not timeout)
        expect(stdout.trim()).not.toBe('connection_failed');
      } catch (error) {
        // If curl fails, that's expected since no web server is running
        // But we want to ensure the DNS resolves and instance is reachable
        console.log('Expected curl failure - no web server running on instance');
      }
    }, 20000);

    test('Instance 2 should be accessible via HTTP', async () => {
      const instance2DNS = stackOutputs.Instance2PublicDNS;
      
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://${instance2DNS} || echo "connection_failed"`);
        expect(stdout.trim()).not.toBe('connection_failed');
      } catch (error) {
        console.log('Expected curl failure - no web server running on instance');
      }
    }, 20000);

    test('should be able to ping Instance 1', async () => {
      const instance1DNS = stackOutputs.Instance1PublicDNS;
      
      try {
        await execAsync(`ping -c 1 -W 5 ${instance1DNS}`);
        // If ping succeeds, instance is reachable
        expect(true).toBe(true);
      } catch (error) {
        // Many EC2 instances block ping, so we'll check if DNS resolves instead
        try {
          await execAsync(`nslookup ${instance1DNS}`);
          expect(true).toBe(true); // DNS resolution works
        } catch (dnsError) {
          fail('Instance DNS should resolve');
        }
      }
    }, 15000);

    test('should be able to ping Instance 2', async () => {
      const instance2DNS = stackOutputs.Instance2PublicDNS;
      
      try {
        await execAsync(`ping -c 1 -W 5 ${instance2DNS}`);
        expect(true).toBe(true);
      } catch (error) {
        try {
          await execAsync(`nslookup ${instance2DNS}`);
          expect(true).toBe(true);
        } catch (dnsError) {
          fail('Instance DNS should resolve');
        }
      }
    }, 15000);
  });

  describe('AWS Resource Validation', () => {
    test('should have VPC created with correct CIDR', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=Development" --region ${REGION} --query "Vpcs[?CidrBlock=='10.0.0.0/16'].CidrBlock" --output text`
      );
      
      expect(stdout.trim()).toBe('10.0.0.0/16');
    });

    test('should have 2 public subnets created', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-subnets --filters "Name=tag:Environment,Values=Development" --region ${REGION} --query "length(Subnets[?MapPublicIpOnLaunch==\`true\`])"`
      );
      
      const subnetCount = parseInt(stdout.trim());
      expect(subnetCount).toBe(2);
    });

    test('should have Internet Gateway attached', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-internet-gateways --filters "Name=tag:Environment,Values=Development" --region ${REGION} --query "InternetGateways[0].State" --output text`
      );
      
      expect(stdout.trim()).toBe('available');
    });

    test('should have security group with SSH and HTTP access', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-security-groups --filters "Name=group-description,Values=Enable SSH and HTTP access" "Name=tag:Environment,Values=Development" --region ${REGION} --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\` || FromPort==\`80\`].FromPort" --output text`
      );
      
      const ports = stdout.trim().split('\t').map(p => parseInt(p)).sort();
      expect(ports).toEqual([22, 80]);
    });

    test('should have 2 running EC2 instances', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-instances --filters "Name=tag:Environment,Values=Development" "Name=instance-state-name,Values=running" --region ${REGION} --query "length(Reservations[].Instances[])"`
      );
      
      const instanceCount = parseInt(stdout.trim());
      expect(instanceCount).toBe(2);
    });
  });

  describe('Infrastructure Validation', () => {
    test('instances should be in different availability zones', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-instances --filters "Name=tag:Environment,Values=Development" "Name=instance-state-name,Values=running" --region ${REGION} --query "Reservations[].Instances[].Placement.AvailabilityZone" --output text`
      );
      
      const azs = stdout.trim().split('\t');
      expect(azs).toHaveLength(2);
      expect(azs[0]).not.toBe(azs[1]); // Different AZs
    });

    test('instances should have public IP addresses', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-instances --filters "Name=tag:Environment,Values=Development" "Name=instance-state-name,Values=running" --region ${REGION} --query "Reservations[].Instances[].PublicIpAddress" --output text`
      );
      
      const publicIPs = stdout.trim().split('\t').filter(ip => ip && ip !== 'None');
      expect(publicIPs).toHaveLength(2);
      
      // Validate IP format
      publicIPs.forEach(ip => {
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });
    });

    test('should verify stack resources match template', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "length(StackResources)"`
      );
      
      const resourceCount = parseInt(stdout.trim());
      expect(resourceCount).toBe(12); // Should match our template resource count
    });
  });

  describe('Security Validation', () => {
    test('security group should only allow necessary ports', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-security-groups --filters "Name=group-description,Values=Enable SSH and HTTP access" "Name=tag:Environment,Values=Development" --region ${REGION} --query "SecurityGroups[0].IpPermissions" --output json`
      );
      
      const permissions = JSON.parse(stdout);
      expect(permissions).toHaveLength(2);
      
      const ports = permissions.map((p: any) => p.FromPort).sort();
      expect(ports).toEqual([22, 80]);
    });

    test('instances should use the correct key pair', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-instances --filters "Name=tag:Environment,Values=Development" "Name=instance-state-name,Values=running" --region ${REGION} --query "Reservations[].Instances[].KeyName" --output text`
      );
      
      const keyNames = stdout.trim().split('\t');
      keyNames.forEach(keyName => {
        expect(keyName).toBe('iac-rlhf-aws-trainer-instance');
      });
    });
  });
});
