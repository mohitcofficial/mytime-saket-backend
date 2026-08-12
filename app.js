import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middleware/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

config({
  path: "./config/config.env",
});

const app = express();
const limiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  message: "Too many request, please try again later",
});

app.use(limiter);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(cookieParser());

app.use(
  cors({
    origin: [
      // "http://localhost:3000",
      // "http://localhost:3001",
      "https://admin.mytimeco.work",
      "https://www.admin.mytimeco.work",
      "https://operation.mytimeco.work",
      "https://www.operation.mytimeco.work",
      "https://accounts.mytimeco.work",
      "https://www.accounts.mytimeco.work",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

import admin from "./routes/adminRoutes.js";
import user from "./routes/userRoutes.js";
import booking from "./routes/bookingRoutes.js";
import aggregator from "./routes/aggregatorRoutes.js";
import dashboard from "./routes/dashboardRoutes.js";
import activities from "./routes/activitiesRoutes.js";

app.use("/api/v1", admin);
app.use("/api/v1", user);
app.use("/api/v1", booking);
app.use("/api/v1", aggregator);
app.use("/api/v1", dashboard);
app.use("/api/v1", activities);

app.use(ErrorMiddleware);
export default app;
