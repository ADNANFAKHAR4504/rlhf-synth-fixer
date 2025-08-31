package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference")
public class ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHttpPutResponseHopLimit() {
        software.amazon.jsii.Kernel.call(this, "resetHttpPutResponseHopLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpTokens() {
        software.amazon.jsii.Kernel.call(this, "resetHttpTokens", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHttpPutResponseHopLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "httpPutResponseHopLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpTokensInput() {
        return software.amazon.jsii.Kernel.get(this, "httpTokensInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHttpPutResponseHopLimit() {
        return software.amazon.jsii.Kernel.get(this, "httpPutResponseHopLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHttpPutResponseHopLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "httpPutResponseHopLimit", java.util.Objects.requireNonNull(value, "httpPutResponseHopLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpTokens() {
        return software.amazon.jsii.Kernel.get(this, "httpTokens", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpTokens(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpTokens", java.util.Objects.requireNonNull(value, "httpTokens is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
