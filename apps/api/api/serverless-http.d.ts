declare module "serverless-http" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  interface ServerlessHttpOptions {
    request?: {
      timeout?: number;
    };
  }

  function serverlessHttp(
    app: any,
    options?: ServerlessHttpOptions
  ): (req: IncomingMessage, res: ServerResponse) => Promise<void>;

  export default serverlessHttp;
}
