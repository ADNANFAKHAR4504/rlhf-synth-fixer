package imports.aws.elasticache_serverless_cache;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache aws_elasticache_serverless_cache}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.171Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheServerlessCache.ElasticacheServerlessCache")
public class ElasticacheServerlessCache extends com.hashicorp.cdktf.TerraformResource {

    protected ElasticacheServerlessCache(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticacheServerlessCache(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache aws_elasticache_serverless_cache} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElasticacheServerlessCache(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheServerlessCache resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheServerlessCache to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheServerlessCache that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElasticacheServerlessCache to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheServerlessCache resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheServerlessCache to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheServerlessCache that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCacheUsageLimits(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits> __cast_cd4240 = (java.util.List<imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCacheUsageLimits", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCacheUsageLimits() {
        software.amazon.jsii.Kernel.call(this, "resetCacheUsageLimits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDailySnapshotTime() {
        software.amazon.jsii.Kernel.call(this, "resetDailySnapshotTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMajorEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMajorEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotArnsToRestore() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotArnsToRestore", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotRetentionLimit() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotRetentionLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetIds() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetUserGroupId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimitsList getCacheUsageLimits() {
        return software.amazon.jsii.Kernel.get(this, "cacheUsageLimits", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimitsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreateTime() {
        return software.amazon.jsii.Kernel.get(this, "createTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheEndpointList getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheEndpointList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFullEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "fullEngineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheReaderEndpointList getReaderEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "readerEndpoint", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheReaderEndpointList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCacheUsageLimitsInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheUsageLimitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDailySnapshotTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "dailySnapshotTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMajorEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "majorEngineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArnsToRestoreInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "snapshotArnsToRestoreInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDailySnapshotTime() {
        return software.amazon.jsii.Kernel.get(this, "dailySnapshotTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDailySnapshotTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dailySnapshotTime", java.util.Objects.requireNonNull(value, "dailySnapshotTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMajorEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "majorEngineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMajorEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "majorEngineVersion", java.util.Objects.requireNonNull(value, "majorEngineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSnapshotArnsToRestore() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "snapshotArnsToRestore", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSnapshotArnsToRestore(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "snapshotArnsToRestore", java.util.Objects.requireNonNull(value, "snapshotArnsToRestore is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSnapshotRetentionLimit() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSnapshotRetentionLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "snapshotRetentionLimit", java.util.Objects.requireNonNull(value, "snapshotRetentionLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserGroupId() {
        return software.amazon.jsii.Kernel.get(this, "userGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userGroupId", java.util.Objects.requireNonNull(value, "userGroupId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache> {
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
        private final imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#engine ElasticacheServerlessCache#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#engine ElasticacheServerlessCache#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#name ElasticacheServerlessCache#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#name ElasticacheServerlessCache#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * cache_usage_limits block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#cache_usage_limits ElasticacheServerlessCache#cache_usage_limits}
         * <p>
         * @return {@code this}
         * @param cacheUsageLimits cache_usage_limits block. This parameter is required.
         */
        public Builder cacheUsageLimits(final com.hashicorp.cdktf.IResolvable cacheUsageLimits) {
            this.config.cacheUsageLimits(cacheUsageLimits);
            return this;
        }
        /**
         * cache_usage_limits block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#cache_usage_limits ElasticacheServerlessCache#cache_usage_limits}
         * <p>
         * @return {@code this}
         * @param cacheUsageLimits cache_usage_limits block. This parameter is required.
         */
        public Builder cacheUsageLimits(final java.util.List<? extends imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits> cacheUsageLimits) {
            this.config.cacheUsageLimits(cacheUsageLimits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#daily_snapshot_time ElasticacheServerlessCache#daily_snapshot_time}.
         * <p>
         * @return {@code this}
         * @param dailySnapshotTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#daily_snapshot_time ElasticacheServerlessCache#daily_snapshot_time}. This parameter is required.
         */
        public Builder dailySnapshotTime(final java.lang.String dailySnapshotTime) {
            this.config.dailySnapshotTime(dailySnapshotTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#description ElasticacheServerlessCache#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#description ElasticacheServerlessCache#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#kms_key_id ElasticacheServerlessCache#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#kms_key_id ElasticacheServerlessCache#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#major_engine_version ElasticacheServerlessCache#major_engine_version}.
         * <p>
         * @return {@code this}
         * @param majorEngineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#major_engine_version ElasticacheServerlessCache#major_engine_version}. This parameter is required.
         */
        public Builder majorEngineVersion(final java.lang.String majorEngineVersion) {
            this.config.majorEngineVersion(majorEngineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#security_group_ids ElasticacheServerlessCache#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#security_group_ids ElasticacheServerlessCache#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_arns_to_restore ElasticacheServerlessCache#snapshot_arns_to_restore}.
         * <p>
         * @return {@code this}
         * @param snapshotArnsToRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_arns_to_restore ElasticacheServerlessCache#snapshot_arns_to_restore}. This parameter is required.
         */
        public Builder snapshotArnsToRestore(final java.util.List<java.lang.String> snapshotArnsToRestore) {
            this.config.snapshotArnsToRestore(snapshotArnsToRestore);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_retention_limit ElasticacheServerlessCache#snapshot_retention_limit}.
         * <p>
         * @return {@code this}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_retention_limit ElasticacheServerlessCache#snapshot_retention_limit}. This parameter is required.
         */
        public Builder snapshotRetentionLimit(final java.lang.Number snapshotRetentionLimit) {
            this.config.snapshotRetentionLimit(snapshotRetentionLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#subnet_ids ElasticacheServerlessCache#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#subnet_ids ElasticacheServerlessCache#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config.subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#tags ElasticacheServerlessCache#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#tags ElasticacheServerlessCache#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#timeouts ElasticacheServerlessCache#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#user_group_id ElasticacheServerlessCache#user_group_id}.
         * <p>
         * @return {@code this}
         * @param userGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#user_group_id ElasticacheServerlessCache#user_group_id}. This parameter is required.
         */
        public Builder userGroupId(final java.lang.String userGroupId) {
            this.config.userGroupId(userGroupId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache}.
         */
        @Override
        public imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache build() {
            return new imports.aws.elasticache_serverless_cache.ElasticacheServerlessCache(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
