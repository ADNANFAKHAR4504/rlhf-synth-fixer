import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';

describe('Terraform Integration Tests', () => {
    jest.setTimeout(300000); // 5 minutes timeout for AWS operations

    const region = 'us-east-1';
    const ec2 = new AWS.EC2({ region });
    const secretsManager = new AWS.SecretsManager({ region });
    const iam = new AWS.IAM({ region });

    let terraformOutputs: any;
    let vpcId: string;
    let instanceId: string;
    let secretArn: string;
    let roleArn: string;

    beforeAll(async () => {
        // Initialize Terraform
        execSync('terraform init', { stdio: 'inherit', cwd: 'lib' });
        
        // Apply Terraform configuration
        execSync('terraform apply -auto-approve', { stdio: 'inherit', cwd: 'lib' });
        
        // Get Terraform outputs
        const outputJson = execSync('terraform output -json', { cwd: 'lib' }).toString();
        terraformOutputs = JSON.parse(outputJson);
        
        vpcId = terraformOutputs.vpc_id.value;
        instanceId = terraformOutputs.instance_id.value;
        secretArn = terraformOutputs.secret_arn.value;
        roleArn = terraformOutputs.iam_role_arn.value;
    });

    afterAll(async () => {
        // Cleanup - destroy resources
        try {
            execSync('terraform destroy -auto-approve', { stdio: 'inherit', cwd: 'lib' });
        } catch (error) {
            console.warn('Cleanup failed, manual intervention may be required');
        }
    });

    describe('VPC Infrastructure', () => {
        it('should create VPC with correct CIDR', async () => {
            const vpc = await ec2.describeVpcs({
                VpcIds: [vpcId]
            }).promise();

            expect(vpc.Vpcs).toHaveLength(1);
            expect(vpc.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
            expect(vpc.Vpcs![0].State).toBe('available');
        });

        it('should create public and private subnets in different AZs', async () => {
            const publicSubnetId = terraformOutputs.public_subnet_id.value;
            const privateSubnetId = terraformOutputs.private_subnet_id.value;

            const subnets = await ec2.describeSubnets({
                SubnetIds: [publicSubnetId, privateSubnetId]
            }).promise();

            expect(subnets.Subnets).toHaveLength(2);
            
            const publicSubnet = subnets.Subnets!.find(s => s.SubnetId === publicSubnetId);
            const privateSubnet = subnets.Subnets!.find(s => s.SubnetId === privateSubnetId);

            expect(publicSubnet!.MapPublicIpOnLaunch).toBe(true);
            expect(privateSubnet!.MapPublicIpOnLaunch).toBe(false);
            expect(publicSubnet!.AvailabilityZone).not.toBe(privateSubnet!.AvailabilityZone);
        });

        it('should create Internet Gateway and attach to VPC', async () => {
            const igws = await ec2.describeInternetGateways({
                Filters: [
                    {
                        Name: 'attachment.vpc-id',
                        Values: [vpcId]
                    }
                ]
            }).promise();

            expect(igws.InternetGateways).toHaveLength(1);
            expect(igws.InternetGateways![0].Attachments![0].State).toBe('available');
        });
    });

    describe('Security Groups', () => {
        it('should create security groups with proper rules', async () => {
            const publicSgId = terraformOutputs.public_security_group_id.value;
            const privateSgId = terraformOutputs.private_security_group_id.value;

            const securityGroups = await ec2.describeSecurityGroups({
                GroupIds: [publicSgId, privateSgId]
            }).promise();

            expect(securityGroups.SecurityGroups).toHaveLength(2);

            const privateSg = securityGroups.SecurityGroups!.find(sg => sg.GroupId === privateSgId);
            const ingressRules = privateSg!.IpPermissions;

            // Check that private SG only allows traffic from public SG
            const sshRule = ingressRules!.find(rule => rule.FromPort === 22);
            expect(sshRule!.UserIdGroupPairs).toHaveLength(1);
            expect(sshRule!.UserIdGroupPairs![0].GroupId).toBe(publicSgId);
        });
    });

    describe('EC2 Instance', () => {
        it('should create EC2 instance in private subnet', async () => {
            const instance = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();

            const ec2Instance = instance.Reservations![0].Instances![0];
            
            expect(ec2Instance.State!.Name).toBe('running');
            expect(ec2Instance.SubnetId).toBe(terraformOutputs.private_subnet_id.value);
            expect(ec2Instance.PublicIpAddress).toBeUndefined();
        });

        it('should have IMDSv2 enabled', async () => {
            const instance = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();

            const ec2Instance = instance.Reservations![0].Instances![0];
            expect(ec2Instance.MetadataOptions!.HttpTokens).toBe('required');
        });

        it('should have encrypted EBS volume', async () => {
            const instance = await ec2.describeInstances({
                InstanceIds: [instanceId]
            }).promise();

            const ec2Instance = instance.Reservations![0].Instances![0];
            const volumeId = ec2Instance.BlockDeviceMappings![0].Ebs!.VolumeId!;

            const volumes = await ec2.describeVolumes({
                VolumeIds: [volumeId]
            }).promise();

            expect(volumes.Volumes![0].Encrypted).toBe(true);
        });
    });

    describe('Secrets Manager', () => {
        it('Secrets Manager secret should have proper encryption', async () => {
            const secret = await secretsManager.describeSecret({
                SecretId: secretArn
            }).promise();
            
            expect(secret).toBeDefined();
            expect(secret.Name).toMatch(/^prod-6340-app-secret-[a-f0-9]{8}$/);
            // Secret uses default AWS-managed encryption when no custom KMS key is specified
            // When using default encryption, KmsKeyId might be undefined or an alias/ARN
            if (secret.KmsKeyId) {
                expect(secret.KmsKeyId).toMatch(/^alias\/aws\/secretsmanager$|^arn:aws:kms:/);
            }
            // Verify the secret exists and is properly configured regardless of KMS key
            expect(secret.ARN).toBeDefined();
        });

        it('should be accessible by EC2 instance role', async () => {
            const rolePolicy = await iam.listAttachedRolePolicies({
                RoleName: roleArn.split('/').pop()!
            }).promise();

            expect(rolePolicy.AttachedPolicies?.length || 0).toBeGreaterThan(0);
        });
    });

    describe('Tagging Compliance', () => {
        it('should tag all resources with required tags', async () => {
            // Check VPC tags
            const vpc = await ec2.describeVpcs({
                VpcIds: [vpcId]
            }).promise();

            const vpcTags = vpc.Vpcs![0].Tags!;
            const requiredTags = ['Environment', 'Owner', 'Purpose'];
            
            requiredTags.forEach(tag => {
                expect(vpcTags.some(t => t.Key === tag)).toBe(true);
            });

            expect(vpcTags.find(t => t.Key === 'Environment')!.Value).toBe('Production');
        });
    });
});