/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "claimguard",
      home: "aws",
      providers: {
        turso: {
          version: "0.2.3",
          organization: "rgodha",
        },
        cloudflare: "5.49.1",
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
      group: turso.getGroup({ id: "group" }).then((group) => group.id),
    });
    const anthropic = new sst.Secret("Anthropic");
    const bucket = new sst.aws.Bucket("Bucket", {
      access: "public",
    });
    const model = new sst.aws.Function("Model", {
      runtime: "rust" as any,
      handler: "model",
      link: [bucket],
      layers: ["arn:aws:lambda:us-east-1:634758516618:layer:onnx2:1"],
      url: true,
      architecture: "arm64",
    });
    const queue = new sst.aws.Queue("Q");
    queue.subscribe(
      {
        handler: "backend/src/queue.handler",
        link: [db, bucket, model],
        logging: false,
        nodejs: { install: ["@libsql/client", "ffmpeg-static"] },
      },
      {
        batch: { size: 1 },
      },
    );
    bucket.notify({
      notifications: [
        {
          function: {
            handler: "backend/src/subscriber.handler",
            link: [bucket, db, queue, model, anthropic],
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
      nodejs: { install: ["@libsql/client", "ffmpeg-static"] },
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
      domain: {
        name: "claimguard.rohangodha.com",
        dns: sst.cloudflare.dns(),
      },
    });

    return {
      bucketname: bucket.name,
      dbname: db.name,
    };
  },
});
