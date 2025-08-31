package imports.aws.config_config_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigRule.ConfigConfigRuleScopeOutputReference")
public class ConfigConfigRuleScopeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigRuleScopeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigRuleScopeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigRuleScopeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetComplianceResourceId() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceResourceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceResourceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceResourceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagKey() {
        software.amazon.jsii.Kernel.call(this, "resetTagKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagValue() {
        software.amazon.jsii.Kernel.call(this, "resetTagValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComplianceResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceResourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getComplianceResourceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "complianceResourceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "tagKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagValueInput() {
        return software.amazon.jsii.Kernel.get(this, "tagValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComplianceResourceId() {
        return software.amazon.jsii.Kernel.get(this, "complianceResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComplianceResourceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "complianceResourceId", java.util.Objects.requireNonNull(value, "complianceResourceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getComplianceResourceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "complianceResourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setComplianceResourceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "complianceResourceTypes", java.util.Objects.requireNonNull(value, "complianceResourceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagKey() {
        return software.amazon.jsii.Kernel.get(this, "tagKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagKey", java.util.Objects.requireNonNull(value, "tagKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagValue() {
        return software.amazon.jsii.Kernel.get(this, "tagValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagValue", java.util.Objects.requireNonNull(value, "tagValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleScope getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleScope.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleScope value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
