package imports.aws.vpc_ipam_pool_cidr;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.601Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamPoolCidr.VpcIpamPoolCidrCidrAuthorizationContextOutputReference")
public class VpcIpamPoolCidrCidrAuthorizationContextOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpcIpamPoolCidrCidrAuthorizationContextOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcIpamPoolCidrCidrAuthorizationContextOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpcIpamPoolCidrCidrAuthorizationContextOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMessage() {
        software.amazon.jsii.Kernel.call(this, "resetMessage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSignature() {
        software.amazon.jsii.Kernel.call(this, "resetSignature", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "messageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSignatureInput() {
        return software.amazon.jsii.Kernel.get(this, "signatureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessage() {
        return software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "message", java.util.Objects.requireNonNull(value, "message is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSignature() {
        return software.amazon.jsii.Kernel.get(this, "signature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSignature(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "signature", java.util.Objects.requireNonNull(value, "signature is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
