import express from "express";
import { createUser, forgetOtp, getUsers, loginUser, newPassword, registerOtp, updatePassword, verifyRegister } from "../controller/UserController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/users", getUsers);
router.post("/createUser", createUser);
router.post("/login", loginUser)
router.post("/registerOtp", upload.array('files', 6), registerOtp)
router.post("/verifyRegister", verifyRegister)
router.put("/updatePassword", updatePassword);
router.post("/forgetOtp", forgetOtp);
router.put("/newPassword", newPassword);
export default router;