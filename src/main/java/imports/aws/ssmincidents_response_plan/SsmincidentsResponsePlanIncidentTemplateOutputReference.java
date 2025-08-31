package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateOutputReference")
public class SsmincidentsResponsePlanIncidentTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmincidentsResponsePlanIncidentTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmincidentsResponsePlanIncidentTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmincidentsResponsePlanIncidentTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNotificationTarget(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget> __cast_cd4240 = (java.util.List<imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNotificationTarget", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDedupeString() {
        software.amazon.jsii.Kernel.call(this, "resetDedupeString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncidentTags() {
        software.amazon.jsii.Kernel.call(this, "resetIncidentTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationTarget() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSummary() {
        software.amazon.jsii.Kernel.call(this, "resetSummary", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTargetList getNotificationTarget() {
        return software.amazon.jsii.Kernel.get(this, "notificationTarget", software.amazon.jsii.NativeType.forClass(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTargetList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDedupeStringInput() {
        return software.amazon.jsii.Kernel.get(this, "dedupeStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImpactInput() {
        return software.amazon.jsii.Kernel.get(this, "impactInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getIncidentTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "incidentTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotificationTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationTargetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSummaryInput() {
        return software.amazon.jsii.Kernel.get(this, "summaryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "titleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDedupeString() {
        return software.amazon.jsii.Kernel.get(this, "dedupeString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDedupeString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dedupeString", java.util.Objects.requireNonNull(value, "dedupeString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImpact() {
        return software.amazon.jsii.Kernel.get(this, "impact", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImpact(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "impact", java.util.Objects.requireNonNull(value, "impact is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getIncidentTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "incidentTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncidentTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "incidentTags", java.util.Objects.requireNonNull(value, "incidentTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSummary() {
        return software.amazon.jsii.Kernel.get(this, "summary", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSummary(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "summary", java.util.Objects.requireNonNull(value, "summary is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTitle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "title", java.util.Objects.requireNonNull(value, "title is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
