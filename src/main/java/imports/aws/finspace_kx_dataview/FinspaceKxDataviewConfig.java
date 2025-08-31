package imports.aws.finspace_kx_dataview;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.223Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxDataview.FinspaceKxDataviewConfig")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxDataviewConfig.Jsii$Proxy.class)
public interface FinspaceKxDataviewConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAutoUpdate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#az_mode FinspaceKxDataview#az_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAzMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#database_name FinspaceKxDataview#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#environment_id FinspaceKxDataview#environment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#name FinspaceKxDataview#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#availability_zone_id FinspaceKxDataview#availability_zone_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#changeset_id FinspaceKxDataview#changeset_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getChangesetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#description FinspaceKxDataview#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#id FinspaceKxDataview#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadWrite() {
        return null;
    }

    /**
     * segment_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#segment_configurations FinspaceKxDataview#segment_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSegmentConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags FinspaceKxDataview#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags_all FinspaceKxDataview#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#timeouts FinspaceKxDataview#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxDataviewConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxDataviewConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxDataviewConfig> {
        java.lang.Object autoUpdate;
        java.lang.String azMode;
        java.lang.String databaseName;
        java.lang.String environmentId;
        java.lang.String name;
        java.lang.String availabilityZoneId;
        java.lang.String changesetId;
        java.lang.String description;
        java.lang.String id;
        java.lang.Object readWrite;
        java.lang.Object segmentConfigurations;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getAutoUpdate}
         * @param autoUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoUpdate(java.lang.Boolean autoUpdate) {
            this.autoUpdate = autoUpdate;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getAutoUpdate}
         * @param autoUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoUpdate(com.hashicorp.cdktf.IResolvable autoUpdate) {
            this.autoUpdate = autoUpdate;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getAzMode}
         * @param azMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#az_mode FinspaceKxDataview#az_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder azMode(java.lang.String azMode) {
            this.azMode = azMode;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#database_name FinspaceKxDataview#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getEnvironmentId}
         * @param environmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#environment_id FinspaceKxDataview#environment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder environmentId(java.lang.String environmentId) {
            this.environmentId = environmentId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#name FinspaceKxDataview#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getAvailabilityZoneId}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#availability_zone_id FinspaceKxDataview#availability_zone_id}.
         * @return {@code this}
         */
        public Builder availabilityZoneId(java.lang.String availabilityZoneId) {
            this.availabilityZoneId = availabilityZoneId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getChangesetId}
         * @param changesetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#changeset_id FinspaceKxDataview#changeset_id}.
         * @return {@code this}
         */
        public Builder changesetId(java.lang.String changesetId) {
            this.changesetId = changesetId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#description FinspaceKxDataview#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#id FinspaceKxDataview#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getReadWrite}
         * @param readWrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}.
         * @return {@code this}
         */
        public Builder readWrite(java.lang.Boolean readWrite) {
            this.readWrite = readWrite;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getReadWrite}
         * @param readWrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}.
         * @return {@code this}
         */
        public Builder readWrite(com.hashicorp.cdktf.IResolvable readWrite) {
            this.readWrite = readWrite;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getSegmentConfigurations}
         * @param segmentConfigurations segment_configurations block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#segment_configurations FinspaceKxDataview#segment_configurations}
         * @return {@code this}
         */
        public Builder segmentConfigurations(com.hashicorp.cdktf.IResolvable segmentConfigurations) {
            this.segmentConfigurations = segmentConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getSegmentConfigurations}
         * @param segmentConfigurations segment_configurations block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#segment_configurations FinspaceKxDataview#segment_configurations}
         * @return {@code this}
         */
        public Builder segmentConfigurations(java.util.List<? extends imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations> segmentConfigurations) {
            this.segmentConfigurations = segmentConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags FinspaceKxDataview#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags_all FinspaceKxDataview#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#timeouts FinspaceKxDataview#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getDependsOn}
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
         * Sets the value of {@link FinspaceKxDataviewConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewConfig#getProvisioners}
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
         * @return a new instance of {@link FinspaceKxDataviewConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxDataviewConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxDataviewConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxDataviewConfig {
        private final java.lang.Object autoUpdate;
        private final java.lang.String azMode;
        private final java.lang.String databaseName;
        private final java.lang.String environmentId;
        private final java.lang.String name;
        private final java.lang.String availabilityZoneId;
        private final java.lang.String changesetId;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.Object readWrite;
        private final java.lang.Object segmentConfigurations;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts timeouts;
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
            this.autoUpdate = software.amazon.jsii.Kernel.get(this, "autoUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.azMode = software.amazon.jsii.Kernel.get(this, "azMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environmentId = software.amazon.jsii.Kernel.get(this, "environmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZoneId = software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.changesetId = software.amazon.jsii.Kernel.get(this, "changesetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readWrite = software.amazon.jsii.Kernel.get(this, "readWrite", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.segmentConfigurations = software.amazon.jsii.Kernel.get(this, "segmentConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts.class));
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
            this.autoUpdate = java.util.Objects.requireNonNull(builder.autoUpdate, "autoUpdate is required");
            this.azMode = java.util.Objects.requireNonNull(builder.azMode, "azMode is required");
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.environmentId = java.util.Objects.requireNonNull(builder.environmentId, "environmentId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.availabilityZoneId = builder.availabilityZoneId;
            this.changesetId = builder.changesetId;
            this.description = builder.description;
            this.id = builder.id;
            this.readWrite = builder.readWrite;
            this.segmentConfigurations = builder.segmentConfigurations;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getAutoUpdate() {
            return this.autoUpdate;
        }

        @Override
        public final java.lang.String getAzMode() {
            return this.azMode;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getEnvironmentId() {
            return this.environmentId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAvailabilityZoneId() {
            return this.availabilityZoneId;
        }

        @Override
        public final java.lang.String getChangesetId() {
            return this.changesetId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getReadWrite() {
            return this.readWrite;
        }

        @Override
        public final java.lang.Object getSegmentConfigurations() {
            return this.segmentConfigurations;
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
        public final imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("autoUpdate", om.valueToTree(this.getAutoUpdate()));
            data.set("azMode", om.valueToTree(this.getAzMode()));
            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("environmentId", om.valueToTree(this.getEnvironmentId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAvailabilityZoneId() != null) {
                data.set("availabilityZoneId", om.valueToTree(this.getAvailabilityZoneId()));
            }
            if (this.getChangesetId() != null) {
                data.set("changesetId", om.valueToTree(this.getChangesetId()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getReadWrite() != null) {
                data.set("readWrite", om.valueToTree(this.getReadWrite()));
            }
            if (this.getSegmentConfigurations() != null) {
                data.set("segmentConfigurations", om.valueToTree(this.getSegmentConfigurations()));
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
            struct.set("fqn", om.valueToTree("aws.finspaceKxDataview.FinspaceKxDataviewConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxDataviewConfig.Jsii$Proxy that = (FinspaceKxDataviewConfig.Jsii$Proxy) o;

            if (!autoUpdate.equals(that.autoUpdate)) return false;
            if (!azMode.equals(that.azMode)) return false;
            if (!databaseName.equals(that.databaseName)) return false;
            if (!environmentId.equals(that.environmentId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.availabilityZoneId != null ? !this.availabilityZoneId.equals(that.availabilityZoneId) : that.availabilityZoneId != null) return false;
            if (this.changesetId != null ? !this.changesetId.equals(that.changesetId) : that.changesetId != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.readWrite != null ? !this.readWrite.equals(that.readWrite) : that.readWrite != null) return false;
            if (this.segmentConfigurations != null ? !this.segmentConfigurations.equals(that.segmentConfigurations) : that.segmentConfigurations != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.autoUpdate.hashCode();
            result = 31 * result + (this.azMode.hashCode());
            result = 31 * result + (this.databaseName.hashCode());
            result = 31 * result + (this.environmentId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.availabilityZoneId != null ? this.availabilityZoneId.hashCode() : 0);
            result = 31 * result + (this.changesetId != null ? this.changesetId.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.readWrite != null ? this.readWrite.hashCode() : 0);
            result = 31 * result + (this.segmentConfigurations != null ? this.segmentConfigurations.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
