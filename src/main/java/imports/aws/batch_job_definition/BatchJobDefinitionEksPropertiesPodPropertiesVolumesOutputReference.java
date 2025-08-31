package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference")
public class BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putEmptyDir(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir value) {
        software.amazon.jsii.Kernel.call(this, "putEmptyDir", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHostPath(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath value) {
        software.amazon.jsii.Kernel.call(this, "putHostPath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSecret(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret value) {
        software.amazon.jsii.Kernel.call(this, "putSecret", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEmptyDir() {
        software.amazon.jsii.Kernel.call(this, "resetEmptyDir", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostPath() {
        software.amazon.jsii.Kernel.call(this, "resetHostPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecret() {
        software.amazon.jsii.Kernel.call(this, "resetSecret", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference getEmptyDir() {
        return software.amazon.jsii.Kernel.get(this, "emptyDir", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference getHostPath() {
        return software.amazon.jsii.Kernel.get(this, "hostPath", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference getSecret() {
        return software.amazon.jsii.Kernel.get(this, "secret", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir getEmptyDirInput() {
        return software.amazon.jsii.Kernel.get(this, "emptyDirInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath getHostPathInput() {
        return software.amazon.jsii.Kernel.get(this, "hostPathInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret getSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "secretInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
