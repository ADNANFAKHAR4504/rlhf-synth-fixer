package imports.aws.datazone_glossary_term;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.959Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneGlossaryTerm.DatazoneGlossaryTermConfig")
@software.amazon.jsii.Jsii.Proxy(DatazoneGlossaryTermConfig.Jsii$Proxy.class)
public interface DatazoneGlossaryTermConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#glossary_identifier DatazoneGlossaryTerm#glossary_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGlossaryIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#name DatazoneGlossaryTerm#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#domain_identifier DatazoneGlossaryTerm#domain_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#long_description DatazoneGlossaryTerm#long_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLongDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#short_description DatazoneGlossaryTerm#short_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getShortDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#status DatazoneGlossaryTerm#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * term_relations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#term_relations DatazoneGlossaryTerm#term_relations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTermRelations() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#timeouts DatazoneGlossaryTerm#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneGlossaryTermConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneGlossaryTermConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneGlossaryTermConfig> {
        java.lang.String glossaryIdentifier;
        java.lang.String name;
        java.lang.String domainIdentifier;
        java.lang.String longDescription;
        java.lang.String shortDescription;
        java.lang.String status;
        java.lang.Object termRelations;
        imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getGlossaryIdentifier}
         * @param glossaryIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#glossary_identifier DatazoneGlossaryTerm#glossary_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder glossaryIdentifier(java.lang.String glossaryIdentifier) {
            this.glossaryIdentifier = glossaryIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#name DatazoneGlossaryTerm#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getDomainIdentifier}
         * @param domainIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#domain_identifier DatazoneGlossaryTerm#domain_identifier}.
         * @return {@code this}
         */
        public Builder domainIdentifier(java.lang.String domainIdentifier) {
            this.domainIdentifier = domainIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getLongDescription}
         * @param longDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#long_description DatazoneGlossaryTerm#long_description}.
         * @return {@code this}
         */
        public Builder longDescription(java.lang.String longDescription) {
            this.longDescription = longDescription;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getShortDescription}
         * @param shortDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#short_description DatazoneGlossaryTerm#short_description}.
         * @return {@code this}
         */
        public Builder shortDescription(java.lang.String shortDescription) {
            this.shortDescription = shortDescription;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#status DatazoneGlossaryTerm#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getTermRelations}
         * @param termRelations term_relations block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#term_relations DatazoneGlossaryTerm#term_relations}
         * @return {@code this}
         */
        public Builder termRelations(com.hashicorp.cdktf.IResolvable termRelations) {
            this.termRelations = termRelations;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getTermRelations}
         * @param termRelations term_relations block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#term_relations DatazoneGlossaryTerm#term_relations}
         * @return {@code this}
         */
        public Builder termRelations(java.util.List<? extends imports.aws.datazone_glossary_term.DatazoneGlossaryTermTermRelations> termRelations) {
            this.termRelations = termRelations;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#timeouts DatazoneGlossaryTerm#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getDependsOn}
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
         * Sets the value of {@link DatazoneGlossaryTermConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermConfig#getProvisioners}
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
         * @return a new instance of {@link DatazoneGlossaryTermConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneGlossaryTermConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneGlossaryTermConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneGlossaryTermConfig {
        private final java.lang.String glossaryIdentifier;
        private final java.lang.String name;
        private final java.lang.String domainIdentifier;
        private final java.lang.String longDescription;
        private final java.lang.String shortDescription;
        private final java.lang.String status;
        private final java.lang.Object termRelations;
        private final imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts timeouts;
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
            this.glossaryIdentifier = software.amazon.jsii.Kernel.get(this, "glossaryIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainIdentifier = software.amazon.jsii.Kernel.get(this, "domainIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longDescription = software.amazon.jsii.Kernel.get(this, "longDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shortDescription = software.amazon.jsii.Kernel.get(this, "shortDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.termRelations = software.amazon.jsii.Kernel.get(this, "termRelations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts.class));
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
            this.glossaryIdentifier = java.util.Objects.requireNonNull(builder.glossaryIdentifier, "glossaryIdentifier is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.domainIdentifier = builder.domainIdentifier;
            this.longDescription = builder.longDescription;
            this.shortDescription = builder.shortDescription;
            this.status = builder.status;
            this.termRelations = builder.termRelations;
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
        public final java.lang.String getGlossaryIdentifier() {
            return this.glossaryIdentifier;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDomainIdentifier() {
            return this.domainIdentifier;
        }

        @Override
        public final java.lang.String getLongDescription() {
            return this.longDescription;
        }

        @Override
        public final java.lang.String getShortDescription() {
            return this.shortDescription;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.Object getTermRelations() {
            return this.termRelations;
        }

        @Override
        public final imports.aws.datazone_glossary_term.DatazoneGlossaryTermTimeouts getTimeouts() {
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

            data.set("glossaryIdentifier", om.valueToTree(this.getGlossaryIdentifier()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDomainIdentifier() != null) {
                data.set("domainIdentifier", om.valueToTree(this.getDomainIdentifier()));
            }
            if (this.getLongDescription() != null) {
                data.set("longDescription", om.valueToTree(this.getLongDescription()));
            }
            if (this.getShortDescription() != null) {
                data.set("shortDescription", om.valueToTree(this.getShortDescription()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTermRelations() != null) {
                data.set("termRelations", om.valueToTree(this.getTermRelations()));
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
            struct.set("fqn", om.valueToTree("aws.datazoneGlossaryTerm.DatazoneGlossaryTermConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneGlossaryTermConfig.Jsii$Proxy that = (DatazoneGlossaryTermConfig.Jsii$Proxy) o;

            if (!glossaryIdentifier.equals(that.glossaryIdentifier)) return false;
            if (!name.equals(that.name)) return false;
            if (this.domainIdentifier != null ? !this.domainIdentifier.equals(that.domainIdentifier) : that.domainIdentifier != null) return false;
            if (this.longDescription != null ? !this.longDescription.equals(that.longDescription) : that.longDescription != null) return false;
            if (this.shortDescription != null ? !this.shortDescription.equals(that.shortDescription) : that.shortDescription != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.termRelations != null ? !this.termRelations.equals(that.termRelations) : that.termRelations != null) return false;
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
            int result = this.glossaryIdentifier.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.domainIdentifier != null ? this.domainIdentifier.hashCode() : 0);
            result = 31 * result + (this.longDescription != null ? this.longDescription.hashCode() : 0);
            result = 31 * result + (this.shortDescription != null ? this.shortDescription.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.termRelations != null ? this.termRelations.hashCode() : 0);
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
