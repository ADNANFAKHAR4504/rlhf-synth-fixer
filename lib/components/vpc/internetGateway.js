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
        super("aws:vpc:InternetGatewayComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
            tags: defaultTags,
        }, { parent: this });
        this.vpcAttachment = new aws.ec2.InternetGatewayAttachment(`${name}-igw-attachment`, {
            vpcId: args.vpcId,
            internetGatewayId: this.internetGateway.id,
        }, { parent: this });
        this.internetGatewayId = this.internetGateway.id;
        this.registerOutputs({
            internetGateway: this.internetGateway,
            internetGatewayId: this.internetGatewayId,
            vpcAttachment: this.vpcAttachment,
        });
    }
}
exports.InternetGatewayComponent = InternetGatewayComponent;
function createInternetGateway(name, args) {
    const igwComponent = new InternetGatewayComponent(name, args);
    return {
        internetGateway: igwComponent.internetGateway,
        internetGatewayId: igwComponent.internetGatewayId,
        vpcAttachment: igwComponent.vpcAttachment,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJuZXRHYXRld2F5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJuZXRHYXRld2F5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtEQSxzREFPQztBQXpERCx1REFBeUM7QUFDekMsaURBQW1DO0FBY25DLE1BQWEsd0JBQXlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNsRCxlQUFlLENBQTBCO0lBQ3pDLGlCQUFpQixDQUF3QjtJQUN6QyxhQUFhLENBQW9DO0lBRWpFLFlBQVksSUFBWSxFQUFFLElBQXlCLEVBQUUsSUFBc0M7UUFDdkYsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLElBQUksTUFBTSxFQUFFO1lBQzlELElBQUksRUFBRSxXQUFXO1NBQ3BCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLElBQUksaUJBQWlCLEVBQUU7WUFDakYsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLGlCQUFpQixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRTtTQUM3QyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBRWpELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDakIsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7WUFDekMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWpDRCw0REFpQ0M7QUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsSUFBeUI7SUFDekUsTUFBTSxZQUFZLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDOUQsT0FBTztRQUNILGVBQWUsRUFBRSxZQUFZLENBQUMsZUFBZTtRQUM3QyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsaUJBQWlCO1FBQ2pELGFBQWEsRUFBRSxZQUFZLENBQUMsYUFBYTtLQUM1QyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5ldEdhdGV3YXlBcmdzIHtcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmV0R2F0ZXdheVJlc3VsdCB7XG4gICAgaW50ZXJuZXRHYXRld2F5OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheTtcbiAgICBpbnRlcm5ldEdhdGV3YXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHZwY0F0dGFjaG1lbnQ6IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5QXR0YWNobWVudDtcbn1cblxuZXhwb3J0IGNsYXNzIEludGVybmV0R2F0ZXdheUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheTogYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXk7XG4gICAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHZwY0F0dGFjaG1lbnQ6IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5QXR0YWNobWVudDtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogSW50ZXJuZXRHYXRld2F5QXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6dnBjOkludGVybmV0R2F0ZXdheUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pbnRlcm5ldEdhdGV3YXkgPSBuZXcgYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXkoYCR7bmFtZX0taWd3YCwge1xuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMudnBjQXR0YWNobWVudCA9IG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheUF0dGFjaG1lbnQoYCR7bmFtZX0taWd3LWF0dGFjaG1lbnRgLCB7XG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIGludGVybmV0R2F0ZXdheUlkOiB0aGlzLmludGVybmV0R2F0ZXdheS5pZCxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5pbnRlcm5ldEdhdGV3YXlJZCA9IHRoaXMuaW50ZXJuZXRHYXRld2F5LmlkO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGludGVybmV0R2F0ZXdheTogdGhpcy5pbnRlcm5ldEdhdGV3YXksXG4gICAgICAgICAgICBpbnRlcm5ldEdhdGV3YXlJZDogdGhpcy5pbnRlcm5ldEdhdGV3YXlJZCxcbiAgICAgICAgICAgIHZwY0F0dGFjaG1lbnQ6IHRoaXMudnBjQXR0YWNobWVudCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW50ZXJuZXRHYXRld2F5KG5hbWU6IHN0cmluZywgYXJnczogSW50ZXJuZXRHYXRld2F5QXJncyk6IEludGVybmV0R2F0ZXdheVJlc3VsdCB7XG4gICAgY29uc3QgaWd3Q29tcG9uZW50ID0gbmV3IEludGVybmV0R2F0ZXdheUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbnRlcm5ldEdhdGV3YXk6IGlnd0NvbXBvbmVudC5pbnRlcm5ldEdhdGV3YXksXG4gICAgICAgIGludGVybmV0R2F0ZXdheUlkOiBpZ3dDb21wb25lbnQuaW50ZXJuZXRHYXRld2F5SWQsXG4gICAgICAgIHZwY0F0dGFjaG1lbnQ6IGlnd0NvbXBvbmVudC52cGNBdHRhY2htZW50LFxuICAgIH07XG59Il19