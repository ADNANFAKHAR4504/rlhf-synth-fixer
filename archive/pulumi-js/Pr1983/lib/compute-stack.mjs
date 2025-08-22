/**
 * compute-stack.mjs
 * 
 * Defines the EC2 instance and related compute resources.
 * Uses the latest Amazon Linux 2023 AMI for optimal performance.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class ComputeStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:compute:ComputeStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = {
            'Project': 'TerraformSetup',
            ...args?.tags
        };

        // Get the latest Amazon Linux 2023 AMI
        const amiId = aws.ec2.getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
                {
                    name: 'name',
                    values: ['al2023-ami-*-x86_64'],
                },
                {
                    name: 'state',
                    values: ['available'],
                }
            ]
        }).then(ami => ami.id);

        // Create EC2 instance in the first public subnet
        this.ec2Instance = new aws.ec2.Instance(`tf-ec2-instance-${environmentSuffix}`, {
            ami: amiId,
            instanceType: 't3.micro',
            subnetId: args.subnetId,
            vpcSecurityGroupIds: [args.securityGroupId],
            associatePublicIpAddress: true,
            tags: {
                Name: `tf-ec2-instance-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Expose outputs as properties
        this.instanceId = this.ec2Instance.id;
        this.publicIp = this.ec2Instance.publicIp;
        this.privateIp = this.ec2Instance.privateIp;

        this.registerOutputs({
            instanceId: this.instanceId,
            publicIp: this.publicIp,
            privateIp: this.privateIp
        });
    }
}