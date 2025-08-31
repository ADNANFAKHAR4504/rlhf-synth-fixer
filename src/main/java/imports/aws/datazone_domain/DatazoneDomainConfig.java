package imports.aws.datazone_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneDomain.DatazoneDomainConfig")
@software.amazon.jsii.Jsii.Proxy(DatazoneDomainConfig.Jsii$Proxy.class)
public interface DatazoneDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#domain_execution_role DatazoneDomain#domain_execution_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainExecutionRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#name DatazoneDomain#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#description DatazoneDomain#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#kms_key_identifier DatazoneDomain#kms_key_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdentifier() {
        return null;
    }

    /**
     * single_sign_on block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#single_sign_on DatazoneDomain#single_sign_on}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSingleSignOn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#skip_deletion_check DatazoneDomain#skip_deletion_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipDeletionCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#tags DatazoneDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#timeouts DatazoneDomain#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datazone_domain.DatazoneDomainTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneDomainConfig> {
        java.lang.String domainExecutionRole;
        java.lang.String name;
        java.lang.String description;
        java.lang.String kmsKeyIdentifier;
        java.lang.Object singleSignOn;
        java.lang.Object skipDeletionCheck;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.datazone_domain.DatazoneDomainTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatazoneDomainConfig#getDomainExecutionRole}
         * @param domainExecutionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#domain_execution_role DatazoneDomain#domain_execution_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainExecutionRole(java.lang.String domainExecutionRole) {
            this.domainExecutionRole = domainExecutionRole;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#name DatazoneDomain#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#description DatazoneDomain#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getKmsKeyIdentifier}
         * @param kmsKeyIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#kms_key_identifier DatazoneDomain#kms_key_identifier}.
         * @return {@code this}
         */
        public Builder kmsKeyIdentifier(java.lang.String kmsKeyIdentifier) {
            this.kmsKeyIdentifier = kmsKeyIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getSingleSignOn}
         * @param singleSignOn single_sign_on block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#single_sign_on DatazoneDomain#single_sign_on}
         * @return {@code this}
         */
        public Builder singleSignOn(com.hashicorp.cdktf.IResolvable singleSignOn) {
            this.singleSignOn = singleSignOn;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getSingleSignOn}
         * @param singleSignOn single_sign_on block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#single_sign_on DatazoneDomain#single_sign_on}
         * @return {@code this}
         */
        public Builder singleSignOn(java.util.List<? extends imports.aws.datazone_domain.DatazoneDomainSingleSignOn> singleSignOn) {
            this.singleSignOn = singleSignOn;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getSkipDeletionCheck}
         * @param skipDeletionCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#skip_deletion_check DatazoneDomain#skip_deletion_check}.
         * @return {@code this}
         */
        public Builder skipDeletionCheck(java.lang.Boolean skipDeletionCheck) {
            this.skipDeletionCheck = skipDeletionCheck;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getSkipDeletionCheck}
         * @param skipDeletionCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#skip_deletion_check DatazoneDomain#skip_deletion_check}.
         * @return {@code this}
         */
        public Builder skipDeletionCheck(com.hashicorp.cdktf.IResolvable skipDeletionCheck) {
            this.skipDeletionCheck = skipDeletionCheck;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#tags DatazoneDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#timeouts DatazoneDomain#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.datazone_domain.DatazoneDomainTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getDependsOn}
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
         * Sets the value of {@link DatazoneDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainConfig#getProvisioners}
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
         * @return a new instance of {@link DatazoneDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneDomainConfig {
        private final java.lang.String domainExecutionRole;
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.String kmsKeyIdentifier;
        private final java.lang.Object singleSignOn;
        private final java.lang.Object skipDeletionCheck;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.datazone_domain.DatazoneDomainTimeouts timeouts;
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
            this.domainExecutionRole = software.amazon.jsii.Kernel.get(this, "domainExecutionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyIdentifier = software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.singleSignOn = software.amazon.jsii.Kernel.get(this, "singleSignOn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.skipDeletionCheck = software.amazon.jsii.Kernel.get(this, "skipDeletionCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_domain.DatazoneDomainTimeouts.class));
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
            this.domainExecutionRole = java.util.Objects.requireNonNull(builder.domainExecutionRole, "domainExecutionRole is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.kmsKeyIdentifier = builder.kmsKeyIdentifier;
            this.singleSignOn = builder.singleSignOn;
            this.skipDeletionCheck = builder.skipDeletionCheck;
            this.tags = builder.tags;
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
        public final java.lang.String getDomainExecutionRole() {
            return this.domainExecutionRole;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getKmsKeyIdentifier() {
            return this.kmsKeyIdentifier;
        }

        @Override
        public final java.lang.Object getSingleSignOn() {
            return this.singleSignOn;
        }

        @Override
        public final java.lang.Object getSkipDeletionCheck() {
            return this.skipDeletionCheck;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.datazone_domain.DatazoneDomainTimeouts getTimeouts() {
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

            data.set("domainExecutionRole", om.valueToTree(this.getDomainExecutionRole()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getKmsKeyIdentifier() != null) {
                data.set("kmsKeyIdentifier", om.valueToTree(this.getKmsKeyIdentifier()));
            }
            if (this.getSingleSignOn() != null) {
                data.set("singleSignOn", om.valueToTree(this.getSingleSignOn()));
            }
            if (this.getSkipDeletionCheck() != null) {
                data.set("skipDeletionCheck", om.valueToTree(this.getSkipDeletionCheck()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.datazoneDomain.DatazoneDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneDomainConfig.Jsii$Proxy that = (DatazoneDomainConfig.Jsii$Proxy) o;

            if (!domainExecutionRole.equals(that.domainExecutionRole)) return false;
            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.kmsKeyIdentifier != null ? !this.kmsKeyIdentifier.equals(that.kmsKeyIdentifier) : that.kmsKeyIdentifier != null) return false;
            if (this.singleSignOn != null ? !this.singleSignOn.equals(that.singleSignOn) : that.singleSignOn != null) return false;
            if (this.skipDeletionCheck != null ? !this.skipDeletionCheck.equals(that.skipDeletionCheck) : that.skipDeletionCheck != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.domainExecutionRole.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.kmsKeyIdentifier != null ? this.kmsKeyIdentifier.hashCode() : 0);
            result = 31 * result + (this.singleSignOn != null ? this.singleSignOn.hashCode() : 0);
            result = 31 * result + (this.skipDeletionCheck != null ? this.skipDeletionCheck.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
