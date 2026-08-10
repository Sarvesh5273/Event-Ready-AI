import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import fixtureRouter from "./fixture";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);

// Only mount the fixture endpoint outside of production so it never
// surfaces in deployed builds.
if (process.env["NODE_ENV"] !== "production") {
  router.use(fixtureRouter);
}

export default router;
