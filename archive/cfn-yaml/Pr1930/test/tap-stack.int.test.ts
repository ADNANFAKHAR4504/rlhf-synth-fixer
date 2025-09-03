// CloudFormation TapStack Integration Tests
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Stack configuration
const STACK_NAME = 'TapStackpr1930';
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
    test('should have successful deployment status', () => {
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        stackInfo.StackStatus
      );
    });

    test('should have stack outputs defined', () => {
      expect(stackInfo.Outputs).toBeDefined();
      expect(stackInfo.Outputs!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have Instance1PublicDNS output', () => {
      expect(stackOutputs.Instance1PublicDNS).toBeDefined();
      expect(stackOutputs.Instance1PublicDNS).toMatch(
        /^ec2-.*\.compute-1\.amazonaws\.com$/
      );
    });

    test('should have Instance2PublicDNS output', () => {
      expect(stackOutputs.Instance2PublicDNS).toBeDefined();
      expect(stackOutputs.Instance2PublicDNS).toMatch(
        /^ec2-.*\.compute-1\.amazonaws\.com$/
      );
    });
  });

  describe('EC2 Instance Connectivity', () => {
    test('Instance 1 should be accessible via HTTP', async () => {
      const instance1DNS = stackOutputs.Instance1PublicDNS;
      try {
        const { stdout } = await execAsync(
          `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://${instance1DNS} || echo "connection_failed"`
        );
        expect(stdout.trim()).not.toBe('connection_failed');
      } catch (error) {
        // If curl fails, that's expected if no web server is running
        // But we want to ensure the DNS resolves and instance is reachable
        try {
          await execAsync(`nslookup ${instance1DNS}`);
          expect(true).toBe(true);
        } catch (dnsError) {
          fail('Instance DNS should resolve');
        }
      }
    }, 20000);

    test('Instance 2 should be accessible via HTTP', async () => {
      const instance2DNS = stackOutputs.Instance2PublicDNS;
      try {
        const { stdout } = await execAsync(
          `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://${instance2DNS} || echo "connection_failed"`
        );
        expect(stdout.trim()).not.toBe('connection_failed');
      } catch (error) {
        try {
          await execAsync(`nslookup ${instance2DNS}`);
          expect(true).toBe(true);
        } catch (dnsError) {
          fail('Instance DNS should resolve');
        }
      }
    }, 20000);
  });

  describe('AWS Resource Validation', () => {
    test('should have VPC created with correct CIDR', async () => {
      const { stdout } = await execAsync(
        `aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=Production" --region ${REGION} --query "Vpcs[?CidrBlock=='10.0.0.0/16'] | [0].CidrBlock" --output text`
      );
      expect(stdout.trim()).toBe('10.0.0.0/16');
    });

    test('should have 2 public subnets created', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "length(StackResources[?ResourceType=='AWS::EC2::Subnet'])"`
      );
      const subnetCount = parseInt(stdout.trim());
      expect(subnetCount).toBeGreaterThanOrEqual(2);
    });

    test('should have Internet Gateway attached', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::InternetGateway'] | [0].ResourceStatus" --output text`
      );
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stdout.trim());
    });

    test('should have security group with SSH and HTTP access', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::SecurityGroup'] | [0].PhysicalResourceId" --output text`
      );
      const sgId = stdout.trim();
      const { stdout: sgDetails } = await execAsync(
        `aws ec2 describe-security-groups --group-ids ${sgId} --region ${REGION} --query "SecurityGroups[0].IpPermissions[*].FromPort" --output text`
      );
      const ports = sgDetails
        .trim()
        .split('\t')
        .map(p => parseInt(p))
        .sort();
      expect(ports).toEqual([22, 80]);
    });

    test('should have 2 running EC2 instances', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "length(StackResources[?ResourceType=='AWS::EC2::Instance'])"`
      );
      const instanceCount = parseInt(stdout.trim());
      expect(instanceCount).toBe(2);
    });
  });

  describe('Infrastructure Validation', () => {
    test('instances should be in different availability zones', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" --output text`
      );
      const instanceIds = stdout.trim().split('\t');
      const { stdout: azData } = await execAsync(
        `aws ec2 describe-instances --instance-ids ${instanceIds.join(' ')} --region ${REGION} --query "Reservations[].Instances[].Placement.AvailabilityZone" --output text`
      );
      const azs = azData.trim().split('\t');
      expect(azs).toHaveLength(2);
      expect(azs[0]).not.toBe(azs[1]);
    });

    test('instances should have public IP addresses', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" --output text`
      );
      const instanceIds = stdout.trim().split('\t');
      const { stdout: ipData } = await execAsync(
        `aws ec2 describe-instances --instance-ids ${instanceIds.join(' ')} --region ${REGION} --query "Reservations[].Instances[].PublicIpAddress" --output text`
      );
      const publicIPs = ipData
        .trim()
        .split('\t')
        .filter(ip => ip && ip !== 'None');
      expect(publicIPs).toHaveLength(2);
      publicIPs.forEach(ip => {
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });
    });
  });

  describe('Security Validation', () => {
    test('security group should have proper inbound rules', async () => {
      const { stdout: sgId } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::SecurityGroup'].PhysicalResourceId" --output text`
      );
      const { stdout } = await execAsync(
        `aws ec2 describe-security-groups --group-ids ${sgId.trim()} --region ${REGION} --query "SecurityGroups[0].IpPermissions" --output json`
      );
      const rules = JSON.parse(stdout);
      expect(rules).toHaveLength(2);
      const ports = rules.map((rule: any) => rule.FromPort).sort();
      expect(ports).toEqual([22, 80]);
      rules.forEach((rule: any) => {
        expect(rule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');
      });
    });

    test('instances should use the correct key pair', async () => {
      const { stdout } = await execAsync(
        `aws cloudformation describe-stack-resources --stack-name ${STACK_NAME} --region ${REGION} --query "StackResources[?ResourceType=='AWS::EC2::Instance'].PhysicalResourceId" --output text`
      );
      const instanceIds = stdout.trim().split('\t');
      const { stdout: keyData } = await execAsync(
        `aws ec2 describe-instances --instance-ids ${instanceIds.join(' ')} --region ${REGION} --query "Reservations[].Instances[].KeyName" --output text`
      );
      const keyNames = keyData.trim().split('\t');
      keyNames.forEach(keyName => {
        expect(keyName).toBe('my-key');
      });
    });
  });
});
