package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference")
public class BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOptional() {
        software.amazon.jsii.Kernel.call(this, "resetOptional", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOptionalInput() {
        return software.amazon.jsii.Kernel.get(this, "optionalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretNameInput() {
        return software.amazon.jsii.Kernel.get(this, "secretNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOptional() {
        return software.amazon.jsii.Kernel.get(this, "optional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOptional(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "optional", java.util.Objects.requireNonNull(value, "optional is required"));
    }

    public void setOptional(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "optional", java.util.Objects.requireNonNull(value, "optional is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretName() {
        return software.amazon.jsii.Kernel.get(this, "secretName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretName", java.util.Objects.requireNonNull(value, "secretName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
