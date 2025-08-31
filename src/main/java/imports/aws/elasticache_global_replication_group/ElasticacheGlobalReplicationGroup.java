package imports.aws.elasticache_global_replication_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group aws_elasticache_global_replication_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.168Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheGlobalReplicationGroup.ElasticacheGlobalReplicationGroup")
public class ElasticacheGlobalReplicationGroup extends com.hashicorp.cdktf.TerraformResource {

    protected ElasticacheGlobalReplicationGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticacheGlobalReplicationGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group aws_elasticache_global_replication_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElasticacheGlobalReplicationGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheGlobalReplicationGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheGlobalReplicationGroup to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheGlobalReplicationGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElasticacheGlobalReplicationGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheGlobalReplicationGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheGlobalReplicationGroup to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheGlobalReplicationGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutomaticFailoverEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticFailoverEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheNodeType() {
        software.amazon.jsii.Kernel.call(this, "resetCacheNodeType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalReplicationGroupDescription() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalReplicationGroupDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumNodeGroups() {
        software.amazon.jsii.Kernel.call(this, "resetNumNodeGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetParameterGroupName", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAtRestEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "atRestEncryptionEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAuthTokenEnabled() {
        return software.amazon.jsii.Kernel.get(this, "authTokenEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getClusterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "clusterEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersionActual() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionActual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupGlobalNodeGroupsList getGlobalNodeGroups() {
        return software.amazon.jsii.Kernel.get(this, "globalNodeGroups", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupGlobalNodeGroupsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlobalReplicationGroupId() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getTransitEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutomaticFailoverEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheNodeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheNodeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGlobalReplicationGroupDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGlobalReplicationGroupIdSuffixInput() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupIdSuffixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumNodeGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "numNodeGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrimaryReplicationGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryReplicationGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutomaticFailoverEnabled() {
        return software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutomaticFailoverEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "automaticFailoverEnabled", java.util.Objects.requireNonNull(value, "automaticFailoverEnabled is required"));
    }

    public void setAutomaticFailoverEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "automaticFailoverEnabled", java.util.Objects.requireNonNull(value, "automaticFailoverEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheNodeType() {
        return software.amazon.jsii.Kernel.get(this, "cacheNodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheNodeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheNodeType", java.util.Objects.requireNonNull(value, "cacheNodeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlobalReplicationGroupDescription() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGlobalReplicationGroupDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "globalReplicationGroupDescription", java.util.Objects.requireNonNull(value, "globalReplicationGroupDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlobalReplicationGroupIdSuffix() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupIdSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGlobalReplicationGroupIdSuffix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "globalReplicationGroupIdSuffix", java.util.Objects.requireNonNull(value, "globalReplicationGroupIdSuffix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumNodeGroups() {
        return software.amazon.jsii.Kernel.get(this, "numNodeGroups", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumNodeGroups(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numNodeGroups", java.util.Objects.requireNonNull(value, "numNodeGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterGroupName", java.util.Objects.requireNonNull(value, "parameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryReplicationGroupId() {
        return software.amazon.jsii.Kernel.get(this, "primaryReplicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrimaryReplicationGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "primaryReplicationGroupId", java.util.Objects.requireNonNull(value, "primaryReplicationGroupId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup> {
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
        private final imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_id_suffix ElasticacheGlobalReplicationGroup#global_replication_group_id_suffix}.
         * <p>
         * @return {@code this}
         * @param globalReplicationGroupIdSuffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_id_suffix ElasticacheGlobalReplicationGroup#global_replication_group_id_suffix}. This parameter is required.
         */
        public Builder globalReplicationGroupIdSuffix(final java.lang.String globalReplicationGroupIdSuffix) {
            this.config.globalReplicationGroupIdSuffix(globalReplicationGroupIdSuffix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#primary_replication_group_id ElasticacheGlobalReplicationGroup#primary_replication_group_id}.
         * <p>
         * @return {@code this}
         * @param primaryReplicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#primary_replication_group_id ElasticacheGlobalReplicationGroup#primary_replication_group_id}. This parameter is required.
         */
        public Builder primaryReplicationGroupId(final java.lang.String primaryReplicationGroupId) {
            this.config.primaryReplicationGroupId(primaryReplicationGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}.
         * <p>
         * @return {@code this}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}. This parameter is required.
         */
        public Builder automaticFailoverEnabled(final java.lang.Boolean automaticFailoverEnabled) {
            this.config.automaticFailoverEnabled(automaticFailoverEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}.
         * <p>
         * @return {@code this}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}. This parameter is required.
         */
        public Builder automaticFailoverEnabled(final com.hashicorp.cdktf.IResolvable automaticFailoverEnabled) {
            this.config.automaticFailoverEnabled(automaticFailoverEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#cache_node_type ElasticacheGlobalReplicationGroup#cache_node_type}.
         * <p>
         * @return {@code this}
         * @param cacheNodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#cache_node_type ElasticacheGlobalReplicationGroup#cache_node_type}. This parameter is required.
         */
        public Builder cacheNodeType(final java.lang.String cacheNodeType) {
            this.config.cacheNodeType(cacheNodeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#engine_version ElasticacheGlobalReplicationGroup#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#engine_version ElasticacheGlobalReplicationGroup#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_description ElasticacheGlobalReplicationGroup#global_replication_group_description}.
         * <p>
         * @return {@code this}
         * @param globalReplicationGroupDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_description ElasticacheGlobalReplicationGroup#global_replication_group_description}. This parameter is required.
         */
        public Builder globalReplicationGroupDescription(final java.lang.String globalReplicationGroupDescription) {
            this.config.globalReplicationGroupDescription(globalReplicationGroupDescription);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#id ElasticacheGlobalReplicationGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#id ElasticacheGlobalReplicationGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#num_node_groups ElasticacheGlobalReplicationGroup#num_node_groups}.
         * <p>
         * @return {@code this}
         * @param numNodeGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#num_node_groups ElasticacheGlobalReplicationGroup#num_node_groups}. This parameter is required.
         */
        public Builder numNodeGroups(final java.lang.Number numNodeGroups) {
            this.config.numNodeGroups(numNodeGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#parameter_group_name ElasticacheGlobalReplicationGroup#parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#parameter_group_name ElasticacheGlobalReplicationGroup#parameter_group_name}. This parameter is required.
         */
        public Builder parameterGroupName(final java.lang.String parameterGroupName) {
            this.config.parameterGroupName(parameterGroupName);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#timeouts ElasticacheGlobalReplicationGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup}.
         */
        @Override
        public imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup build() {
            return new imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
