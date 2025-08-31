package imports.aws.gamelift_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet aws_gamelift_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleet")
public class GameliftFleet extends com.hashicorp.cdktf.TerraformResource {

    protected GameliftFleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GameliftFleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.gamelift_fleet.GameliftFleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet aws_gamelift_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GameliftFleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GameliftFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GameliftFleet to import. This parameter is required.
     * @param importFromId The id of the existing GameliftFleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GameliftFleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.gamelift_fleet.GameliftFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GameliftFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GameliftFleet to import. This parameter is required.
     * @param importFromId The id of the existing GameliftFleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.gamelift_fleet.GameliftFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCertificateConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCertificateConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2InboundPermission(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission> __cast_cd4240 = (java.util.List<imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2InboundPermission", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceCreationLimitPolicy(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putResourceCreationLimitPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRuntimeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRuntimeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBuildId() {
        software.amazon.jsii.Kernel.call(this, "resetBuildId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2InboundPermission() {
        software.amazon.jsii.Kernel.call(this, "resetEc2InboundPermission", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetType() {
        software.amazon.jsii.Kernel.call(this, "resetFleetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricGroups() {
        software.amazon.jsii.Kernel.call(this, "resetMetricGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNewGameSessionProtectionPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetNewGameSessionProtectionPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceCreationLimitPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetResourceCreationLimitPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntimeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRuntimeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScriptId() {
        software.amazon.jsii.Kernel.call(this, "resetScriptId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getBuildArn() {
        return software.amazon.jsii.Kernel.get(this, "buildArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetCertificateConfigurationOutputReference getCertificateConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "certificateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetCertificateConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermissionList getEc2InboundPermission() {
        return software.amazon.jsii.Kernel.get(this, "ec2InboundPermission", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermissionList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogPaths() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logPaths", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperatingSystem() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystem", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicyOutputReference getResourceCreationLimitPolicy() {
        return software.amazon.jsii.Kernel.get(this, "resourceCreationLimitPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetRuntimeConfigurationOutputReference getRuntimeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "runtimeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetRuntimeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScriptArn() {
        return software.amazon.jsii.Kernel.get(this, "scriptArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_fleet.GameliftFleetTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildIdInput() {
        return software.amazon.jsii.Kernel.get(this, "buildIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration getCertificateConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2InboundPermissionInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2InboundPermissionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEc2InstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFleetTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMetricGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "metricGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNewGameSessionProtectionPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "newGameSessionProtectionPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy getResourceCreationLimitPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceCreationLimitPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration getRuntimeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScriptIdInput() {
        return software.amazon.jsii.Kernel.get(this, "scriptIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuildId() {
        return software.amazon.jsii.Kernel.get(this, "buildId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuildId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "buildId", java.util.Objects.requireNonNull(value, "buildId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEc2InstanceType() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEc2InstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ec2InstanceType", java.util.Objects.requireNonNull(value, "ec2InstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFleetType() {
        return software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFleetType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fleetType", java.util.Objects.requireNonNull(value, "fleetType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "instanceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceRoleArn", java.util.Objects.requireNonNull(value, "instanceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMetricGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "metricGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setMetricGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "metricGroups", java.util.Objects.requireNonNull(value, "metricGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNewGameSessionProtectionPolicy() {
        return software.amazon.jsii.Kernel.get(this, "newGameSessionProtectionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNewGameSessionProtectionPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "newGameSessionProtectionPolicy", java.util.Objects.requireNonNull(value, "newGameSessionProtectionPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScriptId() {
        return software.amazon.jsii.Kernel.get(this, "scriptId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScriptId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scriptId", java.util.Objects.requireNonNull(value, "scriptId is required"));
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

    /**
     * A fluent builder for {@link imports.aws.gamelift_fleet.GameliftFleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.gamelift_fleet.GameliftFleet> {
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
        private final imports.aws.gamelift_fleet.GameliftFleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.gamelift_fleet.GameliftFleetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_instance_type GameliftFleet#ec2_instance_type}.
         * <p>
         * @return {@code this}
         * @param ec2InstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_instance_type GameliftFleet#ec2_instance_type}. This parameter is required.
         */
        public Builder ec2InstanceType(final java.lang.String ec2InstanceType) {
            this.config.ec2InstanceType(ec2InstanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#name GameliftFleet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#name GameliftFleet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#build_id GameliftFleet#build_id}.
         * <p>
         * @return {@code this}
         * @param buildId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#build_id GameliftFleet#build_id}. This parameter is required.
         */
        public Builder buildId(final java.lang.String buildId) {
            this.config.buildId(buildId);
            return this;
        }

        /**
         * certificate_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#certificate_configuration GameliftFleet#certificate_configuration}
         * <p>
         * @return {@code this}
         * @param certificateConfiguration certificate_configuration block. This parameter is required.
         */
        public Builder certificateConfiguration(final imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration certificateConfiguration) {
            this.config.certificateConfiguration(certificateConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#description GameliftFleet#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#description GameliftFleet#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * ec2_inbound_permission block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_inbound_permission GameliftFleet#ec2_inbound_permission}
         * <p>
         * @return {@code this}
         * @param ec2InboundPermission ec2_inbound_permission block. This parameter is required.
         */
        public Builder ec2InboundPermission(final com.hashicorp.cdktf.IResolvable ec2InboundPermission) {
            this.config.ec2InboundPermission(ec2InboundPermission);
            return this;
        }
        /**
         * ec2_inbound_permission block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_inbound_permission GameliftFleet#ec2_inbound_permission}
         * <p>
         * @return {@code this}
         * @param ec2InboundPermission ec2_inbound_permission block. This parameter is required.
         */
        public Builder ec2InboundPermission(final java.util.List<? extends imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission> ec2InboundPermission) {
            this.config.ec2InboundPermission(ec2InboundPermission);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#fleet_type GameliftFleet#fleet_type}.
         * <p>
         * @return {@code this}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#fleet_type GameliftFleet#fleet_type}. This parameter is required.
         */
        public Builder fleetType(final java.lang.String fleetType) {
            this.config.fleetType(fleetType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#id GameliftFleet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#id GameliftFleet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#instance_role_arn GameliftFleet#instance_role_arn}.
         * <p>
         * @return {@code this}
         * @param instanceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#instance_role_arn GameliftFleet#instance_role_arn}. This parameter is required.
         */
        public Builder instanceRoleArn(final java.lang.String instanceRoleArn) {
            this.config.instanceRoleArn(instanceRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#metric_groups GameliftFleet#metric_groups}.
         * <p>
         * @return {@code this}
         * @param metricGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#metric_groups GameliftFleet#metric_groups}. This parameter is required.
         */
        public Builder metricGroups(final java.util.List<java.lang.String> metricGroups) {
            this.config.metricGroups(metricGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_session_protection_policy GameliftFleet#new_game_session_protection_policy}.
         * <p>
         * @return {@code this}
         * @param newGameSessionProtectionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_session_protection_policy GameliftFleet#new_game_session_protection_policy}. This parameter is required.
         */
        public Builder newGameSessionProtectionPolicy(final java.lang.String newGameSessionProtectionPolicy) {
            this.config.newGameSessionProtectionPolicy(newGameSessionProtectionPolicy);
            return this;
        }

        /**
         * resource_creation_limit_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#resource_creation_limit_policy GameliftFleet#resource_creation_limit_policy}
         * <p>
         * @return {@code this}
         * @param resourceCreationLimitPolicy resource_creation_limit_policy block. This parameter is required.
         */
        public Builder resourceCreationLimitPolicy(final imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy resourceCreationLimitPolicy) {
            this.config.resourceCreationLimitPolicy(resourceCreationLimitPolicy);
            return this;
        }

        /**
         * runtime_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#runtime_configuration GameliftFleet#runtime_configuration}
         * <p>
         * @return {@code this}
         * @param runtimeConfiguration runtime_configuration block. This parameter is required.
         */
        public Builder runtimeConfiguration(final imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration runtimeConfiguration) {
            this.config.runtimeConfiguration(runtimeConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#script_id GameliftFleet#script_id}.
         * <p>
         * @return {@code this}
         * @param scriptId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#script_id GameliftFleet#script_id}. This parameter is required.
         */
        public Builder scriptId(final java.lang.String scriptId) {
            this.config.scriptId(scriptId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags GameliftFleet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags GameliftFleet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags_all GameliftFleet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags_all GameliftFleet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#timeouts GameliftFleet#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.gamelift_fleet.GameliftFleetTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.gamelift_fleet.GameliftFleet}.
         */
        @Override
        public imports.aws.gamelift_fleet.GameliftFleet build() {
            return new imports.aws.gamelift_fleet.GameliftFleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
