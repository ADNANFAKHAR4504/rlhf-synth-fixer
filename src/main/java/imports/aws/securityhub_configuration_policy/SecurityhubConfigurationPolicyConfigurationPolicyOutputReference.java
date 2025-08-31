package imports.aws.securityhub_configuration_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicyOutputReference")
public class SecurityhubConfigurationPolicyConfigurationPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubConfigurationPolicyConfigurationPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubConfigurationPolicyConfigurationPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SecurityhubConfigurationPolicyConfigurationPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSecurityControlsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSecurityControlsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabledStandardArns() {
        software.amazon.jsii.Kernel.call(this, "resetEnabledStandardArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityControlsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityControlsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationOutputReference getSecurityControlsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "securityControlsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledStandardArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledStandardArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration getSecurityControlsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "securityControlsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getServiceEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledStandardArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledStandardArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledStandardArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledStandardArns", java.util.Objects.requireNonNull(value, "enabledStandardArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getServiceEnabled() {
        return software.amazon.jsii.Kernel.get(this, "serviceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setServiceEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "serviceEnabled", java.util.Objects.requireNonNull(value, "serviceEnabled is required"));
    }

    public void setServiceEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "serviceEnabled", java.util.Objects.requireNonNull(value, "serviceEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
