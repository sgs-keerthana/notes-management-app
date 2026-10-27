import "./models";
import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import { tenantRoutes } from "./routes/tenantRoutes";
import { sequelize } from "./config/database";
import { authRoutes } from "./routes/authRoutes";
import { notesRoutes } from "./routes/notesRoutes";

dotenv.config();
const startServer = async(): Promise<void>=>{
    try{
        await sequelize.authenticate();
        console.log("PostgreSQL connection established successfully");
        await sequelize.sync();
        console.log("Database tables created successfully");
        const server = Hapi.server({
            port: Number(process.env.PORT || 5000),
            host: "localhost",
            routes:{
                cors:{
                    origin:["http://localhost:5174"],
                    headers:["Accept","Content-Type"],
                    additionalHeaders:["x-tenant-id","authorization"],
                }
            }
        });
        server.route(tenantRoutes);
        server.route(authRoutes);
        server.route(notesRoutes);
        
        server.route({
            method: "GET",
            path: "/health",
            handler:()=>{
                return{
                    message:"Notes Management API is running",
                };
            },
        });
        await server.start();

         console.log(`Server running at ${server.info.uri}`);
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exitCode = 1;
  }
};

void startServer();