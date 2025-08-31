package imports.aws.data_aws_ec2_capacity_block_offering;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.568Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2CapacityBlockOffering.DataAwsEc2CapacityBlockOfferingConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsEc2CapacityBlockOfferingConfig.Jsii$Proxy.class)
public interface DataAwsEc2CapacityBlockOfferingConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#capacity_duration_hours DataAwsEc2CapacityBlockOffering#capacity_duration_hours}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getCapacityDurationHours();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#instance_count DataAwsEc2CapacityBlockOffering#instance_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#instance_type DataAwsEc2CapacityBlockOffering#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#end_date_range DataAwsEc2CapacityBlockOffering#end_date_range}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndDateRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#start_date_range DataAwsEc2CapacityBlockOffering#start_date_range}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartDateRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEc2CapacityBlockOfferingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEc2CapacityBlockOfferingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEc2CapacityBlockOfferingConfig> {
        java.lang.Number capacityDurationHours;
        java.lang.Number instanceCount;
        java.lang.String instanceType;
        java.lang.String endDateRange;
        java.lang.String startDateRange;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getCapacityDurationHours}
         * @param capacityDurationHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#capacity_duration_hours DataAwsEc2CapacityBlockOffering#capacity_duration_hours}. This parameter is required.
         * @return {@code this}
         */
        public Builder capacityDurationHours(java.lang.Number capacityDurationHours) {
            this.capacityDurationHours = capacityDurationHours;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#instance_count DataAwsEc2CapacityBlockOffering#instance_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#instance_type DataAwsEc2CapacityBlockOffering#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getEndDateRange}
         * @param endDateRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#end_date_range DataAwsEc2CapacityBlockOffering#end_date_range}.
         * @return {@code this}
         */
        public Builder endDateRange(java.lang.String endDateRange) {
            this.endDateRange = endDateRange;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getStartDateRange}
         * @param startDateRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_capacity_block_offering#start_date_range DataAwsEc2CapacityBlockOffering#start_date_range}.
         * @return {@code this}
         */
        public Builder startDateRange(java.lang.String startDateRange) {
            this.startDateRange = startDateRange;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2CapacityBlockOfferingConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEc2CapacityBlockOfferingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEc2CapacityBlockOfferingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEc2CapacityBlockOfferingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEc2CapacityBlockOfferingConfig {
        private final java.lang.Number capacityDurationHours;
        private final java.lang.Number instanceCount;
        private final java.lang.String instanceType;
        private final java.lang.String endDateRange;
        private final java.lang.String startDateRange;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityDurationHours = software.amazon.jsii.Kernel.get(this, "capacityDurationHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endDateRange = software.amazon.jsii.Kernel.get(this, "endDateRange", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startDateRange = software.amazon.jsii.Kernel.get(this, "startDateRange", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityDurationHours = java.util.Objects.requireNonNull(builder.capacityDurationHours, "capacityDurationHours is required");
            this.instanceCount = java.util.Objects.requireNonNull(builder.instanceCount, "instanceCount is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.endDateRange = builder.endDateRange;
            this.startDateRange = builder.startDateRange;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getCapacityDurationHours() {
            return this.capacityDurationHours;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getEndDateRange() {
            return this.endDateRange;
        }

        @Override
        public final java.lang.String getStartDateRange() {
            return this.startDateRange;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("capacityDurationHours", om.valueToTree(this.getCapacityDurationHours()));
            data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getEndDateRange() != null) {
                data.set("endDateRange", om.valueToTree(this.getEndDateRange()));
            }
            if (this.getStartDateRange() != null) {
                data.set("startDateRange", om.valueToTree(this.getStartDateRange()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEc2CapacityBlockOffering.DataAwsEc2CapacityBlockOfferingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEc2CapacityBlockOfferingConfig.Jsii$Proxy that = (DataAwsEc2CapacityBlockOfferingConfig.Jsii$Proxy) o;

            if (!capacityDurationHours.equals(that.capacityDurationHours)) return false;
            if (!instanceCount.equals(that.instanceCount)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (this.endDateRange != null ? !this.endDateRange.equals(that.endDateRange) : that.endDateRange != null) return false;
            if (this.startDateRange != null ? !this.startDateRange.equals(that.startDateRange) : that.startDateRange != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityDurationHours.hashCode();
            result = 31 * result + (this.instanceCount.hashCode());
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.endDateRange != null ? this.endDateRange.hashCode() : 0);
            result = 31 * result + (this.startDateRange != null ? this.startDateRange.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
