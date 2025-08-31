package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#event_time_feature_name SagemakerFeatureGroup#event_time_feature_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEventTimeFeatureName();

    /**
     * feature_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_definition SagemakerFeatureGroup#feature_definition}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getFeatureDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_group_name SagemakerFeatureGroup#feature_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFeatureGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#record_identifier_feature_name SagemakerFeatureGroup#record_identifier_feature_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordIdentifierFeatureName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#role_arn SagemakerFeatureGroup#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#description SagemakerFeatureGroup#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#id SagemakerFeatureGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * offline_store_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#offline_store_config SagemakerFeatureGroup#offline_store_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig getOfflineStoreConfig() {
        return null;
    }

    /**
     * online_store_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#online_store_config SagemakerFeatureGroup#online_store_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig getOnlineStoreConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#tags SagemakerFeatureGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#tags_all SagemakerFeatureGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * throughput_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#throughput_config SagemakerFeatureGroup#throughput_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig getThroughputConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupConfig> {
        java.lang.String eventTimeFeatureName;
        java.lang.Object featureDefinition;
        java.lang.String featureGroupName;
        java.lang.String recordIdentifierFeatureName;
        java.lang.String roleArn;
        java.lang.String description;
        java.lang.String id;
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig offlineStoreConfig;
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig onlineStoreConfig;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig throughputConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getEventTimeFeatureName}
         * @param eventTimeFeatureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#event_time_feature_name SagemakerFeatureGroup#event_time_feature_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder eventTimeFeatureName(java.lang.String eventTimeFeatureName) {
            this.eventTimeFeatureName = eventTimeFeatureName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getFeatureDefinition}
         * @param featureDefinition feature_definition block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_definition SagemakerFeatureGroup#feature_definition}
         * @return {@code this}
         */
        public Builder featureDefinition(com.hashicorp.cdktf.IResolvable featureDefinition) {
            this.featureDefinition = featureDefinition;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getFeatureDefinition}
         * @param featureDefinition feature_definition block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_definition SagemakerFeatureGroup#feature_definition}
         * @return {@code this}
         */
        public Builder featureDefinition(java.util.List<? extends imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinition> featureDefinition) {
            this.featureDefinition = featureDefinition;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getFeatureGroupName}
         * @param featureGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_group_name SagemakerFeatureGroup#feature_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder featureGroupName(java.lang.String featureGroupName) {
            this.featureGroupName = featureGroupName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getRecordIdentifierFeatureName}
         * @param recordIdentifierFeatureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#record_identifier_feature_name SagemakerFeatureGroup#record_identifier_feature_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordIdentifierFeatureName(java.lang.String recordIdentifierFeatureName) {
            this.recordIdentifierFeatureName = recordIdentifierFeatureName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#role_arn SagemakerFeatureGroup#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#description SagemakerFeatureGroup#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#id SagemakerFeatureGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getOfflineStoreConfig}
         * @param offlineStoreConfig offline_store_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#offline_store_config SagemakerFeatureGroup#offline_store_config}
         * @return {@code this}
         */
        public Builder offlineStoreConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig offlineStoreConfig) {
            this.offlineStoreConfig = offlineStoreConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getOnlineStoreConfig}
         * @param onlineStoreConfig online_store_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#online_store_config SagemakerFeatureGroup#online_store_config}
         * @return {@code this}
         */
        public Builder onlineStoreConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig onlineStoreConfig) {
            this.onlineStoreConfig = onlineStoreConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#tags SagemakerFeatureGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#tags_all SagemakerFeatureGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getThroughputConfig}
         * @param throughputConfig throughput_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#throughput_config SagemakerFeatureGroup#throughput_config}
         * @return {@code this}
         */
        public Builder throughputConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig throughputConfig) {
            this.throughputConfig = throughputConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerFeatureGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerFeatureGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupConfig {
        private final java.lang.String eventTimeFeatureName;
        private final java.lang.Object featureDefinition;
        private final java.lang.String featureGroupName;
        private final java.lang.String recordIdentifierFeatureName;
        private final java.lang.String roleArn;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig offlineStoreConfig;
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig onlineStoreConfig;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig throughputConfig;
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
            this.eventTimeFeatureName = software.amazon.jsii.Kernel.get(this, "eventTimeFeatureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.featureDefinition = software.amazon.jsii.Kernel.get(this, "featureDefinition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.featureGroupName = software.amazon.jsii.Kernel.get(this, "featureGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordIdentifierFeatureName = software.amazon.jsii.Kernel.get(this, "recordIdentifierFeatureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.offlineStoreConfig = software.amazon.jsii.Kernel.get(this, "offlineStoreConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig.class));
            this.onlineStoreConfig = software.amazon.jsii.Kernel.get(this, "onlineStoreConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.throughputConfig = software.amazon.jsii.Kernel.get(this, "throughputConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig.class));
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
            this.eventTimeFeatureName = java.util.Objects.requireNonNull(builder.eventTimeFeatureName, "eventTimeFeatureName is required");
            this.featureDefinition = java.util.Objects.requireNonNull(builder.featureDefinition, "featureDefinition is required");
            this.featureGroupName = java.util.Objects.requireNonNull(builder.featureGroupName, "featureGroupName is required");
            this.recordIdentifierFeatureName = java.util.Objects.requireNonNull(builder.recordIdentifierFeatureName, "recordIdentifierFeatureName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.description = builder.description;
            this.id = builder.id;
            this.offlineStoreConfig = builder.offlineStoreConfig;
            this.onlineStoreConfig = builder.onlineStoreConfig;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.throughputConfig = builder.throughputConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEventTimeFeatureName() {
            return this.eventTimeFeatureName;
        }

        @Override
        public final java.lang.Object getFeatureDefinition() {
            return this.featureDefinition;
        }

        @Override
        public final java.lang.String getFeatureGroupName() {
            return this.featureGroupName;
        }

        @Override
        public final java.lang.String getRecordIdentifierFeatureName() {
            return this.recordIdentifierFeatureName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
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
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOfflineStoreConfig getOfflineStoreConfig() {
            return this.offlineStoreConfig;
        }

        @Override
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfig getOnlineStoreConfig() {
            return this.onlineStoreConfig;
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
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig getThroughputConfig() {
            return this.throughputConfig;
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

            data.set("eventTimeFeatureName", om.valueToTree(this.getEventTimeFeatureName()));
            data.set("featureDefinition", om.valueToTree(this.getFeatureDefinition()));
            data.set("featureGroupName", om.valueToTree(this.getFeatureGroupName()));
            data.set("recordIdentifierFeatureName", om.valueToTree(this.getRecordIdentifierFeatureName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOfflineStoreConfig() != null) {
                data.set("offlineStoreConfig", om.valueToTree(this.getOfflineStoreConfig()));
            }
            if (this.getOnlineStoreConfig() != null) {
                data.set("onlineStoreConfig", om.valueToTree(this.getOnlineStoreConfig()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThroughputConfig() != null) {
                data.set("throughputConfig", om.valueToTree(this.getThroughputConfig()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupConfig.Jsii$Proxy that = (SagemakerFeatureGroupConfig.Jsii$Proxy) o;

            if (!eventTimeFeatureName.equals(that.eventTimeFeatureName)) return false;
            if (!featureDefinition.equals(that.featureDefinition)) return false;
            if (!featureGroupName.equals(that.featureGroupName)) return false;
            if (!recordIdentifierFeatureName.equals(that.recordIdentifierFeatureName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.offlineStoreConfig != null ? !this.offlineStoreConfig.equals(that.offlineStoreConfig) : that.offlineStoreConfig != null) return false;
            if (this.onlineStoreConfig != null ? !this.onlineStoreConfig.equals(that.onlineStoreConfig) : that.onlineStoreConfig != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.throughputConfig != null ? !this.throughputConfig.equals(that.throughputConfig) : that.throughputConfig != null) return false;
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
            int result = this.eventTimeFeatureName.hashCode();
            result = 31 * result + (this.featureDefinition.hashCode());
            result = 31 * result + (this.featureGroupName.hashCode());
            result = 31 * result + (this.recordIdentifierFeatureName.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.offlineStoreConfig != null ? this.offlineStoreConfig.hashCode() : 0);
            result = 31 * result + (this.onlineStoreConfig != null ? this.onlineStoreConfig.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.throughputConfig != null ? this.throughputConfig.hashCode() : 0);
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
