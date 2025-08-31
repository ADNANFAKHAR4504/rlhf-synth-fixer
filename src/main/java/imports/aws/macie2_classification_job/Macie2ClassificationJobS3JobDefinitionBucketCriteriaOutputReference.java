package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference")
public class Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Macie2ClassificationJobS3JobDefinitionBucketCriteriaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExcludes(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes value) {
        software.amazon.jsii.Kernel.call(this, "putExcludes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIncludes(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes value) {
        software.amazon.jsii.Kernel.call(this, "putIncludes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExcludes() {
        software.amazon.jsii.Kernel.call(this, "resetExcludes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludes() {
        software.amazon.jsii.Kernel.call(this, "resetIncludes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesOutputReference getExcludes() {
        return software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesOutputReference getIncludes() {
        return software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes getExcludesInput() {
        return software.amazon.jsii.Kernel.get(this, "excludesInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes getIncludesInput() {
        return software.amazon.jsii.Kernel.get(this, "includesInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
