package imports.aws.config_config_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigRule.ConfigConfigRuleSourceCustomPolicyDetailsOutputReference")
public class ConfigConfigRuleSourceCustomPolicyDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigRuleSourceCustomPolicyDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigRuleSourceCustomPolicyDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigRuleSourceCustomPolicyDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnableDebugLogDelivery() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDebugLogDelivery", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDebugLogDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDebugLogDeliveryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "policyRuntimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyTextInput() {
        return software.amazon.jsii.Kernel.get(this, "policyTextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDebugLogDelivery() {
        return software.amazon.jsii.Kernel.get(this, "enableDebugLogDelivery", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDebugLogDelivery(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDebugLogDelivery", java.util.Objects.requireNonNull(value, "enableDebugLogDelivery is required"));
    }

    public void setEnableDebugLogDelivery(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDebugLogDelivery", java.util.Objects.requireNonNull(value, "enableDebugLogDelivery is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyRuntime() {
        return software.amazon.jsii.Kernel.get(this, "policyRuntime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyRuntime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyRuntime", java.util.Objects.requireNonNull(value, "policyRuntime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyText() {
        return software.amazon.jsii.Kernel.get(this, "policyText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyText(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyText", java.util.Objects.requireNonNull(value, "policyText is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
