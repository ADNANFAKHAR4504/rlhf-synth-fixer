package imports.aws.transfer_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.566Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferUser.TransferUserPosixProfile")
@software.amazon.jsii.Jsii.Proxy(TransferUserPosixProfile.Jsii$Proxy.class)
public interface TransferUserPosixProfile extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#gid TransferUser#gid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getGid();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#uid TransferUser#uid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getUid();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#secondary_gids TransferUser#secondary_gids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getSecondaryGids() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferUserPosixProfile}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferUserPosixProfile}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferUserPosixProfile> {
        java.lang.Number gid;
        java.lang.Number uid;
        java.util.List<java.lang.Number> secondaryGids;

        /**
         * Sets the value of {@link TransferUserPosixProfile#getGid}
         * @param gid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#gid TransferUser#gid}. This parameter is required.
         * @return {@code this}
         */
        public Builder gid(java.lang.Number gid) {
            this.gid = gid;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserPosixProfile#getUid}
         * @param uid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#uid TransferUser#uid}. This parameter is required.
         * @return {@code this}
         */
        public Builder uid(java.lang.Number uid) {
            this.uid = uid;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserPosixProfile#getSecondaryGids}
         * @param secondaryGids Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#secondary_gids TransferUser#secondary_gids}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder secondaryGids(java.util.List<? extends java.lang.Number> secondaryGids) {
            this.secondaryGids = (java.util.List<java.lang.Number>)secondaryGids;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferUserPosixProfile}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferUserPosixProfile build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferUserPosixProfile}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferUserPosixProfile {
        private final java.lang.Number gid;
        private final java.lang.Number uid;
        private final java.util.List<java.lang.Number> secondaryGids;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gid = software.amazon.jsii.Kernel.get(this, "gid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uid = software.amazon.jsii.Kernel.get(this, "uid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.secondaryGids = software.amazon.jsii.Kernel.get(this, "secondaryGids", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gid = java.util.Objects.requireNonNull(builder.gid, "gid is required");
            this.uid = java.util.Objects.requireNonNull(builder.uid, "uid is required");
            this.secondaryGids = (java.util.List<java.lang.Number>)builder.secondaryGids;
        }

        @Override
        public final java.lang.Number getGid() {
            return this.gid;
        }

        @Override
        public final java.lang.Number getUid() {
            return this.uid;
        }

        @Override
        public final java.util.List<java.lang.Number> getSecondaryGids() {
            return this.secondaryGids;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("gid", om.valueToTree(this.getGid()));
            data.set("uid", om.valueToTree(this.getUid()));
            if (this.getSecondaryGids() != null) {
                data.set("secondaryGids", om.valueToTree(this.getSecondaryGids()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferUser.TransferUserPosixProfile"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferUserPosixProfile.Jsii$Proxy that = (TransferUserPosixProfile.Jsii$Proxy) o;

            if (!gid.equals(that.gid)) return false;
            if (!uid.equals(that.uid)) return false;
            return this.secondaryGids != null ? this.secondaryGids.equals(that.secondaryGids) : that.secondaryGids == null;
        }

        @Override
        public final int hashCode() {
            int result = this.gid.hashCode();
            result = 31 * result + (this.uid.hashCode());
            result = 31 * result + (this.secondaryGids != null ? this.secondaryGids.hashCode() : 0);
            return result;
        }
    }
}
