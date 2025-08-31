package imports.aws.auditmanager_control;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.088Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerControl.AuditmanagerControlControlMappingSourcesOutputReference")
public class AuditmanagerControlControlMappingSourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AuditmanagerControlControlMappingSourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AuditmanagerControlControlMappingSourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AuditmanagerControlControlMappingSourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putSourceKeyword(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeyword>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeyword> __cast_cd4240 = (java.util.List<imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeyword>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeyword __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceKeyword", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSourceDescription() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetSourceFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceKeyword() {
        software.amazon.jsii.Kernel.call(this, "resetSourceKeyword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTroubleshootingText() {
        software.amazon.jsii.Kernel.call(this, "resetTroubleshootingText", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceId() {
        return software.amazon.jsii.Kernel.get(this, "sourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeywordList getSourceKeyword() {
        return software.amazon.jsii.Kernel.get(this, "sourceKeyword", software.amazon.jsii.NativeType.forClass(imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeywordList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceKeywordInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceKeywordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceSetUpOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceSetUpOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTroubleshootingTextInput() {
        return software.amazon.jsii.Kernel.get(this, "troubleshootingTextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDescription() {
        return software.amazon.jsii.Kernel.get(this, "sourceDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDescription", java.util.Objects.requireNonNull(value, "sourceDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceFrequency() {
        return software.amazon.jsii.Kernel.get(this, "sourceFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceFrequency", java.util.Objects.requireNonNull(value, "sourceFrequency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceName() {
        return software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceName", java.util.Objects.requireNonNull(value, "sourceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceSetUpOption() {
        return software.amazon.jsii.Kernel.get(this, "sourceSetUpOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceSetUpOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceSetUpOption", java.util.Objects.requireNonNull(value, "sourceSetUpOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceType() {
        return software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceType", java.util.Objects.requireNonNull(value, "sourceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTroubleshootingText() {
        return software.amazon.jsii.Kernel.get(this, "troubleshootingText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTroubleshootingText(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "troubleshootingText", java.util.Objects.requireNonNull(value, "troubleshootingText is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.auditmanager_control.AuditmanagerControlControlMappingSources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
