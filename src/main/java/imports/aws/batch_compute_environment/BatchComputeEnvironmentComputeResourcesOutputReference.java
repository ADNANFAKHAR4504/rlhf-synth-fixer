package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResourcesOutputReference")
public class BatchComputeEnvironmentComputeResourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchComputeEnvironmentComputeResourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchComputeEnvironmentComputeResourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchComputeEnvironmentComputeResourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEc2Configuration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2Configuration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2Configuration> __cast_cd4240 = (java.util.List<imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2Configuration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2Configuration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBidPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetBidPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredVcpus() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredVcpus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2Configuration() {
        software.amazon.jsii.Kernel.call(this, "resetEc2Configuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2KeyPair() {
        software.amazon.jsii.Kernel.call(this, "resetEc2KeyPair", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageId() {
        software.amazon.jsii.Kernel.call(this, "resetImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceRole() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinVcpus() {
        software.amazon.jsii.Kernel.call(this, "resetMinVcpus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementGroup() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotIamFleetRole() {
        software.amazon.jsii.Kernel.call(this, "resetSpotIamFleetRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2ConfigurationList getEc2Configuration() {
        return software.amazon.jsii.Kernel.get(this, "ec2Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2ConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBidPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "bidPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredVcpusInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredVcpusInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2ConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEc2KeyPairInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2KeyPairInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "imageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceTypeInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxVcpusInput() {
        return software.amazon.jsii.Kernel.get(this, "maxVcpusInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinVcpusInput() {
        return software.amazon.jsii.Kernel.get(this, "minVcpusInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "placementGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotIamFleetRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "spotIamFleetRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllocationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allocationStrategy", java.util.Objects.requireNonNull(value, "allocationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBidPercentage() {
        return software.amazon.jsii.Kernel.get(this, "bidPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBidPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bidPercentage", java.util.Objects.requireNonNull(value, "bidPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredVcpus() {
        return software.amazon.jsii.Kernel.get(this, "desiredVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredVcpus(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredVcpus", java.util.Objects.requireNonNull(value, "desiredVcpus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEc2KeyPair() {
        return software.amazon.jsii.Kernel.get(this, "ec2KeyPair", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEc2KeyPair(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ec2KeyPair", java.util.Objects.requireNonNull(value, "ec2KeyPair is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageId() {
        return software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageId", java.util.Objects.requireNonNull(value, "imageId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceRole() {
        return software.amazon.jsii.Kernel.get(this, "instanceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceRole", java.util.Objects.requireNonNull(value, "instanceRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstanceType() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxVcpus() {
        return software.amazon.jsii.Kernel.get(this, "maxVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxVcpus(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxVcpus", java.util.Objects.requireNonNull(value, "maxVcpus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinVcpus() {
        return software.amazon.jsii.Kernel.get(this, "minVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinVcpus(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minVcpus", java.util.Objects.requireNonNull(value, "minVcpus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlacementGroup() {
        return software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlacementGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "placementGroup", java.util.Objects.requireNonNull(value, "placementGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotIamFleetRole() {
        return software.amazon.jsii.Kernel.get(this, "spotIamFleetRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotIamFleetRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotIamFleetRole", java.util.Objects.requireNonNull(value, "spotIamFleetRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnets", java.util.Objects.requireNonNull(value, "subnets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
