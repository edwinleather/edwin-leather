// Legacy shim: the backoffice endpoints moved to server/routes/admin.ts.
// They are registered there on the shared backoffice router mounted once
// at /api/v1/admin, so identical endpoints can never 404 again.
export { backofficeRouter } from "./admin";
