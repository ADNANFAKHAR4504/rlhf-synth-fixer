package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfigurationOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCheckpointingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCheckpointingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCheckpointInterval() {
        software.amazon.jsii.Kernel.call(this, "resetCheckpointInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinPauseBetweenCheckpoints() {
        software.amazon.jsii.Kernel.call(this, "resetMinPauseBetweenCheckpoints", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCheckpointingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "checkpointingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCheckpointIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "checkpointIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinPauseBetweenCheckpointsInput() {
        return software.amazon.jsii.Kernel.get(this, "minPauseBetweenCheckpointsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCheckpointingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "checkpointingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCheckpointingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "checkpointingEnabled", java.util.Objects.requireNonNull(value, "checkpointingEnabled is required"));
    }

    public void setCheckpointingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "checkpointingEnabled", java.util.Objects.requireNonNull(value, "checkpointingEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCheckpointInterval() {
        return software.amazon.jsii.Kernel.get(this, "checkpointInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCheckpointInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "checkpointInterval", java.util.Objects.requireNonNull(value, "checkpointInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationType() {
        return software.amazon.jsii.Kernel.get(this, "configurationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationType", java.util.Objects.requireNonNull(value, "configurationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinPauseBetweenCheckpoints() {
        return software.amazon.jsii.Kernel.get(this, "minPauseBetweenCheckpoints", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinPauseBetweenCheckpoints(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minPauseBetweenCheckpoints", java.util.Objects.requireNonNull(value, "minPauseBetweenCheckpoints is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
