package imports.aws.oam_link;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.981Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.oamLink.OamLinkLinkConfigurationOutputReference")
public class OamLinkLinkConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OamLinkLinkConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OamLinkLinkConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OamLinkLinkConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLogGroupConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putLogGroupConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetricConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putMetricConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLogGroupConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroupConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetMetricConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfigurationOutputReference getLogGroupConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "logGroupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.oam_link.OamLinkLinkConfigurationMetricConfigurationOutputReference getMetricConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "metricConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationMetricConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration getLogGroupConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration getMetricConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "metricConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
