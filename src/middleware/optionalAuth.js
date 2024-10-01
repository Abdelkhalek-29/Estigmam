import jwt from "jsonwebtoken";
import userModel from "../../DB/model/User.model.js";
import tokenModel from "../../DB/model/Token.model.js";
import { asyncHandler } from "../utils/errorHandling.js";

const optionalAuth = asyncHandler(async (req, res, next) => {
    let token = req.headers["token"];
  
    if (token) {
        const decoded = jwt.verify(token, process.env.TOKEN_SIGNATURE);
        if (!decoded?.id) {
          return res.json({ message: "Invalid token payload" });
        }
        const tokenDB = await tokenModel.findOne({ token, isValid: true });
  
        if (!tokenDB || !tokenDB.isValid) {
          return next(new Error("Token expired!"));
        }
        const authUser = await userModel.findById(decoded.id);
  
        if (authUser) {
          req.user = authUser;
          return next();
        }
  
        return res.json({ message: "Not registered account" });
      } 
      return next();
    }
  
)
  export default optionalAuth;