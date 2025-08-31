package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference")
public class SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetFileSystemPath() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemIdInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemPathInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemId", java.util.Objects.requireNonNull(value, "fileSystemId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemPath() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemPath", java.util.Objects.requireNonNull(value, "fileSystemPath is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
