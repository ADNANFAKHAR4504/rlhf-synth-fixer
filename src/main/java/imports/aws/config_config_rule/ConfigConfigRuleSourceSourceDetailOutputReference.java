package imports.aws.config_config_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigRule.ConfigConfigRuleSourceSourceDetailOutputReference")
public class ConfigConfigRuleSourceSourceDetailOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigRuleSourceSourceDetailOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigRuleSourceSourceDetailOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ConfigConfigRuleSourceSourceDetailOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEventSource() {
        software.amazon.jsii.Kernel.call(this, "resetEventSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumExecutionFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumExecutionFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageType() {
        software.amazon.jsii.Kernel.call(this, "resetMessageType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "eventSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaximumExecutionFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "messageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventSource() {
        return software.amazon.jsii.Kernel.get(this, "eventSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventSource", java.util.Objects.requireNonNull(value, "eventSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaximumExecutionFrequency() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaximumExecutionFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maximumExecutionFrequency", java.util.Objects.requireNonNull(value, "maximumExecutionFrequency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageType() {
        return software.amazon.jsii.Kernel.get(this, "messageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageType", java.util.Objects.requireNonNull(value, "messageType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetail value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
