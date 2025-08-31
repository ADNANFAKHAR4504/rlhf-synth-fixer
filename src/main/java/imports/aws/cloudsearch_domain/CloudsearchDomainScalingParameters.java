package imports.aws.cloudsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomainScalingParameters")
@software.amazon.jsii.Jsii.Proxy(CloudsearchDomainScalingParameters.Jsii$Proxy.class)
public interface CloudsearchDomainScalingParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_instance_type CloudsearchDomain#desired_instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDesiredInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_partition_count CloudsearchDomain#desired_partition_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredPartitionCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_replication_count CloudsearchDomain#desired_replication_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredReplicationCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudsearchDomainScalingParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudsearchDomainScalingParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudsearchDomainScalingParameters> {
        java.lang.String desiredInstanceType;
        java.lang.Number desiredPartitionCount;
        java.lang.Number desiredReplicationCount;

        /**
         * Sets the value of {@link CloudsearchDomainScalingParameters#getDesiredInstanceType}
         * @param desiredInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_instance_type CloudsearchDomain#desired_instance_type}.
         * @return {@code this}
         */
        public Builder desiredInstanceType(java.lang.String desiredInstanceType) {
            this.desiredInstanceType = desiredInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainScalingParameters#getDesiredPartitionCount}
         * @param desiredPartitionCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_partition_count CloudsearchDomain#desired_partition_count}.
         * @return {@code this}
         */
        public Builder desiredPartitionCount(java.lang.Number desiredPartitionCount) {
            this.desiredPartitionCount = desiredPartitionCount;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainScalingParameters#getDesiredReplicationCount}
         * @param desiredReplicationCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#desired_replication_count CloudsearchDomain#desired_replication_count}.
         * @return {@code this}
         */
        public Builder desiredReplicationCount(java.lang.Number desiredReplicationCount) {
            this.desiredReplicationCount = desiredReplicationCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudsearchDomainScalingParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudsearchDomainScalingParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudsearchDomainScalingParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudsearchDomainScalingParameters {
        private final java.lang.String desiredInstanceType;
        private final java.lang.Number desiredPartitionCount;
        private final java.lang.Number desiredReplicationCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.desiredInstanceType = software.amazon.jsii.Kernel.get(this, "desiredInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.desiredPartitionCount = software.amazon.jsii.Kernel.get(this, "desiredPartitionCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredReplicationCount = software.amazon.jsii.Kernel.get(this, "desiredReplicationCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.desiredInstanceType = builder.desiredInstanceType;
            this.desiredPartitionCount = builder.desiredPartitionCount;
            this.desiredReplicationCount = builder.desiredReplicationCount;
        }

        @Override
        public final java.lang.String getDesiredInstanceType() {
            return this.desiredInstanceType;
        }

        @Override
        public final java.lang.Number getDesiredPartitionCount() {
            return this.desiredPartitionCount;
        }

        @Override
        public final java.lang.Number getDesiredReplicationCount() {
            return this.desiredReplicationCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDesiredInstanceType() != null) {
                data.set("desiredInstanceType", om.valueToTree(this.getDesiredInstanceType()));
            }
            if (this.getDesiredPartitionCount() != null) {
                data.set("desiredPartitionCount", om.valueToTree(this.getDesiredPartitionCount()));
            }
            if (this.getDesiredReplicationCount() != null) {
                data.set("desiredReplicationCount", om.valueToTree(this.getDesiredReplicationCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudsearchDomain.CloudsearchDomainScalingParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudsearchDomainScalingParameters.Jsii$Proxy that = (CloudsearchDomainScalingParameters.Jsii$Proxy) o;

            if (this.desiredInstanceType != null ? !this.desiredInstanceType.equals(that.desiredInstanceType) : that.desiredInstanceType != null) return false;
            if (this.desiredPartitionCount != null ? !this.desiredPartitionCount.equals(that.desiredPartitionCount) : that.desiredPartitionCount != null) return false;
            return this.desiredReplicationCount != null ? this.desiredReplicationCount.equals(that.desiredReplicationCount) : that.desiredReplicationCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.desiredInstanceType != null ? this.desiredInstanceType.hashCode() : 0;
            result = 31 * result + (this.desiredPartitionCount != null ? this.desiredPartitionCount.hashCode() : 0);
            result = 31 * result + (this.desiredReplicationCount != null ? this.desiredReplicationCount.hashCode() : 0);
            return result;
        }
    }
}
