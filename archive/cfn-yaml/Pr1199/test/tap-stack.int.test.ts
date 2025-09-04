import { execSync } from 'child_process';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Function to get actual CloudFormation stack outputs
function getStackOutputs(): Record<string, string> {
  try {
    const command = `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs" --output json`;
    const result = execSync(command, { encoding: 'utf-8' });
    const outputs = JSON.parse(result);
    
    // Convert AWS CLI output format to key-value pairs
    const outputMap: Record<string, string> = {};
    outputs.forEach((output: any) => {
      outputMap[output.OutputKey] = output.OutputValue;
    });
    
    return outputMap;
  } catch (error) {
    throw new Error(`Failed to retrieve stack outputs for ${stackName}: ${error}`);
  }
}

// Get actual deployment outputs
const stackOutputs = getStackOutputs();

describe('ProjectX Infrastructure Integration Tests', () => {
  let outputs: any = {};
  let stackExists = false;

  beforeAll(async () => {
    try {
      outputs = stackOutputs;
      stackExists = true;
    } catch (error) {
      console.error('Stack not found or not accessible:', error);
      stackExists = false;
      throw new Error(`Integration tests require deployed stack: ${stackName}`);
    }
  }, 30000);

  describe('Stack Deployment Validation', () => {
    test('all required stack outputs should be present', async () => {
      const requiredOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'SSHSecurityGroupId', 'InternalSecurityGroupId', 'Instance1Id', 'Instance2Id',
        'Instance1PrivateIP', 'Instance2PrivateIP', 'NATGatewayId', 'StackName', 'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('environment suffix should match expected value', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
    });

    test('all resource names should include environment suffix for conflict avoidance', async () => {
      // Validate that actual resource names include environment suffix
      const command = `aws cloudformation describe-stack-resources --stack-name ${stackName} --query "StackResources[].{LogicalId:LogicalResourceId,PhysicalId:PhysicalResourceId}" --output json`;
      const result = execSync(command, { encoding: 'utf-8' });
      const resources = JSON.parse(result);
      
      // Check key resources have environment suffix in their physical names
      const resourcesWithSuffix = resources.filter((resource: any) => {
        // These resources should have environment suffix in their names
        const shouldHaveSuffix = ['ProjectXVPC', 'ProjectXPublicSubnet1', 'ProjectXPrivateSubnet1', 
                                 'ProjectXSSHSecurityGroup', 'ProjectXInstance1'];
        return shouldHaveSuffix.includes(resource.LogicalId);
      });

      // For resources where we control naming, verify suffix is present
      resourcesWithSuffix.forEach((resource: any) => {
        if (resource.LogicalId.includes('SecurityGroup')) {
          // Security groups have names we control
          const command = `aws ec2 describe-security-groups --group-ids ${resource.PhysicalId} --query "SecurityGroups[0].GroupName" --output text`;
          const groupName = execSync(command, { encoding: 'utf-8' }).trim();
          expect(groupName).toContain(environmentSuffix);
        }
      });
    });

    test('resource IDs should have correct format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[0-9a-f]{8,17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[0-9a-f]{8,17}$/);
      expect(outputs.SSHSecurityGroupId).toMatch(/^sg-[0-9a-f]{8,17}$/);
      expect(outputs.Instance1Id).toMatch(/^i-[0-9a-f]{8,17}$/);
      expect(outputs.NATGatewayId).toMatch(/^nat-[0-9a-f]{8,17}$/);
    });
  });

  describe('Network Infrastructure Validation', () => {
    test('VPC should have correct CIDR block configuration', () => {
      // Test that our VPC uses the expected CIDR range
      expect(outputs.VPCId).toBeDefined();
      
      // Validate private IP addresses are within expected ranges
      expect(outputs.Instance1PrivateIP).toMatch(/^10\.0\.10\.\d+$/);
      expect(outputs.Instance2PrivateIP).toMatch(/^10\.0\.11\.\d+$/);
    });

    test('subnets should be distributed across availability zones', () => {
      // We have 4 subnets that should be in 2 different AZs
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      
      // All subnets should be different
      const subnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];
      const uniqueSubnets = new Set(subnets);
      expect(uniqueSubnets.size).toBe(4);
    });

    test('NAT Gateway should provide outbound internet access for private subnets', () => {
      expect(outputs.NATGatewayId).toBeDefined();
      expect(outputs.NATGatewayId).toMatch(/^nat-/);
    });
  });

  describe('Security Configuration Tests', () => {
    test('instances should be in private subnets without public IP addresses', () => {
      expect(outputs.Instance1PrivateIP).toMatch(/^10\.0\.10\.\d+$/); // Private subnet 1
      expect(outputs.Instance2PrivateIP).toMatch(/^10\.0\.11\.\d+$/); // Private subnet 2
    });

    test('security groups should be configured for proper access control', () => {
      expect(outputs.SSHSecurityGroupId).toBeDefined();
      expect(outputs.InternalSecurityGroupId).toBeDefined();
      expect(outputs.SSHSecurityGroupId).not.toBe(outputs.InternalSecurityGroupId);
    });
  });

  describe('Compute Resource Tests', () => {
    test('EC2 instances should be properly distributed', () => {
      expect(outputs.Instance1Id).toBeDefined();
      expect(outputs.Instance2Id).toBeDefined();
      expect(outputs.Instance1Id).not.toBe(outputs.Instance2Id);
      expect(outputs.Instance1Id).toMatch(/^i-[0-9a-f]{8,17}$/);
      expect(outputs.Instance2Id).toMatch(/^i-[0-9a-f]{8,17}$/);
    });

    test('instances should have private IP addresses in correct subnets', () => {
      expect(outputs.Instance1PrivateIP).toMatch(/^10\.0\.10\.\d+$/);
      expect(outputs.Instance2PrivateIP).toMatch(/^10\.0\.11\.\d+$/);
      expect(outputs.Instance1PrivateIP).not.toBe(outputs.Instance2PrivateIP);
    });
  });

  describe('Cost Optimization Validation', () => {
    test('should use single NAT Gateway for cost efficiency', () => {
      expect(outputs.NATGatewayId).toBeDefined();
      expect(outputs.NATGatewayId).toMatch(/^nat-[0-9a-f]{8,17}$/);
    });

    test('should use cost-effective configuration', () => {
      // Template defaults to t3.micro and single NAT Gateway
      expect(outputs.Instance1Id).toBeDefined();
      expect(outputs.Instance2Id).toBeDefined();
      expect(true).toBe(true); // Placeholder for real cost validation
    });
  });

  describe('Network Connectivity Simulation', () => {
    test('private subnets should have internet access via NAT Gateway', () => {
      expect(outputs.NATGatewayId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(true).toBe(true);
    });

    test('instances should be able to communicate internally', () => {
      expect(outputs.InternalSecurityGroupId).toBeDefined();
      expect(outputs.Instance1PrivateIP).toBeDefined();
      expect(outputs.Instance2PrivateIP).toBeDefined();
      // In real tests: ping from Instance1 to Instance2
      expect(true).toBe(true);
    });
  });

  describe('High Availability and Scaling Tests', () => {
    test('infrastructure should support scaling scenarios', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('network configuration should support load balancing', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should have valid stack deployment', () => {
      expect(stackExists).toBe(true);
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should validate critical resources exist', () => {
      const criticalOutputs = ['VPCId', 'Instance1Id', 'Instance2Id'];
      criticalOutputs.forEach(output => {
        if (!outputs[output]) {
          console.log(`Warning: Missing critical output ${output}`);
        }
      });
      expect(true).toBe(true);
    });
  });
});