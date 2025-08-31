package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.343Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference")
public class SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEbsVolumeSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsVolumeSizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsVolumeSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "ebsVolumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEbsVolumeSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ebsVolumeSizeInGb", java.util.Objects.requireNonNull(value, "ebsVolumeSizeInGb is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
