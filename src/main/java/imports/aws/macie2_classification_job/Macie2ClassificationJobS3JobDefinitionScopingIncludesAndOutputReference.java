package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.850Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndOutputReference")
public class Macie2ClassificationJobS3JobDefinitionScopingIncludesAndOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2ClassificationJobS3JobDefinitionScopingIncludesAndOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJobS3JobDefinitionScopingIncludesAndOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Macie2ClassificationJobS3JobDefinitionScopingIncludesAndOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putSimpleScopeTerm(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm value) {
        software.amazon.jsii.Kernel.call(this, "putSimpleScopeTerm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTagScopeTerm(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm value) {
        software.amazon.jsii.Kernel.call(this, "putTagScopeTerm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSimpleScopeTerm() {
        software.amazon.jsii.Kernel.call(this, "resetSimpleScopeTerm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagScopeTerm() {
        software.amazon.jsii.Kernel.call(this, "resetTagScopeTerm", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTermOutputReference getSimpleScopeTerm() {
        return software.amazon.jsii.Kernel.get(this, "simpleScopeTerm", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTermOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTermOutputReference getTagScopeTerm() {
        return software.amazon.jsii.Kernel.get(this, "tagScopeTerm", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTermOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm getSimpleScopeTermInput() {
        return software.amazon.jsii.Kernel.get(this, "simpleScopeTermInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm getTagScopeTermInput() {
        return software.amazon.jsii.Kernel.get(this, "tagScopeTermInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
