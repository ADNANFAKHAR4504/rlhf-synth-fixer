package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference")
public class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIdleTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetIdleTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleTimeoutInMinutes", java.util.Objects.requireNonNull(value, "idleTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
