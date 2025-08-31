package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.848Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionOutputReference")
public class Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTagValues(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValues>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValues> __cast_cd4240 = (java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValues>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValues __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTagValues", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComparator() {
        software.amazon.jsii.Kernel.call(this, "resetComparator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagValues() {
        software.amazon.jsii.Kernel.call(this, "resetTagValues", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValuesList getTagValues() {
        return software.amazon.jsii.Kernel.get(this, "tagValues", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterionTagValuesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComparatorInput() {
        return software.amazon.jsii.Kernel.get(this, "comparatorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTagValuesInput() {
        return software.amazon.jsii.Kernel.get(this, "tagValuesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComparator() {
        return software.amazon.jsii.Kernel.get(this, "comparator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComparator(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comparator", java.util.Objects.requireNonNull(value, "comparator is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
