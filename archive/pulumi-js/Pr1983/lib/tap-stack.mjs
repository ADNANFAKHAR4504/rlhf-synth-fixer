/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource that orchestrates the networking and compute stacks.
 * This creates a basic AWS cloud environment with VPC, subnets, and EC2 instance.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack.mjs';
import { ComputeStack } from './compute-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = args?.tags || {};

        // Create networking infrastructure
        const networking = new NetworkingStack('tf-networking', {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });

        // Create compute resources
        const compute = new ComputeStack('tf-compute', {
            environmentSuffix: environmentSuffix,
            subnetId: networking.publicSubnet1Id,
            securityGroupId: networking.securityGroupId,
            tags: tags,
        }, { parent: this });

        // Expose key outputs
        this.vpcId = networking.vpcId;
        this.publicSubnet1Id = networking.publicSubnet1Id;
        this.publicSubnet2Id = networking.publicSubnet2Id;
        this.instanceId = compute.instanceId;
        this.publicIp = compute.publicIp;

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnet1Id: this.publicSubnet1Id,
            publicSubnet2Id: this.publicSubnet2Id,
            instanceId: this.instanceId,
            publicIp: this.publicIp
        });
    }
}

