package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupThroughputConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupThroughputConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupThroughputConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#provisioned_read_capacity_units SagemakerFeatureGroup#provisioned_read_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedReadCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#provisioned_write_capacity_units SagemakerFeatureGroup#provisioned_write_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedWriteCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#throughput_mode SagemakerFeatureGroup#throughput_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThroughputMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupThroughputConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupThroughputConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupThroughputConfig> {
        java.lang.Number provisionedReadCapacityUnits;
        java.lang.Number provisionedWriteCapacityUnits;
        java.lang.String throughputMode;

        /**
         * Sets the value of {@link SagemakerFeatureGroupThroughputConfig#getProvisionedReadCapacityUnits}
         * @param provisionedReadCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#provisioned_read_capacity_units SagemakerFeatureGroup#provisioned_read_capacity_units}.
         * @return {@code this}
         */
        public Builder provisionedReadCapacityUnits(java.lang.Number provisionedReadCapacityUnits) {
            this.provisionedReadCapacityUnits = provisionedReadCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupThroughputConfig#getProvisionedWriteCapacityUnits}
         * @param provisionedWriteCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#provisioned_write_capacity_units SagemakerFeatureGroup#provisioned_write_capacity_units}.
         * @return {@code this}
         */
        public Builder provisionedWriteCapacityUnits(java.lang.Number provisionedWriteCapacityUnits) {
            this.provisionedWriteCapacityUnits = provisionedWriteCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupThroughputConfig#getThroughputMode}
         * @param throughputMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#throughput_mode SagemakerFeatureGroup#throughput_mode}.
         * @return {@code this}
         */
        public Builder throughputMode(java.lang.String throughputMode) {
            this.throughputMode = throughputMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupThroughputConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupThroughputConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupThroughputConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupThroughputConfig {
        private final java.lang.Number provisionedReadCapacityUnits;
        private final java.lang.Number provisionedWriteCapacityUnits;
        private final java.lang.String throughputMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.provisionedReadCapacityUnits = software.amazon.jsii.Kernel.get(this, "provisionedReadCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.provisionedWriteCapacityUnits = software.amazon.jsii.Kernel.get(this, "provisionedWriteCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.throughputMode = software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.provisionedReadCapacityUnits = builder.provisionedReadCapacityUnits;
            this.provisionedWriteCapacityUnits = builder.provisionedWriteCapacityUnits;
            this.throughputMode = builder.throughputMode;
        }

        @Override
        public final java.lang.Number getProvisionedReadCapacityUnits() {
            return this.provisionedReadCapacityUnits;
        }

        @Override
        public final java.lang.Number getProvisionedWriteCapacityUnits() {
            return this.provisionedWriteCapacityUnits;
        }

        @Override
        public final java.lang.String getThroughputMode() {
            return this.throughputMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getProvisionedReadCapacityUnits() != null) {
                data.set("provisionedReadCapacityUnits", om.valueToTree(this.getProvisionedReadCapacityUnits()));
            }
            if (this.getProvisionedWriteCapacityUnits() != null) {
                data.set("provisionedWriteCapacityUnits", om.valueToTree(this.getProvisionedWriteCapacityUnits()));
            }
            if (this.getThroughputMode() != null) {
                data.set("throughputMode", om.valueToTree(this.getThroughputMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupThroughputConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupThroughputConfig.Jsii$Proxy that = (SagemakerFeatureGroupThroughputConfig.Jsii$Proxy) o;

            if (this.provisionedReadCapacityUnits != null ? !this.provisionedReadCapacityUnits.equals(that.provisionedReadCapacityUnits) : that.provisionedReadCapacityUnits != null) return false;
            if (this.provisionedWriteCapacityUnits != null ? !this.provisionedWriteCapacityUnits.equals(that.provisionedWriteCapacityUnits) : that.provisionedWriteCapacityUnits != null) return false;
            return this.throughputMode != null ? this.throughputMode.equals(that.throughputMode) : that.throughputMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.provisionedReadCapacityUnits != null ? this.provisionedReadCapacityUnits.hashCode() : 0;
            result = 31 * result + (this.provisionedWriteCapacityUnits != null ? this.provisionedWriteCapacityUnits.hashCode() : 0);
            result = 31 * result + (this.throughputMode != null ? this.throughputMode.hashCode() : 0);
            return result;
        }
    }
}
