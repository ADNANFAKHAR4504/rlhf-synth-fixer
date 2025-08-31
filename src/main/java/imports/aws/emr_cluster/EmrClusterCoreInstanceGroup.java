package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterCoreInstanceGroup")
@software.amazon.jsii.Jsii.Proxy(EmrClusterCoreInstanceGroup.Jsii$Proxy.class)
public interface EmrClusterCoreInstanceGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type EmrCluster#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_policy EmrCluster#autoscaling_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoscalingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price EmrCluster#bid_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBidPrice() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_count EmrCluster#instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterCoreInstanceGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterCoreInstanceGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterCoreInstanceGroup> {
        java.lang.String instanceType;
        java.lang.String autoscalingPolicy;
        java.lang.String bidPrice;
        java.lang.Object ebsConfig;
        java.lang.Number instanceCount;
        java.lang.String name;

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type EmrCluster#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getAutoscalingPolicy}
         * @param autoscalingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#autoscaling_policy EmrCluster#autoscaling_policy}.
         * @return {@code this}
         */
        public Builder autoscalingPolicy(java.lang.String autoscalingPolicy) {
            this.autoscalingPolicy = autoscalingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getBidPrice}
         * @param bidPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#bid_price EmrCluster#bid_price}.
         * @return {@code this}
         */
        public Builder bidPrice(java.lang.String bidPrice) {
            this.bidPrice = bidPrice;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getEbsConfig}
         * @param ebsConfig ebs_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_config EmrCluster#ebs_config}
         * @return {@code this}
         */
        public Builder ebsConfig(com.hashicorp.cdktf.IResolvable ebsConfig) {
            this.ebsConfig = ebsConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getEbsConfig}
         * @param ebsConfig ebs_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ebs_config EmrCluster#ebs_config}
         * @return {@code this}
         */
        public Builder ebsConfig(java.util.List<? extends imports.aws.emr_cluster.EmrClusterCoreInstanceGroupEbsConfig> ebsConfig) {
            this.ebsConfig = ebsConfig;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_count EmrCluster#instance_count}.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterCoreInstanceGroup#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterCoreInstanceGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterCoreInstanceGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterCoreInstanceGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterCoreInstanceGroup {
        private final java.lang.String instanceType;
        private final java.lang.String autoscalingPolicy;
        private final java.lang.String bidPrice;
        private final java.lang.Object ebsConfig;
        private final java.lang.Number instanceCount;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoscalingPolicy = software.amazon.jsii.Kernel.get(this, "autoscalingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bidPrice = software.amazon.jsii.Kernel.get(this, "bidPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebsConfig = software.amazon.jsii.Kernel.get(this, "ebsConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.autoscalingPolicy = builder.autoscalingPolicy;
            this.bidPrice = builder.bidPrice;
            this.ebsConfig = builder.ebsConfig;
            this.instanceCount = builder.instanceCount;
            this.name = builder.name;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getAutoscalingPolicy() {
            return this.autoscalingPolicy;
        }

        @Override
        public final java.lang.String getBidPrice() {
            return this.bidPrice;
        }

        @Override
        public final java.lang.Object getEbsConfig() {
            return this.ebsConfig;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getAutoscalingPolicy() != null) {
                data.set("autoscalingPolicy", om.valueToTree(this.getAutoscalingPolicy()));
            }
            if (this.getBidPrice() != null) {
                data.set("bidPrice", om.valueToTree(this.getBidPrice()));
            }
            if (this.getEbsConfig() != null) {
                data.set("ebsConfig", om.valueToTree(this.getEbsConfig()));
            }
            if (this.getInstanceCount() != null) {
                data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterCoreInstanceGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterCoreInstanceGroup.Jsii$Proxy that = (EmrClusterCoreInstanceGroup.Jsii$Proxy) o;

            if (!instanceType.equals(that.instanceType)) return false;
            if (this.autoscalingPolicy != null ? !this.autoscalingPolicy.equals(that.autoscalingPolicy) : that.autoscalingPolicy != null) return false;
            if (this.bidPrice != null ? !this.bidPrice.equals(that.bidPrice) : that.bidPrice != null) return false;
            if (this.ebsConfig != null ? !this.ebsConfig.equals(that.ebsConfig) : that.ebsConfig != null) return false;
            if (this.instanceCount != null ? !this.instanceCount.equals(that.instanceCount) : that.instanceCount != null) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceType.hashCode();
            result = 31 * result + (this.autoscalingPolicy != null ? this.autoscalingPolicy.hashCode() : 0);
            result = 31 * result + (this.bidPrice != null ? this.bidPrice.hashCode() : 0);
            result = 31 * result + (this.ebsConfig != null ? this.ebsConfig.hashCode() : 0);
            result = 31 * result + (this.instanceCount != null ? this.instanceCount.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
