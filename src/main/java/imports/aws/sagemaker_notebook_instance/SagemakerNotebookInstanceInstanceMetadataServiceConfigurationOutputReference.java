package imports.aws.sagemaker_notebook_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.338Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerNotebookInstance.SagemakerNotebookInstanceInstanceMetadataServiceConfigurationOutputReference")
public class SagemakerNotebookInstanceInstanceMetadataServiceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerNotebookInstanceInstanceMetadataServiceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerNotebookInstanceInstanceMetadataServiceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerNotebookInstanceInstanceMetadataServiceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMinimumInstanceMetadataServiceVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumInstanceMetadataServiceVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinimumInstanceMetadataServiceVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumInstanceMetadataServiceVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinimumInstanceMetadataServiceVersion() {
        return software.amazon.jsii.Kernel.get(this, "minimumInstanceMetadataServiceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinimumInstanceMetadataServiceVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minimumInstanceMetadataServiceVersion", java.util.Objects.requireNonNull(value, "minimumInstanceMetadataServiceVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
