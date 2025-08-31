package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.417Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleHttpOutputReference")
public class IotTopicRuleHttpOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleHttpOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleHttpOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public IotTopicRuleHttpOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHttpHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeader> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHttpHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfirmationUrl() {
        software.amazon.jsii.Kernel.call(this, "resetConfirmationUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHttpHeader", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeaderList getHttpHeader() {
        return software.amazon.jsii.Kernel.get(this, "httpHeader", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleHttpHttpHeaderList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfirmationUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "confirmationUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHttpHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "httpHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "urlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfirmationUrl() {
        return software.amazon.jsii.Kernel.get(this, "confirmationUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfirmationUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "confirmationUrl", java.util.Objects.requireNonNull(value, "confirmationUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "url", java.util.Objects.requireNonNull(value, "url is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleHttp value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
