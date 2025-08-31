package imports.aws.ecr_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepository.EcrRepositoryImageScanningConfigurationOutputReference")
public class EcrRepositoryImageScanningConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcrRepositoryImageScanningConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcrRepositoryImageScanningConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcrRepositoryImageScanningConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScanOnPushInput() {
        return software.amazon.jsii.Kernel.get(this, "scanOnPushInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getScanOnPush() {
        return software.amazon.jsii.Kernel.get(this, "scanOnPush", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setScanOnPush(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "scanOnPush", java.util.Objects.requireNonNull(value, "scanOnPush is required"));
    }

    public void setScanOnPush(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "scanOnPush", java.util.Objects.requireNonNull(value, "scanOnPush is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecr_repository.EcrRepositoryImageScanningConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecr_repository.EcrRepositoryImageScanningConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecr_repository.EcrRepositoryImageScanningConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
