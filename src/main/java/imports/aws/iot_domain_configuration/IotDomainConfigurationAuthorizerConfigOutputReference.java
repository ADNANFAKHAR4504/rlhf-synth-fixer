package imports.aws.iot_domain_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.396Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotDomainConfiguration.IotDomainConfigurationAuthorizerConfigOutputReference")
public class IotDomainConfigurationAuthorizerConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotDomainConfigurationAuthorizerConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotDomainConfigurationAuthorizerConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotDomainConfigurationAuthorizerConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowAuthorizerOverride() {
        software.amazon.jsii.Kernel.call(this, "resetAllowAuthorizerOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultAuthorizerName() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultAuthorizerName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowAuthorizerOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "allowAuthorizerOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultAuthorizerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultAuthorizerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowAuthorizerOverride() {
        return software.amazon.jsii.Kernel.get(this, "allowAuthorizerOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowAuthorizerOverride(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowAuthorizerOverride", java.util.Objects.requireNonNull(value, "allowAuthorizerOverride is required"));
    }

    public void setAllowAuthorizerOverride(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowAuthorizerOverride", java.util.Objects.requireNonNull(value, "allowAuthorizerOverride is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultAuthorizerName() {
        return software.amazon.jsii.Kernel.get(this, "defaultAuthorizerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultAuthorizerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultAuthorizerName", java.util.Objects.requireNonNull(value, "defaultAuthorizerName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
