package imports.aws.codecatalyst_dev_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentConfig")
@software.amazon.jsii.Jsii.Proxy(CodecatalystDevEnvironmentConfig.Jsii$Proxy.class)
public interface CodecatalystDevEnvironmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * ides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#ides CodecatalystDevEnvironment#ides}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes getIdes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#instance_type CodecatalystDevEnvironment#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * persistent_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#persistent_storage CodecatalystDevEnvironment#persistent_storage}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage getPersistentStorage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#project_name CodecatalystDevEnvironment#project_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProjectName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#space_name CodecatalystDevEnvironment#space_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSpaceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#alias CodecatalystDevEnvironment#alias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlias() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#id CodecatalystDevEnvironment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#inactivity_timeout_minutes CodecatalystDevEnvironment#inactivity_timeout_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInactivityTimeoutMinutes() {
        return null;
    }

    /**
     * repositories block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repositories CodecatalystDevEnvironment#repositories}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRepositories() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#timeouts CodecatalystDevEnvironment#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodecatalystDevEnvironmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodecatalystDevEnvironmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodecatalystDevEnvironmentConfig> {
        imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes ides;
        java.lang.String instanceType;
        imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage persistentStorage;
        java.lang.String projectName;
        java.lang.String spaceName;
        java.lang.String alias;
        java.lang.String id;
        java.lang.Number inactivityTimeoutMinutes;
        java.lang.Object repositories;
        imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getIdes}
         * @param ides ides block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#ides CodecatalystDevEnvironment#ides}
         * @return {@code this}
         */
        public Builder ides(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes ides) {
            this.ides = ides;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#instance_type CodecatalystDevEnvironment#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getPersistentStorage}
         * @param persistentStorage persistent_storage block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#persistent_storage CodecatalystDevEnvironment#persistent_storage}
         * @return {@code this}
         */
        public Builder persistentStorage(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage persistentStorage) {
            this.persistentStorage = persistentStorage;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getProjectName}
         * @param projectName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#project_name CodecatalystDevEnvironment#project_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectName(java.lang.String projectName) {
            this.projectName = projectName;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getSpaceName}
         * @param spaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#space_name CodecatalystDevEnvironment#space_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder spaceName(java.lang.String spaceName) {
            this.spaceName = spaceName;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getAlias}
         * @param alias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#alias CodecatalystDevEnvironment#alias}.
         * @return {@code this}
         */
        public Builder alias(java.lang.String alias) {
            this.alias = alias;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#id CodecatalystDevEnvironment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getInactivityTimeoutMinutes}
         * @param inactivityTimeoutMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#inactivity_timeout_minutes CodecatalystDevEnvironment#inactivity_timeout_minutes}.
         * @return {@code this}
         */
        public Builder inactivityTimeoutMinutes(java.lang.Number inactivityTimeoutMinutes) {
            this.inactivityTimeoutMinutes = inactivityTimeoutMinutes;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getRepositories}
         * @param repositories repositories block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repositories CodecatalystDevEnvironment#repositories}
         * @return {@code this}
         */
        public Builder repositories(com.hashicorp.cdktf.IResolvable repositories) {
            this.repositories = repositories;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getRepositories}
         * @param repositories repositories block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repositories CodecatalystDevEnvironment#repositories}
         * @return {@code this}
         */
        public Builder repositories(java.util.List<? extends imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories> repositories) {
            this.repositories = repositories;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#timeouts CodecatalystDevEnvironment#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getDependsOn}
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
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentConfig#getProvisioners}
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
         * @return a new instance of {@link CodecatalystDevEnvironmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodecatalystDevEnvironmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodecatalystDevEnvironmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodecatalystDevEnvironmentConfig {
        private final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes ides;
        private final java.lang.String instanceType;
        private final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage persistentStorage;
        private final java.lang.String projectName;
        private final java.lang.String spaceName;
        private final java.lang.String alias;
        private final java.lang.String id;
        private final java.lang.Number inactivityTimeoutMinutes;
        private final java.lang.Object repositories;
        private final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts timeouts;
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
            this.ides = software.amazon.jsii.Kernel.get(this, "ides", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.persistentStorage = software.amazon.jsii.Kernel.get(this, "persistentStorage", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage.class));
            this.projectName = software.amazon.jsii.Kernel.get(this, "projectName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.spaceName = software.amazon.jsii.Kernel.get(this, "spaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alias = software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inactivityTimeoutMinutes = software.amazon.jsii.Kernel.get(this, "inactivityTimeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.repositories = software.amazon.jsii.Kernel.get(this, "repositories", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts.class));
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
            this.ides = java.util.Objects.requireNonNull(builder.ides, "ides is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.persistentStorage = java.util.Objects.requireNonNull(builder.persistentStorage, "persistentStorage is required");
            this.projectName = java.util.Objects.requireNonNull(builder.projectName, "projectName is required");
            this.spaceName = java.util.Objects.requireNonNull(builder.spaceName, "spaceName is required");
            this.alias = builder.alias;
            this.id = builder.id;
            this.inactivityTimeoutMinutes = builder.inactivityTimeoutMinutes;
            this.repositories = builder.repositories;
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
        public final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes getIdes() {
            return this.ides;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage getPersistentStorage() {
            return this.persistentStorage;
        }

        @Override
        public final java.lang.String getProjectName() {
            return this.projectName;
        }

        @Override
        public final java.lang.String getSpaceName() {
            return this.spaceName;
        }

        @Override
        public final java.lang.String getAlias() {
            return this.alias;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getInactivityTimeoutMinutes() {
            return this.inactivityTimeoutMinutes;
        }

        @Override
        public final java.lang.Object getRepositories() {
            return this.repositories;
        }

        @Override
        public final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts getTimeouts() {
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

            data.set("ides", om.valueToTree(this.getIdes()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            data.set("persistentStorage", om.valueToTree(this.getPersistentStorage()));
            data.set("projectName", om.valueToTree(this.getProjectName()));
            data.set("spaceName", om.valueToTree(this.getSpaceName()));
            if (this.getAlias() != null) {
                data.set("alias", om.valueToTree(this.getAlias()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInactivityTimeoutMinutes() != null) {
                data.set("inactivityTimeoutMinutes", om.valueToTree(this.getInactivityTimeoutMinutes()));
            }
            if (this.getRepositories() != null) {
                data.set("repositories", om.valueToTree(this.getRepositories()));
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
            struct.set("fqn", om.valueToTree("aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodecatalystDevEnvironmentConfig.Jsii$Proxy that = (CodecatalystDevEnvironmentConfig.Jsii$Proxy) o;

            if (!ides.equals(that.ides)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (!persistentStorage.equals(that.persistentStorage)) return false;
            if (!projectName.equals(that.projectName)) return false;
            if (!spaceName.equals(that.spaceName)) return false;
            if (this.alias != null ? !this.alias.equals(that.alias) : that.alias != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inactivityTimeoutMinutes != null ? !this.inactivityTimeoutMinutes.equals(that.inactivityTimeoutMinutes) : that.inactivityTimeoutMinutes != null) return false;
            if (this.repositories != null ? !this.repositories.equals(that.repositories) : that.repositories != null) return false;
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
            int result = this.ides.hashCode();
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.persistentStorage.hashCode());
            result = 31 * result + (this.projectName.hashCode());
            result = 31 * result + (this.spaceName.hashCode());
            result = 31 * result + (this.alias != null ? this.alias.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inactivityTimeoutMinutes != null ? this.inactivityTimeoutMinutes.hashCode() : 0);
            result = 31 * result + (this.repositories != null ? this.repositories.hashCode() : 0);
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
