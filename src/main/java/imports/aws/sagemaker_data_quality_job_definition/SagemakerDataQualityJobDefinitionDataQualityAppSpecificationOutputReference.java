package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference")
public class SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostAnalyticsProcessorSourceUri() {
        software.amazon.jsii.Kernel.call(this, "resetPostAnalyticsProcessorSourceUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordPreprocessorSourceUri() {
        software.amazon.jsii.Kernel.call(this, "resetRecordPreprocessorSourceUri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "environmentInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageUriInput() {
        return software.amazon.jsii.Kernel.get(this, "imageUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostAnalyticsProcessorSourceUriInput() {
        return software.amazon.jsii.Kernel.get(this, "postAnalyticsProcessorSourceUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordPreprocessorSourceUriInput() {
        return software.amazon.jsii.Kernel.get(this, "recordPreprocessorSourceUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnvironment(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "environment", java.util.Objects.requireNonNull(value, "environment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageUri() {
        return software.amazon.jsii.Kernel.get(this, "imageUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageUri", java.util.Objects.requireNonNull(value, "imageUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostAnalyticsProcessorSourceUri() {
        return software.amazon.jsii.Kernel.get(this, "postAnalyticsProcessorSourceUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostAnalyticsProcessorSourceUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postAnalyticsProcessorSourceUri", java.util.Objects.requireNonNull(value, "postAnalyticsProcessorSourceUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordPreprocessorSourceUri() {
        return software.amazon.jsii.Kernel.get(this, "recordPreprocessorSourceUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordPreprocessorSourceUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordPreprocessorSourceUri", java.util.Objects.requireNonNull(value, "recordPreprocessorSourceUri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
