package imports.aws.appconfig_deployment_strategy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.984Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigDeploymentStrategy.AppconfigDeploymentStrategyConfig")
@software.amazon.jsii.Jsii.Proxy(AppconfigDeploymentStrategyConfig.Jsii$Proxy.class)
public interface AppconfigDeploymentStrategyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#deployment_duration_in_minutes AppconfigDeploymentStrategy#deployment_duration_in_minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDeploymentDurationInMinutes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#growth_factor AppconfigDeploymentStrategy#growth_factor}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getGrowthFactor();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#name AppconfigDeploymentStrategy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#replicate_to AppconfigDeploymentStrategy#replicate_to}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicateTo();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#description AppconfigDeploymentStrategy#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#final_bake_time_in_minutes AppconfigDeploymentStrategy#final_bake_time_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFinalBakeTimeInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#growth_type AppconfigDeploymentStrategy#growth_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGrowthType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#id AppconfigDeploymentStrategy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#tags AppconfigDeploymentStrategy#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#tags_all AppconfigDeploymentStrategy#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppconfigDeploymentStrategyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppconfigDeploymentStrategyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppconfigDeploymentStrategyConfig> {
        java.lang.Number deploymentDurationInMinutes;
        java.lang.Number growthFactor;
        java.lang.String name;
        java.lang.String replicateTo;
        java.lang.String description;
        java.lang.Number finalBakeTimeInMinutes;
        java.lang.String growthType;
        java.lang.String id;
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
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getDeploymentDurationInMinutes}
         * @param deploymentDurationInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#deployment_duration_in_minutes AppconfigDeploymentStrategy#deployment_duration_in_minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentDurationInMinutes(java.lang.Number deploymentDurationInMinutes) {
            this.deploymentDurationInMinutes = deploymentDurationInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getGrowthFactor}
         * @param growthFactor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#growth_factor AppconfigDeploymentStrategy#growth_factor}. This parameter is required.
         * @return {@code this}
         */
        public Builder growthFactor(java.lang.Number growthFactor) {
            this.growthFactor = growthFactor;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#name AppconfigDeploymentStrategy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getReplicateTo}
         * @param replicateTo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#replicate_to AppconfigDeploymentStrategy#replicate_to}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicateTo(java.lang.String replicateTo) {
            this.replicateTo = replicateTo;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#description AppconfigDeploymentStrategy#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getFinalBakeTimeInMinutes}
         * @param finalBakeTimeInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#final_bake_time_in_minutes AppconfigDeploymentStrategy#final_bake_time_in_minutes}.
         * @return {@code this}
         */
        public Builder finalBakeTimeInMinutes(java.lang.Number finalBakeTimeInMinutes) {
            this.finalBakeTimeInMinutes = finalBakeTimeInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getGrowthType}
         * @param growthType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#growth_type AppconfigDeploymentStrategy#growth_type}.
         * @return {@code this}
         */
        public Builder growthType(java.lang.String growthType) {
            this.growthType = growthType;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#id AppconfigDeploymentStrategy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#tags AppconfigDeploymentStrategy#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_deployment_strategy#tags_all AppconfigDeploymentStrategy#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getDependsOn}
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
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigDeploymentStrategyConfig#getProvisioners}
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
         * @return a new instance of {@link AppconfigDeploymentStrategyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppconfigDeploymentStrategyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppconfigDeploymentStrategyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppconfigDeploymentStrategyConfig {
        private final java.lang.Number deploymentDurationInMinutes;
        private final java.lang.Number growthFactor;
        private final java.lang.String name;
        private final java.lang.String replicateTo;
        private final java.lang.String description;
        private final java.lang.Number finalBakeTimeInMinutes;
        private final java.lang.String growthType;
        private final java.lang.String id;
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
            this.deploymentDurationInMinutes = software.amazon.jsii.Kernel.get(this, "deploymentDurationInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.growthFactor = software.amazon.jsii.Kernel.get(this, "growthFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicateTo = software.amazon.jsii.Kernel.get(this, "replicateTo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalBakeTimeInMinutes = software.amazon.jsii.Kernel.get(this, "finalBakeTimeInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.growthType = software.amazon.jsii.Kernel.get(this, "growthType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.deploymentDurationInMinutes = java.util.Objects.requireNonNull(builder.deploymentDurationInMinutes, "deploymentDurationInMinutes is required");
            this.growthFactor = java.util.Objects.requireNonNull(builder.growthFactor, "growthFactor is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.replicateTo = java.util.Objects.requireNonNull(builder.replicateTo, "replicateTo is required");
            this.description = builder.description;
            this.finalBakeTimeInMinutes = builder.finalBakeTimeInMinutes;
            this.growthType = builder.growthType;
            this.id = builder.id;
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
        public final java.lang.Number getDeploymentDurationInMinutes() {
            return this.deploymentDurationInMinutes;
        }

        @Override
        public final java.lang.Number getGrowthFactor() {
            return this.growthFactor;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getReplicateTo() {
            return this.replicateTo;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getFinalBakeTimeInMinutes() {
            return this.finalBakeTimeInMinutes;
        }

        @Override
        public final java.lang.String getGrowthType() {
            return this.growthType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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

            data.set("deploymentDurationInMinutes", om.valueToTree(this.getDeploymentDurationInMinutes()));
            data.set("growthFactor", om.valueToTree(this.getGrowthFactor()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("replicateTo", om.valueToTree(this.getReplicateTo()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFinalBakeTimeInMinutes() != null) {
                data.set("finalBakeTimeInMinutes", om.valueToTree(this.getFinalBakeTimeInMinutes()));
            }
            if (this.getGrowthType() != null) {
                data.set("growthType", om.valueToTree(this.getGrowthType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.appconfigDeploymentStrategy.AppconfigDeploymentStrategyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppconfigDeploymentStrategyConfig.Jsii$Proxy that = (AppconfigDeploymentStrategyConfig.Jsii$Proxy) o;

            if (!deploymentDurationInMinutes.equals(that.deploymentDurationInMinutes)) return false;
            if (!growthFactor.equals(that.growthFactor)) return false;
            if (!name.equals(that.name)) return false;
            if (!replicateTo.equals(that.replicateTo)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.finalBakeTimeInMinutes != null ? !this.finalBakeTimeInMinutes.equals(that.finalBakeTimeInMinutes) : that.finalBakeTimeInMinutes != null) return false;
            if (this.growthType != null ? !this.growthType.equals(that.growthType) : that.growthType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.deploymentDurationInMinutes.hashCode();
            result = 31 * result + (this.growthFactor.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.replicateTo.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.finalBakeTimeInMinutes != null ? this.finalBakeTimeInMinutes.hashCode() : 0);
            result = 31 * result + (this.growthType != null ? this.growthType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
