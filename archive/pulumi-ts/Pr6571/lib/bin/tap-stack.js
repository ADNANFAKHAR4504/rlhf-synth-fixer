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
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
class TapStack extends pulumi.ComponentResource {
    // Example of a public property for a nested resource's output.
    // public readonly table: pulumi.Output<string>;
    /**
     * Creates a new TapStack component.
     * @param name The logical name of this Pulumi component.
     * @param args Configuration arguments including environment suffix and tags.
     * @param opts Pulumi options.
     */
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);
        // The following variables are commented out as they are only used in example code.
        // To use them, uncomment the lines below and the corresponding example code.
        // const environmentSuffix = args.environmentSuffix || 'dev';
        // const tags = args.tags || {};
        // --- Instantiate Nested Components Here ---
        // This is where you would create instances of your other component resources,
        // passing them the necessary configuration.
        // Example of instantiating a DynamoDBStack component:
        // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
        //   environmentSuffix: environmentSuffix,
        //   tags: tags,
        // }, { parent: this });
        // Example of creating a resource directly (for truly global resources only):
        // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
        //   tags: tags,
        // }, { parent: this });
        // --- Expose Outputs from Nested Components ---
        // Make outputs from your nested components available as outputs of this main stack.
        // this.table = dynamoDBStack.table;
        // Register the outputs of this component.
        this.registerOutputs({
        // table: this.table,
        });
    }
}
exports.TapStack = TapStack;
