package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#classification EmrcontainersJobTemplate#classification}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClassification();

    /**
     * configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#configurations EmrcontainersJobTemplate#configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#properties EmrcontainersJobTemplate#properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration> {
        java.lang.String classification;
        java.lang.Object configurations;
        java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration#getClassification}
         * @param classification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#classification EmrcontainersJobTemplate#classification}. This parameter is required.
         * @return {@code this}
         */
        public Builder classification(java.lang.String classification) {
            this.classification = classification;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration#getConfigurations}
         * @param configurations configurations block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#configurations EmrcontainersJobTemplate#configurations}
         * @return {@code this}
         */
        public Builder configurations(com.hashicorp.cdktf.IResolvable configurations) {
            this.configurations = configurations;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration#getConfigurations}
         * @param configurations configurations block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#configurations EmrcontainersJobTemplate#configurations}
         * @return {@code this}
         */
        public Builder configurations(java.util.List<? extends imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfigurationConfigurations> configurations) {
            this.configurations = configurations;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration#getProperties}
         * @param properties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#properties EmrcontainersJobTemplate#properties}.
         * @return {@code this}
         */
        public Builder properties(java.util.Map<java.lang.String, java.lang.String> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration {
        private final java.lang.String classification;
        private final java.lang.Object configurations;
        private final java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.classification = software.amazon.jsii.Kernel.get(this, "classification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurations = software.amazon.jsii.Kernel.get(this, "configurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.properties = software.amazon.jsii.Kernel.get(this, "properties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.classification = java.util.Objects.requireNonNull(builder.classification, "classification is required");
            this.configurations = builder.configurations;
            this.properties = builder.properties;
        }

        @Override
        public final java.lang.String getClassification() {
            return this.classification;
        }

        @Override
        public final java.lang.Object getConfigurations() {
            return this.configurations;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProperties() {
            return this.properties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("classification", om.valueToTree(this.getClassification()));
            if (this.getConfigurations() != null) {
                data.set("configurations", om.valueToTree(this.getConfigurations()));
            }
            if (this.getProperties() != null) {
                data.set("properties", om.valueToTree(this.getProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration.Jsii$Proxy) o;

            if (!classification.equals(that.classification)) return false;
            if (this.configurations != null ? !this.configurations.equals(that.configurations) : that.configurations != null) return false;
            return this.properties != null ? this.properties.equals(that.properties) : that.properties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.classification.hashCode();
            result = 31 * result + (this.configurations != null ? this.configurations.hashCode() : 0);
            result = 31 * result + (this.properties != null ? this.properties.hashCode() : 0);
            return result;
        }
    }
}
