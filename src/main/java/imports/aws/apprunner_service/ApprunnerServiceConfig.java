package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceConfig")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceConfig.Jsii$Proxy.class)
public interface ApprunnerServiceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#service_name ApprunnerService#service_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceName();

    /**
     * source_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_configuration ApprunnerService#source_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration getSourceConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#auto_scaling_configuration_arn ApprunnerService#auto_scaling_configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoScalingConfigurationArn() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#encryption_configuration ApprunnerService#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration getEncryptionConfiguration() {
        return null;
    }

    /**
     * health_check_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#health_check_configuration ApprunnerService#health_check_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration getHealthCheckConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#id ApprunnerService#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * instance_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#instance_configuration ApprunnerService#instance_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration getInstanceConfiguration() {
        return null;
    }

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#network_configuration ApprunnerService#network_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration getNetworkConfiguration() {
        return null;
    }

    /**
     * observability_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_configuration ApprunnerService#observability_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration getObservabilityConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#tags ApprunnerService#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#tags_all ApprunnerService#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceConfig> {
        java.lang.String serviceName;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration sourceConfiguration;
        java.lang.String autoScalingConfigurationArn;
        imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration encryptionConfiguration;
        imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration healthCheckConfiguration;
        java.lang.String id;
        imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration instanceConfiguration;
        imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration networkConfiguration;
        imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration observabilityConfiguration;
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
         * Sets the value of {@link ApprunnerServiceConfig#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#service_name ApprunnerService#service_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getSourceConfiguration}
         * @param sourceConfiguration source_configuration block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_configuration ApprunnerService#source_configuration}
         * @return {@code this}
         */
        public Builder sourceConfiguration(imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration sourceConfiguration) {
            this.sourceConfiguration = sourceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getAutoScalingConfigurationArn}
         * @param autoScalingConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#auto_scaling_configuration_arn ApprunnerService#auto_scaling_configuration_arn}.
         * @return {@code this}
         */
        public Builder autoScalingConfigurationArn(java.lang.String autoScalingConfigurationArn) {
            this.autoScalingConfigurationArn = autoScalingConfigurationArn;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#encryption_configuration ApprunnerService#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getHealthCheckConfiguration}
         * @param healthCheckConfiguration health_check_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#health_check_configuration ApprunnerService#health_check_configuration}
         * @return {@code this}
         */
        public Builder healthCheckConfiguration(imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration healthCheckConfiguration) {
            this.healthCheckConfiguration = healthCheckConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#id ApprunnerService#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getInstanceConfiguration}
         * @param instanceConfiguration instance_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#instance_configuration ApprunnerService#instance_configuration}
         * @return {@code this}
         */
        public Builder instanceConfiguration(imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration instanceConfiguration) {
            this.instanceConfiguration = instanceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#network_configuration ApprunnerService#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getObservabilityConfiguration}
         * @param observabilityConfiguration observability_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_configuration ApprunnerService#observability_configuration}
         * @return {@code this}
         */
        public Builder observabilityConfiguration(imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration observabilityConfiguration) {
            this.observabilityConfiguration = observabilityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#tags ApprunnerService#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#tags_all ApprunnerService#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getDependsOn}
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
         * Sets the value of {@link ApprunnerServiceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceConfig#getProvisioners}
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
         * @return a new instance of {@link ApprunnerServiceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceConfig {
        private final java.lang.String serviceName;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration sourceConfiguration;
        private final java.lang.String autoScalingConfigurationArn;
        private final imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration encryptionConfiguration;
        private final imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration healthCheckConfiguration;
        private final java.lang.String id;
        private final imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration instanceConfiguration;
        private final imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration networkConfiguration;
        private final imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration observabilityConfiguration;
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
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceConfiguration = software.amazon.jsii.Kernel.get(this, "sourceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration.class));
            this.autoScalingConfigurationArn = software.amazon.jsii.Kernel.get(this, "autoScalingConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration.class));
            this.healthCheckConfiguration = software.amazon.jsii.Kernel.get(this, "healthCheckConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceConfiguration = software.amazon.jsii.Kernel.get(this, "instanceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration.class));
            this.observabilityConfiguration = software.amazon.jsii.Kernel.get(this, "observabilityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration.class));
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
            this.serviceName = java.util.Objects.requireNonNull(builder.serviceName, "serviceName is required");
            this.sourceConfiguration = java.util.Objects.requireNonNull(builder.sourceConfiguration, "sourceConfiguration is required");
            this.autoScalingConfigurationArn = builder.autoScalingConfigurationArn;
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.healthCheckConfiguration = builder.healthCheckConfiguration;
            this.id = builder.id;
            this.instanceConfiguration = builder.instanceConfiguration;
            this.networkConfiguration = builder.networkConfiguration;
            this.observabilityConfiguration = builder.observabilityConfiguration;
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
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration getSourceConfiguration() {
            return this.sourceConfiguration;
        }

        @Override
        public final java.lang.String getAutoScalingConfigurationArn() {
            return this.autoScalingConfigurationArn;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceEncryptionConfiguration getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceHealthCheckConfiguration getHealthCheckConfiguration() {
            return this.healthCheckConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceInstanceConfiguration getInstanceConfiguration() {
            return this.instanceConfiguration;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceObservabilityConfiguration getObservabilityConfiguration() {
            return this.observabilityConfiguration;
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

            data.set("serviceName", om.valueToTree(this.getServiceName()));
            data.set("sourceConfiguration", om.valueToTree(this.getSourceConfiguration()));
            if (this.getAutoScalingConfigurationArn() != null) {
                data.set("autoScalingConfigurationArn", om.valueToTree(this.getAutoScalingConfigurationArn()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getHealthCheckConfiguration() != null) {
                data.set("healthCheckConfiguration", om.valueToTree(this.getHealthCheckConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceConfiguration() != null) {
                data.set("instanceConfiguration", om.valueToTree(this.getInstanceConfiguration()));
            }
            if (this.getNetworkConfiguration() != null) {
                data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
            }
            if (this.getObservabilityConfiguration() != null) {
                data.set("observabilityConfiguration", om.valueToTree(this.getObservabilityConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceConfig.Jsii$Proxy that = (ApprunnerServiceConfig.Jsii$Proxy) o;

            if (!serviceName.equals(that.serviceName)) return false;
            if (!sourceConfiguration.equals(that.sourceConfiguration)) return false;
            if (this.autoScalingConfigurationArn != null ? !this.autoScalingConfigurationArn.equals(that.autoScalingConfigurationArn) : that.autoScalingConfigurationArn != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.healthCheckConfiguration != null ? !this.healthCheckConfiguration.equals(that.healthCheckConfiguration) : that.healthCheckConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceConfiguration != null ? !this.instanceConfiguration.equals(that.instanceConfiguration) : that.instanceConfiguration != null) return false;
            if (this.networkConfiguration != null ? !this.networkConfiguration.equals(that.networkConfiguration) : that.networkConfiguration != null) return false;
            if (this.observabilityConfiguration != null ? !this.observabilityConfiguration.equals(that.observabilityConfiguration) : that.observabilityConfiguration != null) return false;
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
            int result = this.serviceName.hashCode();
            result = 31 * result + (this.sourceConfiguration.hashCode());
            result = 31 * result + (this.autoScalingConfigurationArn != null ? this.autoScalingConfigurationArn.hashCode() : 0);
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.healthCheckConfiguration != null ? this.healthCheckConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceConfiguration != null ? this.instanceConfiguration.hashCode() : 0);
            result = 31 * result + (this.networkConfiguration != null ? this.networkConfiguration.hashCode() : 0);
            result = 31 * result + (this.observabilityConfiguration != null ? this.observabilityConfiguration.hashCode() : 0);
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
