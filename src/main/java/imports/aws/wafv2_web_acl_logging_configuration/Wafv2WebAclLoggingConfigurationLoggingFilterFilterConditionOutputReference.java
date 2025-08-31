package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.680Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionOutputReference")
public class Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putActionCondition(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition value) {
        software.amazon.jsii.Kernel.call(this, "putActionCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLabelNameCondition(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition value) {
        software.amazon.jsii.Kernel.call(this, "putLabelNameCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActionCondition() {
        software.amazon.jsii.Kernel.call(this, "resetActionCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLabelNameCondition() {
        software.amazon.jsii.Kernel.call(this, "resetLabelNameCondition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionConditionOutputReference getActionCondition() {
        return software.amazon.jsii.Kernel.get(this, "actionCondition", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionConditionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameConditionOutputReference getLabelNameCondition() {
        return software.amazon.jsii.Kernel.get(this, "labelNameCondition", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameConditionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition getActionConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionConditionInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionActionCondition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition getLabelNameConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "labelNameConditionInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterConditionLabelNameCondition.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
