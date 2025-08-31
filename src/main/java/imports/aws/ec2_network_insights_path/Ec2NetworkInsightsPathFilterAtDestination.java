package imports.aws.ec2_network_insights_path;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.101Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestination")
@software.amazon.jsii.Jsii.Proxy(Ec2NetworkInsightsPathFilterAtDestination.Jsii$Proxy.class)
public interface Ec2NetworkInsightsPathFilterAtDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationAddress() {
        return null;
    }

    /**
     * destination_port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange getDestinationPortRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceAddress() {
        return null;
    }

    /**
     * source_port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange getSourcePortRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2NetworkInsightsPathFilterAtDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2NetworkInsightsPathFilterAtDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2NetworkInsightsPathFilterAtDestination> {
        java.lang.String destinationAddress;
        imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange destinationPortRange;
        java.lang.String sourceAddress;
        imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange sourcePortRange;

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtDestination#getDestinationAddress}
         * @param destinationAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
         * @return {@code this}
         */
        public Builder destinationAddress(java.lang.String destinationAddress) {
            this.destinationAddress = destinationAddress;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtDestination#getDestinationPortRange}
         * @param destinationPortRange destination_port_range block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
         * @return {@code this}
         */
        public Builder destinationPortRange(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange destinationPortRange) {
            this.destinationPortRange = destinationPortRange;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtDestination#getSourceAddress}
         * @param sourceAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
         * @return {@code this}
         */
        public Builder sourceAddress(java.lang.String sourceAddress) {
            this.sourceAddress = sourceAddress;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathFilterAtDestination#getSourcePortRange}
         * @param sourcePortRange source_port_range block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
         * @return {@code this}
         */
        public Builder sourcePortRange(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange sourcePortRange) {
            this.sourcePortRange = sourcePortRange;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2NetworkInsightsPathFilterAtDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2NetworkInsightsPathFilterAtDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2NetworkInsightsPathFilterAtDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2NetworkInsightsPathFilterAtDestination {
        private final java.lang.String destinationAddress;
        private final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange destinationPortRange;
        private final java.lang.String sourceAddress;
        private final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange sourcePortRange;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationAddress = software.amazon.jsii.Kernel.get(this, "destinationAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPortRange = software.amazon.jsii.Kernel.get(this, "destinationPortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange.class));
            this.sourceAddress = software.amazon.jsii.Kernel.get(this, "sourceAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourcePortRange = software.amazon.jsii.Kernel.get(this, "sourcePortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationAddress = builder.destinationAddress;
            this.destinationPortRange = builder.destinationPortRange;
            this.sourceAddress = builder.sourceAddress;
            this.sourcePortRange = builder.sourcePortRange;
        }

        @Override
        public final java.lang.String getDestinationAddress() {
            return this.destinationAddress;
        }

        @Override
        public final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange getDestinationPortRange() {
            return this.destinationPortRange;
        }

        @Override
        public final java.lang.String getSourceAddress() {
            return this.sourceAddress;
        }

        @Override
        public final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange getSourcePortRange() {
            return this.sourcePortRange;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDestinationAddress() != null) {
                data.set("destinationAddress", om.valueToTree(this.getDestinationAddress()));
            }
            if (this.getDestinationPortRange() != null) {
                data.set("destinationPortRange", om.valueToTree(this.getDestinationPortRange()));
            }
            if (this.getSourceAddress() != null) {
                data.set("sourceAddress", om.valueToTree(this.getSourceAddress()));
            }
            if (this.getSourcePortRange() != null) {
                data.set("sourcePortRange", om.valueToTree(this.getSourcePortRange()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2NetworkInsightsPathFilterAtDestination.Jsii$Proxy that = (Ec2NetworkInsightsPathFilterAtDestination.Jsii$Proxy) o;

            if (this.destinationAddress != null ? !this.destinationAddress.equals(that.destinationAddress) : that.destinationAddress != null) return false;
            if (this.destinationPortRange != null ? !this.destinationPortRange.equals(that.destinationPortRange) : that.destinationPortRange != null) return false;
            if (this.sourceAddress != null ? !this.sourceAddress.equals(that.sourceAddress) : that.sourceAddress != null) return false;
            return this.sourcePortRange != null ? this.sourcePortRange.equals(that.sourcePortRange) : that.sourcePortRange == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destinationAddress != null ? this.destinationAddress.hashCode() : 0;
            result = 31 * result + (this.destinationPortRange != null ? this.destinationPortRange.hashCode() : 0);
            result = 31 * result + (this.sourceAddress != null ? this.sourceAddress.hashCode() : 0);
            result = 31 * result + (this.sourcePortRange != null ? this.sourcePortRange.hashCode() : 0);
            return result;
        }
    }
}
