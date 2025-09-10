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
        try {
            // First, validate AWS credentials and connectivity
            console.log('Validating AWS credentials...');
            
            // Test AWS connectivity using the AWS SDK
            try {
                const sts = new AWS.STS({ region });
                const identity = await sts.getCallerIdentity().promise();
                console.log(`AWS credentials validated. Account: ${identity.Account}, User/Role: ${identity.Arn}`);
            } catch (awsError: any) {
                console.error('AWS credential validation failed:', awsError.message);
                throw new Error(`AWS credentials not properly configured: ${awsError.message}. Please check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_DEFAULT_REGION environment variables.`);
            }

            console.log('Initializing Terraform...');
            
            // Initialize Terraform
            execSync('terraform init', { stdio: 'inherit', cwd: 'lib' });
            
            console.log('Applying Terraform configuration...');
            
            // Apply Terraform configuration with integration test variables
            execSync('terraform apply -auto-approve -var-file=terraform.tfvars.integration', { 
                stdio: 'inherit', 
                cwd: 'lib' 
            });
            
            // Get Terraform outputs
            const outputJson = execSync('terraform output -json', { cwd: 'lib' }).toString();
            terraformOutputs = JSON.parse(outputJson);
            
            vpcId = terraformOutputs.vpc_id.value;
            instanceId = terraformOutputs.instance_id.value;
            secretArn = terraformOutputs.secret_arn.value;
            roleArn = terraformOutputs.iam_role_arn.value;
            
            console.log('Infrastructure deployed successfully');
        } catch (error: any) {
            // Check if the error is related to state lock
            if (error.message && error.message.includes('Error acquiring the state lock')) {
                console.error('Terraform state is locked. Attempting to resolve...');
                
                // Extract lock ID from error message if available
                const lockIdMatch = error.message.match(/ID:\s+([a-f0-9\-]+)/);
                if (lockIdMatch) {
                    const lockId = lockIdMatch[1];
                    console.log(`Attempting to unlock state with lock ID: ${lockId}`);
                    
                    try {
                        // Try to force unlock
                        execSync(`terraform force-unlock -force ${lockId}`, { 
                            stdio: 'inherit', 
                            cwd: 'lib' 
                        });
                        console.log('State unlocked successfully, retrying terraform apply...');
                        
                        // Retry the apply
                        execSync('terraform apply -auto-approve -var-file=terraform.tfvars.integration', { 
                            stdio: 'inherit', 
                            cwd: 'lib' 
                        });
                        
                        // Get Terraform outputs
                        const outputJson = execSync('terraform output -json', { cwd: 'lib' }).toString();
                        terraformOutputs = JSON.parse(outputJson);
                        
                        vpcId = terraformOutputs.vpc_id.value;
                        instanceId = terraformOutputs.instance_id.value;
                        secretArn = terraformOutputs.secret_arn.value;
                        roleArn = terraformOutputs.iam_role_arn.value;
                    } catch (unlockError) {
                        console.error('Failed to unlock state automatically. Manual intervention required.');
                        console.error('Run: cd lib && rm -f .terraform.tfstate.lock.info');
                        throw unlockError;
                    }
                } else {
                    console.error('Could not extract lock ID from error message. Manual intervention required.');
                    console.error('Run: cd lib && rm -f .terraform.tfstate.lock.info');
                    throw error;
                }
            } else if (error.message && error.message.includes('No valid credential sources found')) {
                throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_DEFAULT_REGION environment variables.');
            } else if (error.message && error.message.includes('The security token included in the request is invalid')) {
                throw new Error('AWS credentials are invalid or expired. Please check your AWS credentials.');
            } else if (error.message && error.message.includes('Unable to locate credentials')) {
                throw new Error('AWS credentials not found. Please configure AWS credentials using environment variables or AWS CLI.');
            } else {
                console.error('Terraform setup failed:', error.message);
                throw error;
            }
        }
    });

    afterAll(async () => {
        // Cleanup - destroy resources using the same variables
        try {
            execSync('terraform destroy -auto-approve -var-file=terraform.tfvars.integration', { 
                stdio: 'inherit', 
                cwd: 'lib' 
            });
        } catch (error: any) {
            // Check if the error is related to state lock
            if (error.message && error.message.includes('Error acquiring the state lock')) {
                console.warn('Cleanup failed due to state lock. Attempting to resolve...');
                
                // Extract lock ID from error message if available
                const lockIdMatch = error.message.match(/ID:\s+([a-f0-9\-]+)/);
                if (lockIdMatch) {
                    const lockId = lockIdMatch[1];
                    console.log(`Attempting to unlock state with lock ID: ${lockId}`);
                    
                    try {
                        // Try to force unlock
                        execSync(`terraform force-unlock -force ${lockId}`, { 
                            stdio: 'inherit', 
                            cwd: 'lib' 
                        });
                        console.log('State unlocked successfully, retrying terraform destroy...');
                        
                        // Retry the destroy
                        execSync('terraform destroy -auto-approve -var-file=terraform.tfvars.integration', { 
                            stdio: 'inherit', 
                            cwd: 'lib' 
                        });
                    } catch (unlockError) {
                        console.warn('Failed to unlock state automatically during cleanup.');
                        console.warn('Manual intervention may be required: cd lib && rm -f .terraform.tfstate.lock.info');
                        console.warn('Then run: terraform destroy -auto-approve -var-file=terraform.tfvars.integration');
                    }
                } else {
                    console.warn('Could not extract lock ID from cleanup error message.');
                    console.warn('Manual intervention may be required: cd lib && rm -f .terraform.tfstate.lock.info');
                    console.warn('Then run: terraform destroy -auto-approve -var-file=terraform.tfvars.integration');
                }
            } else {
                console.warn('Cleanup failed, manual intervention may be required');
                console.error(error.message);
            }
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
            expect(secret.Name).toMatch(/^prod-6340-(app|test)-secret-[a-f0-9]{8}$/);
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