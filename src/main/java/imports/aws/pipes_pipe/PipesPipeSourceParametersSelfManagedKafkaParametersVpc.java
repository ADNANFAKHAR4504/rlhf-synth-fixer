package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersSelfManagedKafkaParametersVpc.Jsii$Proxy.class)
public interface PipesPipeSourceParametersSelfManagedKafkaParametersVpc extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersSelfManagedKafkaParametersVpc> {
        java.util.List<java.lang.String> securityGroups;
        java.util.List<java.lang.String> subnets;

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersSelfManagedKafkaParametersVpc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersSelfManagedKafkaParametersVpc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersSelfManagedKafkaParametersVpc {
        private final java.util.List<java.lang.String> securityGroups;
        private final java.util.List<java.lang.String> subnets;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.securityGroups = builder.securityGroups;
            this.subnets = builder.subnets;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSubnets() != null) {
                data.set("subnets", om.valueToTree(this.getSubnets()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersSelfManagedKafkaParametersVpc.Jsii$Proxy that = (PipesPipeSourceParametersSelfManagedKafkaParametersVpc.Jsii$Proxy) o;

            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            return this.subnets != null ? this.subnets.equals(that.subnets) : that.subnets == null;
        }

        @Override
        public final int hashCode() {
            int result = this.securityGroups != null ? this.securityGroups.hashCode() : 0;
            result = 31 * result + (this.subnets != null ? this.subnets.hashCode() : 0);
            return result;
        }
    }
}
