package imports.aws.codedeploy_deployment_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group aws_codedeploy_deployment_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroup")
public class CodedeployDeploymentGroup extends com.hashicorp.cdktf.TerraformResource {

    protected CodedeployDeploymentGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group aws_codedeploy_deployment_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CodedeployDeploymentGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CodedeployDeploymentGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodedeployDeploymentGroup to import. This parameter is required.
     * @param importFromId The id of the existing CodedeployDeploymentGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CodedeployDeploymentGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CodedeployDeploymentGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodedeployDeploymentGroup to import. This parameter is required.
     * @param importFromId The id of the existing CodedeployDeploymentGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAlarmConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAlarmConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAutoRollbackConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAutoRollbackConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBlueGreenDeploymentConfig(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig value) {
        software.amazon.jsii.Kernel.call(this, "putBlueGreenDeploymentConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDeploymentStyle(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle value) {
        software.amazon.jsii.Kernel.call(this, "putDeploymentStyle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2TagFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2TagFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2TagSet(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2TagSet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcsService(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService value) {
        software.amazon.jsii.Kernel.call(this, "putEcsService", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLoadBalancerInfo(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo value) {
        software.amazon.jsii.Kernel.call(this, "putLoadBalancerInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOnPremisesInstanceTagFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOnPremisesInstanceTagFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTriggerConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTriggerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlarmConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoRollbackConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAutoRollbackConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoscalingGroups() {
        software.amazon.jsii.Kernel.call(this, "resetAutoscalingGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlueGreenDeploymentConfig() {
        software.amazon.jsii.Kernel.call(this, "resetBlueGreenDeploymentConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentConfigName() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentConfigName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentStyle() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentStyle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2TagFilter() {
        software.amazon.jsii.Kernel.call(this, "resetEc2TagFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2TagSet() {
        software.amazon.jsii.Kernel.call(this, "resetEc2TagSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcsService() {
        software.amazon.jsii.Kernel.call(this, "resetEcsService", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancerInfo() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancerInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnPremisesInstanceTagFilter() {
        software.amazon.jsii.Kernel.call(this, "resetOnPremisesInstanceTagFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutdatedInstancesStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetOutdatedInstancesStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminationHookEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetTerminationHookEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTriggerConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTriggerConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfigurationOutputReference getAlarmConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "alarmConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfigurationOutputReference getAutoRollbackConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "autoRollbackConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference getBlueGreenDeploymentConfig() {
        return software.amazon.jsii.Kernel.get(this, "blueGreenDeploymentConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputePlatform() {
        return software.amazon.jsii.Kernel.get(this, "computePlatform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentGroupId() {
        return software.amazon.jsii.Kernel.get(this, "deploymentGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyleOutputReference getDeploymentStyle() {
        return software.amazon.jsii.Kernel.get(this, "deploymentStyle", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilterList getEc2TagFilter() {
        return software.amazon.jsii.Kernel.get(this, "ec2TagFilter", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSetList getEc2TagSet() {
        return software.amazon.jsii.Kernel.get(this, "ec2TagSet", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsServiceOutputReference getEcsService() {
        return software.amazon.jsii.Kernel.get(this, "ecsService", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsServiceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoOutputReference getLoadBalancerInfo() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilterList getOnPremisesInstanceTagFilter() {
        return software.amazon.jsii.Kernel.get(this, "onPremisesInstanceTagFilter", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfigurationList getTriggerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "triggerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration getAlarmConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppNameInput() {
        return software.amazon.jsii.Kernel.get(this, "appNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration getAutoRollbackConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRollbackConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAutoscalingGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "autoscalingGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig getBlueGreenDeploymentConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "blueGreenDeploymentConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentConfigNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentConfigNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle getDeploymentStyleInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentStyleInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2TagFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2TagFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2TagSetInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2TagSetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService getEcsServiceInput() {
        return software.amazon.jsii.Kernel.get(this, "ecsServiceInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo getLoadBalancerInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOnPremisesInstanceTagFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "onPremisesInstanceTagFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutdatedInstancesStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "outdatedInstancesStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminationHookEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "terminationHookEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTriggerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "triggerConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppName() {
        return software.amazon.jsii.Kernel.get(this, "appName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appName", java.util.Objects.requireNonNull(value, "appName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAutoscalingGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "autoscalingGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAutoscalingGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "autoscalingGroups", java.util.Objects.requireNonNull(value, "autoscalingGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentConfigName() {
        return software.amazon.jsii.Kernel.get(this, "deploymentConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentConfigName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentConfigName", java.util.Objects.requireNonNull(value, "deploymentConfigName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentGroupName() {
        return software.amazon.jsii.Kernel.get(this, "deploymentGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentGroupName", java.util.Objects.requireNonNull(value, "deploymentGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutdatedInstancesStrategy() {
        return software.amazon.jsii.Kernel.get(this, "outdatedInstancesStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutdatedInstancesStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outdatedInstancesStrategy", java.util.Objects.requireNonNull(value, "outdatedInstancesStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRoleArn", java.util.Objects.requireNonNull(value, "serviceRoleArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getTerminationHookEnabled() {
        return software.amazon.jsii.Kernel.get(this, "terminationHookEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTerminationHookEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "terminationHookEnabled", java.util.Objects.requireNonNull(value, "terminationHookEnabled is required"));
    }

    public void setTerminationHookEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "terminationHookEnabled", java.util.Objects.requireNonNull(value, "terminationHookEnabled is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup> {
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
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#app_name CodedeployDeploymentGroup#app_name}.
         * <p>
         * @return {@code this}
         * @param appName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#app_name CodedeployDeploymentGroup#app_name}. This parameter is required.
         */
        public Builder appName(final java.lang.String appName) {
            this.config.appName(appName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_group_name CodedeployDeploymentGroup#deployment_group_name}.
         * <p>
         * @return {@code this}
         * @param deploymentGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_group_name CodedeployDeploymentGroup#deployment_group_name}. This parameter is required.
         */
        public Builder deploymentGroupName(final java.lang.String deploymentGroupName) {
            this.config.deploymentGroupName(deploymentGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_role_arn CodedeployDeploymentGroup#service_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_role_arn CodedeployDeploymentGroup#service_role_arn}. This parameter is required.
         */
        public Builder serviceRoleArn(final java.lang.String serviceRoleArn) {
            this.config.serviceRoleArn(serviceRoleArn);
            return this;
        }

        /**
         * alarm_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#alarm_configuration CodedeployDeploymentGroup#alarm_configuration}
         * <p>
         * @return {@code this}
         * @param alarmConfiguration alarm_configuration block. This parameter is required.
         */
        public Builder alarmConfiguration(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAlarmConfiguration alarmConfiguration) {
            this.config.alarmConfiguration(alarmConfiguration);
            return this;
        }

        /**
         * auto_rollback_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#auto_rollback_configuration CodedeployDeploymentGroup#auto_rollback_configuration}
         * <p>
         * @return {@code this}
         * @param autoRollbackConfiguration auto_rollback_configuration block. This parameter is required.
         */
        public Builder autoRollbackConfiguration(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupAutoRollbackConfiguration autoRollbackConfiguration) {
            this.config.autoRollbackConfiguration(autoRollbackConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#autoscaling_groups CodedeployDeploymentGroup#autoscaling_groups}.
         * <p>
         * @return {@code this}
         * @param autoscalingGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#autoscaling_groups CodedeployDeploymentGroup#autoscaling_groups}. This parameter is required.
         */
        public Builder autoscalingGroups(final java.util.List<java.lang.String> autoscalingGroups) {
            this.config.autoscalingGroups(autoscalingGroups);
            return this;
        }

        /**
         * blue_green_deployment_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#blue_green_deployment_config CodedeployDeploymentGroup#blue_green_deployment_config}
         * <p>
         * @return {@code this}
         * @param blueGreenDeploymentConfig blue_green_deployment_config block. This parameter is required.
         */
        public Builder blueGreenDeploymentConfig(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig blueGreenDeploymentConfig) {
            this.config.blueGreenDeploymentConfig(blueGreenDeploymentConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_config_name CodedeployDeploymentGroup#deployment_config_name}.
         * <p>
         * @return {@code this}
         * @param deploymentConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_config_name CodedeployDeploymentGroup#deployment_config_name}. This parameter is required.
         */
        public Builder deploymentConfigName(final java.lang.String deploymentConfigName) {
            this.config.deploymentConfigName(deploymentConfigName);
            return this;
        }

        /**
         * deployment_style block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_style CodedeployDeploymentGroup#deployment_style}
         * <p>
         * @return {@code this}
         * @param deploymentStyle deployment_style block. This parameter is required.
         */
        public Builder deploymentStyle(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle deploymentStyle) {
            this.config.deploymentStyle(deploymentStyle);
            return this;
        }

        /**
         * ec2_tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * <p>
         * @return {@code this}
         * @param ec2TagFilter ec2_tag_filter block. This parameter is required.
         */
        public Builder ec2TagFilter(final com.hashicorp.cdktf.IResolvable ec2TagFilter) {
            this.config.ec2TagFilter(ec2TagFilter);
            return this;
        }
        /**
         * ec2_tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * <p>
         * @return {@code this}
         * @param ec2TagFilter ec2_tag_filter block. This parameter is required.
         */
        public Builder ec2TagFilter(final java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagFilter> ec2TagFilter) {
            this.config.ec2TagFilter(ec2TagFilter);
            return this;
        }

        /**
         * ec2_tag_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_set CodedeployDeploymentGroup#ec2_tag_set}
         * <p>
         * @return {@code this}
         * @param ec2TagSet ec2_tag_set block. This parameter is required.
         */
        public Builder ec2TagSet(final com.hashicorp.cdktf.IResolvable ec2TagSet) {
            this.config.ec2TagSet(ec2TagSet);
            return this;
        }
        /**
         * ec2_tag_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_set CodedeployDeploymentGroup#ec2_tag_set}
         * <p>
         * @return {@code this}
         * @param ec2TagSet ec2_tag_set block. This parameter is required.
         */
        public Builder ec2TagSet(final java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSet> ec2TagSet) {
            this.config.ec2TagSet(ec2TagSet);
            return this;
        }

        /**
         * ecs_service block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ecs_service CodedeployDeploymentGroup#ecs_service}
         * <p>
         * @return {@code this}
         * @param ecsService ecs_service block. This parameter is required.
         */
        public Builder ecsService(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEcsService ecsService) {
            this.config.ecsService(ecsService);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#id CodedeployDeploymentGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#id CodedeployDeploymentGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * load_balancer_info block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#load_balancer_info CodedeployDeploymentGroup#load_balancer_info}
         * <p>
         * @return {@code this}
         * @param loadBalancerInfo load_balancer_info block. This parameter is required.
         */
        public Builder loadBalancerInfo(final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo loadBalancerInfo) {
            this.config.loadBalancerInfo(loadBalancerInfo);
            return this;
        }

        /**
         * on_premises_instance_tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#on_premises_instance_tag_filter CodedeployDeploymentGroup#on_premises_instance_tag_filter}
         * <p>
         * @return {@code this}
         * @param onPremisesInstanceTagFilter on_premises_instance_tag_filter block. This parameter is required.
         */
        public Builder onPremisesInstanceTagFilter(final com.hashicorp.cdktf.IResolvable onPremisesInstanceTagFilter) {
            this.config.onPremisesInstanceTagFilter(onPremisesInstanceTagFilter);
            return this;
        }
        /**
         * on_premises_instance_tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#on_premises_instance_tag_filter CodedeployDeploymentGroup#on_premises_instance_tag_filter}
         * <p>
         * @return {@code this}
         * @param onPremisesInstanceTagFilter on_premises_instance_tag_filter block. This parameter is required.
         */
        public Builder onPremisesInstanceTagFilter(final java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupOnPremisesInstanceTagFilter> onPremisesInstanceTagFilter) {
            this.config.onPremisesInstanceTagFilter(onPremisesInstanceTagFilter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#outdated_instances_strategy CodedeployDeploymentGroup#outdated_instances_strategy}.
         * <p>
         * @return {@code this}
         * @param outdatedInstancesStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#outdated_instances_strategy CodedeployDeploymentGroup#outdated_instances_strategy}. This parameter is required.
         */
        public Builder outdatedInstancesStrategy(final java.lang.String outdatedInstancesStrategy) {
            this.config.outdatedInstancesStrategy(outdatedInstancesStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags CodedeployDeploymentGroup#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags CodedeployDeploymentGroup#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags_all CodedeployDeploymentGroup#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#tags_all CodedeployDeploymentGroup#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}.
         * <p>
         * @return {@code this}
         * @param terminationHookEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}. This parameter is required.
         */
        public Builder terminationHookEnabled(final java.lang.Boolean terminationHookEnabled) {
            this.config.terminationHookEnabled(terminationHookEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}.
         * <p>
         * @return {@code this}
         * @param terminationHookEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#termination_hook_enabled CodedeployDeploymentGroup#termination_hook_enabled}. This parameter is required.
         */
        public Builder terminationHookEnabled(final com.hashicorp.cdktf.IResolvable terminationHookEnabled) {
            this.config.terminationHookEnabled(terminationHookEnabled);
            return this;
        }

        /**
         * trigger_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_configuration CodedeployDeploymentGroup#trigger_configuration}
         * <p>
         * @return {@code this}
         * @param triggerConfiguration trigger_configuration block. This parameter is required.
         */
        public Builder triggerConfiguration(final com.hashicorp.cdktf.IResolvable triggerConfiguration) {
            this.config.triggerConfiguration(triggerConfiguration);
            return this;
        }
        /**
         * trigger_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_configuration CodedeployDeploymentGroup#trigger_configuration}
         * <p>
         * @return {@code this}
         * @param triggerConfiguration trigger_configuration block. This parameter is required.
         */
        public Builder triggerConfiguration(final java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupTriggerConfiguration> triggerConfiguration) {
            this.config.triggerConfiguration(triggerConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup}.
         */
        @Override
        public imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup build() {
            return new imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
