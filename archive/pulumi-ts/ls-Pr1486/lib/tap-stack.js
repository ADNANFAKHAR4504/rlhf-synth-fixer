"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapStack = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const infrastructure_1 = require("./infrastructure");
class TapStack extends pulumi.ComponentResource {
    constructor(name, args = {}, opts) {
        super('tap:stack:TapStack', name, {}, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const config = new pulumi.Config();
        const region = config.get('region') || 'ap-south-1';
        const infrastructureConfig = {
            region,
            availabilityZones: config.getObject('availabilityZones') || [
                `${region}a`,
                `${region}b`,
            ],
            vpcCidr: config.get('vpcCidr') || '10.0.0.0/16',
            publicSubnetCidrs: config.getObject('publicSubnetCidrs') || [
                '10.0.1.0/24',
                '10.0.2.0/24',
            ],
            privateSubnetCidrs: config.getObject('privateSubnetCidrs') || [
                '10.0.10.0/24',
                '10.0.20.0/24',
            ],
            rdsConfig: config.getObject('rdsConfig') || {
                instanceClass: 'db.t3.micro',
                allocatedStorage: 20,
                engine: 'mysql',
                engineVersion: '8.0',
                dbName: 'appdb',
                username: 'admin',
            },
            s3Config: config.getObject('s3Config') || {
                lifecyclePolicies: {
                    transitionToIa: 30,
                    transitionToGlacier: 90,
                    expiration: 365,
                },
            },
            tags: {
                ...(config.getObject('tags') || {
                    Environment: environmentSuffix,
                    Project: 'TAP',
                    Owner: 'DevTeam',
                }),
                ...(args.tags || {}),
                Environment: environmentSuffix,
            },
        };
        // Create the infrastructure
        this.infrastructure = new infrastructure_1.Infrastructure('infrastructure', infrastructureConfig, environmentSuffix, { parent: this });
        // Export outputs
        this.vpcId = this.infrastructure.vpcId;
        this.publicSubnetIds = this.infrastructure.publicSubnetIds;
        this.privateSubnetIds = this.infrastructure.privateSubnetIds;
        this.rdsEndpoint = this.infrastructure.rdsEndpoint;
        this.s3BucketName = this.infrastructure.s3BucketName;
        this.applicationRoleArn = this.infrastructure.applicationRoleArn;
        this.kmsKeyId = this.infrastructure.kmsKeyId;
        this.instanceProfileArn = this.infrastructure.instanceProfileArn;
        // Register outputs
        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
            rdsEndpoint: this.rdsEndpoint,
            s3BucketName: this.s3BucketName,
            applicationRoleArn: this.applicationRoleArn,
            kmsKeyId: this.kmsKeyId,
            instanceProfileArn: this.instanceProfileArn,
        });
    }
}
exports.TapStack = TapStack;
