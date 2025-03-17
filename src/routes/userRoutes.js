import express from "express";
import { createUser, forgetOtp, getUsers, loginUser, newPassword, registerOtp, updatePassword, verifyRegister } from "../controller/UserController.js";
import upload from "../middleware/upload.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
// limiter of loggin 15 minutes if he failed to login by 6 try
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 6,
    message: { message: "Too many login attempts. Try again later." },
});
router.get("/users", getUsers);
router.post("/createUser", createUser);
router.post("/login", limiter, loginUser)
router.post("/registerOtp", upload.array('files', 6), registerOtp)
router.post("/verifyRegister", verifyRegister)
router.put("/updatePassword", updatePassword);
router.post("/forgetOtp", forgetOtp);
router.put("/newPassword", newPassword);
export default router;