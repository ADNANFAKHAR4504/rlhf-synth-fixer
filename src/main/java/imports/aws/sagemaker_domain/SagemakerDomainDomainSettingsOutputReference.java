package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettingsOutputReference")
public class SagemakerDomainDomainSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDomainSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDomainSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDomainSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDockerSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDockerSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRStudioServerProDomainSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRStudioServerProDomainSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDockerSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDockerSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRoleIdentityConfig() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRoleIdentityConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRStudioServerProDomainSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRStudioServerProDomainSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettingsOutputReference getDockerSettings() {
        return software.amazon.jsii.Kernel.get(this, "dockerSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference getRStudioServerProDomainSettings() {
        return software.amazon.jsii.Kernel.get(this, "rStudioServerProDomainSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings getDockerSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dockerSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleIdentityConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleIdentityConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings getRStudioServerProDomainSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rStudioServerProDomainSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleIdentityConfig() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleIdentityConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleIdentityConfig(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleIdentityConfig", java.util.Objects.requireNonNull(value, "executionRoleIdentityConfig is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
