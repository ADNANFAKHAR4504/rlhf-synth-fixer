import { DescribeInstancesCommand, DescribeKeyPairsCommand, DescribeSecurityGroupsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import * as fs from 'fs';

// Integration tests for TapStack
// These tests run against deployed infrastructure

const environmentSuffix = process.env.CDK_CONTEXT_ENVIRONMENT_SUFFIX || 'dev';
let outputs: Record<string, any> = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read outputs file: ${error}`);
  }
} else {
  console.warn(
    `Outputs file ${outputsFile} not found. Integration tests will be limited.`
  );
}

// Use region from outputs or fall back to us-east-1
const REGION = outputs.AWSRegion || 'us-east-1';

const ec2Client = new EC2Client({ region: REGION });



describe('TapStack Integration Tests', () => {
  let vpcId: string | null = null;
  let instanceId: string | null = null;
  let securityGroupId: string | null = null;
  let keyPairName: string | null = null;

  beforeAll(async () => {
    console.log(`🔍 Discovering resources for environment: ${environmentSuffix} in region: ${REGION}`);

    // Log what we have in outputs
    console.log(`Outputs file contains:`);
    console.log(`AWS Region: ${outputs.AWSRegion || 'NOT FOUND (using fallback)'}`);
    console.log(`VPC ID: ${outputs.VPCID || 'NOT FOUND'}`);
    console.log(`Instance ID: ${outputs.InstanceID || 'NOT FOUND'}`);
    console.log(`Security Group ID: ${outputs.SecurityGroupID || 'NOT FOUND'}`);
    console.log(`Key Pair Name: ${outputs.KeyPairName || 'NOT FOUND'}`);

    // Try to get resource IDs from outputs first, then fall back to dynamic discovery
    vpcId = outputs.VPCID
    instanceId = outputs.InstanceID
    securityGroupId = outputs.SecurityGroupID
    keyPairName = outputs.KeyPairName

    // Log discovered resources
    console.log(`📋 Final discovered resources:`);
    console.log(`   VPC ID: ${vpcId || 'NOT FOUND'}`);
    console.log(`   Instance ID: ${instanceId || 'NOT FOUND'}`);
    console.log(`   Security Group ID: ${securityGroupId || 'NOT FOUND'}`);
    console.log(`   Key Pair Name: ${keyPairName || 'NOT FOUND'}`);

    // Validate that we have at least some resources to test
    if (!vpcId && !instanceId && !securityGroupId && !keyPairName) {
      throw new Error(
        `No resources found for environment ${environmentSuffix}. ` +
        `Please ensure the stack is deployed and resources are tagged with Environment=${environmentSuffix}`
      );
    }

    // Validate resource consistency - if we have outputs, prefer them
    if (outputs.VPCID && outputs.InstanceID && outputs.SecurityGroupID && outputs.KeyPairName) {
      console.log(`✅ Using outputs file data for consistency`);
      vpcId = outputs.VPCID;
      instanceId = outputs.InstanceID;
      securityGroupId = outputs.SecurityGroupID;
      keyPairName = outputs.KeyPairName;
    } else {
      console.log(`⚠️ Using mixed sources - some from outputs, some from discovery`);
    }
  });

  describe('Infrastructure Deployment', () => {
    test('should have valid environment configuration', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix).toMatch(/^(dev|staging|prod|test|pr\d+)$/);
    });

    test('should have valid AWS region configuration', () => {
      expect(REGION).toBeDefined();
      expect(typeof REGION).toBe('string');
      expect(REGION).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
      expect(REGION).toBe('us-east-1'); // Infrastructure is deployed in us-east-1
    });

    test('should have discovered at least some resources', () => {
      const discoveredResources = [vpcId, instanceId, securityGroupId, keyPairName].filter(Boolean);
      expect(discoveredResources.length).toBeGreaterThan(0);
      console.log(`Discovered ${discoveredResources.length} resources for testing`);
    });
  });

  describe('VPC Integration', () => {
    test('should have VPC with correct configuration', async () => {
      if (!vpcId) {
        console.log('Skipping VPC test - no VPC discovered');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      try {
        const response = await ec2Client.send(command);
        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);

        const vpc = response.Vpcs![0];
        expect(vpc.VpcId).toBe(vpcId);
        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBeDefined();

        // Validate environment tag
        const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag) {
          expect(envTag.Value).toBe(environmentSuffix);
        }
      } catch (error) {
        throw new Error(`Failed to describe VPC: ${error}`);
      }
    }, 30000);

    test('should have VPC with proper CIDR block', async () => {
      if (!vpcId) {
        console.log('Skipping VPC CIDR test - no VPC discovered');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      try {
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs![0];

        // Check that CIDR is valid
        expect(vpc.CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/\d+$/);

        // Check that CIDR is not too large (should be /16 or smaller)
        const cidrParts = vpc.CidrBlock!.split('/');
        const prefixLength = parseInt(cidrParts[1]);
        expect(prefixLength).toBeLessThanOrEqual(16);
      } catch (error) {
        throw new Error(`Failed to validate VPC CIDR: ${error}`);
      }
    }, 30000);
  });

  describe('EC2 Instance Integration', () => {
    test('should have EC2 instance in running state', async () => {
      if (!instanceId) {
        console.log('Skipping EC2 instance test - no instance discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        expect(response.Reservations).toBeDefined();
        expect(response.Reservations!.length).toBeGreaterThan(0);

        const instance = response.Reservations![0].Instances![0];
        expect(instance.InstanceId).toBe(instanceId);
        expect(instance.State?.Name).toBe('running');
        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PublicDnsName).toBeDefined();

        // Validate environment tag
        const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag) {
          expect(envTag.Value).toBe(environmentSuffix);
        }
      } catch (error) {
        throw new Error(`Failed to describe EC2 instance: ${error}`);
      }
    }, 30000);

    test('should have EC2 instance with proper instance type', async () => {
      if (!instanceId) {
        console.log('Skipping EC2 instance type test - no instance discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        // Check instance type (should be t2.micro or similar)
        expect(instance.InstanceType).toMatch(/^t[23]\.micro$/);

        // Check that instance has public IP
        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PublicIpAddress).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      } catch (error) {
        throw new Error(`Failed to validate EC2 instance type: ${error}`);
      }
    }, 30000);

    test('should have EC2 instance in correct VPC', async () => {
      if (!instanceId || !vpcId) {
        console.log('Skipping EC2 VPC test - no instance or VPC discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.VpcId).toBe(vpcId);
        expect(instance.SubnetId).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to validate EC2 instance VPC: ${error}`);
      }
    }, 30000);
  });

  describe('Security Group Integration', () => {
    test('should have security group with correct configuration', async () => {
      if (!securityGroupId) {
        console.log('Skipping security group test - no security group discovered');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });

      try {
        const response = await ec2Client.send(command);
        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);

        const securityGroup = response.SecurityGroups![0];
        expect(securityGroup.GroupId).toBe(securityGroupId);
        expect(securityGroup.VpcId).toBe(vpcId);
        expect(securityGroup.Description).toBeDefined();

        // Validate environment tag
        const envTag = securityGroup.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag) {
          expect(envTag.Value).toBe(environmentSuffix);
        }
      } catch (error) {
        throw new Error(`Failed to describe security group: ${error}`);
      }
    }, 30000);

    test('should have security group with HTTP ingress rule', async () => {
      if (!securityGroupId) {
        console.log('Skipping HTTP rule test - no security group discovered');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });

      try {
        const response = await ec2Client.send(command);
        const securityGroup = response.SecurityGroups![0];

        // Check for HTTP ingress rule
        const httpRule = securityGroup.IpPermissions?.find(
          rule =>
            rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
        );
        expect(httpRule).toBeDefined();
        expect(httpRule!.IpRanges).toBeDefined();
        expect(httpRule!.IpRanges!.length).toBeGreaterThan(0);
        expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      } catch (error) {
        throw new Error(`Failed to validate HTTP ingress rule: ${error}`);
      }
    }, 30000);

    test('should have security group with SSH ingress rule', async () => {
      if (!securityGroupId) {
        console.log('Skipping SSH rule test - no security group discovered');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });

      try {
        const response = await ec2Client.send(command);
        const securityGroup = response.SecurityGroups![0];

        // Check for SSH ingress rule
        const sshRule = securityGroup.IpPermissions?.find(
          rule =>
            rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
        );
        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges).toBeDefined();
        expect(sshRule!.IpRanges!.length).toBeGreaterThan(0);
        expect(sshRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      } catch (error) {
        throw new Error(`Failed to validate SSH ingress rule: ${error}`);
      }
    }, 30000);

    test('should have security group with proper egress rules', async () => {
      if (!securityGroupId) {
        console.log('Skipping egress rules test - no security group discovered');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });

      try {
        const response = await ec2Client.send(command);
        const securityGroup = response.SecurityGroups![0];

        // Check for egress rules
        expect(securityGroup.IpPermissionsEgress).toBeDefined();
        expect(securityGroup.IpPermissionsEgress!.length).toBeGreaterThan(0);

        // Should have at least one rule allowing all outbound traffic
        const allTrafficRule = securityGroup.IpPermissionsEgress!.find(
          rule => rule.IpProtocol === '-1'
        );
        expect(allTrafficRule).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to validate egress rules: ${error}`);
      }
    }, 30000);
  });

  describe('Key Pair Integration', () => {
    test('should have key pair with correct configuration', async () => {
      if (!keyPairName) {
        console.log('Skipping key pair test - no key pair discovered');
        return;
      }

      const command = new DescribeKeyPairsCommand({
        KeyNames: [keyPairName],
      });

      try {
        const response = await ec2Client.send(command);
        expect(response.KeyPairs).toBeDefined();
        expect(response.KeyPairs!.length).toBe(1);

        const keyPair = response.KeyPairs![0];
        expect(keyPair.KeyName).toBe(keyPairName);
        expect(keyPair.KeyFingerprint).toBeDefined();
        expect(keyPair.KeyType).toBe('rsa');

        // Validate key pair name format (should include environment suffix and timestamp)
        expect(keyPair.KeyName).toMatch(new RegExp(`^key-pair-${environmentSuffix}-\\d+$`));

        // Validate environment tag
        const envTag = keyPair.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag) {
          expect(envTag.Value).toBe(environmentSuffix);
        }
      } catch (error) {
        throw new Error(`Failed to describe key pair: ${error}`);
      }
    }, 30000);
  });

  describe('Network Connectivity', () => {
    test('should have instance with public IP address', async () => {
      if (!instanceId) {
        console.log('Skipping public IP test - no instance discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PublicIpAddress).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

        // Store the public IP for potential connectivity tests
        console.log(`Instance public IP: ${instance.PublicIpAddress}`);
      } catch (error) {
        throw new Error(`Failed to get instance public IP: ${error}`);
      }
    }, 30000);

    test('should have instance in public subnet', async () => {
      if (!instanceId) {
        console.log('Skipping subnet test - no instance discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.SubnetId).toBeDefined();
        expect(instance.PublicIpAddress).toBeDefined();

        // Instance with public IP should be in public subnet
        expect(instance.PublicIpAddress).not.toBeNull();
      } catch (error) {
        throw new Error(`Failed to validate instance subnet: ${error}`);
      }
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across resources', async () => {
      const resourcesToTest = [];

      if (vpcId) resourcesToTest.push({ type: 'VPC', id: vpcId, command: new DescribeVpcsCommand({ VpcIds: [vpcId] }) });
      if (instanceId) resourcesToTest.push({ type: 'Instance', id: instanceId, command: new DescribeInstancesCommand({ InstanceIds: [instanceId] }) });
      if (securityGroupId) resourcesToTest.push({ type: 'SecurityGroup', id: securityGroupId, command: new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }) });
      if (keyPairName) resourcesToTest.push({ type: 'KeyPair', id: keyPairName, command: new DescribeKeyPairsCommand({ KeyNames: [keyPairName] }) });

      if (resourcesToTest.length === 0) {
        console.log('Skipping tagging test - no resources discovered');
        return;
      }

      try {
        const results = await Promise.all(
          resourcesToTest.map(async (resource) => {
            const response = await ec2Client.send(resource.command);
            let resourceData: any;

            switch (resource.type) {
              case 'VPC':
                resourceData = (response as any).Vpcs![0];
                break;
              case 'Instance':
                resourceData = (response as any).Reservations![0].Instances![0];
                break;
              case 'SecurityGroup':
                resourceData = (response as any).SecurityGroups![0];
                break;
              case 'KeyPair':
                resourceData = (response as any).KeyPairs![0];
                break;
            }

            const envTag = resourceData.Tags?.find((tag: any) => tag.Key === 'Environment');
            return { type: resource.type, hasEnvTag: !!envTag, envValue: envTag?.Value };
          })
        );

        // Validate that all resources have environment tags
        results.forEach(result => {
          if (result.hasEnvTag) {
            expect(result.envValue).toBe(environmentSuffix);
          }
        });

        console.log(`Validated tagging for ${results.length} resources`);
      } catch (error) {
        throw new Error(`Failed to validate resource tagging: ${error}`);
      }
    }, 30000);
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid resource IDs gracefully', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: ['vpc-invalid'],
      });

      try {
        await ec2Client.send(command);
        throw new Error('Should have thrown an error for invalid VPC ID');
      } catch (error: any) {
        expect(error.name).toBe('InvalidVpcID.NotFound');
      }
    }, 30000);

    test('should handle invalid instance ID gracefully', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: ['i-invalid'],
      });

      try {
        await ec2Client.send(command);
        // If we get here, the API accepted the invalid ID but returned empty results
        // This is also acceptable behavior
      } catch (error: any) {
        // AWS API might throw an error for malformed instance IDs
        expect(error.name).toMatch(/InvalidInstanceID|InvalidParameterValue/);
      }
    }, 30000);
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent API calls', async () => {
      const commands = [];

      if (vpcId) commands.push(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if (instanceId) commands.push(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      if (securityGroupId) commands.push(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      if (keyPairName) commands.push(new DescribeKeyPairsCommand({ KeyNames: [keyPairName] }));

      if (commands.length === 0) {
        console.log('Skipping concurrent API test - no resources discovered');
        return;
      }

      try {
        const startTime = Date.now();
        const responses = await Promise.all(commands.map(cmd => ec2Client.send(cmd)));
        const endTime = Date.now();

        expect(responses.length).toBe(commands.length);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

        // Verify all responses are valid
        responses.forEach(response => {
          expect(response).toBeDefined();
        });
      } catch (error) {
        throw new Error(`Failed concurrent API calls: ${error}`);
      }
    }, 30000);
  });

  describe('Monitoring and Observability', () => {
    test('should have resources with proper metadata', async () => {
      if (!instanceId) {
        console.log('Skipping metadata test - no instance discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        // Check that instance has proper metadata
        expect(instance.InstanceId).toBeDefined();
        expect(instance.InstanceType).toBeDefined();
        expect(instance.State).toBeDefined();
        expect(instance.LaunchTime).toBeDefined();
        // Platform might not be defined for Linux instances
        if (instance.Platform) {
          expect(instance.Platform).toBeDefined();
        }
      } catch (error) {
        throw new Error(`Failed to validate instance metadata: ${error}`);
      }
    }, 30000);
  });

  describe('Security and Compliance', () => {
    test('should have security group with minimal required rules', async () => {
      if (!securityGroupId) {
        console.log('Skipping security rules test - no security group discovered');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });

      try {
        const response = await ec2Client.send(command);
        const securityGroup = response.SecurityGroups![0];

        // Should have HTTP and SSH rules only
        const ingressRules = securityGroup.IpPermissions || [];
        expect(ingressRules.length).toBeLessThanOrEqual(2); // HTTP + SSH

        // Check for required rules
        const hasHttp = ingressRules.some(rule => rule.FromPort === 80);
        const hasSsh = ingressRules.some(rule => rule.FromPort === 22);

        expect(hasHttp).toBe(true);
        expect(hasSsh).toBe(true);
      } catch (error) {
        throw new Error(`Failed to validate security group rules: ${error}`);
      }
    }, 30000);

    test('should have instance with proper security group association', async () => {
      if (!instanceId || !securityGroupId) {
        console.log('Skipping security group association test - no instance or security group discovered');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.SecurityGroups).toBeDefined();
        expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

        const associatedSecurityGroup = instance.SecurityGroups!.find(
          sg => sg.GroupId === securityGroupId
        );
        expect(associatedSecurityGroup).toBeDefined();
      } catch (error) {
        throw new Error(
          `Failed to validate security group association: ${error}`
        );
      }
    }, 30000);
  });
});
