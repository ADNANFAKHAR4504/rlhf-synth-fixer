package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfigurationOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAutoScalingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutoScalingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParallelism() {
        software.amazon.jsii.Kernel.call(this, "resetParallelism", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParallelismPerKpu() {
        software.amazon.jsii.Kernel.call(this, "resetParallelismPerKpu", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoScalingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getParallelismInput() {
        return software.amazon.jsii.Kernel.get(this, "parallelismInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getParallelismPerKpuInput() {
        return software.amazon.jsii.Kernel.get(this, "parallelismPerKpuInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoScalingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoScalingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoScalingEnabled", java.util.Objects.requireNonNull(value, "autoScalingEnabled is required"));
    }

    public void setAutoScalingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoScalingEnabled", java.util.Objects.requireNonNull(value, "autoScalingEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationType() {
        return software.amazon.jsii.Kernel.get(this, "configurationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationType", java.util.Objects.requireNonNull(value, "configurationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getParallelism() {
        return software.amazon.jsii.Kernel.get(this, "parallelism", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setParallelism(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "parallelism", java.util.Objects.requireNonNull(value, "parallelism is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getParallelismPerKpu() {
        return software.amazon.jsii.Kernel.get(this, "parallelismPerKpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setParallelismPerKpu(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "parallelismPerKpu", java.util.Objects.requireNonNull(value, "parallelismPerKpu is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
