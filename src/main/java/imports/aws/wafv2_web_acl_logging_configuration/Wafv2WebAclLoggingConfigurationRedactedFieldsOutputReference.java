package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationRedactedFieldsOutputReference")
public class Wafv2WebAclLoggingConfigurationRedactedFieldsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclLoggingConfigurationRedactedFieldsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclLoggingConfigurationRedactedFieldsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Wafv2WebAclLoggingConfigurationRedactedFieldsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMethod(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod value) {
        software.amazon.jsii.Kernel.call(this, "putMethod", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryString(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString value) {
        software.amazon.jsii.Kernel.call(this, "putQueryString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSingleHeader(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader value) {
        software.amazon.jsii.Kernel.call(this, "putSingleHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUriPath(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath value) {
        software.amazon.jsii.Kernel.call(this, "putUriPath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMethod() {
        software.amazon.jsii.Kernel.call(this, "resetMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryString() {
        software.amazon.jsii.Kernel.call(this, "resetQueryString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSingleHeader() {
        software.amazon.jsii.Kernel.call(this, "resetSingleHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUriPath() {
        software.amazon.jsii.Kernel.call(this, "resetUriPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethodOutputReference getMethod() {
        return software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethodOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryStringOutputReference getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryStringOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeaderOutputReference getSingleHeader() {
        return software.amazon.jsii.Kernel.get(this, "singleHeader", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPathOutputReference getUriPath() {
        return software.amazon.jsii.Kernel.get(this, "uriPath", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPathOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod getMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "methodInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader getSingleHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "singleHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath getUriPathInput() {
        return software.amazon.jsii.Kernel.get(this, "uriPathInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
