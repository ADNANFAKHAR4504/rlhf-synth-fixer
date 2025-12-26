# Model Response

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

class SecureAwsInfrastructure extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'SecureWebApp',
      ManagedBy: 'Terraform-CDK',
    };

    // AWS Provider
    new AwsProvider(this, 'AWS', {
      region: 'us-west-2',
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    // Data sources
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    const amazonLinux = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // VPC
    const vpc = new Vpc(this, 'secure-network', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'secure-network',
        ...commonTags,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'main-igw',
        ...commonTags,
      },
    });

    // Public Subnet
    const publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: availabilityZones.names.get(0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'public-subnet',
        Type: 'Public',
        ...commonTags,
      },
    });

    // Route Table for Public Subnet
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'public-route-table',
        ...commonTags,
      },
    });

    // Route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate Route Table with Public Subnet
    new RouteTableAssociation(this, 'public-rt-association', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for Web Server
    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: 'web-security-group',
      description: 'Security group for web server - allows HTTP and HTTPS',
      vpcId: vpc.id,

      ingress: [
        {
          description: 'HTTP',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          description: 'HTTPS',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          description: 'SSH for management',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // In production, restrict this to specific IPs
        },
      ],

      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      tags: {
        Name: 'web-security-group',
        ...commonTags,
      },
    });

    // Network ACL for additional security
    const publicNetworkAcl = new NetworkAcl(this, 'public-nacl', {
      vpcId: vpc.id,
      tags: {
        Name: 'public-network-acl',
        ...commonTags,
      },
    });

    // Network ACL Rules - Inbound
    new NetworkAclRule(this, 'nacl-inbound-http', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'nacl-inbound-https', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'nacl-inbound-ssh', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 22,
      toPort: 22,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'nacl-inbound-ephemeral', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 130,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    // Network ACL Rules - Outbound
    new NetworkAclRule(this, 'nacl-outbound-http', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    new NetworkAclRule(this, 'nacl-outbound-https', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    new NetworkAclRule(this, 'nacl-outbound-ephemeral', {
      networkAclId: publicNetworkAcl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate Network ACL with Public Subnet
    new NetworkAclAssociation(this, 'public-nacl-association', {
      networkAclId: publicNetworkAcl.id,
      subnetId: publicSubnet.id,
    });

    // S3 Bucket for logs
    const logsBucket = new S3Bucket(this, 'web-app-logs', {
      bucket: `web-app-logs-${Math.random().toString(36).substring(2, 15)}`,
      tags: {
        Name: 'web-app-logs-bucket',
        Purpose: 'Application Logs',
        ...commonTags,
      },
    });

    // S3 Bucket Server-Side Encryption
    new S3BucketServerSideEncryptionConfiguration(
      this,
      'logs-bucket-encryption',
      {
        bucket: logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // IAM Role for EC2 Instance
    const ec2Role = new IamRole(this, 'ec2-logs-role', {
      name: 'ec2-logs-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: 'ec2-logs-role',
        ...commonTags,
      },
    });

    // IAM Policy for S3 Access (Least Privilege)
    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: 'ec2-s3-logs-policy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `${logsBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: logsBucket.arn,
          },
        ],
      }),
    });

    // IAM Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'ec2-instance-profile',
        role: ec2Role.name,
      }
    );

    // S3 Bucket Policy to restrict access to EC2 role only
    new S3BucketPolicy(this, 'logs-bucket-policy', {
      bucket: logsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowEC2RoleAccess',
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
            Resource: [logsBucket.arn, `${logsBucket.arn}/*`],
          },
          {
            Sid: 'DenyAllOthers',
            Effect: 'Deny',
            NotPrincipal: {
              AWS: ec2Role.arn,
            },
            Action: 's3:*',
            Resource: [logsBucket.arn, `${logsBucket.arn}/*`],
          },
        ],
      }),
    });

    // EC2 Instance
    const webServer = new Instance(this, 'web-server', {
      ami: amazonLinux.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,

      userData: `#!/bin/bash
yum update -y
yum install -y httpd aws-cli
systemctl start httpd
systemctl enable httpd
# Create a simple web page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Secure Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .security-badge { background: #28a745; color: white; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1> Secure Web Application</h1>
        <div class="security-badge">
             Deployed with AWS Security Best Practices
        </div>
        <h2>Security Features Implemented:</h2>
        <ul>
            <li>VPC with proper network segmentation</li>
            <li>Security Groups with minimal required ports</li>
            <li>Network ACLs for additional protection</li>
            <li>IAM roles with least privilege access</li>
            <li>S3 bucket with server-side encryption</li>
            <li>Proper resource tagging</li>
        </ul>
        <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p><strong>Region:</strong> us-west-2</p>
    </div>
</body>
</html>
EOF
# Configure log rotation and S3 upload
cat > /etc/logrotate.d/httpd-s3 << 'EOF'
/var/log/httpd/*log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        aws s3 cp /var/log/httpd/ s3://${logsBucket.bucket}/httpd-logs/ --recursive --exclude "*" --include "*.gz" --region us-west-2
    endscript
}
EOF
# Set up CloudWatch agent for additional monitoring
yum install -y amazon-cloudwatch-agent
`,

      tags: {
        Name: 'secure-web-server',
        Role: 'WebServer',
        ...commonTags,
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: publicSubnet.id,
      description: 'ID of the public subnet',
    });

    new TerraformOutput(this, 'web-server-public-ip', {
      value: webServer.publicIp,
      description: 'Public IP address of the web server',
    });

    new TerraformOutput(this, 'web-server-public-dns', {
      value: webServer.publicDns,
      description: 'Public DNS name of the web server',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket,
      description: 'Name of the S3 bucket for logs',
    });

    new TerraformOutput(this, 'security-group-id', {
      value: webSecurityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'web-application-url', {
      value: `http://${webServer.publicDns}`,
      description: 'URL to access the web application',
    });
  }
}

const app = new App();
new SecureAwsInfrastructure(app, 'secure-aws-infrastructure');
app.synth();
```
