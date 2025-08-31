package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference")
public class SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDirectDeploySettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings value) {
        software.amazon.jsii.Kernel.call(this, "putDirectDeploySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEmrServerlessSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEmrServerlessSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGenerativeAiSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIdentityProviderOauthSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKendraSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKendraSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putModelRegisterSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings value) {
        software.amazon.jsii.Kernel.call(this, "putModelRegisterSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeSeriesForecastingSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings value) {
        software.amazon.jsii.Kernel.call(this, "putTimeSeriesForecastingSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkspaceSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference getDirectDeploySettings() {
        return software.amazon.jsii.Kernel.get(this, "directDeploySettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference getEmrServerlessSettings() {
        return software.amazon.jsii.Kernel.get(this, "emrServerlessSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference getGenerativeAiSettings() {
        return software.amazon.jsii.Kernel.get(this, "generativeAiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList getIdentityProviderOauthSettings() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference getKendraSettings() {
        return software.amazon.jsii.Kernel.get(this, "kendraSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference getModelRegisterSettings() {
        return software.amazon.jsii.Kernel.get(this, "modelRegisterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference getTimeSeriesForecastingSettings() {
        return software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference getWorkspaceSettings() {
        return software.amazon.jsii.Kernel.get(this, "workspaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "directDeploySettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "emrServerlessSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "generativeAiSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIdentityProviderOauthSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings getKendraSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "kendraSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "modelRegisterSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
