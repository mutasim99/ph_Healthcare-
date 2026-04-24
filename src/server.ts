import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(envVars.PORT, () => {
      console.log(`Your app is running on port:${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

bootstrap();
