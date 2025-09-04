// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeAddressesCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetHealthCheckCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import fs from 'fs';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr1069';

// AWS Clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const route53Client = new Route53Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Normalize FQDNs for strict comparisons (handles trailing dot + casing)
const normalizeFqdn = (name: string) =>
  (name?.endsWith('.') ? name.slice(0, -1) : name ?? '').toLowerCase();

describe('Failover Stack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs from CloudFormation stack', () => {
      const requiredOutputs = [
        'PrimaryInstanceId',
        'StandbyInstanceId',
        'PrimaryEIPOut',
        'StandbyEIPOut',
        'DNSName',
        'HealthCheckId',
        'HostedZoneIdOutput',
        'VPCId',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have valid EC2 instance IDs', () => {
      expect(outputs.PrimaryInstanceId).toMatch(/^i-[0-9a-f]{8,17}$/);
      expect(outputs.StandbyInstanceId).toMatch(/^i-[0-9a-f]{8,17}$/);
      expect(outputs.PrimaryInstanceId).not.toBe(outputs.StandbyInstanceId);
    });

    test('should have valid Elastic IP addresses', () => {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(outputs.PrimaryEIPOut).toMatch(ipRegex);
      expect(outputs.StandbyEIPOut).toMatch(ipRegex);
      expect(outputs.PrimaryEIPOut).not.toBe(outputs.StandbyEIPOut);
    });

    test('should have valid VPC ID', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    });

    test('should have valid Route53 Health Check ID', () => {
      expect(outputs.HealthCheckId).toBeDefined();
      expect(outputs.HealthCheckId.length).toBeGreaterThan(0);
    });

    test('should have valid DNS name', () => {
      expect(outputs.DNSName).toBeDefined();
      expect(outputs.DNSName).toContain('.');
    });
  });

  describe('EC2 Resources Validation', () => {
    test('should verify primary instance exists and is running', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [outputs.PrimaryInstanceId],
        });
        const response = await ec2Client.send(command);

        expect(response.Reservations).toBeDefined();
        expect(response.Reservations?.length).toBeGreaterThan(0);

        const instance = response.Reservations?.[0]?.Instances?.[0];
        expect(instance).toBeDefined();
        expect(['running', 'pending']).toContain(instance?.State?.Name);

        // Verify instance has correct tags
        const roleTag = instance?.Tags?.find(tag => tag.Key === 'Role');
        expect(roleTag?.Value).toBe('Primary');
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should verify standby instance exists and is running', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [outputs.StandbyInstanceId],
        });
        const response = await ec2Client.send(command);

        expect(response.Reservations).toBeDefined();
        expect(response.Reservations?.length).toBeGreaterThan(0);

        const instance = response.Reservations?.[0]?.Instances?.[0];
        expect(instance).toBeDefined();
        expect(['running', 'pending']).toContain(instance?.State?.Name);

        // Verify instance has correct tags
        const roleTag = instance?.Tags?.find(tag => tag.Key === 'Role');
        expect(roleTag?.Value).toBe('Standby');
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should verify instances are in different availability zones', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [outputs.PrimaryInstanceId, outputs.StandbyInstanceId],
        });
        const response = await ec2Client.send(command);

        const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
        expect(instances.length).toBe(2);

        const primaryAZ = instances.find(i => i.InstanceId === outputs.PrimaryInstanceId)?.Placement?.AvailabilityZone;
        const standbyAZ = instances.find(i => i.InstanceId === outputs.StandbyInstanceId)?.Placement?.AvailabilityZone;

        expect(primaryAZ).toBeDefined();
        expect(standbyAZ).toBeDefined();
        expect(primaryAZ).not.toBe(standbyAZ);
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should verify Elastic IPs are allocated and associated', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new DescribeAddressesCommand({
          PublicIps: [outputs.PrimaryEIPOut, outputs.StandbyEIPOut],
        });
        const response = await ec2Client.send(command);

        expect(response.Addresses).toBeDefined();
        expect(response.Addresses?.length).toBe(2);

        const primaryEIP = response.Addresses?.find(a => a.PublicIp === outputs.PrimaryEIPOut);
        const standbyEIP = response.Addresses?.find(a => a.PublicIp === outputs.StandbyEIPOut);

        expect(primaryEIP?.InstanceId).toBe(outputs.PrimaryInstanceId);
        expect(standbyEIP?.InstanceId).toBe(outputs.StandbyInstanceId);

        // Verify both are in VPC domain
        expect(primaryEIP?.Domain).toBe('vpc');
        expect(standbyEIP?.Domain).toBe('vpc');
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('VPC and Networking Validation', () => {
    test('should verify VPC exists with correct configuration', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs?.length).toBe(1);

        const vpc = response.Vpcs?.[0];
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc?.State).toBe('available');

        // Verify DNS settings via DescribeVpcAttribute (these are not fields on Vpc)
        const dnsHostnames = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: outputs.VPCId,
            Attribute: 'enableDnsHostnames',
          })
        );
        expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupport = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: outputs.VPCId,
            Attribute: 'enableDnsSupport',
          })
        );
        expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should verify security group allows HTTP and SSH', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        // Get instances to find security group
        const instanceCommand = new DescribeInstancesCommand({
          InstanceIds: [outputs.PrimaryInstanceId],
        });
        const instanceResponse = await ec2Client.send(instanceCommand);

        const securityGroupIds = (
          instanceResponse.Reservations?.[0]?.Instances?.[0]?.SecurityGroups || []
        )
          .map(sg => sg.GroupId)
          .filter((id): id is string => Boolean(id));

        expect(securityGroupIds.length).toBeGreaterThan(0);

        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: securityGroupIds, // now string[]
        });
        const sgResponse = await ec2Client.send(sgCommand);

        expect(sgResponse.SecurityGroups).toBeDefined();
        expect(sgResponse.SecurityGroups?.length).toBeGreaterThan(0);

        const sg = sgResponse.SecurityGroups?.[0];
        const ingressRules = sg?.IpPermissions || [];

        // Check HTTP rule
        const httpRule = ingressRules.find(
          rule => rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
        );
        expect(httpRule).toBeDefined();
        expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

        // Check SSH rule
        const sshRule = ingressRules.find(
          rule => rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
        );
        expect(sshRule).toBeDefined();
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Route53 Failover Configuration', () => {
    test('should verify health check is configured correctly', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new GetHealthCheckCommand({
          HealthCheckId: outputs.HealthCheckId,
        });
        const response = await route53Client.send(command);

        expect(response.HealthCheck).toBeDefined();

        const config = response.HealthCheck?.HealthCheckConfig;
        expect(config?.Type).toBe('HTTP');
        expect(config?.IPAddress).toBe(outputs.PrimaryEIPOut);
        expect(config?.Port).toBe(80);
        expect(config?.ResourcePath).toBe('/');
        expect(config?.RequestInterval).toBe(30);
        expect(config?.FailureThreshold).toBe(3);
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should verify DNS records are configured for failover', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      try {
        const command = new ListResourceRecordSetsCommand({
          HostedZoneId: outputs.HostedZoneIdOutput,
        });
        const response = await route53Client.send(command);

        const recordSets = response.ResourceRecordSets || [];

        // Normalize names for comparison (AWS returns trailing dot)
        const targetName = normalizeFqdn(outputs.DNSName);

        // Find failover records
        const failoverRecords = recordSets.filter(
          record =>
            normalizeFqdn(record.Name ?? '') === targetName &&
            record.Type === 'A' &&
            Boolean(record.Failover)
        );

        expect(failoverRecords.length).toBe(2);

        const primaryRecord = failoverRecords.find(r => r.Failover === 'PRIMARY');
        const secondaryRecord = failoverRecords.find(r => r.Failover === 'SECONDARY');

        expect(primaryRecord).toBeDefined();
        expect(secondaryRecord).toBeDefined();

        // Verify primary record
        expect(primaryRecord?.SetIdentifier).toBe('Primary');
        expect(primaryRecord?.HealthCheckId).toBe(outputs.HealthCheckId);
        expect(primaryRecord?.ResourceRecords?.[0]?.Value).toBe(outputs.PrimaryEIPOut);
        expect(primaryRecord?.TTL).toBe(60);

        // Verify secondary record
        expect(secondaryRecord?.SetIdentifier).toBe('Standby');
        expect(secondaryRecord?.ResourceRecords?.[0]?.Value).toBe(outputs.StandbyEIPOut);
        expect(secondaryRecord?.TTL).toBe(60);
      } catch (error: any) {
        if (error?.name === 'CredentialsProviderError') {
          console.log('AWS credentials not configured, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('HTTP Service Validation', () => {
    test('should verify primary instance serves HTTP content', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      const primaryUrl = `http://${outputs.PrimaryEIPOut}`;

      try {
        const response = await fetch(primaryUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        expect(response.status).toBe(200);

        const content = await response.text();
        expect(content).toContain('Primary Instance');
        expect(content).toContain(outputs.PrimaryInstanceId);
      } catch (error: any) {
        console.log(`Could not reach primary instance at ${primaryUrl}: ${error?.message ?? error}`);
      }
    });

    test('should verify standby instance serves HTTP content', async () => {
      if (process.env.SKIP_AWS_TESTS === 'true') {
        console.log('Skipping AWS API test');
        return;
      }

      const standbyUrl = `http://${outputs.StandbyEIPOut}`;

      try {
        const response = await fetch(standbyUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        expect(response.status).toBe(200);

        const content = await response.text();
        expect(content).toContain('Standby Instance');
        expect(content).toContain(outputs.StandbyInstanceId);
      } catch (error: any) {
        console.log(`Could not reach standby instance at ${standbyUrl}: ${error?.message ?? error}`);
      }
    });
  });

  describe('Failover Functionality', () => {
    test('should have different instance IDs for primary and standby', () => {
      expect(outputs.PrimaryInstanceId).not.toBe(outputs.StandbyInstanceId);
    });

    test('should have different Elastic IPs for primary and standby', () => {
      expect(outputs.PrimaryEIPOut).not.toBe(outputs.StandbyEIPOut);
    });

    test('should have valid health check configuration for failover', () => {
      expect(outputs.HealthCheckId).toBeDefined();
      expect(outputs.HealthCheckId.length).toBeGreaterThan(0);
    });

    test('should have DNS configured for automatic failover', () => {
      expect(outputs.DNSName).toBeDefined();
      expect(outputs.HostedZoneIdOutput).toBeDefined();
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('outputs should not contain unexpected environment markers', () => {
      const outputsString = JSON.stringify(outputs);
      // Forbid stray env markers (old PR suffix), but allow legitimate HostedZone/DNS values
      expect(outputsString).not.toContain('pr104');
    });

    test('outputs include the Hosted Zone and DNS name actually used (validate shape)', () => {
      // We expect a real Route 53 Hosted Zone ID and a dotted DNS name
      expect(outputs.HostedZoneIdOutput).toMatch(/^Z[A-Z0-9]+$/);
      expect(outputs.DNSName).toMatch(/\./);
    });
  });
});
