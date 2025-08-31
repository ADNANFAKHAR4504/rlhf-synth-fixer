package imports.aws.macie2_findings_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.855Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteriaOutputReference")
public class Macie2FindingsFilterFindingCriteriaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2FindingsFilterFindingCriteriaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2FindingsFilterFindingCriteriaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Macie2FindingsFilterFindingCriteriaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCriterion(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion> __cast_cd4240 = (java.util.List<imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCriterion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCriterion() {
        software.amazon.jsii.Kernel.call(this, "resetCriterion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterionList getCriterion() {
        return software.amazon.jsii.Kernel.get(this, "criterion", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCriterionInput() {
        return software.amazon.jsii.Kernel.get(this, "criterionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteria getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteria.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteria value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
