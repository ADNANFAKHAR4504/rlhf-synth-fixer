package imports.aws.elasticache_serverless_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheServerlessCache.ElasticacheServerlessCacheConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticacheServerlessCacheConfig.Jsii$Proxy.class)
public interface ElasticacheServerlessCacheConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#engine ElasticacheServerlessCache#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#name ElasticacheServerlessCache#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * cache_usage_limits block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#cache_usage_limits ElasticacheServerlessCache#cache_usage_limits}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheUsageLimits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#daily_snapshot_time ElasticacheServerlessCache#daily_snapshot_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDailySnapshotTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#description ElasticacheServerlessCache#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#kms_key_id ElasticacheServerlessCache#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#major_engine_version ElasticacheServerlessCache#major_engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMajorEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#security_group_ids ElasticacheServerlessCache#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_arns_to_restore ElasticacheServerlessCache#snapshot_arns_to_restore}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArnsToRestore() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_retention_limit ElasticacheServerlessCache#snapshot_retention_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#subnet_ids ElasticacheServerlessCache#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#tags ElasticacheServerlessCache#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#timeouts ElasticacheServerlessCache#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#user_group_id ElasticacheServerlessCache#user_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserGroupId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheServerlessCacheConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheServerlessCacheConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheServerlessCacheConfig> {
        java.lang.String engine;
        java.lang.String name;
        java.lang.Object cacheUsageLimits;
        java.lang.String dailySnapshotTime;
        java.lang.String description;
        java.lang.String kmsKeyId;
        java.lang.String majorEngineVersion;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> snapshotArnsToRestore;
        java.lang.Number snapshotRetentionLimit;
        java.util.List<java.lang.String> subnetIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts timeouts;
        java.lang.String userGroupId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#engine ElasticacheServerlessCache#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#name ElasticacheServerlessCache#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getCacheUsageLimits}
         * @param cacheUsageLimits cache_usage_limits block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#cache_usage_limits ElasticacheServerlessCache#cache_usage_limits}
         * @return {@code this}
         */
        public Builder cacheUsageLimits(com.hashicorp.cdktf.IResolvable cacheUsageLimits) {
            this.cacheUsageLimits = cacheUsageLimits;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getCacheUsageLimits}
         * @param cacheUsageLimits cache_usage_limits block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#cache_usage_limits ElasticacheServerlessCache#cache_usage_limits}
         * @return {@code this}
         */
        public Builder cacheUsageLimits(java.util.List<? extends imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimits> cacheUsageLimits) {
            this.cacheUsageLimits = cacheUsageLimits;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getDailySnapshotTime}
         * @param dailySnapshotTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#daily_snapshot_time ElasticacheServerlessCache#daily_snapshot_time}.
         * @return {@code this}
         */
        public Builder dailySnapshotTime(java.lang.String dailySnapshotTime) {
            this.dailySnapshotTime = dailySnapshotTime;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#description ElasticacheServerlessCache#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#kms_key_id ElasticacheServerlessCache#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getMajorEngineVersion}
         * @param majorEngineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#major_engine_version ElasticacheServerlessCache#major_engine_version}.
         * @return {@code this}
         */
        public Builder majorEngineVersion(java.lang.String majorEngineVersion) {
            this.majorEngineVersion = majorEngineVersion;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#security_group_ids ElasticacheServerlessCache#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getSnapshotArnsToRestore}
         * @param snapshotArnsToRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_arns_to_restore ElasticacheServerlessCache#snapshot_arns_to_restore}.
         * @return {@code this}
         */
        public Builder snapshotArnsToRestore(java.util.List<java.lang.String> snapshotArnsToRestore) {
            this.snapshotArnsToRestore = snapshotArnsToRestore;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getSnapshotRetentionLimit}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#snapshot_retention_limit ElasticacheServerlessCache#snapshot_retention_limit}.
         * @return {@code this}
         */
        public Builder snapshotRetentionLimit(java.lang.Number snapshotRetentionLimit) {
            this.snapshotRetentionLimit = snapshotRetentionLimit;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#subnet_ids ElasticacheServerlessCache#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#tags ElasticacheServerlessCache#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#timeouts ElasticacheServerlessCache#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getUserGroupId}
         * @param userGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#user_group_id ElasticacheServerlessCache#user_group_id}.
         * @return {@code this}
         */
        public Builder userGroupId(java.lang.String userGroupId) {
            this.userGroupId = userGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticacheServerlessCacheConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheServerlessCacheConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheServerlessCacheConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheServerlessCacheConfig {
        private final java.lang.String engine;
        private final java.lang.String name;
        private final java.lang.Object cacheUsageLimits;
        private final java.lang.String dailySnapshotTime;
        private final java.lang.String description;
        private final java.lang.String kmsKeyId;
        private final java.lang.String majorEngineVersion;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> snapshotArnsToRestore;
        private final java.lang.Number snapshotRetentionLimit;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts timeouts;
        private final java.lang.String userGroupId;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheUsageLimits = software.amazon.jsii.Kernel.get(this, "cacheUsageLimits", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dailySnapshotTime = software.amazon.jsii.Kernel.get(this, "dailySnapshotTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.majorEngineVersion = software.amazon.jsii.Kernel.get(this, "majorEngineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotArnsToRestore = software.amazon.jsii.Kernel.get(this, "snapshotArnsToRestore", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotRetentionLimit = software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts.class));
            this.userGroupId = software.amazon.jsii.Kernel.get(this, "userGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.cacheUsageLimits = builder.cacheUsageLimits;
            this.dailySnapshotTime = builder.dailySnapshotTime;
            this.description = builder.description;
            this.kmsKeyId = builder.kmsKeyId;
            this.majorEngineVersion = builder.majorEngineVersion;
            this.securityGroupIds = builder.securityGroupIds;
            this.snapshotArnsToRestore = builder.snapshotArnsToRestore;
            this.snapshotRetentionLimit = builder.snapshotRetentionLimit;
            this.subnetIds = builder.subnetIds;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.userGroupId = builder.userGroupId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getCacheUsageLimits() {
            return this.cacheUsageLimits;
        }

        @Override
        public final java.lang.String getDailySnapshotTime() {
            return this.dailySnapshotTime;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getMajorEngineVersion() {
            return this.majorEngineVersion;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSnapshotArnsToRestore() {
            return this.snapshotArnsToRestore;
        }

        @Override
        public final java.lang.Number getSnapshotRetentionLimit() {
            return this.snapshotRetentionLimit;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getUserGroupId() {
            return this.userGroupId;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("engine", om.valueToTree(this.getEngine()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCacheUsageLimits() != null) {
                data.set("cacheUsageLimits", om.valueToTree(this.getCacheUsageLimits()));
            }
            if (this.getDailySnapshotTime() != null) {
                data.set("dailySnapshotTime", om.valueToTree(this.getDailySnapshotTime()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getMajorEngineVersion() != null) {
                data.set("majorEngineVersion", om.valueToTree(this.getMajorEngineVersion()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSnapshotArnsToRestore() != null) {
                data.set("snapshotArnsToRestore", om.valueToTree(this.getSnapshotArnsToRestore()));
            }
            if (this.getSnapshotRetentionLimit() != null) {
                data.set("snapshotRetentionLimit", om.valueToTree(this.getSnapshotRetentionLimit()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserGroupId() != null) {
                data.set("userGroupId", om.valueToTree(this.getUserGroupId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticacheServerlessCache.ElasticacheServerlessCacheConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheServerlessCacheConfig.Jsii$Proxy that = (ElasticacheServerlessCacheConfig.Jsii$Proxy) o;

            if (!engine.equals(that.engine)) return false;
            if (!name.equals(that.name)) return false;
            if (this.cacheUsageLimits != null ? !this.cacheUsageLimits.equals(that.cacheUsageLimits) : that.cacheUsageLimits != null) return false;
            if (this.dailySnapshotTime != null ? !this.dailySnapshotTime.equals(that.dailySnapshotTime) : that.dailySnapshotTime != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.majorEngineVersion != null ? !this.majorEngineVersion.equals(that.majorEngineVersion) : that.majorEngineVersion != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.snapshotArnsToRestore != null ? !this.snapshotArnsToRestore.equals(that.snapshotArnsToRestore) : that.snapshotArnsToRestore != null) return false;
            if (this.snapshotRetentionLimit != null ? !this.snapshotRetentionLimit.equals(that.snapshotRetentionLimit) : that.snapshotRetentionLimit != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userGroupId != null ? !this.userGroupId.equals(that.userGroupId) : that.userGroupId != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.engine.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.cacheUsageLimits != null ? this.cacheUsageLimits.hashCode() : 0);
            result = 31 * result + (this.dailySnapshotTime != null ? this.dailySnapshotTime.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.majorEngineVersion != null ? this.majorEngineVersion.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.snapshotArnsToRestore != null ? this.snapshotArnsToRestore.hashCode() : 0);
            result = 31 * result + (this.snapshotRetentionLimit != null ? this.snapshotRetentionLimit.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userGroupId != null ? this.userGroupId.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
