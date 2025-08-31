package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.074Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEventbridgeEventBusParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersEventbridgeEventBusParameters.Jsii$Proxy.class)
public interface PipesPipeTargetParametersEventbridgeEventBusParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#detail_type PipesPipe#detail_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDetailType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#endpoint_id PipesPipe#endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resources PipesPipe#resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#time PipesPipe#time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersEventbridgeEventBusParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersEventbridgeEventBusParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersEventbridgeEventBusParameters> {
        java.lang.String detailType;
        java.lang.String endpointId;
        java.util.List<java.lang.String> resources;
        java.lang.String source;
        java.lang.String time;

        /**
         * Sets the value of {@link PipesPipeTargetParametersEventbridgeEventBusParameters#getDetailType}
         * @param detailType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#detail_type PipesPipe#detail_type}.
         * @return {@code this}
         */
        public Builder detailType(java.lang.String detailType) {
            this.detailType = detailType;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEventbridgeEventBusParameters#getEndpointId}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#endpoint_id PipesPipe#endpoint_id}.
         * @return {@code this}
         */
        public Builder endpointId(java.lang.String endpointId) {
            this.endpointId = endpointId;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEventbridgeEventBusParameters#getResources}
         * @param resources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resources PipesPipe#resources}.
         * @return {@code this}
         */
        public Builder resources(java.util.List<java.lang.String> resources) {
            this.resources = resources;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEventbridgeEventBusParameters#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEventbridgeEventBusParameters#getTime}
         * @param time Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#time PipesPipe#time}.
         * @return {@code this}
         */
        public Builder time(java.lang.String time) {
            this.time = time;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersEventbridgeEventBusParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersEventbridgeEventBusParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersEventbridgeEventBusParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersEventbridgeEventBusParameters {
        private final java.lang.String detailType;
        private final java.lang.String endpointId;
        private final java.util.List<java.lang.String> resources;
        private final java.lang.String source;
        private final java.lang.String time;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.detailType = software.amazon.jsii.Kernel.get(this, "detailType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointId = software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resources = software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.time = software.amazon.jsii.Kernel.get(this, "time", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.detailType = builder.detailType;
            this.endpointId = builder.endpointId;
            this.resources = builder.resources;
            this.source = builder.source;
            this.time = builder.time;
        }

        @Override
        public final java.lang.String getDetailType() {
            return this.detailType;
        }

        @Override
        public final java.lang.String getEndpointId() {
            return this.endpointId;
        }

        @Override
        public final java.util.List<java.lang.String> getResources() {
            return this.resources;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getTime() {
            return this.time;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDetailType() != null) {
                data.set("detailType", om.valueToTree(this.getDetailType()));
            }
            if (this.getEndpointId() != null) {
                data.set("endpointId", om.valueToTree(this.getEndpointId()));
            }
            if (this.getResources() != null) {
                data.set("resources", om.valueToTree(this.getResources()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }
            if (this.getTime() != null) {
                data.set("time", om.valueToTree(this.getTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersEventbridgeEventBusParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersEventbridgeEventBusParameters.Jsii$Proxy that = (PipesPipeTargetParametersEventbridgeEventBusParameters.Jsii$Proxy) o;

            if (this.detailType != null ? !this.detailType.equals(that.detailType) : that.detailType != null) return false;
            if (this.endpointId != null ? !this.endpointId.equals(that.endpointId) : that.endpointId != null) return false;
            if (this.resources != null ? !this.resources.equals(that.resources) : that.resources != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
            return this.time != null ? this.time.equals(that.time) : that.time == null;
        }

        @Override
        public final int hashCode() {
            int result = this.detailType != null ? this.detailType.hashCode() : 0;
            result = 31 * result + (this.endpointId != null ? this.endpointId.hashCode() : 0);
            result = 31 * result + (this.resources != null ? this.resources.hashCode() : 0);
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
            result = 31 * result + (this.time != null ? this.time.hashCode() : 0);
            return result;
        }
    }
}
