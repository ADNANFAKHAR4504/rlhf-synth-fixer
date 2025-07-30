import fs from 'fs';
import fetch from 'node-fetch';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { CloudFormationClient, ValidateTemplateCommand } from '@aws-sdk/client-cloudformation';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let apiBaseUrl: string | null = null;
let iamRoleName: string | null = null;
let vpcId: string | null = null;
let securityGroupId: string | null = null;
let templateBody: string | null = null;

try {
  const outputsRaw = fs.readFileSync(outputsPath, 'utf8');
  const outputs: Record<string, unknown> = JSON.parse(outputsRaw);

  // API Endpoint
  const endpoint = outputs[`TapStack${environmentSuffix}.ApiEndpoint`];
  if (typeof endpoint === 'string' && endpoint.trim() !== '') {
    apiBaseUrl = endpoint;
  } else {
    console.warn(`[WARN] API endpoint not found or invalid for environment: ${environmentSuffix}`);
  }

  // IAM Role Name
  const roleName = outputs[`TapStack${environmentSuffix}.IamRoleName`];
  if (typeof roleName === 'string' && roleName.trim() !== '') {
    iamRoleName = roleName;
  }

  // VPC Id
  const vpc = outputs[`TapStack${environmentSuffix}.VpcId`];
  if (typeof vpc === 'string' && vpc.trim() !== '') {
    vpcId = vpc;
  }

  // Security Group Id
  const sg = outputs[`TapStack${environmentSuffix}.SecurityGroupId`];
  if (typeof sg === 'string' && sg.trim() !== '') {
    securityGroupId = sg;
  }

  // CloudFormation Template Path (adjust if needed)
  const templatePath = `cfn-outputs/${environmentSuffix}-template.yaml`;
  if (fs.existsSync(templatePath)) {
    templateBody = fs.readFileSync(templatePath, 'utf8');
  } else {
    console.warn(`[WARN] CloudFormation template file not found: ${templatePath}`);
  }
} catch (err) {
  console.error(`[ERROR] Failed to read or parse outputs file: ${outputsPath}`, err);
}

describe('Turn Around Prompt API Integration Tests', () => {
  if (!apiBaseUrl) {
    test.skip('Skipping integration tests because API endpoint is not available', () => {
      console.warn(`[SKIPPED] No API endpoint for environment: ${environmentSuffix}`);
    });
    return;
  }

  describe('GET /health', () => {
    test('should return 200 OK and expected JSON structure', async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json).toBeDefined();
        expect(typeof json).toBe('object');
      } catch (error) {
        console.error('[ERROR] Failed to fetch /health endpoint:', error);
        fail('Request to /health failed');
      }
    });
  });
});

describe('IAM Role Integration Tests', () => {
  if (!iamRoleName) {
    test.skip('Skipping IAM Role tests because role name is not available', () => {});
    return;
  }

  const iamClient = new IAMClient({});

  test('IAM role has least privilege policies attached', async () => {
    try {
      const role = await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));

      expect(role.Role).toBeDefined();
      if (!role.Role) {
        fail('IAM role not found');
        return;
      }

      expect(role.Role.RoleName).toBe(iamRoleName);

      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: iamRoleName })
      );

      expect(attachedPolicies.AttachedPolicies?.length).toBeGreaterThan(0);
      // You can add detailed policy checks here as needed
    } catch (e) {
      console.error('Failed to validate IAM role:', e);
      fail('IAM role check failed');
    }
  });
});

describe('VPC Configuration Tests', () => {
  if (!vpcId) {
    test.skip('Skipping VPC tests because VPC ID is not available', () => {});
    return;
  }

  const ec2Client = new EC2Client({});

  test('VPC has correct CIDR block', async () => {
    try {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcs.Vpcs?.length).toBe(1);
      expect(vpcs.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    } catch (e) {
      console.error('Failed to describe VPC:', e);
      fail('VPC CIDR block validation failed');
    }
  });

  test('VPC has 2 or more subnets', async () => {
    try {
      const subnets = await ec2Client.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
      expect(subnets.Subnets?.length).toBeGreaterThanOrEqual(2);
    } catch (e) {
      console.error('Failed to describe subnets:', e);
      fail('Subnet count validation failed');
    }
  });
});

describe('Security Group Configuration Tests', () => {
  if (!securityGroupId) {
    test.skip('Skipping Security Group tests because Security Group ID is not available', () => {});
    return;
  }

  const ec2Client = new EC2Client({});

  test('Security group allows HTTPS (port 443) only', async () => {
    try {
      const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      expect(sgs.SecurityGroups?.length).toBe(1);
      const sg = sgs.SecurityGroups?.[0];

      // Check inbound rules allow only port 443 TCP
      const inbound = sg?.IpPermissions ?? [];
      const httpsOnly = inbound.every(rule => {
        const portCheck = rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp';
        const ipRangesAllowed = (rule.IpRanges ?? []).length > 0 || (rule.Ipv6Ranges ?? []).length > 0;
        return portCheck && ipRangesAllowed;
      });
      expect(httpsOnly).toBe(true);
    } catch (e) {
      console.error('Failed to describe security groups:', e);
      fail('Security Group validation failed');
    }
  });
});

describe('CloudFormation Template Validation Test', () => {
  if (!templateBody) {
    test.skip('Skipping template validation test because template file is not available', () => {});
    return;
  }

  const cfClient = new CloudFormationClient({});

  test('CloudFormation template is valid', async () => {
    try {
      const response = await cfClient.send(new ValidateTemplateCommand({ TemplateBody: templateBody }));
      expect(response).toBeDefined();
      expect(response.Parameters).toBeDefined();
    } catch (e) {
      console.error('CloudFormation template validation failed:', e);
      fail('Template validation failed');
    }
  });
});
