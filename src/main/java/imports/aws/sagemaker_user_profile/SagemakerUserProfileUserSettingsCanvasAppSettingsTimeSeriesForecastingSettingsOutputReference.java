package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference")
public class SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAmazonForecastRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonForecastRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmazonForecastRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonForecastRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmazonForecastRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "amazonForecastRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmazonForecastRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amazonForecastRoleArn", java.util.Objects.requireNonNull(value, "amazonForecastRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
