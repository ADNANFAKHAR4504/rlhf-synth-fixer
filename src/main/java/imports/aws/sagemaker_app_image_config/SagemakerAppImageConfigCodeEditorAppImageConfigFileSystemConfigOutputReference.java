package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference")
public class SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDefaultGid() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultGid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultUid() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultUid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMountPath() {
        software.amazon.jsii.Kernel.call(this, "resetMountPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultGidInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultGidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultUidInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultUidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMountPathInput() {
        return software.amazon.jsii.Kernel.get(this, "mountPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultGid() {
        return software.amazon.jsii.Kernel.get(this, "defaultGid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultGid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultGid", java.util.Objects.requireNonNull(value, "defaultGid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultUid() {
        return software.amazon.jsii.Kernel.get(this, "defaultUid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultUid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultUid", java.util.Objects.requireNonNull(value, "defaultUid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMountPath() {
        return software.amazon.jsii.Kernel.get(this, "mountPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMountPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mountPath", java.util.Objects.requireNonNull(value, "mountPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
