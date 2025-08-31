package imports.aws.s3_object_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.292Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ObjectCopy.S3ObjectCopyGrant")
@software.amazon.jsii.Jsii.Proxy(S3ObjectCopyGrant.Jsii$Proxy.class)
public interface S3ObjectCopyGrant extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#permissions S3ObjectCopy#permissions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPermissions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#type S3ObjectCopy#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#email S3ObjectCopy#email}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#uri S3ObjectCopy#uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ObjectCopyGrant}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ObjectCopyGrant}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ObjectCopyGrant> {
        java.util.List<java.lang.String> permissions;
        java.lang.String type;
        java.lang.String email;
        java.lang.String id;
        java.lang.String uri;

        /**
         * Sets the value of {@link S3ObjectCopyGrant#getPermissions}
         * @param permissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#permissions S3ObjectCopy#permissions}. This parameter is required.
         * @return {@code this}
         */
        public Builder permissions(java.util.List<java.lang.String> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyGrant#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#type S3ObjectCopy#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyGrant#getEmail}
         * @param email Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#email S3ObjectCopy#email}.
         * @return {@code this}
         */
        public Builder email(java.lang.String email) {
            this.email = email;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyGrant#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyGrant#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#uri S3ObjectCopy#uri}.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ObjectCopyGrant}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ObjectCopyGrant build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ObjectCopyGrant}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ObjectCopyGrant {
        private final java.util.List<java.lang.String> permissions;
        private final java.lang.String type;
        private final java.lang.String email;
        private final java.lang.String id;
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.email = software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.permissions = java.util.Objects.requireNonNull(builder.permissions, "permissions is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.email = builder.email;
            this.id = builder.id;
            this.uri = builder.uri;
        }

        @Override
        public final java.util.List<java.lang.String> getPermissions() {
            return this.permissions;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getEmail() {
            return this.email;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("permissions", om.valueToTree(this.getPermissions()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getEmail() != null) {
                data.set("email", om.valueToTree(this.getEmail()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getUri() != null) {
                data.set("uri", om.valueToTree(this.getUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ObjectCopy.S3ObjectCopyGrant"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ObjectCopyGrant.Jsii$Proxy that = (S3ObjectCopyGrant.Jsii$Proxy) o;

            if (!permissions.equals(that.permissions)) return false;
            if (!type.equals(that.type)) return false;
            if (this.email != null ? !this.email.equals(that.email) : that.email != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            return this.uri != null ? this.uri.equals(that.uri) : that.uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.permissions.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.email != null ? this.email.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.uri != null ? this.uri.hashCode() : 0);
            return result;
        }
    }
}
