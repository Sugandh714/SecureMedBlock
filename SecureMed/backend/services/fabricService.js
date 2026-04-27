// backend/services/fabricService.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Doc_function.js uses CommonJS exports
const docFunction = require("../../../fabric/Doc_function.js");

export const uploadRecord       = docFunction.uploadRecord;
export const queryByDepartment  = docFunction.queryByDepartment;
export const getRecord          = docFunction.getRecord;
export const recordExists       = docFunction.recordExists;