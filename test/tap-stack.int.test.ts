import {
  DescribeInstancesCommand,
  DescribeKeyPairsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';

// Integration tests for TapStack
// These tests run against deployed infrastructure


const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
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
  let publicIp: string | null = null;
  let availabilityZone: string | null = null;

  beforeAll(async () => {
    console.log(
      `🔍 Discovering resources for environment: ${environmentSuffix} in region: ${REGION}`
    );

    // Get resource IDs from outputs file
    vpcId = outputs.VPCID || null;
    instanceId = outputs.InstanceID || null;
    securityGroupId = outputs.SecurityGroupID || null;
    keyPairName = outputs.KeyPairName || null;
    publicIp = outputs.EC2PublicIP || null;
    availabilityZone = outputs.AvailabilityZone || null;

    // Log discovered resources
    console.log(`📋 Discovered resources from outputs:`);
    console.log(`   VPC ID: ${vpcId || 'NOT FOUND'}`);
    console.log(`   Instance ID: ${instanceId || 'NOT FOUND'}`);
    console.log(`   Security Group ID: ${securityGroupId || 'NOT FOUND'}`);
    console.log(`   Key Pair Name: ${keyPairName || 'NOT FOUND'}`);
    console.log(`   Public IP: ${publicIp || 'NOT FOUND'}`);
    console.log(`   Availability Zone: ${availabilityZone || 'NOT FOUND'}`);

    // Validate that we have the required resources to test
    if (!vpcId || !instanceId || !securityGroupId || !keyPairName) {
      throw new Error(
        `Missing required resources for environment ${environmentSuffix}. ` +
        `Required: VPC ID, Instance ID, Security Group ID, Key Pair Name. ` +
        `Please ensure the stack is deployed and outputs are available.`
      );
    }
  });

  describe('Infrastructure Configuration', () => {
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

    test('should have all required resource IDs from outputs', () => {
      expect(vpcId).toBeDefined();
      expect(instanceId).toBeDefined();
      expect(securityGroupId).toBeDefined();
      expect(keyPairName).toBeDefined();
      expect(publicIp).toBeDefined();
      expect(availabilityZone).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId!],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16'); // Expected CIDR from CDK stack
      // DNS settings are not directly accessible via DescribeVpcs API
      // They are configured in the CDK stack but not exposed in the API response

      // Validate environment tag
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    }, 30000);

    test('should have VPC with proper subnet configuration', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId!],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2); // At least 2 subnets (public + private)

      // Check for public subnet
      const publicSubnets = response.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThan(0);

      // Check for private subnet
      const privateSubnets = response.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThan(0);

      // Validate subnet CIDR blocks
      response.Subnets!.forEach(subnet => {
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.\d+\/24$/);
        expect(subnet.State).toBe('available');
      });
    }, 30000);

    test('should have VPC with proper route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId!],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      // Check for internet gateway route (public subnets)
      const publicRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();

      // Check for NAT gateway route (private subnets)
      const privateRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTable).toBeDefined();
    }, 30000);
  });

  describe('EC2 Instance Infrastructure', () => {
    test('should have EC2 instance in running state', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(instanceId);
      expect(instance.State?.Name).toBe('running');
      expect(instance.PublicIpAddress).toBe(publicIp);
      expect(instance.PublicDnsName).toBeDefined();
      expect(instance.Placement?.AvailabilityZone).toBe(availabilityZone);

      // Validate instance type (should be t2.micro or similar)
      expect(instance.InstanceType).toMatch(/^t[23]\.micro$/);

      // Validate environment tag
      const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    }, 30000);

    test('should have EC2 instance in public subnet', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.SubnetId).toBeDefined();
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

      // Verify instance is in public subnet by checking subnet configuration
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [instance.SubnetId!],
      });

      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnet = subnetResponse.Subnets![0];
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    }, 30000);

    test('should have EC2 instance with correct VPC and security group', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.VpcId).toBe(vpcId);
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBe(1);
      expect(instance.SecurityGroups![0].GroupId).toBe(securityGroupId);
    }, 30000);

    test('should have EC2 instance with proper key pair', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.KeyName).toBe(keyPairName);
    }, 30000);
  });

  describe('Security Group Configuration', () => {
    test('should have security group with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.GroupId).toBe(securityGroupId);
      expect(securityGroup.VpcId).toBe(vpcId);
      expect(securityGroup.Description).toBe('Security group for EC2 instance');

      // Validate environment tag
      const envTag = securityGroup.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    }, 30000);

    test('should have security group with HTTP ingress rule', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      // Check for HTTP ingress rule
      const httpRule = securityGroup.IpPermissions?.find(
        rule =>
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toBeDefined();
      expect(httpRule!.IpRanges!.length).toBeGreaterThan(0);
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(httpRule!.IpRanges![0].Description).toBe('Allow HTTP inbound');
    }, 30000);

    test('should have security group with SSH ingress rule', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      // Check for SSH ingress rule
      const sshRule = securityGroup.IpPermissions?.find(
        rule =>
          rule.FromPort === 22 &&
          rule.ToPort === 22 &&
          rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges!.length).toBeGreaterThan(0);
      expect(sshRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(sshRule!.IpRanges![0].Description).toBe('Allow SSH inbound');
    }, 30000);

    test('should have security group with proper egress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      // Check for egress rules (should allow all outbound traffic)
      expect(securityGroup.IpPermissionsEgress).toBeDefined();
      expect(securityGroup.IpPermissionsEgress!.length).toBeGreaterThan(0);

      // Should have rule allowing all outbound traffic
      const allTrafficRule = securityGroup.IpPermissionsEgress!.find(
        rule => rule.IpProtocol === '-1'
      );
      expect(allTrafficRule).toBeDefined();
      expect(allTrafficRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    }, 30000);

    test('should have minimal required ingress rules only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      // Should have exactly 2 ingress rules: HTTP and SSH
      const ingressRules = securityGroup.IpPermissions || [];
      expect(ingressRules.length).toBe(2);

      // Check for required rules
      const hasHttp = ingressRules.some(rule => rule.FromPort === 80);
      const hasSsh = ingressRules.some(rule => rule.FromPort === 22);

      expect(hasHttp).toBe(true);
      expect(hasSsh).toBe(true);
    }, 30000);
  });

  describe('Key Pair Configuration', () => {
    test('should have key pair with correct configuration', async () => {
      const command = new DescribeKeyPairsCommand({
        KeyNames: [keyPairName!],
      });

      const response = await ec2Client.send(command);
      expect(response.KeyPairs).toBeDefined();
      expect(response.KeyPairs!.length).toBe(1);

      const keyPair = response.KeyPairs![0];
      expect(keyPair.KeyName).toBe(keyPairName);
      expect(keyPair.KeyFingerprint).toBeDefined();
      expect(keyPair.KeyType).toBe('rsa');

      // Validate key pair name format (should include environment suffix and timestamp)
      expect(keyPair.KeyName).toMatch(
        new RegExp(`^key-pair-${environmentSuffix}-\\d+$`)
      );
    }, 30000);
  });

  describe('Network Connectivity', () => {
    test('should have instance with valid public IP address', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.PublicIpAddress).toBe(publicIp);
      expect(instance.PublicIpAddress).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(instance.PublicDnsName).toBeDefined();
      expect(instance.PublicDnsName).toMatch(
        /^ec2-\d+-\d+-\d+-\d+\.compute-1\.amazonaws\.com$/
      );

      console.log(`Instance public IP: ${instance.PublicIpAddress}`);
      console.log(`Instance public DNS: ${instance.PublicDnsName}`);
    }, 30000);

    test('should have instance in correct availability zone', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.Placement?.AvailabilityZone).toBe(availabilityZone);
      expect(instance.Placement?.AvailabilityZone).toMatch(/^us-east-1[a-z]$/);
    }, 30000);
  });

  describe('Resource Tagging and Metadata', () => {
    test('should have consistent tagging across all resources', async () => {
      const resourcesToTest = [
        {
          type: 'VPC',
          id: vpcId!,
          command: new DescribeVpcsCommand({ VpcIds: [vpcId!] }),
        },
        {
          type: 'Instance',
          id: instanceId!,
          command: new DescribeInstancesCommand({ InstanceIds: [instanceId!] }),
        },
        {
          type: 'SecurityGroup',
          id: securityGroupId!,
          command: new DescribeSecurityGroupsCommand({
            GroupIds: [securityGroupId!],
          }),
        },
        {
          type: 'KeyPair',
          id: keyPairName!,
          command: new DescribeKeyPairsCommand({ KeyNames: [keyPairName!] }),
        },
      ];

      const results = await Promise.all(
        resourcesToTest.map(async resource => {
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

          const envTag = resourceData.Tags?.find(
            (tag: any) => tag.Key === 'Environment'
          );
          const projectTag = resourceData.Tags?.find(
            (tag: any) => tag.Key === 'Project'
          );
          const ownerTag = resourceData.Tags?.find(
            (tag: any) => tag.Key === 'Owner'
          );
          const managedByTag = resourceData.Tags?.find(
            (tag: any) => tag.Key === 'ManagedBy'
          );

          return {
            type: resource.type,
            hasEnvTag: !!envTag,
            envValue: envTag?.Value,
            hasProjectTag: !!projectTag,
            projectValue: projectTag?.Value,
            hasOwnerTag: !!ownerTag,
            ownerValue: ownerTag?.Value,
            hasManagedByTag: !!managedByTag,
            managedByValue: managedByTag?.Value,
          };
        })
      );

      // Validate that all resources have consistent tags
      results.forEach(result => {
        expect(result.hasEnvTag).toBe(true);
        expect(result.envValue).toBe(environmentSuffix);
        expect(result.hasProjectTag).toBe(true);
        expect(result.projectValue).toBe('TAP');
        expect(result.hasOwnerTag).toBe(true);
        expect(result.ownerValue).toBe('DevOps');
        expect(result.hasManagedByTag).toBe(true);
        expect(result.managedByValue).toBe('CDK');
      });

      console.log(`Validated tagging for ${results.length} resources`);
    }, 30000);

    test('should have resources with proper metadata', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      // Check that instance has proper metadata
      expect(instance.InstanceId).toBeDefined();
      expect(instance.InstanceType).toBeDefined();
      expect(instance.State).toBeDefined();
      expect(instance.LaunchTime).toBeDefined();
      expect(instance.Architecture).toBeDefined();
      expect(instance.RootDeviceType).toBeDefined();
      expect(instance.VirtualizationType).toBeDefined();

      // Validate specific values
      expect(instance.State!.Name).toBe('running');
      expect(instance.Architecture).toBe('x86_64');
      expect(instance.RootDeviceType).toBe('ebs');
      expect(instance.VirtualizationType).toBe('hvm');
    }, 30000);
  });

  describe('Security and Compliance', () => {
    test('should have security group with minimal required rules only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      // Should have exactly 2 ingress rules: HTTP and SSH
      const ingressRules = securityGroup.IpPermissions || [];
      expect(ingressRules.length).toBe(2);

      // Check for required rules with proper descriptions
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);

      expect(httpRule).toBeDefined();
      expect(sshRule).toBeDefined();
      expect(httpRule!.IpRanges![0].Description).toBe('Allow HTTP inbound');
      expect(sshRule!.IpRanges![0].Description).toBe('Allow SSH inbound');
    }, 30000);

    test('should have instance with proper security group association', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId!],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBe(1);

      const associatedSecurityGroup = instance.SecurityGroups!.find(
        sg => sg.GroupId === securityGroupId
      );
      expect(associatedSecurityGroup).toBeDefined();
      expect(associatedSecurityGroup!.GroupName).toMatch(
        new RegExp(`^ec2-sg-${environmentSuffix}$`)
      );
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
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
    test('should handle concurrent API calls efficiently', async () => {
      const commands = [
        new DescribeVpcsCommand({ VpcIds: [vpcId!] }),
        new DescribeInstancesCommand({ InstanceIds: [instanceId!] }),
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId!] }),
        new DescribeKeyPairsCommand({ KeyNames: [keyPairName!] }),
      ];

      const startTime = Date.now();
      const responses = await Promise.all(
        commands.map(cmd => ec2Client.send(cmd))
      );
      const endTime = Date.now();

      expect(responses.length).toBe(commands.length);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all responses are valid
      responses.forEach(response => {
        expect(response).toBeDefined();
      });

      console.log(`Concurrent API calls completed in ${endTime - startTime}ms`);
    }, 30000);
  });
});
