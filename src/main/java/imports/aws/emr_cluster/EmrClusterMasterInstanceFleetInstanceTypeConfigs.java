package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs")
@software.amazon.jsii.Jsii.Proxy(EmrClusterMasterInstanceFleetInstanceTypeConfigs.Jsii$Proxy.class)
public interface EmrClusterMasterInstanceFleetInstanceTypeConfigs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type EmrCluster#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price EmrCluster#bid_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBidPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price_as_percentage_of_on_demand_price EmrCluster#bid_price_as_percentage_of_on_demand_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBidPriceAsPercentageOfOnDemandPrice() {
        return null;
    }

    /**
     * configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfigurations() {
        return null;
    }

    /**
     * ebs_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_config EmrCluster#ebs_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#weighted_capacity EmrCluster#weighted_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeightedCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterMasterInstanceFleetInstanceTypeConfigs> {
        java.lang.String instanceType;
        java.lang.String bidPrice;
        java.lang.Number bidPriceAsPercentageOfOnDemandPrice;
        java.lang.Object configurations;
        java.lang.Object ebsConfig;
        java.lang.Number weightedCapacity;

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type EmrCluster#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getBidPrice}
         * @param bidPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price EmrCluster#bid_price}.
         * @return {@code this}
         */
        public Builder bidPrice(java.lang.String bidPrice) {
            this.bidPrice = bidPrice;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getBidPriceAsPercentageOfOnDemandPrice}
         * @param bidPriceAsPercentageOfOnDemandPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price_as_percentage_of_on_demand_price EmrCluster#bid_price_as_percentage_of_on_demand_price}.
         * @return {@code this}
         */
        public Builder bidPriceAsPercentageOfOnDemandPrice(java.lang.Number bidPriceAsPercentageOfOnDemandPrice) {
            this.bidPriceAsPercentageOfOnDemandPrice = bidPriceAsPercentageOfOnDemandPrice;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getConfigurations}
         * @param configurations configurations block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}
         * @return {@code this}
         */
        public Builder configurations(com.hashicorp.cdktf.IResolvable configurations) {
            this.configurations = configurations;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getConfigurations}
         * @param configurations configurations block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#configurations EmrCluster#configurations}
         * @return {@code this}
         */
        public Builder configurations(java.util.List<? extends imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations> configurations) {
            this.configurations = configurations;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getEbsConfig}
         * @param ebsConfig ebs_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_config EmrCluster#ebs_config}
         * @return {@code this}
         */
        public Builder ebsConfig(com.hashicorp.cdktf.IResolvable ebsConfig) {
            this.ebsConfig = ebsConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getEbsConfig}
         * @param ebsConfig ebs_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_config EmrCluster#ebs_config}
         * @return {@code this}
         */
        public Builder ebsConfig(java.util.List<? extends imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsEbsConfig> ebsConfig) {
            this.ebsConfig = ebsConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs#getWeightedCapacity}
         * @param weightedCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#weighted_capacity EmrCluster#weighted_capacity}.
         * @return {@code this}
         */
        public Builder weightedCapacity(java.lang.Number weightedCapacity) {
            this.weightedCapacity = weightedCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterMasterInstanceFleetInstanceTypeConfigs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterMasterInstanceFleetInstanceTypeConfigs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterMasterInstanceFleetInstanceTypeConfigs {
        private final java.lang.String instanceType;
        private final java.lang.String bidPrice;
        private final java.lang.Number bidPriceAsPercentageOfOnDemandPrice;
        private final java.lang.Object configurations;
        private final java.lang.Object ebsConfig;
        private final java.lang.Number weightedCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bidPrice = software.amazon.jsii.Kernel.get(this, "bidPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bidPriceAsPercentageOfOnDemandPrice = software.amazon.jsii.Kernel.get(this, "bidPriceAsPercentageOfOnDemandPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.configurations = software.amazon.jsii.Kernel.get(this, "configurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsConfig = software.amazon.jsii.Kernel.get(this, "ebsConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.weightedCapacity = software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.bidPrice = builder.bidPrice;
            this.bidPriceAsPercentageOfOnDemandPrice = builder.bidPriceAsPercentageOfOnDemandPrice;
            this.configurations = builder.configurations;
            this.ebsConfig = builder.ebsConfig;
            this.weightedCapacity = builder.weightedCapacity;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getBidPrice() {
            return this.bidPrice;
        }

        @Override
        public final java.lang.Number getBidPriceAsPercentageOfOnDemandPrice() {
            return this.bidPriceAsPercentageOfOnDemandPrice;
        }

        @Override
        public final java.lang.Object getConfigurations() {
            return this.configurations;
        }

        @Override
        public final java.lang.Object getEbsConfig() {
            return this.ebsConfig;
        }

        @Override
        public final java.lang.Number getWeightedCapacity() {
            return this.weightedCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getBidPrice() != null) {
                data.set("bidPrice", om.valueToTree(this.getBidPrice()));
            }
            if (this.getBidPriceAsPercentageOfOnDemandPrice() != null) {
                data.set("bidPriceAsPercentageOfOnDemandPrice", om.valueToTree(this.getBidPriceAsPercentageOfOnDemandPrice()));
            }
            if (this.getConfigurations() != null) {
                data.set("configurations", om.valueToTree(this.getConfigurations()));
            }
            if (this.getEbsConfig() != null) {
                data.set("ebsConfig", om.valueToTree(this.getEbsConfig()));
            }
            if (this.getWeightedCapacity() != null) {
                data.set("weightedCapacity", om.valueToTree(this.getWeightedCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterMasterInstanceFleetInstanceTypeConfigs.Jsii$Proxy that = (EmrClusterMasterInstanceFleetInstanceTypeConfigs.Jsii$Proxy) o;

            if (!instanceType.equals(that.instanceType)) return false;
            if (this.bidPrice != null ? !this.bidPrice.equals(that.bidPrice) : that.bidPrice != null) return false;
            if (this.bidPriceAsPercentageOfOnDemandPrice != null ? !this.bidPriceAsPercentageOfOnDemandPrice.equals(that.bidPriceAsPercentageOfOnDemandPrice) : that.bidPriceAsPercentageOfOnDemandPrice != null) return false;
            if (this.configurations != null ? !this.configurations.equals(that.configurations) : that.configurations != null) return false;
            if (this.ebsConfig != null ? !this.ebsConfig.equals(that.ebsConfig) : that.ebsConfig != null) return false;
            return this.weightedCapacity != null ? this.weightedCapacity.equals(that.weightedCapacity) : that.weightedCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceType.hashCode();
            result = 31 * result + (this.bidPrice != null ? this.bidPrice.hashCode() : 0);
            result = 31 * result + (this.bidPriceAsPercentageOfOnDemandPrice != null ? this.bidPriceAsPercentageOfOnDemandPrice.hashCode() : 0);
            result = 31 * result + (this.configurations != null ? this.configurations.hashCode() : 0);
            result = 31 * result + (this.ebsConfig != null ? this.ebsConfig.hashCode() : 0);
            result = 31 * result + (this.weightedCapacity != null ? this.weightedCapacity.hashCode() : 0);
            return result;
        }
    }
}
