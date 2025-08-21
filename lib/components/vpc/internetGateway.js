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
exports.InternetGatewayComponent = void 0;
exports.createInternetGateway = createInternetGateway;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class InternetGatewayComponent extends pulumi.ComponentResource {
    internetGateway;
    internetGatewayId;
    vpcAttachment;
    constructor(name, args, opts) {
        super('aws:vpc:InternetGatewayComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
        this.vpcAttachment = new aws.ec2.InternetGatewayAttachment(`${name}-igw-attachment`, {
            vpcId: args.vpcId,
            internetGatewayId: this.internetGateway.id,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
        this.internetGatewayId = this.internetGateway.id;
        this.registerOutputs({
            internetGateway: this.internetGateway,
            internetGatewayId: this.internetGatewayId,
            vpcAttachment: this.vpcAttachment,
        });
    }
}
exports.InternetGatewayComponent = InternetGatewayComponent;
function createInternetGateway(name, args, opts // ← FIXED: Added third parameter
) {
    const igwComponent = new InternetGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        internetGateway: igwComponent.internetGateway,
        internetGatewayId: igwComponent.internetGatewayId,
        vpcAttachment: igwComponent.vpcAttachment,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJuZXRHYXRld2F5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJuZXRHYXRld2F5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThEQSxzREFXQztBQXpFRCx1REFBeUM7QUFDekMsaURBQW1DO0FBY25DLE1BQWEsd0JBQXlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwRCxlQUFlLENBQTBCO0lBQ3pDLGlCQUFpQixDQUF3QjtJQUN6QyxhQUFhLENBQW9DO0lBRWpFLFlBQ0UsSUFBWSxFQUNaLElBQXlCLEVBQ3pCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFELE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQ2hELEdBQUcsSUFBSSxNQUFNLEVBQ2I7WUFDRSxJQUFJLEVBQUUsV0FBVztTQUNsQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLGlDQUFpQztTQUM3RSxDQUFDO1FBRUYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQ3hELEdBQUcsSUFBSSxpQkFBaUIsRUFDeEI7WUFDRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1NBQzNDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsaUNBQWlDO1NBQzdFLENBQUM7UUFFRixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFFakQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7WUFDckMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6QyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7U0FDbEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN0NELDREQTZDQztBQUVELFNBQWdCLHFCQUFxQixDQUNuQyxJQUFZLEVBQ1osSUFBeUIsRUFDekIsSUFBc0MsQ0FBQyxpQ0FBaUM7O0lBRXhFLE1BQU0sWUFBWSxHQUFHLElBQUksd0JBQXdCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtJQUNsRyxPQUFPO1FBQ0wsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO1FBQzdDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxpQkFBaUI7UUFDakQsYUFBYSxFQUFFLFlBQVksQ0FBQyxhQUFhO0tBQzFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuZXRHYXRld2F5QXJncyB7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5ldEdhdGV3YXlSZXN1bHQge1xuICBpbnRlcm5ldEdhdGV3YXk6IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5O1xuICBpbnRlcm5ldEdhdGV3YXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB2cGNBdHRhY2htZW50OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheUF0dGFjaG1lbnQ7XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcm5ldEdhdGV3YXlDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgaW50ZXJuZXRHYXRld2F5OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheTtcbiAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSB2cGNBdHRhY2htZW50OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheUF0dGFjaG1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEludGVybmV0R2F0ZXdheUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czp2cGM6SW50ZXJuZXRHYXRld2F5Q29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5pbnRlcm5ldEdhdGV3YXkgPSBuZXcgYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXkoXG4gICAgICBgJHtuYW1lfS1pZ3dgLFxuICAgICAge1xuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICApO1xuXG4gICAgdGhpcy52cGNBdHRhY2htZW50ID0gbmV3IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5QXR0YWNobWVudChcbiAgICAgIGAke25hbWV9LWlndy1hdHRhY2htZW50YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIGludGVybmV0R2F0ZXdheUlkOiB0aGlzLmludGVybmV0R2F0ZXdheS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICApO1xuXG4gICAgdGhpcy5pbnRlcm5ldEdhdGV3YXlJZCA9IHRoaXMuaW50ZXJuZXRHYXRld2F5LmlkO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW50ZXJuZXRHYXRld2F5OiB0aGlzLmludGVybmV0R2F0ZXdheSxcbiAgICAgIGludGVybmV0R2F0ZXdheUlkOiB0aGlzLmludGVybmV0R2F0ZXdheUlkLFxuICAgICAgdnBjQXR0YWNobWVudDogdGhpcy52cGNBdHRhY2htZW50LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbnRlcm5ldEdhdGV3YXkoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogSW50ZXJuZXRHYXRld2F5QXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMgLy8g4oaQIEZJWEVEOiBBZGRlZCB0aGlyZCBwYXJhbWV0ZXJcbik6IEludGVybmV0R2F0ZXdheVJlc3VsdCB7XG4gIGNvbnN0IGlnd0NvbXBvbmVudCA9IG5ldyBJbnRlcm5ldEdhdGV3YXlDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7IC8vIOKGkCBGSVhFRDogUGFzcyBvcHRzIHRocm91Z2hcbiAgcmV0dXJuIHtcbiAgICBpbnRlcm5ldEdhdGV3YXk6IGlnd0NvbXBvbmVudC5pbnRlcm5ldEdhdGV3YXksXG4gICAgaW50ZXJuZXRHYXRld2F5SWQ6IGlnd0NvbXBvbmVudC5pbnRlcm5ldEdhdGV3YXlJZCxcbiAgICB2cGNBdHRhY2htZW50OiBpZ3dDb21wb25lbnQudnBjQXR0YWNobWVudCxcbiAgfTtcbn1cbiJdfQ==