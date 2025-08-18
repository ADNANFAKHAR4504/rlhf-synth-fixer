I'll create a comprehensive IPv6-only IoT infrastructure using CDKTF TypeScript with modular architecture. Here's the implementation:

## 📁 `lib/modules.ts`

```typescript
import { Construct } from "constructs";
import { 
  Vpc, 
  Subnet, 
  InternetGateway, 
  RouteTable, 
  Route, 
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  IamRole,
  IamInstanceProfile,
  IamRolePolicyAttachment,
  DataAwsAmi,
  KeyPair
} from "@cdktf/provider-aws";

// Common tags interface
interface CommonTags {
  Environment: string;
  Project: string;
  Cloud: string;
}

// IPv6-Only VPC Module
export interface IPv6VpcConfig {
  name: string;
  tags: CommonTags;
}

export class IPv6VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, config: IPv6VpcConfig) {
    super(scope, id);

    // Create IPv6-only VPC (no IPv4 CIDR)
    this.vpc = new Vpc(this, "vpc", {
      assignGeneratedIpv6CidrBlock: true,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-ipv6-vpc`,
        ...config.tags,
      },
    });

    // Create Internet Gateway for IPv6
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-ipv6-igw`,
        ...config.tags,
      },
    });
  }
}

// IPv6 Subnet Module
export interface IPv6SubnetConfig {
  name: string;
  vpcId: string;
  availabilityZone: string;
  ipv6CidrBlock: string;
  isPublic: boolean;
  tags: CommonTags;
}

export class IPv6SubnetModule extends Construct {
  public readonly subnet: Subnet;
  public readonly routeTable: RouteTable;
  public readonly routeTableAssociation: RouteTableAssociation;

  constructor(scope: Construct, id: string, config: IPv6SubnetConfig) {
    super(scope, id);

    // Create IPv6-only subnet
    this.subnet = new Subnet(this, "subnet", {
      vpcId: config.vpcId,
      availabilityZone: config.availabilityZone,
      ipv6CidrBlock: config.ipv6CidrBlock,
      assignIpv6AddressOnCreation: true,
      mapPublicIpOnLaunch: false, // No IPv4 public IPs
      tags: {
        Name: `${config.name}-ipv6-${config.isPublic ? 'public' : 'private'}-subnet`,
        Type: config.isPublic ? 'Public' : 'Private',
        ...config.tags,
      },
    });

    // Create route table
    this.routeTable = new RouteTable(this, "route-table", {
      vpcId: config.vpcId,
      tags: {
        Name: `${config.name}-ipv6-${config.isPublic ? 'public' : 'private'}-rt`,
        ...config.tags,
      },
    });

    // Associate route table with subnet
    this.routeTableAssociation = new RouteTableAssociation(this, "rt-association", {
      subnetId: this.subnet.id,
      routeTableId: this.routeTable.id,
    });
  }

  public addInternetRoute(internetGatewayId: string): void {
    new Route(this, "internet-route", {
      routeTableId: this.routeTable.id,
      destinationIpv6CidrBlock: "::/0",
      gatewayId: internetGatewayId,
    });
  }
}

// IPv6 Security Group Module
export interface IPv6SecurityGroupConfig {
  name: string;
  description: string;
  vpcId: string;
  tags: CommonTags;
}

export class IPv6SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: IPv6SecurityGroupConfig) {
    super(scope, id);

    // Create IPv6-only security group
    this.securityGroup = new SecurityGroup(this, "sg", {
      name: `${config.name}-ipv6-sg`,
      description: config.description,
      vpcId: config.vpcId,
      tags: {
        Name: `${config.name}-ipv6-sg`,
        ...config.tags,
      },
    });

    // Allow HTTP traffic over IPv6
    new SecurityGroupRule(this, "http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow HTTP over IPv6",
    });

    // Allow HTTPS traffic over IPv6
    new SecurityGroupRule(this, "https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow HTTPS over IPv6",
    });

    // Allow SSH over IPv6 (for management)
    new SecurityGroupRule(this, "ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow SSH over IPv6",
    });

    // Allow IoT MQTT over IPv6
    new SecurityGroupRule(this, "mqtt-ingress", {
      type: "ingress",
      fromPort: 1883,
      toPort: 1883,
      protocol: "tcp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow MQTT over IPv6",
    });

    // Allow all outbound IPv6 traffic
    new SecurityGroupRule(this, "all-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow all outbound IPv6 traffic",
    });

    // Allow all outbound UDP IPv6 traffic
    new SecurityGroupRule(this, "all-udp-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "udp",
      ipv6CidrBlocks: ["::/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow all outbound UDP IPv6 traffic",
    });
  }
}

// IAM Role Module for EC2
export interface IamRoleConfig {
  name: string;
  tags: CommonTags;
}

export class IamRoleModule extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamRoleConfig) {
    super(scope, id);

    // Create IAM role for EC2
    this.role = new IamRole(this, "role", {
      name: `${config.name}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: {
        Name: `${config.name}-ec2-role`,
        ...config.tags,
      },
    });

    // Attach basic EC2 permissions
    new IamRolePolicyAttachment(this, "ssm-policy", {
      role: this.role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    });

    // Attach CloudWatch agent permissions
    new IamRolePolicyAttachment(this, "cloudwatch-policy", {
      role: this.role.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, "instance-profile", {
      name: `${config.name}-ec2-profile`,
      role: this.role.name,
      tags: {
        Name: `${config.name}-ec2-profile`,
        ...config.tags,
      },
    });
  }
}

// EC2 Instance Module for IoT Application
export interface IoTInstanceConfig {
  name: string;
  subnetId: string;
  securityGroupIds: string[];
  instanceProfileName: string;
  keyName?: string;
  tags: CommonTags;
}

export class IoTInstanceModule extends Construct {
  public readonly instance: Instance;
  public readonly keyPair: KeyPair;

  constructor(scope: Construct, id: string, config: IoTInstanceConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    // Create key pair for SSH access
    this.keyPair = new KeyPair(this, "key-pair", {
      keyName: `${config.name}-iot-key`,
      tags: {
        Name: `${config.name}-iot-key`,
        ...config.tags,
      },
    });

    // User data script for IPv6-only IoT application
    const userData = `#!/bin/bash
yum update -y
yum install -y python3 python3-pip

# Create IoT application directory
mkdir -p /opt/iot-app
cd /opt/iot-app

# Create a simple IPv6-only Flask IoT API
cat > app.py << 'EOF'
from flask import Flask, jsonify, request
import json
import datetime
import socket

app = Flask(__name__)

# Store IoT device data
iot_data = []

@app.route('/')
def home():
    return jsonify({
        "service": "IPv6 IoT Gateway",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat(),
        "ipv6_address": get_ipv6_address()
    })

@app.route('/devices', methods=['GET'])
def get_devices():
    return jsonify({
        "devices": iot_data,
        "count": len(iot_data)
    })

@app.route('/devices', methods=['POST'])
def add_device_data():
    data = request.get_json()
    if data:
        data['timestamp'] = datetime.datetime.now().isoformat()
        data['source_ip'] = request.environ.get('REMOTE_ADDR')
        iot_data.append(data)
        return jsonify({"status": "success", "data": data}), 201
    return jsonify({"error": "Invalid data"}), 400

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "ipv6_only": True,
        "timestamp": datetime.datetime.now().isoformat()
    })

def get_ipv6_address():
    try:
        # Get IPv6 address
        hostname = socket.gethostname()
        return socket.getaddrinfo(hostname, None, socket.AF_INET6)[0][4][0]
    except:
        return "unknown"

if __name__ == '__main__':
    # Bind to all IPv6 interfaces
    app.run(host='::', port=80, debug=False)
EOF

# Install Flask
pip3 install flask

# Create systemd service
cat > /etc/systemd/system/iot-app.service << 'EOF'
[Unit]
Description=IPv6 IoT Gateway Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/iot-app
ExecStart=/usr/bin/python3 /opt/iot-app/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable iot-app
systemctl start iot-app

# Configure IPv6 networking
echo 'net.ipv6.conf.all.disable_ipv6 = 0' >> /etc/sysctl.conf
echo 'net.ipv6.conf.default.disable_ipv6 = 0' >> /etc/sysctl.conf
sysctl -p

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
`;

    // Create EC2 instance
    this.instance = new Instance(this, "instance", {
      ami: ami.id,
      instanceType: "t3.micro",
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: config.instanceProfileName,
      keyName: this.keyPair.keyName,
      userData: Buffer.from(userData).toString('base64'),
      ipv6AddressCount: 1, // Assign one IPv6 address
      tags: {
        Name: `${config.name}-iot-instance`,
        ...config.tags,
      },
    });
  }
}
```

## 📁 `lib/tap-stack.ts`

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  IPv6VpcModule,
  IPv6SubnetModule,
  IPv6SecurityGroupModule,
  IamRoleModule,
  IoTInstanceModule,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common configuration
    const region = "us-west-2";
    const projectName = "tap-ipv6-iot";
    const commonTags = {
      Environment: "dev",
      Project: "IPv6-IoT",
      Cloud: "AWS",
    };

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: region,
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    // Create IPv6-only VPC
    const vpcModule = new IPv6VpcModule(this, "vpc-module", {
      name: projectName,
      tags: commonTags,
    });

    // Create public subnet for IoT instances
    const publicSubnetModule = new IPv6SubnetModule(this, "public-subnet-module", {
      name: projectName,
      vpcId: vpcModule.vpc.id,
      availabilityZone: `${region}a`,
      ipv6CidrBlock: `\${cidrsubnet(${vpcModule.vpc.ipv6CidrBlock}, 8, 1)}`,
      isPublic: true,
      tags: commonTags,
    });

    // Add internet route to public subnet
    publicSubnetModule.addInternetRoute(vpcModule.internetGateway.id);

    // Create private subnet for backend services
    const privateSubnetModule = new IPv6SubnetModule(this, "private-subnet-module", {
      name: projectName,
      vpcId: vpcModule.vpc.id,
      availabilityZone: `${region}b`,
      ipv6CidrBlock: `\${cidrsubnet(${vpcModule.vpc.ipv6CidrBlock}, 8, 2)}`,
      isPublic: false,
      tags: commonTags,
    });

    // Create security group for IoT applications
    const securityGroupModule = new IPv6SecurityGroupModule(this, "sg-module", {
      name: projectName,
      description: "Security group for IPv6-only IoT applications",
      vpcId: vpcModule.vpc.id,
      tags: commonTags,
    });

    // Create IAM role for EC2 instances
    const iamRoleModule = new IamRoleModule(this, "iam-module", {
      name: projectName,
      tags: commonTags,
    });

    // Create IoT application instance
    const iotInstanceModule = new IoTInstanceModule(this, "iot-instance-module", {
      name: projectName,
      subnetId: publicSubnetModule.subnet.id,
      securityGroupIds: [securityGroupModule.securityGroup.id],
      instanceProfileName: iamRoleModule.instanceProfile.name,
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      description: "ID of the IPv6-only VPC",
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, "vpc-ipv6-cidr", {
      description: "IPv6 CIDR block of the VPC",
      value: vpcModule.vpc.ipv6CidrBlock,
    });

    new TerraformOutput(this, "public-subnet-id", {
      description: "ID of the public IPv6 subnet",
      value: publicSubnetModule.subnet.id,
    });

    new TerraformOutput(this, "private-subnet-id", {
      description: "ID of the private IPv6 subnet",
      value: privateSubnetModule.subnet.id,
    });

    new TerraformOutput(this, "security-group-id", {
      description: "ID of the IPv6 security group",
      value: securityGroupModule.securityGroup.id,
    });

    new TerraformOutput(this, "iot-instance-id", {
      description: "ID of the IoT application instance",
      value: iotInstanceModule.instance.id,
    });

    new TerraformOutput(this, "iot-instance-ipv6-address", {
      description: "IPv6 address of the IoT application instance",
      value: `\${element(${iotInstanceModule.instance.ipv6Addresses}, 0)}`,
    });

    new TerraformOutput(this, "iot-instance-public-dns", {
      description: "Public DNS name of the IoT instance",
      value: iotInstanceModule.instance.publicDns,
    });

    new TerraformOutput(this, "ssh-key-name", {
      description: "Name of the SSH key pair",
      value: iotInstanceModule.keyPair.keyName,
    });

    new TerraformOutput(this, "iot-api-endpoints", {
      description: "IoT API endpoints",
      value: {
        health: `http://[${`\${element(${iotInstanceModule.instance.ipv6Addresses}, 0)}`}]/health`,
        devices: `http://[${`\${element(${iotInstanceModule.instance.ipv6Addresses}, 0)}`}]/devices`,
        home: `http://[${`\${element(${iotInstanceModule.instance.ipv6Addresses}, 0)}`}]/`,
      },
    });
  }
}
```

## 🔧 Key Features Explained

### **IPv6-Only Architecture**
- **No IPv4 CIDR**: VPC uses only `assignGeneratedIpv6CidrBlock: true`
- **IPv6 Subnets**: All subnets use IPv6 CIDR blocks with `assignIpv6AddressOnCreation: true`
- **IPv6 Routes**: Route tables use `::/0` for internet access via IPv6 IGW
- **IPv6 Security Groups**: All rules use `ipv6CidrBlocks` instead of `cidrBlocks`

### **Modular Design**
- **`IPv6VpcModule`**: Creates VPC and Internet Gateway
- **`IPv6SubnetModule`**: Creates subnets with route tables and associations
- **`IPv6SecurityGroupModule`**: Creates security groups with IPv6 rules
- **`IamRoleModule`**: Creates IAM roles and instance profiles
- **`IoTInstanceModule`**: Creates EC2 instances with IoT applications

### **IoT Application**
- **Flask API**: Simple REST API for IoT device data collection
- **IPv6 Binding**: Application binds to `::` (all IPv6 interfaces)
- **Endpoints**:
  - `/` - Service information
  - `/devices` - GET/POST IoT device data
  - `/health` - Health check endpoint

### **Security**
- **Least Privilege IAM**: Only necessary permissions for EC2 and CloudWatch
- **IPv6 Security Groups**: Allows HTTP, HTTPS, SSH, and MQTT over IPv6
- **No IPv4 Access**: Complete isolation from IPv4 networks

### **Production Features**
- **Systemd Service**: IoT app runs as a system service with auto-restart
- **CloudWatch Integration**: Monitoring and logging capabilities
- **SSH Access**: Secure management via IPv6 SSH
- **Comprehensive Outputs**: All necessary resource IDs and addresses

This infrastructure provides a robust, scalable foundation for IPv6-only IoT applications on AWS, with clear separation of concerns through modular design.