import { asyncHandler } from "../utils/errorHandling.js";

export const isAuthorized = (role) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user) {
      if (role !== req.user.role) {
        return next(new Error("You are not authorized", { cause: 403 }));
      }
    }
    if (req.owner) {
      if (role !== req.owner.role) {
        return next(new Error("You are not authorized", { cause: 403 }));
      }
    }
    return next();
  });
};
