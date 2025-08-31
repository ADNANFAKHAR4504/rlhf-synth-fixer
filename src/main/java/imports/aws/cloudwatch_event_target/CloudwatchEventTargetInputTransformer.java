package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetInputTransformer")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetInputTransformer.Jsii$Proxy.class)
public interface CloudwatchEventTargetInputTransformer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_template CloudwatchEventTarget#input_template}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputTemplate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_paths CloudwatchEventTarget#input_paths}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getInputPaths() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetInputTransformer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetInputTransformer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetInputTransformer> {
        java.lang.String inputTemplate;
        java.util.Map<java.lang.String, java.lang.String> inputPaths;

        /**
         * Sets the value of {@link CloudwatchEventTargetInputTransformer#getInputTemplate}
         * @param inputTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_template CloudwatchEventTarget#input_template}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputTemplate(java.lang.String inputTemplate) {
            this.inputTemplate = inputTemplate;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetInputTransformer#getInputPaths}
         * @param inputPaths Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#input_paths CloudwatchEventTarget#input_paths}.
         * @return {@code this}
         */
        public Builder inputPaths(java.util.Map<java.lang.String, java.lang.String> inputPaths) {
            this.inputPaths = inputPaths;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetInputTransformer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetInputTransformer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetInputTransformer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetInputTransformer {
        private final java.lang.String inputTemplate;
        private final java.util.Map<java.lang.String, java.lang.String> inputPaths;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputTemplate = software.amazon.jsii.Kernel.get(this, "inputTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputPaths = software.amazon.jsii.Kernel.get(this, "inputPaths", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputTemplate = java.util.Objects.requireNonNull(builder.inputTemplate, "inputTemplate is required");
            this.inputPaths = builder.inputPaths;
        }

        @Override
        public final java.lang.String getInputTemplate() {
            return this.inputTemplate;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getInputPaths() {
            return this.inputPaths;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputTemplate", om.valueToTree(this.getInputTemplate()));
            if (this.getInputPaths() != null) {
                data.set("inputPaths", om.valueToTree(this.getInputPaths()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetInputTransformer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetInputTransformer.Jsii$Proxy that = (CloudwatchEventTargetInputTransformer.Jsii$Proxy) o;

            if (!inputTemplate.equals(that.inputTemplate)) return false;
            return this.inputPaths != null ? this.inputPaths.equals(that.inputPaths) : that.inputPaths == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputTemplate.hashCode();
            result = 31 * result + (this.inputPaths != null ? this.inputPaths.hashCode() : 0);
            return result;
        }
    }
}
