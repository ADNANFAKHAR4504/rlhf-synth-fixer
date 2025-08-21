export interface AppConfig {
  projectName: string;
  environment: string;
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  dbSubnetCidrs: string[];
  instanceType: string;
  dbInstanceClass: string;
  domainName?: string;
  tags: Record<string, string>;
}

export const config: AppConfig = {
  projectName: 'scalable-web-app',
  environment: 'production',
  region: 'us-east-1',
  availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
  privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
  dbSubnetCidrs: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'],
  instanceType: 't3.medium',
  dbInstanceClass: 'db.t3.micro',
  // domainName: 'example.com', // Disabled until valid hosted zone is available
  tags: {
    Project: 'scalable-web-app',
    Environment: 'production',
    Owner: 'DevOps Team',
    CostCenter: 'Engineering',
    ManagedBy: 'Terraform-CDKTF',
  },
};
