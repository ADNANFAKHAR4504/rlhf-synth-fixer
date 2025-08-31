package imports.aws.apprunner_observability_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.052Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerObservabilityConfiguration.ApprunnerObservabilityConfigurationTraceConfigurationOutputReference")
public class ApprunnerObservabilityConfigurationTraceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerObservabilityConfigurationTraceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerObservabilityConfigurationTraceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerObservabilityConfigurationTraceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetVendor() {
        software.amazon.jsii.Kernel.call(this, "resetVendor", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVendorInput() {
        return software.amazon.jsii.Kernel.get(this, "vendorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVendor() {
        return software.amazon.jsii.Kernel.get(this, "vendor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVendor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vendor", java.util.Objects.requireNonNull(value, "vendor is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_observability_configuration.ApprunnerObservabilityConfigurationTraceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_observability_configuration.ApprunnerObservabilityConfigurationTraceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_observability_configuration.ApprunnerObservabilityConfigurationTraceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
