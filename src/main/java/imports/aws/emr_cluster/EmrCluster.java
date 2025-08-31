package imports.aws.emr_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster aws_emr_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.191Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrCluster")
public class EmrCluster extends com.hashicorp.cdktf.TerraformResource {

    protected EmrCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.emr_cluster.EmrCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster aws_emr_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EmrCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EmrCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrCluster to import. This parameter is required.
     * @param importFromId The id of the existing EmrCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EmrCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_cluster.EmrCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EmrCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrCluster to import. This parameter is required.
     * @param importFromId The id of the existing EmrCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_cluster.EmrCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoTerminationPolicy(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putAutoTerminationPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBootstrapAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterBootstrapAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterBootstrapAction> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterBootstrapAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterBootstrapAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBootstrapAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCoreInstanceFleet(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleet value) {
        software.amazon.jsii.Kernel.call(this, "putCoreInstanceFleet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCoreInstanceGroup(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceGroup value) {
        software.amazon.jsii.Kernel.call(this, "putCoreInstanceGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2Attributes(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterEc2Attributes value) {
        software.amazon.jsii.Kernel.call(this, "putEc2Attributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKerberosAttributes(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterKerberosAttributes value) {
        software.amazon.jsii.Kernel.call(this, "putKerberosAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMasterInstanceFleet(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceFleet value) {
        software.amazon.jsii.Kernel.call(this, "putMasterInstanceFleet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMasterInstanceGroup(final @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceGroup value) {
        software.amazon.jsii.Kernel.call(this, "putMasterInstanceGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacementGroupConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterPlacementGroupConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterPlacementGroupConfig> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterPlacementGroupConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterPlacementGroupConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementGroupConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStep(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_cluster.EmrClusterStep>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_cluster.EmrClusterStep> __cast_cd4240 = (java.util.List<imports.aws.emr_cluster.EmrClusterStep>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_cluster.EmrClusterStep __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStep", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalInfo() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplications() {
        software.amazon.jsii.Kernel.call(this, "resetApplications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoscalingRole() {
        software.amazon.jsii.Kernel.call(this, "resetAutoscalingRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoTerminationPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoTerminationPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBootstrapAction() {
        software.amazon.jsii.Kernel.call(this, "resetBootstrapAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfigurationsJson() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationsJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreInstanceFleet() {
        software.amazon.jsii.Kernel.call(this, "resetCoreInstanceFleet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreInstanceGroup() {
        software.amazon.jsii.Kernel.call(this, "resetCoreInstanceGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomAmiId() {
        software.amazon.jsii.Kernel.call(this, "resetCustomAmiId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsRootVolumeSize() {
        software.amazon.jsii.Kernel.call(this, "resetEbsRootVolumeSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2Attributes() {
        software.amazon.jsii.Kernel.call(this, "resetEc2Attributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeepJobFlowAliveWhenNoSteps() {
        software.amazon.jsii.Kernel.call(this, "resetKeepJobFlowAliveWhenNoSteps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetListStepsStates() {
        software.amazon.jsii.Kernel.call(this, "resetListStepsStates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogEncryptionKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetLogEncryptionKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogUri() {
        software.amazon.jsii.Kernel.call(this, "resetLogUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterInstanceFleet() {
        software.amazon.jsii.Kernel.call(this, "resetMasterInstanceFleet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterInstanceGroup() {
        software.amazon.jsii.Kernel.call(this, "resetMasterInstanceGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementGroupConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementGroupConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleDownBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetScaleDownBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStep() {
        software.amazon.jsii.Kernel.call(this, "resetStep", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepConcurrencyLevel() {
        software.amazon.jsii.Kernel.call(this, "resetStepConcurrencyLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminationProtection() {
        software.amazon.jsii.Kernel.call(this, "resetTerminationProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnhealthyNodeReplacement() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyNodeReplacement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisibleToAllUsers() {
        software.amazon.jsii.Kernel.call(this, "resetVisibleToAllUsers", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterAutoTerminationPolicyOutputReference getAutoTerminationPolicy() {
        return software.amazon.jsii.Kernel.get(this, "autoTerminationPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterAutoTerminationPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterBootstrapActionList getBootstrapAction() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapAction", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterBootstrapActionList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterState() {
        return software.amazon.jsii.Kernel.get(this, "clusterState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceFleetOutputReference getCoreInstanceFleet() {
        return software.amazon.jsii.Kernel.get(this, "coreInstanceFleet", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleetOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterCoreInstanceGroupOutputReference getCoreInstanceGroup() {
        return software.amazon.jsii.Kernel.get(this, "coreInstanceGroup", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceGroupOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterEc2AttributesOutputReference getEc2Attributes() {
        return software.amazon.jsii.Kernel.get(this, "ec2Attributes", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterEc2AttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterKerberosAttributesOutputReference getKerberosAttributes() {
        return software.amazon.jsii.Kernel.get(this, "kerberosAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterKerberosAttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceFleetOutputReference getMasterInstanceFleet() {
        return software.amazon.jsii.Kernel.get(this, "masterInstanceFleet", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterMasterInstanceGroupOutputReference getMasterInstanceGroup() {
        return software.amazon.jsii.Kernel.get(this, "masterInstanceGroup", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceGroupOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "masterPublicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterPlacementGroupConfigList getPlacementGroupConfig() {
        return software.amazon.jsii.Kernel.get(this, "placementGroupConfig", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterPlacementGroupConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_cluster.EmrClusterStepList getStep() {
        return software.amazon.jsii.Kernel.get(this, "step", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterStepList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdditionalInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalInfoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getApplicationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "applicationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoscalingRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy getAutoTerminationPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "autoTerminationPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapActionInput() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationsJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationsJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceFleet getCoreInstanceFleetInput() {
        return software.amazon.jsii.Kernel.get(this, "coreInstanceFleetInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceFleet.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterCoreInstanceGroup getCoreInstanceGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "coreInstanceGroupInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterCoreInstanceGroup.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomAmiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "customAmiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEbsRootVolumeSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsRootVolumeSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterEc2Attributes getEc2AttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2AttributesInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterEc2Attributes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKeepJobFlowAliveWhenNoStepsInput() {
        return software.amazon.jsii.Kernel.get(this, "keepJobFlowAliveWhenNoStepsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterKerberosAttributes getKerberosAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "kerberosAttributesInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterKerberosAttributes.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getListStepsStatesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "listStepsStatesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogEncryptionKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "logEncryptionKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogUriInput() {
        return software.amazon.jsii.Kernel.get(this, "logUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleet getMasterInstanceFleetInput() {
        return software.amazon.jsii.Kernel.get(this, "masterInstanceFleetInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleet.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceGroup getMasterInstanceGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "masterInstanceGroupInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceGroup.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlacementGroupConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "placementGroupConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScaleDownBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleDownBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "securityConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStepConcurrencyLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "stepConcurrencyLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStepInput() {
        return software.amazon.jsii.Kernel.get(this, "stepInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminationProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "terminationProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUnhealthyNodeReplacementInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyNodeReplacementInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVisibleToAllUsersInput() {
        return software.amazon.jsii.Kernel.get(this, "visibleToAllUsersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdditionalInfo() {
        return software.amazon.jsii.Kernel.get(this, "additionalInfo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdditionalInfo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "additionalInfo", java.util.Objects.requireNonNull(value, "additionalInfo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getApplications() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "applications", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setApplications(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "applications", java.util.Objects.requireNonNull(value, "applications is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoscalingRole() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoscalingRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoscalingRole", java.util.Objects.requireNonNull(value, "autoscalingRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "configurations", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurations(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurations", java.util.Objects.requireNonNull(value, "configurations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationsJson() {
        return software.amazon.jsii.Kernel.get(this, "configurationsJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationsJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationsJson", java.util.Objects.requireNonNull(value, "configurationsJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomAmiId() {
        return software.amazon.jsii.Kernel.get(this, "customAmiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomAmiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customAmiId", java.util.Objects.requireNonNull(value, "customAmiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsRootVolumeSize() {
        return software.amazon.jsii.Kernel.get(this, "ebsRootVolumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEbsRootVolumeSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ebsRootVolumeSize", java.util.Objects.requireNonNull(value, "ebsRootVolumeSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getKeepJobFlowAliveWhenNoSteps() {
        return software.amazon.jsii.Kernel.get(this, "keepJobFlowAliveWhenNoSteps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setKeepJobFlowAliveWhenNoSteps(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "keepJobFlowAliveWhenNoSteps", java.util.Objects.requireNonNull(value, "keepJobFlowAliveWhenNoSteps is required"));
    }

    public void setKeepJobFlowAliveWhenNoSteps(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "keepJobFlowAliveWhenNoSteps", java.util.Objects.requireNonNull(value, "keepJobFlowAliveWhenNoSteps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getListStepsStates() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "listStepsStates", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setListStepsStates(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "listStepsStates", java.util.Objects.requireNonNull(value, "listStepsStates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogEncryptionKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "logEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogEncryptionKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logEncryptionKmsKeyId", java.util.Objects.requireNonNull(value, "logEncryptionKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogUri() {
        return software.amazon.jsii.Kernel.get(this, "logUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logUri", java.util.Objects.requireNonNull(value, "logUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseLabel", java.util.Objects.requireNonNull(value, "releaseLabel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScaleDownBehavior() {
        return software.amazon.jsii.Kernel.get(this, "scaleDownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScaleDownBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scaleDownBehavior", java.util.Objects.requireNonNull(value, "scaleDownBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityConfiguration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityConfiguration", java.util.Objects.requireNonNull(value, "securityConfiguration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRole", java.util.Objects.requireNonNull(value, "serviceRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStepConcurrencyLevel() {
        return software.amazon.jsii.Kernel.get(this, "stepConcurrencyLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStepConcurrencyLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "stepConcurrencyLevel", java.util.Objects.requireNonNull(value, "stepConcurrencyLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTerminationProtection() {
        return software.amazon.jsii.Kernel.get(this, "terminationProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTerminationProtection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "terminationProtection", java.util.Objects.requireNonNull(value, "terminationProtection is required"));
    }

    public void setTerminationProtection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "terminationProtection", java.util.Objects.requireNonNull(value, "terminationProtection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUnhealthyNodeReplacement() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyNodeReplacement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUnhealthyNodeReplacement(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "unhealthyNodeReplacement", java.util.Objects.requireNonNull(value, "unhealthyNodeReplacement is required"));
    }

    public void setUnhealthyNodeReplacement(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "unhealthyNodeReplacement", java.util.Objects.requireNonNull(value, "unhealthyNodeReplacement is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVisibleToAllUsers() {
        return software.amazon.jsii.Kernel.get(this, "visibleToAllUsers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVisibleToAllUsers(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "visibleToAllUsers", java.util.Objects.requireNonNull(value, "visibleToAllUsers is required"));
    }

    public void setVisibleToAllUsers(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "visibleToAllUsers", java.util.Objects.requireNonNull(value, "visibleToAllUsers is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.emr_cluster.EmrCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.emr_cluster.EmrCluster> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.emr_cluster.EmrClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.emr_cluster.EmrClusterConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#release_label EmrCluster#release_label}.
         * <p>
         * @return {@code this}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#release_label EmrCluster#release_label}. This parameter is required.
         */
        public Builder releaseLabel(final java.lang.String releaseLabel) {
            this.config.releaseLabel(releaseLabel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#service_role EmrCluster#service_role}.
         * <p>
         * @return {@code this}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#service_role EmrCluster#service_role}. This parameter is required.
         */
        public Builder serviceRole(final java.lang.String serviceRole) {
            this.config.serviceRole(serviceRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#additional_info EmrCluster#additional_info}.
         * <p>
         * @return {@code this}
         * @param additionalInfo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#additional_info EmrCluster#additional_info}. This parameter is required.
         */
        public Builder additionalInfo(final java.lang.String additionalInfo) {
            this.config.additionalInfo(additionalInfo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#applications EmrCluster#applications}.
         * <p>
         * @return {@code this}
         * @param applications Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#applications EmrCluster#applications}. This parameter is required.
         */
        public Builder applications(final java.util.List<java.lang.String> applications) {
            this.config.applications(applications);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_role EmrCluster#autoscaling_role}.
         * <p>
         * @return {@code this}
         * @param autoscalingRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_role EmrCluster#autoscaling_role}. This parameter is required.
         */
        public Builder autoscalingRole(final java.lang.String autoscalingRole) {
            this.config.autoscalingRole(autoscalingRole);
            return this;
        }

        /**
         * auto_termination_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#auto_termination_policy EmrCluster#auto_termination_policy}
         * <p>
         * @return {@code this}
         * @param autoTerminationPolicy auto_termination_policy block. This parameter is required.
         */
        public Builder autoTerminationPolicy(final imports.aws.emr_cluster.EmrClusterAutoTerminationPolicy autoTerminationPolicy) {
            this.config.autoTerminationPolicy(autoTerminationPolicy);
            return this;
        }

        /**
         * bootstrap_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bootstrap_action EmrCluster#bootstrap_action}
         * <p>
         * @return {@code this}
         * @param bootstrapAction bootstrap_action block. This parameter is required.
         */
        public Builder bootstrapAction(final com.hashicorp.cdktf.IResolvable bootstrapAction) {
            this.config.bootstrapAction(bootstrapAction);
            return this;
        }
        /**
         * bootstrap_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bootstrap_action EmrCluster#bootstrap_action}
         * <p>
         * @return {@code this}
         * @param bootstrapAction bootstrap_action block. This parameter is required.
         */
        public Builder bootstrapAction(final java.util.List<? extends imports.aws.emr_cluster.EmrClusterBootstrapAction> bootstrapAction) {
            this.config.bootstrapAction(bootstrapAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}.
         * <p>
         * @return {@code this}
         * @param configurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}. This parameter is required.
         */
        public Builder configurations(final java.lang.String configurations) {
            this.config.configurations(configurations);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations_json EmrCluster#configurations_json}.
         * <p>
         * @return {@code this}
         * @param configurationsJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations_json EmrCluster#configurations_json}. This parameter is required.
         */
        public Builder configurationsJson(final java.lang.String configurationsJson) {
            this.config.configurationsJson(configurationsJson);
            return this;
        }

        /**
         * core_instance_fleet block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_fleet EmrCluster#core_instance_fleet}
         * <p>
         * @return {@code this}
         * @param coreInstanceFleet core_instance_fleet block. This parameter is required.
         */
        public Builder coreInstanceFleet(final imports.aws.emr_cluster.EmrClusterCoreInstanceFleet coreInstanceFleet) {
            this.config.coreInstanceFleet(coreInstanceFleet);
            return this;
        }

        /**
         * core_instance_group block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#core_instance_group EmrCluster#core_instance_group}
         * <p>
         * @return {@code this}
         * @param coreInstanceGroup core_instance_group block. This parameter is required.
         */
        public Builder coreInstanceGroup(final imports.aws.emr_cluster.EmrClusterCoreInstanceGroup coreInstanceGroup) {
            this.config.coreInstanceGroup(coreInstanceGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#custom_ami_id EmrCluster#custom_ami_id}.
         * <p>
         * @return {@code this}
         * @param customAmiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#custom_ami_id EmrCluster#custom_ami_id}. This parameter is required.
         */
        public Builder customAmiId(final java.lang.String customAmiId) {
            this.config.customAmiId(customAmiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_root_volume_size EmrCluster#ebs_root_volume_size}.
         * <p>
         * @return {@code this}
         * @param ebsRootVolumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_root_volume_size EmrCluster#ebs_root_volume_size}. This parameter is required.
         */
        public Builder ebsRootVolumeSize(final java.lang.Number ebsRootVolumeSize) {
            this.config.ebsRootVolumeSize(ebsRootVolumeSize);
            return this;
        }

        /**
         * ec2_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ec2_attributes EmrCluster#ec2_attributes}
         * <p>
         * @return {@code this}
         * @param ec2Attributes ec2_attributes block. This parameter is required.
         */
        public Builder ec2Attributes(final imports.aws.emr_cluster.EmrClusterEc2Attributes ec2Attributes) {
            this.config.ec2Attributes(ec2Attributes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#id EmrCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#id EmrCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}.
         * <p>
         * @return {@code this}
         * @param keepJobFlowAliveWhenNoSteps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}. This parameter is required.
         */
        public Builder keepJobFlowAliveWhenNoSteps(final java.lang.Boolean keepJobFlowAliveWhenNoSteps) {
            this.config.keepJobFlowAliveWhenNoSteps(keepJobFlowAliveWhenNoSteps);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}.
         * <p>
         * @return {@code this}
         * @param keepJobFlowAliveWhenNoSteps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#keep_job_flow_alive_when_no_steps EmrCluster#keep_job_flow_alive_when_no_steps}. This parameter is required.
         */
        public Builder keepJobFlowAliveWhenNoSteps(final com.hashicorp.cdktf.IResolvable keepJobFlowAliveWhenNoSteps) {
            this.config.keepJobFlowAliveWhenNoSteps(keepJobFlowAliveWhenNoSteps);
            return this;
        }

        /**
         * kerberos_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#kerberos_attributes EmrCluster#kerberos_attributes}
         * <p>
         * @return {@code this}
         * @param kerberosAttributes kerberos_attributes block. This parameter is required.
         */
        public Builder kerberosAttributes(final imports.aws.emr_cluster.EmrClusterKerberosAttributes kerberosAttributes) {
            this.config.kerberosAttributes(kerberosAttributes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#list_steps_states EmrCluster#list_steps_states}.
         * <p>
         * @return {@code this}
         * @param listStepsStates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#list_steps_states EmrCluster#list_steps_states}. This parameter is required.
         */
        public Builder listStepsStates(final java.util.List<java.lang.String> listStepsStates) {
            this.config.listStepsStates(listStepsStates);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_encryption_kms_key_id EmrCluster#log_encryption_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param logEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_encryption_kms_key_id EmrCluster#log_encryption_kms_key_id}. This parameter is required.
         */
        public Builder logEncryptionKmsKeyId(final java.lang.String logEncryptionKmsKeyId) {
            this.config.logEncryptionKmsKeyId(logEncryptionKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_uri EmrCluster#log_uri}.
         * <p>
         * @return {@code this}
         * @param logUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#log_uri EmrCluster#log_uri}. This parameter is required.
         */
        public Builder logUri(final java.lang.String logUri) {
            this.config.logUri(logUri);
            return this;
        }

        /**
         * master_instance_fleet block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_fleet EmrCluster#master_instance_fleet}
         * <p>
         * @return {@code this}
         * @param masterInstanceFleet master_instance_fleet block. This parameter is required.
         */
        public Builder masterInstanceFleet(final imports.aws.emr_cluster.EmrClusterMasterInstanceFleet masterInstanceFleet) {
            this.config.masterInstanceFleet(masterInstanceFleet);
            return this;
        }

        /**
         * master_instance_group block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#master_instance_group EmrCluster#master_instance_group}
         * <p>
         * @return {@code this}
         * @param masterInstanceGroup master_instance_group block. This parameter is required.
         */
        public Builder masterInstanceGroup(final imports.aws.emr_cluster.EmrClusterMasterInstanceGroup masterInstanceGroup) {
            this.config.masterInstanceGroup(masterInstanceGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}.
         * <p>
         * @return {@code this}
         * @param placementGroupConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}. This parameter is required.
         */
        public Builder placementGroupConfig(final com.hashicorp.cdktf.IResolvable placementGroupConfig) {
            this.config.placementGroupConfig(placementGroupConfig);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}.
         * <p>
         * @return {@code this}
         * @param placementGroupConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_group_config EmrCluster#placement_group_config}. This parameter is required.
         */
        public Builder placementGroupConfig(final java.util.List<? extends imports.aws.emr_cluster.EmrClusterPlacementGroupConfig> placementGroupConfig) {
            this.config.placementGroupConfig(placementGroupConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#scale_down_behavior EmrCluster#scale_down_behavior}.
         * <p>
         * @return {@code this}
         * @param scaleDownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#scale_down_behavior EmrCluster#scale_down_behavior}. This parameter is required.
         */
        public Builder scaleDownBehavior(final java.lang.String scaleDownBehavior) {
            this.config.scaleDownBehavior(scaleDownBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#security_configuration EmrCluster#security_configuration}.
         * <p>
         * @return {@code this}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#security_configuration EmrCluster#security_configuration}. This parameter is required.
         */
        public Builder securityConfiguration(final java.lang.String securityConfiguration) {
            this.config.securityConfiguration(securityConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}.
         * <p>
         * @return {@code this}
         * @param step Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}. This parameter is required.
         */
        public Builder step(final com.hashicorp.cdktf.IResolvable step) {
            this.config.step(step);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}.
         * <p>
         * @return {@code this}
         * @param step Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step EmrCluster#step}. This parameter is required.
         */
        public Builder step(final java.util.List<? extends imports.aws.emr_cluster.EmrClusterStep> step) {
            this.config.step(step);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step_concurrency_level EmrCluster#step_concurrency_level}.
         * <p>
         * @return {@code this}
         * @param stepConcurrencyLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#step_concurrency_level EmrCluster#step_concurrency_level}. This parameter is required.
         */
        public Builder stepConcurrencyLevel(final java.lang.Number stepConcurrencyLevel) {
            this.config.stepConcurrencyLevel(stepConcurrencyLevel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags EmrCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags EmrCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags_all EmrCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#tags_all EmrCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}.
         * <p>
         * @return {@code this}
         * @param terminationProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}. This parameter is required.
         */
        public Builder terminationProtection(final java.lang.Boolean terminationProtection) {
            this.config.terminationProtection(terminationProtection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}.
         * <p>
         * @return {@code this}
         * @param terminationProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#termination_protection EmrCluster#termination_protection}. This parameter is required.
         */
        public Builder terminationProtection(final com.hashicorp.cdktf.IResolvable terminationProtection) {
            this.config.terminationProtection(terminationProtection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}.
         * <p>
         * @return {@code this}
         * @param unhealthyNodeReplacement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}. This parameter is required.
         */
        public Builder unhealthyNodeReplacement(final java.lang.Boolean unhealthyNodeReplacement) {
            this.config.unhealthyNodeReplacement(unhealthyNodeReplacement);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}.
         * <p>
         * @return {@code this}
         * @param unhealthyNodeReplacement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#unhealthy_node_replacement EmrCluster#unhealthy_node_replacement}. This parameter is required.
         */
        public Builder unhealthyNodeReplacement(final com.hashicorp.cdktf.IResolvable unhealthyNodeReplacement) {
            this.config.unhealthyNodeReplacement(unhealthyNodeReplacement);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}.
         * <p>
         * @return {@code this}
         * @param visibleToAllUsers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}. This parameter is required.
         */
        public Builder visibleToAllUsers(final java.lang.Boolean visibleToAllUsers) {
            this.config.visibleToAllUsers(visibleToAllUsers);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}.
         * <p>
         * @return {@code this}
         * @param visibleToAllUsers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#visible_to_all_users EmrCluster#visible_to_all_users}. This parameter is required.
         */
        public Builder visibleToAllUsers(final com.hashicorp.cdktf.IResolvable visibleToAllUsers) {
            this.config.visibleToAllUsers(visibleToAllUsers);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.emr_cluster.EmrCluster}.
         */
        @Override
        public imports.aws.emr_cluster.EmrCluster build() {
            return new imports.aws.emr_cluster.EmrCluster(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
