package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.281Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetSagemakerPipelineTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetSagemakerPipelineTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetSagemakerPipelineTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * pipeline_parameter_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#pipeline_parameter_list CloudwatchEventTarget#pipeline_parameter_list}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPipelineParameterList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetSagemakerPipelineTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetSagemakerPipelineTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetSagemakerPipelineTarget> {
        java.lang.Object pipelineParameterList;

        /**
         * Sets the value of {@link CloudwatchEventTargetSagemakerPipelineTarget#getPipelineParameterList}
         * @param pipelineParameterList pipeline_parameter_list block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#pipeline_parameter_list CloudwatchEventTarget#pipeline_parameter_list}
         * @return {@code this}
         */
        public Builder pipelineParameterList(com.hashicorp.cdktf.IResolvable pipelineParameterList) {
            this.pipelineParameterList = pipelineParameterList;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetSagemakerPipelineTarget#getPipelineParameterList}
         * @param pipelineParameterList pipeline_parameter_list block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#pipeline_parameter_list CloudwatchEventTarget#pipeline_parameter_list}
         * @return {@code this}
         */
        public Builder pipelineParameterList(java.util.List<? extends imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStruct> pipelineParameterList) {
            this.pipelineParameterList = pipelineParameterList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetSagemakerPipelineTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetSagemakerPipelineTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetSagemakerPipelineTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetSagemakerPipelineTarget {
        private final java.lang.Object pipelineParameterList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.pipelineParameterList = software.amazon.jsii.Kernel.get(this, "pipelineParameterList", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.pipelineParameterList = builder.pipelineParameterList;
        }

        @Override
        public final java.lang.Object getPipelineParameterList() {
            return this.pipelineParameterList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPipelineParameterList() != null) {
                data.set("pipelineParameterList", om.valueToTree(this.getPipelineParameterList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetSagemakerPipelineTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetSagemakerPipelineTarget.Jsii$Proxy that = (CloudwatchEventTargetSagemakerPipelineTarget.Jsii$Proxy) o;

            return this.pipelineParameterList != null ? this.pipelineParameterList.equals(that.pipelineParameterList) : that.pipelineParameterList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.pipelineParameterList != null ? this.pipelineParameterList.hashCode() : 0;
            return result;
        }
    }
}
