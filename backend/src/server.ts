import "./models";
import Hapi from "@hapi/hapi";
import Jwt from "@hapi/jwt";
import dotenv from "dotenv";
import { tenantRoutes } from "./routes/tenantRoutes";
import { sequelize } from "./config/database";
import { authRoutes } from "./routes/authRoutes";
import { notesRoutes } from "./routes/notesRoutes";
import { verify } from "node:crypto";

dotenv.config();
const startServer = async(): Promise<void>=>{
    try{
        await sequelize.authenticate();
        console.log("PostgreSQL connection established successfully");
        await sequelize.sync();
        console.log("Database tables created successfully");
        const jwtSecret = process.env.JWT_SECRET;
        if(!jwtSecret || jwtSecret === "JWT_SECRET"){
            throw new Error("Configure a strong JWT_SECRET in your .env file");
        }
        const server = Hapi.server({
            port: Number(process.env.PORT || 5000),
            host: "localhost",
            routes:{
                cors:{
                    origin:["http://localhost:5173"],
                    headers:["Accept","Content-Type"],
                    additionalHeaders:["x-tenant-id","authorization"],
                    credentials: false,
                }
            }
        });
        await server.register(Jwt);
        
        server.auth.strategy("jwt","jwt",{
            keys: jwtSecret,
            verify:{
                aud: false,
                iss: false,
                sub: false,
                nbf: true,
                exp: true,
                maxAgeSec: 3600,
            },
            validate: async(artifacts)=>{
                return{
                    isValid: true,
                    credentials: artifacts.decoded.payload,
                };
            },
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