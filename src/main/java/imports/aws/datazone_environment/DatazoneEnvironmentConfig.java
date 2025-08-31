package imports.aws.datazone_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.956Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneEnvironment.DatazoneEnvironmentConfig")
@software.amazon.jsii.Jsii.Proxy(DatazoneEnvironmentConfig.Jsii$Proxy.class)
public interface DatazoneEnvironmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#domain_identifier DatazoneEnvironment#domain_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#name DatazoneEnvironment#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#profile_identifier DatazoneEnvironment#profile_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProfileIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#project_identifier DatazoneEnvironment#project_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProjectIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_identifier DatazoneEnvironment#account_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_region DatazoneEnvironment#account_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#blueprint_identifier DatazoneEnvironment#blueprint_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBlueprintIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#description DatazoneEnvironment#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#glossary_terms DatazoneEnvironment#glossary_terms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlossaryTerms() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#timeouts DatazoneEnvironment#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datazone_environment.DatazoneEnvironmentTimeouts getTimeouts() {
        return null;
    }

    /**
     * user_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#user_parameters DatazoneEnvironment#user_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneEnvironmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneEnvironmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneEnvironmentConfig> {
        java.lang.String domainIdentifier;
        java.lang.String name;
        java.lang.String profileIdentifier;
        java.lang.String projectIdentifier;
        java.lang.String accountIdentifier;
        java.lang.String accountRegion;
        java.lang.String blueprintIdentifier;
        java.lang.String description;
        java.util.List<java.lang.String> glossaryTerms;
        imports.aws.datazone_environment.DatazoneEnvironmentTimeouts timeouts;
        java.lang.Object userParameters;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getDomainIdentifier}
         * @param domainIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#domain_identifier DatazoneEnvironment#domain_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainIdentifier(java.lang.String domainIdentifier) {
            this.domainIdentifier = domainIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#name DatazoneEnvironment#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getProfileIdentifier}
         * @param profileIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#profile_identifier DatazoneEnvironment#profile_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder profileIdentifier(java.lang.String profileIdentifier) {
            this.profileIdentifier = profileIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getProjectIdentifier}
         * @param projectIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#project_identifier DatazoneEnvironment#project_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectIdentifier(java.lang.String projectIdentifier) {
            this.projectIdentifier = projectIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getAccountIdentifier}
         * @param accountIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_identifier DatazoneEnvironment#account_identifier}.
         * @return {@code this}
         */
        public Builder accountIdentifier(java.lang.String accountIdentifier) {
            this.accountIdentifier = accountIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getAccountRegion}
         * @param accountRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_region DatazoneEnvironment#account_region}.
         * @return {@code this}
         */
        public Builder accountRegion(java.lang.String accountRegion) {
            this.accountRegion = accountRegion;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getBlueprintIdentifier}
         * @param blueprintIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#blueprint_identifier DatazoneEnvironment#blueprint_identifier}.
         * @return {@code this}
         */
        public Builder blueprintIdentifier(java.lang.String blueprintIdentifier) {
            this.blueprintIdentifier = blueprintIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#description DatazoneEnvironment#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getGlossaryTerms}
         * @param glossaryTerms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#glossary_terms DatazoneEnvironment#glossary_terms}.
         * @return {@code this}
         */
        public Builder glossaryTerms(java.util.List<java.lang.String> glossaryTerms) {
            this.glossaryTerms = glossaryTerms;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#timeouts DatazoneEnvironment#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.datazone_environment.DatazoneEnvironmentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getUserParameters}
         * @param userParameters user_parameters block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#user_parameters DatazoneEnvironment#user_parameters}
         * @return {@code this}
         */
        public Builder userParameters(com.hashicorp.cdktf.IResolvable userParameters) {
            this.userParameters = userParameters;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getUserParameters}
         * @param userParameters user_parameters block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#user_parameters DatazoneEnvironment#user_parameters}
         * @return {@code this}
         */
        public Builder userParameters(java.util.List<? extends imports.aws.datazone_environment.DatazoneEnvironmentUserParameters> userParameters) {
            this.userParameters = userParameters;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getDependsOn}
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
         * Sets the value of {@link DatazoneEnvironmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentConfig#getProvisioners}
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
         * @return a new instance of {@link DatazoneEnvironmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneEnvironmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneEnvironmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneEnvironmentConfig {
        private final java.lang.String domainIdentifier;
        private final java.lang.String name;
        private final java.lang.String profileIdentifier;
        private final java.lang.String projectIdentifier;
        private final java.lang.String accountIdentifier;
        private final java.lang.String accountRegion;
        private final java.lang.String blueprintIdentifier;
        private final java.lang.String description;
        private final java.util.List<java.lang.String> glossaryTerms;
        private final imports.aws.datazone_environment.DatazoneEnvironmentTimeouts timeouts;
        private final java.lang.Object userParameters;
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
            this.domainIdentifier = software.amazon.jsii.Kernel.get(this, "domainIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.profileIdentifier = software.amazon.jsii.Kernel.get(this, "profileIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.projectIdentifier = software.amazon.jsii.Kernel.get(this, "projectIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountIdentifier = software.amazon.jsii.Kernel.get(this, "accountIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountRegion = software.amazon.jsii.Kernel.get(this, "accountRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blueprintIdentifier = software.amazon.jsii.Kernel.get(this, "blueprintIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.glossaryTerms = software.amazon.jsii.Kernel.get(this, "glossaryTerms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentTimeouts.class));
            this.userParameters = software.amazon.jsii.Kernel.get(this, "userParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.domainIdentifier = java.util.Objects.requireNonNull(builder.domainIdentifier, "domainIdentifier is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.profileIdentifier = java.util.Objects.requireNonNull(builder.profileIdentifier, "profileIdentifier is required");
            this.projectIdentifier = java.util.Objects.requireNonNull(builder.projectIdentifier, "projectIdentifier is required");
            this.accountIdentifier = builder.accountIdentifier;
            this.accountRegion = builder.accountRegion;
            this.blueprintIdentifier = builder.blueprintIdentifier;
            this.description = builder.description;
            this.glossaryTerms = builder.glossaryTerms;
            this.timeouts = builder.timeouts;
            this.userParameters = builder.userParameters;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainIdentifier() {
            return this.domainIdentifier;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getProfileIdentifier() {
            return this.profileIdentifier;
        }

        @Override
        public final java.lang.String getProjectIdentifier() {
            return this.projectIdentifier;
        }

        @Override
        public final java.lang.String getAccountIdentifier() {
            return this.accountIdentifier;
        }

        @Override
        public final java.lang.String getAccountRegion() {
            return this.accountRegion;
        }

        @Override
        public final java.lang.String getBlueprintIdentifier() {
            return this.blueprintIdentifier;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.util.List<java.lang.String> getGlossaryTerms() {
            return this.glossaryTerms;
        }

        @Override
        public final imports.aws.datazone_environment.DatazoneEnvironmentTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUserParameters() {
            return this.userParameters;
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

            data.set("domainIdentifier", om.valueToTree(this.getDomainIdentifier()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("profileIdentifier", om.valueToTree(this.getProfileIdentifier()));
            data.set("projectIdentifier", om.valueToTree(this.getProjectIdentifier()));
            if (this.getAccountIdentifier() != null) {
                data.set("accountIdentifier", om.valueToTree(this.getAccountIdentifier()));
            }
            if (this.getAccountRegion() != null) {
                data.set("accountRegion", om.valueToTree(this.getAccountRegion()));
            }
            if (this.getBlueprintIdentifier() != null) {
                data.set("blueprintIdentifier", om.valueToTree(this.getBlueprintIdentifier()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getGlossaryTerms() != null) {
                data.set("glossaryTerms", om.valueToTree(this.getGlossaryTerms()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserParameters() != null) {
                data.set("userParameters", om.valueToTree(this.getUserParameters()));
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
            struct.set("fqn", om.valueToTree("aws.datazoneEnvironment.DatazoneEnvironmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneEnvironmentConfig.Jsii$Proxy that = (DatazoneEnvironmentConfig.Jsii$Proxy) o;

            if (!domainIdentifier.equals(that.domainIdentifier)) return false;
            if (!name.equals(that.name)) return false;
            if (!profileIdentifier.equals(that.profileIdentifier)) return false;
            if (!projectIdentifier.equals(that.projectIdentifier)) return false;
            if (this.accountIdentifier != null ? !this.accountIdentifier.equals(that.accountIdentifier) : that.accountIdentifier != null) return false;
            if (this.accountRegion != null ? !this.accountRegion.equals(that.accountRegion) : that.accountRegion != null) return false;
            if (this.blueprintIdentifier != null ? !this.blueprintIdentifier.equals(that.blueprintIdentifier) : that.blueprintIdentifier != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.glossaryTerms != null ? !this.glossaryTerms.equals(that.glossaryTerms) : that.glossaryTerms != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userParameters != null ? !this.userParameters.equals(that.userParameters) : that.userParameters != null) return false;
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
            int result = this.domainIdentifier.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.profileIdentifier.hashCode());
            result = 31 * result + (this.projectIdentifier.hashCode());
            result = 31 * result + (this.accountIdentifier != null ? this.accountIdentifier.hashCode() : 0);
            result = 31 * result + (this.accountRegion != null ? this.accountRegion.hashCode() : 0);
            result = 31 * result + (this.blueprintIdentifier != null ? this.blueprintIdentifier.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.glossaryTerms != null ? this.glossaryTerms.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userParameters != null ? this.userParameters.hashCode() : 0);
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
