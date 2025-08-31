package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference")
public class SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIdleTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetIdleTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycleManagement() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycleManagement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxIdleTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetMaxIdleTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinIdleTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetMinIdleTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLifecycleManagementInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleManagementInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxIdleTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxIdleTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinIdleTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "minIdleTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleTimeoutInMinutes", java.util.Objects.requireNonNull(value, "idleTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLifecycleManagement() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLifecycleManagement(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lifecycleManagement", java.util.Objects.requireNonNull(value, "lifecycleManagement is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIdleTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "maxIdleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxIdleTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxIdleTimeoutInMinutes", java.util.Objects.requireNonNull(value, "maxIdleTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIdleTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "minIdleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinIdleTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minIdleTimeoutInMinutes", java.util.Objects.requireNonNull(value, "minIdleTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
