package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildFleetConfig.Jsii$Proxy.class)
public interface CodebuildFleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#base_capacity CodebuildFleet#base_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBaseCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_type CodebuildFleet#compute_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComputeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#environment_type CodebuildFleet#environment_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#name CodebuildFleet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * compute_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_configuration CodebuildFleet#compute_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration getComputeConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#fleet_service_role CodebuildFleet#fleet_service_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetServiceRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#image_id CodebuildFleet#image_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#overflow_behavior CodebuildFleet#overflow_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOverflowBehavior() {
        return null;
    }

    /**
     * scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#scaling_configuration CodebuildFleet#scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration getScalingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags CodebuildFleet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags_all CodebuildFleet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_config CodebuildFleet#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildFleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildFleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildFleetConfig> {
        java.lang.Number baseCapacity;
        java.lang.String computeType;
        java.lang.String environmentType;
        java.lang.String name;
        imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration computeConfiguration;
        java.lang.String fleetServiceRole;
        java.lang.String imageId;
        java.lang.String overflowBehavior;
        imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration scalingConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodebuildFleetConfig#getBaseCapacity}
         * @param baseCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#base_capacity CodebuildFleet#base_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder baseCapacity(java.lang.Number baseCapacity) {
            this.baseCapacity = baseCapacity;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getComputeType}
         * @param computeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_type CodebuildFleet#compute_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder computeType(java.lang.String computeType) {
            this.computeType = computeType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getEnvironmentType}
         * @param environmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#environment_type CodebuildFleet#environment_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder environmentType(java.lang.String environmentType) {
            this.environmentType = environmentType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#name CodebuildFleet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getComputeConfiguration}
         * @param computeConfiguration compute_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_configuration CodebuildFleet#compute_configuration}
         * @return {@code this}
         */
        public Builder computeConfiguration(imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration computeConfiguration) {
            this.computeConfiguration = computeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getFleetServiceRole}
         * @param fleetServiceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#fleet_service_role CodebuildFleet#fleet_service_role}.
         * @return {@code this}
         */
        public Builder fleetServiceRole(java.lang.String fleetServiceRole) {
            this.fleetServiceRole = fleetServiceRole;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getImageId}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#image_id CodebuildFleet#image_id}.
         * @return {@code this}
         */
        public Builder imageId(java.lang.String imageId) {
            this.imageId = imageId;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getOverflowBehavior}
         * @param overflowBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#overflow_behavior CodebuildFleet#overflow_behavior}.
         * @return {@code this}
         */
        public Builder overflowBehavior(java.lang.String overflowBehavior) {
            this.overflowBehavior = overflowBehavior;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getScalingConfiguration}
         * @param scalingConfiguration scaling_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#scaling_configuration CodebuildFleet#scaling_configuration}
         * @return {@code this}
         */
        public Builder scalingConfiguration(imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration scalingConfiguration) {
            this.scalingConfiguration = scalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags CodebuildFleet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags_all CodebuildFleet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_config CodebuildFleet#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(com.hashicorp.cdktf.IResolvable vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_config CodebuildFleet#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(java.util.List<? extends imports.aws.codebuild_fleet.CodebuildFleetVpcConfig> vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getDependsOn}
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
         * Sets the value of {@link CodebuildFleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetConfig#getProvisioners}
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
         * @return a new instance of {@link CodebuildFleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildFleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildFleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildFleetConfig {
        private final java.lang.Number baseCapacity;
        private final java.lang.String computeType;
        private final java.lang.String environmentType;
        private final java.lang.String name;
        private final imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration computeConfiguration;
        private final java.lang.String fleetServiceRole;
        private final java.lang.String imageId;
        private final java.lang.String overflowBehavior;
        private final imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration scalingConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object vpcConfig;
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
            this.baseCapacity = software.amazon.jsii.Kernel.get(this, "baseCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.computeType = software.amazon.jsii.Kernel.get(this, "computeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environmentType = software.amazon.jsii.Kernel.get(this, "environmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computeConfiguration = software.amazon.jsii.Kernel.get(this, "computeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration.class));
            this.fleetServiceRole = software.amazon.jsii.Kernel.get(this, "fleetServiceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageId = software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overflowBehavior = software.amazon.jsii.Kernel.get(this, "overflowBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalingConfiguration = software.amazon.jsii.Kernel.get(this, "scalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.baseCapacity = java.util.Objects.requireNonNull(builder.baseCapacity, "baseCapacity is required");
            this.computeType = java.util.Objects.requireNonNull(builder.computeType, "computeType is required");
            this.environmentType = java.util.Objects.requireNonNull(builder.environmentType, "environmentType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.computeConfiguration = builder.computeConfiguration;
            this.fleetServiceRole = builder.fleetServiceRole;
            this.imageId = builder.imageId;
            this.overflowBehavior = builder.overflowBehavior;
            this.scalingConfiguration = builder.scalingConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.vpcConfig = builder.vpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getBaseCapacity() {
            return this.baseCapacity;
        }

        @Override
        public final java.lang.String getComputeType() {
            return this.computeType;
        }

        @Override
        public final java.lang.String getEnvironmentType() {
            return this.environmentType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration getComputeConfiguration() {
            return this.computeConfiguration;
        }

        @Override
        public final java.lang.String getFleetServiceRole() {
            return this.fleetServiceRole;
        }

        @Override
        public final java.lang.String getImageId() {
            return this.imageId;
        }

        @Override
        public final java.lang.String getOverflowBehavior() {
            return this.overflowBehavior;
        }

        @Override
        public final imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration getScalingConfiguration() {
            return this.scalingConfiguration;
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
        public final java.lang.Object getVpcConfig() {
            return this.vpcConfig;
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

            data.set("baseCapacity", om.valueToTree(this.getBaseCapacity()));
            data.set("computeType", om.valueToTree(this.getComputeType()));
            data.set("environmentType", om.valueToTree(this.getEnvironmentType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getComputeConfiguration() != null) {
                data.set("computeConfiguration", om.valueToTree(this.getComputeConfiguration()));
            }
            if (this.getFleetServiceRole() != null) {
                data.set("fleetServiceRole", om.valueToTree(this.getFleetServiceRole()));
            }
            if (this.getImageId() != null) {
                data.set("imageId", om.valueToTree(this.getImageId()));
            }
            if (this.getOverflowBehavior() != null) {
                data.set("overflowBehavior", om.valueToTree(this.getOverflowBehavior()));
            }
            if (this.getScalingConfiguration() != null) {
                data.set("scalingConfiguration", om.valueToTree(this.getScalingConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
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
            struct.set("fqn", om.valueToTree("aws.codebuildFleet.CodebuildFleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildFleetConfig.Jsii$Proxy that = (CodebuildFleetConfig.Jsii$Proxy) o;

            if (!baseCapacity.equals(that.baseCapacity)) return false;
            if (!computeType.equals(that.computeType)) return false;
            if (!environmentType.equals(that.environmentType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.computeConfiguration != null ? !this.computeConfiguration.equals(that.computeConfiguration) : that.computeConfiguration != null) return false;
            if (this.fleetServiceRole != null ? !this.fleetServiceRole.equals(that.fleetServiceRole) : that.fleetServiceRole != null) return false;
            if (this.imageId != null ? !this.imageId.equals(that.imageId) : that.imageId != null) return false;
            if (this.overflowBehavior != null ? !this.overflowBehavior.equals(that.overflowBehavior) : that.overflowBehavior != null) return false;
            if (this.scalingConfiguration != null ? !this.scalingConfiguration.equals(that.scalingConfiguration) : that.scalingConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
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
            int result = this.baseCapacity.hashCode();
            result = 31 * result + (this.computeType.hashCode());
            result = 31 * result + (this.environmentType.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.computeConfiguration != null ? this.computeConfiguration.hashCode() : 0);
            result = 31 * result + (this.fleetServiceRole != null ? this.fleetServiceRole.hashCode() : 0);
            result = 31 * result + (this.imageId != null ? this.imageId.hashCode() : 0);
            result = 31 * result + (this.overflowBehavior != null ? this.overflowBehavior.hashCode() : 0);
            result = 31 * result + (this.scalingConfiguration != null ? this.scalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
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
