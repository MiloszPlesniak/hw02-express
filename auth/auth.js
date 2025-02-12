const jwt = require("jsonwebtoken");
const { getUserById } = require("../controllers/users");

require("dotenv").config();

const JWT_TOKEN = process.env.JWT_TOKEN;

const auth = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log(req.body);
  if (!token) {
    return res.status(401).send("No token provided");
  }
  try {
    const decoded = jwt.verify(token, JWT_TOKEN);
    const { id } = decoded;
    const user = await getUserById(id);

    if (user.token === token) {
      if (user.verify) {
        req.body = user;
        next();
      } else {
        return res
          .status(401)
          .json({ message: "e-mail has not been verified" });
      }
    } else {
      return res.status(401).json({ message: "Not authorized" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Not authorized", error });
  }
};

module.exports = auth;
