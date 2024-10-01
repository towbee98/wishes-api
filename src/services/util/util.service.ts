import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { TwilioService } from 'nestjs-twilio';
import { TWILIO_PHONE_NUMBER, TWILIO_SERVICE_ID } from 'src/config';
import { Users, UsersDocument } from 'src/database/models/Users.model';
import {
  Config,
  adjectives,
  nouns,
  uniqueUsernameGenerator,
  generateUsername,
} from 'unique-username-generator';
import { createCanvas, loadImage } from 'canvas';

@Injectable()
export class UtilService {
  constructor(
    private readonly tiwilioService: TwilioService,
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
  ) {
    //yar
  }

  async generateUsername() {
    const config: Config = {
      dictionaries: [adjectives, nouns],
    };
    const username = generateUsername('', 0, 8);
    const user = await this.userModel.count({ username: username });
    if (user > 0) {
      this.generateUsername();
      return;
    }
    console.log(username);
    return username;
  }

  async generateRandomString(): Promise<string> {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  async generateRandomCode(): Promise<string> {
    const characters = '0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  async sendSms(to: string) {
    const requestVerificationCode = await this.tiwilioService.client.verify.v2
      .services(TWILIO_SERVICE_ID)
      .verifications.create({
        to: '+1' + to,
        channel: 'sms',
      });

    return requestVerificationCode;
  }

  async verifySMS(code: string, to: string) {
    try {
      const verifyCode = await this.tiwilioService.client.verify.v2
        .services(TWILIO_SERVICE_ID)
        .verificationChecks.create({ code: code, to: '+1' + to });
      return verifyCode;
    } catch (e) {
      throw new BadRequestException('Unable to verify code provided');
    }
  }

  async convertToMongooseId(id: string) {
    return new mongoose.Types.ObjectId(id);
  }

  async computeAverageImageColor(
    imagePath: string,
  ): Promise<[number, number, number]> {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixelCount = imageData.length / 4; // Each pixel has 4 values (RGBA)

    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      rTotal += r;
      gTotal += g;
      bTotal += b;
    }

    const avgR = rTotal / pixelCount;
    const avgG = gTotal / pixelCount;
    const avgB = bTotal / pixelCount;

    return [avgR, avgG, avgB];
  }

  async getAverageColors(imagePath: string) {
    const averageColor = await this.computeAverageImageColor(imagePath);
    // Round the values to the nearest integers
    const roundedValues = averageColor.map(Math.round);

    // Ensure the values are within the 0-255 range
    const clampedValues = roundedValues.map((value) =>
      Math.min(255, Math.max(0, value)),
    );

    return clampedValues;
  }

  async calculateOnePercentFee(amount: any) {
    // 4.9% of the amount + 30cent (0.3)
    // eslint-disable-next-line prettier/prettier
    const fee = 0.049 * amount + 0.3;
    return fee.toFixed(2);
  }

  async shuffleArray(array:any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array
  }
}
