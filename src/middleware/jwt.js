
import jwt from "jsonwebtoken";
const JWT_SECRET = "chatgpt"
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
}