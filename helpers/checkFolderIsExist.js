const fs = require("fs/promises");

const checkFolderIsExist = (path) => {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
};

const createFolderIfNotExist = async (path) => {
  if (!(await checkFolderIsExist(path))) {
    console.log(path);
    // await fs.mkdir(path);
  }
};
module.exports = createFolderIfNotExist;
