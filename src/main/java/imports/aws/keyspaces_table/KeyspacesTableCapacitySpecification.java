package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.440Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableCapacitySpecification")
@software.amazon.jsii.Jsii.Proxy(KeyspacesTableCapacitySpecification.Jsii$Proxy.class)
public interface KeyspacesTableCapacitySpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#read_capacity_units KeyspacesTable#read_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReadCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#throughput_mode KeyspacesTable#throughput_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThroughputMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#write_capacity_units KeyspacesTable#write_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWriteCapacityUnits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KeyspacesTableCapacitySpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesTableCapacitySpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesTableCapacitySpecification> {
        java.lang.Number readCapacityUnits;
        java.lang.String throughputMode;
        java.lang.Number writeCapacityUnits;

        /**
         * Sets the value of {@link KeyspacesTableCapacitySpecification#getReadCapacityUnits}
         * @param readCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#read_capacity_units KeyspacesTable#read_capacity_units}.
         * @return {@code this}
         */
        public Builder readCapacityUnits(java.lang.Number readCapacityUnits) {
            this.readCapacityUnits = readCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableCapacitySpecification#getThroughputMode}
         * @param throughputMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#throughput_mode KeyspacesTable#throughput_mode}.
         * @return {@code this}
         */
        public Builder throughputMode(java.lang.String throughputMode) {
            this.throughputMode = throughputMode;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableCapacitySpecification#getWriteCapacityUnits}
         * @param writeCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#write_capacity_units KeyspacesTable#write_capacity_units}.
         * @return {@code this}
         */
        public Builder writeCapacityUnits(java.lang.Number writeCapacityUnits) {
            this.writeCapacityUnits = writeCapacityUnits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KeyspacesTableCapacitySpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesTableCapacitySpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesTableCapacitySpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesTableCapacitySpecification {
        private final java.lang.Number readCapacityUnits;
        private final java.lang.String throughputMode;
        private final java.lang.Number writeCapacityUnits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.readCapacityUnits = software.amazon.jsii.Kernel.get(this, "readCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.throughputMode = software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.writeCapacityUnits = software.amazon.jsii.Kernel.get(this, "writeCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.readCapacityUnits = builder.readCapacityUnits;
            this.throughputMode = builder.throughputMode;
            this.writeCapacityUnits = builder.writeCapacityUnits;
        }

        @Override
        public final java.lang.Number getReadCapacityUnits() {
            return this.readCapacityUnits;
        }

        @Override
        public final java.lang.String getThroughputMode() {
            return this.throughputMode;
        }

        @Override
        public final java.lang.Number getWriteCapacityUnits() {
            return this.writeCapacityUnits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReadCapacityUnits() != null) {
                data.set("readCapacityUnits", om.valueToTree(this.getReadCapacityUnits()));
            }
            if (this.getThroughputMode() != null) {
                data.set("throughputMode", om.valueToTree(this.getThroughputMode()));
            }
            if (this.getWriteCapacityUnits() != null) {
                data.set("writeCapacityUnits", om.valueToTree(this.getWriteCapacityUnits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.keyspacesTable.KeyspacesTableCapacitySpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesTableCapacitySpecification.Jsii$Proxy that = (KeyspacesTableCapacitySpecification.Jsii$Proxy) o;

            if (this.readCapacityUnits != null ? !this.readCapacityUnits.equals(that.readCapacityUnits) : that.readCapacityUnits != null) return false;
            if (this.throughputMode != null ? !this.throughputMode.equals(that.throughputMode) : that.throughputMode != null) return false;
            return this.writeCapacityUnits != null ? this.writeCapacityUnits.equals(that.writeCapacityUnits) : that.writeCapacityUnits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.readCapacityUnits != null ? this.readCapacityUnits.hashCode() : 0;
            result = 31 * result + (this.throughputMode != null ? this.throughputMode.hashCode() : 0);
            result = 31 * result + (this.writeCapacityUnits != null ? this.writeCapacityUnits.hashCode() : 0);
            return result;
        }
    }
}
