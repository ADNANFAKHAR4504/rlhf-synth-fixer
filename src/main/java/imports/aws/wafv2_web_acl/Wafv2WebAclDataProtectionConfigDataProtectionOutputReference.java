package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionOutputReference")
public class Wafv2WebAclDataProtectionConfigDataProtectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclDataProtectionConfigDataProtectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclDataProtectionConfigDataProtectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Wafv2WebAclDataProtectionConfigDataProtectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putField(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField value) {
        software.amazon.jsii.Kernel.call(this, "putField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExcludeRateBasedDetails() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeRateBasedDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludeRuleMatchDetails() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeRuleMatchDetails", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference getField() {
        return software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionFieldOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeRateBasedDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeRateBasedDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeRuleMatchDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeRuleMatchDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField getFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionField.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeRateBasedDetails() {
        return software.amazon.jsii.Kernel.get(this, "excludeRateBasedDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeRateBasedDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeRateBasedDetails", java.util.Objects.requireNonNull(value, "excludeRateBasedDetails is required"));
    }

    public void setExcludeRateBasedDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeRateBasedDetails", java.util.Objects.requireNonNull(value, "excludeRateBasedDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeRuleMatchDetails() {
        return software.amazon.jsii.Kernel.get(this, "excludeRuleMatchDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeRuleMatchDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeRuleMatchDetails", java.util.Objects.requireNonNull(value, "excludeRuleMatchDetails is required"));
    }

    public void setExcludeRuleMatchDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeRuleMatchDetails", java.util.Objects.requireNonNull(value, "excludeRuleMatchDetails is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
