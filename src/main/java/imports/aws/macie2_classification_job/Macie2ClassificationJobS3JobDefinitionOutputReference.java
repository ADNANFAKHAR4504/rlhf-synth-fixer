package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionOutputReference")
public class Macie2ClassificationJobS3JobDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2ClassificationJobS3JobDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJobS3JobDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Macie2ClassificationJobS3JobDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBucketCriteria(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria value) {
        software.amazon.jsii.Kernel.call(this, "putBucketCriteria", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBucketDefinitions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitions> __cast_cd4240 = (java.util.List<imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBucketDefinitions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScoping(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping value) {
        software.amazon.jsii.Kernel.call(this, "putScoping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBucketCriteria() {
        software.amazon.jsii.Kernel.call(this, "resetBucketCriteria", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketDefinitions() {
        software.amazon.jsii.Kernel.call(this, "resetBucketDefinitions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScoping() {
        software.amazon.jsii.Kernel.call(this, "resetScoping", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference getBucketCriteria() {
        return software.amazon.jsii.Kernel.get(this, "bucketCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitionsList getBucketDefinitions() {
        return software.amazon.jsii.Kernel.get(this, "bucketDefinitions", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingOutputReference getScoping() {
        return software.amazon.jsii.Kernel.get(this, "scoping", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria getBucketCriteriaInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketCriteriaInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBucketDefinitionsInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketDefinitionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping getScopingInput() {
        return software.amazon.jsii.Kernel.get(this, "scopingInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
