import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (file) => {
  const parser = new DataUriParser();
  // console.log("present1");
  // console.log("original name: ", file.originalname);
  const extName = path.extname(file.originalname).toString();
  // console.log("present2");
  // console.log(file);
  // console.log(extName);
  // console.log(file.buffer);
  return parser.format(extName, file.buffer);
};

export default getDataUri;
