import { Request } from "express";
import * as core from "express-serve-static-core";
import * as admin from "firebase-admin";
import { ParsedQs } from "qs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export interface AuthRequest<P extends core.Params = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, Locals extends Record<string, any> = Record<string, any>>
  extends Request<P> {
  authToken?: string;
  idToken?: admin.auth.DecodedIdToken;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AuthRequestHandler<P extends core.Params = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, Locals extends Record<string, any> = Record<string, any>> {
  (
    req: AuthRequest<P, ResBody, ReqBody, ReqQuery, Locals>,
    res: core.Response<ResBody, Locals>,
    next: core.NextFunction,
  ): void;
}

const getAuthToken: AuthRequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization?.split(" ") || [];

  if (authorization[0] === "Bearer") {
    req.authToken = authorization[1];
  }

  next();
};


export const checkIfAuthenticated: AuthRequestHandler = (req, res, next) => {
  getAuthToken(req, res, async () => {
    const { authToken } = req;

    if (authToken) {
      try {
        req.authToken = undefined;
        req.idToken = await admin.auth().verifyIdToken(authToken);

        return next();
      } catch (e) {
        //
      }
    }

    return res.status(401).send({ error: "You are not authorized to make this request." });
  });
};
