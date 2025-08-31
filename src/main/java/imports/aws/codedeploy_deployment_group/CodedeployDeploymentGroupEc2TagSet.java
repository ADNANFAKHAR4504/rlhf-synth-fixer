package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupEc2TagSet")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupEc2TagSet.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupEc2TagSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * ec2_tag_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEc2TagFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupEc2TagSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupEc2TagSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupEc2TagSet> {
        java.lang.Object ec2TagFilter;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupEc2TagSet#getEc2TagFilter}
         * @param ec2TagFilter ec2_tag_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * @return {@code this}
         */
        public Builder ec2TagFilter(com.hashicorp.cdktf.IResolvable ec2TagFilter) {
            this.ec2TagFilter = ec2TagFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupEc2TagSet#getEc2TagFilter}
         * @param ec2TagFilter ec2_tag_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ec2_tag_filter CodedeployDeploymentGroup#ec2_tag_filter}
         * @return {@code this}
         */
        public Builder ec2TagFilter(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupEc2TagSetEc2TagFilter> ec2TagFilter) {
            this.ec2TagFilter = ec2TagFilter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupEc2TagSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupEc2TagSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupEc2TagSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupEc2TagSet {
        private final java.lang.Object ec2TagFilter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ec2TagFilter = software.amazon.jsii.Kernel.get(this, "ec2TagFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ec2TagFilter = builder.ec2TagFilter;
        }

        @Override
        public final java.lang.Object getEc2TagFilter() {
            return this.ec2TagFilter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEc2TagFilter() != null) {
                data.set("ec2TagFilter", om.valueToTree(this.getEc2TagFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupEc2TagSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupEc2TagSet.Jsii$Proxy that = (CodedeployDeploymentGroupEc2TagSet.Jsii$Proxy) o;

            return this.ec2TagFilter != null ? this.ec2TagFilter.equals(that.ec2TagFilter) : that.ec2TagFilter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ec2TagFilter != null ? this.ec2TagFilter.hashCode() : 0;
            return result;
        }
    }
}
