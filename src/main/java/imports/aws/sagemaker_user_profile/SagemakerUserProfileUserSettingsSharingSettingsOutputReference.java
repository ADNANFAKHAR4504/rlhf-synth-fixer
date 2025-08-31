package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.352Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSharingSettingsOutputReference")
public class SagemakerUserProfileUserSettingsSharingSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsSharingSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsSharingSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsSharingSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNotebookOutputOption() {
        software.amazon.jsii.Kernel.call(this, "resetNotebookOutputOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3KmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetS3KmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3OutputPath() {
        software.amazon.jsii.Kernel.call(this, "resetS3OutputPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotebookOutputOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "notebookOutputOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3OutputPathInput() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotebookOutputOption() {
        return software.amazon.jsii.Kernel.get(this, "notebookOutputOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotebookOutputOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notebookOutputOption", java.util.Objects.requireNonNull(value, "notebookOutputOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "s3KmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KmsKeyId", java.util.Objects.requireNonNull(value, "s3KmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3OutputPath() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3OutputPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3OutputPath", java.util.Objects.requireNonNull(value, "s3OutputPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
