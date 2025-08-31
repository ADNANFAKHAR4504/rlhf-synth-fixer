package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference")
public class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAppLifecycleManagement(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement value) {
        software.amazon.jsii.Kernel.call(this, "putAppLifecycleManagement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDefaultResourceSpec(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultResourceSpec", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAppLifecycleManagement() {
        software.amazon.jsii.Kernel.call(this, "resetAppLifecycleManagement", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference getAppLifecycleManagement() {
        return software.amazon.jsii.Kernel.get(this, "appLifecycleManagement", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference getDefaultResourceSpec() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement getAppLifecycleManagementInput() {
        return software.amazon.jsii.Kernel.get(this, "appLifecycleManagementInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec getDefaultResourceSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpecInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
