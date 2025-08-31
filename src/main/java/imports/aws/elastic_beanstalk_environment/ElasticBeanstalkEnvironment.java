package imports.aws.elastic_beanstalk_environment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment aws_elastic_beanstalk_environment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.163Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticBeanstalkEnvironment.ElasticBeanstalkEnvironment")
public class ElasticBeanstalkEnvironment extends com.hashicorp.cdktf.TerraformResource {

    protected ElasticBeanstalkEnvironment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticBeanstalkEnvironment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment aws_elastic_beanstalk_environment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElasticBeanstalkEnvironment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElasticBeanstalkEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticBeanstalkEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing ElasticBeanstalkEnvironment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElasticBeanstalkEnvironment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElasticBeanstalkEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticBeanstalkEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing ElasticBeanstalkEnvironment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting> __cast_cd4240 = (java.util.List<imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCnamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetCnamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatformArn() {
        software.amazon.jsii.Kernel.call(this, "resetPlatformArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPollInterval() {
        software.amazon.jsii.Kernel.call(this, "resetPollInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSetting() {
        software.amazon.jsii.Kernel.call(this, "resetSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSolutionStackName() {
        software.amazon.jsii.Kernel.call(this, "resetSolutionStackName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateName() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTier() {
        software.amazon.jsii.Kernel.call(this, "resetTier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionLabel() {
        software.amazon.jsii.Kernel.call(this, "resetVersionLabel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForReadyTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForReadyTimeout", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentAllSettingsList getAllSettings() {
        return software.amazon.jsii.Kernel.get(this, "allSettings", software.amazon.jsii.NativeType.forClass(imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentAllSettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAutoscalingGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "autoscalingGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCname() {
        return software.amazon.jsii.Kernel.get(this, "cname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointUrl() {
        return software.amazon.jsii.Kernel.get(this, "endpointUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstances() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLaunchConfigurations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "launchConfigurations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLoadBalancers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "loadBalancers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getQueues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "queues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSettingList getSetting() {
        return software.amazon.jsii.Kernel.get(this, "setting", software.amazon.jsii.NativeType.forClass(imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTriggers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCnamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "cnamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformArnInput() {
        return software.amazon.jsii.Kernel.get(this, "platformArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPollIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "pollIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "settingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSolutionStackNameInput() {
        return software.amazon.jsii.Kernel.get(this, "solutionStackNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateNameInput() {
        return software.amazon.jsii.Kernel.get(this, "templateNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTierInput() {
        return software.amazon.jsii.Kernel.get(this, "tierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "versionLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWaitForReadyTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForReadyTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplication() {
        return software.amazon.jsii.Kernel.get(this, "application", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplication(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "application", java.util.Objects.requireNonNull(value, "application is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCnamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "cnamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCnamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cnamePrefix", java.util.Objects.requireNonNull(value, "cnamePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformArn() {
        return software.amazon.jsii.Kernel.get(this, "platformArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatformArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platformArn", java.util.Objects.requireNonNull(value, "platformArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPollInterval() {
        return software.amazon.jsii.Kernel.get(this, "pollInterval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPollInterval(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pollInterval", java.util.Objects.requireNonNull(value, "pollInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSolutionStackName() {
        return software.amazon.jsii.Kernel.get(this, "solutionStackName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSolutionStackName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "solutionStackName", java.util.Objects.requireNonNull(value, "solutionStackName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateName() {
        return software.amazon.jsii.Kernel.get(this, "templateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateName", java.util.Objects.requireNonNull(value, "templateName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTier() {
        return software.amazon.jsii.Kernel.get(this, "tier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tier", java.util.Objects.requireNonNull(value, "tier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionLabel() {
        return software.amazon.jsii.Kernel.get(this, "versionLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionLabel", java.util.Objects.requireNonNull(value, "versionLabel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWaitForReadyTimeout() {
        return software.amazon.jsii.Kernel.get(this, "waitForReadyTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWaitForReadyTimeout(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "waitForReadyTimeout", java.util.Objects.requireNonNull(value, "waitForReadyTimeout is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment> {
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
        private final imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#application ElasticBeanstalkEnvironment#application}.
         * <p>
         * @return {@code this}
         * @param application Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#application ElasticBeanstalkEnvironment#application}. This parameter is required.
         */
        public Builder application(final java.lang.String application) {
            this.config.application(application);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#name ElasticBeanstalkEnvironment#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#name ElasticBeanstalkEnvironment#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#cname_prefix ElasticBeanstalkEnvironment#cname_prefix}.
         * <p>
         * @return {@code this}
         * @param cnamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#cname_prefix ElasticBeanstalkEnvironment#cname_prefix}. This parameter is required.
         */
        public Builder cnamePrefix(final java.lang.String cnamePrefix) {
            this.config.cnamePrefix(cnamePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#description ElasticBeanstalkEnvironment#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#description ElasticBeanstalkEnvironment#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#id ElasticBeanstalkEnvironment#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#id ElasticBeanstalkEnvironment#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#platform_arn ElasticBeanstalkEnvironment#platform_arn}.
         * <p>
         * @return {@code this}
         * @param platformArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#platform_arn ElasticBeanstalkEnvironment#platform_arn}. This parameter is required.
         */
        public Builder platformArn(final java.lang.String platformArn) {
            this.config.platformArn(platformArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#poll_interval ElasticBeanstalkEnvironment#poll_interval}.
         * <p>
         * @return {@code this}
         * @param pollInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#poll_interval ElasticBeanstalkEnvironment#poll_interval}. This parameter is required.
         */
        public Builder pollInterval(final java.lang.String pollInterval) {
            this.config.pollInterval(pollInterval);
            return this;
        }

        /**
         * setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#setting ElasticBeanstalkEnvironment#setting}
         * <p>
         * @return {@code this}
         * @param setting setting block. This parameter is required.
         */
        public Builder setting(final com.hashicorp.cdktf.IResolvable setting) {
            this.config.setting(setting);
            return this;
        }
        /**
         * setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#setting ElasticBeanstalkEnvironment#setting}
         * <p>
         * @return {@code this}
         * @param setting setting block. This parameter is required.
         */
        public Builder setting(final java.util.List<? extends imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting> setting) {
            this.config.setting(setting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#solution_stack_name ElasticBeanstalkEnvironment#solution_stack_name}.
         * <p>
         * @return {@code this}
         * @param solutionStackName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#solution_stack_name ElasticBeanstalkEnvironment#solution_stack_name}. This parameter is required.
         */
        public Builder solutionStackName(final java.lang.String solutionStackName) {
            this.config.solutionStackName(solutionStackName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags ElasticBeanstalkEnvironment#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags ElasticBeanstalkEnvironment#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags_all ElasticBeanstalkEnvironment#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags_all ElasticBeanstalkEnvironment#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#template_name ElasticBeanstalkEnvironment#template_name}.
         * <p>
         * @return {@code this}
         * @param templateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#template_name ElasticBeanstalkEnvironment#template_name}. This parameter is required.
         */
        public Builder templateName(final java.lang.String templateName) {
            this.config.templateName(templateName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tier ElasticBeanstalkEnvironment#tier}.
         * <p>
         * @return {@code this}
         * @param tier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tier ElasticBeanstalkEnvironment#tier}. This parameter is required.
         */
        public Builder tier(final java.lang.String tier) {
            this.config.tier(tier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#version_label ElasticBeanstalkEnvironment#version_label}.
         * <p>
         * @return {@code this}
         * @param versionLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#version_label ElasticBeanstalkEnvironment#version_label}. This parameter is required.
         */
        public Builder versionLabel(final java.lang.String versionLabel) {
            this.config.versionLabel(versionLabel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#wait_for_ready_timeout ElasticBeanstalkEnvironment#wait_for_ready_timeout}.
         * <p>
         * @return {@code this}
         * @param waitForReadyTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#wait_for_ready_timeout ElasticBeanstalkEnvironment#wait_for_ready_timeout}. This parameter is required.
         */
        public Builder waitForReadyTimeout(final java.lang.String waitForReadyTimeout) {
            this.config.waitForReadyTimeout(waitForReadyTimeout);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment}.
         */
        @Override
        public imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment build() {
            return new imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
