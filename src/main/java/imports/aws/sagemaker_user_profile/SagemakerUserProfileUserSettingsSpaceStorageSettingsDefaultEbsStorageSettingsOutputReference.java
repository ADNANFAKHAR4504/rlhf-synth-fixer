package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.352Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference")
public class SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultEbsVolumeSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultEbsVolumeSizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumEbsVolumeSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumEbsVolumeSizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultEbsVolumeSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "defaultEbsVolumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultEbsVolumeSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultEbsVolumeSizeInGb", java.util.Objects.requireNonNull(value, "defaultEbsVolumeSizeInGb is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumEbsVolumeSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "maximumEbsVolumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumEbsVolumeSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumEbsVolumeSizeInGb", java.util.Objects.requireNonNull(value, "maximumEbsVolumeSizeInGb is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
