package imports.aws.pinpoint_email_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.060Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointEmailTemplate.PinpointEmailTemplateEmailTemplateOutputReference")
public class PinpointEmailTemplateEmailTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PinpointEmailTemplateEmailTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PinpointEmailTemplateEmailTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public PinpointEmailTemplateEmailTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeader> __cast_cd4240 = (java.util.List<imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultSubstitutions() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultSubstitutions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHtmlPart() {
        software.amazon.jsii.Kernel.call(this, "resetHtmlPart", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecommenderId() {
        software.amazon.jsii.Kernel.call(this, "resetRecommenderId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubject() {
        software.amazon.jsii.Kernel.call(this, "resetSubject", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTextPart() {
        software.amazon.jsii.Kernel.call(this, "resetTextPart", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeaderList getHeader() {
        return software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeaderList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSubstitutionsInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSubstitutionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "headerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHtmlPartInput() {
        return software.amazon.jsii.Kernel.get(this, "htmlPartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecommenderIdInput() {
        return software.amazon.jsii.Kernel.get(this, "recommenderIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubjectInput() {
        return software.amazon.jsii.Kernel.get(this, "subjectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTextPartInput() {
        return software.amazon.jsii.Kernel.get(this, "textPartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSubstitutions() {
        return software.amazon.jsii.Kernel.get(this, "defaultSubstitutions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSubstitutions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSubstitutions", java.util.Objects.requireNonNull(value, "defaultSubstitutions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHtmlPart() {
        return software.amazon.jsii.Kernel.get(this, "htmlPart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHtmlPart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "htmlPart", java.util.Objects.requireNonNull(value, "htmlPart is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecommenderId() {
        return software.amazon.jsii.Kernel.get(this, "recommenderId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecommenderId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recommenderId", java.util.Objects.requireNonNull(value, "recommenderId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubject() {
        return software.amazon.jsii.Kernel.get(this, "subject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subject", java.util.Objects.requireNonNull(value, "subject is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTextPart() {
        return software.amazon.jsii.Kernel.get(this, "textPart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTextPart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "textPart", java.util.Objects.requireNonNull(value, "textPart is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
