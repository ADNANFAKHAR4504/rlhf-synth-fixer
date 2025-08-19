/**
 * TypeScript representation of Terraform infrastructure configuration
 * This file provides a testable interface for our Terraform infrastructure
 */

import * as fs from 'fs';

export interface TerraformResource {
  type: string;
  name: string;
  properties: Record<string, any>;
}

export interface TerraformOutput {
  name: string;
  description: string;
  value: string;
}

export class TerraformConfig {
  private resources: TerraformResource[] = [];
  private outputs: TerraformOutput[] = [];
  private variables: Record<string, any> = {};

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupVariables();
    this.setupResources();
    this.setupOutputs();
  }

  private setupVariables(): void {
    this.variables = {
      environment_suffix: {
        description: 'Suffix for resource naming to avoid conflicts',
        type: 'string',
        default: 'dev',
      },
    };
  }

  private setupResources(): void {
    // VPC
    this.resources.push({
      type: 'aws_vpc',
      name: 'main',
      properties: {
        cidr_block: '10.0.0.0/16',
        enable_dns_hostnames: true,
        enable_dns_support: true,
        tags: {
          Name: 'vpc-${var.environment_suffix}',
        },
      },
    });

    // Internet Gateway
    this.resources.push({
      type: 'aws_internet_gateway',
      name: 'main',
      properties: {
        vpc_id: 'aws_vpc.main.id',
        tags: {
          Name: 'igw-${var.environment_suffix}',
        },
      },
    });

    // Public Subnet
    this.resources.push({
      type: 'aws_subnet',
      name: 'public',
      properties: {
        vpc_id: 'aws_vpc.main.id',
        cidr_block: '10.0.1.0/24',
        availability_zone: 'us-west-2a',
        map_public_ip_on_launch: true,
        tags: {
          Name: 'subnet-public-${var.environment_suffix}',
        },
      },
    });

    // Route Table
    this.resources.push({
      type: 'aws_route_table',
      name: 'public',
      properties: {
        vpc_id: 'aws_vpc.main.id',
        route: {
          cidr_block: '0.0.0.0/0',
          gateway_id: 'aws_internet_gateway.main.id',
        },
        tags: {
          Name: 'rt-public-${var.environment_suffix}',
        },
      },
    });

    // Route Table Association
    this.resources.push({
      type: 'aws_route_table_association',
      name: 'public',
      properties: {
        subnet_id: 'aws_subnet.public.id',
        route_table_id: 'aws_route_table.public.id',
      },
    });

    // Security Group
    this.resources.push({
      type: 'aws_security_group',
      name: 'web_security_group',
      properties: {
        name: 'web-sg-${var.environment_suffix}',
        vpc_id: 'aws_vpc.main.id',
        description:
          'Security group for EC2 instance allowing HTTP and SSH access',
        ingress: [
          {
            description: 'HTTP',
            from_port: 80,
            to_port: 80,
            protocol: 'tcp',
            cidr_blocks: ['0.0.0.0/0'],
          },
          {
            description: 'SSH',
            from_port: 22,
            to_port: 22,
            protocol: 'tcp',
            cidr_blocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            from_port: 0,
            to_port: 0,
            protocol: '-1',
            cidr_blocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: 'web-security-group-${var.environment_suffix}',
        },
      },
    });

    // EC2 Instance
    this.resources.push({
      type: 'aws_instance',
      name: 'web_server',
      properties: {
        ami: 'data.aws_ami.amazon_linux_2023.id',
        instance_type: 't3.micro',
        subnet_id: 'aws_subnet.public.id',
        vpc_security_group_ids: ['aws_security_group.web_security_group.id'],
        metadata_options: {
          http_endpoint: 'enabled',
          http_tokens: 'required',
          http_put_response_hop_limit: 1,
        },
        root_block_device: {
          volume_type: 'gp3',
          volume_size: 20,
          iops: 3000,
          encrypted: true,
          delete_on_termination: true,
          tags: {
            Name: 'web-server-root-volume-${var.environment_suffix}',
          },
        },
        tags: {
          Name: 'web-server-${var.environment_suffix}',
        },
      },
    });
  }

  private setupOutputs(): void {
    this.outputs = [
      {
        name: 'instance_id',
        description: 'ID of the EC2 instance',
        value: 'aws_instance.web_server.id',
      },
      {
        name: 'instance_public_ip',
        description: 'Public IP address of the EC2 instance',
        value: 'aws_instance.web_server.public_ip',
      },
      {
        name: 'instance_public_dns',
        description: 'Public DNS name of the EC2 instance',
        value: 'aws_instance.web_server.public_dns',
      },
      {
        name: 'security_group_id',
        description: 'ID of the security group',
        value: 'aws_security_group.web_security_group.id',
      },
      {
        name: 'vpc_id',
        description: 'ID of the VPC',
        value: 'aws_vpc.main.id',
      },
      {
        name: 'subnet_id',
        description: 'ID of the public subnet',
        value: 'aws_subnet.public.id',
      },
    ];
  }

  public getResources(): TerraformResource[] {
    return this.resources;
  }

  public getOutputs(): TerraformOutput[] {
    return this.outputs;
  }

  public getVariables(): Record<string, any> {
    return this.variables;
  }

  public getResourceByType(type: string): TerraformResource[] {
    return this.resources.filter(r => r.type === type);
  }

  public getResourceByName(name: string): TerraformResource | undefined {
    return this.resources.find(r => r.name === name);
  }

  public validateConfiguration(): boolean {
    // Validate that all required resources exist
    const requiredResourceTypes = [
      'aws_vpc',
      'aws_internet_gateway',
      'aws_subnet',
      'aws_route_table',
      'aws_route_table_association',
      'aws_security_group',
      'aws_instance',
    ];

    for (const type of requiredResourceTypes) {
      if (!this.getResourceByType(type).length) {
        return false;
      }
    }

    // Validate security group rules
    const securityGroup = this.getResourceByName('web_security_group');
    if (!securityGroup) return false;

    const ingress = securityGroup.properties.ingress;
    if (!Array.isArray(ingress) || ingress.length < 2) return false;

    const hasHTTP = ingress.some(
      rule => rule.from_port === 80 && rule.to_port === 80
    );
    const hasSSH = ingress.some(
      rule => rule.from_port === 22 && rule.to_port === 22
    );

    if (!hasHTTP || !hasSSH) return false;

    // Validate EC2 instance configuration
    const instance = this.getResourceByName('web_server');
    if (!instance) return false;

    if (instance.properties.instance_type !== 't3.micro') return false;

    const rootDevice = instance.properties.root_block_device;
    if (
      !rootDevice ||
      rootDevice.volume_type !== 'gp3' ||
      rootDevice.volume_size !== 20 ||
      rootDevice.iops !== 3000 ||
      !rootDevice.encrypted ||
      !rootDevice.delete_on_termination
    ) {
      return false;
    }

    // Validate IMDSv2 configuration
    const metadata = instance.properties.metadata_options;
    if (
      !metadata ||
      metadata.http_endpoint !== 'enabled' ||
      metadata.http_tokens !== 'required'
    ) {
      return false;
    }

    return true;
  }

  public hasEnvironmentSuffix(): boolean {
    // Check if all resources use environment suffix in their names/tags
    for (const resource of this.resources) {
      if (resource.properties.tags && resource.properties.tags.Name) {
        if (
          !resource.properties.tags.Name.includes('${var.environment_suffix}')
        ) {
          return false;
        }
      }
      if (
        resource.properties.name &&
        typeof resource.properties.name === 'string'
      ) {
        if (!resource.properties.name.includes('${var.environment_suffix}')) {
          return false;
        }
      }
    }
    return true;
  }

  public loadFromFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    // Parse the Terraform file content
    this.parseTerraformContent(content);
  }

  private parseTerraformContent(content: string): void {
    // Simple parser for Terraform content
    // This is a simplified implementation for testing purposes
    const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"\s*{/g;
    let match;

    while ((match = resourcePattern.exec(content)) !== null) {
      const [, type, name] = match;
      // Find existing resource and update if needed
      const existing = this.resources.find(
        r => r.type === type && r.name === name
      );
      if (!existing) {
        this.resources.push({
          type,
          name,
          properties: {},
        });
      }
    }
  }

  public getProviderConfig(): Record<string, any> {
    return {
      terraform: {
        required_version: '>= 1.0',
        required_providers: {
          aws: {
            source: 'hashicorp/aws',
            version: '~> 5.0',
          },
        },
        backend: 's3',
      },
      provider: {
        aws: {
          region: 'us-west-2',
          default_tags: {
            tags: {
              Environment: 'development',
              Project: 'ec2-infrastructure',
            },
          },
        },
      },
    };
  }
}
