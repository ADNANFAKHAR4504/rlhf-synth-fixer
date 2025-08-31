package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.310Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsOutputReference")
public class SagemakerDomainDefaultSpaceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultSpaceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomFileSystemConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomFileSystemConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomPosixUserConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCustomPosixUserConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterLabAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterLabAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterServerAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterServerAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKernelGatewayAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKernelGatewayAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpaceStorageSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSpaceStorageSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomFileSystemConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCustomFileSystemConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomPosixUserConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPosixUserConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJupyterLabAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetJupyterLabAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJupyterServerAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetJupyterServerAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKernelGatewayAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetKernelGatewayAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceStorageSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceStorageSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigList getCustomFileSystemConfig() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfigOutputReference getCustomPosixUserConfig() {
        return software.amazon.jsii.Kernel.get(this, "customPosixUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsOutputReference getJupyterLabAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsOutputReference getJupyterServerAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsOutputReference getKernelGatewayAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettingsOutputReference getSpaceStorageSettings() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomFileSystemConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystemConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig getCustomPosixUserConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "customPosixUserConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings getSpaceStorageSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole() {
        return software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRole", java.util.Objects.requireNonNull(value, "executionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
