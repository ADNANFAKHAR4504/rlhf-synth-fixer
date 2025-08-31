package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.416Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionIotEventsOutputReference")
public class IotTopicRuleErrorActionIotEventsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleErrorActionIotEventsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleErrorActionIotEventsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotTopicRuleErrorActionIotEventsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBatchMode() {
        software.amazon.jsii.Kernel.call(this, "resetBatchMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageId() {
        software.amazon.jsii.Kernel.call(this, "resetMessageId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBatchModeInput() {
        return software.amazon.jsii.Kernel.get(this, "batchModeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputNameInput() {
        return software.amazon.jsii.Kernel.get(this, "inputNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "messageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBatchMode() {
        return software.amazon.jsii.Kernel.get(this, "batchMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBatchMode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "batchMode", java.util.Objects.requireNonNull(value, "batchMode is required"));
    }

    public void setBatchMode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "batchMode", java.util.Objects.requireNonNull(value, "batchMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputName() {
        return software.amazon.jsii.Kernel.get(this, "inputName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputName", java.util.Objects.requireNonNull(value, "inputName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageId() {
        return software.amazon.jsii.Kernel.get(this, "messageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageId", java.util.Objects.requireNonNull(value, "messageId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
