package imports.aws.data_aws_batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.473Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsBatchJobDefinition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesOutputReference")
public class DataAwsBatchJobDefinitionEksPropertiesPodPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsBatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsBatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsBatchJobDefinitionEksPropertiesPodPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesContainersList getContainers() {
        return software.amazon.jsii.Kernel.get(this, "containers", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesContainersList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "dnsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getHostNetwork() {
        return software.amazon.jsii.Kernel.get(this, "hostNetwork", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretsList getImagePullSecrets() {
        return software.amazon.jsii.Kernel.get(this, "imagePullSecrets", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesInitContainersList getInitContainers() {
        return software.amazon.jsii.Kernel.get(this, "initContainers", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesInitContainersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesMetadataList getMetadata() {
        return software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesMetadataList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccountName() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getShareProcessNamespace() {
        return software.amazon.jsii.Kernel.get(this, "shareProcessNamespace", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesVolumesList getVolumes() {
        return software.amazon.jsii.Kernel.get(this, "volumes", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodPropertiesVolumesList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionEksPropertiesPodProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
