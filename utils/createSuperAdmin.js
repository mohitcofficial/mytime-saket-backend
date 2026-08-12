import { User } from "../models/User.js";

export const createSuperAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      role: "super_admin",
    });

    if (adminExists) {
      console.log("Super Admin Already Present");
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD,
      role: "super_admin",
    });

    console.log("Super Admin Created");
  } catch (error) {
    console.error("Super Admin Creation Error:", error);
    console.error(error.stack);
  }
};
