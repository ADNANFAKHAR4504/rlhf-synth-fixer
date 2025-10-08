import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  IamModule,
  SecretsManagerModule,
  S3Module,
  RdsModule,
  Ec2Module,
  MonitoringModule,
  LoggingModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Project: 'WebAppInfra',
            ManagedBy: 'CDKTF',
            Owner: 'Platform Team',
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Common tags
    const commonTags = {
      Environment: 'Production',
      Project: 'WebAppInfra',
      Stack: id,
      IaC: 'CDKTF',
    };

    // 1. VPC Module
    const vpc = new VpcModule(this, 'vpc-module', {
      cidrBlock: '10.0.0.0/16',
      azCount: 2,
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      tags: commonTags,
    });

    // 2. S3 Module
    const s3 = new S3Module(this, 's3-module', {
      bucketName: `tap-webapp-assets-${Date.now()}`,
      tags: commonTags,
    });

    // 3. Secrets Manager Module
    const secrets = new SecretsManagerModule(this, 'secrets-module', {
      tags: commonTags,
    });

    // 4. IAM Module
    const iam = new IamModule(this, 'iam-module', {
      s3BucketArn: s3.bucket.arn,
      secretArn: secrets.dbSecret.arn,
      tags: commonTags,
    });

    // 5. RDS Module

    const rds = new RdsModule(this, 'rds-module', {
      vpcId: vpc.vpc.id,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      securityGroupId: vpc.securityGroupDatabase.id,
      dbName: 'tapwebapp',
      username: process.env.DB_USERNAME || 'admin',
      tags: commonTags,
    });

    // 6. Logging Module
    const logging = new LoggingModule(this, 'logging-module', {
      retentionDays: 30,
      tags: commonTags,
    });

    // 7. EC2 Module with User Data
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and start Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create simple web page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Web Application</title>
</head>
<body>
    <h1>Welcome to TAP Infrastructure</h1>
    <p>This application is running on AWS infrastructure provisioned with CDKTF.</p>
    <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
    <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${logging.logGroup.name}",
            "log_stream_name": "{instance_id}/apache-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${logging.logGroup.name}",
            "log_stream_name": "{instance_id}/apache-error"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "TAPWebApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
`;

    const ec2 = new Ec2Module(this, 'ec2-module', {
      vpcId: vpc.vpc.id,
      publicSubnetIds: vpc.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      securityGroupId: vpc.securityGroupWeb.id,
      instanceProfileArn: iam.ec2InstanceProfile.arn,
      userData: userData,
      tags: commonTags,
    });

    // 8. Monitoring Module
    const monitoring = new MonitoringModule(this, 'monitoring-module', {
      autoScalingGroupName: ec2.autoScalingGroup.name,
      dbInstanceId: rds.dbInstance.id,
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns', {
      value: ec2.applicationLoadBalancer.dnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'auto-scaling-group', {
      value: ec2.autoScalingGroup.name,
      description: 'Auto Scaling Group Name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS Instance Endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 's3-bucket', {
      value: s3.bucket.id,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 'cloudwatch-dashboard', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new TerraformOutput(this, 'log-group', {
      value: logging.logGroup.name,
      description: 'CloudWatch Log Group Name',
    });

    new TerraformOutput(this, 'rds-secret-arn', {
      value: rds.dbInstance.masterUserSecret.get(0).secretArn,
      description: 'RDS Master User Secret ARN (managed by RDS)',
      sensitive: true,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
