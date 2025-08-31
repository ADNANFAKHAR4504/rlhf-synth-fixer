package imports.aws.quicksight_iam_policy_assignment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightIamPolicyAssignment.QuicksightIamPolicyAssignmentIdentities")
@software.amazon.jsii.Jsii.Proxy(QuicksightIamPolicyAssignmentIdentities.Jsii$Proxy.class)
public interface QuicksightIamPolicyAssignmentIdentities extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#group QuicksightIamPolicyAssignment#group}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#user QuicksightIamPolicyAssignment#user}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUser() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightIamPolicyAssignmentIdentities}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightIamPolicyAssignmentIdentities}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightIamPolicyAssignmentIdentities> {
        java.util.List<java.lang.String> group;
        java.util.List<java.lang.String> user;

        /**
         * Sets the value of {@link QuicksightIamPolicyAssignmentIdentities#getGroup}
         * @param group Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#group QuicksightIamPolicyAssignment#group}.
         * @return {@code this}
         */
        public Builder group(java.util.List<java.lang.String> group) {
            this.group = group;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightIamPolicyAssignmentIdentities#getUser}
         * @param user Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_iam_policy_assignment#user QuicksightIamPolicyAssignment#user}.
         * @return {@code this}
         */
        public Builder user(java.util.List<java.lang.String> user) {
            this.user = user;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightIamPolicyAssignmentIdentities}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightIamPolicyAssignmentIdentities build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightIamPolicyAssignmentIdentities}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightIamPolicyAssignmentIdentities {
        private final java.util.List<java.lang.String> group;
        private final java.util.List<java.lang.String> user;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.group = software.amazon.jsii.Kernel.get(this, "group", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.user = software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.group = builder.group;
            this.user = builder.user;
        }

        @Override
        public final java.util.List<java.lang.String> getGroup() {
            return this.group;
        }

        @Override
        public final java.util.List<java.lang.String> getUser() {
            return this.user;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGroup() != null) {
                data.set("group", om.valueToTree(this.getGroup()));
            }
            if (this.getUser() != null) {
                data.set("user", om.valueToTree(this.getUser()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightIamPolicyAssignment.QuicksightIamPolicyAssignmentIdentities"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightIamPolicyAssignmentIdentities.Jsii$Proxy that = (QuicksightIamPolicyAssignmentIdentities.Jsii$Proxy) o;

            if (this.group != null ? !this.group.equals(that.group) : that.group != null) return false;
            return this.user != null ? this.user.equals(that.user) : that.user == null;
        }

        @Override
        public final int hashCode() {
            int result = this.group != null ? this.group.hashCode() : 0;
            result = 31 * result + (this.user != null ? this.user.hashCode() : 0);
            return result;
        }
    }
}
