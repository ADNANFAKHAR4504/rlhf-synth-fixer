package imports.aws.waf_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.648Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafWebAcl.WafWebAclLoggingConfigurationOutputReference")
public class WafWebAclLoggingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WafWebAclLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WafWebAclLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WafWebAclLoggingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRedactedFields(final @org.jetbrains.annotations.NotNull imports.aws.waf_web_acl.WafWebAclLoggingConfigurationRedactedFields value) {
        software.amazon.jsii.Kernel.call(this, "putRedactedFields", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRedactedFields() {
        software.amazon.jsii.Kernel.call(this, "resetRedactedFields", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.waf_web_acl.WafWebAclLoggingConfigurationRedactedFieldsOutputReference getRedactedFields() {
        return software.amazon.jsii.Kernel.get(this, "redactedFields", software.amazon.jsii.NativeType.forClass(imports.aws.waf_web_acl.WafWebAclLoggingConfigurationRedactedFieldsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.waf_web_acl.WafWebAclLoggingConfigurationRedactedFields getRedactedFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "redactedFieldsInput", software.amazon.jsii.NativeType.forClass(imports.aws.waf_web_acl.WafWebAclLoggingConfigurationRedactedFields.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestination", java.util.Objects.requireNonNull(value, "logDestination is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.waf_web_acl.WafWebAclLoggingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.waf_web_acl.WafWebAclLoggingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.waf_web_acl.WafWebAclLoggingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
