declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_NAME: string;
      DATABASE_USER: string;
      DATABASE_PASSWORD: string;
      COOKIE_SECRET: string;
      PORT: string;
      MAIL_USERNAME: string;
      MAIL_PASSWORD: string;
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_SECURE: string;
    }
  }
}

export {}
