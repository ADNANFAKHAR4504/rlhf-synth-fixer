package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.236Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOriginGroup")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionOriginGroup.Jsii$Proxy.class)
public interface CloudfrontDistributionOriginGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * failover_criteria block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#failover_criteria CloudfrontDistribution#failover_criteria}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria getFailoverCriteria();

    /**
     * member block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#member CloudfrontDistribution#member}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getMember();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_id CloudfrontDistribution#origin_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOriginId();

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionOriginGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionOriginGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionOriginGroup> {
        imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria failoverCriteria;
        java.lang.Object member;
        java.lang.String originId;

        /**
         * Sets the value of {@link CloudfrontDistributionOriginGroup#getFailoverCriteria}
         * @param failoverCriteria failover_criteria block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#failover_criteria CloudfrontDistribution#failover_criteria}
         * @return {@code this}
         */
        public Builder failoverCriteria(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria failoverCriteria) {
            this.failoverCriteria = failoverCriteria;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginGroup#getMember}
         * @param member member block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#member CloudfrontDistribution#member}
         * @return {@code this}
         */
        public Builder member(com.hashicorp.cdktf.IResolvable member) {
            this.member = member;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginGroup#getMember}
         * @param member member block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#member CloudfrontDistribution#member}
         * @return {@code this}
         */
        public Builder member(java.util.List<? extends imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupMember> member) {
            this.member = member;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginGroup#getOriginId}
         * @param originId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_id CloudfrontDistribution#origin_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder originId(java.lang.String originId) {
            this.originId = originId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionOriginGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionOriginGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionOriginGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionOriginGroup {
        private final imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria failoverCriteria;
        private final java.lang.Object member;
        private final java.lang.String originId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failoverCriteria = software.amazon.jsii.Kernel.get(this, "failoverCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria.class));
            this.member = software.amazon.jsii.Kernel.get(this, "member", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.originId = software.amazon.jsii.Kernel.get(this, "originId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failoverCriteria = java.util.Objects.requireNonNull(builder.failoverCriteria, "failoverCriteria is required");
            this.member = java.util.Objects.requireNonNull(builder.member, "member is required");
            this.originId = java.util.Objects.requireNonNull(builder.originId, "originId is required");
        }

        @Override
        public final imports.aws.cloudfront_distribution.CloudfrontDistributionOriginGroupFailoverCriteria getFailoverCriteria() {
            return this.failoverCriteria;
        }

        @Override
        public final java.lang.Object getMember() {
            return this.member;
        }

        @Override
        public final java.lang.String getOriginId() {
            return this.originId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("failoverCriteria", om.valueToTree(this.getFailoverCriteria()));
            data.set("member", om.valueToTree(this.getMember()));
            data.set("originId", om.valueToTree(this.getOriginId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionOriginGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionOriginGroup.Jsii$Proxy that = (CloudfrontDistributionOriginGroup.Jsii$Proxy) o;

            if (!failoverCriteria.equals(that.failoverCriteria)) return false;
            if (!member.equals(that.member)) return false;
            return this.originId.equals(that.originId);
        }

        @Override
        public final int hashCode() {
            int result = this.failoverCriteria.hashCode();
            result = 31 * result + (this.member.hashCode());
            result = 31 * result + (this.originId.hashCode());
            return result;
        }
    }
}
