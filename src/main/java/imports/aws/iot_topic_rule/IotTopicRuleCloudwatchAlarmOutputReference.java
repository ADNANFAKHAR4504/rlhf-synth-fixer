package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.413Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleCloudwatchAlarmOutputReference")
public class IotTopicRuleCloudwatchAlarmOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleCloudwatchAlarmOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleCloudwatchAlarmOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public IotTopicRuleCloudwatchAlarmOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
