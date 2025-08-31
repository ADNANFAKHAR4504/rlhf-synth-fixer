package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityAutoscaling")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorCapacityAutoscaling.Jsii$Proxy.class)
public interface MskconnectConnectorCapacityAutoscaling extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#max_worker_count MskconnectConnector#max_worker_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxWorkerCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#min_worker_count MskconnectConnector#min_worker_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinWorkerCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#mcu_count MskconnectConnector#mcu_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMcuCount() {
        return null;
    }

    /**
     * scale_in_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#scale_in_policy MskconnectConnector#scale_in_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy getScaleInPolicy() {
        return null;
    }

    /**
     * scale_out_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#scale_out_policy MskconnectConnector#scale_out_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy getScaleOutPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorCapacityAutoscaling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorCapacityAutoscaling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorCapacityAutoscaling> {
        java.lang.Number maxWorkerCount;
        java.lang.Number minWorkerCount;
        java.lang.Number mcuCount;
        imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy scaleInPolicy;
        imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy scaleOutPolicy;

        /**
         * Sets the value of {@link MskconnectConnectorCapacityAutoscaling#getMaxWorkerCount}
         * @param maxWorkerCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#max_worker_count MskconnectConnector#max_worker_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxWorkerCount(java.lang.Number maxWorkerCount) {
            this.maxWorkerCount = maxWorkerCount;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacityAutoscaling#getMinWorkerCount}
         * @param minWorkerCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#min_worker_count MskconnectConnector#min_worker_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder minWorkerCount(java.lang.Number minWorkerCount) {
            this.minWorkerCount = minWorkerCount;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacityAutoscaling#getMcuCount}
         * @param mcuCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#mcu_count MskconnectConnector#mcu_count}.
         * @return {@code this}
         */
        public Builder mcuCount(java.lang.Number mcuCount) {
            this.mcuCount = mcuCount;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacityAutoscaling#getScaleInPolicy}
         * @param scaleInPolicy scale_in_policy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#scale_in_policy MskconnectConnector#scale_in_policy}
         * @return {@code this}
         */
        public Builder scaleInPolicy(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy scaleInPolicy) {
            this.scaleInPolicy = scaleInPolicy;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorCapacityAutoscaling#getScaleOutPolicy}
         * @param scaleOutPolicy scale_out_policy block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#scale_out_policy MskconnectConnector#scale_out_policy}
         * @return {@code this}
         */
        public Builder scaleOutPolicy(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy scaleOutPolicy) {
            this.scaleOutPolicy = scaleOutPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorCapacityAutoscaling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorCapacityAutoscaling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorCapacityAutoscaling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorCapacityAutoscaling {
        private final java.lang.Number maxWorkerCount;
        private final java.lang.Number minWorkerCount;
        private final java.lang.Number mcuCount;
        private final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy scaleInPolicy;
        private final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy scaleOutPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxWorkerCount = software.amazon.jsii.Kernel.get(this, "maxWorkerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minWorkerCount = software.amazon.jsii.Kernel.get(this, "minWorkerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mcuCount = software.amazon.jsii.Kernel.get(this, "mcuCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleInPolicy = software.amazon.jsii.Kernel.get(this, "scaleInPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy.class));
            this.scaleOutPolicy = software.amazon.jsii.Kernel.get(this, "scaleOutPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxWorkerCount = java.util.Objects.requireNonNull(builder.maxWorkerCount, "maxWorkerCount is required");
            this.minWorkerCount = java.util.Objects.requireNonNull(builder.minWorkerCount, "minWorkerCount is required");
            this.mcuCount = builder.mcuCount;
            this.scaleInPolicy = builder.scaleInPolicy;
            this.scaleOutPolicy = builder.scaleOutPolicy;
        }

        @Override
        public final java.lang.Number getMaxWorkerCount() {
            return this.maxWorkerCount;
        }

        @Override
        public final java.lang.Number getMinWorkerCount() {
            return this.minWorkerCount;
        }

        @Override
        public final java.lang.Number getMcuCount() {
            return this.mcuCount;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy getScaleInPolicy() {
            return this.scaleInPolicy;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy getScaleOutPolicy() {
            return this.scaleOutPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxWorkerCount", om.valueToTree(this.getMaxWorkerCount()));
            data.set("minWorkerCount", om.valueToTree(this.getMinWorkerCount()));
            if (this.getMcuCount() != null) {
                data.set("mcuCount", om.valueToTree(this.getMcuCount()));
            }
            if (this.getScaleInPolicy() != null) {
                data.set("scaleInPolicy", om.valueToTree(this.getScaleInPolicy()));
            }
            if (this.getScaleOutPolicy() != null) {
                data.set("scaleOutPolicy", om.valueToTree(this.getScaleOutPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorCapacityAutoscaling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorCapacityAutoscaling.Jsii$Proxy that = (MskconnectConnectorCapacityAutoscaling.Jsii$Proxy) o;

            if (!maxWorkerCount.equals(that.maxWorkerCount)) return false;
            if (!minWorkerCount.equals(that.minWorkerCount)) return false;
            if (this.mcuCount != null ? !this.mcuCount.equals(that.mcuCount) : that.mcuCount != null) return false;
            if (this.scaleInPolicy != null ? !this.scaleInPolicy.equals(that.scaleInPolicy) : that.scaleInPolicy != null) return false;
            return this.scaleOutPolicy != null ? this.scaleOutPolicy.equals(that.scaleOutPolicy) : that.scaleOutPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxWorkerCount.hashCode();
            result = 31 * result + (this.minWorkerCount.hashCode());
            result = 31 * result + (this.mcuCount != null ? this.mcuCount.hashCode() : 0);
            result = 31 * result + (this.scaleInPolicy != null ? this.scaleInPolicy.hashCode() : 0);
            result = 31 * result + (this.scaleOutPolicy != null ? this.scaleOutPolicy.hashCode() : 0);
            return result;
        }
    }
}
