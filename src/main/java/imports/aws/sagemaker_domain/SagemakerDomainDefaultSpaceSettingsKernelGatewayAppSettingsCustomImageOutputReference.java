package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference")
public class SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetImageVersionNumber() {
        software.amazon.jsii.Kernel.call(this, "resetImageVersionNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppImageConfigNameInput() {
        return software.amazon.jsii.Kernel.get(this, "appImageConfigNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "imageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImageVersionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "imageVersionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppImageConfigName() {
        return software.amazon.jsii.Kernel.get(this, "appImageConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppImageConfigName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appImageConfigName", java.util.Objects.requireNonNull(value, "appImageConfigName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageName() {
        return software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageName", java.util.Objects.requireNonNull(value, "imageName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImageVersionNumber() {
        return software.amazon.jsii.Kernel.get(this, "imageVersionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImageVersionNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "imageVersionNumber", java.util.Objects.requireNonNull(value, "imageVersionNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettingsCustomImage value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
