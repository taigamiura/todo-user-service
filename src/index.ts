import { createApp } from "./app";
import { getSql } from "./db";
import { createUserRepository } from "./user-repository";
import { createUserService } from "./users/user-service";

const app = createApp(createUserService(createUserRepository(getSql())));

export default app;
