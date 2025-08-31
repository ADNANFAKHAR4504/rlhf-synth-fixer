package imports.aws.ecs_task_set;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set aws_ecs_task_set}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.140Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskSet.EcsTaskSet")
public class EcsTaskSet extends com.hashicorp.cdktf.TerraformResource {

    protected EcsTaskSet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskSet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ecs_task_set.EcsTaskSet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set aws_ecs_task_set} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EcsTaskSet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EcsTaskSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcsTaskSet to import. This parameter is required.
     * @param importFromId The id of the existing EcsTaskSet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EcsTaskSet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecs_task_set.EcsTaskSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EcsTaskSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcsTaskSet to import. This parameter is required.
     * @param importFromId The id of the existing EcsTaskSet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecs_task_set.EcsTaskSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCapacityProviderStrategy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy> __cast_cd4240 = (java.util.List<imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLoadBalancer(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_task_set.EcsTaskSetLoadBalancer>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_task_set.EcsTaskSetLoadBalancer> __cast_cd4240 = (java.util.List<imports.aws.ecs_task_set.EcsTaskSetLoadBalancer>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_task_set.EcsTaskSetLoadBalancer __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLoadBalancer", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScale(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetScale value) {
        software.amazon.jsii.Kernel.call(this, "putScale", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServiceRegistries(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetServiceRegistries value) {
        software.amazon.jsii.Kernel.call(this, "putServiceRegistries", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCapacityProviderStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExternalId() {
        software.amazon.jsii.Kernel.call(this, "resetExternalId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDelete() {
        software.amazon.jsii.Kernel.call(this, "resetForceDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchType() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancer() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatformVersion() {
        software.amazon.jsii.Kernel.call(this, "resetPlatformVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScale() {
        software.amazon.jsii.Kernel.call(this, "resetScale", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceRegistries() {
        software.amazon.jsii.Kernel.call(this, "resetServiceRegistries", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitUntilStable() {
        software.amazon.jsii.Kernel.call(this, "resetWaitUntilStable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitUntilStableTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetWaitUntilStableTimeout", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategyList getCapacityProviderStrategy() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetLoadBalancerList getLoadBalancer() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancer", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetLoadBalancerList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetNetworkConfigurationOutputReference getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetNetworkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetScaleOutputReference getScale() {
        return software.amazon.jsii.Kernel.get(this, "scale", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetScaleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_set.EcsTaskSetServiceRegistriesOutputReference getServiceRegistries() {
        return software.amazon.jsii.Kernel.get(this, "serviceRegistries", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetServiceRegistriesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStabilityStatus() {
        return software.amazon.jsii.Kernel.get(this, "stabilityStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskSetId() {
        return software.amazon.jsii.Kernel.get(this, "taskSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExternalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "externalIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDeleteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLoadBalancerInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration getNetworkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "networkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "platformVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetScale getScaleInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetScale.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetServiceRegistries getServiceRegistriesInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRegistriesInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetServiceRegistries.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitUntilStableInput() {
        return software.amazon.jsii.Kernel.get(this, "waitUntilStableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWaitUntilStableTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "waitUntilStableTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCluster() {
        return software.amazon.jsii.Kernel.get(this, "cluster", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCluster(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cluster", java.util.Objects.requireNonNull(value, "cluster is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalId() {
        return software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExternalId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "externalId", java.util.Objects.requireNonNull(value, "externalId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDelete() {
        return software.amazon.jsii.Kernel.get(this, "forceDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDelete(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDelete", java.util.Objects.requireNonNull(value, "forceDelete is required"));
    }

    public void setForceDelete(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDelete", java.util.Objects.requireNonNull(value, "forceDelete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchType() {
        return software.amazon.jsii.Kernel.get(this, "launchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchType", java.util.Objects.requireNonNull(value, "launchType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformVersion() {
        return software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatformVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platformVersion", java.util.Objects.requireNonNull(value, "platformVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getService() {
        return software.amazon.jsii.Kernel.get(this, "service", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setService(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "service", java.util.Objects.requireNonNull(value, "service is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskDefinition() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskDefinition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskDefinition", java.util.Objects.requireNonNull(value, "taskDefinition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWaitUntilStable() {
        return software.amazon.jsii.Kernel.get(this, "waitUntilStable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWaitUntilStable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "waitUntilStable", java.util.Objects.requireNonNull(value, "waitUntilStable is required"));
    }

    public void setWaitUntilStable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "waitUntilStable", java.util.Objects.requireNonNull(value, "waitUntilStable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWaitUntilStableTimeout() {
        return software.amazon.jsii.Kernel.get(this, "waitUntilStableTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWaitUntilStableTimeout(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "waitUntilStableTimeout", java.util.Objects.requireNonNull(value, "waitUntilStableTimeout is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ecs_task_set.EcsTaskSet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ecs_task_set.EcsTaskSet> {
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
        private final imports.aws.ecs_task_set.EcsTaskSetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ecs_task_set.EcsTaskSetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#cluster EcsTaskSet#cluster}.
         * <p>
         * @return {@code this}
         * @param cluster Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#cluster EcsTaskSet#cluster}. This parameter is required.
         */
        public Builder cluster(final java.lang.String cluster) {
            this.config.cluster(cluster);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service EcsTaskSet#service}.
         * <p>
         * @return {@code this}
         * @param service Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service EcsTaskSet#service}. This parameter is required.
         */
        public Builder service(final java.lang.String service) {
            this.config.service(service);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#task_definition EcsTaskSet#task_definition}.
         * <p>
         * @return {@code this}
         * @param taskDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#task_definition EcsTaskSet#task_definition}. This parameter is required.
         */
        public Builder taskDefinition(final java.lang.String taskDefinition) {
            this.config.taskDefinition(taskDefinition);
            return this;
        }

        /**
         * capacity_provider_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#capacity_provider_strategy EcsTaskSet#capacity_provider_strategy}
         * <p>
         * @return {@code this}
         * @param capacityProviderStrategy capacity_provider_strategy block. This parameter is required.
         */
        public Builder capacityProviderStrategy(final com.hashicorp.cdktf.IResolvable capacityProviderStrategy) {
            this.config.capacityProviderStrategy(capacityProviderStrategy);
            return this;
        }
        /**
         * capacity_provider_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#capacity_provider_strategy EcsTaskSet#capacity_provider_strategy}
         * <p>
         * @return {@code this}
         * @param capacityProviderStrategy capacity_provider_strategy block. This parameter is required.
         */
        public Builder capacityProviderStrategy(final java.util.List<? extends imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy> capacityProviderStrategy) {
            this.config.capacityProviderStrategy(capacityProviderStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#external_id EcsTaskSet#external_id}.
         * <p>
         * @return {@code this}
         * @param externalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#external_id EcsTaskSet#external_id}. This parameter is required.
         */
        public Builder externalId(final java.lang.String externalId) {
            this.config.externalId(externalId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}.
         * <p>
         * @return {@code this}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}. This parameter is required.
         */
        public Builder forceDelete(final java.lang.Boolean forceDelete) {
            this.config.forceDelete(forceDelete);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}.
         * <p>
         * @return {@code this}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}. This parameter is required.
         */
        public Builder forceDelete(final com.hashicorp.cdktf.IResolvable forceDelete) {
            this.config.forceDelete(forceDelete);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#id EcsTaskSet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#id EcsTaskSet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#launch_type EcsTaskSet#launch_type}.
         * <p>
         * @return {@code this}
         * @param launchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#launch_type EcsTaskSet#launch_type}. This parameter is required.
         */
        public Builder launchType(final java.lang.String launchType) {
            this.config.launchType(launchType);
            return this;
        }

        /**
         * load_balancer block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer EcsTaskSet#load_balancer}
         * <p>
         * @return {@code this}
         * @param loadBalancer load_balancer block. This parameter is required.
         */
        public Builder loadBalancer(final com.hashicorp.cdktf.IResolvable loadBalancer) {
            this.config.loadBalancer(loadBalancer);
            return this;
        }
        /**
         * load_balancer block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer EcsTaskSet#load_balancer}
         * <p>
         * @return {@code this}
         * @param loadBalancer load_balancer block. This parameter is required.
         */
        public Builder loadBalancer(final java.util.List<? extends imports.aws.ecs_task_set.EcsTaskSetLoadBalancer> loadBalancer) {
            this.config.loadBalancer(loadBalancer);
            return this;
        }

        /**
         * network_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#network_configuration EcsTaskSet#network_configuration}
         * <p>
         * @return {@code this}
         * @param networkConfiguration network_configuration block. This parameter is required.
         */
        public Builder networkConfiguration(final imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration networkConfiguration) {
            this.config.networkConfiguration(networkConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#platform_version EcsTaskSet#platform_version}.
         * <p>
         * @return {@code this}
         * @param platformVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#platform_version EcsTaskSet#platform_version}. This parameter is required.
         */
        public Builder platformVersion(final java.lang.String platformVersion) {
            this.config.platformVersion(platformVersion);
            return this;
        }

        /**
         * scale block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#scale EcsTaskSet#scale}
         * <p>
         * @return {@code this}
         * @param scale scale block. This parameter is required.
         */
        public Builder scale(final imports.aws.ecs_task_set.EcsTaskSetScale scale) {
            this.config.scale(scale);
            return this;
        }

        /**
         * service_registries block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service_registries EcsTaskSet#service_registries}
         * <p>
         * @return {@code this}
         * @param serviceRegistries service_registries block. This parameter is required.
         */
        public Builder serviceRegistries(final imports.aws.ecs_task_set.EcsTaskSetServiceRegistries serviceRegistries) {
            this.config.serviceRegistries(serviceRegistries);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags EcsTaskSet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags EcsTaskSet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags_all EcsTaskSet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags_all EcsTaskSet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}.
         * <p>
         * @return {@code this}
         * @param waitUntilStable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}. This parameter is required.
         */
        public Builder waitUntilStable(final java.lang.Boolean waitUntilStable) {
            this.config.waitUntilStable(waitUntilStable);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}.
         * <p>
         * @return {@code this}
         * @param waitUntilStable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}. This parameter is required.
         */
        public Builder waitUntilStable(final com.hashicorp.cdktf.IResolvable waitUntilStable) {
            this.config.waitUntilStable(waitUntilStable);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable_timeout EcsTaskSet#wait_until_stable_timeout}.
         * <p>
         * @return {@code this}
         * @param waitUntilStableTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable_timeout EcsTaskSet#wait_until_stable_timeout}. This parameter is required.
         */
        public Builder waitUntilStableTimeout(final java.lang.String waitUntilStableTimeout) {
            this.config.waitUntilStableTimeout(waitUntilStableTimeout);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ecs_task_set.EcsTaskSet}.
         */
        @Override
        public imports.aws.ecs_task_set.EcsTaskSet build() {
            return new imports.aws.ecs_task_set.EcsTaskSet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
