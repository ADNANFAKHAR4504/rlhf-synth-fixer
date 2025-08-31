package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterAccessConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterAccessConfig.Jsii$Proxy.class)
public interface EksClusterAccessConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#authentication_mode EksCluster#authentication_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapClusterCreatorAdminPermissions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterAccessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterAccessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterAccessConfig> {
        java.lang.String authenticationMode;
        java.lang.Object bootstrapClusterCreatorAdminPermissions;

        /**
         * Sets the value of {@link EksClusterAccessConfig#getAuthenticationMode}
         * @param authenticationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#authentication_mode EksCluster#authentication_mode}.
         * @return {@code this}
         */
        public Builder authenticationMode(java.lang.String authenticationMode) {
            this.authenticationMode = authenticationMode;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterAccessConfig#getBootstrapClusterCreatorAdminPermissions}
         * @param bootstrapClusterCreatorAdminPermissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.
         * @return {@code this}
         */
        public Builder bootstrapClusterCreatorAdminPermissions(java.lang.Boolean bootstrapClusterCreatorAdminPermissions) {
            this.bootstrapClusterCreatorAdminPermissions = bootstrapClusterCreatorAdminPermissions;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterAccessConfig#getBootstrapClusterCreatorAdminPermissions}
         * @param bootstrapClusterCreatorAdminPermissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.
         * @return {@code this}
         */
        public Builder bootstrapClusterCreatorAdminPermissions(com.hashicorp.cdktf.IResolvable bootstrapClusterCreatorAdminPermissions) {
            this.bootstrapClusterCreatorAdminPermissions = bootstrapClusterCreatorAdminPermissions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterAccessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterAccessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterAccessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterAccessConfig {
        private final java.lang.String authenticationMode;
        private final java.lang.Object bootstrapClusterCreatorAdminPermissions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationMode = software.amazon.jsii.Kernel.get(this, "authenticationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bootstrapClusterCreatorAdminPermissions = software.amazon.jsii.Kernel.get(this, "bootstrapClusterCreatorAdminPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationMode = builder.authenticationMode;
            this.bootstrapClusterCreatorAdminPermissions = builder.bootstrapClusterCreatorAdminPermissions;
        }

        @Override
        public final java.lang.String getAuthenticationMode() {
            return this.authenticationMode;
        }

        @Override
        public final java.lang.Object getBootstrapClusterCreatorAdminPermissions() {
            return this.bootstrapClusterCreatorAdminPermissions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthenticationMode() != null) {
                data.set("authenticationMode", om.valueToTree(this.getAuthenticationMode()));
            }
            if (this.getBootstrapClusterCreatorAdminPermissions() != null) {
                data.set("bootstrapClusterCreatorAdminPermissions", om.valueToTree(this.getBootstrapClusterCreatorAdminPermissions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterAccessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterAccessConfig.Jsii$Proxy that = (EksClusterAccessConfig.Jsii$Proxy) o;

            if (this.authenticationMode != null ? !this.authenticationMode.equals(that.authenticationMode) : that.authenticationMode != null) return false;
            return this.bootstrapClusterCreatorAdminPermissions != null ? this.bootstrapClusterCreatorAdminPermissions.equals(that.bootstrapClusterCreatorAdminPermissions) : that.bootstrapClusterCreatorAdminPermissions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationMode != null ? this.authenticationMode.hashCode() : 0;
            result = 31 * result + (this.bootstrapClusterCreatorAdminPermissions != null ? this.bootstrapClusterCreatorAdminPermissions.hashCode() : 0);
            return result;
        }
    }
}
