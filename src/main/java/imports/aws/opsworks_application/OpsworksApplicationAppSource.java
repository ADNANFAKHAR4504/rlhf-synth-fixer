package imports.aws.opsworks_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.000Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksApplication.OpsworksApplicationAppSource")
@software.amazon.jsii.Jsii.Proxy(OpsworksApplicationAppSource.Jsii$Proxy.class)
public interface OpsworksApplicationAppSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#password OpsworksApplication#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#revision OpsworksApplication#revision}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRevision() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssh_key OpsworksApplication#ssh_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSshKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#url OpsworksApplication#url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#username OpsworksApplication#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksApplicationAppSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksApplicationAppSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksApplicationAppSource> {
        java.lang.String type;
        java.lang.String password;
        java.lang.String revision;
        java.lang.String sshKey;
        java.lang.String url;
        java.lang.String username;

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#password OpsworksApplication#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getRevision}
         * @param revision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#revision OpsworksApplication#revision}.
         * @return {@code this}
         */
        public Builder revision(java.lang.String revision) {
            this.revision = revision;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getSshKey}
         * @param sshKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssh_key OpsworksApplication#ssh_key}.
         * @return {@code this}
         */
        public Builder sshKey(java.lang.String sshKey) {
            this.sshKey = sshKey;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#url OpsworksApplication#url}.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationAppSource#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#username OpsworksApplication#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksApplicationAppSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksApplicationAppSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksApplicationAppSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksApplicationAppSource {
        private final java.lang.String type;
        private final java.lang.String password;
        private final java.lang.String revision;
        private final java.lang.String sshKey;
        private final java.lang.String url;
        private final java.lang.String username;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.revision = software.amazon.jsii.Kernel.get(this, "revision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sshKey = software.amazon.jsii.Kernel.get(this, "sshKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.password = builder.password;
            this.revision = builder.revision;
            this.sshKey = builder.sshKey;
            this.url = builder.url;
            this.username = builder.username;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getRevision() {
            return this.revision;
        }

        @Override
        public final java.lang.String getSshKey() {
            return this.sshKey;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
            }
            if (this.getRevision() != null) {
                data.set("revision", om.valueToTree(this.getRevision()));
            }
            if (this.getSshKey() != null) {
                data.set("sshKey", om.valueToTree(this.getSshKey()));
            }
            if (this.getUrl() != null) {
                data.set("url", om.valueToTree(this.getUrl()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksApplication.OpsworksApplicationAppSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksApplicationAppSource.Jsii$Proxy that = (OpsworksApplicationAppSource.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
            if (this.revision != null ? !this.revision.equals(that.revision) : that.revision != null) return false;
            if (this.sshKey != null ? !this.sshKey.equals(that.sshKey) : that.sshKey != null) return false;
            if (this.url != null ? !this.url.equals(that.url) : that.url != null) return false;
            return this.username != null ? this.username.equals(that.username) : that.username == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
            result = 31 * result + (this.revision != null ? this.revision.hashCode() : 0);
            result = 31 * result + (this.sshKey != null ? this.sshKey.hashCode() : 0);
            result = 31 * result + (this.url != null ? this.url.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
            return result;
        }
    }
}
