package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeEnrichmentParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeEnrichmentParameters.Jsii$Proxy.class)
public interface PipesPipeEnrichmentParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * http_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters getHttpParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputTemplate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeEnrichmentParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeEnrichmentParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeEnrichmentParameters> {
        imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters httpParameters;
        java.lang.String inputTemplate;

        /**
         * Sets the value of {@link PipesPipeEnrichmentParameters#getHttpParameters}
         * @param httpParameters http_parameters block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
         * @return {@code this}
         */
        public Builder httpParameters(imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters httpParameters) {
            this.httpParameters = httpParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeEnrichmentParameters#getInputTemplate}
         * @param inputTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
         * @return {@code this}
         */
        public Builder inputTemplate(java.lang.String inputTemplate) {
            this.inputTemplate = inputTemplate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeEnrichmentParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeEnrichmentParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeEnrichmentParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeEnrichmentParameters {
        private final imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters httpParameters;
        private final java.lang.String inputTemplate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpParameters = software.amazon.jsii.Kernel.get(this, "httpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters.class));
            this.inputTemplate = software.amazon.jsii.Kernel.get(this, "inputTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpParameters = builder.httpParameters;
            this.inputTemplate = builder.inputTemplate;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeEnrichmentParametersHttpParameters getHttpParameters() {
            return this.httpParameters;
        }

        @Override
        public final java.lang.String getInputTemplate() {
            return this.inputTemplate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHttpParameters() != null) {
                data.set("httpParameters", om.valueToTree(this.getHttpParameters()));
            }
            if (this.getInputTemplate() != null) {
                data.set("inputTemplate", om.valueToTree(this.getInputTemplate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeEnrichmentParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeEnrichmentParameters.Jsii$Proxy that = (PipesPipeEnrichmentParameters.Jsii$Proxy) o;

            if (this.httpParameters != null ? !this.httpParameters.equals(that.httpParameters) : that.httpParameters != null) return false;
            return this.inputTemplate != null ? this.inputTemplate.equals(that.inputTemplate) : that.inputTemplate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpParameters != null ? this.httpParameters.hashCode() : 0;
            result = 31 * result + (this.inputTemplate != null ? this.inputTemplate.hashCode() : 0);
            return result;
        }
    }
}
