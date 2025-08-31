package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentConfig")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentConfig.Jsii$Proxy.class)
public interface BatchComputeEnvironmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name BatchComputeEnvironment#compute_environment_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComputeEnvironmentName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name_prefix BatchComputeEnvironment#compute_environment_name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComputeEnvironmentNamePrefix() {
        return null;
    }

    /**
     * compute_resources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_resources BatchComputeEnvironment#compute_resources}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources getComputeResources() {
        return null;
    }

    /**
     * eks_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#eks_configuration BatchComputeEnvironment#eks_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration getEksConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#id BatchComputeEnvironment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#service_role BatchComputeEnvironment#service_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#state BatchComputeEnvironment#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags_all BatchComputeEnvironment#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * update_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#update_policy BatchComputeEnvironment#update_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy getUpdatePolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentConfig> {
        java.lang.String type;
        java.lang.String computeEnvironmentName;
        java.lang.String computeEnvironmentNamePrefix;
        imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources computeResources;
        imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration eksConfiguration;
        java.lang.String id;
        java.lang.String serviceRole;
        java.lang.String state;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy updatePolicy;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getComputeEnvironmentName}
         * @param computeEnvironmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name BatchComputeEnvironment#compute_environment_name}.
         * @return {@code this}
         */
        public Builder computeEnvironmentName(java.lang.String computeEnvironmentName) {
            this.computeEnvironmentName = computeEnvironmentName;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getComputeEnvironmentNamePrefix}
         * @param computeEnvironmentNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name_prefix BatchComputeEnvironment#compute_environment_name_prefix}.
         * @return {@code this}
         */
        public Builder computeEnvironmentNamePrefix(java.lang.String computeEnvironmentNamePrefix) {
            this.computeEnvironmentNamePrefix = computeEnvironmentNamePrefix;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getComputeResources}
         * @param computeResources compute_resources block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_resources BatchComputeEnvironment#compute_resources}
         * @return {@code this}
         */
        public Builder computeResources(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources computeResources) {
            this.computeResources = computeResources;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getEksConfiguration}
         * @param eksConfiguration eks_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#eks_configuration BatchComputeEnvironment#eks_configuration}
         * @return {@code this}
         */
        public Builder eksConfiguration(imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration eksConfiguration) {
            this.eksConfiguration = eksConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#id BatchComputeEnvironment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#service_role BatchComputeEnvironment#service_role}.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#state BatchComputeEnvironment#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags_all BatchComputeEnvironment#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getUpdatePolicy}
         * @param updatePolicy update_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#update_policy BatchComputeEnvironment#update_policy}
         * @return {@code this}
         */
        public Builder updatePolicy(imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy updatePolicy) {
            this.updatePolicy = updatePolicy;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getDependsOn}
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
         * Sets the value of {@link BatchComputeEnvironmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentConfig#getProvisioners}
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
         * @return a new instance of {@link BatchComputeEnvironmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentConfig {
        private final java.lang.String type;
        private final java.lang.String computeEnvironmentName;
        private final java.lang.String computeEnvironmentNamePrefix;
        private final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources computeResources;
        private final imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration eksConfiguration;
        private final java.lang.String id;
        private final java.lang.String serviceRole;
        private final java.lang.String state;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy updatePolicy;
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
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computeEnvironmentName = software.amazon.jsii.Kernel.get(this, "computeEnvironmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computeEnvironmentNamePrefix = software.amazon.jsii.Kernel.get(this, "computeEnvironmentNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computeResources = software.amazon.jsii.Kernel.get(this, "computeResources", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources.class));
            this.eksConfiguration = software.amazon.jsii.Kernel.get(this, "eksConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.updatePolicy = software.amazon.jsii.Kernel.get(this, "updatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy.class));
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
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.computeEnvironmentName = builder.computeEnvironmentName;
            this.computeEnvironmentNamePrefix = builder.computeEnvironmentNamePrefix;
            this.computeResources = builder.computeResources;
            this.eksConfiguration = builder.eksConfiguration;
            this.id = builder.id;
            this.serviceRole = builder.serviceRole;
            this.state = builder.state;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.updatePolicy = builder.updatePolicy;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getComputeEnvironmentName() {
            return this.computeEnvironmentName;
        }

        @Override
        public final java.lang.String getComputeEnvironmentNamePrefix() {
            return this.computeEnvironmentNamePrefix;
        }

        @Override
        public final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources getComputeResources() {
            return this.computeResources;
        }

        @Override
        public final imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration getEksConfiguration() {
            return this.eksConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
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
        public final imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy getUpdatePolicy() {
            return this.updatePolicy;
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

            data.set("type", om.valueToTree(this.getType()));
            if (this.getComputeEnvironmentName() != null) {
                data.set("computeEnvironmentName", om.valueToTree(this.getComputeEnvironmentName()));
            }
            if (this.getComputeEnvironmentNamePrefix() != null) {
                data.set("computeEnvironmentNamePrefix", om.valueToTree(this.getComputeEnvironmentNamePrefix()));
            }
            if (this.getComputeResources() != null) {
                data.set("computeResources", om.valueToTree(this.getComputeResources()));
            }
            if (this.getEksConfiguration() != null) {
                data.set("eksConfiguration", om.valueToTree(this.getEksConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getServiceRole() != null) {
                data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUpdatePolicy() != null) {
                data.set("updatePolicy", om.valueToTree(this.getUpdatePolicy()));
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
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentConfig.Jsii$Proxy that = (BatchComputeEnvironmentConfig.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.computeEnvironmentName != null ? !this.computeEnvironmentName.equals(that.computeEnvironmentName) : that.computeEnvironmentName != null) return false;
            if (this.computeEnvironmentNamePrefix != null ? !this.computeEnvironmentNamePrefix.equals(that.computeEnvironmentNamePrefix) : that.computeEnvironmentNamePrefix != null) return false;
            if (this.computeResources != null ? !this.computeResources.equals(that.computeResources) : that.computeResources != null) return false;
            if (this.eksConfiguration != null ? !this.eksConfiguration.equals(that.eksConfiguration) : that.eksConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.serviceRole != null ? !this.serviceRole.equals(that.serviceRole) : that.serviceRole != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.updatePolicy != null ? !this.updatePolicy.equals(that.updatePolicy) : that.updatePolicy != null) return false;
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
            int result = this.type.hashCode();
            result = 31 * result + (this.computeEnvironmentName != null ? this.computeEnvironmentName.hashCode() : 0);
            result = 31 * result + (this.computeEnvironmentNamePrefix != null ? this.computeEnvironmentNamePrefix.hashCode() : 0);
            result = 31 * result + (this.computeResources != null ? this.computeResources.hashCode() : 0);
            result = 31 * result + (this.eksConfiguration != null ? this.eksConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.serviceRole != null ? this.serviceRole.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.updatePolicy != null ? this.updatePolicy.hashCode() : 0);
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
