package imports.aws.ec2_transit_gateway_peering_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayPeeringAttachment.Ec2TransitGatewayPeeringAttachmentOptionsOutputReference")
public class Ec2TransitGatewayPeeringAttachmentOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2TransitGatewayPeeringAttachmentOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TransitGatewayPeeringAttachmentOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2TransitGatewayPeeringAttachmentOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDynamicRouting() {
        software.amazon.jsii.Kernel.call(this, "resetDynamicRouting", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDynamicRoutingInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamicRoutingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDynamicRouting() {
        return software.amazon.jsii.Kernel.get(this, "dynamicRouting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDynamicRouting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dynamicRouting", java.util.Objects.requireNonNull(value, "dynamicRouting is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
