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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3RhcC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7R0FRRztBQUNILHVEQUF5QztBQXVCekM7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwRCwrREFBK0Q7SUFDL0QsZ0RBQWdEO0lBRWhEOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5QyxtRkFBbUY7UUFDbkYsNkVBQTZFO1FBQzdFLDZEQUE2RDtRQUM3RCxnQ0FBZ0M7UUFFaEMsNkNBQTZDO1FBQzdDLDhFQUE4RTtRQUM5RSw0Q0FBNEM7UUFFNUMsc0RBQXNEO1FBQ3RELDREQUE0RDtRQUM1RCwwQ0FBMEM7UUFDMUMsZ0JBQWdCO1FBQ2hCLHdCQUF3QjtRQUV4Qiw2RUFBNkU7UUFDN0UsK0VBQStFO1FBQy9FLGdCQUFnQjtRQUNoQix3QkFBd0I7UUFFeEIsZ0RBQWdEO1FBQ2hELG9GQUFvRjtRQUNwRixvQ0FBb0M7UUFFcEMsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDbkIscUJBQXFCO1NBQ3RCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTFDRCw0QkEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHRhcC1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIFRhcFN0YWNrIGNsYXNzLCB0aGUgbWFpbiBQdWx1bWkgQ29tcG9uZW50UmVzb3VyY2UgZm9yXG4gKiB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIHByb2plY3QuXG4gKlxuICogSXQgb3JjaGVzdHJhdGVzIHRoZSBpbnN0YW50aWF0aW9uIG9mIG90aGVyIHJlc291cmNlLXNwZWNpZmljIGNvbXBvbmVudHNcbiAqIGFuZCBtYW5hZ2VzIGVudmlyb25tZW50LXNwZWNpZmljIGNvbmZpZ3VyYXRpb25zLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuLy8gaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJzsgLy8gUmVtb3ZlZCBhcyBpdCdzIG9ubHkgdXNlZCBpbiBleGFtcGxlIGNvZGVcblxuLy8gSW1wb3J0IHlvdXIgbmVzdGVkIHN0YWNrcyBoZXJlLiBGb3IgZXhhbXBsZTpcbi8vIGltcG9ydCB7IER5bmFtb0RCU3RhY2sgfSBmcm9tIFwiLi9keW5hbW9kYi1zdGFja1wiO1xuXG4vKipcbiAqIFRhcFN0YWNrQXJncyBkZWZpbmVzIHRoZSBpbnB1dCBhcmd1bWVudHMgZm9yIHRoZSBUYXBTdGFjayBQdWx1bWkgY29tcG9uZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRhcFN0YWNrQXJncyB7XG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBzdWZmaXggZm9yIGlkZW50aWZ5aW5nIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50IChlLmcuLCAnZGV2JywgJ3Byb2QnKS5cbiAgICogRGVmYXVsdHMgdG8gJ2RldicgaWYgbm90IHByb3ZpZGVkLlxuICAgKi9cbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byByZXNvdXJjZXMuXG4gICAqL1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIG1haW4gUHVsdW1pIGNvbXBvbmVudCByZXNvdXJjZSBmb3IgdGhlIFRBUCBwcm9qZWN0LlxuICpcbiAqIFRoaXMgY29tcG9uZW50IG9yY2hlc3RyYXRlcyB0aGUgaW5zdGFudGlhdGlvbiBvZiBvdGhlciByZXNvdXJjZS1zcGVjaWZpYyBjb21wb25lbnRzXG4gKiBhbmQgbWFuYWdlcyB0aGUgZW52aXJvbm1lbnQgc3VmZml4IHVzZWQgZm9yIG5hbWluZyBhbmQgY29uZmlndXJhdGlvbi5cbiAqXG4gKiBOb3RlOlxuICogLSBETyBOT1QgY3JlYXRlIHJlc291cmNlcyBkaXJlY3RseSBoZXJlIHVubGVzcyB0aGV5IGFyZSB0cnVseSBnbG9iYWwuXG4gKiAtIFVzZSBvdGhlciBjb21wb25lbnRzIChlLmcuLCBEeW5hbW9EQlN0YWNrKSBmb3IgQVdTIHJlc291cmNlIGRlZmluaXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgVGFwU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAvLyBFeGFtcGxlIG9mIGEgcHVibGljIHByb3BlcnR5IGZvciBhIG5lc3RlZCByZXNvdXJjZSdzIG91dHB1dC5cbiAgLy8gcHVibGljIHJlYWRvbmx5IHRhYmxlOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVGFwU3RhY2sgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbG9naWNhbCBuYW1lIG9mIHRoaXMgUHVsdW1pIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIGFyZ3MgQ29uZmlndXJhdGlvbiBhcmd1bWVudHMgaW5jbHVkaW5nIGVudmlyb25tZW50IHN1ZmZpeCBhbmQgdGFncy5cbiAgICogQHBhcmFtIG9wdHMgUHVsdW1pIG9wdGlvbnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcFN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6c3RhY2s6VGFwU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIC8vIFRoZSBmb2xsb3dpbmcgdmFyaWFibGVzIGFyZSBjb21tZW50ZWQgb3V0IGFzIHRoZXkgYXJlIG9ubHkgdXNlZCBpbiBleGFtcGxlIGNvZGUuXG4gICAgLy8gVG8gdXNlIHRoZW0sIHVuY29tbWVudCB0aGUgbGluZXMgYmVsb3cgYW5kIHRoZSBjb3JyZXNwb25kaW5nIGV4YW1wbGUgY29kZS5cbiAgICAvLyBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgLy8gY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIC0tLSBJbnN0YW50aWF0ZSBOZXN0ZWQgQ29tcG9uZW50cyBIZXJlIC0tLVxuICAgIC8vIFRoaXMgaXMgd2hlcmUgeW91IHdvdWxkIGNyZWF0ZSBpbnN0YW5jZXMgb2YgeW91ciBvdGhlciBjb21wb25lbnQgcmVzb3VyY2VzLFxuICAgIC8vIHBhc3NpbmcgdGhlbSB0aGUgbmVjZXNzYXJ5IGNvbmZpZ3VyYXRpb24uXG5cbiAgICAvLyBFeGFtcGxlIG9mIGluc3RhbnRpYXRpbmcgYSBEeW5hbW9EQlN0YWNrIGNvbXBvbmVudDpcbiAgICAvLyBjb25zdCBkeW5hbW9EQlN0YWNrID0gbmV3IER5bmFtb0RCU3RhY2soXCJ0YXAtZHluYW1vZGJcIiwge1xuICAgIC8vICAgZW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICAgIC8vICAgdGFnczogdGFncyxcbiAgICAvLyB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgIC8vIEV4YW1wbGUgb2YgY3JlYXRpbmcgYSByZXNvdXJjZSBkaXJlY3RseSAoZm9yIHRydWx5IGdsb2JhbCByZXNvdXJjZXMgb25seSk6XG4gICAgLy8gY29uc3QgYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoYHRhcC1nbG9iYWwtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCwge1xuICAgIC8vICAgdGFnczogdGFncyxcbiAgICAvLyB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgIC8vIC0tLSBFeHBvc2UgT3V0cHV0cyBmcm9tIE5lc3RlZCBDb21wb25lbnRzIC0tLVxuICAgIC8vIE1ha2Ugb3V0cHV0cyBmcm9tIHlvdXIgbmVzdGVkIGNvbXBvbmVudHMgYXZhaWxhYmxlIGFzIG91dHB1dHMgb2YgdGhpcyBtYWluIHN0YWNrLlxuICAgIC8vIHRoaXMudGFibGUgPSBkeW5hbW9EQlN0YWNrLnRhYmxlO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIG91dHB1dHMgb2YgdGhpcyBjb21wb25lbnQuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgLy8gdGFibGU6IHRoaXMudGFibGUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==