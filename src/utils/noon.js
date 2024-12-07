import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const authorizationHeader = process.env.NOON_AUTH_HEADER;
const NOON_BASE_URL = process.env.NOON_BASE_URL;

const noonClient = axios.create({
  baseURL: NOON_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: authorizationHeader,
  },
});

export default noonClient;
