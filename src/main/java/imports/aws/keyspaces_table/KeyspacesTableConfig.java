package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableConfig")
@software.amazon.jsii.Jsii.Proxy(KeyspacesTableConfig.Jsii$Proxy.class)
public interface KeyspacesTableConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#keyspace_name KeyspacesTable#keyspace_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyspaceName();

    /**
     * schema_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#schema_definition KeyspacesTable#schema_definition}
     */
    @org.jetbrains.annotations.NotNull imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition getSchemaDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#table_name KeyspacesTable#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * capacity_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#capacity_specification KeyspacesTable#capacity_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification getCapacitySpecification() {
        return null;
    }

    /**
     * client_side_timestamps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#client_side_timestamps KeyspacesTable#client_side_timestamps}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps getClientSideTimestamps() {
        return null;
    }

    /**
     * comment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#comment KeyspacesTable#comment}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableComment getComment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#default_time_to_live KeyspacesTable#default_time_to_live}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultTimeToLive() {
        return null;
    }

    /**
     * encryption_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#encryption_specification KeyspacesTable#encryption_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification getEncryptionSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#id KeyspacesTable#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * point_in_time_recovery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#point_in_time_recovery KeyspacesTable#point_in_time_recovery}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery getPointInTimeRecovery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#tags KeyspacesTable#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#tags_all KeyspacesTable#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#timeouts KeyspacesTable#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableTimeouts getTimeouts() {
        return null;
    }

    /**
     * ttl block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#ttl KeyspacesTable#ttl}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableTtl getTtl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KeyspacesTableConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesTableConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesTableConfig> {
        java.lang.String keyspaceName;
        imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition schemaDefinition;
        java.lang.String tableName;
        imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification capacitySpecification;
        imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps clientSideTimestamps;
        imports.aws.keyspaces_table.KeyspacesTableComment comment;
        java.lang.Number defaultTimeToLive;
        imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification encryptionSpecification;
        java.lang.String id;
        imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery pointInTimeRecovery;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.keyspaces_table.KeyspacesTableTimeouts timeouts;
        imports.aws.keyspaces_table.KeyspacesTableTtl ttl;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link KeyspacesTableConfig#getKeyspaceName}
         * @param keyspaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#keyspace_name KeyspacesTable#keyspace_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyspaceName(java.lang.String keyspaceName) {
            this.keyspaceName = keyspaceName;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getSchemaDefinition}
         * @param schemaDefinition schema_definition block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#schema_definition KeyspacesTable#schema_definition}
         * @return {@code this}
         */
        public Builder schemaDefinition(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition schemaDefinition) {
            this.schemaDefinition = schemaDefinition;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#table_name KeyspacesTable#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getCapacitySpecification}
         * @param capacitySpecification capacity_specification block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#capacity_specification KeyspacesTable#capacity_specification}
         * @return {@code this}
         */
        public Builder capacitySpecification(imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification capacitySpecification) {
            this.capacitySpecification = capacitySpecification;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getClientSideTimestamps}
         * @param clientSideTimestamps client_side_timestamps block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#client_side_timestamps KeyspacesTable#client_side_timestamps}
         * @return {@code this}
         */
        public Builder clientSideTimestamps(imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps clientSideTimestamps) {
            this.clientSideTimestamps = clientSideTimestamps;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getComment}
         * @param comment comment block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#comment KeyspacesTable#comment}
         * @return {@code this}
         */
        public Builder comment(imports.aws.keyspaces_table.KeyspacesTableComment comment) {
            this.comment = comment;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getDefaultTimeToLive}
         * @param defaultTimeToLive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#default_time_to_live KeyspacesTable#default_time_to_live}.
         * @return {@code this}
         */
        public Builder defaultTimeToLive(java.lang.Number defaultTimeToLive) {
            this.defaultTimeToLive = defaultTimeToLive;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getEncryptionSpecification}
         * @param encryptionSpecification encryption_specification block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#encryption_specification KeyspacesTable#encryption_specification}
         * @return {@code this}
         */
        public Builder encryptionSpecification(imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification encryptionSpecification) {
            this.encryptionSpecification = encryptionSpecification;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#id KeyspacesTable#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getPointInTimeRecovery}
         * @param pointInTimeRecovery point_in_time_recovery block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#point_in_time_recovery KeyspacesTable#point_in_time_recovery}
         * @return {@code this}
         */
        public Builder pointInTimeRecovery(imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery pointInTimeRecovery) {
            this.pointInTimeRecovery = pointInTimeRecovery;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#tags KeyspacesTable#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#tags_all KeyspacesTable#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#timeouts KeyspacesTable#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.keyspaces_table.KeyspacesTableTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getTtl}
         * @param ttl ttl block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#ttl KeyspacesTable#ttl}
         * @return {@code this}
         */
        public Builder ttl(imports.aws.keyspaces_table.KeyspacesTableTtl ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getDependsOn}
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
         * Sets the value of {@link KeyspacesTableConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableConfig#getProvisioners}
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
         * @return a new instance of {@link KeyspacesTableConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesTableConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesTableConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesTableConfig {
        private final java.lang.String keyspaceName;
        private final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition schemaDefinition;
        private final java.lang.String tableName;
        private final imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification capacitySpecification;
        private final imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps clientSideTimestamps;
        private final imports.aws.keyspaces_table.KeyspacesTableComment comment;
        private final java.lang.Number defaultTimeToLive;
        private final imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification encryptionSpecification;
        private final java.lang.String id;
        private final imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery pointInTimeRecovery;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.keyspaces_table.KeyspacesTableTimeouts timeouts;
        private final imports.aws.keyspaces_table.KeyspacesTableTtl ttl;
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
            this.keyspaceName = software.amazon.jsii.Kernel.get(this, "keyspaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schemaDefinition = software.amazon.jsii.Kernel.get(this, "schemaDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacitySpecification = software.amazon.jsii.Kernel.get(this, "capacitySpecification", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification.class));
            this.clientSideTimestamps = software.amazon.jsii.Kernel.get(this, "clientSideTimestamps", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps.class));
            this.comment = software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableComment.class));
            this.defaultTimeToLive = software.amazon.jsii.Kernel.get(this, "defaultTimeToLive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.encryptionSpecification = software.amazon.jsii.Kernel.get(this, "encryptionSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pointInTimeRecovery = software.amazon.jsii.Kernel.get(this, "pointInTimeRecovery", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableTimeouts.class));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableTtl.class));
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
            this.keyspaceName = java.util.Objects.requireNonNull(builder.keyspaceName, "keyspaceName is required");
            this.schemaDefinition = java.util.Objects.requireNonNull(builder.schemaDefinition, "schemaDefinition is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.capacitySpecification = builder.capacitySpecification;
            this.clientSideTimestamps = builder.clientSideTimestamps;
            this.comment = builder.comment;
            this.defaultTimeToLive = builder.defaultTimeToLive;
            this.encryptionSpecification = builder.encryptionSpecification;
            this.id = builder.id;
            this.pointInTimeRecovery = builder.pointInTimeRecovery;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.ttl = builder.ttl;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getKeyspaceName() {
            return this.keyspaceName;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition getSchemaDefinition() {
            return this.schemaDefinition;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification getCapacitySpecification() {
            return this.capacitySpecification;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableClientSideTimestamps getClientSideTimestamps() {
            return this.clientSideTimestamps;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableComment getComment() {
            return this.comment;
        }

        @Override
        public final java.lang.Number getDefaultTimeToLive() {
            return this.defaultTimeToLive;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableEncryptionSpecification getEncryptionSpecification() {
            return this.encryptionSpecification;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTablePointInTimeRecovery getPointInTimeRecovery() {
            return this.pointInTimeRecovery;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.keyspaces_table.KeyspacesTableTtl getTtl() {
            return this.ttl;
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

            data.set("keyspaceName", om.valueToTree(this.getKeyspaceName()));
            data.set("schemaDefinition", om.valueToTree(this.getSchemaDefinition()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getCapacitySpecification() != null) {
                data.set("capacitySpecification", om.valueToTree(this.getCapacitySpecification()));
            }
            if (this.getClientSideTimestamps() != null) {
                data.set("clientSideTimestamps", om.valueToTree(this.getClientSideTimestamps()));
            }
            if (this.getComment() != null) {
                data.set("comment", om.valueToTree(this.getComment()));
            }
            if (this.getDefaultTimeToLive() != null) {
                data.set("defaultTimeToLive", om.valueToTree(this.getDefaultTimeToLive()));
            }
            if (this.getEncryptionSpecification() != null) {
                data.set("encryptionSpecification", om.valueToTree(this.getEncryptionSpecification()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPointInTimeRecovery() != null) {
                data.set("pointInTimeRecovery", om.valueToTree(this.getPointInTimeRecovery()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
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
            struct.set("fqn", om.valueToTree("aws.keyspacesTable.KeyspacesTableConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesTableConfig.Jsii$Proxy that = (KeyspacesTableConfig.Jsii$Proxy) o;

            if (!keyspaceName.equals(that.keyspaceName)) return false;
            if (!schemaDefinition.equals(that.schemaDefinition)) return false;
            if (!tableName.equals(that.tableName)) return false;
            if (this.capacitySpecification != null ? !this.capacitySpecification.equals(that.capacitySpecification) : that.capacitySpecification != null) return false;
            if (this.clientSideTimestamps != null ? !this.clientSideTimestamps.equals(that.clientSideTimestamps) : that.clientSideTimestamps != null) return false;
            if (this.comment != null ? !this.comment.equals(that.comment) : that.comment != null) return false;
            if (this.defaultTimeToLive != null ? !this.defaultTimeToLive.equals(that.defaultTimeToLive) : that.defaultTimeToLive != null) return false;
            if (this.encryptionSpecification != null ? !this.encryptionSpecification.equals(that.encryptionSpecification) : that.encryptionSpecification != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.pointInTimeRecovery != null ? !this.pointInTimeRecovery.equals(that.pointInTimeRecovery) : that.pointInTimeRecovery != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.ttl != null ? !this.ttl.equals(that.ttl) : that.ttl != null) return false;
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
            int result = this.keyspaceName.hashCode();
            result = 31 * result + (this.schemaDefinition.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.capacitySpecification != null ? this.capacitySpecification.hashCode() : 0);
            result = 31 * result + (this.clientSideTimestamps != null ? this.clientSideTimestamps.hashCode() : 0);
            result = 31 * result + (this.comment != null ? this.comment.hashCode() : 0);
            result = 31 * result + (this.defaultTimeToLive != null ? this.defaultTimeToLive.hashCode() : 0);
            result = 31 * result + (this.encryptionSpecification != null ? this.encryptionSpecification.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.pointInTimeRecovery != null ? this.pointInTimeRecovery.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
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
