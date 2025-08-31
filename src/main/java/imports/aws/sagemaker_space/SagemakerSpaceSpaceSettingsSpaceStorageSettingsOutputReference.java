package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.343Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference")
public class SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEbsStorageSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEbsStorageSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference getEbsStorageSettings() {
        return software.amazon.jsii.Kernel.get(this, "ebsStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings getEbsStorageSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsStorageSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
