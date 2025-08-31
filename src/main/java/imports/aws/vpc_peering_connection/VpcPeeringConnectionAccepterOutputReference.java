package imports.aws.vpc_peering_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.608Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcPeeringConnection.VpcPeeringConnectionAccepterOutputReference")
public class VpcPeeringConnectionAccepterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpcPeeringConnectionAccepterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcPeeringConnectionAccepterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpcPeeringConnectionAccepterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowRemoteVpcDnsResolution() {
        software.amazon.jsii.Kernel.call(this, "resetAllowRemoteVpcDnsResolution", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowRemoteVpcDnsResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "allowRemoteVpcDnsResolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowRemoteVpcDnsResolution() {
        return software.amazon.jsii.Kernel.get(this, "allowRemoteVpcDnsResolution", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowRemoteVpcDnsResolution(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowRemoteVpcDnsResolution", java.util.Objects.requireNonNull(value, "allowRemoteVpcDnsResolution is required"));
    }

    public void setAllowRemoteVpcDnsResolution(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowRemoteVpcDnsResolution", java.util.Objects.requireNonNull(value, "allowRemoteVpcDnsResolution is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
