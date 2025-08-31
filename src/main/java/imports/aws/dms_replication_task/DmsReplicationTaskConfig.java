package imports.aws.dms_replication_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.019Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsReplicationTask.DmsReplicationTaskConfig")
@software.amazon.jsii.Jsii.Proxy(DmsReplicationTaskConfig.Jsii$Proxy.class)
public interface DmsReplicationTaskConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#migration_type DmsReplicationTask#migration_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMigrationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_instance_arn DmsReplicationTask#replication_instance_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationInstanceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_id DmsReplicationTask#replication_task_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationTaskId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#source_endpoint_arn DmsReplicationTask#source_endpoint_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceEndpointArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#table_mappings DmsReplicationTask#table_mappings}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableMappings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#target_endpoint_arn DmsReplicationTask#target_endpoint_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetEndpointArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_position DmsReplicationTask#cdc_start_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCdcStartPosition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_time DmsReplicationTask#cdc_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCdcStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#id DmsReplicationTask#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_settings DmsReplicationTask#replication_task_settings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationTaskSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#resource_identifier DmsReplicationTask#resource_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartReplicationTask() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags DmsReplicationTask#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags_all DmsReplicationTask#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsReplicationTaskConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsReplicationTaskConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsReplicationTaskConfig> {
        java.lang.String migrationType;
        java.lang.String replicationInstanceArn;
        java.lang.String replicationTaskId;
        java.lang.String sourceEndpointArn;
        java.lang.String tableMappings;
        java.lang.String targetEndpointArn;
        java.lang.String cdcStartPosition;
        java.lang.String cdcStartTime;
        java.lang.String id;
        java.lang.String replicationTaskSettings;
        java.lang.String resourceIdentifier;
        java.lang.Object startReplicationTask;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getMigrationType}
         * @param migrationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#migration_type DmsReplicationTask#migration_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder migrationType(java.lang.String migrationType) {
            this.migrationType = migrationType;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getReplicationInstanceArn}
         * @param replicationInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_instance_arn DmsReplicationTask#replication_instance_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationInstanceArn(java.lang.String replicationInstanceArn) {
            this.replicationInstanceArn = replicationInstanceArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getReplicationTaskId}
         * @param replicationTaskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_id DmsReplicationTask#replication_task_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationTaskId(java.lang.String replicationTaskId) {
            this.replicationTaskId = replicationTaskId;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getSourceEndpointArn}
         * @param sourceEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#source_endpoint_arn DmsReplicationTask#source_endpoint_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceEndpointArn(java.lang.String sourceEndpointArn) {
            this.sourceEndpointArn = sourceEndpointArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getTableMappings}
         * @param tableMappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#table_mappings DmsReplicationTask#table_mappings}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableMappings(java.lang.String tableMappings) {
            this.tableMappings = tableMappings;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getTargetEndpointArn}
         * @param targetEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#target_endpoint_arn DmsReplicationTask#target_endpoint_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetEndpointArn(java.lang.String targetEndpointArn) {
            this.targetEndpointArn = targetEndpointArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getCdcStartPosition}
         * @param cdcStartPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_position DmsReplicationTask#cdc_start_position}.
         * @return {@code this}
         */
        public Builder cdcStartPosition(java.lang.String cdcStartPosition) {
            this.cdcStartPosition = cdcStartPosition;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getCdcStartTime}
         * @param cdcStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_time DmsReplicationTask#cdc_start_time}.
         * @return {@code this}
         */
        public Builder cdcStartTime(java.lang.String cdcStartTime) {
            this.cdcStartTime = cdcStartTime;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#id DmsReplicationTask#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getReplicationTaskSettings}
         * @param replicationTaskSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_settings DmsReplicationTask#replication_task_settings}.
         * @return {@code this}
         */
        public Builder replicationTaskSettings(java.lang.String replicationTaskSettings) {
            this.replicationTaskSettings = replicationTaskSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getResourceIdentifier}
         * @param resourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#resource_identifier DmsReplicationTask#resource_identifier}.
         * @return {@code this}
         */
        public Builder resourceIdentifier(java.lang.String resourceIdentifier) {
            this.resourceIdentifier = resourceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getStartReplicationTask}
         * @param startReplicationTask Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}.
         * @return {@code this}
         */
        public Builder startReplicationTask(java.lang.Boolean startReplicationTask) {
            this.startReplicationTask = startReplicationTask;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getStartReplicationTask}
         * @param startReplicationTask Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}.
         * @return {@code this}
         */
        public Builder startReplicationTask(com.hashicorp.cdktf.IResolvable startReplicationTask) {
            this.startReplicationTask = startReplicationTask;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags DmsReplicationTask#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags_all DmsReplicationTask#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getDependsOn}
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
         * Sets the value of {@link DmsReplicationTaskConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationTaskConfig#getProvisioners}
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
         * @return a new instance of {@link DmsReplicationTaskConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsReplicationTaskConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsReplicationTaskConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsReplicationTaskConfig {
        private final java.lang.String migrationType;
        private final java.lang.String replicationInstanceArn;
        private final java.lang.String replicationTaskId;
        private final java.lang.String sourceEndpointArn;
        private final java.lang.String tableMappings;
        private final java.lang.String targetEndpointArn;
        private final java.lang.String cdcStartPosition;
        private final java.lang.String cdcStartTime;
        private final java.lang.String id;
        private final java.lang.String replicationTaskSettings;
        private final java.lang.String resourceIdentifier;
        private final java.lang.Object startReplicationTask;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.migrationType = software.amazon.jsii.Kernel.get(this, "migrationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationInstanceArn = software.amazon.jsii.Kernel.get(this, "replicationInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationTaskId = software.amazon.jsii.Kernel.get(this, "replicationTaskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceEndpointArn = software.amazon.jsii.Kernel.get(this, "sourceEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableMappings = software.amazon.jsii.Kernel.get(this, "tableMappings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetEndpointArn = software.amazon.jsii.Kernel.get(this, "targetEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cdcStartPosition = software.amazon.jsii.Kernel.get(this, "cdcStartPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cdcStartTime = software.amazon.jsii.Kernel.get(this, "cdcStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationTaskSettings = software.amazon.jsii.Kernel.get(this, "replicationTaskSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceIdentifier = software.amazon.jsii.Kernel.get(this, "resourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startReplicationTask = software.amazon.jsii.Kernel.get(this, "startReplicationTask", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.migrationType = java.util.Objects.requireNonNull(builder.migrationType, "migrationType is required");
            this.replicationInstanceArn = java.util.Objects.requireNonNull(builder.replicationInstanceArn, "replicationInstanceArn is required");
            this.replicationTaskId = java.util.Objects.requireNonNull(builder.replicationTaskId, "replicationTaskId is required");
            this.sourceEndpointArn = java.util.Objects.requireNonNull(builder.sourceEndpointArn, "sourceEndpointArn is required");
            this.tableMappings = java.util.Objects.requireNonNull(builder.tableMappings, "tableMappings is required");
            this.targetEndpointArn = java.util.Objects.requireNonNull(builder.targetEndpointArn, "targetEndpointArn is required");
            this.cdcStartPosition = builder.cdcStartPosition;
            this.cdcStartTime = builder.cdcStartTime;
            this.id = builder.id;
            this.replicationTaskSettings = builder.replicationTaskSettings;
            this.resourceIdentifier = builder.resourceIdentifier;
            this.startReplicationTask = builder.startReplicationTask;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getMigrationType() {
            return this.migrationType;
        }

        @Override
        public final java.lang.String getReplicationInstanceArn() {
            return this.replicationInstanceArn;
        }

        @Override
        public final java.lang.String getReplicationTaskId() {
            return this.replicationTaskId;
        }

        @Override
        public final java.lang.String getSourceEndpointArn() {
            return this.sourceEndpointArn;
        }

        @Override
        public final java.lang.String getTableMappings() {
            return this.tableMappings;
        }

        @Override
        public final java.lang.String getTargetEndpointArn() {
            return this.targetEndpointArn;
        }

        @Override
        public final java.lang.String getCdcStartPosition() {
            return this.cdcStartPosition;
        }

        @Override
        public final java.lang.String getCdcStartTime() {
            return this.cdcStartTime;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getReplicationTaskSettings() {
            return this.replicationTaskSettings;
        }

        @Override
        public final java.lang.String getResourceIdentifier() {
            return this.resourceIdentifier;
        }

        @Override
        public final java.lang.Object getStartReplicationTask() {
            return this.startReplicationTask;
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

            data.set("migrationType", om.valueToTree(this.getMigrationType()));
            data.set("replicationInstanceArn", om.valueToTree(this.getReplicationInstanceArn()));
            data.set("replicationTaskId", om.valueToTree(this.getReplicationTaskId()));
            data.set("sourceEndpointArn", om.valueToTree(this.getSourceEndpointArn()));
            data.set("tableMappings", om.valueToTree(this.getTableMappings()));
            data.set("targetEndpointArn", om.valueToTree(this.getTargetEndpointArn()));
            if (this.getCdcStartPosition() != null) {
                data.set("cdcStartPosition", om.valueToTree(this.getCdcStartPosition()));
            }
            if (this.getCdcStartTime() != null) {
                data.set("cdcStartTime", om.valueToTree(this.getCdcStartTime()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getReplicationTaskSettings() != null) {
                data.set("replicationTaskSettings", om.valueToTree(this.getReplicationTaskSettings()));
            }
            if (this.getResourceIdentifier() != null) {
                data.set("resourceIdentifier", om.valueToTree(this.getResourceIdentifier()));
            }
            if (this.getStartReplicationTask() != null) {
                data.set("startReplicationTask", om.valueToTree(this.getStartReplicationTask()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.dmsReplicationTask.DmsReplicationTaskConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsReplicationTaskConfig.Jsii$Proxy that = (DmsReplicationTaskConfig.Jsii$Proxy) o;

            if (!migrationType.equals(that.migrationType)) return false;
            if (!replicationInstanceArn.equals(that.replicationInstanceArn)) return false;
            if (!replicationTaskId.equals(that.replicationTaskId)) return false;
            if (!sourceEndpointArn.equals(that.sourceEndpointArn)) return false;
            if (!tableMappings.equals(that.tableMappings)) return false;
            if (!targetEndpointArn.equals(that.targetEndpointArn)) return false;
            if (this.cdcStartPosition != null ? !this.cdcStartPosition.equals(that.cdcStartPosition) : that.cdcStartPosition != null) return false;
            if (this.cdcStartTime != null ? !this.cdcStartTime.equals(that.cdcStartTime) : that.cdcStartTime != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.replicationTaskSettings != null ? !this.replicationTaskSettings.equals(that.replicationTaskSettings) : that.replicationTaskSettings != null) return false;
            if (this.resourceIdentifier != null ? !this.resourceIdentifier.equals(that.resourceIdentifier) : that.resourceIdentifier != null) return false;
            if (this.startReplicationTask != null ? !this.startReplicationTask.equals(that.startReplicationTask) : that.startReplicationTask != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.migrationType.hashCode();
            result = 31 * result + (this.replicationInstanceArn.hashCode());
            result = 31 * result + (this.replicationTaskId.hashCode());
            result = 31 * result + (this.sourceEndpointArn.hashCode());
            result = 31 * result + (this.tableMappings.hashCode());
            result = 31 * result + (this.targetEndpointArn.hashCode());
            result = 31 * result + (this.cdcStartPosition != null ? this.cdcStartPosition.hashCode() : 0);
            result = 31 * result + (this.cdcStartTime != null ? this.cdcStartTime.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.replicationTaskSettings != null ? this.replicationTaskSettings.hashCode() : 0);
            result = 31 * result + (this.resourceIdentifier != null ? this.resourceIdentifier.hashCode() : 0);
            result = 31 * result + (this.startReplicationTask != null ? this.startReplicationTask.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
