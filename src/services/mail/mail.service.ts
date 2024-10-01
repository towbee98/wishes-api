import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import Mailgun, {
  Enums,
  Interfaces,
  MailgunClientOptions,
  MessagesSendResult,
} from 'mailgun.js';
import * as ejs from 'ejs';
import { EMAIL_SENDER, MAILGUN_API_KEY, MAILGUN_DOMAIN } from 'src/config';

@Injectable()
export class MailService {
  mailgun = new Mailgun(FormData);
  mailgunClient: Interfaces.IMailgunClient = this.mailgun.client({
    username: 'api',
    key: MAILGUN_API_KEY,
  });
  // yes = Enums.YesNo.YES;

  constructor(private readonly mailerService: MailerService) {
    //
  }

  async renderHtml(path, data) {
    const renderedHtml = await ejs.renderFile(path, data, {});

    return renderedHtml;
  }

  async pathsList(key: string) {
    const list = {
      USER_NOTIFICATION: {
        subject: 'User Notification',
        path: __dirname + '/templates/user.notification.ejs',
      },
      ADMIN_NOTIFICATION: {
        subject: 'Admin Notification',
        path: __dirname + '/templates/admin.notification.ejs',
      },
      STORE_NOTIFICATION: {
        subject: 'WishPo!!! NEW ORDER NOTIFICATION',
        path: __dirname + '/templates/store.notification.ejs',
      },
      GIFTED_NOTIFICATION: {
        subject: 'Your Gift on Wishpo: Payment Success! 🎁',
        path: __dirname + '/templates/gifted.notification.ejs',
      },
    };

    return list[key];
  }

  async sendMail(data) {
    const emailPath = await this.pathsList(data.key);
    const renderedHtml = await this.renderHtml(emailPath.path, data.payloads);
    console.log(data.email);
    try {
      await this.mailgunClient.messages.create(MAILGUN_DOMAIN, {
        from: `Wishpo Support ${EMAIL_SENDER}`,
        to: [data.email],
        html: renderedHtml as any,
        subject: emailPath.subject,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
