package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerLogsOutputReference")
public class MqBrokerLogsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MqBrokerLogsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MqBrokerLogsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MqBrokerLogsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAudit() {
        software.amazon.jsii.Kernel.call(this, "resetAudit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeneral() {
        software.amazon.jsii.Kernel.call(this, "resetGeneral", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuditInput() {
        return software.amazon.jsii.Kernel.get(this, "auditInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGeneralInput() {
        return software.amazon.jsii.Kernel.get(this, "generalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudit() {
        return software.amazon.jsii.Kernel.get(this, "audit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audit", java.util.Objects.requireNonNull(value, "audit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getGeneral() {
        return software.amazon.jsii.Kernel.get(this, "general", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setGeneral(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "general", java.util.Objects.requireNonNull(value, "general is required"));
    }

    public void setGeneral(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "general", java.util.Objects.requireNonNull(value, "general is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLogs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLogs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLogs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
