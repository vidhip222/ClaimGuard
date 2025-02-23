/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "claimguard",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        turso: {
          version: "0.2.3",
          organization: "rgodha",
        },
      },
    };
  },
  async run() {
    const anthropic = new sst.Secret("Anthropic");
    sst.Linkable.wrap(turso.Database, (db) => ({
      properties: {
        token: db.id.apply(
          async (id) => (await turso.getDatabaseToken({ id })).jwt,
        ),
        url: $interpolate`libsql://${db.id}-rgodha.aws-us-east-1.turso.io`,
      },
    }));
    const db = new turso.Database("db", {
      group: turso.getGroup({ id: "group" }).then((group) => group.id),
    });

    const bucket = new sst.aws.Bucket("Bucket", {
      access: "public",
    });
    new sst.Linkable("BucketUrl", {
      properties: {
        url: $interpolate`https://${bucket.name}.s3.amazonaws.com`,
      },
    });

    const backend = new sst.aws.Function("Backend", {
      handler: "backend/src/index.handler",
      url: true,
      link: [db, bucket, anthropic],
    });

    const frontend = new sst.aws.StaticSite("Frontend", {
      path: "frontend",
      build: {
        command: "bun run build",
        output: "dist",
      },
      environment: {
        VITE_PUBLIC_API_URL: backend.url,
      },
    });

    return {
      bucketname: bucket.name,
    };
  },
});
