export const AppConfig = {
    port: Number(process.env.port ?? 3000),
    adminPassword: process.env.admin_password ?? "123"
};