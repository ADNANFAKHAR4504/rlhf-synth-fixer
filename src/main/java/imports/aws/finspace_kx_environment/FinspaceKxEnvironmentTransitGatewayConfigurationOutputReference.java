package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfigurationOutputReference")
public class FinspaceKxEnvironmentTransitGatewayConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxEnvironmentTransitGatewayConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxEnvironmentTransitGatewayConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FinspaceKxEnvironmentTransitGatewayConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAttachmentNetworkAclConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration> __cast_cd4240 = (java.util.List<imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAttachmentNetworkAclConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAttachmentNetworkAclConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAttachmentNetworkAclConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationList getAttachmentNetworkAclConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "attachmentNetworkAclConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAttachmentNetworkAclConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "attachmentNetworkAclConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutableCidrSpaceInput() {
        return software.amazon.jsii.Kernel.get(this, "routableCidrSpaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutableCidrSpace() {
        return software.amazon.jsii.Kernel.get(this, "routableCidrSpace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutableCidrSpace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routableCidrSpace", java.util.Objects.requireNonNull(value, "routableCidrSpace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
