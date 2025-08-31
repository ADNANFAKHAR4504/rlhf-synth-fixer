package imports.aws.eks_addon;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksAddon.EksAddonPodIdentityAssociation")
@software.amazon.jsii.Jsii.Proxy(EksAddonPodIdentityAssociation.Jsii$Proxy.class)
public interface EksAddonPodIdentityAssociation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#role_arn EksAddon#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#service_account EksAddon#service_account}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceAccount();

    /**
     * @return a {@link Builder} of {@link EksAddonPodIdentityAssociation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksAddonPodIdentityAssociation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksAddonPodIdentityAssociation> {
        java.lang.String roleArn;
        java.lang.String serviceAccount;

        /**
         * Sets the value of {@link EksAddonPodIdentityAssociation#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#role_arn EksAddon#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonPodIdentityAssociation#getServiceAccount}
         * @param serviceAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#service_account EksAddon#service_account}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceAccount(java.lang.String serviceAccount) {
            this.serviceAccount = serviceAccount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksAddonPodIdentityAssociation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksAddonPodIdentityAssociation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksAddonPodIdentityAssociation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksAddonPodIdentityAssociation {
        private final java.lang.String roleArn;
        private final java.lang.String serviceAccount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccount = software.amazon.jsii.Kernel.get(this, "serviceAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.serviceAccount = java.util.Objects.requireNonNull(builder.serviceAccount, "serviceAccount is required");
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getServiceAccount() {
            return this.serviceAccount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("serviceAccount", om.valueToTree(this.getServiceAccount()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksAddon.EksAddonPodIdentityAssociation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksAddonPodIdentityAssociation.Jsii$Proxy that = (EksAddonPodIdentityAssociation.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            return this.serviceAccount.equals(that.serviceAccount);
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.serviceAccount.hashCode());
            return result;
        }
    }
}
