package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.415Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchAlarmOutputReference")
public class IotTopicRuleErrorActionCloudwatchAlarmOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleErrorActionCloudwatchAlarmOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleErrorActionCloudwatchAlarmOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotTopicRuleErrorActionCloudwatchAlarmOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmNameInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateReasonInput() {
        return software.amazon.jsii.Kernel.get(this, "stateReasonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateValueInput() {
        return software.amazon.jsii.Kernel.get(this, "stateValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmName() {
        return software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmName", java.util.Objects.requireNonNull(value, "alarmName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStateReason() {
        return software.amazon.jsii.Kernel.get(this, "stateReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStateReason(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stateReason", java.util.Objects.requireNonNull(value, "stateReason is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStateValue() {
        return software.amazon.jsii.Kernel.get(this, "stateValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStateValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stateValue", java.util.Objects.requireNonNull(value, "stateValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
