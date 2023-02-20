import 'dotenv-safe/config'
import nodemailer from "nodemailer";
import { User } from '../entities/User';
import { Email } from './MainEmail';

export async function sendEmail(user:User,subject:string ,text: string,ctaText?:string,cta?:string) {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    //@ts-ignore
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const html = Email(user,text,ctaText,cta);

  // send mail with defined transport object
  await transporter.sendMail({
    from: '"Gamingpills" <no-reply@gamingpills.com>', // sender address
    to: user.email,
    subject,
    html
  }).catch((err) => console.log(err));
}