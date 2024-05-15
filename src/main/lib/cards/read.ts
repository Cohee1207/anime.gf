import { CardData, RawPlatformCardBundle, Result } from "@shared/types";
import { supportedImageExts } from "@shared/utils";
import fsp from "fs/promises";
import JSZip from "jszip";
import { join } from "path";
import { attainable } from "../utils";

const images = ["avatar", "banner"];

export async function readData(path: string): Promise<Result<CardData, Error>> {
  try {
    return JSON.parse(await fsp.readFile(path, "utf8"));
  } catch (e) {
    return { kind: "err", error: e };
  }
}

export async function readDir(path: string): Promise<Result<RawPlatformCardBundle, Error>> {
  try {
    const data = JSON.parse(await fsp.readFile(join(path, "data.json"), "utf8"));

    const imagePaths: string[] = [];

    for (let i = 0; i < images.length; i++) {
      for (const ext of supportedImageExts) {
        const imagePath = join(path, `${images[i]}.${ext}`);
        if (await attainable(imagePath)) {
          imagePaths.push(imagePath);
          break;
        }
      }
    }
    const [avatarPath, bannerPath] = imagePaths;
    const avatarBuffer = avatarPath ? await fsp.readFile(avatarPath) : undefined;
    const bannerBuffer = bannerPath ? await fsp.readFile(join(bannerPath)) : undefined;
    return { kind: "ok", value: { data, avatarBuffer, bannerBuffer } };
  } catch (e) {
    return { kind: "err", error: e };
  }
}

export async function readZIP(path: string): Promise<Result<RawPlatformCardBundle, Error>> {
  try {
    const zipData = await fsp.readFile(path);
    const jszip = await JSZip.loadAsync(zipData);

    const dataJSONFile = jszip.file("data.json");
    if (!dataJSONFile) {
      return { kind: "err", error: new Error("data.json not found in card's zip") };
    }
    const dataJSONContent = await dataJSONFile.async("string");
    const data = JSON.parse(dataJSONContent);

    const imagePaths: string[] = [];
    for (let i = 0; i < images.length; i++) {
      for (const ext of supportedImageExts) {
        const imagePath = `${images[i]}.${ext}`;
        if (jszip.file(imagePath)) {
          imagePaths.push(imagePath);
          break;
        }
      }
    }

    const [avatarPath, bannerPath] = imagePaths;
    const avatarBuffer = avatarPath ? await jszip.file(avatarPath)?.async("nodebuffer") : undefined;
    const bannerBuffer = bannerPath ? await jszip.file(bannerPath)?.async("nodebuffer") : undefined;
    return { kind: "ok", value: { data, avatarBuffer, bannerBuffer } };
  } catch (e) {
    return { kind: "err", error: e };
  }
}
