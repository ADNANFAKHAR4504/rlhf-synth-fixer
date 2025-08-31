package imports.aws.opensearchserverless_security_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.999Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchserverlessSecurityConfig.OpensearchserverlessSecurityConfigSamlOptionsOutputReference")
public class OpensearchserverlessSecurityConfigSamlOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchserverlessSecurityConfigSamlOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchserverlessSecurityConfigSamlOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchserverlessSecurityConfigSamlOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetGroupAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetGroupAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetSessionTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserAttribute() {
        software.amazon.jsii.Kernel.call(this, "resetUserAttribute", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "groupAttributeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "userAttributeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupAttribute() {
        return software.amazon.jsii.Kernel.get(this, "groupAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupAttribute(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupAttribute", java.util.Objects.requireNonNull(value, "groupAttribute is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadata() {
        return software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadata(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadata", java.util.Objects.requireNonNull(value, "metadata is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSessionTimeout() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSessionTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sessionTimeout", java.util.Objects.requireNonNull(value, "sessionTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserAttribute() {
        return software.amazon.jsii.Kernel.get(this, "userAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserAttribute(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userAttribute", java.util.Objects.requireNonNull(value, "userAttribute is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearchserverless_security_config.OpensearchserverlessSecurityConfigSamlOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
