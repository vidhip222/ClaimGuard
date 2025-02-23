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
    sst.Linkable.wrap(turso.Database, (db) => ({
      properties: {
        token: db.id.apply(
          async (id) => (await turso.getDatabaseToken({ id })).jwt,
        ),
        url: $interpolate`libsql://${db.id}-rgodha.aws-us-east-1.turso.io`,
      },
    }));

    const db = new turso.Database("db", {
      group: turso.getGroupOutput({ id: "group" }).id,
    });

    const bucket = new sst.aws.Bucket("Bucket", {
      access: "public",
    });

    const queue = new sst.aws.Queue("Queue");
    queue.subscribe({
      handler: "backend/src/queue.handler",
      link: [db, bucket],
    });

    bucket.notify({
      notifications: [
        {
          function: {
            handler: "backend/src/subscriber.handler",
            link: [bucket, db, queue],
            nodejs: { install: ["@libsql/client", "ffmpeg-static"] },
          },
          name: "subscriber",
          events: ["s3:ObjectCreated:*"],
        },
      ],
    });

    const backend = new sst.aws.Function("Backend", {
      handler: "backend/src/index.handler",
      url: true,
      link: [db, bucket],
      nodejs: { install: ["@libsql/client"] },
    });

    const frontend = new sst.aws.StaticSite("Frontend", {
      path: "frontend",
      build: {
        command: "bun run build",
        output: "dist",
      },
      environment: {
        VITE_PUBLIC_API_URL: backend.url,
        VITE_PUBLIC_BUCKET_URL: $interpolate`https://${bucket.name}.s3.amazonaws.com`,
      },
    });

    return {
      bucketname: bucket.name,
      dbname: db.name,
    };
  },
});
