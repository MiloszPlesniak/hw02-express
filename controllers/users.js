const fs = require("fs/promises");
const jimp = require("jimp");
const path = require("path");
const { User, registerValidate, hashPassword } = require("../models/users.js");
const loginHandler = require("../auth/loginHandler");

const temporaryStore = path.join(process.cwd(), "/tmp");
const finalyStore = path.join(process.cwd(), "/public/avatars");
const supportedFormats = [".jpg", ".png", ".bmp", ".tiff", ".gif"];

const getUserByEmail = async (email) => {
  const user = User.findOne({ email });
  return user;
};
const getUserById = async (id) => {
  const user = User.findById(id);
  return user;
};

const registerUser = async (userData) => {
  const { error } = registerValidate.validate(userData);
  if (error) {
    return {
      code: 400,
      message: error.details[0].message,
    };
  }
  const { email, password } = userData;

  if (await getUserByEmail(email)) {
    return { code: 409, message: "Email in use" };
  }
  try {
    const user = new User({ email, password: hashPassword(password) });

    user.save();
    return { code: 201, message: user };
  } catch (error) {
    console.log(error);
  }
};

const loginUser = async (userData) => {
  const { error } = registerValidate.validate(userData);
  if (error) {
    return {
      code: 400,
      message: error.details[0].message,
    };
  }

  const { email, password } = userData;

  const user = await getUserByEmail(email);

  const token = await loginHandler(password, user);
  if (!user || !token) {
    return { code: 401, message: "Email or password is wrong" };
  } else {
    await User.findByIdAndUpdate(user._id, {
      token: token.token,
    });
    return {
      code: 200,
      message: {
        token: token.token,
        user: {
          email: user.email,
          subscription: user.subscription,
        },
      },
    };
  }
};

const logoutUser = async (id) => {
  await User.findByIdAndUpdate(id, { token: null });
  return {
    code: 204,
    message: "No Content",
  };
};

const currentUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    return { code: 401, message: "Not authorized" };
  } else {
    return {
      code: 200,
      message: {
        email: user.email,
        subscription: user.subscription,
      },
    };
  }
};
const editUser = async (id, changedField) => {
  const editedUser = await User.findByIdAndUpdate(id, changedField);
  console.log(editedUser);
};

const setAvatar = async (file, body) => {
  const { path: temporaryName, originalname } = file;
  const { email, _id } = body;
  const fileName = path.join(temporaryStore, originalname);

  const extname = path.extname(originalname);
  if (!supportedFormats.includes(extname)) {
    throw new Error({
      message: " Wrong file format",
      code: 400,
    });
  }
  const finalyPath = finalyStore + "/" + email + "Avatar" + extname;
  try {
    const image = await jimp.read(fileName);
    image.resize(250, 250);
    await image.writeAsync(fileName);
    await fs.rename(fileName, finalyPath);
    const avatarUrl = `/public/avatars/${path.basename(finalyPath)}`;
    editUser(_id, { avatarUrl });
    return {
      code: 200,
      message: avatarUrl,
    };
  } catch (error) {
    console.log(error);
    await fs.unlink(temporaryName);
  }
};

module.exports = {
  registerUser,
  getUserByEmail,
  getUserById,
  loginUser,
  logoutUser,
  currentUser,
  setAvatar,
};
