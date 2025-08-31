package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.311Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsOutputReference")
public class SagemakerDomainDefaultUserSettingsCanvasAppSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsCanvasAppSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsCanvasAppSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsCanvasAppSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDirectDeploySettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings value) {
        software.amazon.jsii.Kernel.call(this, "putDirectDeploySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEmrServerlessSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEmrServerlessSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGenerativeAiSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings value) {
        software.amazon.jsii.Kernel.call(this, "putGenerativeAiSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIdentityProviderOauthSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettings> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIdentityProviderOauthSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKendraSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKendraSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putModelRegisterSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings value) {
        software.amazon.jsii.Kernel.call(this, "putModelRegisterSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeSeriesForecastingSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings value) {
        software.amazon.jsii.Kernel.call(this, "putTimeSeriesForecastingSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkspaceSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings value) {
        software.amazon.jsii.Kernel.call(this, "putWorkspaceSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDirectDeploySettings() {
        software.amazon.jsii.Kernel.call(this, "resetDirectDeploySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmrServerlessSettings() {
        software.amazon.jsii.Kernel.call(this, "resetEmrServerlessSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenerativeAiSettings() {
        software.amazon.jsii.Kernel.call(this, "resetGenerativeAiSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityProviderOauthSettings() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityProviderOauthSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKendraSettings() {
        software.amazon.jsii.Kernel.call(this, "resetKendraSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetModelRegisterSettings() {
        software.amazon.jsii.Kernel.call(this, "resetModelRegisterSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeSeriesForecastingSettings() {
        software.amazon.jsii.Kernel.call(this, "resetTimeSeriesForecastingSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceSettings() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference getDirectDeploySettings() {
        return software.amazon.jsii.Kernel.get(this, "directDeploySettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference getEmrServerlessSettings() {
        return software.amazon.jsii.Kernel.get(this, "emrServerlessSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference getGenerativeAiSettings() {
        return software.amazon.jsii.Kernel.get(this, "generativeAiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList getIdentityProviderOauthSettings() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettingsOutputReference getKendraSettings() {
        return software.amazon.jsii.Kernel.get(this, "kendraSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference getModelRegisterSettings() {
        return software.amazon.jsii.Kernel.get(this, "modelRegisterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference getTimeSeriesForecastingSettings() {
        return software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference getWorkspaceSettings() {
        return software.amazon.jsii.Kernel.get(this, "workspaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "directDeploySettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "emrServerlessSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "generativeAiSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIdentityProviderOauthSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings getKendraSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "kendraSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "modelRegisterSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
