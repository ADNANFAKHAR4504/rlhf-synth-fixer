package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.473Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelismOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelismOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelismOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelismOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelismOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCount() {
        software.amazon.jsii.Kernel.call(this, "resetCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCountInput() {
        return software.amazon.jsii.Kernel.get(this, "countInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCount() {
        return software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "count", java.util.Objects.requireNonNull(value, "count is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
