package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationOutputReference")
public class ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAmiAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAmiAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataType() {
        software.amazon.jsii.Kernel.call(this, "resetDataType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmiAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "amiAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterNameInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmiAccountId() {
        return software.amazon.jsii.Kernel.get(this, "amiAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmiAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amiAccountId", java.util.Objects.requireNonNull(value, "amiAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataType() {
        return software.amazon.jsii.Kernel.get(this, "dataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataType", java.util.Objects.requireNonNull(value, "dataType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterName() {
        return software.amazon.jsii.Kernel.get(this, "parameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterName", java.util.Objects.requireNonNull(value, "parameterName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
