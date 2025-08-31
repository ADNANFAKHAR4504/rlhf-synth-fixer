package imports.aws.ec2_network_insights_path;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange")
@software.amazon.jsii.Jsii.Proxy(Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange.Jsii$Proxy.class)
public interface Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFromPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getToPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange> {
        java.lang.Number fromPort;
        java.lang.Number toPort;

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange {
        private final java.lang.Number fromPort;
        private final java.lang.Number toPort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fromPort = builder.fromPort;
            this.toPort = builder.toPort;
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFromPort() != null) {
                data.set("fromPort", om.valueToTree(this.getFromPort()));
            }
            if (this.getToPort() != null) {
                data.set("toPort", om.valueToTree(this.getToPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange.Jsii$Proxy that = (Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange.Jsii$Proxy) o;

            if (this.fromPort != null ? !this.fromPort.equals(that.fromPort) : that.fromPort != null) return false;
            return this.toPort != null ? this.toPort.equals(that.toPort) : that.toPort == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fromPort != null ? this.fromPort.hashCode() : 0;
            result = 31 * result + (this.toPort != null ? this.toPort.hashCode() : 0);
            return result;
        }
    }
}
