package imports.aws.data_aws_batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.475Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsBatchJobDefinition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerOutputReference")
public class DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCommand() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerEnvironmentList getEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerEnvironmentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerEphemeralStorageList getEphemeralStorage() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerEphemeralStorageList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerFargatePlatformConfigurationList getFargatePlatformConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "fargatePlatformConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerFargatePlatformConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImage() {
        return software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "jobRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerLinuxParametersList getLinuxParameters() {
        return software.amazon.jsii.Kernel.get(this, "linuxParameters", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerLinuxParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerLogConfigurationList getLogConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerLogConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerMountPointsList getMountPoints() {
        return software.amazon.jsii.Kernel.get(this, "mountPoints", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerMountPointsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerNetworkConfigurationList getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerNetworkConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getPrivileged() {
        return software.amazon.jsii.Kernel.get(this, "privileged", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getReadonlyRootFilesystem() {
        return software.amazon.jsii.Kernel.get(this, "readonlyRootFilesystem", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerResourceRequirementsList getResourceRequirements() {
        return software.amazon.jsii.Kernel.get(this, "resourceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerResourceRequirementsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerRuntimePlatformList getRuntimePlatform() {
        return software.amazon.jsii.Kernel.get(this, "runtimePlatform", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerRuntimePlatformList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerSecretsList getSecrets() {
        return software.amazon.jsii.Kernel.get(this, "secrets", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerSecretsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerUlimitsList getUlimits() {
        return software.amazon.jsii.Kernel.get(this, "ulimits", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerUlimitsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUser() {
        return software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerVolumesList getVolumes() {
        return software.amazon.jsii.Kernel.get(this, "volumes", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainerVolumesList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainer getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainer.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_job_definition.DataAwsBatchJobDefinitionNodePropertiesNodeRangePropertiesContainer value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
