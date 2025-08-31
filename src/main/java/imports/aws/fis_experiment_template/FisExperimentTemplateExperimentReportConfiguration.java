package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfiguration")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateExperimentReportConfiguration.Jsii$Proxy.class)
public interface FisExperimentTemplateExperimentReportConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * data_sources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#data_sources FisExperimentTemplate#data_sources}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources getDataSources() {
        return null;
    }

    /**
     * outputs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#outputs FisExperimentTemplate#outputs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs getOutputs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#post_experiment_duration FisExperimentTemplate#post_experiment_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostExperimentDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#pre_experiment_duration FisExperimentTemplate#pre_experiment_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreExperimentDuration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateExperimentReportConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateExperimentReportConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateExperimentReportConfiguration> {
        imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources dataSources;
        imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs outputs;
        java.lang.String postExperimentDuration;
        java.lang.String preExperimentDuration;

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfiguration#getDataSources}
         * @param dataSources data_sources block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#data_sources FisExperimentTemplate#data_sources}
         * @return {@code this}
         */
        public Builder dataSources(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources dataSources) {
            this.dataSources = dataSources;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfiguration#getOutputs}
         * @param outputs outputs block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#outputs FisExperimentTemplate#outputs}
         * @return {@code this}
         */
        public Builder outputs(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs outputs) {
            this.outputs = outputs;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfiguration#getPostExperimentDuration}
         * @param postExperimentDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#post_experiment_duration FisExperimentTemplate#post_experiment_duration}.
         * @return {@code this}
         */
        public Builder postExperimentDuration(java.lang.String postExperimentDuration) {
            this.postExperimentDuration = postExperimentDuration;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfiguration#getPreExperimentDuration}
         * @param preExperimentDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#pre_experiment_duration FisExperimentTemplate#pre_experiment_duration}.
         * @return {@code this}
         */
        public Builder preExperimentDuration(java.lang.String preExperimentDuration) {
            this.preExperimentDuration = preExperimentDuration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateExperimentReportConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateExperimentReportConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateExperimentReportConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateExperimentReportConfiguration {
        private final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources dataSources;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs outputs;
        private final java.lang.String postExperimentDuration;
        private final java.lang.String preExperimentDuration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSources = software.amazon.jsii.Kernel.get(this, "dataSources", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources.class));
            this.outputs = software.amazon.jsii.Kernel.get(this, "outputs", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs.class));
            this.postExperimentDuration = software.amazon.jsii.Kernel.get(this, "postExperimentDuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preExperimentDuration = software.amazon.jsii.Kernel.get(this, "preExperimentDuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSources = builder.dataSources;
            this.outputs = builder.outputs;
            this.postExperimentDuration = builder.postExperimentDuration;
            this.preExperimentDuration = builder.preExperimentDuration;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSources getDataSources() {
            return this.dataSources;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationOutputs getOutputs() {
            return this.outputs;
        }

        @Override
        public final java.lang.String getPostExperimentDuration() {
            return this.postExperimentDuration;
        }

        @Override
        public final java.lang.String getPreExperimentDuration() {
            return this.preExperimentDuration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataSources() != null) {
                data.set("dataSources", om.valueToTree(this.getDataSources()));
            }
            if (this.getOutputs() != null) {
                data.set("outputs", om.valueToTree(this.getOutputs()));
            }
            if (this.getPostExperimentDuration() != null) {
                data.set("postExperimentDuration", om.valueToTree(this.getPostExperimentDuration()));
            }
            if (this.getPreExperimentDuration() != null) {
                data.set("preExperimentDuration", om.valueToTree(this.getPreExperimentDuration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateExperimentReportConfiguration.Jsii$Proxy that = (FisExperimentTemplateExperimentReportConfiguration.Jsii$Proxy) o;

            if (this.dataSources != null ? !this.dataSources.equals(that.dataSources) : that.dataSources != null) return false;
            if (this.outputs != null ? !this.outputs.equals(that.outputs) : that.outputs != null) return false;
            if (this.postExperimentDuration != null ? !this.postExperimentDuration.equals(that.postExperimentDuration) : that.postExperimentDuration != null) return false;
            return this.preExperimentDuration != null ? this.preExperimentDuration.equals(that.preExperimentDuration) : that.preExperimentDuration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataSources != null ? this.dataSources.hashCode() : 0;
            result = 31 * result + (this.outputs != null ? this.outputs.hashCode() : 0);
            result = 31 * result + (this.postExperimentDuration != null ? this.postExperimentDuration.hashCode() : 0);
            result = 31 * result + (this.preExperimentDuration != null ? this.preExperimentDuration.hashCode() : 0);
            return result;
        }
    }
}
